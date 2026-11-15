import { test, expect, seed, rng } from "./support";
import { createSession } from "../../src/game/engine";
import { cards, packs } from "../../src/content/catalog";
import { league } from "./sessions";

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
