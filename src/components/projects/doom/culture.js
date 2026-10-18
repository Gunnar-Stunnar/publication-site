// A simulated neuron culture on a multi-electrode array (MEA).
//
// Sensory neurons sit over 7 stimulating electrodes (place code for where the
// enemy is). Motor neurons are read out from 3 recording regions (Left, Right,
// Fire). Every sensory neuron synapses onto every motor neuron.
//
// The culture never receives a reward value. It only receives stimulation.
// Plasticity is gated by how *predictable* the most recent stimulation was:
//   - predictable (low-entropy) input consolidates recent STDP traces,
//     which lowers the entropy of p(action | state)
//   - unpredictable (high-entropy) input scrambles recent traces and pulls
//     them back toward uniform, which raises the entropy of p(action | state)
import { mulberry32, gaussian } from './rng.js';

export const STATES = ['far left', 'mid left', 'near left', 'center', 'near right', 'mid right', 'far right'];
export const STATE_SHORT = ['L3', 'L2', 'L1', 'C', 'R1', 'R2', 'R3'];
export const ACTIONS = ['Left', 'Right', 'Fire'];
export const N_STATES = STATES.length;
export const N_ACTIONS = ACTIONS.length;

export const PHASE = { SENSE: 0, PATTERN: 1, NOISE: 2, IDLE: 3 };

export const CULTURE_DEFAULTS = {
  nPerSensory: 10,
  nPerMotor: 10,
  substeps: 10, // substeps per game tick
  dt: 5, // ms per substep
  sensRateMin: 60, // Hz when the enemy is far
  sensRateMax: 160, // Hz when the enemy is close
  spontRate: 0.5, // Hz background firing of sensory neurons
  stimProb: 0.9, // spike probability when an electrode pulses
  w0: 0.12, // uniform starting weight (the max-entropy prior)
  leak: 0.75,
  theta: 2.5,
  temp: 0.6, // escape-noise temperature: higher = noisier motor neurons
  pMax: 0.5,
  inhib: 0.5, // lateral inhibition between motor regions, per spike
  tauTrace: 20, // ms, STDP trace time constant
  aMinus: 0.5, // LTD / LTP ratio
  eligDecay: 0.9, // eligibility decay per game tick
  eligThresh: 0.2, // traces weaker than this fraction of the strongest are ignored
  eta: 0.08, // consolidation rate under predictable input
  pull: 0.35, // how hard unpredictable input pulls weights toward uniform
  jitter: 0.25, // random scrambling under unpredictable input (x w0)
};

export class Culture {
  constructor(params = {}, seed = 1) {
    this.p = { ...CULTURE_DEFAULTS, ...params };
    const { nPerSensory, nPerMotor } = this.p;
    this.nS = N_STATES * nPerSensory;
    this.nM = N_ACTIONS * nPerMotor;
    this.N = this.nS + this.nM;
    this.W = new Float32Array(this.nS * this.nM);
    this.E = new Float32Array(this.nS * this.nM);

    // Raster history (ring buffer of substeps) for visualisation.
    this.histLen = 600;
    this.hist = new Uint8Array(this.histLen * this.N);
    this.histPhase = new Uint8Array(this.histLen);
    this.histPtr = 0;
    this.lastSpikes = new Uint8Array(this.N);
    this.lastStim = new Uint8Array(N_STATES);

    this.reset(seed);
  }

  reset(seed = 1) {
    this.rng = mulberry32(seed);
    const { w0 } = this.p;
    for (let k = 0; k < this.W.length; k++) this.W[k] = w0 * (1 + 0.05 * gaussian(this.rng));
    for (let i = 0; i < this.nS; i++) this._normalizeRow(i);
    this.E.fill(0);
    this.state = this.freshState();
    this.hist.fill(0);
    this.histPhase.fill(PHASE.IDLE);
  }

  freshState() {
    return {
      v: new Float32Array(this.nM),
      x: new Float32Array(this.nS),
      y: new Float32Array(this.nM),
      mPrev: new Float32Array(N_ACTIONS),
    };
  }

  sensoryPool(i) {
    return Math.floor(i / this.p.nPerSensory);
  }

  motorPool(j) {
    return Math.floor(j / this.p.nPerMotor);
  }

  // Core integrator. `stimAt(t, poolProb, stimFlags)` fills the per-pool spike
  // probability for sensory neurons at substep t. Returns spike counts per motor region.
  _run(nSub, stimAt, { learn = false, record = false, st = this.state, phase = PHASE.SENSE, rng = this.rng } = {}) {
    const P = this.p;
    const { nS, nM, W, E } = this;
    const decay = Math.exp(-P.dt / P.tauTrace);
    const counts = new Float32Array(N_ACTIONS);
    const poolProb = new Float32Array(N_STATES);
    const stimFlags = new Uint8Array(N_STATES);
    const preIdx = new Int32Array(nS);
    const postIdx = new Int32Array(nM);
    const mNow = new Float32Array(N_ACTIONS);
    const { nPerSensory, nPerMotor } = P;

    for (let t = 0; t < nSub; t++) {
      poolProb.fill(0);
      stimFlags.fill(0);
      stimAt(t, poolProb, stimFlags);

      // Sensory spikes
      let nPre = 0;
      for (let i = 0; i < nS; i++) {
        if (rng() < poolProb[(i / nPerSensory) | 0]) preIdx[nPre++] = i;
      }

      // Motor integration with escape noise and lateral inhibition
      const totalPrev = st.mPrev[0] + st.mPrev[1] + st.mPrev[2];
      mNow.fill(0);
      let nPost = 0;
      for (let j = 0; j < nM; j++) {
        let I = 0;
        for (let k = 0; k < nPre; k++) I += W[preIdx[k] * nM + j];
        const a = (j / nPerMotor) | 0;
        const inh = P.inhib * (totalPrev - st.mPrev[a]);
        const v = st.v[j] * P.leak + I - inh;
        const pf = P.pMax / (1 + Math.exp(-(v - P.theta) / P.temp));
        if (rng() < pf) {
          postIdx[nPost++] = j;
          st.v[j] = 0;
          mNow[a] += 1;
        } else {
          st.v[j] = v;
        }
      }
      st.mPrev.set(mNow);
      counts[0] += mNow[0];
      counts[1] += mNow[1];
      counts[2] += mNow[2];

      // STDP eligibility: pre-before-post potentiates, post-before-pre depresses.
      if (learn) {
        for (let i = 0; i < nS; i++) st.x[i] *= decay;
        for (let j = 0; j < nM; j++) st.y[j] *= decay;
        for (let k = 0; k < nPre; k++) {
          const i = preIdx[k];
          st.x[i] += 1;
          const row = i * nM;
          for (let j = 0; j < nM; j++) E[row + j] -= P.aMinus * st.y[j];
        }
        for (let k = 0; k < nPost; k++) {
          const j = postIdx[k];
          st.y[j] += 1;
          for (let i = 0; i < nS; i++) E[i * nM + j] += st.x[i];
        }
      }

      if (record) {
        const base = this.histPtr * this.N;
        this.hist.fill(0, base, base + this.N);
        this.lastSpikes.fill(0);
        for (let k = 0; k < nPre; k++) {
          this.hist[base + preIdx[k]] = 1;
          this.lastSpikes[preIdx[k]] = 1;
        }
        for (let k = 0; k < nPost; k++) {
          this.hist[base + nS + postIdx[k]] = 1;
          this.lastSpikes[nS + postIdx[k]] = 1;
        }
        this.histPhase[this.histPtr] = phase;
        this.lastStim.set(stimFlags);
        this.histPtr = (this.histPtr + 1) % this.histLen;
      }
    }
    return counts;
  }

  // One game tick of sensing: the enemy's sector drives one electrode,
  // proximity sets the pulse rate.
  senseTick(stateIdx, proximity, { learn = true, record = true } = {}) {
    const P = this.p;
    if (learn) for (let k = 0; k < this.E.length; k++) this.E[k] *= P.eligDecay;
    const spont = (P.spontRate * P.dt) / 1000;
    const rate = P.sensRateMin + (P.sensRateMax - P.sensRateMin) * Math.max(0, Math.min(1, proximity));
    const pStim = (rate * P.dt) / 1000;
    return this._run(
      P.substeps,
      (t, prob, flags) => {
        prob.fill(spont);
        if (stateIdx >= 0) {
          prob[stateIdx] = pStim;
          flags[stateIdx] = 1;
        }
      },
      { learn, record, phase: stateIdx >= 0 ? PHASE.SENSE : PHASE.IDLE }
    );
  }

  // One game tick of feedback stimulation. X is a [N_STATES x totalSubsteps]
  // binary matrix of electrode pulses; offset is the substep to start from.
  feedbackTick(X, totalSub, offset, phase, { record = true } = {}) {
    const P = this.p;
    const spont = (P.spontRate * P.dt) / 1000;
    return this._run(
      P.substeps,
      (t, prob, flags) => {
        const tt = offset + t;
        for (let s = 0; s < N_STATES; s++) {
          const on = X[s * totalSub + tt];
          prob[s] = on ? P.stimProb : spont;
          flags[s] = on;
        }
      },
      { learn: false, record, phase }
    );
  }

  chooseAction(counts, rng = this.rng) {
    let best = -1;
    let bestVal = -1;
    let ties = 0;
    for (let a = 0; a < N_ACTIONS; a++) {
      if (counts[a] > bestVal) {
        bestVal = counts[a];
        best = a;
        ties = 1;
      } else if (counts[a] === bestVal) {
        ties++;
        if (rng() < 1 / ties) best = a;
      }
    }
    return best;
  }

  // The plasticity rule. u in [0,1] is the culture's surprise about the
  // feedback stimulation (bits per electrode-bin; 1 bit = maximum entropy).
  // dose scales the scrambling by how long the noise lasted.
  applyFeedback(u, dose = 1) {
    const P = this.p;
    const { nS, nM, W, E } = this;
    let emax = 0;
    for (let k = 0; k < E.length; k++) emax = Math.max(emax, Math.abs(E[k]));
    if (emax < 1e-9) return;
    const inv = 1 / emax;
    for (let i = 0; i < nS; i++) {
      const row = i * nM;
      let mean = 0;
      for (let j = 0; j < nM; j++) mean += W[row + j];
      mean /= nM;
      for (let j = 0; j < nM; j++) {
        const raw = E[row + j] * inv;
        const ae = Math.max(0, Math.abs(raw) - P.eligThresh) / (1 - P.eligThresh);
        const e = Math.sign(raw) * ae;
        const consolidate = P.eta * (1 - u) * e;
        const scramble = u * dose * ae * (P.pull * (mean - W[row + j]) + P.jitter * P.w0 * gaussian(this.rng));
        W[row + j] = Math.max(0, W[row + j] + consolidate + scramble);
      }
      this._normalizeRow(i);
    }
    E.fill(0);
  }

  // Hand-applied feedback: build an artificial eligibility trace and run the
  // same rule. A pattern tags one state->action pairing; noise floods every
  // synapse leaving that state's sensory region (raising the state's entropy).
  sculpt(stateIdx, actionIdx, u) {
    const { nS, nM, E } = this;
    E.fill(0);
    for (let i = 0; i < nS; i++) {
      if (this.sensoryPool(i) !== stateIdx) continue;
      for (let j = 0; j < nM; j++) if (u >= 0.5 || this.motorPool(j) === actionIdx) E[i * nM + j] = 1;
    }
    this.applyFeedback(u, u >= 0.5 ? 2.5 : 1);
  }

  // Homeostasis: each sensory neuron has a fixed synaptic budget, so its
  // outgoing weights behave like a distribution over the motor regions.
  _normalizeRow(i) {
    const { nM, W } = this;
    const row = i * nM;
    let sum = 0;
    for (let j = 0; j < nM; j++) sum += W[row + j];
    const target = nM * this.p.w0;
    const scale = sum > 1e-9 ? target / sum : 1;
    for (let j = 0; j < nM; j++) W[row + j] = sum > 1e-9 ? W[row + j] * scale : this.p.w0;
  }

  // Mean weight from each sensory region to each motor region (7 x 3).
  poolWeights() {
    const { nS, nM, W } = this;
    const out = new Float32Array(N_STATES * N_ACTIONS);
    const cnt = new Float32Array(N_STATES * N_ACTIONS);
    for (let i = 0; i < nS; i++) {
      const s = this.sensoryPool(i);
      for (let j = 0; j < nM; j++) {
        const a = this.motorPool(j);
        out[s * N_ACTIONS + a] += W[i * nM + j];
        cnt[s * N_ACTIONS + a] += 1;
      }
    }
    for (let k = 0; k < out.length; k++) out[k] /= cnt[k];
    return out;
  }

  // Probe trials: present each state with plasticity off and count the
  // actions the culture produces. Estimates p(action | state) empirically.
  probePolicy(trials = 30, proximity = 0.5, rng = mulberry32(12345)) {
    const P = new Float32Array(N_STATES * N_ACTIONS);
    const H = new Float32Array(N_STATES);
    const P_ = this.p;
    const spont = (P_.spontRate * P_.dt) / 1000;
    const rate = P_.sensRateMin + (P_.sensRateMax - P_.sensRateMin) * proximity;
    const pStim = (rate * P_.dt) / 1000;
    for (let s = 0; s < N_STATES; s++) {
      for (let k = 0; k < trials; k++) {
        const st = this.freshState();
        const counts = this._run(
          P_.substeps,
          (t, prob) => {
            prob.fill(spont);
            prob[s] = pStim;
          },
          { st, rng }
        );
        P[s * N_ACTIONS + this.chooseAction(counts, rng)] += 1 / trials;
      }
      let h = 0;
      for (let a = 0; a < N_ACTIONS; a++) {
        const q = P[s * N_ACTIONS + a];
        if (q > 0) h -= q * Math.log2(q);
      }
      H[s] = h;
    }
    return { P, H };
  }
}

// The culture's own model of what feedback stimulation looks like: a small
// mixture of Bernoulli templates over (electrode, substep) bins, learned
// online. Surprise is -log2 p(X) per bin, so 1 bit/bin = pure noise.
export class StimPredictor {
  constructor(maxSub, K = 3, lr = 0.25) {
    this.maxSub = maxSub;
    this.K = K;
    this.lr = lr;
    this.reset();
  }

  reset() {
    this.T = Array.from({ length: this.K }, () => new Float32Array(N_STATES * this.maxSub).fill(0.5));
    this.n = new Float32Array(this.K);
  }

  // Returns { perBin, bits, k } where k is the template that best explains X.
  surprise(X, len) {
    const nTot = this.n.reduce((a, b) => a + b, 0);
    const ll = new Float64Array(this.K);
    for (let k = 0; k < this.K; k++) {
      const Tk = this.T[k];
      let l = Math.log((this.n[k] + 1) / (nTot + this.K));
      for (let s = 0; s < N_STATES; s++) {
        for (let t = 0; t < len; t++) {
          const q = Tk[s * this.maxSub + t];
          l += X[s * len + t] ? Math.log(q) : Math.log(1 - q);
        }
      }
      ll[k] = l;
    }
    let m = -Infinity;
    let kBest = 0;
    for (let k = 0; k < this.K; k++)
      if (ll[k] > m) {
        m = ll[k];
        kBest = k;
      }
    let sum = 0;
    for (let k = 0; k < this.K; k++) sum += Math.exp(ll[k] - m);
    const logp = m + Math.log(sum);
    const bits = -logp / Math.LN2;
    return { bits, perBin: bits / (len * N_STATES), k: kBest };
  }

  update(X, len, k) {
    const Tk = this.T[k];
    for (let s = 0; s < N_STATES; s++) {
      for (let t = 0; t < len; t++) {
        const idx = s * this.maxSub + t;
        const q = Tk[idx] + this.lr * (X[s * len + t] - Tk[idx]);
        Tk[idx] = Math.min(0.98, Math.max(0.02, q));
      }
    }
    this.n[k] += 1;
  }
}
