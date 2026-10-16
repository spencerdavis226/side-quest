import type {
  DiceDefinition,
  DiceOutcome,
  DiceRoll,
  SessionState,
} from "./types";
import { currentCard, type Random } from "./engine";

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
): string {
  const total = values.reduce((a, b) => a + b, 0);
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
export function rollWins(dice: DiceDefinition, values: number[]): boolean {
  const total = values.reduce((a, b) => a + b, 0);
  const doubles =
    values.length > 1 && values.every((value) => value === values[0]);
  if (doubles && dice.doubles) return !!dice.doublesWin;
  return !!dice.outcomes?.find((range) => covers(range, total))?.win;
}
/** Only the engine samples randomness. Renderers receive these committed values. */
export function rollDice(
  session: SessionState,
  random: Random = Math.random,
): SessionState {
  const dice = currentCard(session).dice;
  if (!dice || session.phase !== "revealed" || session.roll) return session;
  const values = Array.from({ length: dice.count }, () => {
    const sample = random();
    if (!Number.isFinite(sample) || sample < 0 || sample >= 1)
      throw Error("Invalid dice randomness");
    return 1 + Math.floor(sample * dice.sides);
  });
  const total = values.reduce((a, b) => a + b, 0);
  return {
    ...session,
    roll: {
      values,
      total,
      instruction: resolveInstruction(dice, values),
      returned: false,
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
    roll.instruction !== resolveInstruction(dice, roll.values) ||
    typeof roll.returned !== "boolean"
  )
    throw Error("Invalid saved dice result");
}
