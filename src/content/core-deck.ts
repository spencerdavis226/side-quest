import type { PackDefinition } from "../game/types";
import { coreCards, samplePack } from "./sample";
import { houseCards } from "./custom";
import { cabinCards } from "./cabin";
import { coreLastCall } from "./last-call";

// One plain deck. Core, the supplied House sheet and Cabin weekend all play
// the same way (read the card, drink or give), so since 2026-10-24 (owner)
// they are one pack. Every ID is `core.*`; the House sheet's keep their
// sheet row (`core.house-NNN`) and Cabin weekend's a `core.cabin-` prefix
// (until 2026-11-15 they were `house.sheet-*` and `cabin.*`;
// `src/app/renamed-ids.ts` moves saved games on).
const coreDeck = [...coreCards, ...houseCards, ...cabinCards];
/** The deck and its Last Call closers (2026-11-23), dealt only to end a
 * Standard game. */
export const coreDeckCards = [...coreDeck, ...coreLastCall];

export const corePack: PackDefinition = {
  ...samplePack,
  description:
    "The main deck: party prompts, King's Cup basics, the dice cards, the house sheet, and the crew's cabin weekend.",
  cardIds: coreDeck.map((card) => card.id),
  lastCall: coreLastCall.map((card) => card.id),
};
