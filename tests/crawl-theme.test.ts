import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  crawlIconPath,
  crawlTheme,
  heartCount,
  type CrawlIconName,
} from "../src/components/crawlTheme";
import { cards, packs } from "../src/content/catalog";
import { questStages } from "../src/game/engine";
import {
  LANDING_HEAL,
  LEVEL_DRINK,
  PARTY_HEARTS,
} from "../src/content/dungeon/shared";

const marks: CrawlIconName[] = [
  "draught",
  "shield",
  "die",
  "smoke",
  "revive",
  "candy",
  "heart",
  "boss",
  "satchel",
  "wiped",
  "omen",
  "ambush",
  "elite",
  "door",
  "adventurer",
  "trinket",
  "rest",
  "jinx",
];

describe("crawl themes", () => {
  it("finds every mark on disk for each pack", () => {
    for (const pack of ["dungeon", "pokemon"])
      for (const name of marks)
        expect(
          existsSync(`public/${crawlIconPath(crawlTheme(pack), name)}`),
          `${pack} ${name}`,
        ).toBe(true);
  });

  it("keeps the Quest's words and marks (Realms, 2026-11-03)", () => {
    const dungeon = crawlTheme("dungeon");
    expect(crawlTheme(undefined)).toBe(dungeon);
    expect(crawlIconPath(dungeon, "heart")).toBe("art/crawl/heart.svg");
    expect(dungeon.loot.smoke.name).toBe("Smoke Bomb");
    expect(heartCount(dungeon, 1)).toBe("1 heart");
    expect(heartCount(dungeon, 2)).toBe("2 hearts");
    expect(dungeon.loot.candy.name).toBe("Tome of Training");
    expect(dungeon.loot.round.name).toBe("Hired Sword");
    expect(dungeon.words.evolving!("Bard")).toBe("Bard ranks up!");
    expect(dungeon.won.title.join(" ")).toBe("The dragon is slain.");
  });

  it("names the League's journey", () => {
    const league = crawlTheme("pokemon");
    expect(crawlIconPath(league, "heart")).toBe("art/league/poke-ball.svg");
    expect(league.loot.die).toEqual({
      name: "X Attack",
      does: "Roll a lost battle again",
    });
    expect(league.words.party).toBe("The team");
    expect(league.wiped.title.join(" ")).toBe("Whited out.");
    expect(heartCount(league, 1)).toBe("1 HP");
  });
});

describe("how to play", () => {
  it("states the Quest's numbers as the content tunes them", () => {
    const quest = packs.find((p) => p.id === "dungeon")!.quest!;
    const rows = crawlTheme("dungeon").guide.rows({
      hearts: quest.party!.hearts,
    });
    const line = (title: string) => rows.find((r) => r.title === title)!.line;
    expect(line("Hearts")).toContain(`shares ${PARTY_HEARTS}.`);
    expect(line("Inns and side quests")).toContain(
      `rest for ${LANDING_HEAL} hearts, or stock up for drinks`,
    );
    expect(LEVEL_DRINK).toBe(3);
    // One row a system, and nothing cut on 2026-10-31; ranks since Realms;
    // the dragon battle since The Quest 2.0 (2026-11-13); lore and allies
    // since its Phase 4 (2026-11-14).
    expect(rows.map((r) => r.title)).toEqual([
      "Hearts",
      "Fights",
      "Bosses",
      "The dragon",
      "Lore",
      "Allies",
      "Ranks",
      "Inns and side quests",
      "Satchel and gear",
      "Curses",
    ]);
    // Every row's mark exists.
    for (const row of rows)
      expect(
        existsSync(`public/${crawlIconPath(crawlTheme("dungeon"), row.icon)}`),
      ).toBe(true);
  });
  it("speaks the League's words", () => {
    const league = crawlTheme("pokemon");
    const rows = league.guide.rows({ hearts: 17 });
    expect(rows.map((r) => r.title)).toEqual([
      "Team HP",
      "Battles",
      "Types",
      "Gyms and badges",
      "Evolution",
      "Caught Pokémon",
      "Bag",
      "Jinxes",
    ]);
    for (const row of rows)
      expect(existsSync(`public/${crawlIconPath(league, row.icon)}`)).toBe(
        true,
      );
  });
});

describe("the Quest's lit scenes (2026-10-31; regions since Realms)", () => {
  const rules = packs.find((p) => p.id === "dungeon")!.quest!;
  const scene = crawlTheme("dungeon").flourish!.scene!;
  it("lights every stage after the omen with its own scene", () => {
    for (const stage of questStages(rules)) {
      if (["Your adventurer", "The omen"].includes(stage.label)) continue;
      expect(scene(stage.label), stage.label).toBeTruthy();
    }
    expect(scene("The Old Forest")).toBe("forest");
    expect(scene("Old Forest boss")).toBe("forest");
    expect(scene("King's Road boss")).toBe("road");
    expect(scene("The Frozen Pass")).toBe("frost");
    // The rivals at the lair's door, not the dragon's own light.
    expect(scene("The Lair's Door")).toBe("rival");
    expect(scene("The Dragon's Lair")).toBe("lair");
    expect(scene("The Last Inn")).toBe("inn");
    expect(scene("A Side Quest")).toBe("hidden");
    expect(scene("A Dragon Sign")).toBe("lair");
    expect(scene("The Road Out")).toBe("road");
    expect(scene("The Signpost")).toBe("road");
    expect(scene("An Echo")).toBe("lair");
  });
  it("the League stamps its bosses but lights no scenes (2026-11-01)", () => {
    const league = crawlTheme("pokemon").flourish!;
    expect(league.felled).toBe("Defeated");
    expect(league.scene).toBeUndefined();
  });
});

describe("Pub Crawl floors read as different rooms", () => {
  it("no title appears twice on one floor", () => {
    const byFloor = new Map<string, string[]>();
    for (const c of cards) {
      const floor = c.id.startsWith("dungeon.") && c.ribbon?.split(" · ")[0];
      // The road's choice cards (Phase 5) share their stage's name on
      // purpose; they are not a region.
      if (!floor || floor === "The Road") continue;
      byFloor.set(floor, [...(byFloor.get(floor) ?? []), c.title]);
    }
    for (const [floor, titles] of byFloor)
      expect(
        titles.filter((t, i) => titles.indexOf(t) !== i),
        floor,
      ).toEqual([]);
  });
});
