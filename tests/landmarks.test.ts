import { describe, expect, it } from "vitest";
import {
  advance,
  createSession,
  currentCard,
  finaleCard,
  finaleStage,
  omenEffect,
  partyBoons,
  pickFinale,
  takeOffer,
  type Random,
} from "../src/game/engine";
import { parseSession } from "../src/app/persistence";
import { cards, packs } from "../src/content/catalog";
import { validateCatalog } from "../src/content/validate";
import { landmarks } from "../src/content/dungeon/landmarks";
import { signCards } from "../src/content/dungeon/signs";
import type { GameConfig, SessionState } from "../src/game/types";

// Landmarks and plaques that do more (The Quest 2.0 Phase 3, 2026-11-14):
// every region's fifth card is one of its landmarks (`inserts`), and a
// plaque may give gear (`Offer.boon`) or lay the card's curse
// (`Offer.jinx`).
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
const roundTrip = (s: SessionState) =>
  expect(parseSession(JSON.stringify(s))).toEqual(s);
const LANDMARKS = new Set(
  Object.values(landmarks)
    .flat()
    .map((c) => c.id),
);
const regions = (s: SessionState) => {
  let first = 0;
  return s.quest!.stages.flatMap((st) => {
    const at = first;
    first += st.pick;
    return st.inserts ? [{ st, at }] : [];
  });
};
/** A run moved to `step`, with `id` dealt there (swapped with its own
 * place when it is already in the run). */
const at = (s: SessionState, step: number, id?: string): SessionState => {
  const finale = [...s.quest!.finale];
  if (id) {
    const was = finale.indexOf(id);
    if (was >= 0) finale[was] = finale[step];
    finale[step] = id;
  }
  return {
    ...s,
    discarded: step,
    previousId: step ? finale[step - 1] : null,
    phase: "revealed",
    quest: { ...s.quest!, finale, step },
  };
};

/** A run whose route holds landmark `id`, and the step it is dealt at. */
const holding = (id: string) => {
  for (let seed = 1; ; seed++) {
    const s = createSession(crawl, cards, packs, seeded(seed));
    const r = regions(s).find(({ st }) =>
      st.inserts!.some((i) => i.cards.some((c) => c.id === id)),
    );
    if (r) return at(s, r.at + 4, id);
  }
};

describe("landmarks", () => {
  it("every region deals one of its landmarks fifth, and a fork never sits before it or last", () => {
    for (let seed = 1; seed <= 200; seed++) {
      // Every region the run holds, both roads offered included (Phase 5).
      const s = createSession(crawl, cards, packs, seeded(seed));
      const rs = regions(s);
      expect(rs).toHaveLength(5);
      for (const { st, at: first } of rs) {
        const picks = s.quest!.finale.slice(first, first + 8);
        expect(LANDMARKS.has(picks[4]), st.label).toBe(true);
        expect(picks.filter((id) => LANDMARKS.has(id))).toHaveLength(1);
        const fork = (i: number) =>
          finaleCard(s.quest!, picks[i])?.encounter === "fork";
        expect(fork(3) || fork(7), `${seed} ${st.label}`).toBe(false);
      }
      roundTrip(s);
    }
  }, 30_000);

  it("each region's landmarks are its own, and the lairs' are Approaches naming the dragon", () => {
    for (const [key, marks] of Object.entries(landmarks)) {
      expect(marks, key).toHaveLength(3);
      for (const c of marks) {
        expect(c.offers!.length).toBeGreaterThanOrEqual(2);
        expect(c.dice).toBeUndefined();
      }
    }
    for (const key of ["taproom", "kitchen", "rooftop"])
      for (const c of landmarks[key]) {
        expect(c.ribbon).toMatch(/ · Approach$/);
      }
    expect(
      Object.values(landmarks)
        .flat()
        .filter((c) => c.rules.includes("{dragon}")).length,
    ).toBeGreaterThanOrEqual(6);
  });

  it("a stage without inserts picks exactly as before", () => {
    const s = createSession(crawl, cards, packs, seeded(3));
    const plain = s.quest!.stages.map((st) => {
      const copy = { ...st };
      delete copy.inserts;
      return copy;
    });
    const a = pickFinale(plain.slice(0, 4), seeded(11));
    const b = pickFinale(s.quest!.stages.slice(0, 4), seeded(11));
    expect(a).toEqual(b);
  });

  it("a landmark's loud door turns the region's next card into an elite", () => {
    let t = holding("dungeon.landmark-tourney-field");
    const { at: first, st } = regions(t)[0];
    const next = t.quest!.finale[first + 5];
    t = takeOffer(t, 0, seeded(2));
    expect(t.quest!.finale[first + 5]).not.toBe(next);
    expect(st.elite!.some((c) => c.id === t.quest!.finale[first + 5])).toBe(
      true,
    );
    roundTrip(t);
  });

  it("a saved landmark out of its place is rejected", () => {
    const s = createSession(crawl, cards, packs, seeded(6));
    const { at: first } = regions(s)[0];
    const moved = structuredClone(s);
    const f = moved.quest!.finale;
    [f[first + 2], f[first + 4]] = [f[first + 4], f[first + 2]];
    expect(() => parseSession(JSON.stringify(moved))).toThrow();
    const bad = structuredClone(s);
    bad.quest!.stages.find((st) => st.inserts)!.inserts![0].at = 9;
    expect(() => parseSession(JSON.stringify(bad))).toThrow();
    // A plain game never holds inserts.
    expect(() => parseSession(JSON.stringify(s))).not.toThrow();
  });

  it("the validator holds inserts to their stage", () => {
    const dungeon = packs.find((p) => p.id === "dungeon")!;
    const check = (change: (p: typeof dungeon) => void) => () => {
      const p = structuredClone(dungeon);
      change(p);
      validateCatalog(cards, [p]);
    };
    expect(check(() => {})).not.toThrow();
    const region = (p: typeof dungeon) => {
      const slot = p.quest!.finale[4];
      return (
        "oneOf" in slot
          ? slot.oneOf[0][0]
          : "choose" in slot
            ? slot.choose.routes[0][0]
            : slot
      ).inserts!;
    };
    expect(check((p) => (region(p)[0].at = 8))).toThrow("Invalid quest");
    expect(check((p) => (region(p)[0].cardIds = []))).toThrow("Invalid quest");
    // A landmark in two regions of one run is dealt twice.
    expect(
      check((p) => {
        const slot = p.quest!.finale.at(-1)!;
        if ("oneOf" in slot)
          slot.oneOf[0][0].inserts![0].cardIds.push(
            "dungeon.landmark-gallows-tree",
          );
      }),
    ).toThrow("Invalid quest");
  });
});

describe("plaques that give gear or a curse", () => {
  it("the Last Forge's reforge is worn as a weapon, kept under its plaque", () => {
    let t = holding("dungeon.landmark-last-forge");
    expect(currentCard(t).offers![0].boon?.name).toBe("Dragonbane");
    const hearts = t.quest!.party!.hearts;
    t = takeOffer(t, 0);
    expect(t.quest!.party).toMatchObject({
      hearts: hearts - 2,
      boons: ["dungeon.landmark-last-forge#o0"],
    });
    expect(partyBoons(t.quest)[0].boon.slot).toBe("weapon");
    expect(omenEffect(t.quest)?.roll?.boss).toBe(2);
    roundTrip(t);
    // A forged key is rejected.
    const forged = structuredClone(t);
    forged.quest!.party!.boons = ["dungeon.landmark-last-forge#o1"];
    expect(() => parseSession(JSON.stringify(forged))).toThrow();
  });

  it("a curse on a plaque lands only from that plaque", () => {
    const ferry = holding("dungeon.landmark-dead-ferryman");
    expect(finaleStage(ferry.quest!).index).toBe(4);
    const stiffed = takeOffer(ferry, 2);
    expect(stiffed.quest!.party).toMatchObject({
      jinx: "dungeon.landmark-dead-ferryman",
    });
    expect(stiffed.quest!.party!.loot).toContain("smoke");
    roundTrip(stiffed);
    const walked = takeOffer(ferry, 1);
    expect(walked.quest!.party!.jinx).toBeUndefined();
    const paid = takeOffer(ferry, 0);
    expect(paid.quest!.party!.jinx).toBeUndefined();
  });

  it("the dragon signs offer lore or a find, and name the dragon", () => {
    expect(signCards).toHaveLength(6);
    for (const c of signCards) {
      expect(c.offers).toHaveLength(2);
      expect(c.ribbon).toBe("Dragon Sign");
    }
    const s = createSession(crawl, cards, packs, seeded(10));
    const sign = s.quest!.stages.findIndex(
      (st) => st.label === "A Dragon Sign",
    );
    const step = s
      .quest!.stages.slice(0, sign)
      .reduce((n, st) => n + st.pick, 0);
    const t = advance(at(s, step, "dungeon.sign-shadow") as SessionState);
    expect(currentCard(t).rules).not.toContain("{dragon}");
    expect(currentCard(t).rules).toContain(
      finaleCard(t.quest!, t.quest!.finale.at(-1)!)!.title,
    );
  });
});
