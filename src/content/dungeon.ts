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
import { applyOutcomes } from "./dungeon/outcomes";
import { applyKits } from "./dungeon/kits";
import {
  closingCards,
  lastCallBosses,
  queueCards,
  stairsCards,
} from "./dungeon/lastcall";
import { lowerLandings, upperLandings } from "./dungeon/landings";
import { omens } from "./dungeon/omens";
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
export const dungeonCards: CardDefinition[] = applyPhases(
  applyOutcomes([
    ...deck,
    ...Object.values(floors).flatMap((f) => f.finds),
    ...omens,
    ...classes,
    ...upperLandings,
    ...lowerLandings,
    ...queueCards,
    ...stairsCards,
    ...closingCards,
    ...hiddenRoomCards,
  ]),
).map(withNaturals);
applyKits(dungeonCards);
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

export const dungeonPack: PackDefinition = {
  version: 1,
  id: "dungeon",
  logo: "art/packs/dungeon.svg",
  title: "Dungeon night",
  description:
    "The bar has a cellar, and the cellar goes down forever. Monsters, traps and bosses, with drinks for damage.",
  cardIds: ids(deck),
  quest: {
    mode: "Pub Crawl",
    summary: "Survive 3 floors",
    label: "Hearts",
    mark: "art/packs/pub-crawl.svg",
    goal: 0,
    length: 1,
    cardIds: [],
    party: { hearts: PARTY_HEARTS },
    // The adventurer and tonight's omen, the queue, then one of three floors
    // at each depth (eight rooms, and a boss on the first two) with a
    // landing after each boss, then closing time and Last Call.
    finale: [
      one("Your adventurer", "Who's going down tonight?", classes),
      one("Tonight's omen", "Something in the air", omens),
      one("The Queue", "The Quarter-Zips cut in", queueCards),
      {
        oneOf: [
          [
            floor("The Cellar", "Down into the Cellar", cellar),
            one("Cellar boss", "Something blocks the stairs", cellar.bosses),
          ],
          [
            floor("The Wine Cellar", "Down into the Wine Cellar", wine),
            one("Wine Cellar boss", "Something uncorks itself", wine.bosses),
          ],
          [
            floor("The Brewery", "Down into the Brewery", brewery),
            one("Brewery boss", "Something is fermenting", brewery.bosses),
          ],
        ],
      },
      one("The Landing", "A breather on the stairs", upperLandings),
      // Behind the bookcase: one of five hidden rooms, two guards and a
      // keeper (2026-10-17).
      {
        oneOf: hiddenRooms.map((r) => [
          { label: r.label, intro: r.intro, pick: 2, cardIds: ids(r.guards) },
          one(`${r.label.replace(/^The /, "")} boss`, "Someone is waiting", [
            r.keeper,
          ]),
        ]),
      },
      {
        oneOf: [
          [
            floor("The Catacombs", "Down into the Catacombs", catacombs),
            one("Catacombs boss", "The bones stand up", catacombs.bosses),
          ],
          [
            floor("The Sewers", "Down into the Sewers", sewers),
            one("Sewers boss", "Something big in the pipes", sewers.bosses),
          ],
          [
            floor("The Walk-in Freezer", "Into the Walk-in Freezer", freezer),
            one("Freezer boss", "The light goes out", freezer.bosses),
          ],
        ],
      },
      one("The Lower Landing", "One last breather", lowerLandings),
      // The Quarter-Zips again, a floor ahead (2026-10-25).
      one("The Stairs", "The Quarter-Zips are ahead", stairsCards),
      {
        oneOf: [
          [floor("The Drowned Taproom", "The taps never stopped", taproom)],
          [floor("The Kitchen", "Through the swinging door", kitchen)],
          [floor("The Rooftop Bar", "Out onto the roof", rooftop)],
        ],
      },
      one("Closing Time", "The Quarter-Zips are back", closingCards),
      one("Last Call", "Last call. Last fight", lastCallBosses),
    ],
  },
};
