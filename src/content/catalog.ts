import { coreDeckCards, corePack } from "./core-deck";
import { vipCards, vipPack } from "./vip";
import { pokemonCards, pokemonPack } from "./pokemon";
import { likelyCards, likelyPack } from "./likely";
import { secretsCards, secretsPack } from "./secrets";
import { dungeonCards, dungeonPack } from "./dungeon";
import type { CardDefinition, PackDefinition } from "../game/types";
export { validateCatalog } from "./validate";

// The runtime catalog. Six opt-in packs: the Core deck (the generated main
// deck, the supplied Sheet1 house sheet verbatim, and the CABIIN 2.0 cabin
// weekend: all plain cards), VIP night, the Pokémon board-sheet translation
// and its League mode, Most Likely To (vote cards), Secrets & fuses
// (hold-to-read secrets and timed cards), and Dungeon night (monsters and the
// Pub Crawl mode). Card content is provided sample material and is expected
// to change.
export const cards: CardDefinition[] = [
  ...coreDeckCards,
  ...vipCards,
  ...pokemonCards,
  ...likelyCards,
  ...secretsCards,
  ...dungeonCards,
];
export const packs: PackDefinition[] = [
  corePack,
  vipPack,
  pokemonPack,
  likelyPack,
  secretsPack,
  dungeonPack,
];
