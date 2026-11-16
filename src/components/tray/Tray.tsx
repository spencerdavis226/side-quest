import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import type { Loot, SessionState } from "../../game/types";
import type { BagDrop } from "../../game/engine";
import { haptic } from "../../app/haptics";
import { trayKind, trayPages, type TrayTab } from "../trayTabs";
import { usePager } from "./gestures";
import { Sheet } from "./Sheet";
import { DockIcon } from "./marks";
import { LeagueHead, LeaguePage } from "./LeagueTray";
import { QuestHead, QuestPage } from "./QuestTray";
import "../../presentation/tray.css";
import "../../presentation/tray-league.css";
import "../../presentation/tray-quest.css";

// The tray (2026-11-16): a sheet that rises from the foot of the screen
// with a page for each thing the party carries. One shell, two skins: the
// League's Trainer Gear (a red device with a lit screen) and the Quest's
// journal (tooled leather, parchment, brass). The shell owns the sheet,
// the gestures and the dock; each skin owns its header and its pages.
//
// Behaviour:
// - Opens on the page the HUD segment or the hearts stud asked for.
// - It rises on `Sheet`: pulled down from anywhere (a page from its top)
//   to put it away, a flick enough, no close button.
// - Swipe the pages sideways; tap a tab on the dock (arrow keys move
//   between tabs, Escape closes).
// - The page shown names the dialog, so "Bag", "The party" and the rest
//   read as before.

export interface TrayProps {
  session: SessionState;
  /** The page asked for. */
  open: TrayTab;
  exiting: boolean;
  onClose: () => void;
  onSpend: (item: Loot) => void;
  onDrop: (drop: BagDrop) => void;
}

export default function Tray({
  session,
  open,
  exiting,
  onClose,
  onSpend,
  onDrop,
}: TrayProps) {
  const kind = trayKind(session);
  const pages = trayPages(session);
  const ids = pages.map((p) => p.id).join(",");
  const [index, setIndex] = useState(() =>
    Math.max(
      0,
      pages.findIndex((p) => p.id === open),
    ),
  );
  // Asked for another page while open (or the page list changed under it,
  // as when the rival is introduced): follow the ask.
  useEffect(() => {
    const at = pages.findIndex((p) => p.id === open);
    if (at >= 0) setIndex(at);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, ids]);
  const at = Math.min(index, pages.length - 1);
  const page = pages[at];

  const dialog = useRef<HTMLDialogElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const go = useCallback((i: number) => setIndex(i), []);
  usePager(viewport, track, dialog, at, pages.length, go);

  const choose = (i: number) => {
    if (i === at) return;
    haptic();
    setIndex(i);
  };
  const keys = (event: KeyboardEvent) => {
    const step =
      event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    const to =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? pages.length - 1
          : at + step;
    if ((!step && event.key !== "Home" && event.key !== "End") || to < 0)
      return;
    if (to >= pages.length) return;
    event.preventDefault();
    setIndex(to);
    dialog.current
      ?.querySelector<HTMLElement>(`#${CSS.escape(tabId(pages[to].id))}`)
      ?.focus();
  };

  const uid = useId().replace(/:/g, "");
  const tabId = (id: TrayTab) => `tray-tab-${uid}-${id}`;
  const panelId = (id: TrayTab) => `tray-panel-${uid}-${id}`;
  const titleId = `tray-title-${uid}`;

  if (!page) return null;
  const Head = kind === "league" ? LeagueHead : QuestHead;
  const Page = kind === "league" ? LeaguePage : QuestPage;
  return (
    <Sheet
      skin={`tray-${kind}`}
      rootRef={dialog}
      exiting={exiting}
      onClose={onClose}
      titleId={titleId}
      focus='[role="tab"][aria-selected="true"]'
      style={
        {
          "--pages": pages.length,
          "--page": at,
          "--pos": at,
        } as CSSProperties
      }
      header={<Head session={session} page={page} titleId={titleId} />}
      footer={
        <nav className="tray-dock" aria-label="Tray pages">
          <div role="tablist" aria-orientation="horizontal" onKeyDown={keys}>
            <span className="dock-lamp" aria-hidden="true" />
            {pages.map((p, i) => (
              <button
                key={p.id}
                id={tabId(p.id)}
                type="button"
                role="tab"
                aria-selected={i === at}
                aria-controls={panelId(p.id)}
                tabIndex={i === at ? 0 : -1}
                className={`dock-tab tab-${p.id}${p.alert ? " alert" : ""}`}
                onClick={() => choose(i)}
              >
                <DockIcon kind={kind} id={p.id} />
                <span className="dock-label">{p.short}</span>
                {p.count && (
                  <span className="dock-count" aria-hidden="true">
                    {p.count}
                  </span>
                )}
                {p.alert && <i className="dock-alert" aria-hidden="true" />}
              </button>
            ))}
          </div>
        </nav>
      }
    >
      <div ref={viewport} className="tray-viewport">
        <div ref={track} className="tray-track">
          {pages.map((p, i) => (
            <section
              key={p.id}
              id={panelId(p.id)}
              role="tabpanel"
              aria-labelledby={tabId(p.id)}
              className={`tray-page page-${p.id}${i === at ? " shown" : ""}`}
              inert={i !== at || undefined}
              aria-hidden={i !== at || undefined}
              data-sheet-scroll
            >
              {/* Pages more than one away are not drawn until reached. */}
              {Math.abs(i - at) <= 1 && (
                <Page
                  id={p.id}
                  session={session}
                  onSpend={onSpend}
                  onDrop={onDrop}
                />
              )}
            </section>
          ))}
        </div>
      </div>
    </Sheet>
  );
}
