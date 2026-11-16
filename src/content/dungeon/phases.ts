import type { CardDefinition, Phase } from "../../game/types";
import { d20, moves, pair, type Roll } from "./shared";

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
  "bridge-troll": [
    duel(
      "He climbs back up, loincloth gone. Arm-wrestle your left neighbor, playing the troll. Lose: drink 3.",
    ),
  ],
  "robber-baron": [
    duel(
      "His court is in session. Plead your case to the table for 20 seconds; they vote. Guilty: drink 3.",
    ),
  ],
  ogre: [
    roll(
      "He swings a tree at you. It might be his dick. Roll 2d6.",
      pair(
        "The tree connects. Drink 4.",
        "You duck it. Give 4.",
        "He hits himself with it. Give 6.",
      ),
    ),
  ],
  "great-boar": [
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
  "headless-rider": [
    duel(
      "He rides back. Left neighbor plays him: rock, paper, scissors, best of three. Lose: drink 3.",
    ),
  ],
  // The Old Forest (was the Wine Cellar).
  "wolf-king": [
    duel(
      "He circles you. Staring contest with your left neighbor, playing the wolf. Blink first: drink 3.",
    ),
  ],
  "faerie-queen": [
    duel(
      "She demands a rhyming toast. Give her one, ten seconds, no ums; the table judges. Fail: drink 3.",
    ),
  ],
  "old-bear": [
    roll(
      "He sniffs your crotch for honey. Roll 2d6 to prove you have none.",
      pair("He finds some. Don't ask where. Drink 4.", "Empty-handed. Give 4."),
    ),
  ],
  "green-knight": [
    duel(
      "His game: you strike, then he does. Arm-wrestle your left neighbor, playing him. Lose: drink 3.",
    ),
  ],
  "hungry-wood": [
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
  "bog-hydra": [
    duel(
      "The heads argue over you. Hold one note while the table counts to ten. Run out of air: drink 3.",
    ),
  ],
  "frog-king": [
    duel(
      "He wants his court flattered. Croak his praises for 15 seconds. Laugh or stall: drink 3.",
    ),
  ],
  "drowned-lich": [
    duel(
      "Name swamp creatures back and forth with your left neighbor. Stall or repeat first: drink 3.",
    ),
  ],
  "marsh-serpent": [
    roll(
      "It thrashes, coils everywhere. Roll 2d6 to break free.",
      pair(
        "Squeezed. Drink 4.",
        "You slip loose. Give 4.",
        "You tie it to a tree. Give 6.",
      ),
    ),
  ],
  "baron-of-the-bog": [
    roll(
      "He offers you a job at the manor. Roll d6 to negotiate.",
      moves(
        ["Stable hand: you shovel shit. Drink 4.", "Paid in turnips. Drink 3."],
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
  "bone-golem": [
    roll(
      "It pulls itself back together, mostly. Roll d20.",
      d20At(
        "It groans and falls on you. Drink 5.",
        "The last bone comes loose. Give 4.",
      ),
    ),
  ],
  "crypt-guardian": [
    duel(
      "Arm-wrestle your left neighbor, playing the guardian. Lose: drink 4.",
    ),
  ],
  "dancing-dead": [
    duel(
      "He plays faster. Freestyle four filthy lines about the table, in rhyme. Stop or stall: drink 4.",
    ),
  ],
  "lich-lord": [
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
  "crypt-keeper": [
    duel(
      "Name five embarrassing things buried with a king, in ten seconds. Fall short: drink 4.",
    ),
  ],
  // The Goblin Mines (was the Sewers).
  "goblin-king": [
    roll(
      "His goblins rush back in. Roll 2d6.",
      pair("They pile on you. Drink 5.", "You scatter them. Give 4."),
    ),
  ],
  "ogre-foreman": [
    duel(
      "He wants your miner's stance. Hold it on one leg while the table counts to 15. Wobble: drink 4.",
    ),
  ],
  "mine-lord": [
    duel(
      "Kneel and swear fealty to the Mine Lord, in one breath, in rhyme. Stumble: drink 4.",
    ),
  ],
  "mother-of-goblins": [
    duel(
      "She wants an apology. Apologize to your left neighbor for 15 seconds, sincerely. Laugh: drink 4.",
    ),
  ],
  "rock-worm": [
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
  "tower-itself": [
    duel(
      "The light's out. Eyes shut, touch the nose of your left neighbor on the first try. Miss: drink 4.",
    ),
  ],
  "mad-alchemist": [
    roll(
      "He serves the house special. Roll 2d6.",
      pair(
        "It explodes. Drink 5.",
        "You sip it slowly, like an adult. Give 5.",
        "You hand it back, and it explodes on him. Give 7.",
      ),
    ),
  ],
  archmage: [
    duel(
      "He casts a holding spell. Freeze while the table counts to 15. Move, laugh or blink: drink 4.",
    ),
  ],
  "puppet-master": [
    duel(
      "He makes the table dance. Name six dances in ten seconds. Fall short: drink 4.",
    ),
  ],
  "frozen-apprentice": [
    duel(
      "He asks what he missed. Name three new things in ten seconds. Fall short: drink 4.",
    ),
  ],
  // The side quests' keepers (Realms, 2026-11-03).
  "granny-hex": [
    duel(
      "She wants the goat back. Haggle with your left neighbor for ten seconds. Table says no: drink 4.",
    ),
  ],
  "one-eyed-mag": [
    duel(
      "She wants a duel of insults. Trade three with your left neighbor; the table judges. Lose: drink 4.",
    ),
  ],
  "barrow-king": [
    duel(
      "He demands your lineage: name four ancestors, real or not, in ten seconds. Fail: drink 4.",
    ),
  ],
  "sea-witch": [
    duel(
      "She sings. The table has ten seconds to make you laugh. Laugh: drink 4.",
    ),
  ],
  "deep-worm": [
    duel(
      "It coils for another strike. Arm-wrestle your left neighbor. Lose: drink 4.",
    ),
  ],
};

/** The d20 a boss's opener needs: its later rolls take the same odds. */
const needOf = (card: CardDefinition) => {
  const win = card.dice?.outcomes?.find((o) => o.win);
  if (card.dice?.count === 1 && card.dice.sides === 20 && win) return win.min;
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
