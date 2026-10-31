import { describe, expect, it } from "vitest";
import {
  advance,
  createSession,
  omenEffect,
  omenForm,
  takeOffer,
} from "../src/game/engine";
import { parseSession } from "../src/app/persistence";
import { cardFactory } from "../src/content/author";
import { validateCatalog } from "../src/content/validate";
import type {
  CardDefinition,
  GameConfig,
  PackDefinition,
  SessionState,
} from "../src/game/types";

// The levelling fork was cut on 2026-10-31: a class has one line. A save
// from before holds a forked adventurer (`fork`, four levels flat as
// `[A1, B1, A2, B2]`); `retireSystems` keeps the path it is on.
const card = cardFactory("fork");
const starter: CardDefinition = {
  ...card("class", "Squire", "rule", "A squire."),
  encounter: "omen",
  omen: { hearts: 1 },
  evolves: [
    { title: "Knight", rules: "Two more hearts.", omen: { hearts: 2 } },
    {
      title: "Archer",
      rules: "Roll 2 more on monsters.",
      omen: { roll: { monster: 2 } },
    },
    { title: "Paladin", rules: "Three more hearts.", omen: { hearts: 3 } },
    {
      title: "Sniper",
      rules: "Roll 3 more on monsters.",
      omen: { roll: { monster: 3 } },
    },
  ],
};
const landing = (n: number): CardDefinition => ({
  ...card(`landing-${n}`, "Landing", "group", "Rest."),
  encounter: "rest",
  offers: [
    { label: "Level up", evolve: true },
    { label: "Rest", heal: 1 },
  ],
});
const filler = card("filler", "Filler", "sip", "Drink 1.");
const boss: CardDefinition = {
  ...card("boss", "The Boss", "challenge", "Fight."),
  encounter: "boss",
  battle: true,
  hits: 1,
  damage: 2,
};
const cards = [starter, landing(1), landing(2), landing(3), boss, filler];
const pack: PackDefinition = {
  version: 1,
  id: "fork",
  title: "Fork",
  description: "A test crawl.",
  cardIds: [filler.id],
  quest: {
    mode: "Fork",
    summary: "Test",
    label: "Team",
    goal: 0,
    length: 1,
    cardIds: [],
    party: { hearts: 10 },
    finale: [
      { label: "Class", pick: 1, cardIds: [starter.id] },
      {
        label: "Landings",
        pick: 3,
        cardIds: [1, 2, 3].map((n) => landing(n).id),
      },
      { label: "Boss", pick: 1, cardIds: [boss.id] },
    ],
  },
};
const config: GameConfig = {
  version: 1,
  packIds: ["fork"],
  limit: null,
  quest: "fork",
};
const party = (s: SessionState) => s.quest!.party!;
const atLanding = () =>
  advance(advance(advance(createSession(config, cards, [pack], () => 0.5))));
/** A save as an old build wrote it: the adventurer forked, on `form`. */
const oldSave = (s: SessionState, form: number) => {
  const old = structuredClone(s) as SessionState & Record<string, never>;
  const at = old.quest!.stages[0].cards[0] as unknown as Record<
    string,
    unknown
  >;
  at.fork = true;
  if (form) old.quest!.party!.form = form;
  return JSON.stringify(old);
};

describe("a forked adventurer from an old save", () => {
  it("a class has one line now: four levels no longer validate", () => {
    expect(() => validateCatalog(cards, [pack])).toThrow("Invalid evolves");
    const line = { ...starter, evolves: starter.evolves!.slice(0, 2) };
    expect(() => validateCatalog([line], [])).not.toThrow();
  });
  it("keeps the path it is on", () => {
    const s = atLanding();
    // Path B's first level (form 2) becomes form 1 of the line B1, B2.
    const b = parseSession(oldSave(s, 2));
    const card = b.quest!.stages[0].cards[0];
    expect(card.evolves!.map((e) => e.title)).toEqual(["Archer", "Sniper"]);
    expect(party(b).form).toBe(1);
    expect(omenForm(b.quest)).toMatchObject({
      title: "Archer",
      next: "Sniper",
      canEvolve: true,
      branches: null,
    });
    expect(omenEffect(b.quest)!.roll).toEqual({ monster: 2 });
    // Path A's second level (form 3): fully levelled.
    const a = parseSession(oldSave(s, 3));
    expect(party(a).form).toBe(2);
    expect(omenForm(a.quest)).toMatchObject({
      title: "Paladin",
      canEvolve: false,
    });
  });
  it("one not yet levelled keeps its first path and levels down it", () => {
    let s = parseSession(oldSave(atLanding(), 0));
    expect(s.quest!.stages[0].cards[0].evolves!.map((e) => e.title)).toEqual([
      "Knight",
      "Paladin",
    ]);
    s = takeOffer(s, 0);
    expect(party(s)).toMatchObject({ form: 1, max: 12 });
    expect(parseSession(JSON.stringify(s))).toEqual(s);
  });
});
