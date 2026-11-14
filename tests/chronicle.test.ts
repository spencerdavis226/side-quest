import { afterEach, describe, expect, it, vi } from "vitest";
import {
  advance,
  CLASS_COUNT,
  createSession,
  currentCard,
  DRAGON_KING,
  ECHO_COUNT,
  emptyChronicle,
  FEATS,
  finaleCard,
  hitsNeeded,
  LANDMARK_COUNT,
  NINE,
  RARE_COUNT,
  readChronicle,
  recordRun,
  runNames,
  SECRET_COUNT,
  secretKind,
  UNLOCKS,
  unlocks,
  validConfig,
  type Chronicle,
  type Random,
} from "../src/game/engine";
import { rollBonus } from "../src/game/dice";
import {
  chooseLength,
  chooseQuest,
  CHRONICLE_KEY,
  loadPreferences,
  SETTINGS_KEY,
  loadChronicle,
  parseSession,
  SAVE_KEY,
  saveChronicle,
} from "../src/app/persistence";
import { cards, packs } from "../src/content/catalog";
import { classes, JOKE_CLASSES } from "../src/content/dungeon/classes";
import { dragons, unlockedDragons } from "../src/content/dungeon/dragons";
import { landmarks } from "../src/content/dungeon/landmarks";
import { echoes } from "../src/content/dungeon/echoes";
import { hiddenIds } from "../src/content/dungeon/hidden";
import { DRAGON_HEALTH, PARTY_HEARTS } from "../src/content/dungeon/shared";
import type { GameConfig, SessionState } from "../src/game/types";
import { takeRoads } from "./roads";

// The Chronicle and Heroic mode (The Quest 2.0 Phase 7, 2026-11-14): a
// record across runs under its own key, never part of a session save.
const crawl: GameConfig = {
  version: 1,
  packIds: ["dungeon"],
  limit: null,
  quest: "dungeon",
};
const heroic: GameConfig = { ...crawl, heroic: true };
const seeded = (seed: number): Random => {
  seed = (Math.imul(seed, 2654435761) >>> 0) % 2147483646 || 1;
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
};
const ALL = new Set(UNLOCKS.map((u) => u.key));
/** A run ended: won, or wiped at the dragon. */
const ended = (s: SessionState, won = true): SessionState => {
  const q = s.quest!;
  return {
    ...s,
    phase: "complete",
    quest: {
      ...q,
      step: q.finale.length - 1,
      party: { ...q.party!, ...(won ? {} : { wiped: true, hearts: 0 }) },
    },
  };
};
const dragonOf = (s: SessionState) => runNames(s.quest).id!;
/** A store that keeps what is written. */
function store(initial: Record<string, string> = {}) {
  const items = { ...initial };
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => items[k] ?? null,
    setItem: (k: string, v: string) => {
      items[k] = v;
    },
    removeItem: (k: string) => {
      delete items[k];
    },
  });
  return items;
}
afterEach(() => {
  vi.unstubAllGlobals();
});

describe("the Chronicle", () => {
  it("counts a run once, when it ends, and the things seen at any time", () => {
    const s = createSession(crawl, cards, packs, seeded(1));
    const mid = recordRun(emptyChronicle(), s, "2026-11-14T20:00:00Z");
    expect(mid.played).toBe(0);
    const won = ended(s);
    const once = recordRun(mid, won, "2026-11-14T21:00:00Z");
    expect(once).toMatchObject({ played: 1, won: 1 });
    expect(once.slain[dragonOf(s)]).toBe(1);
    expect(once.ballads).toHaveLength(1);
    expect(once.classesWon).toEqual([s.quest!.party!.omen ?? []].flat());
    // The same run again (a reload on the end screen) changes nothing.
    expect(recordRun(once, won, "2026-11-14T22:00:00Z")).toBe(once);
    // A lost run counts the dragon that won.
    const t = createSession(crawl, cards, packs, seeded(2));
    const lost = recordRun(once, ended(t, false), "2026-11-15T21:00:00Z");
    expect(lost).toMatchObject({ played: 2, won: 1 });
    expect(Object.values(lost.slain).reduce((a, b) => a + b)).toBe(1);
  });

  it("unlocks by dragons slain, and the switch unlocks everything", () => {
    const c = emptyChronicle();
    expect(unlocks(c).size).toBe(0);
    const slay = (ids: string[]): Chronicle => ({
      ...c,
      slain: Object.fromEntries(ids.map((id) => [id, 1])),
    });
    expect([...unlocks(slay(NINE.slice(0, 1)))]).toEqual(["heroic"]);
    expect(unlocks(slay(NINE.slice(0, 3)))).toEqual(
      new Set(["heroic", "dragonslayer", "bartholomew"]),
    );
    expect(unlocks(slay(NINE)).has("dragon-king")).toBe(true);
    expect(unlocks(slay([...NINE, DRAGON_KING]))).toEqual(ALL);
    expect(unlocks({ ...c, unlockedAll: true })).toEqual(ALL);
    // Bartholomew counts toward nothing but himself.
    expect(
      unlocks(slay(["dungeon.dragon-bartholomew"])).has("dragonslayer"),
    ).toBe(false);
  });

  it("names the nine and counts what there is to find", () => {
    expect(new Set(NINE)).toEqual(new Set(dragons.map((d) => d.id)));
    expect(unlockedDragons.map((d) => d.id)).toContain(DRAGON_KING);
    expect(Object.values(landmarks).flat()).toHaveLength(LANDMARK_COUNT);
    expect(Object.keys(echoes)).toHaveLength(ECHO_COUNT);
    expect(new Set(hiddenIds.map(secretKind)).size).toBe(SECRET_COUNT);
    expect(classes.filter((c) => !c.unlock)).toHaveLength(CLASS_COUNT);
    // Every rare a run can deal (the joke classes and the locked dragons
    // are not rare things to collect).
    const rares = new Set(
      packs
        .find((p) => p.id === "dungeon")!
        .quest!.finale.flatMap((slot) =>
          "oneOf" in slot
            ? slot.oneOf.flat()
            : "choose" in slot
              ? slot.choose.routes.flat()
              : [slot],
        )
        .flatMap((st) => st.rare?.cardIds ?? [])
        .filter(
          (id) =>
            !JOKE_CLASSES.includes(id) &&
            !unlockedDragons.some((d) => d.id === id),
        ),
    );
    expect(rares.size).toBe(RARE_COUNT);
    expect(FEATS).toHaveLength(12);
  });

  it("survives a reload, and a malformed one resets alone", () => {
    const items = store({ [SAVE_KEY]: "the session" });
    expect(loadChronicle()).toEqual(emptyChronicle());
    const s = createSession(crawl, cards, packs, seeded(3));
    const c = recordRun(emptyChronicle(), ended(s), "2026-11-14T21:00:00Z");
    expect(saveChronicle(c)).toBe(true);
    expect(loadChronicle()).toEqual(c);
    for (const bad of [
      "{not json",
      JSON.stringify({ ...c, version: 2 }),
      JSON.stringify({ ...c, played: -1 }),
      JSON.stringify({ ...c, slain: { x: "one" } }),
      JSON.stringify({ ...c, ballads: [{ at: 1 }] }),
    ]) {
      items[CHRONICLE_KEY] = bad;
      expect(loadChronicle()).toEqual(emptyChronicle());
      expect(items[CHRONICLE_KEY]).toBeUndefined();
      // The session is never touched.
      expect(items[SAVE_KEY]).toBe("the session");
    }
    expect(readChronicle(null)).toBeNull();
  });

  it("is never part of a session save, and storage that refuses loses only it", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw Error("denied");
      },
      setItem: () => {
        throw Error("denied");
      },
      removeItem: () => {
        throw Error("denied");
      },
    });
    expect(loadChronicle()).toEqual(emptyChronicle());
    expect(saveChronicle(emptyChronicle())).toBe(false);
    const s = createSession(crawl, cards, packs, seeded(4), ALL);
    const text = JSON.stringify(s);
    expect(text).not.toMatch(/chronicle/i);
    expect(parseSession(text)).toEqual(s);
  });
});

describe("unlocks in a run", () => {
  const locked = [
    "dungeon.class-dragonslayer",
    ...unlockedDragons.map((d) => d.id),
  ];
  it("never deals a locked card", () => {
    for (let seed = 1; seed <= 40; seed++) {
      const q = createSession(crawl, cards, packs, seeded(seed)).quest!;
      const pools = q.stages.flatMap((st) => [
        ...st.cards,
        ...(st.rare?.cards ?? []),
      ]);
      for (const id of locked)
        expect(pools.some((c) => c.id === id)).toBe(false);
      expect(q.finale.some((id) => locked.includes(id))).toBe(false);
    }
  });

  it("deals them once unlocked: the Dragonslayer starts with one lore", () => {
    const s = createSession(crawl, cards, packs, seeded(5), ALL);
    const q = s.quest!;
    expect(q.stages[0].cards.some((c) => c.id === locked[0])).toBe(true);
    const lair = q.stages.find((st) => st.label === "The Dragon's Lair")!;
    expect(lair.rare?.cards.map((c) => c.id)).toEqual(locked.slice(1));
    // Dealt as the adventurer and put aside, it brings a lore.
    const finale = [...q.finale];
    finale[0] = locked[0];
    let t: SessionState = { ...s, quest: { ...q, finale } };
    t = advance(advance(t));
    expect(t.quest!.party!.omen).toBe(locked[0]);
    expect(t.quest!.party!.lore).toBe(1);
    expect(parseSession(JSON.stringify(t))).toEqual(t);
  });

  it("the Chronicle's dragons are rare: about 4 runs in 100, 1 in 10 on Heroic", () => {
    const count = (config: GameConfig) => {
      let n = 0;
      for (let seed = 1; seed <= 1000; seed++) {
        const s = createSession(config, cards, packs, seeded(seed), ALL);
        if (locked.slice(1).includes(dragonOf(s))) n++;
      }
      return n;
    };
    const plain = count(crawl);
    expect(plain).toBeGreaterThan(20);
    expect(plain).toBeLessThan(60);
    const hard = count(heroic);
    expect(hard).toBeGreaterThan(70);
    expect(hard).toBeLessThan(130);
  }, 60_000);
});

describe("Heroic mode", () => {
  it("is a quest's alone, and a save must agree with its config", () => {
    expect(validConfig(heroic)).toBe(true);
    expect(
      validConfig({ version: 1, packIds: ["core"], limit: 50, heroic: true }),
    ).toBe(false);
    const s = createSession(heroic, cards, packs, seeded(6));
    expect(s.quest!.heroic).toBe(true);
    expect(s.quest!.party!.hearts).toBe(PARTY_HEARTS - 2);
    expect(parseSession(JSON.stringify(s))).toEqual(s);
    const { heroic: _h, ...plainConfig } = s.config;
    expect(() =>
      parseSession(JSON.stringify({ ...s, config: plainConfig })),
    ).toThrow();
    const plain = createSession(crawl, cards, packs, seeded(6));
    expect(plain.quest!.heroic).toBeUndefined();
    expect(plain.quest!.party!.hearts).toBe(PARTY_HEARTS);
  });

  it("gives the dragon a scale more and makes every region fight a point harder", () => {
    const s = takeRoads(createSession(heroic, cards, packs, seeded(7)));
    const plain = takeRoads(createSession(crawl, cards, packs, seeded(7)));
    const q = s.quest!;
    const dragon = finaleCard(q, dragonOf(s))!;
    expect(hitsNeeded(q, dragon)).toBe(DRAGON_HEALTH + 1);
    expect(hitsNeeded(plain.quest!, dragon)).toBe(DRAGON_HEALTH);
    // The first region's first card, face up.
    const at = (t: SessionState) =>
      advance({
        ...t,
        discarded: 5,
        previousId: t.quest!.finale[4],
        quest: { ...t.quest!, step: 5 },
      });
    const hard = at(s);
    const easy = at(plain);
    expect(
      rollBonus(easy, currentCard(easy)) - rollBonus(hard, currentCard(hard)),
    ).toBe(1);
  });

  it("is remembered in setup for The Quest, and left behind with it", () => {
    const prefs = {
      config: { ...heroic, packIds: ["dungeon"] },
      choice: "quest" as const,
    };
    store({ [SETTINGS_KEY]: JSON.stringify(prefs) });
    expect(loadPreferences().config.heroic).toBe(true);
    expect(chooseLength(prefs, "standard").config.heroic).toBeUndefined();
    expect(chooseQuest(prefs, "pokemon").config.heroic).toBeUndefined();
  });
});
