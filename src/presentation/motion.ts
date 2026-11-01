/**
 * Dev-only override that plays motion even when the OS asks for reduced motion,
 * so the flip and the dice roll can be reviewed on a machine with it enabled.
 * Production always honors Reduced Motion. Reads the top window so the workshop
 * preview (an iframe) can pass `?force-motion` through.
 */
export function forceMotion(): boolean {
  if (!import.meta.env.DEV) return false;
  let search = location.search;
  try {
    if (window.top) search = window.top.location.search;
  } catch {
    /* cross-origin top: keep our own search */
  }
  return new URLSearchParams(search).has("force-motion");
}

/** The Reduced Motion media query, for the two places that listen for it
 * changing mid-motion (the dice overlay and `usePresentation`); everything
 * else asks `reducedMotion()`. */
export const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

/** Whether motion is off: the OS asks for Reduced Motion (unless the dev
 * override is on). The one place that decides it (2026-11-01; the dice
 * overlay and `usePresentation` read the query themselves until the
 * moments review). */
export function reducedMotion(): boolean {
  return !!window.matchMedia?.(REDUCED_MOTION).matches && !forceMotion();
}

/** Whether a moment should not play at all: motion is off, or nobody can
 * see it (a hidden tab). */
export function stillMotion(): boolean {
  return document.hidden || reducedMotion();
}
