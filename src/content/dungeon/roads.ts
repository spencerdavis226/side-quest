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
  ],
});

/** The Road Out, leaving out the King's Road, the Old Forest, the Marsh. */
export const roadOut: CardDefinition[] = [
  road(
    "out-parade",
    "The Road Out",
    "The King's Road is closed for a parade. Forest or marsh? Everyone votes; the drawer decides.",
    "The Old Forest",
    "The Marsh",
  ),
  road(
    "out-elves",
    "The Road Out",
    "The forest is shut: the elves are sulking. Road or marsh? Everyone votes; the drawer decides.",
    "The King's Road",
    "The Marsh",
  ),
  road(
    "out-flood",
    "The Road Out",
    "The marsh is flooded to the eaves. Road or forest? Everyone votes; the drawer decides.",
    "The King's Road",
    "The Old Forest",
  ),
];

/** The Signpost, leaving out the Haunted Crypt, the Goblin Mines, the
 * Wizard's Tower. */
export const signposts: CardDefinition[] = [
  road(
    "sign-full",
    "The Signpost",
    "The crypt is full. Mines or tower? Everyone votes; the drawer decides.",
    "The Goblin Mines",
    "The Wizard's Tower",
  ),
  road(
    "sign-strike",
    "The Signpost",
    "The mines are on strike. Crypt or tower? Everyone votes; the drawer decides.",
    "The Haunted Crypt",
    "The Wizard's Tower",
  ),
  road(
    "sign-moved",
    "The Signpost",
    "The tower has moved again. Crypt or mines? Everyone votes; the drawer decides.",
    "The Haunted Crypt",
    "The Goblin Mines",
  ),
];
