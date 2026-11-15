import type { CardDefinition, PackDefinition } from "../game/types";
import { withNaturals } from "./naturals";
import { hiddenRoomCards, hiddenRooms } from "./dungeon/bookcase";
import { brewery } from "./dungeon/brewery";
import { catacombs } from "./dungeon/catacombs";
import { cellar } from "./dungeon/cellar";
import { JOKE_CLASSES, classes } from "./dungeon/classes";
import { freezer } from "./dungeon/freezer";
import { kitchen } from "./dungeon/kitchen";
import { applyPhases } from "./dungeon/phases";
import { applyJinxes } from "./dungeon/jinxes";
import { floorMoments } from "./dungeon/moments";
import {
  rivalCards,
  rivalDuels,
  rivalFights,
  rivalIntros,
  rivalPleas,
  senseiPinned,
  rivals,
} from "./dungeon/rivals";
import {
  dragons as lastCallBosses,
  lairs,
  unlockedDragons,
} from "./dungeon/dragons";
import { lowerLandings, upperLandings } from "./dungeon/landings";
import { omens } from "./dungeon/omens";
import { summonsCards } from "./dungeon/summons";
import { signCards } from "./dungeon/signs";
import { roadOut, signposts } from "./dungeon/roads";
import {
  innRares,
  lastInnRare,
  regionRares,
  summonsRare,
} from "./dungeon/rares";
import { echoes } from "./dungeon/echoes";
import { applyHidden } from "./dungeon/hidden";
import { landmarks } from "./dungeon/landmarks";
import { rooftop } from "./dungeon/rooftop";
import { sewers } from "./dungeon/sewers";
import {
  DRAGON_RARE,
  DRAGON_RARE_HEROIC,
  PARTY_HEARTS,
  type FloorCards,
} from "./dungeon/shared";
import { taproom } from "./dungeon/taproom";
import { wine } from "./dungeon/wine";

// Dungeon night: the bar has a cellar, and the cellar goes down forever.
// Written for the owner on 2026-10-15 ("very flavorful", "actually difficult,
// and failable"; inspired by Heroes of Barcadia's drink-as-damage fights, with
// original text). In the plain modes the monsters, trials, traps and bosses
// play as ordinary cards. Pub Crawl deals them as a run while the table
// shares hearts. A lost fight costs the drawer a drink and the party hearts
// (`damage`, shown on the card in Pub Crawl only, so no deck card's rule
// mentions hearts); at zero the party wipes and everyone finishes their
// drink.
//
// Replayability (2026-10-15): each depth is one of two floors (Cellar or
// Wine Cellar, Catacombs or Sewers, Drowned Taproom or Kitchen); a third
// at each since 2026-10-17 (the Brewery, the Walk-in Freezer, the Rooftop
// Bar).
//
// The crawl at League depth (2026-10-17, owner: "bring it up to Pokémon
// League tier"): a run opens on an adventurer (`dungeon/classes.ts`, the
// starters' engine: a felt perk that levels up twice) and tonight's omen
// (now a boon that stacks). The rival party, the Quarter-Zips, cut the queue
// at the door and come back at closing time. Each floor has eight rooms,
// elites and bosses drop trinkets (boons kept for the run), a landing
// between floors trades drinks for a level or rests, and a jinx is a spoken
// rule that holds until the floor's boss falls. Since 2026-10-31 (owner:
// "too much clutter") there are no powers, knacks, floor rules, Cup or
// Quaff: a class is its perk and its level line. The floor files hold
// the cards; `dungeon/shared.ts` holds the builders and every tuning
// constant, measured by `tests/dungeon.balance.test.ts`.

const floors: Record<string, FloorCards> = {
  cellar,
  wine,
  catacombs,
  sewers,
  taproom,
  kitchen,
  brewery,
  freezer,
  rooftop,
};

// Four table moments a floor (2026-10-25) join its finds.
for (const [key, f] of Object.entries(floors))
  f.finds = [...f.finds, ...floorMoments[key]];

/** Fights and bosses play as ordinary cards in the plain modes; finds,
 * merchants, forks, landings, the rival party, adventurers and omens only
 * in a crawl. */
const deck = [
  ...Object.values(floors).flatMap((f) => [
    ...f.fights,
    ...f.elites,
    ...f.bosses,
  ]),
  ...lastCallBosses,
];

// Every d20 here carries the crawls' natural 20 and natural 1
// (`naturals.ts`), in Pub Crawl and in the plain modes alike.
// Boss phases (2026-10-25) go on before the naturals pass, so their d20s
// double on a 20 and a 1 too.
// Each card's text lives in its own file since Realms (2026-11-03): the
// outcome rewrites and the variety pass were folded into the region files.
export const dungeonCards: CardDefinition[] = applyPhases([
  ...deck,
  ...Object.values(floors).flatMap((f) => f.finds),
  ...omens,
  ...summonsCards,
  ...signCards,
  ...roadOut,
  ...signposts,
  // The Quest 2.0 Phase 6: rares, echoes and the Lair's Door's new cards.
  ...Object.values(regionRares).flat(),
  summonsRare,
  ...innRares,
  lastInnRare,
  ...Object.values(echoes),
  // The rival (2026-11-15): one of three follows a run.
  ...rivalCards,
  // The Quest 2.0 Phase 7: the Chronicle's dragons (Quest-only, locked).
  ...unlockedDragons,
  ...Object.values(landmarks).flat(),
  ...classes,
  ...upperLandings,
  ...lowerLandings,
  ...hiddenRoomCards,
]).map(withNaturals);
// Curses became jinxes (2026-10-25): one spoken system, not two.
applyJinxes(dungeonCards);
// Hidden results (The Quest 2.0 Phase 6) go on the faces the naturals pass
// split off.
applyHidden(dungeonCards);

const ids = (cards: CardDefinition[]) => cards.map((c) => c.id);

/** A region's eight cards, drawn from its fights and finds, the fifth
 * one of its three landmarks (The Quest 2.0 Phase 3, 2026-11-14); its
 * elites wait behind the fork's loud door. */
const floor = (
  label: string,
  intro: string,
  f: FloorCards,
  marks: CardDefinition[],
  rares: CardDefinition[],
) => ({
  label,
  intro,
  pick: 8,
  cardIds: ids([...f.fights, ...f.finds]),
  elite: ids(f.elites),
  inserts: [{ at: 4, cardIds: ids(marks) }],
  // Two rares a region, one dealt in about one run in five (Phase 6).
  rare: { cardIds: ids(rares), odds: 0.2 },
});
const one = (label: string, intro: string, cards: CardDefinition[]) => ({
  label,
  intro,
  pick: 1,
  cardIds: ids(cards),
});

/** A lair: its region, the Company at the door and its dragons. */
const lair = (region: ReturnType<typeof floor>, dragons: CardDefinition[]) => [
  region,
  // The road remembers (The Quest 2.0 Phase 6): the echo of one deed the
  // party holds, or nothing; then the Company, by its record.
  {
    label: "An Echo",
    intro: "Someone remembers",
    pick: 1,
    cardIds: ids(Object.values(echoes)),
    optional: true as const,
    // The Quest 2.1: the side quest's own echoes (every run holds one of
    // those deeds) are dealt only when no choice has an echo.
    variants: Object.entries(echoes).map(([deed, c]) => ({
      deeds: [deed],
      cardIds: [c.id],
      ...(deed.startsWith("quest-") ? { fallback: true as const } : {}),
    })),
  },
  // The rival's end (2026-11-15): their own card at the door, and the
  // duel only when the table refused them.
  {
    label: "The Lair's Door",
    intro: "{rival} is at the door",
    pick: 1,
    cardIds: ids(rivalPleas),
    variants: [
      // Rivals Phase 4: Sensei beaten twice is pinned instead (his exam is
      // the fallback, dealt only when the pinned card is not).
      ...rivals.map((r) => ({
        deeds: [`rival-${r.who}`],
        cardIds: [r.plea.id],
        ...(r.who === "tutt" ? { fallback: true as const } : {}),
      })),
      { deeds: ["rival-tutt", "rival-won-twice"], cardIds: [senseiPinned.id] },
    ],
  },
  {
    label: "The Duel",
    intro: "{rival} draws",
    pick: 1,
    cardIds: ids(rivalDuels),
    optional: true as const,
    variants: rivals.map((r) => ({
      deeds: [`rival-${r.who}`, "rival-refused"],
      cardIds: [r.duel.id],
    })),
  },
  // The Chronicle's dragons (The Quest 2.0 Phase 7), once unlocked.
  {
    ...one("The Dragon's Lair", "It's awake", dragons),
    rare: {
      cardIds: ids(unlockedDragons),
      odds: DRAGON_RARE,
      heroic: DRAGON_RARE_HEROIC,
    },
  },
];

export const dungeonPack: PackDefinition = {
  version: 1,
  id: "dungeon",
  logo: "art/packs/dungeon.svg",
  title: "Realms",
  description:
    "A dragon has woken, and the king wants it dead. Monsters, traps and bosses on the road to its lair, with drinks for damage.",
  cardIds: ids(deck),
  quest: {
    mode: "The Quest",
    summary: "Slay the dragon",
    label: "Hearts",
    mark: "art/packs/pub-crawl.svg",
    goal: 0,
    length: 1,
    cardIds: [],
    party: { hearts: PARTY_HEARTS, coin: true },
    // Realms (2026-11-03): the adventurer, the omen and the King's Summons
    // (which names the run's dragon), the Gilded Company at the city gate,
    // then one of three regions at each depth (eight encounters, and a boss
    // on the first two) with an inn after each boss, a side quest the table
    // may take or walk past, the Company at the crossroads and at the
    // lair's door, and the dragon. File and variable names are the old
    // floors' (cellar is the King's Road, and so on).
    finale: [
      // The joke classes are rare (The Quest 2.0 Phase 6): about 6 runs in
      // 100 (D8).
      {
        ...one(
          "Your adventurer",
          "Who answers the call?",
          classes.filter((c) => !JOKE_CLASSES.includes(c.id)),
        ),
        rare: { cardIds: JOKE_CLASSES, odds: 0.06 },
      },
      one("The omen", "A sign in the sky", omens),
      {
        ...one("The King's Summons", "The king needs a hero", summonsCards),
        rare: { cardIds: [summonsRare.id], odds: 0.05 },
      },
      // The road (The Quest 2.0 Phase 5): the table chooses two of three
      // regions at each of the first two depths.
      {
        choose: {
          card: roadOut.map((c) => one("The Road Out", "Which way?", [c])),
          routes: [
            [
              floor(
                "The King's Road",
                "Out through the city gate",
                cellar,
                landmarks.cellar,
                regionRares.cellar,
              ),
              one(
                "King's Road boss",
                "Something blocks the road",
                cellar.bosses,
              ),
            ],
            [
              floor(
                "The Old Forest",
                "Into the Old Forest",
                wine,
                landmarks.wine,
                regionRares.wine,
              ),
              one("Old Forest boss", "The trees go quiet", wine.bosses),
            ],
            [
              floor(
                "The Marsh",
                "Down into the Marsh",
                brewery,
                landmarks.brewery,
                regionRares.brewery,
              ),
              one("Marsh boss", "Something stirs in the reeds", brewery.bosses),
            ],
          ],
        },
      },
      // The rival walks in (2026-11-15): the first region's boss has just
      // fallen, and they help themselves.
      // Rivals Phase 6: a rival the Chronicle remembers comes back for
      // more (the deed `nemesis-<who>`, set at the start of the run).
      {
        ...one("Your Rival", "Someone got here first", rivalIntros),
        variants: rivals.map((r) => ({
          deeds: [`nemesis-${r.who}`],
          cardIds: [r.back.id],
        })),
      },
      // A dragon sign (The Quest 2.0 Phase 3): the dragon passes over. No
      // banner: its shadow crosses the card instead.
      { label: "A Dragon Sign", pick: 1, cardIds: ids(signCards) },
      {
        ...one("The Inn", "A warm fire and a bad bed", upperLandings),
        rare: { cardIds: ids(innRares), odds: 0.08 },
      },
      // A side quest: one of five pleas, its dungeon's two guards and its
      // keeper (2026-10-17 as the hidden rooms). Walking on skips both.
      {
        oneOf: hiddenRooms.map((r) => [
          one("A Side Quest", "Someone needs help", [r.plea]),
          { label: r.label, intro: r.intro, pick: 2, cardIds: ids(r.guards) },
          one(`${r.label.replace(/^The /, "")} boss`, "Someone is waiting", [
            r.keeper,
          ]),
        ]),
      },
      {
        choose: {
          card: signposts.map((c) => one("The Signpost", "Which way?", [c])),
          routes: [
            [
              floor(
                "The Haunted Crypt",
                "Down into the Haunted Crypt",
                catacombs,
                landmarks.catacombs,
                regionRares.catacombs,
              ),
              one("Haunted Crypt boss", "The dead stand up", catacombs.bosses),
            ],
            [
              floor(
                "The Goblin Mines",
                "Down into the Goblin Mines",
                sewers,
                landmarks.sewers,
                regionRares.sewers,
              ),
              one("Goblin Mines boss", "Drums in the deep", sewers.bosses),
            ],
            [
              floor(
                "The Wizard's Tower",
                "Up the Wizard's Tower",
                freezer,
                landmarks.freezer,
                regionRares.freezer,
              ),
              one("Wizard's Tower boss", "The lights go out", freezer.bosses),
            ],
          ],
        },
      },
      {
        ...one("The Last Inn", "One last night's sleep", lowerLandings),
        rare: { cardIds: [lastInnRare.id], odds: 0.08 },
      },
      // The rival holds the crossroads: one of their four confrontations.
      // The same cards are the pool an ambush draws from.
      {
        ...one("The Crossroads", "{rival} is waiting", rivalFights),
        ambush: ids(rivalFights),
        variants: rivals.map((r) => ({
          deeds: [`rival-${r.who}`],
          cardIds: ids(r.fights),
        })),
      },
      // The lair (The Quest 2.0, 2026-11-13): the dragon picks the third
      // region, its own, so each route is that region, the Company at its
      // door and one of its three dragons. The door is the same in every
      // route; only one route is ever dealt.
      {
        oneOf: [
          lair(
            floor(
              "The Sunken Coast",
              "Down to the Sunken Coast",
              taproom,
              landmarks.taproom,
              regionRares.taproom,
            ),
            lairs.taproom,
          ),
          lair(
            floor(
              "The Fire Caverns",
              "Into the Fire Caverns",
              kitchen,
              landmarks.kitchen,
              regionRares.kitchen,
            ),
            lairs.kitchen,
          ),
          lair(
            floor(
              "The Frozen Pass",
              "Up into the Frozen Pass",
              rooftop,
              landmarks.rooftop,
              regionRares.rooftop,
            ),
            lairs.rooftop,
          ),
        ],
      },
    ],
  },
};
