import type { CardDefinition, Loot, SessionState } from "../types";
import { rollWins } from "../dice";
import { currentCard, type Random } from "../engine";
import { evolve, omenForm } from "./party";
import { discard } from "./discard";
// The satchel's items.
/** A lost fight's roll is on the card. */
const lostRoll = (s: SessionState, card: CardDefinition) =>
  s.phase === "revealed" &&
  !!card.battle &&
  !!card.dice &&
  !!s.roll?.returned &&
  !rollWins(card.dice, s.roll.values, s.roll);
/** What a draught (Potion) heals, and what it costs the drawer. */
export const DRAUGHT_HEAL = 2;
export const DRAUGHT_DRINKS = 4;
/** Whether the party can use the satchel's item `item` now. */
export function canUseLoot(s: SessionState, item: Loot): boolean {
  const party = s.quest?.party;
  if (!party || s.phase === "complete") return false;
  if (!party.loot.includes(item) || party.throw) return false;
  const card = currentCard(s);
  switch (item) {
    case "draught":
      return party.hearts < party.max;
    case "die":
      // A lost fight's result is on the card: roll it again.
      return lostRoll(s, card);
    case "round":
      // Its drinks go to someone else, once.
      return lostRoll(s, card) && party.passed !== s.discarded;
    case "smoke":
      // Slip past a room fight before it starts; a boss blocks the stairs,
      // and a push already under way is seen through.
      return (
        s.phase === "revealed" &&
        !!card.battle &&
        !card.hits &&
        !s.roll &&
        !card.dice?.choice &&
        !party.press
      );
    case "shield":
    case "revive":
      return false; // Each works on its own, when it is needed.
    case "master":
    case "great":
    case "ultra":
      return false; // Thrown at a catch (`throwWith`).
    case "candy": {
      // A branching starter picks its form on an evolution card.
      const form = omenForm(s.quest);
      return !!form?.canEvolve && !form.branches;
    }
  }
}
/** Use one of the satchel's items. Returns the session unchanged when the
 * item cannot be used now. */
export function spendLoot(
  s: SessionState,
  item: Loot,
  random: Random = Math.random,
): SessionState {
  if (!canUseLoot(s, item)) return s;
  const party = s.quest!.party!;
  const loot = [...party.loot];
  loot.splice(loot.indexOf(item), 1);
  const used = { ...s, quest: { ...s.quest!, party: { ...party, loot } } };
  switch (item) {
    case "draught":
      // Drink 4, heal 2 (owner, 2026-10-25), never past the maximum.
      used.quest.party.hearts = Math.min(
        party.max,
        party.hearts + DRAUGHT_HEAL,
      );
      return used;
    case "die":
      return { ...used, roll: null };
    case "smoke":
      return discard(used, random, "fled");
    case "candy":
      return {
        ...used,
        quest: {
          ...used.quest,
          party: evolve(used.quest.party!, used.quest),
        },
      };
    case "round":
      return {
        ...used,
        quest: {
          ...used.quest,
          party: { ...used.quest.party!, passed: s.discarded },
        },
      };
    default:
      return s;
  }
}
