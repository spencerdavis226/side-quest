import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import type { Loot, SessionState } from "../../game/types";
import { type BagDrop, canUseLoot } from "../../game/engine";
import { haptic } from "../../app/haptics";
import { CrawlIcon } from "../Crawl";
import { lootDoes, type CrawlTheme } from "../crawlTheme";

// The tray's inventory, shared by both skins (each paints it its own way):
// the satchel as a grid of slots, one per place in it, and an inspector
// under the grid for the item picked. A game's inventory screen: tap a
// slot to read it, then use or drop it from the inspector. The first item
// that can be used now is picked when the page opens, so the common case
// (drink the potion) is one tap.

/** Two taps to let something go: the first asks, in place ("Keep" or the
 * verb), and the question settles back after four seconds. */
export function ConfirmDrop({
  verb,
  name,
  onConfirm,
  className = "",
}: {
  verb: string;
  name: string;
  onConfirm: () => void;
  className?: string;
}) {
  const [sure, setSure] = useState(false);
  useEffect(() => {
    if (!sure) return;
    const timer = setTimeout(() => setSure(false), 4000);
    return () => clearTimeout(timer);
  }, [sure]);
  const lower = verb.toLowerCase();
  if (!sure)
    return (
      <button
        type="button"
        className={`tray-btn tray-btn-quiet drop-ask ${className}`}
        aria-label={`${verb} ${name}`}
        onClick={(event) => {
          event.currentTarget.focus();
          setSure(true);
        }}
      >
        {verb}
      </button>
    );
  return (
    <span className={`drop-sure ${className}`} role="group">
      <span className="drop-question" aria-hidden="true">
        {verb} {name}?
      </span>
      <button
        type="button"
        className="tray-btn tray-btn-quiet"
        onClick={() => setSure(false)}
      >
        Keep
      </button>
      <button
        type="button"
        className="tray-btn tray-btn-danger"
        aria-label={`Yes, ${lower} ${name}`}
        onClick={() => {
          haptic();
          onConfirm();
        }}
      >
        {verb}
      </button>
    </span>
  );
}

/** Whether an item is used from the tray itself (the potion, the candy);
 * the others work from the card in play. */
const trayUsable = (session: SessionState, item: Loot) =>
  (item === "draught" || item === "candy") && canUseLoot(session, item);

/** The satchel's slots and the inspector. */
export function ItemGrid({
  session,
  theme,
  size,
  onSpend,
  onDrop,
  note,
}: {
  session: SessionState;
  theme: CrawlTheme;
  /** The satchel's places (empty ones show as empty slots). */
  size: number;
  onSpend: (item: Loot) => void;
  onDrop: (drop: BagDrop) => void;
  /** A line under the inspector when nothing is picked. */
  note?: ReactNode;
}) {
  const party = session.quest!.party!;
  const items = party.loot;
  const ready = items.findIndex((item) => trayUsable(session, item));
  const [picked, setPicked] = useState(ready >= 0 ? ready : 0);
  // An item used or dropped: keep the pick on a real slot.
  const at = Math.min(picked, Math.max(0, items.length - 1));
  const item = items[at] as Loot | undefined;
  const places = Math.max(size, items.length);
  return (
    <div className="inv">
      <ul
        className="inv-grid satchel"
        aria-label={theme.words.Satchel}
        style={{ "--slots": places } as CSSProperties}
      >
        {Array.from({ length: places }, (_, i) => {
          const here = items[i];
          if (!here)
            return (
              <li key={`empty-${i}`} className="inv-cell satchel-slot empty">
                <span className="inv-slot" aria-hidden="true">
                  <span className="inv-socket" />
                </span>
                <span className="inv-name muted">Empty</span>
              </li>
            );
          const name = theme.loot[here].name;
          const usable = trayUsable(session, here);
          return (
            <li key={`${here}-${i}`} className="inv-cell satchel-slot">
              <button
                type="button"
                className={`inv-slot item-${here}${i === at ? " picked" : ""}${usable ? " ready" : ""}`}
                aria-pressed={i === at}
                aria-label={`${name}${usable ? ", ready" : ""}`}
                onClick={() => setPicked(i)}
              >
                <span className="inv-socket" aria-hidden="true">
                  <CrawlIcon name={here} theme={theme} />
                </span>
                {usable && <i className="inv-ready" aria-hidden="true" />}
              </button>
              <span className="inv-name" aria-hidden="true">
                {name}
              </span>
            </li>
          );
        })}
      </ul>
      <div className="inv-inspect" aria-live="polite">
        {item ? (
          <>
            <span className={`inspect-mark item-${item}`} aria-hidden="true">
              <CrawlIcon name={item} theme={theme} />
            </span>
            <div className="inspect-words">
              <h4 className="inspect-name">{theme.loot[item].name}</h4>
              <p className="inspect-does">
                {lootDoes(theme, item, session.quest)}
              </p>
              {!trayUsable(session, item) && (
                <p className="inspect-when">
                  {item === "draught" || item === "candy"
                    ? item === "draught" && party.hearts >= party.max
                      ? `${theme.words.Hearts} are full.`
                      : "Not now."
                    : "Played from the card when it can help."}
                </p>
              )}
            </div>
            <div className="inspect-actions">
              {trayUsable(session, item) && (
                <button
                  type="button"
                  className="tray-btn tray-btn-primary satchel-use"
                  onClick={() => {
                    haptic();
                    onSpend(item);
                  }}
                >
                  {item === "candy" ? theme.eat : theme.drink}
                </button>
              )}
              <ConfirmDrop
                key={`${item}-${at}`}
                verb="Drop"
                name={theme.loot[item].name}
                onConfirm={() => onDrop({ item })}
              />
            </div>
          </>
        ) : (
          <p className="inspect-empty">
            {note ?? `Nothing in the ${theme.words.Satchel.toLowerCase()}.`}
          </p>
        )}
      </div>
    </div>
  );
}

/** A section of a page: a small engraved heading and its body. Shared by
 * both skins so their pages keep one rhythm. */
export function Section({
  title,
  aside,
  children,
  className = "",
}: {
  title: string;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`tray-section ${className}`}>
      <h3 className="tray-heading">
        <span>{title}</span>
        {aside != null && <small>{aside}</small>}
      </h3>
      {children}
    </section>
  );
}
