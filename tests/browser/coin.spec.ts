import { readFileSync } from "node:fs";
import { expect, saved, seed, test } from "./support";

// The coin (The Quest 2.1): a coin card flips by tapping the card like a
// dice card, and the card names the face. Reduced Motion (the default here)
// reveals the saved face at once; the flip itself is a WebGL stage that
// needs a phone to judge.
const fixture = (name: string) =>
  JSON.parse(
    readFileSync(`tests/fixtures/saves/2026-11-14-${name}.json`, "utf8"),
  );

test("a coin card flips on a tap and names the face", async ({ page }) => {
  const save = fixture("core-coin-flipped");
  await seed(page, { ...save, roll: null });
  await page.goto("./");
  await page.locator(".game-card").click();
  const face = page.locator(".dice-result-face.coin-result");
  await expect(face).toBeVisible();
  const roll = (await saved(page)).roll;
  await expect(face).toHaveText(roll.values[0] === 2 ? "Heads" : "Tails");
  await expect(page.locator(".dice-result-equation")).toHaveAccessibleName(
    roll.values[0] === 2 ? "Flipped heads" : "Flipped tails",
  );
});

test("the dragon's contest ends on the coin, and its gem says heads", async ({
  page,
}) => {
  const save = fixture("realms-contest-coin");
  await seed(page, { ...save, roll: null });
  await page.goto("./");
  await expect(
    page.locator(".game-card .stake-target"),
  ).toHaveAccessibleName("Flip heads to win");
  await page.locator(".game-card").click();
  await expect(page.locator(".dice-result-face.coin-result")).toBeVisible();
});
