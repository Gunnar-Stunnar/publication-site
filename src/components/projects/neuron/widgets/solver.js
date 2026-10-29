// Section 1: why the solver matters. A spring under Euler and RK4, one RK4
// step taken apart, and (graduate) the convergence orders.
import { makeEuler, makeRK4, rk4Anatomy } from '../sim/rk4.js';
import { C, setupCanvas, lv, isEasy, btn, playBtn, setPlaying, slider, animate, listen, canvasPoint } from '../ui/common.js';
import { axes, path, dot, arrow, label, legend, line } from '../ui/plot.js';

// ---------------------------------------------------------------- spring
// x'' = -x as a first-order system: x' = v, v' = -x. Exact orbit: the unit circle.
const spring = (t, s, d) => {
  d[0] = s[1];
  d[1] = -s[0];
};
const energy = (s) => 0.5 * (s[0] * s[0] + s[1] * s[1]);

export function mountOscillator(root) {
  root.innerHTML = `
  <div class="flex flex-wrap items-center gap-x-4 gap-y-2 mb-3">
    ${playBtn()} ${btn('Reset', 'data-reset')}
    ${slider(lv('Step size', 'Step size h'), 'data-h min="0.05" max="1" step="0.05" value="0.3"', 'data-hv')}
  </div>
  <div class="grid md:grid-cols-2 gap-6">
    <div><canvas data-phase></canvas></div>
    <div><canvas data-err></canvas></div>
  </div>`;
  const q = root.querySelector.bind(root);
  const PW = 320;
  const PH = 320;
  const EW = 340;
  const EH = 320;
  const gp = setupCanvas(q('[data-phase]'), PW, PH);
  const ge = setupCanvas(q('[data-err]'), EW, EH);
  q('[data-phase]').style.maxWidth = `${PW * 1.3}px`;
  q('[data-err]').style.maxWidth = `${EW * 1.3}px`;
  const eu = makeEuler(2);
  const rk = makeRK4(2);
  let S;
  const h = () => Number(q('[data-h]').value);
  const reset = () => {
    S = { t: 0, e: new Float64Array([1, 0]), r: new Float64Array([1, 0]), pe: [[1, 0]], pr: [[1, 0]], err: [] };
    draw();
  };
  const T_MAX = 60; // time units shown (about ten periods)

  function advance() {
    const dt = h();
    eu(spring, S.t, S.e, dt);
    rk(spring, S.t, S.r, dt);
    S.t += dt;
    S.pe.push([S.e[0], S.e[1]]);
    S.pr.push([S.r[0], S.r[1]]);
    S.err.push([S.t, Math.abs(energy(S.e) - 0.5) / 0.5, Math.abs(energy(S.r) - 0.5) / 0.5]);
    if (S.t > T_MAX) playing = false;
  }

  function draw() {
    const easy = isEasy();
    q('[data-hv]').textContent = h().toFixed(2);
    // phase plane
    gp.clearRect(0, 0, PW, PH);
    const ax = axes(gp, { x: 34, y: 10, w: PW - 44, h: PH - 46 }, { xr: [-3, 3], yr: [-3, 3], xLabel: easy ? 'position' : 'x', yLabel: easy ? 'speed' : 'v', zeroLine: true });
    ax.clip();
    const circ = [];
    for (let a = 0; a <= 2 * Math.PI + 0.01; a += 0.05) circ.push([Math.cos(a), Math.sin(a)]);
    path(gp, ax.X, ax.Y, circ.map((p) => p[0]), circ.map((p) => p[1]), { color: C.faint, dash: [4, 3], width: 1.5 });
    path(gp, ax.X, ax.Y, S.pe.map((p) => p[0]), S.pe.map((p) => p[1]), { color: C.red, width: 1.5 });
    path(gp, ax.X, ax.Y, S.pr.map((p) => p[0]), S.pr.map((p) => p[1]), { color: C.blue, width: 2 });
    for (const p of S.pe.slice(-40)) dot(gp, ax.X(p[0]), ax.Y(p[1]), 1.8, C.red, 0.6);
    for (const p of S.pr.slice(-40)) dot(gp, ax.X(p[0]), ax.Y(p[1]), 1.8, C.blue, 0.6);
    dot(gp, ax.X(S.e[0]), ax.Y(S.e[1]), 4, C.red);
    dot(gp, ax.X(S.r[0]), ax.Y(S.r[1]), 4, C.blue);
    ax.unclip();
    legend(gp, [[C.red, 'Euler'], [C.blue, 'RK4'], [C.faint, easy ? 'true path' : 'exact orbit', true]], 40, 24);

    // energy error, log scale
    ge.clearRect(0, 0, EW, EH);
    const bx = axes(ge, { x: 44, y: 10, w: EW - 54, h: EH - 46 }, { xr: [0, T_MAX], yr: [1e-12, 1e4], ylog: true, xLabel: 'time', yLabel: easy ? 'energy created from nothing' : '|E − E₀| / E₀' });
    bx.clip();
    const clampLog = (v) => Math.max(1e-13, v);
    path(ge, bx.X, bx.Y, S.err.map((e) => e[0]), S.err.map((e) => clampLog(e[1])), { color: C.red, width: 2 });
    path(ge, bx.X, bx.Y, S.err.map((e) => e[0]), S.err.map((e) => clampLog(e[2])), { color: C.blue, width: 2 });
    bx.unclip();
    const last = S.err[S.err.length - 1];
    if (last) {
      label(ge, `Euler: ${fmtPct(last[1])}`, 52, 26, { color: C.red, bold: true });
      label(ge, `RK4: ${fmtPct(last[2])}`, 52, 40, { color: C.blue, bold: true });
    }
  }
  const fmtPct = (v) => (v >= 1 ? `${(v * 100).toFixed(0)}% extra energy` : v >= 1e-3 ? `${(v * 100).toFixed(2)}%` : `${v.toExponential(1)}`);

  let playing = false;
  let acc = 0;
  animate(root, (dtMs) => {
    if (playing) {
      // about 1.5 time units per second of real time, whatever the step size
      acc += (dtMs / 1000) * 1.5;
      while (acc >= h() && playing) {
        acc -= h();
        advance();
      }
      setPlaying(q('[data-play]'), playing);
    }
    draw();
  });
  q('[data-play]').onclick = () => {
    if (S.t > T_MAX) reset();
    playing = !playing;
    setPlaying(q('[data-play]'), playing);
  };
  q('[data-reset]').onclick = () => {
    reset();
  };
  q('[data-h]').oninput = () => {
    reset();
  };
  listen(window, 'levelchange', draw);
  reset();
}

// ---------------------------------------------------------------- one RK4 step
// y' = y cos t has the exact solution y = y0 e^{sin t}, so every slope and
// every error can be shown against the truth.
const fExp = (t, y) => y * Math.cos(t);
const exactThrough = (t0, y0) => (t) => y0 * Math.exp(Math.sin(t) - Math.sin(t0));
const PROBE = [
  { c: C.blue, name: 'k₁', easy: '1: slope here' },
  { c: C.orange, name: 'k₂', easy: '2: slope halfway, using 1' },
  { c: C.violet, name: 'k₃', easy: '3: slope halfway, using 2' },
  { c: C.green, name: 'k₄', easy: '4: slope at the end, using 3' },
];

export function mountRK4Anatomy(root) {
  root.innerHTML = `
  <div class="flex flex-wrap items-center gap-x-4 gap-y-2 mb-3">
    ${slider(lv('Step size', 'Step size h'), 'data-h min="0.1" max="2.4" step="0.05" value="1.4"', 'data-hv')}
    <span class="text-sm text-gray-500">${lv('Drag the black dot to move the starting point.', 'Drag the start point (t₀, y₀) along the solution.')}</span>
  </div>
  <div class="grid lg:grid-cols-5 gap-6">
    <div class="lg:col-span-3"><canvas data-c class="touch-none cursor-grab"></canvas></div>
    <div class="lg:col-span-2 text-sm">
      <table class="w-full tabular-nums"><tbody data-rows></tbody></table>
      <div data-sum class="mt-3"></div>
    </div>
  </div>`;
  const q = root.querySelector.bind(root);
  const W = 520;
  const H = 340;
  const cv = q('[data-c]');
  const g = setupCanvas(cv, W, H);
  cv.style.maxWidth = `${W * 1.3}px`;
  const box = { x: 34, y: 10, w: W - 44, h: H - 46 };
  const xr = [0, 6.5];
  const yr = [0, 3.2];
  const Y0 = 1;
  const truth = exactThrough(0, Y0);
  let t0 = 0.6;
  const h = () => Number(q('[data-h]').value);

  function draw() {
    const easy = isEasy();
    const hh = h();
    q('[data-hv]').textContent = hh.toFixed(2);
    const y0 = truth(t0);
    const A = rk4Anatomy(fExp, t0, y0, hh);
    g.clearRect(0, 0, W, H);
    const ax = axes(g, box, { xr, yr, xLabel: 't', yLabel: 'y' });
    ax.clip();
    // slope field
    g.strokeStyle = '#d1d5db';
    g.lineWidth = 1;
    for (let t = 0.25; t < xr[1]; t += 0.4)
      for (let y = 0.2; y < yr[1]; y += 0.3) {
        const k = fExp(t, y);
        const dx = 0.13 / Math.sqrt(1 + k * k);
        line(g, ax.X(t - dx), ax.Y(y - k * dx), ax.X(t + dx), ax.Y(y + k * dx));
      }
    // exact solution
    const ts = [];
    for (let t = 0; t <= xr[1]; t += 0.02) ts.push(t);
    path(g, ax.X, ax.Y, ts, ts.map(truth), { color: C.ink, width: 2 });
    // probes: each slope drawn as an arrow spanning the full step from the start point
    A.probes.forEach((pr, i) => {
      const col = PROBE[i].c;
      // dashed: the trial step from the start point that put this probe where it is
      if (i > 0) {
        g.save();
        g.setLineDash([3, 3]);
        g.strokeStyle = col;
        g.globalAlpha = 0.6;
        line(g, ax.X(t0), ax.Y(y0), ax.X(pr.t), ax.Y(pr.y));
        g.restore();
      }
      // slope at the probe, short tick
      const d = 0.35;
      g.save();
      g.strokeStyle = col;
      g.lineWidth = 3;
      line(g, ax.X(pr.t - d), ax.Y(pr.y - pr.k * d), ax.X(pr.t + d), ax.Y(pr.y + pr.k * d));
      g.restore();
      dot(g, ax.X(pr.t), ax.Y(pr.y), 4, col);
    });
    // Euler endpoint and RK4 endpoint
    arrow(g, ax.X(t0), ax.Y(y0), ax.X(t0 + hh), ax.Y(A.yEuler), C.red, 1.5);
    arrow(g, ax.X(t0), ax.Y(y0), ax.X(t0 + hh), ax.Y(A.yRK4), C.ink, 2);
    dot(g, ax.X(t0 + hh), ax.Y(truth(t0 + hh)), 5, '#fff');
    g.strokeStyle = C.ink;
    g.lineWidth = 1.5;
    g.beginPath();
    g.arc(ax.X(t0 + hh), ax.Y(truth(t0 + hh)), 5, 0, Math.PI * 2);
    g.stroke();
    dot(g, ax.X(t0), ax.Y(y0), 6, C.ink);
    ax.unclip();
    legend(g, [[C.red, 'Euler (slope 1 only)'], [C.ink, easy ? 'RK4 (weighted average)' : 'RK4: (k₁+2k₂+2k₃+k₄)/6']], 40, 24);

    // table
    q('[data-rows]').innerHTML =
      A.probes
        .map(
          (pr, i) =>
            `<tr><td class="py-0.5"><span style="color:${PROBE[i].c}">●</span> ${easy ? PROBE[i].easy : `${PROBE[i].name} at t = ${pr.t.toFixed(2)}`}</td><td class="text-right">${pr.k.toFixed(3)}</td><td class="text-right text-gray-500">× ${i === 0 || i === 3 ? 1 : 2}</td></tr>`
        )
        .join('') + `<tr class="border-t"><td class="py-0.5 font-medium">${easy ? 'Average slope used' : 'weighted slope'}</td><td class="text-right font-medium">${A.k.toFixed(3)}</td><td class="text-right text-gray-500">÷ 6</td></tr>`;
    const yt = truth(t0 + hh);
    const eE = Math.abs(A.yEuler - yt);
    const eR = Math.abs(A.yRK4 - yt);
    q('[data-sum]').innerHTML = `
      <div><span class="text-red-500 font-medium">Euler</span> misses by ${eE.toFixed(3)}</div>
      <div><span class="font-medium">RK4</span> misses by ${eR < 1e-3 ? eR.toExponential(1) : eR.toFixed(3)}</div>
      <div class="text-gray-500 mt-1">${eR > 0 ? `${easy ? 'RK4 lands' : 'RK4 error is'} ${(eE / eR).toFixed(0)}× ${easy ? 'closer' : 'smaller'}, for 4× the work.` : ''}</div>`;
  }

  let dragging = false;
  const onMove = (ev) => {
    if (!dragging) return;
    const [px] = canvasPoint(cv, ev, W, H);
    t0 = Math.min(xr[1] - 0.1, Math.max(0, xr[0] + ((px - box.x) / box.w) * (xr[1] - xr[0])));
    draw();
  };
  cv.onpointerdown = (ev) => {
    dragging = true;
    cv.setPointerCapture(ev.pointerId);
    onMove(ev);
  };
  cv.onpointermove = onMove;
  cv.onpointerup = () => (dragging = false);
  q('[data-h]').oninput = draw;
  listen(window, 'levelchange', draw);
  draw();
}

// ---------------------------------------------------------------- convergence
// Global error at t = 6 for y' = y cos t, over a range of step sizes.
export function mountConvergence(root) {
  root.innerHTML = '<canvas></canvas>';
  const cv = root.querySelector('canvas');
  const W = 420;
  const H = 300;
  const g = setupCanvas(cv, W, H);
  cv.style.maxWidth = `${W * 1.3}px`;
  const T = 6;
  const yT = Math.exp(Math.sin(T));
  const f = (t, s, d) => {
    d[0] = s[0] * Math.cos(t);
  };
  const hs = [];
  for (let e = -4.3; e <= -0.2; e += 0.1) hs.push(10 ** e);
  const errs = { euler: [], rk4: [] };
  for (const [name, make] of [
    ['euler', makeEuler],
    ['rk4', makeRK4],
  ]) {
    const step = make(1);
    for (const hh of hs) {
      const n = Math.round(T / hh);
      const dt = T / n;
      const y = new Float64Array([1]);
      for (let k = 0; k < n; k++) step(f, k * dt, y, dt);
      errs[name].push(Math.max(1e-16, Math.abs(y[0] - yT)));
    }
  }
  const draw = () => {
    g.clearRect(0, 0, W, H);
    const ax = axes(g, { x: 44, y: 10, w: W - 54, h: H - 46 }, { xr: [hs[0], hs[hs.length - 1]], yr: [1e-16, 10], xlog: true, ylog: true, xLabel: 'step size h', yLabel: 'global error at t = 6' });
    ax.clip();
    path(g, ax.X, ax.Y, hs, errs.euler, { color: C.red, width: 2 });
    path(g, ax.X, ax.Y, hs, errs.rk4, { color: C.blue, width: 2 });
    // reference slopes through a point on each curve
    const ref = (k, i, p) => hs.map((hh) => errs[k][i] * (hh / hs[i]) ** p);
    path(g, ax.X, ax.Y, hs, ref('euler', 28, 1), { color: C.red, dash: [4, 3], width: 1, alpha: 0.6 });
    path(g, ax.X, ax.Y, hs, ref('rk4', 34, 4), { color: C.blue, dash: [4, 3], width: 1, alpha: 0.6 });
    ax.unclip();
    legend(g, [[C.red, 'Euler (slope 1)'], [C.blue, 'RK4 (slope 4)']], 52, 24);
    label(g, 'flat floor = rounding error in 64-bit floats', 52, H - 44, { color: C.faint });
  };
  draw();
}
