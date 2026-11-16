import { type Page } from "@playwright/test";
import { test, expect, seed, saved } from "./support";
import { advance } from "../../src/game/engine";
import type { SessionState } from "../../src/game/types";
import { STEP, crawlAt, leagueAt } from "./sessions";

// The tray (2026-11-16): the HUD's belt and the sheet it opens, in both
// skins. Gestures are driven with the mouse, which sends the same pointer
// events a finger does.

const reveal = (s: SessionState) => advance(s);

/** A Quest in the Haunted Crypt: a Rogue at 5 hearts with three items,
 * two lore found, Sir Chad holding a Lucky Coin and a curse laid. */
function questRun() {
  const s = crawlAt(
    "dungeon.skeleton-butler",
    STEP.floor2 + 1,
    {
      hearts: 5,
      loot: ["draught", "shield", "smoke"],
      lore: 2,
      rival: { who: "chad", took: ["die"], won: 1, lost: 2 },
    },
    { adventurer: "rogue" },
  );
  const q = s.quest!;
  const finale = [...q.finale];
  const swap = (id: string, step: number) => {
    const at = finale.indexOf(id);
    if (at >= 0) finale[at] = finale[step];
    finale[step] = id;
  };
  swap("dungeon.hedge-witch", STEP.floor1);
  swap("dungeon.rival-chad", STEP.rival);
  return reveal({
    ...s,
    quest: {
      ...q,
      finale,
      party: { ...q.party!, jinx: "dungeon.hedge-witch" },
    },
  });
}

const tray = (page: Page) => page.locator("dialog.tray");
const shown = (page: Page) => tray(page).locator(".tray-page.shown");

/** Drag from one point to another in small steps, as a finger would. */
async function drag(
  page: Page,
  from: { x: number; y: number },
  to: { x: number; y: number },
  steps = 12,
) {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(to.x, to.y, { steps });
  await page.mouse.up();
}

test("the Quest's belt opens the journal on each segment's page", async ({
  page,
}, info) => {
  await seed(page, questRun());
  const belt = page.locator(".hud-belt");
  await expect(belt).toBeVisible();
  // One belt: the party, the satchel, the lore and the rival; the curse
  // stands beside it as an alert.
  await expect(belt.locator(".belt-seg")).toHaveCount(4);
  await expect(page.locator(".hud-alert.tag-jinx")).toBeVisible();
  await page.screenshot({ path: info.outputPath("belt.png") });

  const cases: [string, string][] = [
    [".tag-party", "The party"],
    [".tag-satchel", "Satchel"],
    [".tag-lore", "Dragon lore"],
    [".tag-rival", "Your rival"],
    [".tag-jinx", "Curse"],
  ];
  for (const [segment, title] of cases) {
    await page.locator(segment).click();
    await expect(page.getByRole("dialog", { name: title })).toBeVisible();
    await expect(
      tray(page).getByRole("tab", { selected: true }),
    ).toHaveAttribute("aria-controls", /./);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  }
});

test("the tray's dock, keys and swipe move between pages", async ({
  page,
}, info) => {
  await seed(page, questRun());
  await page.locator(".tag-party").click();
  const dialog = page.getByRole("dialog", { name: "The party" });
  await expect(dialog).toBeVisible();
  const tabs = tray(page).getByRole("tab");
  await expect(tabs).toHaveCount(6);
  // The dock: a tap.
  await tabs.filter({ hasText: "Map" }).click();
  await expect(page.getByRole("dialog", { name: "The map" })).toBeVisible();
  await expect(shown(page).locator(".quest-map")).toBeVisible();
  // The keys: right and left move along the dock, focus following.
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("dialog", { name: "Dragon lore" })).toBeVisible();
  await expect(tabs.filter({ hasText: "Lore" })).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await expect(page.getByRole("dialog", { name: "The map" })).toBeVisible();
  // The swipe: a drag to the left turns to the next page.
  const view = (await tray(page).locator(".tray-viewport").boundingBox())!;
  const y = view.y + view.height / 2;
  await drag(
    page,
    { x: view.x + view.width * 0.8, y },
    { x: view.x + view.width * 0.2, y },
  );
  await expect(page.getByRole("dialog", { name: "Dragon lore" })).toBeVisible();
  await expect(shown(page).locator(".lore-lines li.found")).toHaveCount(2);
  // A short drag springs back to the page it started on.
  await drag(
    page,
    { x: view.x + view.width * 0.5, y },
    { x: view.x + view.width * 0.55, y },
    20,
  );
  await expect(page.getByRole("dialog", { name: "Dragon lore" })).toBeVisible();
  // Past the first page the drag rubber-bands and stays put.
  await tabs.first().click();
  await drag(
    page,
    { x: view.x + view.width * 0.2, y },
    { x: view.x + view.width * 0.9, y },
  );
  await expect(page.getByRole("dialog", { name: "The party" })).toBeVisible();
  await page.screenshot({ path: info.outputPath("party.png") });
});

test("the tray is pulled down to put it away, or tapped away", async ({
  page,
}) => {
  await seed(page, questRun());
  await page.locator(".tag-satchel").click();
  await expect(tray(page)).toBeVisible();
  const head = (await tray(page).locator(".tray-head").boundingBox())!;
  const from = { x: head.x + 60, y: head.y + head.height / 2 };
  // A small pull settles back.
  await drag(page, from, { x: from.x, y: from.y + 40 });
  await expect(page.getByRole("dialog", { name: "Satchel" })).toBeVisible();
  // A long one puts it away.
  await drag(page, from, { x: from.x, y: from.y + 420 }, 16);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  // The dimmed table above the sheet puts it away too.
  await page.locator(".tag-satchel").click();
  await expect(tray(page)).toBeVisible();
  await page.mouse.click(20, 20);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  // The close button.
  await page.locator(".tag-satchel").click();
  await tray(page).getByRole("button", { name: "Close" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("the satchel's inspector uses and drops what is picked", async ({
  page,
}, info) => {
  await seed(page, questRun());
  await page.locator(".tag-satchel").click();
  const page1 = shown(page);
  // The Rogue's satchel holds four; the potion is picked, ready to drink.
  await expect(page1.locator(".satchel-slot")).toHaveCount(4);
  await expect(page1.locator(".inv-slot.picked")).toHaveAccessibleName(
    "Healing Potion, ready",
  );
  await expect(page1.locator(".inspect-name")).toHaveText("Healing Potion");
  await page.screenshot({ path: info.outputPath("satchel.png") });
  // Pick the shield: it is played from the card, so no Drink here.
  await page1.getByRole("button", { name: "Tower Shield" }).click();
  await expect(page1.locator(".inspect-name")).toHaveText("Tower Shield");
  await expect(page1.getByRole("button", { name: "Drink" })).toHaveCount(0);
  await expect(page1.locator(".inspect-when")).toHaveText(
    "Played from the card when it can help.",
  );
  // Drop asks first.
  await page1.getByRole("button", { name: "Drop Tower Shield" }).click();
  await page1.getByRole("button", { name: "Yes, drop Tower Shield" }).click();
  await expect
    .poll(async () => (await saved(page)).quest.party.loot)
    .toEqual(["draught", "smoke"]);
  // Back to the potion: drink it.
  await page1.getByRole("button", { name: /^Healing Potion/ }).click();
  await page1.getByRole("button", { name: "Drink" }).click();
  await expect
    .poll(async () => (await saved(page)).quest.party.hearts)
    .toBeGreaterThan(5);
});

test("the League's gear: the team, the bag and the badge case", async ({
  page,
}, info) => {
  const PIDGEY = "pokemon.route-pidgey";
  const s = leagueAt("pokemon.route-oddish", {}, 0, "pokemon.starter-squirtle");
  const q = s.quest!;
  const finale = [...q.finale];
  const swap = (at: number, id: string) => {
    const was = finale.indexOf(id);
    if (was >= 0) finale[was] = finale[at];
    finale[at] = id;
  };
  swap(q.step, PIDGEY);
  swap(q.step + 1, "pokemon.route-oddish");
  await seed(
    page,
    reveal({
      ...s,
      discarded: q.step + 1,
      previousId: PIDGEY,
      quest: {
        ...q,
        finale,
        step: q.step + 1,
        party: { ...q.party!, team: [PIDGEY], hearts: 9, loot: ["shield"] },
      },
    }),
  );
  const belt = page.locator(".hud-league .hud-belt");
  await expect(belt).toBeVisible();
  // The team as balls: the lead, Pidgey, an open place.
  await expect(belt.locator(".belt-balls .ball")).toHaveCount(3);
  await expect(belt.locator(".belt-balls .ball.open")).toHaveCount(1);
  await page.locator(".tag-party").click();
  const team = page.getByRole("dialog", { name: "The team" });
  await expect(team).toBeVisible();
  await expect(shown(page).locator(".crawl-omen strong")).toHaveText(
    "Squirtle",
  );
  await expect(shown(page).locator(".lg-slot")).toHaveCount(2);
  await expect(page.getByRole("img", { name: "Team HP: 9 of 16" })).toHaveCount(
    1,
  );
  await page.screenshot({ path: info.outputPath("team.png") });
  // The type edge on the battle face up lights the Types tab.
  await expect(tray(page).getByRole("tab", { name: /Types/ })).toHaveClass(
    /alert/,
  );
  // Release asks first, then lets Pidgey go.
  await shown(page).getByRole("button", { name: "Release Pidgey" }).click();
  await shown(page)
    .getByRole("button", { name: "Yes, release Pidgey" })
    .click();
  await expect
    .poll(async () => (await saved(page)).quest.party.team)
    .toBeUndefined();
  await tray(page)
    .getByRole("tab", { name: /Badges/ })
    .click();
  await expect(page.getByRole("dialog", { name: "Badges" })).toBeVisible();
  await expect(shown(page).locator(".crawl-badges")).toHaveAccessibleName(
    "Badges: 0 of 8",
  );
  await page.screenshot({ path: info.outputPath("badges.png") });
});
