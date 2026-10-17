import type { CardDefinition } from "../../game/types";
import { starter } from "./journey";

// The run's first card: one starter of seventeen, from every generation.
// Each holds a trade-off for the run, and each later form (reached through
// the routes' evolution cards) replaces it with a stronger one. Eevee
// branches: its one evolution is Vaporeon, Jolteon or Flareon, the table's
// pick. Pikachu refuses to evolve. Starters may name Team HP and items: they only play in
// the League. Check every starter's own win rate in `tests/league.test.ts`.

export const starters: CardDefinition[] = [
  starter(
    "bulbasaur",
    "Bulbasaur",
    "Bulbasaur chose you. Two less HP, but every heal heals one more. Everyone sniff the bulb.",
    { hearts: -2, heal: 1 },
    [
      {
        title: "Ivysaur",
        rules: "Full HP back, and every heal heals one more.",
        omen: { heal: 1 },
      },
      {
        title: "Venusaur",
        rules: "Two more HP, and every heal heals two more.",
        omen: { hearts: 2, heal: 2 },
      },
    ],
  ),
  starter(
    "charmander",
    "Charmander",
    "Charmander chose you. Wild fights hurt one less, bosses one more. Keep its tail lit.",
    { hurt: { monster: -1, boss: 1 } },
    [
      {
        title: "Charmeleon",
        rules: "Wild fights hurt one less, and bosses hurt as written.",
        omen: { hurt: { monster: -1 } },
      },
      {
        title: "Charizard",
        rules:
          "Wild fights and bosses both hurt one less. It still won't listen.",
        omen: { hurt: { monster: -1, boss: -1 } },
      },
    ],
  ),
  starter(
    "squirtle",
    "Squirtle",
    "Squirtle chose you, in sunglasses. A Protect to start, but the bag holds only two.",
    { satchel: 2, loot: ["shield"] },
    [
      {
        title: "Wartortle",
        rules: "Another Protect, and the bag holds three.",
        omen: { satchel: 3, loot: ["shield"] },
      },
      {
        title: "Blastoise",
        rules: "Another Protect, and the bag holds four. Cannons out.",
        omen: { satchel: 4, loot: ["shield"] },
      },
    ],
  ),
  starter(
    "pikachu",
    "Pikachu",
    "Pikachu won't go in its ball and won't evolve. Ever. Two more HP and an X Attack. Everyone yells Pika.",
    { hearts: 2, loot: ["die"] },
  ),
  starter(
    "eevee",
    "Eevee",
    "Eevee chose you. Two less HP, a bag of four, and the table picks what it evolves into.",
    { hearts: -2, satchel: 4 },
    [
      {
        title: "Vaporeon",
        rules: "Three more HP, a bag of four, and every heal heals one more.",
        omen: { hearts: 3, satchel: 4, heal: 1 },
      },
      {
        title: "Jolteon",
        rules:
          "A bag of four with an Escape Rope, and wild fights and trainers hurt one less.",
        omen: { satchel: 4, loot: ["smoke"], hurt: { monster: -1, trial: -1 } },
      },
      {
        title: "Flareon",
        rules: "One more HP, a bag of four and two X Attacks.",
        omen: { hearts: 1, satchel: 4, loot: ["die", "die"] },
      },
    ],
    true,
  ),
  starter(
    "cyndaquil",
    "Cyndaquil",
    "Cyndaquil chose you, half asleep. One less HP, but an X Attack to start.",
    { hearts: -1, loot: ["die"] },
    [
      {
        title: "Quilava",
        rules: "Full HP, and another X Attack.",
        omen: { loot: ["die"] },
      },
      {
        title: "Typhlosion",
        rules: "Two more HP, and another X Attack. Don't ask about the lore.",
        omen: { hearts: 2, loot: ["die"] },
      },
    ],
  ),
  starter(
    "totodile",
    "Totodile",
    "Totodile chose you by biting you. Three more HP, but wild fights hurt one more.",
    { hearts: 3, hurt: { monster: 1 } },
    [
      {
        title: "Croconaw",
        rules: "Four more HP, and wild fights still hurt one more.",
        omen: { hearts: 4, hurt: { monster: 1 } },
      },
      {
        title: "Feraligatr",
        rules: "Five more HP, and wild fights hurt as written.",
        omen: { hearts: 5 },
      },
    ],
  ),
  starter(
    "treecko",
    "Treecko",
    "Treecko chose you. An Escape Rope to start; rivals and Ace Trainers hurt one more.",
    { loot: ["smoke"], hurt: { ambush: 1, elite: 1 } },
    [
      {
        title: "Grovyle",
        rules:
          "Another Escape Rope, and rivals and Ace Trainers hurt as written.",
        omen: { loot: ["smoke"] },
      },
      {
        title: "Sceptile",
        rules: "An X Attack too. Leaf Blade.",
        omen: { loot: ["die"] },
      },
    ],
  ),
  starter(
    "torchic",
    "Torchic",
    "Torchic chose you. Two less HP, but rivals and Ace Trainers hurt one less. Everyone flap and peep.",
    { hearts: -2, hurt: { ambush: -1, elite: -1 } },
    [
      {
        title: "Combusken",
        rules: "Full HP, and rivals and Ace Trainers hurt one less.",
        omen: { hurt: { ambush: -1, elite: -1 } },
      },
      {
        title: "Blaziken",
        rules:
          "Two more HP. Rivals, Ace Trainers and wild fights hurt one less.",
        omen: { hearts: 2, hurt: { ambush: -1, elite: -1, monster: -1 } },
      },
    ],
  ),
  starter(
    "mudkip",
    "Mudkip",
    "So I herd u liek Mudkipz. Four less HP, but bosses hurt one less.",
    { hearts: -4, hurt: { boss: -1 } },
    [
      {
        title: "Marshtomp",
        rules: "Two less HP, and bosses hurt one less.",
        omen: { hearts: -2, hurt: { boss: -1 } },
      },
      {
        title: "Swampert",
        rules: "One more HP, and bosses hurt one less.",
        omen: { hearts: 1, hurt: { boss: -1 } },
      },
    ],
  ),
  starter(
    "piplup",
    "Piplup",
    "Piplup chose you and is very proud of it. Six more HP and a Protect, but every boss takes a hit more.",
    { hearts: 6, bossHits: 1, loot: ["shield"] },
    [
      {
        title: "Prinplup",
        rules: "Six more HP and a Protect, but bosses still take a hit more.",
        omen: { hearts: 6, bossHits: 1, loot: ["shield"] },
      },
      {
        title: "Empoleon",
        rules: "Six more HP, and bosses fall as written. Too proud to lose.",
        omen: { hearts: 6 },
      },
    ],
  ),
  starter(
    "turtwig",
    "Turtwig",
    "Turtwig chose you, slowly. Four more HP, but the bag holds only two.",
    { hearts: 4, satchel: 2 },
    [
      {
        title: "Grotle",
        rules: "Five more HP, and the bag still holds two.",
        omen: { hearts: 5, satchel: 2 },
      },
      {
        title: "Torterra",
        rules:
          "Six more HP, and the bag holds three. There's a tree on its back.",
        omen: { hearts: 6, satchel: 3 },
      },
    ],
  ),
  starter(
    "oshawott",
    "Oshawott",
    "Oshawott chose you, scalchop out. Three less HP, but a Protect and an X Attack to start.",
    { hearts: -3, loot: ["shield", "die"] },
    [
      {
        title: "Dewott",
        rules: "One less HP, and another Protect.",
        omen: { hearts: -1, loot: ["shield"] },
      },
      {
        title: "Samurott",
        rules: "One more HP, an X Attack, and Ace Trainers hurt one less.",
        omen: { hearts: 1, loot: ["die"], hurt: { elite: -1 } },
      },
    ],
  ),
  starter(
    "froakie",
    "Froakie",
    "Froakie chose you, covered in bubbles. Two less HP, but two Escape Ropes to start.",
    { hearts: -2, loot: ["smoke", "smoke"] },
    [
      {
        title: "Frogadier",
        rules: "One less HP, and another Escape Rope.",
        omen: { hearts: -1, loot: ["smoke"] },
      },
      {
        title: "Greninja",
        rules: "An X Attack, and wild fights hurt one less. Ninja.",
        omen: { loot: ["die"], hurt: { monster: -1 } },
      },
    ],
  ),
  starter(
    "rowlet",
    "Rowlet",
    "Rowlet chose you and fell asleep on your head. One less HP, but hazards and finds hurt one less.",
    { hearts: -1, hurt: { trap: -1, relic: -1 } },
    [
      {
        title: "Dartrix",
        rules: "Full HP, and hazards and finds hurt one less.",
        omen: { hurt: { trap: -1, relic: -1 } },
      },
      {
        title: "Decidueye",
        rules: "Two more HP and an X Attack. Hazards and finds hurt one less.",
        omen: { hearts: 2, loot: ["die"], hurt: { trap: -1, relic: -1 } },
      },
    ],
  ),
  starter(
    "scorbunny",
    "Scorbunny",
    "Scorbunny chose you, bouncing. Wild fights and trainers hurt one less, but the bag holds two.",
    { satchel: 2, hurt: { monster: -1, trial: -1 } },
    [
      {
        title: "Raboot",
        rules: "The bag holds three. Wild fights and trainers hurt one less.",
        omen: { satchel: 3, hurt: { monster: -1, trial: -1 } },
      },
      {
        title: "Cinderace",
        rules: "An X Attack too. Wild fights and trainers hurt one less.",
        omen: { satchel: 3, loot: ["die"], hurt: { monster: -1, trial: -1 } },
      },
    ],
  ),
  starter(
    "fuecoco",
    "Fuecoco",
    "Fuecoco chose you because you had snacks. Three less HP, but every heal heals two more.",
    { hearts: -3, heal: 2 },
    [
      {
        title: "Crocalor",
        rules: "One less HP, and every heal heals two more.",
        omen: { hearts: -1, heal: 2 },
      },
      {
        title: "Skeledirge",
        rules: "One more HP, and every heal heals two more. It sings.",
        omen: { hearts: 1, heal: 2 },
      },
    ],
  ),
];
