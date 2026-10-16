import { describe, expect, it } from "vitest";
import {
  advance,
  awaitingVerdict,
  createSession,
  settleBattle,
  currentCard,
  finaleStage,
  questRecord,
  replaySession,
  validConfig,
} from "../src/game/engine";
import { rollDice, returnToCard } from "../src/game/dice";
import { parseSession } from "../src/app/persistence";
import { validateCatalog } from "../src/content/catalog";
import type {
  CardDefinition,
  GameConfig,
  PackDefinition,
  SessionState,
} from "../src/game/types";

// A small quest deck: two quest-only cards advance the meter, two regular
// cards do not, and a two-stage finale (one of two rivals, then the boss)
// sits outside the shuffle. Independent of shipped content.
const plain = (id: string, extra: Partial<CardDefinition> = {}) =>
  ({
    version: 1,
    id: `quest.${id}`,
    title: id,
    rules: "Drink 1.",
    category: "sip",
    artwork: "art/tankard.webp",
    ...extra,
  }) as CardDefinition;
const catalog = [
  plain("gym-a", { quest: "quest" }),
  plain("gym-b", { quest: "quest" }),
  plain("wild"),
  plain("cave"),
  plain("rival-a"),
  plain("rival-b"),
  plain("boss", {
    category: "challenge",
    dice: { version: 1, count: 1, sides: 6, instruction: "Drink {total}." },
  }),
];
const pack: PackDefinition = {
  version: 1,
  id: "quest",
  title: "Quest",
  description: "Test",
  cardIds: ["quest.wild", "quest.cave"],
  quest: {
    mode: "Quest run",
    summary: "Earn 2 badges",
    label: "Badges",
    goal: 2,
    length: 3,
    cardIds: ["quest.gym-a", "quest.gym-b"],
    finale: [
      { label: "Rival", pick: 1, cardIds: ["quest.rival-a", "quest.rival-b"] },
      { label: "Boss", pick: 1, cardIds: ["quest.boss"] },
    ],
  },
};
const rng = () => 0.42;
const questMode: GameConfig = {
  version: 1,
  packIds: ["quest"],
  limit: null,
  quest: "quest",
};
const start = (random = rng) =>
  createSession(questMode, catalog, [pack], random);
// Reveal and put aside the card in play, rolling it first if it has dice.
const draw = (state: SessionState) => {
  let s = advance(state, rng);
  if (currentCard(s).dice) s = returnToCard(rollDice(s, rng));
  return advance(s, rng);
};
const roundTrip = (s: SessionState) =>
  expect(parseSession(JSON.stringify(s))).toEqual(s);
const gymsFirst = () => {
  const s = start();
  s.order = ["quest.gym-a", "quest.gym-b", "quest.wild", "quest.cave"];
  return s;
};
const seeded = (seed: number) => () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

describe("quest mode", () => {
  it("a quest needs its pack selected and no card limit", () => {
    expect(validConfig(questMode)).toBe(true);
    expect(validConfig({ ...questMode, limit: 30 })).toBe(false);
    expect(validConfig({ ...questMode, quest: "core" })).toBe(false);
  });

  it("starts the meter and picks the finale, keeping it out of the deck", () => {
    const s = start();
    expect(s.quest).toMatchObject({
      packId: "quest",
      label: "Badges",
      goal: 2,
      length: 3,
      count: 0,
      due: false,
      step: 0,
    });
    expect(s.quest!.stages.map((stage) => stage.label)).toEqual([
      "Rival",
      "Boss",
    ]);
    expect(s.quest!.finale).toHaveLength(2);
    expect(["quest.rival-a", "quest.rival-b"]).toContain(s.quest!.finale[0]);
    expect(s.quest!.finale[1]).toBe("quest.boss");
    for (const id of ["quest.rival-a", "quest.rival-b", "quest.boss"])
      expect(s.order).not.toContain(id);
    roundTrip(s);
  });

  it("each stage picks at random", () => {
    const rivals = new Set(
      Array.from(
        { length: 20 },
        (_, i) => start(seeded((i + 1) * 99991)).quest!.finale[0],
      ),
    );
    expect(rivals).toEqual(new Set(["quest.rival-a", "quest.rival-b"]));
  });

  it("the same pack in a plain mode plays without a quest or its cards", () => {
    const s = createSession(
      { version: 1, packIds: ["quest"], limit: 30 },
      catalog,
      [pack],
      rng,
    );
    expect("quest" in s).toBe(false);
    expect([...s.order].sort()).toEqual(["quest.cave", "quest.wild"]);
  });

  it("deals the finale stages in order between deck cards, and ends on the last", () => {
    let s = draw(gymsFirst());
    expect(s.quest).toMatchObject({ count: 1, due: false });
    roundTrip(s);
    s = draw(s);
    expect(s.quest).toMatchObject({ count: 2, due: true, step: 0 });
    const rival = s.quest!.finale[0];
    expect(currentCard(s).id).toBe(rival);
    expect(finaleStage(s.quest!)).toEqual({
      label: "Rival",
      stage: 0,
      index: 0,
      size: 1,
    });
    expect(s.position).toBe(2);
    roundTrip(s);
    s = draw(s);
    expect(s.phase).toBe("hidden");
    expect(s.previousId).toBe(rival);
    expect(s.quest!.step).toBe(1);
    expect(currentCard(s).id).toBe("quest.boss");
    expect(s.position).toBe(2);
    roundTrip(s);
    // The boss rolls like any dice card and cannot be skipped unrolled.
    s = advance(s, rng);
    expect(advance(s, rng)).toBe(s);
    s = returnToCard(rollDice(s, rng));
    roundTrip(s);
    s = advance(s, rng);
    expect(s.phase).toBe("complete");
    expect(s.previousId).toBe("quest.boss");
    expect(s.discarded).toBe(4);
    roundTrip(s);
  });

  it("records the run without spoiling the finale picks still to come", () => {
    const at = (s: SessionState) => {
      const r = questRecord(s)!;
      return {
        earned: r.earned.map((c) => c.id),
        stages: r.stages.map((stage) => stage.cards.map((c) => c.id)),
        won: r.won,
      };
    };
    let s = gymsFirst();
    expect(at(s)).toEqual({ earned: [], stages: [[], []], won: false });
    // A revealed gym is not earned until it is put aside.
    s = advance(s, rng);
    expect(at(s).earned).toEqual([]);
    s = draw(draw(gymsFirst()));
    const [rival] = s.quest!.finale;
    expect(at(s)).toEqual({
      earned: ["quest.gym-a", "quest.gym-b"],
      stages: [[], []],
      won: false,
    });
    s = draw(s);
    expect(at(s).stages).toEqual([[rival], []]);
    s = advance(s, rng);
    s = advance(returnToCard(rollDice(s, rng)), rng);
    expect(s.phase).toBe("complete");
    expect(at(s)).toMatchObject({
      stages: [[rival], ["quest.boss"]],
      won: true,
    });
    // A game without a quest has no record.
    const plainGame = createSession(
      { version: 1, packIds: ["quest"], limit: 30 },
      catalog,
      [pack],
      rng,
    );
    expect(questRecord(plainGame)).toBeNull();
  });

  it("a ribbon's tone needs the ribbon and a known finish", () => {
    const ribboned = plain("toned", { ribbon: "Rival", ribbonTone: "violet" });
    expect(() => validateCatalog([...catalog, ribboned], [])).not.toThrow();
    for (const bad of [
      plain("toned", { ribbonTone: "violet" }),
      plain("toned", {
        ribbon: "Rival",
        ribbonTone: "teal" as unknown as "violet",
      }),
    ])
      expect(() => validateCatalog([...catalog, bad], [])).toThrow(
        "Invalid ribbon tone",
      );
    const intro = (value: unknown) =>
      validateCatalog(catalog, [
        {
          ...pack,
          quest: {
            ...pack.quest!,
            finale: [
              { ...pack.quest!.finale[0], intro: value as string },
              pack.quest!.finale[1],
            ],
          },
        },
      ]);
    expect(() => intro("A rival appears")).not.toThrow();
    expect(() => intro(" ")).toThrow("Invalid quest");
    expect(() => intro("x".repeat(29))).toThrow("Invalid quest");
  });

  it("a card outside the quest leaves the meter alone", () => {
    const s = start();
    s.order = ["quest.wild", "quest.gym-a", "quest.gym-b", "quest.cave"];
    expect(draw(s).quest!.count).toBe(0);
  });

  it("spreads the quest's cards through its run", () => {
    for (let seed = 1; seed <= 50; seed++)
      expect(
        start(seeded(seed)).order.slice(0, 2).sort(),
        `seed ${seed}`,
      ).toEqual(["quest.gym-a", "quest.gym-b"]);
  });

  it("replay resets the meter and re-picks the finale", () => {
    const s = replaySession(draw(draw(gymsFirst())), seeded(7));
    expect(s.quest).toMatchObject({ count: 0, due: false, step: 0 });
    expect(s.order.slice(0, 2).sort()).toEqual(["quest.gym-a", "quest.gym-b"]);
    roundTrip(s);
  });

  it("rejects saves whose quest state does not add up", () => {
    const s = draw(draw(gymsFirst()));
    const tamper = (change: (q: SessionState) => void) => {
      const copy = structuredClone(s);
      change(copy);
      return () => parseSession(JSON.stringify(copy));
    };
    expect(tamper((q) => (q.quest!.count = 1))).toThrow();
    expect(tamper((q) => (q.quest!.due = false))).toThrow();
    expect(tamper((q) => (q.quest!.packId = "core"))).toThrow();
    expect(tamper((q) => (q.quest!.length = 2))).toThrow();
    expect(tamper((q) => (q.quest!.step = 2))).toThrow();
    expect(tamper((q) => (q.quest!.finale = ["quest.boss"]))).toThrow();
    expect(
      tamper((q) => (q.quest!.finale = ["quest.boss", "quest.rival-a"])),
    ).toThrow();
    expect(tamper((q) => delete q.quest)).toThrow();
    expect(tamper((q) => delete q.config.quest)).toThrow();
  });

  it("a League save from before the gauntlet loads as a one-card stage", () => {
    const s = draw(draw(gymsFirst()));
    const { stages: _stages, step: _step, finale: _finale, ...rest } = s.quest!;
    const boss = catalog[6];
    const old = { ...s, quest: { ...rest, finale: boss } };
    const loaded = parseSession(JSON.stringify(old));
    expect(loaded.quest).toMatchObject({
      due: true,
      step: 0,
      finale: ["quest.boss"],
      stages: [{ label: "League", pick: 1, cards: [boss] }],
    });
    expect(currentCard(loaded).id).toBe("quest.boss");
  });

  it("catalog validation requires a reachable goal and unshuffled finale stages", () => {
    expect(() => validateCatalog(catalog, [pack])).not.toThrow();
    const rules = pack.quest!;
    for (const change of [
      { goal: 3 },
      { goal: 0 },
      { length: 2 },
      { finale: [] },
      { finale: [{ label: "Boss", pick: 2, cardIds: ["quest.boss"] }] },
      { finale: [{ label: "Boss", pick: 1, cardIds: ["quest.wild"] }] },
      { finale: [{ label: "Boss", pick: 1, cardIds: ["quest.missing"] }] },
      { finale: [{ label: " ", pick: 1, cardIds: ["quest.boss"] }] },
      { cardIds: ["quest.gym-a", "quest.wild"] },
      { cardIds: ["quest.gym-a", "quest.missing"] },
      { label: " " },
      { mode: "" },
    ])
      expect(() =>
        validateCatalog(catalog, [{ ...pack, quest: { ...rules, ...change } }]),
      ).toThrow("Invalid quest");
  });
});

// Hardcore: battles can be lost. Gym A is settled with plaques, gym B wins on
// a 4 or more, and the boss stage holds three champions that win on a 6.
describe("hardcore battles", () => {
  const winsOn = (from: number) => ({
    version: 1 as const,
    count: 1,
    sides: 6 as const,
    outcomes: [
      { min: 1, max: from - 1, instruction: "Drink 3." },
      { min: from, max: 6, instruction: "Give 3.", win: true as const },
    ],
  });
  const champ = (id: string) =>
    plain(id, { category: "challenge", battle: true, dice: winsOn(6) });
  const cards = [
    plain("gym-a", { quest: "hard", battle: true }),
    plain("gym-b", { quest: "hard", battle: true, dice: winsOn(4) }),
    ...["wild", "cave", "lake", "road"].map((id) => plain(id)),
    plain("rival"),
    champ("champ-a"),
    champ("champ-b"),
    champ("champ-c"),
  ];
  const hard: PackDefinition = {
    version: 1,
    id: "hard",
    title: "Hard",
    description: "Test",
    cardIds: ["quest.wild", "quest.cave", "quest.lake", "quest.road"],
    quest: {
      mode: "Hard run",
      summary: "Earn 2 badges",
      label: "Badges",
      goal: 2,
      length: 5,
      cardIds: ["quest.gym-a", "quest.gym-b"],
      finale: [
        { label: "Rival", pick: 1, cardIds: ["quest.rival"] },
        {
          label: "Champion",
          pick: 1,
          cardIds: ["quest.champ-a", "quest.champ-b", "quest.champ-c"],
        },
      ],
    },
  };
  const begin = () => {
    const s = createSession(
      { version: 1, packIds: ["hard"], limit: null, quest: "hard" },
      cards,
      [hard],
      rng,
    );
    s.order = [
      "quest.gym-a",
      "quest.wild",
      "quest.gym-b",
      "quest.cave",
      "quest.lake",
      "quest.road",
    ];
    return s;
  };
  // Roll the card in play to exactly `face`.
  const rollTo = (s: SessionState, face: number) =>
    returnToCard(rollDice(s, () => (face - 0.5) / 6));
  const fight = (s: SessionState, face: number) =>
    advance(rollTo(advance(s, rng), face), rng);

  it("validates battles", () => {
    expect(() => validateCatalog(cards, [hard])).not.toThrow();
    for (const bad of [
      plain("x", {
        battle: true,
        dice: {
          version: 1,
          count: 1,
          sides: 6,
          outcomes: [{ min: 1, max: 6, instruction: "Drink 3." }],
        },
      }),
      plain("x", {
        battle: true,
        dice: { ...winsOn(4), choice: { skip: "Do it", roll: "Roll" } },
      }),
      plain("x", { battle: true, secret: "Shh" }),
    ])
      expect(() => validateCatalog([bad], [])).toThrow("Invalid battle");
    expect(() =>
      validateCatalog([plain("x", { dice: winsOn(4) })], []),
    ).toThrow("not a battle");
  });

  it("a battle without dice waits for Won or Lost; only a win earns the badge", () => {
    let s = advance(begin(), rng);
    expect(awaitingVerdict(s)).toBe(true);
    expect(advance(s, rng)).toBe(s);
    const won = settleBattle(s, true, rng);
    expect(won.quest).toMatchObject({ count: 1 });
    expect(won.position).toBe(1);
    roundTrip(won);
    s = settleBattle(s, false, rng);
    expect(s.quest).toMatchObject({ count: 0, lost: 1 });
    // The next card slides into the leader's place; the leader waits later.
    expect(s.position).toBe(0);
    expect(currentCard(s).id).toBe("quest.wild");
    expect(s.order.indexOf("quest.gym-a")).toBeGreaterThan(0);
    expect([...s.order].sort()).toEqual([...begin().order].sort());
    expect(s.previousId).toBe("quest.gym-a");
    roundTrip(s);
  });

  it("a dice battle is won only on its winning outcomes", () => {
    let s = settleBattle(advance(begin(), rng), true, rng);
    s = draw(s);
    expect(currentCard(s).id).toBe("quest.gym-b");
    const lost = fight(s, 3);
    expect(lost.quest).toMatchObject({ count: 1, lost: 1, due: false });
    roundTrip(lost);
    const won = fight(s, 4);
    expect(won.quest).toMatchObject({ count: 2, due: true });
    roundTrip(won);
  });

  it("a lost Champion is replaced by another until one is beaten", () => {
    let s = settleBattle(advance(begin(), rng), true, rng);
    s = fight(draw(s), 6);
    s = draw(s); // the rival
    expect(finaleStage(s.quest!).label).toBe("Champion");
    const seen = new Set<string>();
    for (let i = 0; i < 6; i++) {
      const champion = currentCard(s).id;
      seen.add(champion);
      s = fight(s, 1);
      expect(s.phase).toBe("hidden");
      expect(s.previousId).toBe(champion);
      expect(currentCard(s).id).not.toBe(champion);
      expect(s.quest!.lost).toBe(i + 1);
      roundTrip(s);
    }
    expect(seen.size).toBeGreaterThan(1);
    const last = currentCard(s).id;
    s = fight(s, 6);
    expect(s.phase).toBe("complete");
    expect(questRecord(s)!.stages[1].cards.map((c) => c.id)).toEqual([last]);
    roundTrip(s);
  });

  it("losses keep the badges on pace", () => {
    for (let seed = 1; seed <= 30; seed++) {
      let s = createSession(
        { version: 1, packIds: ["hard"], limit: null, quest: "hard" },
        cards,
        [hard],
        seeded(seed),
      );
      for (let i = 0; i < 3 && !s.quest!.due; i++) {
        s = advance(s, rng);
        const card = currentCard(s);
        if (card.battle)
          s = card.dice
            ? advance(rollTo(s, 1), rng)
            : settleBattle(s, false, rng);
        else s = advance(s, rng);
        roundTrip(s);
      }
      // Both leaders still lie within the run's pace of the next draw.
      const ahead = s.order.slice(s.position, s.position + 4);
      expect(ahead.filter((id) => id.includes("gym")).length).toBe(
        2 - s.quest!.count,
      );
    }
  });

  it("rejects a bad lost count", () => {
    const s = settleBattle(advance(begin(), rng), false, rng);
    const copy = structuredClone(s);
    copy.quest!.lost = 2;
    expect(() => parseSession(JSON.stringify(copy))).toThrow();
    copy.quest!.lost = -1;
    expect(() => parseSession(JSON.stringify(copy))).toThrow();
  });
});
