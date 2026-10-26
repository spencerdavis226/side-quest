import type { CardDefinition } from "../../game/types";
import { rollTable } from "../author";
import { pairNeed } from "./shared";

// The roll-outcome rewrite (2026-10-25): 97 Pub Crawl rooms resolved to a
// line of flavor and a bare "Drink N" or "Give N" either way. Each now makes
// someone do something, or aims its drinks at someone the table picks, and
// keeps its number, so a natural 20 or 1 still doubles it. Nine of them, one
// a floor, roll 2d6 instead of a d20 (`doubles`: a third, better result), so
// a floor's dice aren't all one d20. Applied by card ID before the naturals
// pass. `[lose, win]`: `null` keeps the line as written.
type Rewrite = {
  lose?: string;
  win?: string;
  /** Roll 2d6 at the same odds; doubles always win, with this line. */
  doubles?: string;
};

const rewrites: Readonly<Record<string, Rewrite>> = {
  // The Cellar.
  "goblin-shaman": {
    win: "You blow out the sage. Give 3 to whoever smells most like it.",
  },
  "rolling-kegs": {
    lose: "Flattened. Drink 3, lying down if you can.",
    win: "You dive clear. Give 2 to whoever didn't flinch.",
  },
  "barback-poltergeist": {
    lose: "The tower falls. Drink 3.",
    win: "You tip him a coin. Stack two empty glasses on someone's head, then give 3.",
    doubles:
      "He stacks glasses on everyone else instead. Everyone else drinks 3.",
  },
  "loose-floorboard": {
    win: "You step over it like a cat. Meow, then give 2.",
  },
  // The Wine Cellar.
  "decanter-ghost": {
    lose: "It breathes on you. Drink 3 and say 'notes of ghost'.",
    win: "You jam the stopper in. Give 3 to the snobbiest drinker here.",
    doubles: "You decant it into someone else's glass. Everyone else drinks 3.",
  },
  "falling-rack": {
    win: "You catch the last one. Give 2, and hand someone your 'bottle'.",
  },
  "tannin-troll": {
    lose: "Your tongue sticks. Drink 3, then say 'tannin' five times fast.",
  },
  // The Catacombs.
  "bone-sommelier": {
    win: "You pour his on the floor. Rate someone's drink out of ten; they drink 4.",
  },
  "leech-swarm": { win: "You salt them. Give 4 to the saltiest player here." },
  "lich-intern": {
    win: "You find an error in his math. Give 4, then explain it badly.",
  },
  "gym-ghoul": {
    lose: "He drops the bar on you. Drink 4.",
    win: "You out-lift a corpse. Flex, then give 4.",
    doubles:
      "You spot him, and he thanks you. Everyone else does a squat or drinks 4.",
  },
  // The Sewers.
  "pizza-rat-prime": {
    win: "You take the slice. Give 4 to whoever wants a bite.",
  },
  "drain-witch": { lose: "You sip. Drink 3 and say it tasted fine." },
  "fatberg-spawn": { win: "You flush it. Give 4, and make the noise." },
  "slime-slide": { win: "You surf it. Give 2 to the worst surfer here." },
  "rat-don": {
    lose: "Something happens to it. Drink 4.",
    win: "You make him an offer. Pick someone to kiss your ring or drink 4.",
    doubles:
      "He makes you the don. Everyone else kisses your ring or drinks 4.",
  },
  "manhole-cover": {
    win: "You catch it like a frisbee. Throw a coaster to someone; they drink 3.",
  },
  // The Drowned Taproom.
  "merfolk-ex": {
    win: "You're doing amazing too. Toast yourself, then give 5.",
  },
  "tap-mimic": {
    win: "You yank it out by the handle. Pour someone a sip; they drink 4.",
  },
  "rip-current": {
    win: "You ride it out. Give 3 to whoever's drowning in their drink.",
  },
  "undertow-tap": { lose: "Swallowed. Drink 4, holding your breath first." },
  "barnacle-bro": {
    lose: "Reefed. Drink 5.",
    win: "You scrape him off the bar. Arm wrestle anyone; the loser drinks 5.",
    doubles: "He's actually nice. Everyone else drinks 5 to the bro.",
  },
  "floating-stools": {
    win: "You ride it like a surfboard. Pick someone to stand; they drink 3.",
  },
  "sea-hag": { win: "She pays you in pearls. Hand out 6 like they're pearls." },
  "shark-bartender": {
    win: "You punch it on the nose. Give 6 to whoever should be cut off.",
  },
  "lighthouse-keeper": {
    lose: "He tells you about the forty years. Drink 6 while someone tells you about theirs.",
  },
  // The Kitchen.
  "garlic-wraith": {
    win: "You hold your breath. Breathe on someone; they drink 5.",
  },
  "rogue-rotisserie": {
    lose: "Basted. Drink 5.",
    win: "You carve your way out. Carve someone a drumstick; they drink 5.",
    doubles: "Chicken for everyone. Everyone else drinks 5 with a mouthful.",
  },
  "grease-fire": {
    win: "You smother it with a lid. Give 3 to whoever looks hot.",
  },
  mandoline: {
    win: "You slide the guard back on. Slice the table in half; the other half drinks 3.",
  },
  "microwave-ghost": {
    win: "You open a window. Give 5 to whoever brought fish to work.",
  },
  "ticket-machine": { win: "Heard. Shout 'Heard!' and give 5." },
  "celebrity-chef": {
    win: "You make his dish better. Call someone a donkey; they drink 6.",
  },
  // The Brewery.
  "mash-tun-monster": {
    win: "You stir it to death. Stir someone's drink; they drink 3.",
  },
  "brewers-ghost": {
    win: "You lie beautifully. Give 3, then lie to someone about their drink.",
  },
  "keg-ninja": {
    lose: "Tapped. Drink 3.",
    win: "You disarm him. Karate-chop the air, then give 2.",
    doubles: "You become the ninja. Everyone else drinks 3, silently.",
  },
  "bottle-cap-crab": {
    win: "You collect the caps. Pinch someone, gently; they drink 3.",
  },
  "bottle-bombs": {
    win: "You dive behind a vat. Give 2 to whoever got splashed.",
  },
  "grain-chute": {
    win: "You surf it out. Give 2 to whoever would have panicked.",
  },
  "hot-wort": {
    win: "You moonwalk across. Moonwalk to your seat, then give 2.",
  },
  "hazy-wraith": {
    win: "You hold it to the light. Give 3 to whoever's hazy right now.",
  },
  "loose-hose": { win: "You stamp it flat. Give 2 to whoever jumped." },
  "barrel-aged-horror": {
    win: "You cork it back in. Give 4 to the oldest player here.",
  },
  "hostile-brewer": {
    win: "You take their tap. Take someone's drink for a sip; they drink 4.",
  },
  "head-brewer": {
    win: "She asks for the recipe. Make one up out loud, then give 4.",
  },
  // The Walk-in Freezer.
  "ice-wraith": {
    win: "You breathe back, harder. Breathe on someone's neck; they drink 4.",
  },
  "frozen-bachelor": {
    win: "You get him to the church. Pick a best man; they drink 4.",
  },
  "ice-sculpture": {
    win: "You chip it into ice cubes. Drop one in someone's drink; they drink 4.",
  },
  "hypothermia-hal": {
    win: "You get Hal a coat. Give 4 to the least-dressed player here.",
  },
  "slippery-floor": {
    win: "You triple-axel it. The table scores you; give 3.",
  },
  "thawed-caveman": {
    lose: "He clubs your phone. Drink 4.",
    win: "You show him a meme. Grunt at someone; they drink 4.",
    doubles: "He makes you chief. Everyone else grunts and drinks 4.",
  },
  "ice-machine": { win: "You unplug it in time. Give 3, ice cold." },
  "the-enforcer": {
    win: "You make him an offer. Pick someone who owes you; they drink 5.",
  },
  "freezer-witch": {
    win: "You thaw the ex. Give 5 to whoever has an ex on ice.",
  },
  // The Rooftop Bar.
  "pigeon-king": {
    win: "You throw the crown off the roof. Crown someone; they drink 5.",
  },
  "the-wind": {
    win: "You lean into it like a music video. Hair flip, then give 5.",
  },
  "influencer-golem": {
    lose: "Take forty. Drink 5.",
    win: "You knock over the ring light. Give 5 to whoever's posing.",
    doubles: "It films you instead. Everyone else drinks 5 for the content.",
  },
  "the-neighbor": {
    win: "You invite him over. Pick someone to be the neighbor; they drink 5.",
  },
  "the-gargoyle": {
    win: "You push it off the ledge. Give 5 to whoever's still as stone.",
  },
  thunderstorm: { win: "You dance in it. Everyone dances or drinks 5." },
  "rooftop-raccoon": {
    win: "You bribe it with a cherry. Give 4 to whoever would eat the limes.",
  },
  "the-ledge": { win: "You step back, cool. Give 4 to whoever gasped." },
  "loose-tile": {
    win: "You land it like a parkour video. Shout 'parkour!' and give 4.",
  },
  "hot-tub-wizard": {
    win: "He's just an old man. Give 5 to whoever believed him.",
  },
  "the-awning": {
    win: "You poke it from a safe distance. Point at someone; they drink 3.",
  },
  "penthouse-owner": {
    win: "You buy the floor below his. Give 6 to the richest-looking player here.",
  },
  "gargoyle-king": {
    win: "You crown yourself. Give 6, split among your subjects.",
  },
  "storm-chaser": {
    win: "You ground him. Touch someone's shoulder, zap; they drink 6.",
  },
  "helicopter-pilot": { win: "Free ride. Pick a co-pilot; you both give 6." },
  // Relics.
  "mimic-cooler": {
    win: "Cold ones, and something useful. Hand someone a cold one; give 3.",
  },
  "locked-reserve": {
    win: "You liberate a bottle. Pour someone the good stuff; they drink 3.",
  },
  "bone-vending": { win: "Clunk. Give 3 to whoever heard it." },
  sarcophagus: {
    win: "Just a very nice shield. Give 4, then knock on the table twice.",
  },
  "glint-in-the-drain": {
    win: "A ring, and a draught still sealed. Propose to someone; they drink 4.",
  },
  "the-floater": {
    win: "Cash, and a smoke bomb. Make it rain on someone; they drink 4.",
  },
  "sunken-chest": { win: "Bone dry, and worth it. Give 5, pirate voice." },
  "the-cash-register": {
    win: "Tips, and a loaded die. Tip someone a sip; they drink 5.",
  },
  "back-burner": {
    win: "Best soup of your life. Give 5 to whoever cooks the worst.",
  },
  "experimental-batch": { win: "It's incredible. Name batch 13, then give 3." },
  "cold-room": {
    win: "Kegs, and a coaster shield. Give 3 to whoever's coldest.",
  },
  "frozen-in-the-ice": {
    win: "Something old and good. Give 4 to the oldest player here.",
  },
  "the-chest-freezer": {
    win: "Ice cream and a loaded die. Give 4 to whoever wants a scoop.",
  },
  "the-telescope": {
    win: "A flask in the coin slot. Spy on someone; they drink 5.",
  },
  "the-water-tower": {
    win: "The best view in town. Point out a stranger's window; give 5.",
  },
  // The Quarter-Zips.
  "queue-knows-the-owner": {
    win: "The owner has never heard of Brad. Give 3 to the Brad of the table.",
  },
  "queue-were-together": {
    win: "The bouncer believes you. Pick someone you're 'together' with; they drink 3.",
  },
  "queue-cover-charge": {
    win: "The bouncer charges Chad double. Give 3, twice, to the same person.",
  },
  "queue-hand-stamp": {
    win: "You wash it off in a puddle. Stamp someone's hand; they drink 3.",
  },
  "stairs-group-photo": {
    win: "You photobomb it. Everyone poses; the worst pose drinks 4.",
  },
  "stairs-leaderboard": { win: "You overtake him. Give 4 to whoever's last." },
  "stairs-recruitment": {
    win: "You say no and mean it. Make someone zip up; they drink 4.",
  },
  // The hidden rooms' guards.
  "flapper-fran": {
    win: "The room applauds. Pick a dance partner; they drink 3.",
  },
  "bottle-service": {
    win: "It was for the next table. Give 3 to whoever ordered it.",
  },
  "the-bodyguard": {
    win: "You walk in like you own it. Give 3 to whoever's VIP.",
  },
  "the-accountant": {
    win: "You find his discrepancy. Give 3 to whoever owes you money.",
  },
  "the-dealer": { win: "You catch her. Deal someone in; they drink 3." },
  "the-ref": {
    win: "He raises your hand. Blow the whistle on someone; they drink 3.",
  },
};

/** Rewrite each listed room's lines, and turn a `doubles` one into 2d6 at
 * the d20's odds. */
export function applyOutcomes(cards: CardDefinition[]) {
  for (const [id, r] of Object.entries(rewrites)) {
    const card = cards.find((c) => c.id === `dungeon.${id}`);
    const dice = card?.dice;
    if (!card || !dice?.outcomes) throw new Error(`No roll: dungeon.${id}`);
    if (r.doubles) {
      const win = dice.outcomes.find((o) => o.win)!;
      const lose = dice.outcomes.find((o) => !o.win)!;
      if (
        dice.count !== 1 ||
        dice.sides !== 20 ||
        !/Roll d20\.$/.test(card.rules)
      )
        throw new Error(`Only a d20 room turns to 2d6: ${card.id}`);
      const t = pairNeed(win.min);
      card.rules = card.rules.replace(/Roll d20\.$/, "Roll 2d6.");
      card.dice = {
        ...rollTable(2, 6, [
          { min: 2, max: t - 1, instruction: r.lose ?? lose.instruction },
          { min: t, max: 12, instruction: r.win ?? win.instruction, win: true },
        ]),
        doubles: r.doubles,
        doublesWin: true,
      };
      continue;
    }
    card.dice = {
      ...dice,
      outcomes: dice.outcomes.map((o) =>
        // A range, never a natural's own line (a crit or a fumble).
        o.min === o.max
          ? o
          : o.win && r.win
            ? { ...o, instruction: r.win }
            : !o.win && r.lose
              ? { ...o, instruction: r.lose }
              : o,
      ),
    };
  }
  return cards;
}
