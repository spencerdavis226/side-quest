import { flushSync } from "react-dom";
import { stillMotion } from "./motion";

/**
 * Change screens (setup, the prologue, the table, back to setup) through a
 * View Transition (Safari 18): the browser snapshots the old screen, React
 * renders the new one synchronously inside the callback, and the two
 * crossfade (`::view-transition-*` in `style.css`). Display only: `update`
 * runs exactly once either way, and the controller saves before it animates
 * as always. Skipped under Reduced Motion or in a hidden tab.
 */
export function screenChange(update: () => void) {
  if (!("startViewTransition" in document) || stillMotion()) return update();
  document.startViewTransition(() => flushSync(update));
}
