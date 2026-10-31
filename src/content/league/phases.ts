import type { CardDefinition, Phase } from "../../game/types";
import { naturalDice } from "../naturals";
import { moves, pair, vs, type Roll } from "./journey";
import { HIDEOUT_BOSS_NEED, RIVAL_NEED } from "./journey";
import { CHAMPION_NEED, GYM_NEED, LEGENDARY_NEED } from "./shared";

// Boss phases in the League (2026-10-25): a Legendary's second beat is the
// catch, a Champion sends out its ace (one beat since 2026-10-31), and the
// rival and every villain boss have a second act. The card's own roll opens
// the fight; each hit landed moves it to the next beat, and the felling
// swing plays the last. A beat is a duel (a table contest, Won or Lost) or
// another roll at the fight's odds, with the crawls' naturals.

type Beat = (need: number) => Phase;
const duel =
  (rules: string): Beat =>
  () => ({ rules });
const roll =
  (rules: string, fight: Roll): Beat =>
  (need) => ({ rules, dice: naturalDice(fight(need)) });

/** A gym's ace rolls at its tier's odds, whatever its opener rolls. */
const atTier =
  (tier: number, beat: Beat): Beat =>
  () =>
    beat(GYM_NEED[tier]);

const beats: Readonly<Record<string, Beat[]>> = {
  // Legendaries: the catch.
  "legendary-articuno": [
    duel(
      "It's weakened. Throw a ball: toss a coaster into an empty cup, three tries. All miss: drink 4.",
    ),
  ],
  "legendary-zapdos": [
    roll(
      "It's grounded and twitching. Throw a Poké Ball: roll d20.",
      vs(
        "It shocks the ball open. Drink 4.",
        "Click. Zapdos is caught. Give 6.",
      ),
    ),
  ],
  "legendary-moltres": [
    duel(
      "Catch it before it burns out: name eight Fire-type Pokémon in 20 seconds. Fall short: drink 4.",
    ),
  ],
  "legendary-mewtwo": [
    duel(
      "It's tired. Staring contest with your left neighbor, playing Mewtwo. Look away first: drink 4.",
    ),
  ],
  "legendary-mew": [
    roll(
      "It's giggling inside a Poké Ball. Roll 2d6.",
      pair(
        "It pops out laughing. Drink 4.",
        "Click. Mew is yours. Give 6.",
        "It catches you, then lets you go. Everyone else drinks 3.",
      ),
    ),
  ],
  "legendary-lugia": [
    duel(
      "Catch it under the waves: hold your breath while the table counts to 15. Gasp early: drink 4.",
    ),
  ],
  "legendary-ho-oh": [
    roll(
      "Throw a ball into the rainbow. Roll d20.",
      vs(
        "It flies into the sunset. Drink 4.",
        "Caught. The ball glows. Give 6.",
      ),
    ),
  ],
  "legendary-beasts": [
    duel(
      "One stops to drink. Swap drinks with your left neighbor unnoticed in 30 seconds. Caught: drink 4.",
    ),
  ],
  "legendary-celebi": [
    duel(
      "Throw the ball back in time: say the alphabet from Z back to P, no stops. Stumble: drink 4.",
    ),
  ],
  "legendary-eon-duo": [
    roll(
      "They're tangled together. One ball for both: roll 2d6.",
      pair("They split. You and your partner drink 2.", "Two for one. Give 6."),
    ),
  ],
  "legendary-deoxys": [
    duel(
      "It changes forme. Strike a pose and hold it while the table counts to 15. Break: drink 4.",
    ),
  ],
  "legendary-groudon": [
    roll(
      "The ground's cracked open. Drop a ball down the crack: roll d20.",
      vs("Lava. Drink 4.", "Click, from deep down. Give 6."),
    ),
  ],
  "legendary-kyogre": [
    duel(
      "Drain the sea: chug while the table counts to five. Stop early: drink 4.",
    ),
  ],
  "legendary-rayquaza": [
    duel(
      "Ride it down: balance a coaster on your head while the table counts to 15. Drop it: drink 4.",
    ),
  ],
  "legendary-regi-trio": [
    duel(
      "Solve it without a guide: spell 'Registeel' backwards in ten seconds. Fail: drink 4.",
    ),
  ],
  "legendary-dialga": [
    duel(
      "Stop time: freeze mid-sip while the table counts to ten. Move: drink 4.",
    ),
  ],
  "legendary-palkia": [
    roll(
      "Space folds around the ball. Roll d20.",
      vs(
        "It lands in another dimension. Drink 4.",
        "Caught, somewhere. Give 6.",
      ),
    ),
  ],
  "legendary-giratina": [
    duel(
      "Throw with your off hand: toss a coaster into an empty cup, three tries. All miss: drink 4.",
    ),
  ],
  "legendary-darkrai": [
    duel(
      "It hides in your dream. Eyes shut, name every player in order around the table. Miss one: drink 4.",
    ),
  ],
  "legendary-arceus": [
    roll(
      "God is in the ball. Roll 2d6.",
      pair(
        "God is not in the ball. Drink 4.",
        "Click. You own God now. Give 6.",
        "It was always yours. Everyone else drinks 3.",
      ),
    ),
  ],
  "legendary-reshiram": [
    duel(
      "The truth catches it: the table asks you one question, and you answer it honestly. Refuse: drink 4.",
    ),
  ],
  "legendary-zekrom": [
    duel(
      "Pitch why you deserve Zekrom, ten seconds. The table votes. No: drink 4.",
    ),
  ],
  "legendary-xerneas": [
    roll(
      "It's blooming. Throw a ball into the antlers: roll d20.",
      vs(
        "It bounces off a branch. Drink 4.",
        "Caught in a burst of flowers. Give 6.",
      ),
    ),
  ],
  "legendary-yveltal": [
    duel(
      "Play dead until it lands: stay still while the table counts to 15. Move: drink 4.",
    ),
  ],
  "legendary-tapu-koko": [
    duel(
      "Earn its respect: ten push-ups or ten squats, your pick, now. Quit: drink 4.",
    ),
  ],
  "legendary-necrozma": [
    duel(
      "Eyes still shut, clink glasses with your left neighbor on the first try. Miss: drink 4.",
    ),
  ],
  "legendary-zacian": [
    duel(
      "Fetch: the table hides a coaster while you look away. Find it in 30 seconds. Fail: drink 4.",
    ),
  ],
  "legendary-eternatus": [
    roll(
      "It's dimming. Throw the ball at the core: roll d20.",
      vs("The Darkest Day goes on. Drink 4.", "Caught, somehow. Give 6."),
    ),
  ],
  "legendary-koraidon": [
    duel(
      "Hold the wheelie: lean back, arms out, while the table counts to ten. Fall: drink 4.",
    ),
  ],
  "legendary-miraidon": [
    roll(
      "Throw a ball from the future. Roll 2d6.",
      pair(
        "It hasn't been invented yet. Drink 4.",
        "Click. Caught last week. Give 6.",
        "You caught it tomorrow. Everyone else drinks 3.",
      ),
    ),
  ],
  // Champions: the ace (the switch beat was cut 2026-10-31, one hit less).
  "league-champion-blue": [
    roll(
      "His last Pokémon beats your starter. Of course it does. Roll d20.",
      vs(
        "Smell ya later. Everyone drinks 4.",
        "Blue's out. Everyone else drinks 4.",
      ),
    ),
  ],
  "league-champion-red": [
    roll(
      "Pikachu, at level 88. Roll d20 in silence.",
      vs("Thunder. Everyone drinks 4.", "Red nods once. Give 6."),
    ),
  ],
  "league-champion-lance": [
    roll(
      "Dragonite, with a cape. Roll d20.",
      vs("Outrage. Everyone drinks 4.", "Dragonite bows. Give 6."),
    ),
  ],
  "league-champion-steven": [
    roll(
      "Metagross Mega Evolves. Roll d20.",
      vs("Meteor Mash. Everyone drinks 4.", "It cracks like a geode. Give 6."),
    ),
  ],
  "league-champion-wallace": [
    roll(
      "Milotic, glittering. Roll d20.",
      vs("Too beautiful to hit. Everyone drinks 4.", "Ruffled. Give 6."),
    ),
  ],
  "league-champion-cynthia": [
    roll(
      "Garchomp, again. Roll d20.",
      vs(
        "Earthquake. Everyone drinks 4.",
        "Garchomp falls. Cynthia smiles. Give 6.",
      ),
    ),
  ],
  "league-champion-alder": [
    roll(
      "Volcarona, and it's very warm in here. Roll d20.",
      vs("Fiery Dance. Everyone drinks 4.", "It cools off. Give 6."),
    ),
  ],
  "league-champion-iris": [
    roll(
      "Haxorus, and she's already crying. Roll d20.",
      vs(
        "Dragon Dance. Everyone drinks 4.",
        "You beat a kid. Give 6, ashamed.",
      ),
    ),
  ],
  "league-champion-diantha": [
    roll(
      "Her final scene. Roll d20.",
      vs(
        "She steals the scene. Everyone drinks 4.",
        "Cut! That's a wrap. Give 6.",
      ),
    ),
  ],
  "league-champion-kukui": [
    roll(
      "Incineroar, shirtless too. Roll d20.",
      vs("Darkest Lariat. Everyone drinks 4.", "Woo! Give 6."),
    ),
  ],
  "league-champion-leon": [
    roll(
      "Charizard Gigantamaxes. Roll d20.",
      vs(
        "G-Max Wildfire. Everyone drinks 4.",
        "The champion time is over. Give 6.",
      ),
    ),
  ],
  "league-champion-geeta": [
    roll(
      "Glimmora Terastallizes. Roll d20.",
      vs("Tera Blast. Everyone drinks 4.", "Meeting adjourned. Give 6."),
    ),
  ],
  "league-champion-nemona": [
    roll(
      "Pawmot, and she's never been happier. Roll d20.",
      vs(
        "Again! Everyone drinks 4.",
        "She finally loses. She loves it. Give 6.",
      ),
    ),
  ],
  // The villains' bosses.
  "boss-giovanni": [
    duel(
      "He stands up. Staring contest with your left neighbor, playing Giovanni. Blink first: drink 4.",
    ),
  ],
  "boss-maxie": [
    roll(
      "Groudon's awake again, and angrier. Roll d20.",
      vs("Precipice Blades. Drink 5.", "Maxie's glasses crack. Give 4."),
    ),
  ],
  "boss-archie": [
    duel(
      "Rain Dance: dance for ten seconds, shirt half open. The table votes. Weak: drink 4.",
    ),
  ],
  "boss-cyrus": [
    duel(
      "No emotions: the table has ten seconds to make you smile. Smile: drink 4.",
    ),
  ],
  "boss-ghetsis": [
    duel(
      "Prove you're not trash: name three things you're good at in ten seconds. Fall short: drink 4.",
    ),
  ],
  "boss-lysandre": [
    duel(
      "Describe your beautiful world in one sentence. The table votes. Ugly: drink 4.",
    ),
  ],
  "boss-guzma": [
    duel("Arm wrestle your left neighbor, playing Guzma. Lose: drink 4."),
  ],
  "boss-rose": [
    roll(
      "Eternatus drains the power grid. Roll 2d6 to keep the lights on.",
      pair("Blackout. Drink 5.", "The lights stay on. Give 4."),
    ),
  ],
  "boss-cassiopeia": [
    duel(
      "Plot twist: tell the table one thing about you nobody here knows. Refuse: drink 4.",
    ),
  ],
  // Gyms 5 to 8 (2026-10-25): the leader opens, then sends out their ace.
  "gym-koga": [
    atTier(
      4,
      roll(
        "Koga sends out Weezing, and the room fills with smoke. Roll d20.",
        vs("Toxic. Drink 4.", "Weezing faints. Give 4."),
      ),
    ),
  ],
  "gym-chuck": [
    atTier(
      4,
      roll(
        "Chuck sends out Poliwrath, flexing. Roll d20.",
        vs("Dynamic Punch. Drink 4.", "Poliwrath faints. Give 4."),
      ),
    ),
  ],
  "gym-norman": [
    atTier(
      4,
      roll(
        "Norman sends out Slaking. It's lying down. Roll d20.",
        vs("Giga Impact. Drink 4.", "Slaking was asleep anyway. Give 4."),
      ),
    ),
  ],
  "gym-fantina": [
    atTier(
      4,
      roll(
        "Fantina sends out Mismagius, giggling. Roll d20.",
        vs("Shadow Ball. Drink 4.", "Mismagius vanishes. Give 4."),
      ),
    ),
  ],
  "gym-clay": [
    atTier(
      4,
      duel(
        "Clay sends out Excadrill. Name five things buried in a mine in ten seconds. Fall short: drink 4.",
      ),
    ),
  ],
  "gym-clemont": [
    atTier(
      4,
      duel(
        "Clemont sends out Heliolisk. Explain a gadget in your pocket like a scientist. Laugh: drink 4.",
      ),
    ),
  ],
  "gym-mallow": [
    atTier(
      4,
      roll(
        "Mallow sends out Tsareena, kicking. Roll d20.",
        vs("Trop Kick. Drink 4.", "Tsareena trips. Give 4."),
      ),
    ),
  ],
  "gym-opal": [
    atTier(
      4,
      roll(
        "Opal sends out Alcremie and asks your favorite color. Say pink, then roll d20.",
        vs("Wrong color. Drink 4.", "Pink. She approves. Give 4."),
      ),
    ),
  ],
  "gym-larry": [
    atTier(
      4,
      duel(
        "Larry sends out Staraptor. Mime a whole lunch break in ten seconds. Boring: drink 4.",
      ),
    ),
  ],
  "gym-sabrina": [
    atTier(
      5,
      roll(
        "Sabrina sends out Alakazam, and it already knows your roll. Roll d20.",
        vs("It knew. Drink 4.", "It didn't see that coming. Give 4."),
      ),
    ),
  ],
  "gym-jasmine": [
    atTier(
      5,
      roll(
        "Jasmine sends out Steelix, shyly. Roll d20.",
        vs("Iron Tail. Drink 4.", "Steelix rusts. Give 4."),
      ),
    ),
  ],
  "gym-winona": [
    atTier(
      5,
      roll(
        "Winona sends out Altaria, humming. Roll d20.",
        vs("Sky Attack. Drink 4.", "Altaria floats off. Give 4."),
      ),
    ),
  ],
  "gym-byron": [
    atTier(
      5,
      duel(
        "Byron sends out Bastiodon. Out-flex your left neighbor; the table judges. Lose: drink 4.",
      ),
    ),
  ],
  "gym-skyla": [
    atTier(
      5,
      duel(
        "Skyla sends out Swanna. Flap like a swan while the table counts to ten. Stop: drink 4.",
      ),
    ),
  ],
  "gym-valerie": [
    atTier(
      5,
      roll(
        "Valerie sends out Sylveon, ribbons everywhere. Roll d20.",
        vs("Moonblast. Drink 4.", "Sylveon gets tangled. Give 4."),
      ),
    ),
  ],
  "gym-olivia": [
    atTier(
      5,
      duel(
        "Olivia sends out Lycanroc. Howl a breakup song for five seconds. Laugh: drink 4.",
      ),
    ),
  ],
  "gym-gordie": [
    atTier(
      5,
      duel(
        "Gordie sends out Coalossal. Name five rocks in ten seconds. Fall short: drink 4.",
      ),
    ),
  ],
  "gym-ryme": [
    atTier(
      5,
      roll(
        "Ryme sends out Toxtricity, and the bass drops. Roll d20.",
        vs("Overdrive. Drink 4.", "The mic cuts out. Give 4."),
      ),
    ),
  ],
  "gym-blaine": [
    atTier(
      6,
      roll(
        "Blaine sends out Arcanine, and it's hot in here. Roll d20.",
        vs("Fire Blast. Drink 4.", "Arcanine wants pets. Give 4."),
      ),
    ),
  ],
  "gym-pryce": [
    atTier(
      6,
      roll(
        "Pryce sends out Mamoswine. Roll d20.",
        vs("Avalanche. Drink 4.", "Mamoswine slips. Give 4."),
      ),
    ),
  ],
  "gym-tate-liza": [
    atTier(
      6,
      duel(
        "Lunatone and Solrock spin. You and your partner say one word on three. Mismatch: you both drink 3.",
      ),
    ),
  ],
  "gym-candice": [
    atTier(
      6,
      roll(
        "Candice sends out Froslass, and your drink frosts over. Roll d20.",
        vs("Blizzard. Drink 4.", "Froslass melts. Give 4."),
      ),
    ),
  ],
  "gym-brycen": [
    atTier(
      6,
      roll(
        "Brycen sends out Beartic, in costume. Roll d20.",
        vs("Icicle Crash. Drink 4.", "Cut! Beartic misses its mark. Give 4."),
      ),
    ),
  ],
  "gym-olympia": [
    atTier(
      6,
      duel(
        "Olympia sends out Meowstic. Predict who at the table speaks next. Wrong: drink 4.",
      ),
    ),
  ],
  "gym-nanu": [
    atTier(
      6,
      roll(
        "Nanu sends out Persian, yawning. Roll d20.",
        vs("Night Slash. Drink 4.", "Persian wanders off. Give 4."),
      ),
    ),
  ],
  "gym-piers": [
    atTier(
      6,
      roll(
        "Piers sends out Obstagoon, tongue out. Roll d20.",
        vs("Obstruct. Drink 4.", "Encore! Give 4."),
      ),
    ),
  ],
  "gym-tulip": [
    atTier(
      6,
      duel(
        "Tulip sends out Florges. Compliment the makeup your left neighbor mimed, sincerely. Laugh: drink 4.",
      ),
    ),
  ],
  "gym-giovanni": [
    atTier(
      7,
      duel(
        "Giovanni sends out Nidoking. Beg for mercy in one sentence; the table votes. No mercy: drink 5.",
      ),
    ),
  ],
  "gym-clair": [
    atTier(
      7,
      duel(
        "Clair sends out Kingdra. Tell her she's right again, in rhyme. Stumble: drink 5.",
      ),
    ),
  ],
  "gym-wallace": [
    atTier(
      7,
      roll(
        "Wallace sends out Milotic, shimmering. Roll d20.",
        vs("Too beautiful. Drink 5.", "Milotic bows. Give 5."),
      ),
    ),
  ],
  "gym-volkner": [
    atTier(
      7,
      duel(
        'Volkner sends out Electivire. Tell a fun fact that gets a "whoa." Nobody says it: drink 5.',
      ),
    ),
  ],
  "gym-drayden": [
    atTier(
      7,
      duel(
        "Drayden sends out Haxorus. Keep your campaign promise now, or drink 5.",
      ),
    ),
  ],
  "gym-wulfric": [
    atTier(
      7,
      roll(
        "Wulfric sends out Avalugg, and it's an iceberg. Roll d20.",
        vs("Avalanche. Drink 5.", "Avalugg cracks. Give 5."),
      ),
    ),
  ],
  "gym-hapu": [
    atTier(
      7,
      duel(
        "Hapu sends out Mudsdale. Gallop around the table and back. Refuse: drink 5.",
      ),
    ),
  ],
  "gym-raihan": [
    atTier(
      7,
      duel(
        "Raihan sends out Duraludon. Take a group selfie in ten seconds. Anyone missing from it: drink 5.",
      ),
    ),
  ],
  "gym-grusha": [
    atTier(
      7,
      roll(
        "Grusha sends out Altaria, cold as ever. Roll d20.",
        vs("Ice Beam. Drink 5.", "Altaria sneezes. Give 5."),
      ),
    ),
  ],
  // The rival on Victory Road.
  "rival-blue": [
    duel(
      "His second Pokémon. Rock, paper, scissors with your left neighbor, playing Blue. Lose: drink 3.",
    ),
  ],
  "rival-silver": [
    roll(
      "He's cheating now. Roll d6.",
      moves(
        ["He steals your drink. Drink 4.", "He steals your seat. Drink 3."],
        [
          "You catch him. Give 3.",
          "You call his mom. Give 3.",
          "He cries. Give 4.",
          "He apologizes. Everyone else drinks 2.",
        ],
      ),
    ),
  ],
  "rival-wally": [
    duel(
      "Wally needs a pep talk. Give your left neighbor one for ten seconds; they judge it. Flat: drink 3.",
    ),
  ],
  "rival-barry": [
    duel(
      "Pay the fine in compliments: three to your left neighbor in ten seconds. Fall short: drink 3.",
    ),
  ],
  "rival-hop": [
    duel(
      "Hop wants a better curry. Name five curry ingredients in ten seconds. Fall short: drink 3.",
    ),
  ],
  "rival-nemona": [
    duel("One more! Ten jumping jacks while the table counts. Stop: drink 3."),
  ],
};

/** The d20 a fight's opener needs, or its stage's when it opens on other
 * dice; its later rolls take the same odds. */
const needOf = (card: CardDefinition) => {
  const win = card.dice?.outcomes?.find((o) => o.win && o.min > 1);
  if (card.dice?.count === 1 && card.dice.sides === 20 && win) return win.min;
  const id = card.id.replace("pokemon.", "");
  if (id.startsWith("legendary-")) return LEGENDARY_NEED;
  if (id.startsWith("league-champion-")) return CHAMPION_NEED;
  if (id.startsWith("boss-")) return HIDEOUT_BOSS_NEED;
  if (id.startsWith("rival-")) return RIVAL_NEED;
  // A gym's ace takes its tier's odds (`atTier`).
  if (id.startsWith("gym-")) return 0;
  throw new Error(`No odds for phases: ${card.id}`);
};

export function applyLeaguePhases(cards: CardDefinition[]) {
  for (const [id, list] of Object.entries(beats)) {
    const card = cards.find((c) => c.id === `pokemon.${id}`);
    if (!card?.hits) throw new Error(`No boss for phases: pokemon.${id}`);
    const need = needOf(card);
    card.phases = list.map((beat) => beat(need));
  }
}
