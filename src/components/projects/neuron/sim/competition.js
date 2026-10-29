// The finale: one LIF neuron listening to 400 Poisson inputs, all firing at
// 20 Hz. Half of them secretly share a hidden source: each copies the source's
// spikes with probability c, and makes up the rest of its rate on its own.
// Nothing about a single input's rate gives the group away; only the timing
// does. Additive STDP finds them (after Song, Miller & Abbott 2000).
// V and the synaptic current are integrated with RK4 from rk4.js.
import { makeRK4 } from './rk4.js';
import { mulberry32 } from '../../doom/rng.js';

export const COMPETITION = {
  N: 400,
  nCorr: 200, // inputs 0..nCorr-1 listen to the hidden source
  rate: 20, // Hz, every input
  c: 0.2, // fraction of a correlated input's spikes copied from the source
  dt: 0.25, // ms
  tauM: 10, // ms
  tauS: 2, // ms
  EL: -70,
  VT: -54,
  Vr: -70,
  tRef: 2,
  J: 2, // mV of synaptic drive per spike at w = 1
  w0: 0.5,
  wMax: 1,
  Ap: 0.005, // LTP step
  B: 1.05, // LTD/LTP ratio; > 1 means depression wins for uncorrelated timing
  tauP: 20,
  tauMinus: 20,
};

export class CompetitionNeuron {
  constructor(seed = 1, p = COMPETITION) {
    this.p = p;
    this.rng = mulberry32(seed);
    this.reset();
  }

  reset() {
    const { p } = this;
    this.w = new Float64Array(p.N).fill(p.w0);
    // Presynaptic traces x_i decay between spikes, so each is stored with the
    // time it was last brought up to date; dx/dt = -x/tau has an exact solution.
    this.x = new Float64Array(p.N);
    this.xT = new Float64Array(p.N);
    this.yPost = 0; // postsynaptic trace y
    this.y = new Float64Array([p.EL, 0]); // V, I
    this.t = 0;
    this.refUntil = -1;
    this.step = makeRK4(2);
    this.f = (t, s, d) => {
      d[0] = (-(s[0] - p.EL) + s[1]) / p.tauM;
      d[1] = -s[1] / p.tauS;
    };
    this.preLog = []; // flat [t, i, t, i, ...] for the raster
    this.postLog = [];
    this.srcLog = [];
    this.wHist = [[0, p.w0, p.w0]]; // [s, mean w correlated, mean w independent]
    this.active = { pre: 0, post: 0, ltd: 0, ltp: 0 }; // for the equation panel
  }

  trace(i) {
    const d = this.t - this.xT[i];
    if (d > 0) {
      this.x[i] *= Math.exp(-d / this.p.tauP);
      this.xT[i] = this.t;
    }
    return this.x[i];
  }

  poisson(lambda) {
    let k = 0;
    let q = Math.exp(-lambda);
    let s = q;
    const u = this.rng();
    while (u > s && k < 100) {
      k++;
      q *= lambda / k;
      s += q;
    }
    return k;
  }

  pre(i) {
    const { p } = this;
    this.y[1] += this.w[i] * p.J;
    // LTD: this input arrives after output spikes (post-before-pre), read off y
    if (this.yPost > 1e-3) {
      this.w[i] = Math.max(0, this.w[i] - p.Ap * p.B * this.yPost);
      this.active.ltd++;
    }
    this.trace(i);
    this.x[i] += 1;
    this.active.pre++;
    this.preLog.push(this.t, i);
  }

  post() {
    const { p } = this;
    // LTP: every input's trace says how recently (and how often) it fired before this spike
    for (let i = 0; i < p.N; i++) {
      const xi = this.trace(i);
      if (xi > 1e-4) this.w[i] = Math.min(p.wMax, this.w[i] + p.Ap * xi);
    }
    this.yPost += 1;
    this.active.post++;
    this.active.ltp++;
    this.postLog.push(this.t);
  }

  tick() {
    const { p } = this;
    const pr = (p.rate * p.dt) / 1000;
    // the hidden source, and the correlated inputs that copy this spike of it
    if (this.rng() < pr) {
      this.srcLog.push(this.t);
      for (let i = 0; i < p.nCorr; i++) if (this.rng() < p.c) this.pre(i);
    }
    // independent spikes: correlated inputs top up to 20 Hz, the others are pure Poisson
    let k = this.poisson(p.nCorr * pr * (1 - p.c));
    while (k--) this.pre(Math.floor(this.rng() * p.nCorr));
    const nInd = p.N - p.nCorr;
    k = this.poisson(nInd * pr);
    while (k--) this.pre(p.nCorr + Math.floor(this.rng() * nInd));

    if (this.t < this.refUntil) this.y[0] = p.Vr;
    else this.step(this.f, this.t, this.y, p.dt);
    this.yPost *= Math.exp(-p.dt / p.tauMinus);
    this.t += p.dt;
    if (this.y[0] >= p.VT) {
      this.y[0] = p.Vr;
      this.refUntil = this.t + p.tRef;
      this.post();
    }
  }

  meanW(from, to) {
    let s = 0;
    for (let i = from; i < to; i++) s += this.w[i];
    return s / (to - from);
  }

  run(ms) {
    const { p } = this;
    const n = Math.round(ms / p.dt);
    for (let k = 0; k < n; k++) {
      this.tick();
      if (Math.round(this.t / p.dt) % 2000 === 0) {
        this.wHist.push([this.t / 1000, this.meanW(0, p.nCorr), this.meanW(p.nCorr, p.N)]);
        if (this.wHist.length > 2000) this.wHist.splice(0, 2);
      }
    }
    // keep only what the raster can show
    const cut = this.t - 2000;
    let j = 0;
    while (j < this.preLog.length && this.preLog[j] < cut) j += 2;
    if (j) this.preLog.splice(0, j);
    while (this.srcLog.length && this.srcLog[0] < cut) this.srcLog.shift();
    while (this.postLog.length > 5000) this.postLog.shift();
  }

  // Output rate over the last second, and the fraction of output spikes that
  // came within 5 ms of a hidden-source spike.
  stats() {
    const from = this.t - 1000;
    const recent = this.postLog.filter((s) => s >= from);
    let locked = 0;
    for (const s of recent) if (this.srcLog.some((q) => s >= q && s - q < 5)) locked++;
    return { rate: recent.length, locked: recent.length ? locked / recent.length : 0 };
  }
}
