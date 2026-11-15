import { describe, expect, it } from "vitest";
import { advance, createSession, type Random } from "../src/game/engine";
import { cards, packs } from "../src/content/catalog";
import type { SessionState } from "../src/game/types";
import {
  choiceRows,
  choosesInSheet,
  plainOffers,
} from "../src/components/ChoiceSheet";
import { crawlTheme } from "../src/components/crawlTheme";

// The choice sheet (2026-11-15, owner: the plaques were "SO close to
// clipping ... most people wouldn't even know what these buttons do").
const seeded = (seed: number): Random => {
  seed = (Math.imul(seed, 2654435761) >>> 0) % 2147483646 || 1;
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
};
const card = (id: string) => cards.find((c) => c.id === id)!;
/** A Quest with `id` face up at the first step of a stage that holds it. */
function at(id: string, hearts?: number): SessionState {
  for (let seed = 1; seed < 40; seed++) {
    const s = createSession(
      { version: 1, packIds: ["dungeon"], limit: null, quest: "dungeon" },
      cards,
      packs,
      seeded(seed),
    );
    let step = 0;
    for (const stage of s.quest!.stages) {
      if (stage.cards.some((c) => c.id === id)) {
        const finale = [...s.quest!.finale];
        finale[step] = id;
        return advance({
          ...s,
          discarded: step,
          quest: {
            ...s.quest!,
            finale,
            step,
            party: { ...s.quest!.party!, ...(hearts ? { hearts } : {}) },
          },
        });
      }
      step += stage.pick;
    }
  }
  throw Error(`no stage holds ${id}`);
}
const theme = crawlTheme("dungeon");

describe("the choice sheet", () => {
  it("is used when a plaque costs, brings or changes something", () => {
    expect(choosesInSheet(card("dungeon.sign-tracks"))).toBe(true);
    expect(choosesInSheet(card("dungeon.rat-fence"))).toBe(true);
    expect(plainOffers([{ label: "Left" }, { label: "Right" }])).toBe(true);
    expect(plainOffers([{ label: "Search · drink 2" }, { label: "Go" }])).toBe(
      false,
    );
  });

  it("says what each way costs and brings, and why one can't be taken", () => {
    const rows = choiceRows(at("dungeon.rat-fence", 1), theme);
    expect(rows).toHaveLength(3);
    // Every way has words for what it brings.
    for (const row of rows) expect(row.gets.length).toBeGreaterThan(5);
    const haggle = rows[0];
    expect(haggle).toMatchObject({ name: "Haggle", drinks: "drink 3" });
    expect(haggle.gets).toMatch(/^A Healing Potion\./);
    // A heart price with one heart left: greyed, with the reason.
    const blood = rows[1];
    expect(blood.hearts).toBe(1);
    expect(blood.can).toBe(false);
    expect(blood.why).toMatch(/or more/);
  });

  it("puts a dragon sign's price in hearts beside its name", () => {
    const [follow, around] = choiceRows(at("dungeon.sign-tracks"), theme);
    expect(follow).toMatchObject({ name: "Follow them", hearts: 1 });
    expect(follow.gets).toMatch(/dragon lore/);
    expect(around.gets).toMatch(/nothing gained, nothing lost/);
  });
});
