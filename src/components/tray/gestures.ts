import { useEffect, useRef, type RefObject } from "react";
import { stillMotion } from "../../presentation/motion";
import { PAGE, SHEET } from "./spring";

// The tray's two gestures, on native listeners so a drag never re-renders
// React: the sheet pulled down to put it away, and the pages swiped
// sideways. Both follow the finger 1:1, rubber-band past their ends, and on
// release read the flick's speed as well as its distance. A gesture that
// moved swallows the click that follows, so a swipe that starts on a
// button never presses it. A tap is untouched (the slop is 8px).

const SLOP = 8;

/** Swallow the next click anywhere (capture), once: the release of a drag
 * that began on a button. */
function swallowClick() {
  const stop = (event: Event) => {
    event.preventDefault();
    event.stopPropagation();
  };
  window.addEventListener("click", stop, { capture: true, once: true });
  // A drag that ends off any target fires no click: drop the listener.
  setTimeout(() => window.removeEventListener("click", stop, true), 0);
}

/** A rubber band past an end: the further, the stiffer. */
const rubber = (over: number, size: number) =>
  (over * size * 0.55) / (size + over * 0.55);

/** Velocity in px/ms from the last few moves. */
class Tracker {
  private points: { at: number; v: number }[] = [];
  add(v: number) {
    const at = performance.now();
    this.points.push({ at, v });
    while (this.points.length > 2 && at - this.points[0].at > 90)
      this.points.shift();
  }
  speed() {
    const first = this.points[0];
    const last = this.points[this.points.length - 1];
    if (!first || !last || last.at === first.at) return 0;
    return (last.v - first.v) / (last.at - first.at);
  }
}

/** Pull the sheet down to dismiss it. `handles` are the parts that take
 * the gesture (the grabber and the header); the sheet's pages scroll. The
 * scrim's opacity follows through `--pull` (0 at rest, 1 off screen) on
 * `root`. */
export function useSheetDrag(
  sheet: RefObject<HTMLElement | null>,
  root: RefObject<HTMLElement | null>,
  handles: RefObject<HTMLElement | null>[],
  onDismiss: () => void,
) {
  const dismiss = useRef(onDismiss);
  dismiss.current = onDismiss;
  useEffect(() => {
    const el = sheet.current;
    const host = root.current;
    if (!el || !host) return;
    let start: { x: number; y: number; id: number } | null = null;
    let dragging = false;
    let offset = 0;
    const track = new Tracker();
    const set = (y: number, settle?: string) => {
      el.style.transition = settle ?? "none";
      el.style.transform = y ? `translate3d(0, ${y}px, 0)` : "";
      host.style.setProperty(
        "--pull",
        String(Math.max(0, Math.min(1, y / el.offsetHeight))),
      );
    };
    const down = (event: PointerEvent) => {
      if (event.button !== 0 || start) return;
      start = { x: event.clientX, y: event.clientY, id: event.pointerId };
      dragging = false;
      offset = 0;
    };
    const move = (event: PointerEvent) => {
      if (!start || event.pointerId !== start.id) return;
      const dy = event.clientY - start.y;
      const dx = event.clientX - start.x;
      if (!dragging) {
        if (Math.abs(dy) < SLOP || Math.abs(dy) < Math.abs(dx)) return;
        dragging = true;
        (event.currentTarget as HTMLElement).setPointerCapture?.(
          event.pointerId,
        );
        el.classList.add("dragging");
      }
      offset = dy >= 0 ? dy : -rubber(-dy, el.offsetHeight);
      track.add(event.clientY);
      set(offset);
    };
    const up = (event: PointerEvent) => {
      if (!start || event.pointerId !== start.id) return;
      start = null;
      if (!dragging) return;
      dragging = false;
      el.classList.remove("dragging");
      swallowClick();
      const v = event.type === "pointercancel" ? 0 : track.speed();
      const far = offset > el.offsetHeight * 0.28;
      if ((far && v > -0.2) || v > 0.55) {
        // Off it goes, at least as fast as the flick.
        const left = el.offsetHeight + 24 - offset;
        const ms = stillMotion()
          ? 0
          : Math.max(140, Math.min(320, left / Math.max(v, 1.4)));
        set(
          el.offsetHeight + 24,
          `transform ${ms}ms cubic-bezier(0.2, 0.7, 0.4, 1)`,
        );
        dismiss.current();
        return;
      }
      set(
        0,
        stillMotion() ? "none" : `transform ${SHEET.ms}ms ${SHEET.easing}`,
      );
    };
    const targets = handles
      .map((h) => h.current)
      .filter((h): h is HTMLElement => !!h);
    for (const h of targets) {
      h.addEventListener("pointerdown", down);
      h.addEventListener("pointermove", move);
      h.addEventListener("pointerup", up);
      h.addEventListener("pointercancel", up);
    }
    return () => {
      for (const h of targets) {
        h.removeEventListener("pointerdown", down);
        h.removeEventListener("pointermove", move);
        h.removeEventListener("pointerup", up);
        h.removeEventListener("pointercancel", up);
      }
    };
  }, [sheet, root, handles]);
}

/** Swipe between pages. `viewport` is the clipping box and `track` the row
 * of pages (CSS places it from `--page`, the index, plus `--pager-x`, the
 * finger's offset). `--pos`, the fractional page, goes on `root` for the
 * dock's indicator. `go` is called with the page to settle on. */
export function usePager(
  viewport: RefObject<HTMLElement | null>,
  track: RefObject<HTMLElement | null>,
  root: RefObject<HTMLElement | null>,
  index: number,
  count: number,
  go: (index: number) => void,
) {
  const state = useRef({ index, count, go });
  state.current = { index, count, go };
  useEffect(() => {
    const view = viewport.current;
    const row = track.current;
    const host = root.current;
    if (!view || !row || !host) return;
    let start: { x: number; y: number; id: number } | null = null;
    let dragging = false;
    let dx = 0;
    const tracker = new Tracker();
    const place = (x: number, settle: boolean) => {
      row.style.transition = settle
        ? stillMotion()
          ? "none"
          : `transform ${PAGE.ms}ms ${PAGE.easing}`
        : "none";
      row.style.setProperty("--pager-x", `${x}px`);
      host.style.setProperty(
        "--pos",
        String(state.current.index - x / Math.max(1, view.clientWidth)),
      );
      host.classList.toggle("paging", !settle);
    };
    const down = (event: PointerEvent) => {
      if (event.button !== 0 || start) return;
      start = { x: event.clientX, y: event.clientY, id: event.pointerId };
      dragging = false;
      dx = 0;
    };
    const move = (event: PointerEvent) => {
      if (!start || event.pointerId !== start.id) return;
      const mx = event.clientX - start.x;
      const my = event.clientY - start.y;
      if (!dragging) {
        if (Math.abs(mx) < SLOP || Math.abs(mx) < Math.abs(my) * 1.2) return;
        dragging = true;
        view.setPointerCapture?.(event.pointerId);
      }
      const { index: at, count: n } = state.current;
      const w = view.clientWidth;
      dx = mx;
      if ((at === 0 && dx > 0) || (at === n - 1 && dx < 0))
        dx = Math.sign(dx) * rubber(Math.abs(dx), w);
      tracker.add(event.clientX);
      place(dx, false);
    };
    const up = (event: PointerEvent) => {
      if (!start || event.pointerId !== start.id) return;
      start = null;
      if (!dragging) return;
      dragging = false;
      swallowClick();
      const { index: at, count: n, go: to } = state.current;
      const w = view.clientWidth;
      const v = event.type === "pointercancel" ? 0 : tracker.speed();
      let next = at;
      if ((dx < -w * 0.22 && v < 0.3) || v < -0.45)
        next = Math.min(n - 1, at + 1);
      else if ((dx > w * 0.22 && v > -0.3) || v > 0.45)
        next = Math.max(0, at - 1);
      // Settle: the index moves and the finger's offset goes back to 0 in
      // one transition, so the page glides on from where it was let go.
      state.current.index = next;
      place(0, true);
      if (next !== at) to(next);
    };
    view.addEventListener("pointerdown", down);
    view.addEventListener("pointermove", move);
    view.addEventListener("pointerup", up);
    view.addEventListener("pointercancel", up);
    return () => {
      view.removeEventListener("pointerdown", down);
      view.removeEventListener("pointermove", move);
      view.removeEventListener("pointerup", up);
      view.removeEventListener("pointercancel", up);
    };
  }, [viewport, track, root]);
  // A tab tapped, or the page opened from outside: glide there.
  useEffect(() => {
    const row = track.current;
    const host = root.current;
    if (!row || !host) return;
    row.style.transition = stillMotion()
      ? "none"
      : `transform ${PAGE.ms}ms ${PAGE.easing}`;
    row.style.setProperty("--pager-x", "0px");
    host.style.setProperty("--pos", String(index));
  }, [index, track, root]);
}
