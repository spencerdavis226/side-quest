import { test, expect, type Page } from "@playwright/test";
import { createSession } from "../../src/game/engine";
import { rollDice } from "../../src/game/dice";
import { cards, packs } from "../../src/content/catalog";
const key = "side-quest.session.v1";
const cheers = cards.find((c) => c.id === "core.cheers-idiots")!;
const diceCard = cards.find((c) => c.dice)!;
function sessionFor(
  card: (typeof cards)[number],
  phase: "hidden" | "revealed",
  extra: (typeof cards)[number][] = [],
) {
  const list = [card, ...extra];
  const session = createSession(
    { version: 1, packIds: ["core"], limit: list.length },
    list,
    [{ ...packs[0], cardIds: list.map((c) => c.id) }],
  );
  // Keep the first card current so a seeded phase is deterministic.
  session.order = list.map((c) => c.id);
  session.position = 0;
  session.phase = phase;
  return session;
}
async function seed(page: Page, session: unknown) {
  await page.goto("./");
  await page.evaluate(
    ({ key, session }) => localStorage.setItem(key, JSON.stringify(session)),
    { key, session },
  );
  await page.reload();
  // The first render waits for the screen's art, so it lands after load.
  await page.locator("#root > *").first().waitFor({ state: "attached" });
}
// A CSS transform matrix parsed without a browser DOM (the specs run in Node).
const geometry = (transform: string) => {
  if (transform === "none") return { x: 0, y: 0, rotate: 0, scale: 1 };
  const n = transform
    .slice(transform.indexOf("(") + 1, -1)
    .split(",")
    .map(Number);
  const [a, b, e, f] = transform.startsWith("matrix3d(")
    ? [n[0], n[1], n[12], n[13]]
    : [n[0], n[1], n[4], n[5]];
  return { x: e, y: f, rotate: Math.atan2(b, a), scale: Math.hypot(a, b) };
};
const expectSame = (
  end: ReturnType<typeof geometry>,
  rest: ReturnType<typeof geometry>,
  label: string,
) => {
  expect(Math.abs(end.x - rest.x), `${label} x`).toBeLessThanOrEqual(0.5);
  expect(Math.abs(end.y - rest.y), `${label} y`).toBeLessThanOrEqual(0.5);
  expect(
    Math.abs(end.rotate - rest.rotate),
    `${label} rotate`,
  ).toBeLessThanOrEqual(0.001);
  expect(
    Math.abs(end.scale - rest.scale),
    `${label} scale`,
  ).toBeLessThanOrEqual(0.001);
};
test("the reveal turns through edge-on instead of presenting the front early", async ({
  page,
}) => {
  // Install the clock so the controller's completion timeout cannot settle the
  // turn while we inspect it.
  await page.clock.install();
  await seed(page, sessionFor(cheers, "hidden"));
  await page.getByRole("button", { name: "Reveal card" }).click();
  await page.waitForFunction(() =>
    document
      .getAnimations()
      .some(
        (a) =>
          a instanceof CSSTransition && a.transitionProperty === "transform",
      ),
  );
  const turn = await page.evaluate(() => {
    const rotator = document.querySelector(".card-rotator") as HTMLElement;
    const duration = parseFloat(getComputedStyle(rotator).transitionDuration);
    const animations = document.getAnimations();
    const scale = () => {
      const value = getComputedStyle(rotator).transform;
      if (value === "none") return 1;
      const body = value.slice(value.indexOf("(") + 1);
      return Number(body.match(/-?\d*\.?\d+(?:e-?\d+)?/i)![0]);
    };
    const at = (ms: number) => {
      for (const a of animations) {
        a.pause();
        a.currentTime = ms;
      }
      return scale();
    };
    return { duration, early: at(70), late: at(420) };
  });
  // +1 is the card back, -1 the front, 0 edge-on.
  expect(
    turn.early,
    "the back is still face-on early in the turn",
  ).toBeGreaterThan(0.5);
  expect(turn.late, "the front is presented before the end").toBeLessThan(-0.5);
  // One token owns the flip phase (theme.motion.flip === 560ms).
  expect(Math.abs(turn.duration - 0.56)).toBeLessThan(0.01);
});
test("the lifted card owns its shadow and no decorative reveal glint remains", async ({
  page,
}) => {
  await seed(page, sessionFor(cheers, "hidden"));
  const layers = await page.evaluate(() => {
    const card = document.querySelector(".game-card") as HTMLElement;
    const rotator = document.querySelector(".card-rotator") as HTMLElement;
    const front = document.querySelector(".card-front") as HTMLElement;
    return {
      cardShadow: getComputedStyle(card).boxShadow,
      rotatorShadow: getComputedStyle(rotator).boxShadow,
      glints: document.querySelectorAll(".reveal-glint").length,
      frontOverflow: getComputedStyle(front).overflow,
    };
  });
  // A shadow on the un-rotating button rendered as a stationary rectangular
  // slab behind the edge-on surface; it belongs on the turning quad.
  expect(layers.cardShadow).toBe("none");
  expect(layers.rotatorShadow).not.toBe("none");
  // The decorative end-of-reveal glint and its markup are gone.
  expect(layers.glints).toBe(0);
  expect(layers.frontOverflow).toBe("hidden");
  await page.getByRole("button", { name: "Reveal card", exact: true }).click();
  expect(await page.locator(".reveal-glint").count()).toBe(0);
});
test("no decorative dice-ready border glow or glow keyframes survive", async ({
  page,
}) => {
  await seed(page, sessionFor(diceCard, "revealed"));
  const accent = await page.evaluate(() => {
    const face = document.querySelector(".study-face")!;
    const before = getComputedStyle(face, "::before");
    const names = new Set<string>();
    for (const sheet of document.styleSheets) {
      for (const rule of sheet.cssRules) {
        if (rule instanceof CSSKeyframesRule) names.add(rule.name);
      }
    }
    return {
      diceReady: face.classList.contains("dice-ready"),
      beforeContent: before.content,
      beforeShadow: before.boxShadow,
      beforeAnimation: before.animationName,
      glow: names.has("dice-ready-glow"),
      pulse: names.has("dice-ready-pulse"),
      glint: names.has("glint"),
      stackSettle: names.has("stack-settle"),
    };
  });
  expect(accent.diceReady).toBe(false);
  expect(accent.beforeContent).toBe("none");
  expect(accent.beforeShadow).toBe("none");
  expect(accent.beforeAnimation).toBe("none");
  expect(accent.glow).toBe(false);
  expect(accent.pulse).toBe(false);
  expect(accent.glint).toBe(false);
  expect(accent.stackSettle).toBe(false);
});
test("a press never offsets the card and never jumps on release", async ({
  page,
}) => {
  await seed(page, sessionFor(cheers, "hidden"));
  const box = (await page.locator(".game-card").boundingBox())!;
  const mid = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  await page.mouse.move(mid.x, mid.y);
  await page.mouse.down();
  await page.waitForTimeout(60);
  const pressed = await page
    .locator(".game-card")
    .evaluate((el) => getComputedStyle(el).transform);
  // Release off the card so the press does not activate the reveal; the
  // question here is only whether the press offset existed.
  await page.mouse.move(4, 4);
  const held = await page
    .locator(".game-card")
    .evaluate((el) => getComputedStyle(el).transform);
  await page.mouse.up();
  await page.waitForTimeout(60);
  const released = await page
    .locator(".game-card")
    .evaluate((el) => getComputedStyle(el).transform);
  // The old :active rule lifted the card 3px; releasing it into an animation
  // produced a positional step. Press feedback is now non-positional.
  expect(pressed).toBe("none");
  expect(held).toBe("none");
  expect(released).toBe("none");
  // The press never activated the card.
  await expect(page.locator(".card-stage")).not.toHaveClass(/flip/);
});
test("flip lands on the same transform as its resting state", async ({
  page,
}) => {
  await seed(page, sessionFor(cheers, "hidden"));
  const frames = await page.evaluate(async () => {
    const card = document.querySelector(".game-card") as HTMLElement;
    const stage = () => document.querySelector(".card-stage")!.className;
    card.click();
    const animation = await new Promise<CSSAnimation>((resolve) => {
      const poll = () => {
        const current = card
          .getAnimations()
          .find(
            (item): item is CSSAnimation =>
              item instanceof CSSAnimation &&
              item.animationName === "lift-turn",
          );
        if (current) resolve(current);
        else requestAnimationFrame(poll);
      };
      poll();
    });
    // Seek to the authored landing frame. WebKit may drop the CSS animation
    // when React clears the phase class before dispatching animationend.
    animation.pause();
    animation.currentTime =
      animation.effect!.getComputedTiming().endTime ?? null;
    const end = getComputedStyle(card).transform;
    animation.play();
    await new Promise<void>((resolve) => {
      const poll = () => {
        if (!stage().includes("flip") && card.getAnimations().length === 0)
          resolve();
        else requestAnimationFrame(poll);
      };
      poll();
    });
    return { end, rest: getComputedStyle(card).transform };
  });
  // The lift-turn ends at its resting transform; a follow-up card-settle used
  // to restart the card 2px up (a fresh step after landing).
  expectSame(geometry(frames.end), geometry(frames.rest), "flip");
});
test("returning a rolled card settles without a positional jump", async ({
  page,
}) => {
  const rolled = rollDice(
    sessionFor(diceCard, "revealed", [cheers]),
    () => 0.5,
  );
  await seed(page, rolled);
  // A restored unresolved roll settles into the resolved card automatically;
  // the follow-up tap only puts the shown card aside.
  await expect(page.locator(".game-card")).toHaveAttribute(
    "aria-label",
    /Tap to put this card aside/,
  );
  await expect(page.locator(".card-stage")).not.toHaveClass(/settle/);
  const frames = await page.evaluate(() => {
    const rules = [...document.styleSheets].flatMap((sheet) => [
      ...sheet.cssRules,
    ]);
    const settle = rules.find(
      (rule): rule is CSSKeyframesRule =>
        rule instanceof CSSKeyframesRule && rule.name === "card-settle",
    )!;
    const matrix = (value: string) =>
      value === "none" ? "none" : new DOMMatrixReadOnly(value).toString();
    const frame = (key: string) =>
      matrix(
        ([...settle.cssRules] as CSSKeyframeRule[]).find(
          (rule) => rule.keyText === key,
        )!.style.transform,
      );
    return {
      start: frame("0%"),
      end: frame("100%"),
      rest: getComputedStyle(document.querySelector(".game-card")!).transform,
    };
  });
  // WebKit can remove the short settle before exposing a CSSAnimation. The
  // authored endpoints must both match the card after the return completes.
  expectSame(
    geometry(frames.start),
    geometry(frames.rest),
    "dice return start",
  );
  expectSame(geometry(frames.end), geometry(frames.rest), "dice return");
});
test("discard never shifts the exposed under card between frames and handoff", async ({
  page,
}) => {
  await seed(page, sessionFor(cheers, "revealed", [diceCard]));
  const result = await page.evaluate(async () => {
    const under = document.querySelector(".deck-under") as HTMLElement;
    const rest = getComputedStyle(under).transform;
    const samples: string[] = [];
    let running = true;
    const step = () => {
      samples.push(getComputedStyle(under).transform);
      if (running) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    (document.querySelector(".game-card") as HTMLElement).click();
    // Bounded: the discard is a 420ms animation, so this always lands well
    // before the deadline even on a slow renderer.
    const deadline = performance.now() + 4000;
    await new Promise<void>((resolve) => {
      const poll = () => {
        const stage = document.querySelector(".card-stage");
        if (!stage || !stage.className.trim() || performance.now() > deadline)
          resolve();
        else requestAnimationFrame(poll);
      };
      poll();
    });
    running = false;
    return { rest, samples, handoff: getComputedStyle(under).transform };
  });
  // stack-settle used to end the under card at 0 while it rests at 3px, so
  // removing the class made it jump. Every sampled frame must match the rest.
  expect(result.samples.length).toBeGreaterThan(4);
  for (const sample of [...result.samples, result.handoff])
    expectSame(geometry(sample), geometry(result.rest), "under card");
});
test("rapid taps during a reveal commit one action", async ({ page }) => {
  await seed(page, sessionFor(cheers, "hidden", [diceCard]));
  await expect(
    page.getByRole("button", { name: "Reveal card", exact: true }),
  ).toBeVisible();
  // Reveal and hammer the card in one synchronous burst, so every extra tap
  // lands while the turn is committed however slow the runner is. Dispatch
  // directly: Playwright's stability wait would block a real mid-flip click.
  await page.locator(".game-card").evaluate((el) => {
    for (let i = 0; i < 9; i++) (el as HTMLButtonElement).click();
  });
  await expect(page.locator(".progress")).toContainText("1 /");
  const saved = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    "side-quest.session.v1",
  );
  expect(saved.discarded).toBe(0);
  expect(saved.phase).toBe("revealed");
});
test("dragging an overflowing title scrubs instead of discarding", async ({
  page,
}) => {
  await seed(page, sessionFor(cheers, "revealed", [diceCard]));
  // Enlarged text is where the title becomes its own scroll container.
  await page.evaluate(() =>
    document.querySelector("main")!.classList.add("enlarged"),
  );
  const box = (await page.locator(".study-title").boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + 4);
  await page.mouse.down();
  for (let i = 1; i <= 6; i++)
    await page.mouse.move(box.x + box.width / 2, box.y + 4 + i * 6);
  await page.mouse.up();
  // The shared face gesture cancels the card action on any drag.
  await expect(page.locator(".card-stage")).not.toHaveClass(/discard/);
  const saved = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    "side-quest.session.v1",
  );
  expect(saved.discarded).toBe(0);
  expect(saved.phase).toBe("revealed");
});
test("hidden and turning cards never paint mirrored front content", async ({
  page,
}) => {
  await seed(page, sessionFor(cheers, "hidden"));
  await expect(page.locator(".card-front")).toHaveCSS("visibility", "hidden");
  await page.getByRole("button", { name: "Reveal card", exact: true }).click();
  // Sample several frames together with the renderer's facing decision.
  const mismatches = await page.evaluate(async () => {
    let mismatches = 0;
    for (let i = 0; i < 18; i++) {
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );
      const transform = getComputedStyle(
        document.querySelector(".card-rotator")!,
      ).transform;
      const frontFacing =
        transform !== "none" && new DOMMatrixReadOnly(transform).m11 < 0;
      const visible =
        getComputedStyle(document.querySelector(".card-front")!).visibility ===
        "visible";
      if (frontFacing !== visible) mismatches++;
    }
    return mismatches;
  });
  // The culling callback and sampling callback may straddle one render tick.
  expect(mismatches).toBeLessThanOrEqual(1);
  await expect(page.locator(".card-front")).toHaveCSS("visibility", "visible");
  await expect(page.locator(".card-back")).toHaveCSS("visibility", "hidden");
  await page.reload();
  await expect(page.locator(".card-front")).toHaveCSS("visibility", "visible");
});
test("hiding the tab stops the turn and resyncs the front on return", async ({
  page,
}) => {
  await seed(page, sessionFor(cheers, "hidden"));
  await page.getByRole("button", { name: "Reveal card", exact: true }).click();
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.waitForTimeout(120);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: false,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(page.locator(".card-stage")).not.toHaveClass(/flip/);
  await expect(page.locator(".card-front")).toHaveCSS("visibility", "visible");
});
