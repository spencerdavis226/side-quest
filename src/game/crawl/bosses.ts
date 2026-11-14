import type { CardDefinition, QuestState, SessionState } from "../types";
import { rollWins } from "../dice";
import { currentCard, type Random } from "../engine";
import { omenEffect } from "./party";
import { awaitingVerdict, discard, natural } from "./discard";
// Bosses: hits, phases and spoils.
/** A crawl boss. An ambush also has `hits`; cards saved before encounters
 * existed had hits only on bosses. */
export const isBossCard = (c: CardDefinition) =>
  c.encounter ? c.encounter === "boss" : !!c.hits;
/** The beat of a boss fight a card is on (`phases`): the hits landed walk
 * through the phases in order, and the felling swing plays the last. 0 for
 * a card without phases, or outside a crawl. */
export function bossBeat(quest: QuestState | undefined, card: CardDefinition) {
  const beats = 1 + (card.phases?.length ?? 0);
  const party = quest?.party;
  if (beats === 1 || !party) return 0;
  const need = hitsNeeded(quest, card);
  if (party.hits >= need - 1) return beats - 1;
  return Math.min(party.hits, beats - 2);
}
/** A card as it reads on beat `beat`: a later phase's rules and dice (none
 * means Won/Lost plaques) in place of the card's own. */
export function atBeat(card: CardDefinition, beat: number): CardDefinition {
  const phase = beat > 0 ? card.phases?.[beat - 1] : undefined;
  if (!phase) return card;
  const { dice: _dice, ...rest } = card;
  return {
    ...rest,
    rules: phase.rules,
    ...(phase.dice ? { dice: phase.dice } : {}),
  };
}
/** Swings a boss or an ambush needs; 0 for any other card. */
export function hitsNeeded(
  quest: QuestState | undefined,
  card: CardDefinition,
): number {
  if (!card.hits) return 0;
  // A boss always takes at least one hit: a starter that takes a hit off
  // every boss (Marowak) speeds up the big ones, never skips a gym.
  return Math.max(
    1,
    card.hits +
      (isBossCard(card) ? (omenEffect(quest)?.bossHits ?? 0) : 0) +
      // Heroic mode (The Quest 2.0 Phase 7): the dragon has one more scale.
      (quest?.heroic && card.lairFight ? 1 : 0),
  );
}
/** A crawl fight just won whose spoils wait to be picked: an elite's win,
 * or a boss's felling swing. Picking one puts the card aside. */
export function awaitingSpoils(s: SessionState): boolean {
  const party = s.quest?.party;
  if (!party || !s.quest?.due || s.phase !== "revealed") return false;
  const card = currentCard(s);
  if (!card.spoils?.length || !card.dice || !s.roll?.returned) return false;
  if (!rollWins(card.dice, s.roll.values, s.roll)) return false;
  return fells(s, natural(card, s.roll));
}
/** Whether a win on the card in play fells it: any win on a fight without
 * hits, or the swing that lands its last hit (a natural 20 or a doubled
 * win lands two). */
function fells(s: SessionState, nat: 20 | 1 | null): boolean {
  const card = currentCard(s);
  const need = hitsNeeded(s.quest, card);
  const swing = nat === 20 ? 2 : 1;
  return !need || s.quest!.party!.hits + swing >= need;
}
/** A crawl boss's felling swing face up: a won roll that lands its last
 * hit. Display only (the card's Felled stamp); nothing is saved. */
export function fellingSwing(s: SessionState): boolean {
  if (!s.quest?.party || !s.quest.due || s.phase !== "revealed") return false;
  const card = currentCard(s);
  if (!isBossCard(card) || !card.dice || !s.roll?.returned) return false;
  if (!rollWins(card.dice, s.roll.values, s.roll)) return false;
  return fells(s, natural(card, s.roll));
}
/** A boss's felling beat face up as Won and Lost plaques: a Won would
 * land its last hit. Display only (the stamp `Play.tsx` slams before the
 * win is settled, 2026-11-01); nothing is saved. */
export function fellingVerdict(s: SessionState): boolean {
  if (!s.quest?.party || !awaitingVerdict(s)) return false;
  return isBossCard(currentCard(s)) && fells(s, null);
}
/** A plaque fight face up whose win would bring its spoils (a boss's
 * felling beat, 2026-10-25): Won asks which trinket first. */
export function spoilsOnWin(s: SessionState): boolean {
  if (!s.quest?.party || !awaitingVerdict(s)) return false;
  return !!currentCard(s).spoils?.length && fells(s, null);
}
/** Take spoil `index` of the fight just won, and put the card aside. */
export function takeSpoils(
  s: SessionState,
  index: number,
  random: Random = Math.random,
): SessionState {
  const card = currentCard(s);
  if (
    !awaitingSpoils(s) ||
    !Number.isSafeInteger(index) ||
    index < 0 ||
    index >= card.spoils!.length
  )
    return s;
  return discard(s, random, undefined, index);
}
/** Keep the gear the party wears: a won fight's card goes aside and none
 * of its spoils are taken (2026-10-25). */
export function skipSpoils(
  s: SessionState,
  random: Random = Math.random,
): SessionState {
  return awaitingSpoils(s) ? discard(s, random) : s;
}
