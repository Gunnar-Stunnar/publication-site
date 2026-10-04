// Interactive demos for the DeepRacer project page.
// A JS port of the project's calibrated simulator (kinematic car at 15 Hz, 0.334 m effective
// wheelbase, ~9 m/s^2 grip, steering/drive lag), the pure-pursuit teacher, and the v2 / v2.1 rewards.
import { TRACK } from "./data";

export function startDemos() {
  let alive = true;
  const cleanups = [];
  const raf = fn => { if (alive) requestAnimationFrame(fn); };
  const listen = (type, fn) => { window.addEventListener(type, fn); cleanups.push(() => window.removeEventListener(type, fn)); };

  // ------------------------------------------------------------------ constants
  const DT = 1 / 15, L = 0.334, A_GRIP = 9.0, TAU_STEER = 0.08, TAU_SPEED = 0.3;
  const OFFTRACK_MARGIN = 0.10, MAX_STEER = 30;
  const ACTIONS = [[-23.9, 3.7], [-11.3, 3.92], [-10.0, 3.08], [-5.0, 4.0], [-2.9, 3.56], [-2.0, 3.98],
    [-0.6, 2.96], [0.0, 4.0], [4.3, 3.91], [5.0, 4.0], [6.7, 2.67], [7.4, 3.32], [9.8, 3.89], [14.6, 3.18],
    [15.9, 3.81], [16.4, 2.66], [22.5, 3.3], [24.7, 2.57]];   // the 18 actions of checkpoints 165 / 649
  const TEACHERS = {
    v2: { ld0: 0.45, gain: 0.25, recover: 0, label: "v2 teacher" },
    v21: { ld0: 0.55, gain: 0.35, recover: 0.2, label: "v2.1 damped teacher" },
  };
  const COL = { road: "#e5e7eb", edge: "#374151", center: "#9ca3af", line: "#2563eb", v2: "#f97316",
    v21: "#2563eb", ink: "#111827", muted: "#6b7280" };

  // ------------------------------------------------------------------ geometry
  const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
  const deg = r => r * 180 / Math.PI, rad = d => d * Math.PI / 180;
  const C = TRACK.center, HW = TRACK.halfWidth, RL = TRACK.line, RLV = TRACK.lineSpeed, CR = TRACK.centerRaw;
  const nC = C.length, nR = RL.length;
  const dsOf = p => { let s = 0; for (let i = 0; i < p.length; i++) { const j = (i + 1) % p.length;
    s += Math.hypot(p[j][0] - p[i][0], p[j][1] - p[i][1]); } return s / p.length; };
  const dsC = dsOf(C), dsR = dsOf(RL), LEN = dsC * nC;
  const headC = C.map((_, i) => { const a = C[(i - 1 + nC) % nC], b = C[(i + 1) % nC];
    return Math.atan2(b[1] - a[1], b[0] - a[0]); });

  function closest(pts, x, y, hint, win) {
    let best = Infinity, bi = 0;
    const n = pts.length, lo = hint == null ? 0 : hint - win, hi = hint == null ? n - 1 : hint + win;
    for (let k = lo; k <= hi; k++) { const i = ((k % n) + n) % n;
      const d = (pts[i][0] - x) ** 2 + (pts[i][1] - y) ** 2; if (d < best) { best = d; bi = i; } }
    return [bi, Math.sqrt(best)];
  }
  const signedOffset = (x, y, i) => Math.cos(headC[i]) * (y - C[i][1]) - Math.sin(headC[i]) * (x - C[i][0]);

  function curvature(p) {
    const n = p.length, k = new Array(n);
    for (let i = 0; i < n; i++) {
      const a = p[(i - 1 + n) % n], b = p[i], c = p[(i + 1) % n];
      const ab = Math.hypot(b[0] - a[0], b[1] - a[1]), bc = Math.hypot(c[0] - b[0], c[1] - b[1]),
        ca = Math.hypot(a[0] - c[0], a[1] - c[1]);
      const cr = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
      k[i] = Math.abs(2 * cr / Math.max(ab * bc * ca, 1e-9));
    }
    return k.map((_, i) => { let s = 0; for (let d = -2; d <= 2; d++) s += k[(i + d + n) % n]; return s / 5; });
  }

  function speedProfile(p, aLat, vMax, aAcc = 4, aBrake = 6, vMin = 1) {
    const k = curvature(p), n = p.length, ds = dsOf(p);
    const v = k.map(kk => Math.min(vMax, Math.max(vMin, Math.sqrt(aLat / Math.max(kk, 1e-6)))));
    for (let r = 0; r < 2; r++) {
      for (let i = n - 1; i >= 0; i--) v[i] = Math.min(v[i], Math.sqrt(v[(i + 1) % n] ** 2 + 2 * aBrake * ds));
      for (let i = 0; i < n; i++) { const j = (i + 1) % n; v[j] = Math.min(v[j], Math.sqrt(v[i] ** 2 + 2 * aAcc * ds)); }
    }
    return { v, lap: v.reduce((s, vi) => s + ds / vi, 0) };
  }

  // ------------------------------------------------------------------ car
  class Car {
    constructor() { this.reset(0); }
    reset(i, speed = 0) {
      this.x = C[i][0]; this.y = C[i][1]; this.yaw = headC[i]; this.v = speed; this.steer = 0;
      this.idx = i; this.travel = 0; this.steps = 0; this.lapStart = 0; this.offtracks = 0;
      this.lastLap = null; this.laps = 0; this.lapOff = 0; this.cleanLaps = 0;
    }
    step(steerDeg, speedCmd) {
      const sc = rad(Math.max(-MAX_STEER, Math.min(MAX_STEER, steerDeg))), vc = Math.max(0.5, Math.min(4, speedCmd));
      const h = DT / 4, as = 1 - Math.exp(-h / TAU_STEER), av = 1 - Math.exp(-h / TAU_SPEED);
      for (let s = 0; s < 4; s++) {
        this.steer += as * (sc - this.steer); this.v += av * (vc - this.v);
        let k = Math.tan(this.steer) / L; const kg = A_GRIP / Math.max(this.v * this.v, 1e-6);
        k = Math.sign(k) * Math.min(Math.abs(k), kg);
        this.yaw = wrap(this.yaw + this.v * k * h);
        this.x += this.v * Math.cos(this.yaw) * h; this.y += this.v * Math.sin(this.yaw) * h;
      }
      const old = this.idx; this.idx = closest(C, this.x, this.y, old, 20)[0];
      let d = this.idx - old; if (d > nC / 2) d -= nC; if (d < -nC / 2) d += nC;
      this.travel += d * dsC; this.steps++;
      if (this.travel >= LEN * (this.laps + 1)) {
        this.lastLap = (this.steps - this.lapStart) * DT + 5 * this.lapOff;
        this.lastClean = this.lapOff === 0;
        if (this.lapOff === 0) this.cleanLaps++;
        this.laps++; this.lapStart = this.steps; this.lapOff = 0;
      }
      if (Math.abs(signedOffset(this.x, this.y, this.idx)) > HW[this.idx] + OFFTRACK_MARGIN) {
        this.offtracks++; this.lapOff++;
        this.x = C[this.idx][0]; this.y = C[this.idx][1]; this.yaw = headC[this.idx]; this.v = 0; this.steer = 0;
        return true;
      }
      return false;
    }
  }

  // ------------------------------------------------------------------ teacher + rewards
  function teacher(x, y, yaw, v, cfg) {
    const [i, dist] = closest(RL, x, y, null, 0);
    const ld = cfg.ld0 + cfg.gain * Math.max(v, 0.5);
    const t = RL[(i + Math.round(ld / dsR)) % nR];
    const alpha = wrap(Math.atan2(t[1] - y, t[0] - x) - yaw);
    let steer = deg(Math.atan2(2 * L * Math.sin(alpha), ld));
    let speed = RLV[(i + Math.round(Math.max(v, 0.5) * 0.2 / dsR)) % nR];
    const a = RL[i], b = RL[(i + Math.max(1, Math.round(0.3 / dsR))) % nR];
    const headingErr = deg(wrap(yaw - Math.atan2(b[1] - a[1], b[0] - a[0])));
    if (cfg.recover) { const trouble = Math.min(1, Math.max(Math.abs(headingErr) / 25, dist / 0.35));
      speed = Math.max(1.5, speed * (1 - cfg.recover * trouble)); }
    return { steer: Math.max(-MAX_STEER, Math.min(MAX_STEER, steer)), speed, headingErr, dist, target: t };
  }

  // the reward a DeepRacer worker would compute for action (steer, speed) taken at pose (x, y, yaw)
  function reward(version, x, y, yaw, steer, speed) {
    const [ci] = closest(C, x, y, null, 0);
    const off = Math.abs(signedOffset(x, y, ci));
    if (off > HW[ci] + OFFTRACK_MARGIN) return { total: 0.001, offtrack: true };
    const cfg = version === "v2" ? TEACHERS.v2 : TEACHERS.v21;
    const T = teacher(x, y, yaw, speed, cfg);      // DeepRacer's params["speed"] is the chosen action's speed
    const steerS = Math.exp(-0.5 * ((steer - T.steer) / 6) ** 2);
    const speedS = Math.exp(-0.5 * ((speed - T.speed) / 0.5) ** 2);
    let total = steerS * (0.4 + 0.6 * speedS), headS = null, distS = null;
    if (version !== "v2") {
      headS = Math.exp(-0.5 * (T.headingErr / 10) ** 2); distS = Math.exp(-0.5 * (T.dist / 0.15) ** 2);
      total *= 0.6 + 0.2 * headS + 0.2 * distS;
    }
    if (off > HW[ci] - OFFTRACK_MARGIN) total *= 0.5;   // not all wheels on track
    return { total: total + 0.001, steerS, speedS, headS, distS, T };
  }

  const nearestAction = (st, sp) => ACTIONS.reduce((best, a) =>
    ((a[0] - st) / 6) ** 2 + ((a[1] - sp) / 0.5) ** 2 < ((best[0] - st) / 6) ** 2 + ((best[1] - sp) / 0.5) ** 2 ? a : best);

  // ------------------------------------------------------------------ drawing helpers
  const allPts = TRACK.inner.concat(TRACK.outer);
  const bx = [Math.min(...allPts.map(p => p[0])), Math.max(...allPts.map(p => p[0]))];
  const by = [Math.min(...allPts.map(p => p[1])), Math.max(...allPts.map(p => p[1]))];

  function setupCanvas(cv) {
    const r = window.devicePixelRatio || 1, w = cv.clientWidth, h = cv.clientHeight;
    cv.width = w * r; cv.height = h * r;
    const ctx = cv.getContext("2d"); ctx.setTransform(r, 0, 0, r, 0, 0);
    const pad = 14, s = Math.min((w - 2 * pad) / (bx[1] - bx[0]), (h - 2 * pad) / (by[1] - by[0]));
    const ox = (w - s * (bx[1] - bx[0])) / 2, oy = (h - s * (by[1] - by[0])) / 2;
    const T = p => [ox + (p[0] - bx[0]) * s, h - oy - (p[1] - by[0]) * s];
    const inv = (px, py) => [bx[0] + (px - ox) / s, by[0] + (h - oy - py) / s];
    return { ctx, w, h, s, T, inv };
  }

  function drawTrack(v, opts = {}) {
    const { ctx, T } = v;
    ctx.clearRect(0, 0, v.w, v.h);
    ctx.beginPath();
    [TRACK.outer, TRACK.inner].forEach(poly => { poly.forEach((p, i) => { const q = T(p); i ? ctx.lineTo(...q) : ctx.moveTo(...q); }); ctx.closePath(); });
    ctx.fillStyle = COL.road; ctx.fill("evenodd");
    ctx.lineWidth = 1.5; ctx.strokeStyle = COL.edge; ctx.stroke();
    if (opts.center !== false) { ctx.setLineDash([4, 5]); ctx.strokeStyle = COL.center; ctx.lineWidth = 1;
      ctx.beginPath(); C.forEach((p, i) => { const q = T(p); i ? ctx.lineTo(...q) : ctx.moveTo(...q); }); ctx.closePath(); ctx.stroke(); ctx.setLineDash([]); }
  }

  function drawPolyline(v, pts, color, width = 2, colors = null) {
    const { ctx, T } = v;
    if (!colors) { ctx.strokeStyle = color; ctx.lineWidth = width; ctx.beginPath();
      pts.forEach((p, i) => { const q = T(p); i ? ctx.lineTo(...q) : ctx.moveTo(...q); }); ctx.closePath(); ctx.stroke(); return; }
    ctx.lineWidth = width;
    for (let i = 0; i < pts.length; i++) { const a = T(pts[i]), b = T(pts[(i + 1) % pts.length]);
      ctx.strokeStyle = colors[i]; ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); }
  }

  function drawCar(v, x, y, yaw, color) {
    const { ctx, T, s } = v, [px, py] = T([x, y]), len = 0.32 * s, wid = 0.18 * s;
    ctx.save(); ctx.translate(px, py); ctx.rotate(-yaw);
    ctx.fillStyle = color; ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.rect(-len * 0.25, -wid / 2, len, wid); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.moveTo(len * 0.75, 0); ctx.lineTo(len * 0.45, -wid * 0.3); ctx.lineTo(len * 0.45, wid * 0.3); ctx.fill();
    ctx.restore();
  }

  function speedColor(v, lo = 1.5, hi = 4) {     // slow = deep blue, fast = bright yellow
    const t = Math.max(0, Math.min(1, (v - lo) / (hi - lo)));
    const stops = [[49, 54, 149], [69, 117, 180], [116, 173, 209], [254, 224, 144], [253, 174, 97], [244, 109, 67]];
    const f = t * (stops.length - 1), i = Math.min(Math.floor(f), stops.length - 2), u = f - i;
    const c = stops[i].map((a, j) => Math.round(a + (stops[i + 1][j] - a) * u));
    return `rgb(${c[0]},${c[1]},${c[2]})`;
  }
  function viridis(t) {
    t = Math.max(0, Math.min(1, t));
    const s = [[68, 1, 84], [59, 82, 139], [33, 145, 140], [94, 201, 98], [253, 231, 37]];
    const f = t * (s.length - 1), i = Math.min(Math.floor(f), s.length - 2), u = f - i;
    return `rgb(${s[i].map((a, j) => Math.round(a + (s[i + 1][j] - a) * u)).join(",")})`;
  }

  function lineChart(cv, series, yRange, yLabel) {
    const r = window.devicePixelRatio || 1, w = cv.clientWidth, h = cv.clientHeight;
    cv.width = w * r; cv.height = h * r; const ctx = cv.getContext("2d"); ctx.setTransform(r, 0, 0, r, 0, 0);
    const l = 40, b = 18, t = 8, rr = 8, [y0, y1] = yRange;
    ctx.clearRect(0, 0, w, h); ctx.font = "11px Inter, sans-serif"; ctx.fillStyle = COL.muted;
    ctx.strokeStyle = "#e5e7eb"; ctx.lineWidth = 1;
    [y0, (y0 + y1) / 2, y1].forEach(yv => { const py = t + (1 - (yv - y0) / (y1 - y0)) * (h - t - b);
      ctx.beginPath(); ctx.moveTo(l, py); ctx.lineTo(w - rr, py); ctx.stroke(); ctx.fillText(yv.toFixed(2), 4, py + 4); });
    ctx.fillText(yLabel, l + 4, h - 4);
    series.forEach(sr => { if (sr.data.length < 2) return; ctx.strokeStyle = sr.color; ctx.lineWidth = 1.6; ctx.beginPath();
      sr.data.forEach((yv, i) => { const px = l + i / (sr.max - 1) * (w - l - rr);
        const py = t + (1 - (Math.max(y0, Math.min(y1, yv)) - y0) / (y1 - y0)) * (h - t - b); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); });
      ctx.stroke(); });
  }

  const $ = id => document.getElementById(id);

  // ------------------------------------------------------------------ demo 1: linear readout
  function demoLinear() {
    const cv = $("lin-canvas"); if (!cv) return;
    const DIST = [0.4, 0.8, 1.2, 1.8, 2.5, 3.5];
    let view = setupCanvas(cv), car = new Car(), mode = "idle", W = null, trail = [], data = [], acc = 0, drift = 0, last = 0, fitR2 = null;
    const features = c => { const f = DIST.map(d => { const p = C[(c.idx + Math.round(d / dsC)) % nC];
      const dx = p[0] - c.x, dy = p[1] - c.y, cs = Math.cos(c.yaw), sn = Math.sin(c.yaw);
      return Math.atan2(-sn * dx + cs * dy, cs * dx + sn * dy) / (Math.PI / 4); }); f.push(1); return f; };
    const centerTeacher = c => { const ld = 0.45 + 0.25 * Math.max(c.v, 0.5), t = C[(c.idx + Math.round(ld / dsC)) % nC];
      const a = wrap(Math.atan2(t[1] - c.y, t[0] - c.x) - c.yaw); return deg(Math.atan2(2 * L * Math.sin(a), ld)); };
    const speed = () => +$("lin-speed").value;
    function solve(A, bvec) {          // Gaussian elimination for the small normal equations
      const n = bvec.length, M = A.map((row, i) => row.concat([bvec[i]]));
      for (let c = 0; c < n; c++) { let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
        [M[c], M[p]] = [M[p], M[c]]; for (let r = 0; r < n; r++) if (r !== c) { const f = M[r][c] / M[c][c]; for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]; } }
      return M.map((row, i) => row[n] / row[i]);
    }
    function fit() {
      const n = 7, A = Array.from({ length: n }, () => new Array(n).fill(0)), bvec = new Array(n).fill(0);
      data.forEach(([f, y]) => { for (let i = 0; i < n; i++) { bvec[i] += f[i] * y; for (let j = 0; j < n; j++) A[i][j] += f[i] * f[j]; } });
      for (let i = 0; i < n; i++) A[i][i] += 1e-3;
      W = solve(A, bvec);
      const ys = data.map(d => d[1]), mean = ys.reduce((a, b) => a + b) / ys.length;
      const ssr = data.reduce((s, [f, y]) => s + (y - f.reduce((a, fi, i) => a + fi * W[i], 0)) ** 2, 0);
      fitR2 = 1 - ssr / ys.reduce((s, y) => s + (y - mean) ** 2, 0);
    }
    function status() {
      const m = { idle: "Press “1. Collect & fit”.", collect: `Teacher driving with random wobble… ${data.length}/1500 samples`,
        drive: "Linear readout driving — no teacher, no hidden layers." }[mode];
      $("lin-status").textContent = m;
      $("lin-stats").innerHTML = mode === "drive"
        ? `laps <b>${car.laps}</b> · clean <b>${car.cleanLaps}</b> · off-tracks <b>${car.offtracks}</b> · last lap <b>${car.lastLap ? car.lastLap.toFixed(2) + " s" : "–"}</b>`
        : fitR2 != null ? `fit R² = <b>${fitR2.toFixed(3)}</b> on ${data.length} samples` : "";
      const wc = $("lin-weights"); if (!W) { wc.innerHTML = ""; return; }
      const mx = Math.max(...W.slice(0, 6).map(Math.abs));
      wc.innerHTML = W.slice(0, 6).map((w, i) => `<div class="flex items-center gap-2 text-xs"><span class="w-12 text-gray-500">${DIST[i]} m</span>
        <div class="flex-1 bg-gray-100 h-3 rounded relative"><div class="absolute h-3 rounded ${w >= 0 ? "bg-blue-500" : "bg-orange-500"}"
        style="left:${w >= 0 ? 50 : 50 - 50 * Math.abs(w) / mx}%;width:${50 * Math.abs(w) / mx}%"></div></div><span class="w-14 text-right">${w.toFixed(1)}</span></div>`).join("");
    }
    function tick(ts) {
      if (!last) last = ts; acc += Math.min(0.1, (ts - last) / 1000) * (+$("lin-ff").value); last = ts;
      while (acc >= DT) { acc -= DT;
        if (mode === "collect") {
          const st = centerTeacher(car); data.push([features(car), st]);
          drift = 0.9 * drift + (Math.random() - 0.5) * 8; car.step(st + drift, speed());
          if (data.length >= 1500) { fit(); mode = "idle"; }
        } else if (mode === "drive") {
          const f = features(car); car.step(f.reduce((a, fi, i) => a + fi * W[i], 0), speed());
        }
        if (mode !== "idle") { trail.push([car.x, car.y]); if (trail.length > 400) trail.shift(); }
      }
      drawTrack(view);
      if (trail.length > 1) { const { ctx, T } = view; ctx.strokeStyle = mode === "drive" ? COL.v21 : COL.v2; ctx.lineWidth = 2;
        ctx.beginPath(); trail.forEach((p, i) => { const q = T(p); i ? ctx.lineTo(...q) : ctx.moveTo(...q); }); ctx.stroke(); }
      const { ctx, T } = view; ctx.strokeStyle = "rgba(37,99,235,0.45)"; ctx.lineWidth = 1;
      DIST.forEach(d => { const p = C[(car.idx + Math.round(d / dsC)) % nC]; ctx.beginPath(); ctx.moveTo(...T([car.x, car.y])); ctx.lineTo(...T(p)); ctx.stroke();
        ctx.fillStyle = COL.v21; ctx.beginPath(); ctx.arc(...T(p), 3, 0, 7); ctx.fill(); });
      drawCar(view, car.x, car.y, car.yaw, mode === "drive" ? COL.v21 : COL.v2);
      status(); raf(tick);
    }
    $("lin-collect").onclick = () => { car.reset(0); data = []; W = null; fitR2 = null; trail = []; mode = "collect"; };
    $("lin-drive").onclick = () => { if (!W) return; car.reset(0); trail = []; mode = "drive"; };
    listen("resize", () => { view = setupCanvas(cv); });
    raf(tick);
  }

  // ------------------------------------------------------------------ demo 2: racing line explorer
  function demoLine() {
    const cv = $("rl-canvas"), ch = $("rl-chart"); if (!cv) return;
    let view = setupCanvas(cv);
    function render() {
      const aLat = +$("rl-alat").value, vMax = +$("rl-vmax").value;
      $("rl-alat-v").textContent = aLat.toFixed(1); $("rl-vmax-v").textContent = vMax.toFixed(1);
      const line = speedProfile(RL, aLat, vMax), cen = speedProfile(CR, aLat, vMax);
      const show = $("rl-show").value;
      drawTrack(view, { center: show !== "line" });
      if (show !== "line") drawPolyline(view, CR, null, 4, cen.v.map(v => speedColor(v, 1, vMax)));
      if (show !== "center") drawPolyline(view, RL, null, 4, line.v.map(v => speedColor(v, 1, vMax)));
      $("rl-lap").innerHTML = `ideal lap — centerline <b>${cen.lap.toFixed(2)} s</b> · racing line <b class="text-blue-600">${line.lap.toFixed(2)} s</b>
        (${((1 - line.lap / cen.lap) * 100).toFixed(0)}% faster)`;
      const sample = (arr, n) => Array.from({ length: n }, (_, i) => arr[Math.floor(i * arr.length / n)]);
      lineChart(ch, [{ data: sample(cen.v, 300), color: COL.center, max: 300 }, { data: sample(line.v, 300), color: COL.line, max: 300 }],
        [1, vMax], "target speed (m/s) along one lap — gray: centerline, blue: racing line");
    }
    ["rl-alat", "rl-vmax", "rl-show"].forEach(id => $(id).addEventListener("input", render));
    listen("resize", () => { view = setupCanvas(cv); render(); });
    render();
  }

  // ------------------------------------------------------------------ demo 3: reward explorer
  function demoReward() {
    const cv = $("rw-canvas"), hm = $("rw-heat"); if (!cv) return;
    let view = setupCanvas(cv), pose = { x: C[30][0], y: C[30][1] }, sel = null, dragging = false;
    function poseYaw() { const [i] = closest(RL, pose.x, pose.y, null, 0), a = RL[i], b = RL[(i + 6) % nR];
      return Math.atan2(b[1] - a[1], b[0] - a[0]) + rad(+$("rw-head").value); }
    function render() {
      const ver = $("rw-ver").value, yaw = poseYaw();
      $("rw-head-v").textContent = (+$("rw-head").value > 0 ? "+" : "") + $("rw-head").value + "°";
      drawTrack(view); drawPolyline(view, RL, "rgba(37,99,235,0.35)", 2);
      // reward over the action grid
      const r = window.devicePixelRatio || 1, w = hm.clientWidth, h = hm.clientHeight; hm.width = w * r; hm.height = h * r;
      const c = hm.getContext("2d"); c.setTransform(r, 0, 0, r, 0, 0); c.clearRect(0, 0, w, h);
      const l = 34, b = 34, t = 8, rr = 8, NX = 61, NY = 33, VTOP = 4.2, cw = (w - l - rr) / NX, chh = (h - t - b) / NY;
      const px = s => l + (s + 30) / 60 * (w - l - rr), py = v => t + (1 - (v - 1) / (VTOP - 1)) * (h - t - b);
      for (let ix = 0; ix < NX; ix++) for (let iy = 0; iy < NY; iy++) {
        const s = -30 + ix, v = 1 + iy * 0.1, R = reward(ver, pose.x, pose.y, yaw, s, v);
        c.fillStyle = viridis(R.total); c.fillRect(l + ix * cw, t + (NY - 1 - iy) * chh, cw + 0.6, chh + 0.6);
      }
      let best = null, bestR = -1;
      ACTIONS.forEach(a => { const R = reward(ver, pose.x, pose.y, yaw, a[0], a[1]).total; if (R > bestR) { bestR = R; best = a; } });
      ACTIONS.forEach(a => { c.fillStyle = "#fff"; c.strokeStyle = "#111"; c.lineWidth = 1; c.beginPath(); c.arc(px(a[0]), py(a[1]), 3.5, 0, 7); c.fill(); c.stroke(); });
      c.strokeStyle = "#f97316"; c.lineWidth = 2.5; c.beginPath(); c.arc(px(best[0]), py(best[1]), 8, 0, 7); c.stroke();
      const chosen = sel || best;
      c.strokeStyle = "#fff"; c.lineWidth = 1.5; c.strokeRect(px(chosen[0]) - 6, py(chosen[1]) - 6, 12, 12);
      c.fillStyle = COL.muted; c.font = "11px Inter, sans-serif";
      c.fillText("steering (°)", px(0) - 30, h - 3); [-30, -15, 0, 15, 30].forEach(s => c.fillText(s, px(s) - 7, h - 20));
      [1, 2, 3, 4].forEach(v => c.fillText(v, 14, py(v) + 4)); c.save(); c.translate(10, t + 40); c.rotate(-Math.PI / 2); c.fillText("speed", -30, 0); c.restore();
      // track overlay: car, teacher target, lookahead ray
      const R = reward(ver, pose.x, pose.y, yaw, chosen[0], chosen[1]);
      const { ctx, T } = view;
      if (R.T) { ctx.strokeStyle = "#16a34a"; ctx.setLineDash([3, 3]); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(...T([pose.x, pose.y])); ctx.lineTo(...T(R.T.target)); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = "#16a34a"; ctx.beginPath(); ctx.arc(...T(R.T.target), 4.5, 0, 7); ctx.fill(); }
      drawCar(view, pose.x, pose.y, yaw, R.offtrack ? "#9ca3af" : COL.v2);
      const bar = (label, val) => val == null ? "" : `<div class="flex items-center gap-2 text-xs"><span class="w-28 text-gray-500">${label}</span>
        <div class="flex-1 bg-gray-100 h-2.5 rounded"><div class="h-2.5 rounded bg-blue-500" style="width:${(val * 100).toFixed(0)}%"></div></div><span class="w-10 text-right">${val.toFixed(2)}</span></div>`;
      $("rw-info").innerHTML = R.offtrack ? `<p class="text-sm text-red-600">Off track — reward 0.001</p>` :
        `<p class="text-sm mb-2">Teacher says <b>${R.T.steer.toFixed(1)}°</b> at <b>${R.T.speed.toFixed(2)} m/s</b>
        · heading error ${R.T.headingErr.toFixed(0)}° · ${(R.T.dist * 100).toFixed(0)} cm from the line</p>
        <p class="text-sm mb-2">Action <b>${chosen[0]}°, ${chosen[1]} m/s</b> ${sel ? "" : "(highest-reward action)"} → reward <b>${R.total.toFixed(3)}</b></p>
        ${bar("steering match", R.steerS)}${bar("speed match", R.speedS)}${bar("heading (v2.1)", R.headS)}${bar("on the line (v2.1)", R.distS)}`;
    }
    const pick = e => { const rc = cv.getBoundingClientRect(), [x, y] = view.inv(e.clientX - rc.left, e.clientY - rc.top);
      const [ci] = closest(C, x, y, null, 0); if (Math.abs(signedOffset(x, y, ci)) < HW[ci] + 0.25) { pose = { x, y }; render(); } };
    cv.addEventListener("pointerdown", e => { dragging = true; pick(e); });
    cv.addEventListener("pointermove", e => { if (dragging) pick(e); });
    listen("pointerup", () => dragging = false);
    hm.addEventListener("click", e => { const rc = hm.getBoundingClientRect(), w = hm.clientWidth, h = hm.clientHeight, l = 34, b = 34, t = 8, rr = 8;
      const s = -30 + (e.clientX - rc.left - l) / (w - l - rr) * 60, v = 1 + (1 - (e.clientY - rc.top - t) / (h - t - b)) * 3.2;
      sel = ACTIONS.reduce((bst, a) => Math.hypot((a[0] - s) / 60, (a[1] - v) / 3) < Math.hypot((bst[0] - s) / 60, (bst[1] - v) / 3) ? a : bst); render(); });
    ["rw-ver", "rw-head"].forEach(id => $(id).addEventListener("input", () => { sel = null; render(); }));
    listen("resize", () => { view = setupCanvas(cv); render(); });
    render();
  }

  // ------------------------------------------------------------------ demo 4: delay vs damping
  function demoDamping() {
    const cv = $("dm-canvas"), ch = $("dm-chart"); if (!cv) return;
    let view = setupCanvas(cv), acc = 0, last = 0, sims;
    const make = key => ({ key, cfg: TEACHERS[key], car: new Car(), buf: [], trail: [], err: [] });
    function reset() { sims = [make("v2"), make("v21")]; sims.forEach(s => s.car.reset(0)); }
    function stepSim(s) {
      const delay = +$("dm-delay").value, c = s.car;
      s.buf.push({ x: c.x, y: c.y, yaw: c.yaw, v: c.v }); while (s.buf.length > delay + 1) s.buf.shift();
      const o = s.buf[0], T = teacher(o.x, o.y, o.yaw, o.v, s.cfg);
      const a = nearestAction(T.steer, T.speed);                       // a trained net picks one of 18 actions
      const crashed = c.step(a[0], a[1]);
      if (crashed) { s.buf = []; s.trail.push(null); }
      s.trail.push([c.x, c.y]); if (s.trail.length > 600) s.trail.shift();
      const [, d] = closest(RL, c.x, c.y, null, 0); s.err.push(d); if (s.err.length > 300) s.err.shift();
    }
    function tick(ts) {
      if (!last) last = ts; acc += Math.min(0.1, (ts - last) / 1000) * (+$("dm-ff").value); last = ts;
      while (acc >= DT) { acc -= DT; sims.forEach(stepSim); }
      drawTrack(view); drawPolyline(view, RL, "rgba(37,99,235,0.25)", 1.5);
      const { ctx, T } = view;
      sims.forEach(s => { ctx.strokeStyle = COL[s.key]; ctx.lineWidth = 1.8; ctx.beginPath(); let pen = false;
        s.trail.forEach(p => { if (!p) { pen = false; return; } const q = T(p); pen ? ctx.lineTo(...q) : ctx.moveTo(...q); pen = true; }); ctx.stroke(); });
      sims.forEach(s => drawCar(view, s.car.x, s.car.y, s.car.yaw, COL[s.key]));
      const d = +$("dm-delay").value; $("dm-delay-v").textContent = `${d} step${d === 1 ? "" : "s"} (${Math.round(d * 1000 / 15)} ms)`;
      $("dm-stats").innerHTML = sims.map(s => `<div><span class="inline-block w-3 h-3 rounded-sm mr-1 align-middle" style="background:${COL[s.key]}"></span>
        <b>${s.cfg.label}</b> — laps ${s.car.laps}, off-tracks <b>${s.car.offtracks}</b>, last lap ${s.car.lastLap ? s.car.lastLap.toFixed(2) + " s" : "–"},
        avg distance from line ${(s.err.reduce((a, b) => a + b, 0) / Math.max(s.err.length, 1) * 100).toFixed(0)} cm</div>`).join("");
      lineChart(ch, sims.map(s => ({ data: s.err, color: COL[s.key], max: 300 })), [0, 0.6], "distance from racing line (m), last 20 s");
      raf(tick);
    }
    $("dm-reset").onclick = reset; $("dm-delay").addEventListener("input", reset);
    listen("resize", () => { view = setupCanvas(cv); });
    reset(); raf(tick);
  }

  demoLinear(); demoLine(); demoReward(); demoDamping();
  return () => { alive = false; cleanups.forEach(fn => fn()); };
}
