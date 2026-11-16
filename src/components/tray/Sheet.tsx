import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";
import { useSheetDrag } from "./gestures";
import { SHEET } from "./spring";

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
  // Pulled off screen by the gesture: the close holds it there instead of
  // playing the fall from the top.
  const [pulled, setPulled] = useState(false);
  useSheetDrag(sheet, dialog, () => {
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
      <div className="tray-scrim" aria-hidden="true" onClick={onClose} />
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
