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

// Starter evolution on a small crawl of its own: a starter omen with two
// later forms, three evolution events and a boss.
const card = cardFactory("fork");
const starter: CardDefinition = {
  ...card("class", "Squire", "rule", "A squire."),
  encounter: "omen",
  omen: { hearts: 1 },
  fork: true,
  evolves: [
    {
      title: "Knight",
      rules: "Two more hearts.",
      omen: { hearts: 2 },
      tagline: "Tougher",
    },
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
const roundTrip = (s: SessionState) =>
  expect(parseSession(JSON.stringify(s))).toEqual(s);
const atLanding = () =>
  advance(advance(advance(createSession(config, cards, [pack], () => 0.5))));

// A forked adventurer (2026-10-25): the first level picks one of two paths,
// and the second follows it.
describe("forked levels", () => {
  it("validates", () => {
    expect(() => validateCatalog(cards, [pack])).not.toThrow();
    const long = { ...starter.evolves![0], tagline: "x".repeat(29) };
    expect(() =>
      validateCatalog(
        [{ ...starter, evolves: [long, ...starter.evolves!.slice(1)] }],
        [],
      ),
    ).toThrow("Invalid evolves");
    expect(() =>
      validateCatalog([{ ...starter, branches: true }], []),
    ).toThrow();
    expect(() =>
      validateCatalog(
        [{ ...starter, evolves: starter.evolves!.slice(0, 2) }],
        [],
      ),
    ).toThrow("Invalid evolves");
  });
  it("picks a path, then follows it", () => {
    let s = atLanding();
    expect(omenForm(s.quest)).toMatchObject({
      form: 0,
      canEvolve: true,
      branches: ["Knight", "Archer"],
      taglines: ["Tougher", ""],
      next: null,
    });
    // An out-of-range pick is refused.
    expect(takeOffer(s, 0, () => 0.5, 2)).toBe(s);
    s = takeOffer(s, 0, () => 0.5, 1);
    // Effects replace each other: the Archer has no hearts, so one is lost.
    expect(party(s)).toMatchObject({ form: 2, max: 10 });
    roundTrip(s);
    s = advance(s);
    expect(omenForm(s.quest)).toMatchObject({
      form: 2,
      title: "Archer",
      canEvolve: true,
      branches: null,
      next: "Sniper",
      line: ["Squire", "Archer", "Sniper"],
    });
    s = takeOffer(s, 0);
    expect(party(s)).toMatchObject({ form: 4, max: 10 });
    expect(omenEffect(s.quest)!.roll).toEqual({ monster: 3 });
    expect(omenForm(s.quest)).toMatchObject({
      canEvolve: false,
      title: "Sniper",
      before: { roll: { monster: 2 } },
    });
    roundTrip(s);
  });
  it("the other path", () => {
    let s = takeOffer(atLanding(), 0, () => 0.5, 0);
    s = takeOffer(advance(s), 0);
    expect(party(s)).toMatchObject({ form: 3, max: 13 });
    expect(omenForm(s.quest)!.title).toBe("Paladin");
  });
});
