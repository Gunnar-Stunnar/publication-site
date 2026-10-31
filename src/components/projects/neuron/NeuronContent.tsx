import Link from 'next/link';
import NeuronDemos from './NeuronDemos';
import './neuron.css';

// TeX is written with String.raw so braces and backslashes survive JSX;
// KaTeX renders it in the browser (see mount.js).
const tex = String.raw;

export default function NeuronContent() {
  return (
    <div className="neuron-page level-medium py-10">
<Link href="/projects" className="text-gray-600 hover:text-black">
⟵ Back to projects
</Link>
<h1 className="text-4xl font-bold mt-4 mb-6">
The Mathematical Beauty of a Neuron
</h1>
<section className="bg-gray-50 rounded-lg p-6 mb-10">
<h2 className="text-2xl font-bold mb-4">
Project Overview
</h2>
<div data-lv="medium graduate">
<p className="text-lg mb-4">
A neuron is a handful of numbers that change over time, plus rules for how they change. Those rules are differential equations, and a computer can't solve them exactly. It takes small steps, and the way it steps decides whether you get biology or nonsense.
</p>
<p className="text-lg mb-4">
This post builds one tool and then puts it under more and more load. It starts with the fourth-order Runge–Kutta method (RK4), tests it on the chaotic Lorenz attractor, then uses it to run leaky integrate-and-fire neurons and their relatives, connects two of them with a synapse, and adds spike-timing-dependent plasticity. It ends with a single neuron that learns which of its 400 inputs belong together, with every equation running at once.
</p>
</div>
<div data-lv="easy">
<p className="text-lg mb-4">
Your brain cells follow rules you can write down. The rules say how a cell's voltage rises and falls, when it fires, and how its connections get stronger or weaker. A computer can follow those rules too, by taking lots of tiny steps forward in time.
</p>
<p className="text-lg mb-4">
On this page you'll learn how those steps work, see why they need to be careful (with a famous butterfly-shaped pattern), and then build a brain cell piece by piece. At the end, one simulated cell teaches itself which of its 400 inputs are worth listening to.
</p>
</div>
<div className="flex flex-wrap gap-2">
<span className="text-sm text-gray-600 bg-gray-100 rounded-full px-3 py-1">
Numerical Methods
</span>
{" "}
<span className="text-sm text-gray-600 bg-gray-100 rounded-full px-3 py-1">
Chaos
</span>
{" "}
<span className="text-sm text-gray-600 bg-gray-100 rounded-full px-3 py-1">
Spiking Neuron Models
</span>
{" "}
<span className="text-sm text-gray-600 bg-gray-100 rounded-full px-3 py-1">
Synaptic Plasticity
</span>
{" "}
<span className="text-sm text-gray-600 bg-gray-100 rounded-full px-3 py-1">
Computational Neuroscience
</span>
</div>
</section>
<div className="post">
<div className="disclaimer">
<div className="tag">
A note on simplifications
</div>
<div data-lv="easy">
<p>
The brain cells on this page are simplified on purpose. Real cells fire because tiny gates in their skin let salt in and out. These models skip the gates. They only track <em>when</em> a cell fires, and some versions don't draw the spike at all: the voltage hits a line and jumps back down.
</p>
<p>
That shortcut is what makes it possible to simulate thousands of cells and watch them learn. A future post will open up the gates with the <strong>Hodgkin–Huxley model</strong>, where the spike comes out of the chemistry itself.
</p>
</div>
<div data-lv="medium graduate">
<p>
The neurons in this post are <em>integrate-and-fire</em> models. They describe when a neuron fires, not the sodium and potassium channels that actually produce the spike. In the simplest version the spike isn't modeled at all: the voltage reaches a threshold and is reset.
</p>
<p>
That simplification is what makes these models fast enough to run thousands of neurons and to study learning. A future post will cover the <strong>Hodgkin–Huxley model</strong>, where the spike emerges from the channel dynamics themselves. One Hodgkin–Huxley spike does appear here, in Section 4, as a reference to compare against.
</p>
</div>
</div>
<figure className="fig bg-white rounded-lg shadow p-6">
<div id="w-hero">
</div>
<figcaption>
<span className="lv-easy">
A simulated brain cell, live. Its voltage drifts up as input arrives, and when it crosses the red line it fires (the black lines) and starts over. Hold the button to push more current in and watch it fire faster.
</span>
<span className="lv-hard">
A leaky integrate-and-fire neuron with noisy input current, integrated with RK4 at 0.1 ms steps and shown at half speed. Each time V crosses the threshold θ it is reset. The black lines are drawn on afterward: the model itself never produces a spike shape. Hold the button to raise the mean input.
</span>
</figcaption>
</figure>

<h2 className="!mt-10">
0. A neuron is an equation that keeps changing
</h2>
<div data-lv="easy">
<p>
A brain cell has a voltage, a small electrical difference between its inside and outside. Input from other cells pushes the voltage up. Left alone, it leaks back down to a resting level. If enough input arrives fast enough, the voltage crosses a tipping point and the cell fires: a quick electrical pulse that travels to other cells.
</p>
<p>
Each of those sentences is a rule about <em>how fast the voltage is changing right now</em>. Rules like that are called differential equations. They don't tell you where the voltage will be in a second. They only tell you which way it's heading at this instant. To find out where it ends up, you take a small step in that direction, look again, and repeat. Everything on this page is built on doing that well.
</p>
</div>
<div data-lv="medium graduate">
<p>
The state of a model neuron is a short list of numbers: its membrane voltage {tex`\(V\)`}, maybe a slow adaptation current {tex`\(w\)`}, and the currents arriving at its synapses. The model doesn't say what those numbers will be later. It says how fast each one is changing now, as a function of all of them:
</p>
{tex`$$\frac{d\mathbf{y}}{dt} = \mathbf{f}(t, \mathbf{y}).$$`}
<p>
That is an ordinary differential equation (ODE). For almost every model worth studying there is no formula for {tex`\(\mathbf{y}(t)\)`}, so we integrate numerically: start from a known state, use {tex`\(\mathbf{f}\)`} to estimate where the state will be a short time {tex`\(h\)`} later, and repeat. The choice of how to make that estimate is the first decision in any neuron simulation, and it's the one people think about least. So that's where we start.
</p>
</div>

<h2>
1. Taking steps: from Euler to RK4
</h2>
<div data-lv="easy">
<p>
The simplest way to take a step: look at which way things are heading, and go that way for a bit. That's called <strong>Euler's method</strong>. It sounds fine, but there's a catch. The direction changes <em>during</em> the step, and Euler doesn't notice. On a curving path it always overshoots to the outside of the curve.
</p>
<p>
Below is a weight bouncing on a spring. Its real path is a perfect circle (the dashed line): it trades speed for stretch and back, forever. Euler (red) spirals outward, inventing energy from nothing. <strong>RK4</strong> (blue) stays on the circle.
</p>
</div>
<div data-lv="medium graduate">
<p>
The simplest scheme is Euler's method: assume the slope stays constant over the step.
</p>
{tex`$$\mathbf{y}_{n+1} = \mathbf{y}_n + h\,\mathbf{f}(t_n, \mathbf{y}_n).$$`}
<p>
The error it makes on each step is {tex`\(O(h^2)\)`}, so the error accumulated over a fixed time is {tex`\(O(h)\)`}: halve the step, halve the error. That's slow. Worse, the errors aren't random. On a rotation, Euler always steps along the tangent, which points outside the circle, so every step adds a little energy. Below is the harmonic oscillator {tex`\(\ddot x = -x\)`}, written as {tex`\(\dot x = v,\ \dot v = -x\)`}. Its exact orbit is the unit circle.
</p>
</div>
<figure className="fig bg-white rounded-lg shadow p-6">
<div id="w-osc">
</div>
<figcaption>
<span className="lv-easy">
Left: the spring's position and speed, traced over time. Right: how much energy each method has made up, on a scale where every gridline is 10,000 times bigger than the one below it.
</span>
<span className="lv-hard">
Left: phase portrait. Right: relative energy error on a log scale. Euler's energy grows by a factor of {tex`\(1+h^2\)`} every step. RK4 at the same {tex`\(h\)`} loses energy too (it isn't symplectic), but at a rate of order {tex`\(h^6\)`} per step.
</span>
<div className="try">
<div className="tag">
Try this
</div>
<ol>
<li>
Press Play at the default step size and watch Euler spiral out.
</li>
<li>
Drag the step size down to 0.05. Euler gets better but still drifts. RK4's error drops by a huge amount.
</li>
<li>
Drag it up to 1. Now even RK4 visibly cuts corners, but it still stays near the circle while Euler flies off.
</li>
</ol>
</div>
</figcaption>
</figure>
<div data-lv="easy">
<p>
So how does RK4 do so much better? Instead of looking once, it looks four times. It checks the direction where it is, then peeks halfway along, then peeks halfway again using what it just learned, then peeks at the end. It averages those four directions, giving the middle two double weight, and takes one step with the average. Four looks cost four times the work, but the answer can be thousands of times more accurate.
</p>
</div>
<div data-lv="medium graduate">
<p>
RK4 samples the slope four times inside each step and combines them:
</p>
{tex`$$\begin{aligned} \mathbf{k}_1 &= \mathbf{f}(t_n,\ \mathbf{y}_n) \\ \mathbf{k}_2 &= \mathbf{f}(t_n + \tfrac{h}{2},\ \mathbf{y}_n + \tfrac{h}{2}\mathbf{k}_1) \\ \mathbf{k}_3 &= \mathbf{f}(t_n + \tfrac{h}{2},\ \mathbf{y}_n + \tfrac{h}{2}\mathbf{k}_2) \\ \mathbf{k}_4 &= \mathbf{f}(t_n + h,\ \mathbf{y}_n + h\,\mathbf{k}_3) \\ \mathbf{y}_{n+1} &= \mathbf{y}_n + \tfrac{h}{6}\left(\mathbf{k}_1 + 2\mathbf{k}_2 + 2\mathbf{k}_3 + \mathbf{k}_4\right) \end{aligned}$$`}
<p>
Each probe uses the previous one to decide where to look. The weights 1, 2, 2, 1 are Simpson's rule: if {tex`\(\mathbf{f}\)`} depended only on {tex`\(t\)`}, RK4 would be exactly Simpson integration of the slope. The figure below takes one step apart on {tex`\(y' = y\cos t\)`}, whose exact solution {tex`\(y = e^{\sin t}\)`} lets us check every number.
</p>
</div>
<figure className="fig bg-white rounded-lg shadow p-6">
<div id="w-anatomy">
</div>
<figcaption>
<span className="lv-easy">
The grey dashes show which way things are heading everywhere. The black curve is the true path. Each colored dot is one of RK4's four looks, with a short bar showing the direction it saw. The white circle is where the step should land.
</span>
<span className="lv-hard">
Slope field of {tex`\(y' = y\cos t\)`}, the exact solution through {tex`\((t_0, y_0)\)`}, and the four RK4 probes. Dashed lines show the trial step that placed each probe. Each short bar is the slope {tex`\(k_i\)`} sampled there. The open circle is the exact value at {tex`\(t_0 + h\)`}.
</span>
<div className="try">
<div className="tag">
Try this
</div>
<ol>
<li>
Drag the starting point to the top of a hump, where the path curves hardest. Euler's red arrow shoots off. RK4's black arrow still lands near the white circle.
</li>
<li>
Make the step huge (above 2). Watch the four probes spread out and RK4 finally miss too. No method saves you from steps that are too big.
</li>
</ol>
</div>
</figcaption>
</figure>
<div data-lv="graduate">
<div className="grad-note">
<div className="tag">
Graduate: order, stability, and what RK4 doesn't promise
</div>
<p>
RK4's local truncation error is {tex`\(O(h^5)\)`} and its global error is {tex`\(O(h^4)\)`}. The figure below measures this directly: the global error at {tex`\(t = 6\)`} falls with slope 4 on a log–log plot, against slope 1 for Euler, until it hits the floor set by 64-bit rounding.
</p>
<div id="w-conv" className="my-4">
</div>
<p>
Two caveats matter for everything that follows. First, RK4 is explicit, so it is only stable when {tex`\(h\lambda\)`} lies inside its stability region (roughly {tex`\(|h\lambda| \lesssim 2.8\)`} on the negative real axis, where {tex`\(\lambda\)`} ranges over the Jacobian's eigenvalues). A membrane with {tex`\(\tau = 10\)`} ms has {tex`\(\lambda = -0.1\ \text{ms}^{-1}\)`}, so steps of 0.1–0.25 ms are far inside the region. Stiff systems such as Hodgkin–Huxley channel kinetics or detailed calcium dynamics push {tex`\(\lambda\)`} much more negative and favor implicit methods. Second, RK4 is not symplectic. On Hamiltonian systems its energy error grows slowly but without bound. For long orbital or molecular simulations you would use a symplectic integrator such as leapfrog/Verlet. For dissipative neuron models, which forget their initial energy anyway, RK4's accuracy per unit of work is hard to beat.
</p>
</div>
</div>

<h2>
2. Stress-testing the solver: the Lorenz butterfly
</h2>
<div data-lv="easy">
<p>
In 1963, the weather scientist Edward Lorenz wrote down three simple rules for air rising and falling in a heated box. He found something strange. If he restarted his simulation from numbers rounded to three digits instead of six, the forecast came out completely different after a while. The tiniest difference grew and grew until it took over. This became known as the <strong>butterfly effect</strong>: the idea that a butterfly flapping its wings could change the weather weeks later.
</p>
<p>
Below, two paths start almost exactly at the same spot, differing by one part in 100 million. For a while they move together. Then they split up and loop around different wings of the butterfly. Yet both keep tracing the same butterfly shape. You can't predict where one path will be, but you can trust the shape.
</p>
</div>
<div data-lv="medium graduate">
<p>
The Lorenz system is three coupled equations, originally a drastically reduced model of convection:
</p>
{tex`$$\dot x = \sigma(y - x), \qquad \dot y = x(\rho - z) - y, \qquad \dot z = xy - \beta z.$$`}
<p>
At Lorenz's parameters {tex`\(\sigma = 10,\ \rho = 28,\ \beta = 8/3\)`}, trajectories never settle and never repeat. They wind around two unstable fixed points, switching between the two wings in an order that looks random. Nearby trajectories separate exponentially, {tex`\(|\delta(t)| \approx |\delta_0|\, e^{\lambda t}\)`} with {tex`\(\lambda \approx 0.906\)`}. That is what chaos means here: sensitive dependence on initial conditions, inside a bounded region of state space.
</p>
<p>
That makes Lorenz a hard test for a solver. Any numerical error acts like a perturbation and grows at the same exponential rate. Two trajectories that start {tex`\(10^{-8}\)`} apart below will lose each other after about {tex`\(\ln(10^{9})/0.906 \approx 23\)`} time units, no matter how good the integrator is.
</p>
</div>
<figure className="fig bg-white rounded-lg shadow p-6">
<div id="w-lorenz">
</div>
<figcaption>
<span className="lv-easy">
Left: the two paths in 3D (drag to turn it). Right: the distance between them. Each gridline up is 10 times farther apart. A straight climb on this kind of scale means the gap keeps multiplying.
</span>
<span className="lv-hard">
Left: two trajectories, {tex`\(x_0 = 1\)`} and {tex`\(x_0 = 1 + 10^{-8}\)`}, over a faint reference attractor computed with RK4 at {tex`\(h = 0.002\)`}. Right: {tex`\(|\delta(t)|\)`} on a log scale, with {tex`\(e^{\lambda t}\)`} dashed.
</span>
<div className="try">
<div className="tag">
Try this
</div>
<ol>
<li>
Press Play and watch the distance climb in a straight line until the two paths are on different wings.
</li>
<li>
Switch the solver to Euler and Play. The paths still look chaotic, but compare them with the faint grey cloud. Then raise the step size: Euler's butterfly smears and swells while RK4's still matches the grey shape. At the largest steps Euler blows up entirely.
</li>
<li>
Slide ρ down below 24. The butterfly collapses: paths spiral into one of two resting points. Chaos is something these equations do only for some settings.
</li>
</ol>
</div>
</figcaption>
</figure>
<div data-lv="easy">
<p>
The lesson for brain cells: when inputs are noisy, you can't predict the exact moment a cell will fire. What you can trust is the pattern, like how often it fires and how its connections change on average. That's what we'll watch.
</p>
</div>
<div data-lv="medium graduate">
<p>
The lesson to carry forward: with chaos, or with noise, individual trajectories can't be trusted for long, but their statistics can. A good solver keeps the <em>shape</em> of the attractor (where trajectories spend their time) even after the trajectory itself has diverged. Euler at a large step distorts the shape. RK4 at the same step preserves it. When we drive neurons with random input, the spike times will be different every run. The firing rates and the weight changes are what we'll read.
</p>
</div>
<div data-lv="graduate">
<div className="grad-note">
<div className="tag">
Graduate: why a wrong trajectory can still be a right answer
</div>
<p>
For uniformly hyperbolic systems, the shadowing lemma guarantees that a numerical trajectory with small per-step errors stays close to <em>some</em> exact trajectory with a slightly different initial condition. The computed orbit is wrong as a prediction but typical as a sample. The Lorenz attractor isn't uniformly hyperbolic, but Tucker (2002) proved, using rigorous interval-arithmetic numerics, that a robust strange attractor exists at the classical parameters. That computer-assisted proof answered Smale's fourteenth problem. The predictability horizon is {tex`\(t^* \approx \lambda^{-1}\ln(\Delta/\delta_0)\)`}: a better solver lowers {tex`\(\delta_0\)`}, but only buys time logarithmically.
</p>
</div>
</div>

<h2>
3. The leaky integrate-and-fire neuron
</h2>
<div data-lv="easy">
<p>
Now for the brain cell. Picture a bucket with a small hole in the bottom. Pour water in (that's the input) and the level rises. The hole lets it leak back out, so if you stop pouring, the level falls to empty. Draw a line near the top. When the water reaches the line, the cell fires: the bucket is dumped and it starts again.
</p>
<p>
That's the whole model, called the <strong>leaky integrate-and-fire</strong> neuron. "Integrate" means it adds up input. "Leaky" means it slowly forgets. "Fire" means it fires at the line. With a gentle trickle the leak wins and the level settles below the line: no firing at all. Pour harder and it fills and fires again and again, faster the harder you pour.
</p>
</div>
<div data-lv="medium graduate">
<p>
The leaky integrate-and-fire (LIF) neuron treats the membrane as a capacitor in parallel with a leak resistor. One ODE and one reset rule:
</p>
{tex`$$C\frac{dV}{dt} = -g_L\,(V - E_L) + I(t), \qquad V \ge \theta \;\Rightarrow\; \text{spike},\ V \leftarrow V_r .$$`}
<p>
With {tex`\(C = 200\)`} pF and {tex`\(g_L = 10\)`} nS, the membrane time constant is {tex`\(\tau = C/g_L = 20\)`} ms. Under a constant current, {tex`\(V\)`} relaxes exponentially toward {tex`\(V_\infty = E_L + I/g_L\)`}. If {tex`\(V_\infty\)`} stays below threshold, the neuron never fires. The smallest current that fires it is the <strong>rheobase</strong>, {tex`\(I_{\text{rh}} = g_L(\theta - E_L)\)`}. Above it, the time from reset to threshold can be solved exactly, and with a refractory period {tex`\(t_{\text{ref}}\)`} after each spike, the firing rate is
</p>
{tex`$$f(I) = \left[\,t_{\text{ref}} + \tau \ln\frac{V_\infty - V_r}{V_\infty - \theta}\,\right]^{-1}.$$`}
<p>
That closed form is a gift: it lets us check the simulation. The dashed curve in the right panel is the formula. The dots are measured by running the RK4 neuron for a simulated second at each current.
</p>
</div>
<figure className="fig bg-white rounded-lg shadow p-6">
<div id="w-lif">
</div>
<figcaption>
<span className="lv-easy">
Left: the cell's voltage while input is switched on (orange strip). Right: how fast it fires for each amount of input. The orange dot is your current setting.
</span>
<span className="lv-hard">
Left: {tex`\(V(t)\)`} for a current step from 50 to 350 ms. Grey dashed: {tex`\(V_\infty\)`}. Right: the f–I curve, analytic (dashed) against simulated (dots). The orange dot is the rate at the current setting.
</span>
<div className="try">
<div className="tag">
Try this
</div>
<ol>
<li>
Set the input to 140 pA. The voltage settles just under the line and never fires. Now try 160.
</li>
<li>
Press &ldquo;Measure the whole curve&rdquo;. The dots land on the formula. That's the solver passing a test.
</li>
<li>
Raise the rest after a spike to 10 ms and measure again. The curve flattens at the top: a cell that has to rest can't fire faster than once per rest period.
</li>
</ol>
</div>
</figcaption>
</figure>
<div data-lv="medium graduate">
<h3>
The reset is a cliff, and RK4 can't see cliffs
</h3>
<p>
RK4's accuracy comes from assuming the solution is smooth across the step. The reset breaks that assumption: {tex`\(V\)`} jumps from {tex`\(\theta\)`} to {tex`\(V_r\)`} instantly. If the code only checks for {tex`\(V \ge \theta\)`} at the end of each step and resets there, every spike is late by up to one step. Spike times carry the information downstream, and STDP in Section 6 depends on them at the millisecond level, so this matters. The fix is to find the crossing inside the step (here by linear interpolation), reset at that moment, and integrate the rest of the step from {tex`\(V_r\)`}.
</p>
<figure className="fig bg-white rounded-lg shadow p-6">
<div id="w-timing">
</div>
<figcaption>
Constant input, so the exact spike times are known in closed form (grey ticks). With large steps, the end-of-step rule delays every spike, the delays add up, and spikes go missing.
</figcaption>
</figure>
</div>
<div data-lv="graduate">
<div className="grad-note">
<div className="tag">
Graduate: exact integration and event handling
</div>
<p>
Linear interpolation of the crossing is {tex`\(O(h^2)\)`} accurate, which caps the spike-time accuracy below RK4's {tex`\(O(h^4)\)`}. Cubic Hermite interpolation using the derivative at both ends, or a few Newton steps on RK4's dense output, recovers the full order. For the LIF with exponential synapses there is a better option: the subthreshold dynamics are linear, so the state can be propagated exactly with a matrix exponential, {tex`\(\mathbf{y}_{n+1} = e^{Ah}\mathbf{y}_n\)`} (Rotter &amp; Diesmann, 1999). That is what simulators like NEST do. I use RK4 throughout this post on purpose, so one integrator handles linear and nonlinear models alike.
</p>
</div>
</div>

<h2>
4. A zoo of integrate-and-fire neurons
</h2>
<div data-lv="easy">
<p>
The bucket model is simple, maybe too simple. Its voltage creeps up to the line and then jumps back down: there's no actual spike, just a rule that says "fire now." Scientists have built better versions by changing one thing: how the voltage speeds up as it gets close to the tipping point. In a real cell, once the voltage gets high enough, it starts pushing itself up faster and faster. That runaway rise <em>is</em> the spike.
</p>
<ul>
<li>
<strong>LIF</strong>: the bucket. The voltage slows down as it approaches the line and is reset by a rule.
</li>
<li>
<strong>QIF</strong>: near the tipping point, the voltage starts racing upward by itself.
</li>
<li>
<strong>EIF</strong>: the same idea with an even sharper takeoff, which matches real cells well.
</li>
<li>
<strong>AdEx</strong>: EIF plus tiredness. Each spike makes the next one a little harder.
</li>
</ul>
</div>
<div data-lv="medium graduate">
<p>
The LIF's weakness shows in its equation: below threshold, {tex`\(dV/dt\)`} only ever pulls {tex`\(V\)`} back toward rest, harder the higher {tex`\(V\)`} goes. Nothing in the dynamics makes a spike. Real neurons have sodium channels that open as {tex`\(V\)`} rises, adding positive feedback, and that runaway upswing is the spike. The family of integrate-and-fire models differs mainly in one term: how {tex`\(dV/dt\)`} depends on {tex`\(V\)`}.
</p>
{tex`$$\begin{aligned} \text{LIF:}\quad & C\dot V = -g_L(V - E_L) + I \\ \text{QIF:}\quad & C\dot V = k\,(V - E_L)(V - V_T) + I \\ \text{EIF:}\quad & C\dot V = -g_L(V - E_L) + g_L\Delta_T\, e^{(V - V_T)/\Delta_T} + I \\ \text{AdEx:}\quad & C\dot V = -g_L(V - E_L) + g_L\Delta_T\, e^{(V - V_T)/\Delta_T} - w + I, \quad \tau_w \dot w = a(V - E_L) - w \end{aligned}$$`}
<p>
In QIF and EIF the right-hand side turns upward and diverges, so {tex`\(V\)`} shoots off to infinity in finite time by itself. The simulation stops it at a peak and resets it. The exponential term in the EIF has a sharpness {tex`\(\Delta_T\)`}. As {tex`\(\Delta_T \to 0\)`} it becomes a hard threshold and the EIF turns back into the LIF. Fits to cortical pyramidal cells give {tex`\(\Delta_T \approx 1\)`}–3 mV (Badel et al., 2008). AdEx adds a second variable {tex`\(w\)`}, an adaptation current that jumps by {tex`\(b\)`} at every spike and decays with time constant {tex`\(\tau_w\)`}.
</p>
</div>
<h3>
Anatomy of a spike, model by model
</h3>
<div data-lv="easy">
<p>
Below, the faint dashed curve is the shape of a real spike, simulated with the full gate-by-gate model (Hodgkin–Huxley). Its parts are labeled: rest, tipping point, the fast rise, the top, the fall, the dip below rest, and a short time when it's hard to fire again. Pick a model to lay its spike on top and see which parts it gets.
</p>
</div>
<div data-lv="medium graduate">
<p>
The faint curve below is one action potential from the Hodgkin–Huxley model (squid axon parameters), integrated with the same RK4 code. Its phases are labeled. Each integrate-and-fire model is driven with a strong current step until its first spike, then the current is switched off so it can recover. All the spikes are aligned at the moment of the spike. The table separates what each model produces from its own dynamics from what is imposed by a reset rule or a cutoff.
</p>
</div>
<figure className="fig bg-white rounded-lg shadow p-6">
<div id="w-spike">
</div>
<figcaption>
<span className="lv-easy">
A ✓ means the model's own rule creates that part of the spike. A ~ means it's faked by hand, for example by resetting below rest to make a dip. A ✗ means it's missing.
</span>
<span className="lv-hard">
Top: one spike per model against the Hodgkin–Huxley reference (dashed), aligned at the spike. The purple band marks the first 4 ms after it. Bottom: the intrinsic dynamics {tex`\(f(V)\)`}, i.e. {tex`\(dV/dt\)`} with no input, for each model, with the Hodgkin–Huxley spike plotted the same way. Filled dot: stable rest. Open dot: the unstable fixed point where the threshold emerges.
</span>
<div className="try">
<div className="tag">
Try this
</div>
<ol>
<li>
Start with LIF. It rises slowly, then just jumps down. No rise, no top.
</li>
<li>
Switch to QIF, then EIF. The fast rise appears. EIF's is sharper and closer to the real one.
</li>
<li>
Switch to AdEx. The spike looks like EIF, but afterward the voltage stays lower for longer. That's the tiredness current at work.
</li>
</ol>
</div>
</figcaption>
</figure>
<div data-lv="medium graduate">
<p>
The bottom panel is the key idea of this section: <strong>the shape of the upstroke is the shape of {tex`\(f(V)\)`}</strong>. Where {tex`\(f\)`} crosses zero going downward, there is a stable rest state. Where it crosses going upward, there is an unstable point: push {tex`\(V\)`} past it and {tex`\(f\)`} keeps pushing. LIF's line never turns up, so its threshold has to be added as a rule. In QIF and EIF the threshold comes out of the equation, as the unstable fixed point. None of them repolarizes by itself. That needs a second, slower variable that pulls {tex`\(V\)`} back down, which is exactly what potassium channels do in Hodgkin–Huxley and what {tex`\(w\)`} does, crudely, in AdEx.
</p>
</div>
<h3>
Firing patterns: what a second variable buys you
</h3>
<div data-lv="easy">
<p>
Real brain cells don't all fire the same way. Some tick like a metronome. Some start fast and tire. Some fire in bursts. The AdEx model can do all of these, just by changing a few numbers in its tiredness rule. Turn the tiredness off and every pattern turns back into the plain metronome.
</p>
</div>
<div data-lv="medium graduate">
<p>
One extra variable is enough to reproduce most of the firing patterns seen in cortical recordings. The presets below are parameter sets from Naud et al. (2008), each driven by the same kind of current step. The right panel is the {tex`\((V, w)\)`} phase plane, the same idea as the Lorenz picture but in two dimensions and with jumps. The dashed curves are nullclines, where {tex`\(\dot V = 0\)`} (green) or {tex`\(\dot w = 0\)`} (purple). Between spikes the trajectory follows the vector field. At each spike it leaves the right edge and is reinjected at {tex`\((V_r,\ w + b)\)`}.
</p>
</div>
<figure className="fig bg-white rounded-lg shadow p-6">
<div id="w-zoo">
</div>
<figcaption>
<span className="lv-easy">
Top: the voltage. Bottom: the tiredness, which jumps up at every spike and slowly fades. The traces play back slowly so you can follow them.
</span>
<span className="lv-hard">
Left: {tex`\(V(t)\)`} and {tex`\(w(t)\)`} for a current step at 50 ms, played back at quarter speed. Right: the trajectory in the {tex`\((V,w)\)`} plane over the vector field and nullclines. Dashed grey lines are reset jumps.
</span>
<div className="try">
<div className="tag">
Try this
</div>
<ol>
<li>
Compare Tonic and Adapting. Same model, but in Adapting each spike adds a lot of tiredness that fades slowly, so the gaps between spikes stretch out.
</li>
<li>
Pick Bursting and watch the phase plane: a few fast loops, then a long slow drift down before the next burst.
</li>
<li>
Tick the box that removes adaptation. Every preset becomes a metronome.
</li>
</ol>
</div>
</figcaption>
</figure>
<div data-lv="graduate">
<div className="grad-note">
<div className="tag">
Graduate: excitability classes and bifurcations
</div>
<p>
The QIF is the normal form of a saddle-node bifurcation on an invariant circle. Near rheobase its rate grows like {tex`\(f \propto \sqrt{I - I_{\text{rh}}}\)`}: it can fire arbitrarily slowly (Hodgkin's class I excitability). The change of variables {tex`\(V = \tan(\vartheta/2)\)`} turns it into the Ermentrout–Kopell theta neuron. The LIF's rate instead rises from zero with an infinite slope and {tex`\(1/\ln\)`} behavior. In AdEx the parameter {tex`\(a\)`} decides how rest loses stability. For small {tex`\(a\)`} it is a saddle-node, giving class I firing. For larger {tex`\(a\)`}, rest can lose stability through an Andronov–Hopf bifurcation, giving class II behavior with subthreshold oscillations and a nonzero minimum rate (Touboul &amp; Brette, 2008). Where the reset lands relative to the {tex`\(\dot V = 0\)`} nullcline decides whether the neuron bursts, which is why bursting shows up as two different speeds in the phase plane.
</p>
</div>
</div>

<h2>
5. Connecting neurons: synapses
</h2>
<div data-lv="easy">
<p>
One cell on its own doesn't do much. Cells talk through connections called <strong>synapses</strong>. When cell A fires, it gives cell B a short kick of current, which raises B's voltage a little for a few milliseconds. One kick is usually not enough to make B fire. Several kicks close together add up.
</p>
<p>
Each connection also has a <strong>strength</strong>. A strong connection gives a big kick. A weak one barely registers. Learning, as we'll see next, is mostly about changing these strengths.
</p>
</div>
<div data-lv="medium graduate">
<p>
The simplest synapse model is a current that jumps when the presynaptic neuron spikes and decays exponentially:
</p>
{tex`$$\tau_s \frac{dI_{\text{syn}}}{dt} = -I_{\text{syn}}, \qquad \text{presynaptic spike: } I_{\text{syn}} \leftarrow I_{\text{syn}} + w\,J .$$`}
<p>
{tex`\(I_{\text{syn}}\)`} feeds into neuron B's membrane equation as its input current. The state is now {tex`\([V_B, I_{\text{syn}}]\)`}, integrated together with RK4. Filtering an exponential current through the membrane gives the familiar postsynaptic potential (PSP): a fast rise and a slower decay, here about 8 mV at peak for {tex`\(w = 1\)`}. B's threshold is 15 mV above rest, so B fires only when several PSPs arrive within about one membrane time constant. This is <strong>temporal summation</strong>. The weight {tex`\(w\)`} is the number learning will change.
</p>
</div>
<figure className="fig bg-white rounded-lg shadow p-6">
<div id="w-syn">
</div>
<figcaption>
<span className="lv-easy">
Top: when A fires. Middle: the kick of current A sends into B. Bottom: B's voltage and its firing line.
</span>
<span className="lv-hard">
Top: presynaptic spikes. Middle: {tex`\(I_{\text{syn}}(t)\)`}. Bottom: {tex`\(V_B(t)\)`} and the threshold. Shown at a tenth of real time.
</span>
<div className="try">
<div className="tag">
Try this
</div>
<ol>
<li>
Click Fire A once and wait. Then click it three times as fast as you can. Only the quick burst gets B over the line.
</li>
<li>
Make the kick last longer (20 ms). Now kicks that are spaced out still pile up.
</li>
<li>
Let A fire on its own at 40 Hz and raise the connection strength until B starts following A.
</li>
</ol>
</div>
</figcaption>
</figure>
<div data-lv="graduate">
<div className="grad-note">
<div className="tag">
Graduate: current versus conductance
</div>
<p>
Real synapses open channels with a reversal potential, so the injected current is {tex`\(g_{\text{syn}}(t)(E_{\text{syn}} - V)\)`}, not a fixed waveform. That makes excitation weaker as {tex`\(V\)`} approaches {tex`\(E_{\text{syn}}\)`} and, more importantly, adds {tex`\(g_{\text{syn}}\)`} to the total membrane conductance. Under heavy balanced input the effective time constant {tex`\(C/(g_L + \sum g_{\text{syn}})\)`} can shrink several-fold: the high-conductance state (Destexhe, Rudolph &amp; Paré, 2003). That makes the neuron a sharper coincidence detector. I use current-based synapses here because they keep the subthreshold dynamics linear and the PSP shape fixed, which makes the STDP analysis below cleaner.
</p>
</div>
</div>

<h2>
6. STDP: learning from timing
</h2>
<div data-lv="easy">
<p>
How does a connection know whether to get stronger? Through timing. If A fires just <em>before</em> B, A probably helped make B fire. That connection is useful, so it gets stronger. If A fires just <em>after</em> B, A had nothing to do with it, and the connection gets weaker. The closer together the two spikes, the bigger the change. This rule is called <strong>spike-timing-dependent plasticity</strong>, or STDP. It's often summed up as "fire together, wire together," but order matters.
</p>
<p>
How does a connection remember when its spikes happened? Each side keeps a fading memory of its last spike, like a footprint in sand. When B fires, the connection checks how fresh A's footprint is. When A fires, it checks B's.
</p>
</div>
<div data-lv="medium graduate">
<p>
Spike-timing-dependent plasticity, measured in hippocampal cultures by Bi &amp; Poo (1998), changes a weight according to the relative timing {tex`\(\Delta t = t_{\text{post}} - t_{\text{pre}}\)`} of spike pairs:
</p>
{tex`$$\Delta w = \begin{cases} +A_+\, e^{-\Delta t/\tau_+} & \Delta t > 0 \quad (\text{pre before post: LTP}) \\ -A_-\, e^{\,\Delta t/\tau_-} & \Delta t < 0 \quad (\text{post before pre: LTD}) \end{cases}$$`}
<p>
A synapse doesn't store spike times. It keeps two decaying traces, which are ODEs just like everything else:
</p>
{tex`$$\tau_+\frac{dx}{dt} = -x \ \ (x \mathrel{+}= 1 \text{ at pre}), \qquad \tau_-\frac{dy}{dt} = -y \ \ (y \mathrel{+}= 1 \text{ at post}).$$`}
<p>
At each postsynaptic spike the weight gains {tex`\(A_+x\)`}. At each presynaptic spike it loses {tex`\(A_-y\)`}. Summed over a pair, that is exactly the window above. The figure runs the standard lab protocol: pair a pre and a post spike {tex`\(\Delta t\)`} apart, repeat 60 times at 1 Hz, and record the total change. The window isn't drawn in. It builds up from measurements.
</p>
</div>
<figure className="fig bg-white rounded-lg shadow p-6">
<div id="w-pair">
</div>
<figcaption>
<span className="lv-easy">
Top left: one pairing, with each spike's fading memory. Bottom left: the connection's strength over the last 60 pairings. Right: every measurement you've made. The dashed curve is the formula.
</span>
<span className="lv-hard">
Top left: one pairing with traces {tex`\(x\)`} and {tex`\(y\)`}. Bottom left: {tex`\(w\)`} over the last protocol. Right: measured {tex`\(\Delta w\)`} after 60 pairings, against the additive prediction (dashed). Multiplicative: {tex`\(\Delta w_+ \propto (1 - w)\)`}, {tex`\(\Delta w_- \propto w\)`}.
</span>
<div className="try">
<div className="tag">
Try this
</div>
<ol>
<li>
Press &ldquo;Try every gap&rdquo;. The two-sided window draws itself, one measurement at a time.
</li>
<li>
Switch to Multiplicative and sweep again. The window keeps its shape but shrinks: every change gets smaller as the connection nears its limit, so no timing can push it all the way to full strength or to zero.
</li>
<li>
Set the gap to +5 ms and pair 60 times with each rule. Additive climbs in a straight line until it hits the ceiling. Multiplicative curves gently toward it.
</li>
</ol>
</div>
</figcaption>
</figure>
<div data-lv="medium graduate">
<p>
The two rules differ in a way that matters for networks. In the additive rule a weight's change doesn't depend on the weight itself, so weights pushed in one direction keep going until they hit a bound. Under competition this gives a bimodal distribution: weights end up near 0 or near the maximum. The multiplicative rule adds a pull toward the middle that keeps weights unimodal and spread out (van Rossum, Bi &amp; Turrigiano, 2000). The finale uses the additive rule because its winner-take-all behavior is easy to see.
</p>
</div>
<div data-lv="graduate">
<div className="grad-note">
<div className="tag">
Graduate: pairs aren't the whole story
</div>
<p>
The pair rule with all-to-all trace interactions predicts that LTP and LTD simply add up as pairing frequency rises. Experiments disagree: at high frequency, potentiation dominates even for negative {tex`\(\Delta t\)`} (Sjöström, Turrigiano &amp; Nelson, 2001). The triplet rule (Pfister &amp; Gerstner, 2006) adds a slower postsynaptic trace that gates LTP. That reproduces the frequency dependence and reduces to a BCM-like rule for Poisson firing. Restricting interactions to nearest-neighbour spikes, instead of all-to-all, changes the effective window at high rates too. Gütig et al. (2003) interpolate between the additive and multiplicative rules with a weight-dependence exponent {tex`\(\mu\)`}, and show that the split between bimodal and unimodal weights is a transition at small {tex`\(\mu\)`}.
</p>
</div>
</div>

<h2>
7. Finale: how the equations play together
</h2>
<div data-lv="easy">
<p>
Time to put everything together. One cell listens to 400 inputs. Every input fires about 20 times a second, at random. But there's a secret: half of the inputs are partly copying a hidden source. Now and then the source fires, and about one in five of those inputs fire at the same moment. Look at any single input and you can't tell which half it's in, since they all fire just as often. The only clue is that some of them tend to fire <em>together</em>.
</p>
<p>
The cell has no teacher and no score. It only has the timing rule from the last section. Press Play and watch: the connections from the inputs that fire together grow strong, and the rest fade away. The cell has found the hidden group by itself.
</p>
</div>
<div data-lv="medium graduate">
<p>
Now everything runs at once. One LIF neuron receives 400 Poisson inputs at 20 Hz each, through current-based exponential synapses, and every synapse runs the additive STDP rule. Inputs 1–200 share a hidden source: each source spike is copied by every one of them independently with probability {tex`\(c = 0.2\)`}, and each makes up the rest of its 20 Hz independently. Inputs 201–400 are independent Poisson. Single-input rates are identical, so only correlations distinguish the groups. The window is slightly depression-dominated, {tex`\(A_-\tau_- = 1.05\,A_+\tau_+\)`}. That is the regime Song, Miller &amp; Abbott (2000) showed makes STDP competitive.
</p>
<p>
The full state, integrated together at {tex`\(h = 0.25\)`} ms, is {tex`\(V\)`}, the synaptic current {tex`\(I\)`}, the postsynaptic trace {tex`\(y\)`}, 400 presynaptic traces {tex`\(x_i\)`}, and 400 weights {tex`\(w_i\)`}. The panel on the right lights up each equation as it acts. Notice the timescales: {tex`\(V\)`} and {tex`\(I\)`} move in milliseconds, the traces in tens of milliseconds, and the weights over tens of seconds.
</p>
</div>
<figure className="fig bg-white rounded-lg shadow p-6">
<div id="w-finale">
</div>
<figcaption>
<span className="lv-easy">
Top left: the last half-second of spikes from 60 inputs of each group, plus the hidden source and the cell's output. Darker dots come from stronger connections. Middle left: the strength of all 400 connections. Right: average strength of each group over time, and which rule is acting right now.
</span>
<span className="lv-hard">
Top left: raster of 60 inputs per group (opacity = weight), the hidden source, and output spikes. Middle left: all 400 weights. Right: mean weight per group over time, and the model's equations, lit when they act. The output's locking to the source is measured as the fraction of output spikes within 5 ms after a source spike. Chance is about 10%.
</span>
<div className="try">
<div className="tag">
Try this
</div>
<ol>
<li>
Press Play at 10×. Within about a minute of simulated time the blue bars climb to the top, and the grey ones keep sinking after that.
</li>
<li>
Watch the output row in the raster and the readout above it. From the start, most output spikes come right after a purple source spike: 40 inputs firing at once is a big kick. While the blue bars grow, extra spikes driven by the background creep in and the share drops. Once the grey bars fade, those extra spikes go away and the share climbs back up.
</li>
<li>
Untick Learning partway through. The weights freeze but the neuron keeps firing. All the change came from that one timing rule.
</li>
<li>
Start over a few times. The details change, but the correlated group wins every time.
</li>
</ol>
</div>
</figcaption>
</figure>
<div data-lv="easy">
<p>
Why does it work? When several inputs fire at the same moment, their kicks add up and often make the cell fire right after. So inputs from the hidden group often fire just <em>before</em> the cell, and the timing rule strengthens them. The inputs that fire on their own are as likely to fire just after the cell as just before. The rule is tuned to weaken slightly more than it strengthens, so on balance they fade. Strong connections make the cell fire even more in step with the group, so the effect feeds itself.
</p>
</div>
<div data-lv="medium graduate">
<p>
Why it works: a correlated input often fires together with others in its group, their PSPs sum, and the neuron tends to spike a few milliseconds later. So correlated inputs get more pre-before-post pairings than chance would give, and net LTP. An independent input's timing relative to the output is nearly random. It samples both lobes of the window equally, and because the LTD lobe is slightly larger, it drifts down. The weights that win make the output follow the source more closely, which strengthens the correlation they feed on: positive feedback, held in check by the hard bound {tex`\(w \le 1\)`}. Depression dominance also keeps the output rate bounded. As weights grow, extra output spikes bring extra LTD.
</p>
</div>
<div data-lv="graduate">
<div className="grad-note">
<div className="tag">
Graduate: averaging, drift, and the clock
</div>
<p>
Because {tex`\(A_\pm\)`} are small, weights change slowly compared with the neural dynamics, and the learning can be averaged (Kempter, Gerstner &amp; van Hemmen, 1999). For Poisson input with rate {tex`\(\nu_i\)`} and output rate {tex`\(\nu_{\text{out}}\)`}, the mean drift is
</p>
{tex`$$\frac{dw_i}{dt} \approx \nu_i\,\nu_{\text{out}} \int W(s)\,ds \;+\; \int W(s)\, C_i(s)\, ds,$$`}
<p>
where {tex`\(W\)`} is the STDP window and {tex`\(C_i(s)\)`} is the covariance between input {tex`\(i\)`} and the output at lag {tex`\(s\)`}. The first term is negative here ({tex`\(\int W < 0\)`}) and the same for every input. The second is positive for every input, through its own PSP's effect on the output, and much larger for the correlated group, whose members also share each other's influence. Competition is the first term pushing everything down while the second lifts only some.
</p>
<p>
On the numerics: with {tex`\(h = 0.25\)`} ms and {tex`\(\tau_s = 2\)`} ms, {tex`\(h/\tau_s = 0.125\)`}, comfortably accurate for RK4. The traces have closed-form solutions between spikes, so the code updates each {tex`\(x_i\)`} lazily, only when it is read, instead of decaying 400 numbers every step. This is the core trick of event-driven simulation. A fully event-driven simulator would do the same for {tex`\(V\)`} using the exact LIF propagator and jump straight from spike to spike.
</p>
</div>
</div>

<h2>
The honest fine print
</h2>
<ul>
<li>
<strong>
Everything here is a point neuron.
</strong>
{" "}No dendrites, no axon, no ion channels (apart from the one Hodgkin–Huxley reference spike). Where on a dendrite a synapse sits changes both its PSP and its plasticity, and none of that is modeled.
</li>
<li>
<strong>
The finale is a toy.
</strong>
{" "}400 inputs instead of thousands, no inhibition, current-based synapses, constant input rates, and an output rate of 20–55 Hz, higher than most cortical neurons. With Song et al.&rsquo;s conductance-based setup and balanced inhibition, the same competition happens at more realistic rates.
</li>
<li>
<strong>
Why correlated inputs and not a hidden spike pattern.
</strong>
{" "}A more dramatic version of this experiment hides a repeating spatiotemporal spike pattern in the noise, and the neuron learns to fire at its start (Masquelier, Guyonneau &amp; Thorpe, 2008). In a scaled-down version I tested, the neuron learned the pattern in only about half of the random seeds, so I used the more robust correlated-input version here.
</li>
<li>
<strong>
STDP is not one rule.
</strong>
{" "}The window's shape and even its sign vary across brain areas, cell types, and dendritic locations, and depend on firing rate and neuromodulators. The pair rule is the textbook starting point, not the final word.
</li>
<li>
<strong>
Parameters.
</strong>
{" "}The AdEx firing patterns use parameter sets from Naud et al. (2008). The Hodgkin–Huxley spike uses the classic squid-axon parameters at 6.3 °C. Everything else was chosen to be in a physiological range and easy to see, not fitted to data.
</li>
</ul>

<h2>
Words to know
</h2>
<ul>
<li>
<strong>Differential equation</strong>: a rule for how fast something is changing right now, given its current state.
</li>
<li>
<strong>Step size ({tex`\(h\)`})</strong>: how far forward in time the solver jumps each step. Smaller is more accurate and slower.
</li>
<li>
<strong>Euler / RK4</strong>: two ways of taking a step. Euler looks once. RK4 looks four times and averages.
</li>
<li>
<strong>Attractor</strong>: the shape a system's state settles onto over time, like the Lorenz butterfly.
</li>
<li>
<strong>Chaos</strong>: tiny differences in the starting point grow exponentially, so long-range prediction is impossible even though the rules are exact.
</li>
<li>
<strong>Membrane potential ({tex`\(V\)`})</strong>: the voltage across a neuron's membrane, about −65 mV at rest.
</li>
<li>
<strong>Threshold ({tex`\(\theta\)`})</strong>: the voltage at which the neuron fires.
</li>
<li>
<strong>Rheobase</strong>: the smallest constant input current that makes a neuron fire at all.
</li>
<li>
<strong>Refractory period</strong>: a short time after a spike when the neuron can't fire, or fires only with difficulty.
</li>
<li>
<strong>Adaptation</strong>: a slow current that builds up with each spike and makes the next one harder.
</li>
<li>
<strong>PSP</strong>: the small voltage bump a synaptic input causes in the receiving neuron.
</li>
<li>
<strong>LTP / LTD</strong>: long-term potentiation and depression, a lasting strengthening or weakening of a synapse.
</li>
<li>
<strong>STDP</strong>: spike-timing-dependent plasticity. Input before output strengthens a synapse. Output before input weakens it.
</li>
<li>
<strong>Trace</strong>: a decaying memory of recent spikes that a synapse uses to apply STDP.
</li>
</ul>

<h2>
References
</h2>
<ul className="!text-base">
<li>
Lorenz, E. N. (1963). Deterministic nonperiodic flow.{" "}
<em>
Journal of the Atmospheric Sciences
</em>
, 20(2).
</li>
<li>
Tucker, W. (2002). A rigorous ODE solver and Smale&rsquo;s 14th problem.{" "}
<em>
Foundations of Computational Mathematics
</em>
, 2(1).
</li>
<li>
Hodgkin, A. L. &amp; Huxley, A. F. (1952). A quantitative description of membrane current and its application to conduction and excitation in nerve.{" "}
<em>
Journal of Physiology
</em>
, 117(4).
</li>
<li>
Gerstner, W., Kistler, W. M., Naud, R. &amp; Paninski, L. (2014).{" "}
<em>
Neuronal Dynamics: From Single Neurons to Networks and Models of Cognition
</em>
. Cambridge University Press.
</li>
<li>
Brette, R. &amp; Gerstner, W. (2005). Adaptive exponential integrate-and-fire model as an effective description of neuronal activity.{" "}
<em>
Journal of Neurophysiology
</em>
, 94(5).
</li>
<li>
Naud, R., Marcille, N., Clopath, C. &amp; Gerstner, W. (2008). Firing patterns in the adaptive exponential integrate-and-fire model.{" "}
<em>
Biological Cybernetics
</em>
, 99(4–5).
</li>
<li>
Touboul, J. &amp; Brette, R. (2008). Dynamics and bifurcations of the adaptive exponential integrate-and-fire model.{" "}
<em>
Biological Cybernetics
</em>
, 99(4–5).
</li>
<li>
Badel, L. et al. (2008). Dynamic I-V curves are reliable predictors of naturalistic pyramidal-neuron voltage traces.{" "}
<em>
Journal of Neurophysiology
</em>
, 99(2).
</li>
<li>
Rotter, S. &amp; Diesmann, M. (1999). Exact digital simulation of time-invariant linear systems with applications to neuronal modeling.{" "}
<em>
Biological Cybernetics
</em>
, 81(5–6).
</li>
<li>
Destexhe, A., Rudolph, M. &amp; Paré, D. (2003). The high-conductance state of neocortical neurons in vivo.{" "}
<em>
Nature Reviews Neuroscience
</em>
, 4(9).
</li>
<li>
Bi, G. &amp; Poo, M. (1998). Synaptic modifications in cultured hippocampal neurons: dependence on spike timing, synaptic strength, and postsynaptic cell type.{" "}
<em>
Journal of Neuroscience
</em>
, 18(24).
</li>
<li>
Song, S., Miller, K. D. &amp; Abbott, L. F. (2000). Competitive Hebbian learning through spike-timing-dependent synaptic plasticity.{" "}
<em>
Nature Neuroscience
</em>
, 3(9).
</li>
<li>
van Rossum, M. C. W., Bi, G. Q. &amp; Turrigiano, G. G. (2000). Stable Hebbian learning from spike timing-dependent plasticity.{" "}
<em>
Journal of Neuroscience
</em>
, 20(23).
</li>
<li>
Gütig, R., Aharonov, R., Rotter, S. &amp; Sompolinsky, H. (2003). Learning input correlations through nonlinear temporally asymmetric Hebbian plasticity.{" "}
<em>
Journal of Neuroscience
</em>
, 23(9).
</li>
<li>
Kempter, R., Gerstner, W. &amp; van Hemmen, J. L. (1999). Hebbian learning and spiking neurons.{" "}
<em>
Physical Review E
</em>
, 59(4).
</li>
<li>
Sjöström, P. J., Turrigiano, G. G. &amp; Nelson, S. B. (2001). Rate, timing, and cooperativity jointly determine cortical synaptic plasticity.{" "}
<em>
Neuron
</em>
, 32(6).
</li>
<li>
Pfister, J.-P. &amp; Gerstner, W. (2006). Triplets of spikes in a model of spike timing-dependent plasticity.{" "}
<em>
Journal of Neuroscience
</em>
, 26(38).
</li>
<li>
Masquelier, T., Guyonneau, R. &amp; Thorpe, S. J. (2008). Spike timing dependent plasticity finds the start of repeating patterns in continuous spike trains.{" "}
<em>
PLoS ONE
</em>
, 3(1).
</li>
</ul>
</div>
      <NeuronDemos />
    </div>
  );
}
