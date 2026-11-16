import { test, expect, seed, rng, withMotion } from "./support";
import { advance, createSession } from "../../src/game/engine";
import { cards, packs } from "../../src/content/catalog";
import { STEP, crawlAt, league } from "./sessions";

// The prologue (2026-11-15, owner: the opening must not be the card table,
// "since people get confused when the game actually starts"): the opening
// cards in a scene of their own, a handoff, then the table.
const freshLeague = (name: string) =>
  createSession(
    { ...league, packIds: [...league.packIds] },
    cards,
    packs,
    rng(name),
  );

test("the League opens on its starter's scene, then hands the phone on", async ({
  page,
}) => {
  await seed(page, freshLeague("league prologue"));
  const scene = page.locator(".prologue");
  await expect(scene).toBeVisible();
  // Not the table: no card, no top bar, and the phone stays put.
  await expect(page.locator(".game-card")).toHaveCount(0);
  await expect(page.locator(".topbar")).toHaveCount(0);
  await expect(scene).toContainText("Keep the phone here");
  await expect(scene.locator(".pro-type")).toBeVisible();
  // The starter was turned for the table: a reload keeps the scene.
  await expect
    .poll(() =>
      page.evaluate(
        () => JSON.parse(localStorage["side-quest.session.v1"]).phase,
      ),
    )
    .toBe("revealed");
  await page.reload();
  await expect(scene).toBeVisible();
  await page.getByRole("button", { name: "Set out" }).click();
  await expect(scene).toContainText("Now pass the phone");
  await expect(page.locator(".game-card")).toHaveCount(0);
  await page.getByRole("button", { name: "Deal the first card" }).click();
  await expect(scene).toHaveCount(0);
  await expect(page.locator(".game-card")).toBeVisible();
  await expect(page.locator(".topbar")).toBeVisible();
  // The first card waits face down for the first player.
  await expect(page.locator(".game-card")).toHaveClass(/back/);
});

test("the prologue's menu ends the game", async ({ page }) => {
  await seed(page, freshLeague("league prologue menu"));
  await page.getByRole("button", { name: "Menu" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
});

test("the Quest opens on four scenes and a road, then hands the phone on", async ({
  page,
}) => {
  await seed(
    page,
    createSession(
      { version: 1, packIds: ["dungeon"], limit: null, quest: "dungeon" },
      cards,
      packs,
      rng("quest prologue"),
    ),
  );
  const scene = page.locator(".prologue");
  for (const [kicker, go] of [
    ["Your adventurer", "Read the omen"],
    ["Tonight's omen", "Open the summons"],
    ["The King's Summons", "Take the road"],
  ] as const) {
    await expect(scene.locator(".pro-kicker")).toHaveText(kicker);
    await expect(page.locator(".game-card")).toHaveCount(0);
    await page.getByRole("button", { name: go }).click();
  }
  // The Road Out: its two ways as choices on the scene, no map over them.
  await expect(scene.locator(".pro-kicker")).toHaveText("The Road Out");
  const road = scene.locator("button.pro-road").first();
  const region = (await road.locator("strong").textContent())!;
  await road.click();
  await expect(scene.locator(".pro-title")).toHaveText(region);
  await expect(scene).toContainText("Now pass the phone");
  await page.getByRole("button", { name: "Deal the first card" }).click();
  await expect(scene).toHaveCount(0);
  await expect(page.locator(".game-card")).toHaveClass(/back/);
  await expect(page.locator(".crawl-progress")).toContainText(region);
});

test("the rival's introduction takes the scene, then the table comes back", async ({
  page,
}) => {
  await seed(page, advance(crawlAt("dungeon.rival-fingerbang", STEP.rival)));
  const scene = page.locator(".prologue");
  await expect(scene.locator(".pro-kicker")).toHaveText("Your rival");
  await expect(scene.locator(".pro-title")).toHaveText("Lady Fingerbang");
  await expect(scene.locator(".pro-ritual")).toContainText(
    "Whenever they show up",
  );
  await expect(page.locator(".topbar")).toHaveCount(0);
  await page.getByRole("button", { name: "Back to the table" }).click();
  await expect(scene).toHaveCount(0);
  await expect(page.locator(".game-card")).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage["side-quest.session.v1"]).quest.party.rival
            ?.who,
      ),
    )
    .toBe("fingerbang");
});

test("the class is drawn alone, then its scene comes in", async ({ page }) => {
  // Owner, 2026-11-15: the tarot draw "happens at the same time as the
  // 'your adventurer' scene". The scene waits for its reveal to end.
  await withMotion(page);
  await seed(
    page,
    createSession(
      { version: 1, packIds: ["dungeon"], limit: null, quest: "dungeon" },
      cards,
      packs,
      rng("reveal first"),
    ),
  );
  await expect(page.locator(".moment-omen")).toBeVisible();
  await expect(page.locator(".prologue .pro-stage")).toHaveCount(0);
  await expect(page.locator(".moment")).toHaveCount(0, { timeout: 8000 });
  await expect(page.locator(".prologue .pro-kicker")).toHaveText(
    "Your adventurer",
  );
});

for (const mode of ["pokemon", "dungeon"] as const)
  test(`the ${mode} opening shows no scene before its reveal`, async ({
    page,
  }) => {
    // Owner, 2026-11-16: "your partner" showed for a moment, then the
    // ball, then "your partner" again. While the first card was still
    // being dealt there was no card, so nothing held the scene back.
    await withMotion(page);
    await page.addInitScript(() => {
      const w = window as unknown as { __order: string[] };
      w.__order = [];
      new MutationObserver(() => {
        for (const [sel, name] of [
          [".prologue .pro-stage", "scene"],
          [".moment", "reveal"],
        ])
          if (!w.__order.includes(name) && document.querySelector(sel))
            w.__order.push(name);
      }).observe(document, { childList: true, subtree: true });
    });
    // From setup, as at the table: Play deals the first card with motion.
    await page.goto("./");
    await page
      .locator(".quest-mode")
      .filter({ hasText: mode === "pokemon" ? "Pokémon League" : "The Quest" })
      .click();
    await page.getByRole("button", { name: "Play", exact: true }).click();
    await expect(page.locator(".moment")).toBeVisible();
    await expect(page.locator(".moment")).toHaveCount(0, { timeout: 10000 });
    await expect(page.locator(".prologue .pro-stage")).toBeVisible();
    const order = await page.evaluate(
      () => (window as unknown as { __order: string[] }).__order,
    );
    expect(order).toEqual(["reveal", "scene"]);
  });
