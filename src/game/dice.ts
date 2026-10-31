import type {
  CardDefinition,
  DiceDefinition,
  DiceOutcome,
  DiceRoll,
  SessionState,
} from "./types";
import {
  assistBonus,
  cardEdge,
  currentCard,
  finaleCard,
  omenEffect,
  PRESS_STEP,
  type Random,
} from "./engine";

/** How a committed roll is read: a crawl d20's omen bonus, and whether it
 * counts as a natural. Absent on every other roll. */
export type RollReading = Pick<DiceRoll, "bonus" | "natural">;

/** The total a table reads. A natural reads as the die's own 20 or 1; any
 * other single-d20 roll with a bonus is held between 2 and 19, so a bonus
 * never makes (or unmakes) a natural. */
export function readTotal(
  dice: DiceDefinition,
  values: number[],
  reading?: RollReading,
) {
  const total = values.reduce((a, b) => a + b, 0);
  if (reading?.bonus === undefined) return total;
  if (reading.natural === 20) return dice.sides;
  if (reading.natural === 1) return 1;
  return Math.min(dice.sides - 1, Math.max(2, total + reading.bonus));
}

// `{total}` is the sum of the committed faces; `{first}` … `{fourth}` are the
// individual dice, so cards that hand out one die and drink another can still
// resolve to exact numbers. Only placeholders the card can actually fill are
// accepted (`{second}` needs at least two dice).
const placeholderIndex: Record<string, number> = {
  total: 0,
  first: 0,
  second: 1,
  third: 2,
  fourth: 3,
};
const placeholderPattern = /\{(total|first|second|third|fourth)\}/g;

const templateIsValid = (text: unknown, count: number): text is string =>
  typeof text === "string" &&
  !!text.trim() &&
  !/[{}]/.test(text.replace(placeholderPattern, "")) &&
  [...text.matchAll(placeholderPattern)].every(
    (match) => placeholderIndex[match[1]] < count,
  );

const covers = (range: DiceOutcome, total: number) => {
  const step = range.step ?? 1;
  return (
    total >= range.min && total <= range.max && (total - range.min) % step === 0
  );
};

export function validateDice(value: unknown): asserts value is DiceDefinition {
  const d = value as DiceDefinition;
  if (
    !d ||
    d.version !== 1 ||
    ![6, 20].includes(d.sides) ||
    !Number.isInteger(d.count) ||
    d.count < 1 ||
    d.count > 4
  )
    throw Error("Invalid dice: use one to four d6 or d20 dice");
  if (
    d.choice !== undefined &&
    ![d.choice?.skip, d.choice?.roll].every(
      (label) =>
        typeof label === "string" && !!label.trim() && label.length <= 14,
    )
  )
    throw Error("Invalid dice choice");
  if (d.doubles !== undefined) {
    if (d.count < 2 || !templateIsValid(d.doubles, d.count))
      throw Error("Invalid doubles instruction");
  }
  if (d.doublesWin !== undefined && (d.doublesWin !== true || !d.doubles))
    throw Error("Invalid doubles win");
  if (d.instruction !== undefined) {
    if (!templateIsValid(d.instruction, d.count) || d.outcomes !== undefined)
      throw Error("Invalid dice instruction");
    return;
  }
  if (!Array.isArray(d.outcomes) || !d.outcomes.length)
    throw Error("Missing dice outcomes");
  const maximum = d.count * d.sides;
  const covered = new Set<number>();
  for (const range of d.outcomes) {
    const step = range?.step ?? 1;
    if (
      !range ||
      !Number.isInteger(range.min) ||
      !Number.isInteger(range.max) ||
      range.min < d.count ||
      range.max > maximum ||
      range.max < range.min ||
      !Number.isInteger(step) ||
      step < 1 ||
      (range.win !== undefined && range.win !== true) ||
      !templateIsValid(range.instruction, d.count)
    )
      throw Error("Dice outcomes must cover every total exactly once");
    for (let total = range.min; total <= range.max; total += step) {
      if (covered.has(total))
        throw Error("Dice outcomes must cover every total exactly once");
      covered.add(total);
    }
  }
  for (let total = d.count; total <= maximum; total++)
    if (!covered.has(total)) throw Error("Dice outcome range is incomplete");
}
export const diceNotation = (dice: DiceDefinition) =>
  `${dice.count}d${dice.sides}`;
/** Resolve a committed roll to the exact, non-conditional instruction. */
export function resolveInstruction(
  dice: DiceDefinition,
  values: number[],
  reading?: RollReading,
): string {
  const total = readTotal(dice, values, reading);
  const doubles =
    values.length > 1 && values.every((value) => value === values[0]);
  const text =
    doubles && dice.doubles
      ? dice.doubles
      : (dice.instruction ??
        dice.outcomes?.find((range) => covers(range, total))?.instruction);
  if (!text) throw Error("No instruction for this roll");
  return text
    .replaceAll("{total}", String(total))
    .replaceAll("{first}", String(values[0]))
    .replaceAll("{second}", String(values[1]))
    .replaceAll("{third}", String(values[2]))
    .replaceAll("{fourth}", String(values[3]));
}
/** Whether a committed roll is one of a battle's winning outcomes. */
export function rollWins(
  dice: DiceDefinition,
  values: number[],
  reading?: RollReading,
): boolean {
  const total = readTotal(dice, values, reading);
  const doubles =
    values.length > 1 && values.every((value) => value === values[0]);
  if (doubles && dice.doubles) return !!dice.doublesWin;
  return !!dice.outcomes?.find((range) => covers(range, total))?.win;
}
/** What a crawl adds to a single-d20 battle's face before it is read:
 * tonight's omen (and the starter's form), less each push-your-luck pull,
 * plus a caught Pokémon sent in (2026-10-31). 0 off a crawl. */
export function rollBonus(session: SessionState, card: CardDefinition): number {
  const party = session.quest?.party;
  const dice = card.dice;
  if (!party || !card.battle || dice?.count !== 1 || dice.sides !== 20)
    return 0;
  const effect = omenEffect(session.quest) ?? {};
  // Each pull on a push-your-luck card rolls lower.
  const pulls = card.press ? (party.press ?? 0) : 0;
  const sent = party.assist ? finaleCard(session.quest!, party.assist) : null;
  return (
    (effect.roll?.all ?? 0) +
    (card.encounter ? (effect.roll?.[card.encounter] ?? 0) : 0) -
    PRESS_STEP * pulls +
    (sent ? assistBonus(sent) : 0)
  );
}
/** The face a crawl battle's dice must show to win (2026-10-31, owner: a
 * gem on the card): the lowest winning total, less the d20's bonus, held to
 * 2..20 on a d20 (a natural 20 always reads 20, a natural 1 always 1).
 * `null` for a card with no winning roll. */
export function rollTarget(
  session: SessionState,
  card: CardDefinition,
): { target: number; count: number; sides: number } | null {
  const dice = card.dice;
  const wins = dice?.outcomes?.filter((o) => o.win) ?? [];
  if (!dice || !card.battle || !wins.length) return null;
  const lowest = Math.min(...wins.map((o) => o.min));
  const single = dice.count === 1 && dice.sides === 20;
  const target = single
    ? Math.min(20, Math.max(2, lowest - rollBonus(session, card)))
    : lowest;
  return { target, count: dice.count, sides: dice.sides };
}
/** Only the engine samples randomness. Renderers receive these committed values. */
export function rollDice(
  session: SessionState,
  random: Random = Math.random,
): SessionState {
  const card = currentCard(session);
  const dice = card.dice;
  if (!dice || session.phase !== "revealed" || session.roll) return session;
  const sample = () => {
    const n = random();
    if (!Number.isFinite(n) || n < 0 || n >= 1)
      throw Error("Invalid dice randomness");
    return 1 + Math.floor(n * dice.sides);
  };
  // A crawl's single d20 battle reads tonight's omen: its bonus, its
  // natural range, and a Bidoof's flinch at every 20.
  const effect =
    session.quest?.party && card.battle && dice.count === 1 && dice.sides === 20
      ? (omenEffect(session.quest) ?? {})
      : null;
  // One full attempt: the faces, and how the omen reads them.
  const attempt = () => {
    let values = Array.from({ length: dice.count }, sample);
    let reading: RollReading | undefined;
    let flinched = false;
    if (effect) {
      for (let i = 0; effect.reroll20 && values[0] === 20 && i < 50; i++) {
        values = [sample()];
        flinched = true;
      }
      const face = values[0];
      const bonus = rollBonus(session, card);
      const natural =
        face >= (effect.crit ?? 20)
          ? 20
          : face <= (effect.fumble ?? 1)
            ? 1
            : null;
      reading = { bonus, ...(natural ? { natural } : {}) };
    }
    return { values, reading, flinched };
  };
  // A League dice fight with a type edge rolls double the dice and keeps
  // the best of them (advantage) or the worst (disadvantage): a d20 keeps
  // the better or worse of two (a win over a loss, then the higher total);
  // 2d6 keeps the two highest or lowest of four (owner, 2026-10-25: four
  // dice on screen read as four dice, so they are one pool, not two pairs).
  const edge = cardEdge(session.quest, card);
  let kept = attempt();
  let dropped: number[] | undefined;
  if (edge) {
    const rank = (values: number[], reading?: RollReading) =>
      (rollWins(dice, values, reading) ? 1000 : 0) +
      readTotal(dice, values, reading);
    const better = (a: number, b: number) =>
      edge === "advantage" ? a > b : a < b;
    if (dice.count === 1) {
      // Each die has its own omen reading (its natural, a flinch).
      const other = attempt();
      if (
        better(
          rank(other.values, other.reading),
          rank(kept.values, kept.reading),
        )
      ) {
        dropped = kept.values;
        kept = other;
      } else dropped = other.values;
    } else {
      const pool = [
        ...kept.values,
        ...Array.from({ length: dice.count }, sample),
      ];
      // The highest faces with the edge, the lowest against it: what the
      // table sees (the kept dice stay lit), and never a pool that can't
      // win (keeping the worst-reading pair made a doubles-lose gym
      // unwinnable).
      const pick = pool
        .map((_, i) => i)
        .sort((i, j) =>
          edge === "advantage" ? pool[j] - pool[i] : pool[i] - pool[j],
        )
        .slice(0, dice.count)
        .sort((i, j) => i - j);
      kept = { ...kept, values: pick.map((i) => pool[i]) };
      dropped = pool.filter((_, i) => !pick.includes(i));
    }
  }
  const { values, reading, flinched } = kept;
  const total = values.reduce((a, b) => a + b, 0);
  return {
    ...session,
    roll: {
      values,
      total,
      instruction: resolveInstruction(dice, values, reading),
      returned: false,
      ...reading,
      ...(flinched ? { flinched: true as const } : {}),
      ...(edge ? { edge, dropped } : {}),
    },
  };
}
export function returnToCard(session: SessionState): SessionState {
  if (session.phase !== "revealed" || !session.roll || session.roll.returned)
    return session;
  return { ...session, roll: { ...session.roll, returned: true } };
}
export function validateRoll(
  roll: DiceRoll | null,
  dice: DiceDefinition | undefined,
) {
  if (roll === null) return;
  if (
    !dice ||
    !roll ||
    !Array.isArray(roll.values) ||
    roll.values.length !== dice.count ||
    roll.values.some((v) => !Number.isInteger(v) || v < 1 || v > dice.sides) ||
    roll.total !== roll.values.reduce((a, b) => a + b, 0) ||
    roll.instruction !== resolveInstruction(dice, roll.values, roll) ||
    typeof roll.returned !== "boolean" ||
    // An omen's reading belongs only on a single d20.
    ((roll.bonus !== undefined ||
      roll.natural !== undefined ||
      roll.flinched !== undefined) &&
      (dice.count !== 1 ||
        dice.sides !== 20 ||
        !Number.isSafeInteger(roll.bonus) ||
        Math.abs(roll.bonus!) > 10 ||
        (roll.natural !== undefined && ![20, 1].includes(roll.natural)) ||
        (roll.flinched !== undefined && roll.flinched !== true))) ||
    // A type edge keeps the other attempt's faces beside the kept ones.
    ((roll.edge !== undefined || roll.dropped !== undefined) &&
      (!["advantage", "disadvantage"].includes(roll.edge!) ||
        !Array.isArray(roll.dropped) ||
        roll.dropped.length !== dice.count ||
        roll.dropped.some(
          (v) => !Number.isInteger(v) || v < 1 || v > dice.sides,
        )))
  )
    throw Error("Invalid saved dice result");
}
