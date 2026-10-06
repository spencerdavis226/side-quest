import type { TimerDefinition } from "./types";
import type { Random } from "./engine";

// Timed cards. A fuse burns for a hidden whole number of seconds between its
// `min` and `max`; a countdown shows its `seconds`. Neither is saved: a timer
// is a table activity, so a reload simply leaves the card unlit.

export const FUSE_LIMITS = { min: 5, max: 90 } as const;
export const COUNTDOWN_LIMITS = { min: 3, max: 120 } as const;

/** How long this timer runs, in whole seconds. */
export function timerSeconds(timer: TimerDefinition, random: Random): number {
  if (timer.kind === "countdown") return timer.seconds;
  const span = timer.max - timer.min + 1;
  return timer.min + Math.min(span - 1, Math.floor(random() * span));
}

export function validateTimer(
  value: unknown,
): asserts value is TimerDefinition {
  const t = value as TimerDefinition;
  const whole = (n: unknown, lo: number, hi: number) =>
    Number.isSafeInteger(n) && (n as number) >= lo && (n as number) <= hi;
  if (
    !t ||
    t.version !== 1 ||
    typeof t.end !== "string" ||
    !t.end.trim() ||
    t.end.length > 120
  )
    throw Error("Invalid timer");
  if (t.kind === "fuse") {
    if (
      !whole(t.min, FUSE_LIMITS.min, FUSE_LIMITS.max) ||
      !whole(t.max, FUSE_LIMITS.min, FUSE_LIMITS.max) ||
      t.max <= t.min
    )
      throw Error("Invalid fuse: min and max seconds, max above min");
  } else if (t.kind === "countdown") {
    if (!whole(t.seconds, COUNTDOWN_LIMITS.min, COUNTDOWN_LIMITS.max))
      throw Error("Invalid countdown seconds");
  } else throw Error("Invalid timer kind");
}
