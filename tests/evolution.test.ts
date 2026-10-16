import { describe, expect, it } from "vitest";
import {
  advance,
  awaitingOffer,
  canTakeOffer,
  createSession,
  currentCard,
  hitsNeeded,
  omenEffect,
  omenForm,
  satchelSize,
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
const card = cardFactory("evo");
const starter: CardDefinition = {
  ...card("starter", "Sproutling", "rule", "Bosses hurt one more."),
  encounter: "omen",
  omen: { hurt: { boss: 1 } },
  evolves: [
    {
      title: "Shrubbery",
      rules: "Bosses hurt one more. Two more hearts.",
      omen: { hearts: 2, hurt: { boss: 1 } },
    },
    {
      title: "Old Oak",
      rules: "Two more hearts, a satchel of two and a loaded die.",
      omen: { hearts: 2, satchel: 2, loot: ["die"] },
    },
  ],
};
const candy = (n: number): CardDefinition => ({
  ...card(`candy-${n}`, "Rare Candy", "challenge", "Your starter glows."),
  encounter: "treasure",
  offers: [
    { label: "Let it evolve", evolve: true },
    { label: "Press B", heal: 1 },
  ],
});
const boss: CardDefinition = {
  ...card("boss", "The Boss", "challenge", "Fight."),
  encounter: "boss",
  battle: true,
  hits: 1,
  damage: 2,
};
const filler = card("filler", "Filler", "sip", "Drink 1.");
const cards = [starter, candy(1), candy(2), candy(3), boss, filler];
const pack: PackDefinition = {
  version: 1,
  id: "evo",
  title: "Evolution",
  description: "A test crawl.",
  cardIds: [filler.id],
  quest: {
    mode: "Evolve",
    summary: "Test",
    label: "Team",
    goal: 0,
    length: 1,
    cardIds: [],
    party: { hearts: 10 },
    finale: [
      { label: "Starter", pick: 1, cardIds: [starter.id] },
      {
        label: "Route",
        pick: 3,
        cardIds: [1, 2, 3].map((n) => candy(n).id),
      },
      { label: "Gym", pick: 1, cardIds: [boss.id] },
    ],
  },
};
const config: GameConfig = {
  version: 1,
  packIds: ["evo"],
  limit: null,
  quest: "evo",
};
const party = (s: SessionState) => s.quest!.party!;
const roundTrip = (s: SessionState) =>
  expect(parseSession(JSON.stringify(s))).toEqual(s);
// Past the starter, revealing the first evolution event.
const atCandy = () => {
  const s = advance(advance(createSession(config, cards, [pack], () => 0.5)));
  return advance(s);
};

describe("starter evolution", () => {
  it("validates as content", () => {
    expect(() => validateCatalog(cards, [pack])).not.toThrow();
    const bad = {
      ...starter,
      evolves: [{ ...starter.evolves![0], title: "" }],
    };
    expect(() => validateCatalog([bad], [])).toThrow("Invalid evolves");
    const orphan = { ...filler, evolves: starter.evolves };
    expect(() => validateCatalog([orphan], [])).toThrow("Invalid evolves");
  });

  it("evolving replaces the starter's effect, form by form", () => {
    let s = atCandy();
    expect(party(s)).toMatchObject({ hearts: 10, max: 10, omen: starter.id });
    expect(omenForm(s.quest)).toMatchObject({
      form: 0,
      title: "Sproutling",
      canEvolve: true,
      line: ["Sproutling", "Shrubbery", "Old Oak"],
    });
    expect(awaitingOffer(s)).toBe(true);
    // First form: two more hearts, bosses still hurt one more.
    s = takeOffer(s, 0);
    expect(party(s)).toMatchObject({ hearts: 12, max: 12, form: 1 });
    expect(omenForm(s.quest)!.title).toBe("Shrubbery");
    expect(omenEffect(s.quest)!.hurt).toEqual({ boss: 1 });
    roundTrip(s);
    // Final form: the same two hearts (no more), a loaded die, a smaller
    // satchel, and bosses hurt as written.
    s = advance(s);
    party(s).loot = ["draught", "shield"];
    s = takeOffer(s, 0);
    expect(party(s)).toMatchObject({
      hearts: 12,
      max: 12,
      form: 2,
      loot: ["draught", "shield"],
    });
    expect(satchelSize(s.quest)).toBe(2);
    expect(omenEffect(s.quest)!.hurt).toBeUndefined();
    expect(hitsNeeded(s.quest, boss)).toBe(1);
    roundTrip(s);
  });

  it("a fully evolved starter can only press B, for a heart", () => {
    let s = atCandy();
    s = advance(takeOffer(s, 0));
    s = advance(takeOffer(s, 0));
    expect(currentCard(s).title).toBe("Rare Candy");
    // The third event: nothing left to evolve into.
    party(s).hearts = 8;
    expect(canTakeOffer(s, 0)).toBe(false);
    expect(takeOffer(s, 0)).toBe(s);
    s = takeOffer(s, 1);
    expect(party(s)).toMatchObject({ hearts: 9, form: 2 });
  });

  it("pressing B keeps the form and heals a heart", () => {
    const s = atCandy();
    party(s).hearts = 7;
    const kept = takeOffer(s, 1);
    expect(party(kept).hearts).toBe(8);
    expect(party(kept).form).toBeUndefined();
    roundTrip(kept);
  });

  it("an evolution never takes the last heart", () => {
    // A form with fewer hearts than the one before still leaves one.
    const frail: CardDefinition = {
      ...starter,
      omen: { hearts: 4 },
      evolves: [{ title: "Frail", rules: "Four fewer hearts.", omen: {} }],
    };
    const s = createSession(
      config,
      cards.map((c) => (c.id === starter.id ? frail : c)),
      [pack],
      () => 0.5,
    );
    let at = advance(advance(advance(advance(s))));
    expect(party(at)).toMatchObject({ hearts: 14, max: 14 });
    party(at).hearts = 2;
    at = takeOffer(at, 0);
    expect(party(at)).toMatchObject({ hearts: 1, max: 10, form: 1 });
  });

  it("rejects saves whose form does not add up", () => {
    const s = takeOffer(atCandy(), 0);
    const forged = (form: unknown) => {
      const copy = structuredClone(s) as SessionState;
      (copy.quest!.party as { form?: unknown }).form = form;
      return () => parseSession(JSON.stringify(copy));
    };
    expect(forged(3)).toThrow();
    expect(forged(0)).toThrow();
    expect(forged(1.5)).toThrow();
    expect(forged(2)).not.toThrow();
    // A save from before forms existed loads as the base form.
    const old = structuredClone(s);
    delete old.quest!.party!.form;
    expect(omenForm(parseSession(JSON.stringify(old)).quest)!.form).toBe(0);
  });

  it("a branching starter evolves once, into the form the table picks", () => {
    const eevee: CardDefinition = {
      ...starter,
      omen: { hearts: -2 },
      evolves: [
        { title: "Wet", rules: "Three more HP.", omen: { hearts: 3 } },
        { title: "Zappy", rules: "An X Attack.", omen: { loot: ["die"] } },
        { title: "Hot", rules: "A Protect.", omen: { loot: ["shield"] } },
      ],
      branches: true,
    };
    expect(() =>
      validateCatalog(
        cards.map((c) => (c.id === starter.id ? eevee : c)),
        [pack],
      ),
    ).not.toThrow();
    const at = () => {
      const s = createSession(
        config,
        cards.map((c) => (c.id === starter.id ? eevee : c)),
        [pack],
        () => 0.5,
      );
      return advance(advance(advance(s)));
    };
    let s = at();
    expect(omenForm(s.quest)).toMatchObject({
      branches: ["Wet", "Zappy", "Hot"],
      line: ["Sproutling", "Wet / Zappy / Hot"],
      canEvolve: true,
    });
    // A branch out of range is refused.
    expect(takeOffer(s, 0, Math.random, 3)).toBe(s);
    s = takeOffer(s, 0, Math.random, 1);
    expect(party(s)).toMatchObject({
      // The base form's two fewer hearts give way to Zappy's effect.
      form: 2,
      hearts: 10,
      max: 10,
      loot: ["die"],
    });
    expect(omenForm(s.quest)).toMatchObject({
      title: "Zappy",
      line: ["Sproutling", "Zappy"],
      canEvolve: false,
      branches: null,
    });
    roundTrip(s);
    // That was its one evolution: only Press B is left.
    s = advance(s);
    expect(canTakeOffer(s, 0)).toBe(false);
    // Branches need forms, and `true`.
    expect(() => validateCatalog([{ ...filler, branches: true }], [])).toThrow(
      "Invalid branches",
    );
  });
});
