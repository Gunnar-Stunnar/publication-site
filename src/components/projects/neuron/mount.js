import renderMathInElement from 'katex/dist/contrib/auto-render.mjs';
import 'katex/dist/katex.min.css';
import { startLevel } from '../doom/ui/level.js';
import { mountHero, mountLIF, mountSpikeTiming } from './widgets/lif.js';
import { mountOscillator, mountRK4Anatomy, mountConvergence } from './widgets/solver.js';
import { mountLorenz } from './widgets/lorenz.js';
import { mountSpikeAnatomy, mountZoo } from './widgets/zoo.js';
import { mountSynapse } from './widgets/synapse.js';
import { mountPairing } from './widgets/stdp.js';
import { mountFinale } from './widgets/finale.js';
import { track, disposeAll } from '../doom/lifecycle.js';

// Wires up everything on the page and returns a function that tears it all down.
export function mountNeuronPage() {
  const root = document.querySelector('.neuron-page');
  if (!root) return () => {};

  renderMathInElement(root, {
    delimiters: [
      { left: '$$', right: '$$', display: true },
      { left: '\\(', right: '\\)', display: false },
    ],
  });

  track(startLevel({ rootSelector: '.neuron-page', storageKey: 'neuron-post' }));

  const mounts = {
    'w-hero': mountHero,
    'w-osc': mountOscillator,
    'w-anatomy': mountRK4Anatomy,
    'w-conv': mountConvergence,
    'w-lorenz': mountLorenz,
    'w-lif': mountLIF,
    'w-timing': mountSpikeTiming,
    'w-spike': mountSpikeAnatomy,
    'w-zoo': mountZoo,
    'w-syn': mountSynapse,
    'w-pair': mountPairing,
    'w-finale': mountFinale,
  };
  for (const [id, mount] of Object.entries(mounts)) {
    const el = document.getElementById(id);
    if (el) mount(el);
  }

  return disposeAll;
}
