import { test, expect, type Page } from "@playwright/test";
import sharp from "sharp";
import { createSession, advance } from "../../src/game/engine";
import { cards, packs } from "../../src/content/catalog";
const key = "side-quest.session.v1";
const core = packs.find((p) => p.id === "core")!;
const house = packs.find((p) => p.id === "house")!;
const vip = packs.find((p) => p.id === "vip")!;
const pokemon = packs.find((p) => p.id === "pokemon")!;
const plain = cards.filter((c) => !c.dice && core.cardIds.includes(c.id));
const longestRule = [...plain].sort(
  (a, b) => b.rules.length - a.rules.length,
)[0];
const longestTitle = [...plain].sort(
  (a, b) => b.title.length - a.title.length,
)[0];
const ruleCard = plain.find((c) => c.category === "rule")!;
const samples = [longestRule, longestTitle, ruleCard];
function revealed(card: (typeof cards)[number], list = [card]) {
  const session = createSession(
    { version: 1, packIds: ["core"], limit: list.length },
    list,
    [{ ...packs[0], cardIds: list.map((c) => c.id) }],
  );
  session.phase = "revealed";
  return session;
}
async function seed(page: Page, session: unknown) {
  await page.goto("./");
  await page.evaluate(
    ({ key, session }) => localStorage.setItem(key, JSON.stringify(session)),
    { key, session },
  );
  await page.reload();
  await page.evaluate(() => document.fonts.ready);
}
test("@release Core instructions fit at 390x844 with ratio, pack mark and no CTA occlusion", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const card of samples) {
    await seed(page, revealed(card));
    await expect(page.locator(".study-rules p")).toBeVisible();
    await expect(page.locator(".study-rules")).toHaveAttribute(
      "data-overflow",
      "none",
    );
    const m = await page.evaluate(() => {
      const rules = document.querySelector(".study-rules")!;
      const card = document
        .querySelector(".game-card")!
        .getBoundingClientRect();
      return {
        // 2px tolerance matches the overflow-affordance threshold (subpixel).
        fit: rules.scrollHeight <= rules.clientHeight + 2,
        fontSize: parseFloat(
          getComputedStyle(rules.querySelector("p")!).fontSize,
        ),
        ratio: card.width / card.height,
        mark: !!document.querySelector(
          ".card-footer .card-pack-marks .pack-logo-seal",
        ),
      };
    });
    expect(m.fit, `${card.id} rules should fit at 390x844`).toBe(true);
    expect(m.fontSize, `${card.id} readable table text`).toBeGreaterThanOrEqual(
      26,
    );
    expect(Math.abs(m.ratio - 2 / 3), `${card.id} ratio`).toBeLessThan(0.01);
    expect(m.mark, `${card.id} keeps its pack mark`).toBe(true);
  }
});
test("card parchment stays plain without an icon lattice or tint", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seed(page, revealed(samples[0]));
  await expect(page.locator(".study-rules p")).toHaveText(samples[0].rules);
  await expect(
    page.locator(".card-imprint-lattice, .card-imprint-tint"),
  ).toHaveCount(0);
  await expect(page.locator(".card-footer .pack-logo")).toBeVisible();
});
test("every pack seal stays inside the parchment at supported widths", async ({
  page,
}) => {
  for (const viewport of [
    { width: 320, height: 568 },
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
  ]) {
    await page.setViewportSize(viewport);
    for (const pack of [core, house, vip, pokemon]) {
      const card = cards.find((candidate) =>
        pack.cardIds.includes(candidate.id),
      )!;
      const session = createSession(
        {
          version: 1,
          packIds: pack.id === "core" ? ["core"] : ["core", pack.id],
          limit: 1,
        },
        [card],
        packs,
      );
      session.phase = "revealed";
      await seed(page, session);
      const mark = page.locator(".card-footer .pack-logo");
      await expect(mark).toHaveAttribute(
        "data-seal",
        new RegExp(`art/packs/${pack.id}\\.svg$`),
      );
      const geometry = await mark.evaluate((element) => {
        const seal = element.getBoundingClientRect();
        const parchment = element
          .closest(".study-body")!
          .getBoundingClientRect();
        const ink = getComputedStyle(
          element.querySelector(".pack-logo-seal")!,
          "::before",
        );
        return {
          inside:
            seal.left >= parchment.left &&
            seal.right <= parchment.right &&
            seal.top >= parchment.top &&
            seal.bottom <= parchment.bottom,
          mask: ink.maskImage || ink.webkitMaskImage,
        };
      });
      expect(
        geometry.inside,
        `${pack.id} seal stays inside at ${viewport.width}px`,
      ).toBe(true);
      expect(geometry.mask).toContain(`packs/${pack.id}.svg`);
    }
  }
});
test("Previous Card owns the same 2:3 geometry as gameplay", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const [a, b] = plain;
  let session = createSession(
    { version: 1, packIds: ["core"], limit: 3 },
    [a, b],
    [{ ...packs[0], cardIds: [a.id, b.id] }],
  );
  session = advance(advance(advance(session))); // reveal, discard, reveal
  await seed(page, session);
  await page.getByRole("button", { name: "Open game menu" }).click();
  await page
    .getByRole("button", { name: "Previous card", exact: true })
    .click();
  const ratio = await page
    .locator(".previous-card")
    .evaluate((el) => el.clientWidth / el.clientHeight);
  expect(Math.abs(ratio - 2 / 3)).toBeLessThan(0.01);
  const fits = await page.locator(".previous-card").evaluate((el) => {
    const card = el.getBoundingClientRect();
    const parent = el.parentElement!.getBoundingClientRect();
    return card.left >= parent.left && card.right <= parent.right;
  });
  expect(fits, "Previous Card must not clip its right rail in the dialog").toBe(
    true,
  );
  await expect(
    page.locator(".previous-card .card-pack-marks .pack-logo-seal"),
  ).toBeVisible();
  await page.setViewportSize({ width: 320, height: 568 });
  const back = await page
    .getByRole("button", { name: "Back to game" })
    .boundingBox();
  expect(back, "Back to game stays visible on a short phone").not.toBeNull();
  expect(back!.y).toBeGreaterThanOrEqual(0);
  expect(back!.y + back!.height).toBeLessThanOrEqual(568);
});
test("@release home fits Safari's visible height without moving Install into the status bar", async ({
  page,
}) => {
  // Match the owner's screenshot: League mode with Core, House, VIP and Pokémon.
  await page.addInitScript(() => {
    localStorage.setItem(
      "side-quest.settings.v1",
      JSON.stringify({
        choice: "quest",
        config: {
          version: 1,
          packIds: ["core", "house", "vip", "pokemon"],
          limit: null,
          quest: "pokemon",
        },
      }),
    );
  });
  for (const [width, height, top, bottom] of [
    [320, 548, 0, 0],
    [375, 548, 0, 0],
    [393, 635, 59, 34],
    [393, 650, 59, 34],
    [390, 844, 59, 34],
    [768, 1024, 0, 0],
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto("./");
    await expect(page.locator(".setup")).toBeVisible();
    await expect(page.locator(".pack-selector")).toContainText("350 cards");
    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({
      content: `:root { --top-safe: ${top}px; --bottom-safe: ${bottom}px }`,
    });
    const branding = await page
      .locator(".side-quest-title-crest")
      .evaluate((element) => {
        const image = element as HTMLImageElement;
        const bounds = image.getBoundingClientRect();
        const row = image.closest(".intro")!.getBoundingClientRect();
        return {
          decoded: image.complete && image.naturalWidth === 768,
          inside: bounds.left >= row.left && bounds.right <= row.right + 1,
          ratio: bounds.width / bounds.height,
        };
      });
    expect(branding.decoded).toBe(true);
    expect(branding.inside).toBe(true);
    expect(branding.ratio).toBeCloseTo(768 / 276, 2);
    const install = await page
      .getByRole("button", { name: "Add to Home Screen help" })
      .boundingBox();
    const play = await page
      .getByRole("button", { name: "Play", exact: true })
      .boundingBox();
    const at = `${width}×${height}, insets ${top}/${bottom}`;
    expect(
      install!.y,
      `Install clears status icons at ${at}`,
    ).toBeGreaterThanOrEqual(Math.max(16, top) + Math.min(20, top));
    expect(
      play!.y + play!.height,
      `Play clears bottom chrome at ${at}`,
    ).toBeLessThanOrEqual(height - Math.max(24, bottom) + 1);
    const geometry = await page.evaluate(() => {
      const root = document.querySelector("#root")!;
      window.scrollTo(0, 100);
      root.scrollTop = 100;
      return {
        page:
          document.documentElement.scrollHeight -
          document.documentElement.clientHeight,
        root: root.scrollHeight - root.clientHeight,
        horizontal: root.scrollWidth - root.clientWidth,
        pageY: window.scrollY,
        rootY: root.scrollTop,
      };
    });
    expect(geometry, `no page or home scrolling at ${at}`).toEqual({
      page: 0,
      root: 0,
      horizontal: 0,
      pageY: 0,
      rootY: 0,
    });
  }
  await page.getByRole("button", { name: /^Choose packs/ }).click();
  await expect(page.getByRole("dialog", { name: "Card packs" })).toBeVisible();
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Add to Home Screen help" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(page.locator(".card-stage")).toBeVisible();
});
test("an enlarged home keeps Play reachable through its own scroller", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 480 });
  await page.goto("./");
  await expect(page.locator(".setup")).toBeVisible();
  // The compact header fits even this short screen at normal size. Enlarged
  // text deliberately exercises the accessible overflow fallback.
  await page.addStyleTag({ content: ":root { font-size: 28px }" });
  const play = page.getByRole("button", { name: "Play", exact: true });
  await play.scrollIntoViewIfNeeded();
  const scrolled = await page.evaluate(() => ({
    pageY: window.scrollY,
    rootY: document.querySelector("#root")!.scrollTop,
  }));
  expect(scrolled.pageY).toBe(0);
  expect(scrolled.rootY).toBeGreaterThan(0);
  const bounds = (await play.boundingBox())!;
  expect(bounds.y).toBeGreaterThanOrEqual(0);
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(480);
  await play.click();
  await expect(page.locator(".card-stage")).toBeVisible();
});
test("@release the play screen fits a Safari tab at every phone height without scrolling", async ({
  page,
}) => {
  await seed(page, revealed(longestRule));
  await expect(page.locator(".card-stage")).toBeVisible();
  // Visible heights of a Safari tab with its toolbar showing, from an
  // iPhone SE to a Pro Max, plus the installed-app heights.
  for (const viewport of [
    { width: 375, height: 548 },
    { width: 375, height: 635 },
    { width: 393, height: 650 },
    { width: 393, height: 695 },
    { width: 402, height: 714 },
    { width: 440, height: 780 },
    { width: 393, height: 852 },
    { width: 820, height: 1050 },
  ]) {
    await page.setViewportSize(viewport);
    const fit = await page.evaluate(() => {
      const stage = document
        .querySelector(".card-stage")!
        .getBoundingClientRect();
      return {
        scrollHeight: document.documentElement.scrollHeight,
        clientHeight: document.documentElement.clientHeight,
        bottom: stage.bottom,
        ratio: stage.width / stage.height,
      };
    });
    const at = `${viewport.width}x${viewport.height}`;
    expect(fit.scrollHeight, `no page scroll at ${at}`).toBeLessThanOrEqual(
      fit.clientHeight,
    );
    expect(fit.bottom, `card ends above the fold at ${at}`).toBeLessThanOrEqual(
      viewport.height - 24,
    );
    // The stage is tilted 0.65deg, so its bounding box is a touch off 2:3.
    expect(fit.ratio, `card keeps 2:3 at ${at}`).toBeCloseTo(2 / 3, 1);
  }
});
test("an iOS top inset keeps topbar controls below the status-bar frost", async ({
  page,
}) => {
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("./");
  // Browser emulation cannot produce env() insets; pose an iPhone 15 Pro
  // inset so the Home Screen layout is measurable.
  await page.addStyleTag({ content: ":root { --top-safe: 59px }" });
  const install = await page
    .getByRole("button", { name: "Add to Home Screen help" })
    .boundingBox();
  expect(install, "Install control is laid out").not.toBeNull();
  // 59px inset + 20px clearance keeps the control out of the iOS 27 frost.
  expect(install!.y).toBeGreaterThanOrEqual(79);
  const chrome = await page.evaluate(() => {
    const root = getComputedStyle(document.documentElement);
    return {
      chrome: root.getPropertyValue("--chrome").trim(),
      html: root.backgroundColor,
      layers: getComputedStyle(document.body, "::before").backgroundImage,
      backdropHeight: parseFloat(
        getComputedStyle(document.body, "::before").height,
      ),
      visibleHeight: document.documentElement.clientHeight,
      standalone: document.documentElement.classList.contains("standalone"),
    };
  });
  expect(chrome.chrome).toBe("#271c11");
  expect(chrome.html).toBe("rgb(39, 28, 17)");
  // In a browser tab the wood is sized to the visible viewport, so Safari's
  // toolbars never push it beneath the paintable view.
  expect(chrome.standalone).toBe(false);
  expect(chrome.backdropHeight).toBeCloseTo(chrome.visibleHeight, 0);
  // The wood runs to the last row with no fade; the page background equals
  // that edge, which is what iOS shows before the page has painted.
  const atmosphere = await page.locator(".atmosphere").evaluate((el) => ({
    height: parseFloat(getComputedStyle(el).height),
    mask: getComputedStyle(el).maskImage,
  }));
  expect(atmosphere.height).toBeCloseTo(chrome.visibleHeight, 0);
  expect(atmosphere.mask).toBe("none");
  const { data, info } = await sharp(
    await page.screenshot({ animations: "disabled" }),
  )
    .raw()
    .toBuffer({ resolveWithObject: true });
  // Wood grain varies pixel to pixel, so compare the row's average.
  const edgePixel = [0, 1, 2].map((channel) => {
    let sum = 0;
    for (let x = 0; x < info.width; x++)
      sum +=
        data[((info.height - 1) * info.width + x) * info.channels + channel];
    return sum / info.width;
  });
  // The last painted row is wood whose average is the chrome colour.
  for (const [channel, target] of edgePixel.map(
    (value, i) => [value, [39, 28, 17][i]] as const,
  )) {
    expect(Math.abs(channel - target)).toBeLessThanOrEqual(8);
  }

  await seed(page, revealed(longestRule));
  await page.addStyleTag({ content: ":root { --top-safe: 59px }" });
  const menu = await page
    .getByRole("button", { name: "Open game menu" })
    .boundingBox();
  expect(menu, "game menu is laid out").not.toBeNull();
  expect(menu!.y).toBeGreaterThanOrEqual(79);
});
test("@release the installed app lays out at the full screen height and never scrolls the root", async ({
  page,
}) => {
  // Installed iOS apps report navigator.standalone. Emulation cannot reproduce
  // their short svh/dvh viewport (see docs/DEVICE_CHECKLIST.md); this checks
  // the layout targets the large viewport, which is the full screen there.
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "standalone", { value: true }),
  );
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("./");
  await expect(page.locator("html")).toHaveClass(/standalone/);
  const measure = () =>
    page.evaluate(() => {
      const html = document.documentElement;
      const root = document.querySelector("#root")!;
      const lvh = document.createElement("div");
      lvh.style.cssText = "position:fixed;top:0;height:100lvh;width:0";
      document.body.append(lvh);
      const screenHeight = lvh.getBoundingClientRect().height;
      lvh.remove();
      window.scrollTo(0, 80);
      return {
        screenHeight,
        html: html.getBoundingClientRect().height,
        htmlOverflow: getComputedStyle(html).overflowY,
        bodyOverflow: getComputedStyle(document.body).overflowY,
        root: root.getBoundingClientRect().height,
        rootOverflow: getComputedStyle(root).overflowY,
        app: document.querySelector(".app")!.getBoundingClientRect().bottom,
        backdrop: parseFloat(
          getComputedStyle(document.body, "::before").height,
        ),
        atmosphere: document
          .querySelector(".atmosphere")!
          .getBoundingClientRect().height,
        scrollY: window.scrollY,
        pageScroll: html.scrollHeight - html.clientHeight,
      };
    });
  const check = (m: Awaited<ReturnType<typeof measure>>) => {
    expect(m.screenHeight).toBe(852);
    // The document, the scroller, the layout and both backdrop layers all end
    // on the last row of the screen.
    for (const value of [m.html, m.root, m.app, m.backdrop, m.atmosphere])
      expect(value).toBeCloseTo(m.screenHeight, 0);
    // The root cannot scroll or be dragged off the top; tall content scrolls
    // inside #root instead.
    expect(m.htmlOverflow).toBe("hidden");
    expect(m.bodyOverflow).toBe("hidden");
    expect(m.rootOverflow).toBe("auto");
    expect(m.pageScroll).toBe(0);
    expect(m.scrollY).toBe(0);
  };
  check(await measure());
  // The bottom row is wood, not a flat fill.
  const { data, info } = await sharp(
    await page.screenshot({ animations: "disabled" }),
  )
    .raw()
    .toBuffer({ resolveWithObject: true });
  const lastRow = new Set<number>();
  for (let x = 0; x < info.width; x++)
    lastRow.add(data[((info.height - 1) * info.width + x) * info.channels]);
  expect(lastRow.size).toBeGreaterThan(4);

  await seed(page, revealed(longestRule));
  await expect(page.locator(".study-rules p")).toBeVisible();
  check(await measure());
  const card = (await page.locator(".game-card").boundingBox())!;
  expect(Math.abs(card.width / card.height - 2 / 3)).toBeLessThan(0.01);
  expect(card.y + card.height).toBeLessThanOrEqual(852);
});
test("@release a short phone scrolls long rules with a visible overflow affordance", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await seed(page, revealed(longestRule));
  // Enlarged text guarantees the longest plain rule overflows the short phone.
  await page.addStyleTag({ content: ":root {font-size:24px}" });
  await expect(page.locator(".study-rules")).toHaveAttribute(
    "data-overflow",
    "bottom",
  );
  expect(
    await page
      .locator(".study-rules p")
      .evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
  ).toBeGreaterThanOrEqual(39);
});
test("legacy artwork references keep their saved text on the shared ornate front", async ({
  page,
}) => {
  for (const card of [
    cards.find((c) => c.id === "core.cheers-idiots")!,
    plain[0],
  ]) {
    await seed(page, revealed(card));
    await expect(page.locator(".study-title h2")).toHaveText(card.title);
    await expect(page.locator(".study-rules p")).toHaveText(card.rules);
    await expect(page.locator(".study-illustration")).toHaveCount(0);
    expect(
      await page
        .locator(".study-face")
        .evaluate((el) => getComputedStyle(el).backgroundImage),
    ).toContain("ornate-teal-frame");
  }
});

test("ornate surface loads as one complete frame", async ({ page }) => {
  await seed(page, revealed(plain[0]));
  const size = await page.locator(".study-face").evaluate(async (el) => {
    const url = getComputedStyle(el).backgroundImage.match(
      /url\(["']?(.*?)["']?\)/,
    )![1];
    const image = new Image();
    image.src = url;
    await image.decode();
    return [image.naturalWidth, image.naturalHeight];
  });
  expect(size).toEqual([768, 1152]);
});

test("missing frame keeps readable leather and parchment fallback surfaces", async ({
  page,
}) => {
  await page.route("**/*ornate-teal-frame*", (route) => route.abort());
  await seed(page, revealed(plain[0]));
  const background = await page
    .locator(".study-face")
    .evaluate((el) => getComputedStyle(el).backgroundImage);
  expect(background).toContain("linear-gradient");
  expect(background).toContain("rgb(244, 223, 180)");
  await expect(page.locator(".study-title h2")).toHaveText(plain[0].title);
  await expect(page.locator(".study-rules p")).toHaveText(plain[0].rules);
});
