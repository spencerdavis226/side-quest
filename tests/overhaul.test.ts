import { describe, expect, it } from "vitest";
import {
  advance,
  bossBeat,
  canUsePower,
  createSession,
  currentCard,
  omenEffect,
  partyPower,
  powersLeft,
  previousCard,
  settleBattle,
  spoilsOnWin,
  stageRule,
  usePower,
  type Random,
} from "../src/game/engine";
import { returnToCard, rollDice } from "../src/game/dice";
import { parseSession } from "../src/app/persistence";
import { validateCatalog } from "../src/content/validate";
import type {
  CardDefinition,
  DiceDefinition,
  PackDefinition,
  Power,
  SessionState,
} from "../src/game/types";

// The 2026-10-25 overhaul's engine: boss phases, signature powers and stage
// rules, on a small synthetic crawl so the rules are pinned apart from the
// content.
const d20 = (need: number): DiceDefinition => ({
  version: 1,
  count: 1,
  sides: 20,
  outcomes: [
    { min: 1, max: need - 1, instruction: "Lost. Drink 2." },
    { min: need, max: 20, instruction: "Won. Give 2.", win: true },
  ],
});
const base = (id: string, more: Partial<CardDefinition>): CardDefinition => ({
  version: 1,
  id: `test.${id}`,
  title: id,
  rules: `${id} rules.`,
  category: "challenge",
  artwork: "art/cards/test.svg",
  ...more,
});
const power = (p: Partial<Power>): Power => ({
  name: "Power",
  rules: "Does a thing",
  kind: "reroll",
  ...p,
});
const hero = (p: Power, evolvesPower?: Power) =>
  base("hero", {
    encounter: "omen",
    omen: {},
    power: p,
    evolves: [
      { title: "Hero II", rules: "Better.", omen: {}, power: evolvesPower },
    ],
  });
const room = base("room", {
  battle: true,
  dice: d20(11),
  damage: 2,
  encounter: "monster",
});
const duel = base("duel", { battle: true, damage: 1, encounter: "monster" });
const boss = base("boss", {
  battle: true,
  dice: d20(11),
  damage: 2,
  hits: 3,
  encounter: "boss",
  phases: [
    { rules: "Phase two: a duel. Lose: drink 3." },
    { rules: "Phase three: roll d20.", dice: d20(5) },
  ],
  spoils: [
    { name: "Ring", rules: "+1 heart", effect: { hearts: 1 }, slot: "trinket" },
    {
      name: "Axe",
      rules: "+1 boss",
      effect: { roll: { boss: 1 } },
      slot: "weapon",
    },
  ],
});
function crawl(heroCard: CardDefinition, rooms: CardDefinition[]) {
  const catalog = [heroCard, ...rooms];
  const pack: PackDefinition = {
    version: 1,
    id: "test",
    title: "Test",
    description: "Test crawl",
    cardIds: rooms.map((c) => c.id),
    quest: {
      mode: "Test crawl",
      summary: "A test.",
      label: "Hearts",
      goal: 0,
      length: 1,
      cardIds: [],
      party: { hearts: 10 },
      finale: [
        { label: "Hero", pick: 1, cardIds: [heroCard.id] },
        ...rooms.map((c) => ({
          label: `Stage ${c.id}`,
          pick: 1,
          cardIds: [c.id],
          rule: {
            name: "Cold Floor",
            rule: "Everyone drinks with their off hand. Slip: drink 1.",
            effect: { roll: { all: -1 } },
          },
        })),
      ],
    },
  };
  validateCatalog(catalog, [pack]);
  return { catalog, pack };
}
const zero: Random = () => 0;
const always =
  (n: number): Random =>
  () =>
    n;
const party = (s: SessionState) => s.quest!.party!;
/** Deal the hero, put it aside, and reveal the next card. */
function start(heroCard: CardDefinition, rooms: CardDefinition[]) {
  const { catalog, pack } = crawl(heroCard, rooms);
  let s = createSession(
    { version: 1, packIds: ["test"], limit: null, quest: "test" },
    catalog,
    [pack],
    zero,
  );
  s = advance(advance(s, zero), zero); // Reveal the hero, put it aside.
  return advance(s, zero); // Reveal the first room.
}
// d20 faces: random 0 rolls a 1, 0.99 a 20, 0.6 a 13 (12 under the floor rule).
const roll = (s: SessionState, r: number) =>
  returnToCard(rollDice(s, always(r)));
const round = (s: SessionState) =>
  expect(parseSession(JSON.stringify(s))).toEqual(s);

describe("boss phases", () => {
  it("walk the hits through each beat, and the felling swing plays the last", () => {
    let s = start(hero(power({})), [boss]);
    expect(currentCard(s).rules).toBe("boss rules.");
    expect(currentCard(s).dice).toBeDefined();
    s = advance(roll(s, 0.6), zero); // A hit: on to the duel.
    expect(party(s).hits).toBe(1);
    expect(party(s).beat).toBeUndefined(); // Beat 0 is the card itself.
    s = advance(s, zero);
    expect(bossBeat(s.quest, boss)).toBe(1);
    expect(currentCard(s).rules).toMatch(/Phase two/);
    expect(currentCard(s).dice).toBeUndefined();
    round(s);
    s = settleBattle(s, true, zero);
    // Previous Card reads the duel it was.
    expect(previousCard(s)!.rules).toMatch(/Phase two/);
    round(s);
    s = advance(s, zero);
    expect(currentCard(s).rules).toMatch(/Phase three/);
    expect(currentCard(s).dice!.outcomes![1].min).toBe(5);
    round(s);
  });

  it("a lost beat is fought again, and a won plaque beat that fells offers spoils", () => {
    const twoBeat = {
      ...boss,
      hits: 2,
      phases: [{ rules: "Last stand: a duel." }],
    };
    let s = start(hero(power({})), [twoBeat]);
    s = advance(roll(s, 0), zero); // A miss: the same beat again.
    s = advance(s, zero);
    expect(currentCard(s).dice).toBeDefined();
    s = advance(roll(s, 0.6), zero);
    s = advance(s, zero);
    expect(currentCard(s).rules).toMatch(/Last stand/);
    expect(spoilsOnWin(s)).toBe(true);
    s = settleBattle(s, true, zero, 1);
    expect(s.phase).toBe("complete");
    expect(party(s).boons).toContain("test.boss#1");
  });

  it("are rejected on a card without enough hits, or with a bad die", () => {
    expect(() => validateCatalog([{ ...boss, hits: 2 }], [])).toThrow(
      /Invalid phases/,
    );
    const bad = {
      ...boss,
      phases: [
        {
          rules: "x",
          dice: {
            ...d20(5),
            outcomes: [{ min: 1, max: 20, instruction: "x" }],
          },
        },
      ],
    };
    expect(() => validateCatalog([bad], [])).toThrow(/Invalid phases/);
  });
});

describe("signature powers", () => {
  it("reroll a lost roll, once until a boss falls", () => {
    let s = start(hero(power({ kind: "reroll" })), [room, boss]);
    expect(canUsePower(s)).toBe(false); // Nothing lost yet.
    s = roll(s, 0);
    expect(canUsePower(s)).toBe(true);
    s = usePower(s, zero);
    expect(s.roll).toBeNull();
    expect(powersLeft(s.quest)).toBe(0);
    round(s);
    s = roll(s, 0);
    expect(canUsePower(s)).toBe(false);
  });

  it("spare a loss its hearts", () => {
    let s = start(hero(power({ kind: "spare" })), [room]);
    s = roll(s, 0);
    s = usePower(s, zero);
    expect(party(s).armed).toBe(room.id);
    round(s);
    const hearts = party(s).hearts;
    s = advance(s, zero);
    expect(party(s).hearts).toBe(hearts);
    expect(party(s).armed).toBeUndefined();
  });

  it("take the edge: the roll is made twice and the better kept", () => {
    let s = start(hero(power({ kind: "edge" })), [room]);
    s = usePower(s, zero);
    s = rollDice(s, zero);
    expect(s.roll!.edge).toBe("advantage");
    round(returnToCard(s));
  });

  it("double a win: a boss takes two swings", () => {
    let s = start(hero(power({ kind: "double" })), [boss]);
    s = usePower(s, zero);
    s = advance(roll(s, 0.6), zero);
    expect(party(s).hits).toBe(2);
  });

  it("win outright for hearts, and pick the spoils when it fells a boss", () => {
    const oneHit = { ...boss, hits: 1, phases: undefined };
    let s = start(hero(power({ kind: "win", cost: 2 })), [oneHit]);
    const hearts = party(s).hearts;
    s = usePower(s, zero, 0);
    expect(s.phase).toBe("complete");
    expect(party(s).hearts).toBe(hearts - 2 + 1); // The ring's heart.
    expect(party(s).boons).toContain("test.boss#0");
  });

  it("heal, and flee a room fight but never a boss", () => {
    let s = start(hero(power({ kind: "heal", amount: 2 })), [duel]);
    expect(canUsePower(s)).toBe(false); // Full hearts.
    s = settleBattle(s, false, zero);
    expect(s.phase).toBe("complete");
    let f = start(hero(power({ kind: "flee" })), [room]);
    expect(canUsePower(f)).toBe(true);
    f = usePower(f, zero);
    expect(f.phase).toBe("complete");
    const b = start(hero(power({ kind: "flee" })), [boss]);
    expect(canUsePower(b)).toBe(false);
  });

  it("come back when a boss falls, and a form's power replaces the card's", () => {
    const plain = { ...boss, spoils: undefined };
    let s = start(hero(power({ kind: "reroll" })), [plain, room]);
    s = roll(s, 0);
    s = usePower(s, zero);
    s = roll(s, 0.99); // A natural 20: two swings.
    s = advance(s, zero);
    s = roll(advance(s, zero), 0.99);
    s = advance(s, zero); // The boss falls.
    expect(party(s).powers).toBeUndefined();
    const evolved = {
      ...s,
      quest: { ...s.quest!, party: { ...party(s), form: 1 } },
    };
    expect(partyPower(evolved.quest)!.kind).toBe("reroll");
    const h = hero(
      power({ kind: "reroll" }),
      power({ kind: "spare", name: "Ward" }),
    );
    const t = start(h, [room]);
    const t1 = {
      ...t,
      quest: { ...t.quest!, party: { ...party(t), form: 1 } },
    };
    expect(partyPower(t1.quest)!.name).toBe("Ward");
  });

  it("are validated", () => {
    expect(() => validateCatalog([hero(power({ kind: "heal" }))], [])).toThrow(
      /Invalid power/,
    );
    expect(() =>
      validateCatalog([hero(power({ name: "A very long power name" }))], []),
    ).toThrow(/Invalid power/);
  });
});

describe("stage rules", () => {
  it("hold while the run is on their stage, and are kept in the save", () => {
    const s = start(hero(power({})), [room]);
    expect(stageRule(s.quest)?.name).toBe("Cold Floor");
    expect(omenEffect(s.quest)?.roll?.all).toBe(-1);
    round(s);
    const bad = structuredClone(s);
    bad.quest!.stages[1].rule!.effect = { hearts: 2 };
    expect(() => parseSession(JSON.stringify(bad))).toThrow();
  });
});
