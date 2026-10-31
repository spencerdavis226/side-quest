import { test, expect } from "./support";

test("the screen stays awake only while a game is active", async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __locks: { released: boolean }[] };
    w.__locks = [];
    Object.defineProperty(navigator, "wakeLock", {
      configurable: true,
      value: {
        request: async () => {
          const lock = {
            released: false,
            release: async () => {
              lock.released = true;
            },
            addEventListener: () => {},
          };
          w.__locks.push(lock);
          return lock;
        },
      },
    });
  });
  await page.goto("./");
  const state = () =>
    page.evaluate(() => {
      const locks = (window as unknown as { __locks: { released: boolean }[] })
        .__locks;
      return {
        total: locks.length,
        held: locks.filter((l) => !l.released).length,
      };
    });
  expect(await state()).toEqual({ total: 0, held: 0 });
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(page.locator(".progress")).toBeVisible();
  await expect.poll(state).toEqual({ total: 1, held: 1 });
  await page.getByRole("button", { name: "Open game menu" }).click();
  await page.getByRole("button", { name: "End game" }).first().click();
  await page.getByRole("button", { name: "End game" }).last().click();
  await expect.poll(state).toMatchObject({ held: 0 });
});
