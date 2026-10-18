import { describe, it, expect, vi, afterEach } from "vitest";
import { PresentationController } from "../src/presentation/controller";
import { createSession } from "../src/game/engine";
import { cards, packs } from "../src/content/catalog";
import {
  defaults,
  chooseLength,
  chooseQuest,
  loadPreferences,
  parseSession,
} from "../src/app/persistence";
const core = packs[0];
const plain = cards.filter((c) => !c.dice && core.cardIds.includes(c.id));
const initial = (limit = 3) =>
  createSession(
    { version: 1, packIds: ["core"], limit },
    plain,
    [{ ...core, cardIds: plain.map((c) => c.id) }],
    () => 0.5,
  );
const settle = (c: PresentationController) => {
  while (c.getSnapshot().motion) c.finish(c.getSnapshot().transition);
};
afterEach(() => vi.unstubAllGlobals());
describe("presentation transactions", () => {
  it("commits each action once and holds the outgoing visual until discard ends", () => {
    const persist = vi.fn(),
      c = new PresentationController(initial(), persist);
    c.tap();
    c.tap();
    expect(persist).toHaveBeenCalledTimes(1);
    settle(c);
    const revealed = c.getSnapshot().session;
    c.tap();
    for (let i = 0; i < 20; i++) c.tap();
    expect(persist).toHaveBeenCalledTimes(2);
    expect(c.getSnapshot().outgoing).toBe(revealed);
    expect(c.getSnapshot().session?.discarded).toBe(1);
    expect(c.getSnapshot().session?.phase).toBe("hidden");
    settle(c);
    expect(c.getSnapshot().outgoing).toBeNull();
    expect(persist).toHaveBeenCalledTimes(2);
  });
  it("restores committed discard without replaying animation or effects", () => {
    const persist = vi.fn(),
      effect = vi.fn(),
      c = new PresentationController(initial(), persist, effect);
    c.tap();
    settle(c);
    c.tap();
    const saved = parseSession(JSON.stringify(persist.mock.calls.at(-1)![0]));
    const restored = new PresentationController(saved, persist, effect);
    expect(restored.getSnapshot().motion).toBeNull();
    expect(restored.getSnapshot().session?.discarded).toBe(1);
    expect(restored.getSnapshot().session?.phase).toBe("hidden");
  });
  it("ignores stale completions and cancellation never advances a deck", () => {
    const persist = vi.fn(),
      c = new PresentationController(initial(), persist);
    c.tap();
    const id = c.getSnapshot().transition;
    c.finish(id);
    const settling = c.getSnapshot();
    c.finish(id);
    expect(c.getSnapshot()).toBe(settling);
    c.settleAll();
    expect(persist).toHaveBeenCalledTimes(1);
    expect(c.getSnapshot().motion).toBeNull();
  });
  it("keeps final card visible during discard, then celebrates once", () => {
    const persist = vi.fn(),
      effect = vi.fn(),
      c = new PresentationController(initial(1), persist, effect);
    c.tap();
    settle(c);
    c.tap();
    expect(c.getSnapshot().session?.phase).toBe("complete");
    expect(c.getSnapshot().outgoing?.phase).toBe("revealed");
    c.finish(c.getSnapshot().transition);
    expect(c.getSnapshot().motion).toBe("complete");
    settle(c);
    expect(effect.mock.calls.filter(([e]) => e === "complete")).toHaveLength(1);
    c.tap();
    expect(persist).toHaveBeenCalledTimes(2);
  });
  it("guards deal and clearing during animation", () => {
    const persist = vi.fn(),
      c = new PresentationController(null, persist);
    c.start(initial());
    c.start(initial());
    c.clear();
    c.tap();
    expect(persist).toHaveBeenCalledTimes(1);
    c.settleAll();
    c.clear();
    expect(c.getSnapshot().session).toBeNull();
  });
});
describe("preferences compatibility", () => {
  it("maps legacy finite choices to Standard and keeps selected packs selectable", () => {
    const old = {
      config: { version: 1, packIds: ["vip"], limit: 37 },
      sound: true,
      ambience: true,
      atmosphere: false,
      choice: "custom",
      customSize: "37",
    };
    vi.stubGlobal("localStorage", { getItem: () => JSON.stringify(old) });
    expect(loadPreferences()).toEqual({
      config: { version: 1, packIds: ["vip"], limit: 50 },
      choice: "standard",
    });
    for (const choice of ["short", "long", "20", "60"]) {
      vi.stubGlobal("localStorage", {
        getItem: () => JSON.stringify({ ...old, choice }),
      });
      expect(loadPreferences()).toMatchObject({
        choice: "standard",
        config: { limit: 50 },
      });
    }
  });
  it("maps Endless to Infinite while leaving active saves outside preferences", () => {
    vi.stubGlobal("localStorage", {
      getItem: () =>
        JSON.stringify({ config: defaults.config, choice: "endless" }),
    });
    expect(loadPreferences()).toEqual({
      choice: "infinite",
      config: { version: 1, packIds: ["core"], limit: null },
    });
  });
  it("falls back to defaults for unusable preferences", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => JSON.stringify({ sound: true, atmosphere: false }),
    });
    expect(loadPreferences()).toEqual(defaults);
  });
});
describe("quest modes and the pack selection", () => {
  const core = defaults;
  it("switches a quest's pack off again when the player leaves the mode", () => {
    const crawl = chooseQuest(core, "dungeon");
    expect(crawl).toMatchObject({ choice: "quest", added: "dungeon" });
    expect(crawl.config.packIds).toEqual(["core", "dungeon"]);
    for (const choice of ["standard", "infinite"] as const) {
      const back = chooseLength(crawl, choice);
      expect(back.config.packIds).toEqual(["core"]);
      expect(back.config.quest).toBeUndefined();
      expect(back.added).toBeUndefined();
    }
  });
  it("keeps a quest's pack the player had already chosen", () => {
    const both = {
      ...core,
      config: { ...core.config, packIds: ["core", "pokemon"] },
    };
    const league = chooseQuest(both, "pokemon");
    expect(league.added).toBeUndefined();
    expect(chooseLength(league, "standard").config.packIds).toEqual([
      "core",
      "pokemon",
    ]);
  });
  it("moves from one quest to another without keeping the first's pack", () => {
    const league = chooseQuest(chooseQuest(core, "dungeon"), "pokemon");
    expect(league.config.packIds).toEqual(["core", "pokemon"]);
    expect(league.added).toBe("pokemon");
    expect(chooseLength(league, "standard").config.packIds).toEqual(["core"]);
  });
  it("never leaves the selection empty", () => {
    const none = { ...core, config: { ...core.config, packIds: [] } };
    const back = chooseLength(chooseQuest(none, "dungeon"), "standard");
    expect(back.config.packIds).toEqual(["dungeon"]);
  });
  it("remembers the switched-on pack across a reload", () => {
    const crawl = chooseQuest(core, "dungeon");
    vi.stubGlobal("localStorage", { getItem: () => JSON.stringify(crawl) });
    expect(loadPreferences()).toEqual(crawl);
    // Settings saved before `added` existed load without it.
    const { added: _added, ...old } = crawl;
    vi.stubGlobal("localStorage", { getItem: () => JSON.stringify(old) });
    expect(loadPreferences()).toEqual(old);
  });
});
