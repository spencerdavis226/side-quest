import { useEffect, useRef, useState } from "react";
import type { CardDefinition, SessionState } from "../game/types";
import { bossBeat, hitsNeeded } from "../game/engine";

// Display-only flourishes on the card itself (Pub Crawl's since 2026-10-31):
// the Felled stamp and a returning boss's tally. Nothing here is saved, and
// a resumed game never replays one. The natural 20 and 1 burst moved to the
// moments layer (`moments/views.tsx`, 2026-11-01).

/** The rubber stamp slammed over a boss's card on the swing that fells it
 * ("Felled"; the League's "Defeated", never on a gym leader, whose badge
 * moment says it), covering the card's whole text area. It sits on the
 * face, so it turns and leaves with the card. */
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
