import { type Page } from "@playwright/test";
import { test, expect, seed, saved } from "./support";
import { advance, currentCard, finaleStage } from "../../src/game/engine";
import { returnToCard, rollDice } from "../../src/game/dice";
import type { SessionState } from "../../src/game/types";
import { cards } from "../../src/content/catalog";
import { PARTY_HEARTS as H } from "../../src/content/dungeon/shared";
import { STEP, crawlAt } from "./sessions";
const reveal = (s: SessionState) => advance(s);
const rolled = (s: SessionState, face: number) =>
  returnToCard(rollDice(s, () => (face - 0.5) / currentCard(s).dice!.sides));
const meter = (page: Page) => page.locator(".crawl-meter");
const full = new RegExp(`^Hearts: ${H} of ${H}`);

test("@release Pub Crawl opens on an adventurer and tonight's omen, then the queue", async ({
  page,
}, info) => {
  await page.goto("./");
  await page.getByRole("button", { name: /^Pub Crawl/ }).click();
  await expect(page.locator(".crawl-brief")).toContainText("Dungeon night");
  await expect(page.locator(".crawl-brief")).toContainText("3 floors");
  await expect(page.getByRole("button", { name: /^Choose packs/ })).toHaveCount(
    0,
  );
  await page.screenshot({ path: info.outputPath("setup.png") });
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(meter(page)).toHaveAccessibleName(
    new RegExp(`^Hearts: ${H} of ${H}\\. Your adventurer`),
  );
  await expect(page.locator(".crawl-progress")).toHaveAccessibleName(
    "Your adventurer",
  );
  await expect(page.locator(".stage-banner")).toHaveText(
    /Pub Crawl\s*Who's going down tonight\?/,
  );
  // The banner is read out through the page's one waiting live region.
  const spoken = page
    .getByRole("status")
    .and(page.locator("#banner-announcer"));
  await expect(spoken).toHaveText("Pub Crawl. Who's going down tonight?");
  await expect(page.locator(".stage-banner")).toHaveAttribute(
    "aria-hidden",
    "true",
  );
  await page.locator(".game-card").click();
  await expect(page.locator(".game-card .card-ribbon")).toHaveText(
    "Your adventurer",
  );
  await page.screenshot({ path: info.outputPath("adventurer.png") });
  await page.locator(".game-card").click();
  await expect(page.locator(".crawl-progress")).toHaveAccessibleName(
    "Tonight's omen",
  );
  await page.locator(".game-card").click();
  await expect(page.locator(".game-card .card-ribbon")).toHaveText(
    "Tonight's omen",
  );
  await page.screenshot({ path: info.outputPath("omen.png") });
  await page.locator(".game-card").click();
  await expect(page.locator(".crawl-progress")).toHaveAccessibleName(
    "The Queue",
  );
  await expect(page.locator(".stage-banner")).toHaveText(
    /Pub Crawl\s*The Quarter-Zips cut in/,
  );
  await expect(spoken).toHaveText(/^Pub Crawl\. The Quarter-Zips cut in/);
  const s = await saved(page);
  expect(s.config.packIds).toEqual(["dungeon"]);
  expect(s.quest.party.omen).toBe(s.quest.finale[0]);
  // The class's starting gear (2026-10-25), if it has one, then the omen.
  const kit = cards.find((c) => c.id === s.quest.finale[0])?.kit;
  expect(s.quest.party.boons).toEqual([
    ...(kit ? [`${s.quest.finale[0]}#k`] : []),
    s.quest.finale[1],
  ]);
});

test("@release a monster shows its stakes; a smoke bomb flees it", async ({
  page,
}, info) => {
  const goblin = crawlAt("dungeon.drunk-goblin", STEP.floor1, {
    loot: ["smoke"],
  });
  // The room after it is an ordinary one: an ambush would read "Ambush in
  // room 2 of 8" instead.
  const q = goblin.quest!;
  const next = q.stages[finaleStage(q).stage].cards.find(
    (c) => !c.hits && c.id !== currentCard(goblin).id,
  )!;
  const finale = [...q.finale];
  const at = finale.indexOf(next.id);
  if (at >= 0) finale[at] = finale[STEP.floor1 + 1];
  finale[STEP.floor1 + 1] = next.id;
  await seed(page, reveal({ ...goblin, quest: { ...q, finale } }));
  const face = page.locator(".game-card .study-face");
  await expect(face.locator(".stake-loss")).toHaveAccessibleName(
    "Losing costs 1 heart",
  );
  await expect(face.locator(".stake-loot")).toHaveAccessibleName(
    "Winning finds a Smoke Bomb",
  );
  const flee = page.getByRole("button", { name: /^Use the Smoke Bomb/ });
  await expect(flee).toBeVisible();
  await expect(page.locator(".tag-satchel")).toHaveAccessibleName(
    "Satchel: Smoke Bomb",
  );
  await page.screenshot({ path: info.outputPath("monster.png") });
  await flee.click();
  await expect(page.locator(".crawl-progress")).toHaveAccessibleName(
    /^Room 2 of 8/,
  );
  const s = await saved(page);
  expect(s.quest.party).toMatchObject({ hearts: H, loot: [] });
  expect(s.quest.step).toBe(STEP.floor1 + 1);
});

// A levelled Rogue's five-slot satchel and a jinx on the narrowest phones:
// every chip stays on screen.
for (const width of [320, 375])
  test(`a full strip fits at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 700 });
    const s = crawlAt(
      "dungeon.bone-sommelier",
      STEP.floor2 + 1,
      {
        loot: ["draught", "shield", "die", "smoke", "draught"],
        // The Shadow, the Rogue's second level.
        form: 2,
      },
      { adventurer: "rogue" },
    );
    const q = s.quest!;
    const finale = [...q.finale];
    const at = finale.indexOf("dungeon.goblin-shaman");
    if (at >= 0) finale[at] = finale[STEP.floor1];
    finale[STEP.floor1] = "dungeon.goblin-shaman";
    await seed(page, {
      ...s,
      quest: {
        ...q,
        finale,
        party: { ...q.party!, jinx: "dungeon.goblin-shaman" },
      },
    });
    const chips = page.locator(".hud-strip .hud-chip");
    await expect(chips).toHaveCount(2);
    for (const box of await chips.evaluateAll((els) =>
      els.map((e) => e.getBoundingClientRect().toJSON()),
    )) {
      expect(box.left).toBeGreaterThanOrEqual(8);
      expect(box.right).toBeLessThanOrEqual(width - 8);
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(width);
  });

test("a loaded die rerolls a lost fight", async ({ page }, info) => {
  await seed(
    page,
    rolled(
      reveal(crawlAt("dungeon.ex-wraith", STEP.floor2, { loot: ["die"] })),
      2,
    ),
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

test("pushing your luck: cash out, or go again for the next prize", async ({
  page,
}, info) => {
  const won = rolled(
    reveal(crawlAt("dungeon.one-armed-bandit", STEP.floor1 + 1)),
    15,
  );
  await seed(page, won);
  const plaques = page.locator(".card-choice.press .card-choice-option");
  await expect(plaques).toHaveCount(2);
  await expect(plaques.nth(0)).toHaveAccessibleName("Cash out: Loaded Die");
  await expect(page.locator(".game-card .stake-prizes")).toHaveAccessibleName(
    "Prizes, one a win: Loaded Die, then Healing Draught, then Coaster Shield; 0 banked",
  );
  await page.screenshot({ path: info.outputPath("press.png") });
  await plaques.nth(1).click();
  await expect(page.locator(".game-card")).toHaveAccessibleName(/^Roll 1d20/);
  expect((await saved(page)).quest.party.press).toBe(1);
  // Cashing out takes the prize and moves on.
  await seed(page, won);
  await plaques.nth(0).click();
  await expect(page.locator(".tag-satchel")).toHaveAccessibleName(
    "Satchel: Loaded Die",
  );
  const s = await saved(page);
  expect(s.quest.party.loot).toEqual(["die"]);
  expect(s.quest.step).toBe(STEP.floor1 + 2);
});

test("a Bar Tab passes a lost fight's drinks to someone else", async ({
  page,
}, info) => {
  await seed(
    page,
    rolled(
      reveal(crawlAt("dungeon.ex-wraith", STEP.floor2, { loot: ["round"] })),
      2,
    ),
  );
  const pass = page.getByRole("button", { name: /^Use the Bar Tab/ });
  await expect(pass).toHaveText("Pass it");
  await page.screenshot({ path: info.outputPath("bar-tab.png") });
  await pass.click();
  await expect(page.locator(".news-banner")).toHaveText(
    /Bar Tab\s*Point at someone\s*This fight's drinks are theirs\./,
  );
  await expect(pass).toHaveCount(0);
  const s = await saved(page);
  expect(s.quest.party).toMatchObject({ loot: [], passed: STEP.floor2 });
});

test("a trial is settled with plaques; a loss costs hearts", async ({
  page,
}, info) => {
  await seed(page, reveal(crawlAt("dungeon.tomb-of-silence", STEP.floor2 + 1)));
  await expect(
    page.getByRole("button", { name: "Won", exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: info.outputPath("trial.png") });
  await page.getByRole("button", { name: "Lost", exact: true }).click();
  await expect(meter(page)).toHaveAccessibleName(
    new RegExp(`^Hearts: ${H - 2} of ${H}`),
  );
  await expect(page.locator(".crawl-meter strong")).toHaveText(`${H - 2}`);
});

test("a boss shows its wounds, its trinket, and comes back until it falls", async ({
  page,
}, info) => {
  let s = reveal(
    crawlAt("dungeon.hangover-hydra", STEP.boss2, { hits: 1, rounds: 1 }),
  );
  s = { ...s, discarded: STEP.boss2 + 1 };
  await seed(page, s);
  await expect(page.locator(".crawl-progress")).toHaveAccessibleName(
    "Boss: 1 of 2 hits",
  );
  await expect(page.locator(".game-card .card-ribbon")).toHaveText(
    "Catacombs · Boss",
  );
  await expect(page.locator(".game-card .stake-trinket")).toHaveAccessibleName(
    "Felling it offers a trinket: Hydra Tooth or Hydra Scale",
  );
  await page.screenshot({ path: info.outputPath("boss.png") });
  // The last swing lands: the spoils sheet opens by itself (2026-10-25).
  // The party wears Royal Jelly Shot, a weapon from the Cellar's Keg Mimic
  // Queen, dealt on the first floor.
  const finale = [...s.quest!.finale];
  const queen = "dungeon.keg-mimic-queen";
  const at = finale.indexOf(queen);
  if (at >= 0) finale[at] = finale[STEP.floor1 + 1];
  finale[STEP.floor1 + 1] = queen;
  const won = rolled(
    {
      ...s,
      quest: {
        ...s.quest!,
        finale,
        party: { ...s.quest!.party!, boons: [`${queen}#1`] },
      },
    },
    18,
  );
  await seed(page, won);
  const sheet = page.getByRole("dialog", { name: "Spoils" });
  const rows = sheet.locator(".spoils-row");
  await expect(rows).toHaveCount(2);
  await expect(rows.nth(0)).toHaveAccessibleName(
    "Take the Hydra Tooth, Weapon: +2 to boss d20s. Replaces Royal Jelly Shot: +1 to monster d20s.",
  );
  // What it would replace shows as its own small card: its name and what
  // it does now (its Healing Draught was handed out when it was taken).
  await expect(rows.nth(0).locator(".spoils-worn")).toHaveText(
    "ReplacesRoyal Jelly Shot+1 to monster d20s.",
  );
  await expect(rows.nth(1).locator(".spoils-worn")).toHaveCount(0);
  await expect(rows.nth(1)).toHaveAccessibleName(
    "Take the Hydra Scale, Armor: +2 max hearts.",
  );
  await expect(sheet.locator(".spoils-keep")).toHaveText("Keep my gear");
  await page.screenshot({ path: info.outputPath("spoils.png") });
  // Closed, it waits on the card's one plaque; a stray tap does nothing.
  await page.keyboard.press("Escape");
  await expect(sheet).toHaveCount(0);
  await page.locator(".game-card").click({ force: true });
  expect((await saved(page)).quest.step).toBe(STEP.boss2);
  const plaque = page.locator(".card-choice.spoils .card-choice-option");
  await expect(plaque).toHaveCount(1);
  await plaque.click();
  await rows.nth(0).click();
  await expect(page.locator(".news-banner")).toHaveText(
    /Trinket found\s*Hydra Tooth\s*\+2 to boss d20s\./,
  );
  await expect(page.locator(".crawl-progress")).toHaveAccessibleName(
    "The Lower Landing",
  );
  await page.screenshot({ path: info.outputPath("trinket.png") });
  // The Tooth replaced the Shot.
  expect((await saved(page)).quest.party.boons).toEqual([
    "dungeon.hangover-hydra#0",
  ]);
  // The bag lists it as gear, with its slot.
  await page.locator(".tag-satchel").click();
  const bag = page.getByRole("dialog", { name: "Satchel" });
  await expect(bag.locator(".crawl-gear .bag-name")).toHaveText(
    "Hydra ToothWeapon",
  );
  await page.keyboard.press("Escape");
  await meter(page).click();
  await expect(
    page.getByRole("dialog", { name: "The party" }).locator(".crawl-gear"),
  ).toHaveCount(0);
});

test("a lost fight can lay a jinx, shown on the meter and in a banner", async ({
  page,
}, info) => {
  await seed(
    page,
    rolled(reveal(crawlAt("dungeon.goblin-shaman", STEP.floor1)), 2),
  );
  await expect(page.locator(".game-card .stake-jinx")).toHaveAccessibleName(
    "Losing lays a jinx: Goblin Tongue",
  );
  await page.locator(".game-card").click();
  await expect(page.locator(".news-banner")).toHaveText(
    /Jinxed!\s*Goblin Tongue\s*The jinxed player speaks of themself/,
  );
  await expect(page.locator(".tag-jinx")).toBeVisible();
  await expect(meter(page)).toHaveAccessibleName(/Jinx: Goblin Tongue/);
  await page.screenshot({ path: info.outputPath("jinx.png") });
});

test("with Reduce Motion a banner fades and goes, and the splat stays centred", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await seed(
    page,
    rolled(reveal(crawlAt("dungeon.goblin-shaman", STEP.floor1)), 2),
  );
  await page.locator(".game-card").click();
  const banner = page.locator(".news-banner");
  await expect(banner).toHaveText(/Jinxed!\s*Goblin Tongue/);
  // The banner fades rather than vanishing at once: still shown a moment
  // in. Every running animation is held at 400 ms in (rather than sleeping
  // 400 ms, which a slow runner can overshoot), then let go.
  const held = await page.evaluate(() => {
    const running = document
      .getAnimations()
      .filter(
        (a) =>
          a.playState === "running" &&
          Number(a.effect?.getComputedTiming().endTime) > 400,
      );
    for (const a of running) {
      a.pause();
      a.currentTime = 400;
    }
    (window as unknown as { __held: Animation[] }).__held = running;
    return running.length;
  });
  expect(held).toBeGreaterThan(0);
  await expect(banner.locator(".stage-banner-cloth")).not.toHaveCSS(
    "opacity",
    "0",
  );
  // The lost hearts float off the heart, centred on it.
  const [splat, heart] = await Promise.all([
    page.locator(".heart-splat").boundingBox(),
    meter(page).boundingBox(),
  ]);
  await page.evaluate(() => {
    for (const a of (window as unknown as { __held: Animation[] }).__held)
      a.play();
  });
  expect(
    Math.abs(splat!.x + splat!.width / 2 - (heart!.x + heart!.width / 2)),
  ).toBeLessThanOrEqual(1);
  expect(
    Math.abs(splat!.y + splat!.height / 2 - (heart!.y + heart!.height / 2)),
  ).toBeLessThanOrEqual(1);
  // Before 2026-10-18 no animation ran at all, so the banner never left.
  await expect(banner).toHaveCount(0, { timeout: 8000 });
  await expect(page.locator(".tag-jinx")).toBeVisible();
});

test("a landing levels the adventurer up for drinks, or rests", async ({
  page,
}, info) => {
  await seed(
    page,
    reveal(
      crawlAt(
        "dungeon.landing-stairwell",
        STEP.landing1,
        {},
        { adventurer: "barbarian" },
      ),
    ),
  );
  // The level up names the next level, beside the rest.
  const plaques = page.locator(".card-choice.offers .card-choice-option");
  await expect(plaques).toHaveCount(2);
  await expect(plaques.nth(0)).toHaveAccessibleName(
    "Berserker · drink 3: your adventurer levels up into Berserker",
  );
  await expect(plaques.nth(1)).toHaveAccessibleName("Rest: 3 hearts back");
  await page.screenshot({ path: info.outputPath("landing.png") });
  await plaques.nth(0).click();
  await expect(page.locator(".evolution-banner")).toHaveText(
    /Barbarian levels up!\s*Berserker\s*\+2 max hearts\. \+2 to elite and boss d20s\./,
  );
  // Two banners at once, the level-up and the hidden room: both are read.
  const spoken = page.locator("#banner-announcer");
  await expect(spoken).toContainText(
    "Barbarian levels up! Berserker. +2 max hearts. +2 to elite and boss d20s.",
  );
  await expect(spoken).toContainText(
    "Behind the bookcase. Wanted: The Proprietor",
  );
  // Next comes the hidden room behind the bookcase; its banner names the
  // keeper waiting inside.
  const s = await saved(page);
  await expect(page.locator(".stage-banner:not(.evolution-banner)")).toHaveText(
    /Behind the bookcase\s*Wanted: The Proprietor/,
  );
  await page.screenshot({ path: info.outputPath("level-up.png") });
  expect(s.quest.party).toMatchObject({ form: 1, max: H + 2 });
});

// One line of levels (2026-10-31): the plaques read at a glance on a
// 320px phone, and the second landing offers the next level.
test("a level up reads at 320px, then the line goes on", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await seed(
    page,
    reveal(
      crawlAt(
        "dungeon.landing-stairwell",
        STEP.landing1,
        {},
        { adventurer: "barbarian" },
      ),
    ),
  );
  const plaques = page.locator(".card-choice.offers .card-choice-option");
  await expect(plaques).toHaveCount(2);
  // Every plaque's name and line fit, and each is a full touch target.
  for (let i = 0; i < 2; i++) {
    const box = (await plaques.nth(i).boundingBox())!;
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(320);
    const clipped = await plaques
      .nth(i)
      .locator(".offer-name, .offer-price")
      .evaluateAll((els) =>
        els.some((el) => el.scrollWidth > el.clientWidth + 1),
      );
    expect(clipped, `plaque ${i}`).toBe(false);
  }
  await page.screenshot({ path: info.outputPath("level-up-320.png") });
  const second = crawlAt(
    "dungeon.landing-boiler-room",
    STEP.landing2,
    { form: 1 },
    { adventurer: "barbarian" },
  );
  await seed(page, reveal(second));
  await expect(plaques).toHaveCount(2);
  await expect(plaques.nth(0)).toHaveAccessibleName(
    "Warlord · drink 3: your adventurer levels up into Warlord",
  );
  await plaques.nth(0).click();
  await expect(page.locator(".evolution-banner")).toHaveText(
    /Berserker levels up!\s*Warlord/,
  );
  expect((await saved(page)).quest.party).toMatchObject({ form: 2 });
});

// Mishaps (2026-10-31): Pub Crawl's rooms with no roll read one line and
// cost no hearts.
test("a mishap reads its one line and costs no hearts", async ({ page }) => {
  const barback = cards.find((c) => c.id === "dungeon.skeleton-barback")!;
  expect(barback.strike).toBeUndefined();
  await seed(
    page,
    reveal(
      crawlAt(barback.id, STEP.floor1, { hearts: 8 }, { adventurer: "rogue" }),
    ),
  );
  await expect(page.locator(".game-card .study-rules")).toContainText(
    barback.rules,
  );
  await expect(page.locator(".game-card .stake-loss")).toHaveCount(0);
  await page.locator(".game-card").click();
  await expect
    .poll(async () => (await saved(page)).quest.step)
    .toBe(STEP.floor1 + 1);
  expect((await saved(page)).quest.party.hearts).toBe(8);
});

test("a Dog-Eared Tome levels the adventurer up from the satchel", async ({
  page,
}) => {
  await seed(
    page,
    reveal(
      crawlAt(
        "dungeon.drunk-goblin",
        STEP.floor1,
        { loot: ["candy"] },
        { adventurer: "wizard" },
      ),
    ),
  );
  await page.locator(".tag-satchel").click();
  const read = page.getByRole("dialog").locator(".satchel-use");
  await expect(read).toHaveCount(1);
  await expect(read).toHaveText("Read");
  await read.click();
  await expect.poll(async () => (await saved(page)).quest.party.form).toBe(1);
});

test("the party dialog lays out the run: adventurer, boons and jinx", async ({
  page,
}, info) => {
  const s = crawlAt(
    "dungeon.bone-sommelier",
    STEP.floor2 + 1,
    {
      hearts: 5,
      loot: ["draught", "shield"],
    },
    { adventurer: "rogue" },
  );
  // Tonight's omen, kept, and a jinx from a fight on the first floor.
  const q = s.quest!;
  const finale = [...q.finale];
  const swap = (id: string, step: number) => {
    const at = finale.indexOf(id);
    if (at >= 0) finale[at] = finale[step];
    finale[step] = id;
  };
  swap("dungeon.goblin-shaman", STEP.floor1);
  // An omen that leaves the satchel alone.
  swap("dungeon.omen-lefty-night", STEP.omen);
  await seed(page, {
    ...s,
    quest: {
      ...q,
      finale,
      party: {
        ...q.party!,
        boons: [finale[STEP.omen]],
        jinx: "dungeon.goblin-shaman",
      },
    },
  });
  // The strip under the top row carries the party's things at a glance:
  // the satchel and the jinx.
  await expect(page.locator(".hud-strip .hud-chip")).toHaveCount(2);
  await page.screenshot({ path: info.outputPath("strip.png") });
  // The hearts open the party: hearts, adventurer, boons, and nothing else.
  await meter(page).click();
  const dialog = page.getByRole("dialog", { name: "The party" });
  await expect(dialog.locator(".crawl-omen").first()).toContainText("Rogue");
  await expect(dialog.locator(".crawl-boons li")).toHaveCount(1);
  await expect(dialog.locator(".satchel, .crawl-floors")).toHaveCount(0);
  await page.screenshot({ path: info.outputPath("party.png") });
  await page.keyboard.press("Escape");
  // The jinx chip opens the jinx, and only that.
  await page.locator(".tag-jinx").click();
  const one = page.getByRole("dialog", { name: "Jinx" });
  await expect(one.locator(".crawl-curse")).toHaveCount(1);
  await expect(one.locator(".crawl-curse")).toContainText("Goblin Tongue");
  await page.screenshot({ path: info.outputPath("jinx.png") });
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  // The satchel chip opens the satchel; the Rogue's holds four.
  await page.locator(".tag-satchel").click();
  const satchel = page.getByRole("dialog", { name: "Satchel" });
  await expect(satchel.locator(".satchel-slot")).toHaveCount(4);
  await satchel.getByRole("button", { name: "Drink" }).click();
  await expect(meter(page)).toHaveAccessibleName(/^Hearts: 7 of /);
  await expect(satchel.getByRole("button", { name: "Drink" })).toHaveCount(0);
  // How to play lives in the pause menu, not in these dialogs.
  await expect(
    satchel.getByRole("button", { name: "How to play" }),
  ).toHaveCount(0);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Open game menu" }).click();
  await page.getByRole("button", { name: "How to play" }).click();
  const guide = page.getByRole("dialog", { name: "How to play" });
  // One row a system (2026-10-31): hearts, fights, bosses, landings, the
  // satchel and gear, jinxes.
  await expect(guide.locator(".guide-rows li")).toHaveCount(6);
  // The seals, the naturals, and the roll-to-beat gem (2026-10-31).
  await expect(guide.locator(".crawl-legend dd")).toHaveCount(8);
  await expect(guide.locator(".crawl-legend")).toContainText(
    "A natural 1 doubles a loss",
  );
  await guide.screenshot({ path: info.outputPath("guide.png") });
  await guide.locator(".guide-basics").scrollIntoViewIfNeeded();
  await guide.screenshot({ path: info.outputPath("guide-end.png") });
});

test("losing the last heart wipes the party", async ({ page }, info) => {
  await seed(
    page,
    rolled(
      // Keg Spider, a d20 fight (the Tab Goblin is a table duel since
      // 2026-10-31).
      reveal(crawlAt("dungeon.keg-spider", STEP.floor1 + 2, { hearts: 1 })),
      1,
    ),
  );
  await page.locator(".game-card").click();
  await expect(page.locator(".crawl-end.wiped h1")).toHaveText(
    /Party\s*wiped\./,
  );
  await expect(page.locator(".crawl-verdict")).toHaveText(
    "Everyone finishes their drink.",
  );
  // The queue, three floors and the hidden room, the stairs, closing time,
  // Last Call.
  await expect(page.locator(".crawl-floors li").first()).toContainText(
    "The Queue",
  );
  await expect(page.locator(".crawl-floors li").nth(1)).toContainText(
    "The Cellar",
  );
  await expect(page.locator(".crawl-floors li")).toHaveCount(8);
  await page.screenshot({ path: info.outputPath("wiped.png") });
  await page.getByRole("button", { name: "Play again" }).click();
  await expect(meter(page)).toHaveAccessibleName(full);
});

test("felling the Last Call boss wins the crawl", async ({ page }, info) => {
  let s = reveal(
    crawlAt("dungeon.last-call-lich", STEP.lastCall, {
      hits: 2,
      rounds: 2,
    }),
  );
  s = rolled({ ...s, discarded: STEP.lastCall + 2 }, 18);
  await seed(page, s);
  await page.locator(".game-card").click();
  await expect(page.locator(".crawl-end h1")).toHaveText(
    /Last call,\s*survived\./,
  );
  await expect(page.locator(".crawl-verdict")).toHaveText(
    "Make a rule for the rest of the night.",
  );
  await page.screenshot({ path: info.outputPath("won.png") });
});

// The end screen (2026-10-25): the trophy wall (one medallion a boss and
// closing time, gold when felled, a socket otherwise) and the tab (the
// adventurer's line, tonight's omen, rooms, trinkets, hearts), both
// screenshot-ready on a phone.
for (const width of [320, 390])
  test(`the end screen hangs the trophies and the tab at ${width}px`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 844 });
    // A fully levelled Barbarian (the Warlord), with Happy Hour and a
    // trinket kept, fells Last Call.
    let s = crawlAt(
      "dungeon.last-call-lich",
      STEP.lastCall,
      { hits: 2, rounds: 2, form: 2 },
      { adventurer: "barbarian" },
    );
    const q = s.quest!;
    const finale = [...q.finale];
    const swap = (id: string, step: number) => {
      const at = finale.indexOf(id);
      if (at >= 0) finale[at] = finale[step];
      finale[step] = id;
    };
    swap("dungeon.omen-happy-hour", STEP.omen);
    swap("dungeon.keg-golem", STEP.boss1);
    s = {
      ...s,
      quest: {
        ...q,
        finale,
        party: {
          ...q.party!,
          boons: ["dungeon.omen-happy-hour", "dungeon.keg-golem#0"],
        },
      },
    };
    s = rolled({ ...reveal(s), discarded: STEP.lastCall + 2 }, 18);
    await seed(page, s);
    await page.locator(".game-card").click();
    const wall = page.locator(".trophy-wall");
    await expect(wall).toHaveAccessibleName("Trophy wall: 5 of 5");
    await expect(wall.locator("li.won")).toHaveCount(5);
    await expect(wall.locator("li").first()).toContainText("Keg Golem");
    await expect(wall.locator("li").last()).toContainText("The Last Call Lich");
    const tab = page.locator(".run-tab");
    await expect(tab).toContainText("Barbarian → Berserker → Warlord");
    await expect(tab).toContainText("Happy Hour");
    await expect(tab).toContainText("Golem's Spigot");
    // No trophy's name breaks inside a word.
    const broken = await wall
      .locator(".trophy-name")
      .evaluateAll((els) =>
        els.some((el) => el.scrollWidth > el.clientWidth + 1),
      );
    expect(broken).toBe(false);
    // Nothing on either runs off the side of the phone.
    for (const el of [wall, tab]) {
      const box = (await el.boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(width);
    }
    // The tab stands in for the adventurer's and trinkets' panels.
    await expect(page.locator(".crawl-end .crawl-boons")).toHaveCount(0);
    await page.screenshot({ path: info.outputPath(`end-${width}.png`) });
  });

test("a wiped run's wall shows the bosses felled and empty sockets", async ({
  page,
}) => {
  await seed(
    page,
    rolled(
      reveal(
        crawlAt("dungeon.bachelor-ghosts", STEP.floor2 + 2, { hearts: 1 }),
      ),
      1,
    ),
  );
  await page.locator(".game-card").click();
  await expect(page.locator(".crawl-end.wiped h1")).toBeVisible();
  const wall = page.locator(".trophy-wall");
  // The Cellar's boss and the hidden room's keeper fell; three wait.
  await expect(wall).toHaveAccessibleName("Trophy wall: 2 of 5");
  await expect(wall.locator("li.empty .trophy-name")).toHaveText([
    "?",
    "?",
    "?",
  ]);
});

for (const width of [320, 390])
  test(`the header's row and its strip fit a ${width}px phone with everything showing`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 640 });
    const s = crawlAt("dungeon.cursed-idol", STEP.floor2, {
      hearts: 3,
      loot: ["draught", "die", "shield"],
    });
    const finale = [...s.quest!.finale];
    finale[STEP.floor1] = "dungeon.goblin-shaman";
    await seed(
      page,
      reveal({
        ...s,
        quest: {
          ...s.quest!,
          finale: finale.map((id, i) =>
            i !== STEP.floor1 && id === "dungeon.goblin-shaman"
              ? s.quest!.finale[STEP.floor1]
              : id,
          ),
          party: { ...s.quest!.party!, jinx: "dungeon.goblin-shaman" },
        },
      }),
    );
    const [left, middle, menu, card, stakes] = await Promise.all([
      page.locator(".crawl-meter").boundingBox(),
      page.locator(".crawl-progress").boundingBox(),
      page.getByRole("button", { name: "Open game menu" }).boundingBox(),
      page.locator(".game-card").boundingBox(),
      page.locator(".game-card .card-stakes").boundingBox(),
    ]);
    // One row: the hearts, the plaque and the menu, left to right.
    expect(left!.x).toBeGreaterThanOrEqual(0);
    expect(left!.x + left!.width).toBeLessThanOrEqual(middle!.x);
    expect(middle!.x + middle!.width).toBeLessThanOrEqual(menu!.x);
    expect(menu!.x + menu!.width).toBeLessThanOrEqual(width);
    const centre = (b: { y: number; height: number }) => b.y + b.height / 2;
    expect(Math.abs(centre(left!) - centre(middle!))).toBeLessThan(2);
    expect(Math.abs(centre(menu!) - centre(middle!))).toBeLessThan(2);
    // The strip: two chips here, all there is (the satchel and the jinx),
    // under the row, inside the screen, above the card.
    const chips = page.locator(".hud-strip .hud-chip");
    await expect(chips).toHaveCount(2);
    for (const chip of await chips.all()) {
      const b = (await chip.boundingBox())!;
      expect(b.x).toBeGreaterThanOrEqual(0);
      expect(b.x + b.width).toBeLessThanOrEqual(width);
      expect(b.y).toBeGreaterThan(middle!.y + middle!.height);
      expect(b.y + b.height).toBeLessThan(card!.y);
    }
    expect(stakes!.x).toBeGreaterThan(card!.x);
    expect(stakes!.x + stakes!.width).toBeLessThan(card!.x + card!.width);
    await page.screenshot({ path: info.outputPath(`meter-${width}.png`) });
  });

test("a merchant sells on plaques, and a price in hearts needs a spare heart", async ({
  page,
}, info) => {
  const at = STEP.floor1 + 1;
  await seed(page, reveal(crawlAt("dungeon.rat-fence", at, { hearts: 1 })));
  const plaques = page.locator(".card-choice.offers .card-choice-option");
  await expect(plaques).toHaveCount(3);
  await expect(plaques.nth(1)).toBeDisabled();
  // Greyed but solid: the frame must not show through.
  await expect(plaques.nth(1)).toHaveCSS("opacity", "1");
  await expect(plaques.nth(0)).toHaveAccessibleName(
    "Drink 3: a Healing Draught",
  );
  await page.screenshot({ path: info.outputPath("merchant.png") });
  // A stray tap on the card does nothing; the plaques decide.
  await page.locator(".game-card").click({ force: true });
  expect((await saved(page)).quest.step).toBe(at);
  await plaques.nth(0).click();
  await expect(page.locator(".tag-satchel")).toHaveAccessibleName(
    "Satchel: Healing Draught",
  );
  const s = await saved(page);
  expect(s.quest.party).toMatchObject({ hearts: 1, loot: ["draught"] });
  expect(s.quest.step).toBe(at + 1);
});

test("a fork's loud door deals one of the floor's elites, which drops a trinket", async ({
  page,
}, info) => {
  await seed(
    page,
    reveal(crawlAt("dungeon.red-or-white", STEP.floor1, {}, { other: true })),
  );
  await expect(page.locator(".game-card .card-ribbon")).toHaveText(
    "Wine Cellar · Fork",
  );
  await page.screenshot({ path: info.outputPath("fork.png") });
  await page.getByRole("button", { name: /^Red aisle/ }).click();
  await page.locator(".game-card").click();
  await expect(page.locator(".game-card .card-ribbon")).toHaveText(
    "Wine Cellar · Elite",
  );
  await expect(page.locator(".game-card .stake-loss")).toHaveAccessibleName(
    "Losing costs 2 hearts",
  );
  await expect(page.locator(".game-card .stake-trinket")).toHaveAccessibleName(
    /^Winning offers a trinket: .+ or .+$/,
  );
  await page.screenshot({ path: info.outputPath("elite.png") });
});

test("an ambush shows its two swings in the medallion", async ({
  page,
}, info) => {
  await seed(page, {
    ...reveal(
      crawlAt(
        "dungeon.roach-conga",
        STEP.floor2 + 2,
        { hits: 1, rounds: 1 },
        { other: true },
      ),
    ),
    // The swing already landed was a draw too.
    discarded: STEP.floor2 + 3,
  });
  await expect(page.locator(".crawl-progress")).toHaveAccessibleName(
    "Ambush in room 3 of 8: 1 of 2 hits",
  );
  await page.screenshot({ path: info.outputPath("ambush.png") });
});

test("closing time: the rival party, beaten twice", async ({ page }, info) => {
  await seed(page, reveal(crawlAt("dungeon.closing-last-table", STEP.closing)));
  await expect(page.locator(".crawl-progress")).toHaveAccessibleName(
    "Ambush, Closing Time: 0 of 2 hits",
  );
  await expect(page.locator(".game-card .card-ribbon")).toHaveText(
    "Closing Time · Rival",
  );
  await page.screenshot({ path: info.outputPath("closing.png") });
});

test("tonight's omen is kept in the party dialog", async ({ page }, info) => {
  let s = reveal(crawlAt("dungeon.omen-lock-in", STEP.omen));
  s = advance(s);
  await seed(page, s);
  await meter(page).click();
  const dialog = page.getByRole("dialog", { name: "The party" });
  await expect(dialog.locator(".crawl-boons")).toContainText("The Lock-In");
  await expect(dialog.locator(".crawl-boons")).toContainText(
    "Bosses take 1 more hit.",
  );
  // The Lock-In's Loaded Die and shield are in the satchel, on the strip.
  await expect(page.locator(".tag-satchel")).toHaveAccessibleName(
    "Satchel: Loaded Die, Coaster Shield",
  );
  await page.screenshot({ path: info.outputPath("omen-party.png") });
});

// The 2026-10-25 overhaul at 320px: a boss's second beat as a duel with Won
// and Lost, and its spoils on the felling win.
test("a boss's next beat is a duel, and its felling win brings spoils", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await seed(
    page,
    rolled(
      reveal(
        crawlAt(
          "dungeon.keg-golem",
          STEP.boss1,
          {},
          { adventurer: "barbarian" },
        ),
      ),
      18,
    ),
  );
  await page.locator(".game-card").click();
  await expect.poll(async () => (await saved(page)).quest.party.hits).toBe(1);
  // The Golem gets back up: a chug race, settled by the table.
  await page.locator(".game-card").click();
  await expect(page.locator(".game-card")).toHaveAccessibleName(
    /Chug race.*Choose Won or Lost/,
  );
  await page.screenshot({ path: info.outputPath("duel-beat.png") });
  await page.getByRole("button", { name: "Won", exact: true }).click();
  const sheet = page.getByRole("dialog", { name: "Spoils" });
  await expect(sheet).toBeVisible();
  await sheet.locator(".spoils-row").first().click();
  const s = await saved(page);
  expect(s.quest.party.boons).toContain("dungeon.keg-golem#0");
  expect(s.quest.step).toBe(STEP.landing1);
});
