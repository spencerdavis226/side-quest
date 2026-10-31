// Shared setup for the production browser specs. Import `test` and `expect`
// from here, not from @playwright/test:
//
// - Every test is deterministic. Math.random is replaced by a generator
//   seeded from the test's title, both in this Node process (so engine
//   helpers that default to Math.random, like advance and rollDice, deal the
//   same cards every run) and in the page (so a game started from the setup
//   screen shuffles the same way every run). Prefer passing `rng(...)`
//   explicitly where a spec builds a session; the global seed is the net.
// - Reduced Motion is on by default (playwright.config.ts). The app settles
//   every flip, deal and banner at once, so tests wait on state instead of
//   animations. Specs that test motion opt back in with `motion`.
// - `seed` writes saved state before the first navigation, so a seeded test
//   costs one page load instead of goto + write + reload.
import { test as base, expect, type Page } from "@playwright/test";
import type { SessionState } from "../../src/game/types";

export { expect };
export const SESSION_KEY = "side-quest.session.v1";

/** A small, fast, seeded generator (mulberry32 over an FNV-1a hash). */
export function rng(seed: string | number): () => number {
  let state = 2166136261;
  for (const char of String(seed))
    state = Math.imul(state ^ char.charCodeAt(0), 16777619);
  return () => {
    state += 0x6d2b79f5;
    let n = state;
    n = Math.imul(n ^ (n >>> 15), n | 1);
    n ^= n + Math.imul(n ^ (n >>> 7), n | 61);
    return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
  };
}

/** The same generator as `rng`, as a page init script (it must be
 * self-contained: Playwright serializes it into the page). */
function seedPageRandom(seed: string) {
  let state = 2166136261;
  for (const char of seed)
    state = Math.imul(state ^ char.charCodeAt(0), 16777619);
  Math.random = () => {
    state += 0x6d2b79f5;
    let n = state;
    n = Math.imul(n ^ (n >>> 15), n | 1);
    n ^= n + Math.imul(n ^ (n >>> 7), n | 61);
    return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
  };
}

// The seed is the test's title path without the project, so Chromium and
// WebKit play the same game.
const seedOf = (info: { titlePath: string[] }) =>
  info.titlePath.slice(1).join(" › ");

export const test = base.extend<{ deterministic: void }>({
  context: async ({ context }, use, info) => {
    await context.addInitScript(seedPageRandom, seedOf(info));
    await use(context);
  },
  deterministic: [
    // eslint-disable-next-line no-empty-pattern
    async ({}, use, info) => {
      const real = Math.random;
      Math.random = rng(seedOf(info));
      await use();
      Math.random = real;
    },
    { auto: true },
  ],
});

/** Opt a spec (or a describe block) back into animation. */
export const motion = { reducedMotion: "no-preference" } as const;

let seeds = 0;
/** Write localStorage entries before the page's scripts run, then navigate
 * to `path` once. Each call's entries are written on the first load after
 * it only, so a later reload keeps whatever the app saved since, and a
 * second call in the same test replaces the first one's state. */
export async function seedStorage(
  page: Page,
  entries: Record<string, string | null>,
  path = "./",
) {
  const token = `seed-${++seeds}`;
  await page.addInitScript(
    ({ token, entries }) => {
      const done = JSON.parse(
        sessionStorage.getItem("__test-seeds") ?? "[]",
      ) as string[];
      if (done.includes(token)) return;
      for (const [key, value] of Object.entries(entries))
        if (value === null) localStorage.removeItem(key);
        else localStorage.setItem(key, value);
      sessionStorage.setItem("__test-seeds", JSON.stringify([...done, token]));
    },
    { token, entries },
  );
  await page.goto(path);
}

/** Start the app on a saved game (one navigation). */
export function seed(page: Page, session: SessionState | object) {
  return seedStorage(page, { [SESSION_KEY]: JSON.stringify(session) });
}

/** The saved game, as the app last wrote it. */
export const saved = (page: Page) =>
  page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), SESSION_KEY);

/** Wait `count` rendered frames: for sampling a style a frame or two after
 * an input, where no state change marks the moment. */
export const frames = (page: Page, count = 2) =>
  page.evaluate(
    (count) =>
      new Promise<void>((done) => {
        const step = (left: number) =>
          left ? requestAnimationFrame(() => step(left - 1)) : done();
        step(count);
      }),
    count,
  );

/** Replace the save on a page that is already open, and reload: for loops
 * that load many saves in one test (one navigation each, and no init
 * script left behind per save). It returns once the new page has started
 * (not at its load event): callers wait for what they check. */
export async function reseed(page: Page, session: object) {
  await page.evaluate(
    ({ key, session }) => localStorage.setItem(key, JSON.stringify(session)),
    { key: SESSION_KEY, session },
  );
  await page.reload({ waitUntil: "commit" });
}

/** Wait until `selector`'s box holds still across two rendered frames:
 * after a resize the card's size transitions (0.01 ms under Reduced Motion,
 * but it still lands on a later frame), so a measurement taken at once reads
 * the old size. Waits on the element itself rather than on every CSS
 * transition: WebKit can leave an unrelated one reported as running. */
export const layoutSettled = (page: Page, selector: string) =>
  page.waitForFunction(
    (selector) => {
      const el = document.querySelector(selector);
      if (!el) return false;
      const r = el.getBoundingClientRect();
      const box = [r.x, r.y, r.width, r.height].join();
      const w = window as unknown as { __box?: string };
      const still = w.__box === box;
      w.__box = still ? undefined : box;
      return still;
    },
    selector,
    { polling: "raf" },
  );

/** Turn motion back on for one test (before its first navigation), where a
 * whole file or block opting in with `motion` would be too broad. */
export const withMotion = (page: Page) =>
  page.emulateMedia({ reducedMotion: "no-preference" });
