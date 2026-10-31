import type {
  CardDefinition,
  DiceDefinition,
  TimerDefinition,
} from "../../game/types";
import { d20 } from "./shared";

// The variety pass (2026-10-31, owner: "double down on ... variety and
// interesting fun cards ... especially variety within cards"), floor by
// floor after the Cellar (rewritten in place in `cellar.ts`). Applied by card
// ID after the outcome rewrites and before the naturals pass, like
// `outcomes.ts`:
// - `mishap`: a room that only poured becomes something the table does (a
//   vote, a reflex, a hidden fuse, a secret on a clock, four seats and four
//   dice, an auction, a performance the table judges). Still nothing at
//   stake in the crawl.
// - `duel`: a d20 monster becomes a table fight settled with Won and Lost.
// - `setup`: a d20 room asks for something before the roll.
// - `crit` / `fumble`: a natural 20 or 1 gets a line of its own instead of
//   the doubled roll beside it (keep its numbers doubled).
// - Bosses open with side bets (the setup).
// `tests/variety.test.ts` holds each reworked floor to the higher bar.

type Rewrite = {
  /** New rules: a mishap's line, a duel's challenge, or a d20 setup. */
  rules?: string;
  /** The room becomes a table fight (no roll; Won and Lost). */
  duel?: true;
  crit?: string;
  fumble?: string;
  secret?: string;
  timer?: TimerDefinition;
  dice?: DiceDefinition;
};

const fuse = (end: string, min = 12, max = 40): TimerDefinition => ({
  version: 1,
  kind: "fuse",
  min,
  max,
  end,
});
const clock = (end: string, seconds = 45): TimerDefinition => ({
  version: 1,
  kind: "countdown",
  seconds,
  end,
});
const GUESSED = "Time. Someone guessed it? Give 3. Nobody did? Drink 3.";
/** Four seats, four dice: the drawer and the next three clockwise. */
const seats = (line: string): DiceDefinition => ({
  version: 1,
  count: 4,
  sides: 6,
  instruction: `${line} You drink {first}; the next three clockwise drink {second}, {third} and {fourth}.`,
});
const SIDE_BETS = "Side bets: thumbs up or down; wrong bets drink 1.";

const rewrites: Readonly<Record<string, Rewrite>> = {
  // The Wine Cellar.
  "zombie-sommelier": {
    rules:
      "Read alone what he poured, start the clock, then describe it like a wine snob. The table guesses.",
    secret: "A BOX OF FRANZIA.",
    timer: clock(GUESSED),
  },
  "barrel-mimic": {
    rules:
      "On three, everyone points at who'd faint first if a barrel grew teeth. Most fingers: drink 2.",
  },
  "corkscrew-crab": {
    rules:
      "A corkscrew crab scuttles under the table, pinching. Last to lift both feet drinks 2.",
  },
  "sulfite-cloud": {
    rules:
      "Light the fuse. Pass a beer clockwise, naming a wine. The headache hits whoever holds it.",
    timer: fuse("The headache hits. Whoever is holding the beer drinks 3."),
  },
  "rose-elemental": {
    rules:
      "Everyone says 'rosé all day' as a threat. The table picks the scariest; they give 3.",
  },
  "wine-mom-banshee": {
    duel: true,
    rules:
      "Scream 'FIVE O'CLOCK SOMEWHERE!' against your left neighbor. The table calls the quieter: drink 3.",
  },
  "sangria-sprite": {
    duel: true,
    rules:
      "Your right neighbor throws a mimed orange slice. Catch it in your mouth. Booed: drink 3.",
  },
  "boxed-wine-golem": {
    rules:
      "A golem of boxed wine, slapping its own bag. Name a boxed wine, then roll d20.",
    crit: "You find the spout and the golem deflates with a sigh. Give 6.",
  },
  "rose-slime": {
    rules:
      "Pink, sticky, and it says it's not like other slimes. Say something basic, then roll d20.",
    fumble: "It's exactly like other slimes, and so are you. Drink 6.",
  },
  "merlot-stairs": {
    rules: "The stairs are slick with spilled merlot. Stand up, then roll d20.",
    crit: "You slide down the rail like it's 1999. Give 4.",
  },
  "count-corkula": {
    rules: `He drinks pinot. Yours. ${SIDE_BETS} Roll d20.`,
  },
  "the-sommelier": {
    rules: `Ten feet tall and never wrong. ${SIDE_BETS} Roll d20.`,
  },

  // The Brewery.
  "hop-goblin": {
    rules:
      "Read alone his lecture topic, start the clock, and explain it like a beer bro. The table guesses.",
    secret: "A HAZY TRIPLE IPA.",
    timer: clock(GUESSED),
  },
  "yeast-beast": {
    rules:
      "The yeast beast bubbles toward the table. Everyone puffs their cheeks; first to laugh drinks 2.",
  },
  "foam-ferrets": {
    rules: "The foam ferrets scatter. Roll four dice.",
    dice: seats("They nip four seats."),
  },
  "gruit-druid": {
    rules:
      "The druid auctions a cup of 1300s beer. Bid sips clockwise until everyone passes. Top bid drinks it.",
  },
  "co2-leak": {
    rules:
      "Light the fuse. Pass a beer clockwise, all talking in deep voices. The leak hits whoever holds it.",
    timer: fuse("The tank blows. Whoever is holding the beer drinks 3."),
  },
  "mash-tun-monster": {
    duel: true,
    rules:
      "Thumb war with your left neighbor, who plays the mash tun monster. Best of three. Lose: drink 3.",
  },
  "bottle-cap-crab": {
    duel: true,
    rules:
      "Flick a coaster to the far edge of the table without it falling off. Two tries. Miss: drink 3.",
  },
  "brewers-ghost": {
    rules:
      "He died tasting batch one, and wants your opinion on batch two. Sip, nod slowly, then roll d20.",
    crit: "You call it a masterpiece and he finally moves on. Give 6.",
  },
  "sour-mash-witch": {
    rules:
      "She brews sours, and her mood went sour years ago. Make your sourest face, then roll d20.",
    fumble:
      "Your face stays like that. Drink 6, puckered, while the table watches.",
  },
  "grain-chute": {
    rules: "The grain chute opens right above you. Duck, then roll d20.",
  },
  "king-hop": {
    rules: `A hop cone the size of a car. ${SIDE_BETS} Roll d20.`,
  },
  "keg-kraken": {
    rules: `Eight arms, each one a tap. ${SIDE_BETS} Roll d20.`,
  },

  // The Catacombs.
  "hungover-mummy": {
    rules:
      "On three, everyone points at who'd still be hungover in three thousand years. Most fingers: drink 3.",
  },
  "banshee-karaoke": {
    rules:
      "Read alone the banshee's song, start the clock, and hum it. The table guesses the song.",
    secret: "MR. BRIGHTSIDE.",
    timer: clock(GUESSED, 30),
  },
  "collapsing-floor": {
    rules:
      "The floor gives way. Last to grab the edge of the table with both hands drinks 2.",
  },
  "zombie-roommate": {
    rules:
      "Light the fuse. Pass a beer clockwise, naming a chore you skipped. Rent's due on whoever holds it.",
    timer: fuse("Rent's due. Whoever is holding the beer drinks 3."),
  },
  "grabbing-hand": {
    rules: "Hands grab from every coffin. Roll four dice.",
    dice: seats("Four ankles grabbed."),
  },
  "leech-swarm": {
    duel: true,
    rules:
      "Staring contest with your right neighbor, who plays the leech. Blink or laugh first: drink 3.",
  },
  "lich-intern": {
    duel: true,
    rules:
      "The lich's accountant audits you: your left neighbor asks three trivia questions. Miss two: drink 4.",
  },
  "ex-wraith": {
    rules:
      "A wraith with your ex's face reads your old texts aloud. Put your phone face down, then roll d20.",
  },
  "hex-witch": {
    rules:
      "A witch who reads tarot and your browser history. Cross your fingers, then roll d20.",
    crit: "You read her history back to her. She vanishes in shame. Give 8.",
  },
  "rolling-skull": {
    rules:
      "A giant stone skull rolls down the corridor. Everyone hums the theme while you roll d20.",
  },
  "the-bouncer": {
    rules: `Seven feet of door guy. ${SIDE_BETS} Roll d20.`,
  },
  "the-lich-lord": {
    rules: `His soul's in a shot glass. ${SIDE_BETS} Roll d20.`,
  },

  // The Sewers.
  "toilet-mimic": {
    rules:
      "On three, everyone points at who'd use a toilet that licks its lips. Most fingers: drink 3.",
  },
  "sludge-bro": {
    rules:
      "The sludge bro wants a flex-off. Everyone flexes; the table picks the weakest flex. They drink 3.",
  },
  "sewer-mutant": {
    rules:
      "The three-armed mutant arm-wrestles the table, clockwise. Roll four dice.",
    dice: seats("Four arms pinned."),
  },
  "flushed-goldfish": {
    rules:
      "Read alone what else got flushed, start the clock, then mime it. The table guesses.",
    secret: "AN ENGAGEMENT RING.",
    timer: clock(GUESSED),
  },
  "big-flush": {
    rules:
      "Light the fuse. Pass a beer clockwise, naming something to flush. The flush gets whoever holds it.",
    timer: fuse("Flush. Whoever is holding the beer drinks 3."),
  },
  "pizza-rat-prime": {
    duel: true,
    rules:
      "Slice-off: you and your left neighbor mime eating a slice. Slower, by the table's call: drink 4.",
  },
  "echo-bat": {
    duel: true,
    rules:
      "Your right neighbor echoes everything you say for 20 seconds. You laugh first: drink 4.",
  },
  "drain-witch": {
    rules:
      "She brews in the runoff and offers you a sip. Hold your nose, then roll d20.",
    fumble: "You sip, and ask for seconds. Drink 6 and say it was lovely.",
  },
  "slime-slide": {
    rules:
      "The floor tilts, and it's greased. Lean back in your chair, then roll d20.",
  },
  "the-fatberg": {
    rules: `A hundred tons of grease and wipes. ${SIDE_BETS} Roll d20.`,
  },
  "alligator-al": {
    rules: `A twelve-foot gator in a bowling shirt. ${SIDE_BETS} Roll d20.`,
  },

  // The Walk-in Freezer.
  "brain-freeze": {
    rules:
      "Everyone presses a thumb to the roof of their mouth. Last to say 'brain freeze' drinks 3.",
  },
  "the-snowman": {
    rules:
      "Read alone who the snowman looks like, start the clock, and describe them. The table guesses.",
    secret: "SANTA, AFTER A DIVORCE.",
    timer: clock(GUESSED),
  },
  "the-door-shuts": {
    rules:
      "Light the fuse. Pass a beer clockwise, naming a frozen food. The cold gets whoever holds it.",
    timer: fuse("The light goes out. Whoever is holding the beer drinks 3."),
  },
  "popsicle-golem": {
    rules:
      "The golem auctions its last grape popsicle. Bid sips clockwise; top bid drinks it.",
  },
  "ice-goblin": {
    rules: "The ice goblin juggles cubes around the table. Roll four dice.",
    dice: seats("Four cubes down four collars."),
  },
  "freezer-burn": {
    duel: true,
    rules:
      "Cold stare-down with your left neighbor. First to blink or laugh loses. Lose: drink 4.",
  },
  "the-mammoth": {
    duel: true,
    rules:
      "Mammoth tusk wrestle: link pinkies with your right neighbor and pull. Let go first: drink 4.",
  },
  "ice-wraith": {
    rules:
      "A ghost made of frost breathes on your neck. Shiver dramatically, then roll d20.",
  },
  "frost-giant": {
    rules:
      "Nine feet tall, ice for hands, and he says you're cut off. Act sober, then roll d20.",
    fumble: "He's right. You're cut off. Drink 8, then water.",
  },
  "icicle-drop": {
    rules:
      "The ceiling is all icicles, and you just sneezed. Freeze, then roll d20.",
  },
  "the-walk-in": {
    rules: `The walk-in wakes up. ${SIDE_BETS} Roll d20.`,
  },
  "the-ice-cream-man": {
    rules: `The ice cream van, in a minor key. ${SIDE_BETS} Roll d20.`,
  },

  // The Drowned Taproom.
  "sommelier-kraken": {
    rules: "The kraken sips from four glasses at once. Roll four dice.",
    dice: seats("Four glasses, four sips."),
  },
  "drowned-regular": {
    rules:
      "Read alone his one story, start the clock, then tell it as him. The table guesses what it's about.",
    secret: "THE ONE THAT GOT AWAY (A FISH).",
    timer: clock(GUESSED),
  },
  "piranha-shots": {
    rules:
      "Piranhas in the shots. On three, everyone points at who'd do one anyway. Most fingers: drink 3.",
  },
  "snorkel-shark": {
    rules:
      "Light the fuse. Pass a beer clockwise, naming a fish as you pass. The shark gets whoever holds it.",
    timer: fuse("The shark bites. Whoever is holding the beer drinks 3."),
  },
  "drain-vortex": {
    rules: "Someone pulled the plug. Last to spin once in their seat drinks 3.",
  },
  "merfolk-ex": {
    duel: true,
    rules:
      "Your ex is doing amazing. Out-brag your left neighbor for 15 seconds. Table's loser: drink 4.",
  },
  "tap-mimic": {
    duel: true,
    rules:
      "The tap's a mimic. Pour-off with your right neighbor: mime a pint. Table's worse pour: drink 5.",
  },
  "last-orders-siren": {
    rules:
      "A siren sings one more drink, and it's beautiful. Cover your ears, then roll d20 to resist.",
  },
  "text-them-eel": {
    rules:
      "An eel whispers: text them. Hand your phone to the left, then roll d20.",
    crit: "You text the eel instead. It leaves you on read. Give 10.",
  },
  "rip-current": {
    rules: "The floor is a river now. Swim with your arms, then roll d20.",
  },

  // The Kitchen.
  "deep-fryer-demon": {
    rules:
      "Light the fuse. Pass a beer clockwise, naming a fried food. The fryer spits on whoever holds it.",
    timer: fuse("The fryer spits. Whoever is holding the beer drinks 3."),
  },
  "walk-in-yeti": {
    rules:
      "On three, everyone points at who ate all the shrimp. Most fingers: drink 3.",
  },
  "dish-pit-horror": {
    rules: "The dish pit horror burps up forks, four of them. Roll four dice.",
    dice: seats("Four forks, four seats."),
  },
  "swinging-door": {
    rules:
      "A server bursts through the swinging door. Everyone shouts 'Behind!'; the last to shout drinks 3.",
  },
  "rat-chef": {
    rules:
      "Read alone the rat's special, start the clock, then describe it like a menu. The table guesses.",
    secret: "TRUFFLE MAC AND CHEESE.",
    timer: clock(GUESSED),
  },
  "line-cook-golem": {
    duel: true,
    rules:
      "Your left neighbor calls three drink orders. Repeat them back in order. Miss one: drink 5.",
  },
  "garlic-wraith": {
    duel: true,
    rules:
      "Breath-off: hold your breath against your right neighbor. Breathe first: drink 4.",
  },
  "microwave-ghost": {
    rules:
      "The ghost of every fish ever microwaved at work. Hold your nose, then roll d20.",
    fumble: "You were the one who microwaved the fish. Drink 10 and apologize.",
  },
  "grease-fire": {
    rules:
      "Somebody threw water on it. Everyone yells 'FIRE!', then you roll d20.",
  },
  mandoline: {
    rules: "The mandoline is slicing on its own. Hands up, then roll d20.",
  },

  // The Rooftop Bar.
  "the-seagull": {
    rules:
      "A seagull eyes the table. Last to cover their drink with a hand drinks 3.",
  },
  "the-proposal": {
    rules:
      "Read alone his proposal, start the clock, then act it out. The table guesses the line.",
    secret: "'WILL YOU SPLIT AN UBER WITH ME FOREVER?'",
    timer: clock(GUESSED),
  },
  "the-heat-lamp": {
    rules:
      "On three, everyone points at who'd hog the heat lamp. Most fingers: drink 3.",
  },
  "rogue-drone": {
    rules: "A rogue drone buzzes the table, filming. Roll four dice.",
    dice: seats("It films four bad sides."),
  },
  "the-fireworks": {
    rules:
      "Light the fuse. Pass a beer clockwise, each 'ooh' louder. The firework hits whoever holds it.",
    timer: fuse("BOOM. Whoever is holding the beer drinks 3."),
  },
  "pigeon-king": {
    duel: true,
    rules:
      "Coo-off with your left neighbor; the table picks the better pigeon. Worse pigeon: drink 5.",
  },
  "rooftop-raccoon": {
    duel: true,
    rules:
      "Guarding the limes: rock-paper-scissors with your right neighbor, best of 3. Lose: drink 5.",
  },
  "the-neighbor": {
    rules:
      "A man in a bathrobe on the next roof threatens to call. Wave at him, then roll d20.",
    fumble: "He calls, and it's your mom. Drink 10, and wave again.",
  },
  "the-gargoyle": {
    rules:
      "A gargoyle on the ledge, only pretending to be stone. Everyone freezes while you roll d20.",
  },
  "hot-tub-wizard": {
    rules: "A hot tub 'wizard' wants your drink. Hold it close, then roll d20.",
    crit: "He is a wizard, and he likes you. Give 10, and he makes it rain.",
  },
  // Ambushes and the last plain rooms (2026-10-31): each asks something.
  "falling-taps": {
    rules:
      "A foam tap handle bonks you, and you're Thumb Master now. Drink 1, then use it.",
  },
  "book-club": {
    rules:
      "Four women with one unread book. Name a book you pretended to read, then roll d20.",
  },
  "cork-goblin": {
    rules:
      "A corkscrew goblin opens a twist-off. Everyone mimes popping a cork; the worst pop drinks 2.",
  },
  "brewery-tour": {
    rules:
      "A tour group in hairnets wants a photo. Strike a pose, then roll d20.",
  },
  "bottle-gnomes": {
    rules:
      "Two gnomes stealing bottles saw you see them. Whistle innocently, then roll d20.",
  },
  "spent-grain-golem": {
    rules:
      "A grain golem wants a bakery. On three, point at who'd bake for it. Most fingers: give 2.",
  },
  "vampire-bro": {
    rules:
      "A vampire in a backwards cap who only drinks from frat boys. Say 'bro' twice, then roll d20.",
  },
  "skeleton-crew": {
    rules:
      "A skeleton bachelorette party wants a shot off a femur. Rattle your bones, then roll d20.",
  },
  "ghoul-choir": {
    rules:
      "Twelve ghouls singing your name, off key. Hum one note with them, then roll d20.",
  },
  "alligator-gang": {
    rules:
      "Three gators in leather jackets, one with a switchblade. Snap your fingers, then roll d20.",
  },
  "pipe-octopus": {
    rules:
      "Eight arms out of eight pipes, reaching for drinks. Roll four dice.",
    dice: seats("It steals from four glasses."),
  },
  "margarita-elemental": {
    rules:
      "A slushie with salt on its rim and nothing to lose. Lick your lips, then roll d20.",
  },
  "tongue-on-the-pole": {
    rules:
      "Read alone what you licked on a dare, start the clock, and mime it. The table guesses.",
    secret: "THE ICE MACHINE.",
    timer: clock(GUESSED, 30),
  },
  "penguin-gang": {
    rules:
      "Six penguins in tuxes say you're on their ice. Waddle in your seat, then roll d20.",
  },
  "frozen-peas": {
    rules:
      "Peas everywhere, and they're organized. Count to five out loud, then roll d20.",
  },
  "ski-lodge-crew": {
    rules:
      "Five people in ski gear who never made the slopes. Say 'après-ski', then roll d20.",
  },
  "pirate-ghost": {
    rules:
      "A drowned pirate wants his rum back. Say 'arr' like you mean it, then roll d20.",
  },
  "mermaid-hens": {
    rules:
      "A mermaid bachelorette, out of prosecco. Raise your glass to the bride, then roll d20.",
  },
  "kelp-bouncer": {
    rules:
      "On three, everyone points at who's never on the list. Most fingers: drink 3.",
  },
  "fishing-charter": {
    rules:
      "Six dads lost on a fishing charter since Tuesday. Cast an imaginary line, then roll d20.",
  },
  "raccoon-crew": {
    rules:
      "Two raccoons in chef's hats are stealing the bread. Hide your hands, then roll d20.",
  },
  "hot-pan": {
    rules:
      "Light the fuse. Pass a beer clockwise, saying 'hot, hot, hot'. It burns whoever holds it.",
    timer: fuse("Too hot. Whoever is holding the beer drinks 3."),
  },
  "food-truck-guys": {
    rules:
      "Two food truck guys are robbing the walk-in. Shout today's special, then roll d20.",
  },
  "the-sprinklers": {
    rules:
      "The sprinklers come on. Last to cover their head with both hands drinks 3.",
  },
  "rooftop-yoga": {
    rules:
      "Twenty people in downward dog want their sunset. Namaste, then roll d20.",
  },
  "pigeon-squadron": {
    rules: "Twelve pigeons in a V, on a strafing run. Duck, then roll d20.",
  },
  "wedding-shoot": {
    rules:
      "A wedding party wants the skyline and you're in every shot. Smile, then roll d20.",
  },
};

/** The rewrites above, applied by card ID. A rewritten d20 keeps its odds
 * and its lose and win lines; a duel drops its dice. */
export function applyVariety(cards: CardDefinition[]): CardDefinition[] {
  return cards.map((card) => {
    const r = rewrites[card.id.replace(/^dungeon\./, "")];
    if (!r) return card;
    const next: CardDefinition = { ...card };
    if (r.rules) next.rules = r.rules;
    if (r.secret) next.secret = r.secret;
    if (r.timer) next.timer = r.timer;
    if (r.dice) next.dice = r.dice;
    if (r.duel === true) {
      delete next.dice;
      next.encounter = "trial";
      next.ribbon = card.ribbon?.replace(/ · \w+$/, " · Trial");
    }
    if ((r.crit || r.fumble) && card.dice?.outcomes) {
      const outcomes = card.dice.outcomes;
      const at = (face: number) =>
        outcomes.find((o) => o.min <= face && face <= o.max)!;
      const win = outcomes.find((o) => o.win)!;
      next.dice = d20(win.min, at(2).instruction, at(19).instruction, {
        ...(r.crit ? { crit: r.crit } : {}),
        ...(r.fumble ? { fumble: r.fumble } : {}),
      });
    }
    return next;
  });
}

/** The IDs rewritten here, for the tests. */
export const varietyIds = Object.keys(rewrites).map((id) => `dungeon.${id}`);
