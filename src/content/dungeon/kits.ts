import type { CardDefinition, OmenEffect } from "../../game/types";
import { trinket } from "./shared";

// Starting gear (owner, 2026-10-25): an adventurer walks in wearing one
// signature piece in one slot, worn until a boss's or an elite's piece for
// that slot replaces it. The real classes' pieces are small and fit the
// class (a Barbarian's axe, a Cleric's vestments); the joke classes' are a
// little worse than nothing, so the table is glad to swap them out. The
// Alchemist and the Innkeeper start with a satchel of items instead. The
// slot comes from the effect, as for every trinket (`slotFor`). The class
// card names the piece; the party dialog shows what it does.

const kits: Readonly<Record<string, [name: string, effect: OmenEffect]>> = {
  barbarian: ["Rusty Greataxe", { roll: { monster: 1 } }],
  rogue: ["Shiv", { roll: { ambush: 1 } }],
  cleric: ["Holy Vestments", { hearts: 1 }],
  wizard: ["Pointy Hat", { hearts: 1 }],
  bard: ["Battered Lute", { heal: 1 }],
  paladin: ["Holy Mace", { roll: { boss: 1 } }],
  ranger: ["Hunting Bow", { roll: { ambush: 1 } }],
  monk: ["Wine Gourd", { heal: 1 }],
  necromancer: ["Bone Wand", { roll: { boss: 1 } }],
  warlock: ["Hellfire Cloak", { hearts: 1 }],
  bouncer: ["Family Sword", { roll: { monster: 1 } }],
  mercenary: ["Chainmail Vest", { hearts: 1 }],
  druid: ["Pet Ferret", { heal: 1 }],
  // The joke classes.
  "plus-one": ["Smock", { hurt: { trap: 1 } }],
  intern: ["Oversized Helmet", { heal: -1 }],
  mimic: ["Its Own Lid", { roll: { monster: -1 } }],
};

/** Give each class its starting gear, and say so on its card. Throws on a
 * class that isn't there, so a renamed class can't silently lose its kit. */
export function applyKits(cards: CardDefinition[]): void {
  const byId = new Map(cards.map((c) => [c.id, c]));
  for (const [id, [name, effect]] of Object.entries(kits)) {
    const c = byId.get(`dungeon.class-${id}`);
    if (!c) throw Error(`Kit for a missing class: ${id}`);
    c.kit = trinket(name, effect);
    c.rules = `${c.rules} Wears ${name}.`;
  }
}
