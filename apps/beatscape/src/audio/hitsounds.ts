let ctx: AudioContext | null = null;

function getCtx() {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

export async function resumeAudio() {
  const c = getCtx();
  if (c.state === "suspended") await c.resume();
}

export function playHit(judgment: string) {
  const c = getCtx();
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = "sine";
  o.frequency.value = judgment === "perfect" ? 880 : judgment === "great" ? 660 : 440;
  g.gain.value = 0.08;
  o.connect(g);
  g.connect(c.destination);
  o.start();
  o.stop(c.currentTime + 0.06);
}

export function playKeyDown() {
  const c = getCtx();
  const o = c.createOscillator();
  const g = c.createGain();
  o.frequency.value = 220;
  g.gain.value = 0.03;
  o.connect(g);
  g.connect(c.destination);
  o.start();
  o.stop(c.currentTime + 0.03);
}

export function playBreak() {
  const c = getCtx();
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = "square";
  o.frequency.value = 120;
  g.gain.value = 0.06;
  o.connect(g);
  g.connect(c.destination);
  o.start();
  o.stop(c.currentTime + 0.12);
}
