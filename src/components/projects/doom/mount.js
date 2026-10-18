import renderMathInElement from 'katex/dist/contrib/auto-render.mjs';
import 'katex/dist/katex.min.css';
import { startLevel } from './ui/level.js';
import { startMain } from './ui/main.js';
import { mountEntropy, mountSurprise, mountPolicy, mountDirichlet, mountResults, mountDensity } from './blog/widgets.js';
import { mountSTDP } from './blog/stdp.js';
import { track, disposeAll } from './lifecycle.js';

// Wires up everything on the page and returns a function that tears it all down.
export function mountDoomPage() {
  const root = document.querySelector('.doom-page');
  if (!root) return () => {};

  renderMathInElement(root, {
    delimiters: [
      { left: '$$', right: '$$', display: true },
      { left: '\\(', right: '\\)', display: false },
    ],
  });

  track(startLevel());
  track(startMain());

  const get = (id) => document.getElementById(id);
  mountEntropy(get('w-entropy'));
  mountSurprise(get('w-surprise'));
  mountSTDP(get('w-stdp'));
  mountPolicy(get('w-policy'));
  mountDirichlet(get('w-dirichlet'));
  mountResults(get('w-results'));
  mountDensity(get('w-density'));

  return disposeAll;
}
