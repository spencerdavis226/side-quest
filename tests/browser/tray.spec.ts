import { type Page } from "@playwright/test";
import { test, expect, seed, saved, frames } from "./support";
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
/** Drag from one point to another at a finger's pace: one step a rendered
 * frame. Playwright's own `steps` fire with no pause (in WebKit, 12 steps
 * in about 40 ms), which reads as a flick, and a flick dismisses or turns
 * the page, as it does on an iPhone. */
async function drag(
  page: Page,
  from: { x: number; y: number },
  to: { x: number; y: number },
  steps = 12,
) {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  for (let i = 1; i <= steps; i++) {
    await page.mouse.move(
      from.x + ((to.x - from.x) * i) / steps,
      from.y + ((to.y - from.y) * i) / steps,
    );
    await frames(page, 1);
  }
  await page.mouse.up();
}

test("the Quest's HUD opens the journal on each mark's page", async ({
  page,
}, info) => {
  await seed(page, questRun());
  // The bar: the hearts, the place, the menu. The status line: marks and
  // numbers only, and the curse as a mark with no name.
  const hud = page.locator(".crawl-hud.qh");
  await expect(hud).toBeVisible();
  const status = hud.locator(".hud-strip");
  await expect(status.locator(".hud-stat")).toHaveCount(5);
  await expect(status.locator(".tag-satchel")).toHaveText("3");
  await expect(status.locator(".tag-lore")).toHaveText("2");
  const curse = status.locator(".tag-jinx");
  await expect(curse).toHaveText("");
  await expect(curse).toHaveAccessibleName("Curse: Toad Voice");
  await page.screenshot({ path: info.outputPath("hud.png") });

  const cases: [string, string][] = [
    [".tag-party", "The party"],
    [".tag-satchel", "Satchel"],
    [".tag-lore", "Dragon lore"],
    [".tag-rival", "Your rival"],
    [".tag-jinx", "Curse"],
    [".crawl-progress", "The map"],
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
  // Four opens and two drags at a finger's pace: about 12 s in WebKit on
  // one core, past the default 30 s when four WebKit workers share them.
  test.setTimeout(60_000);
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
  // There is no close button: the grabber is the button named Close.
  await page.locator(".tag-satchel").click();
  await expect(tray(page).locator(".tray-close")).toHaveCount(0);
  const close = tray(page).getByRole("button", { name: "Close" });
  await expect(close).toHaveClass(/sheet-grab/);
  // Its band is a full-width pull zone, 36px tall.
  const band = (await close.boundingBox())!;
  const sheet = (await tray(page).locator(".tray-sheet").boundingBox())!;
  expect(band.width).toBeGreaterThanOrEqual(sheet.width - 1);
  expect(band.height).toBeGreaterThanOrEqual(36);
  await close.click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

/** A one-finger touch drag, as Safari reports it: touch events on the
 * element under the finger, one move a frame. WebKit will not construct a
 * `Touch` ("Illegal constructor"), so each event is a plain event carrying
 * the fields a real one has, which is all the sheet reads. */
async function touchDrag(
  page: Page,
  selector: string,
  from: { x: number; y: number },
  to: { x: number; y: number },
  steps = 12,
) {
  await page.evaluate(
    ({ selector, from, to, steps }) =>
      new Promise<void>((done) => {
        const target = document.querySelector(selector)!;
        const fire = (type: string, x: number, y: number) => {
          const t = { identifier: 1, target, clientX: x, clientY: y };
          const event = new Event(type, { bubbles: true, cancelable: true });
          const live = type === "touchend" ? [] : [t];
          Object.defineProperties(event, {
            touches: { value: live },
            targetTouches: { value: live },
            changedTouches: { value: [t] },
          });
          target.dispatchEvent(event);
        };
        fire("touchstart", from.x, from.y);
        let i = 0;
        const step = () => {
          i += 1;
          if (i > steps) {
            fire("touchend", to.x, to.y);
            done();
            return;
          }
          fire(
            "touchmove",
            from.x + ((to.x - from.x) * i) / steps,
            from.y + ((to.y - from.y) * i) / steps,
          );
          requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }),
    { selector, from, to, steps },
  );
}

test("a page pulls the tray down from its top, and scrolls when it is not", async ({
  page,
}) => {
  await seed(page, questRun());
  await page.locator(".tag-party").click();
  await expect(page.getByRole("dialog", { name: "The party" })).toBeVisible();
  const content = ".tray-page.shown .qt-hero";
  const box = (await shown(page).locator(".qt-hero").boundingBox())!;
  const from = { x: box.x + box.width / 2, y: box.y + 20 };
  // Scrolled down, a downward drag is the page's own: the tray stays.
  await shown(page).evaluate((el) => {
    el.scrollTop = 40;
  });
  await touchDrag(page, content, from, { x: from.x, y: from.y + 400 });
  await expect(page.getByRole("dialog", { name: "The party" })).toBeVisible();
  // At its top, the same drag takes the sheet with it, and away.
  await shown(page).evaluate((el) => {
    el.scrollTop = 0;
  });
  await touchDrag(page, content, from, { x: from.x, y: from.y + 400 });
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("each crawl's menu is its own sheet, and asks before ending", async ({
  page,
}, info) => {
  await seed(page, questRun());
  await page.getByRole("button", { name: "Open game menu" }).click();
  const menu = page.getByRole("dialog", { name: "Paused" });
  await expect(menu).toBeVisible();
  await expect(menu).toHaveClass(/tray-quest/);
  await expect(menu.getByRole("button", { name: "How to play" })).toBeVisible();
  await page.screenshot({ path: info.outputPath("menu.png") });
  // End game asks on the sheet itself; Keep playing goes back.
  await menu.getByRole("button", { name: "End game" }).click();
  const ask = page.getByRole("dialog", { name: "Call it a night?" });
  await expect(ask).toBeVisible();
  await ask.getByRole("button", { name: "Keep playing" }).click();
  await expect(page.getByRole("dialog", { name: "Paused" })).toBeVisible();
  // Pulled down, it goes.
  const head = (await menu.locator(".tray-head").boundingBox())!;
  const from = { x: head.x + 80, y: head.y + head.height / 2 };
  await drag(page, from, { x: from.x, y: from.y + 360 }, 16);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  // And it ends the game when asked twice.
  await page.getByRole("button", { name: "Open game menu" }).click();
  await page
    .getByRole("dialog", { name: "Paused" })
    .getByRole("button", { name: "End game" })
    .click();
  await page
    .getByRole("dialog", { name: "Call it a night?" })
    .getByRole("button", { name: "End game" })
    .click();
  await expect(
    page.getByRole("button", { name: "Play", exact: true }),
  ).toBeVisible();
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
  const hud = page.locator(".crawl-hud.lh");
  await expect(hud).toBeVisible();
  // The status line: the team (Pidgey of two), the bag, the badges, and the
  // type edge as a mark alone.
  await expect(hud.locator(".tag-party")).toHaveText("1/2");
  await expect(hud.locator(".tag-satchel")).toHaveText("1");
  await expect(hud.locator(".tag-badges")).toHaveText("0");
  await expect(hud.locator(".tag-edge")).toHaveText("");
  // The pause menu is the device's.
  await page.getByRole("button", { name: "Open game menu" }).click();
  await expect(page.getByRole("dialog", { name: "Paused" })).toHaveClass(
    /tray-league/,
  );
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
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

// The owner's iPhone (2026-11-16): the menu rose into the Dynamic Island.
// In the installed app the fixed box is one status-bar inset shorter than
// --app-height (100lvh), and the sheet's height was taken from that. Pose
// the same: a 59px inset (an iPhone 15 Pro) and an --app-height one inset
// taller than the visible box. The sheet's top must clear the inset.
test("a sheet's top clears the status bar and the Dynamic Island", async ({
  page,
}) => {
  await page.setViewportSize({ width: 393, height: 793 });
  await seed(page, questRun());
  await page.addStyleTag({
    content: ":root { --top-safe: 59px; --app-height: calc(100vh + 59px) }",
  });
  const clear = async () => {
    const box = (await page.locator(".tray-sheet").boundingBox())!;
    expect(box.y).toBeGreaterThanOrEqual(59 + 8);
    expect(box.y + box.height).toBeLessThanOrEqual(793 + 1);
  };
  await page.locator(".tag-satchel").click();
  await expect(tray(page)).toBeVisible();
  await clear();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Open game menu" }).click();
  await expect(page.getByRole("dialog", { name: "Paused" })).toBeVisible();
  await clear();
});
