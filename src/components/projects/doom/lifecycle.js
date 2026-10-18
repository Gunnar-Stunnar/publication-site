// Small helper so the page's imperative widgets can be torn down when the
// component unmounts (client-side navigation) and mounted again cleanly.
const cleanups = [];

export const track = (fn) => {
  cleanups.push(fn);
  return fn;
};

export const listen = (target, type, fn, opts) => {
  target.addEventListener(type, fn, opts);
  track(() => target.removeEventListener(type, fn, opts));
};

export const disposeAll = () => {
  while (cleanups.length) {
    try {
      cleanups.pop()();
    } catch {}
  }
};

export const isEasyLevel = () => !!document.querySelector('.doom-page.level-easy');
