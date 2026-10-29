// Section 4: the integrate-and-fire family. First one spike up close, model
// by model, against a Hodgkin–Huxley reference. Then the AdEx firing
// patterns with their (V, w) phase plane.
import { runIF, runHH, intrinsic, CELL, ADEX_PRESETS, adexField } from '../sim/models.js';
import { C, setupCanvas, lv, isEasy, btn, animate, listen, markGroup } from '../ui/common.js';
import { axes, path, dot, label, legend, line, arrow } from '../ui/plot.js';

const MODELS = [
  { id: 'lif', name: 'LIF', long: 'Leaky integrate-and-fire', color: C.blue },
  { id: 'qif', name: 'QIF', long: 'Quadratic integrate-and-fire', color: C.violet },
  { id: 'eif', name: 'EIF', long: 'Exponential integrate-and-fire', color: C.orange },
  { id: 'adex', name: 'AdEx', long: 'Adaptive exponential', color: C.green },
];

// yes: comes out of the equations. set: put in by hand (a rule or a cutoff). no: absent.
const PHASES = [
  { id: 'rest', name: 'Resting potential', easy: 'Sits quietly at rest' },
  { id: 'thr', name: 'Threshold', easy: 'A tipping point' },
  { id: 'up', name: 'Upstroke', easy: 'Fast rise' },
  { id: 'peak', name: 'Peak', easy: 'A top' },
  { id: 'repol', name: 'Repolarization', easy: 'Fall back down' },
  { id: 'ahp', name: 'Afterhyperpolarization', easy: 'Dip below rest' },
  { id: 'refr', name: 'Refractory period', easy: 'Hard to fire again' },
];
const TABLE = {
  lif: { rest: 'yes', thr: 'set', up: 'no', peak: 'no', repol: 'no', ahp: 'set', refr: 'set' },
  qif: { rest: 'yes', thr: 'yes', up: 'yes', peak: 'set', repol: 'no', ahp: 'set', refr: 'set' },
  eif: { rest: 'yes', thr: 'yes', up: 'yes', peak: 'set', repol: 'no', ahp: 'set', refr: 'set' },
  adex: { rest: 'yes', thr: 'yes', up: 'yes', peak: 'set', repol: 'no', ahp: 'yes', refr: 'yes' },
  hh: { rest: 'yes', thr: 'yes', up: 'yes', peak: 'yes', repol: 'yes', ahp: 'yes', refr: 'yes' },
};
const MARK = {
  yes: '<span class="text-green-600 font-semibold">✓</span>',
  set: '<span class="text-amber-500 font-semibold">~</span>',
  no: '<span class="text-gray-400">✗</span>',
};

// One spike from each model, aligned so the spike happens at t = 0.
function oneSpike(kind) {
  const p = { ...CELL };
  const amp = 500;
  // first run: when does the first spike come under a strong step?
  const first = runIF(kind, p, () => amp, 100, 0.01, { record: false }).spikes[0];
  // second run: the same step, switched off just after the spike, then let it recover
  const r = runIF(kind, p, (t) => (t < first + 0.2 ? amp : 0), first + 40, 0.01);
  const at = r.spikes[0];
  return { ts: r.ts.map((t) => t - at), vs: r.vs };
}

function hhSpike() {
  const r = runHH((t) => (t >= 5 && t < 6 ? 20 : 0), 60, 0.01);
  let k = 0;
  for (let i = 1; i < r.vs.length; i++) if (r.vs[i] > r.vs[k]) k = i;
  return { ts: r.ts.map((t) => t - r.ts[k]), vs: r.vs };
}

export function mountSpikeAnatomy(root) {
  root.innerHTML = `
  <div class="flex flex-wrap items-center gap-2 mb-3">
    <span class="text-sm text-gray-500">${lv('Model', 'Model')}</span>
    <div class="flex flex-wrap gap-1" data-model>${MODELS.map((m) => btn(m.name, `data-v="${m.id}"`)).join('')}</div>
    <span data-long class="text-sm text-gray-600"></span>
  </div>
  <div class="grid lg:grid-cols-5 gap-6">
    <div class="lg:col-span-3"><canvas data-trace></canvas></div>
    <div class="lg:col-span-2">
      <table class="text-sm w-full">
        <thead><tr class="text-gray-500"><th class="text-left font-medium">${lv('Part of the spike', 'Phase')}</th><th class="font-medium" data-mh></th><th class="font-medium">HH</th></tr></thead>
        <tbody data-rows></tbody>
      </table>
      <div class="text-xs text-gray-500 mt-2">${MARK.yes} ${lv('comes out of the equation', 'emerges from the dynamics')} · ${MARK.set} ${lv('added by hand', 'imposed by a reset rule or cutoff')} · ${MARK.no} ${lv('missing', 'absent')}</div>
    </div>
  </div>
  <div class="adv mt-6">
    <div class="text-sm font-medium mb-1">${lv('', 'The upstroke is the shape of f(V): dV/dt against V with no input')}</div>
    <canvas data-f></canvas>
  </div>`;
  const q = root.querySelector.bind(root);
  const W = 520;
  const H = 320;
  const FW = 680;
  const FH = 260;
  const gv = setupCanvas(q('[data-trace]'), W, H);
  const gf = setupCanvas(q('[data-f]'), FW, FH);
  q('[data-trace]').style.maxWidth = `${W * 1.3}px`;
  q('[data-f]').style.maxWidth = `${FW * 1.2}px`;
  const ref = hhSpike();
  const spikes = Object.fromEntries(MODELS.map((m) => [m.id, oneSpike(m.id)]));
  // HH phase loop: dV/dt from the trace itself
  const hhLoop = { V: [], dV: [] };
  for (let i = 1; i < ref.vs.length; i += 2) {
    hhLoop.V.push(ref.vs[i]);
    hhLoop.dV.push((ref.vs[i] - ref.vs[i - 1]) / (ref.ts[i] - ref.ts[i - 1]));
  }
  let model = 'lif';

  function draw() {
    const easy = isEasy();
    const m = MODELS.find((x) => x.id === model);
    markGroup(q('[data-model]'), model);
    q('[data-long]').textContent = m.long;
    q('[data-mh]').textContent = m.name;

    gv.clearRect(0, 0, W, H);
    const xr = [-12, 25];
    const ax = axes(gv, { x: 40, y: 10, w: W - 50, h: H - 46 }, { xr, yr: [-85, 50], xLabel: easy ? 'milliseconds from the spike' : 't − t_spike (ms)', yLabel: easy ? 'voltage (mV)' : 'V (mV)' });
    ax.clip();
    // refractory window shading
    gv.fillStyle = 'rgba(139,92,246,0.06)';
    gv.fillRect(ax.X(0), 10, ax.X(4) - ax.X(0), H - 46);
    path(gv, ax.X, ax.Y, ref.ts, ref.vs, { color: C.ink, width: 6, alpha: 0.12 });
    path(gv, ax.X, ax.Y, ref.ts, ref.vs, { color: C.ink, width: 1, alpha: 0.5, dash: [3, 3] });
    const s = spikes[model];
    path(gv, ax.X, ax.Y, s.ts, s.vs, { color: m.color, width: 2.2 });
    // the instantaneous jump from threshold/cutoff to reset
    const k = s.ts.findIndex((t) => t >= 0);
    if (k > 0) {
      gv.save();
      gv.setLineDash([2, 3]);
      gv.strokeStyle = m.color;
      line(gv, ax.X(0), ax.Y(s.vs[k]), ax.X(0), ax.Y(CELL.Vr));
      gv.restore();
    }
    ax.unclip();
    // phase labels on the reference spike
    const L = (text, t, v, opts) => label(gv, text, ax.X(t), ax.Y(v), { color: C.muted, ...opts });
    L(easy ? 'rest' : 'rest −65 mV', -11.5, -61);
    L(easy ? 'tipping point' : 'threshold', -4.5, -50, { align: 'right' });
    L(easy ? 'fast rise' : 'upstroke', -0.9, 10, { align: 'right' });
    L(easy ? 'top' : 'peak +40 mV', 0.7, 44);
    L(easy ? 'fall' : 'repolarization', 1.6, 0);
    L(easy ? 'dip below rest' : 'AHP', 6, -82);
    L(easy ? 'hard to fire again' : 'refractory', 0.4, -30, { color: C.violet });
    legend(gv, [[C.ink, easy ? 'real spike (HH)' : 'Hodgkin–Huxley', true], [m.color, m.name]], ax.X(7), 26);
    if (model === 'lif') label(gv, easy ? 'no spike shape at all: it hits the line and jumps back' : 'LIF: no upstroke; the spike is the reset', ax.X(5), ax.Y(-15), { color: m.color });

    q('[data-rows]').innerHTML = PHASES.map((ph) => `<tr><td class="py-0.5">${easy ? ph.easy : ph.name}</td><td class="text-center">${MARK[TABLE[model][ph.id]]}</td><td class="text-center">${MARK.yes}</td></tr>`).join('');

    // f(V)
    gf.clearRect(0, 0, FW, FH);
    const bx = axes(gf, { x: 44, y: 10, w: FW - 54, h: FH - 46 }, { xr: [-80, -30], yr: [-2, 6], xLabel: 'V (mV)', yLabel: 'dV/dt (mV/ms)', zeroLine: true });
    bx.clip();
    const Vs = [];
    for (let v = -80; v <= -30; v += 0.1) Vs.push(v);
    path(gf, bx.X, bx.Y, hhLoop.V, hhLoop.dV, { color: C.ink, width: 1, dash: [3, 3], alpha: 0.4 });
    for (const mm of MODELS) {
      if (mm.id === 'adex') continue; // same f(V) as EIF; adaptation lives in w
      const on = mm.id === model || (model === 'adex' && mm.id === 'eif');
      path(gf, bx.X, bx.Y, Vs, Vs.map((v) => intrinsic[mm.id](v, CELL)), { color: mm.color, width: on ? 2.5 : 1.2, alpha: on ? 1 : 0.35 });
    }
    // fixed points: rest (stable) and, for QIF/EIF, the unstable one
    dot(gf, bx.X(CELL.EL), bx.Y(0), 4, C.ink);
    if (model !== 'lif') {
      const fv = model === 'qif' ? intrinsic.qif : intrinsic.eif;
      let vu = null;
      for (let v = -60; v < -30; v += 0.01) if (fv(v, CELL) < 0 && fv(v + 0.01, CELL) >= 0) vu = v;
      if (vu) {
        gf.save();
        gf.strokeStyle = C.ink;
        gf.fillStyle = '#fff';
        gf.lineWidth = 1.5;
        gf.beginPath();
        gf.arc(bx.X(vu), bx.Y(0), 4, 0, Math.PI * 2);
        gf.fill();
        gf.stroke();
        gf.restore();
        label(gf, 'unstable point: the threshold emerges here', bx.X(vu) - 8, bx.Y(0) + 16, { color: C.ink, align: 'right' });
      }
    } else {
      gf.save();
      gf.setLineDash([3, 3]);
      gf.strokeStyle = C.blue;
      line(gf, bx.X(CELL.VT), bx.Y(-2), bx.X(CELL.VT), bx.Y(6));
      gf.restore();
      label(gf, 'LIF: a straight line never turns up; θ is a rule', bx.X(CELL.VT) + 6, bx.Y(5), { color: C.blue });
    }
    bx.unclip();
    label(gf, 'rest', bx.X(CELL.EL), bx.Y(0) - 8, { align: 'center', color: C.ink });
    legend(gf, [...MODELS.filter((x) => x.id !== 'adex').map((x) => [x.color, x.id === 'eif' ? 'EIF / AdEx' : x.name]), [C.ink, 'HH spike (dV/dt vs V)', true]], 52, 24);
  }
  for (const b of q('[data-model]').children)
    b.onclick = () => {
      model = b.dataset.v;
      draw();
    };
  listen(window, 'levelchange', draw);
  draw();
}

// ---------------------------------------------------------------- firing patterns
const PRESET_TEXT = {
  tonic: ['Fires like a metronome.', 'No adaptation (b = 0, short τ_w): every interval is the same.'],
  adapting: ['Starts fast, then slows down as it tires.', 'Each spike adds b to w; w builds up over τ_w = 300 ms and stretches the intervals.'],
  initburst: ['A quick burst, then steady firing.', 'Reset (V_r = −50) sits close to threshold, so the first spikes come fast until w catches up.'],
  bursting: ['Fires in bursts with pauses in between.', 'High reset plus a big jump b: the trajectory alternates between a fast loop and a slow trip down the w-nullcline.'],
  delayed: ['Waits, then speeds up.', 'Negative a: w becomes a depolarizing current that builds slowly.'],
};
const T_Z = 500;
const ON_Z = 50;

export function mountZoo(root) {
  root.innerHTML = `
  <div class="flex flex-wrap items-center gap-2 mb-2">
    <div class="flex flex-wrap gap-1" data-preset>${Object.entries(ADEX_PRESETS)
      .map(([k, v]) => btn(v.label, `data-v="${k}"`))
      .join('')}</div>
    <label class="text-sm flex items-center gap-1.5 ml-2"><input data-noadapt type="checkbox"/> ${lv('Turn off tiredness', 'Remove adaptation (a = b = 0)')}</label>
  </div>
  <div data-desc class="text-sm text-gray-600 mb-3 min-h-[1.25rem]"></div>
  <div class="grid lg:grid-cols-2 gap-6">
    <div><canvas data-trace></canvas></div>
    <div class="adv"><canvas data-pp></canvas></div>
  </div>`;
  const q = root.querySelector.bind(root);
  const W = 460;
  const H = 330;
  const PW = 420;
  const PH = 330;
  const gv = setupCanvas(q('[data-trace]'), W, H);
  const gp = setupCanvas(q('[data-pp]'), PW, PH);
  q('[data-trace]').style.maxWidth = `${W * 1.3}px`;
  q('[data-pp]').style.maxWidth = `${PW * 1.3}px`;
  let preset = 'adapting';
  let run;
  let cursor = 0; // ms, the playback head

  function params() {
    const p = { ...ADEX_PRESETS[preset], tRef: 0, Vpeak: 0 };
    if (q('[data-noadapt]').checked) {
      p.a = 0;
      p.b = 0;
    }
    return p;
  }
  function compute() {
    const p = params();
    run = { p, ...runIF('adex', p, (t) => (t >= ON_Z ? p.I : 0), T_Z, 0.05) };
    let wMin = 0;
    let wMax = 0;
    for (const w of run.ws) {
      wMin = Math.min(wMin, w);
      wMax = Math.max(wMax, w);
    }
    const pad = Math.max(20, (wMax - wMin) * 0.15);
    run.wr = [wMin - pad, wMax + pad];
    cursor = 0;
  }

  function draw() {
    const easy = isEasy();
    markGroup(q('[data-preset]'), preset);
    q('[data-desc]').textContent = PRESET_TEXT[preset][easy ? 0 : 1];
    const { p, ts, vs, ws, spikes } = run;
    const k = Math.min(ts.length - 1, ts.findIndex((t) => t >= cursor));
    const upto = k < 0 ? ts.length : k + 1;

    // voltage + adaptation current
    gv.clearRect(0, 0, W, H);
    const ax = axes(gv, { x: 42, y: 10, w: W - 52, h: 180 }, { xr: [0, T_Z], yr: [-80, 10], yLabel: easy ? 'voltage (mV)' : 'V (mV)' });
    ax.clip();
    path(gv, ax.X, ax.Y, ts.slice(0, upto), vs.slice(0, upto), { color: C.green, width: 1.5 });
    gv.strokeStyle = C.ink;
    for (const s of spikes) if (s <= cursor) line(gv, ax.X(s), ax.Y(0), ax.X(s), ax.Y(10));
    ax.unclip();
    const bx = axes(gv, { x: 42, y: 214, w: W - 52, h: 80 }, { xr: [0, T_Z], yr: run.wr, xLabel: 'time (ms)', yLabel: easy ? 'tiredness' : 'w (pA)', yTicks: 2 });
    bx.clip();
    path(gv, bx.X, bx.Y, ts.slice(0, upto), ws.slice(0, upto), { color: C.violet, width: 1.5 });
    bx.unclip();
    label(gv, `${spikes.filter((s) => s <= cursor).length} spikes`, W - 12, 24, { align: 'right' });

    // phase plane
    gp.clearRect(0, 0, PW, PH);
    const V0 = -80;
    const V1 = -30;
    const cx = axes(gp, { x: 46, y: 10, w: PW - 56, h: PH - 46 }, { xr: [V0, V1], yr: run.wr, xLabel: 'V (mV)', yLabel: 'w (pA)' });
    cx.clip();
    const F = adexField(p, p.I);
    // vector field
    for (let i = 0; i < 14; i++)
      for (let j = 0; j < 11; j++) {
        const V = V0 + ((i + 0.5) / 14) * (V1 - V0);
        const w = run.wr[0] + ((j + 0.5) / 11) * (run.wr[1] - run.wr[0]);
        const [dv, dw] = F(V, w);
        const sx = (dv / (V1 - V0)) * (PW - 56);
        const sy = (-dw / (run.wr[1] - run.wr[0])) * (PH - 46);
        const n = Math.hypot(sx, sy) || 1;
        const L = 9;
        const x0 = cx.X(V);
        const y0 = cx.Y(w);
        arrow(gp, x0, y0, x0 + (sx / n) * L, y0 + (sy / n) * L, '#d1d5db', 1, 3);
      }
    // nullclines
    const Vs = [];
    for (let v = V0; v <= V1; v += 0.1) Vs.push(v);
    path(gp, cx.X, cx.Y, Vs, Vs.map((v) => -p.gL * (v - p.EL) + p.gL * p.dT * Math.exp((v - p.VT) / p.dT) + p.I), { color: C.green, width: 1.5, dash: [5, 3] });
    path(gp, cx.X, cx.Y, Vs, Vs.map((v) => p.a * (v - p.EL)), { color: C.violet, width: 1.5, dash: [5, 3] });
    // trajectory so far, with dashed reset jumps
    const from = ts.findIndex((t) => t >= ON_Z - 5);
    gp.strokeStyle = C.ink;
    gp.lineWidth = 1.3;
    gp.beginPath();
    let pen = false;
    for (let i = Math.max(0, from); i < upto; i++) {
      const jump = i > 0 && vs[i] < vs[i - 1] - 15;
      if (jump) {
        gp.stroke();
        gp.save();
        gp.setLineDash([2, 3]);
        gp.strokeStyle = C.faint;
        line(gp, cx.X(V1), cx.Y(ws[i - 1]), cx.X(vs[i]), cx.Y(ws[i]));
        gp.restore();
        gp.beginPath();
        pen = false;
      }
      const px = cx.X(vs[i]);
      const py = cx.Y(ws[i]);
      if (pen) gp.lineTo(px, py);
      else gp.moveTo(px, py);
      pen = true;
    }
    gp.stroke();
    if (upto > 0) dot(gp, cx.X(Math.min(V1, vs[upto - 1])), cx.Y(ws[upto - 1]), 4.5, C.ink);
    cx.unclip();
    legend(gp, [[C.green, 'dV/dt = 0', true], [C.violet, 'dw/dt = 0', true], [C.faint, 'reset jump', true]], 52, 24);
    label(gp, 'spike → off the right edge', PW - 14, PH - 44, { align: 'right', color: C.faint });
  }

  animate(root, (dt) => {
    cursor += dt * 0.25; // a quarter of real time, so bursts are visible
    if (cursor > T_Z + 400) cursor = 0;
    draw();
  });
  for (const b of q('[data-preset]').children)
    b.onclick = () => {
      preset = b.dataset.v;
      compute();
      draw();
    };
  q('[data-noadapt]').onchange = () => {
    compute();
    draw();
  };
  listen(window, 'levelchange', draw);
  compute();
  draw();
}
