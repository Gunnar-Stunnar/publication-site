// Section 5: one connection. Neuron A's spikes kick a synaptic current into
// neuron B, which is an LIF cell:
//   C dV/dt = -gL (V - EL) + I_syn,   τ_s dI_syn/dt = -I_syn,   A spike: I_syn += w·J
import { makeRK4 } from '../sim/rk4.js';
import { C, setupCanvas, lv, isEasy, slider, animate, listen } from '../ui/common.js';
import { path, label, line } from '../ui/plot.js';

const P = { C: 200, gL: 10, EL: -65, VT: -50, Vr: -65, tRef: 2, J: 500 };
const WIN = 200;
const DT = 0.1;

export function mountSynapse(root) {
  root.innerHTML = `
  <div class="flex flex-wrap items-center gap-x-4 gap-y-2 mb-3">
    <button data-fire class="px-4 py-1 rounded text-white bg-blue-500 hover:bg-blue-600">${lv('Fire A', 'Spike A')}</button>
    ${slider(lv('A fires on its own', 'A Poisson rate'), 'data-rate min="0" max="100" step="5" value="0"', 'data-ratev')}
    ${slider(lv('Connection strength', 'Weight w'), 'data-w min="0" max="3" step="0.1" value="1"', 'data-wv')}
    ${slider(lv('How long a kick lasts', 'τ<sub>s</sub>'), 'data-tau min="1" max="20" step="0.5" value="5"', 'data-tauv')}
  </div>
  <canvas data-c></canvas>
  <div class="text-sm text-gray-600 mt-2">${lv('Click Fire A a few times quickly. One kick is not enough. Several close together add up.', 'Try three quick spikes: one PSP is ~8 mV, so B needs temporal summation to reach θ.')}</div>`;
  const q = root.querySelector.bind(root);
  const W = 760;
  const H = 300;
  const g = setupCanvas(q('[data-c]'), W, H);
  const step = makeRK4(2);
  const y = new Float64Array([P.EL, 0]);
  let t = 0;
  let refUntil = -1;
  const n = WIN / DT;
  const vs = new Float32Array(n).fill(P.EL);
  const is = new Float32Array(n);
  const aSp = [];
  const bSp = [];
  let tauS = 5;
  const f = (tt, s, d) => {
    d[0] = (-P.gL * (s[0] - P.EL) + s[1]) / P.C;
    d[1] = -s[1] / tauS;
  };
  const w = () => Number(q('[data-w]').value);

  function fireA() {
    y[1] += w() * P.J;
    aSp.push(t);
  }
  function advance(ms) {
    const rate = Number(q('[data-rate]').value);
    for (let k = 0, m = Math.round(ms / DT); k < m; k++) {
      if (Math.random() < (rate * DT) / 1000) fireA();
      if (t < refUntil) {
        y[0] = P.Vr;
        // the synaptic current keeps decaying through the refractory period
        y[1] *= Math.exp(-DT / tauS);
      } else step(f, t, y, DT);
      t += DT;
      if (y[0] >= P.VT) {
        y[0] = P.Vr;
        refUntil = t + P.tRef;
        bSp.push(t);
      }
      const i = Math.round(t / DT) % n;
      vs[i] = y[0];
      is[i] = y[1];
    }
    while (aSp.length && aSp[0] < t - WIN) aSp.shift();
    while (bSp.length && bSp[0] < t - WIN) bSp.shift();
  }

  function draw() {
    const easy = isEasy();
    tauS = Number(q('[data-tau]').value);
    q('[data-ratev]').textContent = `${q('[data-rate]').value} Hz`;
    q('[data-wv]').textContent = w().toFixed(1);
    q('[data-tauv]').textContent = `${tauS} ms`;
    g.clearRect(0, 0, W, H);
    const L = 110;
    const X = (tt) => L + ((tt - (t - WIN)) / WIN) * (W - L - 10);
    const now = Math.round(t / DT);
    const series = (arr) => {
      const xs = [];
      const ys = [];
      for (let k = 0; k < n; k++) {
        const idx = now - n + 1 + k;
        if (idx < 0) continue;
        xs.push(t - WIN + k * DT);
        ys.push(arr[idx % n]);
      }
      return [xs, ys];
    };
    // A's spikes
    g.fillStyle = C.panel;
    g.fillRect(L, 8, W - L - 10, 26);
    label(g, easy ? 'A fires' : 'A spikes', L - 8, 25, { align: 'right', color: C.blue, bold: true });
    g.strokeStyle = C.blue;
    g.lineWidth = 2;
    for (const s of aSp) line(g, X(s), 11, X(s), 31);
    // synaptic current
    g.fillStyle = C.panel;
    g.fillRect(L, 44, W - L - 10, 70);
    const [xs, ys] = series(is);
    const ia = { X, Y: (v) => 44 + 70 - (Math.min(v, 2000) / 2000) * 70 };
    path(g, ia.X, ia.Y, xs, ys, { color: C.orange, width: 1.6 });
    label(g, easy ? 'kick into B (pA)' : 'I_syn (pA)', L - 8, 84, { align: 'right', color: C.orange, bold: true });
    // V of B
    const vb = { X, Y: (v) => 130 + 140 - ((v + 70) / 60) * 140 };
    g.fillStyle = C.panel;
    g.fillRect(L, 130, W - L - 10, 140);
    g.save();
    g.setLineDash([4, 3]);
    g.strokeStyle = C.red;
    g.globalAlpha = 0.6;
    line(g, L, vb.Y(P.VT), W - 10, vb.Y(P.VT));
    g.restore();
    const [xv, yv] = series(vs);
    path(g, vb.X, vb.Y, xv, yv, { color: C.ink, width: 1.6 });
    g.strokeStyle = C.ink;
    g.lineWidth = 1.5;
    for (const s of bSp) line(g, X(s), vb.Y(P.VT), X(s), vb.Y(-12));
    label(g, easy ? 'B voltage' : 'V_B (mV)', L - 8, 200, { align: 'right', bold: true });
    for (const v of [-65, -50, -20]) label(g, String(v), L - 4, vb.Y(v) + 3, { align: 'right' });
    label(g, easy ? 'firing line' : 'θ', W - 14, vb.Y(P.VT) - 5, { align: 'right', color: C.red });
    label(g, `−${WIN} ms`, L, H - 12);
    label(g, 'now', W - 10, H - 12, { align: 'right' });
    label(g, `B fired ${bSp.length}× in the last ${WIN} ms`, L + (W - L) / 2, H - 12, { align: 'center' });
  }

  animate(root, (dt) => {
    advance(dt * 0.1); // a tenth of real time, so two quick clicks land ~15 ms apart
    draw();
  });
  q('[data-fire]').onclick = fireA;
  listen(window, 'levelchange', draw);
  draw();
}
