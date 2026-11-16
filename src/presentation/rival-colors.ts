// Each rival's colour (Rivals Phase 5, 2026-11-15): a light face and a deep
// rim, keyed by the rival's key. Their medallion (`RivalMedal.tsx`) and the
// title band of a card they are on (`cardAccent`) both read it. Kept apart
// from the medallion so the card face does not pull in the emblem art.
export const RIVAL_COLOURS: Readonly<
  Record<string, { light: string; deep: string }>
> = {
  chad: { light: "#f2c94c", deep: "#8a5a10" },
  fingerbang: { light: "#e58bd0", deep: "#6a1f5c" },
  sensei: { light: "#d9c7a3", deep: "#5c4a2a" },
  chuck: { light: "#9fd3e8", deep: "#1f5468" },
  gary: { light: "#b8c4a0", deep: "#3f4a2a" },
  queef: { light: "#f29a7a", deep: "#7a2a1a" },
};
