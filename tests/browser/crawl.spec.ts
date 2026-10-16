import { test, expect, type Page } from "@playwright/test";
import { advance, createSession, currentCard } from "../../src/game/engine";
import { returnToCard, rollDice } from "../../src/game/dice";
import type { PartyState, SessionState } from "../../src/game/types";
import { cards, packs } from "../../src/content/catalog";
const key = "side-quest.session.v1";

// A Pub Crawl seeded at `step` with `id` in play, the party as given.
function crawlAt(
  id: string,
  step = 0,
  party: Partial<PartyState> = {},
): SessionState {
  const s = createSession(
    { version: 1, packIds: ["dungeon"], limit: null, quest: "dungeon" },
    cards,
    packs,
  );
  const q = s.quest!;
  const finale = [...q.finale];
  const at = finale.indexOf(id);
  if (at >= 0) finale[at] = finale[step];
  finale[step] = id;
  return {
    ...s,
    discarded: step,
    previousId: step ? finale[step - 1] : null,
    quest: { ...q, finale, step, party: { ...q.party!, ...party } },
  };
}
const reveal = (s: SessionState) => advance(s);
const rolled = (s: SessionState, face: number) =>
  returnToCard(rollDice(s, () => (face - 0.5) / currentCard(s).dice!.sides));
async function seed(page: Page, session: SessionState) {
  await page.goto("./");
  await page.evaluate(
    ({ key, session }) => localStorage.setItem(key, JSON.stringify(session)),
    { key, session },
  );
  await page.reload();
}
const saved = (page: Page) =>
  page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), key);
const meter = (page: Page) => page.locator(".crawl-meter");

test("@release Pub Crawl starts in the Cellar with 12 shared hearts", async ({
  page,
}, info) => {
  await page.goto("./");
  await page.getByRole("button", { name: /^Pub Crawl/ }).click();
  await expect(page.locator(".crawl-brief")).toContainText("Dungeon night");
  await expect(page.getByRole("button", { name: /^Choose packs/ })).toHaveCount(
    0,
  );
  await page.screenshot({ path: info.outputPath("setup.png") });
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(meter(page)).toHaveAccessibleName(
    /^Hearts: 12 of 12\. The Cellar/,
  );
  await expect(page.locator(".crawl-progress")).toHaveAccessibleName(
    "Room 1 of 7, The Cellar",
  );
  await expect(page.locator(".stage-banner")).toHaveText(
    /Pub Crawl\s*Down into the Cellar/,
  );
  await page.screenshot({ path: info.outputPath("start.png") });
  const s = await saved(page);
  expect(s.config.packIds).toEqual(["dungeon"]);
  expect(s.quest.party).toMatchObject({ hearts: 12, max: 12 });
});

test("@release a monster shows its stakes; a smoke bomb flees it", async ({
  page,
}, info) => {
  await seed(
    page,
    reveal(crawlAt("dungeon.drunk-goblin", 2, { loot: ["smoke"] })),
  );
  const face = page.locator(".game-card .study-face");
  await expect(face.locator(".stake-loss")).toHaveAccessibleName(
    "Losing costs 1 heart",
  );
  await expect(face.locator(".stake-loot")).toHaveAccessibleName(
    "Winning finds a Smoke Bomb",
  );
  const flee = page.getByRole("button", { name: /^Use the Smoke Bomb/ });
  await expect(flee).toBeVisible();
  await expect(page.locator(".meter-satchel")).toHaveText("1");
  await page.screenshot({ path: info.outputPath("monster.png") });
  await flee.click();
  await expect(page.locator(".crawl-progress")).toHaveAccessibleName(
    /^Room 4 of 7/,
  );
  const s = await saved(page);
  expect(s.quest.party).toMatchObject({ hearts: 12, loot: [] });
  expect(s.quest.step).toBe(3);
});

test("a loaded die rerolls a lost fight", async ({ page }, info) => {
  await seed(
    page,
    rolled(reveal(crawlAt("dungeon.ex-wraith", 9, { loot: ["die"] })), 2),
  );
  await expect(page.locator(".study-face")).toHaveClass(/battle-lost/);
  const reroll = page.getByRole("button", { name: /^Use the Loaded Die/ });
  await page.screenshot({ path: info.outputPath("lost-roll.png") });
  await reroll.click();
  await expect(page.locator(".game-card")).toHaveAccessibleName(/^Roll 1d20/);
  const s = await saved(page);
  expect(s.roll).toBeNull();
  expect(s.quest.party.loot).toEqual([]);
});

test("@release a trial is settled with plaques; a loss costs hearts", async ({
  page,
}, info) => {
  await seed(page, reveal(crawlAt("dungeon.tomb-of-silence", 10)));
  await expect(
    page.getByRole("button", { name: "Won", exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: info.outputPath("trial.png") });
  await page.getByRole("button", { name: "Lost", exact: true }).click();
  await expect(meter(page)).toHaveAccessibleName(/^Hearts: 10 of 12/);
  await expect(page.locator(".crawl-meter strong")).toHaveText("10/12");
});

test("a boss shows its wounds and comes back until it falls", async ({
  page,
}, info) => {
  let s = reveal(crawlAt("dungeon.hangover-hydra", 15, { hits: 1, rounds: 1 }));
  s = { ...s, discarded: 16 };
  await seed(page, s);
  await expect(page.locator(".crawl-progress")).toHaveAccessibleName(
    "Boss: 1 of 2 hits",
  );
  await expect(page.locator(".game-card .card-ribbon")).toHaveText(
    "Catacombs · Boss",
  );
  await page.screenshot({ path: info.outputPath("boss.png") });
});

test("the party dialog lays out the run, and a draught heals a heart", async ({
  page,
}, info) => {
  await seed(
    page,
    crawlAt("dungeon.bone-sommelier", 10, {
      hearts: 5,
      curse: "bleed",
      loot: ["draught", "shield"],
    }),
  );
  await meter(page).click();
  const dialog = page.getByRole("dialog", { name: "The party" });
  await expect(dialog.locator(".crawl-curse")).toContainText("Bleeding");
  await expect(dialog.locator(".satchel-slot")).toHaveCount(3);
  await page.screenshot({ path: info.outputPath("party.png") });
  await dialog.getByRole("button", { name: "Drink" }).click();
  await expect(dialog.locator(".crawl-hearts")).toHaveAccessibleName(
    "Hearts: 6 of 12",
  );
  await expect(dialog.getByRole("button", { name: "Drink" })).toHaveCount(0);
});

test("@release losing the last heart wipes the party", async ({
  page,
}, info) => {
  await seed(
    page,
    rolled(reveal(crawlAt("dungeon.tab-goblin", 4, { hearts: 1 })), 1),
  );
  await page.locator(".game-card").click();
  await expect(page.locator(".crawl-end.wiped h1")).toHaveText(
    /Party\s*wiped\./,
  );
  await expect(page.locator(".crawl-verdict")).toHaveText(
    "Everyone finishes their drink.",
  );
  await expect(page.locator(".crawl-floors li").first()).toContainText(
    "The Cellar",
  );
  await page.screenshot({ path: info.outputPath("wiped.png") });
  await page.getByRole("button", { name: "Play again" }).click();
  await expect(meter(page)).toHaveAccessibleName(/^Hearts: 12 of 12/);
});

test("felling the Last Call boss wins the crawl", async ({ page }, info) => {
  let s = reveal(crawlAt("dungeon.last-call-lich", 23, { hits: 2, rounds: 2 }));
  s = rolled({ ...s, discarded: 25 }, 15);
  await seed(page, s);
  await page.locator(".game-card").click();
  await expect(page.locator(".crawl-end h1")).toHaveText(
    /Last call,\s*survived\./,
  );
  await page.screenshot({ path: info.outputPath("won.png") });
});

for (const width of [320, 390])
  test(`the party meter shares the top row at ${width}px`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 640 });
    await seed(
      page,
      reveal(
        crawlAt("dungeon.cursed-idol", 9, {
          hearts: 3,
          curse: "hex",
          loot: ["draught", "die", "shield"],
        }),
      ),
    );
    const [left, middle, card, stakes] = await Promise.all([
      page.locator(".crawl-meter").boundingBox(),
      page.locator(".crawl-progress").boundingBox(),
      page.locator(".game-card").boundingBox(),
      page.locator(".game-card .card-stakes").boundingBox(),
    ]);
    expect(left!.x).toBeGreaterThanOrEqual(0);
    expect(left!.x + left!.width).toBeLessThanOrEqual(middle!.x);
    expect(stakes!.x).toBeGreaterThan(card!.x);
    expect(stakes!.x + stakes!.width).toBeLessThan(card!.x + card!.width);
    await page.screenshot({ path: info.outputPath(`meter-${width}.png`) });
  });

test("every Dungeon night card fits its face with its plaques at 375x667", async ({
  page,
}) => {
  test.setTimeout(120000);
  await page.setViewportSize({ width: 375, height: 667 });
  const ids = cards.filter((c) => c.id.startsWith("dungeon.")).map((c) => c.id);
  // Stage index of each card, so it is dealt where it belongs.
  const base = crawlAt(ids[0]);
  const stepOf = (id: string) => {
    let first = 0;
    for (const stage of base.quest!.stages) {
      if (stage.cards.some((c) => c.id === id)) return first;
      first += stage.pick;
    }
    throw Error(id);
  };
  const overflowing: string[] = [];
  await page.goto("./");
  for (const id of ids) {
    // A smoke bomb in the satchel puts the Flee plaque on every room fight.
    const s = reveal(crawlAt(id, stepOf(id), { loot: ["smoke"] }));
    await page.evaluate(
      ({ key, session }) => localStorage.setItem(key, JSON.stringify(session)),
      { key, session: s },
    );
    await page.reload();
    const rules = page.locator(".game-card .study-rules");
    await expect(rules).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    if ((await rules.getAttribute("data-overflow")) !== "none")
      overflowing.push(id);
  }
  expect(overflowing).toEqual([]);
});
