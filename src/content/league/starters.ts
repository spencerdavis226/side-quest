import type { CardDefinition } from "../../game/types";
import { starter } from "./journey";

// The run's first card: one starter of twenty-three. Since 2026-10-17
// (owner: starters "should be felt pretty heavily") most carry a perk you
// feel on the dice: a bonus on battle rolls, a wider natural 20, an item
// back at every gym. Six are bad on purpose: Bidoof is the worst by a long
// way (and its evolution is worse), Magikarp is awful until Gyarados, and
// Wooper, Sunkern, Slowpoke and Psyduck are shrugs. Every later form,
// reached through the routes' evolution cards or a Rare Candy, is a change
// the evolution banner can name (Bibarel's is a downgrade). Eevee branches;
// Pikachu never evolves. The powers are written from the numbers (`starter`
// in `journey.ts`), so the flavor here is only the first sentence. Check
// every starter's own win rate in `tests/league.test.ts`.

export const starters: CardDefinition[] = [
  // Healing: every heal heals a lot more.
  starter(
    "bulbasaur",
    "Bulbasaur",
    "Bulbasaur chose you. Everyone sniff the bulb.",
    { hearts: -2, heal: 2 },
    [
      { title: "Ivysaur", omen: { heal: 2, loot: ["draught"] } },
      { title: "Venusaur", omen: { hearts: 2, heal: 3 } },
    ],
  ),
  // Blaze: hits route battles hard, weak to bosses until it grows.
  starter(
    "charmander",
    "Charmander",
    "Charmander chose you. Keep its tail lit.",
    { roll: { monster: 2 }, hurt: { boss: 1 } },
    [
      { title: "Charmeleon", omen: { hearts: 1, roll: { monster: 2 } } },
      {
        title: "Charizard",
        omen: { hearts: 2, roll: { monster: 2, boss: 1 } },
      },
    ],
  ),
  // Squirtle Squad: Protects, and from Wartortle one back at every gym.
  starter(
    "squirtle",
    "Squirtle",
    "Squirtle chose you, in sunglasses.",
    { satchel: 2, loot: ["shield"] },
    [
      {
        title: "Wartortle",
        omen: { satchel: 3, loot: ["shield"], restock: "shield" },
      },
      {
        title: "Blastoise",
        omen: {
          satchel: 4,
          loot: ["shield"],
          restock: "shield",
        },
      },
    ],
  ),
  // Never evolves: luckier on every roll from the first card.
  starter("pikachu", "Pikachu", "Pikachu won't evolve. Ever.", {
    hearts: 1,
    roll: { all: 1 },
    crit: 19,
  }),
  // A big bag, and the table picks what it becomes.
  starter(
    "eevee",
    "Eevee",
    "Eevee chose you. The table picks what it evolves into.",
    { hearts: -2, satchel: 4 },
    [
      { title: "Vaporeon", omen: { hearts: 3, satchel: 4, heal: 2 } },
      {
        title: "Jolteon",
        omen: { satchel: 4, roll: { all: 1 }, loot: ["smoke"] },
      },
      {
        title: "Flareon",
        omen: { hearts: 1, satchel: 4, crit: 19, loot: ["die"] },
      },
    ],
    true,
  ),
  // X Attacks, then one back at every gym.
  starter(
    "cyndaquil",
    "Cyndaquil",
    "Cyndaquil chose you, half asleep.",
    { hearts: -1, loot: ["die"] },
    [
      { title: "Quilava", omen: { loot: ["die"] } },
      {
        title: "Typhlosion",
        omen: { hearts: 2, loot: ["die"], restock: "die" },
      },
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
      { title: "Feraligatr", omen: { hearts: 6, roll: { boss: 1 } } },
    ],
  ),
  // Escape Ropes, and finally one back at every gym.
  starter(
    "treecko",
    "Treecko",
    "Treecko chose you, unbothered.",
    { loot: ["smoke"], hurt: { ambush: 1, elite: 1 } },
    [
      { title: "Grovyle", omen: { hearts: 1, loot: ["smoke"] } },
      {
        title: "Sceptile",
        omen: { hearts: 2, satchel: 4, loot: ["smoke"], restock: "smoke" },
      },
    ],
  ),
  // Rival and Ace Trainer killer.
  starter(
    "torchic",
    "Torchic",
    "Torchic chose you. Everyone flap and peep.",
    { hearts: -2, roll: { ambush: 2, elite: 2 } },
    [
      {
        title: "Combusken",
        omen: { roll: { ambush: 2, elite: 2 }, loot: ["die"] },
      },
      {
        title: "Blaziken",
        omen: { hearts: 2, roll: { all: 1, ambush: 2, elite: 2 } },
      },
    ],
  ),
  // Boss killer on a small HP pool.
  starter(
    "mudkip",
    "Mudkip",
    "So I herd u liek Mudkipz.",
    { hearts: -6, hurt: { boss: -1 } },
    [
      {
        title: "Marshtomp",
        omen: { hearts: -4, hurt: { boss: -1 }, loot: ["shield"] },
      },
      { title: "Swampert", omen: { hurt: { boss: -1 }, roll: { boss: 1 } } },
    ],
  ),
  // Huge HP, too proud to finish bosses quickly until it grows up.
  starter(
    "piplup",
    "Piplup",
    "Piplup chose you, proudly.",
    { hearts: 6, bossHits: 1, loot: ["shield"] },
    [
      { title: "Prinplup", omen: { hearts: 6, bossHits: 1, loot: ["shield"] } },
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
  // A bit of everything on a thin HP pool, and a sharp blade at the end.
  starter(
    "oshawott",
    "Oshawott",
    "Oshawott chose you, scalchop out.",
    { hearts: -3, loot: ["shield", "die"] },
    [
      { title: "Dewott", omen: { hearts: -1, loot: ["shield"] } },
      { title: "Samurott", omen: { hearts: 1, loot: ["die"], crit: 19 } },
    ],
  ),
  // Grows up fast: a Rare Candy to start, and a ninja at the end.
  starter(
    "froakie",
    "Froakie",
    "Froakie chose you, covered in bubbles.",
    { hearts: -2, loot: ["candy"] },
    [
      {
        title: "Frogadier",
        omen: { hearts: -1, loot: ["smoke"], roll: { monster: 1 } },
      },
      {
        title: "Greninja",
        omen: { hearts: 1, roll: { monster: 2 }, crit: 19 },
      },
    ],
  ),
  // Hazards and finds barely touch it, then it snipes them.
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
        omen: {
          hearts: 2,
          hurt: { trap: -1, relic: -1 },
          roll: { trap: 2, relic: 2 },
        },
      },
    ],
  ),
  // Light on its feet, then lucky on every roll.
  starter(
    "scorbunny",
    "Scorbunny",
    "Scorbunny chose you. Boing.",
    { satchel: 2, hurt: { monster: -1, trial: -1 } },
    [
      {
        title: "Raboot",
        omen: {
          hearts: 1,
          satchel: 3,
          hurt: { monster: -1, trial: -1 },
          roll: { all: 1 },
        },
      },
      {
        title: "Cinderace",
        omen: {
          hearts: 2,
          satchel: 3,
          hurt: { monster: -1, trial: -1 },
          roll: { all: 1 },
          crit: 19,
        },
      },
    ],
  ),
  // Snacks: Potions, a Revive, then more Potions that heal more.
  starter(
    "fuecoco",
    "Fuecoco",
    "Fuecoco chose you because you had snacks.",
    { loot: ["draught", "draught"] },
    [
      { title: "Crocalor", omen: { hearts: 1, loot: ["revive"] } },
      {
        title: "Skeledirge",
        omen: { hearts: 3, heal: 1, loot: ["draught", "draught"] },
      },
    ],
  ),

  // --- The bad ones ---------------------------------------------------------
  // The worst starter in the game, by design (owner, 2026-10-17). It
  // evolves into something worse.
  starter(
    "bidoof",
    "Bidoof",
    "Nobody chooses Bidoof.",
    { hearts: -2, satchel: 2, roll: { boss: -1 }, reroll20: true },
    [
      {
        title: "Bibarel",
        omen: { hearts: -3, satchel: 2, roll: { boss: -1 }, reroll20: true },
      },
    ],
  ),
  // Splash. Useless until it isn't.
  starter(
    "magikarp",
    "Magikarp",
    "Magikarp chose you. It used Splash. Nothing happened.",
    { hearts: -2, roll: { all: -1 } },
    [
      {
        title: "Gyarados",
        omen: { hearts: 3, roll: { all: 1 } },
      },
    ],
  ),
  // Does nothing, happily.
  starter(
    "wooper",
    "Wooper",
    "Wooper chose you. It does nothing, but it's very happy to be here.",
    {},
    [{ title: "Quagsire", omen: { loot: ["draught"] } }],
  ),
  // The worst stats in the series, and it shows.
  starter(
    "sunkern",
    "Sunkern",
    "Sunkern chose you. It is a seed with a face.",
    { hearts: -2 },
    [{ title: "Sunflora", omen: { hearts: -1 } }],
  ),
  // Slow to finish anything, but it naps it off.
  starter(
    "slowpoke",
    "Slowpoke",
    "Slowpoke chose you. Eventually.",
    { bossHits: 1, heal: 2 },
    [{ title: "Slowbro", omen: { hearts: 1, heal: 2 } }],
  ),
  // A permanent headache: more natural 1s.
  starter(
    "psyduck",
    "Psyduck",
    "Psyduck chose you. It has a headache. So do you.",
    { hearts: 3, fumble: 2 },
    [{ title: "Golduck", omen: { hearts: 3, roll: { all: 1 } } }],
  ),
];

// Each form's dice (2026-10-17): its body colour as the enamel, its accent
// as the metal and trim. `tests/dice-palette.test.ts` holds the numerals
// legible on every one. Bidoof's are the drabbest on purpose.
const PALETTES: Record<string, [primary: string, secondary: string]> = {
  Bulbasaur: ["#2e7d6b", "#9bd16a"],
  Ivysaur: ["#2f6f5e", "#e07a9a"],
  Venusaur: ["#276b56", "#e5566f"],
  Charmander: ["#c9531f", "#f6c445"],
  Charmeleon: ["#b23a26", "#f2b544"],
  Charizard: ["#c45f22", "#3f8f9e"],
  Squirtle: ["#2f7fc0", "#d9a560"],
  Wartortle: ["#3266a8", "#e8e3d6"],
  Blastoise: ["#2a568f", "#b9bcc4"],
  Pikachu: ["#f0c22c", "#c8372b"],
  Eevee: ["#8a5a2e", "#f0dcae"],
  Vaporeon: ["#2f7fb4", "#f2d36b"],
  Jolteon: ["#e3b52a", "#f4f1e4"],
  Flareon: ["#c64b24", "#f3dca0"],
  Cyndaquil: ["#2d4b5c", "#f2a43a"],
  Quilava: ["#34505f", "#f08a2e"],
  Typhlosion: ["#2a4253", "#ef6a2a"],
  Totodile: ["#2f7fb8", "#d9483b"],
  Croconaw: ["#2d6aa6", "#d3443a"],
  Feraligatr: ["#25598f", "#c93a33"],
  Treecko: ["#3f8a3a", "#d8505a"],
  Grovyle: ["#357a35", "#e0c64a"],
  Sceptile: ["#2a6a32", "#e64e5a"],
  Torchic: ["#d9672a", "#f5d14a"],
  Combusken: ["#c4592a", "#f1d26a"],
  Blaziken: ["#a9302a", "#f2d36b"],
  Mudkip: ["#3f7fc0", "#f08a3a"],
  Marshtomp: ["#3a6fa8", "#8fb6dc"],
  Swampert: ["#2f5f9a", "#f08a3a"],
  Piplup: ["#2f62a8", "#f2c84b"],
  Prinplup: ["#28539a", "#f2c84b"],
  Empoleon: ["#1f4a8c", "#e9c34c"],
  Turtwig: ["#4f8f3f", "#b8864e"],
  Grotle: ["#457f39", "#a9773f"],
  Torterra: ["#3f7036", "#9a9a92"],
  Oshawott: ["#3a8cc4", "#f2e8cf"],
  Dewott: ["#337cb0", "#e8d9b0"],
  Samurott: ["#2a5680", "#d9c7a0"],
  Froakie: ["#2f88c4", "#f2f0f6"],
  Frogadier: ["#2e78b8", "#f4f2f7"],
  Greninja: ["#284c86", "#e9718e"],
  Rowlet: ["#8e6a42", "#6fbf5a"],
  Dartrix: ["#7c5c3a", "#e6e0d2"],
  Decidueye: ["#55652f", "#d97a3a"],
  Scorbunny: ["#ece9e2", "#e2562e"],
  Raboot: ["#5e5e5e", "#e8692e"],
  Cinderace: ["#efede7", "#d8402e"],
  Fuecoco: ["#c93f2a", "#f4d06a"],
  Crocalor: ["#c0392a", "#f2c34a"],
  Skeledirge: ["#a52e28", "#f4c86e"],
  Bidoof: ["#7c624a", "#c9b391"],
  Bibarel: ["#6a5240", "#b3a07e"],
  Magikarp: ["#c8442e", "#f3c86a"],
  Gyarados: ["#2a64a8", "#f2e0a0"],
  Wooper: ["#5aa8d6", "#f08ab0"],
  Quagsire: ["#3a82b4", "#9ad0e8"],
  Sunkern: ["#e9c24a", "#6faf4a"],
  Sunflora: ["#f2c230", "#4f9a3a"],
  Slowpoke: ["#e488a6", "#f2e3c6"],
  Slowbro: ["#d87394", "#8e8e96"],
  Psyduck: ["#efc23a", "#e8e0d0"],
  Golduck: ["#3a76b6", "#e94a4a"],
};
const palette = (title: string) => {
  const [primary, secondary] = PALETTES[title];
  return { primary, secondary };
};
for (const c of starters) {
  c.palette = palette(c.title);
  for (const e of c.evolves ?? []) e.palette = palette(e.title);
}
