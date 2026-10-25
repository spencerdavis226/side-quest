import { test, expect, type Page } from "@playwright/test";
import {
  advance,
  awaitingChoice,
  awaitingOffer,
  awaitingVerdict,
  canTakeOffer,
  createSession,
  currentCard,
  settleBattle,
  skipRoll,
  takeOffer,
} from "../../src/game/engine";
import { returnToCard, rollDice } from "../../src/game/dice";
import type { PartyState, SessionState } from "../../src/game/types";
import { cards, packs } from "../../src/content/catalog";
const key = "side-quest.session.v1";

// Pokémon League plays on the crawl engine since 2026-10-16: a starter, eight
// routes each closed by a gym, a villain hideout, Victory Road, the rival and
// the League. The run's balance is tested in tests/league.balance.test.ts.
const league = {
  version: 1,
  packIds: ["pokemon"],
  limit: null,
  quest: "pokemon",
} as const;

// A League run with `id` in play at its stage's first step, the starter put
// aside, and the party as given. `hideout` picks which villain team's route
// (0 to 8) the run takes.
function leagueAt(
  id: string,
  party: Partial<PartyState> = {},
  hideout = 0,
  starter = "pokemon.starter-charmander",
): SessionState {
  const draws = [(hideout + 0.5) / 9];
  const s = createSession(
    { ...league, packIds: [...league.packIds] },
    cards,
    packs,
    () => (draws.length ? draws.shift()! : Math.random()),
  );
  const q = s.quest!;
  const finale = [...q.finale];
  let step = 0;
  let first = 0;
  for (const stage of q.stages) {
    if (stage.cards.some((c) => c.id === id)) step = first;
    else if (stage.elite?.some((c) => c.id === id)) step = first + 1;
    else {
      first += stage.pick;
      continue;
    }
    break;
  }
  const swap = (at: number, card: string) => {
    const was = finale.indexOf(card);
    if (was >= 0) finale[was] = finale[at];
    finale[at] = card;
  };
  swap(0, starter);
  if (step) swap(step, id);
  return {
    ...s,
    discarded: step,
    previousId: step ? finale[step - 1] : null,
    quest: {
      ...q,
      finale,
      step,
      party: { ...q.party!, ...(step ? { omen: starter } : {}), ...party },
    },
  };
}
const reveal = (s: SessionState) => advance(s);
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
const plaques = (page: Page) =>
  page.locator(".card-choice.offers .card-choice-option");

// Play a League run through the engine, always evolving, walking past every
// other offer and healing the team to full after each card, until `stop`.
function playLeague(stop: (s: SessionState) => boolean) {
  let s = createSession(
    { ...league, packIds: [...league.packIds] },
    cards,
    packs,
  );
  for (let guard = 0; guard < 2000 && !stop(s); guard++) {
    if (s.phase === "complete") break;
    s = advance(s);
    if (awaitingOffer(s)) {
      const offers = currentCard(s).offers!;
      const evolve = offers.findIndex((o) => o.evolve);
      s = takeOffer(
        s,
        evolve >= 0 && canTakeOffer(s, evolve) ? evolve : offers.length - 1,
      );
    } else if (awaitingChoice(s)) s = skipRoll(s);
    else if (awaitingVerdict(s)) s = settleBattle(s, true);
    else {
      if (currentCard(s).dice) s = returnToCard(rollDice(s));
      s = advance(s);
    }
    const party = s.quest!.party!;
    if (!party.wiped) party.hearts = party.max;
  }
  return s;
}

test("@release Pokémon League opens on a starter, then the first route", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("./");
  await page.getByRole("button", { name: /^Pokémon League/ }).click();
  const brief = page.locator(".crawl-brief");
  await expect(brief).toContainText("Pokémon night");
  await expect(brief).toContainText("17 HP · 8 gyms");
  // The League plays its own pack alone: the pack picker steps aside.
  await expect(page.getByRole("button", { name: /^Choose packs/ })).toHaveCount(
    0,
  );
  await page.screenshot({ path: info.outputPath("setup-320.png") });
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(meter(page)).toHaveAccessibleName(/^Team HP: 17 of 17/);
  await expect(page.locator(".crawl-progress")).toHaveAccessibleName(
    "Your starter",
  );
  await expect(page.locator(".stage-banner")).toHaveText(
    /Pokémon League\s*A starter chooses you/,
  );
  await page.locator(".game-card").click();
  await expect(page.locator(".game-card .card-ribbon")).toHaveText(
    "Your starter",
  );
  await page.screenshot({ path: info.outputPath("starter-320.png") });
  await page.locator(".game-card").click();
  await expect(page.locator(".crawl-progress")).toHaveAccessibleName(
    "Battle 1 of 4, Route 1",
  );
  const s = await saved(page);
  expect(s.config).toMatchObject({ packIds: ["pokemon"], quest: "pokemon" });
  expect(s.quest.party.omen).toMatch(/^pokemon\.starter-/);
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
  const s = await saved(page);
  expect(s.config.quest).toBeUndefined();
  expect(s.quest).toBeUndefined();
});

test("@release a starter evolves on a route, and the banner says what changed", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await seed(
    page,
    reveal(leagueAt("pokemon.route-rare-candy-1", { hearts: 9 })),
  );
  await expect(plaques(page)).toHaveCount(2);
  // The plaque names the form it brings.
  await expect(plaques(page).nth(0)).toHaveAccessibleName(
    "Charmeleon · drink 3: your starter evolves into Charmeleon",
  );
  await expect(plaques(page).nth(1)).toHaveAccessibleName("Press B: 1 HP back");
  await page.screenshot({ path: info.outputPath("evolution-card.png") });
  await plaques(page).nth(0).click();
  const banner = page.locator(".evolution-banner");
  await expect(banner).toHaveText(
    /What\? Charmander is evolving!\s*Charmeleon\s*Max HP 17 → 18\.$/,
  );
  await page.screenshot({ path: info.outputPath("evolution-banner.png") });
  expect((await saved(page)).quest.party).toMatchObject({ form: 1 });
  await meter(page).click();
  const dialog = page.getByRole("dialog", { name: "The team" });
  // Only the starter it is now, and its power.
  await expect(dialog.locator(".crawl-omen strong")).toHaveText("Charmeleon");
  await expect(dialog.locator(".crawl-omen .omen-rules")).toHaveText(
    "Max HP 18. +2 to route battle d20s.",
  );
  // It wears its type, with what it beats and what beats it, and the
  // badges have their own dialog.
  await expect(dialog.locator(".type-chips .type-chip")).toHaveText(["Fire"]);
  await expect(dialog.locator(".type-edges")).toContainText(
    "Strong againstGrassIceBugSteelFairy",
  );
  await expect(dialog.locator(".type-edges")).toContainText(
    "Weak againstWaterGroundRockDragon",
  );
  await expect(dialog.locator(".crawl-badges")).toHaveCount(0);
  await page.screenshot({ path: info.outputPath("team-dialog.png") });
  // How to play, from the pause menu, speaks the League's words: no Quaff,
  // no Cup.
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Open game menu" }).click();
  await page.getByRole("button", { name: "How to play" }).click();
  const guide = page.getByRole("dialog", { name: "How to play" });
  await expect(guide.locator(".guide-rows li")).toHaveCount(7);
  await expect(guide.locator(".guide-rows")).toContainText("Team HP");
  await expect(guide.locator(".guide-rows")).not.toContainText("Quaff");
  await guide.screenshot({ path: info.outputPath("league-guide.png") });
  await page.keyboard.press("Escape");
  // A reload keeps the form and does not replay the banner.
  await page.reload();
  await expect(page.locator(".evolution-banner")).toHaveCount(0);
});

test("@release Eevee's evolution lets the table pick its form", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await seed(
    page,
    reveal(
      leagueAt(
        "pokemon.route-rare-candy-1",
        { hearts: 9 },
        0,
        "pokemon.starter-eevee",
      ),
    ),
  );
  // Evolve splits into the three forms; Press B stays.
  await expect(plaques(page)).toHaveCount(4);
  await expect(plaques(page).nth(0)).toHaveAccessibleName(
    "Vaporeon · drink 3: your starter evolves into Vaporeon",
  );
  await expect(plaques(page).nth(3)).toHaveAccessibleName("Press B: 1 HP back");
  // Four plaques fit inside the card on a small phone.
  const [card, last] = await Promise.all([
    page.locator(".game-card").boundingBox(),
    plaques(page).nth(3).boundingBox(),
  ]);
  expect(last!.x + last!.width).toBeLessThanOrEqual(card!.x + card!.width);
  // Nothing spills out of a plaque, and a form's name stays whole.
  for (const spilled of await plaques(page).evaluateAll((els) =>
    els.map((e) => [
      e.scrollHeight - e.clientHeight,
      e.scrollWidth - e.clientWidth,
    ]),
  ))
    expect(Math.max(...spilled)).toBeLessThanOrEqual(1);
  await expect(plaques(page).nth(0).locator(".offer-name")).toHaveText(
    "Vaporeon",
  );
  await expect(plaques(page).nth(0).locator(".offer-price")).toHaveText(
    "drink 3",
  );
  await page.screenshot({ path: info.outputPath("eevee-320.png") });
  await plaques(page).nth(1).click();
  await expect(page.locator(".evolution-banner")).toHaveText(
    /What\? Eevee is evolving!\s*Jolteon/,
  );
  expect((await saved(page)).quest.party).toMatchObject({ form: 2 });
  await meter(page).click();
  const dialog = page.getByRole("dialog", { name: "The team" });
  await expect(dialog.locator(".crawl-omen strong")).toHaveText("Jolteon");
});

test("a Rare Candy evolves the starter from the bag", async ({ page }) => {
  await seed(
    page,
    leagueAt(
      "pokemon.route-pidgey",
      { hearts: 9, loot: ["candy"] },
      0,
      "pokemon.starter-froakie",
    ),
  );
  // The bag chip on the strip opens the bag.
  await page.locator(".tag-satchel").click();
  const bag = page.getByRole("dialog", { name: "Bag" });
  await expect(bag.locator(".satchel-slot").first()).toContainText(
    "Rare Candy",
  );
  await bag.getByRole("button", { name: "Use" }).click();
  expect((await saved(page)).quest.party).toMatchObject({
    form: 1,
    loot: ["smoke"],
  });
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await meter(page).click();
  const dialog = page.getByRole("dialog", { name: "The team" });
  await expect(dialog.locator(".crawl-omen strong")).toHaveText("Frogadier");
});

test("a fully evolved starter can only press B", async ({ page }) => {
  await seed(
    page,
    reveal(leagueAt("pokemon.route-rare-candy-1", { form: 2, hearts: 9 })),
  );
  await expect(plaques(page).nth(0)).toBeDisabled();
  await expect(plaques(page).nth(0)).toHaveAccessibleName(
    "Evolve · drink 3: your starter is fully evolved",
  );
  await plaques(page).nth(1).click();
  expect((await saved(page)).quest.party).toMatchObject({
    hearts: 10,
    form: 2,
  });
});

test("@release a gym leader is a boss battle, and beating it earns a badge", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 320, height: 568 });
  // Jasmine, Johto's sixth gym, has no dice: the table settles it.
  await seed(page, reveal(leagueAt("pokemon.gym-jasmine")));
  await expect(page.locator(".game-card .card-ribbon")).toHaveText(
    "Gym Leader · Mineral Badge",
  );
  await expect(page.locator(".crawl-progress")).toHaveAccessibleName(
    /^Boss battle/,
  );
  await page.screenshot({ path: info.outputPath("gym-320.png") });
  // A stray tap does nothing; the verdict decides.
  await page.locator(".game-card").click({ force: true });
  await expect(
    page.getByRole("button", { name: "Lost", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Won", exact: true }).click();
  // The badges chip opens the badge case, not the team.
  await page.locator(".tag-badges").click();
  const dialog = page.getByRole("dialog", { name: "Badges" });
  // The five gyms before it count as beaten in this seeded run.
  await expect(dialog.locator(".crawl-badges")).toHaveAccessibleName(
    "Badges: 6 of 8",
  );
  await expect(dialog.locator(".crawl-badges .full")).toHaveCount(6);
  // Each badge wears its gym's type, named with its leader.
  await expect(dialog.locator(".crawl-badges .full").last()).toContainText(
    "Mineral",
  );
  await expect(dialog.locator(".crawl-badges .full").last()).toContainText(
    "Jasmine",
  );
  await expect(
    dialog.locator(".crawl-badges .full").last().locator(".type-steel"),
  ).toHaveCount(1);
  const box = await dialog.boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(320);
  await expect(dialog).toContainText("One for each gym beaten.");
  await page.screenshot({ path: info.outputPath("badges-320.png") });
});

test("@release a type matchup shows before the roll, and the roll keeps the worse", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 320, height: 568 });
  // A Water gym on a d20 against Charmander: not very effective.
  const water = cards.find(
    (c) =>
      c.quest === "pokemon" &&
      c.type === "water" &&
      c.dice?.count === 1 &&
      c.dice.sides === 20,
  )!;
  await seed(page, reveal(leagueAt(water.id)));
  const ribbon = page.locator(".game-card .card-ribbon");
  await expect(ribbon.getByRole("img", { name: "Water type" })).toHaveCount(1);
  // No banner on the card: two red chevrons on the strip, tappable.
  await expect(page.locator(".game-card .type-matchup")).toHaveCount(0);
  const chip = page.locator(".tag-edge");
  await expect(chip).toHaveClass(/edge-disadvantage/);
  await expect(chip).toHaveAccessibleName("Not very effective: disadvantage");
  await page.screenshot({ path: info.outputPath("matchup-320.png") });
  await chip.click();
  const dialog = page.getByRole("dialog", { name: "Type matchup" });
  await expect(dialog).toContainText("Charmander");
  await expect(dialog).toContainText("Not very effective…");
  await expect(dialog).toContainText("Roll twice and keep the worse.");
  await page.screenshot({ path: info.outputPath("matchup-dialog-320.png") });
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  // Both attempts are thrown; the card keeps one and strikes the other.
  await page.locator(".game-card").click();
  await expect(page.locator(".roll-stage")).toHaveAttribute(
    "data-renderer",
    /^settled:\d+,\d+$/,
    { timeout: 15000 },
  );
  await expect(page.locator(".roll-layer")).toHaveCount(0);
  const roll = (await saved(page)).roll;
  expect(roll.edge).toBe("disadvantage");
  await expect(page.locator(".dice-result-faces .dice-result-face")).toHaveText(
    roll.values.map(String),
  );
  await expect(
    page.locator(".dice-result-dropped .dice-result-face"),
  ).toHaveText(roll.dropped.map(String));
  await page.screenshot({ path: info.outputPath("matchup-rolled-320.png") });
});

test("a Tera Orb turns a bad matchup around for one battle", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 320, height: 568 });
  const water = cards.find(
    (c) =>
      c.quest === "pokemon" &&
      c.type === "water" &&
      c.dice?.count === 1 &&
      c.dice.sides === 20,
  )!;
  await seed(page, reveal(leagueAt(water.id, { loot: ["tera"] })));
  await expect(page.locator(".tag-edge")).toHaveClass(/edge-disadvantage/);
  const orb = page.getByRole("button", { name: /^Use the Tera Orb/ });
  await expect(orb).toHaveText("Terastallize");
  await page.screenshot({ path: info.outputPath("tera-plaque-320.png") });
  await orb.click();
  await expect(page.locator(".tag-edge")).toHaveClass(/edge-advantage/);
  expect((await saved(page)).quest.party).toMatchObject({
    loot: [],
    tera: water.id,
  });
  await page.locator(".tag-edge").click();
  const dialog = page.getByRole("dialog", { name: "Type matchup" });
  await expect(dialog).toContainText("Terastallized!");
  await expect(dialog).toContainText("Charmander (Tera)");
  await expect(dialog).toContainText("Grass");
  await expect(dialog).toContainText("Roll twice and keep the better.");
  await page.screenshot({ path: info.outputPath("tera-dialog-320.png") });
});

test("a plaque-settled gym against a weaker type costs 1 HP less", async ({
  page,
}) => {
  // Jasmine (Steel) against Charmander (Fire).
  await seed(page, reveal(leagueAt("pokemon.gym-jasmine", { hearts: 10 })));
  await expect(page.locator(".tag-edge")).toHaveClass(/edge-advantage/);
  // The seal shows the HP the loss will cost: 2, less 1.
  await expect(page.locator(".game-card .stake-loss")).toHaveAccessibleName(
    "Losing costs 1 HP",
  );
  await page.getByRole("button", { name: "Lost", exact: true }).click();
  expect((await saved(page)).quest.party.hearts).toBe(9);
});

test("Veteran Ada shuts the badge case until her card is put aside", async ({
  page,
}, info) => {
  await seed(page, reveal(leagueAt("pokemon.route-veteran-victory")));
  const chip = page.locator(".tag-badges");
  await expect(chip).toBeDisabled();
  await expect(chip).toHaveAccessibleName(
    /^Badges: \d of 8, locked, name them from memory$/,
  );
  await expect(chip.locator(".chip-lock")).toHaveCount(1);
  await page.screenshot({ path: info.outputPath("badges-locked.png") });
  // The team dialog still opens, and shows no badges.
  await meter(page).click();
  const team = page.getByRole("dialog", { name: "The team" });
  await expect(team.locator(".crawl-badges")).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  // Settling her battle opens the case again.
  await page.getByRole("button", { name: "Won", exact: true }).click();
  await expect(chip).toBeEnabled();
  await expect(chip.locator(".chip-lock")).toHaveCount(0);
});

test("losing the last HP whites the team out", async ({ page }, info) => {
  await seed(page, reveal(leagueAt("pokemon.gym-jasmine", { hearts: 1 })));
  await page.getByRole("button", { name: "Lost", exact: true }).click();
  await expect(page.locator(".crawl-end.wiped h1")).toHaveText(
    /Whited\s*out\./,
  );
  await page.screenshot({ path: info.outputPath("whited-out.png") });
});

test("@release beating the Champion opens the Hall of Fame", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 320, height: 568 });
  const session = playLeague((s) => s.phase === "complete");
  expect(session.quest!.party!.wiped).toBe(false);
  await seed(page, session);
  await expect(page.locator(".crawl-end h1")).toHaveText(/Hall of\s*Fame\./);
  await expect(page.locator(".crawl-badges")).toHaveAccessibleName(
    "Badges: 8 of 8",
  );
  await page.screenshot({
    path: info.outputPath("hall-of-fame-320.png"),
    fullPage: true,
  });
  await expect(page.getByRole("button", { name: "Play again" })).toBeVisible();
});

test("a League card is dealt face down without turning the last one back over", async ({
  page,
}) => {
  const session = playLeague(
    (s) =>
      s.phase === "hidden" &&
      s.quest!.step > 2 &&
      s.quest!.step < s.quest!.finale.length - 1 &&
      !currentCard(s).dice &&
      !currentCard(s).offers,
  );
  await seed(page, session);
  const card = page.locator(".game-card");
  await card.click();
  await expect(page.locator(".card-stage")).not.toHaveClass(/deal|flip/);
  await page.locator(".card-rotator").evaluate((el) => {
    (window as unknown as { __rotator?: Element }).__rotator = el;
  });
  if (currentCard(advance(session)).battle)
    await page.getByRole("button", { name: "Won", exact: true }).click();
  else await card.click();
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

test("every League card fits its face with its plaques at 393x640", async ({
  page,
}) => {
  // About 400 cards since the 2026-10-25 type expansion, each reloaded.
  test.setTimeout(600000);
  await page.setViewportSize({ width: 393, height: 640 });
  const pack = packs.find((p) => p.id === "pokemon")!;
  const deck = new Set(pack.cardIds);
  const ids = cards
    .filter((c) => c.id.startsWith("pokemon.") && !deck.has(c.id))
    .map((c) => c.id);
  // Which villain route holds a hideout card.
  const hideoutOf = (id: string) => {
    for (let h = 0; h < 9; h++)
      if (
        leagueAt(id, {}, h).quest!.stages.some((st) =>
          st.cards.some((c) => c.id === id),
        )
      )
        return h;
    return 0;
  };
  const overflowing: string[] = [];
  await page.goto("./");
  for (const id of ids) {
    const starter = id.startsWith("pokemon.starter-");
    // An Escape Rope in the bag puts its plaque on every route fight.
    const s = reveal(
      starter
        ? leagueAt(id, {}, 0, id)
        : leagueAt(id, { loot: ["smoke"] }, hideoutOf(id)),
    );
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
