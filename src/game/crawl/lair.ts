import type {
  CardDefinition,
  DragonMove,
  PartyState,
  QuestState,
  SessionState,
} from "../types";
import type { Random } from "../engine";
import { hitsNeeded } from "./bosses";
// The dragon battle (The Quest 2.0 Phase 2, 2026-11-13). A lair fight is a
// boss whose `hits` are its health and whose re-deals are rounds. Each round
// the dragon makes a move, sampled when the round is dealt and saved in
// `party.duel`, so a reload never re-rolls it; the drawer then swings with
// the card's own d20. The first round at half health or below is the enrage
// contest, settled with Won and Lost; every round after it uses the enraged
// moves.

export type Duel = NonNullable<PartyState["duel"]>;
/** A round as the card reads it: a move from one list, or the contest. */
export type Round = { move: number; enraged?: true } | "contest";

export const isLairFight = (card: CardDefinition | undefined) =>
  !!card?.lairFight;

/** The round in play, from the saved duel. */
export const roundOf = (duel: Duel): Round =>
  duel.contest
    ? "contest"
    : { move: duel.move, ...(duel.enraged ? { enraged: true as const } : {}) };

/** A round's move, or none for the contest. */
export function moveOf(
  card: CardDefinition,
  round: Round,
): DragonMove | undefined {
  if (round === "contest" || !card.lairFight) return undefined;
  const list = round.enraged ? card.lairFight.enraged : card.lairFight.calm;
  return list[round.move];
}

/** The move on the dragon face up now (none on a contest round, off a lair
 * fight, or in a save without a duel). */
export function lairMove(
  quest: QuestState | undefined,
  card: CardDefinition,
): DragonMove | undefined {
  const duel = quest?.party?.duel;
  return card.lairFight && duel ? moveOf(card, roundOf(duel)) : undefined;
}

/** A lair fight as it reads on `round`: the move's name on the ribbon (the
 * title already names the dragon) and its
 * line in place of the rules, the card's d20 kept for the swing; or the
 * enrage contest, with no dice (Won and Lost plaques) and its own cost. */
export function atRound(card: CardDefinition, round: Round): CardDefinition {
  const fight = card.lairFight;
  if (!fight) return card;
  if (round === "contest") {
    const { dice: _dice, ...rest } = card;
    return {
      ...rest,
      ribbon: "Enraged",
      rules: fight.enrage.rules,
      damage: fight.enrage.damage,
    };
  }
  const move = moveOf(card, round);
  if (!move) return card;
  return {
    ...card,
    ribbon: move.name,
    rules: move.rules,
  };
}

/** The round dealt next, once the round before it (if any) is settled with
 * `hits` landed. The first round at half health or below is the contest;
 * after it the dragon is enraged for good. A move never repeats back to
 * back. */
export function nextDuel(
  quest: QuestState,
  card: CardDefinition,
  before: Duel | undefined,
  hits: number,
  random: Random,
): Duel {
  const need = hitsNeeded(quest, card);
  // Heroic mode (The Quest 2.0 Phase 7): enraged from the first round, so
  // there is no contest.
  const enraged = !!quest.heroic || !!before?.enraged || !!before?.contest;
  const swings = before ? before.swings + (before.contest ? 0 : 1) : 0;
  const prev = before ? roundOf(before) : undefined;
  if (!enraged && hits >= Math.ceil(need / 2))
    return {
      move: 0,
      swings,
      contest: true,
      ...(prev ? { prev } : {}),
    };
  const list = enraged ? card.lairFight!.enraged : card.lairFight!.calm;
  const pick = () => Math.floor(random() * list.length);
  let move = pick();
  const last = prev !== undefined && prev !== "contest" ? prev : undefined;
  // Re-sampled once, so the same move never comes twice running.
  if (last && !!last.enraged === enraged && last.move === move) move = pick();
  return {
    move,
    swings,
    ...(enraged ? { enraged: true as const } : {}),
    ...(prev ? { prev } : {}),
  };
}

/** The swing face up can fell the dragon (display only: the card adds
 * "Everyone stands."): a lair fight's round whose win lands the last
 * hit. */
export function killingRound(s: SessionState, card: CardDefinition): boolean {
  const party = s.quest?.party;
  if (!party?.duel || !card.lairFight) return false;
  return party.hits + 1 >= hitsNeeded(s.quest, card);
}
