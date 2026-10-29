// Section 7: everything at once. 400 inputs, one LIF neuron, STDP on every
// synapse. Half the inputs share a hidden source; watch their weights win.
import katex from 'katex';
import { CompetitionNeuron, COMPETITION } from '../sim/competition.js';
import { C, setupCanvas, lv, isEasy, btn, playBtn, setPlaying, animate, listen, markGroup } from '../ui/common.js';
import { axes, path, label, legend } from '../ui/plot.js';

const SHOWN = 60; // raster rows per group
const RASTER_MS = 500;

const EQS = [
  { key: 'v', tex: '\\tau_m \\dfrac{dV}{dt} = -(V - E_L) + I', easy: 'The voltage leaks toward rest and is pushed up by input.', scale: 'ms' },
  { key: 'post', tex: 'V \\ge \\theta \\;\\Rightarrow\\; V \\leftarrow V_r', easy: 'Hit the line: spike and reset.', scale: 'instant' },
  { key: 'pre', tex: '\\tau_s \\dfrac{dI}{dt} = -I, \\quad I \\mathrel{+}= J\\,w_i', easy: 'Each input spike kicks the current by its weight.', scale: 'ms' },
  { key: 'trace', tex: '\\tau_\\pm \\dfrac{dx_i}{dt} = -x_i, \\quad \\tau_\\pm \\dfrac{dy}{dt} = -y', easy: 'Each side remembers its recent spikes for ~20 ms.', scale: '20 ms' },
  { key: 'ltp', tex: '\\text{output spike: } w_i \\mathrel{+}= A_+\\, x_i', easy: 'Output fired: strengthen the inputs that just fired.', scale: 'seconds' },
  { key: 'ltd', tex: '\\text{input spike: } w_i \\mathrel{-}= A_-\\, y', easy: 'Input fired after the output: weaken it.', scale: 'seconds' },
];

export function mountFinale(root) {
  root.innerHTML = `
  <div class="flex flex-wrap items-center gap-x-3 gap-y-2 mb-3">
    ${playBtn()} ${btn(lv('Start over', 'Reset (new seed)'), 'data-reset')}
    <span class="text-sm text-gray-500">Speed</span>
    <div class="flex gap-1" data-speed>${btn('1×', 'data-v="1"')}${btn('10×', 'data-v="10"')}${btn('50×', 'data-v="50"')}</div>
    <label class="text-sm flex items-center gap-1.5"><input data-learn type="checkbox" checked class="accent-green-500"/> ${lv('Learning on', 'STDP on')}</label>
    <span data-stats class="text-sm text-gray-600 tabular-nums"></span>
  </div>
  <div class="grid lg:grid-cols-5 gap-6">
    <div class="lg:col-span-3">
      <canvas data-raster></canvas>
      <canvas data-w class="mt-3"></canvas>
    </div>
    <div class="lg:col-span-2">
      <canvas data-wt></canvas>
      <div class="text-sm font-medium mt-4 mb-1">${lv('What is happening right now', 'Equations, lit when they fire')}</div>
      <div data-eqs class="text-sm"></div>
    </div>
  </div>`;
  const q = root.querySelector.bind(root);
  const RW = 520;
  const RH = 330;
  const WW = 520;
  const WH = 150;
  const TW = 320;
  const TH = 230;
  const gr = setupCanvas(q('[data-raster]'), RW, RH);
  const gw = setupCanvas(q('[data-w]'), WW, WH);
  const gt = setupCanvas(q('[data-wt]'), TW, TH);
  q('[data-raster]').style.maxWidth = `${RW * 1.3}px`;
  q('[data-w]').style.maxWidth = `${WW * 1.3}px`;
  q('[data-wt]').style.maxWidth = `${TW * 1.3}px`;

  q('[data-eqs]').innerHTML = EQS.map(
    (e) => `<div data-eq="${e.key}" class="rounded px-2 py-1 mb-1 transition-colors" style="background: transparent">
      <div class="flex items-center justify-between gap-2"><span class="lv-hard">${katex.renderToString(e.tex, { throwOnError: false })}</span><span class="lv-easy">${e.easy}</span><span class="text-xs text-gray-400 whitespace-nowrap">${e.scale}</span></div></div>`
  ).join('');
  const glow = Object.fromEntries(EQS.map((e) => [e.key, 0]));

  let seed = 1;
  let n = new CompetitionNeuron(seed);
  let speed = 10;
  let playing = false;
  const { N, nCorr } = COMPETITION;

  function stepSim(ms) {
    if (!q('[data-learn]').checked) {
      // learning off: same dynamics, weights frozen
      const keep = n.w.slice();
      n.run(ms);
      n.w.set(keep);
    } else n.run(ms);
    const a = n.active;
    glow.v = 1;
    glow.trace = 1;
    if (a.pre) glow.pre = 1;
    if (a.post) glow.post = 1;
    if (a.ltp && q('[data-learn]').checked) glow.ltp = 1;
    if (a.ltd && q('[data-learn]').checked) glow.ltd = 1;
    n.active = { pre: 0, post: 0, ltd: 0, ltp: 0 };
  }

  function drawRaster() {
    const easy = isEasy();
    gr.clearRect(0, 0, RW, RH);
    const L = 90;
    const t1 = n.t;
    const t0 = t1 - RASTER_MS;
    const X = (t) => L + ((t - t0) / RASTER_MS) * (RW - L - 8);
    const rowH = 2;
    const topC = 22;
    const topU = topC + SHOWN * rowH + 10;
    const yOut = topU + SHOWN * rowH + 14;
    gr.fillStyle = C.panel;
    gr.fillRect(L, 6, RW - L - 8, 12);
    gr.fillRect(L, topC, RW - L - 8, SHOWN * rowH);
    gr.fillRect(L, topU, RW - L - 8, SHOWN * rowH);
    gr.fillRect(L, yOut, RW - L - 8, 22);
    label(gr, easy ? 'hidden source' : 'source', L - 6, 16, { align: 'right', color: C.violet, bold: true });
    label(gr, easy ? 'listen to it' : 'correlated', L - 6, topC + SHOWN, { align: 'right', color: C.blue, bold: true });
    label(gr, easy ? 'on their own' : 'independent', L - 6, topU + SHOWN, { align: 'right', color: C.faint, bold: true });
    label(gr, 'output', L - 6, yOut + 15, { align: 'right', color: C.orange, bold: true });
    gr.fillStyle = C.violet;
    for (const s of n.srcLog) if (s >= t0) gr.fillRect(X(s) - 0.5, 7, 1.5, 10);
    const log = n.preLog;
    for (let j = 0; j < log.length; j += 2) {
      const t = log[j];
      if (t < t0) continue;
      const i = log[j + 1];
      let y;
      if (i < SHOWN) y = topC + i * rowH;
      else if (i >= nCorr && i < nCorr + SHOWN) y = topU + (i - nCorr) * rowH;
      else continue;
      // brightness follows the weight, so you can see which inputs matter
      const w = n.w[i];
      gr.fillStyle = i < nCorr ? `rgba(59,130,246,${0.15 + 0.85 * w})` : `rgba(107,114,128,${0.15 + 0.85 * w})`;
      gr.fillRect(X(t) - 0.5, y, 1.5, rowH);
    }
    gr.fillStyle = C.orange;
    for (let j = n.postLog.length - 1; j >= 0 && n.postLog[j] >= t0; j--) gr.fillRect(X(n.postLog[j]) - 1, yOut + 2, 2, 18);
    label(gr, `−${RASTER_MS} ms`, L, RH - 4);
    label(gr, 'now', RW - 8, RH - 4, { align: 'right' });
    label(gr, easy ? `showing ${SHOWN} of each group · darker = stronger` : `${SHOWN} of ${nCorr} per group shown · opacity = w`, L + (RW - L) / 2, RH - 4, { align: 'center' });
  }

  function drawWeights() {
    const easy = isEasy();
    gw.clearRect(0, 0, WW, WH);
    const L = 60;
    const ph = WH - 34;
    const bw = (WW - L - 8) / N;
    gw.fillStyle = C.panel;
    gw.fillRect(L, 8, WW - L - 8, ph);
    for (let i = 0; i < N; i++) {
      const h = n.w[i] * ph;
      gw.fillStyle = i < nCorr ? C.blue : C.faint;
      gw.fillRect(L + i * bw, 8 + ph - h, Math.max(1, bw), h);
    }
    label(gw, '1', L - 4, 14, { align: 'right' });
    label(gw, '0', L - 4, 8 + ph, { align: 'right' });
    label(gw, easy ? 'strength' : 'w', L - 14, 8 + ph / 2, { align: 'right' });
    label(gw, easy ? `inputs 1–${nCorr}: listen to the hidden source` : `inputs 1–${nCorr}: correlated`, L + (WW - L) / 4, WH - 10, { align: 'center', color: C.blue });
    label(gw, easy ? `inputs ${nCorr + 1}–${N}: on their own` : `inputs ${nCorr + 1}–${N}: independent`, L + (3 * (WW - L)) / 4, WH - 10, { align: 'center', color: C.muted });
  }

  function drawTimeline() {
    const easy = isEasy();
    gt.clearRect(0, 0, TW, TH);
    const tMax = Math.max(30, Math.ceil(n.t / 1000 / 30) * 30);
    const ax = axes(gt, { x: 40, y: 10, w: TW - 50, h: TH - 46 }, { xr: [0, tMax], yr: [0, 1], xLabel: easy ? 'seconds of the neuron’s life' : 'simulated time (s)', yLabel: easy ? 'average strength' : 'mean w' });
    const h = n.wHist;
    path(gt, ax.X, ax.Y, h.map((r) => r[0]), h.map((r) => r[1]), { color: C.blue, width: 2 });
    path(gt, ax.X, ax.Y, h.map((r) => r[0]), h.map((r) => r[2]), { color: C.faint, width: 2 });
    legend(gt, [[C.blue, easy ? 'listen to source' : 'correlated'], [C.faint, easy ? 'on their own' : 'independent']], 46, 24);
  }

  function drawEqs(dt) {
    for (const e of EQS) {
      const el = q(`[data-eq="${e.key}"]`);
      const a = glow[e.key];
      const col = e.key === 'ltp' ? '34,197,94' : e.key === 'ltd' ? '239,68,68' : e.key === 'post' ? '249,115,22' : '59,130,246';
      el.style.background = `rgba(${col},${(0.05 + 0.22 * a).toFixed(3)})`;
      glow[e.key] = a * Math.exp(-dt / 250);
    }
  }

  function draw(dt = 16) {
    markGroup(q('[data-speed]'), speed);
    const st = n.stats();
    const easy = isEasy();
    q('[data-stats]').textContent = easy
      ? `${(n.t / 1000).toFixed(1)} s · output ${st.rate} spikes/s · ${(st.locked * 100).toFixed(0)}% follow the hidden source (chance ≈ 10%)`
      : `t = ${(n.t / 1000).toFixed(1)} s · ${st.rate} Hz · ${(st.locked * 100).toFixed(0)}% of output spikes within 5 ms of a source spike (chance ≈ 10%)`;
    drawRaster();
    drawWeights();
    drawTimeline();
    drawEqs(dt);
  }

  animate(root, (dt) => {
    if (playing) stepSim(Math.min(dt, 40) * speed);
    draw(dt);
  });
  q('[data-play]').onclick = () => {
    playing = !playing;
    setPlaying(q('[data-play]'), playing);
  };
  q('[data-reset]').onclick = () => {
    seed += 1;
    n = new CompetitionNeuron(seed);
    draw();
  };
  for (const b of q('[data-speed]').children) b.onclick = () => (speed = Number(b.dataset.v));
  listen(window, 'levelchange', () => draw());
  // a few hundred ms of history so the raster isn't empty before Play
  n.run(600);
  draw();
}
