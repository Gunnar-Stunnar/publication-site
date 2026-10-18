// The dish: sensory regions over stimulating electrodes on the left, motor
// readout regions on the right, region-to-region synaptic strength as lines.
// Plus a spike raster of every neuron with feedback windows shaded.
import { STATE_SHORT, ACTIONS, N_STATES, N_ACTIONS, PHASE } from '../culture.js';

export const COLORS = {
  sensory: '#3b82f6',
  motor: '#f97316',
  pattern: '#22c55e',
  noise: '#ef4444',
  ink: '#111827',
  muted: '#6b7280',
  grid: '#e5e7eb',
  panel: '#f3f4f6',
};

export function setupCanvas(canvas, w, h) {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.aspectRatio = `${w} / ${h}`;
  const g = canvas.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  return g;
}

export class DishView {
  constructor(canvas, culture) {
    this.W = 460;
    this.H = 400;
    this.g = setupCanvas(canvas, this.W, this.H);
    this.bind(culture);
  }

  bind(culture) {
    this.c = culture;
    const { nPerSensory, nPerMotor } = culture.p;
    this.glow = new Float32Array(culture.N);
    this.stimGlow = new Float32Array(N_STATES);
    this.stimPhase = new Uint8Array(N_STATES);
    // Region centres
    const top = 44;
    const gap = (this.H - top - 30) / (N_STATES - 1);
    this.sPos = Array.from({ length: N_STATES }, (_, s) => ({ x: 100, y: top + s * gap }));
    const order = [0, 2, 1]; // Left on top, Fire in the middle, Right below
    this.mPos = [];
    order.forEach((a, k) => (this.mPos[a] = { x: 360, y: top + 40 + k * ((this.H - top - 110) / 2) }));
    // Neuron positions inside each region (seeded jitter)
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    this.nPos = [];
    for (let i = 0; i < culture.nS; i++) {
      const s = culture.sensoryPool(i);
      const k = i % nPerSensory;
      this.nPos.push({ x: this.sPos[s].x - 22 + (k % 5) * 11 + rnd() * 3, y: this.sPos[s].y - 6 + Math.floor(k / 5) * 11 + rnd() * 3 });
    }
    for (let j = 0; j < culture.nM; j++) {
      const a = culture.motorPool(j);
      const k = j % nPerMotor;
      const ang = (k / nPerMotor) * Math.PI * 2;
      const r = k % 2 ? 17 : 10;
      this.nPos.push({ x: this.mPos[a].x + Math.cos(ang) * r + rnd() * 2, y: this.mPos[a].y + Math.sin(ang) * r + rnd() * 2 });
    }
  }

  // Accumulate spikes from the last tick so that a flash survives the frame.
  absorb() {
    const c = this.c;
    const sub = c.p.substeps;
    for (let k = 0; k < sub; k++) {
      const t = (c.histPtr - 1 - k + c.histLen) % c.histLen;
      const base = t * c.N;
      for (let n = 0; n < c.N; n++) if (c.hist[base + n]) this.glow[n] = 1;
    }
    const phase = c.histPhase[(c.histPtr - 1 + c.histLen) % c.histLen];
    for (let s = 0; s < N_STATES; s++)
      if (c.lastStim[s]) {
        this.stimGlow[s] = 1;
        this.stimPhase[s] = phase;
      }
  }

  draw(activeState, action, decay = 0.75) {
    const { g, W, H, c } = this;
    g.clearRect(0, 0, W, H);

    // dish
    g.fillStyle = '#fafafa';
    g.strokeStyle = COLORS.grid;
    g.lineWidth = 1.5;
    g.beginPath();
    g.roundRect(6, 6, W - 12, H - 12, 18);
    g.fill();
    g.stroke();

    g.fillStyle = COLORS.muted;
    g.font = '600 11px Geist, system-ui, sans-serif';
    g.textAlign = 'center';
    g.fillText('SENSORY (stimulated)', this.sPos[0].x, 26);
    g.fillText('MOTOR (recorded)', this.mPos[0].x, 26);

    // synapses: mean weight region -> region
    const PW = c.poolWeights();
    let maxW = 0;
    for (const w of PW) maxW = Math.max(maxW, w);
    for (let s = 0; s < N_STATES; s++) {
      for (let a = 0; a < N_ACTIONS; a++) {
        const w = PW[s * N_ACTIONS + a] / (maxW || 1);
        const hot = s === activeState;
        g.strokeStyle = hot ? `rgba(59,130,246,${0.15 + 0.85 * w})` : `rgba(107,114,128,${0.06 + 0.5 * w * w})`;
        g.lineWidth = 0.5 + 6 * w * w;
        g.beginPath();
        g.moveTo(this.sPos[s].x + 30, this.sPos[s].y);
        g.bezierCurveTo(230, this.sPos[s].y, 230, this.mPos[a].y, this.mPos[a].x - 26, this.mPos[a].y);
        g.stroke();
      }
    }

    // electrodes
    for (let s = 0; s < N_STATES; s++) {
      const p = this.sPos[s];
      const gl = this.stimGlow[s];
      const ph = this.stimPhase[s];
      const col = ph === PHASE.PATTERN ? '34,197,94' : ph === PHASE.NOISE ? '239,68,68' : '59,130,246';
      g.fillStyle = `rgba(${col},${0.12 + 0.88 * gl})`;
      g.fillRect(p.x - 52, p.y - 6, 12, 12);
      g.strokeStyle = '#9ca3af';
      g.lineWidth = 1;
      g.strokeRect(p.x - 52, p.y - 6, 12, 12);
      g.fillStyle = s === activeState ? COLORS.ink : COLORS.muted;
      g.font = `${s === activeState ? 700 : 500} 11px Geist, system-ui, sans-serif`;
      g.textAlign = 'right';
      g.fillText(STATE_SHORT[s], p.x - 58, p.y + 4);
    }

    // neurons
    for (let n = 0; n < c.N; n++) {
      const p = this.nPos[n];
      const gl = this.glow[n];
      const isS = n < c.nS;
      g.fillStyle = gl > 0.02 ? (isS ? `rgba(59,130,246,${0.25 + 0.75 * gl})` : `rgba(249,115,22,${0.25 + 0.75 * gl})`) : '#d1d5db';
      g.beginPath();
      g.arc(p.x, p.y, isS ? 3.6 : 4, 0, Math.PI * 2);
      g.fill();
      this.glow[n] *= decay;
    }
    for (let s = 0; s < N_STATES; s++) this.stimGlow[s] *= decay;

    // motor labels
    for (let a = 0; a < N_ACTIONS; a++) {
      const p = this.mPos[a];
      g.fillStyle = a === action ? COLORS.motor : COLORS.muted;
      g.font = `${a === action ? 700 : 500} 12px Geist, system-ui, sans-serif`;
      g.textAlign = 'left';
      g.fillText(ACTIONS[a], p.x + 26, p.y + 4);
      if (a === action) {
        g.strokeStyle = COLORS.motor;
        g.lineWidth = 2;
        g.beginPath();
        g.arc(p.x, p.y, 24, 0, Math.PI * 2);
        g.stroke();
      }
    }
  }
}

export class RasterView {
  constructor(canvas, culture) {
    this.W = 920;
    this.H = 190;
    this.g = setupCanvas(canvas, this.W, this.H);
    this.c = culture;
  }

  draw() {
    const { g, W, H, c } = this;
    const left = 34;
    const plotW = W - left - 4;
    const n = c.histLen;
    const dx = plotW / n;
    const dy = (H - 8) / c.N;
    g.clearRect(0, 0, W, H);
    g.fillStyle = '#ffffff';
    g.fillRect(left, 0, plotW, H);
    // phase shading
    for (let k = 0; k < n; k++) {
      const t = (c.histPtr + k) % n;
      const ph = c.histPhase[t];
      if (ph === PHASE.PATTERN) g.fillStyle = 'rgba(34,197,94,0.16)';
      else if (ph === PHASE.NOISE) g.fillStyle = 'rgba(239,68,68,0.13)';
      else continue;
      g.fillRect(left + k * dx, 0, dx + 0.6, H - 8);
    }
    // spikes
    for (let k = 0; k < n; k++) {
      const t = (c.histPtr + k) % n;
      const base = t * c.N;
      const x = left + k * dx;
      for (let i = 0; i < c.N; i++) {
        if (!c.hist[base + i]) continue;
        g.fillStyle = i < c.nS ? COLORS.sensory : COLORS.motor;
        g.fillRect(x, 4 + i * dy, Math.max(1, dx), Math.max(1, dy - 0.2));
      }
    }
    // region separators and labels
    g.font = '500 9px Geist, system-ui, sans-serif';
    g.textAlign = 'right';
    const { nPerSensory, nPerMotor } = c.p;
    for (let s = 0; s < N_STATES; s++) {
      const y = 4 + s * nPerSensory * dy;
      g.fillStyle = COLORS.muted;
      g.fillText(STATE_SHORT[s], left - 4, y + (nPerSensory * dy) / 2 + 3);
      g.fillStyle = COLORS.grid;
      g.fillRect(left, y, plotW, 0.5);
    }
    for (let a = 0; a < N_ACTIONS; a++) {
      const y = 4 + (c.nS + a * nPerMotor) * dy;
      g.fillStyle = COLORS.motor;
      g.fillText(ACTIONS[a][0], left - 4, y + (nPerMotor * dy) / 2 + 3);
      g.fillStyle = a === 0 ? '#9ca3af' : COLORS.grid;
      g.fillRect(left, y, plotW, a === 0 ? 1 : 0.5);
    }
  }
}
