import type { CardDefinition, HiddenReward } from "../../game/types";

// Hidden results (The Quest 2.0 Phase 6, 2026-11-14): one face of one card
// does something its rules never mention. The face's outcome says what
// happened, and brings a reward (`DiceOutcome.reward`; a gold "?" seal on
// the card). Applied by card ID after the naturals pass (`withNaturals`),
// which splits each d20's 20 and 1 into their own outcomes. The Quest's
// crawl applies them; the plain modes read the line only.
interface Hidden {
  face: number;
  line: string;
  reward: HiddenReward;
  ally?: CardDefinition["ally"];
}
const CHESTER: CardDefinition["ally"] = {
  name: "Chester",
  calling: ["relic"],
  bonus: 5,
  ritual: "Chester holds the satchel. Ask him nicely before using an item.",
};
const mimic: Hidden = {
  face: 1,
  line: "It follows you home.",
  reward: { ally: true },
  ally: CHESTER,
};
const HIDDEN: Record<string, Hidden> = {
  // Every region's mimic gamble: a natural 1, and Chester joins.
  "dungeon.mimic-keg": mimic,
  "dungeon.mimic-cask": mimic,
  "dungeon.mimic-fermenter": mimic,
  "dungeon.mimic-coffin": mimic,
  "dungeon.mimic-manhole": mimic,
  "dungeon.mimic-fridge": mimic,
  "dungeon.mimic-clam": mimic,
  "dungeon.mimic-oven": mimic,
  "dungeon.mimic-planter": mimic,
  // The Black Knight kneels.
  "dungeon.grease-trap-horror": {
    face: 20,
    line: "He kneels.",
    reward: { ally: true },
    ally: { name: "A Hired Blade", calling: ["elite"], bonus: 3 },
  },
  "dungeon.keg-golem": {
    face: 20,
    line: "He pays you the toll.",
    reward: { loot: "die" },
  },
  "dungeon.the-lich-lord": {
    face: 20,
    line: "You drink his soul by mistake.",
    reward: { loot: "revive" },
  },
  "dungeon.absolute-zero": {
    face: 20,
    line: "He takes you on as a student.",
    reward: { loot: "candy" },
  },
  "dungeon.hex-witch": {
    face: 20,
    line: "She tells you how it ends.",
    reward: { lore: true },
  },
  "dungeon.turtle-sensei": {
    face: 6,
    line: "He tells you about the dragon.",
    reward: { lore: true },
  },
  "dungeon.queue-knows-the-owner": {
    face: 20,
    line: "The charter was yours all along.",
    reward: { loot: "round" },
  },
};

/** Each hidden result put on its card's one-face outcome. */
export function applyHidden(cards: CardDefinition[]) {
  for (const c of cards) {
    const h = HIDDEN[c.id];
    if (!h || !c.dice?.outcomes) continue;
    const at = c.dice.outcomes.findIndex(
      (o) => o.min === h.face && o.max === h.face,
    );
    if (at < 0) throw Error(`No single ${h.face} to hide a result on: ${c.id}`);
    const outcomes = [...c.dice.outcomes];
    outcomes[at] = {
      ...outcomes[at],
      instruction: `${outcomes[at].instruction} ${h.line}`,
      reward: h.reward,
    };
    c.dice = { ...c.dice, outcomes };
    if (h.ally) c.ally = h.ally;
  }
}

/** The cards that hold a hidden result. */
export const hiddenIds = Object.keys(HIDDEN);
