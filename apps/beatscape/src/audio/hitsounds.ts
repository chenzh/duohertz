let ctx: AudioContext | null = null;

function getCtx() {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

export async function resumeAudio() {
  const c = getCtx();
  if (c.state === "suspended") await c.resume();
}

/** Differentiated hit tones — Perfect brighter/louder, Miss soft thud */
export function playHit(judgment: string) {
  const c = getCtx();
  const now = c.currentTime;
  const o = c.createOscillator();
  const g = c.createGain();
  o.connect(g);
  g.connect(c.destination);

  if (judgment === "perfect") {
    o.type = "sine";
    o.frequency.setValueAtTime(988, now);
    o.frequency.exponentialRampToValueAtTime(1318, now + 0.05);
    g.gain.setValueAtTime(0.11, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    o.start(now);
    o.stop(now + 0.09);
  } else if (judgment === "great") {
    o.type = "triangle";
    o.frequency.value = 740;
    g.gain.setValueAtTime(0.09, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    o.start(now);
    o.stop(now + 0.07);
  } else if (judgment === "good") {
    o.type = "sine";
    o.frequency.value = 494;
    g.gain.setValueAtTime(0.06, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    o.start(now);
    o.stop(now + 0.05);
  } else {
    o.type = "square";
    o.frequency.value = 110;
    g.gain.setValueAtTime(0.04, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    o.start(now);
    o.stop(now + 0.1);
  }
}

export function playKeyDown() {
  const c = getCtx();
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = "sine";
  o.frequency.value = 220;
  g.gain.value = 0.025;
  o.connect(g);
  g.connect(c.destination);
  o.start();
  o.stop(c.currentTime + 0.025);
}

export function playBreak() {
  const c = getCtx();
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = "sawtooth";
  o.frequency.value = 90;
  g.gain.setValueAtTime(0.05, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.14);
  o.connect(g);
  g.connect(c.destination);
  o.start();
  o.stop(c.currentTime + 0.14);
}

export function playMilestone() {
  const c = getCtx();
  const now = c.currentTime;
  for (const [i, freq] of [660, 880, 1174].entries()) {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "sine";
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, now + i * 0.04);
    g.gain.linearRampToValueAtTime(0.06, now + i * 0.04 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.12);
    o.connect(g);
    g.connect(c.destination);
    o.start(now + i * 0.04);
    o.stop(now + i * 0.04 + 0.12);
  }
}
