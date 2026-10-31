import { test, expect, seed as seedSession, rng } from "./support";
import { createSession } from "../../src/game/engine";
import { cards, packs } from "../../src/content/catalog";
const key = "side-quest.session.v1";
const plain = cards.find(
  (c) => !c.dice && packs.find((p) => p.id === "core")!.cardIds.includes(c.id),
)!;
// Seed one known non-dice card so reveal -> discard -> previous is deterministic.
async function seedPlain(page: import("@playwright/test").Page) {
  const session = createSession(
    { version: 1, packIds: ["core"], limit: 40 },
    [plain],
    [{ ...packs[0], cardIds: [plain.id] }],
    rng("pages:10"),
  );
  session.phase = "hidden";
  await seedSession(page, session);
}
test("@release Pages manifest, assets and production exclusion", async ({
  page,
  request,
  baseURL,
}) => {
  const failures: string[] = [];
  page.on("response", (r) => {
    if (r.status() >= 400) failures.push(r.url());
  });
  await page.goto("./?review=1");
  await expect(
    page.getByRole("button", { name: "Play", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Card review" })).toHaveCount(
    0,
  );
  await page.goto("./?workshop=1");
  await expect(
    page.getByRole("button", { name: "Play", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Card workshop" }),
  ).toHaveCount(0);
  const manifestURL = await page
    .locator('link[rel="manifest"]')
    .getAttribute("href");
  const response = await request.get(new URL(manifestURL!, baseURL).href);
  expect(response.ok()).toBe(true);
  const manifest = await response.json();
  const base = new URL(baseURL!).pathname;
  expect(manifest.start_url).toBe(base);
  expect(manifest.scope).toBe(base);
  expect(manifest.orientation).toBe("portrait");
  // The installed Home Screen strip, the launch background and the app's top
  // band are all painted from this colour, so the page root must agree.
  const background = manifest.background_color as string;
  const asRgb = `rgb(${[1, 3, 5]
    .map((index) => parseInt(background.slice(index, index + 2), 16))
    .join(", ")})`;
  expect(background).toBe(manifest.theme_color);
  expect(
    await page.evaluate(
      () => getComputedStyle(document.documentElement).backgroundColor,
    ),
  ).toBe(asRgb);
  expect(
    await page.evaluate(() =>
      getComputedStyle(document.documentElement)
        .getPropertyValue("--chrome")
        .trim(),
    ),
  ).toBe(background);
  for (const icon of manifest.icons)
    expect(
      (await request.get(new URL(icon.src, response.url()).href)).ok(),
    ).toBe(true);
  await page.evaluate(() => document.fonts.ready);
  expect(failures).toEqual([]);
});

test("a Home Screen web app hides Install but keeps the in-game menu", async ({
  page,
}) => {
  await page.addInitScript(() => {
    // WebKit exposes this legacy flag in iOS Home Screen web apps.
    Object.defineProperty(navigator, "standalone", {
      configurable: true,
      value: true,
    });
  });
  await page.goto("./");
  await expect(
    page.getByRole("button", { name: "Add to Home Screen help" }),
  ).toHaveCount(0);
  await expect(page.locator(".topbar")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Play", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(page.locator(".progress")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Open game menu" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Add to Home Screen help" }),
  ).toHaveCount(0);
});

test("@release first screen waits for its painted art and fonts", async ({
  page,
}) => {
  // The button art is held until the test lets it go, so "in flight" is a
  // state the test controls rather than a race against a timer. The page's
  // clock is held still too: the app draws a themed fallback after a 4 s cap
  // (main.tsx), and a slow runner must not reach it while the art is held.
  await page.clock.install({ time: new Date("2026-10-31T12:00:00Z") });
  await page.clock.pauseAt(new Date("2026-10-31T12:00:01Z"));
  let delivered = false;
  let release = () => {};
  const held = new Promise<void>((resolve) => (release = resolve));
  const requested = page.waitForRequest("**/art/button.webp");
  await page.route("**/art/button.webp", async (route) => {
    await held;
    delivered = true;
    await route.continue();
  });
  // Everything else the first screen waits for: the table, the crest and
  // the fonts. Once they are in, only the held art keeps the screen blank.
  const others = [
    "**/art/table.webp",
    "**/art/side-quest-title-crest.webp",
  ].map((url) => page.waitForResponse(url));
  // The preload hint holds the load event until the art arrives.
  await page.goto("./", { waitUntil: "commit" });
  const play = page.getByRole("button", { name: "Play", exact: true });
  await requested;
  await Promise.all(others);
  // Polled from here: the held clock also holds the page's frames.
  await expect
    .poll(() => page.evaluate(() => document.fonts.check("700 24px Grenze")))
    .toBe(true);
  // Nothing is drawn with the fallback bar while the art is in flight, a
  // few frames (by the page's clock) after everything else arrived.
  await page.clock.runFor(100);
  await expect(play).toHaveCount(0);
  expect(delivered).toBe(false);
  // The art alone, with the clock still held, lets the screen draw: the
  // held clock is not what kept it blank.
  release();
  await expect(play).toBeVisible();
  await page.clock.resume();
  expect(delivered).toBe(true);
  expect(
    await page.evaluate(
      () =>
        document.fonts.check("700 24px Grenze") &&
        document.fonts.check("italic 600 24px Grenze"),
    ),
  ).toBe(true);
});

test("Play keeps a themed fallback if its painted border has not loaded", async ({
  page,
}) => {
  await page.route("**/art/button.webp", (route) => route.abort());
  await page.goto("./");
  const play = page.getByRole("button", { name: "Play", exact: true });
  const style = await play.evaluate((el) => {
    const computed = getComputedStyle(el);
    return {
      background: computed.backgroundImage,
      radius: parseFloat(computed.borderRadius),
    };
  });
  expect(style.background).toContain("linear-gradient");
  expect(style.radius).toBeGreaterThanOrEqual(10);
  await play.click();
  await expect(
    page.getByRole("button", { name: "Open game menu" }),
  ).toBeVisible();
});

test("Core logo matches selection, card, pause legend and previous card", async ({
  page,
}) => {
  await page.goto("./");
  await page.getByRole("button", { name: "Choose packs" }).click();
  await expect(
    page
      .getByRole("dialog")
      .getByRole("button", { name: /The Core deck/ })
      .locator(".pack-logo"),
  ).toHaveAttribute("data-seal", /art\/packs\/core.svg$/);
  await page.getByRole("button", { name: "Done" }).click();
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(page.locator(".progress")).toBeVisible();
  await seedPlain(page);
  await page.getByRole("button", { name: "Reveal card", exact: true }).click();
  await expect(page.locator(".card-stage")).not.toHaveClass(/flip|settle|deal/);
  await expect(page.locator(".card-category")).toHaveCount(0);
  await expect(page.locator(".card-pack-marks .pack-logo")).toHaveAttribute(
    "data-seal",
    /art\/packs\/core.svg$/,
  );
  await page.locator(".game-card").click();
  await expect(page.locator(".card-stage")).not.toHaveClass(
    /discard|settle|deal/,
  );
  await page.getByRole("button", { name: "Open game menu" }).click();
  await expect(page.locator(".active-pack-list .pack-logo")).toHaveAttribute(
    "data-seal",
    /art\/packs\/core.svg$/,
  );
  await page
    .getByRole("button", { name: "Previous card", exact: true })
    .click();
  await expect(
    page.locator(".previous-card .card-pack-marks .pack-logo"),
  ).toHaveAttribute("data-seal", /art\/packs\/core.svg$/);
});
test.describe("a pack's cards that can't be fetched", () => {
  // The service worker would serve the precached chunk around the route.
  test.use({ serviceWorkers: "block" });
  test("reloads once, then says so instead of reloading again", async ({
    page,
  }) => {
    let loads = 0;
    page.on("load", () => loads++);
    await page.route("**/assets/core-deck-*.js", (route) => route.abort());
    await page.goto("./");
    // Setup warms Core's cards at once: the first failure reloads the page,
    // the one after that reload does not.
    await expect.poll(() => loads).toBe(2);
    await page.getByRole("button", { name: "Play", exact: true }).click();
    await expect(page.getByText("Couldn’t load the cards.")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Play", exact: true }),
    ).toBeEnabled();
    expect(loads).toBe(2);
  });
  test("Play says Dealing… while the cards are on their way", async ({
    page,
  }) => {
    let release: () => void = () => {};
    const ready = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route("**/assets/core-deck-*.js", async (route) => {
      await ready;
      await route.continue();
    });
    await page.goto("./");
    await page.getByRole("button", { name: "Play", exact: true }).click();
    const dealing = page.getByRole("button", { name: "Dealing…" });
    await expect(dealing).toBeDisabled();
    release();
    await expect(page.locator(".progress")).toBeVisible();
    const session = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!),
      key,
    );
    expect(session.config.packIds).toEqual(["core"]);
  });
});
test("the League's card art loads only once the League is chosen", async ({
  page,
}) => {
  const league: string[] = [];
  page.on("request", (r) => {
    if (/league-front|card-back-league/.test(r.url())) league.push(r.url());
  });
  await page.goto("./");
  await page.getByRole("button", { name: "Play", exact: true }).waitFor();
  // Give setup's own preloads time to go out.
  await page.waitForLoadState("networkidle");
  expect(league).toEqual([]);
  await page.getByRole("button", { name: /^Pokémon League/ }).click();
  await expect.poll(() => league.length).toBe(2);
});
