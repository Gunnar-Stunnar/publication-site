// Floating reading-level switcher. Content blocks carry data-lv="easy",
// "medium", "graduate" (or several); the body class decides which show.
// Switching keeps the reader anchored on whatever they were looking at.
// On narrow screens it rests as a small pill so it doesn't cover the page.
const LEVELS = [
  { id: 'easy', label: 'Easy', blurb: 'No math. Intuition and things to try.' },
  { id: 'medium', label: 'Medium', blurb: 'Key equations, each with an intuition first.' },
  { id: 'graduate', label: 'Graduate', blurb: 'Derivations, links to RL and Bayesian filtering, methods.' },
];
const WIDE = 1400; // above this the page has empty margins, so stay expanded

export function startLevel() {
let current = 'medium';
let open = false;

// Pulse the switcher until the reader first clicks it, so the levels get
// noticed. Remembered across visits; a static ring under reduced motion.
let seen = false;
try {
  seen = localStorage.getItem('doom-post-level-seen') === '1';
} catch {}
const style = document.createElement('style');
style.textContent = `
  @keyframes lvpulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(59,130,246,0.55), 0 10px 15px -3px rgba(0,0,0,0.1); }
    50% { box-shadow: 0 0 0 9px rgba(59,130,246,0), 0 10px 15px -3px rgba(0,0,0,0.1); background-color: #eff6ff; }
  }
  .lv-attn { animation: lvpulse 1.4s ease-in-out infinite; border-color: #93c5fd !important; }
  @media (prefers-reduced-motion: reduce) {
    .lv-attn { animation: none; box-shadow: 0 0 0 3px rgba(59,130,246,0.45); }
  }`;
document.head.appendChild(style);
const attn = () => (seen ? '' : 'lv-attn');

function initialLevel() {
  const q = new URLSearchParams(location.search).get('level');
  if (LEVELS.some((l) => l.id === q)) return q;
  try {
    const s = localStorage.getItem('doom-post-level');
    if (LEVELS.some((l) => l.id === s)) return s;
  } catch {}
  return 'medium';
}

// The first heading, figure or paragraph whose top edge is in view.
function anchor() {
  const els = document.querySelectorAll('main h2, main figure, main .post p, main section');
  for (const el of els) {
    if (el.offsetParent === null) continue;
    if (el.getBoundingClientRect().bottom > 80) return el;
  }
  return null;
}

const root = document.querySelector('.doom-page');
const box = document.createElement('div');
box.id = 'level-switch';
box.className = 'fixed z-50 bottom-4 right-4 max-w-[calc(100vw-2rem)]';
document.body.appendChild(box);

function render() {
  const expanded = open || window.innerWidth >= WIDE;
  const lvl = LEVELS.find((l) => l.id === current);
  if (!expanded) {
    box.innerHTML = `
      <button data-toggle class="${attn()} flex items-center gap-2 bg-white/95 backdrop-blur rounded-full shadow-lg border border-gray-200 pl-3 pr-3.5 py-1.5 text-sm hover:bg-gray-50" aria-label="Change reading level" aria-expanded="false">
        <span class="text-xs font-semibold uppercase tracking-wide text-gray-500">Level</span>
        <span class="font-medium text-blue-600">${lvl.label}</span>
        <span class="text-gray-400 text-xs">▲</span>
      </button>`;
    return;
  }
  box.innerHTML = `
    <div class="${attn()} bg-white/95 backdrop-blur rounded-2xl shadow-lg border border-gray-200 p-2">
      <div class="flex items-center justify-between px-2 pt-0.5 pb-1.5">
        <span class="text-xs font-semibold uppercase tracking-wide text-gray-500">Reading level</span>
        ${window.innerWidth >= WIDE ? '' : '<button data-toggle class="text-gray-400 hover:text-gray-700 text-xs px-1" aria-label="Collapse" aria-expanded="true">▼</button>'}
      </div>
      <div class="flex gap-1" role="group" aria-label="Reading level">
        ${LEVELS.map(
          (l) =>
            `<button data-level="${l.id}" aria-pressed="${l.id === current}" class="px-3 py-1.5 rounded-full text-sm transition-colors ${
              l.id === current ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-100'
            }">${l.label}</button>`
        ).join('')}
      </div>
      <div class="text-xs text-gray-500 px-2 pt-1.5 pb-0.5 max-w-[16rem]">${lvl.blurb}</div>
    </div>`;
}

function apply(level, { keepPlace = true } = {}) {
  const a = keepPlace ? anchor() : null;
  // Prefer an anchor that exists at every level (figures and the experiment card).
  const shared = a && (a.closest('figure, section') || a);
  const before = shared ? shared.getBoundingClientRect().top : 0;
  current = level;
  if (root) {
    root.classList.remove(...LEVELS.map((l) => `level-${l.id}`));
    root.classList.add(`level-${level}`);
  }
  if (shared && shared.offsetParent !== null) window.scrollBy(0, shared.getBoundingClientRect().top - before);
  try {
    localStorage.setItem('doom-post-level', level);
  } catch {}
  const url = new URL(location.href);
  url.searchParams.set('level', level);
  history.replaceState(history.state, '', url);
  render();
  // Canvas widgets listen for this to redraw their level-dependent labels.
  window.dispatchEvent(new CustomEvent('levelchange', { detail: level }));
  window.dispatchEvent(new Event('resize'));
}

box.addEventListener('click', (ev) => {
  // render() replaces the clicked node, so stop here before the
  // click-outside handler sees a detached target.
  ev.stopPropagation();
  if (!seen) {
    seen = true;
    try {
      localStorage.setItem('doom-post-level-seen', '1');
    } catch {}
    for (const el of box.querySelectorAll('.lv-attn')) el.classList.remove('lv-attn');
  }
  const b = ev.target.closest('button[data-level]');
  if (b) {
    open = false; // picking a level closes the panel on narrow screens
    apply(b.dataset.level);
    return;
  }
  if (ev.target.closest('[data-toggle]')) {
    open = !open;
    render();
  }
});
const onDocClick = (ev) => {
  if (open && !box.contains(ev.target)) {
    open = false;
    render();
  }
};
document.addEventListener('click', onDocClick);
let lastWide = window.innerWidth >= WIDE;
const onResize = () => {
  const wide = window.innerWidth >= WIDE;
  if (wide !== lastWide) {
    lastWide = wide;
    render();
  }
};
window.addEventListener('resize', onResize);

apply(initialLevel(), { keepPlace: false });

return () => {
  document.removeEventListener('click', onDocClick);
  window.removeEventListener('resize', onResize);
  box.remove();
  style.remove();
};
}
