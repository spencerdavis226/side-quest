import type { CSSProperties } from "react";
import type { CardDefinition, SessionState } from "../game/types";
import { dragonColors } from "../presentation/dragon-colors";
import { pokemonTypes } from "../presentation/pokemon-types";
import { RIVAL_COLOURS } from "../presentation/rival-colors";
import { crawlScene } from "./crawlTheme";

// Card accents (2026-11-15, owner: colour the title area "intelligently and
// elegantly throughout both games depending on which pokemon type you're
// facing, which zone you're in, boss fights"). One resolver says what the
// title band's enamel is coloured; the face tints it through one mask
// (`.card-enamel`, `scripts/enamel-mask.ts`) and leaves the parchment and
// the rules as they are. Display only: never saved, read fresh each render.

/** A light and a deep tone; the band runs from one to the other. */
export interface Accent {
  light: string;
  deep: string;
  /** What chose it, for tests and the `data-accent` hook. */
  source: string;
}

/** The Quest's regions and places (`crawlScene`), as enamel. The King's
 * Road is the frame's own teal, so it has no entry: the road home. */
export const SCENE_ACCENTS: Readonly<Record<string, [string, string]>> = {
  forest: ["#8cc46a", "#24561e"],
  marsh: ["#b4b85a", "#4a4a14"],
  mines: ["#f0bc5a", "#7a4a0e"],
  crypt: ["#b4d0b0", "#2e4a3c"],
  tower: ["#9aa4ff", "#2a2a86"],
  frost: ["#cdeeff", "#2f6e99"],
  fire: ["#ff9a5a", "#9a2410"],
  coast: ["#7ce0d8", "#0e4e6a"],
  lair: ["#ff7a6a", "#7a1020"],
  rival: ["#e09aff", "#4a1a6a"],
  hidden: ["#c4a8ff", "#3c2470"],
  inn: ["#f4c47a", "#6a3a10"],
};

const accent = (
  [light, deep]: readonly [string, string],
  source: string,
): Accent => ({ light, deep, source });

/** The accent a card wears on its own: a League type, a dragon. Previous
 * Card reads this alone, since a put-aside card has no place in play. */
export function ownAccent(card: CardDefinition): Accent | null {
  if (card.lairFight) return accent(dragonColors(card.id), "dragon");
  if (card.type) {
    const t = pokemonTypes[card.type];
    return accent([t.light, t.deep], `type-${card.type}`);
  }
  return null;
}

/** The accent of the card in play: its own first (a typed fight, the
 * dragon), then the rival when they are on it, then the place in the run.
 * Plain modes, and the King's Road, keep the frame's teal (null). */
export function cardAccent(
  session: SessionState,
  card: CardDefinition,
): Accent | null {
  const own = ownAccent(card);
  if (own) return own;
  const quest = session.quest;
  if (!quest?.party || !quest.due) return null;
  const rival = quest.party.rival;
  const scene = crawlScene(session);
  if (rival && (rival.cut || scene === "rival")) {
    const c = RIVAL_COLOURS[rival.who];
    if (c) return accent([c.light, c.deep], `rival-${rival.who}`);
  }
  const place = scene && SCENE_ACCENTS[scene];
  return place ? accent(place, `scene-${scene}`) : null;
}

/** The accent as the face's CSS variables. */
export const accentStyle = (a: Accent | null): CSSProperties | undefined =>
  a
    ? ({ "--accent": a.light, "--accent-deep": a.deep } as CSSProperties)
    : undefined;
