import { readFile } from "node:fs/promises";
import { expect, test } from "vitest";
import { cards, packs } from "../src/content/catalog";
import { packs as manifest } from "../src/content/manifest.generated";
import { loadablePackIds, loadPackCards } from "../src/content/loaders";
import { packCardIds } from "../src/game/engine";
import { renderManifest } from "../scripts/manifest-render";

test("the generated pack manifest matches the catalog", async () => {
  expect(
    await readFile("src/content/manifest.generated.ts", "utf8"),
    "run npm run content:manifest",
  ).toBe(await renderManifest(packs));
  expect(manifest).toEqual(packs);
});

test("every pack has a loader that returns exactly its cards", async () => {
  expect(loadablePackIds).toEqual(packs.map((pack) => pack.id));
  for (const pack of packs) {
    const loaded = await loadPackCards([pack.id]);
    const expected = packCardIds(pack);
    expect(loaded.map((c) => c.id).sort(), pack.id).toEqual(
      [...expected].sort(),
    );
    for (const card of loaded)
      expect(card, card.id).toEqual(cards.find((c) => c.id === card.id));
  }
});

test("shared cards load once when several packs are chosen", async () => {
  const loaded = await loadPackCards(["core", "vip", "likely"]);
  expect(new Set(loaded.map((c) => c.id)).size).toBe(loaded.length);
});
