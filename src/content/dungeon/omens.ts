import type { CardDefinition } from "../../game/types";
import { omen } from "./shared";

// The omen (Realms, 2026-11-03; was Tonight's omen), the run's second card:
// one boon for the whole quest.
// Since 2026-10-17 omens stack with the adventurer and the trinkets, so
// they speak in changes ("two more hearts", "one more satchel slot"),
// never totals. Pub Crawl only.

export const omens: CardDefinition[] = [
  omen(
    "flooded-stairs",
    "A Week of Rain",
    "Last to say 'squelch' as a region opens drinks 1. Traps hurt 1 more. Take a Smoke Bomb.",
    { hurt: { trap: 1 }, loot: ["smoke"] },
    "Last to say 'squelch' as a region opens drinks 1.",
  ),
  omen(
    "happy-hour",
    "Harvest Festival",
    "Feasts in every village: whoever drinks picks someone to drink with them. Heals heal 1 more.",
    { heal: 1 },
    "Whoever drinks picks someone to drink with them.",
  ),
  omen(
    "running-a-tab",
    "The King's Advance",
    "The king pays up front: drink 1. Start two hearts short, with a Tower Shield and a Healing Potion.",
    { hearts: -2, loot: ["shield", "draught"] },
  ),
  omen(
    "lock-in",
    "Curfew",
    "Ask to leave your seat, or drink 2. Bosses take an extra hit. Take a Lucky Coin and a shield.",
    // A shield since 2026-10-25: the stairs fight left it near the floor.
    { bossHits: 1, loot: ["die", "shield"] },
    "Ask to leave your seat, or drink 2.",
  ),
  omen(
    "cargo-shorts",
    "A Bottomless Bag",
    "A bag bigger on the inside: drink 3. One more satchel slot, with a Healing Potion in it.",
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
    "Everyone howls at the red moon; last to howl drinks 2. Fights cost a heart more; two more hearts.",
    { hurt: { monster: 1, elite: 1, ambush: 1 }, hearts: 2 },
  ),
  omen(
    "lefty-night",
    "The Oath",
    "Everyone swears to drink only with their off hand all quest. Caught using the other: drink 1.",
  ),
  omen(
    "karaoke-night",
    "Battle Hymns",
    "Before every boss swing, the drawer sings one line of a battle hymn. Refuse: drink 2.",
  ),
  omen(
    "the-regulars",
    "The Town Cheers",
    "The whole town sees you off. Everyone toasts the person on their left. Two more hearts.",
    { hearts: 2 },
  ),
  omen(
    "thin-walls",
    "A Sleeping Giant",
    "A giant sleeps nearby: everyone whispers. Trials cost a heart more; heals heal one more.",
    { hurt: { trial: 1 }, heal: 1 },
    "Everyone whispers. Anyone who shouts drinks 1.",
  ),
  omen(
    "cold-open",
    "The Farewell Toast",
    "Everyone drinks 1 at the city gate. Start a heart short, with a Lucky Coin and a Tower Shield.",
    { hearts: -1, loot: ["die", "shield"] },
  ),
  // Eight more (2026-10-25).
  omen(
    "payday",
    "A Treasure Map",
    "A treasure map, maybe a fake. Gambles and relics roll 2 higher. Start a heart short.",
    { roll: { relic: 2 }, hearts: -1 },
  ),
  omen(
    "designated-driver",
    "The Village Healer",
    "The village healer packs you a potion. One more satchel slot, but bosses cost a heart more.",
    { satchel: 4, loot: ["draught"], hurt: { boss: 1 } },
  ),
  omen(
    "friday-13th",
    "A Black Cat",
    "A black cat crossed your path, twice. Natural 1s land on a 2 too, natural 20s on a 19.",
    { fumble: 2, crit: 19 },
  ),
  omen(
    "trivia-night",
    "The Riddling Moon",
    "Before each boss, the drawer answers the table's riddle, or drinks 2. Trials cost less, traps more.",
    { hurt: { trial: -1, trap: 1 } },
    "Before each boss, the drawer answers a riddle from the table, or drinks 2.",
  ),
  omen(
    "brads-birthday",
    "Bandit Season",
    "It's bandit season, and they've been practicing. Ambushes cost a heart more. Take a Tower Shield.",
    { hurt: { ambush: 1 }, loot: ["shield"] },
  ),
  omen(
    "open-bar",
    "The Royal Wedding",
    "A royal wedding, and the wine is free. Take two Healing Potions, but one satchel slot fewer.",
    { loot: ["draught", "draught"], satchel: 2 },
  ),
  omen(
    "name-tags",
    "Heroic Names",
    "Everyone picks a heroic name at the gate and answers only to it. Wrong name: drink 1.",
  ),
  omen(
    "lucky-penny",
    "A Falling Star",
    "Everyone wished on a falling star. Every d20 fight rolls 1 higher, but start two hearts short.",
    { roll: { all: 1 }, hearts: -2 },
  ),
];
