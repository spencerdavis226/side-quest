import type { CardDefinition, PackDefinition, Category } from "../game/types";
import { customVipCards } from "./custom";

// VIP night: for a birthday, a bachelorette, or anyone whose night it is. The
// group crowns one guest of honor (the VIP) before playing, and every card in
// this pack favors, roasts, or ropes in that one person. Cards stay self-
// contained: each rule names the VIP and an immediate consequence.
const vipCard = (
  id: string,
  title: string,
  category: Category,
  rules: string,
): CardDefinition => ({
  version: 1,
  id: `vip.${id}`,
  title,
  category,
  rules,
  artwork: "art/tankard.webp",
});

export const vipCards: CardDefinition[] = [
  vipCard(
    "toast",
    "Dirty Toast",
    "sip",
    "Clockwise, toast the VIP with something their mom shouldn't hear. Then the VIP drinks 2.",
  ),
  vipCard(
    "sidekick",
    "Choose a Sidekick",
    "sip",
    "The VIP picks a sidekick who drinks with them for the rest of the game and holds their hair later.",
  ),
  vipCard(
    "tax",
    "The VIP Tax",
    "sip",
    "The VIP drinks 3 and names the worst person they've ever kissed.",
  ),
  vipCard(
    "fan-club",
    "Hottest Quality",
    "group",
    "Clockwise, name the VIP's hottest quality. The VIP drinks 1 for each one they agree with.",
  ),
  vipCard(
    "standing-ovation",
    "Standing Ovation",
    "group",
    "Give the VIP a standing ovation. Last to stand drinks 3. The VIP bows and drinks 1.",
  ),
  vipCard(
    "favors",
    "Seen It All",
    "group",
    "Anyone who's seen the VIP naked drinks 2. The VIP drinks 1 for each of them.",
  ),
  vipCard(
    "gift",
    "Gift Registry",
    "category",
    "Clockwise, name sex toys you'd gift the VIP. First repeat or blank drinks 2.",
  ),
  vipCard(
    "superlatives",
    "Cause of Death",
    "category",
    "Clockwise, name ways the VIP could die tonight. First repeat or blank drinks 2.",
  ),
  vipCard(
    "roast",
    "The Roast",
    "challenge",
    "Clockwise, roast the VIP. The VIP picks the meanest one; its author gives 3.",
  ),
  vipCard(
    "title",
    "Stage Name",
    "challenge",
    "Give the VIP a stripper name. The VIP drinks 2 and introduces themselves with it.",
  ),
  vipCard(
    "excellency",
    "Daddy's Home",
    "rule",
    "For the rest of the game, everyone calls the VIP Daddy or Mommy. Forget: drink 2.",
  ),
  vipCard(
    "never-alone",
    "Never Drink Alone",
    "rule",
    "For the rest of the game, the VIP picks someone to join every drink they take.",
  ),
  ...customVipCards,
];

export const vipPack: PackDefinition = {
  version: 1,
  id: "vip",
  logo: "art/packs/vip.svg",
  title: "VIP night",
  description:
    "For a birthday, a bachelorette, or just someone's night. Crown one guest of honor and let every card favor or roast the VIP.",
  cardIds: vipCards.map((card) => card.id),
};
