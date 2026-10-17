import type {
  CardDefinition,
  Curse,
  DiceDefinition,
  DiceOutcome,
  Encounter,
  Loot,
  Offer,
  OmenEffect,
  PackDefinition,
} from "../game/types";
import { cardFactory, choice, rollTable } from "./author";
import { withNaturals } from "./naturals";

// Dungeon night: the bar has a cellar, and the cellar goes down forever.
// Written for the owner on 2026-10-15 ("very flavorful", "actually difficult,
// and failable"; inspired by Heroes of Barcadia's drink-as-damage fights, with
// original text). In the plain modes the monsters, trials, traps and bosses
// play as ordinary cards. Pub Crawl deals them as a run: three floors of
// rooms, each closed by a boss, while the table shares 12 hearts. A lost
// fight costs the drawer a drink and the party hearts (`damage`, shown on the
// card in Pub Crawl only, so no deck card's rule mentions hearts); at zero
// the party wipes and everyone finishes their drink. Treasure, shrines,
// cursed relics, merchants, forks and omens are Pub Crawl only.
//
// Replayability (2026-10-15, owner request "more replayability without the
// same experience"): each run opens on one of a dozen omens, and each depth
// is one of two floors (Cellar or Wine Cellar, Catacombs or Sewers, Drowned
// Taproom or Kitchen) before Last Call. Difficulty is tuned with
// `tests/dungeon.test.ts`, which plays thousands of seeded runs through the
// real engine.
// Ribbon colours, one meaning each: gold for a fight, violet for anything
// found or chosen (treasure, relics, shrines, merchants, forks), crimson for
// a boss, pearl for tonight's omen alone.
const card = cardFactory("dungeon");

/** A floor: its ribbon name and its depth (0 to 2), which sets the odds. */
type Floor = 0 | 1 | 2 | 3 | 4 | 5;
const FLOORS = [
  "Cellar",
  "Catacombs",
  "Taproom",
  "Wine Cellar",
  "Sewers",
  "Kitchen",
] as const;
const tier = (floor: Floor) => (floor % 3) as 0 | 1 | 2;
/** The d20 a room monster needs, floor by floor. */
const NEED = [6, 8, 10] as const;
/** The d20 a trap's save needs. */
const SAVE = [8, 10, 12] as const;
/** Hearts a lost room fight costs. */
const HURT = [1, 2, 2] as const;
/** A boss's target and the hearts a missed swing costs. */
const BOSS_NEED = [8, 10, 11] as const;
const BOSS_HURT = [2, 2, 2] as const;
/** An elite: three harder than the floor, a heart dearer, always loot. */
const ELITE_NEED = [9, 11, 13] as const;
const ELITE_HURT = [2, 3, 3] as const;
/** An ambush is beaten twice, each loss a little cheaper than a room's. */
const AMBUSH_HURT = [1, 1, 2] as const;

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
  encounter: kind.toLowerCase() as Encounter,
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
    more.dice ?? d20(NEED[tier(floor)], lose, win, more),
  ),
  battle: true,
  damage: HURT[tier(floor)],
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
  damage: HURT[tier(floor)],
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
  ...room(floor, "Trap", id, title, rules, d20(SAVE[tier(floor)], lose, win)),
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
  encounter: "treasure",
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
  ribbonTone: "violet",
  encounter: "shrine",
  reward: { heal: 2 },
});

/** A boss: dealt again, to the next drawer, until it has been beaten
 * `hits` times. Last Call's bosses close both third floors. A boss's curse
 * lands on a missed swing and lifts when it falls. */
const boss = (
  floor: Floor,
  id: string,
  title: string,
  rules: string,
  dice: DiceDefinition,
  curse?: Curse,
): CardDefinition => ({
  ...card(id, title, "challenge", rules, dice),
  ribbon: tier(floor) === 2 ? "Last Call · Boss" : `${FLOORS[floor]} · Boss`,
  ribbonTone: "crimson",
  encounter: "boss",
  battle: true,
  hits: tier(floor) + 1,
  damage: BOSS_HURT[tier(floor)],
  ...(curse ? { curse } : {}),
});

/** An elite: dealt only behind a fork's loud door in Pub Crawl (and as an
 * ordinary fight in the plain modes). Harder, dearer, and it always pays. */
const elite = (
  floor: Floor,
  id: string,
  title: string,
  rules: string,
  lose: string,
  win: string,
  loot: Loot,
  extra: { crit?: string; fumble?: string } = {},
): CardDefinition => ({
  ...room(
    floor,
    "Elite",
    id,
    title,
    rules,
    d20(ELITE_NEED[tier(floor)], lose, win, extra),
  ),
  battle: true,
  damage: ELITE_HURT[tier(floor)],
  reward: { loot },
});

/** An ambush: more than one of them. In Pub Crawl it is dealt again, like a
 * boss, until it has been beaten twice. */
const ambush = (
  floor: Floor,
  id: string,
  title: string,
  rules: string,
  lose: string,
  win: string,
): CardDefinition => ({
  ...room(floor, "Ambush", id, title, rules, d20(NEED[tier(floor)], lose, win)),
  battle: true,
  hits: 2,
  damage: AMBUSH_HURT[tier(floor)],
});

/** A merchant: wares on plaques, each with its price. */
const merchant = (
  floor: Floor,
  id: string,
  title: string,
  rules: string,
  offers: Offer[],
): CardDefinition => ({
  ...card(id, title, "sip", rules),
  ribbon: `${FLOORS[floor]} · Merchant`,
  ribbonTone: "violet",
  encounter: "merchant",
  offers,
});

/** A fork: the quiet door, or the loud one, which turns the floor's next
 * room into one of its elites. */
const fork = (
  floor: Floor,
  id: string,
  title: string,
  rules: string,
  doors: [string, string] = ["Quiet door", "Loud door"],
): CardDefinition => ({
  ...card(id, title, "group", rules),
  ribbon: `${FLOORS[floor]} · Fork`,
  ribbonTone: "violet",
  encounter: "fork",
  offers: [{ label: doors[0] }, { label: doors[1], elite: true }],
});

/** Tonight's omen, the run's first card: its rule holds all crawl. */
const omen = (
  id: string,
  title: string,
  rules: string,
  effect: OmenEffect = {},
): CardDefinition => ({
  ...card(`omen-${id}`, title, "rule", rules),
  ribbon: "Tonight's omen",
  ribbonTone: "pearl",
  encounter: "omen",
  omen: effect,
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
  ambush(
    0,
    "lost-bridesmaids",
    "Lost Bridesmaids",
    "Two bridesmaids looking for the bathroom found you instead. They want a photo. Roll d20.",
    "You're in forty photos. Drink 2.",
    "You point them upstairs. Give 2.",
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
  treasure(
    0,
    "tip-jar",
    "The Tip Jar",
    "A tip jar lost under the shelves since 2011. A loaded die rattles in the coins. Drink 1.",
    "die",
  ),
  merchant(
    0,
    "rat-fence",
    "Rat Fence",
    "A rat in a tiny vest is selling whatever fell behind the bar. He takes drinks, or blood.",
    [
      { label: "Drink 3", loot: "draught" },
      { label: "Bleed for it", cost: 1, loot: "shield" },
      { label: "Walk on" },
    ],
  ),
  fork(
    0,
    "two-hatches",
    "Two Hatches",
    "Two hatches in the floor. One is quiet. The other is playing Nickelback, loud, on purpose.",
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
  boss(
    0,
    "the-landlord",
    "The Landlord",
    "He wants three months' rent and he's taking it out of your drink. Roll d20.",
    d20(
      BOSS_NEED[0],
      "Late fee. Drink 4.",
      "You find a code violation. Give 5.",
      {
        fumble: "Evicted. Finish your drink.",
      },
    ),
    "hex",
  ),
];

const cellarElites: CardDefinition[] = [
  elite(
    0,
    "grease-trap-horror",
    "Grease Trap Horror",
    "The grease trap has been fed fries for twenty years. Now it's hungry. Roll d20.",
    "It slurps you in. Drink 4.",
    "You seal the lid. Inside: a pizza pan that makes a fine shield. Give 4.",
    "shield",
  ),
  elite(
    0,
    "health-inspector",
    "The Health Inspector",
    "Clipboard, hairnet, no soul. He's here to shut the cellar down. Roll d20.",
    "Violation. Drink 4.",
    "You bribe him with a keg. He leaves his lucky die. Give 4.",
    "die",
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
  ambush(
    1,
    "skeleton-crew",
    "Skeleton Crew",
    "A skeleton bachelorette party wants you to do a shot off a femur. Roll d20.",
    "Off the femur. Drink 3.",
    "You knock their bones loose. Give 3.",
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
  relic(
    1,
    "bone-vending",
    "Bone Vending Machine",
    "A vending machine full of teeth and, at the back, one draught. Shake it, or leave it.",
    12,
    "It tips onto you. Drink 4.",
    "Clunk. Give 3.",
    ["Leave it", "Shake it"],
    { loot: "draught" },
  ),
  merchant(
    1,
    "grave-robber",
    "The Grave Robber",
    "A grave robber with a cart of stolen goods and no questions asked. Prices are firm.",
    [
      { label: "Drink 4", loot: "die" },
      { label: "Finish your drink", loot: "shield" },
      { label: "Walk on" },
    ],
  ),
  fork(
    1,
    "the-split",
    "The Split",
    "The tunnel splits. Left: silence. Right: drums, chanting, and what might be a conga line.",
    ["Left, quiet", "Right, loud"],
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
  boss(
    1,
    "dj-ossuary",
    "DJ Ossuary",
    "A skeleton DJ who only plays the Macarena. Everyone does the Macarena, then you roll d20.",
    d20(
      BOSS_NEED[1],
      "He drops the bass on you. Drink 5.",
      "You yank a cable. Give 4.",
      {
        crit: "You steal the aux. Everyone else drinks 3.",
      },
    ),
  ),
];

const catacombElites: CardDefinition[] = [
  elite(
    1,
    "crypt-keepers-mom",
    "The Crypt Keeper's Mom",
    "She's been waiting up. Do you know what time it is? Roll d20.",
    "Grounded, in a tomb. Drink 5.",
    "You hug her. She packs you a draught for the road. Give 5.",
    "draught",
  ),
  elite(
    1,
    "deaths-intern",
    "Death's Intern",
    "Death's unpaid intern is behind on quota, and you'll do. Roll d20.",
    "Filed. Drink 5.",
    "You fill out his forms wrong. He drops a smoke bomb and runs. Give 5.",
    "smoke",
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
  ambush(
    2,
    "happy-hour-eels",
    "Happy Hour Eels",
    "Two eels in party hats want to buy you a drink. You know what that means. Roll d20.",
    "Bitten, twice. Drink 4.",
    "You tie them in a knot. Give 4.",
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
  shrine(
    2,
    "dry-booth",
    "The Last Dry Booth",
    "One booth the water never reached. Sit. Breathe. Everyone toasts dry socks.",
  ),
  merchant(
    2,
    "pearl-diver",
    "The Pearl Diver",
    "A diver in a rusted helmet trades whatever he finds at the bottom of the bar.",
    [
      { label: "Drink 5", loot: "shield" },
      { label: "Bleed for it", cost: 1, loot: "die" },
      { label: "Walk on" },
    ],
  ),
  fork(
    2,
    "two-taps",
    "Two Taps",
    "Two taps behind the bar. One pours water. The other pours something that screams.",
    ["Water tap", "Screaming tap"],
  ),
];

const taproomElites: CardDefinition[] = [
  elite(
    2,
    "sea-hag",
    "Sea Hag of Table Six",
    "She's run a tab since the flood, and she's settling it on you. Roll d20.",
    "Settled. Drink 6.",
    "She pays you in pearls and a shield. Give 6.",
    "shield",
  ),
  elite(
    2,
    "shark-bartender",
    "Shark Bartender",
    "A shark in a vest, polishing glasses with its teeth, is cutting someone off. Roll d20.",
    "It's you. Drink 6.",
    "You punch it on the nose, like the documentaries said. It coughs up a loaded die. Give 6.",
    "die",
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
  boss(
    2,
    "final-tab",
    "The Final Tab",
    "Every drink you've ever ordered, itemized, four feet long, and it has teeth. Roll d20.",
    d20(BOSS_NEED[2], "Itemized. Drink 5.", "You dispute a charge. Give 5.", {
      crit: "Comped. Everyone else drinks 4.",
    }),
  ),
  boss(
    2,
    "house-lights",
    "The House Lights",
    "The lights come up, and everyone looks like that. Roll d20.",
    d20(
      BOSS_NEED[2],
      "You saw yourself. Drink 6.",
      "You smash a bulb. Give 5.",
      {
        crit: "Darkness again. Everyone else drinks 4.",
      },
    ),
    "hex",
  ),
];

// --- Floor 1, the other way down: the Wine Cellar -----------------------------
// Racks to the ceiling, a hundred years of dust, and something uncorked.
// Monsters fall on a 7.

const wineFights: CardDefinition[] = [
  monster(
    3,
    "boxed-wine-golem",
    "Boxed Wine Golem",
    "A golem made of boxed wine, slapping its own bag. Roll d20.",
    "It slaps you with the bag. Drink 3.",
    "You pop the spout. Give 3.",
    { crit: "You drink the bag dry. Give 6." },
  ),
  monster(
    3,
    "cork-imp",
    "Cork Imp",
    "A tiny imp popping corks at eye level and laughing about it. Roll d20.",
    "Right in the eye. Drink 3.",
    "You cork him. Give 3.",
  ),
  monster(
    3,
    "zombie-sommelier",
    "Zombie Sommelier",
    "Brains? No. He wants to describe the finish. It takes eleven minutes. Roll d20.",
    "Notes of oak. Drink 3.",
    "You spit in his bucket. Give 3.",
  ),
  monster(
    3,
    "wine-mom-banshee",
    "Wine Mom Banshee",
    "She screams that it's five o'clock somewhere, and she means here. Roll d20.",
    "It's five o'clock. Drink 3.",
    "You take her glass away. Give 3.",
    { fumble: "She adopts you. Drink 5." },
  ),
  monster(
    3,
    "rose-slime",
    "Rosé Slime",
    "Pink, sticky, and it says it's not like other slimes. Roll d20.",
    "It's exactly like other slimes. Drink 3.",
    "You pop it. It leaves pink smoke behind. Give 2.",
    { loot: "smoke" },
  ),
  monster(
    3,
    "decanter-ghost",
    "Ghost in the Decanter",
    "It's been breathing for a hundred years. So has the wine. Roll d20.",
    "It breathes on you. Drink 3.",
    "You jam the stopper in. Give 3.",
  ),
  monster(
    3,
    "barrel-mimic",
    "Barrel Mimic",
    "Barrel 14 has teeth. Barrel 15 looks nervous. Roll d20.",
    "Barrel 14 wins. Drink 4.",
    "You tap it. It whimpers. Give 3.",
  ),
  monster(
    3,
    "corkscrew-crab",
    "Corkscrew Crab",
    "A crab with corkscrews for claws, opening anything. Including you. Roll d20.",
    "Uncorked. Drink 3.",
    "You flip it on its back. Give 3.",
    { crit: "You open a bottle with it. Give 5." },
  ),
  ambush(
    3,
    "fruit-fly-swarm",
    "Fruit Fly Swarm",
    "A cloud of fruit flies off the dump bucket, and they brought friends. Roll d20.",
    "In your mouth. Drink 2.",
    "Swatted. Give 2.",
  ),
  trial(
    3,
    "blind-tasting",
    "Blind Tasting",
    "Eyes shut. Your left neighbor hands you someone's drink. Name whose it is. Wrong: drink 3.",
  ),
  trial(
    3,
    "coaster-nose",
    "Coaster on the Nose",
    "Balance a coaster on your nose for 10 seconds. It falls: drink 3.",
  ),
  trial(
    3,
    "swirl-sniff-lie",
    "Swirl, Sniff, Lie",
    "Describe your drink like a sommelier for 15 seconds without laughing. Laugh: drink 3.",
  ),
  trap(
    3,
    "falling-rack",
    "Falling Rack",
    "The wine rack tips, one bottle at a time, like dominoes. Roll d20.",
    "Domino'd. Drink 3.",
    "You catch the last one. Give 2.",
  ),
  trap(
    3,
    "merlot-stairs",
    "Merlot Stairs",
    "The stairs are slick with spilled merlot. Roll d20.",
    "Down on your ass, in red. Drink 2.",
    "Not a drop on you. Give 2.",
  ),
  trap(
    3,
    "sulfite-cloud",
    "Sulfite Cloud",
    "A cracked cask puffs out a cloud of sulfites. Instant headache. Roll d20.",
    "Migraine. Drink 2.",
    "You duck under it. Give 2.",
  ),
];

const wineFinds: CardDefinition[] = [
  relic(
    3,
    "dusty-bottle",
    "The Dusty Bottle",
    "A bottle older than the bar, label in Latin. Uncork it, or leave it.",
    11,
    "Vinegar, with feelings. Drink 4.",
    "Perfect. And a shield in the crate. Give 3.",
    ["Leave it", "Uncork it"],
    { loot: "shield" },
  ),
  treasure(
    3,
    "cellar-masters-coat",
    "Cellar Master's Coat",
    "A coat on a hook with full pockets: a corkscrew and a smoke bomb. Drink 1.",
    "smoke",
  ),
  shrine(
    3,
    "tasting-room",
    "The Tasting Room",
    "Cheese, crackers, and one clean glass. Everyone toasts the cheese.",
  ),
  treasure(
    3,
    "the-magnum",
    "The Magnum",
    "A magnum of something nice behind the racks. Everyone gets a splash; save a swig. Drink 1.",
    "draught",
  ),
  merchant(
    3,
    "cellar-cat",
    "The Cellar Cat",
    "A cat in a sommelier's chain trades mouse-bitten goods. It takes drinks, or blood.",
    [
      { label: "Drink 3", loot: "smoke" },
      { label: "Bleed for it", cost: 1, loot: "shield" },
      { label: "Walk on" },
    ],
  ),
  fork(
    3,
    "red-or-white",
    "Red or White",
    "Two aisles. White is quiet. Red is where the screaming is coming from.",
    ["White aisle", "Red aisle"],
  ),
];

const wineElites: CardDefinition[] = [
  elite(
    3,
    "wine-snob",
    "The Wine Snob",
    "He swirls, he sniffs, he says you'd like something approachable. Roll d20.",
    "Approachable. Drink 4.",
    "You pour his '82 into a Solo cup. He drops a loaded die. Give 4.",
    "die",
  ),
  elite(
    3,
    "grape-elemental",
    "Grape Elemental",
    "Two tons of grapes, stomped into rage. Roll d20.",
    "Stomped. Drink 4.",
    "Raisin. It leaves a draught behind. Give 4.",
    "draught",
  ),
];

const wineBosses: CardDefinition[] = [
  boss(
    3,
    "count-corkula",
    "Count Corkula",
    "He does not drink... blood. He drinks pinot. Yours. Roll d20.",
    d20(
      BOSS_NEED[0],
      "He drains your glass. Drink 4.",
      "A stake through the cork. Give 5.",
      {
        crit: "Sunlight. Everyone else drinks 3.",
      },
    ),
    "bleed",
  ),
  boss(
    3,
    "cask-queen",
    "The Cask Queen",
    "She sits on a throne of barrels and judges your palate. Curtsy, then roll d20.",
    d20(
      BOSS_NEED[0],
      "Your palate is basic. Drink 4.",
      "You knock out a barrel. She tumbles. Give 5.",
      {
        fumble: "Off with your glass. Finish your drink.",
      },
    ),
  ),
  boss(
    3,
    "chateau-ghoul",
    "Château Ghoul",
    "A ghoul in a beret who thinks your wine is beneath you. Roll d20.",
    d20(
      BOSS_NEED[0],
      "He sneers you to death. Drink 4.",
      "You hand him a White Claw. He dissolves. Give 5.",
    ),
  ),
];

// --- Floor 2, the other way down: the Sewers ----------------------------------
// Everything the bar ever flushed ended up here, and some of it is alive.
// Monsters fall on a 9.

const sewerFights: CardDefinition[] = [
  monster(
    4,
    "gator-junior",
    "Gator Junior",
    "Someone flushed a baby gator in 1995. He is not a baby. Roll d20.",
    "Chomp. Drink 4.",
    "You give him a belly rub. Give 4.",
  ),
  monster(
    4,
    "toilet-mimic",
    "Toilet Mimic",
    "The only toilet down here is licking its lips. Roll d20.",
    "Swirlie. Drink 4.",
    "You flush it. Give 4.",
    { fumble: "The full swirlie. Finish your drink." },
  ),
  monster(
    4,
    "hazmat-goblin",
    "Hazmat Goblin",
    "A goblin in a hazmat suit who loves it down here. Loves it. Roll d20.",
    "He hugs you. Drink 4.",
    "You pull his air hose. He drops a smoke bomb. Give 3.",
    { loot: "smoke" },
  ),
  monster(
    4,
    "sludge-bro",
    "Sludge Bro",
    "A pile of sludge in a muscle shirt asks if you even lift. Roll d20.",
    "You don't. Drink 4.",
    "You lift him, into the drain. Give 4.",
  ),
  monster(
    4,
    "pizza-rat-prime",
    "Pizza Rat Prime",
    "The original pizza rat, nine feet tall now and still dragging the slice. Roll d20.",
    "Slice to the face. Drink 4.",
    "You take the slice. Give 4.",
    { crit: "You take the slice and eat it. Give 6." },
  ),
  monster(
    4,
    "drain-witch",
    "The Drain Witch",
    "She brews in the runoff, and she's offering you a sip. Roll d20.",
    "You sip. Drink 3.",
    "You pour it back. Give 4.",
    { curse: "hex" },
  ),
  monster(
    4,
    "fatberg-spawn",
    "Fatberg Spawn",
    "A baby fatberg made of wet wipes and grease. It wants its mom. Roll d20.",
    "It clings. Drink 3.",
    "You flush it. Give 4.",
    { curse: "bleed" },
  ),
  monster(
    4,
    "sewer-mutant",
    "Sewer Mutant",
    "A mutant with three arms and a fourth beer wants to arm-wrestle. Roll 2d6.",
    "",
    "",
    {
      dice: rollTable(2, 6, [
        { min: 2, max: 6, instruction: "It has three arms. Drink 4." },
        {
          min: 7,
          max: 12,
          instruction: "You win, somehow. Give 4.",
          win: true,
        },
      ]),
    },
  ),
  ambush(
    4,
    "roach-conga",
    "Roach Conga",
    "The roaches are doing a conga line, and now you're in it. Roll d20.",
    "You conga'd. Drink 3.",
    "You break the line. Give 3.",
  ),
  trial(
    4,
    "the-smell",
    "The Smell",
    "Hold your nose and talk normally about your day for 30 seconds. Let go: drink 4.",
  ),
  trial(
    4,
    "the-pipe",
    "The Pipe",
    "Crawl under the table and out the other side without touching a leg. Touch one: drink 4.",
  ),
  trial(
    4,
    "the-echo",
    "The Echo",
    "Talk for 30 seconds while everyone repeats your last word back at you. Stop: drink 4.",
  ),
  trap(
    4,
    "big-flush",
    "The Big Flush",
    "Somewhere above, a whole bar flushes at once. Roll d20.",
    "Swept down the pipe. Drink 3.",
    "You grab a ladder. Give 2.",
  ),
  trap(
    4,
    "loose-grate",
    "Loose Grate",
    "The grate under your foot isn't attached to anything. Roll d20.",
    "One leg down a drain. Drink 3.",
    "You hop off. Give 2.",
  ),
  trap(
    4,
    "swamp-gas",
    "Swamp Gas",
    "Somebody lit a cigarette. Down here. Roll d20.",
    "Eyebrows gone. Drink 3.",
    "You dive into the sludge. Give 2.",
  ),
];

const sewerFinds: CardDefinition[] = [
  relic(
    4,
    "glint-in-the-drain",
    "Glint in the Drain",
    "Something gold is down the drain. Reach in, or don't.",
    12,
    "Something reaches back. Drink 4.",
    "A ring, and a draught still sealed. Give 4.",
    ["Don't", "Reach in"],
    { loot: "draught" },
  ),
  treasure(
    4,
    "flushed-purse",
    "Flushed Purse",
    "A purse dropped down a toilet, somehow dry: lipstick, a lighter, a smoke bomb. Drink 1.",
    "smoke",
  ),
  shrine(
    4,
    "storm-drain-skylight",
    "Storm Drain Skylight",
    "A grate overhead and real moonlight. Everyone looks up and makes a wish.",
  ),
  treasure(
    4,
    "maintenance-locker",
    "Maintenance Locker",
    "A hard hat and a thermos of something brown. Wear one, drink from the other. Drink 1.",
    "shield",
  ),
  merchant(
    4,
    "mole-man",
    "The Mole Man",
    "A man who lives down here sells whatever washes past. He takes drinks, or blood.",
    [
      { label: "Drink 4", loot: "draught" },
      { label: "Bleed for it", cost: 1, loot: "smoke" },
      { label: "Walk on" },
    ],
  ),
  fork(
    4,
    "two-pipes",
    "Two Pipes",
    "Two pipes, big enough to crawl. One drips. The other gurgles, and it sounds like laughing.",
    ["Dripping pipe", "Gurgling pipe"],
  ),
];

const sewerElites: CardDefinition[] = [
  elite(
    4,
    "clog-beast",
    "Clog Beast",
    "Everything anyone ever flushed, fused into one angry clog. Roll d20.",
    "It backs up on you. Drink 5.",
    "You plunge it. Inside: a shield. Don't ask. Give 5.",
    "shield",
  ),
  elite(
    4,
    "rat-captain",
    "Rat Captain",
    "A rat in a captain's hat with a tiny cutlass and a big grudge. Roll d20.",
    "Keelhauled. Drink 5.",
    "You take his hat, and his loaded die. Give 5.",
    "die",
  ),
];

const sewerBosses: CardDefinition[] = [
  boss(
    4,
    "the-fatberg",
    "The Fatberg",
    "A hundred tons of grease and wet wipes the size of a bus, and it's angry. Roll d20.",
    d20(
      BOSS_NEED[1],
      "It absorbs a bit of you. Drink 5.",
      "A chunk comes off. Give 4.",
    ),
    "bleed",
  ),
  boss(
    4,
    "alligator-al",
    "Alligator Al",
    "A twelve-foot gator in a bowling shirt who runs the sewer's only bar. Roll d20.",
    d20(
      BOSS_NEED[1],
      "Al doesn't like your face. Drink 5.",
      "You bowl him a strike. Give 4.",
      {
        crit: "Gutter ball, and he's in it. Everyone else drinks 3.",
      },
    ),
  ),
  boss(
    4,
    "plumber-king",
    "The Plumber King",
    "Crowned in a toilet seat with a plunger for a scepter. He demands tribute. Roll d20.",
    d20(BOSS_NEED[1], "Plunged. Drink 5.", "You snap the plunger. Give 4.", {
      fumble: "He crowns you with the seat. Finish your drink.",
    }),
  ),
];

// --- Floor 3, the other way down: the Kitchen ---------------------------------
// The dinner rush never ended. Monsters fall on 11. Last Call waits after.

const kitchenFights: CardDefinition[] = [
  monster(
    5,
    "deep-fryer-demon",
    "Deep Fryer Demon",
    "It'll fry anything. It's looking at your hand. Roll d20.",
    "Battered. Drink 5.",
    "You throw ice in it. Give 5.",
  ),
  monster(
    5,
    "line-cook-golem",
    "Line Cook Golem",
    "Seven feet of burns and tattoos, ten tickets deep, and you're in the way. Roll d20.",
    "Behind! Drink 5.",
    "You run his food. He respects you. Give 5.",
  ),
  monster(
    5,
    "sentient-sourdough",
    "Sentient Sourdough",
    "The starter has been fed for forty years. It wants more. Roll d20.",
    "It rises over you. Drink 5.",
    "You punch it down. Give 5.",
  ),
  monster(
    5,
    "garlic-wraith",
    "Garlic Breath Wraith",
    "A wraith that only ever exhales. Roll d20.",
    "It breathes on you. Drink 4.",
    "You hold your breath. Give 5.",
    { curse: "hex" },
  ),
  monster(
    5,
    "the-expo",
    "The Expo",
    "The expo is screaming for hands, and you have hands. Roll d20.",
    "Plates everywhere. Drink 5.",
    "Order up. Give 5.",
  ),
  monster(
    5,
    "food-critic-ghoul",
    "Food Critic Ghoul",
    "A ghoul with a notebook. One star, and he hasn't eaten yet. Roll d20.",
    "One star. Drink 5.",
    "You comp his meal. He leaves a draught as a tip. Give 4.",
    { loot: "draught" },
  ),
  monster(
    5,
    "walk-in-yeti",
    "Walk-In Yeti",
    "Something lives in the walk-in, and it ate the shrimp. Roll d20.",
    "Cold hug. Drink 5.",
    "You lock it in. Give 5.",
    { fumble: "It locks you in. Finish your drink." },
  ),
  monster(
    5,
    "dish-pit-horror",
    "Dish Pit Horror",
    "Something under the dish pit water has been eating forks. Roll 3d6.",
    "",
    "",
    {
      dice: rollTable(3, 6, [
        { min: 3, max: 10, instruction: "It eats your fork. Drink 5." },
        {
          min: 11,
          max: 18,
          instruction: "You pull the plug. Give 5.",
          win: true,
        },
      ]),
    },
  ),
  ambush(
    5,
    "raccoon-crew",
    "Raccoon Crew",
    "Two raccoons in chef's hats are stealing the bread. Roll d20.",
    "They take your fries too. Drink 4.",
    "You chase them out. Give 4.",
  ),
  trial(
    5,
    "yes-chef",
    "Yes, Chef",
    "For 30 seconds, answer everything anyone says with 'Yes, chef!' Miss one: drink 5.",
  ),
  trial(
    5,
    "four-plates",
    "Four Plates",
    "Carry four empties on one arm across the room and back. Drop one: drink 5.",
  ),
  trial(
    5,
    "hot-sauce",
    "The Hot Sauce Wall",
    "Name ten hot sauces, real or made up, in 20 seconds. Stumble: drink 5.",
  ),
  trap(
    5,
    "grease-fire",
    "Grease Fire",
    "Somebody threw water on it. Roll d20.",
    "Singed. Drink 4.",
    "You smother it with a lid. Give 3.",
  ),
  trap(
    5,
    "wet-floor",
    "Wet Floor",
    "There was a sign. You ignored it. Roll d20.",
    "Down. Drink 4.",
    "You skate it. Give 3.",
  ),
  trap(
    5,
    "swinging-door",
    "The Swinging Door",
    "One door, in and out, and a server is coming through with a full tray. Roll d20.",
    "Tray to the face. Drink 4.",
    "You spin past. Give 3.",
  ),
];

const kitchenFinds: CardDefinition[] = [
  relic(
    5,
    "back-burner",
    "The Back Burner",
    "A pot that's been simmering since the flood. Taste it, or leave it.",
    13,
    "Fish heads. Drink 5.",
    "Best soup of your life, and a draught for later. Give 5.",
    ["Leave it", "Taste it"],
    { loot: "draught" },
  ),
  treasure(
    5,
    "staff-meal",
    "Staff Meal",
    "Fries, pickles, and a shot the cooks hid for you. Drink 1, and pocket a smoke bomb.",
    "smoke",
  ),
  shrine(
    5,
    "break-room",
    "The Break Room",
    "A couch, a microwave, and twelve minutes of peace. Everyone sits down and sips.",
  ),
  treasure(
    5,
    "knife-roll",
    "Knife Roll",
    "A chef's knife roll left on the pass, something heavy in the end pocket. Drink 1.",
    "die",
  ),
  merchant(
    5,
    "the-dishwasher",
    "The Dishwasher",
    "The dishwasher has seen everything, and he'll sell you some of it, for drinks or blood.",
    [
      { label: "Drink 5", loot: "shield" },
      { label: "Bleed for it", cost: 1, loot: "draught" },
      { label: "Walk on" },
    ],
  ),
  fork(
    5,
    "the-pass",
    "The Pass",
    "Two ways out: the quiet back door, or straight through the line in the dinner rush.",
    ["Back door", "Through the line"],
  ),
];

const kitchenElites: CardDefinition[] = [
  elite(
    5,
    "head-chef",
    "The Head Chef",
    "He's thrown a pan at everyone tonight. You're next. Roll d20.",
    "The pan. Drink 6.",
    "You say 'Heard, chef.' He's moved, and hands you his lucky die. Give 6.",
    "die",
  ),
  elite(
    5,
    "the-butcher",
    "The Butcher",
    "The butcher is sharpening, and sharpening, and sharpening. Roll d20.",
    "Filleted. Drink 6.",
    "You take his apron. It's basically armor. Give 6.",
    "shield",
  ),
];

// --- Tonight's omen -----------------------------------------------------------
// The run's first card: one rule for the whole crawl. Pub Crawl only.

const omens: CardDefinition[] = [
  omen(
    "flooded-stairs",
    "Flooded Stairs",
    "The stairs are underwater. Every trap costs one more heart. Take a smoke bomb down.",
    { hurt: { trap: 1 }, loot: ["smoke"] },
  ),
  omen(
    "happy-hour",
    "Happy Hour",
    "Two for one, all the way down. Every shrine heals one more heart. Everyone drinks 1.",
    { heal: 1 },
  ),
  omen(
    "running-a-tab",
    "Running a Tab",
    "You start two hearts short, but the bar put a shield and a draught on your tab.",
    { hearts: -2, loot: ["shield", "draught"] },
  ),
  omen(
    "lock-in",
    "The Lock-In",
    "Locked in until sunrise. Every boss takes one more hit to fall. Have a loaded die for it.",
    { bossHits: 1, loot: ["die"] },
  ),
  omen(
    "cargo-shorts",
    "Cargo Shorts",
    "Somebody wore cargo shorts. The satchel holds four tonight, and one pocket has a draught.",
    { satchel: 4, loot: ["draught"] },
  ),
  omen(
    "butterfingers",
    "Butterfingers",
    "Everyone's already a bit gone. The satchel holds only two, but you get two more hearts.",
    { satchel: 2, hearts: 2 },
  ),
  omen(
    "blood-moon",
    "Blood Moon",
    "Blood on the moon. Every monster costs one more heart, but you start with two more.",
    { hurt: { monster: 1, elite: 1, ambush: 1 }, hearts: 2 },
  ),
  omen(
    "lefty-night",
    "Lefty Night",
    "Drink with your off hand all crawl. Caught using the other: drink 1. That's all. Probably.",
  ),
  omen(
    "karaoke-night",
    "Karaoke Night",
    "Before every boss swing, the drawer sings one line of anything. Refuse: drink 2.",
  ),
  omen(
    "the-regulars",
    "The Regulars",
    "The bartender likes you. You start with two more hearts.",
    { hearts: 2 },
  ),
  omen(
    "thin-walls",
    "Thin Walls",
    "Every trial costs one more heart tonight, but every shrine heals one more.",
    { hurt: { trial: 1 }, heal: 1 },
  ),
  omen(
    "cold-open",
    "Cold Open",
    "Everyone drinks before the first door. Start a heart short, with a loaded die and shield.",
    { hearts: -1, loot: ["die", "shield"] },
  ),
];

/** Fights and bosses play as ordinary cards in the plain modes; finds,
 * merchants, forks and omens only in a crawl. */
const deck = [
  ...cellarFights,
  ...cellarElites,
  ...cellarBosses,
  ...wineFights,
  ...wineElites,
  ...wineBosses,
  ...catacombFights,
  ...catacombElites,
  ...catacombBosses,
  ...sewerFights,
  ...sewerElites,
  ...sewerBosses,
  ...taproomFights,
  ...taproomElites,
  ...kitchenFights,
  ...kitchenElites,
  ...lastCallBosses,
];

// Tonight's dice (2026-10-17): each omen's colours, the enamel then the
// metal; without an omen the dice keep the house brass and teal.
const OMEN_DICE: Record<string, [primary: string, secondary: string]> = {
  "flooded-stairs": ["#1f5f73", "#9fd0c8"],
  "happy-hour": ["#a8651a", "#e9b56a"],
  "running-a-tab": ["#2f5f45", "#d8b45a"],
  "lock-in": ["#2e3238", "#a9b2bc"],
  "cargo-shorts": ["#5f5a34", "#d8c79a"],
  butterfingers: ["#e8c24a", "#8a5a2a"],
  "blood-moon": ["#7e1e24", "#4a3d40"],
  "lefty-night": ["#4b3a7c", "#c9c4d8"],
  "karaoke-night": ["#a82c68", "#f4d35e"],
  "the-regulars": ["#6e3a24", "#d2a65f"],
  "thin-walls": ["#625d53", "#c9a878"],
  "cold-open": ["#35627f", "#dfeef5"],
};
for (const o of omens) {
  const [primary, secondary] = OMEN_DICE[o.id.replace("dungeon.omen-", "")];
  o.palette = { primary, secondary };
}

// Every d20 here carries the crawls' natural 20 and natural 1
// (`naturals.ts`), in Pub Crawl and in the plain modes alike.
export const dungeonCards: CardDefinition[] = [
  ...deck,
  ...cellarFinds,
  ...wineFinds,
  ...catacombFinds,
  ...sewerFinds,
  ...taproomFinds,
  ...kitchenFinds,
  ...omens,
].map(withNaturals);

const ids = (cards: CardDefinition[]) => cards.map((c) => c.id);

/** A floor's seven rooms, drawn from its fights and finds; its elites wait
 * behind the fork's loud door. */
const floor = (
  label: string,
  intro: string,
  fights: CardDefinition[],
  finds: CardDefinition[],
  elites: CardDefinition[],
) => ({
  label,
  intro,
  pick: 7,
  cardIds: ids([...fights, ...finds]),
  elite: ids(elites),
});
const bossStage = (label: string, intro: string, bosses: CardDefinition[]) => ({
  label,
  intro,
  pick: 1,
  cardIds: ids(bosses),
});

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
    // Tonight's omen, then one of two floors at each depth (seven rooms and
    // a boss), then Last Call.
    finale: [
      {
        label: "Tonight's omen",
        intro: "Tonight's omen",
        pick: 1,
        cardIds: ids(omens),
      },
      {
        oneOf: [
          [
            floor(
              "The Cellar",
              "Down into the Cellar",
              cellarFights,
              cellarFinds,
              cellarElites,
            ),
            bossStage(
              "Cellar boss",
              "Something blocks the stairs",
              cellarBosses,
            ),
          ],
          [
            floor(
              "The Wine Cellar",
              "Down into the Wine Cellar",
              wineFights,
              wineFinds,
              wineElites,
            ),
            bossStage(
              "Wine Cellar boss",
              "Something uncorks itself",
              wineBosses,
            ),
          ],
        ],
      },
      {
        oneOf: [
          [
            floor(
              "The Catacombs",
              "Down into the Catacombs",
              catacombFights,
              catacombFinds,
              catacombElites,
            ),
            bossStage("Catacombs boss", "The bones stand up", catacombBosses),
          ],
          [
            floor(
              "The Sewers",
              "Down into the Sewers",
              sewerFights,
              sewerFinds,
              sewerElites,
            ),
            bossStage("Sewers boss", "Something big in the pipes", sewerBosses),
          ],
        ],
      },
      {
        oneOf: [
          [
            floor(
              "The Drowned Taproom",
              "The Drowned Taproom",
              taproomFights,
              taproomFinds,
              taproomElites,
            ),
          ],
          [
            floor(
              "The Kitchen",
              "Through the swinging door",
              kitchenFights,
              kitchenFinds,
              kitchenElites,
            ),
          ],
        ],
      },
      bossStage("Last call", "Last call", lastCallBosses),
    ],
  },
};
