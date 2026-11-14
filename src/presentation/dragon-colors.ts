// Each dragon's colours (The Quest 2.0, 2026-11-13), by card ID: a bright
// one for words and flashes, a deep one for glows and shadows. The move
// slam, the enraged moment and the slain ending read them. Display only.
const COLORS: Readonly<Record<string, readonly [string, string]>> = {
  "dungeon.last-call-lich": ["#ff7a3a", "#a8240f"], // Emberfang
  "dungeon.two-am-kebab": ["#e29a3c", "#7a3b0c"], // Gorgrath the Hungry
  "dungeon.the-morning-after": ["#d6c08e", "#5a4a32"], // Ashmaw the Ancient
  "dungeon.bartender-below": ["#c8ecff", "#3f7fa8"], // Rimeclaw
  "dungeon.surge-pricing": ["#7cc4ff", "#2a3fd1"], // Stormcrown
  "dungeon.house-lights": ["#ffe27a", "#b8860b"], // Glimmerwing
  "dungeon.final-tab": ["#6fe0b6", "#1d6b55"], // Old Mother Brine
  "dungeon.the-group-chat": ["#c7a0ff", "#4b2a8a"], // The Whispering Wyrm
  "dungeon.dragon-tidewrack": ["#8fe3f0", "#1f5f78"], // Tidewrack
};
const EMBER = ["#ff7a3a", "#a8240f"] as const;

/** A dragon's bright and deep colours; ember for one not listed. */
export const dragonColors = (id: string | undefined) =>
  (id && COLORS[id]) || EMBER;

/** The colours as CSS variables (`--dragon`, `--dragon-deep`). */
export const dragonStyle = (id: string | undefined) => {
  const [bright, deep] = dragonColors(id);
  return { "--dragon": bright, "--dragon-deep": deep };
};
