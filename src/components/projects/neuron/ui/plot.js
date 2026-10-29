// Axes on a canvas: linear or log scales, gridlines on round values, and
// mapping functions for drawing data inside the box.
import { C, FONT } from './common.js';

export function niceStep(range, target = 4) {
  const raw = range / target;
  const mag = 10 ** Math.floor(Math.log10(raw));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * mag >= raw - 1e-12) return m * mag;
  return 10 * mag;
}

const fmt = (v, step) => {
  if (Math.abs(v) < 1e-12) return '0';
  for (let d = 0; d < 4; d++) if (Math.abs(step * 10 ** d - Math.round(step * 10 ** d)) < 1e-9) return v.toFixed(d);
  return v.toFixed(3);
};
const fmtLog = (e) => (e === 0 ? '1' : e === 1 ? '10' : `1e${e}`);

// box: {x, y, w, h} in canvas px. xr/yr: [min, max] in data units (log axes
// take data units too and must be positive). Returns {X, Y, clip, unclip}.
export function axes(g, box, { xr, yr, xlog = false, ylog = false, xLabel = '', yLabel = '', xTicks = 4, yTicks = 4, grid = true, zeroLine = false, xTickLabels = true } = {}) {
  const { x, y, w, h } = box;
  const tx = xlog ? Math.log10 : (v) => v;
  const ty = ylog ? Math.log10 : (v) => v;
  const [x0, x1] = [tx(xr[0]), tx(xr[1])];
  const [y0, y1] = [ty(yr[0]), ty(yr[1])];
  const X = (v) => x + ((tx(v) - x0) / (x1 - x0)) * w;
  const Y = (v) => y + h - ((ty(v) - y0) / (y1 - y0)) * h;

  g.save();
  g.font = FONT;
  g.lineWidth = 1;
  g.strokeStyle = C.grid;
  g.fillStyle = C.muted;
  // y ticks
  g.textAlign = 'right';
  const yt = ylog ? decades(y0, y1) : linTicks(y0, y1, yTicks);
  for (const v of yt.vals) {
    const py = y + h - ((v - y0) / (y1 - y0)) * h;
    if (grid) line(g, x, py, x + w, py);
    g.fillText(ylog ? fmtLog(v) : fmt(v, yt.step), x - 4, py + 3);
  }
  // x ticks
  g.textAlign = 'center';
  const xt = xlog ? decades(x0, x1) : linTicks(x0, x1, xTicks);
  for (const v of xt.vals) {
    const px = x + ((v - x0) / (x1 - x0)) * w;
    if (grid) line(g, px, y, px, y + h);
    if (xTickLabels) g.fillText(xlog ? fmtLog(v) : fmt(v, xt.step), px, y + h + 12);
  }
  if (zeroLine && !ylog && y0 < 0 && y1 > 0) {
    g.strokeStyle = C.faint;
    line(g, x, Y(0), x + w, Y(0));
  }
  g.strokeStyle = '#d1d5db';
  g.strokeRect(x + 0.5, y + 0.5, w, h);
  if (xLabel) g.fillText(xLabel, x + w / 2, y + h + 25);
  if (yLabel) {
    g.save();
    g.translate(x - 30, y + h / 2);
    g.rotate(-Math.PI / 2);
    g.fillText(yLabel, 0, 0);
    g.restore();
  }
  g.restore();

  return {
    X,
    Y,
    clip() {
      g.save();
      g.beginPath();
      g.rect(x, y, w, h);
      g.clip();
    },
    unclip() {
      g.restore();
    },
  };
}

function linTicks(a, b, n) {
  const step = niceStep(b - a, n);
  const vals = [];
  for (let v = Math.ceil(a / step - 1e-9) * step; v <= b + 1e-9; v += step) vals.push(Math.abs(v) < 1e-12 ? 0 : v);
  return { vals, step };
}

function decades(a, b) {
  const vals = [];
  const span = b - a;
  const every = span > 10 ? 4 : span > 6 ? 2 : 1;
  for (let e = Math.ceil(a); e <= Math.floor(b); e++) if (e % every === 0) vals.push(e);
  return { vals, step: 1 };
}

export function line(g, x0, y0, x1, y1) {
  g.beginPath();
  g.moveTo(x0, y0);
  g.lineTo(x1, y1);
  g.stroke();
}

// Polyline through parallel arrays (or [[x,y]] pairs) using the mapping functions.
export function path(g, X, Y, xs, ys, { color = C.ink, width = 1.5, dash = null, alpha = 1 } = {}) {
  g.save();
  g.strokeStyle = color;
  g.lineWidth = width;
  g.globalAlpha = alpha;
  if (dash) g.setLineDash(dash);
  g.beginPath();
  let started = false;
  for (let i = 0; i < xs.length; i++) {
    const px = X(xs[i]);
    const py = Y(ys[i]);
    if (!Number.isFinite(px) || !Number.isFinite(py)) {
      started = false;
      continue;
    }
    if (started) g.lineTo(px, py);
    else g.moveTo(px, py);
    started = true;
  }
  g.stroke();
  g.restore();
}

export function dot(g, x, y, r, color, alpha = 1) {
  g.save();
  g.globalAlpha = alpha;
  g.fillStyle = color;
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fill();
  g.restore();
}

export function arrow(g, x0, y0, x1, y1, color, width = 1.5, head = 6) {
  const a = Math.atan2(y1 - y0, x1 - x0);
  g.save();
  g.strokeStyle = color;
  g.fillStyle = color;
  g.lineWidth = width;
  line(g, x0, y0, x1, y1);
  g.beginPath();
  g.moveTo(x1, y1);
  g.lineTo(x1 - head * Math.cos(a - 0.4), y1 - head * Math.sin(a - 0.4));
  g.lineTo(x1 - head * Math.cos(a + 0.4), y1 - head * Math.sin(a + 0.4));
  g.closePath();
  g.fill();
  g.restore();
}

export function label(g, text, x, y, { color = C.muted, align = 'left', bold = false } = {}) {
  g.save();
  g.font = bold ? '600 11px Geist, system-ui, sans-serif' : FONT;
  g.fillStyle = color;
  g.textAlign = align;
  g.fillText(text, x, y);
  g.restore();
}

// A legend row: [[color, text], ...] laid out left to right.
export function legend(g, items, x, y) {
  g.save();
  g.font = FONT;
  let cx = x;
  for (const [color, text, dashed] of items) {
    g.strokeStyle = color;
    g.lineWidth = 2;
    if (dashed) g.setLineDash([4, 3]);
    line(g, cx, y - 3, cx + 14, y - 3);
    g.setLineDash([]);
    g.fillStyle = C.muted;
    g.fillText(text, cx + 18, y);
    cx += 24 + g.measureText(text).width + 10;
  }
  g.restore();
}
