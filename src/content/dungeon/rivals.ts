import type {
  CardDefinition,
  Jinx,
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
// make it so you hate this guy"). One of six follows a run (three since
// Rivals Phase 3). They walk in
// right after the first region boss falls and help themselves; from then on
// they hold the crossroads, turn up in a room's place (an ambush), meddle
// in a fight (the d20 rolled twice, the worse kept) and snipe what a card
// gives. What they take stays on their ledger until a fight with them is
// won. At the lair's door each ends their own way. The Gilded Company's
// gate, crossroads and door cards were retired for this. The Quest only.

/** What a lost confrontation costs (items, hearts or both), and how many
 * items their introduction takes (1 unless said). */
type Stakes = { takes?: number; damage?: number; intro?: number };
/** One confrontation: its ID, title, rules and roll, and (Rivals Phase 3)
 * the curse a lost one lays, which is also the curse they cut in with. */
type Fight = [
  id: string,
  title: string,
  rules: string,
  fight: Roll,
  curse?: Jinx,
];

/** A rival: every card of theirs, and what each kind of meeting costs. */
interface Rival {
  who: string;
  /** The short name, on ribbons and in the ledger. */
  name: string;
  intro: CardDefinition;
  /** Rivals Phase 6: their introduction to a table that met them before
   * (the Chronicle remembers): they take two this time. */
  back: CardDefinition;
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
  intro: { title: string; rules: string; back: [title: string, rules: string] },
  /** What a lost confrontation costs: items, hearts, or both. */
  stakes: Stakes,
  fights: Fight[],
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
    /** The prize's words, when its numbers cannot say it. */
    prizeRules?: string;
    /** Swings to land (Gary's audit takes three). */
    hits?: number;
    /** A dragon lore when they fall (Dame Queefington's lute). */
    lore?: true;
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
    back: {
      ...card(`rival-${who}-back`, intro.back[0], "group", intro.back[1]),
      ribbon: "Your Rival · Again",
      ribbonTone: "crimson",
      encounter: "shrine",
      rival: { who, profile, takes: 2 },
    },
    fights: fights.map(([id, title, rules, fight, curse]) => ({
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
      ...(curse ? { jinx: curse } : {}),
      rival: {
        who,
        ...(stakes.takes ? { takes: stakes.takes } : {}),
        returns: 1,
        ...(curse ? { curse: true as const } : {}),
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
      hits: duel.hits ?? DUEL_HITS,
      damage: DUEL_HURT,
      deed: { won: "rival-beaten" },
      boon: {
        ...trinket(...duel.prize),
        ...(duel.prizeRules ? { rules: duel.prizeRules } : {}),
      },
      ...(duel.lore ? { reward: { lore: true as const } } : {}),
      rival: { who, returns: "all" },
    },
  };
}

/** Sir Chad Thundercock (key `chad`): the glory hog. He says "the
 * Undefeated"; he has only ever fought things already dying. He takes the
 * credit and whatever a room was about to give. */
const chad = rival(
  "chad",
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
    // Rivals Phase 4: on the team when the dragon falls, he slew it.
    credit: {
      line: "and Sir Chad slew {dragon}. Allegedly.",
      short: "and Sir Chad slew it. Allegedly.",
    },
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
    back: [
      "Chad Is Back",
      "Sir Chad is back. 'Remember me, Champ?' He takes two this time. Weakest flex drinks 2.",
    ],
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
      "gun-show",
      "The Gun Show",
      "Sir Chad is charging admission to his biceps. Out-flex him: roll d20.",
      vs(
        "He kisses both guns at you. Drink 3.",
        "Your flex wins. He sulks. Give 3.",
      ),
    ],
    [
      "participation-trophy",
      "Participation Trophy",
      "Sir Chad hands you a trophy: 'Nice Try, Champ'. Roll d20 to shove it up his.",
      vs(
        "You keep it. It's engraved. Drink 3.",
        "Right where it belongs. Give 3.",
      ),
    ],
    [
      "spotter",
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

/** Lady Fingerbang (key `fingerbang`): the thief, charming and light-fingered.
 * Everything is hers; a lost meeting costs two items and no hearts. */
const fingerbang = rival(
  "fingerbang",
  {
    name: "Lady Fingerbang",
    ritual:
      "When Lady Fingerbang shows up, everyone guards their drink. Last hand on it drinks 1.",
    lines: {
      took: "Lady Fingerbang was here. Check your pockets: your {item}, gone.",
      back: "Lady Fingerbang hands back your {item}. It's a little warm.",
      lostTo: "'Mine,' says Lady Fingerbang, already halfway out the door.",
      beaten: "Lady Fingerbang pouts, then picks a pocket on the way out.",
      ambush:
        "Lady Fingerbang blocks the way, wearing your rings. 'Hello, you.'",
      meddle:
        "Her hand is in your pocket mid-swing. Roll twice, keep the worse.",
      swipe:
        "Lady Fingerbang was here. Check your pockets. Your newest item is gone.",
      poach: "Lady Fingerbang winks at your ally. Your ally winks back.",
      turned:
        "Lady Fingerbang turns on you. Everyone who voted to take her drinks 3.",
      snipe:
        "Whatever this gives is already in Lady Fingerbang's sack. 'Mine.'",
    },
    style: { swipe: 4, ambush: 3, snipe: 2, poach: 1 },
    // Rivals Phase 4: the more she was beaten, the likelier she turns.
    betray: { base: 0.25, perWin: 0.15, does: "satchel" },
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
    back: [
      "Fingerbang Returns",
      "Lady Fingerbang is back. She remembers your pockets, and takes two. Last to cover a drink drinks 2.",
    ],
  },
  // She steals two at a time, from the start (Rivals Phase 2).
  { takes: 2, intro: 2 },
  [
    [
      "pat-down",
      "The Pat-Down",
      "Lady Fingerbang offers to check you for weapons. And coins. Roll d20 to say no.",
      vs(
        "She found your purse. Drink 3.",
        "You check her pockets instead. Give 3.",
      ),
    ],
    [
      "fair-trade",
      "A Fair Trade",
      "Lady Fingerbang will trade your things for a wink. Roll d20 to refuse the wink.",
      vs(
        "It was a very good wink. Drink 3.",
        "You keep your things. She pouts. Give 3.",
      ),
    ],
    [
      "finders-keepers",
      "Finders Keepers",
      "'Finders keepers,' says Lady Fingerbang, holding your stuff. Roll d20 to get it back.",
      vs(
        "She found it first, fair and square. Drink 3.",
        "You find her purse. Keepers. Give 3.",
      ),
    ],
    [
      "toll-booth",
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
      "Lady Fingerbang gives it all back if she can come. She crosses her heart, in your gloves. Vote.",
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

/** Sensei Saggynuts (key `sensei`), your old master: ancient, cross-legged
 * in a loincloth that does not cover enough, never impressed. He
 * confiscates once; after that a lost lesson costs a heart, not items. */
const sensei = rival(
  "sensei",
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
      saved: "and carried Sensei home at last,",
      left: "and left Sensei to the dragon,",
    },
  },
  {
    title: "Sensei Saggynuts",
    rules:
      "Sensei Saggynuts inspects your work. 'Hm. No.' Everyone sits up straight; slouchers drink 2.",
    back: [
      "Sensei Returns",
      "Sensei Saggynuts is back. 'You again. Still slouching.' He confiscates two. Slouchers drink 2.",
    ],
  },
  { damage: 1 },
  [
    [
      "pop-quiz",
      "Pop Quiz",
      "Sensei Saggynuts has a pop quiz and his loincloth is slipping. Roll d20 without looking down.",
      vs(
        "You looked. 'See me after.' Drink 3.",
        "Full marks, eyes up. Give 3.",
      ),
    ],
    [
      "wax-on-nuts-off",
      "Wax On, Nuts Off",
      "Sensei Saggynuts makes you wax his... floor. Roll d20 to finish before he sits up.",
      vs(
        "He sat up. You saw everything. Drink 3.",
        "Floor done, eyes saved. Give 3.",
      ),
    ],
    [
      "posture-check",
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

/** Chuck the Cuck (Rivals Phase 3): the squire who just likes to watch.
 * He "helps" with your rolls, holds your things for strangers, and joins
 * on a coin: heads, secretly excellent; tails, useless. */
const chuck = rival(
  "chuck",
  {
    name: "Chuck the Cuck",
    ritual:
      "When Chuck the Cuck shows up, the drawer stares someone down as him. First to look away drinks 1.",
    lines: {
      took: "Chuck the Cuck holds your {item} for you. He keeps holding it.",
      back: "Chuck the Cuck hands back your {item}. It's a bit damp.",
      lostTo: "Chuck the Cuck claps. Not for you.",
      beaten: "Chuck the Cuck says he liked watching that, actually.",
      redo: "Chuck the Cuck 'helps' you with that roll. Again. The new roll stands.",
      meddle:
        "Chuck the Cuck holds your sword for you. Roll twice, keep the worse.",
      handoff:
        "Chuck the Cuck lends your {item} to a nice stranger. It's gone.",
    },
    style: { redo: 6, meddle: 3, handoff: 2 },
    verse: {
      joined: "with Chuck the Cuck just watching,",
      beaten: "sent Chuck the Cuck home to watch,",
      ahead: "while Chuck the Cuck just watched,",
    },
  },
  {
    title: "Chuck the Cuck",
    rules:
      "Chuck the Cuck is your squire now. Drawer, stare someone down as him. First to look away drinks 2.",
    back: [
      "Chuck Is Back",
      "Chuck the Cuck is back with a notebook. Drawer, stare someone down as him. Look away first: drink 2.",
    ],
  },
  { takes: 1 },
  [
    [
      "just-watches",
      "Chuck Just Watches",
      "Chuck the Cuck pulls up a chair to watch you work. Roll d20 to make him leave.",
      vs(
        "He stays. He's breathing loudly. Drink 3.",
        "He leaves, slowly, still watching. Give 3.",
      ),
    ],
    [
      "holds-your-ale",
      "Chuck Holds Your Ale",
      "Chuck the Cuck 'holds' your drink. It's half gone. Roll d20 to get it back.",
      vs(
        "Finish what he left you. Drink 3.",
        "You take yours back, and his. Give 3.",
      ),
    ],
    [
      "cheering",
      "Chuck's Cheering",
      "Chuck the Cuck cheers for the monster. Loudly. Roll d20 to shut him up.",
      vs("He gets louder. Drink 3.", "He switches sides, to you. Give 3."),
    ],
    [
      "takes-notes",
      "Chuck Takes Notes",
      "Chuck the Cuck writes down everything you do 'for later'. Roll d20 for the notebook.",
      vs(
        "He reads one out. Drink 3.",
        "You read his. It's all about you. Give 3.",
      ),
    ],
  ],
  {
    title: "Chuck Begs to Serve",
    rules:
      "Chuck the Cuck, on his knees, begs to serve you. He'll just watch. Take him and flip a coin.",
    offers: [
      {
        label: "Take him · drink 2",
        recruit: true,
        coinJoin: true,
        deed: "rival-joined",
      },
      { label: "Duel him", deed: "rival-refused" },
    ],
    ally: {
      name: "Chuck the Cuck",
      calling: ["any"],
      // Heads (Rivals Phase 3): +4 (the plan's +5 had joined runs winning
      // over 45%: the table always takes him).
      bonus: 4,
      coin: true,
      leavesAt: 2,
      ritual:
        "The drawer stares someone down as Chuck. First to look away drinks 1.",
    },
  },
  {
    title: "Chuck Stops Watching",
    rules:
      "Chuck the Cuck finally picks up a sword. Yours. Duel him at the door. Roll d20.",
    fight: vs(
      "He's actually good at this. Drink 4.",
      "He drops it and goes back to watching. Give 4.",
    ),
    prize: ["Chuck's Notebook", { heal: 1 }],
  },
);

/** Gary Shitwhistle (Rivals Phase 3): the king's auditor. Everything he
 * takes comes with a receipt; he invoices, squats in your bed at the inn,
 * and never joins. Settle his debt in drinks at the door, or be audited. */
const gary = rival(
  "gary",
  {
    name: "Gary Shitwhistle",
    ritual:
      "When Gary Shitwhistle shows up, he blows his whistle. Everyone freezes; first to move drinks 1.",
    lines: {
      took: "Gary Shitwhistle confiscates your {item}. You'll get a receipt.",
      back: "Gary returns your {item}, with a receipt for the return.",
      lostTo: "Gary Shitwhistle stamps something. It says 'DENIED'.",
      beaten:
        "Gary Shitwhistle files a complaint. Against you. It takes weeks.",
      ambush:
        "Gary Shitwhistle steps out with a clipboard. 'A moment of your time.'",
      invoice: "Gary Shitwhistle presents an invoice. Pay a heart or an item.",
      squat: "Gary is in your bed. 'Audit,' he says. Rest heals 1 less.",
    },
    style: { invoice: 6, squat: 2, ambush: 2 },
    verse: {
      beaten: "audited the auditor, Gary Shitwhistle,",
      ahead: "owing Gary Shitwhistle a fortune,",
    },
  },
  {
    title: "Gary Shitwhistle",
    rules:
      "Gary Shitwhistle, Royal Auditor, fines you an item. He blows his whistle; first to move drinks 2.",
    back: [
      "Gary's Follow-Up",
      "Gary Shitwhistle is back. Your file is thicker. He fines you two items. First to move drinks 2.",
    ],
  },
  { takes: 1, damage: 1 },
  [
    [
      "receipts-please",
      "Receipts, Please",
      "Gary Shitwhistle wants receipts for every drink tonight. Roll d20 to produce them.",
      vs(
        "You have none. Drink 3.",
        "You hand him a fistful of napkins. Give 3.",
      ),
    ],
    [
      "whistle",
      "The Whistle",
      "Gary Shitwhistle blows his whistle at your stance. Roll d20 to stand legally.",
      vs(
        "Illegal stance. Drink 3.",
        "He checks the rulebook. You're fine. Give 3.",
      ),
    ],
    [
      "form-27-b",
      "Form 27-B",
      "Gary Shitwhistle needs form 27-B in triplicate. Everyone signs a napkin. Roll d20.",
      vs("Wrong napkin. Drink 3.", "Stamped and approved. Give 3."),
    ],
    [
      "back-taxes",
      "Back Taxes",
      "Gary Shitwhistle has calculated your back taxes. Roll d20 to dispute them.",
      vs("Plus interest. Drink 3.", "He forgot to carry the one. Give 3."),
    ],
  ],
  {
    title: "Settle the Debt",
    rules:
      "Gary Shitwhistle tallies your debt at the door. It's itemised. Pay in drinks, or refuse.",
    offers: [
      { label: "Pay up", settle: true, deed: "rival-settled" },
      { label: "Refuse", deed: "rival-refused" },
    ],
  },
  {
    title: "The Audit",
    rules:
      "Gary Shitwhistle opens a full audit at the door. Three rounds. Roll d20.",
    fight: vs("He finds something. Drink 4.", "You find his expenses. Give 4."),
    prize: ["Gary's Whistle", { hush: true }],
    prizeRules: "Once a region, blow it to call off your rival.",
    hits: 3,
  },
);

/** Her two curses, laid by a lost meeting or when she cuts in to curse. */
const BACKING_VOCALS: Jinx = {
  name: "Backing Vocals",
  rule: "The cursed player hums after every drink. Forgets: drink 1.",
};
const RHYME_TIME: Jinx = {
  name: "Rhyme Time",
  rule: "The cursed player speaks only in rhyme. Slips: drink 1.",
};

/** Dame Queefington (Rivals Phase 3): the rival bard, on the wind
 * instrument nobody asked for. She sings your failures and lays curses in
 * song; a lost meeting costs a heart and lays her curse. */
const queef = rival(
  "queef",
  {
    name: "Dame Queefington",
    ritual:
      "When Dame Queefington plays, everyone hums along. Anyone who laughs drinks 1.",
    lines: {
      took: "Dame Queefington takes your {item} as payment for the song.",
      back: "Dame Queefington tosses back your {item}. 'Encore.'",
      lostTo: "Dame Queefington adds a verse about that. It rhymes.",
      beaten: "Dame Queefington hits a bum note and storms off.",
      curse:
        "Dame Queefington writes a song about you. It's catchy. You're cursed.",
      snipe: "Dame Queefington sings for whatever this gives. It's hers now.",
      meddle:
        "Dame Queefington plays during your swing. Roll twice, keep the worse.",
      turned:
        "Dame Queefington sings for the dragon now. Everyone who voted yes drinks 3.",
    },
    style: { curse: 5, snipe: 2, meddle: 2 },
    betray: { base: 0.2, perWin: 0.1, does: "song" },
    // Rivals Phase 4: she writes the ballad, kindly or not.
    ballad: {
      kind: {
        lines: [
          "Hear now of heroes, bold and true,",
          "who crossed the realm with swords held high,",
          "with Dame Queefington to light the way,",
          "and every foe they met, they slew,",
        ],
        won: "and slew the dragon. Bravo. Encore.",
        lost: "and fell, but oh, how well they fell.",
      },
      vicious: {
        lines: [
          "Here's a song of fools who tried,",
          "who tripped through every dungeon door,",
          "who wouldn't hire a better bard,",
          "and blamed the dice for all of it,",
        ],
        won: "and won, somehow. Nobody knows how.",
        lost: "and died. The end. Applause, please.",
      },
      sign: "signed, Dame Queefington",
    },
    verse: {
      joined: "sung well by Dame Queefington,",
      beaten: "silenced Dame Queefington's lute,",
      ahead: "to Dame Queefington's mocking tune,",
    },
  },
  {
    title: "Dame Queefington",
    rules:
      "Dame Queefington has a song about your last fight. It rhymes 'hero' with 'zero'. Everyone hums.",
    back: [
      "The Sequel",
      "Dame Queefington is back with a sequel about you. It's worse. She takes two. Everyone hums.",
    ],
  },
  { damage: 1 },
  [
    [
      "diss-track",
      "The Diss Track",
      "Dame Queefington drops a diss track about you. Roll d20 to drop one back.",
      vs("It charts. Drink 3.", "Yours goes platinum. Give 3."),
      BACKING_VOCALS,
    ],
    [
      "encore",
      "The Encore",
      "Dame Queefington is doing an encore nobody asked for. Roll d20 to pull the plug.",
      vs("She does two more. Drink 3.", "Silence. Beautiful silence. Give 3."),
      BACKING_VOCALS,
    ],
    [
      "requests",
      "Requests",
      "Dame Queefington takes requests. Yours is 'stop'. Roll d20 to make her.",
      vs("She plays it louder. Drink 3.", "She stops, mid-note. Give 3."),
      RHYME_TIME,
    ],
    [
      "open-mic",
      "The Open Mic",
      "Dame Queefington hands you the lute. Sing for 10 seconds, then roll d20.",
      vs("She critiques it. Drink 3.", "Standing ovation. Give 3."),
      RHYME_TIME,
    ],
  ],
  {
    title: "Your Ballad, Half Done",
    rules:
      "Dame Queefington has your ballad half written. How it ends depends on you. Vote.",
    offers: [
      { label: "Take her", recruit: true, deed: "rival-joined" },
      { label: "Duel her", deed: "rival-refused" },
    ],
    ally: {
      name: "Dame Queefington",
      calling: ["any"],
      bonus: 2,
      ritual: "Everyone hums along whenever she plays.",
    },
  },
  {
    title: "The Final Verse",
    rules:
      "Dame Queefington wants the last verse. Duel her for the pen. Roll d20.",
    fight: vs(
      "She sings your defeat. Drink 4.",
      "You snap her lute string. Give 4.",
    ),
    prize: ["Queefington's Lute", { roll: { monster: 1 } }],
    prizeRules: "Comes with a dragon lore. +1 to every monster fight's d20.",
    lore: true,
  },
);

/** His two curses, laid by a lost meeting or when he cuts in to curse. */
const NO_CAP: Jinx = {
  name: "No Cap",
  rule: "The cursed player ends every sentence with 'no cap'. Slip: drink 1.",
};
const MAIN_CHARACTER: Jinx = {
  name: "Main Character",
  rule: "The cursed player narrates what they do in the third person. Slip: drink 1.",
};

/** Lord Nocap the Mid (2026-11-16, owner: "a Gen Z kid with Gen Z lingo
 * and attitude but in the theme of the game"): a teenage lordling who
 * streams the quest. He films your swings (makes you run them back), rates
 * everything, and posts you; a lost meeting costs a heart and lays his
 * curse. He will collab at the door, and keeps his word: with a betrayal,
 * joining him won less often than a duel lost, which the balance forbids. */
const nocap = rival(
  "nocap",
  {
    name: "Lord Nocap",
    ritual:
      "When Lord Nocap shows up, he rates everyone's aura. On three, point at the lowest; they drink 1.",
    lines: {
      took: "Lord Nocap takes your {item} for content. 'It's giving mine.'",
      back: "Lord Nocap tosses back your {item}. 'Mid anyway, no cap.'",
      lostTo: "'Bro really thought.' Lord Nocap is already editing the clip.",
      beaten: "Lord Nocap says it was staged. His chat says otherwise.",
      redo: "'Nah, run it back. I wasn't recording.' Roll again.",
      meddle: "'Hold up, let me get this angle.' Roll twice, keep the worse.",
      curse: "Lord Nocap posts you. The comments are brutal. You're cursed.",
    },
    style: { redo: 4, curse: 4, meddle: 1 },
    verse: {
      joined: "with Lord Nocap filming every swing,",
      beaten: "left Lord Nocap ratioed in the dirt,",
      ahead: "clipped and posted by Lord Nocap,",
    },
  },
  {
    title: "Lord Nocap the Mid",
    rules:
      "Lord Nocap the Mid is live and grabs an item for content. Everyone poses on three; worst drinks 2.",
    back: [
      "Nocap, Part Two",
      "Lord Nocap is back. His chat remembers you. He takes two. Everyone poses; worst drinks 2.",
    ],
  },
  { damage: 1 },
  [
    [
      "caught-in-4k",
      "Caught in 4K",
      "Lord Nocap is filming your swing for his chat. Roll d20 to not choke on camera.",
      vs(
        "You choked. Two million views. Drink 3.",
        "You ate. He posts it as his. Give 3.",
      ),
      MAIN_CHARACTER,
    ],
    [
      "mid",
      "That's Mid",
      "Lord Nocap calls your sword mid. Defend it like a product review for 10 seconds, then roll d20.",
      vs("Ratioed. Drink 3.", "He lowkey wants one now. Give 3."),
      NO_CAP,
    ],
    [
      "touch-grass",
      "Touch Grass",
      "Lord Nocap says you need to touch grass. Roll d20 to find some first.",
      vs(
        "He touches it first, on stream. Drink 3.",
        "You touch grass. He's shook. Give 3.",
      ),
      MAIN_CHARACTER,
    ],
    [
      "aura-check",
      "Aura Check",
      "Lord Nocap rates your aura out loud. It's negative. Roll d20 to farm some back.",
      vs("Minus a thousand aura. Drink 3.", "Aura restored, no cap. Give 3."),
      NO_CAP,
    ],
  ],
  {
    title: "The Collab",
    rules:
      "Lord Nocap gives it all back for a collab: he films the dragon fight. Not for clout. Vote.",
    offers: [
      { label: "Collab", recruit: true, restore: true, deed: "rival-joined" },
      { label: "Duel him", deed: "rival-refused" },
    ],
    ally: {
      name: "Lord Nocap",
      calling: ["any"],
      bonus: 3,
      ritual: "Whenever he fights, everyone yells 'W' or 'L' after the roll.",
    },
  },
  {
    title: "The Final Stream",
    rules:
      "Lord Nocap goes live to take the dragon off you. Duel him. Roll d20.",
    fight: vs(
      "He clips your loss. Drink 4.",
      "You unplug his stream mid-sentence. Give 4.",
    ),
    prize: ["Nocap's Ring Light", { roll: { elite: 1 } }],
  },
);

export const rivals: Rival[] = [
  chad,
  fingerbang,
  sensei,
  chuck,
  gary,
  queef,
  nocap,
];

/** Rivals Phase 4: Sensei beaten twice (the deed `rival-won-twice`) is pinned
 * under the dragon's claw at the door instead of setting his exam. Saved
 * (a heart), he joins for one swing at the dragon, then dies. */
export const senseiPinned: CardDefinition = {
  ...card(
    "rival-sensei-pinned",
    "Pinned!",
    "group",
    "Sensei Saggynuts, pinned under a claw: 'I was wrong about you.' Save him, or leave him.",
  ),
  ribbon: "The Lair's Door · Rival",
  ribbonTone: "crimson",
  encounter: "shrine",
  offers: [
    { label: "Save him", cost: 1, recruit: true, deed: "rival-saved" },
    { label: "Leave him", deed: "rival-abandoned" },
  ],
  ally: {
    name: "Sensei Saggynuts",
    calling: ["boss"],
    bonus: 4,
    once: true,
    ritual: "Everyone bows when Sensei swings.",
  },
  rival: { who: "sensei" },
};
export const rivalIntros = rivals.map((r) => r.intro);
export const rivalBacks = rivals.map((r) => r.back);
export const rivalFights = rivals.flatMap((r) => r.fights);
export const rivalPleas = [...rivals.map((r) => r.plea), senseiPinned];
export const rivalDuels = rivals.map((r) => r.duel);
export const rivalCards: CardDefinition[] = [
  ...rivalIntros,
  ...rivalBacks,
  ...rivalFights,
  ...rivalPleas,
  ...rivalDuels,
];
