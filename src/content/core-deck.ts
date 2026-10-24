import type { PackDefinition } from "../game/types";
import { coreCards, samplePack } from "./sample";
import { houseCards } from "./custom";
import { cabinCards } from "./cabin";

// One plain deck. Core, the supplied House sheet and Cabin weekend all play
// the same way (read the card, drink or give), so since 2026-10-24 (owner)
// they are one pack. Card IDs keep their origin (`core.*`, `house.sheet-*`,
// `cabin.*`) so saved games, marks and the reference records still line up.
export const coreDeckCards = [...coreCards, ...houseCards, ...cabinCards];

export const corePack: PackDefinition = {
  ...samplePack,
  description:
    "The main deck: party prompts, King's Cup basics, the dice cards, the house sheet, and the crew's cabin weekend.",
  cardIds: coreDeckCards.map((card) => card.id),
};
