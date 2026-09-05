/** A playable opening night; separate from the calendar-based radio archive. */
export type ShiftStepId = "studio" | "yard" | "rooftop";
export type CrewVoice = "JUNO" | "ATLAS" | "TORQUE";
export type CrewLine = { speaker: CrewVoice; text: string };

export interface ShiftStep {
  id: ShiftStepId;
  title: string;
  district: string;
  node: string;
  trackId: string;
  trackTitle: string;
  speaker: CrewVoice;
  setup: string;
  before: CrewLine[];
  after: CrewLine[];
  restored: string;
}

export const FIRST_SHIFT: readonly ShiftStep[] = [
  {
    id: "studio", title: "A voice on the line", district: "Pulse Core", node: "Studio return",
    trackId: "bs-s1-05", trackTitle: "Voltage Drop", speaker: "JUNO",
    setup: "Scape City runs on sound. Tonight, the crew's radio has gone dark. You call to see if anyone is still there.",
    before: [
      { speaker: "JUNO", text: "Oh. A caller. Good. Please tell me you can hear something besides me hitting the desk." },
      { speaker: "ATLAS", text: "The backup supply works. The return channel doesn't. Stop hitting the desk." },
      { speaker: "JUNO", text: "My mum kept this board running with a pencil wedged under the fader. I'm trying to respect the tradition." },
      { speaker: "JUNO", text: "Stay on the line for one song. You hold the rhythm; I'll find the loose connection." },
    ],
    after: [
      { speaker: "ATLAS", text: "There. Return signal. We can hear the studio again." },
      { speaker: "JUNO", text: "I nearly threw this desk out last week. Don't tell my mum." },
      { speaker: "JUNO", text: "We're one working speaker short of a broadcast. TORQUE owes me a favour. Let's collect." },
    ],
    restored: "The studio meter is moving again. JUNO can hear the return channel.",
  },
  {
    id: "yard", title: "One borrowed speaker", district: "Chrome Yard", node: "Yard speaker",
    trackId: "bs-s1-06", trackTitle: "Chrome Riff", speaker: "TORQUE",
    setup: "TORQUE has a spare speaker at the yard. He also has a rather different definition of 'working'.",
    before: [
      { speaker: "TORQUE", text: "Found you a speaker. Only caught fire once." },
      { speaker: "ATLAS", text: "Twice. I've replaced the fuse. Keep the level steady this time." },
      { speaker: "TORQUE", text: "Fine. Steady. I can do steady." },
      { speaker: "TORQUE", text: "You, on the line — don't worry about a perfect take. Stay with the song. We'll work around the rough bits." },
    ],
    after: [
      { speaker: "TORQUE", text: "Still standing. No smoke. That's a good rehearsal." },
      { speaker: "ATLAS", text: "And it stayed below the limit. Thank you." },
      { speaker: "TORQUE", text: "Don't sound so surprised. I'll carry it over. You take our caller up to the roof." },
    ],
    restored: "The yard speaker holds a steady signal. TORQUE is bringing it to the station.",
  },
  {
    id: "rooftop", title: "Room on the roof", district: "Skyline Hook", node: "Rooftop relay",
    trackId: "bs-s2-02", trackTitle: "Skyline Hook", speaker: "ATLAS",
    setup: "The studio can play, but its signal stops at the next building. ATLAS is on the roof with the last length of cable.",
    before: [
      { speaker: "ATLAS", text: "Cable reaches if we move the aerial. JUNO, I need the chair." },
      { speaker: "JUNO", text: "That's the guest chair." },
      { speaker: "ATLAS", text: "Our guest is on the phone. They can have it back when the signal clears the roof." },
      { speaker: "ATLAS", text: "One more track, Listener. I'll tune the relay while you keep the beat coming." },
    ],
    after: [
      { speaker: "ATLAS", text: "Studio, speaker, relay. All three are through. I can hear another rooftop answering." },
      { speaker: "TORQUE", text: "Good. Get down here before the food goes cold." },
      { speaker: "JUNO", text: "There are three of us and four chairs. That last one's yours whenever you feel like calling." },
    ],
    restored: "The relay reaches the next rooftop. The Late Static is back on air.",
  },
] as const;

export function shiftStep(id: unknown): ShiftStep | undefined {
  return FIRST_SHIFT.find((step) => step.id === id);
}

export function shiftPlayHref(step: ShiftStep): string {
  return `/play/${step.trackId}?tier=easy&mode=casual&shift=${step.id}`;
}
