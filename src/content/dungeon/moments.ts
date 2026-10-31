import type { CardDefinition } from "../../game/types";
import { moment } from "./shared";

// Table moments (2026-10-25): four a floor, no fight and no roll, only
// something for the table to do, so a floor breathes between its fights
// (the League's routes had them; Pub Crawl dealt about one a run). One a
// floor heals the party for doing it. Never write hearts or items into
// these rules: the card's seals show them. Keyed by floor.

export const floorMoments: Readonly<Record<string, CardDefinition[]>> = {
  cellar: [
    moment(
      0,
      "cellar-roll-call",
      "Roll Call",
      "Everyone says the dumbest thing they've done in a cellar. The table picks the worst; they drink 2.",
    ),
    moment(
      0,
      "cellar-mystery-bottle",
      "Mystery Bottle",
      "A dusty bottle, no label. Everyone guesses what's in it; the drawer's favorite guess gives 2.",
    ),
    moment(
      0,
      "cellar-spider-check",
      "Spider Check",
      "Everyone checks their hair for spiders, loudly. The last to finish drinks 1.",
    ),
    moment(
      0,
      "cellar-dry-storage",
      "Dry Storage",
      "You find a crate of crackers. Everyone eats one or drinks 1.",
      1,
    ),
    // An auction (2026-10-31, the variety pass).
    moment(
      0,
      "cellar-last-glass",
      "The Last Clean Glass",
      "Bid sips for the last clean glass, clockwise, until everyone passes. Top bid drinks it and toasts.",
      1,
    ),
  ],
  wine: [
    moment(
      3,
      "wine-pairing",
      "The Pairing",
      "Everyone names the food their drink pairs with. The table boos the worst; they drink 2.",
    ),
    moment(
      3,
      "wine-swirl",
      "The Snob Stare",
      "Everyone swirls and sniffs their drink like a snob, and holds eye contact. First to laugh drinks 2.",
    ),
    moment(
      3,
      "wine-vintage",
      "Your Vintage",
      "Everyone says the year they'd be if they were a wine. The oldest answer drinks 2.",
    ),
    moment(
      3,
      "wine-cheers",
      "Proper Cheers",
      "Everyone clinks with everyone, eyes locked, or it's bad luck. Anyone who skips someone drinks 1.",
      1,
    ),
    // The variety pass (2026-10-31).
    moment(
      3,
      "wine-best-year",
      "Best Year",
      "Everyone names their best year, fast, around the table. Repeat a year or stall: drink 2.",
    ),
  ],
  brewery: [
    moment(
      6,
      "brewery-tasting-flight",
      "Tasting Flight",
      "Pass your drink left; everyone takes one sip of their neighbor's and rates it out of ten.",
    ),
    moment(
      6,
      "brewery-beer-names",
      "Beer Names",
      "Go around inventing a craft beer name for the player on your left. The worst one drinks 2.",
    ),
    moment(
      6,
      "brewery-foam-mustache",
      "Foam Mustache",
      "Everyone gives themself a drink mustache. The table picks the best; they give 2.",
    ),
    moment(
      6,
      "brewery-quality-control",
      "Inspection",
      "The drawer inspects everyone's drink. Anyone whose drink fails takes a sip to prove it's fine.",
      1,
    ),
    // The variety pass (2026-10-31).
    moment(
      6,
      "brewery-name-a-beer",
      "Glasses Down",
      "Glasses up. The drawer counts down from three; the last glass back on the table drinks 2.",
    ),
  ],
  catacombs: [
    moment(
      1,
      "catacombs-epitaph",
      "Your Epitaph",
      "Everyone says what their tombstone will say. The table picks the best; they give 3.",
    ),
    moment(
      1,
      "catacombs-skull-face",
      "Skull Face",
      "Everyone pulls their best skull face at once. The table picks the scariest; they give 2.",
    ),
    moment(
      1,
      "catacombs-bone-count",
      "Bone Count",
      "Count off around the table, skipping every multiple of three. Whoever messes up drinks 2.",
    ),
    moment(
      1,
      "catacombs-candlelight",
      "Candlelight",
      "Phone lights up: a moment of silence for the fallen. Anyone who talks drinks 1.",
      1,
    ),
    // The variety pass (2026-10-31).
    moment(
      1,
      "catacombs-epitaphs",
      "Play Dead",
      "On three, everyone plays dead. First to move, laugh or blink drinks 2.",
    ),
  ],
  sewers: [
    moment(
      4,
      "sewers-worst-smell",
      "Worst Smell",
      "Everyone describes the worst thing they've ever smelled. The table gags at the winner, who gives 3.",
    ),
    moment(
      4,
      "sewers-rubber-duck",
      "Rubber Duck",
      "A rubber duck floats by. Everyone quacks; the worst quack drinks 2.",
    ),
    moment(
      4,
      "sewers-gator-chomp",
      "Gator Chomp",
      "On three, everyone does the gator chomp with both arms. The last one drinks 2.",
    ),
    moment(
      4,
      "sewers-clean-water",
      "Clean Water",
      "A clean pipe. Everyone takes a sip of water and says something nice about the person to their right.",
      1,
    ),
    // The variety pass (2026-10-31).
    moment(
      4,
      "sewers-down-the-drain",
      "Down the Drain",
      "Everyone says the worst thing they ever lost down a drain. The table picks the worst; they drink 2.",
    ),
  ],
  freezer: [
    moment(
      7,
      "freezer-penguin-walk",
      "Penguin Walk",
      "The drawer waddles like a penguin to the nearest wall and back. Refuse: drink 3.",
    ),
    moment(
      7,
      "freezer-cold-take",
      "Cold Take",
      "Everyone shares their coldest take. The table picks the coldest; they give 3.",
    ),
    moment(
      7,
      "freezer-huddle",
      "Huddle Up",
      "Everyone huddles in for warmth. Anyone who won't drinks 2.",
    ),
    moment(
      7,
      "freezer-hot-cocoa",
      "Pins and Needles",
      "Everyone wiggles their fingers to prove they can still feel them, then takes a slow sip.",
      1,
    ),
    // The variety pass (2026-10-31).
    moment(
      7,
      "freezer-cold-takes",
      "Snowball Fight",
      "On three, everyone throws a mime snowball at someone. Whoever is hit most drinks 2.",
    ),
  ],
  taproom: [
    moment(
      2,
      "taproom-shanty",
      "Bottoms Up or Hold",
      "Glasses up. The drawer calls 'Bottoms up!' or 'Hold!' three times. Anyone who sips on Hold drinks 2.",
    ),
    moment(
      2,
      "taproom-message-bottle",
      "SOS",
      "Everyone says what they'd write in a message in a bottle. The saddest one drinks 2.",
    ),
    moment(
      2,
      "taproom-man-overboard",
      "Man Overboard",
      "The drawer shouts 'man overboard'; everyone grabs their drink. The last to grab it drinks 2.",
    ),
    moment(
      2,
      "taproom-dry-land",
      "Land Ho",
      "Everyone shouts 'Land ho!', takes a deep breath, then a sip.",
      1,
    ),
    // The variety pass (2026-10-31).
    moment(
      2,
      "taproom-shanty-round",
      "The Fish Tale",
      "Clockwise, everyone shows with their hands a fish bigger than the last. First who can't drinks 2.",
    ),
  ],
  kitchen: [
    moment(
      5,
      "kitchen-yes-chef",
      "86'd",
      "The drawer names a word. It's 86'd until their next turn: anyone who says it drinks 1.",
    ),
    moment(
      5,
      "kitchen-last-meal",
      "Last Meal",
      "Everyone names their last meal on earth. The table picks the weirdest; they drink 2.",
    ),
    moment(
      5,
      "kitchen-order-up",
      "Order Up",
      "Before their next turn, the drawer shouts 'Order up!' once. Last to slap the table drinks 2.",
    ),
    moment(
      5,
      "kitchen-staff-meal",
      "Bread Basket",
      "The bread basket comes round. Everyone takes a bite of something, or a sip, and thanks the kitchen.",
      1,
    ),
    // The variety pass (2026-10-31).
    moment(
      5,
      "kitchen-drunk-food",
      "Drunk Food",
      "Everyone names their go-to drunk food at once. Anyone who matches someone drinks 2.",
    ),
  ],
  rooftop: [
    moment(
      8,
      "rooftop-skyline-toast",
      "Skyline Toast",
      "Everyone toasts something they can see from here. Repeat a toast: drink 2.",
    ),
    moment(
      8,
      "rooftop-shooting-star",
      "Shooting Star",
      "The drawer makes a wish out loud. If the table thinks it's lame, the drawer drinks 2.",
    ),
    moment(
      8,
      "rooftop-pigeon",
      "Group Selfie",
      "Everyone squeezes into one selfie with the skyline. Anyone cut off or blinking drinks 2.",
    ),
    moment(
      8,
      "rooftop-fresh-air",
      "Fresh Air",
      "Everyone takes a deep breath of fresh air. Then a sip.",
      1,
    ),
    // The variety pass (2026-10-31).
    moment(
      8,
      "rooftop-first-to-post",
      "First to Post",
      "On three, everyone points at who will post this roof first. Most fingers: give 3.",
    ),
  ],
};
