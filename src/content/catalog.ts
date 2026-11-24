import { coreDeckCards, corePack } from "./core-deck";
import { vipCards, vipPack } from "./vip";
import { pokemonCards, pokemonPack } from "./pokemon";
import { likelyCards, likelyPack } from "./likely";
import { secretsCards, secretsPack } from "./secrets";
import { dungeonCards, dungeonPack } from "./dungeon";
import { neverCards, neverPack } from "./never";
import { mindsCards, mindsPack } from "./minds";
import { outbreakCards, outbreakPack } from "./outbreak";
import { dealerCards, dealerPack } from "./dealer";
import type { CardDefinition, PackDefinition } from "../game/types";
export { validateCatalog } from "./validate";

// The runtime catalog. Ten opt-in packs: the Core deck (the generated main
// deck, the supplied Sheet1 house sheet verbatim, and the CABIIN 2.0 cabin
// weekend: all plain cards), VIP night, the Pokémon board-sheet translation
// and its League mode, Most Likely To (vote cards), Secrets & fuses
// (hold-to-read secrets and timed cards), and Dungeon night (monsters and the
// Pub Crawl mode), Never Have I Ever (2026-11-23), and since 2026-11-24
// Great Minds, Outbreak (callbacks) and Dealer's Choice (push your luck). Card content is provided sample material and is expected
// to change.
export const cards: CardDefinition[] = [
  ...coreDeckCards,
  ...vipCards,
  ...pokemonCards,
  ...likelyCards,
  ...neverCards,
  ...secretsCards,
  ...dungeonCards,
  ...mindsCards,
  ...outbreakCards,
  ...dealerCards,
];
export const packs: PackDefinition[] = [
  corePack,
  vipPack,
  pokemonPack,
  likelyPack,
  neverPack,
  secretsPack,
  dungeonPack,
  mindsPack,
  outbreakPack,
  dealerPack,
];
