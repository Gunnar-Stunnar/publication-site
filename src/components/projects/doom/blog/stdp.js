// STDP on a single postsynaptic neuron with two inputs. Input A fires at a
// set offset from the postsynaptic spike; input B fires at random. Each
// synapse keeps only local state: its presynaptic trace, the postsynaptic
// trace, and an eligibility tag. A global feedback signal (pattern or noise)
// then turns tags into weight changes. Same constants as the culture model,
// except the LTD strength, which starts in the textbook competitive regime
// (A- > A+, so uncorrelated inputs weaken); the culture's 0.5 is one click away.
import { setupCanvas } from '../ui/cultureview.js';
import { gaussian } from '../rng.js';
import { Chart } from '../ui/charts.js';
import { listen, track, isEasyLevel } from '../lifecycle.js';

const TAU = 20; // ms, STDP trace time constant (culture: tauTrace)
const A_MINUS_CULTURE = 0.5; // LTD/LTP ratio used by the culture (aMinus)
const A_MINUS_COMPETITIVE = 1.5; // demo default: depression-dominated, so random input loses
const TAU_E = -50 / Math.log(0.9); // ms, eligibility decay (culture: 0.9 per 50 ms tick)
const ETA = 0.2; // weight change per unit of tag when you press Pattern
const ETA_AUTO = 0.06; // smaller step for automatic feedback after every pairing
const B_RATE = 0.02; // B's random firing, per ms (20 Hz)
const W_MAX = 3;
const KAPPA = 0.6; // pull toward the mean under noise
const SIGMA = 0.15; // jitter under noise
const WIN = 400; // ms of history shown
const PERIOD = 150; // ms between A/post pairings
const SIM_SPEED = 0.15; // simulated ms per real ms (150 ms of spikes per second), independent of display refresh rate

const C = { A: '#3b82f6', B: '#8b5cf6', P: '#f97316', pos: '#22c55e', neg: '#ef4444', grid: '#e5e7eb', muted: '#6b7280', ink: '#111827' };
const lv = (easy, hard) => `<span class="lv-easy">${easy}</span><span class="lv-hard">${hard}</span>`;
const btn = (label, attrs = '') => `<button ${attrs} class="px-3 py-1 rounded text-sm bg-gray-200 hover:bg-gray-300">${label}</button>`;

export function mountSTDP(root) {
  root.innerHTML = `
  <div class="flex flex-wrap items-center gap-2 mb-3">
    <button data-play class="px-4 py-1 rounded text-white bg-green-500 hover:bg-green-600">Play</button>
    ${btn('Reset', 'data-reset')}
    <label class="text-sm ml-2 flex items-center gap-2">${lv('A fires', 'Δt = t<sub>post</sub> − t<sub>A</sub>')}
      <input data-dt type="range" min="-50" max="50" step="5" value="10" class="w-36"/>
      <span data-dtv class="tabular-nums text-gray-600 w-44"></span></label>
    <label class="text-sm flex items-center gap-1.5"><input data-bon type="checkbox" checked class="accent-violet-500"/> B fires at random</label>
  </div>
  <div class="flex flex-wrap items-center gap-x-4 gap-y-2 mb-3">
    <label class="text-sm flex items-center gap-2">${lv('How much "output first" weakens', 'LTD strength A<sub>−</sub>')}
      <input data-am type="range" min="0.25" max="1.5" step="0.05" value="${A_MINUS_COMPETITIVE}" class="w-32"/>
      <span data-amv class="tabular-nums text-gray-600 w-44"></span></label>
    <div class="flex gap-1" data-am-preset>${btn(lv('Textbook', 'Competitive (1.5)'), `data-v="${A_MINUS_COMPETITIVE}"`)}${btn(lv("Dish's setting", 'Culture (0.5)'), `data-v="${A_MINUS_CULTURE}"`)}</div>
    <label class="text-sm flex items-center gap-1.5"><input data-auto type="checkbox" class="accent-green-500"/> ${lv('Drumbeat after every pairing (auto)', 'Auto: pattern after every pairing')}</label>
    <span class="text-sm text-gray-500">Speed</span>
    <div class="flex gap-1" data-speed>${btn('1×', 'data-v="1"')}${btn('5×', 'data-v="5"')}</div>
  </div>
  <div class="grid lg:grid-cols-5 gap-6">
    <div class="lg:col-span-3">
      <canvas data-tl></canvas>
      <div class="flex flex-wrap items-center gap-1.5 mt-2">
        <span class="text-sm text-gray-600 mr-1">Fire by hand:</span>
        ${btn('A', 'data-fire="A"')} ${btn('B', 'data-fire="B"')} ${btn('Output', 'data-fire="P"')}
      </div>
    </div>
    <div class="lg:col-span-2">
      <div class="text-sm font-medium mb-1">${lv('Timing rule: which order strengthens', 'STDP window: tag change per pairing')}</div>
      <canvas data-win></canvas>
      <table class="text-sm w-full mt-3 tabular-nums">
        <thead><tr class="text-gray-500"><th class="text-left font-medium">synapse</th><th class="text-right font-medium">${lv('tag', 'eligibility e')}</th><th class="text-right font-medium">${lv('strength', 'weight w')}</th></tr></thead>
        <tbody data-rows></tbody>
      </table>
      <div class="flex flex-wrap gap-1.5 mt-3">
        <button data-pattern class="px-3 py-1 rounded text-sm text-white bg-green-500 hover:bg-green-600">Pattern → consolidate</button>
        <button data-noise class="px-3 py-1 rounded text-sm text-white bg-red-500 hover:bg-red-600">Noise → scramble</button>
      </div>
      <div data-msg class="text-xs text-gray-500 mt-2 min-h-[2.5rem]"></div>
      <div class="text-sm font-medium mt-2 mb-1">${lv('Connection strength over time', 'Weights over time')} <span class="text-gray-500 font-normal text-xs">(they only change when feedback arrives)</span></div>
      <canvas data-wc></canvas>
    </div>
  </div>`;
  const q = root.querySelector.bind(root);
  const TW = 560;
  const TH = 250;
  const gt = setupCanvas(q('[data-tl]'), TW, TH);
  q('[data-tl]').style.maxWidth = `${TW * 1.3}px`;
  const WW = 300;
  const WH = 190;
  const gw = setupCanvas(q('[data-win]'), WW, WH);
  q('[data-win]').style.maxWidth = `${WW * 1.3}px`;

  let S;
  const reset = () => {
    S = {
      t: 0,
      x: { A: 0, B: 0 },
      y: 0,
      e: { A: 0, B: 0 },
      w: { A: 1, B: 1 },
      hist: { A: new Float32Array(WIN), B: new Float32Array(WIN), P: new Float32Array(WIN) },
      spikes: [], // {who, t}
      queue: [], // {who, t}
      dots: [], // {dt, de, who, t}
      flash: { A: 0, B: 0, P: 0 },
      nextPair: 30,
      fbAt: null, // pending automatic feedback time
      wHist: [[0, 1, 1]], // [seconds, wA, wB]
    };
    q('[data-msg]').textContent = '';
    drawAll();
  };

  const dtVal = () => Number(q('[data-dt]').value);
  const aMinus = () => Number(q('[data-am]').value);
  const wChart = new Chart(q('[data-wc]'), { w: 300, h: 150, xLabel: 'simulated seconds', xWindow: 10 });
  let speed = 1;
  const recentSpikes = (who, from, to) => S.spikes.filter((s) => s.who === who && s.t >= from && s.t <= to);

  function spike(who) {
    const t = S.t;
    if (who === 'P') {
      // LTP: every input's trace is added to its tag (pre-before-post)
      for (const k of ['A', 'B']) {
        S.e[k] += S.x[k];
        for (const s of recentSpikes(k, t - 100, t)) S.dots.push({ dt: t - s.t, de: Math.exp(-(t - s.t) / TAU), who: k, t });
      }
      S.y += 1;
      if (playing && q('[data-auto]').checked) S.fbAt = t + 20;
    } else {
      // LTD: the postsynaptic trace is subtracted (post-before-pre)
      S.e[who] -= aMinus() * S.y;
      for (const s of recentSpikes('P', t - 100, t - 1)) S.dots.push({ dt: s.t - t, de: -aMinus() * Math.exp((s.t - t) / TAU), who, t });
      S.x[who] += 1;
    }
    S.spikes.push({ who, t });
    S.flash[who] = 1;
    if (S.dots.length > 60) S.dots.splice(0, S.dots.length - 60);
  }

  function tick() {
    S.t += 1;
    const d = Math.exp(-1 / TAU);
    S.x.A *= d;
    S.x.B *= d;
    S.y *= d;
    const de = Math.exp(-1 / TAU_E);
    S.e.A *= de;
    S.e.B *= de;
    if (playing) {
      if (S.t >= S.nextPair) {
        const dt = dtVal();
        S.queue.push({ who: 'A', t: S.t + 50 }, { who: 'P', t: S.t + 50 + dt });
        S.nextPair = S.t + PERIOD;
      }
      if (q('[data-bon]').checked && Math.random() < B_RATE) S.queue.push({ who: 'B', t: S.t });
    }
    // presynaptic spikes first, so a simultaneous pairing counts as causal
    const due = S.queue.filter((s) => s.t <= S.t).sort((a, b) => (a.who === 'P') - (b.who === 'P'));
    S.queue = S.queue.filter((s) => s.t > S.t);
    for (const s of due) spike(s.who);
    const i = S.t % WIN;
    S.hist.A[i] = S.x.A;
    S.hist.B[i] = S.x.B;
    S.hist.P[i] = S.y;
    S.spikes = S.spikes.filter((s) => s.t > S.t - WIN - 120);
    if (S.fbAt !== null && S.t >= S.fbAt) {
      S.fbAt = null;
      feedback('pattern', { auto: true });
    }
    if (S.t % 20 === 0) {
      S.wHist.push([S.t / 1000, S.w.A, S.w.B]);
      if (S.wHist.length > 600) S.wHist.shift();
    }
  }

  // Each weight changes using only its own tag: Δw = η·e under pattern; under
  // noise, tagged weights are pulled toward the average and jittered.
  function feedback(kind, { auto = false } = {}) {
    const m = Math.max(Math.abs(S.e.A), Math.abs(S.e.B));
    if (m < 0.02) {
      if (!auto) q('[data-msg]').textContent = 'Nothing is tagged yet, so the feedback has nothing to act on. Let the neurons fire first.';
      return;
    }
    const before = { ...S.w };
    const mean = (S.w.A + S.w.B) / 2;
    for (const k of ['A', 'B']) {
      if (kind === 'pattern') S.w[k] += (auto ? ETA_AUTO : ETA) * S.e[k];
      else {
        const g = Math.min(1, Math.abs(S.e[k]));
        S.w[k] += g * (KAPPA * (mean - S.w[k]) + SIGMA * gaussian(Math.random));
      }
      S.w[k] = Math.min(W_MAX, Math.max(0, S.w[k]));
    }
    S.e.A = 0;
    S.e.B = 0;
    if (auto) return;
    const f = (k) => `${k}: ${before[k].toFixed(2)} → ${S.w[k].toFixed(2)}`;
    q('[data-msg]').innerHTML =
      (kind === 'pattern'
        ? '<span class="text-green-600 font-medium">Pattern:</span> each weight moved by its own tag. '
        : '<span class="text-red-500 font-medium">Noise:</span> tagged weights were pulled toward their average and jittered. ') + `${f('A')}, ${f('B')}.`;
    S.flash.fb = kind;
    S.flash.fbT = 1;
  }

  // ---------- drawing ----------
  function drawTimeline() {
    const g = gt;
    g.clearRect(0, 0, TW, TH);
    // circuit
    const cx = { A: [36, 60], B: [36, 190], P: [150, 125] };
    const tagCol = (e) => (e >= 0 ? `rgba(34,197,94,${Math.min(0.85, Math.abs(e) / 2.2)})` : `rgba(239,68,68,${Math.min(0.85, Math.abs(e) / 1.2)})`);
    for (const k of ['A', 'B']) {
      const [x0, y0] = cx[k];
      const [x1, y1] = cx.P;
      // tag halo
      g.strokeStyle = tagCol(S.e[k]);
      g.lineWidth = 3 + 7 * S.w[k] + 8;
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(x0 + 14, y0);
      g.lineTo(x1 - 16, y1);
      g.stroke();
      // synapse
      g.strokeStyle = k === 'A' ? C.A : C.B;
      g.lineWidth = Math.max(1, 3 + 7 * S.w[k] - 4);
      g.beginPath();
      g.moveTo(x0 + 14, y0);
      g.lineTo(x1 - 16, y1);
      g.stroke();
    }
    g.lineCap = 'butt';
    for (const k of ['A', 'B', 'P']) {
      const [x, y] = cx[k];
      const col = k === 'P' ? C.P : k === 'A' ? C.A : C.B;
      g.fillStyle = S.flash[k] > 0.05 ? col : '#e5e7eb';
      g.strokeStyle = col;
      g.lineWidth = 2;
      g.beginPath();
      g.arc(x, y, k === 'P' ? 17 : 14, 0, Math.PI * 2);
      g.fill();
      g.stroke();
      g.fillStyle = S.flash[k] > 0.05 ? '#fff' : C.ink;
      g.font = '700 12px Geist, system-ui, sans-serif';
      g.textAlign = 'center';
      g.fillText(k === 'P' ? 'Out' : k, x, y + 4);
      S.flash[k] *= 0.85;
    }
    if (S.flash.fbT > 0.02) {
      g.fillStyle = S.flash.fb === 'pattern' ? `rgba(34,197,94,${0.25 * S.flash.fbT})` : `rgba(239,68,68,${0.25 * S.flash.fbT})`;
      g.fillRect(0, 0, 190, TH);
      S.flash.fbT *= 0.93;
    }
    g.fillStyle = C.muted;
    g.font = '500 10px Geist, system-ui, sans-serif';
    g.textAlign = 'left';
    g.fillText('line width = weight', 4, TH - 22);
    g.fillText('glow = tag (green +, red −)', 4, TH - 8);

    // timeline
    const L = 205;
    const W = TW - L - 6;
    const rows = [
      ['A', 18, C.A, 'A spikes + trace x'],
      ['B', 98, C.B, 'B spikes + trace x'],
      ['P', 178, C.P, 'output spikes + trace y'],
    ];
    const X = (t) => L + W - ((S.t - t) / WIN) * W;
    for (const [k, top, col, label] of rows) {
      const h = 58;
      g.fillStyle = '#f9fafb';
      g.fillRect(L, top, W, h);
      g.fillStyle = C.muted;
      g.font = '500 10px Geist, system-ui, sans-serif';
      g.fillText(label, L + 4, top + 11);
      // trace
      g.strokeStyle = col;
      g.globalAlpha = 0.5;
      g.lineWidth = 1.5;
      g.beginPath();
      for (let j = 0; j < WIN; j++) {
        const t = S.t - WIN + 1 + j;
        if (t < 0) continue;
        const v = S.hist[k][((t % WIN) + WIN) % WIN];
        const yy = top + h - 4 - Math.min(1.6, v) * ((h - 18) / 1.6);
        j ? g.lineTo(X(t), yy) : g.moveTo(X(t), yy);
      }
      g.stroke();
      g.globalAlpha = 1;
      // spikes
      g.fillStyle = col;
      for (const s of S.spikes) if (s.who === k && s.t > S.t - WIN) g.fillRect(X(s.t) - 1, top + 14, 2.5, h - 18);
    }
    // pairing brackets: A spike -> output spike
    g.strokeStyle = 'rgba(17,24,39,0.25)';
    g.setLineDash([3, 3]);
    for (const s of S.spikes) {
      if (s.who !== 'P' || s.t < S.t - WIN) continue;
      g.beginPath();
      g.moveTo(X(s.t), 18);
      g.lineTo(X(s.t), 236);
      g.stroke();
    }
    g.setLineDash([]);
    g.fillStyle = C.muted;
    g.textAlign = 'right';
    g.fillText('now', L + W, TH - 2);
    g.textAlign = 'left';
    g.fillText(`−${WIN} ms`, L, TH - 2);
  }

  function drawWindow() {
    const g = gw;
    g.clearRect(0, 0, WW, WH);
    const L = 30;
    const R = 8;
    const T = 10;
    const B = 30;
    const pw = WW - L - R;
    const ph = WH - T - B;
    const X = (dt) => L + ((dt + 100) / 200) * pw;
    const Y = (v) => T + ph / 2 - (v / 1.55) * (ph / 2);
    g.strokeStyle = C.grid;
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(L, Y(0));
    g.lineTo(L + pw, Y(0));
    g.moveTo(X(0), T);
    g.lineTo(X(0), T + ph);
    g.stroke();
    g.fillStyle = 'rgba(34,197,94,0.07)';
    g.fillRect(X(0), T, pw / 2, ph / 2);
    g.fillStyle = 'rgba(239,68,68,0.07)';
    g.fillRect(L, Y(0), pw / 2, ph / 2);
    // the window curve
    g.strokeStyle = C.ink;
    g.lineWidth = 1.5;
    g.beginPath();
    for (let dt = -100; dt <= -1; dt++) (dt === -100 ? g.moveTo : g.lineTo).call(g, X(dt), Y(-aMinus() * Math.exp(dt / TAU)));
    g.stroke();
    g.beginPath();
    for (let dt = 0; dt <= 100; dt++) (dt === 0 ? g.moveTo : g.lineTo).call(g, X(dt), Y(Math.exp(-dt / TAU)));
    g.stroke();
    // pairings that actually happened
    for (const d of S.dots) {
      const age = Math.max(0.15, 1 - (S.t - d.t) / 3000);
      g.globalAlpha = age;
      g.fillStyle = d.who === 'A' ? C.A : C.B;
      g.beginPath();
      g.arc(X(d.dt), Y(d.de), 3.2, 0, Math.PI * 2);
      g.fill();
    }
    g.globalAlpha = 1;
    g.font = '500 10px Geist, system-ui, sans-serif';
    g.fillStyle = C.muted;
    g.textAlign = 'center';
    for (const v of [-100, -50, 0, 50, 100]) g.fillText(String(v), X(v), WH - 16);
    const easy = isEasyLevel();
    g.fillText(easy ? 'ms from input spike to output spike' : 'Δt = t_post − t_pre (ms)', L + pw / 2, WH - 3);
    g.textAlign = 'left';
    g.fillStyle = '#15803d';
    g.fillText(easy ? 'input first → strengthen' : 'pre → post: LTP', X(4), T + 10);
    g.fillStyle = '#b91c1c';
    g.textAlign = 'right';
    g.fillText(easy ? 'output first → weaken' : 'post → pre: LTD', X(-4), T + ph - 4);
    g.textAlign = 'right';
    g.fillStyle = C.muted;
    g.fillText('+1', L - 4, Y(1) + 3);
    g.fillText('0', L - 4, Y(0) + 3);
    g.fillText(`−${aMinus()}`, L - 4, Y(-aMinus()) + 3);
  }

  function drawAll() {
    drawTimeline();
    drawWindow();
    const dt = dtVal();
    q('[data-dtv]').textContent =
      dt > 0 ? `output fires ${dt} ms after A` : dt < 0 ? `output fires ${-dt} ms before A` : 'together';
    const row = (k, col) => {
      const e = S.e[k];
      return `<tr><td><span style="color:${col}">●</span> ${k} → output</td><td class="text-right" style="color:${e > 0.02 ? '#15803d' : e < -0.02 ? '#b91c1c' : '#6b7280'}">${e >= 0 ? '+' : ''}${e.toFixed(2)}</td><td class="text-right">${S.w[k].toFixed(2)}</td></tr>`;
    };
    q('[data-rows]').innerHTML = row('A', C.A) + row('B', C.B);
    const am = aMinus();
    const net = (1 - am) * TAU; // ms: area of the STDP window
    q('[data-amv]').textContent = `${am.toFixed(2)}${am === A_MINUS_CULTURE ? ' (culture)' : am === A_MINUS_COMPETITIVE ? ' (textbook)' : ''} · ${net > 0 ? 'random input gains' : net < 0 ? 'random input loses' : 'balanced'}`;
    for (const b of q('[data-am-preset]').children) {
      const on = Number(b.dataset.v) === am;
      b.className = `px-3 py-1 rounded text-sm ${on ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`;
    }
    wChart.draw(
      [
        { pts: S.wHist.map(([t, a]) => [t, a]), color: C.A },
        { pts: S.wHist.map(([t, , b]) => [t, b]), color: C.B },
      ],
      [{ y: 1, label: 'start', below: true }]
    );
    for (const b of q('[data-speed]').children) {
      const on = Number(b.dataset.v) === speed;
      b.className = `px-3 py-1 rounded text-sm ${on ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`;
    }
  }

  let playing = false;
  let raf = 0;
  let last = performance.now();
  let acc = 0;
  const loop = (now) => {
    acc += Math.min(100, now - last) * SIM_SPEED * speed;
    last = now;
    const n = Math.floor(acc);
    acc -= n;
    for (let k = 0; k < n; k++) tick();
    drawAll();
    raf = requestAnimationFrame(loop);
  };
  // Keep time running even when paused so traces and tags visibly decay.
  raf = requestAnimationFrame(loop);
  track(() => cancelAnimationFrame(raf));

  q('[data-play]').onclick = () => {
    playing = !playing;
    if (playing) S.nextPair = S.t;
    q('[data-play]').textContent = playing ? 'Pause' : 'Play';
  };
  q('[data-reset]').onclick = reset;
  q('[data-dt]').oninput = drawAll;
  q('[data-am]').oninput = drawAll;
  for (const b of q('[data-am-preset]').children)
    b.onclick = () => {
      q('[data-am]').value = b.dataset.v;
      drawAll();
    };
  for (const b of q('[data-speed]').children) b.onclick = () => ((speed = Number(b.dataset.v)), drawAll());
  for (const b of root.querySelectorAll('[data-fire]')) b.onclick = () => spike(b.dataset.fire);
  q('[data-pattern]').onclick = () => feedback('pattern');
  q('[data-noise]').onclick = () => feedback('noise');
  listen(window, 'levelchange', drawAll);
  reset();
  // handy for poking at it from the console: root.stdp.run(1000) steps 1 s of simulated time
  root.stdp = {
    run(ms, play = true) {
      playing = play;
      for (let k = 0; k < ms; k++) tick();
      drawAll();
    },
    state: () => S,
    feedback,
  };
}
