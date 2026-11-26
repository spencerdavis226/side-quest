import type { CardDefinition, Category, DiceDefinition } from "../game/types";
import { cardFactory, flip, rollTable } from "./author";

// Last Call (2026-11-23, owner): a Standard game (a card limit, no quest)
// ends on one of these instead of just stopping. Each pack keeps a small pool
// (`PackDefinition.lastCall`); `createSession` picks one from every selected
// pack's pool and deals it as the game's last card. They are in no deck, so
// Infinite and the quests never deal them. The ribbon says "Last Call", so
// the rules don't have to.
//
// IDs are `<pack>.closer-<slug>`; never reuse one.
type Draft = [
  id: string,
  title: string,
  category: Category,
  rules: string,
  dice?: DiceDefinition,
];

const closers = (namespace: string, drafts: Draft[]): CardDefinition[] => {
  const card = cardFactory(namespace);
  return drafts.map(([id, title, category, rules, dice]) => ({
    ...card(`closer-${id}`, title, category, rules, dice),
    ribbon: "Last Call",
    lastCall: true as const,
  }));
};

export const coreLastCall = closers("core", [
  [
    "closing-time",
    "Closing Time",
    "group",
    "Bottoms up: everyone finishes their drink. Last one done takes a shot.",
  ],
  [
    "toast-the-table",
    "Toast the Table",
    "challenge",
    "Clockwise, toast someone here in one sentence. Then everyone drinks 2.",
  ],
  [
    "house-lights",
    "House Lights",
    "category",
    "Clockwise, name tonight's best moment. First blank or repeat finishes their drink.",
  ],
  [
    "waterfall",
    "Waterfall",
    "group",
    "Waterfall. You start, then clockwise. Nobody stops before the player on their right does.",
  ],
  [
    "mvp",
    "Tonight's MVP",
    "group",
    "On three, point at tonight's MVP. Most votes gives 5, then everyone drinks to them.",
  ],
  [
    "settle-the-tab",
    "Settle the Tab",
    "sip",
    "The tab is due. Flip the coin to see who covers it.",
    flip(
      "Tails. You finish your drink.",
      "Heads. Everyone else finishes theirs.",
    ),
  ],
]);

export const vipLastCall = closers("vip", [
  [
    "speech",
    "Speech, Speech",
    "challenge",
    "The VIP gives a speech. Everyone cheers, then finishes their drink.",
  ],
  [
    "best-memory",
    "Best Memory",
    "group",
    "Clockwise, tell the VIP your best memory of them. Then everyone drinks 2 to the VIP.",
  ],
  [
    "verdict",
    "The VIP's Verdict",
    "sip",
    "The VIP flips the coin for the whole table.",
    flip(
      "Tails. The VIP finishes their drink.",
      "Heads. Everyone but the VIP finishes theirs.",
    ),
  ],
]);

export const likelyLastCall = closers("likely", [
  [
    "sunrise",
    "Up at Sunrise",
    "group",
    "Most likely to still be up at sunrise? Point on three. Most votes finishes their drink.",
  ],
  [
    "regret",
    "Tomorrow's Regret",
    "group",
    "Most likely to regret tonight? Point on three. Most votes takes a shot.",
  ],
  [
    "group-chat",
    "First in the Chat",
    "group",
    "Most likely to start tomorrow's group chat? Point on three. Most votes drinks 3.",
  ],
]);

export const neverLastCall = closers("never", [
  [
    "better-night",
    "Never Better",
    "group",
    "Never have I ever had a better night than this one. Anyone who has drinks 3.",
  ],
  [
    "saved-it",
    "Saved the Best",
    "challenge",
    "Say the never have I ever you've been saving. Anyone who has finishes their drink.",
  ],
  [
    "last-word",
    "Last Word",
    "group",
    "Never have I ever ended a night sober. Flip the coin.",
    flip(
      "Tails. Everyone finishes their drink.",
      "Heads. Anyone who has finishes theirs.",
    ),
  ],
]);

export const mindsLastCall = closers("minds", [
  [
    "last-herd",
    "Last Herd",
    "group",
    "On 3, everyone names tonight's best moment. Lone answers finish their drink.",
  ],
  [
    "how-gone",
    "How Gone Are We",
    "group",
    "Show 1 to 5 fingers on 3: how drunk is this table? Furthest from you finishes their drink.",
  ],
  [
    "one-mind",
    "One Mind",
    "group",
    "On 3, everyone calls heads or tails. Then flip the coin.",
    flip(
      "Tails. Everyone who called heads finishes their drink.",
      "Heads. Everyone who called tails finishes theirs.",
    ),
  ],
]);

export const dealerLastCall = closers("dealer", [
  [
    "last-hand",
    "Last Hand",
    "challenge",
    "You deal the last hand: give out 10 drinks, no more than 4 to one player.",
  ],
  [
    "house-always-wins",
    "The House Always Wins",
    "group",
    "Roll for the house. Then everyone drinks.",
    rollTable(1, 6, [
      { min: 1, max: 5, instruction: "Everyone drinks {total}." },
      { min: 6, max: 6, instruction: "Everyone finishes their drink." },
    ]),
  ],
  [
    "cash-out",
    "Cash Out",
    "sip",
    "The table cashes out. Flip the coin to see who pays.",
    flip(
      "Tails. The house wins: you finish your drink.",
      "Heads. You win: everyone else finishes theirs.",
    ),
  ],
]);

/** Every Last Call card, for the catalog and the imprint map. */
export const lastCallCards = [
  ...coreLastCall,
  ...vipLastCall,
  ...likelyLastCall,
  ...neverLastCall,
  ...mindsLastCall,
  ...dealerLastCall,
];
