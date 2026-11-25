import type {
  CardDefinition,
  PackDefinition,
  Category,
  DiceDefinition,
} from "../game/types";
import { flip, roll, rollTable } from "./author";
import { customVipCards } from "./custom";
import { vipLastCall } from "./last-call";

// VIP night: for a birthday, a bachelorette, or anyone whose night it is. The
// group crowns one guest of honor (the VIP) before playing, and every card in
// this pack favors, roasts, or ropes in that one person. Cards stay self-
// contained: each rule names the VIP and an immediate consequence.
const vipCard = (
  id: string,
  title: string,
  category: Category,
  rules: string,
  dice?: DiceDefinition,
): CardDefinition => ({
  version: 1,
  id: `vip.${id}`,
  title,
  category,
  rules,
  artwork: "art/tankard.webp",
  ...(dice ? { dice } : {}),
});

const vipDeck: CardDefinition[] = [
  vipCard(
    "toast",
    "Dirty Toast",
    "sip",
    "Clockwise, toast the VIP with something their mom shouldn't hear. Then the VIP drinks 2.",
  ),
  vipCard(
    "sidekick",
    "Choose a Sidekick",
    "sip",
    "The VIP picks a sidekick, who drinks 2 now and holds the VIP's hair later.",
  ),
  vipCard(
    "tax",
    "The VIP Tax",
    "sip",
    "The VIP drinks 3 and names the worst person they've ever kissed.",
  ),
  vipCard(
    "fan-club",
    "Hottest Quality",
    "group",
    "The VIP names their own hottest quality, straight-faced. Anyone who laughs drinks 2.",
  ),
  vipCard(
    "standing-ovation",
    "Standing Ovation",
    "group",
    "Give the VIP a standing ovation. Last to stand drinks 3. The VIP bows and drinks 1.",
  ),
  vipCard(
    "favors",
    "Seen It All",
    "group",
    "Anyone who's seen the VIP naked drinks 2. The VIP drinks 1 for each of them.",
  ),
  vipCard(
    "gift",
    "Gift Registry",
    "category",
    "Clockwise, name sex toys you'd gift the VIP. First repeat or blank drinks 2.",
  ),
  vipCard(
    "superlatives",
    "Cause of Death",
    "category",
    "Clockwise, name ways the VIP could die tonight. First repeat or blank drinks 2.",
  ),
  vipCard(
    "roast",
    "The Roast",
    "challenge",
    "Clockwise, roast the VIP. The VIP picks the meanest one; its author gives 3.",
  ),
  vipCard(
    "title",
    "Stage Name",
    "challenge",
    "Give the VIP a stripper name. The VIP drinks 2 and introduces themselves with it.",
  ),
  vipCard(
    "excellency",
    "Daddy's Home",
    "rule",
    "For the rest of the game, everyone calls the VIP Daddy or Mommy. Forget: drink 2.",
  ),
  vipCard(
    "never-alone",
    "Never Drink Alone",
    "rule",
    "For the rest of the game, the VIP picks someone to join every drink they take.",
  ),
  // --- The expansion (2026-11-23, owner): VIP night playable on its own -----
  vipCard(
    "origin-story",
    "Origin Story",
    "group",
    "Whoever has known the VIP longest tells how they met. Everyone else drinks 2.",
  ),
  vipCard(
    "bad-influence",
    "Worst Influence",
    "group",
    "On three, point at the VIP's worst influence. Most votes drinks 3 and owns it.",
  ),
  vipCard(
    "impressions",
    "Impression Night",
    "challenge",
    "Clockwise, do your best VIP impression. The VIP picks the best; everyone else drinks 2.",
  ),
  vipCard(
    "hype-man",
    "Hype Man",
    "challenge",
    "Introduce the VIP like a boxer entering the ring. If the VIP isn't hyped, drink 3.",
  ),
  vipCard(
    "taster",
    "Royal Taster",
    "sip",
    "You're the VIP's taster. Drink 2 from their glass, then the VIP drinks 1.",
  ),
  vipCard(
    "the-ask",
    "The Ask",
    "challenge",
    "Ask the VIP one question. They answer honestly or finish their drink.",
  ),
  vipCard(
    "year-in-review",
    "Year in Review",
    "category",
    "Clockwise, name something the VIP did this year. First blank or repeat drinks 2.",
  ),
  vipCard(
    "body-double",
    "Body Double",
    "group",
    "On three, point at whoever is most like the VIP. Most votes drinks 2 with the VIP.",
  ),
  vipCard(
    "bodyguard",
    "Bodyguard",
    "rule",
    "Until your next turn, you guard the VIP. Anyone who touches the VIP drinks 1.",
  ),
  vipCard(
    "drinking-buddy",
    "Drinking Buddy",
    "sip",
    "The VIP picks a drinking buddy. The VIP and the buddy drink 3 together.",
  ),
  vipCard(
    "their-type",
    "Their Type",
    "challenge",
    "Name the VIP's type in three words. If the VIP agrees, give 3. If not, drink 3.",
  ),
  vipCard(
    "pop-quiz",
    "VIP Pop Quiz",
    "challenge",
    "Name the VIP's middle name, star sign and usual drink. Drink 1 for each miss.",
  ),
  vipCard(
    "bad-advice",
    "Bad Advice",
    "category",
    "Clockwise, give the VIP awful life advice. The VIP picks the worst; its author drinks 2.",
  ),
  vipCard(
    "receipts",
    "Receipts",
    "challenge",
    "Tell the VIP's most embarrassing moment you've seen. If the VIP denies it, they drink 3.",
  ),
  vipCard(
    "toastmaster",
    "Toastmaster",
    "challenge",
    "Toast the VIP for 20 seconds. Everyone drinks 1. Stumble and you drink 3.",
  ),
  vipCard(
    "serenade",
    "Serenade",
    "challenge",
    "Sing the VIP one line of a love song, eyes locked. Refuse and drink 4.",
  ),
  vipCard(
    "one-word",
    "In One Word",
    "category",
    "Clockwise, describe the VIP in one word. Repeat a word or blank and drink 2.",
  ),
  vipCard(
    "high-ground",
    "High Ground",
    "rule",
    "Until your next turn, nobody sits or stands higher than the VIP. Caught: drink 2.",
  ),
  vipCard(
    "spill-it",
    "Spill It",
    "group",
    "The VIP tells one thing this table has never heard, or finishes their drink.",
  ),
  vipCard(
    "fan-mail",
    "Fan Mail",
    "challenge",
    "Everyone texts the VIP something nice. The VIP reads the best aloud; its author gives 3.",
  ),
  vipCard(
    "dressed-alike",
    "Who Wore It Better",
    "sip",
    "Whoever is dressed most like the VIP drinks 3. The VIP decides.",
  ),
  vipCard(
    "jail-call",
    "One Phone Call",
    "group",
    "Who would the VIP call from jail? Point on three. Most votes drinks 3 with the VIP.",
  ),
  vipCard(
    "best-quality",
    "Hall of Fame",
    "category",
    "Clockwise, name the VIP's best quality. First blank or repeat drinks 2.",
  ),
  vipCard(
    "worst-habit",
    "Hall of Shame",
    "category",
    "Clockwise, name a bad habit of the VIP. First blank drinks 2. The VIP drinks 1 for the best.",
  ),
  vipCard(
    "plus-one",
    "Plus One",
    "rule",
    "Until your next turn, whenever the VIP drinks, you drink too.",
  ),
  vipCard(
    "red-carpet",
    "Red Carpet",
    "challenge",
    "Interview the VIP like they just won an Oscar. Everyone drinks 2 to their answer.",
  ),
  vipCard(
    "wedding-toast",
    "Wedding Toast",
    "challenge",
    "Give the toast you'd give at the VIP's wedding. If anyone tears up, everyone drinks 2.",
  ),
  vipCard(
    "roast-and-toast",
    "Roast and Toast",
    "group",
    "Clockwise, roast the VIP, then toast them. The VIP names the weakest; its author drinks 2.",
  ),
  vipCard(
    "pet-name",
    "Pet Name",
    "rule",
    "Pick the VIP a pet name. Until your next turn, everyone uses it. Slip: drink 1.",
  ),
  vipCard(
    "first-impression",
    "First Impressions",
    "group",
    "Clockwise, share your first impression of the VIP. The VIP drinks 1 per right one.",
  ),
  vipCard(
    "matchmaker",
    "Matchmaker",
    "category",
    "Clockwise, name a celebrity the VIP should date. The VIP vetoes one; its author drinks 2.",
  ),
  vipCard(
    "bar-order",
    "Usual, Please",
    "challenge",
    "You and your left neighbor guess the VIP's bar order. Anyone wrong drinks 3.",
  ),
  vipCard(
    "royal-decree",
    "Royal Decree",
    "rule",
    "The VIP makes a rule that lasts until your next turn. Break it: drink 2.",
  ),
  vipCard(
    "bow-down",
    "Bow Down",
    "group",
    "Everyone bows to the VIP. Last to bow drinks 3.",
  ),
  vipCard(
    "thumb-duel",
    "Thumb Duel",
    "challenge",
    "Thumb war the VIP. Loser drinks 3.",
  ),
  vipCard(
    "heard-it",
    "Heard It Before",
    "group",
    "The VIP tells their wildest story in 30 seconds. Anyone who's heard it drinks 2.",
  ),
  vipCard(
    "fact-check",
    "Fact Check",
    "challenge",
    "Say one true and one false thing about the VIP. The VIP spots the lie or drinks 2.",
  ),
  vipCard(
    "bucket-list",
    "Bucket List",
    "category",
    "Clockwise, guess something on the VIP's bucket list. First guess the VIP rejects drinks 2.",
  ),
  vipCard(
    "throwback",
    "Throwback",
    "group",
    "Everyone finds their oldest photo of the VIP. The VIP picks the worst; its owner gives 3.",
  ),
  vipCard(
    "eye-contact",
    "Eye Contact",
    "sip",
    "Clink with the VIP, lock eyes and drink 2. Whoever breaks eye contact drinks 2 more.",
  ),
  vipCard(
    "signature-move",
    "Signature Move",
    "challenge",
    "The VIP does their signature dance move. Everyone copies it, then drinks 1.",
  ),
  vipCard(
    "biggest-fan",
    "Biggest Fan",
    "challenge",
    "Name three of the VIP's favorite things. Drink 1 for each miss.",
  ),
  vipCard(
    "butler",
    "At Your Service",
    "rule",
    "Until your next turn, you fetch the VIP anything they ask for. Refuse: drink 2.",
  ),
  vipCard(
    "nemesis",
    "Nemesis",
    "group",
    "The VIP names their nemesis at this table. That player and the VIP drink 2 each.",
  ),
  vipCard(
    "hot-take",
    "Hot Take",
    "group",
    "The VIP shares a hot take. Everyone who disagrees drinks 2.",
  ),
  vipCard(
    "grand-entrance",
    "Grand Entrance",
    "group",
    "The VIP leaves the room and comes back in. Last to applaud drinks 2.",
  ),
  vipCard(
    "look-alike",
    "Look-Alike",
    "category",
    "Clockwise, name the VIP's celebrity twin. The VIP picks the worst; its author drinks 3.",
  ),
  vipCard(
    "dirt",
    "Dirt on the VIP",
    "group",
    "Anyone with dirt on the VIP drinks 2. The VIP drinks 1 each to keep it quiet.",
  ),
  vipCard(
    "next-year",
    "Next Year",
    "category",
    "Clockwise, predict the VIP's next year in one line. First blank drinks 2.",
  ),
  vipCard(
    "dream-job",
    "Dream Job",
    "group",
    "Guess what the VIP wanted to be at seven, then the VIP tells. Right guesses give 2.",
  ),
  // The coin.
  vipCard(
    "fate",
    "The VIP's Fate",
    "sip",
    "The VIP flips for their own fate.",
    flip(
      "Tails. The VIP drinks 3.",
      "Heads. The VIP gives 6, split as they like.",
    ),
  ),
  vipCard(
    "jester",
    "Court Jester",
    "challenge",
    "Tell the VIP a joke, then flip the coin to see if it landed.",
    flip("Tails. It bombed. Drink 3.", "Heads. They laughed. Give 3."),
  ),
  vipCard(
    "pardon",
    "Royal Pardon",
    "group",
    "The VIP may pardon one player. Flip the coin to see if the crown allows it.",
    flip(
      "Tails. No pardons. Everyone but the VIP drinks 2.",
      "Heads. The VIP spares one player. Everyone else except the VIP drinks 2.",
    ),
  ),
  vipCard(
    "coin-toast",
    "Coin Toast",
    "group",
    "Raise a glass to the VIP, then flip the coin for how big a toast.",
    flip("Tails. Everyone drinks 1.", "Heads. Everyone drinks 3."),
  ),
  vipCard(
    "double-dare",
    "Double Dare",
    "challenge",
    "Dare the VIP to do something. Flip the coin to see who does it.",
    flip(
      "Tails. You do your own dare, then drink 2.",
      "Heads. The VIP does it or drinks 4.",
    ),
  ),
  // The dice.
  vipCard(
    "handout",
    "VIP Handout",
    "sip",
    "Roll two dice. The VIP hands out that many drinks.",
    roll(2, 6, "The VIP gives {total}."),
  ),
  vipCard(
    "party-favors",
    "Party Favors",
    "sip",
    "Roll. The VIP gives that many, and you drink the same.",
    roll(1, 6, "The VIP gives {total}. You drink {total}."),
  ),
  vipCard(
    "gift-bag",
    "Gift Bag",
    "sip",
    "The VIP opens a gift bag. Roll for what's inside.",
    rollTable(1, 6, [
      { min: 1, max: 2, instruction: "Socks. The VIP drinks 2." },
      { min: 3, max: 4, instruction: "Cash. The VIP gives 3." },
      { min: 5, max: 5, instruction: "A shot. The VIP takes it." },
      {
        min: 6,
        max: 6,
        instruction: "Jackpot. Everyone but the VIP drinks 3.",
      },
    ]),
  ),
  vipCard(
    "candles",
    "Birthday Candles",
    "group",
    "Roll for candles. The VIP blows them out, one drink each.",
    roll(1, 6, "The VIP drinks {total}. Everyone cheers."),
  ),
  // The supplied sheet's VIP rows stay last.
  ...customVipCards,
];

/** The pack's deck and its Last Call closers (dealt only to end a game). */
export const vipCards: CardDefinition[] = [...vipDeck, ...vipLastCall];

export const vipPack: PackDefinition = {
  version: 1,
  id: "vip",
  logo: "art/packs/vip.svg",
  title: "VIP night",
  description:
    "For a birthday, a bachelorette, or just someone's night. Crown one guest of honor and let every card favor or roast the VIP.",
  cardIds: vipDeck.map((card) => card.id),
  lastCall: vipLastCall.map((card) => card.id),
};
