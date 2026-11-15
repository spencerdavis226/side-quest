import type {
  CardDefinition,
  Offer,
  OmenEffect,
  RivalProfile,
} from "../../game/types";
import {
  card,
  DUEL_HITS,
  DUEL_HURT,
  DUEL_NEED,
  RIVAL_NEED,
  trinket,
  vs,
  type Roll,
} from "./shared";

// The rival (2026-11-15, owner: "a specific random rival every time ...
// make it so you hate this guy"). One of three follows a run. They walk in
// right after the first region boss falls and help themselves; from then on
// they hold the crossroads, turn up in a room's place (an ambush), meddle
// in a fight (the d20 rolled twice, the worse kept) and snipe what a card
// gives. What they take stays on their ledger until a fight with them is
// won. At the lair's door each ends their own way. The Gilded Company's
// gate, crossroads and door cards were retired for this. The Quest only.

/** What a lost confrontation costs (items, hearts or both), and how many
 * items their introduction takes (1 unless said). */
type Stakes = { takes?: number; damage?: number; intro?: number };

/** A rival: every card of theirs, and what each kind of meeting costs. */
interface Rival {
  who: string;
  /** The short name, on ribbons and in the ledger. */
  name: string;
  intro: CardDefinition;
  fights: CardDefinition[];
  plea: CardDefinition;
  duel: CardDefinition;
}

const ribbon = (name: string) => ({
  ribbon: `Rival · ${name}`,
  ribbonTone: "crimson" as const,
});

function rival(
  who: string,
  profile: RivalProfile,
  intro: { title: string; rules: string },
  /** What a lost confrontation costs: items, hearts, or both. */
  stakes: Stakes,
  fights: [id: string, title: string, rules: string, fight: Roll][],
  plea: {
    title: string;
    rules: string;
    offers: Offer[];
    ally?: CardDefinition["ally"];
  },
  duel: {
    title: string;
    rules: string;
    fight: Roll;
    prize: [name: string, effect: OmenEffect];
  },
): Rival {
  const name = profile.name;
  return {
    who,
    name,
    intro: {
      ...card(`rival-${who}`, intro.title, "group", intro.rules),
      ribbon: "Your Rival",
      ribbonTone: "crimson",
      encounter: "shrine",
      rival: { who, profile, takes: stakes.intro ?? 1 },
    },
    fights: fights.map(([id, title, rules, fight]) => ({
      ...card(
        `rival-${who}-${id}`,
        title,
        "challenge",
        rules,
        fight(RIVAL_NEED),
      ),
      ...ribbon(name),
      encounter: "ambush" as const,
      battle: true as const,
      ...(stakes.damage ? { damage: stakes.damage } : {}),
      rival: {
        who,
        ...(stakes.takes ? { takes: stakes.takes } : {}),
        returns: 1,
      },
    })),
    plea: {
      ...card(`rival-${who}-door`, plea.title, "group", plea.rules),
      ribbon: "The Lair's Door · Rival",
      ribbonTone: "crimson",
      encounter: "shrine",
      offers: plea.offers,
      ...(plea.ally ? { ally: plea.ally } : {}),
      rival: { who },
    },
    duel: {
      ...card(
        `rival-${who}-duel`,
        duel.title,
        "challenge",
        duel.rules,
        duel.fight(DUEL_NEED),
      ),
      ribbon: "The Lair's Door · Duel",
      ribbonTone: "crimson",
      encounter: "ambush",
      battle: true,
      hits: DUEL_HITS,
      damage: DUEL_HURT,
      deed: { won: "rival-beaten" },
      boon: trinket(...duel.prize),
      rival: { who, returns: "all" },
    },
  };
}

/** Sir Chad Thundercock (key `bradley`): the glory hog. He says "the
 * Undefeated"; he has only ever fought things already dying. He takes the
 * credit and whatever a room was about to give. */
const bradley = rival(
  "bradley",
  {
    name: "Sir Chad",
    ritual: "When Sir Chad shows up, everyone flexes. Weakest flex drinks 1.",
    lines: {
      took: "Sir Chad pockets your {item}. 'For the highlight reel, Champ.'",
      back: "Sir Chad drops your {item}. 'I was holding it for you, Champ.'",
      lostTo: "Sir Chad kisses both biceps at you. 'Unlucky, Champ.'",
      beaten: "Sir Chad says he let you win. Nobody believes him.",
      ambush: "Sir Chad steps in front of you, shirt off. 'Spot me, Champ.'",
      meddle:
        "'Let me show you, Champ.' Sir Chad grabs your arm. Roll twice, keep the worse.",
      snipe:
        "Sir Chad poses with your loot. 'Great teamwork, Champ.' It's his now.",
      redo: "'Champ, that didn't count. Again.' Roll it again; the new roll stands.",
    },
    style: { ambush: 1, redo: 4, snipe: 6 },
    verse: {
      joined: "with Sir Chad taking all the credit,",
      beaten: "left Sir Chad crying in a ditch,",
      ahead: "two steps behind Sir Chad Thundercock,",
    },
  },
  {
    title: "Sir Chad Thundercock",
    rules:
      "Sir Chad Thundercock arrives once the boss is dead. Everyone flexes; the weakest drinks 2.",
  },
  { takes: 1, damage: 1 },
  [
    [
      "autograph",
      "Chad's Autograph",
      "Sir Chad is signing your gear with a sharpie shaped like himself. Roll d20 to stop him.",
      vs(
        "He signs your forehead. Drink 3.",
        "You sign his cape instead. Give 3.",
      ),
    ],
    [
      "verse",
      "The Gun Show",
      "Sir Chad is charging admission to his biceps. Out-flex him: roll d20.",
      vs(
        "He kisses both guns at you. Drink 3.",
        "Your flex wins. He sulks. Give 3.",
      ),
    ],
    [
      "shortcut",
      "Participation Trophy",
      "Sir Chad hands you a trophy: 'Nice Try, Champ'. Roll d20 to shove it up his.",
      vs(
        "You keep it. It's engraved. Drink 3.",
        "Right where it belongs. Give 3.",
      ),
    ],
    [
      "spar",
      "Chad's Spotter",
      "Sir Chad needs a spot, on your face. Roll d20 before he finishes his set.",
      vs(
        "Twelve reps. You counted. Drink 3.",
        "You tip the bar. He blames the bar. Give 3.",
      ),
    ],
  ],
  {
    title: "Sir Chad Begs",
    rules:
      "Sir Chad, cape on fire, wants in. He keeps what he took, and the credit. Everyone votes.",
    offers: [
      { label: "Take him · drink 2", recruit: true, deed: "rival-joined" },
      { label: "Kick his ass", deed: "rival-refused" },
    ],
    ally: {
      name: "Sir Chad Thundercock",
      calling: ["boss"],
      bonus: 3,
      grudge: true,
      ritual: "Everyone says 'nice one, Chad' after every swing.",
    },
  },
  {
    title: "Chad's Last Pose",
    rules:
      "Sir Chad wants the dragon and the credit. Kick his ass at the door. Roll d20.",
    fight: vs(
      "He poses mid-fight and still hits you. Drink 4.",
      "His cape catches fire again. He runs. Give 4.",
    ),
    prize: ["Chad's Cape", { roll: { boss: 1 } }],
  },
);

/** Lady Fingerbang (key `mirabel`): the thief, charming and handsy.
 * Everything is hers; a lost meeting costs two items and no hearts. */
const mirabel = rival(
  "mirabel",
  {
    name: "Lady Fingerbang",
    ritual:
      "When Lady Fingerbang shows up, everyone guards their drink. Last hand on it drinks 1.",
    lines: {
      took: "Lady Fingerbang was here. Check your pockets: your {item}, gone.",
      back: "Lady Fingerbang hands back your {item}. It's a little warm.",
      lostTo: "'Mine,' says Lady Fingerbang, already halfway out the door.",
      beaten: "Lady Fingerbang pouts, then pinches a bum on the way out.",
      ambush:
        "Lady Fingerbang blocks the way, licking her fingers. 'Hello, you.'",
      meddle:
        "Her hand is in your pocket mid-swing. Roll twice, keep the worse.",
      swipe:
        "Lady Fingerbang was here. Check your pockets. Your newest item is gone.",
      poach: "Lady Fingerbang winks at your ally. Your ally winks back.",
      snipe:
        "Whatever this gives is already down Lady Fingerbang's top. 'Mine.'",
    },
    style: { swipe: 4, ambush: 3, snipe: 2, poach: 1 },
    verse: {
      joined: "with Fingerbang's hand in their pocket,",
      beaten: "took it all back from Fingerbang,",
      ahead: "robbed blind by Lady Fingerbang,",
    },
  },
  {
    title: "Lady Fingerbang",
    rules:
      "Lady Fingerbang admires your things. 'Mine,' she says. Everyone covers a drink; last drinks 2.",
  },
  // She steals two at a time, from the start (Rivals Phase 2).
  { takes: 2, intro: 2 },
  [
    [
      "inventory",
      "The Pat-Down",
      "Lady Fingerbang offers to check you for weapons. Thoroughly. Roll d20 to say no.",
      vs("She found something. Drink 3.", "You pat her down instead. Give 3."),
    ],
    [
      "trade",
      "A Fair Trade",
      "Lady Fingerbang will trade your things for a wink. Roll d20 to refuse the wink.",
      vs(
        "It was a very good wink. Drink 3.",
        "You keep your things. She pouts. Give 3.",
      ),
    ],
    [
      "keepers",
      "Finders Keepers",
      "'Finders keepers,' says Lady Fingerbang, holding your stuff. Roll d20 to get it back.",
      vs(
        "She found it first, fair and square. Drink 3.",
        "You find her purse. Keepers. Give 3.",
      ),
    ],
    [
      "toll",
      "Her Toll Booth",
      "Lady Fingerbang charges a toll of 'everything you've got'. Roll d20 to run it.",
      vs(
        "You pay. She gives no change. Drink 3.",
        "You run it. She blows a kiss. Give 3.",
      ),
    ],
  ],
  {
    title: "Fingerbang's Offer",
    rules:
      "Lady Fingerbang gives it all back if she can come. She crosses her heart, with your hand. Vote.",
    offers: [
      {
        label: "Take her",
        recruit: true,
        restore: true,
        deed: "rival-joined",
      },
      { label: "Duel her", deed: "rival-refused" },
    ],
    ally: {
      name: "Lady Fingerbang",
      calling: ["any"],
      bonus: 3,
      turncoat: true,
      ritual: "Lose a fight she is in and she leaves with the whole satchel.",
    },
  },
  {
    title: "Mine, Thanks",
    rules:
      "Lady Fingerbang wants the hoard, all of it, and your boots. Duel her. Roll d20.",
    fight: vs(
      "She has your boots now. Drink 4.",
      "You turn her out, pockets and all. Give 4.",
    ),
    prize: ["Fingerbang's Purse", { satchel: 4 }],
  },
);

/** Sensei Saggynuts (key `tutt`), your old master: ancient, cross-legged
 * in a loincloth that does not cover enough, never impressed. He
 * confiscates once; after that a lost lesson costs a heart, not items. */
const tutt = rival(
  "tutt",
  {
    name: "Sensei Saggynuts",
    ritual:
      "When Sensei Saggynuts shows up, everyone bows. He sees up your nose. Last to bow drinks 1.",
    lines: {
      took: "Sensei Saggynuts confiscates your {item}. 'You are not ready.'",
      back: "Sensei returns your {item}. 'Perhaps you are ready. Perhaps.'",
      lostTo: "'Again,' says Sensei Saggynuts, adjusting nothing.",
      beaten: "Sensei Saggynuts nods, once. Best day of your life.",
      ambush:
        "Sensei Saggynuts sits cross-legged in your path. Don't look down.",
      meddle: "'Elbow.' Sensei corrects your form. Roll twice, keep the worse.",
      redo: "'Lucky. Again.' Sensei makes you redo it. The new roll stands.",
      snipe: "Whatever this gives, Sensei confiscates. 'You are not ready.'",
    },
    style: { ambush: 2, meddle: 5, redo: 5 },
    verse: {
      beaten: "passed Sensei Saggynuts' final exam,",
      ahead: "to Sensei Saggynuts' lasting shame,",
    },
  },
  {
    title: "Sensei Saggynuts",
    rules:
      "Sensei Saggynuts inspects your work. 'Hm. No.' Everyone sits up straight; slouchers drink 2.",
  },
  { damage: 1 },
  [
    [
      "quiz",
      "Pop Quiz",
      "Sensei Saggynuts has a pop quiz and his loincloth is slipping. Roll d20 without looking down.",
      vs(
        "You looked. 'See me after.' Drink 3.",
        "Full marks, eyes up. Give 3.",
      ),
    ],
    [
      "demonstration",
      "Wax On, Nuts Off",
      "Sensei Saggynuts makes you wax his... floor. Roll d20 to finish before he sits up.",
      vs(
        "He sat up. You saw everything. Drink 3.",
        "Floor done, eyes saved. Give 3.",
      ),
    ],
    [
      "posture",
      "Posture Check",
      "Sensei Saggynuts taps your spine with his stick. 'Slouching.' Roll d20 to stand like a hero.",
      vs(
        "He tuts. It echoes. Drink 3.",
        "He finds nothing to fix, and hates it. Give 3.",
      ),
    ],
    [
      "in-my-day",
      "In My Day",
      "'In my day we slew dragons before breakfast.' Roll d20 to out-story Sensei Saggynuts.",
      vs(
        "His story has three more parts. Drink 3.",
        "Yours has a twist he never saw. Give 3.",
      ),
    ],
  ],
  {
    title: "The Final Exam",
    rules:
      "Sensei Saggynuts blocks the door. 'One last lesson.' He's not coming along. Everyone groans.",
    offers: [
      { label: "Sit the exam", deed: "rival-refused" },
      { label: "Skip it · drink 3", deed: "rival-skipped" },
    ],
  },
  {
    title: "Sensei's Last Lesson",
    rules:
      "Sensei Saggynuts raises his stick. 'Again.' Pass the final exam. Roll d20.",
    fight: vs(
      "'Again.' Drink 4.",
      "He nods, once. Best day of your life. Give 4.",
    ),
    prize: ["Sensei's Stick", { roll: { all: 1 } }],
  },
);

export const rivals: Rival[] = [bradley, mirabel, tutt];
export const rivalIntros = rivals.map((r) => r.intro);
export const rivalFights = rivals.flatMap((r) => r.fights);
export const rivalPleas = rivals.map((r) => r.plea);
export const rivalDuels = rivals.map((r) => r.duel);
export const rivalCards: CardDefinition[] = [
  ...rivalIntros,
  ...rivalFights,
  ...rivalPleas,
  ...rivalDuels,
];
