import { test, expect } from "./support";

const safari = "AppleWebKit/605.1.15 Version/26.0 Mobile/15E148 Safari/604.1";
test("installation information is limited to Safari on an uninstalled iPhone/iPad", async ({
  page,
}) => {
  for (const [userAgent, maxTouchPoints, standalone, dismissed, eligible] of [
    [
      `Mozilla/5.0 (iPhone; CPU iPhone OS 26_0) ${safari}`,
      5,
      false,
      false,
      true,
    ],
    [`Mozilla/5.0 (iPad; CPU OS 26_0) ${safari}`, 5, false, false, true],
    [
      `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) ${safari}`,
      5,
      false,
      false,
      true,
    ],
    [
      `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) ${safari}`,
      0,
      false,
      false,
      false,
    ],
    [`Mozilla/5.0 (iPhone) ${safari} CriOS/140`, 5, false, false, false],
    [`Mozilla/5.0 (iPhone) ${safari} FxiOS/140`, 5, false, false, false],
    [`Mozilla/5.0 (iPhone) ${safari} EdgiOS/140`, 5, false, false, false],
    [
      "Mozilla/5.0 (Linux; Android 15) Chrome/140 Safari/537.36",
      5,
      false,
      false,
      false,
    ],
    [
      "Mozilla/5.0 (iPhone) AppleWebKit/605.1.15 Mobile/15E148",
      5,
      false,
      false,
      false,
    ],
    [`Mozilla/5.0 (iPhone) ${safari}`, 5, true, false, false],
    [`Mozilla/5.0 (iPhone) ${safari}`, 5, false, true, false],
  ] as const) {
    await page.goto("./");
    await page.evaluate(
      ({ userAgent, maxTouchPoints, standalone, dismissed }) => {
        localStorage.clear();
        if (dismissed)
          localStorage.setItem("side-quest.install-help-dismissed.v1", "true");
        // Keep each pose for this reload, without accumulating init scripts.
        sessionStorage.setItem(
          "install-test-pose",
          JSON.stringify({ userAgent, maxTouchPoints, standalone }),
        );
      },
      { userAgent, maxTouchPoints, standalone, dismissed },
    );
    // One init script consumes the pose in the next page.
    if (userAgent === `Mozilla/5.0 (iPhone; CPU iPhone OS 26_0) ${safari}`) {
      await page.addInitScript(() => {
        const pose = JSON.parse(
          sessionStorage.getItem("install-test-pose") || "null",
        );
        if (!pose) return;
        for (const name of ["userAgent", "maxTouchPoints", "standalone"])
          Object.defineProperty(navigator, name, {
            configurable: true,
            value: pose[name],
          });
      });
    }
    await page.reload();
    await expect(
      page.getByRole("heading", { name: "Side Quest", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Install app", exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Add to Home Screen help" }),
    ).toHaveCount(eligible ? 1 : 0);
  }
});

test("installation help opens instructions and Already added stays hidden after reload", async ({
  page,
}) => {
  await page.goto("./");
  const help = page.getByRole("button", { name: "Add to Home Screen help" });
  await help.click();
  const dialog = page.getByRole("dialog", { name: "Add to Home Screen" });
  await expect(dialog).toContainText("Share");
  await expect(dialog).toContainText("Add to Home Screen");
  await expect(dialog).toContainText("Open as Web App");
  await page.getByRole("button", { name: "Got it", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(help).toBeFocused();
  await help.click();
  await page
    .getByRole("button", { name: "Already added — hide this hint" })
    .click();
  await expect(help).toHaveCount(0);
  await page.reload();
  await expect(help).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Play", exact: true }),
  ).toBeVisible();
});

test("the title retains readable text if its crest cannot load", async ({
  page,
}) => {
  await page.route("**/art/side-quest-title-crest.webp", (route) =>
    route.abort(),
  );
  await page.goto("./");
  await expect(
    page.getByRole("heading", { name: "Side Quest", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".crest-fallback")).toBeVisible();
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(page.locator(".card-stage")).toBeVisible();
});
