import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";
import { stillMotion } from "../../presentation/motion";
import { PAGE, SHEET } from "./spring";

// The tray's two gestures, on native listeners so a drag never re-renders
// React: the sheet pulled down to put it away, and the pages swiped
// sideways. Both follow the finger 1:1, rubber-band past their ends, and on
// release read the flick's speed as well as its distance. A gesture that
// moved swallows the click that follows, so a swipe that starts on a
// button never presses it. A tap is untouched (the slop is 8px).
//
// Performance (2026-11-16, owner: "choppy and low fps" on an iPhone): a
// frame of a drag writes one `transform` (and the scrim's `opacity`)
// straight onto the element that moves, never an inherited custom property
// on the dialog (that restyled every element in the sheet each frame). The
// sizes a drag needs are read once, when it starts, so no write is followed
// by a read in the same frame (a forced layout). Moves are coalesced to one
// write per animation frame. Everything that moves is its own compositor
// layer (`will-change` in tray.css), so a frame is a recomposite, not a
// repaint.

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
  reset() {
    this.points = [];
  }
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

/** One write per frame: the latest value wins. */
function frameWriter(write: () => void) {
  let raf = 0;
  return {
    schedule() {
      if (!raf)
        raf = requestAnimationFrame(() => {
          raf = 0;
          write();
        });
    },
    /** Write now (a release), dropping a frame still pending. */
    flush() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      write();
    },
    cancel() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    },
  };
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
 * or pen from pointer events. The scrim fades with the pull; `root`
 * carries `pulling` while the sheet is held. */
export function useSheetDrag(
  sheet: RefObject<HTMLElement | null>,
  scrim: RefObject<HTMLElement | null>,
  root: RefObject<HTMLElement | null>,
  onDismiss: () => void,
) {
  const dismiss = useRef(onDismiss);
  dismiss.current = onDismiss;
  useEffect(() => {
    const el = sheet.current;
    const shade = scrim.current;
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
    let height = 1;
    const track = new Tracker();
    const paint = (y: number) => {
      el.style.transform = y ? `translate3d(0, ${y}px, 0)` : "";
      if (shade)
        shade.style.opacity = String(
          1 - Math.max(0, Math.min(1, y / height)) * 0.9,
        );
    };
    const frame = frameWriter(() => paint(offset));
    const settle = (y: number, transition: string) => {
      frame.cancel();
      el.style.transition = transition;
      if (shade)
        shade.style.transition = transition.replace("transform", "opacity");
      paint(y);
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
        // Read once, before any write this gesture makes.
        height = Math.max(1, el.offsetHeight);
        track.reset();
        el.style.transition = "none";
        if (shade) shade.style.transition = "none";
        host.classList.add("pulling");
        el.classList.add("dragging");
        return true;
      }
      if (Math.abs(dy) >= SLOP) start.mode = "other";
      return false;
    };
    const follow = (dy: number, y: number) => {
      offset = dy >= 0 ? dy : -rubber(-dy, height);
      track.add(y);
      frame.schedule();
    };
    const release = (cancelled: boolean) => {
      const was = start;
      start = null;
      if (!was || was.mode !== "pull") return;
      host.classList.remove("pulling");
      el.classList.remove("dragging");
      swallowClick();
      const v = cancelled ? 0 : track.speed();
      const far = offset > height * 0.25;
      if ((far && v > -0.2) || v > 0.5) {
        // Off it goes, at least as fast as the flick.
        const left = height + 24 - offset;
        const ms = stillMotion()
          ? 0
          : Math.max(140, Math.min(320, left / Math.max(v, 1.4)));
        settle(
          height + 24,
          ms ? `transform ${ms}ms cubic-bezier(0.2, 0.7, 0.4, 1)` : "none",
        );
        dismiss.current();
        return;
      }
      settle(
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
      const id = start.id;
      let t: Touch | undefined;
      for (const c of event.changedTouches) if (c.identifier === id) t = c;
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
      const id = start.id;
      let ended = false;
      for (const c of event.changedTouches)
        if (c.identifier === id) ended = true;
      if (ended) release(event.type === "touchcancel");
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
    el.addEventListener("touchstart", touchStart, { passive: true });
    el.addEventListener("touchmove", touchMove, { passive: false });
    el.addEventListener("touchend", touchEnd);
    el.addEventListener("touchcancel", touchEnd);
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    return () => {
      frame.cancel();
      el.removeEventListener("touchstart", touchStart);
      el.removeEventListener("touchmove", touchMove);
      el.removeEventListener("touchend", touchEnd);
      el.removeEventListener("touchcancel", touchEnd);
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
    };
  }, [sheet, scrim, root]);
}

/** Where the track and the dock's lamp sit for page `at` and a finger
 * offset of `dx` px over a page `width` px wide. */
const trackAt = (at: number, dx = 0) =>
  dx
    ? `translate3d(calc(${-at * 100}% + ${dx}px), 0, 0)`
    : `translate3d(${-at * 100}%, 0, 0)`;
const lampAt = (pos: number) =>
  `translate3d(calc(${pos} * (100% + 4px)), 0, 0)`;

/** Swipe between pages. `viewport` is the clipping box, `track` the row of
 * pages and `lamp` the dock's indicator; both are moved by `transform`
 * alone. `go` is called with the page to settle on. A tab tapped moves the
 * track too: a neighbour slides on the page spring, a page further away is
 * a quick crossfade (sliding past the pages between would draw them all).
 * `root` carries `paging` while a swipe is held. */
export function usePager(
  viewport: RefObject<HTMLElement | null>,
  track: RefObject<HTMLElement | null>,
  lamp: RefObject<HTMLElement | null>,
  root: RefObject<HTMLElement | null>,
  index: number,
  count: number,
  go: (index: number) => void,
) {
  const state = useRef({ index, count, go });
  state.current = { index, count, go };
  const shown = useRef(index);
  useEffect(() => {
    const view = viewport.current;
    const row = track.current;
    const host = root.current;
    if (!view || !row || !host) return;
    let start: { x: number; y: number; id: number } | null = null;
    let dragging = false;
    let dx = 0;
    let width = 1;
    const tracker = new Tracker();
    const frame = frameWriter(() => {
      const at = state.current.index;
      row.style.transform = trackAt(at, dx);
      if (lamp.current) lamp.current.style.transform = lampAt(at - dx / width);
    });
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
        // Read once, before any write this swipe makes.
        width = Math.max(1, view.clientWidth);
        tracker.reset();
        row.style.transition = "none";
        if (lamp.current) lamp.current.style.transition = "none";
        host.classList.add("paging");
        view.setPointerCapture?.(event.pointerId);
      }
      const { index: at, count: n } = state.current;
      dx = mx;
      if ((at === 0 && dx > 0) || (at === n - 1 && dx < 0))
        dx = Math.sign(dx) * rubber(Math.abs(dx), width);
      tracker.add(event.clientX);
      frame.schedule();
    };
    const up = (event: PointerEvent) => {
      if (!start || event.pointerId !== start.id) return;
      start = null;
      if (!dragging) return;
      dragging = false;
      swallowClick();
      host.classList.remove("paging");
      const { index: at, count: n, go: to } = state.current;
      const v = event.type === "pointercancel" ? 0 : tracker.speed();
      let next = at;
      if ((dx < -width * 0.22 && v < 0.3) || v < -0.45)
        next = Math.min(n - 1, at + 1);
      else if ((dx > width * 0.22 && v > -0.3) || v > 0.45)
        next = Math.max(0, at - 1);
      frame.cancel();
      // Settle: the page glides on from where it was let go.
      const ease = stillMotion()
        ? "none"
        : `transform ${PAGE.ms}ms ${PAGE.easing}`;
      row.style.transition = ease;
      if (lamp.current) lamp.current.style.transition = ease;
      dx = 0;
      shown.current = next;
      state.current.index = next;
      row.style.transform = trackAt(next);
      if (lamp.current) lamp.current.style.transform = lampAt(next);
      if (next !== at) to(next);
    };
    view.addEventListener("pointerdown", down);
    view.addEventListener("pointermove", move);
    view.addEventListener("pointerup", up);
    view.addEventListener("pointercancel", up);
    return () => {
      frame.cancel();
      view.removeEventListener("pointerdown", down);
      view.removeEventListener("pointermove", move);
      view.removeEventListener("pointerup", up);
      view.removeEventListener("pointercancel", up);
    };
  }, [viewport, track, lamp, root]);
  // A tab tapped, or the page opened from outside. Before paint, so the
  // first frame of the sheet already shows the right page.
  useLayoutEffect(() => {
    const row = track.current;
    const view = viewport.current;
    if (!row) return;
    const from = shown.current;
    shown.current = index;
    const still = stillMotion() || from === index;
    const far = Math.abs(index - from) > 1;
    const ease =
      still || far ? "none" : `transform ${PAGE.ms}ms ${PAGE.easing}`;
    row.style.transition = ease;
    row.style.transform = trackAt(index);
    if (lamp.current) {
      lamp.current.style.transition = still
        ? "none"
        : `transform ${PAGE.ms}ms ${PAGE.easing}`;
      lamp.current.style.transform = lampAt(index);
    }
    // A jump past a neighbour: the new page fades in where it is.
    if (far && !still && view)
      view.animate?.([{ opacity: 0.2 }, { opacity: 1 }], {
        duration: 180,
        easing: "ease-out",
      });
  }, [index, track, viewport, lamp]);
}
