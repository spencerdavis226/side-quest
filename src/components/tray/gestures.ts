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

/** The scroller a gesture starts in (a page, a menu's list), if any. */
const scrollerOf = (target: EventTarget | null) =>
  target instanceof Element
    ? target.closest<HTMLElement>("[data-sheet-scroll]")
    : null;

/** Pull the sheet down to dismiss it, as an iOS sheet does: from anywhere on
 * it (the grabber, the header, the dock), and from a page's content when
 * that page is scrolled to its top. A pull that starts while a page is
 * scrolled down is the page's own scroll; a sideways drag is the pager's.
 * Touch is read from touch events, so the pull can stop the page's native
 * scroll and bounce (`preventDefault` on a non-passive touchmove); a mouse
 * or pen from pointer events. The scrim follows through `--pull` (0 at
 * rest, 1 off screen) on `root`, and `root` carries `pulling` while the
 * sheet is held. */
export function useSheetDrag(
  sheet: RefObject<HTMLElement | null>,
  root: RefObject<HTMLElement | null>,
  onDismiss: () => void,
) {
  const dismiss = useRef(onDismiss);
  dismiss.current = onDismiss;
  useEffect(() => {
    const el = sheet.current;
    const host = root.current;
    if (!el || !host) return;
    type Mode = "wait" | "pull" | "other";
    let start: {
      x: number;
      y: number;
      id: number;
      top: boolean;
      mode: Mode;
    } | null = null;
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
    const begin = (
      x: number,
      y: number,
      id: number,
      target: EventTarget | null,
    ) => {
      const scroller = scrollerOf(target);
      start = {
        x,
        y,
        id,
        top: !scroller || scroller.scrollTop <= 0,
        mode: "wait",
      };
      offset = 0;
    };
    /** Decide what a move is; true once it is the sheet's pull. */
    const decide = (dx: number, dy: number) => {
      if (!start) return false;
      if (start.mode !== "wait") return start.mode === "pull";
      if (host.classList.contains("paging")) {
        start.mode = "other";
        return false;
      }
      if (Math.abs(dx) >= SLOP && Math.abs(dx) > Math.abs(dy)) {
        start.mode = "other";
        return false;
      }
      if (dy >= SLOP && dy > Math.abs(dx) && start.top) {
        start.mode = "pull";
        host.classList.add("pulling");
        el.classList.add("dragging");
        return true;
      }
      if (Math.abs(dy) >= SLOP) start.mode = "other";
      return false;
    };
    const follow = (dy: number, y: number) => {
      offset = dy >= 0 ? dy : -rubber(-dy, el.offsetHeight);
      track.add(y);
      set(offset);
    };
    const release = (cancelled: boolean) => {
      const was = start;
      start = null;
      if (!was || was.mode !== "pull") return;
      host.classList.remove("pulling");
      el.classList.remove("dragging");
      swallowClick();
      const v = cancelled ? 0 : track.speed();
      const far = offset > el.offsetHeight * 0.25;
      if ((far && v > -0.2) || v > 0.5) {
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

    // Touch: the pull takes the gesture from the page's scroll.
    const touchStart = (event: TouchEvent) => {
      if (start || event.touches.length !== 1) return;
      const t = event.touches[0];
      begin(t.clientX, t.clientY, t.identifier, event.target);
    };
    const touchMove = (event: TouchEvent) => {
      if (!start) return;
      const t = [...event.changedTouches].find(
        (c) => c.identifier === start!.id,
      );
      if (!t) return;
      const dx = t.clientX - start.x;
      const dy = t.clientY - start.y;
      // At a page's top, a downward move is the sheet's before it is
      // decided, so the page never starts its bounce.
      if (start.mode === "wait" && start.top && dy > 0 && dy >= Math.abs(dx))
        event.preventDefault();
      if (!decide(dx, dy)) return;
      event.preventDefault();
      follow(dy, t.clientY);
    };
    const touchEnd = (event: TouchEvent) => {
      if (!start) return;
      if (![...event.changedTouches].some((c) => c.identifier === start!.id))
        return;
      release(event.type === "touchcancel");
    };
    // A mouse or a pen: pointer events (touch pointers are handled above).
    const down = (event: PointerEvent) => {
      if (event.pointerType === "touch" || event.button !== 0 || start) return;
      begin(event.clientX, event.clientY, event.pointerId, event.target);
    };
    const move = (event: PointerEvent) => {
      if (!start || event.pointerId !== start.id) return;
      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;
      const was = start.mode;
      if (!decide(dx, dy)) return;
      if (was === "wait") el.setPointerCapture?.(event.pointerId);
      follow(dy, event.clientY);
    };
    const up = (event: PointerEvent) => {
      if (!start || event.pointerId !== start.id) return;
      release(event.type === "pointercancel");
    };
    const opts = { passive: false } as const;
    el.addEventListener("touchstart", touchStart, { passive: true });
    el.addEventListener("touchmove", touchMove, opts);
    el.addEventListener("touchend", touchEnd);
    el.addEventListener("touchcancel", touchEnd);
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    return () => {
      el.removeEventListener("touchstart", touchStart);
      el.removeEventListener("touchmove", touchMove);
      el.removeEventListener("touchend", touchEnd);
      el.removeEventListener("touchcancel", touchEnd);
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
    };
  }, [sheet, root]);
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
        if (host.classList.contains("pulling")) return;
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
