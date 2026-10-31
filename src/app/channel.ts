/** The preview site (`/side-quest/next/`, built from the `preview` branch
 * with `VITE_CHANNEL=preview`) shares an origin, and so localStorage, with
 * the live game. Its keys carry their own prefix so a test game never
 * touches a real save; the live build's keys are unchanged. Optional
 * chaining: scripts run this file under tsx, where `import.meta.env` is
 * undefined. */
export const IS_PREVIEW = import.meta.env?.VITE_CHANNEL === "preview";
export const KEY_PREFIX = IS_PREVIEW ? "side-quest-preview." : "side-quest.";
