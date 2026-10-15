import { describe, expect, it, vi } from "vitest";
import {
  advance,
  awaitingChoice,
  createSession,
  replaySession,
  skipRoll,
} from "../src/game/engine";
import {
  rollDice,
  returnToCard,
  validateDice,
  resolveInstruction,
} from "../src/game/dice";
import { parseSession } from "../src/app/persistence";
import { PresentationController } from "../src/presentation/controller";
import { cards, packs, validateCatalog } from "../src/content/catalog";
import type { DiceDefinition } from "../src/game/types";
const diceCards = cards.filter((c) => c.dice);
// A 2d6 card with a real range table drives the range/deep-snapshot tests.
const fixture = diceCards.find(
  (c) => c.dice!.count === 2 && c.dice!.sides === 6 && c.dice!.outcomes,
)!;
const d20Card = diceCards.find((c) => c.dice!.sides === 20)!;
const session = (limit: number | null = 2, card = fixture) =>
  createSession(
    { version: 1, packIds: ["core"], limit },
    [card],
    [{ ...packs[0], cardIds: [card.id] }],
    () => 0.3,
  );
const revealed = () => advance(session());
const settle = (c: PresentationController) => {
  while (c.getSnapshot().motion) c.finish(c.getSnapshot().transition);
};
// Build one legal face set for every possible total (each face 1..sides).
const valuesFor = (d: DiceDefinition, total: number) => {
  const values: number[] = [];
  let left = total;
  for (let i = 0; i < d.count; i++) {
    const value = Math.min(d.sides, Math.max(1, left - (d.count - i - 1)));
    values.push(value);
    left -= value;
  }
  return values;
};

describe("dice content", () => {
  it("validates the production dice cards", () => {
    validateCatalog(diceCards, []);
    expect(diceCards.length).toBeGreaterThanOrEqual(2);
  });
  it.each([0, 5, 1.5, -1, NaN])("rejects unsupported count %s", (count) =>
    expect(() => validateDice({ ...fixture.dice, count })).toThrow(),
  );
  it.each([
    { sides: 8 },
    { version: 2 },
    { outcomes: [] },
    { outcomes: [{ min: 2, max: 11, instruction: "Toast" }] },
    {
      outcomes: [
        { min: 2, max: 7, instruction: "Toast" },
        { min: 7, max: 12, instruction: "Toast" },
      ],
    },
    { outcomes: [{ min: 3, max: 12, instruction: "Toast" }] },
    { outcomes: [{ min: 2, max: 12, instruction: "" }] },
    { instruction: "{player}" },
    { instruction: "Toast", outcomes: fixture.dice!.outcomes },
  ])("rejects invalid specification %j", (patch) =>
    expect(() => validateDice({ ...fixture.dice, ...patch })).toThrow(),
  );
  it("resolves every range boundary and only known placeholders", () => {
    for (const card of diceCards) {
      const d = card.dice!;
      for (let total = d.count; total <= d.sides * d.count; total++)
        expect(resolveInstruction(d, valuesFor(d, total))).toBeTruthy();
    }
    const d: DiceDefinition = {
      version: 1,
      count: 4,
      sides: 20,
      instruction: "Tell a {total}-word tale.",
    };
    validateDice(d);
    expect(resolveInstruction(d, [20, 20, 20, 20])).toBe(
      "Tell a 80-word tale.",
    );
    expect(resolveInstruction(fixture.dice!, [1, 1])).toBe(
      "Basic as hell. Say your coffee order and drink 2.",
    );
    expect(resolveInstruction(fixture.dice!, [6, 6])).toBe(
      "Basic as hell. Say your coffee order and drink 12.",
    );
    expect(resolveInstruction(fixture.dice!, [1, 2])).toBe(
      "Weirdly original. Give 3.",
    );
  });
  it("resolves every production roll to one exact instruction", () => {
    for (const card of diceCards) {
      const d = card.dice!;
      for (let total = d.count; total <= d.sides * d.count; total++) {
        const text = resolveInstruction(d, valuesFor(d, total));
        expect(text, `${card.id} at ${total}`).not.toMatch(
          /odd|even|doubles|otherwise|your roll|that number|\d+d(?:6|20)|\{/i,
        );
      }
    }
  });
  it("resolves parity and per-die placeholders to exact text", () => {
    const parity = diceCards.find((c) => c.id === "core.chosen-one")!.dice!;
    expect(resolveInstruction(parity, [13])).toBe("Drink 13.");
    expect(resolveInstruction(parity, [14])).toBe("Give 14.");
    const split = diceCards.find((c) => c.id === "house.sheet-094")!.dice!;
    expect(resolveInstruction(split, [6, 2])).toBe("Give 6 and drink 2.");
  });
  it("rejects parity gaps, overlaps, and unavailable placeholders", () => {
    expect(() =>
      validateDice({
        version: 1,
        count: 1,
        sides: 6,
        outcomes: [
          { min: 1, max: 5, step: 2, instruction: "A" },
          { min: 2, max: 5, step: 2, instruction: "B" },
        ],
      }),
    ).toThrow();
    expect(() =>
      validateDice({
        version: 1,
        count: 1,
        sides: 6,
        outcomes: [
          { min: 1, max: 6, step: 1, instruction: "A" },
          { min: 2, max: 2, instruction: "B" },
        ],
      }),
    ).toThrow();
    expect(() =>
      validateDice({
        version: 1,
        count: 1,
        sides: 6,
        instruction: "{second} drinks.",
      }),
    ).toThrow();
    expect(() =>
      validateDice({
        version: 1,
        count: 1,
        sides: 6,
        instruction: "Give {total}.",
        doubles: "Give {total} twice.",
      }),
    ).toThrow();
  });
});
describe("dice transactions and saves", () => {
  it("commits one roll, requests a fast finish, and automatically reveals before discard", () => {
    const persist = vi.fn(),
      shuffleRandom = vi.fn(() => 0.1),
      diceRandom = vi.fn(() => 0.9999);
    const c = new PresentationController(
      revealed(),
      persist,
      () => {},
      shuffleRandom,
      diceRandom,
    );
    c.tap();
    const rollTransition = c.getSnapshot().transition;
    for (let i = 0; i < 20; i++) c.tap();
    expect(c.getSnapshot().finishingRoll).toBe(true);
    expect(c.getSnapshot().transition).toBe(rollTransition);
    expect(c.getSnapshot().motion).toBe("roll");
    expect(persist).toHaveBeenCalledTimes(1);
    expect(diceRandom).toHaveBeenCalledTimes(2);
    expect(shuffleRandom).not.toHaveBeenCalled();
    expect(c.getSnapshot().session!.roll?.values).toEqual([6, 6]);
    const saved = parseSession(JSON.stringify(c.getSnapshot().session));
    const restored = new PresentationController(saved, vi.fn());
    expect(restored.getSnapshot().motion).toBeNull();
    restored.tap();
    expect(restored.getSnapshot().session?.roll?.returned).toBe(false);
    settle(c);
    expect(persist).toHaveBeenCalledTimes(1);
    c.tap();
    expect(persist).toHaveBeenCalledTimes(1);
    c.revealRoll();
    expect(persist).toHaveBeenCalledTimes(2);
    expect(c.getSnapshot().session!.discarded).toBe(0);
    settle(c);
    c.tap();
    expect(persist).toHaveBeenCalledTimes(3);
    expect(c.getSnapshot().session!.discarded).toBe(1);
  });
  it("cancellation and background settling preserve results without replaying effects", () => {
    const persist = vi.fn(),
      effect = vi.fn(),
      c = new PresentationController(revealed(), persist, effect);
    c.tap();
    const state = c.getSnapshot().session;
    const old = c.getSnapshot().transition;
    c.settleAll();
    c.finish(old);
    expect(c.getSnapshot().session).toBe(state);
    expect(persist).toHaveBeenCalledTimes(1);
    expect(effect).toHaveBeenCalledWith("roll-cancel");
    effect.mockClear();
    new PresentationController(
      parseSession(JSON.stringify(state)),
      persist,
      effect,
    );
    expect(effect).not.toHaveBeenCalled();
  });
  it("never discards an unresolved roll and never rerolls an accepted one", () => {
    const s = revealed();
    expect(advance(s)).toBe(s);
    const rolled = rollDice(s, () => 0);
    expect(rolled.roll?.total).toBe(2);
    expect(advance(rolled)).toBe(rolled);
    expect(
      rollDice(rolled, () => {
        throw Error("must not sample");
      }),
    ).toBe(rolled);
    expect(rollDice(session())).toEqual(session());
  });
  it("keeps last results read-only across cycles and resets them on replay", () => {
    let s = rollDice(advance(session(null)), () => 0);
    s = returnToCard(s);
    const previous = s.roll;
    s = advance(s);
    expect(s.roll).toBeNull();
    expect(s.previousRoll).toBe(previous);
    s = rollDice(advance(s), () => 0.999);
    expect(s.roll?.total).toBe(12);
    expect(s.previousRoll?.total).toBe(2);
    expect(parseSession(JSON.stringify(s))).toEqual(s);
    const replay = replaySession(s);
    expect(replay.roll).toBeNull();
    expect(replay.previousRoll).toBeNull();
  });
  it("holds the final card until its result is returned and dismissed", () => {
    const c = new PresentationController(advance(session(1)), vi.fn());
    c.tap();
    settle(c);
    expect(c.getSnapshot().session!.phase).toBe("revealed");
    c.tap();
    settle(c);
    c.revealRoll();
    settle(c);
    c.tap();
    settle(c);
    expect(c.getSnapshot().session!.phase).toBe("complete");
    expect(
      parseSession(JSON.stringify(c.getSnapshot().session)).roll?.returned,
    ).toBe(true);
  });
  it("migrates legacy saves without touching their snapshots, choices or order", () => {
    const plain = cards.filter((c) => !c.dice);
    const current = advance(
      createSession(
        { version: 1, packIds: ["core"], limit: 40 },
        plain,
        [{ ...packs[0], cardIds: plain.map((c) => c.id) }],
        () => 0.2,
      ),
    );
    const { roll, previousRoll, ...legacy } = current;
    const raw = { ...legacy, version: 1 };
    expect(parseSession(JSON.stringify(raw))).toEqual({
      ...raw,
      version: 2,
      roll: null,
      previousRoll: null,
    });
  });
  it("deeply snapshots dice content", () => {
    const local = structuredClone(fixture);
    const s = session(2, local);
    local.dice!.outcomes![0].instruction = "Changed";
    expect(s.cards[0].dice!.outcomes![0].instruction).not.toBe("Changed");
  });
  it.each([
    { total: 99 },
    { values: [7, 1] },
    { values: [1] },
    { instruction: "Tampered" },
    { returned: "yes" },
  ])("rejects tampered results %j", (patch) => {
    const s = rollDice(revealed(), () => 0);
    expect(() =>
      parseSession(JSON.stringify({ ...s, roll: { ...s.roll, ...patch } })),
    ).toThrow();
  });
  it("rejects hidden results, unresolved prior rolls, and missing v2 fields", () => {
    const s = rollDice(revealed(), () => 0);
    expect(() =>
      parseSession(JSON.stringify({ ...s, phase: "hidden" })),
    ).toThrow();
    const discarded = advance(returnToCard(s));
    expect(() =>
      parseSession(
        JSON.stringify({
          ...discarded,
          previousRoll: { ...discarded.previousRoll, returned: false },
        }),
      ),
    ).toThrow();
    expect(() =>
      parseSession(JSON.stringify({ ...s, roll: undefined })),
    ).toThrow();
  });
  it.each([0, 0.049999, 0.05, 0.499, 0.999999])(
    "maps random sample %s to a legal d20 result",
    (sample) => {
      const s = rollDice(advance(session(1, d20Card)), () => sample);
      expect(s.roll?.values).toEqual([1 + Math.floor(sample * 20)]);
    },
  );
});

describe("choice cards", () => {
  const choiceCard = diceCards.find((c) => c.id === "house.sheet-023")!;
  const controller = (limit: number | null = 2) => {
    const persist = vi.fn(),
      effect = vi.fn(),
      c = new PresentationController(
        session(limit, choiceCard),
        persist,
        effect,
      );
    c.tap();
    settle(c);
    return { c, persist, effect };
  };
  const lastSave = (persist: ReturnType<typeof vi.fn>) =>
    parseSession(JSON.stringify(persist.mock.calls.at(-1)![0]));
  it("marks the supplied do-it-or-roll rows and rejects bad labels", () => {
    expect(diceCards.filter((c) => c.dice!.choice).map((c) => c.id)).toEqual([
      ...[4, 8, 9, 23, 62].map(
        (row) => `house.sheet-0${String(row).padStart(2, "0")}`,
      ),
      // League-only gym leaders: do the feat or roll.
      "pokemon.gym-pryce",
      "pokemon.gym-brawly",
      "cabin.mint-chev",
      "cabin.fourth-meal",
      // Sheet row 42, a CABIIN space, now plays in Cabin weekend.
      "cabin.pet-that-dog",
    ]);
    for (const choice of [
      {},
      { skip: "Do it" },
      { skip: " ", roll: "Refuse" },
      { skip: "Do it", roll: "A label far too long" },
    ])
      expect(() => validateDice({ ...choiceCard.dice, choice })).toThrow();
  });
  it("ignores taps until an option is picked", () => {
    const { c, persist } = controller();
    for (let i = 0; i < 5; i++) c.tap();
    expect(persist).toHaveBeenCalledTimes(1);
    expect(c.getSnapshot().motion).toBeNull();
    expect(awaitingChoice(c.getSnapshot().session!)).toBe(true);
    expect(advance(c.getSnapshot().session!)).toBe(c.getSnapshot().session);
  });
  it("puts the card aside unrolled and restores that save", () => {
    const { c, persist, effect } = controller();
    c.choose("skip");
    c.choose("skip");
    c.choose("roll");
    expect(persist).toHaveBeenCalledTimes(2);
    expect(effect).toHaveBeenLastCalledWith("discard");
    expect(c.getSnapshot().motion).toBe("discard");
    const saved = lastSave(persist);
    expect(saved).toMatchObject({
      phase: "hidden",
      discarded: 1,
      roll: null,
      previousRoll: null,
      previousId: choiceCard.id,
    });
  });
  it("completes a finite game on an unrolled choice card", () => {
    const { c, persist } = controller(1);
    c.choose("skip");
    expect(lastSave(persist)).toMatchObject({
      phase: "complete",
      roll: null,
      previousRoll: null,
    });
  });
  it("rolls exactly as a plain dice card when the roll is picked", () => {
    const { c, persist } = controller();
    c.choose("roll");
    c.choose("skip");
    expect(c.getSnapshot().motion).toBe("roll");
    const rolled = lastSave(persist);
    expect(rolled.roll!.instruction).toBe(`Drink ${rolled.roll!.total}.`);
    expect(skipRoll(rolled)).toBe(rolled);
    settle(c);
    c.revealRoll();
    settle(c);
    c.tap();
    expect(lastSave(persist)).toMatchObject({
      phase: "hidden",
      previousRoll: { returned: true },
    });
  });
  it("still requires a roll on dice cards without a choice", () => {
    const plain = advance(session());
    expect(skipRoll(plain)).toBe(plain);
    const c = new PresentationController(plain, vi.fn());
    c.choose("skip");
    expect(c.getSnapshot().session).toBe(plain);
    expect(() =>
      parseSession(
        JSON.stringify({
          ...plain,
          phase: "hidden",
          position: 0,
          cycle: 1,
          discarded: 1,
          previousId: fixture.id,
        }),
      ),
    ).toThrow("Invalid dice progress");
  });
});
