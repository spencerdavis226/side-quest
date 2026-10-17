import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("index.html", () => {
  it("keeps the installed app below an opaque status bar", () => {
    // black-translucent runs the page under the status bar, where iOS 26+
    // blurs the top of it (owner's iPhone 15 Pro, 2026-10-17).
    const html = readFileSync("index.html", "utf8");
    expect(html).not.toMatch(/<meta[^>]+apple-mobile-web-app-status-bar-style/);
    expect(html).toMatch(/<meta name="theme-color" content="#271c11"/);
  });
});
