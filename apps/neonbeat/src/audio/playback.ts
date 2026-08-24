/** Low-latency Web Audio playback for tight chart sync */
export class SongPlayer {
  private ctx: AudioContext;
  private buffer: AudioBuffer;
  private source: AudioBufferSourceNode | null = null;
  private gain: GainNode;
  private startedAt = 0;
  private offsetSec = 0;
  private _rate = 1;
  private _playing = false;
  private _ended = false;
  onEnded: (() => void) | null = null;

  constructor(ctx: AudioContext, buffer: AudioBuffer) {
    this.ctx = ctx;
    this.buffer = buffer;
    this.gain = ctx.createGain();
    this.gain.connect(ctx.destination);
  }

  get playing() {
    return this._playing;
  }

  get ended() {
    return this._ended;
  }

  async resume() {
    if (this.ctx.state === "suspended") await this.ctx.resume();
  }

  play(fromSec = 0) {
    this.stop();
    this._ended = false;
    this.offsetSec = fromSec;
    this.source = this.ctx.createBufferSource();
    this.source.buffer = this.buffer;
    this.source.playbackRate.value = this._rate;
    this.source.connect(this.gain);
    this.source.onended = () => {
      if (this._playing) {
        this._playing = false;
        this._ended = true;
        this.onEnded?.();
      }
    };
    this.startedAt = this.ctx.currentTime;
    this.source.start(0, fromSec);
    this._playing = true;
  }

  stop() {
    if (this.source) {
      try {
        this.source.stop();
      } catch {
        /* already stopped */
      }
      this.source.disconnect();
      this.source = null;
    }
    this._playing = false;
  }

  setRate(rate: number) {
    this._rate = rate;
    if (this.source) this.source.playbackRate.value = rate;
  }

  currentMs(): number {
    if (!this._playing) return this.offsetSec * 1000;
    return (this.offsetSec + (this.ctx.currentTime - this.startedAt) * this._rate) * 1000;
  }

  get durationMs() {
    return this.buffer.duration * 1000;
  }
}

export async function decodeAudioUrl(ctx: AudioContext, url: string): Promise<AudioBuffer> {
  const res = await fetch(url);
  const ab = await res.arrayBuffer();
  return ctx.decodeAudioData(ab.slice(0));
}
