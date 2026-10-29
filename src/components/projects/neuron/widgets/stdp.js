// Section 6: pair-based STDP measured the way a lab would. Force a pre spike
// and a post spike Δt apart, repeat the pairing, and record how much the
// weight changed. The traces are ODEs too, integrated with RK4:
//   τ+ dx/dt = -x (x += 1 at pre),   τ- dy/dt = -y (y += 1 at post)
//   post spike: w += A+ x · g+(w),   pre spike: w -= A- y · g-(w)
// g± = 1 (additive) or g+ = wmax - w, g- = w (multiplicative).
import { makeRK4 } from '../sim/rk4.js';
import { C, setupCanvas, lv, isEasy, btn, slider, animate, listen, markGroup } from '../ui/common.js';
import { axes, path, dot, label, legend, line } from '../ui/plot.js';

const TP = 20;
const TM = 20;
const AP = 0.005;
const AM = 0.00525;
const W0 = 0.5;
const PAIRS = 60;
const PERIOD = 1000; // ms between pairings: much longer than τ, so pairings don't interact
const DT = 0.1;

// Run a pairing protocol and return the weight after each pairing.
function protocol(dt, rule) {
  const step = makeRK4(2);
  const s = new Float64Array([0, 0]); // x, y
  const f = (t, u, d) => {
    d[0] = -u[0] / TP;
    d[1] = -u[1] / TM;
  };
  let w = W0;
  const ws = [w];
  const pre = () => {
    w -= AM * s[1] * (rule === 'mult' ? w : 1);
    s[0] += 1;
  };
  const post = () => {
    w += AP * s[0] * (rule === 'mult' ? 1 - w : 1);
    s[1] += 1;
  };
  for (let k = 0; k < PAIRS; k++) {
    const tPre = 100 + Math.max(0, -dt);
    const tPost = tPre + dt;
    const events = [
      [tPre, pre],
      [tPost, post],
    ].sort((a, b) => a[0] - b[0]);
    let t = 0;
    for (const [te, fn] of events) {
      while (t + DT <= te + 1e-9) {
        step(f, t, s, DT);
        t += DT;
      }
      fn();
    }
    // decay through the rest of the period (exactly: the traces are linear)
    const rest = PERIOD - t;
    s[0] *= Math.exp(-rest / TP);
    s[1] *= Math.exp(-rest / TM);
    w = Math.min(1, Math.max(0, w));
    ws.push(w);
  }
  return ws;
}

export function mountPairing(root) {
  root.innerHTML = `
  <div class="flex flex-wrap items-center gap-x-4 gap-y-2 mb-3">
    ${slider(lv('Gap between the two spikes', 'Δt = t<sub>post</sub> − t<sub>pre</sub>'), 'data-dt min="-80" max="80" step="2" value="10"', 'data-dtv')}
    ${btn(lv(`Pair them ${PAIRS} times`, `Run ${PAIRS} pairings`), 'data-run')}
    ${btn(lv('Try every gap', 'Sweep Δt'), 'data-sweep')}
    ${btn('Clear', 'data-clear')}
    <span class="text-sm text-gray-500">${lv('Rule', 'Rule')}</span>
    <div class="flex gap-1" data-rule>${btn('Additive', 'data-v="add"')}${btn('Multiplicative', 'data-v="mult"')}</div>
  </div>
  <div class="grid lg:grid-cols-2 gap-6">
    <div><canvas data-pair></canvas><canvas data-wc class="mt-3"></canvas></div>
    <div><canvas data-win></canvas><div data-msg class="text-sm text-gray-600 mt-2"></div></div>
  </div>`;
  const q = root.querySelector.bind(root);
  const PW = 420;
  const PH = 200;
  const CW = 420;
  const CH = 160;
  const WW = 420;
  const WH = 330;
  const gp = setupCanvas(q('[data-pair]'), PW, PH);
  const gc = setupCanvas(q('[data-wc]'), CW, CH);
  const gw = setupCanvas(q('[data-win]'), WW, WH);
  for (const [k, w] of [
    ['pair', PW],
    ['wc', CW],
    ['win', WW],
  ])
    q(`[data-${k}]`).style.maxWidth = `${w * 1.3}px`;
  let rule = 'add';
  let dots = { add: [], mult: [] };
  let lastRun = null;
  let sweep = null;
  let phase = 0; // animation of the single pairing
  const dtv = () => Number(q('[data-dt]').value);

  function measure(dt) {
    const ws = protocol(dt, rule);
    const dw = ((ws[ws.length - 1] - W0) / W0) * 100;
    dots[rule].push([dt, dw]);
    lastRun = { dt, ws, rule };
    return dw;
  }

  function drawPair() {
    const easy = isEasy();
    const dt = dtv();
    gp.clearRect(0, 0, PW, PH);
    const tPre = 60 + Math.max(0, -dt);
    const tPost = tPre + dt;
    const T = 200;
    const L = 70;
    const X = (t) => L + (t / T) * (PW - L - 10);
    const show = phase * T; // reveal over time
    const rows = [
      [easy ? 'input' : 'pre', 30, C.blue, tPre, TP],
      [easy ? 'output' : 'post', 110, C.orange, tPost, TM],
    ];
    for (const [name, y0, col, ts, tau] of rows) {
      gp.fillStyle = C.panel;
      gp.fillRect(L, y0 - 18, PW - L - 10, 62);
      label(gp, name, L - 8, y0 + 14, { align: 'right', color: col, bold: true });
      if (show >= ts) {
        gp.strokeStyle = col;
        gp.lineWidth = 2.5;
        line(gp, X(ts), y0 - 14, X(ts), y0 + 8);
      }
      // trace
      const xs = [];
      const ys = [];
      for (let t = 0; t <= Math.min(show, T); t += 0.5) {
        xs.push(t);
        ys.push(t < ts ? 0 : Math.exp(-(t - ts) / tau));
      }
      path(
        gp,
        X,
        (v) => y0 + 40 - v * 26,
        xs,
        ys,
        { color: col, width: 1.5, alpha: 0.6 }
      );
      label(gp, easy ? 'memory of the spike' : name === 'pre' ? 'trace x' : 'trace y', PW - 14, y0 + 40, { align: 'right', color: col });
    }
    // what the weight sees
    const second = Math.max(tPre, tPost);
    if (show >= second) {
      const ltp = dt >= 0;
      const amt = ltp ? AP * Math.exp(-dt / TP) : AM * Math.exp(dt / TM);
      label(gp, ltp ? (easy ? `output came after input → stronger (+${(amt * 100).toFixed(2)}%)` : `post reads x = ${Math.exp(-dt / TP).toFixed(2)} → Δw = +A₊x`) : easy ? `input came after output → weaker (−${(amt * 100).toFixed(2)}%)` : `pre reads y = ${Math.exp(dt / TM).toFixed(2)} → Δw = −A₋y`, L, PH - 10, {
        color: ltp ? '#15803d' : '#b91c1c',
        bold: true,
      });
    }
  }

  function drawWeights() {
    const easy = isEasy();
    gc.clearRect(0, 0, CW, CH);
    const ax = axes(gc, { x: 44, y: 10, w: CW - 54, h: CH - 46 }, { xr: [0, PAIRS], yr: [0, 1], xLabel: easy ? 'pairings' : 'pairing #', yLabel: easy ? 'strength' : 'w', yTicks: 2 });
    if (lastRun) path(gc, ax.X, ax.Y, lastRun.ws.map((_, i) => i), lastRun.ws, { color: lastRun.rule === 'add' ? C.ink : C.teal, width: 2 });
  }

  function drawWindow() {
    const easy = isEasy();
    gw.clearRect(0, 0, WW, WH);
    const ax = axes(gw, { x: 44, y: 10, w: WW - 54, h: WH - 46 }, { xr: [-80, 80], yr: [-80, 80], xLabel: easy ? 'ms from input spike to output spike' : 'Δt (ms)', yLabel: easy ? 'change in strength (%)' : `Δw after ${PAIRS} pairings (%)`, zeroLine: true });
    ax.clip();
    gw.fillStyle = 'rgba(34,197,94,0.06)';
    gw.fillRect(ax.X(0), ax.Y(80), ax.X(80) - ax.X(0), ax.Y(0) - ax.Y(80));
    gw.fillStyle = 'rgba(239,68,68,0.06)';
    gw.fillRect(ax.X(-80), ax.Y(0), ax.X(0) - ax.X(-80), ax.Y(-80) - ax.Y(0));
    // small-change prediction for the additive rule: PAIRS × single-pair window
    const xs = [];
    for (let d = -80; d <= 80; d += 1) xs.push(d);
    path(gw, ax.X, ax.Y, xs, xs.map((d) => ((PAIRS * (d >= 0 ? AP * Math.exp(-d / TP) : -AM * Math.exp(d / TM))) / W0) * 100), { color: C.faint, dash: [4, 3], width: 1.5 });
    for (const [d, v] of dots.add) dot(gw, ax.X(d), ax.Y(v), 3.5, C.ink, 0.8);
    for (const [d, v] of dots.mult) dot(gw, ax.X(d), ax.Y(v), 3.5, C.teal, 0.8);
    ax.unclip();
    label(gw, easy ? 'input first → stronger' : 'pre → post: LTP', ax.X(4), 24, { color: '#15803d' });
    label(gw, easy ? 'output first → weaker' : 'post → pre: LTD', ax.X(-4), WH - 44, { color: '#b91c1c', align: 'right' });
    legend(gw, [[C.ink, 'additive'], [C.teal, 'multiplicative'], [C.faint, easy ? 'formula' : 'additive, analytic', true]], 52, WH - 56);
  }

  function draw() {
    const dt = dtv();
    q('[data-dtv]').textContent = `${dt > 0 ? '+' : ''}${dt} ms`;
    markGroup(q('[data-rule]'), rule);
    drawPair();
    drawWeights();
    drawWindow();
  }

  animate(root, (ms) => {
    phase = Math.min(1, phase + ms / 1500);
    if (sweep !== null) {
      for (let k = 0; k < 2 && sweep <= 80; k++, sweep += 4) measure(sweep);
      if (sweep > 80) sweep = null;
    }
    draw();
  });
  q('[data-run]').onclick = () => {
    const dw = measure(dtv());
    q('[data-msg]').textContent = `${PAIRS} pairings at Δt = ${dtv()} ms changed the weight by ${dw >= 0 ? '+' : ''}${dw.toFixed(1)}%.`;
  };
  q('[data-sweep]').onclick = () => (sweep = -80);
  q('[data-clear]').onclick = () => {
    dots = { add: [], mult: [] };
    lastRun = null;
    q('[data-msg]').textContent = '';
  };
  q('[data-dt]').oninput = () => {
    phase = 0;
  };
  for (const b of q('[data-rule]').children)
    b.onclick = () => {
      rule = b.dataset.v;
    };
  listen(window, 'levelchange', draw);
  draw();
}
