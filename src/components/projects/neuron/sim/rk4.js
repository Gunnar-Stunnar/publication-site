// The one integrator the whole post uses. A system is a function
// f(t, y, dydt) that writes the derivative of state y into dydt. Steppers
// keep their own scratch arrays so the animation loops allocate nothing.

export function makeRK4(n) {
  const k1 = new Float64Array(n);
  const k2 = new Float64Array(n);
  const k3 = new Float64Array(n);
  const k4 = new Float64Array(n);
  const tmp = new Float64Array(n);
  // Advances y in place by one step of size h.
  return function step(f, t, y, h) {
    f(t, y, k1);
    for (let i = 0; i < n; i++) tmp[i] = y[i] + 0.5 * h * k1[i];
    f(t + 0.5 * h, tmp, k2);
    for (let i = 0; i < n; i++) tmp[i] = y[i] + 0.5 * h * k2[i];
    f(t + 0.5 * h, tmp, k3);
    for (let i = 0; i < n; i++) tmp[i] = y[i] + h * k3[i];
    f(t + h, tmp, k4);
    for (let i = 0; i < n; i++) y[i] += (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
  };
}

export function makeEuler(n) {
  const k = new Float64Array(n);
  return function step(f, t, y, h) {
    f(t, y, k);
    for (let i = 0; i < n; i++) y[i] += h * k[i];
  };
}

export const makeStepper = (method, n) => (method === 'euler' ? makeEuler(n) : makeRK4(n));

// The four slopes of a single RK4 step on a scalar ODE y' = f(t, y), for
// drawing. Returns the probe points and the slope sampled at each.
export function rk4Anatomy(f, t, y, h) {
  const k1 = f(t, y);
  const y2 = y + 0.5 * h * k1;
  const k2 = f(t + 0.5 * h, y2);
  const y3 = y + 0.5 * h * k2;
  const k3 = f(t + 0.5 * h, y3);
  const y4 = y + h * k3;
  const k4 = f(t + h, y4);
  const k = (k1 + 2 * k2 + 2 * k3 + k4) / 6;
  return {
    probes: [
      { t, y, k: k1 },
      { t: t + 0.5 * h, y: y2, k: k2 },
      { t: t + 0.5 * h, y: y3, k: k3 },
      { t: t + h, y: y4, k: k4 },
    ],
    k,
    yEuler: y + h * k1,
    yRK4: y + h * k,
  };
}
