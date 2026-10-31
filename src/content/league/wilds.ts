import type { CardDefinition } from "../../game/types";
import { evolution, pair, strike, trainer, vs, wild } from "./journey";

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
    strike(0, "route-oddish", "Oddish", {
      even: "Wild Oddish, a radish with legs, circles you and Absorbs your drink. Drink 2.",
      advantage:
        "Wild Oddish walks in circles until you pull it up like a carrot. Give 2.",
      disadvantage:
        "Wild Oddish circles you and uses Sleep Powder. Drink 4 with your eyes closed.",
    }),
    strike(0, "route-diglett", "Diglett", {
      even: "A Diglett pops up between your feet and you stomp the wrong hole. Drink 2.",
      advantage:
        "A Diglett pops up between your feet and you whack it first. Give 3.",
      disadvantage:
        "A Diglett pops up between your feet and trips you from below. Drink 4.",
    }),
    strike(0, "route-pichu", "Pichu", {
      even: "Wild Pichu sparks and shocks itself harder than you. It faints. Give 2.",
      advantage:
        "Wild Pichu sparks, but you ground it before it shocks anyone. Give 3.",
      disadvantage:
        "Wild Pichu sparks and Thunder Shock lights you up. Drink 4.",
    }),
  ],
  // Route 2
  [
    strike(1, "route-seedot", "Seedot", {
      even: "Wild Seedot, an acorn judging you, headbutts your shin. Drink 2.",
      advantage:
        "Wild Seedot, an acorn judging you, gets dropped in a planter. Give 2.",
      disadvantage:
        "Wild Seedot, an acorn judging you, fires Bullet Seed into your shin. Drink 4.",
    }),
    strike(1, "route-geodude", "Geodude", {
      even: "The rock you sat on was a Geodude. It Defense Curls, then headbutts. Drink 2.",
      advantage:
        "The rock you sat on was a Geodude. You skip it across the pond. Give 3.",
      disadvantage:
        "The rock you sat on was a Geodude, and it fires Rock Throw. Drink 4.",
    }),
    strike(1, "route-snubbull", "Snubbull", {
      even: "Wild Snubbull growls through its underbite. Growl back; it wants belly rubs. Give 2.",
      advantage:
        "Wild Snubbull growls through its underbite, then rolls over for you. Give 3.",
      disadvantage:
        "Wild Snubbull growls through its underbite, bites, and won't let go. Drink 4.",
    }),
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
        "You roll it to your left neighbor, who drinks 2 and screams.",
      ),
    ),
    strike(2, "route-sandshrew", "Sandshrew", {
      even: "Wild Sandshrew curls up and rolls at your drink. Splash. Drink 2.",
      advantage:
        "Wild Sandshrew rolls at your drink, but you catch it like a bowling pin. Give 3.",
      disadvantage:
        "Wild Sandshrew rolls at your drink and spills the lot. Drink 4.",
    }),
    strike(2, "route-bellsprout", "Bellsprout", {
      even: "Wild Bellsprout sways like it's had six. Sway with it, then wobble. Drink 2.",
      advantage:
        "Wild Bellsprout sways like it's had six, then faints into your lap. Give 3.",
      disadvantage:
        "Wild Bellsprout sways like it's had six, then Vine Whips you. Drink 4.",
    }),
  ],
  // Route 4
  [
    strike(3, "route-wingull", "Wingull", {
      even: "Wild Wingull snatches a chip out of your hand. Rude. Drink 2.",
      advantage:
        "Wild Wingull snatches a chip out of your hand, and you snatch it back. Give 3.",
      disadvantage:
        "Wild Wingull snatches a chip out of your hand and brings friends. Drink 5.",
    }),
    wild(
      3,
      "route-ralts",
      "Ralts",
      "Wild Ralts senses your feelings and looks worried. Roll d20.",
      vs(
        "It cries with you. Drink 3 for your feelings.",
        "It feels better. Compliment the player on your left: they give 3.",
      ),
    ),
    wild(
      3,
      "route-phanpy",
      "Phanpy",
      "Wild Phanpy sprays you with its trunk. Trumpet back, then roll 2d6.",
      pair(
        "Rollout, right into your chair. Drink 3 and scoot back.",
        "You out-trumpet it. Everyone trumpets; the weakest trumpet drinks 3.",
      ),
    ),
  ],
  // Route 5
  [
    strike(4, "route-tangela", "Tangela", {
      even: "Wild Tangela, a ball of blue spaghetti, is hungry. It tangles you up. Drink 2.",
      advantage:
        "Wild Tangela, a ball of blue spaghetti, is hungry. You eat it first. Give 3.",
      disadvantage:
        "Wild Tangela, a ball of blue spaghetti, is hungry and ties you in knots. Drink 5.",
    }),
    trainer(
      4,
      "route-engineer",
      "Engineer Bernie",
      "Engineer Bernie's Magnemite stick to your phone. Roll d20.",
      vs(
        "Thunder Wave. Drink 3 without moving.",
        "You stick them on the player across from you. They drink 3 and can't move until your next turn.",
      ),
    ),
    strike(4, "route-spritzee", "Spritzee", {
      even: "Wild Spritzee smells like a department store. Sneeze. Drink 2.",
      advantage:
        "Wild Spritzee smells like a department store, and you get a free sample. Give 3.",
      disadvantage:
        "Wild Spritzee smells like a department store and the scent overwhelms you. Drink 5.",
    }),
  ],
  // Route 6
  [
    wild(
      5,
      "route-sudowoodo",
      "Sudowoodo",
      "A tree blocks the road and won't make eye contact. Roll d20.",
      vs(
        "It's Sudowoodo. Drink 3 and stand still like a tree.",
        "You water it. It panics and runs. Everyone runs in place; the last to stop drinks 3.",
      ),
    ),
    strike(5, "route-rotom", "Rotom", {
      even: "A Rotom got into the phone. Don't drop it. It orders pizza. Drink 2.",
      advantage: "A Rotom got into the phone. You post it online. Give 3.",
      disadvantage: "A Rotom got into the phone and texts your ex. Drink 6.",
    }),
    strike(5, "route-breloom", "Breloom", {
      even: "Wild Breloom throws a mushroom haymaker. Duck. It grazes you. Drink 2.",
      advantage:
        "Wild Breloom throws a mushroom haymaker and clocks a tree instead. Give 3.",
      disadvantage:
        "Wild Breloom throws a mushroom haymaker and Mach Punch lands. Drink 6.",
    }),
  ],
  // Route 7
  [
    trainer(
      6,
      "route-ruin-maniac",
      "Ruin Maniac Liz",
      "Ruin Maniac Liz's Donphan rolls at you like a monster truck tire. Roll d20.",
      vs(
        "Rollout. Drink 4 and roll your head in a circle.",
        "You step aside and it rolls into a ruin. Pick a player to dig it out: they drink 3 and name the treasure.",
      ),
    ),
    wild(
      6,
      "route-gardevoir",
      "Gardevoir",
      "Wild Gardevoir would give its life for its trainer. You are not its trainer. Roll d20.",
      vs(
        "It reads your search history aloud. Drink 4.",
        "It teleports away, blushing. Pick a player to blush like it: they drink 3.",
      ),
    ),
    strike(6, "route-wailord", "Wailord", {
      even: "A Wailord surfaces and blots out the sun. Everyone looks up. Splash. Everyone drinks 1.",
      advantage:
        "A Wailord surfaces and blots out the sun, then waves. Give 4.",
      disadvantage:
        "A Wailord surfaces and blots out the sun, then Water Spouts. Drink 6.",
    }),
  ],
  // Route 8
  [
    wild(
      7,
      "route-rhyperior",
      "Rhyperior",
      "Wild Rhyperior fires rocks out of its hands. Duck, then roll 2d6.",
      pair(
        "Rock Wrecker, square on. Drink 4 and hold a rock pose.",
        "You catch one and keep it. Throw it back at someone: they drink 4.",
      ),
    ),
    strike(7, "route-electivire", "Electivire", {
      even: "Wild Electivire plugs its tails into the wall and the lights dim. Brownout. Drink 3.",
      advantage:
        "Wild Electivire plugs its tails into the wall, and you unplug it. Give 4.",
      disadvantage:
        "Wild Electivire plugs in, then Thunder Punches you in the dark. Drink 6.",
    }),
    strike(7, "route-togekiss", "Togekiss", {
      even: "Wild Togekiss blesses the table, then wants a battle. Blessed. Everyone drinks 1.",
      advantage:
        "Wild Togekiss blesses the table, and you bless it back. Give 4.",
      disadvantage:
        "Wild Togekiss blesses the table, then Air Slashes you. Drink 6.",
    }),
  ],
];

/** An evolution chance on Route 5, which had none, and a second one on
 * Routes 2 and 4, so the bigger route pools (the strikes and table moments
 * of 2026-10-25) still evolve about as often as before. Route 7's moved
 * to Route 8 in the 2026-10-31 retune (Route 6's second, Friendship Glow,
 * came back as Route 7's once the variety pass grew the pools): with the balance runs
 * on independent seeds, 53% of runs reached the final form (band 30 to
 * 50%). */
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
  6: evolution(
    6,
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
