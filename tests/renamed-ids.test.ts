import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  RENAMED_2026_11_15,
  RENAMED_RIVALS,
  renameId,
  renameIds,
} from "../src/app/renamed-ids";
import { parseSession } from "../src/app/persistence";
import { cards } from "../src/content/catalog";
import { RETIRED_SHEET_IDS } from "../src/content/custom";
import { emptyChronicle, readChronicle } from "../src/game/engine";

// The 2026-11-15 rename (owner: "an effective set of IDs for all cards, so
// there's no artifacts of the old game"): saves and the Chronicle are moved
// on as they load.
const live = new Set(cards.map((c) => c.id));
// Retired since (2026-11-25 review): saves keep their snapshot, so an old ID
// may still point at one.
const retired = new Set(RETIRED_SHEET_IDS);
const renamed = Object.entries(RENAMED_2026_11_15);
const dir = "tests/fixtures/saves";
const fixtures = readdirSync(dir).filter((f) => f.endsWith(".json"));
const RECORD = {
  met: 0,
  beaten: 0,
  lostTo: 0,
  joined: 0,
  betrayed: 0,
  slainBy: 0,
};

describe("renamed card IDs", () => {
  it("moves each old ID to a card that exists, and none is still in use", () => {
    expect(renamed.length).toBeGreaterThan(700);
    for (const [from, to] of renamed) {
      expect(live.has(to) || retired.has(to), `${from} -> ${to}`).toBe(true);
      expect(live.has(from), from).toBe(false);
    }
    // One card per new ID.
    const targets = renamed.map(([, to]) => to);
    expect(new Set(targets).size).toBe(targets.length);
  });

  it("never gives a card an old card's ID, so renaming twice changes nothing", () => {
    for (const [, to] of renamed)
      expect(RENAMED_2026_11_15[to]).toBeUndefined();
    for (const to of Object.values(RENAMED_RIVALS))
      expect(RENAMED_RIVALS[to]).toBeUndefined();
  });

  it("no renamed ID or rival key holds a space (renameId skips text)", () => {
    const names = [
      ...Object.keys(RENAMED_2026_11_15),
      ...Object.keys(RENAMED_RIVALS),
    ];
    expect(names.filter((name) => /\s/.test(name))).toEqual([]);
    expect(renameId("Drink 2. dungeon.ice-tray")).toBe(
      "Drink 2. dungeon.ice-tray",
    );
  });

  it("reads boons, deeds and rival keys", () => {
    expect(renameId("dungeon.ice-tray")).toBe("dungeon.spellbook-shelf");
    expect(renameId("dungeon.big-cheese#1")).toBe("dungeon.great-boar#1");
    expect(renameId("dungeon.omen-cargo-shorts#k")).toBe(
      "dungeon.omen-bag-of-holding#k",
    );
    expect(renameId("dungeon.landmark-frog-ferry#o0")).toBe(
      "dungeon.landmark-ferry-of-frogs#o0",
    );
    expect(renameId("house.sheet-004")).toBe("core.house-004");
    expect(renameId("cabin.its-gotta-go")).toBe("core.cabin-send-it");
    expect(renameId("bradley")).toBe("chad");
    expect(renameId("rival-tutt")).toBe("rival-sensei");
    expect(renameId("nemesis-mirabel")).toBe("nemesis-fingerbang");
    expect(renameId("drew-on-bradley")).toBe("drew-on-chad");
    // Anything else passes through.
    for (const kept of ["dungeon.class-rogue", "core.house-special", "shield"])
      expect(renameId(kept)).toBe(kept);
    // A retired ID no card holds is left for the snapshot to carry.
    expect(renameId("dungeon.closing-bradley-begs")).toBe(
      "dungeon.closing-bradley-begs",
    );
  });

  const old = new Set(Object.keys(RENAMED_2026_11_15));
  for (const file of fixtures)
    it(`leaves no old ID in ${file} once it loads`, () => {
      const raw = readFileSync(`${dir}/${file}`, "utf8");
      const once = renameIds(JSON.parse(raw));
      expect(renameIds(once)).toEqual(once);
      const loaded = JSON.stringify(parseSession(raw));
      const left = [...loaded.matchAll(/"([a-z]+\.[a-z0-9-]+)(#[a-z0-9]+)?"/g)]
        .map((m) => m[1])
        .filter((id) => old.has(id));
      expect(left).toEqual([]);
    });

  it("moves a Chronicle's dragons, cards, rivals and feats on", () => {
    const c = readChronicle(
      renameIds({
        ...emptyChronicle(),
        played: 2,
        won: 1,
        slain: { "dungeon.last-call-lich": 1 },
        fellTo: { "dungeon.final-tab": 1 },
        classesWon: ["dungeon.class-bouncer"],
        landmarks: ["dungeon.landmark-frog-ferry"],
        rares: ["dungeon.rare-wisp"],
        feats: ["bradley"],
        rivals: { mirabel: { ...RECORD, met: 2, beaten: 1 } },
        nemesis: "mirabel",
      }),
    )!;
    expect(c).toMatchObject({
      slain: { "dungeon.dragon-emberfang": 1 },
      fellTo: { "dungeon.dragon-mother-brine": 1 },
      classesWon: ["dungeon.class-knight"],
      landmarks: ["dungeon.landmark-ferry-of-frogs"],
      rares: ["dungeon.rare-will-o-wisp"],
      feats: ["chad"],
      rivals: { fingerbang: { ...RECORD, met: 2, beaten: 1 } },
      nemesis: "fingerbang",
    });
  });
});
