import type { CardDefinition } from "../../game/types";
import { applyPowers, dungeonPowerWords, type PowerLine } from "../powers";

// Pub Crawl's signature powers (2026-10-25): one a class, used when the
// table says, once (or twice) until the next boss falls; each level's
// power replaces the last (`null` keeps it). The forms run as `evolves`
// does, `[A1, B1, A2, B2]`: path A's first and second level are the first
// and third entries. The joke classes' powers are weak on purpose.

const lines: Readonly<Record<string, PowerLine>> = {
  // Rage: win it now, and bleed for it.
  barbarian: [
    ["Rage", "win", { cost: 1 }],
    ["Frenzy", "win", { cost: 1 }],
    ["Thick Skull", "spare"],
    ["Warcry", "win", { cost: 1, uses: 2 }],
    ["Unstoppable", "spare", { uses: 2 }],
  ],
  rogue: [
    ["Sneak Attack", "edge"],
    ["Vanish", "flee", { uses: 2 }],
    ["Sleight of Hand", "reroll"],
    ["Shadowstep", "edge", { uses: 2 }],
    ["Double Down", "double"],
  ],
  cleric: [
    ["Lay on Hands", "heal", { amount: 1 }],
    ["Prayer", "heal", { amount: 2 }],
    ["Smite", "double"],
    ["Miracle", "heal", { amount: 3, uses: 2 }],
    ["Judgement", "win", { cost: 1 }],
  ],
  wizard: [
    ["Arcane Reroll", "reroll"],
    ["Wild Magic", "reroll", { uses: 2 }],
    ["Mirror Image", "spare"],
    ["Time Stop", "win", { cost: 1 }],
    ["Mass Illusion", "spare", { uses: 2 }],
  ],
  bard: [
    ["Encore", "double"],
    ["Inspire", "edge"],
    ["Hype", "heal", { amount: 2 }],
    ["Standing Ovation", "double", { uses: 2 }],
    ["Sold Out", "heal", { amount: 3, uses: 2 }],
  ],
  paladin: [
    ["Divine Shield", "spare"],
    ["Smite", "double"],
    ["Vengeance", "win", { cost: 2 }],
    ["Aegis", "spare", { uses: 2 }],
    ["Dark Pact", "win", { cost: 1 }],
  ],
  ranger: [
    ["Hunter's Mark", "edge"],
    ["Hunter's Mark", "edge", { uses: 2 }],
    ["Called Shot", "double"],
    ["Wolf Pack", "win", { cost: 1 }],
    ["Kill Shot", "double", { uses: 2 }],
  ],
  // Liquid courage: the Quaff, in a class.
  monk: [
    ["Liquid Courage", "reroll", { drinks: 3 }],
    ["Haymaker", "win", { cost: 2, drinks: 2 }],
    ["Inner Peace", "heal", { amount: 2 }],
    ["Drunken Fist", "win", { cost: 1, drinks: 2 }],
    ["Meditate", "heal", { amount: 3, uses: 2 }],
  ],
  necromancer: [
    ["Grave Pact", "spare"],
    ["Bone Wall", "spare", { uses: 2 }],
    ["Leeches", "heal", { amount: 2 }],
    ["Soul Harvest", "win", { cost: 1 }],
    ["Pestilence", "double"],
  ],
  alchemist: [
    ["Quick Mix", "heal", { amount: 1 }],
    ["Elixir", "heal", { amount: 2 }],
    ["Firebomb", "win", { cost: 2 }],
    ["Panacea", "heal", { amount: 3 }],
    ["Big Boom", "win", { cost: 1 }],
  ],
  warlock: [
    ["Dark Bargain", "win", { cost: 1 }],
    ["Hexed Blade", "double"],
    ["Renegotiate", "reroll", { uses: 2 }],
    ["Hellfire", "win", { cost: 1, uses: 2 }],
    ["Soul Trade", "heal", { amount: 3 }],
  ],
  bouncer: [
    ["Not on the List", "flee"],
    ["Pat Down", "edge"],
    ["Hold the Door", "spare"],
    ["Throw Out", "win", { cost: 1 }],
    ["Velvet Rope", "spare", { uses: 2 }],
  ],
  bartender: [
    ["On the House", "heal", { amount: 2 }],
    ["Signature Drink", "heal", { amount: 3 }],
    ["Cut Off", "spare"],
    ["Top Shelf", "heal", { amount: 3, uses: 2 }],
    ["Comped", "spare", { uses: 2 }],
  ],
  mercenary: [
    ["Hired Blade", "win", { cost: 1 }],
    ["Dead or Alive", "double"],
    ["Take the Hit", "spare"],
    ["Legend", "win", { cost: 1 }],
    ["Champion's Guard", "spare", { uses: 2 }],
  ],
  druid: [
    ["Wild Shape", "spare"],
    ["Bear Form", "spare", { uses: 2 }],
    ["Poultice", "heal", { amount: 2 }],
    ["Dire Bear", "win", { cost: 1 }],
    ["Regrowth", "heal", { amount: 3, uses: 2 }],
  ],
  // The joke classes: powers nobody wants.
  "plus-one": [
    ["Leave Early", "flee"],
    ["Bring Snacks", "heal", { amount: 1 }],
    ["Awkward Silence", "flee"],
    null,
    ["Really Nice", "heal", { amount: 1 }],
  ],
  intern: [
    ["Coffee Run", "heal", { amount: 1 }],
    ["Circle Back", "reroll", { drinks: 3 }],
    ["Spill It", "flee"],
    ["Delegate", "flee"],
    ["Humblebrag", "heal", { amount: 1 }],
  ],
  mimic: [
    ["Play Dead", "flee"],
    null,
    ["Open Up", "heal", { amount: 1 }],
    null,
    ["Hide", "flee", { uses: 2 }],
  ],
};

export const applyClassPowers = (cards: CardDefinition[]) =>
  applyPowers(cards, lines, "dungeon.class-", dungeonPowerWords);
