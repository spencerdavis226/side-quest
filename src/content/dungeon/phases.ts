import type { CardDefinition, Phase } from "../../game/types";
import { CLOSING_NEED, d20, moves, pair, type Roll } from "./shared";

// Boss phases (2026-10-25): a boss's later beats, so a fight dealt again is
// a different fight. Each card's own d20 opens it; each hit landed moves it
// to the next beat here, and the felling swing plays the last. A beat is a
// duel (a table contest, settled with Won and Lost) or another roll at the
// boss's own odds. Floor bosses, the hidden room's keepers and closing time
// have two beats; Last Call has three. Applied by card ID before the
// naturals pass, so every d20 here doubles on a 20 and a 1.

type Beat = (need: number) => Phase;
/** A table contest: the rules say who plays the boss and what losing
 * costs; the table taps Won or Lost. */
const duel =
  (rules: string): Beat =>
  () => ({ rules });
/** Another roll at the boss's odds. */
const roll =
  (rules: string, fight: Roll): Beat =>
  (need) => ({ rules, dice: fight(need) });
const d20At =
  (lose: string, win: string, extra?: { crit?: string; fumble?: string }) =>
  (need: number) =>
    d20(need, lose, win, extra);

const beats: Readonly<Record<string, Beat[]>> = {
  // The Cellar.
  "keg-golem": [
    duel(
      "It gets back up, foaming. Chug race with your left neighbor, playing the Golem. Lose: drink 3.",
    ),
  ],
  "rat-king": [
    duel(
      "The court is in session. Plead your case to the table for 20 seconds; they vote. Guilty: drink 3.",
    ),
  ],
  "the-landlord": [
    roll(
      "He's back with a clipboard for the inspection. Roll 2d6.",
      pair(
        "He finds the mold. Drink 4.",
        "He finds nothing. Give 4.",
        "You find his own code violation. Give 6.",
      ),
    ),
  ],
  "big-cheese": [
    roll(
      "It rolls at you, cheese first. Roll d6.",
      moves(
        ["Flattened. Drink 4.", "Cheese in your hair. Drink 3."],
        [
          "You dodge. Give 3.",
          "You take a bite out of it. Give 3.",
          "It rolls into the wall. Give 4.",
          "You grate it. Everyone else drinks 2.",
        ],
      ),
    ),
  ],
  "the-pipe-organ": [
    duel(
      "It plays your song. Hum any song; the table has 15 seconds to name it. Nobody does: drink 3.",
    ),
  ],
  // The Wine Cellar.
  "count-corkula": [
    duel(
      "Fangs out. Staring contest with your left neighbor, playing the Count. Blink first: drink 3.",
    ),
  ],
  "cask-queen": [
    duel(
      "She demands a toast. Give her one, ten seconds, no ums; the table judges. Fail: drink 3.",
    ),
  ],
  "chateau-ghoul": [
    roll(
      "He sniffs your glass with contempt. Roll 2d6 to prove your taste.",
      pair("Corked. Drink 4.", "Notes of oak and victory. Give 4."),
    ),
  ],
  "the-sommelier": [
    duel(
      "Blind tasting: eyes shut, sip a drink the table hands you. Name it wrong: drink 3.",
    ),
  ],
  "the-barrel-room": [
    roll(
      "The live barrel charges. Roll d6.",
      moves(
        ["It rolls over you. Drink 4.", "It rolls over your foot. Drink 3."],
        [
          "You jump it. Give 3.",
          "You stop it with one hand. Give 3.",
          "It rolls into the others. Give 4.",
          "You ride it out. Everyone else drinks 2.",
        ],
      ),
    ),
  ],
  // The Brewery.
  "the-fermenter": [
    duel(
      "The pressure's building. Hold one note while the table counts to ten. Run out of air: drink 3.",
    ),
  ],
  "king-hop": [
    duel(
      "Describe your drink like a beer snob for 15 seconds. Laugh or stall: drink 3.",
    ),
  ],
  "beer-snob-lich": [
    duel(
      "Name beers back and forth with your left neighbor, playing the Lich. Stall or repeat first: drink 3.",
    ),
  ],
  "keg-kraken": [
    roll(
      "All eight taps open at once. Roll 2d6 to shut them.",
      pair(
        "Soaked. Drink 4.",
        "You close the main valve. Give 4.",
        "You pour it a drink. It cries. Give 6.",
      ),
    ),
  ],
  "brewery-owner": [
    roll(
      "He offers you a job at the brewery. Roll d6 to negotiate.",
      moves(
        ["Unpaid internship. Drink 4.", "Paid in exposure. Drink 3."],
        [
          "Free beer for life. Give 3.",
          "Equity. Give 3.",
          "You buy the brewery. Give 4.",
          "You fire him. Everyone else drinks 2.",
        ],
      ),
    ),
  ],
  // The Catacombs.
  "hangover-hydra": [
    roll(
      "One head left, and it's the one with the migraine. Roll d20.",
      d20At("It groans at you. Drink 5.", "The last head comes off. Give 4."),
    ),
  ],
  "the-bouncer": [
    duel("Arm wrestle your left neighbor, playing the Bouncer. Lose: drink 4."),
  ],
  "dj-ossuary": [
    duel(
      "He drops the beat. Freestyle four lines about the table. Stop or stall: drink 4.",
    ),
  ],
  "the-lich-lord": [
    roll(
      "He pours his soul into a second shot glass. Roll d6.",
      moves(
        [
          "You drink the wrong one. Drink 5.",
          "You drink both. Drink 4.",
          "He drinks yours. Drink 3.",
        ],
        [
          "You smash one. Give 3.",
          "You smash both. Give 4.",
          "You make him drink his own soul. Everyone else drinks 2.",
        ],
      ),
    ),
  ],
  "the-ghost-of-closing": [
    duel(
      "Name five bars that ever closed on you, in ten seconds. Fall short: drink 4.",
    ),
  ],
  // The Sewers.
  "the-fatberg": [
    roll(
      "It rolls back together, bigger. Roll 2d6.",
      pair("It absorbs your shoe. Drink 5.", "You flush it. Give 4."),
    ),
  ],
  "alligator-al": [
    duel(
      "Al wants your bowling stance. Hold it on one leg while the table counts to 15. Wobble down: drink 4.",
    ),
  ],
  "plumber-king": [
    duel(
      "Kneel and swear fealty to the Plumber King, in one breath, in rhyme. Stumble: drink 4.",
    ),
  ],
  "the-crocodile-mom": [
    duel(
      "She wants an apology. Apologize to your left neighbor for 15 seconds, sincerely. Laugh: drink 4.",
    ),
  ],
  "the-pipe-worm": [
    roll(
      "It comes up through the drain behind you. Roll d6.",
      moves(
        [
          "It swallows your arm. Drink 5.",
          "It swallows your drink. Drink 4.",
          "It hisses. Drink 3.",
        ],
        [
          "You plug it. Give 3.",
          "You snake it. Give 4.",
          "You tie it to a pipe. Everyone else drinks 2.",
        ],
      ),
    ),
  ],
  // The Walk-in Freezer.
  "the-walk-in": [
    duel(
      "The light's out. Eyes shut, touch the nose of your left neighbor on the first try. Miss: drink 4.",
    ),
  ],
  "the-snow-bartender": [
    roll(
      "He serves the brain freeze. Roll 2d6.",
      pair(
        "Brain freeze. Drink 5.",
        "You drink it slowly, like an adult. Give 5.",
        "You hand it back. He freezes solid. Give 7.",
      ),
    ),
  ],
  "absolute-zero": [
    duel("Freeze while the table counts to 15. Move, laugh or blink: drink 4."),
  ],
  "the-ice-cream-man": [
    duel(
      "He plays the jingle. Name six ice cream flavors in ten seconds. Fall short: drink 4.",
    ),
  ],
  "the-frozen-ex": [
    duel(
      "They want closure. Say three nice things about an ex in ten seconds. Fall short: drink 4.",
    ),
  ],
  // Last Call: three beats.
  "last-call-lich": [
    duel(
      "It rings the bell. Out-shout your left neighbor: 'One more!' The table judges. Lose: drink 4.",
    ),
    roll(
      "One bony hand left on the bell. Everyone raises a glass. Roll d20.",
      d20At(
        "The bell rings. Everyone drinks 4.",
        "You take the bell. Everyone else drinks 4.",
      ),
    ),
  ],
  "bartender-below": [
    duel(
      "It wants your order in three seconds, with a straight face. The table judges. Fail: drink 4.",
    ),
    roll(
      "It reaches for the cut-off bell. Roll d20.",
      d20At("Cut off. Finish your drink.", "You tip big. It weeps. Give 5."),
    ),
  ],
  "final-tab": [
    duel(
      "Split the bill: say what everyone at the table drank tonight, in ten seconds. Miss one: drink 4.",
    ),
    roll(
      "The total comes in. It's a lot. Roll d20.",
      d20At("You pay. Everyone drinks 4.", "You dine and dash. Give 6."),
    ),
  ],
  "house-lights": [
    duel(
      "Everyone looks at you. Strike a pose and hold it while the table counts to ten. Break: drink 4.",
    ),
    roll(
      "The last bulb flickers. Roll d20.",
      d20At(
        "Full brightness. Everyone drinks 4.",
        "Darkness. Everyone else drinks 4.",
      ),
    ),
  ],
  "two-am-kebab": [
    duel(
      "Order for the table in one breath: what everyone wants on theirs. Stumble: drink 4.",
    ),
    roll(
      "It's down to the spit, and it's still turning. Roll d20.",
      d20At(
        "Garlic sauce in your eye. Drink 5.",
        "You eat the last bite. Give 6.",
      ),
    ),
  ],
  "surge-pricing": [
    duel(
      "Haggle a fare with your left neighbor, playing the driver, for ten seconds. They refuse: drink 4.",
    ),
    roll(
      "It's three minutes away, forever. Roll d20.",
      d20At("Ride cancelled. Everyone drinks 4.", "Five stars. Give 6."),
    ),
  ],
  "the-group-chat": [
    duel("Read your last sent text out loud to the table. Refuse: drink 4."),
    roll(
      "Someone's typing. Roll d20.",
      d20At(
        "It's the video. Everyone drinks 4.",
        "It's a meme. You're safe. Give 6.",
      ),
    ),
  ],
  "the-morning-after": [
    duel("Drink a full glass of water without stopping. Stop: drink 4."),
    roll(
      "It rises with the sun. Roll d20.",
      d20At("Sunrise. Everyone drinks 4.", "Blackout curtains. Give 6."),
    ),
  ],
  // Closing time: the Quarter-Zips again.
  "closing-last-table": [
    duel(
      "Brad wants the seat. On go, you and Brad (left neighbor) stand, spin and sit. Last down: drink 4.",
    ),
  ],
  "closing-the-boys-toast": [
    duel(
      "Your turn: toast the Quarter-Zips, sincerely, for ten seconds. Laugh: drink 4.",
    ),
  ],
  "closing-last-round": [
    roll(
      "Chad grabs the tray back. Roll 2d6.",
      pair("He spills it on you. Drink 4.", "It's yours. Give 4."),
    ),
  ],
  "closing-venmo-request": [
    duel(
      "Pay Brad (your left neighbor) back in compliments: three in ten seconds. Fall short: drink 4.",
    ),
  ],
  "closing-dance-off": [
    duel(
      "Round two: you and Thad (your left neighbor) dance, no music. The table votes. Thad wins: drink 4.",
    ),
  ],
  "closing-boys-tab": [
    roll(
      "The bartender wants a signature. Roll d6.",
      moves(
        [
          "You sign it. Drink 4.",
          "You sign it twice. Drink 4.",
          "You tip 30% on it. Drink 3.",
        ],
        [
          "You sign it 'Brad'. Give 3.",
          "You sign it 'Chad'. Give 4.",
          "You sign it 'The Boys'. Everyone else drinks 2.",
        ],
      ),
    ),
  ],
  "closing-thads-uber": [
    duel(
      "Shotgun: you and Thad (left neighbor) call it. The table says who was first. Thad: drink 4.",
    ),
  ],
  "closing-the-rematch": [
    duel(
      "Thumb war with Chad (your left neighbor), best of three. Lose: drink 4.",
    ),
  ],
  // The hidden room's keepers.
  "the-proprietor": [
    duel(
      "He wants the password. Make one up and say it like you mean it; the table votes. No: drink 4.",
    ),
  ],
  "the-promoter": [
    duel(
      "Get on the list: spell your full name backwards in ten seconds. Fail: drink 4.",
    ),
  ],
  "the-manager": [
    duel(
      "Performance review: name three of your strengths in ten seconds, no laughing. Fail: drink 4.",
    ),
  ],
  "big-mike": [
    duel(
      "Poker face: the table has ten seconds to make you laugh. Laugh: drink 4.",
    ),
  ],
  "the-undefeated": [
    duel("Round two: arm wrestle your left neighbor. Lose: drink 4."),
  ],
};

/** The d20 a boss's opener needs: its later rolls take the same odds.
 * Closing time can open on another roll; it fights at `CLOSING_NEED`. */
const needOf = (card: CardDefinition) => {
  const win = card.dice?.outcomes?.find((o) => o.win);
  if (card.dice?.count === 1 && card.dice.sides === 20 && win) return win.min;
  if (card.id.startsWith("dungeon.closing-")) return CLOSING_NEED;
  throw new Error(`A phased boss opens on a d20: ${card.id}`);
};

export function applyPhases(cards: CardDefinition[]) {
  for (const [id, list] of Object.entries(beats)) {
    const card = cards.find((c) => c.id === `dungeon.${id}`);
    if (!card?.hits) throw new Error(`No boss for phases: dungeon.${id}`);
    const need = needOf(card);
    card.phases = list.map((beat) => beat(need));
  }
  return cards;
}
