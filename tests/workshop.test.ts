import { test, expect } from "vitest";
import { workshopSession, workshopCards } from "../src/workshop/session";
import { cards, packs } from "../src/content/catalog";
import { createSession, finaleCardIds, questStages } from "../src/game/engine";
import {
  champions,
  eliteFourMembers,
  gymLeaders,
  gymTiers,
  legendaries,
} from "../src/content/pokemon-league";
test("seeded workshop preserves the pool and reproduces order", () => {
  const a = workshopSession("a", "core.house-special").session;
  expect(a).toEqual(workshopSession("a", "core.house-special").session);
  expect(a.order[0]).toBe("core.house-special");
  // Quest finales are catalog cards that never enter the shuffle.
  expect(new Set(a.order).size).toBe(
    new Set(packs.flatMap((p) => p.cardIds)).size,
  );
  // A crawl's stages reuse its deck cards; only its finds are extra.
  const questOnly = packs.flatMap((p) =>
    p.quest
      ? [...p.quest.cardIds, ...finaleCardIds(p.quest)].filter(
          (id) => !p.cardIds.includes(id),
        )
      : [],
  );
  expect(workshopCards.length).toBe(a.order.length + questOnly.length);
  expect(a.order).not.toEqual(
    workshopSession("b", "core.house-special").session.order,
  );
});
test("Core composition matches the trimmed content brief", () => {
  const core = packs.find((p) => p.id === "core")!;
  // The Core deck is three plain sources (2026-10-24, owner): the generated
  // main deck, the supplied house sheet and Cabin weekend.
  expect(core.cardIds).toHaveLength(275);
  const coreCards = cards.filter(
    (c) => core.cardIds.includes(c.id) && c.id.startsWith("core."),
  );
  // The 2026-10-07 rewrite: sample set (25), classics (24) and the standard
  // expansion (47), with the bare roll-and-pour cards cut.
  expect(coreCards).toHaveLength(96);
  expect(
    Object.fromEntries(
      ["sip", "group", "category", "challenge", "rule"].map((c) => [
        c,
        coreCards.filter((card) => card.category === c).length,
      ]),
    ),
  ).toEqual({ sip: 13, group: 21, category: 10, challenge: 37, rule: 15 });
  expect(coreCards.filter((c) => c.dice)).toHaveLength(16);
});

// Sheet rows that are CABIIN board spaces keep their `cabin.*` IDs.
const cabinRows: Record<number, string> = {
  12: "maddy-booty",
  16: "ursaring",
  24: "wench",
  28: "no-take-give",
  40: "first-name-only",
  42: "pet-that-dog",
  53: "abra-like-a-slut",
  54: "whinnie-the-pooh",
};
test("each supplied sheet row lands in the Core deck (House or CABIIN IDs) or VIP night", () => {
  const core = packs.find((p) => p.id === "core")!;
  const house = {
    cardIds: core.cardIds.filter((id) => id.startsWith("house.")),
  };
  const vip = packs.find((p) => p.id === "vip")!;
  // Rows 3–106 minus the blank row 75 and the description-less row 106.
  const sheetRows = Array.from(
    { length: 104 },
    (_, offset) => offset + 3,
  ).filter((row) => row !== 75 && row !== 106);
  const cabin = {
    cardIds: core.cardIds.filter((id) => id.startsWith("cabin.")),
  };
  expect(house.cardIds).toHaveLength(94);
  for (const row of sheetRows)
    if (cabinRows[row]) {
      expect(cabin.cardIds).toContain(`cabin.${cabinRows[row]}`);
      expect(house.cardIds).not.toContain(
        `house.sheet-${String(row).padStart(3, "0")}`,
      );
    } else
      expect(house.cardIds).toContain(
        `house.sheet-${String(row).padStart(3, "0")}`,
      );
  expect(vip.cardIds.slice(-4)).toEqual(
    [3, 4, 5, 6].map((row) => `vip.sheet-${String(row).padStart(3, "0")}`),
  );
  expect(cards).toHaveLength(1826); // 96 core + 94 house + 16 vip + 120 Pokémon (+72 League-only gym leaders, 79 gauntlet cards, 35 starters, 221 route, Victory Road and rival cards, 36 hideout cards) + 85 cabin + 250 likely + 156 secrets + 566 Dungeon night (308 fights, elites and bosses; 163 Pub Crawl finds, gambles, merchants, forks and table moments; 20 omens, 18 adventurers, 16 landings, 21 rival-party cards and 20 hidden-room cards)
});

test("League gyms come in eight tiers, one leader per region in each", () => {
  expect(gymTiers).toHaveLength(8);
  const leaders = cards.filter((c) => c.quest === "pokemon");
  expect(new Set(gymTiers.flat())).toEqual(new Set(leaders));
  for (const tier of gymTiers) {
    expect(tier).toHaveLength(9);
    // Every boss in a tier hits as hard and lasts as long as the rest.
    expect(new Set(tier.map((c) => c.damage)).size).toBe(1);
    expect(new Set(tier.map((c) => c.hits)).size).toBe(1);
  }
  for (const c of [
    ...gymLeaders,
    ...legendaries,
    ...eliteFourMembers,
    ...champions,
  ])
    expect(c, c.id).toMatchObject({ battle: true, encounter: "boss" });
});

test("the CABIIN cards sit in Core under their own IDs and are shared by none", () => {
  const core = packs.find((p) => p.id === "core")!;
  const cabin = {
    cardIds: core.cardIds.filter((id) => id.startsWith("cabin.")),
  };
  expect(cabin.cardIds).toHaveLength(85);
  // No card is in two packs.
  const all = packs.flatMap((p) => p.cardIds);
  expect(new Set(all).size).toBe(all.length);
  // Moved, not duplicated: the CABIIN-born cards kept their cabin.* IDs.
  for (const id of ["smooth-brain", "samesies", "thanos-snap", "for-safety"]) {
    expect(core.cardIds).not.toContain(`core.${id}`);
    expect(cabin.cardIds).toContain(`cabin.${id}`);
  }
  // The sheet rows keep the sheet's wording.
  expect(cards.find((c) => c.id === "cabin.ursaring")).toMatchObject({
    title: "Ursaring",
    rules: "Give 13 and apologize",
  });
});

test("Most Likely To is 250 standalone vote cards", () => {
  const likely = packs.find((p) => p.id === "likely")!;
  const voteCards = cards.filter((c) => likely.cardIds.includes(c.id));
  expect(voteCards).toHaveLength(250);
  for (const card of voteCards) {
    // The body holds the whole instruction; the title is only flavor.
    expect(card.title).not.toMatch(/most likely/i);
    expect(card.category).toBe("group");
    expect(card.dice).toBeUndefined();
    expect(card.rules).toMatch(
      /^Most likely to .+\? Point on three\. Most votes (drinks [23]|finishes their drink|takes a shot)\.$/,
    );
  }
  // Every title is its own: no two vote cards share one.
  expect(new Set(voteCards.map((c) => c.title)).size).toBe(voteCards.length);
});

test("the Pokémon League is a crawl: 72 gym leaders in eight tiers, then the gauntlet", () => {
  const pokemon = packs.find((p) => p.id === "pokemon")!;
  // Since 2026-10-16 the League plays on the crawl engine (Team HP); the
  // journey itself is checked in tests/league.test.ts.
  expect(pokemon.quest).toMatchObject({
    mode: "Pokémon League",
    goal: 0,
    cardIds: [],
    party: { hearts: 15 },
  });
  // The gauntlet: 1 of 30 Legendaries, 4 of 36 Elite Four, 1 of 13
  // Champions, each stage with its own ribbon finish.
  const stages = questStages(pokemon.quest!);
  const gauntlet = stages.slice(-3);
  expect(
    gauntlet.map(({ label, pick, cardIds }) => [label, pick, cardIds.length]),
  ).toEqual([
    ["Legendary", 1, 30],
    ["Elite Four", 4, 36],
    ["Champion", 1, 13],
  ]);
  const tones = ["pearl", "violet", "crimson"];
  for (const [i, stage] of gauntlet.entries()) {
    expect(stage.intro).toBeTruthy();
    for (const id of stage.cardIds) {
      const card = cards.find((c) => c.id === id)!;
      expect(card.ribbon).toMatch(
        /^(Legendary Encounter|(Elite Four|Champion Cup) · \w+|Champion · \w+)$/,
      );
      expect(card.ribbonTone).toBe(tones[i]);
    }
  }
  const leaders = cards.filter((c) => c.quest === "pokemon");
  expect(leaders).toHaveLength(72);
  const gyms = stages.filter((st) => /^Gym \d$/.test(st.label));
  expect(gyms.flatMap((st) => st.cardIds).sort()).toEqual(
    leaders.map((c) => c.id).sort(),
  );
  for (const leader of leaders) {
    // Alola's island challenge pays Z-Crystals instead of badges.
    expect(leader.ribbon).toMatch(
      /^(Gym Leader · \w+ Badge|(Trial Captain|Kahuna) · \w+ Z)$/,
    );
    expect(leader.ribbonTone).toBeUndefined();
    // Gym leaders are League-only: never in the regular Pokémon deck.
    expect(pokemon.cardIds).not.toContain(leader.id);
  }
  const ids = new Set(finaleCardIds(pokemon.quest!));
  const regular = createSession(
    { version: 1, packIds: ["pokemon"], limit: 60 },
    cards,
    packs,
  );
  expect(regular.order.some((id) => ids.has(id))).toBe(false);
});
