import { describe, expect, it } from "vitest";
import { cards, packs, validateCatalog } from "../src/content/catalog";
import { secretsCards } from "../src/content/secrets";
import { createSession, advance } from "../src/game/engine";
import { timerSeconds, validateTimer } from "../src/game/timer";
import { parseSession } from "../src/app/persistence";
import type { CardDefinition } from "../src/game/types";

const pack = packs.find((p) => p.id === "secrets")!;

describe("Secrets & fuses pack", () => {
  it("ships 150 cards: 75 secrets, 30 on the clock, 45 fuses", () => {
    expect(pack.cardIds).toHaveLength(150);
    const fuses = secretsCards.filter((c) => c.timer?.kind === "fuse");
    const clocks = secretsCards.filter((c) => c.timer?.kind === "countdown");
    const secretsOnly = secretsCards.filter((c) => c.secret && !c.timer);
    expect(secretsOnly).toHaveLength(75);
    expect(clocks).toHaveLength(30);
    expect(fuses).toHaveLength(45);
    // Every card in the pack is a secret or a timer; none rolls dice.
    expect(secretsCards.every((c) => (c.secret || c.timer) && !c.dice)).toBe(
      true,
    );
  });

  it("names the plaque each card's rules point at", () => {
    for (const c of secretsCards) {
      if (c.timer?.kind === "fuse")
        expect(c.rules, c.id).toMatch(/^Light the fuse/);
      if (c.timer?.kind === "countdown")
        expect(c.rules, c.id).toMatch(/Start the clock/);
      if (c.secret && !/Hold to read/.test(c.rules))
        expect(c.rules, c.id).toMatch(/\bread(s)?\b.*\balone\b/i);
    }
  });

  it("gives every Fact or Cap claim its answer", () => {
    for (const c of secretsCards.filter((c) => c.title === "Fact or Cap"))
      expect(c.secret, c.id).toMatch(/^(FACT|CAP): /);
  });
});

describe("timers", () => {
  const fuse = {
    version: 1,
    kind: "fuse",
    min: 15,
    max: 45,
    end: "Boom.",
  } as const;
  it("burns a fuse for a whole number of seconds within its range", () => {
    expect(timerSeconds(fuse, () => 0)).toBe(15);
    expect(timerSeconds(fuse, () => 0.999999)).toBe(45);
    expect(timerSeconds(fuse, () => 1)).toBe(45);
    for (let i = 0; i < 200; i++) {
      const s = timerSeconds(fuse, Math.random);
      expect(Number.isInteger(s) && s >= 15 && s <= 45).toBe(true);
    }
  });
  it("runs a countdown for exactly its seconds", () => {
    expect(
      timerSeconds(
        { version: 1, kind: "countdown", seconds: 30, end: "Time." },
        () => 0.5,
      ),
    ).toBe(30);
  });
  it("rejects malformed timers", () => {
    for (const bad of [
      { ...fuse, min: 45, max: 15 },
      { ...fuse, min: 1 },
      { ...fuse, max: 600 },
      { ...fuse, end: " " },
      { ...fuse, kind: "egg" },
      { version: 1, kind: "countdown", seconds: 2.5, end: "Time." },
      { version: 1, kind: "countdown", seconds: 1, end: "Time." },
    ])
      expect(() => validateTimer(bad)).toThrow();
  });
  it("keeps one mechanic per card and secrets short", () => {
    const base: CardDefinition = {
      version: 1,
      id: "t.one",
      title: "T",
      rules: "Read this alone.",
      category: "group",
      artwork: "art/tankard.webp",
    };
    const dice = {
      version: 1,
      count: 1,
      sides: 6,
      instruction: "Drink {total}.",
    } as const;
    expect(() =>
      validateCatalog([{ ...base, secret: "x", dice }], []),
    ).toThrow();
    expect(() =>
      validateCatalog([{ ...base, timer: fuse, dice }], []),
    ).toThrow();
    expect(() =>
      validateCatalog([{ ...base, secret: "x".repeat(121) }], []),
    ).toThrow();
    expect(() =>
      validateCatalog([{ ...base, secret: "fine" }], []),
    ).not.toThrow();
  });
});

it("saves and resumes a game with secret and timed cards unchanged", () => {
  let s = createSession(
    { version: 1, packIds: ["secrets"], limit: 30 },
    cards,
    packs,
    () => 0.3,
  );
  s = advance(s, () => 0.3); // reveal
  const back = parseSession(JSON.stringify(s));
  expect(back).toEqual(s);
  expect(back.cards.every((c) => c.secret || c.timer)).toBe(true);
});
