import { test, expect, type Page } from "@playwright/test";
import {
  advance,
  createSession,
  currentCard,
  finaleStage,
} from "../../src/game/engine";
import { returnToCard, rollDice } from "../../src/game/dice";
import type { PartyState, SessionState } from "../../src/game/types";
import { cards, packs } from "../../src/content/catalog";
import { PARTY_HEARTS as H } from "../../src/content/dungeon/shared";
const key = "side-quest.session.v1";

// Where a run is, step by step: the adventurer, tonight's omen, the queue,
// the first floor's eight rooms and its boss, a landing, the second floor
// and its boss, a landing, the third floor, closing time, Last Call.
const STEP = {
  adventurer: 0,
  omen: 1,
  queue: 2,
  floor1: 3,
  boss1: 11,
  landing1: 12,
  hidden: 13,
  keeper: 15,
  floor2: 16,
  boss2: 24,
  landing2: 25,
  floor3: 26,
  closing: 34,
  lastCall: 35,
};

// A Pub Crawl seeded at `step` with `id` in play, the party as given. The
// floors are the first at each depth (the Cellar, the Catacombs, the Drowned
// Taproom) and the Speakeasy, unless `other` picks the second three (the
// Wine Cellar, the Sewers, the Kitchen) and the Basement, or `route` picks
// floors by index (2: the Brewery, the Walk-in Freezer, the Rooftop Bar).
// With `adventurer`, that class was dealt and put aside first.
function crawlAt(
  id: string,
  step = 0,
  party: Partial<PartyState> = {},
  {
    other = false,
    route = other ? 1 : 0,
    adventurer,
    room = other ? 4 : 0,
  }: {
    other?: boolean;
    route?: number;
    adventurer?: string;
    room?: number;
  } = {},
): SessionState {
  // The route draws come in run order: floor 1, the hidden room (0 to 4),
  // floor 2, floor 3.
  const f = (route + 0.5) / 3;
  const floors = [f, (room + 0.5) / 5, f, f];
  let s = createSession(
    { version: 1, packIds: ["dungeon"], limit: null, quest: "dungeon" },
    cards,
    packs,
    () => floors.shift() ?? Math.random(),
  );
  const place = (s: SessionState, id: string, step: number) => {
    const finale = [...s.quest!.finale];
    const at = finale.indexOf(id);
    if (at >= 0) finale[at] = finale[step];
    finale[step] = id;
    return { ...s, quest: { ...s.quest!, finale } };
  };
  if (adventurer)
    s = advance(advance(place(s, `dungeon.class-${adventurer}`, 0)));
  s = place(s, id, step);
  const q = s.quest!;
  return {
    ...s,
    discarded: step,
    previousId: step ? q.finale[step - 1] : null,
    quest: { ...q, step, party: { ...q.party!, ...party } },
  };
}
const reveal = (s: SessionState) => advance(s);
const rolled = (s: SessionState, face: number) =>
  returnToCard(rollDice(s, () => (face - 0.5) / currentCard(s).dice!.sides));
async function seed(page: Page, session: SessionState) {
  await page.goto("./");
  await page.evaluate(
    ({ key, session }) => localStorage.setItem(key, JSON.stringify(session)),
    { key, session },
  );
  await page.reload();
}
const saved = (page: Page) =>
  page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), key);
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
  expect(s.quest.party.boons).toEqual([s.quest.finale[1]]);
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

test("@release the Quaff rerolls a lost fight for drinks, once until a boss falls", async ({
  page,
}, info) => {
  await seed(
    page,
    rolled(
      reveal(crawlAt("dungeon.ex-wraith", STEP.floor2, { loot: ["die"] })),
      2,
    ),
  );
  const quaff = page.getByRole("button", { name: /^Quaff: drink 6/ });
  await expect(quaff).toBeVisible();
  await expect(
    page.locator(".card-choice.items .card-choice-option"),
  ).toHaveCount(2);
  await page.screenshot({ path: info.outputPath("quaff.png") });
  await quaff.click();
  await expect(page.locator(".game-card")).toHaveAccessibleName(/^Roll 1d20/);
  const s = await saved(page);
  expect(s.roll).toBeNull();
  expect(s.quest.party).toMatchObject({ quaffed: true, loot: ["die"] });
  // Drunk once: the next lost roll offers only the die.
  await seed(page, rolled(s, 2));
  await expect(
    page.getByRole("button", { name: /^Use the Loaded Die/ }),
  ).toBeVisible();
  await expect(page.locator(".quaff-plaque")).toHaveCount(0);
  // The strip's Quaff chip goes dark until the boss falls.
  await expect(page.locator(".tag-quaff")).toHaveClass(/spent/);
});

test("@release pushing your luck: cash out, or go again for the next prize", async ({
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

test("@release a trial is settled with plaques; a loss costs hearts and pours into the Cup", async ({
  page,
}, info) => {
  await seed(page, reveal(crawlAt("dungeon.tomb-of-silence", STEP.floor2 + 1)));
  await expect(
    page.getByRole("button", { name: "Won", exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: info.outputPath("trial.png") });
  await page.getByRole("button", { name: "Lost", exact: true }).click();
  await expect(meter(page)).toHaveAccessibleName(
    new RegExp(`^Hearts: ${H - 2} of ${H}.*The Cup: 1 splash$`),
  );
  await expect(page.locator(".crawl-meter strong")).toHaveText(`${H - 2}`);
  await expect(page.locator(".tag-cup")).toHaveText("1");
  // The first splash explains the Cup.
  await expect(page.locator(".news-banner")).toHaveText(
    /The Cup\s*Pour a splash in\s*Lost fight: the drawer pours/,
  );
  await page.screenshot({ path: info.outputPath("cup-banner.png") });
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
  // The last swing lands: the table picks a trinket, and it sweeps in.
  await seed(page, rolled(s, 18));
  const spoils = page.locator(".card-choice.spoils .card-choice-option");
  await expect(spoils).toHaveCount(2);
  await expect(spoils.nth(1)).toHaveAccessibleName(
    "Take the Hydra Scale: +2 max hearts.",
  );
  // A stray tap on the card does nothing; the plaques decide.
  await page.locator(".game-card").click({ force: true });
  expect((await saved(page)).quest.step).toBe(STEP.boss2);
  await page.screenshot({ path: info.outputPath("spoils.png") });
  await spoils.nth(0).click();
  await expect(page.locator(".news-banner")).toHaveText(
    /Trinket found\s*Hydra Tooth\s*\+2 to boss rolls\./,
  );
  await expect(page.locator(".crawl-progress")).toHaveAccessibleName(
    "The Lower Landing",
  );
  await page.screenshot({ path: info.outputPath("trinket.png") });
  expect((await saved(page)).quest.party.boons).toEqual([
    "dungeon.hangover-hydra#0",
  ]);
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
  // The banner fades rather than vanishing at once: still shown a moment in.
  await page.waitForTimeout(400);
  await expect(banner.locator(".stage-banner-cloth")).not.toHaveCSS(
    "opacity",
    "0",
  );
  // The lost hearts float off the heart, centred on it.
  const [splat, heart] = await Promise.all([
    page.locator(".heart-splat").boundingBox(),
    meter(page).boundingBox(),
  ]);
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

test("@release a landing levels the adventurer up for drinks, or rests", async ({
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
  const plaques = page.locator(".card-choice.offers .card-choice-option");
  await expect(plaques).toHaveCount(2);
  await expect(plaques.nth(0)).toHaveAccessibleName(
    "Berserker · drink 3: your adventurer levels up into Berserker",
  );
  await expect(plaques.nth(1)).toHaveAccessibleName("Rest: 3 hearts back");
  await page.screenshot({ path: info.outputPath("landing.png") });
  await plaques.nth(0).click();
  await expect(page.locator(".evolution-banner")).toHaveText(
    /Barbarian levels up!\s*Berserker\s*\+2 max hearts\. \+2 to elite and boss rolls\./,
  );
  // Two banners at once, the level-up and the hidden room: both are read.
  const spoken = page.locator("#banner-announcer");
  await expect(spoken).toContainText(
    "Barbarian levels up! Berserker. +2 max hearts. +2 to elite and boss rolls.",
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

test("the party dialog lays out the run: adventurer, boons, jinx and the Cup", async ({
  page,
}, info) => {
  const s = crawlAt(
    "dungeon.bone-sommelier",
    STEP.floor2 + 1,
    {
      hearts: 5,
      curse: "bleed",
      loot: ["draught", "shield"],
      cup: 4,
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
  // The strip under the top row carries the party's things at a glance.
  await expect(page.locator(".hud-strip .hud-chip")).toHaveCount(5);
  await expect(page.locator(".tag-cup")).toHaveAccessibleName(
    "The Cup: 4 splashes",
  );
  await expect(page.locator(".tag-quaff")).toHaveClass(/ready/);
  await page.screenshot({ path: info.outputPath("strip.png") });
  // The hearts open the party: hearts, adventurer, boons, and nothing else.
  await meter(page).click();
  const dialog = page.getByRole("dialog", { name: "The party" });
  await expect(dialog.locator(".crawl-omen").first()).toContainText("Rogue");
  await expect(dialog.locator(".crawl-boons li")).toHaveCount(1);
  await expect(
    dialog.locator(".satchel, .crawl-curse, .crawl-cup, .crawl-floors"),
  ).toHaveCount(0);
  await page.screenshot({ path: info.outputPath("party.png") });
  await page.keyboard.press("Escape");
  // Each chip opens its own thing, and only that.
  for (const [chip, title, text] of [
    [".tag-jinx", "Jinx", "Goblin Tongue"],
    [".tag-curse", "Curse", "Bleeding"],
    [".tag-quaff", "The Quaff", "Quaff: ready"],
    [".tag-cup", "The Cup", "4 splashes"],
  ]) {
    await page.locator(chip).click();
    const one = page.getByRole("dialog", { name: title });
    await expect(one.locator(".crawl-curse, .crawl-cup")).toHaveCount(1);
    await expect(one.locator(".crawl-curse, .crawl-cup")).toContainText(text);
    if (chip === ".tag-jinx")
      await page.screenshot({ path: info.outputPath("jinx.png") });
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  }
  // The satchel chip opens the satchel; the Rogue's holds four.
  await page.locator(".tag-satchel").click();
  const satchel = page.getByRole("dialog", { name: "Satchel" });
  await expect(satchel.locator(".satchel-slot")).toHaveCount(4);
  await satchel.getByRole("button", { name: "Drink" }).click();
  await expect(meter(page)).toHaveAccessibleName(/^Hearts: 6 of /);
  await expect(satchel.getByRole("button", { name: "Drink" })).toHaveCount(0);
  // How to play lives in the pause menu, not in these dialogs.
  await expect(
    satchel.getByRole("button", { name: "How to play" }),
  ).toHaveCount(0);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Open game menu" }).click();
  await page.getByRole("button", { name: "How to play" }).click();
  const guide = page.getByRole("dialog", { name: "How to play" });
  await expect(guide.locator(".guide-rows li")).toHaveCount(8);
  await expect(guide.locator(".guide-rows")).toContainText(
    "Lost a d20? Drink 6 to roll it again.",
  );
  await expect(guide.locator(".crawl-legend dd")).toHaveCount(8);
  await expect(guide.locator(".crawl-legend")).toContainText(
    "A natural 1 doubles a loss",
  );
  await guide.screenshot({ path: info.outputPath("guide.png") });
  await guide.locator(".guide-basics").scrollIntoViewIfNeeded();
  await guide.screenshot({ path: info.outputPath("guide-end.png") });
});

test("@release losing the last heart wipes the party, and the Cup goes to the last drawer", async ({
  page,
}, info) => {
  await seed(
    page,
    rolled(
      reveal(crawlAt("dungeon.tab-goblin", STEP.floor1 + 2, { hearts: 1 })),
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
  await expect(page.locator(".crawl-cup")).toContainText(
    "Whoever drew the last card drinks the Cup.",
  );
  // The queue, three floors and the hidden room, closing time, Last Call.
  await expect(page.locator(".crawl-floors li").first()).toContainText(
    "The Queue",
  );
  await expect(page.locator(".crawl-floors li").nth(1)).toContainText(
    "The Cellar",
  );
  await expect(page.locator(".crawl-floors li")).toHaveCount(7);
  await page.screenshot({ path: info.outputPath("wiped.png") });
  await page.getByRole("button", { name: "Play again" }).click();
  await expect(meter(page)).toHaveAccessibleName(full);
});

test("felling the Last Call boss wins the crawl", async ({ page }, info) => {
  let s = reveal(
    crawlAt("dungeon.last-call-lich", STEP.lastCall, {
      hits: 2,
      rounds: 2,
      cup: 7,
    }),
  );
  s = rolled({ ...s, discarded: STEP.lastCall + 2 }, 18);
  await seed(page, s);
  await page.locator(".game-card").click();
  await expect(page.locator(".crawl-end h1")).toHaveText(
    /Last call,\s*survived\./,
  );
  await expect(page.locator(".crawl-cup")).toContainText(
    "Whoever landed the last swing hands the Cup to anyone.",
  );
  await page.screenshot({ path: info.outputPath("won.png") });
});

for (const width of [320, 390])
  test(`the header's row and its strip fit a ${width}px phone with everything showing`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 640 });
    const s = crawlAt("dungeon.cursed-idol", STEP.floor2, {
      hearts: 3,
      curse: "hex",
      loot: ["draught", "die", "shield"],
      cup: 12,
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
    // The strip: five chips under the row, inside the screen, above the card.
    const chips = page.locator(".hud-strip .hud-chip");
    await expect(chips).toHaveCount(5);
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
  // The Lock-In's Loaded Die is in the satchel, on the strip.
  await expect(page.locator(".tag-satchel")).toHaveAccessibleName(
    "Satchel: Loaded Die",
  );
  await page.screenshot({ path: info.outputPath("omen-party.png") });
});

test("every Dungeon night card fits its face with its plaques at 393x640", async ({
  page,
}) => {
  test.setTimeout(400000);
  await page.setViewportSize({ width: 393, height: 640 });
  const ids = cards.filter((c) => c.id.startsWith("dungeon.")).map((c) => c.id);
  // Where each card is dealt: its stage's first step on the route that has
  // it (an elite, behind a fork, one room later).
  const routes = [0, 1, 2].flatMap((route) =>
    [0, 1, 2, 3, 4].map((room) => ({
      route,
      room,
      base: crawlAt(ids[0], 0, {}, { route, room }),
    })),
  );
  const placeOf = (id: string) => {
    for (const { route, room, base } of routes) {
      let first = 0;
      for (const stage of base.quest!.stages) {
        if (stage.cards.some((c) => c.id === id))
          return { step: first, route, room };
        if (stage.elite?.some((c) => c.id === id))
          return { step: first + 1, route, room };
        first += stage.pick;
      }
    }
    throw Error(id);
  };
  const overflowing: string[] = [];
  await page.goto("./");
  for (const id of ids) {
    // A smoke bomb in the satchel puts the Flee plaque on every room fight.
    const { step, route, room } = placeOf(id);
    const s = reveal(crawlAt(id, step, { loot: ["smoke"] }, { route, room }));
    await page.evaluate(
      ({ key, session }) => localStorage.setItem(key, JSON.stringify(session)),
      { key, session: s },
    );
    await page.reload();
    const rules = page.locator(".game-card .study-rules");
    await expect(rules).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    if ((await rules.getAttribute("data-overflow")) !== "none")
      overflowing.push(id);
  }
  expect(overflowing).toEqual([]);
});
