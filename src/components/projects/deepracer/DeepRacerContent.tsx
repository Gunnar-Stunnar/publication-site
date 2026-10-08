import Link from 'next/link';
import DeepRacerDemos from '@/components/projects/deepracer/DeepRacerDemos';

export default function DeepRacerContent() {
  return (
    <>
<div className="py-8">
  <Link href="/projects" className="text-gray-500 hover:text-black text-sm">← Back to projects</Link>
  <h1 className="text-4xl font-bold mb-4 mt-4">Winning CEDC AI Grand Prix 2026</h1>

    <div className="bg-white p-6 rounded-lg shadow mb-8">
    <h2 className="text-2xl font-bold mb-4">Project Overview</h2>
    <p className="text-lg mb-4">For the CEDC AI Grand Prix 2026 I trained an AWS DeepRacer car: a small convolutional network that sees one grayscale camera frame and chooses a steering angle and speed, fifteen times a second.</p>
    <p className="text-lg mb-4">The project started with a surprise. A plain <b>linear regression</b> on the track's waypoints drove every track perfectly. The rest of the project was about teaching the car's camera to see what those waypoints already knew. Along the way: an expert driver hidden inside the reward function, a physics-based racing line, and a car that learned to wobble from its own teacher.</p>
    <div className="grid grid-cols-3 gap-4 my-6 text-center">
      <div className="bg-gray-100 rounded p-4"><div className="text-2xl font-bold">1st</div><div className="text-sm text-gray-600">on the leaderboard</div></div>
      <div className="bg-gray-100 rounded p-4"><div className="text-2xl font-bold">100%</div><div className="text-sm text-gray-600">lap completion</div></div>
      <div className="bg-gray-100 rounded p-4"><div className="text-2xl font-bold">5.55 s</div><div className="text-sm text-gray-600">best lap (was 11.09 s)</div></div>
    </div>
    <div className="flex flex-wrap gap-2">
      <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full">Reinforcement Learning</span>
      <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full">Imitation Learning</span>
      <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full">Control Theory</span>
      <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full">Reservoir Computing</span>
      <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full">HPC</span>
    </div>
  </div>

    <section className="mb-12">
    <h2 className="text-2xl font-bold mb-4">1. The Surprise: Linear Regression Gets 100%</h2>
    <p className="mb-4">I didn't start with the competition car. I started with a question about brains: could a <b>reservoir computer</b>, a fixed random recurrent network with a trained linear readout, learn to drive the way a motor cortex might? To test it fast, I wrote a Python simulator on the real DeepRacer track files and gave the controller what the training environment knows: the car's offset from the center line, its heading, and the <b>bearing to six points on the track ahead</b> (0.4 to 3.5 m).</p>
    <p className="mb-4">I trained the reservoir online with FORCE learning against a simple expert (pure-pursuit steering) and compared it with the most boring baseline I could think of: <b>a linear readout on the same inputs, with no reservoir at all</b>.</p>
    <p className="mb-4">The linear readout won. It completed 100% of its laps on the training track and on five tracks it had never seen. The 600-neuron reservoir did worse on the hard tracks, because its memory learned quirks of the training track.</p>
    <figure className="mb-4"><img src="/projects/deepracer/force_vs_linear.png" alt="FORCE reservoir vs linear readout paths on six tracks" className="rounded-lg shadow w-full" />
      <figcaption className="mt-2 text-center text-sm text-gray-600">Trained on one track, tested on six. Green: linear readout. Blue: FORCE reservoir. Red: offline ridge regression, which never saw its own mistakes and crashed. Red ✕ marks an off-track.</figcaption></figure>
    <p className="mb-4">The reason is almost embarrassing. The bearing to a point on the line ahead is nearly the answer: pure-pursuit steering is roughly a scaled copy of it. <b>When you can see the road ahead, steering is close to a linear function of what you see.</b> Try it below. Collect 100 seconds of an expert driving with random wobble, fit seven numbers by least squares, and let those seven numbers drive.</p>

    <div className="bg-white p-6 rounded-lg shadow mb-4">
      <h3 className="text-xl font-bold mb-2">Interactive Demonstration: A Linear Readout Driving</h3>
      <p className="text-sm text-gray-600 mb-4">Steering = w · (bearings to six center-line points ahead) + b, fitted by least squares. Speed is fixed by the slider. The blue rays are the six inputs.</p>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2"><canvas id="lin-canvas" className="w-full h-72 bg-gray-50 rounded"></canvas></div>
        <div>
          <div className="flex flex-col gap-2 mb-4">
            <button id="lin-collect" className="px-4 py-2 rounded font-medium bg-gray-200 hover:bg-gray-300">1. Collect &amp; fit</button>
            <button id="lin-drive" className="px-4 py-2 rounded font-medium bg-green-500 hover:bg-green-600 text-white">2. Let the readout drive</button>
          </div>
          <label className="font-medium text-sm mb-1 block">Speed: <input id="lin-speed" type="range" min="1" max="3" step="0.25" defaultValue="2" className="w-full" /></label>
          <label className="font-medium text-sm mb-1 block">Playback: <select id="lin-ff" className="bg-gray-100 rounded px-2 py-1 text-sm" defaultValue="3"><option value="1">1×</option><option value="3">3×</option><option value="8">8×</option></select></label>
          <div className="font-medium text-sm mb-1 mt-4">Fitted weights</div>
          <div id="lin-weights" className="flex flex-col gap-1"></div>
        </div>
      </div>
      <p id="lin-status" className="mt-4 text-sm"></p>
      <p id="lin-stats" className="text-sm text-gray-700"></p>
    </div>
    <p className="mb-4">When I ran it, the fit reached R² = 0.999 and the readout drove 22 laps out of 22 without leaving the track. Look at the fitted weights: almost all of the weight lands on the 0.8 m and 1.2 m bearings, either side of the teacher's own lookahead distance at this speed (0.95 m). The regression has rediscovered how its teacher steers.</p>
    <p className="mb-4">There's a catch, and it shaped everything that came after. <b>Those bearings come from the track map, and the real car never gets a map.</b></p>
  </section>

    <section className="mb-12">
    <h2 className="text-2xl font-bold mb-4">2. The Real Car Only Has a Camera</h2>
    <p className="mb-4">In the competition, the car's brain is fixed: the evaluator loads only weights into a standard network. At race time it gets <b>one 160×120 grayscale frame</b> and nothing else: no position, no map, no memory of earlier frames.</p>
    <div className="bg-white p-6 rounded-lg shadow mb-4">
      <div className="flex flex-col md:flex-row items-stretch gap-2 text-center text-sm">
        <div className="flex-1 bg-gray-100 rounded p-3"><div className="font-medium">Camera</div><div className="text-gray-600">160×120 gray</div></div>
        <div className="self-center text-gray-400">→</div>
        <div className="flex-1 bg-purple-50 rounded p-3"><div className="font-medium">Conv 32 · 8×8</div><div className="text-gray-600">stride 4</div></div>
        <div className="self-center text-gray-400">→</div>
        <div className="flex-1 bg-purple-50 rounded p-3"><div className="font-medium">Conv 64 · 4×4</div><div className="text-gray-600">stride 2</div></div>
        <div className="self-center text-gray-400">→</div>
        <div className="flex-1 bg-purple-50 rounded p-3"><div className="font-medium">Conv 64 · 3×3</div><div className="text-gray-600">→ 11,264 features</div></div>
        <div className="self-center text-gray-400">→</div>
        <div className="flex-1 bg-purple-50 rounded p-3"><div className="font-medium">Dense 512</div><div className="text-gray-600">ReLU</div></div>
        <div className="self-center text-gray-400">→</div>
        <div className="flex-1 bg-blue-100 rounded p-3"><div className="font-medium">Linear readout</div><div className="text-gray-600">→ one of N actions</div></div>
      </div>
      <p className="mt-4 text-sm text-gray-600">Purple: the layers that have to learn to <i>see</i>. Blue: the controller.</p>
    </div>
    <p className="mb-4">Look at the last layer: it's a <b>linear readout</b>. Section 1 showed that a linear readout steers well when its inputs encode the geometry of the road ahead. So the plan became clear:</p>
    <p className="mb-4"><b>Train the convolutional layers to extract the lookahead geometry from pixels, and the final linear layer can do the rest.</b></p>
  </section>

    <section className="mb-12">
    <h2 className="text-2xl font-bold mb-4">3. Hiding the Expert Inside the Reward</h2>
    <p className="mb-4">DeepRacer trains with reinforcement learning (PPO). You don't label data; you write a <code>reward_function(params)</code> that scores each step. The trick is that during training, <code>params</code> holds exactly the privileged information the car never sees: its position, its heading, and every waypoint of the track.</p>
    <p className="mb-4">So I put the expert inside the reward. Every step, the reward function works out what pure pursuit would do from the car's true position, and pays the network for choosing the same thing:</p>
    <pre className="font-mono text-sm bg-gray-100 rounded-md px-4 py-3 overflow-x-auto whitespace-pre mb-4">{`steer_score = exp(−½ · ((steering − teacher_steering) / 6°)²)
speed_score = exp(−½ · ((speed − teacher_speed) / 0.5 m/s)²)
reward      = steer_score · (0.4 + 0.6 · speed_score)        (0.001 if off track)`}</pre>
    <p className="mb-4">To earn reward, the network has to match a teacher that is steering by the map, so its convolutional layers have to learn to <i>see</i> where the road goes. I also built the action space from the teacher itself: I drove it with added steering noise, recorded every command, and clustered them into 15 steering/speed pairs. That way the actions it needs, including recoveries, all exist.</p>
    <p className="mb-4"><b>v1</b> (pure pursuit on the center line) trained on a laptop and scored <b>100% completion with an 11.09 s best lap</b>. It worked. Next, it needed to be fast.</p>
  </section>

    <section className="mb-12">
    <h2 className="text-2xl font-bold mb-4">4. A Faster Teacher: Physics and the Racing Line</h2>
    <p className="mb-4">A student can only be as fast as its teacher, and the center-line teacher wasn't fast. So I did what racers do.</p>
    <p className="mb-4"><b>First, I measured the car.</b> From 17,000 logged simulator steps I compared commanded steering with how sharply the car actually turned. Its effective wheelbase is <b>0.334 m</b>, twice the nominal value, so the old teacher had been under-steering. Sideways grip holds to about <b>9 m/s²</b>, while the old teacher planned corners at 3.6.</p>
    <p className="mb-4"><b>Then I solved for the fastest path.</b> Each center-line point may slide sideways by α<sub>i</sub>, staying inside the track. I minimize total squared curvature, which is a bounded linear least-squares problem:</p>
    <pre className="font-mono text-sm bg-gray-100 rounded-md px-4 py-3 overflow-x-auto whitespace-pre mb-4">{`p_i = c_i + α_i · n_i          |α_i| ≤ half_width_i − margin
minimize   Σ ‖ p_(i−1) − 2·p_i + p_(i+1) ‖²`}</pre>
    <p className="mb-4"><b>Finally, a speed for every point.</b> Corner speed is set by grip, v = √(a<sub>lat</sub> / κ). Then a backward pass adds braking zones and a forward pass limits acceleration. On re:Invent 2018 the sharpest bend drops from 3.76 to 2.03 per meter, and the ideal lap gets about 15% faster. Move the grip slider to see how the speed plan changes:</p>

    <div className="bg-white p-6 rounded-lg shadow mb-4">
      <h3 className="text-xl font-bold mb-2">Interactive Demonstration: Racing Line Explorer</h3>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2"><canvas id="rl-canvas" className="w-full h-72 bg-gray-50 rounded"></canvas></div>
        <div>
          <label className="font-medium text-sm mb-1 block">Cornering grip a<sub>lat</sub>: <span id="rl-alat-v"></span> m/s²
            <input id="rl-alat" type="range" min="2" max="9" step="0.5" defaultValue="6.5" className="w-full" /></label>
          <label className="font-medium text-sm mb-1 block mt-2">Top speed: <span id="rl-vmax-v"></span> m/s
            <input id="rl-vmax" type="range" min="2" max="4" step="0.25" defaultValue="4" className="w-full" /></label>
          <label className="font-medium text-sm mb-1 block mt-2">Show
            <select id="rl-show" className="bg-gray-100 rounded px-2 py-1 text-sm w-full"><option value="both">both</option><option value="line">racing line</option><option value="center">centerline</option></select></label>
          <p className="text-xs mt-4 text-gray-600">Color = target speed: blue is slow, orange is fast. Watch the braking zones appear before each corner.</p>
        </div>
      </div>
      <p id="rl-lap" className="mt-4 text-sm"></p>
      <canvas id="rl-chart" className="w-full h-32 mt-2"></canvas>
    </div>
    <p className="mb-4">The new teacher (pure pursuit on this line, using the measured wheelbase) laps about <b>twice as fast</b> as the old one in my simulator: 5.27 s against 10.73 s.</p>
  </section>

    <section className="mb-12">
    <h2 className="text-2xl font-bold mb-4">5. What the Reward Actually Looks Like</h2>
    <p className="mb-4">From the network's side, each step is a multiple-choice question: <i>which of my 18 actions does the reward like best, given where I am?</i> Drag the car around the track below. The heatmap shows the reward for every possible steering and speed. White dots are the 18 actions the network can choose from, and the orange ring is the best one. Click the heatmap to inspect another action. Turn the car with the heading slider to see the reward pull it back toward the line.</p>
    <div className="bg-white p-6 rounded-lg shadow mb-4">
      <h3 className="text-xl font-bold mb-2">Interactive Demonstration: Reward vs. Position</h3>
      <div className="grid md:grid-cols-2 gap-6">
        <div><canvas id="rw-canvas" className="w-full h-72 bg-gray-50 rounded cursor-crosshair"></canvas>
          <p className="text-xs mt-1 text-gray-500">Drag the car · green dot = the teacher's pure-pursuit target · faint blue = racing line</p></div>
        <div><canvas id="rw-heat" className="w-full h-72 cursor-pointer"></canvas></div>
      </div>
      <div className="grid md:grid-cols-2 gap-6 mt-4">
        <div>
          <label className="font-medium text-sm mb-1 block">Car heading relative to the line: <span id="rw-head-v"></span>
            <input id="rw-head" type="range" min="-45" max="45" step="5" defaultValue="0" className="w-full" /></label>
          <label className="font-medium text-sm mb-1 block mt-2">Reward version
            <select id="rw-ver" className="bg-gray-100 rounded px-2 py-1 text-sm w-full"><option value="v21">v2.1 (damped teacher + heading + line terms)</option><option value="v2">v2 (teacher match only)</option></select></label>
        </div>
        <div id="rw-info"></div>
      </div>
    </div>
    <p className="mb-4">A few things to notice:</p>
    <ul className="list-disc pl-6 space-y-2 mb-4">
      <li>On straights the bright region sits at high speed, and entering a corner it shifts to the teacher's steering angle at a lower speed.</li>
      <li>Steering is the gate. The wrong steering scores near zero at any speed, because the reward multiplies the steering score by everything else.</li>
      <li>The reward width (σ = 6°) roughly matches the gap between neighboring actions, so the closest available action still scores well.</li>
    </ul>
  </section>

    <section className="mb-12">
    <h2 className="text-2xl font-bold mb-4">6. Scaling Up, Then a Wobble</h2>
    <p className="mb-4">PPO needs a lot of driving, so I moved training to CU Denver's Alderaan cluster. DeepRacer-for-Cloud expects Docker, and the cluster only offers Singularity, so I rebuilt the pipeline:</p>
    <ul className="list-disc pl-6 space-y-2 mb-4">
      <li>The trainer runs directly instead of through Docker.</li>
      <li>An S3 gateway stores model files as plain files on the cluster's shared filesystem.</li>
      <li>8 Gazebo simulators run in parallel on one 64-core node.</li>
    </ul>
    <p className="mb-4">Checkpoint 165 of the racing-line model went to the leaderboard: <b>100% completion, 5.542 s best lap, first place</b>, half the time of v1.</p>
    <p className="mb-4">But in my own 10-lap tests it went off the track in 3 laps out of 10. I recorded video of every failure:</p>
    <video preload="metadata" src="/projects/deepracer/ckpt165_fails_vs_success.mp4" controls className="rounded-lg shadow w-full mb-2"></video>
    <p className="mt-2 text-center text-sm text-gray-600 mb-4">Fastest clean lap at real speed, then every off-track at half speed.</p>
    <p className="mb-4">Every failure looked the same: a <b>wobble that grows</b>. The car swings across the line, each swing bigger than the last (±15, then ±30, then ±50 cm), flipping between full lock left and right at 4 m/s until it leaves the track.</p>
    <figure className="mb-4"><img src="/projects/deepracer/ckpt165_paths.png" alt="Clean laps vs laps with off-tracks" className="rounded-lg shadow w-full" />
      <figcaption className="mt-2 text-center text-sm text-gray-600">Left: 7 clean laps. Right: the 3 laps with off-tracks; red ✕ marks where the car left the track.</figcaption></figure>
  </section>

    <section className="mb-12">
    <h2 className="text-2xl font-bold mb-4">7. Fix the Teacher, Not the Student</h2>
    <p className="mb-4">My first guess was that the network hadn't learned well enough. The data said otherwise. Replaying the failure laps through the reward, the car's steering was within <b>3.6°</b> of the teacher's during the wobble, about the same as on clean laps (3.3°). <b>The car was faithfully copying a teacher that wobbles.</b></p>
    <p className="mb-4">Pure pursuit has no damping. The simulator also reacts a step or two late (about 67–133 ms), so each correction lands after the car has already moved, overshoots, and the next correction overshoots further. This is the same delay effect my early brain-inspired experiments ran into. The fix:</p>
    <ul className="list-disc pl-6 space-y-2 mb-4">
      <li><b>A longer lookahead:</b> 0.55 + 0.35·v instead of 0.45 + 0.25·v.</li>
      <li><b>A recovery rule:</b> the teacher slows down by up to 20% when the car is pointed away from the line or far from it.</li>
    </ul>
    <p className="mb-4">I tuned both on a grid of settings in the simulator, with a deliberate delay added. Below, both teachers drive at once with the same delay. At 0 steps of delay they both look fine; move it to 2 and watch the orange car. Over 50 laps at 133 ms of delay, the v2 teacher goes off track about <b>3 times per lap</b>, while the damped teacher averages about <b>one off-track every four laps</b>.</p>

    <div className="bg-white p-6 rounded-lg shadow mb-4">
      <h3 className="text-xl font-bold mb-2">Interactive Demonstration: Delay vs. Damping</h3>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2"><canvas id="dm-canvas" className="w-full h-72 bg-gray-50 rounded"></canvas></div>
        <div>
          <label className="font-medium text-sm mb-1 block">Sensor delay: <span id="dm-delay-v"></span>
            <input id="dm-delay" type="range" min="0" max="3" step="1" defaultValue="2" className="w-full" /></label>
          <label className="font-medium text-sm mb-1 block mt-2">Playback: <select id="dm-ff" className="bg-gray-100 rounded px-2 py-1 text-sm" defaultValue="3"><option value="1">1×</option><option value="3">3×</option><option value="8">8×</option></select></label>
          <button id="dm-reset" className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 mt-3">Reset</button>
          <p className="text-xs mt-4 text-gray-600">Both cars pick the nearest of the same 18 actions to their teacher's command, like a trained network would.</p>
        </div>
      </div>
      <div id="dm-stats" className="mt-4 text-sm flex flex-col gap-1"></div>
      <canvas id="dm-chart" className="w-full h-32 mt-2"></canvas>
    </div>

    <p className="mb-4">Damping the teacher wasn't enough on its own, because the network has no memory. So <b>I gave the reward function a little memory instead.</b> Each simulator worker keeps its reward function loaded between steps, so the reward can remember the previous step:</p>
    <pre className="font-mono text-sm bg-gray-100 rounded-md px-4 py-3 overflow-x-auto whitespace-pre mb-4">{`reward = v2_score · (0.6 + 0.2·heading_score + 0.2·line_score)
       · (0.5 + 0.5·exp(−½·(unexplained_jerk / σ(speed))²))      ← jerk the teacher didn't ask for
       · 0.5  if steering flips left↔right above 10° at speed       ← the wobble's signature`}</pre>
    <p className="mb-4">The action space stayed the same, so <b>v2.1 continued training from checkpoint 165</b> instead of starting over. Its best checkpoint, 649, drove <b>10 clean laps out of 10</b> in the same test where 165 managed 7, and it scored my best leaderboard result yet.</p>
  </section>

    <section className="mb-12">
    <h2 className="text-2xl font-bold mb-4">8. The Phases</h2>
    <div className="bg-white p-6 rounded-lg shadow mb-4 overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="text-left text-gray-500 border-b"><th className="py-2 pr-4">Phase</th><th className="pr-4">Teacher in the reward</th><th className="pr-4">Trained from</th><th className="pr-4">Leaderboard</th></tr></thead>
        <tbody>
          <tr className="border-b"><td className="py-2 pr-4 font-medium">v1: imitate</td><td className="pr-4">Pure pursuit on the center line</td><td className="pr-4">scratch (laptop)</td><td>100% · 11.09 s</td></tr>
          <tr className="border-b"><td className="py-2 pr-4 font-medium">v2: race</td><td className="pr-4">Racing line, measured physics, 6.5 m/s² corners</td><td className="pr-4">scratch (HPC, 8 workers)</td><td>100% · 5.542 s · score 5.615</td></tr>
          <tr className="border-b"><td className="py-2 pr-4 font-medium">v2.1: steady</td><td className="pr-4">Damped teacher + heading, line, jerk and flip terms</td><td className="pr-4">checkpoint 165</td><td>100% · 5.550 s · <b>score 5.610</b></td></tr>
          <tr><td className="py-2 pr-4 font-medium">v2.1 phase 2: pace</td><td className="pr-4">Same, but paid for lap progress per step + a finishing bonus</td><td className="pr-4">checkpoint 649</td><td className="text-gray-500">training now</td></tr>
        </tbody>
      </table>
      <p className="mt-4 text-sm text-gray-600">The leaderboard ranks completion first, then a lower time-based score. That's why v2.1 traded a few hundredths of a second of best lap for never leaving the track.</p>
    </div>
    <p className="mb-4">The phases build on each other because the <b>action space never changes</b>, so each phase can start from the previous checkpoint. First, learn to see the road (imitation). Then learn a fast line. Then learn to stay steady on it. Last, learn to push.</p>
  </section>

    <section className="mb-12">
    <h2 className="text-2xl font-bold mb-4">Key Findings</h2>
    <div className="grid md:grid-cols-3 gap-6">
      <div className="bg-white p-6 rounded-lg shadow"><h3 className="text-xl font-bold mb-2">Linear is enough, with the right features</h3><p className="text-sm">A linear readout on lookahead bearings drove every track. The hard part is perception, so I shaped the CNN to produce those features.</p></div>
      <div className="bg-white p-6 rounded-lg shadow"><h3 className="text-xl font-bold mb-2">Put the expert in the reward</h3><p className="text-sm">Reward functions see the map; the car doesn't. Scoring actions against a privileged teacher turns reinforcement learning into fast imitation learning.</p></div>
      <div className="bg-white p-6 rounded-lg shadow"><h3 className="text-xl font-bold mb-2">Fix the teacher, not the student</h3><p className="text-sm">The wobble wasn't a training failure; the network copied a teacher that oscillates under delay. Damping the teacher fixed the student.</p></div>
    </div>
  </section>

  <section className="mb-12">
    <h2 className="text-2xl font-bold mb-4">Lessons</h2>
    <ul className="list-disc pl-6 space-y-2">
      <li><b>Test in a cheap simulator first.</b> Every idea here was checked in a Python simulator calibrated to the real one, minutes before it got hours of cluster time.</li>
      <li><b>Train in closed loop.</b> Models fitted only on an expert's driving never see their own mistakes. FORCE, DAgger and PPO all learn on the states the learner itself causes.</li>
      <li><b>Delay changes everything.</b> A controller that's perfect with instant feedback can oscillate with 100 ms of lag, whether it's a reservoir, a teacher, or a CNN.</li>
      <li><b>Look at the failures.</b> One video and one replay of the trace explained more than a day of training curves.</li>
    </ul>
  </section>

  <section className="mb-12">
    <h2 className="text-2xl font-bold mb-4">Acknowledgments</h2>
    <div className="bg-white p-6 rounded-lg shadow">
      <p className="mb-4">This project moved fast because I built it with <b>Claude</b> (Anthropic), working through Claude Code, as a hands-on collaborator. I set the direction (the questions, the ideas to try, and the calls on what to keep), and Claude helped turn them into working experiments, often within the hour:</p>
      <ul className="list-disc pl-6 space-y-2 mb-4">
        <li>building and calibrating the Python track simulator, the FORCE reservoir and delay experiments, and the racing-line solver;</li>
        <li>porting DeepRacer-for-Cloud from Docker to Singularity on the Alderaan cluster, and debugging it one failed job at a time;</li>
        <li>digging through simulator logs and failure videos, which is how the wobble was traced back to the teacher;</li>
        <li>writing the reward functions, the evaluation scripts, and the interactive demos on this page.</li>
      </ul>
      <p>Most of the useful turns came from checking an idea quickly and looking honestly at the result, including the ones that didn't work. Having a collaborator that could build, test and report back that fast is a big part of how the project got from a linear regression to first place in a few weeks.</p>
    </div>
  </section>

  <div className="mt-16 border-t border-gray-200 pt-6 text-sm text-gray-600">
    Built with DeepRacer-for-Cloud (simapp 6.0.6) on CU Denver's Alderaan cluster. The demos run a JavaScript port of my calibrated simulator on the re:Invent 2018 track.
  </div>
</div>
      <DeepRacerDemos />
    </>
  );
}
