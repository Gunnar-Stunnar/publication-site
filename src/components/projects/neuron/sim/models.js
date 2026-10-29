// Neuron models in one set of units: ms, mV, pF, nS, pA (so pF·mV/ms = pA).
// Each integrate-and-fire model is a membrane equation plus a reset rule.
// The integration itself is always the RK4 stepper from rk4.js.
import { makeRK4 } from './rk4.js';

// Exponent guard: the EIF upswing diverges on purpose, and an RK4 probe
// overshooting past the peak must not turn into Infinity.
const safeExp = (x) => Math.exp(Math.min(x, 30));

// Shared single-cell parameters for the spike-anatomy comparison, chosen so
// that every model rests at -65 mV and starts firing near -50 mV.
export const CELL = { C: 200, gL: 10, EL: -65, VT: -50, Vr: -70, dT: 2, Vpeak: 30, tRef: 2, a: 2, tauW: 100, b: 60 };

// dV/dt from the intrinsic (input-free) part of each model, as a function of V.
// The shape of this curve is the shape of the spike's upstroke.
export const intrinsic = {
  lif: (V, p) => (-p.gL * (V - p.EL)) / p.C,
  // QIF tuned so its slope at rest matches the leak: k(V-EL)(V-Vc) with k = gL/(Vc-EL)
  qif: (V, p) => ((p.gL / (p.VT - p.EL)) * (V - p.EL) * (V - p.VT)) / p.C,
  eif: (V, p) => (-p.gL * (V - p.EL) + p.gL * p.dT * safeExp((V - p.VT) / p.dT)) / p.C,
  adex: (V, p) => (-p.gL * (V - p.EL) + p.gL * p.dT * safeExp((V - p.VT) / p.dT)) / p.C,
};

// Where each model is cut off and reset. LIF has a hard threshold; the others
// diverge by themselves and are cut at a peak.
export const spikeAt = { lif: (p) => p.VT, qif: (p) => p.Vpeak, eif: () => 0, adex: () => 0 };

// Integrate an IF model with state [V, w] under input current I(t).
// Threshold crossings are located by linear interpolation inside the step
// (the reset is a discontinuity RK4 can't see on its own).
export function runIF(kind, p, I, T, h = 0.05, { record = true, interpolate = true } = {}) {
  const step = makeRK4(2);
  const y = new Float64Array([p.EL, 0]);
  const adapt = kind === 'adex' || p.adaptive;
  const dV = intrinsic[kind];
  const thr = spikeAt[kind](p);
  // V is held at the cutoff inside the derivative: on the upswing an RK4 probe
  // can land far past the peak, and that should read as "spiked", not as a
  // huge current that drags w along with it.
  const f = (t, s, d) => {
    const V = Math.min(s[0], thr);
    d[0] = dV(V, p) + (I(t) - (adapt ? s[1] : 0)) / p.C;
    d[1] = adapt ? (p.a * (V - p.EL) - s[1]) / p.tauW : 0;
  };
  const ts = [];
  const vs = [];
  const ws = [];
  const spikes = [];
  let refUntil = -1;
  const prev = new Float64Array(2);
  for (let t = 0; t < T; t += h) {
    const end = t + h;
    // Integrate whatever part of [t, end] isn't refractory. With interpolation
    // on, a spike inside the step restarts integration from the spike time,
    // so the rest of the step isn't lost.
    let from = t;
    for (let guard = 0; guard < 4; guard++) {
      if (refUntil >= end || (refUntil > from && !interpolate)) {
        y[0] = p.Vr;
        break;
      }
      if (refUntil > from) {
        from = refUntil;
        y[0] = p.Vr;
      }
      const hh = end - from;
      if (hh <= 1e-9) break;
      prev.set(y);
      step(f, from, y, hh);
      if (y[0] < thr && Number.isFinite(y[0])) break;
      let tsp = end;
      if (interpolate) {
        const frac = Number.isFinite(y[0]) ? (thr - prev[0]) / (y[0] - prev[0]) : 0.5;
        tsp = from + hh * frac;
        // redo the step up to the crossing so w is taken at the spike time
        y.set(prev);
        step(f, from, y, tsp - from);
      }
      spikes.push(tsp);
      if (record) {
        ts.push(tsp);
        vs.push(thr);
        ws.push(y[1]);
      }
      y[0] = p.Vr;
      if (adapt) y[1] += p.b;
      refUntil = tsp + p.tRef;
      if (!interpolate) break;
      from = tsp;
    }
    if (record) {
      ts.push(t + h);
      vs.push(y[0]);
      ws.push(y[1]);
    }
  }
  return { ts, vs, ws, spikes };
}

// AdEx firing patterns from Naud, Marcille, Clopath & Gerstner (2008), Table 1.
export const ADEX_PRESETS = {
  tonic: { label: 'Tonic', C: 200, gL: 10, EL: -70, VT: -50, dT: 2, a: 2, tauW: 30, b: 0, Vr: -58, I: 500 },
  adapting: { label: 'Adapting', C: 200, gL: 12, EL: -70, VT: -50, dT: 2, a: 2, tauW: 300, b: 60, Vr: -58, I: 500 },
  initburst: { label: 'Initial burst', C: 130, gL: 18, EL: -58, VT: -50, dT: 2, a: 4, tauW: 150, b: 120, Vr: -50, I: 400 },
  bursting: { label: 'Bursting', C: 200, gL: 10, EL: -58, VT: -50, dT: 2, a: 2, tauW: 120, b: 100, Vr: -46, I: 210 },
  delayed: { label: 'Delayed, accelerating', C: 200, gL: 12, EL: -70, VT: -50, dT: 2, a: -10, tauW: 300, b: 0, Vr: -58, I: 300 },
};

// AdEx right-hand side with the adaptation current, for the phase plane.
export function adexField(p, I) {
  return (V, w) => [
    (-p.gL * (V - p.EL) + p.gL * p.dT * safeExp((V - p.VT) / p.dT) - w + I) / p.C,
    (p.a * (V - p.EL) - w) / p.tauW,
  ];
}

// Hodgkin–Huxley (squid axon, 6.3 °C), the reference spike. Units: ms, mV, µA/cm².
const HH = { C: 1, gNa: 120, gK: 36, gL: 0.3, ENa: 50, EK: -77, EL: -54.387 };
const vtrap = (x, y) => (Math.abs(x / y) < 1e-6 ? y * (1 - x / y / 2) : x / (Math.exp(x / y) - 1));
const am = (V) => 0.1 * vtrap(-(V + 40), 10);
const bm = (V) => 4 * Math.exp(-(V + 65) / 18);
const ah = (V) => 0.07 * Math.exp(-(V + 65) / 20);
const bh = (V) => 1 / (1 + Math.exp(-(V + 35) / 10));
const an = (V) => 0.01 * vtrap(-(V + 55), 10);
const bn = (V) => 0.125 * Math.exp(-(V + 65) / 80);

export function runHH(I, T, h = 0.01) {
  const step = makeRK4(4);
  const V0 = -65;
  const y = new Float64Array([V0, am(V0) / (am(V0) + bm(V0)), ah(V0) / (ah(V0) + bh(V0)), an(V0) / (an(V0) + bn(V0))]);
  const f = (t, s, d) => {
    const [V, m, hh, n] = s;
    const iNa = HH.gNa * m ** 3 * hh * (V - HH.ENa);
    const iK = HH.gK * n ** 4 * (V - HH.EK);
    const iL = HH.gL * (V - HH.EL);
    d[0] = (I(t) - iNa - iK - iL) / HH.C;
    d[1] = am(V) * (1 - m) - bm(V) * m;
    d[2] = ah(V) * (1 - hh) - bh(V) * hh;
    d[3] = an(V) * (1 - n) - bn(V) * n;
  };
  const ts = [];
  const vs = [];
  for (let t = 0; t < T; t += h) {
    step(f, t, y, h);
    ts.push(t + h);
    vs.push(y[0]);
  }
  return { ts, vs };
}
