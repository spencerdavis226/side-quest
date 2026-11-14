import { test, expect, seedStorage } from "./support";
import { emptyChronicle, type Chronicle } from "../../src/game/engine";
import { PARTY_HEARTS } from "../../src/content/dungeon/shared";

// The Chronicle (The Quest 2.0 Phase 7): The Quest's record across runs,
// under its own key. It survives a reload, a malformed one resets alone,
// and a session never depends on it.
const CHRONICLE = "side-quest.chronicle.v1";
const SETTINGS = "side-quest.settings.v1";
const SESSION = "side-quest.session.v1";
const quest = JSON.stringify({
  config: { version: 1, packIds: ["dungeon"], limit: null, quest: "dungeon" },
  choice: "quest",
});
const record: Chronicle = {
  ...emptyChronicle(),
  played: 2,
  won: 1,
  slain: { "dungeon.last-call-lich": 1 },
  fellTo: { "dungeon.two-am-kebab": 1 },
  feats: ["by-a-thread"],
  ballads: [
    {
      at: "2026-11-14T21:00:00.000Z",
      won: true,
      lines: ["A Barbarian answered the call,", "and slew Emberfang."],
    },
  ],
};

test("the Chronicle opens from setup, and Heroic starts a harder run", async ({
  page,
}) => {
  await seedStorage(page, {
    [SETTINGS]: quest,
    [CHRONICLE]: JSON.stringify(record),
  });
  const heroic = page.getByRole("button", { name: /Heroic/ });
  await expect(heroic).toHaveAttribute("aria-pressed", "false");
  const play = page.getByRole("button", { name: "Play", exact: true });
  await expect(play).toBeInViewport();
  await page.getByRole("button", { name: /Chronicle/ }).click();
  const book = page.getByRole("dialog", { name: "Chronicle" });
  await expect(book.getByText("Emberfang", { exact: true })).toBeVisible();
  await expect(book.getByText("By a Thread")).toBeVisible();
  await expect(book.getByText("and slew Emberfang.")).toBeVisible();
  // The Dragon King is still a silhouette, until everything is unlocked.
  await expect(book.getByText("The Dragon King", { exact: true })).toHaveCount(
    0,
  );
  await book.getByRole("button", { name: /Unlock everything/ }).click();
  await book
    .getByRole("button", { name: "Unlock everything", exact: true })
    .click();
  await expect(
    book.getByText("The Dragon King", { exact: true }),
  ).toBeVisible();
  await book.getByRole("button", { name: "Done" }).click();
  await heroic.click();
  await expect(heroic).toHaveAttribute("aria-pressed", "true");
  await play.click();
  await expect(page.locator(".card-stage")).toBeVisible();
  const saved = await page.evaluate(
    ([s, c]) => [
      JSON.parse(localStorage.getItem(s)!),
      JSON.parse(localStorage.getItem(c)!),
    ],
    [SESSION, CHRONICLE],
  );
  expect(saved[0].config.heroic).toBe(true);
  expect(saved[0].quest.party.hearts).toBe(PARTY_HEARTS - 2);
  expect(JSON.stringify(saved[0])).not.toMatch(/chronicle/i);
  expect(saved[1]).toMatchObject({ played: 2, unlockedAll: true });
  // A reload keeps the record.
  await page.reload();
  expect(
    await page.evaluate(
      (c) => JSON.parse(localStorage.getItem(c)!).unlockedAll,
      CHRONICLE,
    ),
  ).toBe(true);
});

test("a malformed Chronicle resets alone", async ({ page }) => {
  await seedStorage(page, {
    [SETTINGS]: quest,
    [CHRONICLE]: '{"version":1,"played":"lots"}',
  });
  await expect(
    page.getByRole("button", { name: "Play", exact: true }),
  ).toBeVisible();
  // No record, so no Chronicle and no Heroic yet; the settings stand.
  await expect(page.getByRole("button", { name: /Chronicle/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Heroic/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /The Quest/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(
    await page.evaluate((c) => localStorage.getItem(c), CHRONICLE),
  ).toBeNull();
});
