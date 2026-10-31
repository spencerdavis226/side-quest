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

  it("keeps Dungeon night's words and marks", () => {
    const dungeon = crawlTheme("dungeon");
    expect(crawlTheme(undefined)).toBe(dungeon);
    expect(crawlIconPath(dungeon, "heart")).toBe("art/crawl/heart.svg");
    expect(dungeon.loot.smoke.name).toBe("Smoke Bomb");
    expect(heartCount(dungeon, 1)).toBe("1 heart");
    expect(heartCount(dungeon, 2)).toBe("2 hearts");
    expect(dungeon.loot.candy.name).toBe("Dog-Eared Tome");
    expect(dungeon.words.evolving!("Bard")).toBe("Bard levels up!");
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
  it("states Pub Crawl's numbers as the content tunes them", () => {
    const quest = packs.find((p) => p.id === "dungeon")!.quest!;
    const rows = crawlTheme("dungeon").guide.rows({
      hearts: quest.party!.hearts,
    });
    const line = (title: string) => rows.find((r) => r.title === title)!.line;
    expect(line("Hearts")).toContain(`shares ${PARTY_HEARTS}.`);
    expect(line("Landings")).toContain(
      `for ${LEVEL_DRINK} drinks, or rest for ${LANDING_HEAL} hearts`,
    );
    // One row a system, and nothing cut on 2026-10-31.
    expect(rows.map((r) => r.title)).toEqual([
      "Hearts",
      "Fights",
      "Bosses",
      "Landings",
      "Satchel and gear",
      "Jinxes",
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

describe("Pub Crawl's lit scenes (2026-10-31)", () => {
  const rules = packs.find((p) => p.id === "dungeon")!.quest!;
  const scene = crawlTheme("dungeon").flourish!.scene;
  it("lights every stage after the omen with its own scene", () => {
    for (const stage of questStages(rules)) {
      if (["Your adventurer", "Tonight's omen"].includes(stage.label)) continue;
      expect(scene(stage.label), stage.label).toBeTruthy();
    }
    expect(scene("The Wine Cellar")).toBe("wine");
    expect(scene("Wine Cellar boss")).toBe("wine");
    expect(scene("Cellar boss")).toBe("cellar");
    expect(scene("The Walk-in Freezer")).toBe("freezer");
  });
  it("the League has no flourishes", () => {
    expect(crawlTheme("pokemon").flourish).toBeUndefined();
  });
});

describe("Pub Crawl floors read as different rooms", () => {
  it("no title appears twice on one floor", () => {
    const byFloor = new Map<string, string[]>();
    for (const c of cards) {
      const floor = c.id.startsWith("dungeon.") && c.ribbon?.split(" · ")[0];
      if (!floor) continue;
      byFloor.set(floor, [...(byFloor.get(floor) ?? []), c.title]);
    }
    for (const [floor, titles] of byFloor)
      expect(
        titles.filter((t, i) => titles.indexOf(t) !== i),
        floor,
      ).toEqual([]);
  });
});
