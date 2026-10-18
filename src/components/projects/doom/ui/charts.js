// Minimal canvas line/scatter charts for learning curves.
import { COLORS } from './cultureview.js';

export class Chart {
  // xMin: smallest x-span to show. xFit: start the x-axis at the first data
  // point instead of 0. xWindow: fixed-width x range that scrolls with the
  // newest point (older points slide off the left edge).
  constructor(canvas, { w = 300, h = 160, yMax = null, yLabel = '', xLabel = 'minutes of play', xMin = 0.5, xFit = false, xWindow = null } = {}) {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.aspectRatio = `${w} / ${h}`;
    canvas.style.maxWidth = `${Math.round(w * 1.35)}px`;
    this.g = canvas.getContext('2d');
    this.g.setTransform(dpr, 0, 0, dpr, 0, 0);
    Object.assign(this, { w, h, yMax, yLabel, xLabel, xMin, xFit, xWindow });
  }

  // series: [{ pts: [[x,y],...], color, dots?, width? }], refs: [{ y, label, below? }]
  draw(series, refs = []) {
    const { g, w, h } = this;
    const L = 34;
    const R = 8;
    const T = 10;
    const B = 34;
    const pw = w - L - R;
    const ph = h - T - B;

    let x0 = Infinity;
    let x1 = -Infinity;
    let yData = 0;
    for (const s of series)
      for (const [x, y] of s.pts) {
        x0 = Math.min(x0, x);
        x1 = Math.max(x1, x);
        yData = Math.max(yData, y);
      }
    if (!this.xFit || !Number.isFinite(x0)) x0 = 0;
    if (!Number.isFinite(x1)) x1 = 0;
    x1 = Math.max(x1, x0 + this.xMin);
    if (this.xWindow) {
      x1 = Math.max(x1, this.xWindow);
      x0 = x1 - this.xWindow;
      series = series.map((s) => ({ ...s, pts: s.pts.filter(([x]) => x >= x0) }));
    }

    // y-axis: gridlines sit exactly on the labelled values
    let yMax;
    let yStep;
    if (this.yMax != null) {
      yMax = this.yMax;
      yStep = niceStep(yMax);
    } else {
      const top = Math.max(1, yData * 1.08);
      yStep = niceStep(top);
      yMax = Math.ceil(top / yStep - 1e-9) * yStep;
    }
    const X = (x) => L + ((x - x0) / (x1 - x0)) * pw;
    const Y = (y) => T + ph - (Math.min(Math.max(y, 0), yMax) / yMax) * ph;

    g.clearRect(0, 0, w, h);
    g.font = '500 10px Geist, system-ui, sans-serif';
    g.strokeStyle = COLORS.grid;
    g.lineWidth = 1;
    g.fillStyle = COLORS.muted;
    g.textAlign = 'right';
    const dec = decimals(yStep);
    for (let v = 0; v <= yMax + 1e-9; v += yStep) {
      const y = Y(v);
      g.beginPath();
      g.moveTo(L, y);
      g.lineTo(L + pw, y);
      g.stroke();
      g.fillText(v.toFixed(dec), L - 4, y + 3);
    }
    g.textAlign = 'center';
    const xStep = niceStep(x1 - x0);
    const xDec = decimals(xStep);
    for (let v = Math.ceil(x0 / xStep - 1e-9) * xStep; v <= x1 + 1e-9; v += xStep) g.fillText(v.toFixed(xDec), X(v), h - 20);
    g.fillText(this.xLabel, L + pw / 2, h - 4);

    for (const r of refs) {
      g.setLineDash([4, 3]);
      g.strokeStyle = '#9ca3af';
      g.beginPath();
      g.moveTo(L, Y(r.y));
      g.lineTo(L + pw, Y(r.y));
      g.stroke();
      g.setLineDash([]);
    }

    for (const s of series) {
      g.strokeStyle = s.color;
      g.fillStyle = s.color;
      if (s.dots) {
        g.globalAlpha = 0.55;
        for (const [x, y] of s.pts) {
          g.beginPath();
          g.arc(X(x), Y(y), 2.2, 0, Math.PI * 2);
          g.fill();
        }
        g.globalAlpha = 1;
        continue;
      }
      g.lineWidth = s.width ?? 2;
      g.beginPath();
      s.pts.forEach(([x, y], k) => (k ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y))));
      g.stroke();
    }

    // Reference labels last, on a white chip at the left so data never hides them.
    g.font = '500 10px Geist, system-ui, sans-serif';
    g.textAlign = 'left';
    for (const r of refs) {
      const tw = g.measureText(r.label).width;
      const y = Y(r.y);
      const ly = r.below || y - 13 < T ? y + 3 : y - 13;
      g.fillStyle = 'rgba(255,255,255,0.9)';
      g.fillRect(L + 3, ly, tw + 6, 12);
      g.fillStyle = COLORS.muted;
      g.fillText(r.label, L + 6, ly + 9);
    }
  }
}

// A 1/2/2.5/5 × 10^k step giving about 4 intervals over `range`.
function niceStep(range, target = 4) {
  const raw = range / target;
  const mag = 10 ** Math.floor(Math.log10(raw));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * mag >= raw - 1e-12) return m * mag;
  return 10 * mag;
}

function decimals(step) {
  for (let d = 0; d < 3; d++) if (Math.abs(step * 10 ** d - Math.round(step * 10 ** d)) < 1e-9) return d;
  return 3;
}
