import { describe, expect, it } from "vitest";
import { createSession, type Random } from "../src/game/engine";
import type { SessionState } from "../src/game/types";
import { cards, packs } from "../src/content/catalog";
import { trayKind, trayPageFor, trayPages } from "../src/components/trayTabs";
import { spring } from "../src/components/tray/spring";

// The tray (2026-11-16): which pages a run has, what they are called (the
// names of the dialogs they replaced), and the springs its gestures settle
// on. The sheet itself is covered by tests/browser/tray.spec.ts.
const seeded = (seed: number): Random => {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
};
const run = (quest: "pokemon" | "dungeon") =>
  createSession(
    { version: 1, packIds: [quest], limit: null, quest },
    cards,
    packs,
    seeded(7),
  );
const withParty = (
  s: SessionState,
  party: Partial<NonNullable<SessionState["quest"]>["party"]>,
): SessionState => ({
  ...s,
  quest: { ...s.quest!, party: { ...s.quest!.party!, ...party } },
});

describe("the tray's pages", () => {
  it("gives the League its device: team, bag, badges, types, jinx", () => {
    const s = run("pokemon");
    expect(trayKind(s)).toBe("league");
    expect(trayPages(s).map((p) => [p.id, p.title])).toEqual([
      ["party", "The team"],
      ["satchel", "Bag"],
      ["badges", "Badges"],
      ["matchup", "Type matchup"],
      ["jinx", "Jinx"],
    ]);
    expect(trayPages(s).find((p) => p.id === "badges")?.count).toBe("0/8");
  });

  it("gives the Quest its journal, with the rival once introduced", () => {
    const s = run("dungeon");
    expect(trayKind(s)).toBe("quest");
    expect(trayPages(s).map((p) => p.title)).toEqual([
      "The party",
      "Satchel",
      "The map",
      "Dragon lore",
      "Curse",
    ]);
    const met = withParty(s, {
      rival: { who: "chad", took: ["die"], won: 0, lost: 1, cut: "meddle" },
    });
    const rival = trayPages(met).find((p) => p.id === "rival");
    expect(rival).toMatchObject({ title: "Your rival", count: "1" });
    expect(rival?.alert).toBe(true);
  });

  it("counts what is carried and flags a curse", () => {
    const s = withParty(run("dungeon"), {
      loot: ["draught", "shield"],
      lore: 2,
    });
    const pages = trayPages(s);
    expect(pages.find((p) => p.id === "satchel")?.count).toBe("2");
    expect(pages.find((p) => p.id === "lore")?.count).toBe("2/3");
    expect(pages.find((p) => p.id === "jinx")?.alert).toBe(false);
  });

  it("opens a page the run lacks on the party", () => {
    const quest = run("dungeon");
    expect(trayPageFor(quest, "badges")).toBe("party");
    expect(trayPageFor(quest, "rival")).toBe("party");
    expect(trayPageFor(quest, "lore")).toBe("lore");
    expect(trayPageFor(run("pokemon"), "lore")).toBe("party");
  });

  it("has no pages outside a crawl", () => {
    const plain = createSession(
      { version: 1, packIds: ["core"], limit: 50 },
      cards,
      packs,
      seeded(2),
    );
    expect(trayPages(plain)).toEqual([]);
  });
});

describe("the tray's springs", () => {
  it("start at rest, overshoot a little, and end on 1", () => {
    for (const [k, c] of [
      [260, 26],
      [300, 32],
      [120, 40],
    ] as const) {
      const { easing, ms } = spring(k, c);
      const points = easing
        .replace(/^linear\(|\)$/g, "")
        .split(", ")
        .map(Number);
      expect(points[0]).toBe(0);
      expect(points.at(-1)).toBe(1);
      expect(Math.max(...points)).toBeLessThan(1.15);
      expect(points.length).toBeGreaterThanOrEqual(13);
      expect(ms).toBeGreaterThan(100);
      expect(ms).toBeLessThanOrEqual(2000);
    }
  });
});
