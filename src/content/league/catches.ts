// The League's throws (owner, 2026-10-27: "catching a Pokémon should be
// harder and more exciting"). A beaten wild Pokémon, or a route's catch card,
// is caught by throwing a ball: one d20, and the Pokémon needs `need` or more.
// A natural 20 always catches it and a natural 1 never does. Each Pokémon has
// its own number (shy and common ones are easy, evolved and rare ones hard)
// and its own two lines, read on the card once the ball is thrown: caught,
// and fled. Both lines carry the drinks. Applied by `applyTeam`.

/** `[need, caught, fled]` by card ID without `pokemon.`. */
export const catchSheet: Readonly<Record<string, [number, string, string]>> = {
  // Route 1
  "route-pidgey": [
    5,
    "Pidgey is yours and instantly poops on your sleeve. Give 1.",
    "Pidgey flaps off with your ball. Drink 1.",
  ],
  "route-rattata": [
    5,
    "Rattata is in the ball and already chewing it. Give 1.",
    "Rattata gnaws through the ball and bolts. Drink 1.",
  ],
  "route-zigzagoon": [
    5,
    "Zigzagoon zigzags straight into the ball. Give 1.",
    "Zigzagoon zigzags away from the ball and your dignity. Drink 1.",
  ],
  "route-bidoof": [
    5,
    'Bidoof is caught and has no idea. Everyone says "Bidoof!" and gives 1.',
    "Bidoof is too dumb to be caught and wanders off. Drink 1.",
  ],
  "route-wooloo": [
    5,
    "Wooloo is caught, softly. The player with the softest voice gives 2.",
    "Wooloo rolls off the hill with your ball inside it. Drink 1.",
  ],
  "route-lechonk": [
    5,
    "Lechonk is caught and immediately wants a snack. Give 1.",
    "Lechonk snorts the ball into a bush. Drink 1.",
  ],
  "route-caterpie": [
    4,
    "Caterpie is yours and bravely stays a worm. Give 1.",
    "Caterpie inches away. You let it. Drink 1.",
  ],
  "route-oddish": [
    5,
    "Oddish is caught and gets planted in your pocket. Give 1.",
    "Oddish sprouts out of the ball's reach. Drink 1.",
  ],
  "route-diglett": [
    6,
    "Diglett is caught by its head. The rest of it was never found. Give 1.",
    "Diglett drops under the ball and pops up behind you. Drink 1.",
  ],
  "route-pichu": [
    7,
    "Pichu is caught and shocks you with joy. Give 1 and flinch.",
    "Pichu zaps the ball into the sky. Drink 1.",
  ],
  // Route 2
  "route-spearow": [
    6,
    "Spearow is caught and screams about it. Give 1.",
    "Spearow shrieks and takes your ball hostage. Drink 1.",
  ],
  "route-ekans": [
    7,
    "Ekans is caught and fits the ball perfectly. Give 1.",
    "Ekans slithers out under the door. Drink 1.",
  ],
  "route-wurmple": [
    5,
    "Wurmple is caught and bravely does nothing. Give 1.",
    "Wurmple wriggles out. Nobody sees where. Drink 1.",
  ],
  "route-starly": [
    5,
    "Starly is caught and sings on cue. Give 1.",
    "Starly sings once and is gone. Drink 1.",
  ],
  "route-lillipup": [
    5,
    "Lillipup is caught and licks your face. Give 1.",
    "Lillipup thinks the ball is a toy and keeps it. Drink 1.",
  ],
  "route-yungoos": [
    6,
    "Yungoos is caught, starving, and eats the ball's spare seam. Give 1.",
    "Yungoos swallows the bait and leaves. Drink 1.",
  ],
  "route-clefairy": [
    8,
    "Clefairy is caught and does a little dance. Everyone copies it and gives 1.",
    "Clefairy waves a finger and the ball is gone. Drink 2.",
  ],
  "route-seedot": [
    5,
    "Seedot is caught and plays dead in your bag. Give 1.",
    "Seedot rolls under a bench and stays an acorn. Drink 1.",
  ],
  "route-geodude": [
    6,
    "Geodude is caught and you carry it home like a rock. Give 1.",
    "Geodude is just a rock again. You threw a ball at a rock. Drink 1.",
  ],
  "route-snubbull": [
    6,
    "Snubbull is caught and growls like it owns you. Give 1.",
    "Snubbull growls and the ball bounces off its underbite. Drink 1.",
  ],
  // Route 3
  "route-psyduck": [
    6,
    "Psyduck is caught and has a headache about it. Give 1.",
    "Psyduck holds its head and the ball sails past. Drink 1.",
  ],
  "route-machop": [
    8,
    "Machop is caught and flexes at you. Flex back and give 2.",
    "Machop catches the ball and throws it back. Drink 2.",
  ],
  "route-shinx": [
    6,
    "Shinx is caught and its eyes glow with approval. Give 1.",
    "Shinx's spark fries the ball. Drink 1.",
  ],
  "route-roggenrola": [
    7,
    "Roggenrola is caught and hums like a speaker. Give 1.",
    "Roggenrola just sits there, uncatchable and unimpressed. Drink 1.",
  ],
  "route-pikipek": [
    6,
    "Pikipek is caught and starts hammering on the ball from inside. Give 1.",
    "Pikipek pecks the ball into a hole. Drink 1.",
  ],
  "route-nickit": [
    8,
    "Nickit is caught and is already holding your wallet. Give 2.",
    "Nickit steals the ball and runs. Drink 2.",
  ],
  "route-abra": [
    12,
    "Abra is caught asleep. It never even woke up. Give 3.",
    "Abra wakes and teleports. Look at someone; they drink 2.",
  ],
  "route-voltorb": [
    8,
    "Voltorb is caught, and the table agrees it was a ball the whole time. Give 2.",
    "Voltorb rolls off and blows up the ball. Drink 2.",
  ],
  "route-sandshrew": [
    6,
    "Sandshrew is caught and rolled up like a snack. Give 1.",
    "Sandshrew rolls away in a cloud of sand. Drink 1.",
  ],
  "route-bellsprout": [
    6,
    "Bellsprout is caught and wobbles happily. Give 1.",
    "Bellsprout whips the ball away with a vine. Drink 1.",
  ],
  // Route 4
  "route-ponyta": [
    9,
    "Ponyta is caught, and your hand smells like a hot mane. Give 2.",
    "Ponyta gallops off, leaving the ball on fire. Drink 2.",
  ],
  "route-sableye": [
    9,
    "Sableye is caught and shows you its gem. It is not for sale. Give 2.",
    "Sableye grins and vanishes with the ball. Drink 2.",
  ],
  "route-croagunk": [
    8,
    "Croagunk is caught and croaks a threat. Give 2.",
    "Croagunk pokes you with a poison finger. Drink 2.",
  ],
  "route-sandile": [
    8,
    "Sandile is caught and looks cool in sunglasses. Give 2.",
    "Sandile slides back into the sand. Drink 1.",
  ],
  "route-hawlucha": [
    10,
    "Hawlucha is caught and strikes a pose. Pose back, give 2.",
    "Hawlucha does a flip over the ball. Drink 2.",
  ],
  "route-mudbray": [
    6,
    "Mudbray is caught and kicks you anyway. Give 1.",
    "Mudbray kicks the ball into a ditch. Drink 1.",
  ],
  "route-lapras": [
    7,
    "Lapras is yours. Everyone hums its song and gives 2.",
    "Lapras sings sadly and sails off. Everyone hums it and drinks 2.",
  ],
  "route-wingull": [
    5,
    "Wingull is caught and wants your fries. Give 1.",
    "Wingull steals the ball and your lunch. Drink 1.",
  ],
  "route-ralts": [
    11,
    "Ralts is caught and can feel what you feel. Give 2, and feel it.",
    "Ralts senses the throw coming and steps aside. Drink 2.",
  ],
  "route-phanpy": [
    6,
    "Phanpy is caught and rolls around in your lap. Give 1.",
    "Phanpy rolls over the ball and flattens it. Drink 1.",
  ],
  // Route 5
  "route-haunter": [
    11,
    "Haunter is caught and licks someone. The one on your right gives 2.",
    "The ball passes right through Haunter. Drink 2.",
  ],
  "route-scyther": [
    11,
    "Scyther is caught and slices the air for show. Give 2.",
    "Scyther slices the ball in half. Drink 2.",
  ],
  "route-tauros": [
    10,
    "Tauros is caught by the horns. Give 2.",
    "Tauros charges through the ball and keeps charging. Drink 2.",
  ],
  "route-bronzor": [
    9,
    "Bronzor is caught and starts to hum. Hum along and give 2.",
    "Bronzor floats away humming. Drink 1.",
  ],
  "route-mimikyu": [
    13,
    "Mimikyu is caught. Don't lift the cloth. The one who peeks drinks 2. Give 2.",
    "Mimikyu hides under its cloth and the ball bounces. Drink 2.",
  ],
  "route-toxtricity": [
    12,
    "Toxtricity is caught and plays a power chord. Air guitar and give 2.",
    "Toxtricity plays a screeching solo and the ball slips. Drink 2.",
  ],
  "route-chansey": [
    14,
    "Chansey is caught with her egg. She hands it to someone. Give 3.",
    "Chansey runs off with her egg. Everyone who breathed drinks 2.",
  ],
  "route-tangela": [
    9,
    "Tangela is caught in its own vines. Give 2.",
    "Tangela wraps the ball up and tugs it away. Drink 2.",
  ],
  "route-spritzee": [
    9,
    "Spritzee is caught and smells awful, then wonderful. Give 2.",
    "Spritzee's perfume knocks you off. Sniff your arm and drink 2.",
  ],
  // Route 6
  "route-gyarados": [
    15,
    "Gyarados is caught. It's furious, and no one will ever say so. Give 3.",
    "Gyarados roars and Hyper Beams the ball. Everyone drinks 2.",
  ],
  "route-lucario": [
    14,
    "Lucario is caught and senses your aura. It's mostly beer. Give 3.",
    "Lucario reads your throw and moves one step. Drink 2.",
  ],
  "route-zoroark": [
    14,
    "Zoroark is caught, or it looks like it. Give 3, then check your pockets.",
    "Zoroark was an illusion. The ball hit a tree. Drink 2.",
  ],
  "route-goodra": [
    16,
    "Goodra is caught and hugs you wetly. Give 3.",
    "Goodra squelches away, leaving slime. Drink 2.",
  ],
  "route-tinkaton": [
    13,
    "Tinkaton is caught and hammers the ball flat. It stays. Give 3.",
    "Tinkaton swings her hammer and the ball flies home. Drink 2.",
  ],
  "route-salandit": [
    9,
    "Salandit is caught and wants a bonfire. Give 2.",
    "Salandit lights the ball and runs. Drink 2.",
  ],
  "route-dratini": [
    13,
    "Dratini is caught, a bit damp, and the table is moved. Give 3.",
    "Dratini slips back under the water. Drink 3.",
  ],
  "route-sudowoodo": [
    10,
    "Sudowoodo is caught, pretending to be a tree. Give 2.",
    "Sudowoodo goes stiff and the ball bonks off. Drink 2.",
  ],
  "route-rotom": [
    12,
    "Rotom is caught and enters your phone. Give 3 and check it.",
    "Rotom is in the microwave now. Drink 2.",
  ],
  "route-breloom": [
    11,
    "Breloom is caught and throws a perfect punch at nothing. Give 2.",
    "Breloom jabs the ball out of the air. Drink 2.",
  ],
  // Route 7
  "route-snorlax-awake": [
    15,
    "Angry Snorlax is caught, and still angry. Give 3.",
    "Angry Snorlax sits on the ball. The last to laugh drinks 3.",
  ],
  "route-garchomp": [
    17,
    "Gible's Dad is caught. Gible is going to be so mad. Give 4.",
    "Gible's Dad swats the ball into orbit. Drink 3.",
  ],
  "route-hydreigon": [
    17,
    "Hydreigon is caught and all three heads argue about the name. Give 4.",
    "Hydreigon's three heads each take a bite of the ball. Drink 3.",
  ],
  "route-aegislash": [
    16,
    "Aegislash is caught, shield up, sword down. Give 3.",
    "Aegislash blocks the ball with its shield. Drink 3.",
  ],
  "route-dragapult": [
    17,
    "Dragapult is caught, and its kids dive back in. Give 4.",
    "Dragapult launches its kids at the ball. Drink 3.",
  ],
  "route-kingambit": [
    16,
    "Kingambit is caught and demands a salute. Give 3.",
    "Kingambit cuts the ball in two and salutes you. Drink 3.",
  ],
  "route-eevee-gift": [
    6,
    "Eevee is yours. Pick which stone it wants out loud. Give 2.",
    "Eevee hides under the mansion's couch. Drink 2.",
  ],
  "route-gardevoir": [
    15,
    "Gardevoir is caught and bows. Someone cries. Give 3.",
    "Gardevoir teleports without a word. Drink 3.",
  ],
  "route-wailord": [
    14,
    "Wailord is caught, and the ball is somehow big enough. Give 3.",
    "Wailord is too big for the ball, the boat and the table. Drink 3.",
  ],
  // Route 8
  "route-tyranitar": [
    17,
    "Tyranitar is caught and quietly flattens a mountain. Give 4.",
    "Tyranitar flattens the ball and a mountain. Drink 3.",
  ],
  "route-metagross": [
    17,
    "Metagross is caught, four brains thinking as one. Give 4.",
    "Metagross calculates the throw and lets it miss. Drink 3.",
  ],
  "route-volcarona": [
    16,
    "Volcarona is caught and the room gets very bright. Give 3.",
    "Volcarona burns the ball to a cinder. Drink 3.",
  ],
  "route-kommo-o": [
    17,
    "Kommo-o is caught and rattles its scales. Rattle something and give 4.",
    "Kommo-o roars and the ball shatters. Drink 3.",
  ],
  "route-baxcalibur": [
    17,
    "Baxcalibur is caught and slides into the ball like a sled. Give 4.",
    "Baxcalibur freezes the ball solid and walks off. Drink 3.",
  ],
  "route-gengar": [
    15,
    "Gengar is caught and laughs at your bag. Give 3.",
    "Gengar laughs, and the ball goes through the floor. Drink 3.",
  ],
  "route-snorlax-catch": [
    12,
    "Snorlax is caught, fast asleep. It doesn't notice you carry it. Give 3.",
    "Snorlax rolls over onto the ball. Everyone gets off the road and drinks 3.",
  ],
  "route-rhyperior": [
    15,
    "Rhyperior is caught and fires a rock at nothing. Give 3.",
    "Rhyperior fires a rock and shatters the ball. Drink 3.",
  ],
  "route-electivire": [
    15,
    "Electivire is caught and charges your phone. Give 3.",
    "Electivire's shock fuses the ball. Drink 3.",
  ],
  "route-togekiss": [
    14,
    "Togekiss is caught and spreads its wings. A blessing for the table. Give 3.",
    "Togekiss drifts up out of reach. Drink 2.",
  ],
  // Victory Road
  "route-golurk": [
    15,
    "Golurk is caught and the ancient seal stays shut. Give 3.",
    "Golurk shrugs off the ball like a mosquito. Drink 3.",
  ],
  "route-onix-victory": [
    16,
    "Steelix is caught and coils into the ball in six moves. Give 3.",
    "Steelix tunnels away and the ball falls into the hole. Drink 3.",
  ],
  "route-machamp": [
    14,
    "Machamp is caught and takes four bows. Give 3.",
    "Machamp catches the ball with the first arm and returns it with the third. Drink 3.",
  ],
};
