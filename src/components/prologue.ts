import { finaleStage } from "../game/engine";
import type { SessionState } from "../game/types";

// The prologue (2026-11-15, owner: "None of these should be the default card
// flip scene ... a whole new 'starting' experience that is visually separate
// from the actual core game, since people get confused when the game
// actually starts, and they start handing the phone around during the
// selection and intro phase"). A crawl opens on a few stages the whole table
// watches together: the League's starter; the Quest's adventurer, omen,
// King's Summons and Road Out. While one is in play the app shows the
// prologue scene (`screens/Prologue.tsx`) in place of the table, and when
// the last is put aside, a handoff before the first card is turned.
// Display only: the engine deals, saves and replays these cards exactly as
// before, so no save changes and an old save in the middle of one shows the
// scene too.

/** The stages that make a pack's prologue, in run order, by label. */
export const PROLOGUE_STAGES: Readonly<Record<string, readonly string[]>> = {
  pokemon: ["Your starter"],
  dungeon: [
    "Your adventurer",
    "The omen",
    "The King's Summons",
    "The Road Out",
  ],
};

export interface Prologue {
  /** The prologue's length in cards (its stages' picks). */
  length: number;
  /** Where the run is: a prologue card in play (`at` its index), or the
   * handoff (`at === length`: the prologue done, the first card face down). */
  at: number;
  /** The stage's label, for a card in play. */
  label?: string;
}

/** The prologue a crawl is in, or none: not a crawl, the League's old
 * meter mode, a run already under way, or a game over. */
export function prologue(s: SessionState | null | undefined): Prologue | null {
  const q = s?.quest;
  if (!s || !q?.party || !q.due || s.phase === "complete") return null;
  const labels = PROLOGUE_STAGES[q.packId];
  if (!labels) return null;
  let length = 0;
  for (const stage of q.stages) {
    if (!labels.includes(stage.label)) break;
    length += stage.pick;
  }
  if (!length || q.step > length) return null;
  if (q.step === length)
    return s.phase === "hidden" && s.discarded === length
      ? { length, at: length }
      : null;
  return { length, at: q.step, label: finaleStage(q).label };
}

/** A run's identity for the handoff: the same run keeps it through reloads
 * and undo, so "Deal the first card" is asked once. */
export const runKey = (s: SessionState) =>
  `${s.quest?.packId}:${s.quest?.finale.join(",")}`;

/** The rival's introduction (2026-11-15; owner chose to keep it mid-run, in
 * the prologue's own scene language): once its card is turned on the table,
 * the scene takes over until it is put aside. */
export const RIVAL_STAGE = "Your Rival";
export function interlude(s: SessionState | null | undefined): boolean {
  const q = s?.quest;
  if (!s || !q?.party || !q.due || s.phase !== "revealed") return false;
  return finaleStage(q).label === RIVAL_STAGE;
}
