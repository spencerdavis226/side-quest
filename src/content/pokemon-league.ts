import type { CardDefinition } from "../game/types";
import { alola } from "./league/alola";
import { galar } from "./league/galar";
import { hoenn } from "./league/hoenn";
import { johto } from "./league/johto";
import { kalos } from "./league/kalos";
import { kanto } from "./league/kanto";
import { paldea } from "./league/paldea";
import type { Region } from "./league/shared";
import { sinnoh } from "./league/sinnoh";
import { unova } from "./league/unova";

// Pokémon League mode only: every region's gym leaders (Alola's island
// challenge stands in for gyms) and the League gauntlet. None of these is in
// the regular Pokémon deck. Every card is a boss `battle` with `hits` and
// `damage` for the crawl League; the tuning constants are at the top of
// `league/shared.ts`. A dice boss is won on its `win` outcomes; any other is
// settled with Won and Lost plaques, so each has to be judged the moment it
// is played. Kanto, Johto and Hoenn were written for the badge-meter League
// at the owner's request (2026-10-05) and keep their IDs and rules; the other
// six regions and the larger gauntlet were added on 2026-10-16 when the
// League moved onto the crawl engine (owner: all nine regions).
const regions: Region[] = [
  kanto,
  johto,
  hoenn,
  sinnoh,
  unova,
  kalos,
  alola,
  galar,
  paldea,
];

/** All 72 gym leaders, region by region in canon order. */
export const gymLeaders: CardDefinition[] = regions.flatMap((r) => r.gyms);

/** Eight tiers of nine: tier k is every region's (k+1)th gym, so a run that
 * deals one leader from each tier in turn gets a random lineup that still
 * ramps up. */
export const gymTiers: CardDefinition[][] = Array.from({ length: 8 }, (_, k) =>
  regions.map((r) => r.gyms[k]),
);

export const legendaries: CardDefinition[] = regions.flatMap(
  (r) => r.legendaries,
);

export const eliteFourMembers: CardDefinition[] = regions.flatMap(
  (r) => r.eliteFour,
);

export const champions: CardDefinition[] = regions.flatMap((r) => r.champions);
