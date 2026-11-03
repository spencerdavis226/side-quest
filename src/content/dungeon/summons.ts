import type { CardDefinition } from "../../game/types";
import { card } from "./shared";

// The King's Summons (Realms, 2026-11-03): the run's third card, after the
// adventurer and the omen. The game picks its dragon when it starts, and
// `{dragon}` names it here (`currentCard` fills it in), so from the first
// card the table knows what waits at the end. The Quest only.
const summons = (id: string, title: string, rules: string): CardDefinition => ({
  ...card(`summons-${id}`, title, "group", rules),
  ribbon: "The Summons",
  ribbonTone: "pearl",
  encounter: "shrine",
});

export const summonsCards: CardDefinition[] = [
  summons(
    "proclamation",
    "The King's Decree",
    "{dragon} has woken. The king offers half the kingdom. Everyone raises a glass to the king.",
  ),
  summons(
    "burned-village",
    "A Burned Village",
    "A village in ashes, and {dragon} flying away from it. Everyone drinks 1 for the village.",
  ),
  summons(
    "wanted-poster",
    "The Bounty",
    "WANTED: {dragon}. REWARD: half the kingdom. Everyone toasts the reward.",
  ),
  summons(
    "prophecy",
    "The Prophecy",
    "A fool will slay {dragon}. Everyone points at the fool; most fingers drinks 2.",
  ),
  summons(
    "princess",
    "A Princess Writes",
    "'{dragon} ate my wedding. Please hurry. Bring cake.' The drawer reads it aloud, sobbing.",
  ),
  summons(
    "survivor",
    "The Last Survivor",
    "A singed knight gasps, '{dragon}... too big...' and faints. Everyone drinks 1 to him.",
  ),
];
