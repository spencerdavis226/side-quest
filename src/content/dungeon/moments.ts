import type { CardDefinition } from "../../game/types";
import { moment } from "./shared";

// Table moments (2026-10-25): four a floor, no fight and no roll, only
// something for the table to do, so a floor breathes between its fights
// (the League's routes had them; Pub Crawl dealt about one a run). One a
// floor heals the party for doing it. Never write hearts or items into
// these rules: the card's seals show them. Keyed by floor.

export const floorMoments: Readonly<Record<string, CardDefinition[]>> = {
  kingsRoad: [
    moment(
      0,
      "road-head",
      "Road Head",
      "Everyone tells their worst hookup on the road. The table picks the worst; they drink 2.",
    ),
    moment(
      0,
      "mystery-potion",
      "Mystery Potion",
      "A potion with no label. Everyone guesses what it does; the drawer's favorite guess gives 2.",
    ),
    moment(
      0,
      "tick-check",
      "Tick Check",
      "Everyone checks their crotch for ticks, loudly. The last to finish drinks 1.",
    ),
    moment(
      0,
      "trail-rations",
      "Trail Rations",
      "Hard bread from the saddlebags. Everyone eats a bite of something or drinks 1.",
      1,
    ),
    // An auction (2026-10-31, the variety pass).
    moment(
      0,
      "last-room",
      "The Last Room",
      "One room left at the inn. Bid sips clockwise until all pass. Top bid drinks them and toasts.",
      1,
    ),
  ],
  oldForest: [
    moment(
      3,
      "campfire-cooking",
      "Campfire Cooking",
      "Everyone names what they'd cook over a campfire. The table boos the worst; they drink 2.",
    ),
    moment(
      3,
      "elf-stare",
      "The Elf Stare",
      "Everyone stares like a wise old elf and holds eye contact. First to laugh drinks 2.",
    ),
    moment(
      3,
      "your-tree",
      "Your Tree",
      "Everyone says what tree they'd be. The table picks the strangest; they drink 2.",
    ),
    moment(
      3,
      "forest-toast",
      "The Forest Toast",
      "Everyone clinks with everyone, eyes locked, or the forest takes offense. Skip someone: drink 1.",
      1,
    ),
    // The variety pass (2026-10-31).
    moment(
      3,
      "animal-calls",
      "Animal Calls",
      "Everyone does an animal call, fast, around the table. Repeat an animal or stall: drink 2.",
    ),
  ],
  marsh: [
    moment(
      6,
      "pass-the-cup",
      "Pass the Cup",
      "Pass your drink left; everyone takes one sip of their neighbor's and rates it out of ten.",
    ),
    moment(
      6,
      "swamp-names",
      "Swamp Names",
      "Go around giving the player on your left a swamp-monster name. The worst one drinks 2.",
    ),
    moment(
      6,
      "mustache",
      "The Mustache",
      "Everyone gives themself a drink mustache. The table picks the best; they give 2.",
    ),
    moment(
      6,
      "leech-check",
      "Leech Check",
      "The drawer checks everyone for leeches. Anyone with one takes a sip to get it off.",
      1,
    ),
    // The variety pass (2026-10-31).
    moment(
      6,
      "frog-jump",
      "Frog Jump",
      "Glasses up. The drawer croaks three times; the last glass back on the table drinks 2.",
    ),
  ],
  crypt: [
    moment(
      1,
      "your-epitaph",
      "Your Epitaph",
      "Everyone says what their tombstone will say. The table picks the best; they give 3.",
    ),
    moment(
      1,
      "skull-face",
      "Skull Face",
      "Everyone pulls their best skull face at once. The table picks the scariest; they give 2.",
    ),
    moment(
      1,
      "bone-count",
      "Bone Count",
      "Count off around the table, skipping every multiple of three. Whoever messes up drinks 2.",
    ),
    moment(
      1,
      "candlelight",
      "Candlelight",
      "Phone lights up: a moment of silence for the fallen. Anyone who talks drinks 1.",
      1,
    ),
    // The variety pass (2026-10-31).
    moment(
      1,
      "play-dead",
      "Play Dead",
      "On three, everyone plays dead. First to move, laugh or blink drinks 2.",
    ),
  ],
  mines: [
    moment(
      4,
      "worst-smell",
      "Worst Smell",
      "Everyone describes the worst thing they've ever smelled. The table gags at the winner, who gives 3.",
    ),
    moment(
      4,
      "canary",
      "The Canary",
      "A canary flies by. Everyone tweets; the worst tweet drinks 2.",
    ),
    moment(
      4,
      "pickaxes",
      "Pickaxes",
      "On three, everyone swings a mime pickaxe with both arms. The last one drinks 2.",
    ),
    moment(
      4,
      "clean-water",
      "Clean Water",
      "A clean spring. Everyone sips water and says something nice about the person to their right.",
      1,
    ),
    // The variety pass (2026-10-31).
    moment(
      4,
      "down-the-shaft",
      "Down the Shaft",
      "Everyone says the worst thing they ever lost down a hole. The table picks the worst; they drink 2.",
    ),
  ],
  tower: [
    moment(
      7,
      "wizard-walk",
      "The Wizard Walk",
      "The drawer walks like a very old wizard to the nearest wall and back. Refuse: drink 3.",
    ),
    moment(
      7,
      "prophecy",
      "Prophecy",
      "Everyone prophesies their left neighbor's sex life. The table picks the best; they give 3.",
    ),
    moment(
      7,
      "ritual",
      "The Ritual",
      "Everyone holds hands for the ritual. Anyone who won't drinks 2.",
    ),
    moment(
      7,
      "spellcraft",
      "Spellcraft",
      "Everyone wiggles their fingers like a wizard casting, then takes a slow sip.",
      1,
    ),
    // The variety pass (2026-10-31).
    moment(
      7,
      "fireball-fight",
      "Fireball Fight",
      "On three, everyone throws a mime fireball at someone. Whoever is hit most drinks 2.",
    ),
  ],
  coast: [
    moment(
      2,
      "bottoms-up-or-hold",
      "Bottoms Up or Hold",
      "Glasses up. The drawer calls 'Bottoms up!' or 'Hold!' three times. Anyone who sips on Hold drinks 2.",
    ),
    moment(
      2,
      "sos",
      "SOS",
      "Everyone says the drunk letter they'd bottle and send their ex. The saddest one drinks 2.",
    ),
    moment(
      2,
      "man-overboard",
      "Man Overboard",
      "The drawer shouts 'man overboard'; everyone grabs their drink. The last to grab it drinks 2.",
    ),
    moment(
      2,
      "land-ho",
      "Land Ho",
      "Everyone shouts 'Land ho!', takes a deep breath, then a sip.",
      1,
    ),
    // The variety pass (2026-10-31).
    moment(
      2,
      "fish-tale",
      "The Fish Tale",
      "Clockwise, everyone shows with their hands a fish bigger than the last. First who can't drinks 2.",
    ),
  ],
  caverns: [
    moment(
      5,
      "forbidden-word",
      "The Forbidden Word",
      "The drawer names a word. It's forbidden until their next turn: anyone who says it drinks 1.",
    ),
    moment(
      5,
      "last-meal",
      "Last Meal",
      "Everyone names their last meal on earth. The table picks the weirdest; they drink 2.",
    ),
    moment(
      5,
      "hammer-down",
      "Hammer Down",
      "Before their next turn, the drawer shouts 'Hammer down!' once. Last to slap the table drinks 2.",
    ),
    moment(
      5,
      "bread-basket",
      "Bread Basket",
      "The bread basket comes round. Everyone takes a bite of something, or a sip, and thanks the smiths.",
      1,
    ),
    // The variety pass (2026-10-31).
    moment(
      5,
      "campfire-feast",
      "The Campfire Feast",
      "Everyone names what they'd roast on a cave fire, at once. Anyone who matches someone drinks 2.",
    ),
  ],
  frozenPass: [
    moment(
      8,
      "peak-toast",
      "Peak Toast",
      "Everyone toasts something they can see from up here. Repeat a toast: drink 2.",
    ),
    moment(
      8,
      "shooting-star",
      "Shooting Star",
      "The drawer makes a wish out loud. If the table thinks it's lame, the drawer drinks 2.",
    ),
    moment(
      8,
      "group-portrait",
      "Group Portrait",
      "Everyone squeezes into one pose for the painter. Anyone cut off or blinking drinks 2.",
    ),
    moment(
      8,
      "fresh-air",
      "Fresh Air",
      "Everyone takes a deep breath of fresh air. Then a sip.",
      1,
    ),
    // The variety pass (2026-10-31).
    moment(
      8,
      "first-down",
      "First Down",
      "On three, everyone points at who'll puke first on the way down. Most fingers: give 3.",
    ),
  ],
};
