import type { CardDefinition, Jinx } from "../../game/types";

// Curses become jinxes (2026-10-25): Pub Crawl had two numeric curses
// (Bleeding, Hexed) beside its spoken jinxes, two systems doing one job.
// Every card that cursed the party now lays a jinx on a loss instead, a
// table rule the app shows until the floor's boss falls. The League's
// statuses went too (2026-10-31).
const jinxes: Readonly<Record<string, Jinx>> = {
  "the-landlord": {
    name: "Ogre Talk",
    rule: "The cursed player speaks only in one-word grunts. Uses two words: drink 1.",
  },
  "the-pipe-organ": {
    name: "Spooked",
    rule: "The cursed player screams whenever anyone says 'head'. Misses one: drink 1.",
  },
  "vinegar-vampire": {
    name: "Thorny",
    rule: "The cursed player says 'ouch' before every sip. Forgets: drink 1.",
  },
  "count-corkula": {
    name: "Howler",
    rule: "The cursed player howls after every sip. Forgets: drink 1.",
  },
  "the-barrel-room": {
    name: "Root-Bound",
    rule: "The cursed player keeps both feet flat on the floor. Lifts one: drink 1.",
  },
  "leech-swarm": {
    name: "Leeched",
    rule: "Whenever the cursed player sips, their left neighbor sips too. Neighbor forgets: drink 1.",
  },
  "hex-witch": {
    name: "Ill-Fated",
    rule: "The cursed player says 'I foresaw this' before every sip. Forgets: drink 1.",
  },
  "the-lich-lord": {
    name: "Undead",
    rule: "The cursed player groans like a zombie before every sip. Forgets: drink 1.",
  },
  "the-ghost-of-closing": {
    name: "Last Rites",
    rule: "The cursed player says 'rest in peace' whenever a card is put aside. Misses one: drink 1.",
  },
  "drain-witch": {
    name: "Fumes",
    rule: "The cursed player can only whisper. Too loud: drink 1.",
  },
  "fatberg-spawn": {
    name: "Slimy Fingers",
    rule: "The cursed player holds their drink with two fingers only. Caught: drink 1.",
  },
  "the-fatberg": {
    name: "The Royal We",
    rule: "The cursed player can't say 'I' or 'me'. Slip: drink 1.",
  },
  "the-pipe-worm": {
    name: "Cave-In",
    rule: "Nobody talks to the cursed player, and they talk to nobody. Slip: drink 1.",
  },
  "merfolk-ex": {
    name: "Fish Out of Water",
    rule: "The cursed player gasps like a fish after every sip. Forgets: drink 1.",
  },
  "text-them-eel": {
    name: "My Dearest",
    rule: "The cursed player starts every sentence with 'My dearest'. Forgets: drink 1.",
  },
  "garlic-wraith": {
    name: "Smoky",
    rule: "The cursed player covers their mouth to talk. Forgets: drink 1.",
  },
  "sour-mash-witch": {
    name: "Hag-Ridden",
    rule: "The cursed player cackles before every sip. Forgets: drink 1.",
  },
  "bottle-cap-crab": {
    name: "Sideways",
    rule: "The cursed player looks at people only sideways, like a crab. Caught looking straight: drink 1.",
  },
  "brewery-owner": {
    name: "Lordly",
    rule: "The cursed player says 'my good fellow' before every sip. Forgets: drink 1.",
  },
  "freezer-burn": {
    name: "Stone-Faced",
    rule: "The cursed player may not smile. Caught smiling: drink 1.",
  },
  "hypothermia-hal": {
    name: "Totally Fine",
    rule: "The cursed player says 'I'm totally fine' before every sip. Forgets: drink 1.",
  },
  "the-snow-bartender": {
    name: "Bubbles",
    rule: "The cursed player ends every sentence with 'bloop'. Forgets: drink 1.",
  },
  "the-frozen-ex": {
    name: "As I Was Saying",
    rule: "The cursed player starts every sentence with 'As I was saying'. Forgets: drink 1.",
  },
  "the-wind": {
    name: "Windswept",
    rule: "The cursed player flips their hair before speaking. Forgets: drink 1.",
  },
  "the-gargoyle": {
    name: "Stone Still",
    rule: "The cursed player sits perfectly still while anyone else rolls. Moves: drink 1.",
  },
  "house-lights": {
    name: "Dazzled",
    rule: "The cursed player compliments the dragon before every sip. Forgets: drink 1.",
  },
  "surge-pricing": {
    name: "Thunderstruck",
    rule: "The cursed player shouts 'boom' after every drink. Forgets: drink 1.",
  },
  "cursed-idol": {
    name: "Idol Worship",
    rule: "Everyone bows to the cursed player before speaking to them. Forgets: drink 1.",
  },
  "the-cash-register": {
    name: "Pieces of Eight",
    rule: "The cursed player says 'pieces of eight' whenever anyone gives drinks. Misses one: drink 1.",
  },
  "the-mystery-meat": {
    name: "Hatchling",
    rule: "The cursed player calls everyone 'mother'. Slip: drink 1.",
  },
  "cold-room": {
    name: "Mud in the Ears",
    rule: "The cursed player says 'what?' before answering anyone. Forgets: drink 1.",
  },
  "the-chest-freezer": {
    name: "Hold Your Hat",
    rule: "The cursed player keeps one hand on their head. Lets go: drink 1.",
  },
  "the-water-tower": {
    name: "Hydrate",
    rule: "The cursed player sips water between every drink. Forgets: drink 1.",
  },
  "closing-venmo-request": {
    name: "I Owe You",
    rule: "The cursed player says 'I'll pay you back' when given a drink. Forgets: drink 1.",
  },
};

/** Lay each listed card's jinx (2026-10-25: Pub Crawl's curses became
 * jinxes; the curses themselves were cut 2026-10-31). */
export function applyJinxes(cards: CardDefinition[]) {
  for (const [id, jinx] of Object.entries(jinxes)) {
    const card = cards.find((c) => c.id === `dungeon.${id}`);
    if (!card) throw new Error(`No card for a jinx: dungeon.${id}`);
    card.jinx = jinx;
  }
}
