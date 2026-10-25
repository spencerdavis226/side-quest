import type { CardDefinition } from "../../game/types";
import { evolution, gamble, pair, strike, trainer, vs, wild } from "./journey";

// Type expansion (owner, 2026-10-25): three more fights on each route, so
// every starter type meets about as many good matchups as bad ones. The
// League was short of Grass, Ground and Electric (Grass starters met 14 bad
// matchups a run to 8 good), so these lean that way, with Fairy, Rock,
// Psychic and Water: 5 Grass, 5 Ground, 5 Electric, 3 Fairy, 2 Rock, 2
// Psychic, 2 Water. Each route's list follows its own (`routes.ts`); types
// are in `types.ts`. Never write Team HP or items into these rules.

export const moreWilds: CardDefinition[][] = [
  // Route 1
  [
    strike(
      0,
      "route-oddish",
      "Oddish",
      "Wild Oddish is a radish with legs, walking in circles.",
      {
        even: "It Absorbs your drink. Drink 2.",
        advantage: "You pull it up like a carrot. Give 2.",
        disadvantage: "Sleep Powder. Drink 4 with your eyes closed.",
      },
    ),
    strike(
      0,
      "route-diglett",
      "Diglett",
      "A Diglett pops up between your feet. Stomp once.",
      {
        even: "Wrong hole. Drink 2.",
        advantage: "Whack-a-mole champion. Give 3.",
        disadvantage: "It trips you from below. Drink 4.",
      },
    ),
    strike(
      0,
      "route-pichu",
      "Pichu",
      "Wild Pichu sparks. It shocks itself more than you.",
      {
        even: "It faints from its own spark. Give 2.",
        advantage: "You ground it. Give 3.",
        disadvantage: "Thunder Shock. Drink 4.",
      },
    ),
  ],
  // Route 2
  [
    strike(
      1,
      "route-seedot",
      "Seedot",
      "Wild Seedot is an acorn, and it is judging you.",
      {
        even: "It headbutts your shin. Drink 2.",
        advantage: "You drop it in a planter. Give 2.",
        disadvantage: "Bullet Seed, right in the shin. Drink 4.",
      },
    ),
    strike(
      1,
      "route-geodude",
      "Geodude",
      "The rock you sat on was a Geodude. Stand up.",
      {
        even: "Defense Curl, then a headbutt. Drink 2.",
        advantage: "You skip it across the pond. Give 3.",
        disadvantage: "Rock Throw. Drink 4.",
      },
    ),
    strike(
      1,
      "route-snubbull",
      "Snubbull",
      "Wild Snubbull growls through its underbite. Growl back.",
      {
        even: "It wants belly rubs. Give 2.",
        advantage: "It rolls over for you. Give 3.",
        disadvantage: "It bites and won't let go. Drink 4.",
      },
    ),
  ],
  // Route 3
  [
    wild(
      2,
      "route-voltorb",
      "Voltorb",
      "A Poké Ball on the path. Pick it up? It's a Voltorb. Roll d20.",
      vs(
        "Self-Destruct, in your hand. Drink 3.",
        "You roll it gently into the bushes. Give 2.",
      ),
    ),
    strike(
      2,
      "route-sandshrew",
      "Sandshrew",
      "Wild Sandshrew curls into a ball and rolls at your drink.",
      {
        even: "Splash. Drink 2.",
        advantage: "You catch it like a bowling pin. Give 3.",
        disadvantage: "It spills the lot. Drink 4.",
      },
    ),
    strike(
      2,
      "route-bellsprout",
      "Bellsprout",
      "Wild Bellsprout sways like it's had six. Sway with it.",
      {
        even: "Wobble. Drink 2.",
        advantage: "It faints into your lap. Give 3.",
        disadvantage: "Vine Whip. Drink 4.",
      },
    ),
  ],
  // Route 4
  [
    strike(
      3,
      "route-wingull",
      "Wingull",
      "Wild Wingull snatches a chip out of your hand.",
      {
        even: "Rude. Drink 2.",
        advantage: "You snatch it back. Give 3.",
        disadvantage: "It brings friends. Drink 5.",
      },
    ),
    wild(
      3,
      "route-ralts",
      "Ralts",
      "Wild Ralts senses your feelings and looks worried. Roll d20.",
      vs(
        "It cries with you. Drink 3 for your feelings.",
        "It feels better, so do you. Give 3.",
      ),
    ),
    wild(
      3,
      "route-phanpy",
      "Phanpy",
      "Wild Phanpy sprays you with its trunk. Trumpet back, then roll 2d6.",
      pair(
        "Rollout, right into your chair. Drink 3.",
        "You out-trumpet it. Give 3.",
      ),
    ),
  ],
  // Route 5
  [
    strike(
      4,
      "route-tangela",
      "Tangela",
      "Wild Tangela is a ball of blue spaghetti, and it's hungry.",
      {
        even: "It tangles you up. Drink 2.",
        advantage: "You eat it first. Give 3.",
        disadvantage: "Vine tangle. Drink 5.",
      },
    ),
    trainer(
      4,
      "route-engineer",
      "Engineer Bernie",
      "Engineer Bernie's Magnemite stick to your phone. Roll d20.",
      vs(
        "Thunder Wave. Drink 3 without moving.",
        "You peel them off like fridge magnets. Give 3.",
      ),
    ),
    strike(
      4,
      "route-spritzee",
      "Spritzee",
      "Wild Spritzee smells like a department store.",
      {
        even: "Sneeze. Drink 2.",
        advantage: "Free perfume sample. Give 3.",
        disadvantage: "Overwhelming scent. Drink 5.",
      },
    ),
  ],
  // Route 6
  [
    wild(
      5,
      "route-sudowoodo",
      "Sudowoodo",
      "A tree blocks the road and won't make eye contact. Roll d20.",
      vs(
        "It's Sudowoodo. Rock Throw. Drink 3.",
        "You water it. It panics and runs. Give 3.",
      ),
    ),
    strike(
      5,
      "route-rotom",
      "Rotom",
      "A Rotom got into the phone. Don't drop it.",
      {
        even: "It orders pizza. Drink 2.",
        advantage: "You post it online. Give 3.",
        disadvantage: "It texts your ex. Drink 6.",
      },
    ),
    strike(
      5,
      "route-breloom",
      "Breloom",
      "Wild Breloom throws a mushroom haymaker. Duck.",
      {
        even: "It grazes you. Drink 2.",
        advantage: "It clocks a tree instead. Give 3.",
        disadvantage: "Mach Punch. Drink 6.",
      },
    ),
  ],
  // Route 7
  [
    trainer(
      6,
      "route-ruin-maniac",
      "Ruin Maniac Liz",
      "Ruin Maniac Liz's Donphan rolls at you like a monster truck tire. Roll d20.",
      vs(
        "Rollout. Drink 4.",
        "You step aside and it rolls into a ruin. Give 3.",
      ),
    ),
    wild(
      6,
      "route-gardevoir",
      "Gardevoir",
      "Wild Gardevoir would give its life for its trainer. You are not its trainer. Roll d20.",
      vs(
        "It reads your search history aloud. Drink 4.",
        "It teleports away, blushing. Give 3.",
      ),
    ),
    strike(
      6,
      "route-wailord",
      "Wailord",
      "A Wailord surfaces and blots out the sun. Everyone looks up.",
      {
        even: "Splash. Everyone drinks 1.",
        advantage: "It waves. Give 4.",
        disadvantage: "Water Spout. Drink 6.",
      },
    ),
  ],
  // Route 8
  [
    wild(
      7,
      "route-rhyperior",
      "Rhyperior",
      "Wild Rhyperior fires rocks out of its hands. Duck, then roll 2d6.",
      pair(
        "Rock Wrecker, square on. Drink 4.",
        "You catch one and keep it. Give 4.",
      ),
    ),
    strike(
      7,
      "route-electivire",
      "Electivire",
      "Wild Electivire plugs its tails into the wall. The lights dim.",
      {
        even: "Brownout. Drink 3.",
        advantage: "You unplug it. Give 4.",
        disadvantage: "Thunder Punch. Drink 6.",
      },
    ),
    strike(
      7,
      "route-togekiss",
      "Togekiss",
      "Wild Togekiss blesses the table, then wants a battle.",
      {
        even: "Blessed. Everyone drinks 1.",
        advantage: "It joins the blessing. Give 4.",
        disadvantage: "Air Slash. Drink 6.",
      },
    ),
  ],
];

/** An evolution chance on Route 5, which had none, and a second one on
 * Routes 2, 4 and 6, so the bigger route pools (the strikes and table
 * moments of 2026-10-25) still evolve about as often as before. */
export const moreEvolutions: Partial<Record<number, CardDefinition>> = {
  1: evolution(
    1,
    "route-link-cable",
    "Link Cable",
    "A stranger offers to trade your starter over a link cable. It's not a scam. Probably.",
  ),
  3: evolution(
    3,
    "route-sun-stone",
    "Sun Stone",
    "A Sun Stone glows in a flower patch. Your starter leans toward it.",
  ),
  5: evolution(
    5,
    "route-friendship-glow",
    "Friendship Glow",
    "Your starter hasn't left your side all journey. It starts to glow.",
  ),
  4: evolution(
    4,
    "route-day-care",
    "Day Care",
    "The Day Care couple trained your starter while you napped. It looks different.",
  ),
};

/** A Tera Raid den on Route 7: walk past, or join the raid for a Tera Orb. */
export const teraRaid = gamble(
  6,
  "route-tera-raid",
  "Tera Raid Den",
  "A den glows like a geode. Something huge and crystal sleeps inside.",
  11,
  "The raid boss shrugs you off. Drink 3.",
  "The crystal shatters into an orb. Give 3.",
  ["Walk past", "Join the raid"],
  "tera",
);
