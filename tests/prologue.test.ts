import { describe, expect, it } from "vitest";
import { advance, createSession, type Random } from "../src/game/engine";
import { cards, packs } from "../src/content/catalog";
import { interlude, prologue, runKey } from "../src/components/prologue";
import { finaleStage, takeOffer } from "../src/game/engine";

// The prologue (2026-11-15): the opening cards shown apart from the table,
// read from the run alone, so it needs no save field.
const seeded = (seed: number): Random => {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
};
const league = () =>
  createSession(
    { version: 1, packIds: ["pokemon"], limit: null, quest: "pokemon" },
    cards,
    packs,
    seeded(5),
  );

describe("the prologue", () => {
  it("holds the League's starter, then the handoff, then lets go", () => {
    const r = seeded(9);
    const start = league();
    expect(prologue(start)).toEqual({
      length: 1,
      at: 0,
      label: "Your starter",
    });
    const shown = advance(start, r);
    expect(prologue(shown)?.at).toBe(0);
    const handoff = advance(shown, r);
    expect(prologue(handoff)).toEqual({ length: 1, at: 1 });
    // The first card turned: the table has it.
    expect(prologue(advance(handoff, r))).toBeNull();
    expect(runKey(handoff)).toBe(runKey(advance(handoff, r)));
  });

  it("is not part of a plain game", () => {
    const plain = createSession(
      { version: 1, packIds: ["core"], limit: 50 },
      cards,
      packs,
      seeded(2),
    );
    expect(prologue(plain)).toBeNull();
    expect(prologue(null)).toBeNull();
  });

  it("holds the Quest's four opening cards, the road taken by a plaque", () => {
    const r = seeded(4);
    let s = createSession(
      { version: 1, packIds: ["dungeon"], limit: null, quest: "dungeon" },
      cards,
      packs,
      seeded(6),
    );
    const labels = [];
    for (let i = 0; i < 3; i++) {
      s = advance(s, r);
      labels.push(prologue(s)?.label);
      s = advance(s, r);
    }
    s = advance(s, r);
    expect(prologue(s)).toEqual({ length: 4, at: 3, label: "The Road Out" });
    s = takeOffer(s, 0, r);
    expect(prologue(s)).toEqual({ length: 4, at: 4 });
    expect(labels).toEqual([
      "Your adventurer",
      "The omen",
      "The King's Summons",
    ]);
    expect(prologue(advance(s, r))).toBeNull();
  });

  it("calls the rival's introduction an interlude once it is turned", () => {
    let s = createSession(
      { version: 1, packIds: ["dungeon"], limit: null, quest: "dungeon" },
      cards,
      packs,
      seeded(7),
    );
    let step = 0;
    for (const stage of s.quest!.stages) {
      if (stage.label === "Your Rival") break;
      step += stage.pick;
    }
    s = { ...s, discarded: step, quest: { ...s.quest!, step } };
    expect(finaleStage(s.quest!).label).toBe("Your Rival");
    expect(interlude(s)).toBe(false);
    expect(interlude({ ...s, phase: "revealed" })).toBe(true);
  });
});
