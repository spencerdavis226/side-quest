// One continuous painted surface: no independently stretched frame sections.
import continuousFrame from "./art/ornate-teal-frame.webp";
// The Ancient Mew pair: every card of a Pokémon League game, front and back.
import leagueFront from "./art/league-front.webp";
export const coreFrameSurfaces = [continuousFrame] as const;
export const leagueSurfaces = [
  leagueFront,
  "art/card-back-league.webp",
] as const;
/** The quest whose games use the League pair. */
export const LEAGUE_QUEST = "pokemon";
