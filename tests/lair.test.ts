import { describe, expect, it } from "vitest";
import {
  advance,
  createSession,
  currentCard,
  finaleCard,
  previousCard,
  questRecord,
  settleBattle,
  type Random,
} from "../src/game/engine";
import { returnToCard, rollDice, rollTarget } from "../src/game/dice";
import { parseSession } from "../src/app/persistence";
import { cards, packs, validateCatalog } from "../src/content/catalog";
import { DRAGON_HEALTH, ENRAGE_HURT } from "../src/content/dungeon/shared";
import type { GameConfig, SessionState } from "../src/game/types";

// The dragon battle (The Quest 2.0 Phase 2, 2026-11-13): a lair fight is a
// boss whose re-deals are rounds, each with a move sampled when it is
// dealt (`party.duel`).
const crawl: GameConfig = {
  version: 1,
  packIds: ["dungeon"],
  limit: null,
  quest: "dungeon",
};
const seeded = (seed: number): Random => {
  seed = (Math.imul(seed, 2654435761) >>> 0) % 2147483646 || 1;
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
};
const CLOSING = 38;
const LAIR = 39;
const party = (s: SessionState) => s.quest!.party!;
const roundTrip = (s: SessionState) =>
  expect(parseSession(JSON.stringify(s))).toEqual(s);
const rollTo = (s: SessionState, face: number) => {
  const sides = currentCard(s).dice!.sides;
  return returnToCard(rollDice(s, () => (face - 0.5) / sides));
};
const fight = (s: SessionState, face: number, random = seeded(7)) =>
  advance(rollTo(advance(s), face), random);
const dragonOf = (s: SessionState) =>
  finaleCard(s.quest!, s.quest!.finale[LAIR])!;

/** A run at the Lair's Door, the Company felled with one natural 20 so the dragon's first round is dealt the way a game deals it. */
function atDragon(seed = 1, hearts = 30): SessionState {
  let s = createSession(crawl, cards, packs, seeded(seed));
  const q = s.quest!;
  const finale = [...q.finale];
  finale[CLOSING] = "dungeon.closing-last-table";
  s = {
    ...s,
    discarded: CLOSING,
    previousId: finale[CLOSING - 1],
    quest: {
      ...q,
      finale,
      step: CLOSING,
      party: { ...q.party!, hits: 0, max: hearts, hearts },
    },
  };
  // A natural 20 lands both of its hits on its own d20 beat.
  s = fight(s, 20, seeded(seed));
  expect(s.quest!.step).toBe(LAIR);
  return s;
}

describe("the dragon battle", () => {
  it("opens on a move, sampled when the dragon is dealt, and reads it on the card", () => {
    const s = atDragon();
    const dragon = dragonOf(s);
    expect(dragon.lairFight).toBeDefined();
    const duel = party(s).duel!;
    expect(duel).toMatchObject({ swings: 0 });
    expect(duel.contest).toBeUndefined();
    const move = dragon.lairFight!.calm[duel.move];
    const card = currentCard(advance(s));
    expect(card.title).toBe(dragon.title);
    expect(card.ribbon).toBe(move.name);
    expect(card.rules).toBe(move.rules);
    expect(card.dice?.sides).toBe(20);
    roundTrip(s);
  });

  it("deals a new move every round, never the same one twice running", () => {
    for (let seed = 1; seed <= 12; seed++) {
      let s = atDragon(seed);
      let last = party(s).duel!.move;
      for (let round = 0; round < 6; round++) {
        s = fight(s, 2, seeded(seed * 31 + round));
        const duel = party(s).duel!;
        expect(duel.move).not.toBe(last);
        expect(duel.prev).toEqual({ move: last });
        expect(duel.swings).toBe(round + 1);
        last = duel.move;
      }
      roundTrip(s);
    }
  });

  it("a move costs its hearts after the swing, and a Tower Shield takes the first", () => {
    const s = atDragon();
    const calm = dragonOf(s).lairFight!.calm;
    const hurts = calm.findIndex((m) => m.damage === 1);
    s.quest!.party!.duel!.move = hurts;
    const hearts = party(s).hearts;
    // A miss (1) and the move (1).
    expect(party(fight(s, 2)).hearts).toBe(hearts - 2);
    // The shield takes the miss; the move still lands.
    s.quest!.party!.loot = ["shield"];
    const shielded = fight(s, 2);
    expect(party(shielded).hearts).toBe(hearts - 1);
    expect(party(shielded).loot).toEqual([]);
    // A won swing still takes the move's heart.
    expect(
      party(
        fight(
          { ...s, quest: { ...s.quest!, party: { ...party(s), loot: [] } } },
          15,
        ),
      ).hearts,
    ).toBe(hearts - 1);
  });

  it("a harder move raises this swing's target; an easier one lowers it", () => {
    const s = atDragon();
    const calm = dragonOf(s).lairFight!.calm;
    const base = rollTarget(
      { ...s, quest: { ...s.quest!, party: { ...party(s), duel: undefined } } },
      currentCard(s),
    )!.target;
    s.quest!.party!.duel!.move = calm.findIndex((m) => m.harder === 2);
    expect(rollTarget(s, currentCard(s))!.target).toBe(base + 2);
    const enraged = dragonOf(s).lairFight!.enraged;
    s.quest!.party!.duel = {
      move: enraged.findIndex((m) => m.harder === -2),
      swings: 3,
      enraged: true,
    };
    expect(rollTarget(s, currentCard(s))!.target).toBe(base - 2);
  });

  it("at half health the table plays the enrage contest once, then the enraged moves", () => {
    let s = atDragon();
    const fightOf = dragonOf(s).lairFight!;
    s = fight(s, 15);
    expect(party(s).duel!.contest).toBeUndefined();
    s = fight(s, 15);
    expect(party(s)).toMatchObject({
      hits: Math.ceil(DRAGON_HEALTH / 2),
      duel: { contest: true },
    });
    const contest = currentCard(advance(s));
    expect(contest.dice).toBeUndefined();
    expect(contest.rules).toBe(fightOf.enrage.rules);
    expect(contest.ribbon).toBe("Enraged");
    roundTrip(advance(s));
    // A lost contest costs its own hearts and lands no hit.
    const hearts = party(s).hearts;
    const lost = settleBattle(advance(s), false, seeded(3));
    expect(party(lost).hearts).toBe(hearts - ENRAGE_HURT);
    expect(party(lost).hits).toBe(2);
    expect(party(lost).duel).toMatchObject({ enraged: true, prev: "contest" });
    expect(previousCard(lost)!.rules).toBe(fightOf.enrage.rules);
    // A won one breaks a scale, and the contest never comes back.
    s = settleBattle(advance(s), true, seeded(3));
    expect(party(s).hits).toBe(3);
    const duel = party(s).duel!;
    expect(duel.enraged).toBe(true);
    expect(currentCard(advance(s)).rules).toBe(
      fightOf.enraged[duel.move].rules,
    );
    roundTrip(s);
  });

  it("a natural 20 breaks two scales", () => {
    const s = fight(atDragon(), 20);
    expect(party(s).hits).toBe(2);
  });

  it("the swing that breaks the last scale wins, even on the last heart", () => {
    let s = atDragon(1, 12);
    s.quest!.party!.hearts = 1;
    s.quest!.party!.hits = DRAGON_HEALTH - 1;
    const enraged = dragonOf(s).lairFight!.enraged;
    s.quest!.party!.duel = {
      move: enraged.findIndex((m) => m.damage === 2),
      swings: 4,
      enraged: true,
    };
    s = fight(s, 15);
    expect(s.phase).toBe("complete");
    expect(party(s)).toMatchObject({ hearts: 1, wiped: false });
    // The last round stays for Previous Card.
    expect(party(s).duel!.prev).toEqual({
      move: party(s).duel!.move,
      enraged: true,
    });
    expect(questRecord(s)!.won).toBe(true);
    roundTrip(s);
  });

  it("a wipe at the dragon ends the battle", () => {
    let s = atDragon(1, 12);
    s.quest!.party!.hearts = 1;
    s = fight(s, 2);
    expect(s.phase).toBe("complete");
    expect(party(s)).toMatchObject({ hearts: 0, wiped: true });
    expect(previousCard(s)!.rules).toBe(
      currentCard(advance(atDragon(1, 12))).rules,
    );
    roundTrip(s);
  });

  it("a wipe on a lost enrage contest saves and loads", () => {
    let s = atDragon(1, 12);
    s.quest!.party!.hits = 2;
    s.quest!.party!.duel = { move: 0, swings: 2, contest: true };
    s.quest!.party!.hearts = 2;
    s = settleBattle(advance(s), false);
    expect(party(s).wiped).toBe(true);
    expect(previousCard(s)!.dice).toBeUndefined();
    roundTrip(s);
  });

  it("an old save's dragon (phases, no lair fight) still plays to its end", () => {
    let s = atDragon();
    const q = s.quest!;
    const stages = structuredClone(q.stages);
    for (const st of stages)
      for (const c of st.cards)
        if (c.lairFight) {
          delete c.lairFight;
          c.hits = 3;
          c.phases = [
            { rules: "It roars. Out-roar your left neighbor. Lose: drink 4." },
          ];
        }
    const p = { ...q.party! };
    delete p.duel;
    s = { ...s, quest: { ...q, stages, party: p } };
    roundTrip(s);
    // Its own d20 twice, then its last beat, the duel, fells it.
    s = fight(s, 15);
    expect(party(s).duel).toBeUndefined();
    s = fight(s, 15);
    expect(currentCard(advance(s)).rules).toMatch(/Out-roar/);
    s = settleBattle(advance(s), true);
    expect(questRecord(s)!.won).toBe(true);
  });

  it("the plain modes read a dragon as written", () => {
    const s = createSession(
      { version: 1, packIds: ["dungeon"], limit: 400 },
      cards,
      packs,
      seeded(2),
    );
    const dragon = s.cards.find((c) => c.id === "dungeon.last-call-lich")!;
    expect(dragon.rules).toMatch(/Roll d20\.$/);
    let p = s;
    while (currentCard(p).id !== dragon.id)
      p = { ...p, position: p.position + 1 };
    expect(currentCard(p).rules).toBe(dragon.rules);
  });

  it("a saved duel out of place or out of range is rejected", () => {
    const s = atDragon();
    const bad = (change: (t: SessionState) => void) => {
      const t = structuredClone(s);
      change(t);
      return () => parseSession(JSON.stringify(t));
    };
    expect(bad(() => {})).not.toThrow();
    expect(bad((t) => (t.quest!.party!.duel!.move = 6))).toThrow();
    expect(bad((t) => (t.quest!.party!.duel!.swings = -1))).toThrow();
    expect(
      bad((t) => {
        t.quest!.step = CLOSING;
        t.discarded = CLOSING;
      }),
    ).toThrow();
  });

  it("the validator holds a lair fight to its shape", () => {
    const dragon = cards.find((c) => c.id === "dungeon.last-call-lich")!;
    const check = (change: (c: typeof dragon) => void) => () => {
      const c = structuredClone(dragon);
      change(c);
      validateCatalog([c], []);
    };
    expect(check(() => {})).not.toThrow();
    for (const change of [
      (c: typeof dragon) => c.lairFight!.calm.pop(),
      (c: typeof dragon) => (c.lairFight!.enraged[0].name = "x".repeat(19)),
      (c: typeof dragon) => (c.lairFight!.calm[0].rules = "x".repeat(111)),
      (c: typeof dragon) => (c.lairFight!.lore = ["a", "b", " "]),
      (c: typeof dragon) => (c.phases = [{ rules: "A beat." }]),
      (c: typeof dragon) => delete c.dice,
    ])
      expect(check(change)).toThrow("Invalid lair fight");
  });
});
