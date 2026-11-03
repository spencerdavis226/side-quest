import type { CardDefinition } from "../../game/types";
import {
  boss,
  closing,
  d20,
  moves,
  pair,
  queue,
  stairs,
  vs,
  BOSS_NEED,
} from "./shared";

// The run's ends (Realms, 2026-11-03; card IDs from Pub Crawl): the rival
// party, the Gilded Company (Sir Bradley, Chadwick and Thaddeus, matching
// gold capes and a bard writing songs about them), who push past you at
// the city gate, hold the crossroads, and are waiting at the dragon's door;
// and the dragons, one of eight, waiting at the end of the third region.
// The King's Summons names it from the start (`{dragon}`).

/** The city gate, before the first region. One fight; the winner goes out
 * first with whatever the loser dropped. The Quest only. */
export const queueCards: CardDefinition[] = [
  queue(
    "knows-the-owner",
    "Sir Bradley's Charter",
    "Sir Bradley has a charter from the king's cousin. Name a bigger patron, then roll d20.",
    vs(
      "The cousin really is important. Drink 3.",
      "Nobody has heard of the cousin. Give 3.",
    ),
    { loot: "draught" },
  ),
  queue(
    "fake-id",
    "Chadwick's Accent",
    "Chadwick says he's a foreign prince. You and he (left neighbor) do the accent. His wins: drink 3.",
    null,
    { loot: "smoke" },
  ),
  queue(
    "were-together",
    "We're Together",
    "Thaddeus tells the gate guard you're his squires. You're not. Roll 2d6 to argue.",
    pair(
      "The guard believes him. Carry his bags and drink 3.",
      "The guard believes you. Give 3.",
      "A pair! The guard sends them to the back. Everyone else drinks 2.",
    ),
    { loot: "shield" },
  ),
  queue(
    "group-name",
    "The Company Banner",
    "The Gilded Company has a banner, a motto and matching capes. Roll d20.",
    vs(
      "Their capes are better. Drink 3.",
      "You have a cape. It's a blanket, but still. Give 3.",
    ),
    {
      loot: "die",
      jinx: {
        name: "Champion",
        rule: "Everyone calls the jinxed player 'Champion', like Sir Bradley does. Slip: drink 1.",
      },
    },
  ),
  queue(
    "the-list",
    "The Roll of Heroes",
    "Sir Bradley is on the roll of heroes. You're on a napkin the clerk is holding. Roll d6.",
    moves(
      ["The napkin blows away. Drink 3.", "The clerk sneezes on it. Drink 3."],
      [
        "The napkin holds up. Give 2.",
        "You're on the roll, and Bradley's spelled wrong. Give 3.",
        "You're on it twice. Give 3.",
        "Bradley's off the roll. Everyone else drinks 1.",
      ],
    ),
    { loot: "draught" },
  ),
  queue(
    "cover-charge",
    "The Gate Toll",
    "Chadwick tells the guard you're paying the toll for the whole Company. Roll d20.",
    vs(
      "The guard believes him. Drink 3.",
      "The guard charges Chadwick double. Give 3.",
    ),
    { loot: "draught" },
  ),
  queue(
    "hand-stamp",
    "The Royal Seal",
    "Thaddeus forged a royal seal out of a potato, and he's pressing it on you. Roll d20.",
    vs(
      "It works on you. Drink 3.",
      "You wash it off in a horse trough. Give 3.",
    ),
    { loot: "shield" },
  ),
  queue(
    "rock-paper-brad",
    "Rock, Paper, Bradley",
    "Rock, paper, scissors with your left neighbor (Sir Bradley), best of three. Lose: drink 3.",
    null,
    { loot: "smoke" },
  ),
];

/** The crossroads, between the second inn and the third region: the
 * Company is a region ahead and making sure you know it. One fight; the
 * winner takes what they dropped. The Quest only. */
export const stairsCards: CardDefinition[] = [
  stairs(
    "service-elevator",
    "Chadwick's Shortcut",
    "Chadwick found a shortcut and is holding the gate shut behind him. Roll d20.",
    vs(
      "He wins. Take the long way and drink 4.",
      "You squeeze through. Give 4.",
    ),
    { loot: "die" },
  ),
  stairs(
    "group-photo",
    "The Company Portrait",
    "A painter is doing the Company's portrait across the whole road, and you're in it. Roll 2d6.",
    pair(
      "You're painted out. Drink 4.",
      "You pull a face in the background. Give 4.",
      "A pair! It's your portrait now. Everyone else drinks 2.",
    ),
    { loot: "shield" },
  ),
  stairs(
    "pep-talk",
    "Thaddeus's Speech",
    "Thaddeus gives a battle speech. Give your table a better one in 10 seconds. Worse: drink 4.",
    null,
    { loot: "draught" },
  ),
  stairs(
    "leaderboard",
    "The Kill Count",
    "Sir Bradley keeps a tally of monsters slain, and you're second. Roll d20.",
    vs("He pulls ahead. Drink 4.", "You overtake him. Give 4.", {
      crit: "You lap him twice. Everyone else drinks 3.",
    }),
    { loot: "smoke" },
  ),
  stairs(
    "recruitment",
    "The Recruitment",
    "The Company wants you. Thaddeus is holding out a gold cape. Roll d20 to say no.",
    vs("You say yes. Drink 4.", "You say no and mean it. Give 4."),
    {
      loot: "round",
      jinx: {
        name: "Company Man",
        rule: "The jinxed player ends every sentence with 'huzzah'. Slip: drink 1.",
      },
    },
  ),
];

/** The lair's door, after the third region: the Company got here first
 * and wants the kill, dealt again until beaten twice. The Quest only. */
export const closingCards: CardDefinition[] = [
  closing(
    "last-table",
    "First Through the Door",
    "The Company wants the dragon first. Sir Bradley is already in the doorway. Roll d20.",
    vs("He elbows you aside. Drink 4.", "You trip him, gently. Give 4.", {
      crit: "You trip him into the moat. Everyone else drinks 3.",
    }),
  ),
  closing(
    "the-boys-toast",
    "A Toast to the Company",
    "Thaddeus is toasting 'the Company', eleven minutes in. Roll d20 to cut him off.",
    vs(
      "It's moving, somehow. Raise a glass and drink 4.",
      "You raise a glass mid-sentence, and it's over. Give 4.",
      { fumble: "You cry at it. Finish your drink." },
    ),
  ),
  closing(
    "last-round",
    "Chadwick's Potions",
    "Chadwick bought the last healing potions, for the Company only. Steal one. Roll d20.",
    vs(
      "He drinks yours in front of you. Drink 4.",
      "You swap his for pond water. Give 4.",
      { crit: "You swap them all. Everyone else drinks 3." },
    ),
    {
      jinx: {
        name: "For the Company",
        rule: "The jinxed player says 'for the Company' before every drink. Forgets: drink 1.",
      },
    },
  ),
  closing(
    "venmo-request",
    "Sir Bradley's Invoice",
    "Sir Bradley sends everyone here an invoice for 'inspiration'. Roll d20.",
    vs("You pay it. Drink 4.", "You invoice him back, double. Give 4."),
  ),
  closing(
    "dance-off",
    "The Victory Dance",
    "The Company starts its victory dance before the fight. Out-dance them. Roll d6.",
    moves(
      [
        "Bradley does the worm in full plate. Drink 4.",
        "You pull something. Drink 4.",
        "Thaddeus dips you. You let him. Drink 4.",
      ],
      [
        "You do a sword dance, and mean it. Give 4.",
        "You moonwalk past the dragon's door and back. Give 4.",
        "The dragon taps a claw along. Everyone else drinks 2.",
      ],
    ),
  ),
  closing(
    "boys-tab",
    "The Company's Debts",
    "Sir Bradley signs the Company's debts over to you. Roll d20.",
    vs("Signed. Drink 4.", "You sign it 'Bradley'. Give 4."),
  ),
  closing(
    "thads-uber",
    "Thaddeus's Horse",
    "Thaddeus brought one horse for everyone, and it's a donkey. Roll 2d6 for a seat.",
    pair(
      "You're behind the donkey. Drink 4.",
      "In the saddle. Give 4.",
      "A pair! Thaddeus walks. Everyone else drinks 2.",
    ),
  ),
  closing(
    "the-rematch",
    "The Rematch",
    "Chadwick wants a rematch for the city gate. He's been stretching since. Roll d20.",
    vs("He's been training. Drink 4.", "Same result as the gate. Give 4.", {
      crit: "Chadwick is so impressed he knights you. Everyone else drinks 3.",
    }),
  ),
];

/** The dragons: one of eight, three swings, to win the quest. The King's
 * Summons names the run's dragon from the first card. They play as ordinary
 * bosses in the plain modes. */
export const lastCallBosses: CardDefinition[] = [
  boss(
    2,
    "last-call-lich",
    "Emberfang",
    "A red dragon uncoils from a hill of gold, and the air catches fire. Roll d20.",
    d20(
      BOSS_NEED[2],
      "Fire, everywhere. Everyone drinks 4.",
      "Your blade finds a loose scale. Give 5.",
      { crit: "You cut a wing. Everyone else drinks 4." },
    ),
  ),
  boss(
    2,
    "bartender-below",
    "Rimeclaw",
    "A white dragon in the frozen dark, with eyes like old ice. Roll d20.",
    d20(BOSS_NEED[2], "Frostbite. Drink 6.", "You chip a claw. Give 5.", {
      crit: "Its breath freezes its own jaw shut. Everyone else drinks 4.",
    }),
  ),
  boss(
    2,
    "final-tab",
    "Old Mother Mire",
    "Older than the marsh and twice as wet. She has eaten heroes for lunch. Roll d20.",
    d20(
      BOSS_NEED[2],
      "Swallowed, then spat out. Drink 5.",
      "You tangle her in the reeds. Give 5.",
      { crit: "She chokes on your boot. Everyone else drinks 4." },
    ),
  ),
  boss(
    2,
    "house-lights",
    "Glimmerwing",
    "A golden dragon who wants to be admired first and fought second. Roll d20.",
    d20(
      BOSS_NEED[2],
      "Blinded by the shine. Drink 6.",
      "You call it ugly. It staggers. Give 5.",
      { crit: "You show it a mirror. Everyone else drinks 4." },
    ),
  ),
  boss(
    2,
    "two-am-kebab",
    "Gorgrath the Hungry",
    "It has eaten three knights today, and it's still hungry. It's looking at you. Roll d20.",
    d20(
      BOSS_NEED[2],
      "A bite. Drink 5.",
      "You jam a spear in its jaw. Give 5.",
      {
        crit: "It chokes on the spear. Everyone else drinks 4.",
        fumble: "It swallows you whole, then spits you out. Drink 10.",
      },
    ),
  ),
  boss(
    2,
    "surge-pricing",
    "Stormcrown",
    "A blue dragon riding its own storm, crackling with every breath. Roll d20.",
    d20(
      BOSS_NEED[2],
      "Struck by lightning. Drink 5.",
      "You ground it with your sword. Give 5.",
      { crit: "Its own lightning finds it. Everyone else drinks 4." },
    ),
  ),
  boss(
    2,
    "the-group-chat",
    "The Whispering Wyrm",
    "A dragon that speaks in your own voice and tells your secrets. Roll d20.",
    d20(BOSS_NEED[2], "It tells one. Drink 6.", "You talk louder. Give 5.", {
      crit: "You tell its secrets. Everyone else drinks 4.",
    }),
    {
      jinx: {
        name: "Tongue-Tied",
        rule: "The jinxed player can only mime. Say a word: drink 1.",
      },
    },
  ),
  boss(
    2,
    "the-morning-after",
    "Ashmaw the Ancient",
    "The oldest dragon there is, and it has been waiting for you in particular. Roll d20.",
    d20(
      BOSS_NEED[2],
      "It remembers you. Drink 5 and a glass of water.",
      "You surprise it, and nothing surprises it. Give 5.",
      { crit: "It laughs, and you strike its throat. Everyone else drinks 4." },
    ),
  ),
];
