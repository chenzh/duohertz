/**
 * The Late Static — multi-season broadcast program (World Bible §8).
 * Episodes carry a global week index counted from the Season 1 premiere;
 * seasons air back-to-back so the station never goes silent. Future
 * episodes stay behind a teaser until their week arrives. The tower is
 * never named on air (tone invariant, guarded by tests).
 */

export interface RadioEpisode {
  /** global sequential episode number (1-based, never resets per season) */
  ep: number;
  season: number;
  /** global week index from the Season 1 premiere (0-based) */
  week: number;
  title: string;
  /** one line shown before the episode airs */
  teaser: string;
  /** full on-air copy, one string per broadcast line */
  lines: string[];
  signoff: string;
}

export interface RadioSeason {
  number: number;
  name: string;
}

/** Friday-night Season 1 premiere; weeks roll over at local midnight. */
export const SEASON_PREMIERE_MS = new Date("2026-08-28T00:00:00").getTime();

export const RADIO_SEASONS: RadioSeason[] = [
  { number: 1, name: "Call-in" },
  { number: 2, name: "Cold Blocks" },
  { number: 3, name: "The Drop Wars" },
];

export const RADIO_EPISODES: RadioEpisode[] = [
  // ---- Season 1 "Call-in" — city on regular feed, house rules, tower tease ----
  {
    ep: 1,
    season: 1,
    week: 0,
    title: "First Light, First Static",
    teaser: "A rooftop nobody can find. A signal that never sleeps.",
    lines: [
      "This is The Late Static — broadcasting from a rooftop nobody can find, on a frequency nobody owns.",
      "You made it past the noise floor. That makes you The Listener. Congratulations — it doesn't pay, but the city can hear you now.",
      "The rules are simple: show up, stay loud, keep your block fed. We'll handle the rest.",
    ],
    signoff: "— JUNO",
  },
  {
    ep: 2,
    season: 1,
    week: 1,
    title: "House Rules",
    teaser: "In Phase, Locked, Drifting, Dropout — etiquette, per Loud Code.",
    lines: [
      "House rules, per Loud Code §3: stay In Phase, ride your Streak, and if you Dropout, the block hears it. No pressure.",
      "TORQUE runs the beginner sets. Scary-looking, gentlest voice on this station. Loud is a love language — his words, not mine.",
      "ATLAS built this board out of tower scrap and spite. Respect the dial.",
    ],
    signoff: "— JUNO, with the crew",
  },
  {
    ep: 3,
    season: 1,
    week: 2,
    title: "The Quiet Block",
    teaser: "Forty-eight hours of silence. We don't say the H-word on air.",
    lines: [
      "Public service note: a block left without music for two nights starts to fade. First the haze, then the fog, then you can't remember the melody.",
      "That's not superstition. That's the Hush. We don't say the word lightly, and we never let it finish a sentence.",
      "So here's the ask: one song a day. Yours, preferably. Keep your block loud.",
    ],
    signoff: "— JUNO, The Late Static",
  },
  {
    ep: 4,
    season: 1,
    week: 3,
    title: "Chrome Yard Confidential",
    teaser: "Low end, lug nuts, and a gong made of hubcaps.",
    lines: [
      "Field recording tonight: Chrome Yard, where TORQUE turns scrap into low end and calls it charity.",
      "He wired a gong out of hubcaps. It rings in B flat. The whole yard shows up when it does.",
      "If you hear thunder that keeps time — that's home.",
    ],
    signoff: "— TORQUE, Chrome Yard",
  },
  {
    ep: 5,
    season: 1,
    week: 4,
    title: "Overnight Drive",
    teaser: "Windows down. City on wire. Nobody tailing you.",
    lines: [
      "Column tonight: Overnight Drive. All signal, no stops — the good kind of empty.",
      "ATLAS picked the set. Quote: 'Give me a wave and I'll find its shape.' Then handed me eleven songs shaped like streetlights.",
      "Request line's open. You know the ritual.",
    ],
    signoff: "— JUNO, Overnight Drive",
  },
  {
    ep: 6,
    season: 1,
    week: 5,
    title: "The Tower Problem",
    teaser: "ATLAS checked twice. It's still not there.",
    lines: [
      "Week six. The city's louder than when we started — your doing, all of it.",
      "One thing off the record: ATLAS says the tower uptown doesn't show up on any frequency. They checked twice. It's still not there.",
      "Don't ask which tower. Next record.",
    ],
    signoff: "— JUNO",
  },
  {
    ep: 7,
    season: 1,
    week: 6,
    title: "The Board Speaks",
    teaser: "Midnight refresh. Some of you have homework.",
    lines: [
      "The Board refreshed at midnight, same as every week. Some of you found your block on it. The rest of you have homework.",
      "Full Broadcast puts your name up in lights. Dropout gets you a phone call from TORQUE. He uses his nice voice. It's worse.",
      "No deals on this station — you play your way up or you don't play.",
    ],
    signoff: "— The Late Static",
  },
  {
    ep: 8,
    season: 1,
    week: 7,
    title: "Sign-Off, For Now",
    teaser: "Static doesn't die. It waits.",
    lines: [
      "Season close. Eight weeks, one city, still loud. You did that, Listener.",
      "Small thing before we go: the ON AIR sign switched itself off last night. It came back on. We're choosing not to look into it.",
      "Never play the same set twice — so we won't. Season two is already humming. Stay tuned.",
    ],
    signoff: "— JUNO, The Late Static",
  },
  // ---- Season 2 "Cold Blocks" — four rescue districts, three musicians, honest math ----
  {
    ep: 9,
    season: 2,
    week: 8,
    title: "Cold Open",
    teaser: "We played Glass Rim last night. Night Grid heard the silence instead.",
    lines: [
      "Season two. No highlight reel this time — we opened at Glass Rim and Night Grid went quiet while we were on stage.",
      "Four blocks, three of us. That math was never going to work. Season one we called it a schedule. Tonight we're calling it what it is.",
      "We won't save every block this season. We'll be honest about the ones we miss. Stay loud anyway.",
    ],
    signoff: "— JUNO",
  },
  {
    ep: 10,
    season: 2,
    week: 9,
    title: "Triage",
    teaser: "The schedule, published. The arithmetic, personal anyway.",
    lines: [
      "New rule at the station: the route goes up a week early. If your block's not on it, it's not personal — it's arithmetic.",
      "ATLAS routes us by where the hiss sits thickest. The map doesn't care how anybody feels about it.",
      "Complaints go to the request line. We read every one. We can't play them all.",
    ],
    signoff: "— The Late Static",
  },
  {
    ep: 11,
    season: 2,
    week: 10,
    title: "The Missed Call",
    teaser: "Someone called twice last week. We were mid-set both times.",
    lines: [
      "Someone called the station twice last week. Both times we were across town with guitars in our hands.",
      "Their block is marked now. If that was your call — we heard you. We're sorry. That's not a lyric, it's a statement.",
      "TORQUE smashed a cymbal about it. Then he tuned it and played it anyway. That's the whole method.",
    ],
    signoff: "— JUNO, The Late Static",
  },
  {
    ep: 12,
    season: 2,
    week: 11,
    title: "Glass Rim Gets Loud",
    teaser: "The brightest block on the map never calls in.",
    lines: [
      "Glass Rim offered real money for a Thursday residency. Residentials first — that's the rule. So Glass Rim gets the leftovers.",
      "Brightest block on the map, quietest on the request line. Nobody there has ever called in once. Think about that.",
      "We'll play there when they call like everybody else. Until then — next record.",
    ],
    signoff: "— TORQUE, Chrome Yard",
  },
  {
    ep: 13,
    season: 2,
    week: 12,
    title: "Overnight Drive: Fog Edition",
    teaser: "Half the route is marked. We drove it anyway.",
    lines: [
      "Overnight Drive, fog edition. Half the route is marked, and the streetlights hum off-key. ATLAS says that's the Hush settling in for winter.",
      "We drove it anyway. Windows down, low end up. Loud is a love language, and tonight the city needed to hear it said out loud.",
      "Request line's open. Tell us which block to light up next.",
    ],
    signoff: "— JUNO, Overnight Drive",
  },
  {
    ep: 14,
    season: 2,
    week: 13,
    title: "Static Check",
    teaser: "Same tower. Same single tone. This time they pinged back.",
    lines: [
      "Off the record, again: ATLAS got pinged a second time. Same tower, same single tone, no message in it.",
      "This time they pinged back. Once. Nothing came of it — and ATLAS says 'nothing' in a tone this station doesn't love.",
      "Don't ask. Next record.",
    ],
    signoff: "— JUNO",
  },
  {
    ep: 15,
    season: 2,
    week: 14,
    title: "The Fourth Chair",
    teaser: "Station census: you're carrying more blocks than we are.",
    lines: [
      "Station census, mid-season: you've fed more blocks since September than the three of us combined. The math works because of you.",
      "There's a fourth chair in this studio. It's not for a musician. It's been yours since episode one.",
      "Keep your block loud. That's the job. Truth is, you're better at it than we are.",
    ],
    signoff: "— JUNO, with the crew",
  },
  {
    ep: 16,
    season: 2,
    week: 15,
    title: "Sign-Off, Louder",
    teaser: "The sign stayed dark a full minute this time.",
    lines: [
      "Season close, take two. Four blocks, three of us, and a city full of you — still louder than the day we found it.",
      "The ON AIR sign flickered again last night. This time it stayed dark for a full minute. We still didn't look into it. We're getting good at not looking.",
      "Season three writes itself: the drop wars are coming. See you at 03:03. Stay tuned.",
    ],
    signoff: "— JUNO, The Late Static",
  },
  // ---- Season 3 "The Drop Wars" — one golden slot, a band almost splits, a listener stitches it back ----
  {
    ep: 17,
    season: 3,
    week: 16,
    title: "The 03:03 Rule",
    teaser: "Ten minutes a night when the whole city listens.",
    lines: [
      "Every night there's a slot when the Grid carries farthest: 03:03. Ten minutes when every block hears you at once.",
      "This season the slot's up for grabs — and some of the players competing for it would rather we didn't show up at all.",
      "The crew's unified. Mostly. Ask again next week.",
    ],
    signoff: "— JUNO",
  },
  {
    ep: 18,
    season: 3,
    week: 17,
    title: "The Offer, In Writing",
    teaser: "Glass Rim came back. This time with paperwork.",
    lines: [
      "Glass Rim came back. Not a request this time — a contract. Residency, real money, gear that isn't held together with electrical tape, a floor that isn't a rooftop.",
      "There's a clause about exclusivity. There is always a clause.",
      "TORQUE wants the gear. ATLAS wants nothing to do with any of it. I want both of them to be wrong. We vote Sunday.",
    ],
    signoff: "— JUNO, The Late Static",
  },
  {
    ep: 19,
    season: 3,
    week: 18,
    title: "No Broadcast This Week",
    teaser: "We fought. The set list stayed unfinished.",
    lines: [
      "No broadcast this week. We fought. The kind where the set list stays half-written and nobody says the word 'crew'.",
      "For the record: TORQUE never said take the deal. ATLAS never said burn it. And I said something about needing the money that I'm not repeating on air.",
      "Next week's set is for whoever still answers the request line. Be there.",
    ],
    signoff: "— The Late Static",
  },
  {
    ep: 20,
    season: 3,
    week: 19,
    title: "The Undercut",
    teaser: "Someone's clearing the schedule. Not us.",
    lines: [
      "Players across the city are losing their slots — cancellations from a booking office downtown, clearing room for the wars. Not us. We don't do that.",
      "ATLAS traced every drop-out. We're not naming names on air. The Board already knows.",
      "Rule three stands: if it's not yours, don't sample it. Play your own set. Steal nobody's.",
    ],
    signoff: "— ATLAS, Skyline Hook",
  },
  {
    ep: 21,
    season: 3,
    week: 20,
    title: "Old Song, Requested",
    teaser: "A call at 03:03 sharp. No name. Just a request.",
    lines: [
      "A call came in at 03:03 on the dot. No name, no block. Just: 'Play the one from the storage room. You know the one.'",
      "We haven't played that song since before we had a name. TORQUE tuned the gong. ATLAS patched in the old take. I got the words wrong. It didn't matter.",
      "If you heard it — you know. That's the set we're playing from now on.",
    ],
    signoff: "— JUNO, The Late Static",
  },
  {
    ep: 22,
    season: 3,
    week: 21,
    title: "The Vote",
    teaser: "Three of us. One contract. One quiet part, finally said.",
    lines: [
      "The vote happened. It went the way votes go when somebody finally says the quiet part out loud: we're not for sale, but we're not against eating.",
      "Glass Rim keeps its Thursdays. We keep our name. The exclusivity clause went in the recycling.",
      "If a richer offer shows up, we'll be at the same rooftop, still answering the request line.",
    ],
    signoff: "— JUNO, with the crew",
  },
  {
    ep: 23,
    season: 3,
    week: 22,
    title: "The 03:03 Set",
    teaser: "We took the slot. Then we gave it away.",
    lines: [
      "We took the 03:03 slot tonight. Played all ten minutes. No talking, no name on the marquee.",
      "Then we did the one thing the wars never planned for: we handed the slot schedule to the Board. Every player in this city gets a night. First come, no sabotage, no office downtown deciding who's loud.",
      "That's how you win a drop war. You stop having one.",
    ],
    signoff: "— TORQUE, Chrome Yard",
  },
  {
    ep: 24,
    season: 3,
    week: 23,
    title: "Sign-Off, Season Three",
    teaser: "During the 03:03 set, the tower lit up. All of it.",
    lines: [
      "Season close, take three. The wars are over, the slot belongs to the city, and the crew still argues about everything except the music.",
      "One last thing, because you've earned it: last night, mid-set, every light on the tower uptown came on at once. For ten minutes. Then they went out. ATLAS counted. We're still not looking into it.",
      "Year one's done. The Late Static stays on air. Keep your block loud — we'll keep the light on. Stay tuned.",
    ],
    signoff: "— JUNO, The Late Static",
  },
];
