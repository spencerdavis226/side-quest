import { test, expect } from "vitest";
import { workshopSession, workshopCards } from "../src/workshop/session";
import { cards, packs } from "../src/content/catalog";
import { createSession, finaleCardIds } from "../src/game/engine";
test("seeded workshop preserves the pool and reproduces order", () => {
  const a = workshopSession("a", "core.house-special").session;
  expect(a).toEqual(workshopSession("a", "core.house-special").session);
  expect(a.order[0]).toBe("core.house-special");
  // Quest finales are catalog cards that never enter the shuffle.
  expect(new Set(a.order).size).toBe(
    new Set(packs.flatMap((p) => p.cardIds)).size,
  );
  const questOnly = packs.flatMap((p) =>
    p.quest ? [...p.quest.cardIds, ...finaleCardIds(p.quest)] : [],
  );
  expect(workshopCards.length).toBe(a.order.length + questOnly.length);
  expect(a.order).not.toEqual(
    workshopSession("b", "core.house-special").session.order,
  );
});
test("Core composition matches the trimmed content brief", () => {
  const core = packs.find((p) => p.id === "core")!;
  const coreCards = cards.filter((c) => core.cardIds.includes(c.id));
  // Sample set (31), trimmed classics (45), trimmed standard expansion (29);
  // the CABIIN-born cards moved to Cabin weekend.
  expect(coreCards).toHaveLength(105);
  expect(
    Object.fromEntries(
      ["sip", "group", "category", "challenge", "rule"].map((c) => [
        c,
        coreCards.filter((card) => card.category === c).length,
      ]),
    ),
  ).toEqual({ sip: 16, group: 22, category: 9, challenge: 43, rule: 15 });
  expect(coreCards.filter((c) => c.dice)).toHaveLength(36);
});

// Sheet rows that are CABIIN board spaces play in Cabin weekend instead.
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
test("each supplied sheet row lands in the House deck, Cabin weekend or VIP night", () => {
  const core = packs.find((p) => p.id === "core")!;
  const house = packs.find((p) => p.id === "house")!;
  const vip = packs.find((p) => p.id === "vip")!;
  // Rows 3–106 minus the blank row 75 and the description-less row 106.
  const sheetRows = Array.from(
    { length: 104 },
    (_, offset) => offset + 3,
  ).filter((row) => row !== 75 && row !== 106);
  const cabin = packs.find((p) => p.id === "cabin")!;
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
  // The generated main deck no longer carries the supplied sheet.
  expect(core.cardIds.some((id) => id.startsWith("house."))).toBe(false);
  expect(vip.cardIds.slice(-4)).toEqual(
    [3, 4, 5, 6].map((row) => `vip.sheet-${String(row).padStart(3, "0")}`),
  );
  expect(cards).toHaveLength(864); // 105 core + 94 house + 16 vip + 120 Pokémon (+24 League-only gym leaders, 20 gauntlet cards) + 85 cabin + 250 likely + 150 secrets
});

test("Cabin weekend owns its CABIIN cards and shares none", () => {
  const cabin = packs.find((p) => p.id === "cabin")!;
  expect(cabin.cardIds).toHaveLength(85);
  expect(cabin.cardIds.every((id) => id.startsWith("cabin."))).toBe(true);
  // No card is in two packs.
  const all = packs.flatMap((p) => p.cardIds);
  expect(new Set(all).size).toBe(all.length);
  // Moved, not duplicated: Core no longer carries the CABIIN-born cards.
  const core = packs.find((p) => p.id === "core")!;
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
    expect(card.title).toBe("Most Likely To");
    expect(card.category).toBe("group");
    expect(card.dice).toBeUndefined();
    expect(card.rules).toMatch(
      /Point on three: most votes (drinks [23]|finishes their drink|takes a shot)\.$/,
    );
  }
});

test("the Pokémon League mode deals all 24 gym leaders and always reaches eight badges", () => {
  const pokemon = packs.find((p) => p.id === "pokemon")!;
  expect(pokemon.quest).toMatchObject({
    mode: "Pokémon League",
    goal: 8,
    length: 40,
  });
  // After the eighth badge: 1 of 8 Legendaries, 4 of 9 Elite Four, 1 of 3
  // Champions.
  expect(
    pokemon.quest!.finale.map(({ label, pick, cardIds }) => [
      label,
      pick,
      cardIds.length,
    ]),
  ).toEqual([
    ["Legendary", 1, 8],
    ["Elite Four", 4, 9],
    ["Champion", 1, 3],
  ]);
  // Each stage has its own ribbon finish; gym leaders keep the gold default.
  const tones = ["pearl", "violet", "crimson"];
  for (const [i, stage] of pokemon.quest!.finale.entries()) {
    expect(stage.intro).toBeTruthy();
    for (const id of stage.cardIds) {
      const card = cards.find((c) => c.id === id)!;
      expect(card.ribbon).toMatch(
        /^(Legendary Encounter|Elite Four · \w+|Champion · \w+)$/,
      );
      expect(card.ribbonTone).toBe(tones[i]);
    }
  }
  const leaders = cards.filter((c) => c.quest === "pokemon");
  expect(leaders).toHaveLength(24);
  expect(pokemon.quest!.cardIds).toEqual(leaders.map((c) => c.id));
  for (const leader of leaders) {
    expect(leader.ribbon).toMatch(/^Gym Leader · \w+ Badge$/);
    expect(leader.ribbonTone).toBeUndefined();
    // Gym leaders are League-only: never in the regular Pokémon deck.
    expect(pokemon.cardIds).not.toContain(leader.id);
  }
  const ids = new Set(leaders.map((c) => c.id));
  const regular = createSession(
    { version: 1, packIds: ["pokemon"], limit: 60 },
    cards,
    packs,
  );
  expect(regular.order.some((id) => ids.has(id))).toBe(false);
  let seed = 11;
  const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  for (let i = 0; i < 40; i++) {
    const s = createSession(
      {
        version: 1,
        packIds: ["core", "house", "pokemon"],
        limit: null,
        quest: "pokemon",
      },
      cards,
      packs,
      random,
    );
    expect(s.order.filter((id) => ids.has(id))).toHaveLength(24);
    expect(
      s.order.slice(0, 39).filter((id) => ids.has(id)).length,
    ).toBeGreaterThanOrEqual(8);
  }
});
