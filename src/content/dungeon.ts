import type { CardDefinition, PackDefinition } from "../game/types";
import { withNaturals } from "./naturals";
import { hiddenRoomCards, hiddenRooms } from "./dungeon/bookcase";
import { brewery } from "./dungeon/brewery";
import { catacombs } from "./dungeon/catacombs";
import { cellar } from "./dungeon/cellar";
import { classes } from "./dungeon/classes";
import { freezer } from "./dungeon/freezer";
import { kitchen } from "./dungeon/kitchen";
import { applyPhases } from "./dungeon/phases";
import { applyJinxes } from "./dungeon/jinxes";
import { floorMoments } from "./dungeon/moments";
import {
  closingCards,
  lairs,
  lastCallBosses,
  queueCards,
  stairsCards,
} from "./dungeon/lastcall";
import { lowerLandings, upperLandings } from "./dungeon/landings";
import { omens } from "./dungeon/omens";
import { summonsCards } from "./dungeon/summons";
import { rooftop } from "./dungeon/rooftop";
import { sewers } from "./dungeon/sewers";
import { PARTY_HEARTS, type FloorCards } from "./dungeon/shared";
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
  ...classes,
  ...upperLandings,
  ...lowerLandings,
  ...queueCards,
  ...stairsCards,
  ...closingCards,
  ...hiddenRoomCards,
]).map(withNaturals);
// Curses became jinxes (2026-10-25): one spoken system, not two.
applyJinxes(dungeonCards);

const ids = (cards: CardDefinition[]) => cards.map((c) => c.id);

/** A floor's eight rooms, drawn from its fights and finds; its elites wait
 * behind the fork's loud door. */
const floor = (label: string, intro: string, f: FloorCards) => ({
  label,
  intro,
  pick: 8,
  cardIds: ids([...f.fights, ...f.finds]),
  elite: ids(f.elites),
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
  one("The Lair's Door", "The Company got here first", closingCards),
  one("The Dragon's Lair", "It's awake", dragons),
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
    party: { hearts: PARTY_HEARTS },
    // Realms (2026-11-03): the adventurer, the omen and the King's Summons
    // (which names the run's dragon), the Gilded Company at the city gate,
    // then one of three regions at each depth (eight encounters, and a boss
    // on the first two) with an inn after each boss, a side quest the table
    // may take or walk past, the Company at the crossroads and at the
    // lair's door, and the dragon. File and variable names are the old
    // floors' (cellar is the King's Road, and so on).
    finale: [
      one("Your adventurer", "Who answers the call?", classes),
      one("The omen", "A sign in the sky", omens),
      one("The King's Summons", "The king needs a hero", summonsCards),
      one("The City Gate", "The Company pushes past", queueCards),
      {
        oneOf: [
          [
            floor("The King's Road", "Out through the city gate", cellar),
            one("King's Road boss", "Something blocks the road", cellar.bosses),
          ],
          [
            floor("The Old Forest", "Into the Old Forest", wine),
            one("Old Forest boss", "The trees go quiet", wine.bosses),
          ],
          [
            floor("The Marsh", "Down into the Marsh", brewery),
            one("Marsh boss", "Something stirs in the reeds", brewery.bosses),
          ],
        ],
      },
      one("The Inn", "A warm fire and a bad bed", upperLandings),
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
        oneOf: [
          [
            floor(
              "The Haunted Crypt",
              "Down into the Haunted Crypt",
              catacombs,
            ),
            one("Haunted Crypt boss", "The dead stand up", catacombs.bosses),
          ],
          [
            floor("The Goblin Mines", "Down into the Goblin Mines", sewers),
            one("Goblin Mines boss", "Drums in the deep", sewers.bosses),
          ],
          [
            floor("The Wizard's Tower", "Up the Wizard's Tower", freezer),
            one("Wizard's Tower boss", "The lights go out", freezer.bosses),
          ],
        ],
      },
      one("The Last Inn", "One last night's sleep", lowerLandings),
      one("The Crossroads", "The Gilded Company is ahead", stairsCards),
      // The lair (The Quest 2.0, 2026-11-13): the dragon picks the third
      // region, its own, so each route is that region, the Company at its
      // door and one of its three dragons. The door is the same in every
      // route; only one route is ever dealt.
      {
        oneOf: [
          lair(
            floor("The Sunken Coast", "Down to the Sunken Coast", taproom),
            lairs.taproom,
          ),
          lair(
            floor("The Fire Caverns", "Into the Fire Caverns", kitchen),
            lairs.kitchen,
          ),
          lair(
            floor("The Frozen Pass", "Up into the Frozen Pass", rooftop),
            lairs.rooftop,
          ),
        ],
      },
    ],
  },
};
