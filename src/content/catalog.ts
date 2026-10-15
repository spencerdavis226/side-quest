import { coreCards, samplePack } from "./sample";
import { houseCards, housePack } from "./custom";
import { vipCards, vipPack } from "./vip";
import { pokemonCards, pokemonPack } from "./pokemon";
import { cabinCards, cabinPack } from "./cabin";
import { likelyCards, likelyPack } from "./likely";
import { secretsCards, secretsPack } from "./secrets";
import type { CardDefinition, PackDefinition } from "../game/types";
export { validateCatalog } from "./validate";

// The runtime catalog. Six opt-in packs: the generated main deck, the
// supplied Sheet1 house deck (verbatim), VIP night, the Pokémon board-sheet
// translation, Cabin weekend (the CABIIN 2.0 board game, off the board),
// Most Likely To (vote cards), and Secrets & fuses (hold-to-read secrets and
// timed cards). Card content is provided sample material and is expected to change.
export const cards: CardDefinition[] = [
  ...coreCards,
  ...houseCards,
  ...vipCards,
  ...pokemonCards,
  ...cabinCards,
  ...likelyCards,
  ...secretsCards,
];
export const packs: PackDefinition[] = [
  samplePack,
  housePack,
  vipPack,
  pokemonPack,
  cabinPack,
  likelyPack,
  secretsPack,
];
