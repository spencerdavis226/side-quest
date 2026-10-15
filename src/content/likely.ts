import type { CardDefinition, PackDefinition } from "../game/types";
import { cardFactory } from "./author";

// Most Likely To: a vote pack in the spirit of Drunk Stoned or Stupid. Every
// card is one prompt; on three the whole table points, and whoever gets the
// most votes drinks. Cards are standalone: nothing is tallied between cards.
// Prompts are original, written for this table after reviewing the usual
// public "most likely to" lists for range (nights out, embarrassing moments,
// spicy, future predictions, friend-group habits).
//
// IDs are `likely.NNN` by position in this list; append new prompts at the
// end and never reuse a number.
const card = cardFactory("likely");

type Payout = 2 | 3 | "finish" | "shot";
// A retired prompt stays as `null` so later IDs keep their numbers.
type Prompt = [prompt: string, payout?: Payout] | null;

const prompts: Prompt[] = [
  // --- Nights out --------------------------------------------------------------
  ["text their ex tonight"],
  ["fall asleep first tonight"],
  ["lose their phone before the night ends"],
  ["start a fight with a bouncer", 3],
  ["order a round nobody asked for"],
  ["cry at the bar for no reason"],
  ["wake up somewhere they don't recognize", 3],
  ["drunk-buy something expensive online"],
  ["get kicked out of a bar", 3],
  ["lose a shoe on a night out"],
  ["make best friends in the bathroom line"],
  ['say "one more" and mean six'],
  ["pee somewhere they absolutely shouldn't"],
  ["show up to brunch still drunk"],
  ["shotgun a beer at a wedding", "shot"],
  ["give a toast nobody asked for"],
  ["puke and rally", 3],
  ["grab the karaoke mic uninvited"],
  ["leave their card at the bar"],
  ["drunk-text the group chat a paragraph"],
  ["fall down the stairs and call it a bit"],
  ["hit the drive-through at 3 a.m."],
  ["start drinking before noon on vacation"],
  ["forget a conversation they started"],
  ["tip 50% because they love the bartender"],
  ["go swimming fully clothed"],
  ["try to fight a goose"],
  ['swear they\'re "not even that drunk"'],
  ["still be awake at 4 a.m."],
  ["need to be carried home", "finish"],
  ["lie about how many drinks they've had"],
  ["order the most expensive shot on the menu", "shot"],
  ["dance on a table"],
  ["get cut off by a bartender", 3],
  ["become best friends with the DJ"],
  ["call their mom drunk"],
  ["sneak alcohol into a movie theater"],
  ["mix three liquors in one cup"],
  ["show up to a party empty-handed"],
  ["start a drunk heart-to-heart"],
  ["kiss a stranger at midnight"],
  ["start a conga line"],
  ["end up at an afterparty with strangers"],
  ["nap at a party and wake up for round two"],
  ["order pizza to the bar"],
  ["get a tattoo on a dare", 3],
  ["throw up in an Uber", 3],
  ["insist on one more bar"],
  ["be the last one to leave every party"],
  ["lose their friends and find new ones"],

  // --- Embarrassing ------------------------------------------------------------
  ["lock themselves out of the house"],
  null, // 52: retired 2026-10-07 ("get scammed online")
  ["text the person they were talking about", 3],
  ["reply-all to the whole company"],
  null, // 55: retired 2026-10-07 ("get lost with the GPS on")
  ["miss a flight"],
  ["go to the wrong airport"],
  null, // 58: retired 2026-10-07 ("believe a fake headline")
  null, // 59: retired 2026-10-07 ("pay for something that's free")
  ["lose rock-paper-scissors to a child"],
  ['call a teacher "mom"'],
  null, // 62: retired 2026-10-07 ("get sunburned on a cloudy day")
  null, // 63: retired 2026-10-07 ("wear a shirt inside out all day")
  null, // 64: retired 2026-10-07 ("walk into a glass door")
  null, // 65: retired 2026-10-07 ("wave back at someone who wasn't waving")
  null, // 66: retired 2026-10-07 ("get hurt opening a bag of chips")
  null, // 67: retired 2026-10-07 ("push a pull door")
  ["like a three-year-old photo by accident"],
  ["join a pyramid scheme"],
  ["get a parking ticket in their own driveway"],
  null, // 71: retired 2026-10-07 ("burn water")
  ["send a screenshot to the person in it", 3],
  null, // 73: retired 2026-10-07 ("microwave something metal")
  null, // 74: retired 2026-10-07 ("forget their own phone number")
  ["lose their wallet twice on one trip"],
  null, // 76: retired 2026-10-07 ("trip over absolutely nothing")
  ["set the kitchen on fire"],
  ["fall for an obvious prank"],
  null, // 79: retired 2026-10-07 ("get stuck in a revolving door")
  ["put the wrong fuel in a car"],
  ["butt-dial their boss"],
  ["laugh at a funeral", 3],
  null, // 83: retired 2026-10-07 ("forget the name of someone they just met")
  ['say "you too" when the waiter says enjoy'],
  ["fake-laugh at a joke they didn't get"],
  ["get caught talking to themselves"],
  ["sing the wrong lyrics with full confidence"],
  null, // 88: retired 2026-10-07 ("leave the house in slippers by accident")
  null, // 89: retired 2026-10-07 ("search for the keys in their hand")
  ["get their head stuck in something"],
  ["send a text meant for someone else"],
  ["get caught stalking someone's Instagram"],
  null, // 93: retired 2026-10-07 ("wear socks with sandals unironically")
  ["get locked in a bathroom"],
  ["show up on the wrong day"],
  null, // 96: retired 2026-10-07 ("forget why they walked into a room")
  null, // 97: retired 2026-10-07 ("lose a fight with a vending machine")
  ["go live on social media by accident"],
  null, // 99: retired 2026-10-07 ("lose their car in a parking garage")
  ["call 911 by accident"],

  // --- Stoned ------------------------------------------------------------------
  ["eat an entire pizza alone"],
  null, // 102: retired 2026-10-07 ("forget what they were saying mid-sentence")
  null, // 103: retired 2026-10-07 ("rewatch the same show for the tenth time")
  ["believe in aliens with their whole chest"],
  null, // 105: retired 2026-10-07 ("spend 20 minutes choosing a snack")
  ["have a deep conversation with a dog"],
  ["order delivery twice in one night"],
  ["laugh at nothing for five straight minutes"],
  ["start a conspiracy podcast"],
  null, // 110: retired 2026-10-07 ("put the milk in the cupboard")
  ["pitch a genius business idea at 2 a.m."],
  ["get paranoid about a cop who isn't there"],
  null, // 113: retired 2026-10-07 ("watch nature documentaries for fun")
  ["buy crystals and mean it"],
  null, // 115: retired 2026-10-07 ("take three hours to get ready")
  null, // 116: retired 2026-10-07 ("get obsessed with a new hobby for a month")
  ['reply "lol" to a serious text'],
  null, // 118: retired 2026-10-07 ("eat cereal for dinner")
  ["explain the universe to a bartender"],
  null, // 120: retired 2026-10-07 ("name their houseplants")
  ["get distracted by a bird mid-argument"],
  ['say "bro, what if…" the most'],
  null, // 123: retired 2026-10-07 ("play one album all night")
  ["fall asleep during a movie they picked"],
  ["eat something off the floor"],
  ["own a bong with a name"],
  ["raid someone else's fridge uninvited"],
  ["think they can talk to animals"],
  null, // 129: retired 2026-10-07 ("forget their own birthday")
  ["order half the menu at a drive-through"],

  // --- Spicy -------------------------------------------------------------------
  ["marry someone they met on vacation", 3],
  ["get back with their ex", 3],
  ["fall in love on a dating app in a week"],
  ["date two people at once", 3],
  ["get caught sneaking out of someone's place"],
  ["have a secret OnlyFans", 3],
  ["send a risky photo to the wrong person", "shot"],
  ["hook up with a coworker", 3],
  ["slide into a celebrity's DMs"],
  ["get married in Vegas"],
  ["have a crush on someone in this room", "shot"],
  ["ghost someone after a great date"],
  ["have the weirdest search history", 3],
  ["keep a dating app open just to look"],
  ["write a love letter to a celebrity"],
  ["propose in public"],
  null, // 147: retired 2026-10-07 ("cry at a romcom")
  ["plan the wedding before the second date"],
  ["get walked in on", 3],
  ["flirt their way out of a ticket"],
  ["have a secret second phone"],
  ["date someone twice their age"],
  ["match with a friend's ex", 3],
  ["have a celebrity hall pass ready"],
  ["be the first one here to get married"],
  ["be the last one here to get married"],
  ["elope without telling anyone"],
  ["make out in a public bathroom"],
  ["have had a crush on a cartoon character"],
  ["tattoo a partner's name on themselves", 3],
  ['send a "you up?" text this weekend'],
  ["hook up at a wedding"],
  ["date someone just for their dog"],
  ["get caught skinny-dipping", 3],
  ["fall for the bartender"],
  ["kiss someone in this room tonight", "shot"],
  ["still have their ex's hoodie"],
  ["fake a phone call to escape a date"],
  ["get a lap dance at a bachelor party"],
  ["have a type nobody understands"],

  // --- The future ----------------------------------------------------------------
  null, // 171: retired 2026-10-07 ("become famous")
  ["go to jail", 3],
  ["win the lottery and lose it all"],
  null, // 174: retired 2026-10-07 ("become a millionaire")
  ["move to another country on a whim"],
  ["end up on reality TV"],
  ["start a cult"],
  null, // 178: retired 2026-10-07 ("start a business that actually works")
  ["get canceled online"],
  ["go viral for the wrong reason"],
  null, // 181: retired 2026-10-07 ("live to 100")
  ["get abducted by aliens"],
  null, // 183: retired 2026-10-07 ("survive a zombie apocalypse")
  ["die first in a horror movie"],
  null, // 185: retired 2026-10-07 ("run for office")
  null, // 186: retired 2026-10-07 ("write a memoir nobody asked for")
  ["end up on the news"],
  ["quit their job dramatically", 3],
  null, // 189: retired 2026-10-07 ("have ten kids")
  null, // 190: retired 2026-10-07 ("retire first")
  null, // 191: retired 2026-10-07 ("become a crazy cat person")
  null, // 192: retired 2026-10-07 ("run a marathon")
  null, // 193: retired 2026-10-07 ("adopt a pet on a whim")
  ["get arrested at a protest"],
  ["own a boat they can't afford"],
  ["move back in with their parents"],
  ["become an influencer"],
  ["win a hot dog eating contest"],
  ["end up in witness protection"],
  ["buy a timeshare"],
  ["get a DUI on a lawn mower"],
  ["open a bar"],
  null, // 203: retired 2026-10-07 ("star in a commercial")
  ["become a landlord everyone hates"],
  null, // 205: retired 2026-10-07 ("follow a band on tour")
  ["live in a van by choice"],
  ["show up on a true crime show"],
  ["fake their own death", 3],
  ["get rich on crypto, then lose it"],
  ["get a face tattoo at 50"],

  // --- The group -----------------------------------------------------------------
  ["be late to their own wedding"],
  null, // 212: retired 2026-10-07 ("be the group therapist")
  ["start drama and act surprised"],
  ["know everyone's secrets"],
  ["leak a secret by accident", 3],
  null, // 216: retired 2026-10-07 ("cancel plans last minute")
  null, // 217: retired 2026-10-07 ("plan the whole trip and get no thanks")
  null, // 218: retired 2026-10-07 ("forget to pay you back")
  ["eat the last slice without asking"],
  ["hog the aux"],
  null, // 221: retired 2026-10-07 ("take 200 selfies on one trip")
  null, // 222: retired 2026-10-07 ("overpack for a weekend")
  ["get lost on a group hike"],
  ["complain all trip and have the best time"],
  null, // 225: retired 2026-10-07 ("read the group chat and never reply")
  ["send a five-minute voice memo"],
  ["start a fight in the group chat"],
  ["change the plan at the last second"],
  ["become the main character on vacation"],
  null, // 230: retired 2026-10-07 ("make a spreadsheet for the trip")
  ["fall asleep in the car every time"],
  ["pick the worst restaurant"],
  null, // 233: retired 2026-10-07 ("argue with the GPS")
  ["steal a souvenir from a hotel"],
  ["leave the party without saying goodbye"],
  ["win every argument by yelling"],
  ["talk their way into a VIP section"],
  ["lie on their resume"],
  ["cheat at board games"],
  ["take a game way too seriously"],
  ["flip the board when they lose"],
  ["blame the dice for losing", 3],
  null, // 243: retired 2026-10-07 ("read the rules and still not get it")
  null, // 244: retired 2026-10-07 ("keep score when nobody asked")
  null, // 245: retired 2026-10-07 ("bring a lucky charm to game night")
  ["be the reason we can't go back somewhere", 3],
  ["get banned from a restaurant"],
  null, // 248: retired 2026-10-07 ("have a secret talent nobody knows")
  ["survive on gas station food for a week"],
  ["be talking about this game tomorrow", "finish"],
  // --- Filthy (appended 2026-10-07) --------------------------------------------
  ["have sex in a car this year", 3],
  ["fake an orgasm tonight"],
  ["have a sex tape somewhere", "shot"],
  ["shit their pants as an adult", 3],
  ["pee in a pool on purpose"],
  ["sleep with an ex's sibling", 3],
  ["have a fetish they'd never admit", 3],
  ["blame an STD on a toilet seat", 3],
  ["own a sex swing"],
  ["fart during sex"],
  ["cry after sex"],
  ["send a nude to the family group chat", "shot"],
  ["get caught masturbating", 3],
  ["keep a burner account to spy on exes"],
  ["make out with someone just to make someone else jealous"],
  ["hook up in a bar bathroom", 3],
  ["sleep with someone whose name they never learned", 3],
  ["get kicked out of a strip club", 3],
  ["call someone the wrong name in bed", 3],
  ["puke on someone they were hooking up with", "finish"],
  ["scream during a Brazilian wax"],
  ["lie about their body count"],
  ["hook up with a married person", "shot"],
  ["date someone for their money"],
  ["pay for someone's OnlyFans", 3],
  ["pee in a sink at a party"],
  ["eat ass on a first date", 3],
  ["sext the wrong person"],
  ["have sex at a family wedding", 3],
  ["clog a hookup's toilet", 3],
  ["shit with the door open"],
  ["sniff their own fingers"],
  ["wear the same underwear three days straight"],
  ["eat a booger in public"],
  ["have a crusty sock under their bed"],
  ["fart and blame the dog"],
  ["pop a boner at the worst possible moment"],
  ["have loud tent sex on a group trip", 3],
  ["flash a cop", 3],
  ["get crabs"],
  ["have had a threesome", 3],
  ["lose a phone with a sex tape on it", "shot"],
  ["sleep with their boss", 3],
  ["jerk off at work"],
  ["get caught peeing in public", 3],
  ["throw up in their mouth and swallow it"],
  ["lick a stranger on a dare"],
  ["get a hickey after 30"],
  ["do a keg stand in a dress"],
  ["streak through somewhere public", 3],
  ["make out with a stranger in front of their date", 3],
  ["use their roommate's toothbrush"],
  ["lose their virginity somewhere embarrassing"],
  ["talk dirty and make it weird"],
  ["google their symptoms after a hookup"],
  ["shit in the woods this weekend"],
  ["get a nipple piercing on a whim"],
  ["moan in their sleep"],
  ["have sex in a pool and lie about it", 3],
  ["get walked in on by a parent", 3],
  ["fall asleep mid-hookup"],
];

const payoutText = (payout: Payout = 2) =>
  payout === "finish"
    ? "most votes finishes their drink"
    : payout === "shot"
      ? "most votes takes a shot"
      : `most votes drinks ${payout}`;

export const likelyCards: CardDefinition[] = prompts.flatMap((entry, index) =>
  entry
    ? [
        card(
          String(index + 1).padStart(3, "0"),
          "Most Likely To",
          "group",
          `${entry[0][0].toUpperCase()}${entry[0].slice(1)}. Point on three: ${payoutText(entry[1])}.`,
        ),
      ]
    : [],
);

export const likelyPack: PackDefinition = {
  version: 1,
  id: "likely",
  logo: "art/packs/likely.svg",
  title: "Most Likely To",
  description:
    "Everyone points on three; the table decides who it's talking about.",
  cardIds: likelyCards.map((card) => card.id),
};
