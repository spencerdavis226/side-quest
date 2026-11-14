import { describe, expect, it } from "vitest";
import {
  advance,
  createSession,
  currentCard,
  fillNames,
  questStages,
  runNames,
  type Random,
} from "../src/game/engine";
import { cards, packs } from "../src/content/catalog";
import { lairs } from "../src/content/dungeon/dragons";
import type { CardDefinition, DiceDefinition } from "../src/game/types";

// The run's names in text (The Quest 2.0 Phase 3, 2026-11-14): `{dragon}`
// and `{lair}` are filled at display time, so `validate-content.ts` only
// sees the placeholders. Here every dragon and every lair is filled into
// every line that uses one, and the line held to its limit.
const quest = packs.find((p) => p.id === "dungeon")!.quest!;
const DRAGONS = Object.values(lairs)
  .flat()
  .map((c) => c.title);
// The lair regions: the first stage of each route in the last slot.
const lastSlot = quest.finale.at(-1)!;
const LAIRS = ("oneOf" in lastSlot ? lastSlot.oneOf : []).map((route) =>
  route[0].label.replace(/^The /, "the "),
);
const PLACEHOLDER = /\{(dragon|lair)\}/;
const fill = (text: string, dragon: string, lair: string) =>
  text.split("{dragon}").join(dragon).split("{lair}").join(lair);
const words = (text: string) => text.trim().split(/\s+/u).length;

/** Every line of a card that a table reads, with its limit. */
function lines(c: CardDefinition) {
  const out: { where: string; text: string; chars: number; words: number }[] =
    [];
  const rule = (where: string, text: string, chars = 100) =>
    out.push({ where, text, chars, words: 20 });
  const dice = (where: string, d: DiceDefinition | undefined) => {
    if (!d) return;
    if (d.instruction) rule(`${where} dice`, d.instruction);
    for (const [i, o] of (d.outcomes ?? []).entries())
      rule(`${where} outcome ${i}`, o.instruction);
    if (d.doubles) rule(`${where} doubles`, d.doubles);
  };
  rule("rules", c.rules);
  dice("card", c.dice);
  for (const [i, p] of (c.phases ?? []).entries()) {
    rule(`phase ${i}`, p.rules, 110);
    dice(`phase ${i}`, p.dice);
  }
  const fight = c.lairFight;
  if (fight) {
    for (const m of [...fight.calm, ...fight.enraged]) rule(m.name, m.rules);
    rule("enrage", fight.enrage.rules);
  }
  for (const [i, o] of (c.offers ?? []).entries())
    out.push({ where: `offer ${i}`, text: o.label, chars: 18, words: 20 });
  return out;
}

describe("the run's names in text", () => {
  it("knows the longest names it must fit", () => {
    expect(DRAGONS).toHaveLength(9);
    expect(LAIRS.sort()).toEqual([
      "the Fire Caverns",
      "the Frozen Pass",
      "the Sunken Coast",
    ]);
    expect(Math.max(...DRAGONS.map((d) => d.length))).toBe(19);
  });

  it("every line with a name stays inside its limit for every dragon and lair", () => {
    const dungeon = cards.filter((c) => c.id.startsWith("dungeon."));
    let checked = 0;
    for (const c of dungeon)
      for (const line of lines(c)) {
        if (!PLACEHOLDER.test(line.text)) continue;
        checked++;
        for (const dragon of DRAGONS)
          for (const lair of LAIRS) {
            const text = fill(line.text, dragon, lair);
            expect(
              [...text].length,
              `${c.id} ${line.where}: ${text}`,
            ).toBeLessThanOrEqual(line.chars);
            expect(words(text), `${c.id} ${line.where}`).toBeLessThanOrEqual(
              line.words,
            );
          }
      }
    // The summons, the signs, the Approaches and the Last Inns at least.
    expect(checked).toBeGreaterThanOrEqual(6 + 4 + 6 + 8);
  });

  it("every stage intro with a name stays inside 28 characters", () => {
    for (const st of questStages(quest)) {
      if (!st.intro || !PLACEHOLDER.test(st.intro)) continue;
      for (const dragon of DRAGONS)
        for (const lair of LAIRS)
          expect(
            fill(st.intro, dragon, lair).length,
            st.label,
          ).toBeLessThanOrEqual(28);
    }
  });
});

describe("the names a run fills in", () => {
  const seeded = (seed: number): Random => {
    seed = (Math.imul(seed, 2654435761) >>> 0) % 2147483646 || 1;
    return () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
  };
  const crawl = {
    version: 1 as const,
    packIds: ["dungeon"],
    limit: null,
    quest: "dungeon",
  };

  it("the dragon is the run's lair fight and the lair the region before it", () => {
    for (let seed = 1; seed <= 30; seed++) {
      const s = createSession(crawl, cards, packs, seeded(seed));
      const q = s.quest!;
      const dragon = q.stages
        .flatMap((st) => st.cards)
        .find((c) => c.id === q.finale.at(-1))!;
      const region = q.stages.at(-3)!;
      expect(runNames(q)).toEqual({
        id: dragon.id,
        dragon: dragon.title,
        lair: region.label.replace(/^The /, "the "),
      });
      // The dragon lives in that region.
      const home = Object.entries(lairs).find(([, ds]) =>
        ds.some((d) => d.id === dragon.id),
      )![0];
      expect(
        {
          taproom: "The Sunken Coast",
          kitchen: "The Fire Caverns",
          rooftop: "The Frozen Pass",
        }[home],
      ).toBe(region.label);
    }
  });

  it("fills the summons with both names, and leaves other text alone", () => {
    const s = createSession(crawl, cards, packs, seeded(4));
    const q = s.quest!;
    const { dragon, lair } = runNames(q);
    const decree = {
      ...s,
      quest: {
        ...q,
        step: 2,
        finale: q.finale.map((id, i) =>
          i === 2 ? "dungeon.summons-proclamation" : id,
        ),
      },
    };
    expect(currentCard(advance(decree)).rules).toBe(
      `${dragon} has woken under ${lair}. Everyone raises a glass to the king.`,
    );
    expect(fillNames(q, "No names here.")).toBe("No names here.");
    expect(fillNames(q, "{lair} and {dragon}")).toBe(`${lair} and ${dragon}`);
    expect(fillNames(undefined, "{dragon}")).toBe("{dragon}");
  });

  it("an old save with no lair fight names its last card and the last region before it", () => {
    const s = createSession(crawl, cards, packs, seeded(9));
    const q = structuredClone(s.quest!);
    for (const st of q.stages)
      for (const c of st.cards) delete (c as CardDefinition).lairFight;
    const last = q.stages.at(-1)!.cards.find((c) => c.id === q.finale.at(-1))!;
    expect(runNames(q)).toEqual({
      id: last.id,
      dragon: last.title,
      lair: q.stages.at(-3)!.label.replace(/^The /, "the "),
    });
  });
});
