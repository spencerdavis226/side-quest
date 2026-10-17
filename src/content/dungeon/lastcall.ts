import type { CardDefinition } from "../../game/types";
import {
  boss,
  closing,
  d20,
  moves,
  pair,
  queue,
  vs,
  BOSS_NEED,
} from "./shared";

// The run's ends: the rival party, the Quarter-Zips (Brad, Chad and Thad,
// doing the same crawl in matching quarter-zips), who cut the queue at the
// door and come back for your table at closing time; and Last Call, whose
// bosses close both third floors.

/** The queue at the door, before the first floor. One fight; the winner
 * goes in first with whatever the loser dropped. Pub Crawl only. */
export const queueCards: CardDefinition[] = [
  queue(
    "knows-the-owner",
    "Brad Knows the Owner",
    "The Quarter-Zips cut the line. Brad says his cousin knows the owner. Name-drop harder. Roll d20.",
    vs(
      "His cousin really does know the owner. Drink 3.",
      "The owner has never heard of him. Give 3 to the best name-dropper here.",
    ),
    { loot: "draught" },
  ),
  queue(
    "fake-id",
    "Chad's Fake ID",
    "Chad's ID says he's 41 and from Canada. Do a Canadian accent for 15 seconds. Worse than his: drink 3.",
    null,
    { loot: "smoke" },
  ),
  queue(
    "were-together",
    "We're Together",
    "Thad cut in front of you by telling the bouncer 'we're together'. You're not. Roll 2d6 to argue.",
    pair(
      "The bouncer believes him. Drink 3.",
      "The bouncer believes you. Give 3.",
      "A pair! The bouncer sends them to the back. Everyone else drinks 2.",
    ),
    { loot: "shield" },
  ),
  queue(
    "group-name",
    "The Group Name",
    "The Quarter-Zips have a group name, a hashtag and matching vests. Look cooler. Roll d20.",
    vs(
      "Nobody could look cooler. Drink 3.",
      "Your vest is a jacket. It's better. Give 3.",
    ),
    {
      loot: "die",
      jinx: {
        name: "Champ",
        rule: "Everyone calls the jinxed player 'Champ', like Brad does. Slip: drink 1.",
      },
    },
  ),
  queue(
    "the-list",
    "The Guest List",
    "Brad is on the list. You're on a napkin the bouncer is holding. Roll d6.",
    moves(
      [
        "The napkin blows away. Drink 3.",
        "The bouncer blows his nose on the napkin. Drink 3.",
      ],
      [
        "The napkin holds up. Give 2.",
        "You're on the list, and Brad's spelled wrong. Give 3.",
        "You're on the list twice. Give 3.",
        "Brad's off the list. Everyone else drinks 1.",
      ],
    ),
    { loot: "draught" },
  ),
];

/** Closing time, after the third floor: the Quarter-Zips are back for your
 * table, dealt again until beaten twice. Pub Crawl only. */
export const closingCards: CardDefinition[] = [
  closing(
    "last-table",
    "The Last Table",
    "The Quarter-Zips want your table. Brad is already sitting on it. Roll d20.",
    vs("Brad sits on you. Drink 4.", "You tip the table, gently. Give 4.", {
      crit: "You tip Brad off it. Everyone else drinks 3.",
    }),
  ),
  closing(
    "the-boys-toast",
    "A Toast to the Boys",
    "Thad is giving a toast about 'the boys', eleven minutes in. Roll d20 to cut him off.",
    vs(
      "It's moving, somehow. Raise a glass and drink 4.",
      "You raise a glass mid-sentence and everyone drinks. Give 4.",
      { fumble: "You cry at it. Finish your drink." },
    ),
  ),
  closing(
    "last-round",
    "Chad's Last Round",
    "Chad ordered the last round, for the boys only. Intercept it. Roll d20.",
    vs(
      "He drinks yours in front of you. Drink 4.",
      "You carry the tray to your own table. Give 4.",
      {
        crit: "You carry the tray, and Chad tips you. Everyone else drinks 3.",
      },
    ),
    {
      jinx: {
        name: "For the Boys",
        rule: "The jinxed player says 'for the boys' before every drink. Forget: drink 1.",
      },
    },
  ),
  closing(
    "venmo-request",
    "Brad's Venmo Request",
    "Brad has Venmo-requested everyone here $14.50 for 'vibes'. Roll d20.",
    vs(
      "You accidentally pay it. Drink 4.",
      "You request $15 back for 'better vibes'. Give 4.",
    ),
    { curse: "bleed" },
  ),
  closing(
    "dance-off",
    "The Dance-Off",
    "The Quarter-Zips call a dance-off. The whole bar is watching. Roll d6.",
    moves(
      [
        "Brad does the worm. You can't follow that. Drink 4.",
        "You pull something. Drink 4.",
        "Thad dips you. You let him. Drink 4.",
      ],
      [
        "You do the robot, and mean it. Give 4.",
        "You moonwalk out the door and back. Give 4.",
        "Everyone in the bar joins your dance. Everyone else drinks 2.",
      ],
    ),
  ),
];

/** Last Call: one boss of eight, three swings, to win the crawl. They play
 * as ordinary bosses in the plain modes. */
export const lastCallBosses: CardDefinition[] = [
  boss(
    2,
    "last-call-lich",
    "The Last Call Lich",
    "Lights up. Music off. It's last call forever unless you kill it. Roll d20.",
    d20(
      BOSS_NEED[2],
      "Closing time. Everyone drinks 4.",
      "It flickers. Give 5.",
      { crit: "The music comes back on. Everyone else drinks 4." },
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
      { crit: "You rob the tip jar. Everyone else drinks 4." },
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
      { crit: "Darkness again. Everyone else drinks 4." },
    ),
    { curse: "hex" },
  ),
  boss(
    2,
    "two-am-kebab",
    "The 2 a.m. Kebab",
    "It's been turning since 8 p.m. It knew you'd come. It's the size of a door. Roll d20.",
    d20(
      BOSS_NEED[2],
      "Garlic sauce, everywhere. Drink 5.",
      "You carve it down to the spit. Give 5.",
      {
        crit: "You eat the whole thing, standing. Everyone else drinks 4.",
        fumble: "You drop it on the floor and eat it anyway. Drink 8.",
      },
    ),
  ),
  boss(
    2,
    "surge-pricing",
    "Surge Pricing",
    "The ride home costs $94 and it's sentient. It's circling the block, laughing. Roll d20.",
    d20(
      BOSS_NEED[2],
      "Surge goes up again. Drink 5.",
      "You find a driver who's going your way. Give 5.",
      { crit: "Free ride. Everyone else drinks 4." },
    ),
    { curse: "bleed" },
  ),
  boss(
    2,
    "the-group-chat",
    "The Group Chat",
    "Tomorrow's group chat, awake early, reading tonight back to you. Roll d20.",
    d20(
      BOSS_NEED[2],
      "Someone posts the video. Drink 6.",
      "You leave the chat. It can't follow. Give 5.",
      { crit: "You mute it forever. Everyone else drinks 4." },
    ),
    {
      jinx: {
        name: "Screenshot",
        rule: "The jinxed player narrates everything they do, like a voice note. Forget: drink 1.",
      },
    },
  ),
  boss(
    2,
    "the-morning-after",
    "The Morning After",
    "Your hangover from tomorrow came back in time to stop you. It's enormous. Roll d20.",
    d20(
      BOSS_NEED[2],
      "It lands a preview. Drink 5 and a glass of water.",
      "You promise it a greasy breakfast. It backs off. Give 5.",
      {
        crit: "You were never going to have a hangover. Everyone else drinks 4.",
      },
    ),
  ),
];
