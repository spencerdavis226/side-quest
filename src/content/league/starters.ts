import type { CardDefinition } from "../../game/types";
import { starter } from "./journey";

// The run's first card: one starter of thirty-five. Since 2026-10-17
// (owner: starters "should be felt pretty heavily") most carry a perk you
// feel on the dice: a bonus on battle rolls, a wider natural 20, an item
// back at every gym. Six are bad on purpose: Bidoof is the worst by a long
// way (and its evolution is worse), Magikarp is awful until Gyarados, and
// Togepi, Sunkern, Drowzee and Zubat are shrugs. Each has one type for the
// run (`league/types.ts`). On 2026-10-25 (owner: a balanced set of types)
// Togepi, Drowzee and Zubat took over the powers of Wooper, Slowpoke and
// Psyduck, three of ten Water starters, and Chespin and Fennekin completed
// Kalos: 6 Fire, 6 Grass, 7 Water, and one each of six other types. Later
// the same day (owner: "at least 1 starter of each type") ten more joined,
// one for each type still missing, from Spheal to Aron. Every later form,
// reached through the routes' evolution cards or a Rare Candy, is a change
// the evolution banner can name (Bibarel's is a downgrade). Eevee branches;
// Pikachu never evolves. The powers are written from the numbers (`starter`
// in `journey.ts`), so the flavor here is only the first sentence. Check
// every starter's own win rate in `tests/league.balance.test.ts`.

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
  // Blaze: hits route battles hard, and bosses once it is Charizard.
  starter(
    "charmander",
    "Charmander",
    "Charmander chose you. Keep its tail lit.",
    { roll: { monster: 2 } },
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
  // A big bag, and the table picks what it becomes. Adaptability: Normal
  // never has the type edge, so it starts with an X Attack.
  starter(
    "eevee",
    "Eevee",
    "Eevee chose you. The table picks its evolution.",
    { hearts: -2, satchel: 4, loot: ["die"] },
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
    { hearts: 1, loot: ["die"] },
    [
      { title: "Quilava", omen: { hearts: 2, loot: ["die"] } },
      {
        title: "Typhlosion",
        omen: { hearts: 3, loot: ["die"], restock: "die" },
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
  // Escape Ropes, a sharp eye on routes, and one back at every gym.
  starter(
    "treecko",
    "Treecko",
    "Treecko chose you, unbothered.",
    { hearts: 2, loot: ["smoke"], roll: { monster: 1 } },
    [
      {
        title: "Grovyle",
        omen: { hearts: 1, loot: ["smoke"], roll: { monster: 1 } },
      },
      {
        title: "Sceptile",
        omen: {
          hearts: 2,
          satchel: 4,
          loot: ["smoke"],
          restock: "smoke",
          roll: { monster: 1 },
        },
      },
    ],
  ),
  // Rival and Ace Trainer killer.
  starter(
    "torchic",
    "Torchic",
    "Torchic chose you. Everyone flap and peep.",
    { hearts: -1, roll: { ambush: 2, elite: 2 } },
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
    { hearts: -7, hurt: { boss: -1 } },
    [
      {
        title: "Marshtomp",
        omen: { hearts: -4, hurt: { boss: -1 }, loot: ["shield"] },
      },
      { title: "Swampert", omen: { hearts: -3, hurt: { boss: -1 } } },
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
  // Big HP, small bag, and Torterra stands up to bosses.
  starter(
    "turtwig",
    "Turtwig",
    "Turtwig chose you, slowly.",
    { hearts: 5, satchel: 2 },
    [
      { title: "Grotle", omen: { hearts: 6, satchel: 3 } },
      {
        title: "Torterra",
        omen: { hearts: 6, satchel: 4, roll: { boss: 1 } },
      },
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
  // Spiky Shield: Ace Trainers and the rival hit softer, on a sturdy team.
  starter(
    "chespin",
    "Chespin",
    "Chespin chose you, spikes out.",
    { hearts: 2, hurt: { ambush: -1, elite: -1 } },
    [
      {
        title: "Quilladin",
        omen: { hearts: 3, hurt: { ambush: -1, elite: -1 }, loot: ["shield"] },
      },
      {
        title: "Chesnaught",
        omen: {
          hearts: 4,
          hurt: { ambush: -1, elite: -1 },
          loot: ["shield"],
          restock: "shield",
        },
      },
    ],
  ),
  // Mystical Fire: sharper against bosses as it grows, on a thin HP pool.
  starter(
    "fennekin",
    "Fennekin",
    "Fennekin chose you, chewing a twig.",
    { roll: { boss: 1 } },
    [
      {
        title: "Braixen",
        omen: { hearts: 1, roll: { boss: 1 }, loot: ["die"] },
      },
      { title: "Delphox", omen: { hearts: 2, roll: { boss: 2 } } },
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
  // A sniper: route battles, and hazards and finds barely touch it.
  starter(
    "rowlet",
    "Rowlet",
    "Rowlet chose you, asleep.",
    { hearts: 2, hurt: { trap: -1, relic: -1 }, roll: { monster: 1 } },
    [
      {
        title: "Dartrix",
        omen: {
          hearts: 2,
          hurt: { trap: -1, relic: -1 },
          roll: { monster: 1 },
          loot: ["draught"],
        },
      },
      {
        title: "Decidueye",
        omen: {
          hearts: 4,
          hurt: { trap: -1, relic: -1 },
          roll: { trap: 2, relic: 2, monster: 1 },
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

  // --- One of every type (owner, 2026-10-25) ---------------------------------
  // Spheal with it: rolls through route battles and keeps rolling.
  starter(
    "spheal",
    "Spheal",
    "Spheal chose you. Spheal with it.",
    { hearts: 2, roll: { monster: 1 } },
    [
      {
        title: "Sealeo",
        omen: { hearts: 3, heal: 1, roll: { monster: 1 } },
      },
      {
        title: "Walrein",
        omen: { hearts: 4, heal: 1, roll: { monster: 1, boss: 1 } },
      },
    ],
  ),
  // Aura: natural 20s come wider, and Lucario's Aura Sphere never misses.
  starter(
    "riolu",
    "Riolu",
    "Riolu chose you. It can read your aura.",
    { hearts: -1, crit: 19 },
    [{ title: "Lucario", omen: { hearts: 1, crit: 18, roll: { boss: 1 } } }],
  ),
  // Bonemerang: Marowak brings bosses down a hit sooner.
  starter(
    "cubone",
    "Cubone",
    "Cubone chose you. Don't ask about the skull.",
    { hearts: -2, loot: ["die"] },
    [{ title: "Marowak", omen: { bossHits: -1 } }],
  ),
  // Corviknight Taxi: carries your drinks to someone else.
  starter(
    "rookidee",
    "Rookidee",
    "Rookidee pecked your phone.",
    { hearts: 2, loot: ["round"], roll: { monster: 1 } },
    [
      {
        title: "Corvisquire",
        omen: { hearts: 3, loot: ["round"], roll: { monster: 1, boss: 1 } },
      },
      {
        title: "Corviknight",
        omen: {
          hearts: 4,
          loot: ["round"],
          restock: "round",
          hurt: { boss: -1 },
          roll: { boss: 1 },
        },
      },
    ],
  ),
  // A Rare Candy to start, a Metapod that only Hardens, then a butterfly.
  starter(
    "caterpie",
    "Caterpie",
    "Caterpie chose you. It wants to be a butterfly.",
    { hearts: -2, loot: ["candy"] },
    [
      { title: "Metapod", omen: { hearts: -1, loot: ["shield", "shield"] } },
      {
        title: "Butterfree",
        omen: { hearts: 2, roll: { all: 1 }, crit: 19 },
      },
    ],
  ),
  // A tank that grows into a monster: huge HP, then bosses tremble.
  starter(
    "larvitar",
    "Larvitar",
    "Larvitar chose you. It ate a mountain on the way.",
    { hearts: 3 },
    [
      { title: "Pupitar", omen: { hearts: 4, hurt: { monster: -1 } } },
      { title: "Tyranitar", omen: { hearts: 5, roll: { boss: 2 } } },
    ],
  ),
  // Back from the dead: a Revive on a thin team, then Gengar's grin.
  starter(
    "gastly",
    "Gastly",
    "Gastly chose you. It licked you first.",
    { hearts: -3, loot: ["revive"] },
    [
      { title: "Haunter", omen: { hearts: -2, roll: { monster: 1 } } },
      { title: "Gengar", omen: { roll: { monster: 1 }, crit: 19 } },
    ],
  ),
  // A land shark: lean early, a monster at the end.
  starter(
    "gible",
    "Gible",
    "Gible chose you. It's chewing on your chair.",
    { hearts: -1, roll: { elite: 1, ambush: 1, boss: 1 } },
    [
      {
        title: "Gabite",
        omen: { roll: { elite: 1, ambush: 1, boss: 1 }, crit: 19 },
      },
      {
        title: "Garchomp",
        omen: { hearts: 2, roll: { all: 1, boss: 1 }, crit: 19 },
      },
    ],
  ),
  // Illusion: an Escape Rope, and Zoroark gets one back at every gym.
  starter(
    "zorua",
    "Zorua",
    "Zorua chose you, disguised as your ex.",
    { hearts: 1, loot: ["smoke"] },
    [
      {
        title: "Zoroark",
        omen: { hearts: 2, loot: ["smoke"], restock: "smoke", crit: 19 },
      },
    ],
  ),
  // Iron Defense: a Protect to start, and a hide that shrugs off routes.
  starter(
    "aron",
    "Aron",
    "Aron chose you. It ate your keys.",
    { hearts: 1, loot: ["shield"] },
    [
      {
        title: "Lairon",
        omen: { hearts: 2, loot: ["shield"], hurt: { monster: -1 } },
      },
      { title: "Aggron", omen: { hearts: 3, hurt: { monster: -1 } } },
    ],
  ),

  // --- The bad ones ---------------------------------------------------------
  // The worst starter in the game, by design (owner, 2026-10-17). It
  // evolves into something worse.
  starter(
    "bidoof",
    "Bidoof",
    "Nobody chooses Bidoof.",
    { hearts: -2, satchel: 2, reroll20: true },
    [
      {
        title: "Bibarel",
        omen: { hearts: -2, satchel: 2, roll: { boss: -1 }, reroll20: true },
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
    "togepi",
    "Togepi",
    "Togepi chose you. It does nothing, but it's very happy to be here.",
    {},
    [{ title: "Togetic", omen: { loot: ["draught"] } }],
  ),
  // The worst stats in the series: a spare HP and nothing else.
  starter(
    "sunkern",
    "Sunkern",
    "Sunkern chose you. It is a seed with a face.",
    { hearts: 4 },
    [{ title: "Sunflora", omen: { hearts: 5 } }],
  ),
  // Sleepy: slow to finish anything, but it naps it off.
  starter(
    "drowzee",
    "Drowzee",
    "Drowzee chose you, yawning.",
    { hearts: 2, bossHits: 1, heal: 3 },
    [{ title: "Hypno", omen: { hearts: 2, heal: 3 } }],
  ),
  // Blind as a bat: more natural 1s.
  starter(
    "zubat",
    "Zubat",
    "Zubat chose you. It flew into a wall doing it.",
    { hearts: 3, fumble: 2 },
    [{ title: "Golbat", omen: { hearts: 3, roll: { all: 1 } } }],
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
  Chespin: ["#5f8f3e", "#c9a46a"],
  Quilladin: ["#4f7f36", "#b98f58"],
  Chesnaught: ["#3f6a30", "#e2d6b4"],
  Fennekin: ["#d9932e", "#c8452e"],
  Braixen: ["#c98a2e", "#8a5a2e"],
  Delphox: ["#b83f2a", "#e9c46a"],
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
  Spheal: ["#4f8fc9", "#e9e2c8"],
  Sealeo: ["#3f7fbf", "#e8e3d4"],
  Walrein: ["#2f6a9a", "#e9dcb4"],
  Riolu: ["#2f6aa8", "#2a2a33"],
  Lucario: ["#2a5c9a", "#e6c34a"],
  Cubone: ["#9a6a3a", "#e9e2d2"],
  Marowak: ["#8a5a30", "#e8e0cc"],
  Rookidee: ["#3a5a9a", "#d9a43a"],
  Corvisquire: ["#34507f", "#c0392b"],
  Corviknight: ["#2c3550", "#c0392b"],
  Caterpie: ["#4f9a3a", "#e6c34a"],
  Metapod: ["#5f8f3a", "#a9c96a"],
  Butterfree: ["#6a5aa8", "#e9e2f2"],
  Larvitar: ["#5f8a3a", "#c9b07a"],
  Pupitar: ["#5a6a8a", "#b9c2d6"],
  Tyranitar: ["#4a6f3a", "#7fa8c9"],
  Gastly: ["#3a2a5a", "#9a6ad6"],
  Haunter: ["#4a2f7a", "#c9a6f2"],
  Gengar: ["#4f3a8a", "#d63a4a"],
  Gible: ["#3a5a8a", "#d64a3a"],
  Gabite: ["#33508a", "#e6c34a"],
  Garchomp: ["#2c4a7a", "#d64a3a"],
  Zorua: ["#3a3a4f", "#c0394a"],
  Zoroark: ["#33333f", "#b02a3a"],
  Aron: ["#6a6f7a", "#e9e9ef"],
  Lairon: ["#5f6470", "#d9dce4"],
  Aggron: ["#4f545f", "#e6e9ef"],
  Bidoof: ["#7c624a", "#c9b391"],
  Bibarel: ["#6a5240", "#b3a07e"],
  Magikarp: ["#c8442e", "#f3c86a"],
  Gyarados: ["#2a64a8", "#f2e0a0"],
  Togepi: ["#7a8fb8", "#d84a4a"],
  Togetic: ["#6f86b4", "#e9e2d0"],
  Sunkern: ["#e9c24a", "#6faf4a"],
  Sunflora: ["#f2c230", "#4f9a3a"],
  Drowzee: ["#c9962e", "#6a4a2e"],
  Hypno: ["#d6a92e", "#efe9dc"],
  Zubat: ["#3f6aa8", "#8e5aa8"],
  Golbat: ["#3a5a9a", "#c2508a"],
};
const palette = (title: string) => {
  const [primary, secondary] = PALETTES[title];
  return { primary, secondary };
};
for (const c of starters) {
  c.palette = palette(c.title);
  for (const e of c.evolves ?? []) e.palette = palette(e.title);
}
