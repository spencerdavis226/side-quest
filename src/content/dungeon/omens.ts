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
    "Last to say 'glub' when a floor opens drinks 1. Traps cost a heart more. Take a smoke bomb.",
    { hurt: { trap: 1 }, loot: ["smoke"] },
    "Last to say 'glub' when a floor opens drinks 1.",
  ),
  omen(
    "happy-hour",
    "Happy Hour",
    "Two for one: whoever drinks picks someone to drink with them. Every heal heals a heart more.",
    { heal: 1 },
    "Whoever drinks picks someone to drink with them.",
  ),
  omen(
    "running-a-tab",
    "Running a Tab",
    "Say 'on my tab' when handed a drink, or drink 1. Two hearts short, with a shield and a draught.",
    { hearts: -2, loot: ["shield", "draught"] },
    "Say 'on my tab' when handed a drink, or drink 1.",
  ),
  omen(
    "lock-in",
    "The Lock-In",
    "Ask before leaving your seat, or drink 2. Bosses take a hit more. Take a die and a shield.",
    // A shield since 2026-10-25: the stairs fight left it near the floor.
    { bossHits: 1, loot: ["die", "shield"] },
    "Ask before leaving your seat, or drink 2.",
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
    "Anyone who drops anything drinks 2. One satchel slot fewer, but two more hearts.",
    { satchel: 2, hearts: 2 },
    "Anyone who drops anything drinks 2.",
  ),
  omen(
    "blood-moon",
    "Blood Moon",
    "Howl at every monster; last to howl drinks 1. Fights cost a heart more, but two more hearts.",
    { hurt: { monster: 1, elite: 1, ambush: 1 }, hearts: 2 },
    "Howl at every monster; last to howl drinks 1.",
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
    "Everyone shouts the drawer's name when they draw, like a regular. Forget: drink 1. Two more hearts.",
    { hearts: 2 },
    "Everyone shouts the drawer's name when they draw. Forget: drink 1.",
  ),
  omen(
    "thin-walls",
    "Thin Walls",
    "Whisper the whole crawl; too loud, drink 1. Trials cost a heart more, but heals heal one more.",
    { hurt: { trial: 1 }, heal: 1 },
    "Whisper the whole crawl; too loud, drink 1.",
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
    "Before each boss the drawer answers a trivia question, or drinks 2. Trials cost less, traps more.",
    { hurt: { trial: -1, trap: 1 } },
    "Before each boss, the drawer answers a trivia question from the table, or drinks 2.",
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
