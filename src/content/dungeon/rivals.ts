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

type Stakes = { takes?: number; damage?: number };

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
      rival: { who, profile, takes: 1 },
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

/** Sir Bradley the Undefeated, of the Gilded Company: the glory hog. He
 * takes the credit and whatever a room was about to give. */
const bradley = rival(
  "bradley",
  {
    name: "Sir Bradley",
    ritual:
      "When Sir Bradley shows up, everyone salutes. Last to salute drinks 1.",
    meddle: "'Let me show you, Champ.' Roll twice, keep the worse.",
    snipe: "Whatever this gives, Sir Bradley takes. 'For the Company.'",
    style: { ambush: 1, meddle: 2, snipe: 6 },
    verse: {
      joined: "with Sir Bradley taking the credit,",
      beaten: "left Sir Bradley in a ditch,",
      ahead: "a step behind Sir Bradley,",
    },
  },
  {
    title: "Sir Bradley Arrives",
    rules:
      "Sir Bradley the Undefeated says he softened it up for you, Champ. Everyone salutes; last drinks 2.",
  },
  { takes: 1, damage: 1 },
  [
    [
      "autograph",
      "Bradley's Autograph",
      "Sir Bradley is signing your gear. Nobody asked. Roll d20 to stop him.",
      vs(
        "He signs your forehead. Drink 3.",
        "You sign his cape instead. Give 3.",
      ),
    ],
    [
      "verse",
      "The Bard's New Verse",
      "Sir Bradley's bard sings your last defeat, with gestures. Roll d20 to out-sing her.",
      vs(
        "It's catchy. You hum it, and drink 3.",
        "Your verse about his cape lands. Give 3.",
      ),
    ],
    [
      "shortcut",
      "Bradley's Shortcut",
      "Sir Bradley knows a shortcut, and he is standing in it. Roll d20 to push past.",
      vs(
        "He lets you through, then takes it first. Drink 3.",
        "He falls in a ditch, cape and all. Give 3.",
      ),
    ],
    [
      "spar",
      "A Friendly Spar",
      "'Friendly spar, Champ?' Sir Bradley has already drawn. Roll d20.",
      vs(
        "He wins, and bows to nobody in particular. Drink 3.",
        "You disarm him. He says he let you. Give 3.",
      ),
    ],
  ],
  {
    title: "Sir Bradley Begs",
    rules:
      "Sir Bradley, cape on fire, asks to join you. He keeps what he took. Everyone pretends to think.",
    offers: [
      { label: "Take him · drink 2", recruit: true, deed: "rival-joined" },
      { label: "Duel him", deed: "rival-refused" },
    ],
    ally: {
      name: "Sir Bradley",
      calling: ["boss"],
      bonus: 3,
      ritual: "Everyone says 'well done, Bradley' after every swing.",
    },
  },
  {
    title: "Bradley's Last Pose",
    rules:
      "Sir Bradley wants the dragon and the credit. Duel him at the door. Roll d20.",
    fight: vs(
      "He poses mid-fight and still hits you. Drink 4.",
      "His cape catches fire again. He runs. Give 4.",
    ),
    prize: ["Bradley's Cape", { roll: { boss: 1 } }],
  },
);

/** Lady Mirabel de Mine: the thief. Everything is hers; a lost meeting
 * costs two items and no hearts. */
const mirabel = rival(
  "mirabel",
  {
    name: "Lady Mirabel",
    ritual:
      "When Lady Mirabel shows up, everyone covers their drink. Last drinks 1.",
    meddle: "Her hand is in your pocket mid-swing. Roll twice, keep the worse.",
    snipe: "Whatever this gives is already in her bag. 'Mine.'",
    style: { ambush: 2, meddle: 2, snipe: 4 },
    verse: {
      joined: "with Mirabel's hand in their pocket,",
      beaten: "took it all back from Mirabel,",
      ahead: "lighter by whatever Mirabel took,",
    },
  },
  {
    title: "Mirabel de Mine",
    rules:
      "Lady Mirabel de Mine admires your things. 'Mine,' she says. Everyone covers a drink; last drinks 2.",
  },
  { takes: 2 },
  [
    [
      "inventory",
      "Mirabel's Inventory",
      "Lady Mirabel is listing your pack out loud, item by item. Roll d20 to get it back.",
      vs(
        "She keeps a souvenir. Drink 3.",
        "You take back yours and one of hers. Give 3.",
      ),
    ],
    [
      "trade",
      "A Fair Trade",
      "Lady Mirabel offers a fair trade: your things for her smile. Roll d20 to refuse.",
      vs(
        "It is a very good smile. Drink 3.",
        "You keep your things. She pouts. Give 3.",
      ),
    ],
    [
      "keepers",
      "Finders Keepers",
      "'Finders keepers,' says Lady Mirabel, holding something of yours. Roll d20.",
      vs(
        "She found it first, fair and square. Drink 3.",
        "You find her purse. Keepers. Give 3.",
      ),
    ],
    [
      "toll",
      "Mirabel's Toll",
      "Lady Mirabel has a toll booth on your road. The toll is 'whatever you have'. Roll d20.",
      vs(
        "You pay. She gives no change. Drink 3.",
        "You charge her for the road. Give 3.",
      ),
    ],
  ],
  {
    title: "Mirabel's Offer",
    rules:
      "Lady Mirabel will give it all back if she can come. She crosses her heart with your hand. Vote.",
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
      name: "Lady Mirabel",
      calling: ["any"],
      bonus: 3,
      turncoat: true,
      ritual: "Lose a fight she is in and she leaves with the whole satchel.",
    },
  },
  {
    title: "Mine, Thanks",
    rules:
      "Lady Mirabel wants the hoard, all of it, and your boots. Duel her. Roll d20.",
    fight: vs(
      "She has your boots now. Drink 4.",
      "You turn her out, pockets and all. Give 4.",
    ),
    prize: ["Mirabel's Purse", { satchel: 4 }],
  },
);

/** Master Aldous Tutt, your old teacher: never impressed. He confiscates
 * once; after that a lost lesson costs a heart, not items. */
const tutt = rival(
  "tutt",
  {
    name: "Master Tutt",
    ritual:
      "When Master Tutt shows up, everyone sits up straight. Last drinks 1.",
    meddle: "'Elbow.' He corrects your form. Roll twice, keep the worse.",
    snipe: "Whatever this gives, he confiscates. 'You are not ready.'",
    style: { ambush: 2, meddle: 6, snipe: 1 },
    verse: {
      beaten: "passed Master Tutt's last exam,",
      ahead: "to Master Tutt's lasting disappointment,",
    },
  },
  {
    title: "Master Tutt",
    rules:
      "Aldous Tutt, your old master, inspects your work. 'Hm. No.' Everyone sits up; the last drinks 2.",
  },
  { damage: 1 },
  [
    [
      "quiz",
      "Pop Quiz",
      "Master Tutt has a pop quiz, and you have no notes. Roll d20 and show your working.",
      vs(
        "'See me after.' Drink 3.",
        "Full marks. He checks it twice. Give 3.",
      ),
    ],
    [
      "demonstration",
      "Tutt Demonstrates",
      "'Watch closely.' Master Tutt demonstrates, on you. Roll d20 to block it.",
      vs(
        "A textbook strike, he says, on you. Drink 3.",
        "You block it. 'Lucky.' Give 3.",
      ),
    ],
    [
      "posture",
      "Posture Check",
      "Master Tutt taps your spine with his stick. 'Slouching.' Roll d20 to stand like a hero.",
      vs(
        "He tuts. It echoes. Drink 3.",
        "He finds nothing to fix, and hates it. Give 3.",
      ),
    ],
    [
      "in-my-day",
      "In My Day",
      "'In my day we slew dragons before breakfast.' Roll d20 to out-story Master Tutt.",
      vs(
        "His story has three more parts. Drink 3.",
        "Yours has a twist he never saw. Give 3.",
      ),
    ],
  ],
  {
    title: "The Final Exam",
    rules:
      "Master Tutt blocks the door. 'One last lesson.' He will not be coming along. Everyone groans.",
    offers: [
      { label: "Sit the exam", deed: "rival-refused" },
      { label: "Skip it · drink 3", deed: "rival-skipped" },
    ],
  },
  {
    title: "Tutt's Last Lesson",
    rules:
      "Master Tutt raises his stick. 'Again.' Pass the final exam. Roll d20.",
    fight: vs(
      "'Again.' Drink 4.",
      "He nods, once. Best day of your life. Give 4.",
    ),
    prize: ["Tutt's Stick", { roll: { all: 1 } }],
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
