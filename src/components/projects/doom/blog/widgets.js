// Interactive figures for the write-up. Each mount* function builds its own
// DOM inside a container so the page markup stays readable.
import { Simplex, entropy, H3, BLUES, ORANGES } from './simplex.js';
import { Chart } from '../ui/charts.js';
import { gaussian } from '../rng.js';
import { listen, track, isEasyLevel } from '../lifecycle.js';
import results from '../data/results.json';

const ACT = ['Left', 'Right', 'Fire'];
const btn = (label, attrs = '') => `<button ${attrs} class="px-3 py-1 rounded text-sm bg-gray-200 hover:bg-gray-300">${label}</button>`;
const rnd = () => Math.random();
// Words on the Easy level, notation everywhere else.
const lv = (easy, hard) => `<span class="lv-easy">${easy}</span><span class="lv-hard">${hard}</span>`;
const isEasy = isEasyLevel;
const log2 = Math.log2;

function barsHTML(p, { surprise = true } = {}) {
  return p
    .map(
      (q, a) => `
    <div class="flex items-center gap-2 text-sm mb-1.5">
      <span class="w-10 text-gray-600">${ACT[a]}</span>
      <div class="flex-1 h-3 bg-gray-100 rounded"><div class="h-3 rounded bg-orange-500" style="width:${(q * 100).toFixed(1)}%"></div></div>
      <span class="w-10 text-right tabular-nums">${q.toFixed(2)}</span>
      ${surprise ? `<span class="adv w-24 text-right tabular-nums text-gray-500">${q > 1e-4 ? (-log2(q)).toFixed(2) : '∞'} bits</span>` : ''}
    </div>`
    )
    .join('');
}

function entropyField(sx) {
  sx.setField((p) => {
    const h = entropy(p);
    return { t: h / H3, raw: h };
  }, BLUES, [0.5, 1.0, 1.5]);
}

// ---------------------------------------------------------------------------
// 1. Entropy of a policy
export function mountEntropy(root) {
  root.innerHTML = `
  <div class="grid md:grid-cols-2 gap-8 items-center">
    <div class="max-w-sm w-full mx-auto"><canvas></canvas></div>
    <div>
      <div class="text-sm text-gray-500 mb-3">Drag the point. Every spot in the triangle is ${lv('one possible habit for a single situation: how likely each move is', 'one possible policy p(a | s) for a single state')}. Contours mark 0.5, 1.0 and 1.5 bits.</div>
      <div class="adv flex text-xs text-gray-400 mb-1"><span class="flex-1"></span><span class="w-24 text-right">surprise −log₂p</span></div>
      <div data-bars></div>
      <div class="mt-4"><span data-h class="text-3xl font-bold tabular-nums"></span> <span class="text-gray-500">${lv('bits of undecided-ness (entropy)', 'bits of entropy')}</span></div>
      <div class="text-sm text-gray-500 mb-4">${lv('totally random is about 1.58 bits, the most possible', 'maximum is log₂3 ≈ 1.585 bits')}</div>
      <div class="flex flex-wrap gap-1.5" data-presets>
        ${btn('Unconnected culture')} ${btn('Torn between two')} ${btn('Trained (center state)')}
      </div>
    </div>
  </div>`;
  const sx = new Simplex(root.querySelector('canvas'));
  entropyField(sx);
  let p = [1 / 3, 1 / 3, 1 / 3];
  const draw = () => {
    sx.drawBase();
    sx.drawPoint(p);
    root.querySelector('[data-bars]').innerHTML = barsHTML(p);
    root.querySelector('[data-h]').textContent = entropy(p).toFixed(3);
  };
  sx.enableDrag((q) => {
    p = q;
    draw();
  });
  const presets = [
    [1 / 3, 1 / 3, 1 / 3],
    [0.5, 0.02, 0.48],
    [0.01, 0.01, 0.98],
  ];
  [...root.querySelectorAll('[data-presets] button')].forEach((b, k) => (b.onclick = () => ((p = presets[k]), draw())));
  draw();
}

// ---------------------------------------------------------------------------
// 2. Learning to predict feedback: surprise = entropy + KL
export function mountSurprise(root) {
  const E = 7;
  const L = 20;
  root.innerHTML = `
  <div class="flex flex-wrap items-center gap-2 mb-4">
    <button data-play class="px-4 py-1 rounded text-white bg-green-500 hover:bg-green-600">Play</button>
    ${btn('Step', 'data-step')} ${btn('Reset', 'data-reset')}
    <label class="text-sm ml-3 flex items-center gap-2">Noise density <input data-rho type="range" min="0.02" max="0.5" step="0.02" value="0.5" class="w-28"/><span data-rhov class="tabular-nums text-gray-500 w-36"></span></label>
    <label class="adv text-sm flex items-center gap-2">Learning rate <input data-lr type="range" min="0.05" max="0.5" step="0.05" value="0.2" class="w-24"/><span data-lrv class="tabular-nums text-gray-500"></span></label>
  </div>
  <div class="grid md:grid-cols-2 gap-6">
    <div>
      <div class="text-sm font-medium mb-1">Stimulation vs. the culture's prediction <span class="text-gray-500 font-normal">(7 electrodes × 20 bins)</span></div>
      <canvas data-grids></canvas>
      <div class="mt-4 text-sm font-medium mb-2">${lv('Leftover surprise = can\'t be learned away + can be learned away', 'Expected surprise = entropy + KL')} <span class="text-gray-500 font-normal">(bits per bin)</span></div>
      <div data-decomp></div>
    </div>
    <div>
      <div class="text-sm font-medium mb-1">Surprise of each trial <span class="text-gray-500 font-normal">(bits per bin)</span></div>
      <div class="text-xs text-gray-600 mb-1"><span class="text-green-600">●</span> pattern &nbsp; <span class="text-red-500">●</span> noise &nbsp; <span style="color:#991b1b">━</span> ${lv('static, averaged', 'noise, 10-trial average')} &nbsp; ┄ ${lv('the static\'s surprise that can never be learned away', 'noise entropy floor H(ρ)')}</div>
      <canvas data-chart></canvas>
    </div>
  </div>`;
  const q = root.querySelector.bind(root);
  const gridsCanvas = q('[data-grids]');
  const GW = 330;
  const GH = 196;
  const dpr = window.devicePixelRatio || 1;
  gridsCanvas.width = GW * dpr;
  gridsCanvas.height = GH * dpr;
  gridsCanvas.style.width = '100%';
  gridsCanvas.style.maxWidth = `${GW}px`;
  const g = gridsCanvas.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  const chart = new Chart(q('[data-chart]'), { w: 320, h: 220, yMax: 1.25, xLabel: 'trial number', xWindow: 60 });

  let S;
  const reset = () => {
    S = { qP: new Float32Array(E * L).fill(0.5), qN: new Float32Array(E * L).fill(0.5), xP: new Uint8Array(E * L), xN: new Uint8Array(E * L), hP: [], hN: [], n: 0 };
    draw();
  };
  const rho = () => Number(q('[data-rho]').value);
  const lr = () => Number(q('[data-lr]').value);
  const Hb = (r) => (r <= 0 || r >= 1 ? 0 : -(r * log2(r) + (1 - r) * log2(1 - r)));

  const surprise = (x, Q) => {
    let s = 0;
    for (let k = 0; k < x.length; k++) s -= x[k] ? log2(Q[k]) : log2(1 - Q[k]);
    return s / x.length;
  };
  const learn = (x, Q) => {
    for (let k = 0; k < x.length; k++) Q[k] = Math.min(0.98, Math.max(0.02, Q[k] + lr() * (x[k] - Q[k])));
  };
  const step = () => {
    for (let e = 0; e < E; e++)
      for (let t = 0; t < L; t++) {
        S.xP[e * L + t] = t % 2 === 0 ? 1 : 0;
        S.xN[e * L + t] = rnd() < rho() ? 1 : 0;
      }
    S.n++;
    S.hP.push([S.n, surprise(S.xP, S.qP)]);
    S.hN.push([S.n, surprise(S.xN, S.qN)]);
    learn(S.xP, S.qP);
    learn(S.xN, S.qN);
    if (S.hP.length > 70) {
      S.hP.shift();
      S.hN.shift();
    }
    draw();
  };

  const grid = (x0, y0, X, Q, color, title) => {
    const c = 6;
    g.fillStyle = '#374151';
    g.font = '600 11px Geist, system-ui, sans-serif';
    g.textAlign = 'left';
    g.fillText(title, x0, y0 - 6);
    for (let e = 0; e < E; e++)
      for (let t = 0; t < L; t++) {
        const k = e * L + t;
        g.fillStyle = X ? (X[k] ? color : '#f3f4f6') : `rgba(17,24,39,${Q[k]})`;
        g.fillRect(x0 + t * (c + 1), y0 + e * (c + 1), c, c);
      }
  };

  const draw = () => {
    g.clearRect(0, 0, GW, GH);
    grid(0, 18, S.xP, null, '#22c55e', 'Pattern: stimulation');
    grid(176, 18, null, S.qP, '', 'prediction q');
    grid(0, 118, S.xN, null, '#ef4444', 'Noise: stimulation');
    grid(176, 118, null, S.qN, '', 'prediction q');
    const r = rho();
    q('[data-rhov]').textContent = `${Math.round(r * 100)}% · H = ${Hb(r).toFixed(2)} bits`;
    q('[data-lrv]').textContent = lr().toFixed(2);
    // running average of the last 10 noise trials, to compare against the floor
    const avgN = S.hN.map(([n], i) => {
      const win = S.hN.slice(Math.max(0, i - 9), i + 1);
      return [n, win.reduce((a, p) => a + p[1], 0) / win.length];
    });
    chart.draw(
      [
        { pts: S.hN, color: '#ef4444', dots: true },
        { pts: S.hP, color: '#22c55e', dots: true },
        { pts: avgN, color: '#991b1b', width: 2.5 },
      ],
      [{ y: Hb(r), label: isEasy() ? 'never goes away' : 'H(ρ)', below: true }]
    );
    // Expected surprise under the current prediction, split into H + KL
    let ceP = 0;
    let ceN = 0;
    for (let k = 0; k < E * L; k++) {
      const t = k % L;
      ceP -= t % 2 === 0 ? log2(S.qP[k]) : log2(1 - S.qP[k]);
      ceN -= r * log2(S.qN[k]) + (1 - r) * log2(1 - S.qN[k]);
    }
    ceP /= E * L;
    ceN /= E * L;
    const rows = [
      ['Pattern', 0, ceP, '#22c55e'],
      ['Noise', Hb(r), ceN, '#ef4444'],
    ];
    const scale = 100 / Math.max(1.05, ceP, ceN);
    q('[data-decomp]').innerHTML = rows
      .map(
        ([name, h, ce, col]) => `
      <div class="flex items-center gap-2 text-sm mb-1.5">
        <span class="w-14 text-gray-600">${name}</span>
        <div class="flex-1 h-4 bg-gray-100 rounded flex overflow-hidden">
          <div style="width:${h * scale}%;background:#9ca3af"></div>
          <div style="width:${Math.max(0, ce - h) * scale}%;background:${col}"></div>
        </div>
        <span class="w-40 tabular-nums text-gray-600 text-right">${h.toFixed(2)} + ${Math.max(0, ce - h).toFixed(2)} = ${ce.toFixed(2)}</span>
      </div>`
      )
      .join('') + '<div class="text-xs text-gray-500"><span class="inline-block w-2.5 h-2.5 bg-gray-400 mr-1"></span>' + lv("can't be learned away", 'entropy H (irreducible)') + ' &nbsp; <span class="inline-block w-2.5 h-2.5 bg-green-500 mr-0.5"></span><span class="inline-block w-2.5 h-2.5 bg-red-500 mr-1"></span>' + lv('can be learned away', 'KL (removable by learning)') + '</div>';
  };

  let playing = false;
  let timer = null;
  track(() => clearInterval(timer));
  q('[data-play]').onclick = () => {
    playing = !playing;
    q('[data-play]').textContent = playing ? 'Pause' : 'Play';
    if (playing) timer = setInterval(step, 140);
    else clearInterval(timer);
  };
  q('[data-step]').onclick = step;
  q('[data-reset]').onclick = reset;
  q('[data-rho]').oninput = draw;
  q('[data-lr]').oninput = draw;
  listen(window, 'levelchange', () => draw());
  reset();
}

// ---------------------------------------------------------------------------
// 3. One state's policy under pattern and noise
export function mountPolicy(root) {
  const P = { eta: 0.3, kappa: 0.3, sigma: 0.3, beta: 4 };
  root.innerHTML = `
  <div class="grid md:grid-cols-2 gap-8">
    <div class="max-w-sm w-full mx-auto"><canvas data-sx></canvas></div>
    <div>
      <div class="text-sm mb-1 text-gray-600">Deliver feedback by hand:</div>
      <div class="flex flex-wrap items-center gap-1.5 mb-1.5" data-pat><span class="text-sm w-24 text-green-600 font-medium">Pattern after</span>${ACT.map((a) => btn(a)).join('')}</div>
      <div class="flex flex-wrap items-center gap-1.5 mb-4" data-noi><span class="text-sm w-24 text-red-500 font-medium">Noise after</span>${ACT.map((a) => btn(a)).join('')}</div>
      <div class="text-sm mb-1 text-gray-600">Or let the environment respond (enemy dead ahead, so only Fire works):</div>
      <div class="flex flex-wrap items-center gap-2 mb-3">
        <button data-play class="px-4 py-1 rounded text-white bg-green-500 hover:bg-green-600">Play</button>
        ${btn('Reset', 'data-reset')}
      </div>
      <label class="text-sm font-medium flex justify-between"><span>${lv('How random the static is', 'Surprise of the noise, u')}</span><span data-uv class="tabular-nums text-gray-500 font-normal"></span></label>
      <input data-u type="range" min="0" max="1" step="0.05" value="1" class="w-full mb-3"/>
      <div data-bars></div>
      <div data-verdict class="mt-2 text-sm font-semibold"></div>
      <div class="mt-1 text-sm text-gray-600"><span data-h class="font-semibold text-black tabular-nums"></span> bits · trial <span data-n class="tabular-nums"></span> · <span data-last class="text-gray-500"></span></div>
      <canvas data-chart class="mt-2"></canvas>
    </div>
  </div>`;
  const q = root.querySelector.bind(root);
  const sx = new Simplex(q('[data-sx]'));
  entropyField(sx);
  const chart = new Chart(q('[data-chart]'), { w: 320, h: 120, yMax: 1.7, xLabel: 'trials', xMin: 10 });
  let w;
  let trail;
  let hist;
  let n;
  let last;
  const policy = () => {
    const z = w.map((x) => Math.exp(P.beta * x));
    const Z = z[0] + z[1] + z[2];
    return z.map((x) => x / Z);
  };
  const reset = () => {
    w = [1, 1, 1];
    trail = [policy()];
    hist = [[0, H3]];
    n = 0;
    last = 'uniform weights: the max-entropy prior';
    draw();
  };
  const feedback = (a, u, kind) => {
    const mean = (w[0] + w[1] + w[2]) / 3;
    w[a] += P.eta * (1 - u) + u * (P.kappa * (mean - w[a]) + P.sigma * gaussian(rnd));
    w = w.map((x) => Math.max(0, x));
    const s = w[0] + w[1] + w[2];
    w = w.map((x) => (3 * x) / s); // synaptic budget
    n++;
    const p = policy();
    trail.push(p);
    if (trail.length > 300) trail.shift();
    hist.push([n, entropy(p)]);
    if (hist.length > 200) hist.shift();
    last = `${kind} after ${ACT[a]} (u = ${u.toFixed(2)})`;
    draw();
  };
  const uNoise = () => Number(q('[data-u]').value);
  const draw = () => {
    const p = policy();
    sx.drawBase();
    sx.drawTrail(trail);
    sx.drawPoint(p);
    q('[data-bars]').innerHTML = barsHTML(p, { surprise: false });
    q('[data-h]').textContent = entropy(p).toFixed(3);
    q('[data-n]').textContent = n;
    q('[data-last]').textContent = last;
    const best = p.indexOf(Math.max(...p));
    const v = q('[data-verdict]');
    if (p[best] > 0.9) {
      v.textContent = best === 2 ? 'Settled on Fire ✓ (the move that brings the pattern)' : `Locked into ${ACT[best]} ✗ (a wrong habit)`;
      v.style.color = best === 2 ? '#15803d' : '#dc2626';
    } else {
      v.textContent = 'Still exploring';
      v.style.color = '#6b7280';
    }
    q('[data-uv]').textContent = `${uNoise().toFixed(2)} bits/bin${uNoise() > 0.95 ? ' (pure noise)' : uNoise() < 0.1 ? ' (as predictable as the pattern)' : ''}`;
    chart.draw([{ pts: hist, color: '#3b82f6' }], [{ y: H3, label: isEasy() ? 'totally random' : 'log₂3' }]);
  };
  [...q('[data-pat]').querySelectorAll('button')].forEach((b, a) => (b.onclick = () => feedback(a, 0.03, 'pattern')));
  [...q('[data-noi]').querySelectorAll('button')].forEach((b, a) => (b.onclick = () => feedback(a, uNoise(), 'noise')));
  const auto = () => {
    const p = policy();
    let r = rnd();
    let a = 0;
    while (a < 2 && r > p[a]) r -= p[a++];
    if (a === 2) feedback(a, 0.03, 'pattern');
    else feedback(a, uNoise(), 'noise');
  };
  let timer = null;
  track(() => clearInterval(timer));
  q('[data-play]').onclick = () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    } else timer = setInterval(auto, 120);
    q('[data-play]').textContent = timer ? 'Pause' : 'Play';
  };
  q('[data-reset]').onclick = reset;
  q('[data-u]').oninput = draw;
  listen(window, 'levelchange', () => draw());
  reset();
}

// Lanczos approximation to ln Γ(x), x > 0
function lgamma(x) {
  const c = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
  let y = x;
  const t = x + 5.5 - (x + 0.5) * Math.log(x + 5.5);
  let ser = 1.000000000190015;
  for (const k of c) ser += k / ++y;
  return -t + Math.log((2.5066282746310005 * ser) / x);
}

// ---------------------------------------------------------------------------
// 4. The Bayesian reading: Dirichlet pseudo-counts, observation and forgetting
export function mountDirichlet(root) {
  const a0 = [1, 1, 1];
  root.innerHTML = `
  <div class="grid md:grid-cols-2 gap-8">
    <div class="max-w-sm w-full mx-auto"><canvas data-sx></canvas>
      <div class="text-xs text-gray-500 text-center mt-1">${lv('shading = where the culture thinks the right move is · dot = its best guess', 'shading = posterior density Dir(p | α) · dot = predictive policy')}</div></div>
    <div>
      <div class="flex flex-wrap items-center gap-1.5 mb-1.5" data-obs><span class="text-sm w-28 text-green-600 font-medium">Pattern after</span>${ACT.map((a) => btn(a)).join('')}</div>
      <div class="flex flex-wrap items-center gap-1.5 mb-3"><span class="text-sm w-28 text-red-500 font-medium">Noise</span>${btn('Forget toward prior', 'data-forget')} ${btn('Reset to prior', 'data-reset')}</div>
      <label class="adv text-sm font-medium flex justify-between"><span>Forgetting per noise burst, κ</span><span data-kv class="tabular-nums text-gray-500 font-normal"></span></label>
      <input data-k type="range" min="0.05" max="0.9" step="0.05" value="0.35" class="adv w-full mb-3"/>
      <table class="text-sm w-full mb-3 tabular-nums">
        <thead><tr class="text-gray-500"><th class="text-left font-medium">action</th><th class="text-right font-medium">${lv('tallies', 'α')}</th><th class="text-right font-medium">${lv('best guess', 'p̂ = α / Σα')}</th></tr></thead>
        <tbody data-rows></tbody>
      </table>
      <div class="grid grid-cols-3 gap-2 text-center">
        <div class="bg-gray-50 rounded p-2"><div data-H class="text-xl font-bold tabular-nums"></div><div class="text-xs text-gray-500">${lv('undecided-ness (bits)', 'H(p̂) bits')}</div></div>
        <div class="bg-gray-50 rounded p-2"><div data-A class="text-xl font-bold tabular-nums"></div><div class="text-xs text-gray-500">${lv('total tallies', 'confidence Σα')}</div></div>
        <div class="bg-gray-50 rounded p-2"><div data-pl class="text-xl font-bold tabular-nums"></div><div class="text-xs text-gray-500">plasticity: how far one more tally moves the guess</div></div>
      </div>
    </div>
  </div>`;
  const q = root.querySelector.bind(root);
  const sx = new Simplex(q('[data-sx]'));
  let al;
  const draw = () => {
    const A = al[0] + al[1] + al[2];
    const mode = al.map((x) => (A > 3 ? (x - 1) / (A - 3) : 1 / 3));
    const logd = (p) => al.reduce((s, x, i) => s + (x > 1 ? (x - 1) * Math.log(Math.max(p[i], 1e-9)) : 0), 0);
    // absolute density: log pdf = logd - log B(alpha); the flat prior has pdf 2 everywhere
    const logB = al.reduce((s, x) => s + lgamma(x), 0) - lgamma(A);
    sx.setField((p) => ({ t: Math.min(1, Math.sqrt(Math.exp(logd(p) - logB) / 40)), raw: 0 }), ORANGES);
    const pm = al.map((x) => x / A);
    sx.drawBase();
    sx.drawPoint(pm, '#1d4ed8', 6);
    q('[data-rows]').innerHTML = al.map((x, i) => `<tr><td>${ACT[i]}</td><td class="text-right">${x.toFixed(2)}</td><td class="text-right">${pm[i].toFixed(3)}</td></tr>`).join('');
    q('[data-H]').textContent = entropy(pm).toFixed(3);
    q('[data-A]').textContent = A.toFixed(1);
    q('[data-pl]').textContent = (1 / (A + 1)).toFixed(3);
    q('[data-kv]').textContent = Number(q('[data-k]').value).toFixed(2);
  };
  const reset = () => {
    al = [...a0];
    draw();
  };
  [...q('[data-obs]').querySelectorAll('button')].forEach(
    (b, i) =>
      (b.onclick = () => {
        al[i] += 1;
        draw();
      })
  );
  q('[data-forget]').onclick = () => {
    const k = Number(q('[data-k]').value);
    al = al.map((x, i) => a0[i] + (1 - k) * (x - a0[i]));
    draw();
  };
  q('[data-reset]').onclick = reset;
  q('[data-k]').oninput = draw;
  reset();
}

// ---------------------------------------------------------------------------
// 5. Precomputed results across seeds
export async function mountResults(root) {
  const R = results;
  const colors = { fep: '#22c55e', pattern: '#3b82f6', noise: '#f59e0b', none: '#9ca3af' };
  const names = { fep: 'Pattern + noise', pattern: 'Pattern only', noise: 'Noise only', none: 'No feedback' };
  const legend = Object.keys(colors)
    .map((k) => `<span class="mr-3 whitespace-nowrap"><span style="color:${colors[k]}">■</span> ${names[k]}</span>`)
    .join('');
  root.innerHTML = `
  <div class="text-xs text-gray-600 mb-3">${legend}</div>
  <div class="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
    <div><div class="text-sm font-medium mb-1">Kills per minute</div><canvas data-k></canvas></div>
    <div><div class="text-sm font-medium mb-1">Hits taken per minute</div><canvas data-h></canvas></div>
    <div><div class="text-sm font-medium mb-1">${lv('How undecided (bits)', 'Mean policy entropy H(a | s)')}</div><canvas data-e></canvas></div>
  </div>`;
  const mk = (sel, key, yMax = null, refs = []) =>
    new Chart(root.querySelector(sel), { w: 300, h: 190, yMax }).draw(
      Object.keys(colors).map((m) => ({ pts: R.modes[m].slice(1).map((p) => [p.t, p[key]]), color: colors[m] })),
      refs
    );
  const draw = () => {
    mk('[data-k]', 'kills');
    mk('[data-h]', 'hits');
    mk('[data-e]', 'entropy', 1.7, [{ y: H3, label: isEasy() ? 'totally random' : 'log₂3' }]);
  };
  draw();
  listen(window, 'levelchange', draw);
}

export async function mountDensity(root) {
  const R = results;
  root.innerHTML = `
  <div class="grid md:grid-cols-2 gap-6 items-start">
    <div><div class="text-sm font-medium mb-1">Kills per minute after 20 min, vs. noise entropy</div><div class="text-xs text-gray-600 mb-1"><span class="text-red-500">●</span> sparse noise (ρ ≤ 50%) &nbsp; <span class="text-indigo-500">●</span> dense noise (ρ &gt; 50%, more pulses)</div><canvas data-c></canvas></div>
    <table class="text-sm tabular-nums w-full">
      <thead><tr class="text-gray-500"><th class="text-left font-medium pb-1">noise density ρ</th><th class="text-right font-medium">H(ρ) bits/bin</th><th class="text-right font-medium">kills/min</th><th class="text-right font-medium">hits/min</th><th class="text-right font-medium">H(a|s)</th></tr></thead>
      <tbody>${R.density
        .map(
          (r) =>
            `<tr class="${r.kills > 90 ? 'text-green-700' : r.kills < 20 ? 'text-red-600' : ''}"><td>${(r.rho * 100).toFixed(0)}%</td><td class="text-right">${r.bits.toFixed(2)}</td><td class="text-right">${r.kills.toFixed(0)}</td><td class="text-right">${r.hits.toFixed(1)}</td><td class="text-right">${r.entropy.toFixed(2)}</td></tr>`
        )
        .join('')}</tbody>
    </table>
  </div>`;
  const sparse = R.density.filter((r) => r.rho <= 0.5).map((r) => [r.bits, r.kills]);
  const dense = R.density.filter((r) => r.rho > 0.5).map((r) => [r.bits, r.kills]).sort((a, b) => a[0] - b[0]);
  new Chart(root.querySelector('[data-c]'), { w: 320, h: 200, xLabel: 'noise entropy H(ρ), bits per bin' }).draw([
    { pts: sparse, color: '#ef4444' },
    { pts: sparse, color: '#ef4444', dots: true },
    { pts: dense, color: '#6366f1' },
    { pts: dense, color: '#6366f1', dots: true },
  ]);
}
