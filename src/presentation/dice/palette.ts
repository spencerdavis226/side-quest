import type { DicePalette } from "../../game/types";

/** Every colour the dice skin paints. The default is the house brass and
 * teal enamel; a crawl's starter or omen brings its own two colours
 * (`DicePalette`), and the rest are derived from them here. */
export interface DiceColors {
  /** The enamel faces: a lit, a middle and a shaded stop. */
  body: [string, string, string];
  /** The darkest body tone: pip wells and the numeral's drop shadow. */
  deep: string;
  /** The bevel metal between faces. */
  metal: [string, string, string];
  /** The inlaid border and pip rims. */
  trim: string;
  /** The fine inner ring, a body tint. */
  ring: string;
  /** Numerals and pip cores. */
  ink: string;
  /** The numeral's offset shadow, opposite the ink. */
  shade: string;
  /** Specular tints for the metal and the enamel. */
  specular: [string, string];
}

export const houseDice: DiceColors = {
  body: ["#287078", "#123f45", "#082d33"],
  deep: "#061e23",
  metal: ["#f4d798", "#b67d39", "#765023"],
  trim: "#bf9350",
  ring: "#60877d",
  ink: "#fff0c9",
  shade: "#041e22",
  specular: ["#604324", "#142221"],
};

type RGB = [number, number, number];
const parse = (hex: string): RGB => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
];
const hex = (c: RGB) =>
  `#${c
    .map((v) =>
      Math.round(Math.min(255, Math.max(0, v)))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
/** Toward white (t > 0) or black (t < 0). */
export const shade = (color: string, t: number) =>
  hex(
    parse(color).map((v) => (t > 0 ? v + (255 - v) * t : v * (1 + t))) as RGB,
  );
const mix = (a: string, b: string, t: number) => {
  const [x, y] = [parse(a), parse(b)];
  return hex(x.map((v, i) => v + (y[i] - v) * t) as RGB);
};

/** WCAG relative luminance and contrast ratio. */
export function luminance(color: string) {
  const [r, g, b] = parse(color).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contrast(a: string, b: string) {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}

const CREAM = "#fff4dc";

/** The skin for a starter or an omen: its primary is the enamel, its
 * secondary the metal and trim. Numerals take cream or a deep body tone,
 * whichever reads better on the enamel's middle stop. */
export function diceColors(palette?: DicePalette): DiceColors {
  if (!palette) return houseDice;
  const { secondary } = palette;
  // Cream numerals on darker enamel (the house look), dark ones on light
  // enamel. The enamel deepens (or brightens) a step at a time, keeping its
  // hue, until the numerals read at 4.5:1 on it.
  const light = luminance(palette.primary) < 0.3;
  let primary = palette.primary;
  const ink = () => (light ? CREAM : shade(primary, -0.82));
  for (let i = 0; i < 12 && contrast(ink(), primary) < 4.5; i++)
    primary = shade(primary, light ? -0.05 : 0.05);
  const body: DiceColors["body"] = [
    shade(primary, 0.12),
    primary,
    shade(primary, -0.35),
  ];
  const deep = shade(primary, -0.72);
  return {
    body,
    deep,
    metal: [shade(secondary, 0.35), secondary, shade(secondary, -0.4)],
    trim: shade(secondary, -0.08),
    ring: mix(primary, CREAM, 0.38),
    ink: ink(),
    shade: light ? deep : shade(primary, 0.55),
    specular: [shade(secondary, -0.6), enamelSpecular(primary)],
  };
}

/** The enamel's highlight, tinted by its colour but never stronger than the
 * house teal's: the top face meets the light and camera head on, so a
 * brighter tint at that shininess glares out the numerals on pale enamels. */
function enamelSpecular(primary: string) {
  const cap = luminance(houseDice.specular[1]);
  let tint = shade(primary, -0.6);
  for (let i = 0; i < 40 && luminance(tint) > cap; i++)
    tint = shade(tint, -0.08);
  return tint;
}
