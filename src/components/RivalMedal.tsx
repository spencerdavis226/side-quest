import type { CSSProperties } from "react";
import { questArt, type QuestArt } from "../presentation/quest-art.generated";
import { RIVAL_COLOURS } from "../presentation/rival-colors";

export { RIVAL_COLOURS };

// The rivals' medallions (Rivals Phase 5, 2026-11-15): each rival's emblem
// from the vendored game-icons set, struck on a disc in their own colour.
// Display only: keyed by the rival's key, so an old save's rival reads the
// same. `quest-art.generated.ts` stays out of the first-load chunk: the
// strip chip and the end screen load this lazily; the moments' views
// (already a lazy chunk) import it directly.

const FALLBACK = { light: "#e07a6a", deep: "#5a1410" };

/** A rival's colours as CSS variables, `--rival` and `--rival-deep`. */
export const rivalVars = (who: string | undefined): CSSProperties => {
  const c = RIVAL_COLOURS[who ?? ""] ?? FALLBACK;
  return { "--rival": c.light, "--rival-deep": c.deep } as CSSProperties;
};

/** A rival's emblem, by key: an unknown key (a future rival in an old
 * build) reads as a hooded stranger. */
export const rivalMark = (who: string | undefined): QuestArt => {
  const key = `rival-${who}`;
  return key in questArt ? (key as QuestArt) : "bandit";
};

/** The medallion: a rim in the rival's deep colour, a face in their light
 * one, and their emblem; `cracked` splits it (a betrayal). */
export default function RivalMedal({
  who,
  cracked = false,
  className = "",
}: {
  who: string | undefined;
  cracked?: boolean;
  className?: string;
}) {
  return (
    <svg
      className={`rival-medal${cracked ? " cracked" : ""} ${className}`}
      viewBox="-60 -60 120 120"
      style={rivalVars(who)}
      aria-hidden="true"
    >
      <circle className="rival-medal-rim" r="57" />
      <circle className="rival-medal-field" r="47" />
      <path
        className="rival-medal-mark"
        d={questArt[rivalMark(who)]}
        transform="translate(-34 -34) scale(0.133)"
      />
      {cracked && (
        <path
          className="rival-medal-crack"
          d="M-4 -57 L4 -28 L-9 -6 L7 14 L-5 36 L3 57"
        />
      )}
    </svg>
  );
}
