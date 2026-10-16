import { test, expect, type Page } from "@playwright/test";
import {
  advance,
  createSession,
  currentCard,
  settleBattle,
  skipRoll,
} from "../../src/game/engine";
import { returnToCard, rollDice } from "../../src/game/dice";
import type { SessionState } from "../../src/game/types";
import { cards, packs } from "../../src/content/catalog";
const key = "side-quest.session.v1";

// A Pokémon League game one badge short, with a gym leader without dice
// (Jasmine) revealed.
async function seedOneBadgeShort(page: Page) {
  const session = createSession(
    { version: 1, packIds: ["pokemon"], limit: null, quest: "pokemon" },
    cards,
    packs,
  );
  session.order = [
    "pokemon.gym-jasmine",
    ...session.order.filter((id) => id !== "pokemon.gym-jasmine"),
  ];
  session.phase = "revealed";
  session.quest!.count = 7;
  // A known gauntlet, so the first finale card is predictable.
  session.quest!.finale = [
    "pokemon.legendary-articuno",
    "pokemon.elite-lorelei",
    "pokemon.elite-bruno",
    "pokemon.elite-agatha",
    "pokemon.elite-will",
    "pokemon.league-champion-blue",
  ];
  await page.goto("./");
  await page.evaluate(
    ({ key, session }) => localStorage.setItem(key, JSON.stringify(session)),
    { key, session },
  );
  await page.reload();
}

for (const width of [320, 390])
  test(`@release the badge meter fills and deals the League at ${width}px`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 700 });
    await seedOneBadgeShort(page);
    const meter = page.locator(".quest-meter");
    await expect(meter).toHaveAccessibleName("Badges: 7 of 8");
    await expect(meter).not.toHaveClass(/due/);
    // The meter shares the top row with the medallion without overlapping it.
    const [left, middle] = await Promise.all([
      meter.boundingBox(),
      page.locator(".progress").boundingBox(),
    ]);
    expect(left!.x).toBeGreaterThanOrEqual(0);
    expect(left!.x + left!.width).toBeLessThanOrEqual(middle!.x);
    // A gym leader carries its ribbon and stays inside the card.
    const ribbon = page.locator(".game-card .card-ribbon");
    await expect(ribbon).toHaveText("Gym Leader · Mineral Badge");
    const [card, banner] = await Promise.all([
      page.locator(".game-card").boundingBox(),
      ribbon.boundingBox(),
    ]);
    expect(banner!.x).toBeGreaterThan(card!.x);
    expect(banner!.x + banner!.width).toBeLessThan(card!.x + card!.width);
    await page.screenshot({ path: info.outputPath(`meter-${width}.png`) });

    // A gym leader without dice waits for the table's verdict: a stray tap
    // on the card does nothing.
    await page.locator(".game-card").click({ force: true });
    await expect(meter).toHaveAccessibleName("Badges: 7 of 8");
    await expect(
      page.getByRole("button", { name: "Lost", exact: true }),
    ).toBeVisible();
    // The eighth badge opens the gauntlet: the Legendary comes first, under
    // a pearl banner that never blocks the card.
    await page.getByRole("button", { name: "Won", exact: true }).click();
    await expect(meter).toHaveAccessibleName("Legendary");
    await expect(meter).toHaveClass(/due/);
    const stageBanner = page.locator(".stage-banner");
    await expect(stageBanner).toHaveText(
      /Pokémon League\s*A Legendary appears/,
    );
    await expect(stageBanner).toHaveClass(/banner-pearl/);
    await page.screenshot({ path: info.outputPath(`banner-${width}.png`) });
    await page.getByRole("button", { name: "Reveal card" }).click();
    await expect(page.locator(".study-title h2")).toHaveText("Articuno");
    await expect(ribbon).toHaveText("Legendary Encounter");
    await expect(stageBanner).toHaveCount(0);
    await expect(page.locator(".study-face")).toHaveClass(/tone-pearl/);
    await expect(page.locator(".game-card")).toHaveAccessibleName(/^Roll /);

    // The gauntlet survives a reload.
    await page.reload();
    await expect(page.locator(".study-title h2")).toHaveText("Articuno");
    const saved = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!),
      key,
    );
    expect(saved.quest).toMatchObject({ count: 8, due: true, step: 0 });
  });

test("@release Pokémon League is a mode that holds its pack on", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("./");
  const mode = page.getByRole("button", {
    name: "Pokémon League, Earn 8 badges",
  });
  await mode.click();
  await expect(mode).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("button", { name: "Short, 30 cards" }),
  ).toHaveAttribute("aria-pressed", "false");
  await page.screenshot({ path: info.outputPath("setup-320.png") });
  // Its pack is on and cannot be switched off while the mode is chosen.
  await page.getByRole("button", { name: "Choose packs" }).click();
  const pokemon = page
    .getByRole("dialog")
    .getByRole("button", { name: /Pokémon night/ });
  await expect(pokemon).toHaveAttribute("aria-pressed", "true");
  await expect(pokemon).toHaveAttribute("aria-disabled", "true");
  await page.getByRole("button", { name: "Done" }).click();
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(page.locator(".progress")).toBeVisible();
  await expect(page.locator(".quest-meter")).toHaveAccessibleName(
    "Badges: 0 of 8",
  );
  const saved = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    key,
  );
  expect(saved.config).toMatchObject({
    packIds: ["core", "pokemon"],
    limit: null,
    quest: "pokemon",
  });
});

test("a plain mode plays the Pokémon pack without a meter", async ({
  page,
}) => {
  await page.goto("./");
  await page.getByRole("button", { name: "Choose packs" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /Pokémon night/ })
    .click();
  await page.getByRole("button", { name: "Done" }).click();
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(page.locator(".progress")).toBeVisible();
  await expect(page.locator(".quest-meter")).toHaveCount(0);
  const saved = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    key,
  );
  expect(saved.config.quest).toBeUndefined();
  expect(saved.quest).toBeUndefined();
});

test("the Elite Four count through the meter, and the Champion ends the run", async ({
  page,
}) => {
  const session = createSession(
    { version: 1, packIds: ["pokemon"], limit: null, quest: "pokemon" },
    cards,
    packs,
  );
  // Mid-gauntlet: the Legendary and one Elite Four member are behind us.
  Object.assign(session.quest!, {
    count: 8,
    due: true,
    step: 2,
    finale: [
      "pokemon.legendary-mewtwo",
      "pokemon.elite-karen",
      "pokemon.elite-bruno",
      "pokemon.elite-phoebe",
      "pokemon.elite-drake",
      "pokemon.league-champion-lance",
    ],
  });
  session.discarded = 2;
  session.previousId = "pokemon.elite-karen";
  session.phase = "revealed";
  await page.goto("./");
  await page.evaluate(
    ({ key, session }) => localStorage.setItem(key, JSON.stringify(session)),
    { key, session },
  );
  await page.reload();
  const meter = page.locator(".quest-meter");
  await expect(meter).toHaveAccessibleName("Elite Four: 2 of 4");
  await expect(page.locator(".study-title h2")).toHaveText("Bruno");
  await expect(page.locator(".game-card .card-ribbon")).toHaveText(
    "Elite Four · Fighting",
  );
  await page.locator(".game-card").click();
  await expect(meter).toHaveAccessibleName("Elite Four: 3 of 4");
});

test("@release a lost gym leader earns nothing and goes back into the deck", async ({
  page,
}) => {
  await seedOneBadgeShort(page);
  const meter = page.locator(".quest-meter");
  await page.getByRole("button", { name: "Lost", exact: true }).click();
  await expect(page.getByRole("button", { name: "Reveal card" })).toBeVisible();
  await expect(meter).toHaveAccessibleName("Badges: 7 of 8");
  await expect(meter).not.toHaveClass(/due/);
  const saved = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    key,
  );
  expect(saved.quest).toMatchObject({ count: 7, due: false, lost: 1 });
  expect(saved.position).toBe(0);
  expect(saved.order.indexOf("pokemon.gym-jasmine")).toBeGreaterThan(0);
});

test("a lost Champion deals another Champion, and only a win ends the run", async ({
  page,
}) => {
  const session = createSession(
    { version: 1, packIds: ["pokemon"], limit: null, quest: "pokemon" },
    cards,
    packs,
  );
  Object.assign(session.quest!, {
    count: 8,
    due: true,
    step: 5,
    finale: [
      "pokemon.legendary-mewtwo",
      "pokemon.elite-karen",
      "pokemon.elite-drake",
      "pokemon.elite-phoebe",
      "pokemon.elite-bruno",
      "pokemon.league-champion-lance",
    ],
  });
  session.discarded = 5;
  session.previousId = "pokemon.elite-bruno";
  // Lance, rolled and lost (a 1), back on the card.
  session.phase = "revealed";
  let s = returnToCard(rollDice(session, () => 0));
  await seed(page, s);
  await expect(page.locator(".study-face")).toHaveClass(/battle-lost/);
  await page.locator(".game-card").click();
  await expect(page.getByRole("button", { name: "Reveal card" })).toBeVisible();
  await page.getByRole("button", { name: "Reveal card" }).click();
  await expect(page.locator(".game-card .card-ribbon")).toHaveText(
    /^Champion · (Kanto|Hoenn)$/,
  );
  await expect(page.locator(".quest-meter")).toHaveAccessibleName("Champion");
  s = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), key);
  expect(s.phase).toBe("revealed");
  expect(s.quest).toMatchObject({ step: 5, lost: 1 });
  expect(s.quest!.finale[5]).not.toBe("pokemon.league-champion-lance");
});

async function seed(page: Page, session: SessionState) {
  await page.goto("./");
  await page.evaluate(
    ({ key, session }) => localStorage.setItem(key, JSON.stringify(session)),
    { key, session },
  );
  await page.reload();
}
// Play a League game through the engine: gyms first, rolling every dice card,
// until `stop` says when to hand it to the browser.
function playLeague(stop: (s: SessionState) => boolean) {
  let s = createSession(
    { version: 1, packIds: ["pokemon"], limit: null, quest: "pokemon" },
    cards,
    packs,
  );
  const gyms = s.order.filter((id) => id.startsWith("pokemon.gym-"));
  s.order = [...gyms, ...s.order.filter((id) => !gyms.includes(id))];
  while (!stop(s)) {
    s = advance(s);
    const card = currentCard(s);
    if (card.dice?.choice) s = skipRoll(s);
    else if (card.battle && !card.dice) s = settleBattle(s, true);
    else {
      if (card.dice) s = returnToCard(rollDice(s));
      s = advance(s);
    }
  }
  return s;
}

test("the badge case opens from the meter and names the leaders beaten", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 320, height: 568 });
  const session = playLeague((s) => s.quest!.count === 5);
  await seed(page, session);
  const meter = page.locator(".quest-meter");
  await expect(meter).toHaveAccessibleName("Badges: 5 of 8");
  await meter.click();
  const dialog = page.getByRole("dialog", { name: "Badges" });
  await expect(dialog).toBeVisible();
  const slots = dialog.locator(".badge-slot");
  await expect(slots).toHaveCount(8);
  await expect(dialog.locator(".badge-slot.earned")).toHaveCount(5);
  const first = cards.find((c) => c.id === session.order[0])!;
  await expect(slots.first()).toContainText(first.title);
  // The gauntlet is not spoiled.
  await expect(dialog.locator(".stage-record dd")).toHaveText([
    "Not yet faced",
    "Not yet faced",
    "Not yet faced",
  ]);
  // Fits a small phone without the page scrolling sideways.
  const box = await dialog.boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(320);
  await page.screenshot({ path: info.outputPath("badge-case-320.png") });
  await dialog.getByRole("button", { name: "Back to game" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(meter).toBeFocused();
});

test("@release beating the Champion opens the Hall of Fame", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 320, height: 568 });
  const session = playLeague((s) => s.phase === "complete");
  const champion = session.quest!.finale.at(-1)!;
  await seed(page, session);
  const hall = page.locator(".hall-of-fame");
  await expect(hall.locator("h1")).toHaveText(/Hall of\s*Fame\./);
  await expect(hall.locator(".hall-kicker")).toHaveText("Pokémon League");
  await expect(hall.locator(".badge-slot.earned")).toHaveCount(8);
  await expect(hall.locator(".stage-record > div.cleared")).toHaveCount(3);
  const name = cards.find((c) => c.id === champion)!.title;
  await expect(hall.locator(".stage-record dd").last()).toHaveText(name);
  await page.screenshot({
    path: info.outputPath("hall-of-fame-320.png"),
    fullPage: true,
  });
  await expect(page.getByRole("button", { name: "Play again" })).toBeVisible();
});

test("a finale card is dealt face down without turning the last one back over", async ({
  page,
}) => {
  // The finale deals between deck cards without moving the deck, so the
  // next card shares the last one's deck position.
  const session = playLeague(
    (s) =>
      !!s.quest?.due &&
      s.phase === "hidden" &&
      s.quest.step < s.quest.finale.length - 1 &&
      !currentCard(s).dice,
  );
  await seed(page, session);
  const card = page.locator(".game-card");
  await card.click();
  await expect(page.locator(".card-stage")).not.toHaveClass(/deal|flip/);
  await page.locator(".card-rotator").evaluate((el) => {
    (window as unknown as { __rotator?: Element }).__rotator = el;
  });
  await card.click();
  await expect(page.locator(".card-stage")).not.toHaveClass(/discard/);
  expect(
    await page.locator(".card-rotator").evaluate((el) => ({
      fresh: el !== (window as unknown as { __rotator?: Element }).__rotator,
      turning: el.getAnimations().length,
    })),
  ).toEqual({ fresh: true, turning: 0 });
});

test("@release every card of a League game wears the Ancient Mew pair", async ({
  page,
}) => {
  const bg = (selector: string, pseudo?: string) =>
    page
      .locator(selector)
      .first()
      .evaluate(
        (el, pseudo) => getComputedStyle(el, pseudo ?? null).backgroundImage,
        pseudo,
      );
  // A League game: back, deck stack and front all use the League pair.
  await seed(
    page,
    playLeague((s) => s.discarded === 1 && s.phase === "hidden"),
  );
  expect(await bg(".card-back")).toContain("card-back-league");
  expect(await bg(".deck-under")).toContain("card-back-league");
  expect(await bg(".card-stage", "::before")).toContain("card-back-league");
  await page.locator(".game-card").click();
  await expect(page.locator(".card-stage")).not.toHaveClass(/flip/);
  expect(await bg(".game-card .study-face")).toContain("league-front");
  await page.getByRole("button", { name: "Open game menu" }).click();
  await page
    .getByRole("button", { name: "Previous card", exact: true })
    .click();
  expect(await bg(".previous-card .study-face")).toContain("league-front");
  // Any other mode keeps the base pair.
  const plain = createSession(
    { version: 1, packIds: ["pokemon"], limit: 30 },
    cards,
    packs,
  );
  await seed(page, plain);
  expect(await bg(".card-back")).toContain("card-back.webp");
  expect(await bg(".card-back")).not.toContain("league");
  await page.locator(".game-card").click();
  await expect(page.locator(".card-stage")).not.toHaveClass(/flip/);
  expect(await bg(".game-card .study-face")).not.toContain("league-front");
});
