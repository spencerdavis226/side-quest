import type { CardDefinition, DiceOutcome } from "../game/types";

// The crawls' standing rule (owner, 2026-10-17): on a single d20, a natural
// 20 doubles the good a win does and a natural 1 doubles the harm a loss
// does. The engine doubles hearts, items and boss swings (`natural` in
// `game/engine.ts`); this pass doubles the drinks in the card's own text, so
// each roll still resolves to one exact instruction. A table whose 20 (or 1)
// already has its own outcome keeps that outcome as written, with the
// "Natural 20!" (or "Natural 1!") lead added. `tests/naturals.test.ts`
// fails any crawl d20 whose natural reads the same as the roll beside it:
// give that card its own `crit` or `fumble`.

const double = (n: string) => String(Number(n) * 2);

/** A win's text, doubled: what the drawer gives, or what everyone else
 * drinks. The drawer's own drinks on a win stay as they are. */
export function doubleGood(text: string): string {
  return text
    .replace(
      /\b(give|gives|hand out|hands out|split|splits)( out)? (\d+)/gi,
      (_, verb, out = "", n) => `${verb}${out} ${double(n)}`,
    )
    // On a win, "drinks" is always someone else, and so is "they drink" or
    // "or drink" (a dare the drawer hands out).
    .replace(
      /\b(drinks|they drink|or drink)( for)? (\d+)/gi,
      (_, verb, f = "", n) => `${verb}${f} ${double(n)}`,
    )
    .replace(/\b(steal) a sip\b/gi, "$1 two sips")
    .replace(
      /\b(give|gives|hand out) an? ((?:[a-z-]+ )*?)shot\b/gi,
      (_, verb, kind) => `${verb} two ${kind}shots`,
    )
    .replace(
      /\b(else|they) (finish(?:es)?) their drinks?\b/gi,
      (all) => `${all}, then a fresh one`,
    )
    .replace(/\b(make) a rule\b/gi, (_, make) => `${make} two rules`);
}

/** A loss's text, doubled: every drink, shot and finish the losers take. */
export function doubleBad(text: string): string {
  return text
    .replace(
      /\b(drinks?|sips?)( for)? (\d+)/gi,
      (_, verb, f = "", n) => `${verb}${f} ${double(n)}`,
    )
    .replace(
      /\b(take|takes) an? ((?:[a-z-]+ )*?)shot\b/gi,
      (_, verb, kind) => `${verb} two ${kind}shots`,
    )
    .replace(
      /\b(finish(?:es)?) (your|their) drinks?\b/gi,
      (all) => `${all}, then a fresh one`,
    )
    .replace(/\b(finish(?:es)?) half (your|their) drink\b/gi, "$1 $2 drink")
    .replace(
      /\b(finish(?:es)?) whatever (you have|they have)\b/gi,
      (all) => `${all}, then a fresh one`,
    );
}

const lead = (face: 20 | 1, text: string) =>
  /^Natural (20|1)!/.test(text) ? text : `Natural ${face}! ${text}`;

/** One face of a d20 table, filled with its only total. */
const at = (face: number, text: string) =>
  text.replaceAll("{total}", String(face)).replaceAll("{first}", String(face));

/** The card with its natural 20 and natural 1 split off and doubled. Only a
 * single d20 table changes; every other card comes back as it was. */
export function withNaturals(card: CardDefinition): CardDefinition {
  const dice = card.dice;
  if (dice?.count !== 1 || dice.sides !== 20 || !dice.outcomes) return card;
  const outcomes: DiceOutcome[] = [];
  for (const o of dice.outcomes) {
    if ((o.step ?? 1) !== 1) return card;
    const top = o.min <= 20 && o.max === 20;
    const bottom = o.min === 1;
    if (top && o.min === 20) {
      outcomes.push({ ...o, instruction: lead(20, o.instruction) });
      continue;
    }
    if (bottom && o.max === 1) {
      outcomes.push({ ...o, instruction: lead(1, o.instruction) });
      continue;
    }
    let { min, max } = o;
    // Only a win's 20 doubles the good, and only a loss's 1 the harm.
    if (bottom && !o.win) {
      outcomes.push({
        min: 1,
        max: 1,
        instruction: lead(1, doubleBad(at(1, o.instruction))),
      });
      min = 2;
    }
    const twenty = top && o.win;
    if (twenty) max = 19;
    if (min <= max) outcomes.push({ ...o, min, max });
    if (twenty)
      outcomes.push({
        min: 20,
        max: 20,
        instruction: lead(20, doubleGood(at(20, o.instruction))),
        win: true,
      });
  }
  return { ...card, dice: { ...dice, outcomes } };
}
