import { test, expect } from "@playwright/test";
import { createSession } from "../../src/game/engine";
import { cards, packs } from "../../src/content/catalog";

const saveKey = "side-quest.session.v1";

test("@release mobile landscape blocks play without changing the saved game", async ({
  page,
}) => {
  await page.goto("./");
  await page.setViewportSize({ width: 844, height: 390 });
  const gate = page.getByRole("alertdialog", { name: "Rotate to portrait" });
  await expect(gate).toBeVisible();
  await expect(gate).toContainText("Your place will be here");
  await page.keyboard.press("Escape");
  await expect(gate).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(gate).toHaveCount(0);
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(page.locator(".progress")).toBeVisible();
  await expect(page.locator(".card-stage")).not.toHaveClass(/deal/);
  await page.getByRole("button", { name: "Reveal card" }).click();
  await expect(page.locator(".card-stage")).not.toHaveClass(/flip/);
  const saved = await page.evaluate(
    (key) => localStorage.getItem(key),
    saveKey,
  );
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(gate).toBeVisible();
  await page.keyboard.press("Enter");
  expect(await page.evaluate((key) => localStorage.getItem(key), saveKey)).toBe(
    saved,
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(gate).toHaveCount(0);
  await expect(page.locator(".game-card")).toBeVisible();
  expect(await page.evaluate((key) => localStorage.getItem(key), saveKey)).toBe(
    saved,
  );
});

test("rotation during a roll keeps its predetermined saved result", async ({
  page,
}) => {
  const diceCard = cards.find(
    (card) =>
      card.dice &&
      packs.find((pack) => pack.id === "core")!.cardIds.includes(card.id),
  )!;
  const session = createSession(
    { version: 1, packIds: ["core"], limit: 30 },
    [diceCard],
    [{ ...packs[0], cardIds: [diceCard.id] }],
  );
  await page.goto("./");
  await page.evaluate(
    ({ key, value }) => localStorage.setItem(key, JSON.stringify(value)),
    { key: saveKey, value: session },
  );
  await page.reload();
  await page.getByRole("button", { name: "Reveal card" }).click();
  await expect(page.locator(".card-stage")).not.toHaveClass(/flip/);
  await page.locator(".game-card").click();
  await page.waitForFunction(
    (key) => !!JSON.parse(localStorage.getItem(key) || "null")?.roll,
    saveKey,
  );
  const roll = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!)?.roll,
    saveKey,
  );
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(
    page.getByRole("alertdialog", { name: "Rotate to portrait" }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator(".card-stage")).not.toHaveClass(/roll/);
  // A rotation or resize settles the committed throw and reveals its result.
  await expect(page.locator(".game-card")).toHaveAttribute(
    "aria-label",
    /Tap to put this card aside/,
  );
  const restored = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    saveKey,
  );
  expect(restored.roll.values).toEqual(roll.values);
  expect(restored.roll.returned).toBe(true);
  expect(restored.discarded).toBe(0);
});

test("rotation over the pause menu restores that menu", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(page.locator(".progress")).toBeVisible();
  await page.getByRole("button", { name: "Open game menu" }).click();
  await expect(page.getByRole("dialog", { name: "Paused" })).toBeVisible();
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(
    page.getByRole("alertdialog", { name: "Rotate to portrait" }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("alertdialog")).toHaveCount(0);
  await expect(page.getByRole("dialog", { name: "Paused" })).toBeVisible();
  await page.getByRole("dialog").getByRole("button", { name: "Close" }).click();
  await expect(page.locator(".game-card")).toBeVisible();
});

test("iPadOS landscape stays playable, phones are still blocked, desktop is usable", async ({
  browser,
  baseURL,
}) => {
  const ipad = await browser.newContext({
    baseURL,
    viewport: { width: 1180, height: 820 },
    hasTouch: true,
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
  });
  await ipad.addInitScript(() => {
    Object.defineProperty(navigator, "maxTouchPoints", { value: 5 });
  });
  const ipadPage = await ipad.newPage();
  await ipadPage.goto("./");
  await expect(ipadPage.getByRole("alertdialog")).toHaveCount(0);
  await ipadPage.getByRole("button", { name: "Play", exact: true }).click();
  const card = ipadPage.locator(".game-card");
  await expect(card).toBeVisible();
  const box = (await card.boundingBox())!;
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.y + box.height).toBeLessThanOrEqual(820);
  expect(box.x + box.width).toBeLessThanOrEqual(1180);
  await ipadPage.setViewportSize({ width: 768, height: 1024 });
  await expect(ipadPage.getByRole("alertdialog")).toHaveCount(0);
  await ipad.close();

  const desktop = await browser.newContext({
    baseURL,
    viewport: { width: 1024, height: 768 },
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
  });
  const desktopPage = await desktop.newPage();
  await desktopPage.goto("./");
  await expect(desktopPage.getByRole("alertdialog")).toHaveCount(0);
  await expect(
    desktopPage.getByRole("button", { name: "Play", exact: true }),
  ).toBeVisible();
  await desktop.close();
});
