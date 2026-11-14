import type { CardDefinition } from "../../game/types";
import { LORE, ambush, card, trial } from "./shared";

// The road remembers (The Quest 2.0 Phase 6, 2026-11-14): some plaques and
// fights set a deed (`party.deeds`). An echo is a card dealt only if its
// deed is held: the echo stage, before the Lair's Door, deals the echo of
// one held deed (at random among them) and leaves the run when none is
// held (`variants` and `optional` on the stage in `dungeon.ts`). The Quest
// only.
const echo = (c: CardDefinition): CardDefinition => ({
  ...c,
  ribbon: "An Echo",
  ribbonTone: "pearl",
});
const scene = (
  id: string,
  title: string,
  rules: string,
  more: Partial<CardDefinition> = {},
): CardDefinition =>
  echo({
    ...card(`echo-${id}`, title, "group", rules),
    encounter: "shrine",
    ...more,
  });

/** Each echo, by the deed that deals it. */
export const echoes: Record<string, CardDefinition> = {
  freed: scene(
    "hanged-man",
    "The Hanged Man Returns",
    "The man you freed was a thief. He's picked the lair's lock for you. Everyone thanks him.",
    {
      offers: [
        // The Lair's Door is skipped.
        { label: "Slip inside", skip: 1 },
        { label: "Knock anyway" },
      ],
    },
  ),
  "rode-on": echo(
    ambush(
      5,
      "echo-brother",
      "His Brother",
      "The hanged man's brother wants a word about the gallows. Roll d20.",
      "He has a lot of words. Drink 4.",
      "He takes the hint. Give 3.",
    ),
  ),
  "fairy-debt": scene(
    "fair-folk",
    "The Fair Folk Collect",
    "The fair folk are here about that gift. Everyone looks innocent.",
    {
      offers: [{ label: "Pay", cost: 1 }, { label: "Pay · drink 5" }],
    },
  ),
  "feast-crashed": scene(
    "lord-remembers",
    "The Lord Remembers",
    "The lord whose feast you crashed sends wine, with a note. Everyone toasts bad manners.",
    { reward: { heal: 2 } },
  ),
  "hag-deal": scene(
    "hag-owed",
    "The Hag Is Owed",
    "The hag wants the rest of her price. Everyone shudders.",
    {
      jinx: {
        name: "The Hag's Due",
        rule: "The cursed player speaks only in questions. Slip: drink 1.",
      },
    },
  ),
  stiffed: echo({
    ...trial(
      5,
      "echo-ferryman",
      "The Ferryman Waits",
      "The ferryman you stiffed is waiting. The drawer pays him in compliments for ten seconds.",
    ),
    damage: 2,
  }),
  stole: echo(
    ambush(
      5,
      "echo-goblin-posse",
      "The Goblin Posse",
      "The goblins you robbed have followed you all this way. Roll d20.",
      "They take it all back, with interest. Drink 4.",
      "They flee, dropping a coin. Give 3.",
      { loot: "die" },
    ),
  ),
  "quest-taken": scene(
    "gift",
    "A Gift from Home",
    "The village you saved sent bread, still warm. Everyone breaks off a piece.",
    { reward: { heal: 2 } },
  ),
  "quest-walked": scene(
    "one-you-left",
    "The One You Left",
    "They did it themselves, and they're not speaking to you. Everyone drinks 2.",
  ),
  "ally-fell": scene(
    "grave",
    "A Grave by the Road",
    "A cairn for the friend you lost. Everyone toasts them by name.",
    { reward: { lore: LORE.lore } },
  ),
};
