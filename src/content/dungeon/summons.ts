import type { CardDefinition } from "../../game/types";
import { card } from "./shared";

// The King's Summons (Realms, 2026-11-03): the run's third card, after the
// adventurer and the omen. The game picks its dragon when it starts, and
// `{dragon}` names it here (`currentCard` fills it in), so from the first
// card the table knows what waits at the end. Since The Quest 2.0 Phase 3
// (2026-11-14) most also name its lair (`{lair}`, filled the same way;
// `tests/realms-names.test.ts` holds the filled lines to the limits). The
// Quest only.
const summons = (id: string, title: string, rules: string): CardDefinition => ({
  ...card(`summons-${id}`, title, "group", rules),
  ribbon: "The Summons",
  ribbonTone: "pearl",
  encounter: "shrine",
});

export const summonsCards: CardDefinition[] = [
  summons(
    "kings-decree",
    "The King's Decree",
    "{dragon} woke under {lair}, horny. Everyone toasts the king's tiny balls.",
  ),
  summons(
    "burned-village",
    "A Burned Village",
    "Your hometown, torched by {dragon}. Your ex made it out, sadly. Everyone drinks 1.",
  ),
  summons(
    "bounty",
    "The Bounty",
    "WANTED: {dragon}. REWARD: gold, and a handy from the mayor. Everyone toasts the reward.",
  ),
  summons(
    "prophecy",
    "The Prophecy",
    "A dumbass will slay {dragon}. Everyone points at the dumbass; most fingers drinks 2.",
  ),
  summons(
    "princess-writes",
    "A Princess Writes",
    "'{dragon} took me to {lair}. Bring wine.' The drawer reads it, sobbing.",
  ),
  summons(
    "last-survivor",
    "The Last Survivor",
    "A singed knight gasps '{dragon}... {lair}...' and shits. Everyone toasts him.",
  ),
];
