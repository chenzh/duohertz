import { getAudioContext, unlockAudio } from "./context";

/**
 * Conductor — the single source of truth for song time.
 *
 * Everything is driven by the Web Audio clock (`AudioContext.currentTime`), never
 * by frame time or `setTimeout`. The 3s countdown is part of the same timeline
 * (song time runs negative during the countdown), so notes start approaching in
 * perfect sync and GO lands exactly on t=0 of the audio.
 *
 * Supports pause/resume (freezes the clock), background self-heal, and the
 * Practice mode slow-down (changes playback rate without desyncing).
 */
export class Conductor {
  private ctx: AudioContext;
  private gain: GainNode;
  private buffer: AudioBuffer | null = null;
  private source: AudioBufferSourceNode | null = null;

  private _accumMs = 0; // song time; negative during countdown
  private _lastCtx = 0;
  private _rate = 1;
  private _playing = false;
  private _paused = false;
  private _finished = false;
  private _durationMs = 0;

  /** performance.now() timestamp when an active slow-down ends (0 = none). */
  pendingRateUntil = 0;

  onEnded: (() => void) | null = null;

  constructor() {
    this.ctx = getAudioContext();
    this.gain = this.ctx.createGain();
    this.gain.gain.value = 0.85;
    this.gain.connect(this.ctx.destination);
  }

  get durationMs(): number {
    return this._durationMs;
  }

  get playing(): boolean {
    return this._playing && !this._paused;
  }

  get isPaused(): boolean {
    return this._paused;
  }

  get finished(): boolean {
    return this._finished;
  }

  async load(url: string): Promise<void> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Audio load failed (${res.status})`);
    const ab = await res.arrayBuffer();
    this.buffer = await this.ctx.decodeAudioData(ab.slice(0));
    this._durationMs = this.buffer.duration * 1000;
  }

  /** Resume the AudioContext inside a user gesture. */
  async unlock(): Promise<void> {
    if (this.ctx.state === "suspended") await this.ctx.resume();
  }

  /** Begin playback with a `countdownMs` lead-in (song time starts negative). */
  begin(countdownMs = 3000): void {
    if (!this.buffer) return;
    this.stopSource();
    this._accumMs = -countdownMs;
    this._lastCtx = this.ctx.currentTime;
    this._rate = 1;
    this._playing = true;
    this._paused = false;
    this._finished = false;
    this.pendingRateUntil = 0;
    this.startSource(this._accumMs < 0 ? -this._accumMs / 1000 : 0);
  }

  /** Authoritative song time in milliseconds (negative during countdown). */
  songTimeMs(): number {
    this.update();
    return this._accumMs;
  }

  private update(): void {
    const now = this.ctx.currentTime;
    const dt = (now - this._lastCtx) * 1000;
    if (this._playing && !this._paused) {
      this._accumMs += dt * this._rate;
      if (this.pendingRateUntil && performance.now() >= this.pendingRateUntil) {
        this.pendingRateUntil = 0;
        this.setRate(1);
      }
    }
    this._lastCtx = now;
  }

  /** Practice slow-down: 0.5× for `durationMs` real milliseconds. */
  setRate(rate: number, durationMs = 0): void {
    this._rate = rate;
    if (this.source) this.source.playbackRate.value = rate;
    this.pendingRateUntil = durationMs > 0 ? performance.now() + durationMs : 0;
  }

  pause(): void {
    if (!this._playing || this._paused) return;
    this.update();
    this._paused = true;
    this.stopSource();
  }

  resume(): void {
    if (!this._playing || !this._paused) return;
    this._paused = false;
    this._lastCtx = this.ctx.currentTime;
    const offsetSec = Math.max(0, this._accumMs / 1000);
    const delaySec = this._accumMs < 0 ? -this._accumMs / 1000 : 0;
    this.startSource(delaySec, offsetSec);
  }

  /** Stop everything (leave the run). */
  stop(): void {
    this._playing = false;
    this._paused = false;
    this.stopSource();
  }

  private startSource(delaySec: number, offsetSec = 0): void {
    if (!this.buffer) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.buffer;
    src.playbackRate.value = this._rate;
    src.connect(this.gain);
    src.onended = () => {
      if (this._playing && !this._paused) {
        this._finished = true;
        this.onEnded?.();
      }
    };
    this.source = src;
    const when = this.ctx.currentTime + Math.max(0, delaySec);
    src.start(when, Math.max(0, offsetSec));
  }

  private stopSource(): void {
    if (this.source) {
      try {
        this.source.onended = null;
        this.source.stop();
      } catch {
        /* already stopped */
      }
      this.source.disconnect();
      this.source = null;
    }
  }
}

export { unlockAudio };
