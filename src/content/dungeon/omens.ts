import type { CardDefinition } from "../../game/types";
import { omen } from "./shared";

// Tonight's omen, the run's second card: one boon for the whole crawl.
// Since 2026-10-17 omens stack with the adventurer and the trinkets, so
// they speak in changes ("two more hearts", "one more satchel slot"),
// never totals. Pub Crawl only.

export const omens: CardDefinition[] = [
  omen(
    "flooded-stairs",
    "Flooded Stairs",
    "The stairs are underwater. Every trap costs one more heart. Take a smoke bomb down.",
    { hurt: { trap: 1 }, loot: ["smoke"] },
  ),
  omen(
    "happy-hour",
    "Happy Hour",
    "Two for one, all the way down. Every heal heals one more heart. Everyone drinks 1.",
    { heal: 1 },
  ),
  omen(
    "running-a-tab",
    "Running a Tab",
    "You start two hearts short, but the bar put a shield and a draught on your tab.",
    { hearts: -2, loot: ["shield", "draught"] },
  ),
  omen(
    "lock-in",
    "The Lock-In",
    "Locked in until sunrise. Every boss takes one more hit. Take a loaded die and a shield.",
    // A shield since 2026-10-25: the stairs fight left it near the floor.
    { bossHits: 1, loot: ["die", "shield"] },
  ),
  omen(
    "cargo-shorts",
    "Cargo Shorts",
    "You wore cargo shorts: drink 3. One more satchel slot, and a draught in a pocket.",
    { satchel: 4, loot: ["draught"] },
  ),
  omen(
    "butterfingers",
    "Butterfingers",
    "Everyone's already a bit gone. One satchel slot fewer, but you get two more hearts.",
    { satchel: 2, hearts: 2 },
  ),
  omen(
    "blood-moon",
    "Blood Moon",
    "Blood moon. Monsters, elites and ambushes cost a heart more. Start with two more hearts.",
    { hurt: { monster: 1, elite: 1, ambush: 1 }, hearts: 2 },
  ),
  omen(
    "lefty-night",
    "Lefty Night",
    "Everyone drinks with their off hand all crawl. Caught using the other: drink 1.",
  ),
  omen(
    "karaoke-night",
    "Karaoke Night",
    "Before every boss swing, the drawer sings one line of anything. Refuse: drink 2.",
  ),
  omen(
    "the-regulars",
    "The Regulars",
    "The bartender knows you, and your tab. Everyone drinks 2. Start with two more hearts.",
    { hearts: 2 },
  ),
  omen(
    "thin-walls",
    "Thin Walls",
    "Everyone can hear you. Every trial costs a heart more, but every heal heals one more.",
    { hurt: { trial: 1 }, heal: 1 },
  ),
  omen(
    "cold-open",
    "The Pregame",
    "Everyone drinks 1 at the door. Start a heart short, with a loaded die and a shield.",
    { hearts: -1, loot: ["die", "shield"] },
  ),
  // Eight more (2026-10-25).
  omen(
    "payday",
    "Payday",
    "Everyone got paid today. Gambles and relics roll 2 higher. Start a heart short.",
    { roll: { relic: 2 }, hearts: -1 },
  ),
  omen(
    "designated-driver",
    "Designated Driver",
    "The DD packed a draught. One more satchel slot, but bosses cost a heart more.",
    { satchel: 4, loot: ["draught"], hurt: { boss: 1 } },
  ),
  omen(
    "friday-13th",
    "Friday the 13th",
    "Bad luck and good luck: natural 1s land on a 2 too, natural 20s on a 19.",
    { fumble: 2, crit: 19 },
  ),
  omen(
    "trivia-night",
    "Trivia Night",
    "Trivia upstairs, so everyone's sharp. Trials cost a heart less, traps a heart more.",
    { hurt: { trial: -1, trap: 1 } },
  ),
  omen(
    "brads-birthday",
    "Brad's Birthday",
    "Brad's birthday: the Quarter-Zips are feral. Ambushes cost a heart more. Take a shield.",
    { hurt: { ambush: 1 }, loot: ["shield"] },
  ),
  omen(
    "open-bar",
    "Open Bar",
    "A wedding upstairs has an open bar. Take two draughts, but one satchel slot fewer.",
    { loot: ["draught", "draught"], satchel: 2 },
  ),
  omen(
    "name-tags",
    "Name Tags",
    "Everyone picks a fantasy name at the door and answers only to it. Wrong name: drink 1.",
  ),
  omen(
    "lucky-penny",
    "Lucky Penny",
    "A lucky penny on the stairs. Every d20 fight rolls 1 higher, but start two hearts short.",
    { roll: { all: 1 }, hearts: -2 },
  ),
];
