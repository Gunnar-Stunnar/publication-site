// The hero scope and Section 3: the leaky integrate-and-fire neuron.
//   C dV/dt = -gL (V - EL) + I,   V ≥ θ → spike, V ← Vr, silent for t_ref.
// Units: ms, mV, pF, nS, pA.
import { makeRK4 } from '../sim/rk4.js';
import { runIF } from '../sim/models.js';
import { gaussian } from '../../doom/rng.js';
import { C, setupCanvas, lv, isEasy, btn, slider, animate, listen } from '../ui/common.js';
import { axes, path, dot, label, legend, line } from '../ui/plot.js';

const BASE = { C: 200, gL: 10, EL: -65, VT: -50, Vr: -65, tRef: 2 };

// ---------------------------------------------------------------- hero
export function mountHero(root) {
  root.innerHTML = `
  <canvas data-c class="touch-none select-none cursor-pointer"></canvas>
  <div class="flex flex-wrap items-center gap-3 mt-2">
    <button data-hold class="px-4 py-1.5 rounded text-white bg-blue-500 hover:bg-blue-600 select-none touch-none">${lv('Hold to push current in', 'Hold to inject current')}</button>
    <span data-rate class="text-sm text-gray-600 tabular-nums"></span>
  </div>`;
  const q = root.querySelector.bind(root);
  const W = 760;
  const H = 220;
  const cv = q('[data-c]');
  const g = setupCanvas(cv, W, H);
  const WIN = 1000; // ms shown
  const DT = 0.1;
  const p = BASE;
  const step = makeRK4(1);
  let I = 0;
  let held = false;
  const y = new Float64Array([p.EL]);
  let t = 0;
  let refUntil = -1;
  const vs = new Float32Array(WIN / DT);
  const spikes = [];
  const f = (tt, s, d) => {
    d[0] = (-p.gL * (s[0] - p.EL) + I) / p.C;
  };
  let noise = 0;

  function advance(ms) {
    const n = Math.round(ms / DT);
    for (let k = 0; k < n; k++) {
      // the button ramps current up and down instead of switching it
      const target = held ? 320 : 130;
      noise += (-noise * DT) / 5 + 9 * Math.sqrt(DT) * gaussian(Math.random);
      I += ((target - I) * DT) / 30;
      const Itot = I + noise * 6;
      if (t < refUntil) y[0] = p.Vr;
      else {
        const keep = I;
        I = Itot;
        step(f, t, y, DT);
        I = keep;
      }
      t += DT;
      if (y[0] >= p.VT) {
        y[0] = p.Vr;
        refUntil = t + p.tRef;
        spikes.push(t);
      }
      vs[Math.round(t / DT) % vs.length] = y[0];
    }
    while (spikes.length && spikes[0] < t - WIN) spikes.shift();
  }

  function draw() {
    const easy = isEasy();
    g.clearRect(0, 0, W, H);
    const ax = axes(g, { x: 40, y: 10, w: W - 50, h: H - 40 }, { xr: [-WIN, 0], yr: [-75, 25], xLabel: easy ? 'milliseconds ago' : 't − now (ms)', yLabel: easy ? 'voltage (mV)' : 'V (mV)' });
    ax.clip();
    g.save();
    g.setLineDash([4, 3]);
    g.strokeStyle = C.red;
    g.globalAlpha = 0.5;
    line(g, ax.X(-WIN), ax.Y(p.VT), ax.X(0), ax.Y(p.VT));
    g.restore();
    const n = vs.length;
    const now = Math.round(t / DT);
    g.strokeStyle = C.blue;
    g.lineWidth = 1.5;
    g.beginPath();
    for (let k = 0; k < n; k++) {
      const idx = now - n + 1 + k;
      if (idx < 0) continue;
      const px = ax.X(-WIN + k * DT);
      const py = ax.Y(vs[idx % n]);
      if (k === 0 || idx === 0) g.moveTo(px, py);
      else g.lineTo(px, py);
    }
    g.stroke();
    // spikes are drawn on as straight lines: the model itself only resets
    g.strokeStyle = C.ink;
    g.lineWidth = 1.5;
    for (const s of spikes) line(g, ax.X(s - t), ax.Y(p.VT), ax.X(s - t), ax.Y(20));
    ax.unclip();
    label(g, easy ? 'firing line' : 'threshold θ', ax.X(-WIN) + 6, ax.Y(p.VT) - 5, { color: C.red });
    const recent = spikes.filter((s) => s > t - 1000).length;
    q('[data-rate]').textContent = `${recent} ${easy ? 'spikes in the last second' : 'Hz'} · ${easy ? 'input' : 'I'} ≈ ${Math.round(I)} pA`;
  }

  animate(root, (dt) => {
    advance(dt * 0.5); // half speed: 500 ms of neuron per second
    draw();
  });
  const hold = q('[data-hold]');
  const down = (ev) => {
    ev.preventDefault();
    held = true;
  };
  const up = () => (held = false);
  for (const el of [hold, cv]) {
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointerleave', up);
    el.addEventListener('pointercancel', up);
  }
  listen(window, 'levelchange', draw);
  for (let k = 0; k < 10; k++) advance(100);
}

// ---------------------------------------------------------------- LIF scope + f–I
// Exact time to go from Vr to θ under constant I (no input-free regime).
const isiExact = (p, I) => {
  const tau = p.C / p.gL;
  const vInf = p.EL + I / p.gL;
  if (vInf <= p.VT) return Infinity;
  return p.tRef + tau * Math.log((vInf - p.Vr) / (vInf - p.VT));
};

export function mountLIF(root) {
  root.innerHTML = `
  <div class="flex flex-wrap items-center gap-x-4 gap-y-2 mb-3">
    ${slider(lv('Input current', 'Input I'), 'data-i min="0" max="600" step="5" value="220"', 'data-iv')}
    ${slider(lv('Leakiness (time constant)', 'τ = C/g<sub>L</sub>'), 'data-tau min="5" max="50" step="1" value="20"', 'data-tauv')}
    ${slider(lv('Firing line', 'Threshold θ'), 'data-th min="-60" max="-40" step="1" value="-50"', 'data-thv')}
    ${slider(lv('Rest after a spike', 'Refractory t<sub>ref</sub>'), 'data-ref min="0" max="10" step="0.5" value="2"', 'data-refv')}
  </div>
  <div class="grid lg:grid-cols-5 gap-6">
    <div class="lg:col-span-3"><canvas data-v></canvas></div>
    <div class="lg:col-span-2"><canvas data-fi></canvas>
      <div class="flex gap-2 mt-2">${btn(lv('Measure the whole curve', 'Sweep I and measure'), 'data-sweep')}</div></div>
  </div>`;
  const q = root.querySelector.bind(root);
  const W = 520;
  const H = 280;
  const FW = 320;
  const FH = 280;
  const gv = setupCanvas(q('[data-v]'), W, H);
  const gf = setupCanvas(q('[data-fi]'), FW, FH);
  q('[data-v]').style.maxWidth = `${W * 1.3}px`;
  q('[data-fi]').style.maxWidth = `${FW * 1.3}px`;
  const T = 400;
  const ON = [50, 350];
  let dots = [];
  let sweepI = null;

  const params = () => {
    const tau = Number(q('[data-tau]').value);
    return { ...BASE, C: tau * BASE.gL, VT: Number(q('[data-th]').value), tRef: Number(q('[data-ref]').value) };
  };
  const curI = () => Number(q('[data-i]').value);

  function draw() {
    const easy = isEasy();
    const p = params();
    const I0 = curI();
    q('[data-iv]').textContent = `${I0} pA`;
    q('[data-tauv]').textContent = `${(p.C / p.gL).toFixed(0)} ms`;
    q('[data-thv]').textContent = `${p.VT} mV`;
    q('[data-refv]').textContent = `${p.tRef} ms`;
    const r = runIF('lif', p, (t) => (t >= ON[0] && t < ON[1] ? I0 : 0), T, 0.05);

    gv.clearRect(0, 0, W, H);
    const ax = axes(gv, { x: 40, y: 10, w: W - 50, h: H - 70 }, { xr: [0, T], yr: [-72, 25], xTickLabels: false, yLabel: easy ? 'voltage (mV)' : 'V (mV)' });
    ax.clip();
    gv.save();
    gv.setLineDash([4, 3]);
    gv.strokeStyle = C.red;
    gv.globalAlpha = 0.6;
    line(gv, ax.X(0), ax.Y(p.VT), ax.X(T), ax.Y(p.VT));
    gv.strokeStyle = C.faint;
    line(gv, ax.X(0), ax.Y(p.EL + I0 / p.gL), ax.X(T), ax.Y(p.EL + I0 / p.gL));
    gv.restore();
    path(gv, ax.X, ax.Y, r.ts, r.vs, { color: C.blue, width: 1.6 });
    gv.strokeStyle = C.ink;
    for (const s of r.spikes) line(gv, ax.X(s), ax.Y(p.VT), ax.X(s), ax.Y(20));
    ax.unclip();
    label(gv, easy ? 'firing line' : 'θ', ax.X(T) - 4, ax.Y(p.VT) - 5, { color: C.red, align: 'right' });
    const vInf = p.EL + I0 / p.gL;
    if (vInf < 20) label(gv, easy ? 'where it would settle without the firing line' : 'V∞ = E_L + I/g_L', ax.X(T) - 4, ax.Y(vInf) + (vInf > p.VT ? -5 : 12), { color: C.faint, align: 'right' });
    // input current strip
    const iy0 = H - 44;
    gv.fillStyle = C.panel;
    gv.fillRect(40, iy0, W - 50, 18);
    gv.fillStyle = C.orange;
    gv.fillRect(ax.X(ON[0]), iy0 + 18 - Math.min(18, (I0 / 600) * 18), ax.X(ON[1]) - ax.X(ON[0]), Math.min(18, (I0 / 600) * 18));
    label(gv, easy ? 'input' : 'I(t)', 36, iy0 + 13, { align: 'right' });
    label(gv, 'time (ms)', 40 + (W - 50) / 2, H - 6, { align: 'center' });
    for (const tt of [0, 100, 200, 300, 400]) label(gv, String(tt), ax.X(tt), iy0 + 30, { align: 'center' });

    // f–I
    gf.clearRect(0, 0, FW, FH);
    const bx = axes(gf, { x: 40, y: 10, w: FW - 50, h: FH - 46 }, { xr: [0, 600], yr: [0, 200], xLabel: easy ? 'input current (pA)' : 'I (pA)', yLabel: easy ? 'spikes per second' : 'rate (Hz)' });
    bx.clip();
    const Is = [];
    for (let i = 0; i <= 600; i += 2) Is.push(i);
    path(gf, bx.X, bx.Y, Is, Is.map((i) => 1000 / isiExact(p, i)), { color: C.faint, width: 1.5, dash: [4, 3] });
    for (const [i, rate] of dots) dot(gf, bx.X(i), bx.Y(rate), 3, C.blue, 0.8);
    const ownRate = r.spikes.length > 1 ? 1000 / ((r.spikes[r.spikes.length - 1] - r.spikes[0]) / (r.spikes.length - 1)) : 0;
    dot(gf, bx.X(I0), bx.Y(ownRate), 5, C.orange);
    bx.unclip();
    const rheo = (p.VT - p.EL) * p.gL;
    gf.save();
    gf.strokeStyle = C.red;
    gf.setLineDash([2, 3]);
    line(gf, bx.X(rheo), bx.Y(0), bx.X(rheo), bx.Y(200));
    gf.restore();
    label(gf, easy ? `needs ${rheo} pA to fire at all` : `rheobase ${rheo} pA`, bx.X(rheo) + 4, 26, { color: C.red });
    legend(gf, [[C.faint, easy ? 'formula' : 'exact', true]], bx.X(rheo) + 4, 42);
  }

  // Sweep the current and measure each rate by running the neuron for a second.
  q('[data-sweep]').onclick = () => {
    dots = [];
    sweepI = 0;
  };
  animate(root, () => {
    if (sweepI === null) return;
    const p = params();
    for (let k = 0; k < 3 && sweepI <= 600; k++, sweepI += 10) {
      const r = runIF('lif', p, () => sweepI, 1000, 0.1, { record: false });
      dots.push([sweepI, r.spikes.length > 1 ? 1000 / ((r.spikes[r.spikes.length - 1] - r.spikes[0]) / (r.spikes.length - 1)) : 0]);
    }
    if (sweepI > 600) sweepI = null;
    draw();
  });
  for (const k of ['i', 'tau', 'th', 'ref'])
    q(`[data-${k}]`).oninput = () => {
      if (k !== 'i') dots = [];
      draw();
    };
  listen(window, 'levelchange', draw);
  draw();
}

// ---------------------------------------------------------------- spike timing vs step size
// Constant input, so every spike time is known exactly. Compare naive
// threshold checking (spike at the end of the step) with interpolation.
export function mountSpikeTiming(root) {
  root.innerHTML = `
  <div class="flex flex-wrap items-center gap-x-4 gap-y-2 mb-3">
    ${slider('Step h', 'data-h min="0.05" max="2" step="0.05" value="1"', 'data-hv')}
  </div>
  <canvas data-c></canvas>`;
  const q = root.querySelector.bind(root);
  const W = 680;
  const H = 230;
  const g = setupCanvas(q('[data-c]'), W, H);
  q('[data-c]').style.maxWidth = `${W * 1.2}px`;
  const p = { ...BASE, tRef: 0 };
  const I0 = 260;
  const T = 300;
  const isi = isiExact(p, I0);
  const exact = [];
  for (let s = isi; s < T; s += isi) exact.push(s);

  function draw() {
    const h = Number(q('[data-h]').value);
    q('[data-hv]').textContent = `${h.toFixed(2)} ms`;
    const naive = runIF('lif', p, () => I0, T, h, { record: false, interpolate: false }).spikes;
    const interp = runIF('lif', p, () => I0, T, h, { record: false, interpolate: true }).spikes;
    g.clearRect(0, 0, W, H);
    const rows = [
      ['exact', exact, C.ink],
      ['spike at end of step', naive, C.red],
      ['interpolated crossing', interp, C.blue],
    ];
    const L = 150;
    const X = (t) => L + (t / T) * (W - L - 10);
    rows.forEach(([name, sp, col], r) => {
      const y0 = 14 + r * 44;
      g.fillStyle = C.panel;
      g.fillRect(L, y0, W - L - 10, 30);
      label(g, name, L - 8, y0 + 19, { align: 'right', color: col, bold: true });
      g.strokeStyle = col;
      g.lineWidth = 2;
      for (const s of sp) line(g, X(s), y0 + 3, X(s), y0 + 27);
      if (r > 0) {
        g.strokeStyle = C.ink;
        g.globalAlpha = 0.25;
        g.lineWidth = 1;
        for (const s of exact) line(g, X(s), y0, X(s), y0 + 30);
        g.globalAlpha = 1;
      }
    });
    const err = (sp) => {
      const n = Math.min(sp.length, exact.length);
      let m = 0;
      for (let i = 0; i < n; i++) m = Math.max(m, Math.abs(sp[i] - exact[i]));
      return { m, last: n ? sp[n - 1] - exact[n - 1] : 0, count: sp.length };
    };
    const en = err(naive);
    const ei = err(interp);
    label(g, `worst spike-time error: end of step ${en.m.toFixed(3)} ms · interpolated ${ei.m < 1e-3 ? ei.m.toExponential(1) : ei.m.toFixed(3)} ms`, L, 160, { color: C.ink });
    label(g, `spikes in 300 ms: exact ${exact.length}, end of step ${en.count}, interpolated ${ei.count}`, L, 176);
    label(g, 'Grey ticks: exact times. With large steps, waiting for the end of the step delays every spike and the delays add up.', L, 200);
    for (const tt of [0, 100, 200, 300]) label(g, `${tt} ms`, X(tt), 146, { align: 'center' });
  }
  q('[data-h]').oninput = draw;
  draw();
}
