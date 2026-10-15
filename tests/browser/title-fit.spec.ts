import { test, expect, type Page } from "@playwright/test";
const key = "side-quest.session.v1";

async function revealTitleCard(page: Page) {
  await page.goto("./");
  await page.evaluate(() => {
    localStorage.removeItem("side-quest.session.v1");
    localStorage.setItem(
      "side-quest.settings.v1",
      JSON.stringify({
        config: { version: 1, packIds: ["cabin"], limit: 30 },
        choice: "short",
      }),
    );
  });
  await page.reload();
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await page.waitForFunction((k) => localStorage.getItem(k), key);
  await page.evaluate((k) => {
    const s = JSON.parse(localStorage.getItem(k)!);
    const id = "cabin.almost-lost-my-cool";
    s.order = [id, ...s.order.filter((x: string) => x !== id)];
    localStorage.setItem(k, JSON.stringify(s));
  }, key);
  await page.reload();
  await page.getByRole("button", { name: "Reveal card" }).click();
}
const titleSize = (page: Page) =>
  page
    .locator(".study-title h2")
    .evaluate((el) => parseFloat(getComputedStyle(el).fontSize));

test("a title fitted mid-flip settles at its full size", async ({ page }) => {
  await page.setViewportSize({ width: 1850, height: 1065 });
  await revealTitleCard(page);
  await expect(page.locator(".card-stage")).not.toHaveClass(/flip/);
  const flat = await titleSize(page);
  // A resize during the turn re-fits the title while the card is tilted; the
  // 3D stretch must not leave it stuck small. Sample a few points of the turn.
  for (const delay of [200, 280, 360]) {
    await page.setViewportSize({ width: 1850, height: 1065 });
    await revealTitleCard(page);
    await page.waitForTimeout(delay);
    await page.setViewportSize({ width: 1849, height: 1064 });
    await expect(page.locator(".card-stage")).not.toHaveClass(/flip/);
    await page.waitForTimeout(300);
    expect(await titleSize(page), `re-fit at ${delay}ms`).toBeGreaterThan(
      flat - 1.5,
    );
  }
});
