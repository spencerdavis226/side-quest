import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { CardDefinition, SessionState } from "../game/types";
import { bossBeat, hitsNeeded, natural } from "../game/engine";

// Display-only flourishes (Pub Crawl's since 2026-10-31; the natural burst
// in every mode since 2026-11-01, owner). Nothing here is saved, and a
// resumed game never replays one.

/** How long the natural 20 or 1 flash stays up (`natural-burst` in
 * crawl.css), plus a little. */
const BURST_MS = 1700;

/** The cracks a natural 1 splits the screen with, in a 100 x 100 box
 * centred on the number (50, 49): jagged lines run out to every edge. */
const CRACKS = [
  "M50 49 L46 41 L48 34 L42 25 L44 16 L37 0",
  "M50 49 L57 43 L62 44 L68 35 L77 32 L84 21 L100 13",
  "M50 49 L58 52 L66 50 L74 56 L86 55 L100 62",
  "M50 49 L55 58 L53 66 L60 75 L58 87 L64 105",
  "M50 49 L44 57 L38 58 L34 68 L26 75 L22 89 L12 105",
  "M50 49 L41 50 L33 45 L24 48 L14 42 L0 45",
  "M50 49 L43 45 L37 36 L28 33 L20 22 L8 17 L0 9",
  "M62 44 L66 51",
  "M53 66 L47 71 L44 79",
  "M33 45 L31 38 L24 35",
  "M74 56 L77 65 L84 70",
];

/** A natural 20 or 1, flashed over the table the moment the dice land on
 * one, in every mode: gold rays and a stamped 20 for a 20; for a 1 the
 * table cracks like glass, the screen shakes and the 1 splits in two and
 * falls. Fires once per roll, only for a roll made while the table watched
 * (a reload shows the result on the card and nothing else). A crawl's card
 * already says "Natural 20!", and the dice say it elsewhere, so this is
 * `aria-hidden`. */
export function NaturalBurst({
  session,
  card,
}: {
  session: SessionState;
  card: CardDefinition;
}) {
  const nat =
    session.phase === "revealed" && session.roll?.returned
      ? natural(card, session.roll)
      : null;
  const party = session.quest?.party;
  // One roll: the draw, the boss's swing and the push-your-luck pull.
  const key = nat
    ? `${nat}:${session.discarded}:${party?.hits ?? 0}:${party?.press ?? 0}`
    : null;
  // A game resumed on a natural starts with it seen; every natural shown
  // is remembered, so an undo back onto one doesn't play it again.
  const seen = useRef(new Set(key ? [key] : []));
  const [shown, setShown] = useState<{ key: string; nat: 20 | 1 } | null>(null);
  useEffect(() => {
    if (!key || !nat || seen.current.has(key)) return;
    seen.current.add(key);
    setShown({ key, nat });
  }, [key, nat]);
  useEffect(() => {
    if (!shown) return;
    const id = setTimeout(() => setShown(null), BURST_MS);
    return () => clearTimeout(id);
  }, [shown]);
  if (!shown) return null;
  const crit = shown.nat === 20;
  return createPortal(
    <div
      key={shown.key}
      className={`natural-burst ${crit ? "crit" : "fumble"}`}
      aria-hidden="true"
    >
      {crit ? (
        <span className="natural-rays" />
      ) : (
        <svg
          className="natural-cracks"
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid slice"
        >
          {["glow", "line"].map((layer) => (
            <g key={layer} className={layer}>
              {CRACKS.map((d, i) => (
                <path key={i} d={d} />
              ))}
            </g>
          ))}
        </svg>
      )}
      <span className="natural-word">
        <small>Natural</small>
        {crit ? (
          <strong>20</strong>
        ) : (
          <strong className="natural-split">
            <span className="half left">1</span>
            <span className="half right">1</span>
          </strong>
        )}
      </span>
    </div>,
    document.body,
  );
}

/** The rubber stamp slammed over a boss's card on the swing that fells it
 * ("Felled"; the League's "Defeated" or "Badge won"), covering the card's
 * whole text area. It sits on the face, so it turns and leaves with the
 * card. */
export function FelledStamp({ word }: { word: string }) {
  return (
    <span className="felled-stamp" aria-hidden="true">
      <span className="felled-word">{word}</span>
    </span>
  );
}

/** How long a returning boss's tally stays on its card (`boss-tally` in
 * crawl.css), plus a little. */
const TALLY_MS = 1900;

/** A boss or ambush dealt again after a landed hit (2026-11-01, owner:
 * "card to card continuity"): the moment it turns face up the card jolts
 * and a tally sweeps over it, the swings landed struck through, the newest
 * one breaking, and how many are left. Live only, never on a resumed game
 * or an undo back onto it; display only. Returns what to show, or null. */
export function useBossReturn(
  session: SessionState,
  card: CardDefinition,
  still: boolean,
) {
  const quest = session.quest;
  const need = hitsNeeded(quest, card);
  const hits = quest?.party?.hits ?? 0;
  const key =
    session.phase === "revealed" && quest?.party && hits > 0 && hits < need
      ? `${card.id}:${session.discarded}`
      : null;
  const seen = useRef(new Set(key ? [key] : []));
  const [shown, setShown] = useState<{
    key: string;
    need: number;
    hits: number;
    kicker: string;
  } | null>(null);
  useEffect(() => {
    if (!key || !still || seen.current.has(key)) return;
    seen.current.add(key);
    const beat = card.phases?.length ? bossBeat(quest, card) : 0;
    setShown({
      key,
      need,
      hits,
      kicker: beat ? `Phase ${beat + 1}` : `Round ${hits + 1}`,
    });
  }, [key, still, need, hits, quest, card]);
  useEffect(() => {
    if (!shown) return;
    const id = setTimeout(() => setShown(null), TALLY_MS);
    return () => clearTimeout(id);
  }, [shown]);
  // A different card in play ends it at once.
  return shown && shown.key === key ? shown : null;
}

/** The tally `useBossReturn` sweeps over a returning boss's card. */
export function BossTally({
  need,
  hits,
  kicker,
}: {
  need: number;
  hits: number;
  kicker: string;
}) {
  const left = need - hits;
  return (
    <span className="boss-tally" aria-hidden="true">
      <small>{kicker}</small>
      <span className="boss-tally-pips">
        {Array.from({ length: need }, (_, i) => (
          <span
            key={i}
            className={`boss-pip${i < hits ? " landed" : ""}${i === hits - 1 ? " newest" : ""}`}
          />
        ))}
      </span>
      <strong>{left === 1 ? "One more to go" : `${left} more to go`}</strong>
    </span>
  );
}
