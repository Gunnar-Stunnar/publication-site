// The probability simplex over {Left, Right, Fire} drawn as a triangle.
// Every point inside is one possible policy p(a | s) for a single state.
import { setupCanvas } from '../ui/cultureview.js';

export const H3 = Math.log2(3);

export function entropy(p) {
  let h = 0;
  for (const q of p) if (q > 1e-12) h -= q * Math.log2(q);
  return Math.max(0, h);
}

const lerp = (a, b, t) => a + (b - a) * t;
function ramp(stops, t) {
  t = Math.max(0, Math.min(1, t));
  const k = Math.min(stops.length - 2, Math.floor(t * (stops.length - 1)));
  const f = t * (stops.length - 1) - k;
  return stops[k].map((c, i) => lerp(c, stops[k + 1][i], f));
}
export const BLUES = [
  [255, 255, 255],
  [219, 234, 254],
  [147, 197, 253],
  [59, 130, 246],
  [30, 64, 175],
];
export const ORANGES = [
  [255, 255, 255],
  [255, 237, 213],
  [253, 186, 116],
  [249, 115, 22],
  [154, 52, 18],
];

export class Simplex {
  constructor(canvas, { w = 340, h = 300, labels = ['Left', 'Right', 'Fire'] } = {}) {
    this.W = w;
    this.H = h;
    this.g = setupCanvas(canvas, w, h);
    this.canvas = canvas;
    this.labels = labels;
    const pad = 34;
    this.V = [
      { x: pad, y: h - pad + 4 }, // Left
      { x: w - pad, y: h - pad + 4 }, // Right
      { x: w / 2, y: pad }, // Fire
    ];
    this.field = null;
  }

  toXY(p) {
    const s = p[0] + p[1] + p[2];
    const V = this.V;
    return {
      x: (p[0] * V[0].x + p[1] * V[1].x + p[2] * V[2].x) / s,
      y: (p[0] * V[0].y + p[1] * V[1].y + p[2] * V[2].y) / s,
    };
  }

  toP(x, y) {
    const [A, B, C] = this.V;
    const det = (B.y - C.y) * (A.x - C.x) + (C.x - B.x) * (A.y - C.y);
    const l1 = ((B.y - C.y) * (x - C.x) + (C.x - B.x) * (y - C.y)) / det;
    const l2 = ((C.y - A.y) * (x - C.x) + (A.x - C.x) * (y - C.y)) / det;
    return [l1, l2, 1 - l1 - l2];
  }

  // Precompute a heatmap of f(p) -> [0,1] plus optional contour levels.
  setField(f, stops = BLUES, contours = []) {
    const { W, H } = this;
    const dpr = window.devicePixelRatio || 1;
    const cw = Math.round(W * dpr);
    const ch = Math.round(H * dpr);
    const off = document.createElement('canvas');
    off.width = cw;
    off.height = ch;
    const og = off.getContext('2d');
    const img = og.createImageData(cw, ch);
    const d = img.data;
    for (let py = 0; py < ch; py++) {
      for (let px = 0; px < cw; px++) {
        const p = this.toP(px / dpr, py / dpr);
        if (p[0] < 0 || p[1] < 0 || p[2] < 0) continue;
        const v = f(p);
        let c = ramp(stops, v.t);
        if (contours.some((lv) => Math.abs(v.raw - lv) < 0.012)) c = c.map((x) => x * 0.72);
        const k = (py * cw + px) * 4;
        d[k] = c[0];
        d[k + 1] = c[1];
        d[k + 2] = c[2];
        d[k + 3] = 255;
      }
    }
    og.putImageData(img, 0, 0);
    this.field = off;
  }

  drawBase() {
    const { g, W, H, V } = this;
    g.clearRect(0, 0, W, H);
    if (this.field) g.drawImage(this.field, 0, 0, W, H);
    g.strokeStyle = '#9ca3af';
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(V[0].x, V[0].y);
    g.lineTo(V[1].x, V[1].y);
    g.lineTo(V[2].x, V[2].y);
    g.closePath();
    g.stroke();
    g.fillStyle = '#374151';
    g.font = '600 12px Geist, system-ui, sans-serif';
    g.textAlign = 'center';
    g.fillText(this.labels[0], V[0].x, V[0].y + 18);
    g.fillText(this.labels[1], V[1].x, V[1].y + 18);
    g.fillText(this.labels[2], V[2].x, V[2].y - 10);
  }

  drawTrail(pts, color = '#f97316') {
    const { g } = this;
    if (pts.length < 2) return;
    g.strokeStyle = color;
    g.globalAlpha = 0.55;
    g.lineWidth = 1.5;
    g.beginPath();
    pts.forEach((p, k) => {
      const q = this.toXY(p);
      k ? g.lineTo(q.x, q.y) : g.moveTo(q.x, q.y);
    });
    g.stroke();
    g.globalAlpha = 1;
  }

  drawPoint(p, color = '#f97316', r = 7) {
    const { g } = this;
    const q = this.toXY(p);
    g.fillStyle = color;
    g.strokeStyle = '#fff';
    g.lineWidth = 2;
    g.beginPath();
    g.arc(q.x, q.y, r, 0, Math.PI * 2);
    g.fill();
    g.stroke();
  }

  // Calls onMove(p) while the user drags inside the triangle.
  enableDrag(onMove) {
    const c = this.canvas;
    let down = false;
    const handle = (ev) => {
      const r = c.getBoundingClientRect();
      const x = ((ev.clientX - r.left) / r.width) * this.W;
      const y = ((ev.clientY - r.top) / r.height) * this.H;
      let p = this.toP(x, y).map((v) => Math.max(0, v));
      const s = p[0] + p[1] + p[2];
      p = p.map((v) => v / s);
      onMove(p);
    };
    c.style.touchAction = 'none';
    c.style.cursor = 'grab';
    c.addEventListener('pointerdown', (ev) => {
      down = true;
      c.setPointerCapture(ev.pointerId);
      handle(ev);
    });
    c.addEventListener('pointermove', (ev) => down && handle(ev));
    c.addEventListener('pointerup', () => (down = false));
  }
}
