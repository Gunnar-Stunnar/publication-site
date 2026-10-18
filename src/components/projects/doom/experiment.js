// Closed loop: game -> electrodes -> culture -> motor readout -> game,
// plus the feedback stimulation that follows game events.
// Pure logic (no DOM) so it runs in the browser and headless in Node.
import { Culture, StimPredictor, N_STATES, PHASE } from './culture.js';
import { Game } from './game.js';
import { mulberry32 } from './rng.js';

export const FEEDBACK_MODES = {
  fep: { label: 'Pattern + noise', kill: 'pattern', hit: 'noise', miss: 'noise' },
  pattern: { label: 'Pattern only', kill: 'pattern', hit: null, miss: null },
  noise: { label: 'Noise only', kill: null, hit: 'noise', miss: 'noise' },
  none: { label: 'No feedback', kill: null, hit: null, miss: null },
};

export const EXP_DEFAULTS = {
  mode: 'fep',
  missNoise: true,
  patternTicks: 2,
  noiseTicksHit: 8,
  noiseTicksMiss: 3,
  noiseDensity: 0.5, // fraction of (electrode, substep) bins pulsed during noise
  seriesEvery: 600, // play ticks per learning-curve point (30 s of culture time)
  probeEvery: 600,
  probeTrials: 30,
};

export const TICK_MS = 50; // culture time per game tick

export class Experiment {
  constructor(opts = {}, seed = 1) {
    this.opts = { ...EXP_DEFAULTS, ...opts };
    this.cultureParams = opts.culture || {};
    this.gameParams = opts.game || {};
    this.reset(seed);
  }

  reset(seed = this.seed ?? 1) {
    this.seed = seed;
    this.rng = mulberry32(seed * 7919 + 3);
    this.culture = new Culture(this.cultureParams, seed);
    this.game = new Game(this.gameParams, seed + 101);
    const sub = this.culture.p.substeps;
    this.predictor = new StimPredictor(Math.max(this.opts.patternTicks, this.opts.noiseTicksHit, this.opts.noiseTicksMiss) * sub);
    this.feedback = null;
    this.ticks = 0;
    this.playTicks = 0;
    this.win = { kills: 0, hits: 0, shots: 0, misses: 0, ticks: 0 };
    this.series = [];
    this.fbLog = [];
    this.last = { obs: null, action: -1, counts: [0, 0, 0], events: [] };
    this.policy = this.culture.probePolicy(this.opts.probeTrials);
    this.series.push(this._point(0));
  }

  setMode(mode) {
    this.opts.mode = mode;
  }

  _point(ticks) {
    const w = this.win;
    const perMin = w.ticks > 0 ? 60000 / (w.ticks * TICK_MS) : 0;
    const H = this.policy.H;
    let Hm = 0;
    for (let s = 0; s < N_STATES; s++) Hm += H[s] / N_STATES;
    return {
      t: (ticks * TICK_MS) / 60000, // minutes of play
      killsPerMin: w.kills * perMin,
      hitsPerMin: w.hits * perMin,
      accuracy: w.shots ? w.kills / w.shots : 0,
      entropy: Hm,
    };
  }

  _buildStim(type, ticks) {
    const sub = this.culture.p.substeps;
    const len = ticks * sub;
    const X = new Uint8Array(N_STATES * len);
    for (let s = 0; s < N_STATES; s++) {
      for (let t = 0; t < len; t++) {
        // Pattern: every electrode pulses together at a fixed 100 Hz.
        // Noise: random electrodes at random times.
        X[s * len + t] = type === 'pattern' ? (t % 2 === 0 ? 1 : 0) : this.rng() < this.opts.noiseDensity ? 1 : 0;
      }
    }
    return { type, X, len, ticks, tick: 0 };
  }

  _startFeedback(events) {
    const m = FEEDBACK_MODES[this.opts.mode];
    let type = null;
    let ticks = 0;
    if (events.includes('hit') && m.hit) {
      type = m.hit;
      ticks = this.opts.noiseTicksHit;
    } else if (events.includes('kill') && m.kill) {
      type = m.kill;
      ticks = this.opts.patternTicks;
    } else if (events.includes('miss') && m.miss && this.opts.missNoise) {
      type = m.miss;
      ticks = this.opts.noiseTicksMiss;
    }
    if (type) {
      this.feedback = this._buildStim(type, ticks);
      this.feedback.cause = events.includes('hit') ? 'hit' : events.includes('kill') ? 'kill' : 'miss';
    }
  }

  step() {
    this.ticks++;
    const c = this.culture;

    // During feedback the game is paused and the culture is stimulated.
    if (this.feedback) {
      const fb = this.feedback;
      const phase = fb.type === 'pattern' ? PHASE.PATTERN : PHASE.NOISE;
      c.feedbackTick(fb.X, fb.len, fb.tick * c.p.substeps, phase);
      fb.tick++;
      if (fb.tick >= fb.ticks) {
        const s = this.predictor.surprise(fb.X, fb.len);
        this.predictor.update(fb.X, fb.len, s.k);
        const u = Math.min(1, Math.max(0, s.perBin));
        c.applyFeedback(u, fb.type === 'noise' ? fb.ticks / this.opts.noiseTicksHit : 1);
        this.fbLog.push({ t: this.playTicks, type: fb.type, cause: fb.cause, u });
        if (this.fbLog.length > 5000) this.fbLog.shift();
        this.lastFeedback = { type: fb.type, cause: fb.cause, u };
        this.feedback = null;
      }
      return { feedback: fb };
    }

    const obs = this.game.observe();
    const counts = c.senseTick(obs.state, obs.proximity);
    const action = c.chooseAction(counts);
    const events = this.game.step(action);

    this.playTicks++;
    this.win.ticks++;
    if (action === 2) this.win.shots++;
    for (const e of events) {
      if (e === 'kill') this.win.kills++;
      if (e === 'hit') this.win.hits++;
    }
    this.last = { obs, action, counts, events };
    this._startFeedback(events);

    if (this.playTicks % this.opts.probeEvery === 0) this.policy = c.probePolicy(this.opts.probeTrials);
    if (this.playTicks % this.opts.seriesEvery === 0) {
      this.series.push(this._point(this.playTicks));
      this.win = { kills: 0, hits: 0, shots: 0, misses: 0, ticks: 0 };
    }
    return { obs, action, counts, events };
  }
}
