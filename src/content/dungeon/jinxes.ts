import type { CardDefinition, Jinx } from "../../game/types";

// Curses become jinxes (2026-10-25): Pub Crawl had two numeric curses
// (Bleeding, Hexed) beside its spoken jinxes, two systems doing one job.
// Every card that cursed the party now lays a jinx on a loss instead, a
// table rule the app shows until the floor's boss falls. The League keeps
// its statuses (Poisoned, Confused); old saves keep any curse they hold.
const jinxes: Readonly<Record<string, Jinx>> = {
  "the-landlord": {
    name: "Rent Due",
    rule: "The jinxed player asks the table's permission before every sip. Forgets: drink 1.",
  },
  "the-pipe-organ": {
    name: "Organ Voice",
    rule: "The jinxed player sings everything they say. Speaks normally: drink 1.",
  },
  "vinegar-vampire": {
    name: "Sour Face",
    rule: "The jinxed player pulls a sour face before every sip. Forgets: drink 1.",
  },
  "count-corkula": {
    name: "The Count",
    rule: "The jinxed player counts their sips out loud, with a cackle. Forgets: drink 1.",
  },
  "the-barrel-room": {
    name: "Barrel Roll",
    rule: "The jinxed player says 'barrel roll!' whenever anyone rolls. Misses one: drink 1.",
  },
  "leech-swarm": {
    name: "Leeched",
    rule: "Whenever the jinxed player sips, their left neighbor sips too. Neighbor forgets: drink 1.",
  },
  "hex-witch": {
    name: "Witch's Cackle",
    rule: "The jinxed player cackles before speaking. Forgets: drink 1.",
  },
  "the-lich-lord": {
    name: "Undead",
    rule: "The jinxed player groans like a zombie before every sip. Forgets: drink 1.",
  },
  "the-ghost-of-closing": {
    name: "Last Orders",
    rule: "The jinxed player shouts 'Last orders!' whenever a card is put aside. Misses one: drink 1.",
  },
  "drain-witch": {
    name: "Drained",
    rule: "The jinxed player can only whisper. Too loud: drink 1.",
  },
  "fatberg-spawn": {
    name: "Greasy Fingers",
    rule: "The jinxed player holds their drink with two fingers only. Caught: drink 1.",
  },
  "the-fatberg": {
    name: "Clogged",
    rule: "The jinxed player can't say 'I' or 'me'. Slip: drink 1.",
  },
  "the-pipe-worm": {
    name: "Pipe Down",
    rule: "Only the drawer may talk to the jinxed player. Anyone else does: they drink 1.",
  },
  "merfolk-ex": {
    name: "Fish Out of Water",
    rule: "The jinxed player gasps like a fish after every sip. Forgets: drink 1.",
  },
  "text-them-eel": {
    name: "Typing...",
    rule: "The jinxed player says 'typing...' before they speak. Forgets: drink 1.",
  },
  "garlic-wraith": {
    name: "Garlic Breath",
    rule: "The jinxed player covers their mouth to talk. Forgets: drink 1.",
  },
  "sour-mash-witch": {
    name: "Sour Mash",
    rule: "The jinxed player rates every sip out of ten, out loud. Forgets: drink 1.",
  },
  "bottle-cap-crab": {
    name: "Sideways",
    rule: "The jinxed player looks at people only sideways, like a crab. Caught looking straight: drink 1.",
  },
  "brewery-owner": {
    name: "Artisanal",
    rule: "The jinxed player calls everything 'artisanal'. Misses a chance the table spots: drink 1.",
  },
  "freezer-burn": {
    name: "Brain Freeze",
    rule: "The jinxed player clutches their head and says 'brain freeze' after every sip. Forgets: drink 1.",
  },
  "hypothermia-hal": {
    name: "Chattering Teeth",
    rule: "The jinxed player chatters their teeth before speaking. Forgets: drink 1.",
  },
  "the-snow-bartender": {
    name: "Brrr",
    rule: "The jinxed player ends every sentence with 'brrr'. Forgets: drink 1.",
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
    name: "Lit Up",
    rule: "The jinxed player squints at everyone. Caught with their eyes wide open: drink 1.",
  },
  "surge-pricing": {
    name: "Surge",
    rule: "The jinxed player adds 'plus tax' to every drink they're given. Forgets: drink 1.",
  },
  "cursed-idol": {
    name: "Idol Worship",
    rule: "Everyone bows to the jinxed player before speaking to them. Forgets: drink 1.",
  },
  "the-cash-register": {
    name: "Cha-Ching",
    rule: "The jinxed player says 'cha-ching' whenever anyone gives drinks. Misses one: drink 1.",
  },
  "the-mystery-meat": {
    name: "The Meat",
    rule: "The jinxed player calls every drink 'the meat'. Slip: drink 1.",
  },
  "cold-room": {
    name: "Cold Shoulder",
    rule: "The jinxed player turns away from whoever is talking. Caught facing them: drink 1.",
  },
  "the-chest-freezer": {
    name: "Frozen Solid",
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

/** Swap each listed card's curse for its jinx. */
export function applyJinxes(cards: CardDefinition[]) {
  for (const [id, jinx] of Object.entries(jinxes)) {
    const card = cards.find((c) => c.id === `dungeon.${id}`);
    if (!card?.curse) throw new Error(`No curse to swap: dungeon.${id}`);
    delete card.curse;
    card.jinx = jinx;
  }
  const left = cards.filter((c) => c.id.startsWith("dungeon.") && c.curse);
  if (left.length)
    throw new Error(`Curses left: ${left.map((c) => c.id).join(", ")}`);
}
