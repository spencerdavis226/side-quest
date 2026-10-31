import { describe, expect, it } from "vitest";
import {
  advance,
  bossBeat,
  createSession,
  currentCard,
  previousCard,
  settleBattle,
  spoilsOnWin,
  type Random,
} from "../src/game/engine";
import { returnToCard, rollDice } from "../src/game/dice";
import { parseSession } from "../src/app/persistence";
import { validateCatalog } from "../src/content/validate";
import type {
  CardDefinition,
  DiceDefinition,
  PackDefinition,
  SessionState,
} from "../src/game/types";

// The 2026-10-25 overhaul's engine that stayed: boss phases, on a small
// synthetic crawl so the rules are pinned apart from the content (signature
// powers and stage rules were cut 2026-10-31).
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
const hero = () =>
  base("hero", {
    encounter: "omen",
    omen: {},
    evolves: [{ title: "Hero II", rules: "Better.", omen: {} }],
  });
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
// d20 faces: random 0 rolls a 1, 0.99 a 20, 0.6 a 13.
const roll = (s: SessionState, r: number) =>
  returnToCard(rollDice(s, always(r)));
const round = (s: SessionState) =>
  expect(parseSession(JSON.stringify(s))).toEqual(s);

describe("boss phases", () => {
  it("walk the hits through each beat, and the felling swing plays the last", () => {
    let s = start(hero(), [boss]);
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
    let s = start(hero(), [twoBeat]);
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
