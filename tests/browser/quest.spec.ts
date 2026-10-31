import { type Page } from "@playwright/test";
import { test, expect, rng, seed, saved, withMotion } from "./support";
import {
  advance,
  canSendIn,
  canUseLoot,
  awaitingCatch,
  awaitingChoice,
  awaitingOffer,
  awaitingPress,
  awaitingVerdict,
  cashOut,
  canTakeOffer,
  createSession,
  currentCard,
  settleBattle,
  skipRoll,
  takeOffer,
  letGo,
} from "../../src/game/engine";
import { returnToCard, rollDice } from "../../src/game/dice";
import type { PartyState, SessionState } from "../../src/game/types";
import { cards, packs } from "../../src/content/catalog";

import { league, leagueAt } from "./sessions";
const reveal = (s: SessionState) => advance(s);
const meter = (page: Page) => page.locator(".crawl-meter");
const plaques = (page: Page) =>
  page.locator(".card-choice.offers .card-choice-option");

// Play a seeded League run through the engine, always evolving, walking
// past every other offer, cashing out of every push-your-luck cast and
// healing the team to full after each card, until `stop`. It throws rather
// than hand back a run it could not finish: a card it does not know how to
// play would otherwise seed a game stuck mid-route (the 2026-10-31 rods
// stalled about one run in five, the WebKit Hall of Fame "flake").
function playLeague(stop: (s: SessionState) => boolean, seed = 1) {
  const random = rng(`league run ${seed}`);
  let s = createSession(
    { ...league, packIds: [...league.packIds] },
    cards,
    packs,
    random,
  );
  for (let guard = 0; !stop(s); guard++) {
    if (s.phase === "complete" || guard === 2000)
      throw new Error(
        `playLeague stopped at ${currentCard(s).id} (${s.phase}) after ${guard} moves`,
      );
    s = advance(s, random);
    if (awaitingOffer(s)) {
      const offers = currentCard(s).offers!;
      const evolve = offers.findIndex((o) => o.evolve);
      s = takeOffer(
        s,
        evolve >= 0 && canTakeOffer(s, evolve) ? evolve : offers.length - 1,
        random,
      );
    } else if (awaitingCatch(s)) s = letGo(s, random);
    else if (awaitingChoice(s)) s = skipRoll(s, random);
    else if (awaitingVerdict(s)) s = settleBattle(s, true, random);
    else {
      if (currentCard(s).dice) s = returnToCard(rollDice(s, random));
      // A won cast of a rod waits for Cash out or Again (2026-10-31).
      if (awaitingPress(s)) s = cashOut(s, random);
      // A beaten wild Pokémon waits to be caught (2026-10-25).
      else s = awaitingCatch(s) ? letGo(s, random) : advance(s, random);
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
  await expect(brief).toContainText("16 HP · 8 gyms");
  // The League plays its own pack alone: the pack picker steps aside.
  await expect(page.getByRole("button", { name: /^Choose packs/ })).toHaveCount(
    0,
  );
  await page.screenshot({ path: info.outputPath("setup-320.png") });
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(meter(page)).toHaveAccessibleName(/^Team HP: 16 of 16/);
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

test("a starter evolves on a route, and the banner says what changed", async ({
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
    /What\? Charmander is evolving!\s*Charmeleon\s*Max HP 16 → 17\.$/,
  );
  await page.screenshot({ path: info.outputPath("evolution-banner.png") });
  expect((await saved(page)).quest.party).toMatchObject({ form: 1 });
  await meter(page).click();
  const dialog = page.getByRole("dialog", { name: "The team" });
  // Only the starter it is now.
  await expect(dialog.locator(".crawl-omen strong")).toHaveText("Charmeleon");
  await expect(dialog.locator(".crawl-omen .omen-rules")).toHaveText(
    "Max HP 17. +2 to route battle d20s.",
  );
  // It wears its type, with what it beats and what beats it, and the
  // badges have their own dialog.
  await expect(dialog.locator(".type-chips .type-chip")).toHaveText(["Fire"]);
  await expect(dialog.locator(".type-edges")).toContainText(
    "Strong againstGrassIceBugSteel",
  );
  await expect(dialog.locator(".type-edges")).toContainText(
    "Weak againstWaterGroundRock",
  );
  await expect(dialog.locator(".crawl-badges")).toHaveCount(0);
  await page.screenshot({ path: info.outputPath("team-dialog.png") });
  // How to play, from the pause menu, speaks the League's words.
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Open game menu" }).click();
  await page.getByRole("button", { name: "How to play" }).click();
  const guide = page.getByRole("dialog", { name: "How to play" });
  await expect(guide.locator(".guide-rows li")).toHaveCount(8);
  await expect(guide.locator(".guide-rows")).toContainText("Team HP");
  await expect(guide.locator(".guide-rows")).not.toContainText("Quaff");
  await guide.screenshot({ path: info.outputPath("league-guide.png") });
  await page.keyboard.press("Escape");
  // A reload keeps the form and does not replay the banner.
  await page.reload();
  await expect(page.locator(".evolution-banner")).toHaveCount(0);
});

test("Eevee's evolution lets the table pick its form", async ({
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
  // Never more than three plaques (2026-10-31): the three forms fold into
  // one Evolve plaque beside Press B, and it opens a sheet of forms.
  await expect(plaques(page)).toHaveCount(2);
  await expect(plaques(page).nth(0)).toHaveAccessibleName(
    "Evolve, drink 3: pick one of 3",
  );
  await expect(plaques(page).nth(1)).toHaveAccessibleName("Press B: 1 HP back");
  for (const spilled of await plaques(page).evaluateAll((els) =>
    els.map((e) => [
      e.scrollHeight - e.clientHeight,
      e.scrollWidth - e.clientWidth,
    ]),
  ))
    expect(Math.max(...spilled)).toBeLessThanOrEqual(1);
  await page.screenshot({ path: info.outputPath("eevee-320.png") });
  await plaques(page).nth(0).click();
  const forms = page.getByRole("dialog", { name: "Evolve into" });
  await expect(forms.locator(".extras-row")).toHaveCount(3);
  await expect(forms.locator(".extras-row strong")).toHaveText([
    "Vaporeon",
    "Jolteon",
    "Flareon",
  ]);
  await page.screenshot({ path: info.outputPath("eevee-forms-320.png") });
  await forms.locator(".extras-row").nth(1).click();
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
      "pokemon.route-zigzagoon",
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

test("a gym leader is a boss battle, and beating it earns a badge", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 320, height: 568 });
  // Byron, Sinnoh's sixth gym, has taken a hit and sent out his ace
  // (2026-10-25): Bastiodon is a duel, so the table settles it.
  await seed(page, reveal(leagueAt("pokemon.gym-byron", { hits: 1 })));
  await expect(page.locator(".game-card .card-ribbon")).toHaveText(
    "Gym Leader · Mine Badge",
  );
  await expect(page.locator(".game-card")).toHaveAccessibleName(
    /Bastiodon.*Choose Won or Lost/,
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
    "Mine",
  );
  await expect(dialog.locator(".crawl-badges .full").last()).toContainText(
    "Byron",
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

test("a type matchup shows before the roll, and the roll keeps the worse", async ({
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
  // The two dice are watched as they land: the overlay needs motion.
  await withMotion(page);
  await seed(page, reveal(leagueAt(water.id)));
  const ribbon = page.locator(".game-card .card-ribbon");
  await expect(ribbon.getByRole("img", { name: "Water type" })).toHaveCount(1);
  // No banner on the card: two red chevrons on the strip, tappable.
  await expect(page.locator(".game-card .type-matchup")).toHaveCount(0);
  const chip = page.locator(".tag-edge");
  await expect(chip).toHaveClass(/edge-disadvantage/);
  await expect(chip).toHaveAccessibleName("Type disadvantage");
  await page.screenshot({ path: info.outputPath("matchup-320.png") });
  await chip.click();
  const dialog = page.getByRole("dialog", { name: "Type matchup" });
  await expect(dialog).toContainText("Charmander");
  await expect(dialog).toContainText(
    `${water.title}'s Water moves are super effective against you!`,
  );
  await expect(dialog).toContainText("Roll two dice and keep the worse.");
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

test("a 2d6 battle against the type rolls four dice and keeps the lowest two", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 375, height: 667 });
  // Lt. Surge (Electric, 2d6) against Squirtle (Water). The four dice are
  // watched as they land: the overlay needs motion.
  await withMotion(page);
  await seed(
    page,
    reveal(leagueAt("pokemon.gym-lt-surge", {}, 0, "pokemon.starter-squirtle")),
  );
  await expect(page.locator(".tag-edge")).toHaveClass(/edge-disadvantage/);
  await page.locator(".tag-edge").click();
  await expect(page.getByRole("dialog")).toContainText(
    "Roll 4 dice and keep the lowest 2.",
  );
  await page.keyboard.press("Escape");
  await page.locator(".game-card").click();
  await expect(page.locator(".roll-stage")).toHaveAttribute(
    "data-renderer",
    /^settled:\d,\d,\d,\d$/,
    { timeout: 15000 },
  );
  await page.screenshot({ path: info.outputPath("four-dice-landed.png") });
  await expect(page.locator(".roll-layer")).toHaveCount(0);
  const roll = (await saved(page)).roll;
  const sorted = [...roll.values, ...roll.dropped].sort(
    (a: number, b: number) => a - b,
  );
  expect([...roll.values].sort((a: number, b: number) => a - b)).toEqual(
    sorted.slice(0, 2),
  );
  await expect(page.locator(".dice-result-faces .dice-result-face")).toHaveText(
    roll.values.map(String),
  );
  await expect(
    page.locator(".dice-result-dropped .dice-result-face"),
  ).toHaveText(roll.dropped.map(String));
  await page.screenshot({ path: info.outputPath("four-dice-card.png") });
});

test("a plaque-settled gym is the table's call: no type chip, the full cost", async ({
  page,
}) => {
  // Jasmine (Steel) against Charmander (Fire): a type edge on a roll, but
  // nothing for a type to bend on Won and Lost (2026-10-31).
  await seed(page, reveal(leagueAt("pokemon.gym-jasmine", { hearts: 10 })));
  await expect(page.locator(".hud-strip")).toBeVisible();
  await expect(page.locator(".tag-edge")).toHaveCount(0);
  await expect(page.locator(".game-card .stake-loss")).toHaveAccessibleName(
    "Losing costs 2 HP",
  );
  await page.getByRole("button", { name: "Lost", exact: true }).click();
  expect((await saved(page)).quest.party.hearts).toBe(8);
});

test("a strike reads the line for its matchup and costs HP only against the starter", async ({
  page,
}, info) => {
  const pidgey = cards.find((c) => c.id === "pokemon.route-pidgey")!;
  // Pidgey (Flying) against Bulbasaur (Grass): the foe has the edge.
  await seed(
    page,
    reveal(
      leagueAt(
        "pokemon.route-pidgey",
        { hearts: 9 },
        0,
        "pokemon.starter-bulbasaur",
      ),
    ),
  );
  await expect(page.locator(".tag-edge")).toHaveClass(/edge-disadvantage/);
  await expect(page.locator(".game-card .strike-line")).toHaveText(
    pidgey.strike!.disadvantage,
  );
  await expect(page.locator(".game-card .stake-loss")).toHaveAccessibleName(
    "Costs 1 HP",
  );
  await page.screenshot({ path: info.outputPath("strike-disadvantage.png") });
  await page.locator(".game-card").click();
  await expect.poll(async () => (await saved(page)).quest.party.hearts).toBe(8);
  // Against Pikachu (Electric) it is the starter's edge: the line gives, and
  // nothing is at stake.
  await seed(
    page,
    reveal(
      leagueAt(
        "pokemon.route-pidgey",
        { hearts: 9 },
        0,
        "pokemon.starter-pikachu",
      ),
    ),
  );
  await expect(page.locator(".game-card .strike-line")).toHaveText(
    pidgey.strike!.advantage,
  );
  await expect(page.locator(".game-card .stake-loss")).toHaveCount(0);
  // Beaten, Pidgey can join the team (2026-10-25); let it go.
  await page.getByRole("button", { name: "Let Pidgey go" }).click();
  await expect.poll(async () => (await saved(page)).quest.party.hearts).toBe(9);
});

test("the bag lets an item or a caught Pokémon go, after a second tap", async ({
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
        party: { ...q.party!, team: [PIDGEY], loot: ["shield"] },
      },
    }),
  );
  await page.locator(".tag-satchel").click();
  const bag = page.getByRole("dialog", { name: "Bag" });
  // One tap only asks: nothing is dropped, and "Keep" puts the button back.
  await bag.getByRole("button", { name: "Release Pidgey" }).click();
  await expect(
    bag.getByRole("button", { name: "Yes, release Pidgey" }),
  ).toBeVisible();
  await page.screenshot({ path: info.outputPath("bag-sure.png") });
  expect((await saved(page)).quest.party.team).toEqual([PIDGEY]);
  await bag.getByRole("button", { name: "Keep" }).click();
  await expect(
    bag.getByRole("button", { name: "Release Pidgey" }),
  ).toBeVisible();
  // The second tap lets it go, and an item goes the same way.
  await bag.getByRole("button", { name: "Release Pidgey" }).click();
  await bag.getByRole("button", { name: "Yes, release Pidgey" }).click();
  await expect
    .poll(async () => (await saved(page)).quest.party.team)
    .toBeUndefined();
  await bag.getByRole("button", { name: "Drop Protect" }).click();
  await bag.getByRole("button", { name: "Yes, drop Protect" }).click();
  await expect
    .poll(async () => (await saved(page)).quest.party.loot)
    .toEqual([]);
  await expect(page.locator(".tag-satchel")).toHaveAccessibleName(/empty/);
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

test("every card of a League game wears the Ancient Mew pair", async ({
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
    rng("plain pokemon"),
  );
  await seed(page, plain);
  expect(await bg(".card-back")).toContain("card-back.webp");
  expect(await bg(".card-back")).not.toContain("league");
  await page.locator(".game-card").click();
  await expect(page.locator(".card-stage")).not.toHaveClass(/flip/);
  expect(await bg(".game-card .study-face")).not.toContain("league-front");
});

// The League's caught Pokémon at 320px: a beaten wild Pokémon is caught for
// a drink and kept in the bag, and one whose type beats the foe is used on it.
test("@release a beaten wild Pokémon is caught into the bag, and sent in for +1", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 320, height: 568 });
  const PIDGEY = "pokemon.route-pidgey";
  // Pikachu's Electric beats Pidgey's Flying: the strike is won.
  await seed(page, reveal(leagueAt(PIDGEY, {}, 0, "pokemon.starter-pikachu")));
  const throwBall = page.getByRole("button", {
    name: /^Throw a ball at Pidgey: roll d20, \d+ or more catches it/,
  });
  await expect(throwBall).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Let Pidgey go" }),
  ).toBeVisible();
  await page.screenshot({ path: info.outputPath("catch.png") });
  // The ball is thrown for real: a d20 is saved and the result is read on
  // the card, caught or not.
  await throwBall.click();
  await expect(page.locator(".game-card .ball-result")).toBeVisible();
  await page.screenshot({ path: info.outputPath("thrown.png") });
  const thrown = (await saved(page)).quest.party.throw;
  expect(thrown.id).toBe(PIDGEY);
  expect(thrown.face).toBeGreaterThanOrEqual(1);
  expect(thrown.face).toBeLessThanOrEqual(20);
  // A natural 20 always catches: the next tap puts the card aside with
  // Pidgey on the team.
  const lucky = await saved(page);
  lucky.quest.party.throw = { id: PIDGEY, face: 20 };
  await seed(page, lucky);
  await expect(page.locator(".game-card .ball-result.caught")).toBeVisible();
  await page.locator(".game-card").click();
  await expect
    .poll(async () => (await saved(page)).quest.party.team)
    .toEqual([PIDGEY]);
  // Machop (Fighting, a d20 fight on Route 3); Pidgey's Flying beats it
  // and Pikachu's Electric is even on it (2026-10-31: a send-in adds to the
  // roll, a Nuzlocke).
  const MACHOP = "pokemon.route-machop";
  const s = leagueAt(MACHOP, {}, 0, "pokemon.starter-pikachu");
  const q = s.quest!;
  const finale = [...q.finale];
  const was = finale.indexOf(PIDGEY);
  if (was >= 0) finale[was] = finale[1];
  finale[1] = PIDGEY;
  await seed(
    page,
    reveal({
      ...s,
      previousId: finale[q.step - 1],
      quest: { ...q, finale, party: { ...q.party!, team: [PIDGEY] } },
    }),
  );
  const go = page.getByRole("button", { name: /^Go, Pidgey!/ });
  await expect(go).toBeVisible();
  await expect(go).toHaveAccessibleName(
    "Go, Pidgey! +1 to this roll. Win and it stays; lose and it faints.",
  );
  await page.screenshot({ path: info.outputPath("send-in.png") });
  // The caught Pokémon sits in the bag chip and the bag dialog.
  await expect(page.locator(".tag-satchel")).toHaveAccessibleName(/Pidgey/);
  await page.locator(".tag-satchel").click();
  const dialog = page.getByRole("dialog", { name: "Bag" });
  await expect(dialog.locator(".crawl-team li")).toContainText("Pidgey");
  await page.screenshot({ path: info.outputPath("bag-caught.png") });
  await page.keyboard.press("Escape");
  // The gem shows the roll to beat; Pidgey takes one off it.
  const gem = page.locator(".game-card .stake-target b");
  const need = Number((await gem.textContent())!.replace("+", ""));
  const box = (await go.boundingBox())!;
  expect(box.height).toBeGreaterThanOrEqual(44);
  expect(box.x + box.width).toBeLessThanOrEqual(320);
  await go.click();
  await expect(gem).toHaveText(`${need - 1}+`);
  await expect(page.locator(".tag-assist")).toHaveAccessibleName(
    "Pidgey sent in: +1 to the roll",
  );
  const after = await saved(page);
  expect(after.quest.party.assist).toBe(PIDGEY);
  expect(after.quest.party.team).toEqual([PIDGEY]);
  await page.screenshot({ path: info.outputPath("sent-in.png") });
});

// The Fisherman (Water, which beats the Fire starter) face up on Route 6, with
// the team's cards dealt just before it from the same route, as a save needs.
const FOE = "pokemon.route-fisherman";
const MATES = ["pokemon.route-rotom", "pokemon.route-breloom"];
function battleWith(
  party: Partial<PartyState>,
  team: string[] = [],
): SessionState {
  const s = leagueAt(FOE, party);
  const q = s.quest!;
  const finale = [...q.finale];
  let start = 0;
  for (const stage of q.stages) {
    if (stage.cards.some((c) => c.id === FOE)) break;
    start += stage.pick;
  }
  const put = (at: number, id: string) => {
    const was = finale.indexOf(id);
    if (was >= 0) finale[was] = finale[at];
    finale[at] = id;
  };
  const step = start + 2;
  team.forEach((id, i) => put(start + i, id));
  put(step, FOE);
  const omen = finale[0];
  return reveal({
    ...s,
    discarded: step,
    previousId: finale[step - 1],
    quest: {
      ...q,
      finale,
      step,
      party: {
        ...q.party!,
        omen,
        ...party,
        ...(team.length ? { team } : {}),
      },
    },
  });
}
// A Won/Lost battle can carry a few optional actions (an Escape Rope, two
// send-ins). However many there are, the card's foot never shows
// more than three plaques: a short one stays beside Won and Lost, the rest
// open from one "Use" plaque and its sheet. Checked at both phone widths.
for (const width of [320, 390]) {
  test(`${width}px: a battle's optional actions never crowd Won and Lost`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 700 });
    const cases: {
      name: string;
      party: Partial<PartyState>;
      team?: string[];
    }[] = [
      { name: "smoke", party: { loot: ["smoke"] } },
      {
        name: "smoke, one send-in",
        party: { loot: ["smoke"] },
        team: [MATES[0]],
      },
      { name: "smoke, two send-ins", party: { loot: ["smoke"] }, team: MATES },
    ];
    for (const { name, party, team = [] } of cases) {
      const s = battleWith(party, team);
      const ready = [
        ...(["smoke"] as const).filter((i) => canUseLoot(s, i)),
        ...(s.quest!.party!.team ?? []).filter((m) => canSendIn(s, m)),
      ];
      await seed(page, s);
      const foot = page.locator(".card-choice.verdict");
      await expect(foot, name).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      const options = foot.locator(".card-choice-option");
      const count = await options.count();
      expect(count, name).toBeLessThanOrEqual(3);
      const clipped = await options.evaluateAll((els) =>
        els
          .filter((el) =>
            [el, ...el.querySelectorAll("*")].some(
              (n) => n.scrollWidth > n.clientWidth + 1,
            ),
          )
          .map((el) => el.textContent),
      );
      expect(clipped, name).toEqual([]);
      for (const box of await options.evaluateAll((els) =>
        els.map((el) => el.getBoundingClientRect().toJSON()),
      ))
        expect(box.height, name).toBeGreaterThanOrEqual(44);
      if (ready.length > 1 || ready.some((r) => r.startsWith("pokemon."))) {
        expect(count, name).toBe(3);
        const use = foot.getByRole("button", { name: /^Use something/ });
        await expect(use).toContainText(`${ready.length} ready`);
        await page.screenshot({
          path: info.outputPath(`foot-${ready.length}-${width}.png`),
        });
        await use.click();
        const dialog = page.getByRole("dialog", { name: "Use one" });
        await expect(dialog.locator(".extras-row")).toHaveCount(ready.length);
        await page.screenshot({
          path: info.outputPath(`sheet-${ready.length}-${width}.png`),
        });
        // Every row can be reached and tapped.
        const last = dialog.locator(".extras-row").last();
        await last.scrollIntoViewIfNeeded();
        const row = (await last.boundingBox())!;
        expect(row.height, name).toBeGreaterThanOrEqual(44);
        expect(row.x + row.width, name).toBeLessThanOrEqual(width);
        await page.keyboard.press("Escape");
        await expect(dialog).toHaveCount(0);
      } else {
        expect(count, name).toBe(ready.length ? 3 : 2);
      }
    }
    // A battle settled with Won and Lost has no roll for a caught Pokémon
    // to add to (2026-10-31): no send-in, even with the whole team ready.
    const s = battleWith({}, MATES);
    await seed(page, s);
    await expect(page.locator(".card-choice.verdict")).toBeVisible();
    await expect(page.getByRole("button", { name: /^Go, / })).toHaveCount(0);
  });
}
