import Link from 'next/link';
import DoomDemos from './DoomDemos';
import './doom.css';
import { vt323 } from './fonts';

export default function DoomContent() {
  return (
    <div className={`doom-page level-medium py-10 ${vt323.variable}`}>
<Link href="/projects" className="text-gray-600 hover:text-black">
⟵ Back to projects
</Link>
<h1 className="text-4xl font-bold mt-4 mb-6">
Neurons Playing Doom
</h1>
<section className="bg-gray-50 rounded-lg p-6 mb-10">
<h2 className="text-2xl font-bold mb-4">
Project Overview
</h2>
<div data-lv="medium graduate">
<p className="text-lg mb-4">
A dish of neurons has no idea what Doom is. It has no reward signal and no score. All it gets is electrical stimulation on some electrodes, and its own spikes are read out on others. It can still learn to play, because neurons work to make their input predictable.
</p>
<p className="text-lg mb-4">
I use that as a worked example of the free energy principle and Bayesian inference. Before it learns anything, the culture is a maximum-entropy model: every action is equally likely in every situation. A{" "}
<span className="text-green-600 font-medium">
predictable pattern
</span>
{" "}after a kill lowers the entropy of whatever the culture just did.{" "}
<span className="text-red-500 font-medium">
Unpredictable noise
</span>
{" "}after a hit pushes that behavior back toward maximum entropy. Over time the culture's distribution over actions fits the only behaviors that keep its world predictable.
</p>
</div>
<div data-lv="easy">
<p className="text-lg mb-4">
Real brain cells, grown in a dish, can learn to play video games. Nobody gives them points or treats. They only get tiny electrical zaps. The trick is that brain cells really don't like being surprised, and you can use that to teach them.
</p>
<p className="text-lg mb-4">
On this page a computer pretends to be a dish of brain cells and plays a simple version of Doom. When it kills a monster it hears a steady{" "}
<span className="text-green-600 font-medium">
drumbeat
</span>
{" "}of zaps. When a monster hurts it, it gets{" "}
<span className="text-red-500 font-medium">
random static
</span>
. Watch it go from pressing buttons at random to aiming like a player, and then see why that works.
</p>
</div>
<div className="flex flex-wrap gap-2">
<span className="text-sm text-gray-600 bg-gray-100 rounded-full px-3 py-1">
Free Energy Principle
</span>
{" "}
<span className="text-sm text-gray-600 bg-gray-100 rounded-full px-3 py-1">
Bayesian Inference
</span>
{" "}
<span className="text-sm text-gray-600 bg-gray-100 rounded-full px-3 py-1">
Maximum Entropy
</span>
{" "}
<span className="text-sm text-gray-600 bg-gray-100 rounded-full px-3 py-1">
Spiking Neural Networks
</span>
{" "}
<span className="text-sm text-gray-600 bg-gray-100 rounded-full px-3 py-1">
Computational Neuroscience
</span>
</div>
</section>
<div className="post">
<div data-lv="easy">
<h2 className="!mt-0">
Brain cells in a dish that play games
</h2>
<p>
Scientists can grow real brain cells (
<strong>
neurons
</strong>
) on a small chip covered in tiny metal contacts called{" "}
<strong>
electrodes
</strong>
. An electrode can do two things: give the cells a small electrical zap, or listen to the cells firing. Neurons talk to each other with quick electrical blips called{" "}
<strong>
spikes
</strong>
.
</p>
<p>
In 2022 a team in Australia connected a dish like this to the game Pong. Zaps on one side of the dish told the cells where the ball was, and spikes on the other side moved the paddle. When the paddle hit the ball, the cells got a neat, regular pattern of zaps. When it missed, they got a few seconds of random static. Within minutes, the cells were hitting the ball more often.
</p>
<p>
Why would that work? There's no reward. The idea, called the{" "}
<strong>
free energy principle
</strong>
, is that living things try to keep their world predictable. A regular drumbeat is easy to predict. Random static never is. The only way for the cells to avoid the static is to stop doing whatever caused it.
</p>
<h2>
The experiment
</h2>
<p>
Here a computer pretends to be the dish: 100 fake neurons wired up like the real thing. The game is a tiny Doom arena. You stand in the middle, monsters (imps) walk toward you, and there are only three buttons: turn left, turn right, fire.
</p>
<p>
The cells "see" the game through 7 electrodes, one for each direction the nearest imp could be in (far left to far right). The closer the imp, the faster the zaps. Whichever of the three "button" areas of the dish fires the most picks the move.
</p>
<div className="try">
<div className="tag">
Try this
</div>
<ol>
<li>
Press{" "}
<strong>
Run
</strong>
, then{" "}
<strong>
16×
</strong>
{" "}to speed up time.
</li>
<li>
Watch the dish (next to the game on a wide screen, below it on a narrow one). The lines are connections, and thicker means stronger. At first they are all the same, so the cells pick moves at random.
</li>
<li>
After a minute or two, look at the table further down: each row should light up one button. Imp on the left means turn left, imp in the center means fire.
</li>
<li>
Now that it has learned, press{" "}
<strong>
Pause
</strong>
, pick the{" "}
<strong>
Noise brush
</strong>
, and click the "center" row twice. You just made the cells forget how to shoot. Press{" "}
<strong>
Run
</strong>
{" "}and watch them relearn it.
</li>
<li>
Click{" "}
<strong>
New culture
</strong>
, pick{" "}
<strong>
No feedback
</strong>
, and run again. Without the drumbeat and static, it never learns.
</li>
</ol>
</div>
</div>
<div data-lv="medium graduate">
<h2 className="!mt-0">
Why would a dish play at all?
</h2>
<p>
In 2022, Kagan and colleagues grew cortical neurons on a high-density multi-electrode array and connected them to Pong. The ball's position was delivered as stimulation to a sensory area of the dish, and activity in two motor areas moved the paddle. There was no dopamine and no reward. The only feedback was the stimulation that followed each rally. A hit was followed by predictable stimulation. A miss was followed by a few seconds of random stimulation at random electrodes. Within minutes of play, cultures given this feedback hit the ball more often than cultures without it.
</p>
<p>
The account they give is the{" "}
<strong>
free energy principle
</strong>
. A self-organizing system that persists has to keep its sensory states within bounds, and it does that by minimizing surprise about its inputs. (Strictly, it minimizes{" "}
<em>
variational free energy
</em>
, a quantity that is always at least as large as surprise, so pushing it down pushes surprise down too. Section 2 makes this precise.) A culture has two ways to do that. It can update its internal model so the input it gets becomes less surprising. Or it can act so that it gets input it can already predict. Random stimulation cannot be predicted by any model, so the only way to avoid it is to stop doing whatever triggers it.
</p>
<p>
I wanted to see that mechanism working, so I built it. Below is a simulated culture of 100 spiking neurons on a virtual electrode array, connected to a small Doom arena. Run it first, then the rest of the post goes through the math one piece at a time.
</p>
<h2>
The experiment
</h2>
<p>
The arena is a stripped-down version of ViZDoom's{" "}
<em>
Defend the Center
</em>
. You stand in the middle, imps walk in from every side, and the only moves are turn left, turn right, and fire. The direction of the nearest imp is place-coded onto one of 7 stimulating electrodes, from far left (L3) to far right (R3), and its distance is rate-coded: closer means faster pulses. Each 50&nbsp;ms tick, the action is whichever of the 3 motor regions fires the most. A kill triggers 100&nbsp;ms of regular 100&nbsp;Hz pulses on every electrode. A hit triggers 400&nbsp;ms of noise, and a missed shot triggers 150&nbsp;ms of noise. The game pauses during feedback, as in the Pong setup.
</p>
<p>
Press{" "}
<strong>
Run
</strong>
{" "}and switch to 16× if you're impatient. For the first minute or so the culture flails. The green dots in the surprise chart start at 1 bit, because the culture has not learned that the pattern{" "}
<em>
is
</em>
{" "}a pattern yet. Once they drop, the policy table snaps into shape and the kill rate climbs. Try the other feedback modes on a new culture, and try lowering the noise entropy.
</p>
</div>
<div data-lv="graduate" className="grad-note">
<div className="tag">
Graduate notes
</div>
<p>
Two framing notes before the math. First, the free energy principle is a claim about any system with a Markov blanket that persists: such a system can be described as minimizing variational free energy \(F \ge -\ln p(o)\) with respect to its internal states (perception) and active states (action). Here the "blanket" is concrete. Sensory states are the 7 stimulating electrodes, active states are the 3 motor read-out regions, and internal states are membrane potentials and synaptic weights.
</p>
<p>
Second, the original paper's use of the word "sentience" was criticized in later commentary, and alternative explanations of its learning effect have been proposed. Nothing here depends on that framing. The question is narrower: does surprise-gated plasticity produce the behavior, and what does it look like as inference?
</p>
</div>
</div>
<div className="bg-white rounded-lg shadow-lg overflow-hidden p-6 md:p-8">
<div className="flex flex-wrap items-center gap-3 mb-4">
<button id="run" className="px-4 py-1.5 rounded text-white bg-green-500 hover:bg-green-600">
Run
</button>
{" "}
<button id="reset" className="px-4 py-1.5 rounded bg-gray-200 hover:bg-gray-300">
New culture
</button>
{" "}
<span className="text-sm text-gray-500 ml-2">
Speed
</span>
<div id="speed-buttons" className="flex gap-1.5">
</div>
</div>
<div className="flex flex-wrap items-center gap-3 mb-6">
<span className="text-sm text-gray-500">
Feedback
</span>
<div id="mode-buttons" className="flex flex-wrap gap-1.5">
</div>
</div>
<div className="grid lg:grid-cols-2 gap-6">
<div>
<div className="text-sm font-medium mb-2">
What the culture is playing
</div>
<div className="rounded-md overflow-hidden bg-black">
<canvas id="doom" className="pixel">
</canvas>
<div className="hud grid grid-cols-5 text-center font-doom leading-none py-1.5">
<div>
<div className="num text-3xl" id="hud-health">
100%
</div>
<div className="text-gray-300 text-base">
HEALTH
</div>
</div>
<div>
<div className="num text-3xl" id="hud-kills">
0
</div>
<div className="text-gray-300 text-base">
KILLS
</div>
</div>
<div>
<div className="num text-3xl" id="hud-acc">
–
</div>
<div className="text-gray-300 text-base">
ACCURACY
</div>
</div>
<div>
<div className="num text-3xl" id="hud-deaths">
0
</div>
<div className="text-gray-300 text-base">
DEATHS
</div>
</div>
<div>
<div className="num text-3xl" id="hud-action">
–
</div>
<div className="text-gray-300 text-base">
ACTION
</div>
</div>
</div>
</div>
<div className="text-sm text-gray-600 mt-2 flex justify-between gap-4">
<span id="stat-feedback">
No feedback yet
</span>
{" "}
<span className="whitespace-nowrap">
<span id="hud-time" className="tabular-nums">
0.0
</span>
{" "}min played
</span>
</div>
</div>
<div>
<div className="text-sm font-medium mb-2">
The culture on its electrode array
</div>
<div className="bg-gray-100 rounded-md p-2">
<canvas id="dish">
</canvas>
</div>
<div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600 mt-2">
<span>
<span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500 mr-1">
</span>
sensory spike
</span>
{" "}
<span>
<span className="inline-block w-2.5 h-2.5 rounded-full bg-orange-500 mr-1">
</span>
motor spike
</span>
{" "}
<span>
<span className="inline-block w-2.5 h-2.5 bg-blue-500 mr-1">
</span>
game stimulation
</span>
{" "}
<span>
<span className="inline-block w-2.5 h-2.5 bg-green-500 mr-1">
</span>
predictable stimulation
</span>
{" "}
<span>
<span className="inline-block w-2.5 h-2.5 bg-red-500 mr-1">
</span>
noise stimulation
</span>
{" "}
<span>
line width = mean synaptic weight
</span>
</div>
</div>
</div>
<div className="mt-6">
<div className="text-sm font-medium mb-2">
Spike raster (last 3 s of culture time, newest at right)
</div>
<div className="bg-gray-100 rounded-md p-2">
<canvas id="raster">
</canvas>
</div>
</div>
<div className="grid lg:grid-cols-5 gap-6 mt-8">
<div className="lg:col-span-3">
<div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
<div className="text-sm font-medium">
<span className="lv-easy">
What the culture does in each situation (from practice trials)
</span>
<span className="lv-hard">
The culture's policy p(action | state), from probe trials
</span>
</div>
<div id="brush-buttons" className="flex gap-1.5">
</div>
</div>
<table id="policy" className="text-sm border-separate border-spacing-1">
</table>
<p className="text-xs text-gray-500 mt-2">
The{" "}
<span className="text-orange-600 font-medium">
orange outline
</span>
{" "}marks where the imp is right now and the move the culture just made. Click a cell to stimulate that pairing by hand (pausing first makes it easier to see). The pattern brush strengthens that pairing. The noise brush floods the whole row with noise and pushes it back toward uniform. A strongly trained row resists the pattern brush, so to retrain one, noise-brush it first and then pattern-brush the move you want.{" "}
<span className="lv-easy">
The bars on the right show how undecided each row is. The dashed line is totally random.
</span>
<span className="lv-hard">
The dashed line is maximum entropy, log₂3 ≈ 1.58 bits.
</span>
</p>
</div>
<div className="lg:col-span-2 space-y-4">
<div>
<label className="text-sm font-medium flex justify-between">
<span>
Noise randomness
</span>
<span id="noise-density-val" className="text-gray-500 font-normal tabular-nums">
</span>
</label>
{" "}
<input id="noise-density" type="range" min="0.02" max="0.98" step="0.02" defaultValue="0.5" className="w-full" />
<div className="text-xs text-gray-500 mt-1">
Fraction of bins that pulse during noise. 50% is the most random. Going toward 0% or 100% makes the noise more predictable.
</div>
</div>
<div className="adv">
<label className="text-sm font-medium flex justify-between">
<span>
Culture temperature (spontaneous randomness)
</span>
<span id="temp-val" className="text-gray-500 font-normal tabular-nums">
</span>
</label>
{" "}
<input id="temp" type="range" min="0.2" max="1.5" step="0.05" defaultValue="0.6" className="w-full" />
</div>
<div>
<label className="text-sm font-medium flex justify-between">
<span>
Imps at once
</span>
<span id="enemies-val" className="text-gray-500 font-normal">
</span>
</label>
{" "}
<input id="enemies" type="range" min="1" max="3" step="1" defaultValue="2" className="w-full" />
</div>
<label className="adv flex items-center gap-2 text-sm">
<input id="miss-noise" type="checkbox" defaultChecked className="accent-blue-500" />
{" "}Missed shots also trigger a short burst of noise
</label>
</div>
</div>
<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
<div>
<div className="text-sm font-medium mb-1">
Performance{" "}
<span className="text-gray-500 font-normal">
(per minute of play)
</span>
</div>
<div className="text-xs text-gray-600 mb-1">
<span className="text-green-600">
■
</span>
{" "}kills &nbsp;{" "}
<span className="text-red-500">
■
</span>
{" "}hits taken
</div>
<canvas id="chart-perf">
</canvas>
</div>
<div>
<div className="text-sm font-medium mb-1">
<span className="lv-easy">
How undecided the culture is
</span>
<span className="lv-hard">
Mean policy entropy H(a | s)
</span>
</div>
<div className="text-xs text-gray-600 mb-1">
bits, averaged over the 7 states
</div>
<canvas id="chart-entropy">
</canvas>
</div>
<div>
<div className="text-sm font-medium mb-1">
Surprise of each feedback
</div>
<div className="text-xs text-gray-600 mb-1">
<span className="text-green-600">
●
</span>
{" "}pattern &nbsp;{" "}
<span className="text-red-500">
●
</span>
{" "}noise &nbsp; bits per electrode-bin
</div>
<canvas id="chart-surprise">
</canvas>
</div>
</div>
<p className="adv text-sm text-gray-500 mt-8">
Note: 7 sensory regions × 10 neurons, 3 motor regions × 10 neurons, stochastic leaky integrate-and-fire dynamics at 5&nbsp;ms resolution, STDP eligibility traces, and per-neuron synaptic budgets. The culture gets no reward value. Its plasticity is gated only by how surprising the feedback stimulation is under its own learned model of that stimulation.
</p>
</div>
<div className="post">
<div data-lv="easy">
<h2>
1. How undecided is the culture?
</h2>
<p>
Imagine guessing what the cells will do next. If they always fire when the imp is in the center, guessing is easy. If they pick left, right or fire completely at random, like rock-paper-scissors, guessing is as hard as it gets.
</p>
<p>
Scientists measure "how hard to guess" with a number called{" "}
<strong>
entropy
</strong>
, counted in{" "}
<strong>
bits
</strong>
. One bit is the uncertainty in a fair coin flip. A totally random choice between 3 options is about 1.58 bits. A choice that's always the same is 0 bits.
</p>
<p>
Before learning, every connection in the dish is the same strength, so nothing tips the balance. The cells are as undecided as possible. That starting point is called{" "}
<strong>
maximum entropy
</strong>
: when you know nothing, assume nothing.
</p>
</div>
<div data-lv="medium graduate">
<h2>
1. Before learning: the maximum-entropy prior
</h2>
<p>
{"For each state \\(s\\), meaning each of the 7 sectors the nearest imp can be in, the culture has a policy \\(p(a \\mid s)\\) over the three actions \\(a \\in \\{\\text{Left}, \\text{Right}, \\text{Fire}\\}\\). How committed that policy is gets measured by its entropy:"}
</p>
{"$$H(a \\mid s) = -\\sum_{a} p(a \\mid s)\\,\\log_2 p(a \\mid s).$$"}
<p>
Jaynes' maximum entropy principle says that if you know nothing beyond the constraints, you should pick the distribution with the largest entropy that satisfies them. With no constraints except that probabilities sum to one, that is the uniform distribution, and \(H = \log_2 3 \approx 1.585\) bits.
</p>
<p>
{"The simulation does not impose this. It falls out of symmetry. Every sensory neuron starts with the same weight \\(w_0\\) onto every motor neuron, and its outgoing weights share a fixed synaptic budget, \\(\\sum_j w_{ij} = N_M w_0\\). With nothing to break the tie, the three motor regions receive the same drive, and which one fires most on a given tick is decided by intrinsic noise. An unconnected culture really is a max-entropy model: its spontaneous activity samples every action equally."}
</p>
<p>
The quantity \(-\log_2 p(a \mid s)\) is the{" "}
<em>
surprise
</em>
{" "}of an action. Entropy is just the expected surprise. Drag the point below to feel how the two trade off.
</p>
</div>
<div data-lv="graduate" className="grad-note">
<div className="tag">
Graduate notes
</div>
<p>
{"Maximum entropy does more than pick the uniform prior. Maximize \\(H(p)\\) subject to a constraint on the expected drive, \\(\\sum_a p(a)\\,\\bar W_{sa} = c\\), and the Lagrangian gives a Gibbs distribution:"}
</p>
{"$$p(a \\mid s) = \\frac{e^{\\beta \\bar W_{sa}}}{\\sum_{a'} e^{\\beta \\bar W_{sa'}}},$$"}
<p>
where \(\beta\) is the Lagrange multiplier, or inverse temperature. The culture's winner-take-all readout is only approximately softmax, but the "culture temperature" slider above plays exactly this role. It is the same \(\beta\) as in the Ising model at criticality. As \(\beta \to 0\), every state returns to \(\log_2 3\) bits whatever the weights. As \(\beta \to \infty\), the policy becomes the argmax. Learning changes the constraint (the weights). Temperature sets how sharply the policy follows it.
</p>
<p>
Note that the policy shown in the table is estimated from 24 probe trials per state, with plasticity off and the imp at mid-range. Its entropy is therefore a plug-in estimate, biased downward by roughly \((|A|-1)/(2N\ln 2) \approx 0.06\) bits (the Miller–Madow correction).
</p>
</div>
</div>
<figure className="fig bg-white rounded-lg shadow p-6">
<div id="w-entropy">
</div>
<figcaption>
<div data-lv="easy">
<div className="try">
<div className="tag">
Try this
</div>
<ol>
<li>
Drag the dot to the very center. That's the brand-new culture: every move equally likely, 1.58 bits.
</li>
<li>
Drag it into the Fire corner. Now Fire is almost certain and entropy drops toward 0.
</li>
<li>
Drag it halfway between Left and Fire. "Torn between two" is about 1 bit, the same as a coin flip.
</li>
</ol>
</div>
</div>
<div data-lv="medium graduate">
<strong>
Figure 1.
</strong>
{" "}The policy simplex for one state. The center is the unconnected culture, with every action equally surprising at 1.585 bits. A corner is a culture that always does one thing: that action carries 0 bits of surprise and the other two are infinitely surprising.
</div>
</figcaption>
</figure>
<div className="post">
<div data-lv="easy">
<h2>
2. Surprise: what you can learn and what you can't
</h2>
<p>
<strong>
Surprise
</strong>
{" "}is how shocked you are by what happens. If your friend says "hi" every morning, it stops surprising you after a few days. That surprise went away because you learned the pattern.
</p>
<p>
Static is different. It's random every time, so no amount of learning makes it predictable. That leftover surprise never goes away. Scientists call it the static's entropy, the same "how hard to guess" number from before.
</p>
<p>
So the cells face two kinds of surprise. The kind they can get rid of by learning, which is the drumbeat. And the kind they can only get rid of by changing what they do so the static stops coming. That second route is why a dish ends up playing the game.
</p>
</div>
<div data-lv="medium graduate">
<h2>
2. Surprise: what the culture can and cannot learn away
</h2>
<p>
{"The culture also has a model of its input. In plain terms, it keeps a few \"templates\" of what feedback usually looks like. Each template is a grid saying how likely each electrode is to pulse in each 5 ms bin. When a burst \\(x\\) arrives, the culture checks how well its templates explain it, then nudges the best-fitting template toward what it just saw. Written out (a mixture of Bernoulli templates, where each template \\(k\\) has weight \\(\\pi_k\\) and per-bin pulse probabilities \\(\\theta_{kb}\\)):"}
</p>
{"$$q(x) = \\sum_{k} \\pi_k \\prod_{b} \\theta_{kb}^{\\,x_b}\\,(1-\\theta_{kb})^{1-x_b}.$$"}
<p>
{"The surprise of a burst is \\(-\\log_2 q(x)\\). I report it per bin as \\(u = -\\tfrac{1}{B}\\log_2 q(x)\\), so \\(u = 1\\) bit means the culture's prediction of each bin is no better than a coin flip, and \\(u = 0\\) means it saw it coming."}
</p>
<p>
The important identity is how expected surprise splits. In words:{" "}
<em>
average surprise = how random the world really is + how wrong your model is
</em>
. The second part is the{" "}
<strong>
KL divergence
</strong>
, a measure of the gap between the true distribution \(p\) and the model's prediction \(q\). It is zero only when the model is exactly right. Formally:
</p>
{"$$\\underbrace{\\mathbb{E}_{x\\sim p}\\!\\left[-\\log_2 q(x)\\right]}_{\\text{expected surprise}} \\;=\\; \\underbrace{H(p)}_{\\text{entropy of the world}} \\;+\\; \\underbrace{D_{\\mathrm{KL}}(p \\,\\|\\, q)}_{\\text{model error}}.$$"}
<p>
Learning, meaning perception, can drive the KL term to zero and nothing more. For the pattern, \(H(p) = 0\): every bin is determined, so once the template is learned the surprise falls to about 0.03 bits (it is not exactly zero because templates are clipped to [0.02, 0.98]). For noise that pulses each bin with probability \(\rho\), the entropy is
</p>
$$H(\rho) = -\rho\log_2\rho - (1-\rho)\log_2(1-\rho),$$
<p>
which is 1 bit per bin at \(\rho = 0.5\). No model of any size can predict it better. The free energy principle wraps both routes into one quantity. In words:{" "}
<em>
free energy = surprise + how wrong the culture's explanation of the burst is
</em>
, so it can never be smaller than the surprise itself. With hidden causes \(z\), here which template generated the burst,
</p>
{"$$F = \\mathbb{E}_{q(z)}\\!\\left[\\log q(z) - \\log p(x, z)\\right] = -\\log p(x) + D_{\\mathrm{KL}}\\!\\left(q(z)\\,\\|\\,p(z \\mid x)\\right) \\;\\ge\\; -\\log p(x).$$"}
<p>
Updating the model tightens the bound. The only way left to lower the surprise itself is to change which \(x\) arrives, which means acting. In this setup, the irreducible entropy of the noise is the whole lever.
</p>
</div>
<div data-lv="graduate" className="grad-note">
<div className="tag">
Graduate notes
</div>
<p>
{"The culture's model is a mixture of \\(K = 3\\) Bernoulli templates with Laplace-smoothed weights \\(\\pi_k = (n_k + 1)/(N + K)\\), learned by online hard EM. After each burst, the template with the highest posterior responsibility \\(z^* = \\arg\\max_k \\pi_k\\,p(x \\mid k)\\) moves toward \\(x\\) with step 0.25. With a point-mass \\(q(z) = \\delta_{z^*}\\) the bound reads \\(F = -\\ln p(x, z^*) \\ge -\\ln p(x)\\), because the entropy of \\(q\\) is zero. The simulation reports the exact mixture surprise \\(-\\log_2 \\sum_k \\pi_k p(x \\mid k)\\) rather than \\(F\\). The two differ by \\(D_{\\mathrm{KL}}(\\delta_{z^*} \\,\\|\\, p(z \\mid x))\\), which is close to zero once pattern and noise land in separate templates."}
</p>
<p>
Two consequences show up in the live chart. Every template starts at \(\theta = 0.5\), so the first few patterns cost a full 1 bit per bin and are treated as noise. Early learning is slowed until the culture discovers the pattern is a pattern. Templates are clipped to \([0.02, 0.98]\), which sets a floor of \(-\log_2 0.98 \approx 0.029\) bits per bin. That floor is the 0.03 you see.
</p>
</div>
</div>
<figure className="fig bg-white rounded-lg shadow p-6">
<div id="w-surprise">
</div>
<figcaption>
<div data-lv="easy">
<div className="try">
<div className="tag">
Try this
</div>
<ol>
<li>
Press{" "}
<strong>
Play
</strong>
. Green is the drumbeat, red is static.
</li>
<li>
Watch the "prediction" grids. The green one quickly becomes a perfect copy. The red one turns gray because there's nothing to copy.
</li>
<li>
Watch the dots. Green surprise falls to almost 0. Red stays near 1 forever, and that's the static you can't learn away.
</li>
<li>
Drag{" "}
<strong>
Noise density
</strong>
{" "}down to the left. The static gets less random, and its surprise floor (dashed line) drops.
</li>
</ol>
</div>
</div>
<div data-lv="medium graduate">
<strong>
Figure 2.
</strong>
{" "}A predictor learns two feedback streams. The pattern's surprise falls toward zero because all of it was model error (KL). The noise's surprise falls only to its entropy floor \(H(\rho)\), and in fact sits a little above it: with a fixed learning rate the predictor keeps chasing the last few random samples, which is extra KL. Lower the learning rate to get closer to the floor. Drag the density down and noise becomes partly predictable. Section 4 shows why that matters.
</div>
</figcaption>
</figure>
<div className="post">
<div data-lv="easy">
<h2>
3. How one connection learns
</h2>
<p>
Before the whole dish, zoom in on a single connection. Neuron A sends a signal to an output neuron. If A fires{" "}
<em>
just before
</em>
{" "}the output fires, A probably helped make it fire. That's worth remembering, so the connection gets a small green{" "}
<strong>
tag
</strong>
. If the output fires first and A fires after, A couldn't have caused it, so the connection gets a red tag instead. This timing rule is called{" "}
<strong>
STDP
</strong>
{" "}(spike-timing-dependent plasticity). In short: "fire together, wire together", but order matters.
</p>
<p>
A tag is not learning yet. It's a sticky note that says "I was involved just now", and it fades within about a second. Learning only happens when feedback arrives while the tag is still there. The drumbeat turns a green tag into a stronger connection. Static shuffles tagged connections back toward average.
</p>
<p>
The important part is that each connection only uses what it can "see" at its own location: when its own input fired, when the output fired, and the feedback that reaches every connection. Nobody tells it whether it was right.
</p>
</div>
<div data-lv="medium graduate">
<h2>
3. One synapse at a time: STDP
</h2>
<p>
Everything the culture learns happens at individual synapses, and each one only uses information available at its own location. The first ingredient is{" "}
<strong>
spike-timing-dependent plasticity
</strong>
{" "}(STDP), first measured in cultured hippocampal neurons by Bi and Poo. In plain English:{" "}
<em>
if the input fires just before the output, tag the synapse positively. If it fires just after, tag it negatively. The closer in time, the bigger the tag.
</em>
{" With \\(\\Delta t = t_{\\text{post}} - t_{\\text{pre}}\\):"}
</p>
{"$$\\Delta e = \\begin{cases} +A_+\\, e^{-\\Delta t/\\tau} & \\Delta t > 0 \\quad (\\text{pre before post}) \\\\[2pt] -A_-\\, e^{\\,\\Delta t/\\tau} & \\Delta t < 0 \\quad (\\text{post before pre}) \\end{cases} \\qquad \\tau = 20\\text{ ms},\\; A_+ = 1,\\; A_- = 0.5.$$"}
<p>
A synapse doesn't need to store spike times to do this. It keeps two decaying traces: \(x\), which jumps by 1 at each presynaptic spike, and \(y\), which jumps by 1 at each postsynaptic spike. Both decay with \(\tau = 20\) ms. When the output fires, the tag gains \(x\). When the input fires, the tag loses \(A_- y\). Summed over spikes, that is exactly the window above.
</p>
<p>
The result \(e\) is an{" "}
<strong>
eligibility trace
</strong>
, not a weight change. It decays over about half a second (by a factor of 0.9 per 50 ms tick) and only becomes a weight change if a third signal arrives in time: the feedback surprise \(u\), broadcast to every synapse. In the brain, neuromodulators such as dopamine are thought to play this role for reward-driven learning. Here the third factor carries predictability rather than reward. The figure below is one output neuron with two inputs. A fires at a timing you choose. B fires at random. Watch which synapse gets tagged, then deliver feedback.
</p>
<p>
Two things to notice. First, a weight never moves on its own: STDP only writes tags, and a weight changes when feedback arrives. Turn on auto-feedback to watch the weights evolve. Second, the demo starts with weakening a bit stronger than strengthening (\(A_- = 1.5\)), the textbook{" "}
<em>
competitive
</em>
{" "}regime (Song, Miller &amp; Abbott, 2000). An uncorrelated input like B lands on both sides of the window at random, so its tag averages out negative and it fades away, while A, which reliably fires first, keeps growing. Inputs that predict the output win. Inputs that don't, lose.
</p>
<p>
The culture itself can't use that setting. Click{" "}
<strong>
Culture (0.5)
</strong>
: with strengthening dominant, B's chance coincidences net out positive and it grows alongside A. I tested the competitive window in the full game (8 seeds, 20 minutes, pattern + noise). With \(A_- = 1.2\) the culture reached 29 kills per minute, and with \(A_- = 1.5\) it stayed at chance (5), against 109 with \(A_- = 0.5\). The reason is rate coding. A sensory electrode drives its neurons at 60–160 Hz for the whole tick, so every motor spike is followed by more input spikes, and "output first" pairings are about as common as "input first". A weakening-dominated window then cancels the useful tag along with the noise. The culture filters out uncorrelated input in two other ways instead: it ignores tags below 20% of the strongest one, and each sensory neuron's outgoing weights share a fixed budget, so strengthening one connection takes from the others.
</p>
</div>
<div data-lv="graduate" className="grad-note">
<div className="tag">
Graduate notes
</div>
<p>
{"The trace implementation is all-to-all pairwise STDP: \\(e = \\sum_{\\text{post}} \\sum_{\\text{pre}} W(t_{\\text{post}} - t_{\\text{pre}})\\) with \\(W\\) the window above. Its integral is \\(\\int W = \\tau (A_+ - A_-) = 10\\) ms, which is positive. So even "}
<em>
uncorrelated
</em>
{" Poisson firing builds a net positive tag at rate \\(\\nu_{\\text{pre}}\\nu_{\\text{post}}\\,\\tau(A_+ - A_-)\\). In the demo, B fires at 20 Hz against an output near 6.7 Hz, which gives \\(20 \\times 6.7 \\times 0.01 \\approx 1.3\\) tag units per second, or a steady \\(\\approx 0.64\\) after the 475 ms decay. Measured over 30 runs it is 0.66, against about 2.0 for A at \\(\\Delta t = +10\\) ms. With \\(A_- = 1.5\\) the integral is \\(-10\\) ms and B's tag measures \\(-0.54\\). Over 20 simulated seconds of auto-feedback (10 runs each), B ends at 2.72 with \\(A_- = 0.5\\), 1.25 with \\(A_- = 1\\), and 0.21 with \\(A_- = 1.5\\), while A saturates at the cap of 3 in every case."}
</p>
<p>
{"Why competitive STDP fails for the culture: for an input firing at rate \\(\\nu_{\\text{pre}}\\) whose spikes raise the output's rate by a causal kernel \\(c(\\Delta t)\\) over a baseline \\(\\nu_{\\text{post}}\\), the expected tag rate is \\(\\nu_{\\text{pre}}\\nu_{\\text{post}} \\int W + \\nu_{\\text{pre}} \\int W(\\Delta t)\\,c(\\Delta t)\\,d\\Delta t\\). The first term is the chance term. The second is the causal one. With sustained high-rate input, the chance term dominates both, so its sign (that of \\(\\int W\\)) decides everything: positive, and every active pathway is strengthened; negative, and the useful pathway is erased too. In the demo the output fires "}
<em>
only
</em>
{" "}when driven by A, so the causal term wins regardless. The culture therefore keeps \(\int W &gt; 0\) and removes the chance term downstream, with the eligibility threshold and the synaptic budget.
</p>
<p>
Gating STDP traces by a delayed global signal is the standard answer to the distal-reward problem (Izhikevich, 2007). The family is reviewed as neuromodulated STDP and three-factor learning rules (Frémaux &amp; Gerstner, 2016). The difference here is only the third factor: \(1-u\) and \(u\), derived from the predictability of the feedback, instead of a reward prediction error.
</p>
</div>
</div>
<figure className="fig bg-white rounded-lg shadow p-6">
<div id="w-stdp">
</div>
<figcaption>
<div data-lv="easy">
<div className="try">
<div className="tag">
Try this
</div>
<ol>
<li>
Press{" "}
<strong>
Play
</strong>
{" "}with A set to fire 10 ms before the output. Every dashed line is an output spike, and A's blue spike lands just before it. A's connection glows green. B fires at random and barely glows.
</li>
<li>
Press{" "}
<strong>
Pattern → consolidate
</strong>
. A's line gets thicker. B changes much less, only as much as its random spikes happened to line up. The connection that took part learned the most, and nobody told it which one that was.
</li>
<li>
Slide the timing so the output fires{" "}
<em>
before
</em>
{" "}A (negative), and press Play again. A's tag turns red, and Pattern now makes A{" "}
<em>
weaker
</em>
.
</li>
<li>
Pause and wait a second. The tags fade on their own. Feedback that comes too late has nothing to act on.
</li>
<li>
Tag A again, then press{" "}
<strong>
Noise → scramble
</strong>
. A's strength gets pulled toward B's, plus a random nudge.
</li>
<li>
Press{" "}
<strong>
Reset
</strong>
, set the timing back to 10 ms, tick{" "}
<strong>
Drumbeat after every pairing
</strong>
, pick{" "}
<strong>
5×
</strong>
{" "}and press Play. Watch the strength chart: A climbs, and random B sinks toward zero. B's spikes don't line up with the output, so its "output first" moments outweigh its lucky "input first" ones.
</li>
<li>
Press Reset, click{" "}
<strong>
Dish's setting
</strong>
{" "}and Play again. Now B climbs too! The simulated dish uses this setting because its inputs fire nonstop, which would wipe out the useful connections as well. It gets rid of random connections in other ways, explained in the Medium level.
</li>
</ol>
</div>
</div>
<div data-lv="medium graduate">
<strong>
Figure 3.
</strong>
{" "}STDP and a three-factor update on one output neuron. Left: the circuit (line width is the weight, the glow is the eligibility tag) and 400 ms of spikes with their decaying traces. Right: the STDP window, with a dot for every pairing that actually happened, blue for A and violet for B. The rule uses only local quantities: each synapse's own presynaptic trace, the postsynaptic trace, and the broadcast feedback. Pattern changes each weight by \(\eta\,e\), using only its own tag. Same constants as the culture (\(\tau = 20\) ms, tag decay 0.9 per 50 ms), except that \(A_-\) starts at the textbook competitive value 1.5. The culture uses 0.5. Try auto-feedback at 5× with each and compare where B's weight ends up: about 0.2 versus 2.7 after 20 simulated seconds.
</div>
</figcaption>
</figure>
<div className="post">
<div data-lv="easy">
<h2>
4. The drumbeat says "more of that", the static says "forget that"
</h2>
<p>
Every connection between two neurons has a strength, like the volume knob on a speaker. Strong connections make the next cell more likely to fire. When the cells pick a move, the connections that carried that decision are briefly "tagged".
</p>
<ul>
<li>
<strong>
Drumbeat after a move:
</strong>
{" "}the tagged connections get stronger. Next time, the cells are more likely to do the same thing. They get less undecided.
</li>
<li>
<strong>
Static after a move:
</strong>
{" "}the tagged connections get shuffled back toward average. The cells don't learn the{" "}
<em>
right
</em>
{" "}move. They just forget the wrong one and try again at random. They get more undecided.
</li>
</ul>
<p>
Repeat this thousands of times and every situation ends up with the move that brings the drumbeat. Below is one situation on its own: the imp is dead ahead, so only Fire works.
</p>
</div>
<div data-lv="medium graduate">
<h2>
4. How pattern and noise move \(H(a \mid s)\)
</h2>
<p>
{"Now connect surprise to behavior. While the game runs, every synapse keeps an STDP eligibility trace \\(e_{ij}\\): a presynaptic spike just before a postsynaptic spike adds to it, and the reverse subtracts. The trace decays by a factor of 0.9 per tick, so it remembers roughly the last half second of what the culture did. In other words, it tags the connections that just carried a decision. When a feedback burst ends, the culture scores its surprise \\(u\\) and applies one rule. In plain English: "}
<em>
tagged connections get stronger if the feedback was predictable, and get shuffled back toward average if it was random
</em>
. In symbols:
</p>
{"$$\\Delta w_{ij} = \\underbrace{\\eta\\,(1-u)\\,\\hat e_{ij}}_{\\text{consolidate}} \\;+\\; \\underbrace{u\\,d\\,|\\hat e_{ij}|\\left(\\kappa\\,(\\bar w_i - w_{ij}) + \\sigma w_0\\,\\xi_{ij}\\right)}_{\\text{scramble}}, \\qquad \\xi_{ij}\\sim\\mathcal N(0,1)$$"}
<p>
{"after which each sensory neuron's outgoing weights are rescaled back to their budget. Here \\(\\hat e\\) is the trace normalized to its largest value with weak entries zeroed, \\(\\bar w_i\\) is the mean of neuron \\(i\\)'s outgoing weights, and \\(d\\) is the noise duration relative to a hit burst. \\(\\xi_{ij}\\) is a fresh random number from a standard bell curve, which is the \"shuffle\". \\(\\eta\\), \\(\\kappa\\), \\(\\sigma\\) set how big each effect is. There is no reward variable. The same stimulation-driven gate \\(u\\) decides which way plasticity goes."}
</p>
<p>
<strong>
Predictable input (\(u \approx 0\)) sharpens.
</strong>
{" The synapses that just carried the decision get stronger. The winner-take-all readout acts roughly like a softmax over the region-to-region weights, \\(p(a \\mid s) \\propto e^{\\beta \\bar W_{sa}}\\), so adding \\(\\delta\\) to the taken action multiplies its probability by \\(e^{\\beta\\delta}\\) before renormalizing. Repeat that and the policy walks into the corner of the action that keeps producing the pattern, and \\(H(a \\mid s)\\) falls."}
</p>
<p>
<strong>
Unpredictable input (\(u \approx 1\)) flattens.
</strong>
{" "}The pull toward \(\bar w_i\) moves the recently used weights back toward uniform. In policy terms that is close to mixing with the uniform distribution \(U\), \(p' \approx (1-\kappa')\,p + \kappa' U\). Intuitively, blending anything with "completely random" can only make it more random. The math name for that property is{" "}
<em>
concavity
</em>
{" "}of entropy:
</p>
$$H\big((1-\kappa')\,p + \kappa' U\big) \;\ge\; (1-\kappa')\,H(p) + \kappa' \log_2 3 \;\ge\; H(p).$$
<p>
Noise can only push a state toward maximum entropy (plus whatever the jitter adds). It does not say which action would have been right. It erases the commitment and lets spontaneous activity sample again.
</p>
<p>
Put the two in a loop and each state ends up sharpened toward the actions that lead to predictable input, while the actions that lead to noise keep getting dissolved and resampled. Below is a single state where the imp is dead ahead, so only Fire produces the pattern. It is the same rule on just three weights.
</p>
</div>
<div data-lv="graduate" className="grad-note">
<div className="tag">
Graduate notes
</div>
<p>
<strong>
When does consolidation lower entropy?
</strong>
{" "}With softmax logits, raising the taken action's logit by \(\delta\) gives
</p>
{"$$\\frac{\\partial H}{\\partial \\delta} = -\\beta\\, p_a \\left(\\ln p_a + H\\right) \\qquad (H \\text{ in nats}),$$"}
<p>
so entropy falls exactly when \(-\ln p_a &lt; H\), that is, when the reinforced action is{" "}
<em>
less surprising than average
</em>
. Reinforcing a rare action first raises entropy (the point moves toward the center of the simplex) before lowering it. Pattern feedback is not monotone in \(H\). Noise is: the concavity bound above holds for any mixing toward \(U\).
</p>
<p>
<strong>
It is a policy-gradient rule with a twist.
</strong>
{" "}In a winner-take-all network, the STDP trace on the winning pathway approximates \(\nabla_W \ln \pi(a \mid s)\). The consolidation term is then REINFORCE, \(\Delta W \propto R\,\nabla \ln \pi\), with \(R = 1 - u \ge 0\) and{" "}
<em>
no baseline
</em>
. That explains the pattern-only failure: with non-negative returns and no baseline, every action that is sampled gets pushed up, and the variance that produces drives rich-get-richer lock-in. The noise term is not a negative reward. It is a state-local contraction toward the uniform policy, which is the direction of the gradient of the entropy bonus used in maximum-entropy RL. The whole rule reads as REINFORCE with \(R = 1-u\), plus entropy regularization whose strength is gated by \(u\). Note that eligibility traces with per-tick decay \(\lambda = 0.9\) play the role of TD(\(\lambda\)) credit assignment for the turns that precede a kill.
</p>
<p>
<strong>
A crude threshold.
</strong>
{" "}Suppose the culture has locked onto a wrong action \(a\) with weight advantage \(\Delta = w_a - \bar w\). Each noise burst after \(a\) adds \(\eta(1-u)\) and removes \(u\,\kappa\,d\,\Delta\). The lock-in is stable while
</p>
{"$$\\eta(1-u) > u\\,\\kappa\\,d\\,\\Delta \\quad\\Longleftrightarrow\\quad u < u^* = \\frac{\\eta}{\\eta + \\kappa\\,d\\,\\Delta}.$$"}
<p>
In the toy (\(\eta = \kappa = 0.3\), \(d = 1\), saturated \(\Delta = 2\)) this gives \(u^* \approx 0.33\). The empirical transition is 0.4–0.6, because the wrong action rarely saturates before Fire wins the race. In the game, \(d &lt; 1\) for misses and the trace spans many ticks, which pushes \(u^*\) up toward the observed ~0.8.
</p>
</div>
</div>
<figure className="fig bg-white rounded-lg shadow p-6">
<div id="w-policy">
</div>
<figcaption>
<div data-lv="easy">
<div className="try">
<div className="tag">
Try this
</div>
<ol>
<li>
Click{" "}
<strong>
Pattern after → Fire
</strong>
{" "}a few times. The dot moves to the Fire corner.
</li>
<li>
Click{" "}
<strong>
Reset
</strong>
, then{" "}
<strong>
Play
</strong>
. The cells try moves at random. Fire gets the drumbeat, anything else gets static. Watch it find Fire.
</li>
<li>
Click{" "}
<strong>
Reset
</strong>
, slide{" "}
<strong>
Surprise of the noise
</strong>
{" "}down to about 0.2, and press{" "}
<strong>
Play
</strong>
{" "}again. Often it gets stuck on the wrong move, because predictable "static" works like a weak drumbeat.
</li>
</ol>
</div>
</div>
<div data-lv="medium graduate">
<strong>
Figure 4.
</strong>
{" "}One state's policy under the plasticity rule (\(\eta = \kappa = \sigma = 0.3,\ \beta = 4\)). Press Play with \(u = 1\) and the policy finds Fire within a few dozen trials. Now reset and set \(u\) to about 0.2. The wrong actions still get consolidated by the \((1-u)\) term, and the policy often locks into Left or Right. The verdict line under the bars tells you which happened. Predictable punishment is still predictable. (Noise includes a random shuffle, so a single noise click can occasionally sharpen the policy. Averaged over clicks, it flattens.)
</div>
</figcaption>
</figure>
<div className="post">
<div data-lv="easy">
<p>
Here's the surprising part. If the "static" isn't really random, for example a buzz that's mostly quiet with an occasional blip, the cells can partly predict it. And something you can predict counts as a little bit of drumbeat. So a predictable punishment actually{" "}
<em>
strengthens
</em>
{" "}the mistake a bit. We tested this in the full game below. Make the static less random, and learning doesn't just slow down. It flips. The cells confidently learn the wrong moves.
</p>
</div>
<div data-lv="medium graduate">
<p>
That last point is the clearest prediction the model makes, so I tested it in the full game. Holding everything else fixed and lowering only the density of the noise bursts, learning stops below roughly 0.8 bits per bin of noise entropy. The threshold in the full game is higher than in the one-state toy because a hit's eligibility trace spans many ticks of mistakes, and partial consolidation of all of them adds up.
</p>
</div>
</div>
<figure className="fig bg-white rounded-lg shadow p-6">
<div id="w-density">
</div>
<figcaption>
<div data-lv="easy">
<p>
Each dot is 8 cultures playing for 20 minutes. Left side: static that's fairly predictable, and the cells fail. Right side: truly random static, and they learn nearly perfectly. The switch happens suddenly, around 0.8 on the bottom axis. The indigo dots are static with{" "}
<em>
more
</em>
{" "}zaps than normal, but just as predictable, and they fail too. It's not about how much static there is. It's about how random it is.
</p>
</div>
<div data-lv="medium graduate">
<strong>
Figure 5.
</strong>
{" "}Pattern + noise feedback, 8 seeds × 20 minutes of play each, varying only the noise density \(\rho\), the fraction of bins that pulse. Every burst lasts the same time and every pulse has the same strength. Is this just "weaker noise teaches less"? No: the indigo points pulse{" "}
<em>
more
</em>
{" "}than the default (65–90% of bins). 90% density delivers nine times the pulses of 10% density, but both have the same 0.47 bits of entropy and both fail the same way. What matters is how unpredictable the noise is, not how much of it there is. Below about 0.8 bits per bin, the culture does not just fail to learn. It confidently learns the wrong thing: the policy entropy is low but the kill rate is at or below chance.
</div>
</figcaption>
</figure>
<div className="post">
<div data-lv="easy">
<h2>
5. Keeping score with tally marks
</h2>
<p>
Here's another way to picture what the cells are doing. Imagine each situation has a scoreboard with three columns: Left, Right, Fire. Everyone starts with one tally in each column, so no move is favored.
</p>
<ul>
<li>
<strong>
Drumbeat after a move:
</strong>
{" "}add a tally to that move's column. Your best guess shifts toward it.
</li>
<li>
<strong>
Static:
</strong>
{" "}erase a fraction of the tallies you've collected, back toward the starting one-each. Your guess moves back to undecided, and because you now have fewer tallies, the next new tally changes your mind more.
</li>
</ul>
<p>
That second point is the clever part. Static doesn't just punish. It makes the cells more{" "}
<em>
open-minded
</em>
{" "}in that situation, so they're ready to learn something new. Statisticians call this way of updating beliefs with evidence{" "}
<strong>
Bayesian inference
</strong>
.
</p>
</div>
<div data-lv="medium graduate">
<h2>
5. The Bayesian view
</h2>
<p>
There is a cleaner way to say all of this: keep a tally for each action. Formally, treat each state's policy as an unknown probability distribution over the three actions (a{" "}
<em>
categorical
</em>
{" "}distribution) and describe the culture's belief about it with a{" "}
<em>
Dirichlet
</em>
{" "}distribution. That is the standard way to hold a belief about probabilities, and its parameters \(\alpha\) behave exactly like tally counts. The culture's best guess, its{" "}
<em>
predictive
</em>
{" "}policy, is each count divided by the total:
</p>
{"$$p(a \\mid s) \\sim \\mathrm{Dir}(\\alpha_s), \\qquad \\hat p(a \\mid s) = \\frac{\\alpha_{s,a}}{\\sum_{a'} \\alpha_{s,a'}}.$$"}
<p>
{"The prior \\(\\alpha_0 = (1,1,1)\\) is flat over the whole simplex, and its predictive distribution is uniform: the max-entropy culture again. A pattern after action \\(a\\) is evidence that \\(a\\) keeps the world predictable, so it is a count: \\(\\alpha_{s,a} \\leftarrow \\alpha_{s,a} + 1\\). Noise is not evidence for anything. It is the world telling you your model of this state is stale. The Bayesian move for that is forgetting, which shrinks the counts back toward the prior:"}
</p>
$$\alpha_s \leftarrow \alpha_0 + (1-\kappa)\,(\alpha_s - \alpha_0).$$
<p>
That is a tempered posterior: the accumulated likelihood raised to the power \(1-\kappa\). It does two things at once. It moves the predictive mean toward uniform, so entropy goes up. And it lowers the total count \(\sum \alpha\), so the next observation moves the belief further. Noise does not just undo a habit. It reopens learning in that state, which is exploration without anyone asking for it.
</p>
</div>
<div data-lv="graduate" className="grad-note">
<div className="tag">
Graduate notes
</div>
<p>
Scaling the accumulated counts by \(1-\kappa\) is the same as raising the likelihood to the power \(1-\kappa\): a power, or tempered, posterior. Applied once per noise burst, it is exponential forgetting. This is the standard Bayesian answer to a non-stationary world, and it mirrors the volatility effect in human learning: in changeable environments the learning rate goes up (Behrens et al., 2007). Read that way, noise feedback is evidence that the state's action–outcome mapping is{" "}
<em>
volatile
</em>
, and the culture responds by raising its effective learning rate \(1/(\sum\alpha + 1)\) there.
</p>
<p>
{"The synaptic analogue is close but not exact. The budget \\(\\sum_j w_{ij} = N_M w_0\\) is a normalization of the predictive mean, with no free parameter for \\(\\sum \\alpha\\). In the culture, the role of confidence is played by the gap between weights relative to \\(1/\\beta\\). A proper hierarchical version would make the forgetting rate itself a learned quantity."}
</p>
</div>
</div>
<figure className="fig bg-white rounded-lg shadow p-6">
<div id="w-dirichlet">
</div>
<figcaption>
<div data-lv="easy">
<div className="try">
<div className="tag">
Try this
</div>
<ol>
<li>
Click{" "}
<strong>
Pattern after → Left
</strong>
{" "}three times. The dark area slides toward Left, and the dot (the culture's best guess) follows.
</li>
<li>
Click{" "}
<strong>
Forget toward prior
</strong>
{" "}twice. The dot drifts back toward the center, and "plasticity" (how easily it changes its mind) goes up.
</li>
<li>
Now click{" "}
<strong>
Pattern after → Fire
</strong>
{" "}once and watch the Fire best guess jump. To compare, hit{" "}
<strong>
Reset to prior
</strong>
, click Left three times, then Fire once{" "}
<em>
without
</em>
{" "}forgetting. The same single tally moves the guess less, because the culture was more sure of itself. Forgetting makes it more open-minded.
</li>
</ol>
</div>
</div>
<div data-lv="medium graduate">
<strong>
Figure 6.
</strong>
{" "}A Dirichlet belief over one state's policy. Each pattern adds a count and the density concentrates toward a corner. Each noise burst forgets a fraction \(\kappa\) of the evidence: the dot slides toward the center and plasticity goes back up. Try three patterns for Left, then two noise bursts, then a pattern for Fire.
</div>
</figcaption>
</figure>
<div className="post">
<div data-lv="easy">
<p>
One nice consequence: if the cells never get a drumbeat or static in some situation, its scoreboard never changes and it stays undecided forever. In one of our 8 test runs, the "far left" row stayed completely random after everything else was learned. No information means no learning.
</p>
<h2>
6. Did it really work?
</h2>
<p>
We ran 8 separate cultures for each kind of feedback, 20 minutes of game time each.
</p>
</div>
<div data-lv="medium graduate">
<p>
The culture is not literally a Dirichlet model. Its synaptic budget fixes the total weight, so it cannot store \(\sum \alpha\) as a separate number. Its confidence lives in how far the weights sit from uniform relative to the readout's sharpness \(\beta\). The directions match, though: pattern behaves like an observation and noise behaves like forgetting toward the prior. One prediction carries over directly. A state that never gets informative feedback stays at the prior. Occasionally one of the far states (L3 or R3) stays near 1.58 bits long after the others have converged. It happened in 1 of the 8 seeds in Figure 7. That state's trace is usually too old to be consolidated by the time a kill arrives, and random turning there is cheap enough that it rarely ends in a hit. No data, no update.
</p>
<p>
Active inference makes the loop explicit by choosing actions with probability \(p(a \mid s) \propto \exp(-\gamma\,G(s,a))\), where \(G\) is the expected free energy of what follows: roughly, how surprising you expect the world to be after taking that action. Low \(G\) actions get picked more. In this game the only thing that differs between outcomes is how predictable the feedback is, so roughly
</p>
{"$$G(s,a) \\approx P(\\text{noise} \\mid s,a)\\,H_{\\text{noise}} + P(\\text{pattern} \\mid s,a)\\,H_{\\text{pattern}}, \\qquad H_{\\text{pattern}} \\approx 0.$$"}
<p>
{"The culture never computes \\(G\\). It gets to a similar fixed point by sharpening after low-surprise outcomes and diffusing after high-surprise ones. The equation also explains Figure 5 at a glance. As \\(H_{\\text{noise}}\\) shrinks, \\(G\\) stops distinguishing good actions from bad ones, and the culture has nothing to avoid."}
</p>
<h2>
6. Results across seeds
</h2>
<p>
All four feedback conditions, 8 cultures each (seeds 1–8), 20 minutes of play, with the parameters used on this page.
</p>
</div>
<div data-lv="graduate" className="grad-note">
<div className="tag">
Graduate notes
</div>
<p>
In active inference, expected free energy splits into risk and ambiguity:
</p>
{"$$G(s,a) = \\underbrace{D_{\\mathrm{KL}}\\big(q(o \\mid s,a)\\,\\|\\,\\tilde p(o)\\big)}_{\\text{risk}} + \\underbrace{\\mathbb{E}_{q(s' \\mid s,a)}\\,H\\big[p(o \\mid s')\\big]}_{\\text{ambiguity}}.$$"}
<p>
The culture has no explicit preferences \(\tilde p(o)\). Nothing in its model says kills are good. So the operative term is ambiguity, the expected entropy of the outcome, which is the approximation for \(G\) used above. This also says what the culture lacks. With no epistemic (information-gain) term, its only source of exploration is forgetting under noise. That is enough here, because the noise is triggered exactly by the states that need re-exploring.
</p>
<p>
<strong>
Methods.
</strong>
{" Culture: 7×10 sensory and 3×10 motor neurons; \\(\\Delta t = 5\\) ms; leak 0.75; threshold 2.5; escape-noise temperature 0.6 with \\(p_{\\max} = 0.5\\); lateral inhibition 0.5 per spike; STDP trace \\(\\tau = 20\\) ms with LTD/LTP ratio 0.5; eligibility decay 0.9 per 50 ms tick with threshold 0.2; \\(\\eta = 0.08\\), \\(\\kappa = 0.35\\), \\(\\sigma = 0.25\\); \\(w_0 = 0.12\\); sensory spontaneous rate 0.5 Hz; stimulation 60–160 Hz by proximity. Game: 2 imps, speed 0.14 units/tick, turn 12°/tick, crosshair ±8°. These values came from a random search over 48 configurations (4 seeds × 25 min each), scored on final kill rate, so treat them as one working point, not a robust optimum. Code is in "}
<code>
src/culture.js
</code>
{" "}and{" "}
<code>
src/experiment.js
</code>
.{" "}
<code>
scripts/make-results.mjs
</code>
{" "}regenerates every number on this page.
</p>
</div>
</div>
<figure className="fig bg-white rounded-lg shadow p-6">
<div id="w-results">
</div>
<figcaption>
<div data-lv="easy">
<p>
Green (drumbeat + static) climbs to about 108 kills a minute and stops getting hurt. Blue (drumbeat only) gets stuck in bad habits. Amber (static only) and gray (nothing) stay random. The right chart shows "undecided-ness": only green ends up decided and also right.
</p>
</div>
<div data-lv="medium graduate">
<strong>
Figure 7.
</strong>
{" "}Means over 8 seeds. With pattern + noise, every culture converges to the efficient strategy within a few minutes: turn toward the imp, fire when it is centered. That gives about 108 kills per minute and essentially no damage. With pattern only, entropy falls but toward bad habits. 5 of the 8 cultures lock into a policy at or below chance (0–5 kills/min). The blue average sits above chance only because one culture got lucky and found the right policy (98 kills/min). With noise only or no feedback, entropy stays at log₂3 and performance stays at chance.
</div>
</figcaption>
</figure>
<div className="post">
<div data-lv="easy">
<p>
You need both. The drumbeat alone teaches "do more of whatever you were doing", even when that's wrong, so most cultures get stuck in bad habits. Static alone only makes the cells forget, so they stay random. Together, the drumbeat locks in what works and the static erases what doesn't.
</p>
<h2>
The honest fine print
</h2>
<ul>
<li>
This is a computer simulation, not real cells. Real dishes have hundreds of thousands of neurons. This one has 100.
</li>
<li>
I had to tune the settings to make it work. Some of the rules here are my best guess at what real cells do, not proven facts.
</li>
<li>
The cells never get points, but the scientist still decides which events get the drumbeat. So the "reward" hasn't vanished. It's hidden in that choice.
</li>
</ul>
<h2>
Words to know
</h2>
<ul>
<li>
<strong>
Neuron:
</strong>
{" "}a brain cell. It sends quick electrical blips called spikes.
</li>
<li>
<strong>
Electrode:
</strong>
{" "}a tiny metal contact that can zap cells or listen to them.
</li>
<li>
<strong>
Culture:
</strong>
{" "}a dish of living cells grown in a lab.
</li>
<li>
<strong>
Synapse / connection strength:
</strong>
{" "}how strongly one neuron can make another fire.
</li>
<li>
<strong>
Entropy:
</strong>
{" "}how hard something is to guess, measured in bits.
</li>
<li>
<strong>
Surprise:
</strong>
{" "}how unexpected one particular event was.
</li>
<li>
<strong>
Policy:
</strong>
{" "}the chance of each move in each situation, or "what the cells tend to do".
</li>
<li>
<strong>
Probability:
</strong>
{" "}how likely something is, from 0 (never) to 1 (always).
</li>
<li>
<strong>
Bit:
</strong>
{" "}the unit for uncertainty. One bit is the uncertainty of a fair coin flip, or one yes/no question you'd need to ask.
</li>
<li>
<strong>
Density (of static):
</strong>
{" "}what fraction of the tiny time slots get a zap. 50% is the most random. Near 0% or 100% is predictable.
</li>
<li>
<strong>
Prior:
</strong>
{" "}what you believe before seeing any evidence. Here, "every move is equally good".
</li>
<li>
<strong>
Bayesian inference:
</strong>
{" "}updating your beliefs as evidence comes in.
</li>
</ul>
</div>
<div data-lv="medium graduate">
<p>
Each condition fails for a different reason. Pattern-only feedback makes whatever the culture happened to be doing when kills arrived stronger everywhere, and since hits are silent nothing ever unlearns it. Noise-only feedback can only push toward uniform, and with nothing sharpening, the culture stays a max-entropy model. Both together give the full Bayesian loop: evidence where the world is predictable, forgetting where it is not.
</p>
<h2>
What this is and isn't
</h2>
<ul>
<li>
<strong>
It is a toy.
</strong>
{" "}100 neurons instead of hundreds of thousands, a place code I chose, and parameters I tuned with a random search. Two choices mattered a lot. Lateral inhibition between motor regions concentrates the eligibility trace on the chosen action. Low spontaneous firing in sensory regions stops a habit learned in one state from leaking into the others.
</li>
<li>
<strong>
The surprise gate is my modeling choice.
</strong>
{" "}A real culture has no explicit \(u\). The free energy account claims something with this effect emerges from ordinary plasticity. A simpler reading of the same data is that noise disrupts recently potentiated synapses while structured stimulation does not. This model is close to that reading, with the gate made explicit so the entropy story can be measured.
</li>
<li>
<strong>
"No reward" has a caveat.
</strong>
{" "}The culture never gets a reward value, but the experimenter decides which events get which stimulation. The reward is built into that mapping, not removed. What the experiment shows is that predictability alone is enough of a currency to carry it.
</li>
</ul>
<h2>
References
</h2>
<ul className="!text-base">
<li>
Kagan, B. J. et al. (2022). In vitro neurons learn and exhibit sentience when embodied in a simulated game-world.{" "}
<em>
Neuron
</em>
, 110(23).
</li>
<li>
Friston, K. (2010). The free-energy principle: a unified brain theory?{" "}
<em>
Nature Reviews Neuroscience
</em>
, 11(2).
</li>
<li>
Isomura, T. &amp; Friston, K. (2018). In vitro neural networks minimise variational free energy.{" "}
<em>
Scientific Reports
</em>
, 8.
</li>
<li>
Jaynes, E. T. (1957). Information theory and statistical mechanics.{" "}
<em>
Physical Review
</em>
, 106(4).
</li>
<li>
Bi, G. &amp; Poo, M. (1998). Synaptic modifications in cultured hippocampal neurons: dependence on spike timing, synaptic strength, and postsynaptic cell type.{" "}
<em>
Journal of Neuroscience
</em>
, 18(24).
</li>
<li>
Izhikevich, E. M. (2007). Solving the distal reward problem through linkage of STDP and dopamine signaling.{" "}
<em>
Cerebral Cortex
</em>
, 17(10).
</li>
<li>
Frémaux, N. &amp; Gerstner, W. (2016). Neuromodulated spike-timing-dependent plasticity, and theory of three-factor learning rules.{" "}
<em>
Frontiers in Neural Circuits
</em>
, 9.
</li>
<li>
Song, S., Miller, K. D. &amp; Abbott, L. F. (2000). Competitive Hebbian learning through spike-timing-dependent synaptic plasticity.{" "}
<em>
Nature Neuroscience
</em>
, 3(9).
</li>
<li>
Kempka, M. et al. (2016). ViZDoom: A Doom-based AI research platform for visual reinforcement learning.{" "}
<em>
IEEE CIG
</em>
.
</li>
</ul>
</div>
</div>
      <DoomDemos />
    </div>
  );
}
