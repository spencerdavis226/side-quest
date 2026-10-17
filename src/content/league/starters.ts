import type { CardDefinition } from "../../game/types";
import { starter } from "./journey";

// The run's first card: one starter of seventeen, from every generation.
// Each has one signature (healing, Protects, X Attacks, Escape Ropes, a big
// HP pool, a weak spot it grows out of...), and each later form, reached
// through the routes' evolution cards or a Rare Candy, is strictly better
// in a way the evolution banner can name. Eevee branches: its one evolution
// is Vaporeon, Jolteon or Flareon, the table's pick. Pikachu never evolves.
// The powers are written from the numbers (`starter` in `journey.ts`), so
// the flavor here is only the first sentence. Starters may name Team HP and
// items: they only play in the League. Check every starter's own win rate
// in `tests/league.test.ts`.

export const starters: CardDefinition[] = [
  // Healing: every heal heals more.
  starter(
    "bulbasaur",
    "Bulbasaur",
    "Bulbasaur chose you. Everyone sniff the bulb.",
    { hearts: -2, heal: 1 },
    [
      { title: "Ivysaur", omen: { heal: 1, loot: ["draught"] } },
      { title: "Venusaur", omen: { hearts: 2, heal: 2 } },
    ],
  ),
  // Strong on the road, weak to bosses until it grows.
  starter(
    "charmander",
    "Charmander",
    "Charmander chose you. Keep its tail lit.",
    { hurt: { monster: -1, boss: 1 } },
    [
      { title: "Charmeleon", omen: { hearts: 1, hurt: { monster: -1 } } },
      {
        title: "Charizard",
        omen: { hearts: 2, hurt: { monster: -1, boss: -1 } },
      },
    ],
  ),
  // Protects, and a bag that grows.
  starter(
    "squirtle",
    "Squirtle",
    "Squirtle chose you, in sunglasses.",
    { satchel: 2, loot: ["shield"] },
    [
      { title: "Wartortle", omen: { satchel: 3, loot: ["shield"] } },
      { title: "Blastoise", omen: { satchel: 4, loot: ["shield"] } },
    ],
  ),
  // Never evolves: strong from the first card.
  starter(
    "pikachu",
    "Pikachu",
    "Pikachu won't go in its ball and won't evolve. Ever. Everyone yells Pika.",
    { hearts: 2, loot: ["die"] },
  ),
  // A big bag, and the table picks what it becomes.
  starter(
    "eevee",
    "Eevee",
    "Eevee chose you. The table picks what it evolves into.",
    { hearts: -2, satchel: 4 },
    [
      { title: "Vaporeon", omen: { hearts: 3, satchel: 4, heal: 1 } },
      {
        title: "Jolteon",
        omen: {
          satchel: 4,
          loot: ["smoke"],
          hurt: { monster: -1, trial: -1 },
        },
      },
      {
        title: "Flareon",
        omen: { hearts: 1, satchel: 4, loot: ["die", "die"] },
      },
    ],
    true,
  ),
  // X Attacks: one more with every form.
  starter(
    "cyndaquil",
    "Cyndaquil",
    "Cyndaquil chose you, half asleep.",
    { hearts: -1, loot: ["die"] },
    [
      { title: "Quilava", omen: { loot: ["die"] } },
      { title: "Typhlosion", omen: { hearts: 2, loot: ["die"] } },
    ],
  ),
  // The tank: big HP, but route battles bite.
  starter(
    "totodile",
    "Totodile",
    "Totodile chose you by biting you.",
    { hearts: 3, hurt: { monster: 1 } },
    [
      { title: "Croconaw", omen: { hearts: 5, hurt: { monster: 1 } } },
      { title: "Feraligatr", omen: { hearts: 6 } },
    ],
  ),
  // Escape Ropes, and a bag to carry them.
  starter(
    "treecko",
    "Treecko",
    "Treecko chose you, chewing a twig.",
    { loot: ["smoke"], hurt: { ambush: 1, elite: 1 } },
    [
      { title: "Grovyle", omen: { hearts: 1, loot: ["smoke"] } },
      {
        title: "Sceptile",
        omen: { hearts: 2, satchel: 4, loot: ["smoke"] },
      },
    ],
  ),
  // Rival and Ace Trainer killer.
  starter(
    "torchic",
    "Torchic",
    "Torchic chose you. Everyone flap and peep.",
    { hearts: -2, hurt: { ambush: -1, elite: -1 } },
    [
      {
        title: "Combusken",
        omen: { hurt: { ambush: -1, elite: -1 }, loot: ["die"] },
      },
      {
        title: "Blaziken",
        omen: { hearts: 2, hurt: { ambush: -1, elite: -1, monster: -1 } },
      },
    ],
  ),
  // Boss killer on a small HP pool.
  starter(
    "mudkip",
    "Mudkip",
    "So I herd u liek Mudkipz.",
    { hearts: -5, hurt: { boss: -1 } },
    [
      {
        title: "Marshtomp",
        omen: { hearts: -3, hurt: { boss: -1 }, loot: ["shield"] },
      },
      { title: "Swampert", omen: { hearts: 0, hurt: { boss: -1 } } },
    ],
  ),
  // Huge HP, too proud to finish bosses quickly until it grows up.
  starter(
    "piplup",
    "Piplup",
    "Piplup chose you and is very proud of it.",
    { hearts: 6, bossHits: 1, loot: ["shield"] },
    [
      {
        title: "Prinplup",
        omen: { hearts: 6, bossHits: 1, loot: ["shield"] },
      },
      { title: "Empoleon", omen: { hearts: 6, hurt: { boss: -1 } } },
    ],
  ),
  // Big HP, small bag.
  starter(
    "turtwig",
    "Turtwig",
    "Turtwig chose you, slowly.",
    { hearts: 4, satchel: 2 },
    [
      { title: "Grotle", omen: { hearts: 5, satchel: 3 } },
      { title: "Torterra", omen: { hearts: 6, satchel: 4 } },
    ],
  ),
  // A bit of everything on a thin HP pool.
  starter(
    "oshawott",
    "Oshawott",
    "Oshawott chose you, scalchop out.",
    { hearts: -3, loot: ["shield", "die"] },
    [
      { title: "Dewott", omen: { hearts: -1, loot: ["shield"] } },
      {
        title: "Samurott",
        omen: { hearts: 1, loot: ["die"], hurt: { elite: -1 } },
      },
    ],
  ),
  // Grows up fast: a Rare Candy to start.
  starter(
    "froakie",
    "Froakie",
    "Froakie chose you, covered in bubbles. Use the candy from the bag any time.",
    { hearts: -2, loot: ["candy"] },
    [
      { title: "Frogadier", omen: { hearts: -1, loot: ["smoke"] } },
      {
        title: "Greninja",
        omen: { hearts: 1, loot: ["smoke"], hurt: { monster: -1 } },
      },
    ],
  ),
  // Hazards and finds barely touch it.
  starter(
    "rowlet",
    "Rowlet",
    "Rowlet chose you and fell asleep on your head.",
    { hearts: -1, hurt: { trap: -1, relic: -1 } },
    [
      {
        title: "Dartrix",
        omen: { hurt: { trap: -1, relic: -1 }, loot: ["draught"] },
      },
      {
        title: "Decidueye",
        omen: { hearts: 2, loot: ["die"], hurt: { trap: -1, relic: -1 } },
      },
    ],
  ),
  // Light on its feet: route battles and challenges, small bag.
  starter(
    "scorbunny",
    "Scorbunny",
    "Scorbunny chose you, bouncing.",
    { satchel: 2, hurt: { monster: -1, trial: -1 } },
    [
      {
        title: "Raboot",
        omen: { hearts: 1, satchel: 3, hurt: { monster: -1, trial: -1 } },
      },
      {
        title: "Cinderace",
        omen: {
          hearts: 2,
          satchel: 3,
          loot: ["die"],
          hurt: { monster: -1, trial: -1 },
        },
      },
    ],
  ),
  // Snacks: Potions, a Revive, then more Potions.
  starter(
    "fuecoco",
    "Fuecoco",
    "Fuecoco chose you because you had snacks.",
    { loot: ["draught", "draught"] },
    [
      { title: "Crocalor", omen: { hearts: 1, loot: ["revive"] } },
      {
        title: "Skeledirge",
        omen: { hearts: 3, loot: ["draught", "draught"] },
      },
    ],
  ),
];
