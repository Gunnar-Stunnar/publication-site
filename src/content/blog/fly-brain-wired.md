---
title: "The Fly Brain, Wired"
date: "2026-09-26"
excerpt: "FlyWire mapped every one of the 139,255 neurons in a fruit fly's brain. I turned that wiring diagram into a working simulation, then pulled it apart into the circuits for seeing, smelling, remembering and moving, and switched each one on. This post walks through all four, with renders and simulation videos."
author: "Gunnar Enserro"
tags: ["neuroscience", "connectomics", "computational neuroscience", "simulation", "research"]
---

*A brain the size of a poppy seed, mapped wire by wire.*

![Rotating 3D rendering of thousands of real fly neurons, colored by job](/FlyBrain/tour.mp4)

- **139,255** neurons, every one identified and traced
- **~50 million** synapses, the contact points where one neuron talks to another
- **16.8 million** distinct neuron-to-neuron connections

A **connectome** is a wiring diagram. Picture a city map that shows every road, and also every lane running between every pair of houses. FlyWire gave us the first complete one for an adult brain: the fruit fly, *Drosophila melanogaster*.

---

## How do you map 139,000 neurons?

1. **Slice.** One fly brain was cut into about 7,000 slices, each far thinner than a soap bubble, and photographed with an electron microscope.
2. **Trace with AI.** Machine learning followed each neuron from slice to slice, stitching the pictures into 3D shapes.
3. **Check by hand.** Scientists and citizen volunteers around the world fixed the AI's mistakes. The finished map was published in *Nature* in 2024.

## A map you can switch on

A wiring diagram on its own is static. To make it *do* something, I turn each neuron into a simple rule: a **leaky bucket**. Signals from neighbours pour in, the bucket slowly drains, and when it overflows the neuron fires and passes a signal on.

Connect 139,255 of these buckets exactly as the map says, poke the sensors, and watch what happens. There's no training and no guessing. The wiring alone does the work.

What the wiring alone predicts:

- **Sugar on the tongue** → the feeding muscle neuron fires
- **Light and dark in the eye** → correct ON/OFF responses
- **A looming shadow** → the fly turns away

The rest of this post pulls the map apart into four circuits (seeing, smelling, remembering and moving) and switches each one on. For each circuit you'll see where it lives in the brain, a layer diagram of how information flows through it, and a simulation of it running.

---

## Circuit 1: Vision

### More than half the brain is for seeing

![Rotating 3D view of the fly's visual neurons](/FlyBrain/vision.mp4)

Light sensors in each eye feed two huge **optic lobes**, where layers of neurons pick out light, dark, edges and motion. Projection neurons then carry a summary to the central brain. Some of them are specialists: **looming detectors** fire when something rushes toward the fly.

If you've worked with deep networks, the structure will look familiar. Read it left to right like the layers of a convolutional net:

![Vision circuit: photoreceptors → lamina → medulla → lobula → visual projection neurons](/FlyBrain/vision_circuit.svg)

### Vision in action: the fly looks around a forest

I fed the simulated eyes a forest panorama while the fly turns right, then left:

![What the simulated fly sees as it turns right, then left](/FlyBrain/forest_view.mp4)

And here is the whole brain responding. All 139,255 simulated neurons are shown; **orange** means a neuron is firing more than usual. Activity floods in from both eyes and ripples inward. (Slowed about 7×.)

![Simulated whole-brain activity lighting up the optic lobes as the fly views a forest](/FlyBrain/act_vision.mp4)

---

## Circuit 2: Smell

### Each smell gets its own barcode

![Rotating 3D view of the fly's smell neurons](/FlyBrain/smell.mp4)

Odor sensors on the antennae (green) sort into about 50 **glomeruli**: tiny sorting bins, one per receptor type. **Projection neurons** (orange) carry each bin's signal up to two places: the memory center, and the **lateral horn**, which handles instinct like "rotten, avoid."

The pattern is *sort, clean, then broadcast*:

![Smell circuit: odor sensors → glomeruli → projection neurons → lateral horn, with local neurons normalizing](/FlyBrain/smell_circuit.svg)

The local neurons act like a normalization layer. They turn loud smells down so faint ones still register.

### Smell in action: a whiff of banana

I played the measured receptor responses to **pentyl acetate**, the smell of banana, into the model. The antennal lobes light up first, then signals climb to the memory center and the lateral horn. The odor is on from 200 to 800 ms.

![Simulated activity spreading from the antennal lobes to the memory center when a banana odor is presented](/FlyBrain/act_smell.mp4)

---

## Circuit 3: Memory

### Memory is a teacher adjusting connections

![Rotating 3D view of the mushroom body memory circuit](/FlyBrain/memory.mp4)

The fly's memory center, the **mushroom body**, is one of the most elegant circuits in neuroscience. About 5,000 **Kenyon cells** store each smell as a *sparse code*: only a few percent respond to any one odor.

**Dopamine neurons** act as teachers. When a smell comes with sugar or a shock, they strengthen or weaken the links to the **output neurons** that say "approach" or "avoid."

In machine-learning terms it's a random expansion into a wide hidden layer, a sparsity constraint, and a reward-modulated readout:

![Memory circuit: projection neurons → Kenyon cells → output neurons, with dopamine as the learning signal and APL enforcing sparsity](/FlyBrain/memory_circuit.svg)

- **Expansion:** each Kenyon cell samples about 5 random inputs, so 50 channels spread into 5,000. That makes every smell look distinct.
- **Sparsity:** two giant inhibitory **APL** neurons let only about 5–10% of Kenyon cells fire, so memories don't blur together.
- **Learning:** dopamine re-weights the Kenyon-to-output synapses. That change *is* the memory.

### Memory in action: a sparse code for banana

Same banana odor as before, showing only the memory-center neurons. In the tuned model, **~8%** of Kenyon cells answer the odor. Real flies land at 5–10%.

![Close-up of the memory center: only a small fraction of Kenyon cells fire to the odor](/FlyBrain/act_memory.mp4)

---

## Circuit 4: Movement

### About 1,300 cables to the body

![Rotating 3D view of the fly's movement circuits](/FlyBrain/movement.mp4)

**Descending neurons** are the brain's command cables. They run down the neck to the body and trigger walking, turning, escape or grooming. The **central complex** acts as a compass, and **ascending neurons** report back what the legs and wings are doing.

![Movement circuit: sensory summaries → central brain → descending neurons → body, with ascending feedback](/FlyBrain/movement_circuit.svg)

Everything the brain decides has to squeeze through that bottleneck at the neck. A handful of descending neurons fire as clear commands: turn, walk, or jump (the famous *giant fiber*).

### From brain to body: escaping a threat

Something looms on the left. The signal runs from the left looming detectors (LPLC2) through the central brain to the descending neurons:

![Simulated activity flowing from the left looming detectors through the central brain to the descending neurons](/FlyBrain/act_escape.mp4)

Those commands drive a physics-simulated fly body (NeuroMechFly), which turns about **85° away** from the threat:

![A simulated fly body turning away from a threat on its left](/FlyBrain/body.mp4)

---

## Beyond the wiring

### Wires carry messages. Chemistry sets the mood.

**Neurotransmitters are fast and point to point.** Each neuron releases one main chemical at its synapses, and that decides whether it says "go" or "stop."

| Neurotransmitter | Effect | Share of neurons |
|---|---|---|
| Acetylcholine | go (excite) | 62% |
| Glutamate | mostly stop, in flies | 18% |
| GABA | stop (inhibit) | 14% |

*Share of all 139,255 neurons, as predicted by AI from the microscope images.*

**Neuromodulators are slow and broadcast.** A few percent of neurons release chemicals that don't just pass a message. They change how whole circuits behave:

- **Dopamine** is the teacher. It marks what was rewarding or dangerous, and rewrites memories.
- **Serotonin** is the state dial: hungry or full, active or resting.
- **Octopamine** is the fly's adrenaline: arousal, flight, fight.

> The map shows every wire, but modulators act like volume knobs across the whole brain.

Adding them is the next frontier, and it's where our current work on dopamine-driven learning is headed.

---

## Why this matters for computational neuroscience

We're moving from *guessing* the wiring to *reading* it.

- **Predict, then test.** Simulations point to which few neurons are worth studying, which can save months at the bench.
- **Find what's missing.** Where the model fails, as it does with motion vision, it shows what wiring alone can't explain: timing and chemistry.
- **Brain-shaped chips.** Our integer-only neuron model matches the full floating-point model. By our estimates, a single FPGA card could run dozens of fly brains in real time.

For the first time, we can read a brain's wiring and switch it on.

---

*Data: FlyWire FAFB v783 (Dorkenwald et al. 2024; Schlegel et al. 2024, Nature), CC-BY 4.0. Leaky integrate-and-fire model after Shiu et al. 2024. Odor data: DoOR 2.0. Body: NeuroMechFly v2.*
