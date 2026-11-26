import { expect, it } from "vitest";
import { checkSaves, fixtures } from "./save-fixtures";

it("has fixtures to check", () => {
  expect(fixtures.length).toBeGreaterThanOrEqual(21);
});
checkSaves(0);
