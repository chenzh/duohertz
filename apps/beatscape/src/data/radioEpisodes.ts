/**
 * The Late Static — written broadcast transcripts (World Bible §8).
 * Episodes use a global week index from the Season 1 premiere. Future
 * transcripts stay behind a teaser until their week arrives.
 */

export type RadioSpeaker = "JUNO" | "ATLAS" | "TORQUE";

export interface RadioLine {
  speaker: RadioSpeaker;
  text: string;
}

export interface RadioEpisode {
  /** Global sequential episode number (1-based, never resets per season). */
  ep: number;
  season: number;
  /** Global week index from the Season 1 premiere (0-based). */
  week: number;
  title: string;
  /** One line shown before the episode airs. */
  teaser: string;
  lines: RadioLine[];
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
  // Season 1: a working station, a fragile city, and three people learning to listen.
  {
    ep: 1, season: 1, week: 0,
    title: "First Light, First Static",
    teaser: "One caller. A broken cable. Three minutes to get the station back.",
    lines: [
      { speaker: "JUNO", text: "This is The Late Static. Music keeps this city lit, and our transmitter has picked a terrible time to quit." },
      { speaker: "ATLAS", text: "The transmitter is fine. The return cable isn't. We can hear the caller; they can't hear us." },
      { speaker: "TORQUE", text: "Found the break. Give me the spare lead." },
      { speaker: "JUNO", text: "The one holding the window shut?" },
      { speaker: "TORQUE", text: "Window can have my jacket. Pass the lead." },
      { speaker: "ATLAS", text: "Connected. JUNO, try the mic. Gently." },
      { speaker: "JUNO", text: "Still there, Listener? Good. We're NIGHTSHIFT. That was our sound check, apparently. What does your block sound like?" },
    ],
    signoff: "The Late Static · First transmission restored",
  },
  {
    ep: 2, season: 1, week: 1,
    title: "House Rules",
    teaser: "The street goes dark every time TORQUE hits the bass drum.",
    lines: [
      { speaker: "JUNO", text: "The studio's back. The street relay cuts out every time the bass comes in. Suggestions that don't involve a new relay?" },
      { speaker: "TORQUE", text: "I can give it more power." },
      { speaker: "ATLAS", text: "It's already clipping. Less gain. Same beat." },
      { speaker: "TORQUE", text: "You're asking the drummer to turn down. Brave." },
      { speaker: "ATLAS", text: "I'm asking the drummer to reach the next street." },
      { speaker: "TORQUE", text: "All right. One, two… There. Lights stayed on." },
      { speaker: "JUNO", text: "House rule: listen before you turn it up. Someone write that above the mixer." },
      { speaker: "TORQUE", text: "And if you miss a beat, keep going. We just did." },
    ],
    signoff: "The Late Static · Street relay steady",
  },
  {
    ep: 3, season: 1, week: 2,
    title: "The Quiet Block",
    teaser: "A caller remembers the words to a song, but not the tune.",
    lines: [
      { speaker: "JUNO", text: "A caller from Night Grid remembers every word of her dad's song. Can't find the tune. She asked if we had a recording." },
      { speaker: "ATLAS", text: "Her block went two nights without music. That's when the Hush starts taking sound memories. A working streetlight doesn't mean the block is safe." },
      { speaker: "TORQUE", text: "Do we have the song?" },
      { speaker: "JUNO", text: "No. We have a tape her dad left at the station. She's coming over to see what's on it." },
      { speaker: "ATLAS", text: "Don't promise it'll bring the tune back." },
      { speaker: "JUNO", text: "I promised we'd listen with her. I can keep that one." },
    ],
    signoff: "The Late Static · Night Grid request log",
  },
  {
    ep: 4, season: 1, week: 3,
    title: "Chrome Yard Confidential",
    teaser: "One hubcap becomes an instrument. The neighbors have notes.",
    lines: [
      { speaker: "TORQUE", text: "Made a gong out of a hubcap. Before anyone asks: my van, my hubcap. The wheel still works." },
      { speaker: "ATLAS", text: "It's almost B-flat." },
      { speaker: "TORQUE", text: "Almost is pretty good for a van." },
      { speaker: "JUNO", text: "The shop next door asked if rehearsal could start after their last customer leaves." },
      { speaker: "TORQUE", text: "Sure. I'll move the kit inside until then." },
      { speaker: "ATLAS", text: "And tune the gong?" },
      { speaker: "TORQUE", text: "You can hold it. Careful of that edge. Haven't filed it yet." },
    ],
    signoff: "The Late Static · Field notes from Chrome Yard",
  },
  {
    ep: 5, season: 1, week: 4,
    title: "Overnight Drive",
    teaser: "ATLAS brings eleven tracks and refuses to put them on shuffle.",
    lines: [
      { speaker: "JUNO", text: "Up next: Overnight Drive. ATLAS picked eleven tracks. I moved one. They noticed." },
      { speaker: "ATLAS", text: "You put the loudest track after the quietest. The transition needs room." },
      { speaker: "TORQUE", text: "I liked the jump. Spilled my coffee, but I liked it." },
      { speaker: "JUNO", text: "Fine. Original order. Why does the last one stop before the chorus?" },
      { speaker: "ATLAS", text: "It doesn't stop. Listen under the train." },
      { speaker: "JUNO", text: "Oh. Leave that in." },
    ],
    signoff: "The Late Static · Overnight Drive",
  },
  {
    ep: 6, season: 1, week: 5,
    title: "The Tower Problem",
    teaser: "Every roof has a signal. One tower doesn't.",
    lines: [
      { speaker: "ATLAS", text: "The tower uptown has no signal. I checked from two roofs with two receivers." },
      { speaker: "JUNO", text: "Maybe they enjoy a quiet evening." },
      { speaker: "ATLAS", text: "Quiet still has a noise floor. This didn't." },
      { speaker: "TORQUE", text: "Want company for the next check?" },
      { speaker: "ATLAS", text: "Yes. Outside only. And bring the analog meter." },
      { speaker: "JUNO", text: "Leave the time and route on my desk. I'd like this mystery back before sound check." },
    ],
    signoff: "The Late Static · Signal survey, unresolved",
  },
  {
    ep: 7, season: 1, week: 6,
    title: "The Board Speaks",
    teaser: "A name on the lights. A practice set nobody has to see.",
    lines: [
      { speaker: "JUNO", text: "The Board's up. City scores in lights. TORQUE has been staring at it for ten minutes." },
      { speaker: "TORQUE", text: "I'm trying to read it without my glasses." },
      { speaker: "ATLAS", text: "Full Combo means you never broke the chain. Great is fine. Good or Miss isn't. It doesn't mean every hit was Perfect." },
      { speaker: "JUNO", text: "There goes my speech about perfection." },
      { speaker: "TORQUE", text: "Keep a set for yourself, too. No score to chase. Play something you like until it feels good." },
      { speaker: "JUNO", text: "I'll put your glasses next to that very sensible advice." },
    ],
    signoff: "The Late Static · Board night",
  },
  {
    ep: 8, season: 1, week: 7,
    title: "Sign-Off, For Now",
    teaser: "The ON AIR sign goes dark. This time, someone checks the wiring.",
    lines: [
      { speaker: "JUNO", text: "Eight weeks in. The ON AIR sign just died. Please tell me that's the bulb." },
      { speaker: "TORQUE", text: "Loose contact. I can fix it before the next set." },
      { speaker: "ATLAS", text: "Not everything is the tower." },
      { speaker: "JUNO", text: "You say that like you've got something to add." },
      { speaker: "ATLAS", text: "One tone, from its direction. Tuesday, 03:03. I recorded it. I didn't answer." },
      { speaker: "TORQUE", text: "We'll listen together after I fix this. JUNO, hold the ladder." },
      { speaker: "JUNO", text: "Season one ends with me holding a ladder. Sounds about right." },
    ],
    signoff: "The Late Static · End of Call-in",
  },
  // Season 2: missed visits have consequences; a route needs more than good intentions.
  {
    ep: 9, season: 2, week: 8,
    title: "Cold Open",
    teaser: "The paid gig bought an amplifier. It also cost Night Grid a visit.",
    lines: [
      { speaker: "JUNO", text: "We played Glass Rim last night. Good fee. Enough to replace the amp. While we were there, Night Grid went quiet." },
      { speaker: "TORQUE", text: "I said we could make both sets. We couldn't." },
      { speaker: "ATLAS", text: "The load-out took an hour. We hadn't arranged anyone to cover Night Grid." },
      { speaker: "JUNO", text: "I booked it. I saw the money and stopped asking questions." },
      { speaker: "TORQUE", text: "The new amp's in the van. Let's take it where we said we would." },
      { speaker: "ATLAS", text: "We can stop the quiet spreading. We don't know what they've already lost." },
      { speaker: "JUNO", text: "Then that's what we tell them. No promises we can't keep." },
    ],
    signoff: "The Late Static · Night Grid visit overdue",
  },
  {
    ep: 10, season: 2, week: 9,
    title: "Triage",
    teaser: "Three musicians can't cover four routes. The map needs help.",
    lines: [
      { speaker: "ATLAS", text: "Four districts need visits. Three of us. If the van breaks down, the entire route breaks with it." },
      { speaker: "TORQUE", text: "Two crews, then. I take the small kit." },
      { speaker: "JUNO", text: "And leave nobody at the station again? We need someone local on each route." },
      { speaker: "ATLAS", text: "The Night Grid venue has a working player. Its owner offered to run recorded sets between gigs." },
      { speaker: "TORQUE", text: "I'll show them the amp. No point leaving equipment nobody can use." },
      { speaker: "JUNO", text: "Post the route before we leave. Include who to call if we're late. People shouldn't have to guess whether we're coming." },
    ],
    signoff: "The Late Static · Revised route posted",
  },
  {
    ep: 11, season: 2, week: 10,
    title: "The Missed Call",
    teaser: "Two unanswered calls. An apology won't repair the phone line.",
    lines: [
      { speaker: "JUNO", text: "I called back the woman from Night Grid. She rang twice while we were loading out. Nobody picked up." },
      { speaker: "TORQUE", text: "How is she?" },
      { speaker: "JUNO", text: "The tape wasn't her dad's song. Then we missed her calls. She wanted to know why we had a request line if nobody answered it." },
      { speaker: "ATLAS", text: "Fair. I've connected a recorder. We can leave a message with the next visit time." },
      { speaker: "JUNO", text: "I told her that. She said she'll believe it when we show up." },
      { speaker: "TORQUE", text: "Then we show up. Leave room for her to be angry when we do." },
    ],
    signoff: "The Late Static · Request line repaired",
  },
  {
    ep: 12, season: 2, week: 11,
    title: "Glass Rim Gets Loud",
    teaser: "A Thursday residency sounds different when the van needs repairs.",
    lines: [
      { speaker: "TORQUE", text: "Glass Rim wants us back on Thursdays. Regular money. The van needs brakes, and I can't keep patching the kick drum." },
      { speaker: "ATLAS", text: "Every Thursday takes us off the other routes." },
      { speaker: "JUNO", text: "Their venue manager called herself this time. Says the cleaners stay to hear us after their shift." },
      { speaker: "TORQUE", text: "So the people there count, too." },
      { speaker: "ATLAS", text: "I didn't say they don't. I want the dates and conditions before we answer." },
      { speaker: "JUNO", text: "I'll ask for them in writing. And a clear load-out plan. Nobody's missing another visit because we can't get the kit downstairs." },
    ],
    signoff: "The Late Static · Residency terms requested",
  },
  {
    ep: 13, season: 2, week: 12,
    title: "Overnight Drive: Fog Edition",
    teaser: "The streetlights are humming off-key. The loudest set won't help.",
    lines: [
      { speaker: "JUNO", text: "Overnight Drive, fog edition. We reached Afterhours Lane with a van full of bass. The night cook asked for something softer." },
      { speaker: "TORQUE", text: "I thought the block needed a proper kick. He'd been standing under that speaker for six hours." },
      { speaker: "ATLAS", text: "The relay needs a clear signal. It doesn't need to hurt anyone's ears." },
      { speaker: "TORQUE", text: "So I used brushes. He started humming halfway through." },
      { speaker: "JUNO", text: "Know the song?" },
      { speaker: "TORQUE", text: "No. Put the sticks down and let him finish." },
    ],
    signoff: "The Late Static · Overnight Drive",
  },
  {
    ep: 14, season: 2, week: 13,
    title: "Static Check",
    teaser: "The tower sends another tone. ATLAS answers before telling the crew.",
    lines: [
      { speaker: "ATLAS", text: "The tower sent the tone again. I sent one back." },
      { speaker: "JUNO", text: "From our transmitter?" },
      { speaker: "ATLAS", text: "My handheld. Same pitch. One second. Then our recording picked up a second pulse." },
      { speaker: "TORQUE", text: "You said we'd do the next check together." },
      { speaker: "ATLAS", text: "I thought it would stop before you got there." },
      { speaker: "JUNO", text: "It can stop. We're allowed to miss a mystery. Bring the recording home." },
      { speaker: "ATLAS", text: "I'm on my way. No more replies tonight." },
    ],
    signoff: "The Late Static · Second pulse logged",
  },
  {
    ep: 15, season: 2, week: 14,
    title: "The Fourth Chair",
    teaser: "A borrowed chair becomes the busiest seat in the studio.",
    lines: [
      { speaker: "JUNO", text: "Someone brought a folding chair to the station and stayed to sort the request slips. We got home to a readable route." },
      { speaker: "TORQUE", text: "They found two bands on the same street who'd never met. Both thought they were covering Friday. Neither had Saturday." },
      { speaker: "ATLAS", text: "Now they have each other's number. The route has a backup." },
      { speaker: "JUNO", text: "I asked if they'd like a permanent job. They said they already have one." },
      { speaker: "TORQUE", text: "Keep the chair. Other people can take a turn." },
      { speaker: "JUNO", text: "And we can ask before handing them the entire city." },
    ],
    signoff: "The Late Static · Local cover arranged",
  },
  {
    ep: 16, season: 2, week: 15,
    title: "Sign-Off, Louder",
    teaser: "The station loses its relay slot. Nobody told the band.",
    lines: [
      { speaker: "ATLAS", text: "Our 03:03 relay test was cut short. The booking office assigned the same slot to another band." },
      { speaker: "TORQUE", text: "Did they know we were booked?" },
      { speaker: "ATLAS", text: "I called them. They have a receipt. So do we." },
      { speaker: "JUNO", text: "Then the other band isn't the problem. Keep both receipts." },
      { speaker: "TORQUE", text: "People are calling it the drop wars. Sounds like a bad way to spend a winter." },
      { speaker: "JUNO", text: "Season two ends with two bands owed an explanation. We'll start there." },
    ],
    signoff: "The Late Static · End of Cold Blocks",
  },
  // Season 3: an offer, a rupture, and a shared schedule earned through specific work.
  {
    ep: 17, season: 3, week: 16,
    title: "The 03:03 Rule",
    teaser: "Seven venues share a relay. One office is selling the same slot twice.",
    lines: [
      { speaker: "JUNO", text: "At 03:03, the city's beat locks together for a minute. The ten-minute broadcast slot around it reaches every block. That's the slot everyone wants." },
      { speaker: "ATLAS", text: "Seven venues share the relay. They hired a booking office to coordinate the schedule. Now we have two receipts for one night." },
      { speaker: "TORQUE", text: "Can we split it? Five minutes each?" },
      { speaker: "ATLAS", text: "The other band agreed. The office refused. Their contract promises the whole slot." },
      { speaker: "JUNO", text: "So we're taking both receipts to the venues. Nobody needs to drown out another band to prove they paid." },
      { speaker: "TORQUE", text: "Can we still rehearse together? I like their drummer." },
      { speaker: "JUNO", text: "Please do. One useful thing can happen this week." },
    ],
    signoff: "The Late Static · Relay dispute opened",
  },
  {
    ep: 18, season: 3, week: 17,
    title: "The Offer, In Writing",
    teaser: "The fee would cover the station's rent. The small print would silence it.",
    lines: [
      { speaker: "JUNO", text: "Glass Rim sent the contract. A residency, a house kit, enough money to clear the station's late rent." },
      { speaker: "TORQUE", text: "Late rent? How late?" },
      { speaker: "JUNO", text: "Two months. I thought the last gig would cover it." },
      { speaker: "ATLAS", text: "Page four. No outside performances or broadcasts without approval. That includes this station." },
      { speaker: "TORQUE", text: "I want a drum that holds its tuning. I don't want someone deciding when we can use it." },
      { speaker: "JUNO", text: "I want to stop choosing which bill gets ignored. Let me ask about that clause before we tear it up." },
      { speaker: "ATLAS", text: "Ask. But don't sign for all three of us." },
    ],
    signoff: "The Late Static · Contract under review",
  },
  {
    ep: 19, season: 3, week: 18,
    title: "The Unfinished Set",
    teaser: "The rehearsal stops when JUNO asks what saying no will actually cost.",
    lines: [
      { speaker: "JUNO", text: "ATLAS, you've crossed out half the contract. What are we offering instead?" },
      { speaker: "ATLAS", text: "Our sets. Not our transmitter." },
      { speaker: "JUNO", text: "Good line. The landlord wants a number." },
      { speaker: "TORQUE", text: "Hang on. Neither of us knew about the rent until yesterday." },
      { speaker: "JUNO", text: "Because every time I bring up money, I'm the one ruining the band." },
      { speaker: "ATLAS", text: "You didn't bring it up. You hid it until there was a contract on the desk." },
      { speaker: "TORQUE", text: "Stop. Put the instruments down. We're not finishing this set like this." },
      { speaker: "JUNO", text: "Fine. I'm taking a walk. Leave the bills on the desk. All of them." },
    ],
    signoff: "The Late Static · Rehearsal log; scheduled set postponed",
  },
  {
    ep: 20, season: 3, week: 19,
    title: "The Undercut",
    teaser: "A venue says NIGHTSHIFT canceled another band's set. Nobody here did.",
    lines: [
      { speaker: "ATLAS", text: "The booking office canceled three local sets. One notice says NIGHTSHIFT requested exclusive use. We requested nothing." },
      { speaker: "JUNO", text: "Does the venue have the original booking?" },
      { speaker: "ATLAS", text: "Yes. The band let me compare it with their cancellation. Same reference number. Different terms." },
      { speaker: "TORQUE", text: "They used our name to take someone else's night?" },
      { speaker: "JUNO", text: "I'll write that we didn't authorize it. Send that with the records to all seven venue managers. Ask them to meet us." },
      { speaker: "ATLAS", text: "The other bands want to come, too." },
      { speaker: "TORQUE", text: "Good. I'll find more chairs. The folding one isn't going to cover this." },
    ],
    signoff: "The Late Static · Booking records sent to the venues",
  },
  {
    ep: 21, season: 3, week: 20,
    title: "Old Song, Requested",
    teaser: "A caller remembers their first rehearsal. The crew remembers what went wrong.",
    lines: [
      { speaker: "JUNO", text: "A caller asked for the song from TORQUE's storage room. Before we were NIGHTSHIFT. Back when the mic stand was a broom." },
      { speaker: "TORQUE", text: "Still have the broom. Better stand than broom." },
      { speaker: "ATLAS", text: "I found the take. We lose the bridge, wait for each other, then come back in." },
      { speaker: "JUNO", text: "I should've told you about the rent. I was embarrassed. Then I made you guess why I needed that deal." },
      { speaker: "ATLAS", text: "I kept saying no without helping find another answer. I'll go through the bills with you." },
      { speaker: "TORQUE", text: "The house kit can wait. Let's price a repair and see what we actually need." },
      { speaker: "JUNO", text: "After this song. I want another go at that bridge." },
    ],
    signoff: "The Late Static · Rehearsal resumed",
  },
  {
    ep: 22, season: 3, week: 21,
    title: "The Vote",
    teaser: "A smaller fee. One Thursday a month. The station stays theirs.",
    lines: [
      { speaker: "JUNO", text: "New terms from Glass Rim. One Thursday a month, no exclusivity, a smaller fee. The manager wants a full room more than she wants our station." },
      { speaker: "ATLAS", text: "Does it cover the rent?" },
      { speaker: "JUNO", text: "This month's. The landlord agreed to spread the late payments over the next four. It leaves very little for gear." },
      { speaker: "TORQUE", text: "I'll repair the kick. We'll need two extra workshop shifts a month. All three of us, this time." },
      { speaker: "ATLAS", text: "Put those on the route, too. I'm in." },
      { speaker: "TORQUE", text: "Me too." },
      { speaker: "JUNO", text: "Three yeses. I'll sign the version we all read. Then someone else can make dinner. I've had enough arithmetic." },
    ],
    signoff: "The Late Static · Revised residency approved by the crew",
  },
  {
    ep: 23, season: 3, week: 22,
    title: "The 03:03 Set",
    teaser: "The venues take back their schedule. The first shared night still needs wiring.",
    lines: [
      { speaker: "JUNO", text: "Seven venue managers, six borrowed chairs. They checked the cancellation records and ended the booking office's control of the relay schedule." },
      { speaker: "ATLAS", text: "They've approved a week of shared slots. Two bands a night. Times go on the Board, and every venue keeps a copy." },
      { speaker: "TORQUE", text: "Including the bands who lost their nights?" },
      { speaker: "JUNO", text: "They go first. We're sharing tonight with the drummer you liked." },
      { speaker: "ATLAS", text: "One catch. The switch between venues still drops the signal. I need someone on each end for the test." },
      { speaker: "TORQUE", text: "Their drummer's bringing cable. I'll take the far end." },
      { speaker: "JUNO", text: "Five minutes each, then. Leave them enough time to finish. We know what it's like to get cut off." },
    ],
    signoff: "The Late Static · First shared relay slot",
  },
  {
    ep: 24, season: 3, week: 23,
    title: "Sign-Off, Season Three",
    teaser: "The shared relay holds. Across town, one silent tower lights up.",
    lines: [
      { speaker: "ATLAS", text: "Seven nights. Every handover held. The venues voted to keep the shared schedule for another month." },
      { speaker: "TORQUE", text: "One band ran a minute over. We talked to them. Turns out that's an option." },
      { speaker: "JUNO", text: "The quiet blocks still need visits. The van still needs fuel. But we aren't the only names on the route anymore." },
      { speaker: "ATLAS", text: "There's something else. During our set, the tower uptown lit up. Ten minutes. The recording has that same two-pulse pattern." },
      { speaker: "TORQUE", text: "You going back alone?" },
      { speaker: "ATLAS", text: "No. I marked a time for all three of us. After the Glass Rim gig." },
      { speaker: "JUNO", text: "Good. For now, that's our season. The Late Static will be here when you feel like tuning in. TORQUE, your jacket's still in the window." },
      { speaker: "TORQUE", text: "Leave it. It's doing a job." },
    ],
    signoff: "The Late Static · End of The Drop Wars",
  },
];
