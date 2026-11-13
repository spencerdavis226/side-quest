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
  // The King's Road (was the Cellar).
  "keg-golem": [
    duel(
      "He climbs back up, dripping. Arm-wrestle your left neighbor, playing the troll. Lose: drink 3.",
    ),
  ],
  "rat-king": [
    duel(
      "His court is in session. Plead your case to the table for 20 seconds; they vote. Guilty: drink 3.",
    ),
  ],
  "the-landlord": [
    roll(
      "He gets up and swings a tree at you. Roll 2d6.",
      pair(
        "The tree connects. Drink 4.",
        "You duck it. Give 4.",
        "He hits himself with it. Give 6.",
      ),
    ),
  ],
  "big-cheese": [
    roll(
      "It turns and charges again, tusks first. Roll d6.",
      moves(
        ["Trampled. Drink 4.", "Tusked. Drink 3."],
        [
          "You dodge. Give 3.",
          "You grab a tusk and hang on. Give 3.",
          "It runs into a tree. Give 4.",
          "You ride it. Everyone else drinks 2.",
        ],
      ),
    ),
  ],
  "the-pipe-organ": [
    duel(
      "He rides back. Left neighbor plays him: rock, paper, scissors, best of three. Lose: drink 3.",
    ),
  ],
  // The Old Forest (was the Wine Cellar).
  "count-corkula": [
    duel(
      "He circles you. Staring contest with your left neighbor, playing the wolf. Blink first: drink 3.",
    ),
  ],
  "cask-queen": [
    duel(
      "She demands a toast. Give her one, ten seconds, no ums; the table judges. Fail: drink 3.",
    ),
  ],
  "chateau-ghoul": [
    roll(
      "He sniffs you for honey. Roll 2d6 to prove you have none.",
      pair("You have honey on you. Drink 4.", "Empty-handed. Give 4."),
    ),
  ],
  "the-sommelier": [
    duel(
      "His game: you strike, then he does. Arm-wrestle your left neighbor, playing him. Lose: drink 3.",
    ),
  ],
  "the-barrel-room": [
    roll(
      "The roots grab for you. Roll d6.",
      moves(
        ["They drag you under. Drink 4.", "They grab your foot. Drink 3."],
        [
          "You jump them. Give 3.",
          "You stamp on one. Give 3.",
          "They tangle each other up. Give 4.",
          "You ride a root out. Everyone else drinks 2.",
        ],
      ),
    ),
  ],
  // The Marsh (was the Brewery).
  "the-fermenter": [
    duel(
      "The heads argue over you. Hold one note while the table counts to ten. Run out of air: drink 3.",
    ),
  ],
  "king-hop": [
    duel(
      "He wants his court flattered. Croak his praises for 15 seconds. Laugh or stall: drink 3.",
    ),
  ],
  "beer-snob-lich": [
    duel(
      "Name swamp creatures back and forth with your left neighbor. Stall or repeat first: drink 3.",
    ),
  ],
  "keg-kraken": [
    roll(
      "It thrashes, coils everywhere. Roll 2d6 to break free.",
      pair(
        "Squeezed. Drink 4.",
        "You slip loose. Give 4.",
        "You tie it to a tree. Give 6.",
      ),
    ),
  ],
  "brewery-owner": [
    roll(
      "He offers you a job at the manor. Roll d6 to negotiate.",
      moves(
        ["Stable hand. Drink 4.", "Paid in turnips. Drink 3."],
        [
          "A room and a horse. Give 3.",
          "A title. Give 3.",
          "You buy the manor. Give 4.",
          "You flood it. Everyone else drinks 2.",
        ],
      ),
    ),
  ],
  // The Haunted Crypt (was the Catacombs).
  "hangover-hydra": [
    roll(
      "It pulls itself back together, mostly. Roll d20.",
      d20At(
        "It groans and falls on you. Drink 5.",
        "The last bone comes loose. Give 4.",
      ),
    ),
  ],
  "the-bouncer": [
    duel(
      "Arm-wrestle your left neighbor, playing the guardian. Lose: drink 4.",
    ),
  ],
  "dj-ossuary": [
    duel(
      "He plays faster. Freestyle four lines about the table, in rhyme. Stop or stall: drink 4.",
    ),
  ],
  "the-lich-lord": [
    roll(
      "He pours his soul into a second cup. Roll d6.",
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
      "Name five things buried with a king, in ten seconds. Fall short: drink 4.",
    ),
  ],
  // The Goblin Mines (was the Sewers).
  "the-fatberg": [
    roll(
      "His goblins rush back in. Roll 2d6.",
      pair("They pile on you. Drink 5.", "You scatter them. Give 4."),
    ),
  ],
  "alligator-al": [
    duel(
      "He wants your miner's stance. Hold it on one leg while the table counts to 15. Wobble: drink 4.",
    ),
  ],
  "plumber-king": [
    duel(
      "Kneel and swear fealty to the Mine Lord, in one breath, in rhyme. Stumble: drink 4.",
    ),
  ],
  "the-crocodile-mom": [
    duel(
      "She wants an apology. Apologize to your left neighbor for 15 seconds, sincerely. Laugh: drink 4.",
    ),
  ],
  "the-pipe-worm": [
    roll(
      "It comes up through the floor behind you. Roll d6.",
      moves(
        [
          "It swallows your arm. Drink 5.",
          "It swallows your drink. Drink 4.",
          "It hisses. Drink 3.",
        ],
        [
          "You block the hole. Give 3.",
          "You spear it. Give 4.",
          "You tie it to a beam. Everyone else drinks 2.",
        ],
      ),
    ),
  ],
  // The Wizard's Tower (was the Walk-in Freezer).
  "the-walk-in": [
    duel(
      "The light's out. Eyes shut, touch the nose of your left neighbor on the first try. Miss: drink 4.",
    ),
  ],
  "the-snow-bartender": [
    roll(
      "He serves the house special. Roll 2d6.",
      pair(
        "It explodes. Drink 5.",
        "You sip it slowly, like an adult. Give 5.",
        "You hand it back, and it explodes on him. Give 7.",
      ),
    ),
  ],
  "absolute-zero": [
    duel(
      "He casts a holding spell. Freeze while the table counts to 15. Move, laugh or blink: drink 4.",
    ),
  ],
  "the-ice-cream-man": [
    duel(
      "He makes the table dance. Name six dances in ten seconds. Fall short: drink 4.",
    ),
  ],
  "the-frozen-ex": [
    duel(
      "He asks what he missed. Name three new things in ten seconds. Fall short: drink 4.",
    ),
  ],
  // The dragons: three beats (Realms, 2026-11-03; were Last Call's).
  "last-call-lich": [
    duel(
      "Emberfang roars. Out-roar your left neighbor; the table judges. Lose: drink 4.",
    ),
    roll(
      "One last breath of fire, held in its throat. Everyone raises a shield. Roll d20.",
      d20At(
        "It breathes. Everyone drinks 4.",
        "You strike first, and Emberfang falls. Everyone else drinks 4.",
      ),
    ),
  ],
  "bartender-below": [
    duel(
      "The air freezes. Hold your breath longer than your left neighbor. Breathe first: drink 4.",
    ),
    roll(
      "It rears up, its chest glowing blue. Roll d20.",
      d20At(
        "Frozen solid. Finish your drink.",
        "You shatter its crown of ice. Give 5.",
      ),
    ),
  ],
  "final-tab": [
    duel(
      "She hisses a riddle. Your left neighbor asks one for her; answer in ten seconds. Fail: drink 4.",
    ),
    roll(
      "The sea boils around her. Roll d20.",
      d20At(
        "You sink to your waist. Everyone drinks 4.",
        "You hold her under. Give 6.",
      ),
    ),
  ],
  "house-lights": [
    duel(
      "It demands praise. Compliment it for ten seconds straight; the table judges. Stall: drink 4.",
    ),
    roll(
      "It spreads its wings, every scale a mirror. Roll d20.",
      d20At(
        "You see yourself in every one. Everyone drinks 4.",
        "You hide under its wing and strike. Everyone else drinks 4.",
      ),
    ),
  ],
  "two-am-kebab": [
    duel(
      "It sniffs for the tastiest hero. Staring contest with your left neighbor. Blink first: drink 4.",
    ),
    roll(
      "Its jaws open wide enough to walk into. Roll d20.",
      d20At("In you go. Drink 5.", "You walk in, and stab upward. Give 6."),
    ),
  ],
  "surge-pricing": [
    duel(
      "Thunder! On three, you and your left neighbor clap; the table says who was first. Late: drink 4.",
    ),
    roll(
      "The storm gathers in its jaws. Roll d20.",
      d20At(
        "Lightning. Everyone drinks 4.",
        "It strikes the sword you planted. Give 6.",
      ),
    ),
  ],
  "the-group-chat": [
    duel(
      "It tells the table your worst secret, unless you tell one first. Refuse: drink 4.",
    ),
    roll(
      "It whispers your name. Roll d20.",
      d20At(
        "Everyone hears it. Everyone drinks 4.",
        "You shout its name back. Give 6.",
      ),
    ),
  ],
  "the-morning-after": [
    duel(
      "It asks why you came. Tell it in ten seconds, no ums; the table judges. Fail: drink 4.",
    ),
    roll(
      "It rises, and the sun goes out. Roll d20.",
      d20At("Darkness. Everyone drinks 4.", "You strike in the dark. Give 6."),
    ),
  ],
  "dragon-tidewrack": [
    duel(
      "It wants a shanty. You and your left neighbor sing one line each; the worse, by vote, drinks 4.",
    ),
    roll(
      "Every bell rings at once, and the sea stands up. Roll d20.",
      d20At(
        "You go under with the bells. Everyone drinks 4.",
        "You ring the last bell yourself. Give 6.",
      ),
    ),
  ],
  // The lair's door: the Gilded Company again.
  "closing-last-table": [
    duel(
      "Bradley wants the doorway. On go, you and he (left neighbor) stand, spin, sit. Last down: drink 4.",
    ),
  ],
  "closing-the-boys-toast": [
    duel(
      "Your turn: toast the Gilded Company, sincerely, for ten seconds. Laugh: drink 4.",
    ),
  ],
  "closing-last-round": [
    roll(
      "Chadwick grabs the potion back. Roll 2d6.",
      pair("He spills it on you. Drink 4.", "It's yours. Give 4."),
    ),
  ],
  "closing-venmo-request": [
    duel(
      "Pay Bradley (your left neighbor) back in compliments: three in ten seconds. Fall short: drink 4.",
    ),
  ],
  "closing-dance-off": [
    duel(
      "Round two: you and Thaddeus (left neighbor) dance, no music. The table votes. He wins: drink 4.",
    ),
  ],
  "closing-boys-tab": [
    roll(
      "The moneylender wants a signature. Roll d6.",
      moves(
        [
          "You sign it. Drink 4.",
          "You sign it twice. Drink 4.",
          "You tip him too. Drink 3.",
        ],
        [
          "You sign it 'Bradley'. Give 3.",
          "You sign it 'Chadwick'. Give 4.",
          "You sign it 'The Company'. Everyone else drinks 2.",
        ],
      ),
    ),
  ],
  "closing-thads-uber": [
    duel(
      "Dibs on the saddle: you and Thaddeus (left neighbor) call it. Table judges. He's first: drink 4.",
    ),
  ],
  "closing-the-rematch": [
    duel(
      "Thumb war with Chadwick (your left neighbor), best of three. Lose: drink 4.",
    ),
  ],
  // The side quests' keepers (Realms, 2026-11-03).
  "the-proprietor": [
    duel(
      "She wants the goat back. Haggle with your left neighbor for ten seconds. Table says no: drink 4.",
    ),
  ],
  "the-promoter": [
    duel(
      "She wants a duel of insults. Trade three with your left neighbor; the table judges. Lose: drink 4.",
    ),
  ],
  "the-manager": [
    duel(
      "He demands your lineage: name four ancestors, real or not, in ten seconds. Fail: drink 4.",
    ),
  ],
  "big-mike": [
    duel(
      "She sings. The table has ten seconds to make you laugh. Laugh: drink 4.",
    ),
  ],
  "the-undefeated": [
    duel(
      "It coils for another strike. Arm-wrestle your left neighbor. Lose: drink 4.",
    ),
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
