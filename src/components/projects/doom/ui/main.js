import { Experiment, FEEDBACK_MODES, TICK_MS } from '../experiment.js';
import { STATES, STATE_SHORT, ACTIONS, N_STATES, N_ACTIONS } from '../culture.js';
import { DoomView } from './doomview.js';
import { DishView, RasterView, COLORS } from './cultureview.js';
import { Chart } from './charts.js';

import { isEasyLevel } from '../lifecycle.js';

export function startMain() {
const $ = (id) => document.getElementById(id);

let alive = true;
let rafId = 0;
let seed = 1;
const exp = new Experiment({ seriesEvery: 200, probeEvery: 100, probeTrials: 24 }, seed);
const doom = new DoomView($('doom'));
const dish = new DishView($('dish'), exp.culture);
const raster = new RasterView($('raster'), exp.culture);
const perfChart = new Chart($('chart-perf'), { w: 300, h: 180 });
const entChart = new Chart($('chart-entropy'), { w: 300, h: 180, yMax: 1.7 });
const surChart = new Chart($('chart-surprise'), { w: 300, h: 180, yMax: 1.05, xLabel: 'minutes of play' });

const ui = { running: false, speed: 1, acc: 0, last: performance.now(), brush: 'pattern' };

// ---------- controls ----------
function segmented(containerId, options, current, onPick) {
  const el = $(containerId);
  el.innerHTML = '';
  for (const [value, label] of options) {
    const b = document.createElement('button');
    b.textContent = label;
    b.dataset.value = value;
    b.className = 'px-3 py-1 rounded text-sm transition-colors';
    b.onclick = () => {
      onPick(value);
      paint();
    };
    el.appendChild(b);
  }
  const paint = () => {
    for (const b of el.children) {
      const on = b.dataset.value === String(current());
      b.className = `px-3 py-1 rounded text-sm transition-colors ${on ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`;
    }
  };
  paint();
  return paint;
}

segmented(
  'mode-buttons',
  Object.entries(FEEDBACK_MODES).map(([k, m]) => [k, m.label]),
  () => exp.opts.mode,
  (v) => exp.setMode(v)
);
segmented(
  'speed-buttons',
  [
    ['1', '1×'],
    ['4', '4×'],
    ['16', '16×'],
    ['max', 'Max'],
  ],
  () => ui.speed,
  (v) => (ui.speed = v === 'max' ? 'max' : Number(v))
);
const paintBrush = segmented(
  'brush-buttons',
  [
    ['pattern', 'Pattern brush'],
    ['noise', 'Noise brush'],
  ],
  () => ui.brush,
  (v) => (ui.brush = v)
);

$('run').onclick = () => {
  ui.running = !ui.running;
  $('run').textContent = ui.running ? 'Pause' : 'Run';
  $('run').className = `px-4 py-1.5 rounded text-white ${ui.running ? 'bg-amber-500 hover:bg-amber-600' : 'bg-green-500 hover:bg-green-600'}`;
};
$('reset').onclick = () => {
  seed += 1;
  exp.reset(seed);
  applySliders();
  dish.bind(exp.culture);
  raster.c = exp.culture;
};

function applySliders() {
  const dens = Number($('noise-density').value);
  exp.opts.noiseDensity = dens;
  const H = dens <= 0 || dens >= 1 ? 0 : -(dens * Math.log2(dens) + (1 - dens) * Math.log2(1 - dens));
  $('noise-density-val').textContent = `density ${Math.round(dens * 100)}% → ${H.toFixed(2)} bits/bin`;
  exp.culture.p.temp = Number($('temp').value);
  $('temp-val').textContent = exp.culture.p.temp.toFixed(2);
  exp.opts.missNoise = $('miss-noise').checked;
  const nE = Number($('enemies').value);
  $('enemies-val').textContent = nE;
  if (exp.game.p.nEnemies !== nE) {
    exp.game.p.nEnemies = nE;
    exp.game.reset(seed + 101);
  }
}
for (const id of ['noise-density', 'temp', 'miss-noise', 'enemies']) $(id).addEventListener('input', applySliders);
applySliders();

// ---------- policy table (click to sculpt) ----------
const table = $('policy');
table.innerHTML =
  '<thead><tr><th class="text-left font-medium text-gray-500 pr-2 pb-1">Enemy is…</th>' +
  ACTIONS.map((a) => `<th class="font-medium text-gray-500 pb-1 w-16">${a}</th>`).join('') +
  '<th class="font-medium text-gray-500 pb-1 text-left pl-3"><span class="lv-easy">How undecided</span><span class="lv-hard">H(action | state)</span></th></tr></thead><tbody>' +
  STATES.map(
    (s, i) =>
      `<tr><td class="pr-2 py-0.5 whitespace-nowrap text-gray-700"><span class="text-gray-400 mr-1">${STATE_SHORT[i]}</span>${s}</td>` +
      ACTIONS.map((_, a) => `<td><button data-s="${i}" data-a="${a}" class="cell w-16 h-7 rounded text-xs font-medium tabular-nums"></button></td>`).join('') +
      `<td class="pl-3"><div class="relative h-3 w-40 bg-gray-100 rounded"><div id="hbar-${i}" class="absolute left-0 top-0 h-3 rounded bg-blue-500"></div><div class="absolute top-[-2px] h-4 border-l border-dashed border-gray-400" style="left:100%"></div></div></td></tr>`
  ).join('') +
  '</tbody>';
table.addEventListener('click', (ev) => {
  const b = ev.target.closest('button.cell');
  if (!b) return;
  exp.culture.sculpt(Number(b.dataset.s), Number(b.dataset.a), ui.brush === 'pattern' ? 0 : 1);
  exp.policy = exp.culture.probePolicy(exp.opts.probeTrials);
  b.animate([{ boxShadow: `0 0 0 3px ${ui.brush === 'pattern' ? COLORS.pattern : COLORS.noise}` }, { boxShadow: '0 0 0 0 transparent' }], { duration: 500 });
});

function paintPolicy(activeState, action) {
  const { P, H } = exp.policy;
  for (const b of table.querySelectorAll('button.cell')) {
    const s = Number(b.dataset.s);
    const a = Number(b.dataset.a);
    const p = P[s * N_ACTIONS + a];
    b.textContent = p.toFixed(2);
    b.style.background = `rgba(59,130,246,${0.06 + 0.9 * p})`;
    b.style.color = p > 0.55 ? 'white' : '#111827';
    b.style.outline = s === activeState && a === action ? `2px solid ${COLORS.motor}` : 'none';
  }
  const Hmax = Math.log2(3);
  for (let s = 0; s < N_STATES; s++) $(`hbar-${s}`).style.width = `${Math.max(0, (H[s] / Hmax) * 100)}%`;
}

// ---------- loop ----------
function stepOnce(absorb) {
  exp.step();
  if (absorb) dish.absorb();
}

function frame(now) {
  const dt = Math.min(100, now - ui.last);
  ui.last = now;
  if (ui.running) {
    if (ui.speed === 'max') {
      const t0 = performance.now();
      while (performance.now() - t0 < 14) for (let k = 0; k < 20; k++) stepOnce(false);
      dish.absorb();
    } else {
      ui.acc += (dt * ui.speed) / TICK_MS;
      const n = Math.min(400, Math.floor(ui.acc));
      ui.acc -= n;
      for (let k = 0; k < n; k++) stepOnce(ui.speed <= 4 || k === n - 1);
    }
  }
  render();
  if (alive) rafId = requestAnimationFrame(frame);
}

function render() {
  const fb = exp.feedback;
  const obs = exp.last.obs || exp.game.observe();
  const action = fb ? -1 : exp.last.action;
  doom.render(exp.game, fb);
  dish.draw(fb ? -1 : obs.state, action, ui.speed === 'max' ? 0.5 : 0.78);
  raster.draw();
  paintPolicy(fb ? -1 : obs.state, action);

  const st = exp.game.stats;
  $('hud-health').textContent = `${Math.max(0, exp.game.health)}%`;
  $('hud-kills').textContent = st.kills;
  $('hud-acc').textContent = st.shots ? `${Math.round((100 * st.kills) / st.shots)}%` : '–';
  $('hud-deaths').textContent = st.deaths;
  $('hud-action').textContent = fb ? '···' : action >= 0 ? ACTIONS[action].toUpperCase() : '–';
  $('hud-time').textContent = ((exp.playTicks * TICK_MS) / 60000).toFixed(1);
  const lf = exp.lastFeedback;
  $('stat-feedback').innerHTML = lf
    ? `Last feedback: <span class="font-medium" style="color:${lf.type === 'pattern' ? COLORS.pattern : COLORS.noise}">${lf.type}</span> after a ${lf.cause}, surprise u = <span class="tabular-nums font-medium">${lf.u.toFixed(2)}</span> bits/bin`
    : 'No feedback yet';

  const S = exp.series.slice(1);
  perfChart.draw([
    { pts: S.map((p) => [p.t, p.killsPerMin]), color: COLORS.pattern },
    { pts: S.map((p) => [p.t, p.hitsPerMin]), color: COLORS.noise },
  ]);
  entChart.draw([{ pts: exp.series.map((p) => [p.t, p.entropy]), color: COLORS.sensory }], [{ y: Math.log2(3), label: isEasyLevel() ? 'totally random' : 'max entropy log₂3' }]);
  const toMin = (t) => (t * TICK_MS) / 60000;
  surChart.draw([
    { pts: exp.fbLog.filter((f) => f.type === 'noise').map((f) => [toMin(f.t), f.u]), color: COLORS.noise, dots: true },
    { pts: exp.fbLog.filter((f) => f.type === 'pattern').map((f) => [toMin(f.t), f.u]), color: COLORS.pattern, dots: true },
  ]);
}

rafId = requestAnimationFrame(frame);

return () => {
  alive = false;
  cancelAnimationFrame(rafId);
};
}
