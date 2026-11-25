import type { CardDefinition } from "../../game/types";
import { card } from "./shared";

// The road (The Quest 2.0 Phase 5, 2026-11-14): after the City Gate and
// after the side quest the table chooses the next region, from two of the
// three at that depth; the third is closed, and the card says why. One card
// per pair (`choose` in `dungeon.ts`: `card[i]` leaves out region i). The
// plaques name the regions; `route` 0 is the first left open, 1 the second.
// The Quest only.
const road = (
  id: string,
  title: string,
  rules: string,
  a: string,
  b: string,
): CardDefinition => ({
  ...card(`road-${id}`, title, "group", rules),
  ribbon: "The Road",
  ribbonTone: "pearl",
  encounter: "fork",
  offers: [
    { label: a, route: 0 },
    { label: b, route: 1 },
    // The Quest 2.1: a split vote goes to the coin.
    { label: "Flip for it", flip: true },
  ],
});

/** The Road Out, leaving out the King's Road, the Old Forest, the Marsh. */
export const roadOut: CardDefinition[] = [
  road(
    "out-parade",
    "The Naked Parade",
    "The King's Road is closed for the naked parade. Forest or marsh? Vote, then the drawer taps it.",
    "The Old Forest",
    "The Marsh",
  ),
  road(
    "out-elves",
    "The Shut Forest",
    "The forest is shut: the elves all have the shits. Road or marsh? Vote, then the drawer taps it.",
    "The King's Road",
    "The Marsh",
  ),
  road(
    "out-flood",
    "The Flooded Marsh",
    "The marsh flooded, and it smells like a fart. Road or forest? Vote, then the drawer taps it.",
    "The King's Road",
    "The Old Forest",
  ),
];

/** The Signpost, leaving out the Haunted Crypt, the Goblin Mines, the
 * Wizard's Tower. */
export const signposts: CardDefinition[] = [
  road(
    "sign-full",
    "The Full Crypt",
    "The crypt is full of drunk skeletons. Mines or tower? Vote, then the drawer taps it.",
    "The Goblin Mines",
    "The Wizard's Tower",
  ),
  road(
    "sign-strike",
    "The Goblin Strike",
    "The goblins are on strike for dental. Crypt or tower? Vote, then the drawer taps it.",
    "The Haunted Crypt",
    "The Wizard's Tower",
  ),
  road(
    "sign-moved",
    "The Wandering Tower",
    "The tower moved again; the wizard's wasted. Crypt or mines? Vote, then the drawer taps it.",
    "The Haunted Crypt",
    "The Goblin Mines",
  ),
];
