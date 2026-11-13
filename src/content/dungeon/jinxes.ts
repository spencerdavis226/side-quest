import type { CardDefinition, Jinx } from "../../game/types";

// Curses become jinxes (2026-10-25): Pub Crawl had two numeric curses
// (Bleeding, Hexed) beside its spoken jinxes, two systems doing one job.
// Every card that cursed the party now lays a jinx on a loss instead, a
// table rule the app shows until the floor's boss falls. The League's
// statuses went too (2026-10-31).
const jinxes: Readonly<Record<string, Jinx>> = {
  "the-landlord": {
    name: "Ogre Talk",
    rule: "The jinxed player speaks only in one-word grunts. Uses two words: drink 1.",
  },
  "the-pipe-organ": {
    name: "Spooked",
    rule: "The jinxed player screams whenever anyone says 'head'. Misses one: drink 1.",
  },
  "vinegar-vampire": {
    name: "Thorny",
    rule: "The jinxed player says 'ouch' before every sip. Forgets: drink 1.",
  },
  "count-corkula": {
    name: "Howler",
    rule: "The jinxed player howls after every sip. Forgets: drink 1.",
  },
  "the-barrel-room": {
    name: "Root-Bound",
    rule: "The jinxed player keeps both feet flat on the floor. Lifts one: drink 1.",
  },
  "leech-swarm": {
    name: "Leeched",
    rule: "Whenever the jinxed player sips, their left neighbor sips too. Neighbor forgets: drink 1.",
  },
  "hex-witch": {
    name: "Ill-Fated",
    rule: "The jinxed player says 'I foresaw this' before every sip. Forgets: drink 1.",
  },
  "the-lich-lord": {
    name: "Undead",
    rule: "The jinxed player groans like a zombie before every sip. Forgets: drink 1.",
  },
  "the-ghost-of-closing": {
    name: "Last Rites",
    rule: "The jinxed player says 'rest in peace' whenever a card is put aside. Misses one: drink 1.",
  },
  "drain-witch": {
    name: "Fumes",
    rule: "The jinxed player can only whisper. Too loud: drink 1.",
  },
  "fatberg-spawn": {
    name: "Slimy Fingers",
    rule: "The jinxed player holds their drink with two fingers only. Caught: drink 1.",
  },
  "the-fatberg": {
    name: "The Royal We",
    rule: "The jinxed player can't say 'I' or 'me'. Slip: drink 1.",
  },
  "the-pipe-worm": {
    name: "Cave-In",
    rule: "Nobody talks to the jinxed player, and they talk to nobody. Slip: drink 1.",
  },
  "merfolk-ex": {
    name: "Fish Out of Water",
    rule: "The jinxed player gasps like a fish after every sip. Forgets: drink 1.",
  },
  "text-them-eel": {
    name: "My Dearest",
    rule: "The jinxed player starts every sentence with 'My dearest'. Forgets: drink 1.",
  },
  "garlic-wraith": {
    name: "Garlic Breath",
    rule: "The jinxed player covers their mouth to talk. Forgets: drink 1.",
  },
  "sour-mash-witch": {
    name: "Hag-Ridden",
    rule: "The jinxed player cackles before every sip. Forgets: drink 1.",
  },
  "bottle-cap-crab": {
    name: "Sideways",
    rule: "The jinxed player looks at people only sideways, like a crab. Caught looking straight: drink 1.",
  },
  "brewery-owner": {
    name: "Lordly",
    rule: "The jinxed player says 'my good fellow' before every sip. Forgets: drink 1.",
  },
  "freezer-burn": {
    name: "Stone-Faced",
    rule: "The jinxed player may not smile. Caught smiling: drink 1.",
  },
  "hypothermia-hal": {
    name: "Totally Fine",
    rule: "The jinxed player says 'I'm totally fine' before every sip. Forgets: drink 1.",
  },
  "the-snow-bartender": {
    name: "Bubbles",
    rule: "The jinxed player ends every sentence with 'bloop'. Forgets: drink 1.",
  },
  "the-frozen-ex": {
    name: "As I Was Saying",
    rule: "The jinxed player starts every sentence with 'As I was saying'. Forgets: drink 1.",
  },
  "the-wind": {
    name: "Windswept",
    rule: "The jinxed player flips their hair before speaking. Forgets: drink 1.",
  },
  "the-gargoyle": {
    name: "Stone Still",
    rule: "The jinxed player sits perfectly still while anyone else rolls. Moves: drink 1.",
  },
  "house-lights": {
    name: "Dazzled",
    rule: "The jinxed player compliments the dragon before every sip. Forgets: drink 1.",
  },
  "surge-pricing": {
    name: "Thunderstruck",
    rule: "The jinxed player shouts 'boom' after every drink. Forgets: drink 1.",
  },
  "cursed-idol": {
    name: "Idol Worship",
    rule: "Everyone bows to the jinxed player before speaking to them. Forgets: drink 1.",
  },
  "the-cash-register": {
    name: "Pieces of Eight",
    rule: "The jinxed player says 'pieces of eight' whenever anyone gives drinks. Misses one: drink 1.",
  },
  "the-mystery-meat": {
    name: "The Meat",
    rule: "The jinxed player calls every drink 'the meat'. Slip: drink 1.",
  },
  "cold-room": {
    name: "Mud in the Ears",
    rule: "The jinxed player says 'what?' before answering anyone. Forgets: drink 1.",
  },
  "the-chest-freezer": {
    name: "Hold Your Hat",
    rule: "The jinxed player keeps one hand on their head. Lets go: drink 1.",
  },
  "the-water-tower": {
    name: "Hydrate",
    rule: "The jinxed player sips water between every drink. Forgets: drink 1.",
  },
  "closing-venmo-request": {
    name: "Request Sent",
    rule: "The jinxed player says 'I'll Venmo you' when given a drink. Forgets: drink 1.",
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
