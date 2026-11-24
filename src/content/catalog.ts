import { coreDeckCards, corePack } from "./core-deck";
import { vipCards, vipPack } from "./vip";
import { pokemonCards, pokemonPack } from "./pokemon";
import { likelyCards, likelyPack } from "./likely";
import { secretsCards, secretsPack } from "./secrets";
import { dungeonCards, dungeonPack } from "./dungeon";
import { neverCards, neverPack } from "./never";
import { mindsCards, mindsPack } from "./minds";
import { outbreakCards } from "./outbreak";
import { dealerCards, dealerPack } from "./dealer";
import type { CardDefinition, PackDefinition } from "../game/types";
export { validateCatalog } from "./validate";

// The runtime catalog. Nine opt-in packs (setup lists them in `packs` order): the Core deck (the generated main
// deck, the supplied Sheet1 house sheet verbatim, and the CABIIN 2.0 cabin
// weekend: all plain cards), VIP night, the Pokémon board-sheet translation
// and its League mode, Most Likely To (vote cards), Secrets & fuses
// (hold-to-read secrets and timed cards), and Dungeon night (monsters and the
// Pub Crawl mode), Never Have I Ever (2026-11-23), and since 2026-11-24
// Great Minds and Dealer's Choice (push your luck); Outbreak's callbacks
// joined Secrets & surprises the same day. Card content is provided sample material and is expected
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
  // Ordered by kind (owner, 2026-11-24): Core, the packs everyone answers,
  // the trick packs, the guest of honor, then the two with their own modes.
  corePack,
  neverPack,
  likelyPack,
  mindsPack,
  secretsPack,
  dealerPack,
  vipPack,
  pokemonPack,
  dungeonPack,
];
