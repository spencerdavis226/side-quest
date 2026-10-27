import { describe, expect, it } from "vitest";
import { extrasLayout } from "../src/components/extras";

const short = { long: false };
const long = { long: true };

describe("extrasLayout", () => {
  it("shows nothing without actions", () => {
    expect(extrasLayout([], true)).toBe("none");
    expect(extrasLayout([], false)).toBe("none");
  });

  it("beside Won and Lost, keeps one short action and sends the rest to the sheet", () => {
    expect(extrasLayout([short], true)).toBe("inline");
    expect(extrasLayout([long], true)).toBe("sheet");
    expect(extrasLayout([short, short], true)).toBe("sheet");
  });

  it("without a verdict, lets one action or two short ones share the foot", () => {
    expect(extrasLayout([long], false)).toBe("inline");
    expect(extrasLayout([short, short], false)).toBe("inline");
    expect(extrasLayout([short, long], false)).toBe("sheet");
  });

  it("never lays out more than three plaques, whatever the count", () => {
    for (let n = 1; n <= 10; n++) {
      const set = Array.from({ length: n }, () => short);
      for (const verdict of [true, false]) {
        const inline = extrasLayout(set, verdict) === "inline";
        const plaques = inline ? n + (verdict ? 2 : 0) : 1 + (verdict ? 2 : 0);
        expect(plaques).toBeLessThanOrEqual(3);
      }
    }
  });
});
