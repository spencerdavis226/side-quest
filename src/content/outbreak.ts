import type { CardDefinition, Category, PackDefinition } from "../game/types";
import { cardFactory } from "./author";

// Outbreak (2026-11-24, owner): callbacks. A card here may plant another
// (`sequel`) that comes back a few draws later: the cure for a virus, the
// grenade going off, a debt coming due, a quiz on a word the table was told
// to remember. The app deals the callback itself, so nobody keeps count:
// `plantSequels` (src/game/engine.ts) puts it `after` draws behind its card
// whenever the deck is dealt. Viruses are Picolo's idea; the grenade is
// Exploding Kittens' bomb. Every line is original.
//
// IDs are by slug; a callback is `outbreak.<slug>` like any card, listed in
// the pack's `planted` and in no deck. Never reuse an ID.
const card = cardFactory("outbreak");

/** Its callback comes back this many draws later, one picked at random. */
const CURE: [number, number] = [4, 8];
const FUSE: [number, number] = [2, 10];
const LATER: [number, number] = [3, 9];

type Side = [id: string, title: string, category: Category, rules: string];

const planted: CardDefinition[] = [];
const plant = (first: Side, after: [number, number], back: Side) => {
  const later: CardDefinition = {
    ...card(...back),
    planted: true,
    ribbon: "Callback",
  };
  planted.push(later);
  return { ...card(...first), sequel: { cardId: later.id, after } };
};

const planters: CardDefinition[] = [
  // --- Viruses: a rule until its cure comes back ----------------------------
  plant(
    [
      "patient-zero",
      "Patient Zero",
      "rule",
      "You're infected: until the cure, you only speak in questions. Slip: drink 1.",
    ],
    CURE,
    [
      "cure-patient-zero",
      "The Cure",
      "group",
      "Patient Zero is cured. Everyone who caught them slipping drinks 2 to their health.",
    ],
  ),
  plant(
    [
      "pirate-flu",
      "Pirate Flu",
      "rule",
      "You're infected: until the cure, you talk like a pirate. Slip: drink 1.",
    ],
    CURE,
    [
      "cure-pirate-flu",
      "Scurvy Cured",
      "sip",
      "The pirate is cured. They drink 2 to celebrate, matey.",
    ],
  ),
  plant(
    [
      "narrator-virus",
      "Narrator Virus",
      "rule",
      "You're infected: until the cure, you talk about yourself in the third person. Slip: drink 1.",
    ],
    CURE,
    [
      "cure-narrator-virus",
      "First Person",
      "group",
      "The narrator is cured. Everyone they annoyed gives them 1.",
    ],
  ),
  plant(
    [
      "lockjaw",
      "Lockjaw",
      "rule",
      "You're infected: until the cure, nobody sees your teeth. Laugh with them showing: drink 1.",
    ],
    CURE,
    [
      "cure-lockjaw",
      "Jaw Unlocked",
      "sip",
      "Lockjaw is cured. They flash the table a big grin, then drink 2.",
    ],
  ),
  plant(
    [
      "ex-syndrome",
      "Ex Syndrome",
      "rule",
      "You're infected: until the cure, you call everyone 'my ex'. Slip: drink 1.",
    ],
    CURE,
    [
      "cure-ex-syndrome",
      "Closure",
      "group",
      "The ex-caller is cured. Everyone they called an ex drinks 1.",
    ],
  ),
  plant(
    [
      "royal-pox",
      "Royal Pox",
      "rule",
      "You're infected: until the cure, you call everyone Your Majesty. Slip: drink 1.",
    ],
    CURE,
    [
      "cure-royal-pox",
      "Revolution",
      "group",
      "The royal pox is cured. Everyone they bowed to drinks 2.",
    ],
  ),
  plant(
    [
      "toddler-virus",
      "Toddler Virus",
      "rule",
      "You're infected: until the cure, you say 'why?' to anything said to you. Slip: drink 1.",
    ],
    CURE,
    [
      "cure-toddler-virus",
      "Grown Up",
      "challenge",
      "The toddler is cured. They explain taxes in one sentence, then drink 2.",
    ],
  ),
  plant(
    [
      "left-hand-plague",
      "Left-Hand Plague",
      "rule",
      "You're infected: until the cure, you drink with your left hand only. Slip: drink 1.",
    ],
    CURE,
    [
      "cure-left-hand-plague",
      "Right Hand Back",
      "sip",
      "The left-hand plague is cured. They give 3 to whoever caught them most.",
    ],
  ),
  // --- Grenades: something goes off a few cards later -----------------------
  plant(
    [
      "live-grenade",
      "Live Grenade",
      "group",
      "A grenade is rolling around the next ten cards. Whoever draws it finishes their drink.",
    ],
    FUSE,
    [
      "boom",
      "Boom",
      "sip",
      "The grenade lands on you. Finish your drink. Anyone who flinched drinks 1.",
    ],
  ),
  plant(
    [
      "silent-but-deadly",
      "Silent but Deadly",
      "group",
      "Someone dropped a silent one. It hits within ten cards. Whoever draws it drinks 4.",
    ],
    FUSE,
    [
      "deadly",
      "It Hit You",
      "sip",
      "The silent one found you. Drink 4 and fan the table.",
    ],
  ),
  plant(
    [
      "time-bomb",
      "Time Bomb",
      "group",
      "A bomb is ticking somewhere in the next ten cards. Its drawer and both neighbors pay.",
    ],
    FUSE,
    [
      "kaboom",
      "Kaboom",
      "group",
      "The bomb goes off. You and both your neighbors drink 3.",
    ],
  ),
  // --- Debts: paid now, collected later ------------------------------------
  plant(
    [
      "payday-loan",
      "Payday Loan",
      "sip",
      "Give 4 now. The loan comes back with interest soon.",
    ],
    LATER,
    [
      "collections",
      "Collections",
      "sip",
      "Collections. Whoever took the Payday Loan drinks 6. Interest is a bitch.",
    ],
  ),
  plant(
    [
      "iou",
      "IOU",
      "sip",
      "Point at someone. They owe you a drink, and it comes due soon.",
    ],
    LATER,
    [
      "debt-due",
      "Debt Due",
      "sip",
      "The IOU is due. Whoever owes it drinks 3 and thanks the lender.",
    ],
  ),
  plant(
    [
      "hangover-insurance",
      "Hangover Insurance",
      "sip",
      "Drink 2 now. Your future self gets a refund.",
    ],
    LATER,
    [
      "refund",
      "Refund",
      "sip",
      "The insurance pays out. Whoever bought it gives 4.",
    ],
  ),
  // --- Memory: told now, tested later ---------------------------------------
  plant(
    [
      "remember-this",
      "Remember This",
      "group",
      "The table picks one silly word together. Remember it: a pop quiz is coming.",
    ],
    LATER,
    [
      "pop-quiz",
      "Pop Quiz",
      "group",
      "On 3, everyone says the word from Remember This. Wrong or blank drinks 3.",
    ],
  ),
  plant(
    [
      "calling-it",
      "Calling It",
      "challenge",
      "Point at who'll be drunkest ten minutes from now. The table remembers.",
    ],
    LATER,
    [
      "called-it",
      "Called It?",
      "group",
      "The table votes on the pick from Calling It. Right, the caller gives 4. Wrong, drinks 4.",
    ],
  ),
  plant(
    [
      "cliffhanger",
      "Cliffhanger",
      "challenge",
      "Start a story about your worst night out and stop mid-sentence. It comes back.",
    ],
    LATER,
    [
      "to-be-continued",
      "To Be Continued",
      "challenge",
      "Whoever told the Cliffhanger finishes the story now. Bore the table: drink 3.",
    ],
  ),
  plant(
    [
      "grudge",
      "Grudge",
      "challenge",
      "Name someone here you have beef with. Don't say why. It gets settled soon.",
    ],
    LATER,
    [
      "grudge-match",
      "Grudge Match",
      "challenge",
      "The Grudge is settled: those two thumb war. Loser drinks 3.",
    ],
  ),
  plant(
    [
      "rain-check",
      "Rain Check",
      "group",
      "You're owed a waterfall, not now. It comes back to you soon.",
    ],
    LATER,
    [
      "waterfall-due",
      "Waterfall Due",
      "group",
      "The Rain Check is due. Whoever holds it starts a waterfall now.",
    ],
  ),
  plant(
    [
      "sealed-envelope",
      "Sealed Envelope",
      "challenge",
      "Predict out loud who drinks next. You'll be checked soon.",
    ],
    LATER,
    [
      "envelope-opened",
      "Envelope Opened",
      "group",
      "The table rules on the Sealed Envelope. Right, its writer gives 3. Wrong, drinks 3.",
    ],
  ),
];

// Plain cards for the theme; nothing comes back.
const plain: CardDefinition[] = [
  card(
    "quarantine",
    "Quarantine",
    "rule",
    "Until your next turn, nobody may touch you. Anyone who does drinks 2.",
  ),
  card(
    "hand-sanitizer",
    "Hand Sanitizer",
    "group",
    "Everyone who hasn't washed their hands since they got here drinks 2.",
  ),
  card(
    "sneeze-guard",
    "Sneeze Guard",
    "group",
    "Fake a sneeze at the table. Everyone who flinches drinks 1.",
  ),
  card(
    "super-spreader",
    "Super Spreader",
    "sip",
    "You touched everything. Point at three people. Each drinks 1.",
  ),
  card(
    "symptoms",
    "Symptoms",
    "group",
    "Everyone who's hungover right now drinks 2. You know who you are.",
  ),
  card(
    "patient-history",
    "Patient History",
    "challenge",
    "Tell the table the dumbest way you've ever gotten sick. Everyone drinks 2.",
  ),
];

export const outbreakDeck: CardDefinition[] = [...planters, ...plain];
export const outbreakCards: CardDefinition[] = [...outbreakDeck, ...planted];

export const outbreakPack: PackDefinition = {
  version: 1,
  id: "outbreak",
  logo: "art/packs/outbreak.svg",
  title: "Outbreak",
  description:
    "Viruses, grenades, debts and pop quizzes: some cards come back a few draws later, and the app deals them.",
  cardIds: outbreakDeck.map((c) => c.id),
  planted: planted.map((c) => c.id),
};
