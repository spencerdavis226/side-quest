import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { CardDefinition, SessionState } from "../game/types";
import { natural } from "../game/engine";
import type { CrawlTheme } from "./crawlTheme";

// Pub Crawl's flourishes (2026-10-31, owner: "make this mode feel premium
// and unique ... excitement and variety", no new systems). Display only:
// nothing here is saved, and a resumed game never replays one.

/** How long the natural 20 or 1 flash stays up (`natural-burst` in
 * crawl.css), plus a little. */
const BURST_MS = 1500;

/** A natural 20 or 1, flashed over the table the moment the dice land on
 * one: gold rays and the word for a 20, a red crack for a 1. Fires once per
 * roll, only for a roll made while the table watched (a reload shows the
 * result on the card and nothing else). The card's own result line already
 * says "Natural 20!", so this is `aria-hidden`. */
export function NaturalBurst({
  session,
  card,
  theme,
}: {
  session: SessionState;
  card: CardDefinition;
  theme: CrawlTheme;
}) {
  const words = theme.flourish?.naturals;
  const nat =
    words && session.phase === "revealed" && session.roll?.returned
      ? natural(card, session.roll)
      : null;
  const party = session.quest?.party;
  // One roll: the draw, the boss's swing and the push-your-luck pull.
  const key = nat
    ? `${nat}:${session.discarded}:${party?.hits ?? 0}:${party?.press ?? 0}`
    : null;
  // A game resumed on a natural starts with it seen.
  const seen = useRef(key);
  const [shown, setShown] = useState<{ key: string; nat: 20 | 1 } | null>(null);
  useEffect(() => {
    if (key && nat && key !== seen.current) setShown({ key, nat });
    seen.current = key;
  }, [key, nat]);
  useEffect(() => {
    if (!shown) return;
    const id = setTimeout(() => setShown(null), BURST_MS);
    return () => clearTimeout(id);
  }, [shown]);
  if (!shown || !words) return null;
  const crit = shown.nat === 20;
  return createPortal(
    <div
      key={shown.key}
      className={`natural-burst ${crit ? "crit" : "fumble"}`}
      aria-hidden="true"
    >
      {crit && <span className="natural-rays" />}
      <span className="natural-word">
        <small>{(crit ? words[0] : words[1]).replace(/\s*\d+$/, "")}</small>
        <strong>{shown.nat}</strong>
      </span>
    </div>,
    document.body,
  );
}

/** The rubber stamp slammed across a boss's card on the swing that fells
 * it ("Felled"). It sits on the face, so it turns and leaves with the card. */
export function FelledStamp({ word }: { word: string }) {
  return (
    <span className="felled-stamp" aria-hidden="true">
      {word}
    </span>
  );
}
