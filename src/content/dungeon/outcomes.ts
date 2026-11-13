import type { CardDefinition } from "../../game/types";
import { rollTable } from "../author";
import { pairNeed } from "./shared";

// The roll-outcome rewrite (2026-10-25): 97 Pub Crawl rooms resolved to a
// line of flavor and a bare "Drink N" or "Give N" either way. Each now makes
// someone do something, or aims its drinks at someone the table picks, and
// keeps its number, so a natural 20 or 1 still doubles it. Nine of them, one
// a floor, roll 2d6 instead of a d20 (`doubles`: a third, better result), so
// a floor's dice aren't all one d20. Applied by card ID before the naturals
// pass. `[lose, win]`: `null` keeps the line as written.
type Rewrite = {
  lose?: string;
  win?: string;
  /** Roll 2d6 at the same odds; doubles always win, with this line. */
  doubles?: string;
};

const rewrites: Readonly<Record<string, Rewrite>> = {
  // The King's Road (was the Cellar).
  "goblin-shaman": {
    win: "You knock her hat off. Give 3 to whoever looks most cursed.",
  },
  "rolling-kegs": {
    lose: "Flattened. Drink 3, lying down if you can.",
    win: "You dive clear. Give 2 to whoever didn't flinch.",
  },
  "barback-poltergeist": {
    lose: "He's gone, and so is your purse. Drink 3.",
    win: "You catch him by the collar. Make someone turn out their pockets, then give 3.",
    doubles: "He robs everyone else instead. Everyone else drinks 3.",
  },
  "loose-floorboard": {
    win: "You step over it like a cat. Meow, then give 2.",
  },
  // The Kitchen.
  "garlic-wraith": {
    win: "You hold your breath. Breathe on someone; they drink 5.",
  },
  "rogue-rotisserie": {
    lose: "Basted. Drink 5.",
    win: "You carve your way out. Carve someone a drumstick; they drink 5.",
    doubles: "Chicken for everyone. Everyone else drinks 5 with a mouthful.",
  },
  "grease-fire": {
    win: "You smother it with a lid. Give 3 to whoever looks hot.",
  },
  mandoline: {
    win: "You slide the guard back on. Slice the table in half; the other half drinks 3.",
  },
  "microwave-ghost": {
    win: "You open a window. Give 5 to whoever brought fish to work.",
  },
  "ticket-machine": { win: "Heard. Shout 'Heard!' and give 5." },
  "celebrity-chef": {
    win: "You make his dish better. Call someone a donkey; they drink 6.",
  },
  // The Rooftop Bar.
  "pigeon-king": {
    win: "You throw the crown off the roof. Crown someone; they drink 5.",
  },
  "the-wind": {
    win: "You lean into it like a music video. Hair flip, then give 5.",
  },
  "influencer-golem": {
    lose: "Take forty. Drink 5.",
    win: "You knock over the ring light. Give 5 to whoever's posing.",
    doubles: "It films you instead. Everyone else drinks 5 for the content.",
  },
  "the-neighbor": {
    win: "You invite him over. Pick someone to be the neighbor; they drink 5.",
  },
  "the-gargoyle": {
    win: "You push it off the ledge. Give 5 to whoever's still as stone.",
  },
  thunderstorm: { win: "You dance in it. Everyone dances or drinks 5." },
  "rooftop-raccoon": {
    win: "You bribe it with a cherry. Give 4 to whoever would eat the limes.",
  },
  "the-ledge": { win: "You step back, cool. Give 4 to whoever gasped." },
  "loose-tile": {
    win: "You land it like a parkour video. Shout 'parkour!' and give 4.",
  },
  "hot-tub-wizard": {
    win: "He's just an old man. Give 5 to whoever believed him.",
  },
  "the-awning": {
    win: "You poke it from a safe distance. Point at someone; they drink 3.",
  },
  "penthouse-owner": {
    win: "You buy the floor below his. Give 6 to the richest-looking player here.",
  },
  "gargoyle-king": {
    win: "You crown yourself. Give 6, split among your subjects.",
  },
  "storm-chaser": {
    win: "You ground him. Touch someone's shoulder, zap; they drink 6.",
  },
  "helicopter-pilot": { win: "Free ride. Pick a co-pilot; you both give 6." },
  // Relics.
  "mimic-cooler": {
    win: "Gold, and something useful. Flip someone a coin; give 3.",
  },
  "back-burner": {
    win: "Best soup of your life. Give 5 to whoever cooks the worst.",
  },
  "the-telescope": {
    win: "A flask in the coin slot. Spy on someone; they drink 5.",
  },
  "the-water-tower": {
    win: "The best view in town. Point out a stranger's window; give 5.",
  },
  // The Quarter-Zips.
  "queue-knows-the-owner": {
    win: "The owner has never heard of Brad. Give 3 to the Brad of the table.",
  },
  "queue-were-together": {
    win: "The bouncer believes you. Pick someone you're 'together' with; they drink 3.",
  },
  "queue-cover-charge": {
    win: "The bouncer charges Chad double. Give 3, twice, to the same person.",
  },
  "queue-hand-stamp": {
    win: "You wash it off in a puddle. Stamp someone's hand; they drink 3.",
  },
  "stairs-group-photo": {
    win: "You photobomb it. Everyone poses; the worst pose drinks 4.",
  },
  "stairs-leaderboard": { win: "You overtake him. Give 4 to whoever's last." },
  "stairs-recruitment": {
    win: "You say no and mean it. Make someone zip up; they drink 4.",
  },
  // The hidden rooms' guards.
  "flapper-fran": {
    win: "The room applauds. Pick a dance partner; they drink 3.",
  },
  "bottle-service": {
    win: "It was for the next table. Give 3 to whoever ordered it.",
  },
  "the-bodyguard": {
    win: "You walk in like you own it. Give 3 to whoever's VIP.",
  },
  "the-accountant": {
    win: "You find his discrepancy. Give 3 to whoever owes you money.",
  },
  "the-dealer": { win: "You catch her. Deal someone in; they drink 3." },
  "the-ref": {
    win: "He raises your hand. Blow the whistle on someone; they drink 3.",
  },
};

/** Rewrite each listed room's lines, and turn a `doubles` one into 2d6 at
 * the d20's odds. */
export function applyOutcomes(cards: CardDefinition[]) {
  for (const [id, r] of Object.entries(rewrites)) {
    const card = cards.find((c) => c.id === `dungeon.${id}`);
    const dice = card?.dice;
    if (!card || !dice?.outcomes) throw new Error(`No roll: dungeon.${id}`);
    if (r.doubles) {
      const win = dice.outcomes.find((o) => o.win)!;
      const lose = dice.outcomes.find((o) => !o.win)!;
      if (
        dice.count !== 1 ||
        dice.sides !== 20 ||
        !/Roll d20\.$/.test(card.rules)
      )
        throw new Error(`Only a d20 room turns to 2d6: ${card.id}`);
      const t = pairNeed(win.min);
      card.rules = card.rules.replace(/Roll d20\.$/, "Roll 2d6.");
      card.dice = {
        ...rollTable(2, 6, [
          { min: 2, max: t - 1, instruction: r.lose ?? lose.instruction },
          { min: t, max: 12, instruction: r.win ?? win.instruction, win: true },
        ]),
        doubles: r.doubles,
        doublesWin: true,
      };
      continue;
    }
    card.dice = {
      ...dice,
      outcomes: dice.outcomes.map((o) =>
        // A range, never a natural's own line (a crit or a fumble).
        o.min === o.max
          ? o
          : o.win && r.win
            ? { ...o, instruction: r.win }
            : !o.win && r.lose
              ? { ...o, instruction: r.lose }
              : o,
      ),
    };
  }
  return cards;
}
