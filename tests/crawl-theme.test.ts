import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  crawlIconPath,
  crawlTheme,
  heartCount,
  type CrawlIconName,
} from "../src/components/crawlTheme";

const marks: CrawlIconName[] = [
  "draught",
  "shield",
  "die",
  "smoke",
  "revive",
  "candy",
  "bleed",
  "hex",
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
  "cup",
  "quaff",
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
    expect(dungeon.curses.bleed.name).toBe("Bleeding");
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
    expect(league.curses.hex).toEqual({
      name: "Confused",
      does: "The bag is sealed",
    });
    expect(league.words.party).toBe("The team");
    expect(league.wiped.title.join(" ")).toBe("Whited out.");
    expect(heartCount(league, 1)).toBe("1 HP");
  });
});
