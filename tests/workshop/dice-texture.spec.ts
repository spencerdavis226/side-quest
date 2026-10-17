import { test, expect } from "@playwright/test";

/**
 * Dice face numerals must sit on the painted face centre in every engine.
 * WebKit resolves the canvas "middle" text baseline about 0.08em above
 * Chromium, which used to lift iOS d20 numerals well off the face centre;
 * the skin now centres the measured ink box instead.
 */
test("dice face numerals paint on the face centre in every engine", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() =>
    document.fonts.load('700 174px "Source Serif 4 Title"'),
  );
  const measures = await page.evaluate(
    async (labels: string[]) => {
      // A dev-server URL, so TypeScript cannot resolve it; type it by path.
      const skin: string = "/src/presentation/dice/skin.ts";
      const {
        installDiceSkin,
      }: typeof import("../../src/presentation/dice/skin") = await import(
        /* @vite-ignore */ skin
      );
      const colors: string = "/src/presentation/dice/palette.ts";
      const {
        houseDice,
      }: typeof import("../../src/presentation/dice/palette") = await import(
        /* @vite-ignore */ colors
      );
      const size = 512;
      return labels.map((label) => {
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = size;
        const texture: any = {
          composite: { image: canvas, needsUpdate: false },
        };
        const factory: any = {
          chamfer_geom: () => ({}),
          createTextMaterial: () => texture,
        };
        installDiceSkin(factory, houseDice);
        // A d20 label array has two leading blanks; index 2 is the first face.
        factory.createTextMaterial({ shape: "d20" }, ["", "", label], 2);
        const pixels = canvas
          .getContext("2d")!
          .getImageData(0, 0, size, size).data;
        let minX = size,
          minY = size,
          maxX = -1,
          maxY = -1,
          count = 0;
        for (let y = 0; y < size; y++)
          for (let x = 0; x < size; x++) {
            const i = (y * size + x) * 4;
            if (
              pixels[i] > 220 &&
              pixels[i + 1] > 200 &&
              pixels[i + 2] > 150 &&
              pixels[i + 3] > 200
            ) {
              count++;
              minX = Math.min(minX, x);
              maxX = Math.max(maxX, x);
              minY = Math.min(minY, y);
              maxY = Math.max(maxY, y);
            }
          }
        return {
          label,
          count,
          centre: [(minX + maxX) / 2, (minY + maxY) / 2],
        };
      });
    },
    ["7", "9", "11", "17", "20"],
  );
  for (const { label, count, centre } of measures) {
    expect(count, `painted numeral ${label}`).toBeGreaterThan(500);
    expect(
      Math.abs(centre[0] - 256),
      `numeral ${label} horizontal centre (was ${centre[0]})`,
    ).toBeLessThanOrEqual(8);
    expect(
      Math.abs(centre[1] - 256),
      `numeral ${label} vertical centre (was ${centre[1]})`,
    ).toBeLessThanOrEqual(8);
  }
});
