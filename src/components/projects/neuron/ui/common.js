// Shared bits for the neuron post's widgets: palette, little HTML helpers,
// a visibility-aware animation loop, and the reading level.
import { track } from '../../doom/lifecycle.js';
export { setupCanvas } from '../../doom/ui/cultureview.js';
export { track, listen } from '../../doom/lifecycle.js';

export const C = {
  blue: '#3b82f6',
  orange: '#f97316',
  green: '#22c55e',
  red: '#ef4444',
  violet: '#8b5cf6',
  teal: '#14b8a6',
  ink: '#111827',
  muted: '#6b7280',
  faint: '#9ca3af',
  grid: '#e5e7eb',
  panel: '#f9fafb',
};
export const FONT = '500 10px Geist, system-ui, sans-serif';

// Text that changes with the reading level: plain words at Easy, notation above.
export const lv = (easy, hard) => `<span class="lv-easy">${easy}</span><span class="lv-hard">${hard}</span>`;
export const isEasy = () => !!document.querySelector('.neuron-page.level-easy');

const BTN = 'px-3 py-1 rounded text-sm';
export const btn = (label, attrs = '') => `<button ${attrs} class="${BTN} bg-gray-200 hover:bg-gray-300">${label}</button>`;
export const playBtn = (attrs = 'data-play') => `<button ${attrs} class="px-4 py-1 rounded text-white bg-green-500 hover:bg-green-600">Play</button>`;
export function setPlaying(b, on) {
  b.textContent = on ? 'Pause' : 'Play';
}
// Highlight the active button of a group whose children carry data-v.
export function markGroup(group, value) {
  for (const b of group.children) {
    const on = b.dataset.v === String(value);
    b.className = `${BTN} ${on ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`;
  }
}
export const slider = (label, attrs, valAttr) =>
  `<label class="text-sm flex items-center gap-2">${label}<input type="range" ${attrs} class="w-28"/><span ${valAttr} class="tabular-nums text-gray-600 min-w-[4.5rem]"></span></label>`;

// requestAnimationFrame loop that only runs while `el` is on screen, so the
// page's many figures don't all burn CPU at once. frame(dtMs) is called each tick.
export function animate(el, frame) {
  let raf = 0;
  let last = 0;
  let visible = false;
  const tick = (now) => {
    const dt = last ? Math.min(50, now - last) : 16;
    last = now;
    frame(dt);
    raf = requestAnimationFrame(tick);
  };
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    cancelAnimationFrame(raf);
    last = 0;
    if (visible) raf = requestAnimationFrame(tick);
  });
  io.observe(el);
  track(() => {
    io.disconnect();
    cancelAnimationFrame(raf);
  });
}

// Pointer position in a canvas's own (CSS-size) coordinates.
export function canvasPoint(canvas, ev, w, h) {
  const r = canvas.getBoundingClientRect();
  return [((ev.clientX - r.left) / r.width) * w, ((ev.clientY - r.top) / r.height) * h];
}
