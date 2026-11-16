import type { CardDefinition } from "../../game/types";
import { omen } from "./shared";

// The omen (Realms, 2026-11-03; was Tonight's omen), the run's second card:
// one boon for the whole quest.
// Since 2026-10-17 omens stack with the adventurer and the trinkets, so
// they speak in changes ("two more hearts", "one more satchel slot"),
// never totals. Pub Crawl only.

export const omens: CardDefinition[] = [
  omen(
    "swamp-ass",
    "Swamp Ass",
    "Last to say 'moist' as a region opens drinks 1. Traps hurt 1 more. Take a Smoke Bomb.",
    { hurt: { trap: 1 }, loot: ["smoke"] },
    "Last to say 'moist' as a region opens drinks 1.",
  ),
  omen(
    "harvest-orgy",
    "Harvest Orgy",
    "Every village is one big orgy: whoever drinks picks a partner to drink with. Heals heal 1 more.",
    { heal: 1 },
    "Whoever drinks picks a partner to drink with them.",
  ),
  omen(
    "hush-money",
    "Hush Money",
    "Hush money from the king: drink 1. Start two hearts short, with a Tower Shield and a Healing Potion.",
    { hearts: -2, loot: ["shield", "draught"] },
  ),
  omen(
    "grounded",
    "Grounded",
    "Ask Mom to leave your seat, or drink 2. Bosses take an extra hit. Take a Lucky Coin and shield.",
    // A shield since 2026-10-25: the stairs fight left it near the floor.
    { bossHits: 1, loot: ["die", "shield"] },
    "Ask Mom to leave your seat, or drink 2.",
  ),
  omen(
    "bag-of-holding",
    "A Bag of Holding",
    "Bigger on the inside, like your mom: drink 3. One more satchel slot.",
    { satchel: 4 },
  ),
  omen(
    "butterfingers",
    "Butterfingers",
    "Drop anything: drink 2, and you're Butterdick. One satchel slot fewer, but two more hearts.",
    { satchel: 2, hearts: 2 },
    "Drop anything: drink 2, and you're Butterdick.",
  ),
  omen(
    "blood-moon",
    "Blood Moon",
    "Everyone howls at the red moon; last to howl drinks 2. Fights cost a heart more; two more hearts.",
    { hurt: { monster: 1, elite: 1, ambush: 1 }, hearts: 2 },
  ),
  omen(
    "wank-hand",
    "Wank Hand",
    "Your good hand is for wanking now. Drink with the other one all quest. Caught: drink 1.",
  ),
  omen(
    "battle-moans",
    "Battle Moans",
    "Before every boss swing, the drawer moans one line of a battle hymn. Refuse: drink 2.",
  ),
  omen(
    "town-cheers",
    "The Town Cheers",
    "The whole town is glad to see you go. Everyone toasts the person on their left. Two more hearts.",
    { hearts: 2 },
  ),
  omen(
    "thin-walls",
    "Thin Walls",
    "The innkeeper is banging next door: everyone whispers. Trials cost a heart more; heals heal 1 more.",
    { hurt: { trial: 1 }, heal: 1 },
    "Everyone whispers. Anyone who shouts drinks 1.",
  ),
  omen(
    "farewell-shot",
    "The Farewell Shot",
    "Everyone drinks 1 at the gate and pukes. Start a heart short, with a Lucky Coin and a Tower Shield.",
    { hearts: -1, loot: ["die", "shield"] },
  ),
  // Eight more (2026-10-25).
  omen(
    "treasure-map",
    "A Treasure Map",
    "A treasure map, drawn on a napkin by a drunk. Gambles and relics roll 2 higher. Start a heart short.",
    { roll: { relic: 2 }, hearts: -1 },
  ),
  omen(
    "village-quack",
    "The Village Quack",
    "The village quack packs you a potion. One more satchel slot, but bosses cost a heart more.",
    { satchel: 4, loot: ["draught"], hurt: { boss: 1 } },
  ),
  omen(
    "black-cat",
    "A Black Cat",
    "A black cat shat in your path. Natural 1s land on a 2 too, natural 20s on a 19.",
    { fumble: 2, crit: 19 },
  ),
  omen(
    "riddling-moon",
    "The Riddling Moon",
    "Before each boss, the drawer answers the table's riddle, or drinks 2. Trials cost less, traps more.",
    { hurt: { trial: -1, trap: 1 } },
    "Before each boss, the drawer answers a riddle from the table, or drinks 2.",
  ),
  omen(
    "bandit-season",
    "Bandit Season",
    "It's bandit season, and they're horny. Ambushes cost a heart more. Take a Tower Shield.",
    { hurt: { ambush: 1 }, loot: ["shield"] },
  ),
  omen(
    "royal-wedding",
    "The Royal Wedding",
    "Free wine at a royal wedding, and the bride's flirting. Two Healing Potions, one satchel slot fewer.",
    { loot: ["draught", "draught"], satchel: 2 },
  ),
  omen(
    "porn-names",
    "Porn Names",
    "Everyone picks a porn name at the gate and answers only to it. Wrong name: drink 1.",
  ),
  omen(
    "falling-star",
    "A Falling Star",
    "Everyone wished for sex on a falling star. Every d20 fight rolls 1 higher; start two hearts short.",
    { roll: { all: 1 }, hearts: -2 },
  ),
];
