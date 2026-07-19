/**
 * Shared scale/geometry math used by all chart primitives (BarChart,
 * LineChart, DonutChart). Kept dependency-free and pure so it's trivially
 * unit testable in isolation from any SVG/React rendering concerns.
 */

/** Rounds `range` to the nearest "nice" leading digit (1, 2, 5, or 10) times a power of ten. */
function niceNum(range: number, round: boolean): number {
  const exponent = Math.floor(Math.log10(range));
  const fraction = range / Math.pow(10, exponent);
  let niceFraction: number;

  if (round) {
    if (fraction < 1.5) niceFraction = 1;
    else if (fraction < 3) niceFraction = 2;
    else if (fraction < 7) niceFraction = 5;
    else niceFraction = 10;
  } else {
    if (fraction <= 1) niceFraction = 1;
    else if (fraction <= 2) niceFraction = 2;
    else if (fraction <= 5) niceFraction = 5;
    else niceFraction = 10;
  }

  return niceFraction * Math.pow(10, exponent);
}

/** Rounds to a fixed decimal precision to erase float noise (e.g. 0.1 + 0.2) from repeated addition. */
function roundToPrecision(value: number): number {
  return Number(value.toFixed(10));
}

/**
 * Classic D3-style "nice numbers" tick generation: produces round tick
 * values that span at least [min, max].
 *
 * Edge cases (all handled explicitly rather than left to fall out of the
 * math, since axis ticks feed directly into SVG coordinates):
 *  - NaN/Infinity anywhere in the input -> `[0]`, never a NaN tick.
 *  - `min === max` (including both `0`) -> a single-element `[min]`. We
 *    deliberately return one tick rather than fabricating a symmetric
 *    range around it: callers pairing this with `linearScale` already get
 *    a safe degenerate-domain fallback (see below), so a single tick is
 *    the more honest representation of "there is no range here".
 *  - Negative values -> handled naturally, the algorithm is sign-agnostic.
 *
 * Never returns more than `targetCount + 2` ticks.
 */
export function niceTicks(min: number, max: number, targetCount = 5): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [0];
  if (min === max) return [min];

  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  const span = niceNum(hi - lo, false);
  const count = Math.max(targetCount - 1, 1);
  const step = niceNum(span / count, true);

  if (!Number.isFinite(step) || step === 0) return [roundToPrecision(lo)];

  const niceMin = Math.floor(lo / step) * step;
  const niceMax = Math.ceil(hi / step) * step;
  const n = Math.round((niceMax - niceMin) / step) + 1;

  const ticks: number[] = [];
  for (let i = 0; i < n; i++) {
    if (ticks.length >= targetCount + 2) break; // safety cap, rarely hit given nice-number step selection
    ticks.push(roundToPrecision(niceMin + i * step));
  }
  return ticks;
}

/**
 * Maps `value` from `domain` to `range`, linearly.
 *
 * NaN-safe by design: SVG silently drops attributes that resolve to NaN,
 * which produces confusing "missing shape" bugs rather than a loud
 * failure. Instead, any invalid input (NaN value, non-finite domain
 * bound, or a degenerate `domain[0] === domain[1]`) resolves to the
 * midpoint of `range` -- always a concrete, renderable number. If `range`
 * itself isn't both finite (so no midpoint is computable either), this
 * falls back further to `0`.
 */
export function linearScale(value: number, domain: [number, number], range: [number, number]): number {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const safeFallback = Number.isFinite(r0) && Number.isFinite(r1) ? (r0 + r1) / 2 : 0;

  if (
    !Number.isFinite(value) ||
    !Number.isFinite(d0) ||
    !Number.isFinite(d1) ||
    !Number.isFinite(r0) ||
    !Number.isFinite(r1)
  ) {
    return safeFallback;
  }

  if (d0 === d1) return safeFallback;

  const t = (value - d0) / (d1 - d0);
  return r0 + t * (r1 - r0);
}
