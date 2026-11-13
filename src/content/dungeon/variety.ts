import type {
  CardDefinition,
  DiceDefinition,
  TimerDefinition,
} from "../../game/types";
import { clock, d20, fuse, GUESSED, seats, SIDE_BETS } from "./shared";

// The variety pass (2026-10-31, owner: "double down on ... variety and
// interesting fun cards ... especially variety within cards"), floor by
// floor after the Cellar (rewritten in place in `cellar.ts`). Applied by card
// ID after the outcome rewrites and before the naturals pass, like
// `outcomes.ts`:
// - `mishap`: a room that only poured becomes something the table does (a
//   vote, a reflex, a hidden fuse, a secret on a clock, four seats and four
//   dice, an auction, a performance the table judges). Still nothing at
//   stake in the crawl.
// - `duel`: a d20 monster becomes a table fight settled with Won and Lost.
// - `setup`: a d20 room asks for something before the roll.
// - `crit` / `fumble`: a natural 20 or 1 gets a line of its own instead of
//   the doubled roll beside it (keep its numbers doubled).
// - Bosses open with side bets (the setup).
// `tests/variety.test.ts` holds each reworked floor to the higher bar.

type Rewrite = {
  /** New rules: a mishap's line, a duel's challenge, or a d20 setup. */
  rules?: string;
  /** The room becomes a table fight (no roll; Won and Lost). */
  duel?: true;
  crit?: string;
  fumble?: string;
  secret?: string;
  timer?: TimerDefinition;
  dice?: DiceDefinition;
};

const rewrites: Readonly<Record<string, Rewrite>> = {
  // The Rooftop Bar.
  "the-seagull": {
    rules:
      "A seagull eyes the table. Last to cover their drink with a hand drinks 3.",
  },
  "the-proposal": {
    rules:
      "Read alone his proposal, start the clock, then act it out. The table guesses the line.",
    secret: "'WILL YOU SPLIT AN UBER WITH ME FOREVER?'",
    timer: clock(GUESSED),
  },
  "the-heat-lamp": {
    rules:
      "On three, everyone points at who'd hog the heat lamp. Most fingers: drink 3.",
  },
  "rogue-drone": {
    rules: "A rogue drone buzzes the table, filming. Roll four dice.",
    dice: seats("It films four bad sides."),
  },
  "the-fireworks": {
    rules:
      "Light the fuse. Pass a beer clockwise, each 'ooh' louder. The firework hits whoever holds it.",
    timer: fuse("BOOM. Whoever is holding the beer drinks 3."),
  },
  "pigeon-king": {
    duel: true,
    rules:
      "Coo-off with your left neighbor; the table picks the better pigeon. Worse pigeon: drink 5.",
  },
  "rooftop-raccoon": {
    duel: true,
    rules:
      "Guarding the limes: rock-paper-scissors with your right neighbor, best of 3. Lose: drink 5.",
  },
  "the-neighbor": {
    rules:
      "A man in a bathrobe on the next roof threatens to call. Wave at him, then roll d20.",
    fumble: "He calls, and it's your mom. Drink 10, and wave again.",
  },
  "the-gargoyle": {
    rules:
      "A gargoyle on the ledge, only pretending to be stone. Everyone freezes while you roll d20.",
  },
  "hot-tub-wizard": {
    rules: "A hot tub 'wizard' wants your drink. Hold it close, then roll d20.",
    crit: "He is a wizard, and he likes you. Give 10, and he makes it rain.",
  },
  // Ambushes and the last plain rooms (2026-10-31): each asks something.
  "falling-taps": {
    rules:
      "An acorn bonks you on the head, and you're Thumb Master now. Drink 1, then use it.",
  },
  "the-sprinklers": {
    rules:
      "The sprinklers come on. Last to cover their head with both hands drinks 3.",
  },
  "rooftop-yoga": {
    rules:
      "Twenty people in downward dog want their sunset. Namaste, then roll d20.",
  },
  "pigeon-squadron": {
    rules: "Twelve pigeons in a V, on a strafing run. Duck, then roll d20.",
  },
  "wedding-shoot": {
    rules:
      "A wedding party wants the skyline and you're in every shot. Smile, then roll d20.",
  },
};

/** The rewrites above, applied by card ID. A rewritten d20 keeps its odds
 * and its lose and win lines; a duel drops its dice. */
export function applyVariety(cards: CardDefinition[]): CardDefinition[] {
  return cards.map((card) => {
    const r = rewrites[card.id.replace(/^dungeon\./, "")];
    if (!r) return card;
    const next: CardDefinition = { ...card };
    if (r.rules) next.rules = r.rules;
    if (r.secret) next.secret = r.secret;
    if (r.timer) next.timer = r.timer;
    if (r.dice) next.dice = r.dice;
    if (r.duel === true) {
      delete next.dice;
      next.encounter = "trial";
      next.ribbon = card.ribbon?.replace(/ · \w+$/, " · Trial");
    }
    if ((r.crit || r.fumble) && card.dice?.outcomes) {
      const outcomes = card.dice.outcomes;
      const at = (face: number) =>
        outcomes.find((o) => o.min <= face && face <= o.max)!;
      const win = outcomes.find((o) => o.win)!;
      next.dice = d20(win.min, at(2).instruction, at(19).instruction, {
        ...(r.crit ? { crit: r.crit } : {}),
        ...(r.fumble ? { fumble: r.fumble } : {}),
      });
    }
    return next;
  });
}

/** The IDs rewritten here, for the tests. */
export const varietyIds = Object.keys(rewrites).map((id) => `dungeon.${id}`);
