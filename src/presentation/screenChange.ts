import { flushSync } from "react-dom";
import { stillMotion } from "./motion";

/** How long a screen change may wait for the browser to take its snapshot
 * before it happens without the crossfade. A snapshot normally takes a
 * frame or two; WebKit in CI once took over 5 s (2026-11-16), and Play
 * must never wait on decoration. */
const SNAPSHOT_MS = 250;

/** A change whose transition has not yet run it. */
let pending: (() => void) | null = null;

/**
 * Change screens (setup, the prologue, the table, back to setup) through a
 * View Transition (Safari 18): the browser snapshots the old screen, React
 * renders the new one synchronously inside the callback, and the two
 * crossfade (`::view-transition-*` in `style.css`). Display only: `update`
 * runs exactly once whatever happens. If the browser has not run it within
 * `SNAPSHOT_MS`, or refuses the transition, it runs at once without one. A
 * change still waiting when the next arrives runs first, so screens never
 * change out of order. Skipped under Reduced Motion or in a hidden tab.
 */
export function screenChange(update: () => void) {
  pending?.();
  if (!("startViewTransition" in document) || stillMotion()) return update();
  let done = false;
  const run = () => {
    if (done) return;
    done = true;
    if (pending === run) pending = null;
    flushSync(update);
  };
  pending = run;
  let transition: ViewTransition;
  try {
    transition = document.startViewTransition(run);
  } catch {
    run();
    return;
  }
  // Rejections only say the crossfade was skipped; the update still ran.
  // Skipping rejects all three, so each needs a handler or WebKit reports
  // an unhandled AbortError (PR #108's CI, 2026-11-16).
  for (const p of [
    transition.ready,
    transition.updateCallbackDone,
    transition.finished,
  ])
    p.catch(() => {});
  setTimeout(() => {
    if (done) return;
    transition.skipTransition();
    run();
  }, SNAPSHOT_MS);
}
