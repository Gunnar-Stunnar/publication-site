// Section 2: the Lorenz system as a stress test for the solver. Two
// trajectories start 1e-8 apart; their separation grows like e^{λt}.
import { makeStepper, makeRK4 } from '../sim/rk4.js';
import { C, setupCanvas, lv, isEasy, btn, playBtn, setPlaying, slider, animate, listen, markGroup, canvasPoint } from '../ui/common.js';
import { axes, path, label, legend } from '../ui/plot.js';

const TRAIL = 2500;
const EPS = 1e-8;
const LYAP = 0.906; // largest Lyapunov exponent at the classic parameters
const T_SEP = 40;

export function mountLorenz(root) {
  root.innerHTML = `
  <div class="flex flex-wrap items-center gap-x-4 gap-y-2 mb-2">
    ${playBtn()} ${btn('Reset', 'data-reset')}
    <span class="text-sm text-gray-500">Solver</span>
    <div class="flex gap-1" data-method>${btn('RK4', 'data-v="rk4"')}${btn('Euler', 'data-v="euler"')}</div>
    ${slider(lv('Step size', 'Step h'), 'data-h min="0.002" max="0.03" step="0.001" value="0.01"', 'data-hv')}
  </div>
  <div class="flex flex-wrap items-center gap-x-4 gap-y-2 mb-3">
    ${slider('σ', 'data-sigma min="1" max="20" step="0.5" value="10"', 'data-sv')}
    ${slider('ρ', 'data-rho min="0.5" max="40" step="0.5" value="28"', 'data-rv')}
    ${slider('β', 'data-beta min="0.5" max="5" step="0.01" value="2.67"', 'data-bv')}
    ${btn(lv('Classic butterfly', 'Classic (10, 28, 8/3)'), 'data-classic')}
  </div>
  <div class="grid lg:grid-cols-5 gap-6">
    <div class="lg:col-span-3"><canvas data-c class="touch-none cursor-grab"></canvas>
      <div class="text-xs text-gray-500 mt-1">${lv('Drag to turn it around.', 'Drag to rotate. Grey: reference attractor (RK4, h = 0.002).')}</div></div>
    <div class="lg:col-span-2"><canvas data-sep></canvas><div data-msg class="text-sm text-gray-600 mt-2 min-h-[3rem]"></div></div>
  </div>`;
  const q = root.querySelector.bind(root);
  const W = 520;
  const H = 420;
  const SW = 340;
  const SH = 300;
  const cv = q('[data-c]');
  const g = setupCanvas(cv, W, H);
  cv.style.maxWidth = `${W * 1.3}px`;
  const gs = setupCanvas(q('[data-sep]'), SW, SH);
  q('[data-sep]').style.maxWidth = `${SW * 1.3}px`;

  let method = 'rk4';
  let yaw = 0.3;
  let pitch = 0.2;
  const par = () => ({ s: Number(q('[data-sigma]').value), r: Number(q('[data-rho]').value), b: Number(q('[data-beta]').value) });
  const h = () => Number(q('[data-h]').value);
  let P = par();
  const f = (t, u, d) => {
    d[0] = P.s * (u[1] - u[0]);
    d[1] = u[0] * (P.r - u[2]) - u[1];
    d[2] = u[0] * u[1] - P.b * u[2];
  };

  let S;
  let ref = new Float32Array(0);
  function buildReference() {
    // a long accurate run, drawn faintly so a sloppy solver's shape can be compared
    const st = makeRK4(3);
    const u = new Float64Array([1, 1, 20]);
    for (let k = 0; k < 2000; k++) st(f, 0, u, 0.002);
    const n = 6000;
    ref = new Float32Array(n * 3);
    for (let k = 0; k < n; k++) {
      for (let j = 0; j < 5; j++) st(f, 0, u, 0.002);
      ref.set(u, k * 3);
    }
  }
  function reset() {
    P = par();
    buildReference();
    S = {
      t: 0,
      a: new Float64Array([1, 1, 20]),
      b: new Float64Array([1 + EPS, 1, 20]),
      ta: new Float32Array(TRAIL * 3),
      tb: new Float32Array(TRAIL * 3),
      n: 0,
      sep: [],
      blown: false,
      step: makeStepper(method, 3),
    };
    q('[data-msg]').textContent = '';
    draw();
  }

  function advance() {
    const dt = h();
    S.step(f, S.t, S.a, dt);
    S.step(f, S.t, S.b, dt);
    S.t += dt;
    if (!Number.isFinite(S.a[0]) || Math.abs(S.a[0]) > 1e4) {
      S.blown = true;
      playing = false;
      q('[data-msg]').innerHTML = `<span class="text-red-500 font-medium">The solution blew up.</span> ${method === 'euler' ? 'Euler with this step size adds energy faster than the system can lose it.' : 'Try a smaller step.'} Reset to try again.`;
      return;
    }
    const i = (S.n % TRAIL) * 3;
    S.ta.set(S.a, i);
    S.tb.set(S.b, i);
    S.n++;
    if (S.t <= T_SEP && S.n % 2 === 0) {
      const d = Math.hypot(S.a[0] - S.b[0], S.a[1] - S.b[1], S.a[2] - S.b[2]);
      S.sep.push([S.t, Math.max(1e-12, d)]);
    }
  }

  const proj = (x, y, z) => {
    const cy = Math.cos(yaw);
    const sy = Math.sin(yaw);
    const xr = x * cy - y * sy;
    const yr = x * sy + y * cy;
    const zz = z - 25;
    const sc = H / 56;
    return [W / 2 + xr * sc, H / 2 - (zz * Math.cos(pitch) - yr * Math.sin(pitch)) * sc];
  };

  function drawTrail(buf, color) {
    const n = Math.min(S.n, TRAIL);
    if (n < 2) return;
    const start = S.n - n;
    const chunks = 10;
    const per = Math.ceil(n / chunks);
    g.strokeStyle = color;
    g.lineWidth = 1.4;
    for (let c = 0; c < chunks; c++) {
      g.globalAlpha = 0.12 + (0.88 * (c + 1)) / chunks;
      g.beginPath();
      for (let k = c * per; k <= Math.min(n - 1, (c + 1) * per); k++) {
        const i = ((start + k) % TRAIL) * 3;
        const [px, py] = proj(buf[i], buf[i + 1], buf[i + 2]);
        if (k === c * per) g.moveTo(px, py);
        else g.lineTo(px, py);
      }
      g.stroke();
    }
    g.globalAlpha = 1;
  }

  function draw() {
    const easy = isEasy();
    q('[data-hv]').textContent = h().toFixed(3);
    q('[data-sv]').textContent = Number(q('[data-sigma]').value).toFixed(1);
    q('[data-rv]').textContent = Number(q('[data-rho]').value).toFixed(1);
    q('[data-bv]').textContent = Number(q('[data-beta]').value).toFixed(2);
    markGroup(q('[data-method]'), method);
    g.clearRect(0, 0, W, H);
    g.fillStyle = '#9ca3af';
    g.globalAlpha = 0.35;
    for (let k = 0; k < ref.length; k += 3) {
      const [px, py] = proj(ref[k], ref[k + 1], ref[k + 2]);
      g.fillRect(px, py, 1, 1);
    }
    g.globalAlpha = 1;
    drawTrail(S.tb, C.orange);
    drawTrail(S.ta, C.blue);
    for (const [u, col] of [
      [S.b, C.orange],
      [S.a, C.blue],
    ]) {
      const [px, py] = proj(u[0], u[1], u[2]);
      g.fillStyle = col;
      g.beginPath();
      g.arc(px, py, 4, 0, Math.PI * 2);
      g.fill();
    }
    legend(g, [[C.blue, easy ? 'path A' : 'x₀ = 1'], [C.orange, easy ? 'path B (nudged by 0.00000001)' : 'x₀ = 1 + 10⁻⁸']], 10, 16);
    label(g, `t = ${S.t.toFixed(1)}`, W - 10, 16, { align: 'right' });

    // separation
    gs.clearRect(0, 0, SW, SH);
    const ax = axes(gs, { x: 44, y: 10, w: SW - 54, h: SH - 46 }, { xr: [0, T_SEP], yr: [1e-10, 100], ylog: true, xLabel: 'time', yLabel: easy ? 'distance between A and B' : '|δ(t)|' });
    ax.clip();
    const ts = [0, T_SEP];
    path(gs, ax.X, ax.Y, ts, ts.map((t) => EPS * Math.exp(LYAP * t)), { color: C.faint, dash: [4, 3], width: 1.2 });
    path(gs, ax.X, ax.Y, S.sep.map((p) => p[0]), S.sep.map((p) => p[1]), { color: C.ink, width: 1.8 });
    ax.unclip();
    label(gs, easy ? 'dashed: doubles about every 0.8 time units' : `dashed: e^{λt}, λ ≈ ${LYAP}`, 52, 24, { color: C.muted });
    if (S.sep.length && S.sep[S.sep.length - 1][1] > 5 && !q('[data-msg]').textContent)
      q('[data-msg]').textContent = easy ? 'The two paths are now on different wings. A difference smaller than an atom became the whole picture.' : 'Saturated: |δ| is now the size of the attractor. Past here the two runs are uncorrelated.';
  }

  let playing = false;
  let acc = 0;
  animate(root, (dtMs) => {
    if (playing && !S.blown) {
      acc += (dtMs / 1000) * 2.5; // 2.5 time units per real second
      let guard = 4000;
      while (acc >= h() && guard-- && !S.blown) {
        acc -= h();
        advance();
      }
      if (!playing) setPlaying(q('[data-play]'), false);
    }
    draw();
  });

  let dragging = false;
  let last = null;
  cv.onpointerdown = (ev) => {
    dragging = true;
    cv.setPointerCapture(ev.pointerId);
    last = canvasPoint(cv, ev, W, H);
  };
  cv.onpointermove = (ev) => {
    if (!dragging) return;
    const p = canvasPoint(cv, ev, W, H);
    yaw += (p[0] - last[0]) * 0.01;
    pitch = Math.max(-1.4, Math.min(1.4, pitch + (p[1] - last[1]) * 0.01));
    last = p;
  };
  cv.onpointerup = () => (dragging = false);

  q('[data-play]').onclick = () => {
    if (S.blown) reset();
    playing = !playing;
    setPlaying(q('[data-play]'), playing);
  };
  q('[data-reset]').onclick = reset;
  for (const b of q('[data-method]').children)
    b.onclick = () => {
      method = b.dataset.v;
      reset();
    };
  for (const k of ['sigma', 'rho', 'beta']) q(`[data-${k}]`).onchange = reset;
  for (const k of ['sigma', 'rho', 'beta']) q(`[data-${k}]`).oninput = () => draw();
  q('[data-h]').onchange = reset;
  q('[data-h]').oninput = draw;
  q('[data-classic]').onclick = () => {
    q('[data-sigma]').value = 10;
    q('[data-rho]').value = 28;
    q('[data-beta]').value = 2.67;
    reset();
  };
  listen(window, 'levelchange', draw);
  reset();
}
