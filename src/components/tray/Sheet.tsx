import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";
import { useSheetDrag } from "./gestures";
import { SHEET, sheetAt } from "./spring";
import { stillMotion } from "../../presentation/motion";

// The sheet (2026-11-16): the one surface a crawl's tray and menus rise on,
// built to behave as an iOS sheet does. It rises on a spring, the table
// behind dims, and it goes away by being pulled down: from the grabber,
// the header, anywhere else on it, or from its content once that is
// scrolled to its top. A flick is enough. There is no close button (owner:
// "no need for an x button ... if you can swipe down"); the grabber is
// itself a button named Close, for VoiceOver and keyboards, a tap on the
// dimmed table puts it away, and so does Escape.
//
// A native modal <dialog>: focus stays inside and the table is inert.
// `skin` is the mode's look (`tray-league`, `tray-quest`); the content
// marks its scroller with `data-sheet-scroll`.

/** The most a frame may move the rise on, in ms: two frames at 60 Hz. */
const MAX_STEP = 34;
/** How long the table takes to dim. */
const SCRIM_MS = 260;

export function Sheet({
  skin,
  className = "",
  exiting,
  onClose,
  titleId,
  header,
  footer,
  style,
  focus,
  rootRef,
  children,
}: {
  skin: string;
  className?: string;
  exiting: boolean;
  onClose: () => void;
  /** The element that names the dialog. */
  titleId: string;
  header: ReactNode;
  footer?: ReactNode;
  style?: CSSProperties;
  /** A selector for the element focused when the sheet opens. */
  focus?: string;
  /** The dialog, for content whose gestures need it (the pager). */
  rootRef?: RefObject<HTMLDialogElement | null>;
  children: ReactNode;
}) {
  const own = useRef<HTMLDialogElement>(null);
  const dialog = rootRef ?? own;
  const sheet = useRef<HTMLDivElement>(null);
  const scrim = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const el = dialog.current!;
    el.showModal();
    const first = focus ? el.querySelector<HTMLElement>(focus) : null;
    (first ?? el.querySelector<HTMLElement>(".sheet-grab"))?.focus({
      preventScroll: true,
    });
    return () => {
      el.close();
      previous?.focus({ preventScroll: true });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // The rise (2026-11-16, owner on an iPhone: menus "snap up to like the
  // middle of the screen, freeze, then drag up"). Opening a modal dialog
  // stalls WebKit while it restyles the page and paints the sheet (450 to
  // 900 ms in emulated WebKit; shorter on a phone, but felt). A rise timed
  // by the clock, CSS or Web Animations, ran on through that stall, so the
  // first frame shown was half-way up with the sheet's unpainted tiles
  // showing as a gap. So the sheet is painted where it rests, all but
  // transparent (not 0, which WebKit may skip painting), and the rise is
  // stepped one frame at a time from the spring, never more than
  // `MAX_STEP` a frame: a stalled frame holds the sheet where it was
  // instead of jumping it ahead. Inline styles only, so nothing but the
  // sheet and the scrim restyle. A pull or a close takes over at once.
  useLayoutEffect(() => {
    const el = sheet.current!;
    const shade = scrim.current;
    const host = dialog.current!;
    if (stillMotion()) return;
    el.style.opacity = "0.002";
    if (shade) shade.style.opacity = "0.002";
    let raf = 0;
    let t = 0;
    let last = 0;
    const step = (now: number) => {
      if (
        host.classList.contains("pulling") ||
        host.classList.contains("closing")
      ) {
        if (shade && !host.classList.contains("pulling"))
          shade.style.opacity = "";
        return;
      }
      t += Math.min(now - last, MAX_STEP);
      last = now;
      if (t >= SHEET.ms) {
        el.style.transform = "";
        if (shade) shade.style.opacity = "";
        return;
      }
      el.style.transform = `translate3d(0, ${(1 - sheetAt(t / 1000)) * 100}%, 0)`;
      if (shade) shade.style.opacity = String(Math.min(1, t / SCRIM_MS));
      raf = requestAnimationFrame(step);
    };
    // Two frames: the first is the stall's, the second is shown after it.
    raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame((now) => {
        el.style.transform = "translate3d(0, 100%, 0)";
        el.style.opacity = "";
        if (shade) shade.style.opacity = "0";
        last = now;
        raf = requestAnimationFrame(step);
      });
    });
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Pulled off screen by the gesture: the close holds it there instead of
  // playing the fall from the top.
  const [pulled, setPulled] = useState(false);
  useSheetDrag(sheet, scrim, dialog, () => {
    setPulled(true);
    onClose();
  });
  return (
    <dialog
      ref={dialog}
      className={`tray ${skin} ${className}${exiting ? " closing" : ""}${pulled ? " pulled" : ""}`}
      inert={exiting || undefined}
      aria-labelledby={titleId}
      style={
        {
          "--sheet-ease": SHEET.easing,
          "--sheet-ms": `${SHEET.ms}ms`,
          ...style,
        } as CSSProperties
      }
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      {/* The table behind, dimmed; a tap on it puts the sheet away. */}
      <div
        ref={scrim}
        className="tray-scrim"
        aria-hidden="true"
        onClick={onClose}
      />
      <div ref={sheet} className="tray-sheet">
        <div className="tray-edge" aria-hidden="true" />
        <button
          type="button"
          className="sheet-grab"
          aria-label="Close"
          onClick={onClose}
        >
          <i aria-hidden="true" />
        </button>
        <header className="tray-head">{header}</header>
        {children}
        {footer}
      </div>
    </dialog>
  );
}
