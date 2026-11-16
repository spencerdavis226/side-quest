// A damped spring as a CSS `linear()` easing (Safari 17.2+; the floor is
// Safari 26). The tray's sheet, its pager and its dock settle on these, so a
// release keeps its weight instead of stopping on a bezier. Computed once
// per spring at module load; pure, so it is unit tested.

export interface Spring {
  /** The `linear(...)` easing. */
  easing: string;
  /** How long until it is still, in ms. */
  ms: number;
}

/** Sample a critically-or-under-damped spring from 0 to 1. `stiffness` and
 * `damping` are per unit mass; the curve ends when it stays within 0.1% of
 * rest. */
export function spring(stiffness: number, damping: number): Spring {
  const w0 = Math.sqrt(stiffness);
  const zeta = damping / (2 * w0);
  const at = (t: number) => {
    if (zeta < 1) {
      const wd = w0 * Math.sqrt(1 - zeta * zeta);
      return (
        1 -
        Math.exp(-zeta * w0 * t) *
          (Math.cos(wd * t) + ((zeta * w0) / wd) * Math.sin(wd * t))
      );
    }
    return 1 - Math.exp(-w0 * t) * (1 + w0 * t);
  };
  // Find where it settles, in steps of 1/60 s, at most 2 s.
  const step = 1 / 60;
  let end = step;
  let still = 0;
  for (let t = step; t <= 2; t += step) {
    if (Math.abs(1 - at(t)) < 0.001) {
      still += 1;
      if (still >= 6) {
        end = t;
        break;
      }
    } else {
      still = 0;
      end = t;
    }
  }
  const samples = Math.max(12, Math.min(48, Math.round(end / step)));
  const points: string[] = [];
  for (let i = 0; i <= samples; i++) {
    const v = i === samples ? 1 : at((end * i) / samples);
    points.push(String(Math.round(v * 10000) / 10000));
  }
  return { easing: `linear(${points.join(", ")})`, ms: Math.round(end * 1000) };
}

/** The sheet rising and settling back: a quick spring with a small
 * overshoot. */
export const SHEET = spring(260, 26);
/** A page snapping into place. */
export const PAGE = spring(300, 32);
