import type {
  CardDefinition,
  Curse,
  DiceDefinition,
  DiceOutcome,
  Loot,
  PackDefinition,
} from "../game/types";
import { cardFactory, choice, rollTable } from "./author";

// Dungeon night: the bar has a cellar, and the cellar goes down forever.
// Written for the owner on 2026-10-15 ("very flavorful", "actually difficult,
// and failable"; inspired by Heroes of Barcadia's drink-as-damage fights, with
// original text). In the plain modes the monsters, trials, traps and bosses
// play as ordinary cards. Pub Crawl deals them as a run: three floors of
// rooms, each closed by a boss, while the table shares 12 hearts. A lost
// fight costs the drawer a drink and the party hearts (`damage`, shown on the
// card in Pub Crawl only, so no rule mentions hearts); at zero the party
// wipes and everyone finishes their drink. Treasure, shrines and cursed
// relics are Pub Crawl only. Difficulty is tuned with `tests/dungeon.test.ts`,
// which plays thousands of seeded runs through the real engine.
const card = cardFactory("dungeon");

type Floor = 0 | 1 | 2;
const FLOORS = ["Cellar", "Catacombs", "Taproom"] as const;
/** The d20 a room monster needs, floor by floor. */
const NEED = [6, 8, 10] as const;
/** The d20 a trap's save needs. */
const SAVE = [8, 10, 12] as const;
/** Hearts a lost room fight costs. */
const HURT = [1, 2, 2] as const;
/** A boss's target and the hearts a missed swing costs. */
const BOSS_NEED = [8, 9, 10] as const;
const BOSS_HURT = [2, 2, 2] as const;

/** A d20 table: below `need` loses, `need` and up wins. A `crit` replaces
 * the win on a natural 20, a `fumble` the loss on a natural 1. */
function d20(
  need: number,
  lose: string,
  win: string,
  extra: { crit?: string; fumble?: string } = {},
): DiceDefinition {
  const outcomes: DiceOutcome[] = [];
  const low = extra.fumble ? 2 : 1;
  if (extra.fumble)
    outcomes.push({ min: 1, max: 1, instruction: extra.fumble });
  outcomes.push({ min: low, max: need - 1, instruction: lose });
  outcomes.push({
    min: need,
    max: extra.crit ? 19 : 20,
    instruction: win,
    win: true,
  });
  if (extra.crit)
    outcomes.push({ min: 20, max: 20, instruction: extra.crit, win: true });
  return rollTable(1, 20, outcomes);
}

const room = (
  floor: Floor,
  kind: string,
  id: string,
  title: string,
  rules: string,
  dice?: DiceDefinition,
): CardDefinition => ({
  ...card(id, title, "challenge", rules, dice),
  ribbon: `${FLOORS[floor]} · ${kind}`,
});

/** A room monster: a d20 fight at the floor's target. */
const monster = (
  floor: Floor,
  id: string,
  title: string,
  rules: string,
  lose: string,
  win: string,
  more: {
    crit?: string;
    fumble?: string;
    dice?: DiceDefinition;
    loot?: Loot;
    curse?: Curse;
  } = {},
): CardDefinition => ({
  ...room(
    floor,
    "Monster",
    id,
    title,
    rules,
    more.dice ?? d20(NEED[floor], lose, win, more),
  ),
  battle: true,
  damage: HURT[floor],
  ...(more.loot ? { reward: { loot: more.loot } } : {}),
  ...(more.curse ? { curse: more.curse } : {}),
});

/** A trial: no dice; the table calls Won or Lost. */
const trial = (
  floor: Floor,
  id: string,
  title: string,
  rules: string,
): CardDefinition => ({
  ...room(floor, "Trial", id, title, rules),
  battle: true,
  damage: HURT[floor],
});

/** A trap: a d20 save at the floor's target; it only ever costs one heart. */
const trap = (
  floor: Floor,
  id: string,
  title: string,
  rules: string,
  lose: string,
  win: string,
): CardDefinition => ({
  ...room(floor, "Trap", id, title, rules, d20(SAVE[floor], lose, win)),
  battle: true,
  damage: 1,
});

/** A relic or a chest: walk away, or roll for what's inside. */
const relic = (
  floor: Floor,
  id: string,
  title: string,
  rules: string,
  need: number,
  lose: string,
  win: string,
  labels: [string, string],
  stakes: { loot: Loot; curse?: Curse },
): CardDefinition => ({
  ...room(
    floor,
    "Relic",
    id,
    title,
    rules,
    choice(d20(need, lose, win), ...labels),
  ),
  ribbonTone: "violet",
  battle: true,
  damage: 1,
  reward: { loot: stakes.loot },
  ...(stakes.curse ? { curse: stakes.curse } : {}),
});

const treasure = (
  floor: Floor,
  id: string,
  title: string,
  rules: string,
  loot: Loot,
): CardDefinition => ({
  ...card(id, title, "sip", rules),
  ribbon: `${FLOORS[floor]} · Treasure`,
  ribbonTone: "violet",
  reward: { loot },
});

const shrine = (
  floor: Floor,
  id: string,
  title: string,
  rules: string,
): CardDefinition => ({
  ...card(id, title, "group", rules),
  ribbon: `${FLOORS[floor]} · Shrine`,
  ribbonTone: "pearl",
  reward: { heal: 2 },
});

/** A boss: dealt again, to the next drawer, until it has been beaten
 * `hits` times. */
const boss = (
  floor: Floor,
  id: string,
  title: string,
  rules: string,
  dice: DiceDefinition,
): CardDefinition => ({
  ...card(id, title, "challenge", rules, dice),
  ribbon: floor === 2 ? "Last Call · Boss" : `${FLOORS[floor]} · Boss`,
  ribbonTone: "crimson",
  battle: true,
  hits: floor + 1,
  damage: BOSS_HURT[floor],
});

// --- Floor 1: the Cellar ------------------------------------------------------
// Kegs, rats, forty years of spilled lager. Monsters fall on a 7.

const cellarFights: CardDefinition[] = [
  monster(
    0,
    "gelatinous-shot",
    "Gelatinous Shot",
    "A wobbling cube of jello shots. Something's floating in it. A tooth? Roll d20.",
    "It engulfs you. Drink 3.",
    "You eat your way out. Give 3.",
    { crit: "You eat the whole thing. Give 6." },
  ),
  monster(
    0,
    "rat-trench-coat",
    "Rats in a Coat",
    "Nine rats in a trench coat are trying to order a drink. Card them. Roll d20.",
    "They swarm your ankles. Drink 3.",
    "Bounced. Give 3.",
  ),
  monster(
    0,
    "mold-elemental",
    "Mold Elemental",
    "The thing growing behind the ice machine has feelings and a mouth. Roll d20.",
    "You breathe it in. Drink 3.",
    "Bleach. So much bleach. Give 3.",
    { fumble: "It moves into your lungs. Drink 5." },
  ),
  monster(
    0,
    "drunk-goblin",
    "Drunk Goblin",
    "A goblin who's had nine. He wants to fight you, then hug you. Roll d20.",
    "He wins both. Drink 3.",
    "He passes out on you. Loot his pockets. Give 2.",
    { loot: "smoke" },
  ),
  monster(
    0,
    "skeleton-barback",
    "Skeleton Barback",
    "He's been restocking limes since 1974. Ask for a fresh one and roll d20.",
    "He throws one at your eye. Drink 3.",
    "He finds one. It's perfect. Give 3.",
  ),
  monster(
    0,
    "possessed-mop",
    "Possessed Mop",
    "The mop is moving on its own and it's coming for your shoes. Roll d20.",
    "Mopped. Drink 3.",
    "You snap the handle. Give 3.",
  ),
  monster(
    0,
    "keg-spider",
    "Keg Spider",
    "Eight legs, eight beers, zero manners. Roll d20.",
    "Bitten. Drink 3.",
    "Squished. Give 3.",
    { crit: "Squished, and its web was full of coasters. Give 5." },
  ),
  monster(
    0,
    "tab-goblin",
    "Tab Goblin",
    "It's been putting drinks on your tab since 2019. Roll d20.",
    "It collects. Drink 4.",
    "You stiff it. Give 3.",
  ),
  trial(
    0,
    "clipboard-troll",
    "Clipboard Troll",
    "You're not on the list. Walk heel to toe across the room and back. Wobble: drink 3.",
  ),
  trial(
    0,
    "riddling-tap",
    "The Riddling Tap",
    "A tap with a face. Your left neighbor asks a riddle: 10 seconds, or drink 3.",
  ),
  trial(
    0,
    "stuck-door",
    "The Stuck Door",
    "Brace it shut with your back: wall-sit for 30 seconds. Stand early: drink 3.",
  ),
  trap(
    0,
    "sticky-floor",
    "Sticky Floor",
    "Your shoes are glued to forty years of spilled lager. Roll d20 to pull free.",
    "You leave a shoe behind. Drink 2.",
    "You peel free. Give 2.",
  ),
  trap(
    0,
    "christmas-lights",
    "Tripwire",
    "Someone strung Christmas lights across the stairs at shin height. Roll d20.",
    "You eat the stairs. Drink 2.",
    "You hop it. Give 2.",
  ),
  trap(
    0,
    "rolling-kegs",
    "Rolling Kegs",
    "The keg rack groans. Then it lets go. Roll d20 to dive.",
    "Flattened. Drink 3.",
    "You dive clear. Give 2.",
  ),
];

const cellarFinds: CardDefinition[] = [
  relic(
    0,
    "mimic-cooler",
    "Mimic Cooler",
    "A cooler in the corner is humming to itself. Open it, or walk away.",
    11,
    "It bites. Drink 4.",
    "Cold ones, and something useful. Give 3.",
    ["Walk away", "Open it"],
    { loot: "draught" },
  ),
  treasure(
    0,
    "lost-and-found",
    "Lost and Found",
    "Everything anyone lost down here, plus a coaster that looks bulletproof. Drink 1.",
    "shield",
  ),
  shrine(
    0,
    "wishing-drain",
    "Wishing Drain",
    "A floor drain full of coins and one fry. Toss something in. Everyone toasts the drain.",
  ),
];

const cellarBosses: CardDefinition[] = [
  boss(
    0,
    "keg-golem",
    "Keg Golem",
    "It's 800 pounds of lager and it's been tapped. Everyone drinks 1, then you roll d20.",
    d20(
      BOSS_NEED[0],
      "It sits on you. Drink 4.",
      "You pull its plug. Give 5.",
      {
        crit: "You drink it dry. Everyone else drinks 3.",
      },
    ),
  ),
  boss(
    0,
    "rat-king",
    "The Rat King",
    "Forty rats in one crown, holding court in the grease trap. Bow, then roll d20.",
    d20(
      BOSS_NEED[0],
      "The court finds you guilty. Drink 4.",
      "You dethrone him. Give 5.",
      {
        fumble: "The court finds you delicious. Finish your drink.",
      },
    ),
  ),
];

// --- Floor 2: the Catacombs ---------------------------------------------------
// Bones, regrets, and a bachelor party that never left. Monsters fall on a 9.

const catacombFights: CardDefinition[] = [
  monster(
    1,
    "bachelor-ghosts",
    "Bachelor Ghosts",
    "The ghosts of a 1998 bachelor party want one more round. Roll d20.",
    "You're in the round. Drink 4.",
    "You exorcise them with karaoke. Give 4.",
  ),
  monster(
    1,
    "ex-wraith",
    "The Ex Wraith",
    "A wraith with your ex's face reads your old texts aloud, with feeling. Roll d20.",
    "Every word lands. Drink 4.",
    "You read theirs back. Give 4.",
    { fumble: "It reads the drafts. Finish your drink." },
  ),
  monster(
    1,
    "bone-sommelier",
    "Bone Sommelier",
    "A skeleton swirls a glass, sniffs yours, and calls it cute. Roll d20.",
    "Shamed. Drink 4.",
    "You pour his on the floor. Give 4.",
  ),
  monster(
    1,
    "leech-swarm",
    "Leech Swarm",
    "Leeches that drink blood and, apparently, Fireball. Roll d20.",
    "They latch on and won't let go. Drink 3.",
    "You salt them. Give 4.",
    { curse: "bleed" },
  ),
  monster(
    1,
    "hex-witch",
    "Hex Witch",
    "A witch who reads tarot and your browser history. Roll d20.",
    "Hexed. Drink 3.",
    "You flip her table. Give 4.",
    { curse: "hex" },
  ),
  monster(
    1,
    "vampire-bro",
    "Vampire Bro",
    "A vampire in a backwards cap who only drinks from frat boys. Roll d20.",
    "He makes an exception. Drink 4.",
    "Garlic knots to the face. He drops something. Give 3.",
    { loot: "die" },
  ),
  monster(
    1,
    "crypt-crawler",
    "Crypt Crawler",
    "Something with a hundred legs and one beer gut. Roll 2d6.",
    "",
    "",
    {
      dice: rollTable(2, 6, [
        { min: 2, max: 6, instruction: "It crawls up your shirt. Drink 4." },
        {
          min: 7,
          max: 12,
          instruction: "You stomp it flat. Give 4.",
          win: true,
        },
      ]),
    },
  ),
  monster(
    1,
    "hungover-mummy",
    "Hungover Mummy",
    "A mummy wrapped in bar napkins, hungover for three thousand years. Roll d20.",
    "It throws up sand on you. Drink 4.",
    "You hand it a Gatorade. It weeps. Give 4.",
  ),
  trial(
    1,
    "tomb-of-silence",
    "Tomb of Silence",
    "No laughing in the tomb. The table gets 30 seconds to crack you. Laugh: drink 4.",
  ),
  trial(
    1,
    "bone-tower",
    "The Bone Tower",
    "Stack the empties into a tower that stands for 5 seconds. Collapse: drink 4.",
  ),
  trial(
    1,
    "backwards-chant",
    "Backwards Chant",
    "Wake the dead: say the alphabet from Z to A in 20 seconds. Stumble: drink 4.",
  ),
  trap(
    1,
    "collapsing-floor",
    "Collapsing Floor",
    "The floor gives way under you. Roll d20 to grab the edge.",
    "You fall a whole floor. Drink 3.",
    "You hang on. Give 2.",
  ),
  trap(
    1,
    "dart-wall",
    "Dart Wall",
    "Little holes in both walls. Then a click. Roll d20.",
    "Darted, in the ass. Drink 3.",
    "You limbo under them. Give 2.",
  ),
  trap(
    1,
    "fog-of-regret",
    "Fog of Regret",
    "A green fog that smells like the tequila from your 21st. Roll d20.",
    "Flashbacks. Drink 3.",
    "You hold your breath. Give 2.",
  ),
];

const catacombFinds: CardDefinition[] = [
  relic(
    1,
    "cursed-idol",
    "Cursed Idol",
    "A gold idol on a plinth. Nothing bad could possibly happen. Grab it, or leave it.",
    12,
    "The plinth bleeds. So do you. Drink 3.",
    "Real gold, and something rattling inside. Give 4.",
    ["Leave it", "Grab it"],
    { loot: "die", curse: "bleed" },
  ),
  treasure(
    1,
    "bone-pile",
    "The Bone Pile",
    "Under the bones: a smoke bomb and a stranger's fake ID. Keep both. Drink 1.",
    "smoke",
  ),
  shrine(
    1,
    "candlelit-alcove",
    "Candlelit Alcove",
    "Someone left candles and a case of water down here. Everyone drinks water. Yes, really.",
  ),
];

const catacombBosses: CardDefinition[] = [
  boss(
    1,
    "hangover-hydra",
    "Hangover Hydra",
    "Every head you cut off grows back with a headache. Roll d20.",
    d20(
      BOSS_NEED[1],
      "It breathes regret. Drink 5.",
      "A head comes off. Give 4.",
      {
        crit: "Clean through the neck. Everyone else drinks 3.",
      },
    ),
  ),
  boss(
    1,
    "the-bouncer",
    "The Bouncer",
    "Seven feet of door guy in a tight black tee. Nobody gets past him. Roll d20.",
    d20(
      BOSS_NEED[1],
      "He throws you down the stairs. Drink 5.",
      "You get past one arm. Give 4.",
      {
        fumble: "He throws you out. Finish your drink.",
      },
    ),
  ),
];

// --- Floor 3: the Drowned Taproom ---------------------------------------------
// The taps never stopped running and the room filled up. Monsters fall on 11.

const taproomFights: CardDefinition[] = [
  monster(
    2,
    "sommelier-kraken",
    "Sommelier Kraken",
    "Eight arms, eight wine glasses, and every one of them is yours. Roll d20.",
    "Squeezed. Drink 5.",
    "Calamari. Give 5.",
  ),
  monster(
    2,
    "last-orders-siren",
    "Last Orders Siren",
    "A siren sings one more drink, and it's beautiful. Roll d20 to resist.",
    "You swim to her. Finish half your drink.",
    "You stuff your ears with limes. Give 5.",
  ),
  monster(
    2,
    "drowned-regular",
    "The Drowned Regular",
    "He's been at the bottom of the bar since 1987 and you're on his stool. Roll d20.",
    "He takes it back. Drink 5.",
    "You buy him one. He fades away. Give 5.",
  ),
  monster(
    2,
    "foam-leviathan",
    "Foam Leviathan",
    "A head of foam the size of a city bus rises out of the taps. Roll d20.",
    "It washes over you. Drink 5.",
    "You blow the head off. Give 5.",
  ),
  monster(
    2,
    "piranha-shots",
    "Piranha Shots",
    "A school of piranhas lives in the shot glasses. Roll 3d6.",
    "",
    "",
    {
      dice: rollTable(3, 6, [
        { min: 3, max: 10, instruction: "They bite back. Drink 5." },
        {
          min: 11,
          max: 18,
          instruction: "You drink them first. Give 5.",
          win: true,
        },
      ]),
    },
  ),
  monster(
    2,
    "merfolk-ex",
    "Your Merfolk Ex",
    "Your ex is a merfolk now and says they're doing amazing without you. Roll d20.",
    "They are. Drink 4.",
    "You're doing amazing too. Give 5.",
    { curse: "bleed" },
  ),
  monster(
    2,
    "text-them-eel",
    "The Text-Them Eel",
    "An eel slides up and whispers: text them. Roll d20.",
    "You text them. Drink 4.",
    "You bite the eel first. Give 5.",
    { curse: "hex" },
  ),
  monster(
    2,
    "tap-mimic",
    "Tap Mimic",
    "One of the taps is breathing. Roll d20.",
    "It pours itself into you. Drink 5.",
    "You yank it out by the handle. Give 4.",
    { loot: "draught" },
  ),
  trial(
    2,
    "drowned-choir",
    "The Drowned Choir",
    "Hum a song until the table names it. 20 seconds. Nobody gets it: drink 5.",
  ),
  trial(
    2,
    "rising-water",
    "Rising Water",
    "The water's at your chin. Hold your breath for 30 seconds. Breathe early: drink 5.",
  ),
  trial(
    2,
    "last-round",
    "The Last Round",
    "Carry every drink here across the room and back. Spill a drop: drink 5.",
  ),
  trap(
    2,
    "rip-current",
    "Rip Current",
    "The floor is a river now. Roll d20 to swim for it.",
    "Swept away. Drink 4.",
    "You ride it out. Give 3.",
  ),
  trap(
    2,
    "barnacle-stool",
    "Barnacle Stool",
    "You sat down. Now you can't stand up. Roll d20.",
    "Fused to it. Drink 4.",
    "You rip free, mostly. Give 3.",
  ),
  trap(
    2,
    "undertow-tap",
    "Undertow Tap",
    "You lean in for a pour and the tap pulls you under. Roll d20.",
    "Swallowed. Drink 4.",
    "You kick off the bar. Give 3.",
  ),
];

const taproomFinds: CardDefinition[] = [
  relic(
    2,
    "sunken-chest",
    "Sunken Chest",
    "A chest under the bar, chained shut, still dry inside. Pry it open, or leave it.",
    13,
    "Eels. Drink 5.",
    "Bone dry, and worth it. Give 5.",
    ["Leave it", "Pry it open"],
    { loot: "shield" },
  ),
  treasure(
    2,
    "message-bottle",
    "Message in a Bottle",
    "It says drink me. Of course it does. Drink 1, and keep the bottle.",
    "draught",
  ),
  shrine(
    2,
    "air-pocket",
    "The Air Pocket",
    "A pocket of air and a jukebox that still works. Everyone sings a chorus, any chorus.",
  ),
];

const lastCallBosses: CardDefinition[] = [
  boss(
    2,
    "last-call-lich",
    "The Last Call Lich",
    "Lights up. Music off. It's last call forever unless you kill it. Roll d20.",
    d20(
      BOSS_NEED[2],
      "Closing time. Everyone drinks 4.",
      "It flickers. Give 5.",
      {
        crit: "The music comes back on. Everyone else drinks 4.",
      },
    ),
  ),
  boss(
    2,
    "bartender-below",
    "The Bartender Below",
    "It knows your usual. It knows what you did. Roll d20.",
    d20(
      BOSS_NEED[2],
      "It cuts you off. Drink 6.",
      "You tip it. It staggers. Give 5.",
      {
        crit: "You rob the tip jar. Everyone else drinks 4.",
      },
    ),
  ),
];

/** Rooms play as ordinary cards in the plain modes; finds only in a crawl. */
const deck = [
  ...cellarFights,
  ...cellarBosses,
  ...catacombFights,
  ...catacombBosses,
  ...taproomFights,
  ...lastCallBosses,
];

export const dungeonCards: CardDefinition[] = [
  ...deck,
  ...cellarFinds,
  ...catacombFinds,
  ...taproomFinds,
];

const ids = (cards: CardDefinition[]) => cards.map((c) => c.id);

export const dungeonPack: PackDefinition = {
  version: 1,
  id: "dungeon",
  logo: "art/packs/dungeon.svg",
  title: "Dungeon night",
  description:
    "The bar has a cellar, and the cellar goes down forever. Monsters, traps and bosses, with drinks for damage.",
  cardIds: ids(deck),
  quest: {
    mode: "Pub Crawl",
    summary: "Survive 3 floors",
    label: "Hearts",
    mark: "art/packs/pub-crawl.svg",
    goal: 0,
    length: 1,
    cardIds: [],
    party: { hearts: 12 },
    // Seven rooms a floor, then its boss: the floor's pool, with its finds.
    finale: [
      {
        label: "The Cellar",
        intro: "Down into the Cellar",
        pick: 7,
        cardIds: ids([...cellarFights, ...cellarFinds]),
      },
      {
        label: "Cellar boss",
        intro: "Something blocks the stairs",
        pick: 1,
        cardIds: ids(cellarBosses),
      },
      {
        label: "The Catacombs",
        intro: "Down into the Catacombs",
        pick: 7,
        cardIds: ids([...catacombFights, ...catacombFinds]),
      },
      {
        label: "Catacombs boss",
        intro: "The bones stand up",
        pick: 1,
        cardIds: ids(catacombBosses),
      },
      {
        label: "The Drowned Taproom",
        intro: "The Drowned Taproom",
        pick: 7,
        cardIds: ids([...taproomFights, ...taproomFinds]),
      },
      {
        label: "Last call",
        intro: "Last call",
        pick: 1,
        cardIds: ids(lastCallBosses),
      },
    ],
  },
};
