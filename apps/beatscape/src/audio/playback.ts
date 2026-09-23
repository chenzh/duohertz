import { getAudioContext, unlockAudio } from "./context";
import { audioLoadAborted, decodedAudioCache, type DecodedAudioLease } from "./decodedAudioCache";
import type { AudioLoadProgress } from "./earlyAudio";

/**
 * 帧内插值上限(ms)：音频时钟每 128 个采样（48k 下约 2.7ms）才推进一次，两跳之间
 * 用 performance.now() 补上墙钟时间，免得 60Hz rAF 看到台阶。上限同时防止后台
 * 标签页回来时插值跑飞——权威值永远是音频时钟，插值只是把它抹平。
 */
const MAX_INTERP_MS = 32;

/**
 * 漂移修正速度上限(ms/s)：累加器每秒最多向音源真实位置靠拢 5ms。
 * 挂起、来电、标签页节流造成的偏差因此一定会收敛，但慢到听不出跳变。
 */
const MAX_CORRECTION_MS_PER_SEC = 5;

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
 *
 * Timing model (P2-6): the accumulator `_accumMs` is what the game reads, but it
 * is only an integrator — it drifts whenever the audio clock moves without the
 * source actually playing (iOS route change, phone call, tab throttle). So every
 * start/resume/rate-change re-anchors to the audio clock, and each update pulls
 * `_accumMs` back toward that anchor's true position at a bounded rate.
 */
export class Conductor {
  private ctx: AudioContext;
  private gain: GainNode;
  /** Music bus low-pass — transparent at 20 kHz until "the drop" opens it. */
  private filter: BiquadFilterNode;
  private analyser: AnalyserNode;
  private freqData: Uint8Array<ArrayBuffer>;
  private buffer: AudioBuffer | null = null;
  private audioLease: DecodedAudioLease | null = null;
  private loadRevision = 0;
  private source: AudioBufferSourceNode | null = null;

  private _accumMs = 0; // song time; negative during countdown
  private _lastCtx = 0;
  private _rate = 1;
  /** Player-selected Practice tempo restored after any temporary assist. */
  private _baseRate = 1;
  private _playing = false;
  private _paused = false;
  private _finished = false;
  private _durationMs = 0;
  /** Absolute audio position where the scheduled source begins after its lead-in. */
  private _playbackStartMs = 0;
  /** Audio-clock deadline for a frozen re-entry countdown; -1 outside re-entry. */
  private _resumeAtCtx = -1;
  /** Remaining re-entry time retained when the countdown itself is paused. */
  private _resumeCountdownRemainingMs = 0;

  /**
   * 音频时钟锚点：在 `_anchorCtx` 这一刻，音源的真实位置正好是 `_anchorSongMs`。
   * 起播 / 恢复 / 换倍速时重设，`trueSongMs()` 用它算出音源到底走到哪了。
   */
  private _anchorCtx = 0;
  private _anchorSongMs = 0;
  /** 挂起开始时的音频时钟(<0 表示没挂起)；恢复时把这段没播出的时间补进锚点。 */
  private _suspendedAtCtx = -1;
  /** 最近一次音频时钟推进时的权威歌曲时间 + 当时的墙钟时刻（帧内插值用）。 */
  private _audioMs = 0;
  private _tickPerf = 0;
  private _disposed = false;

  /** performance.now() timestamp when an active slow-down ends (0 = none). */
  pendingRateUntil = 0;

  onEnded: (() => void) | null = null;

  constructor() {
    this.ctx = getAudioContext();
    this.gain = this.ctx.createGain();
    this.gain.gain.value = 0.85;
    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = "lowpass";
    this.filter.frequency.value = 20000;
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.75;
    this.freqData = new Uint8Array(new ArrayBuffer(this.analyser.frequencyBinCount));
    this.filter.connect(this.gain);
    this.gain.connect(this.ctx.destination);
    this.filter.connect(this.analyser);
    this.ctx.addEventListener("statechange", this.onCtxStateChange);
  }

  /**
   * AudioContext 挂起 / 恢复（iOS 来电、路由切换、系统中断）。
   * 挂起期间音源不推进，但 `currentTime` 有可能照走（iOS 就是如此）——恢复时把
   * 这段"没真正播出"的时间补进锚点，真实位置才不会跑到音源前面去。
   */
  private onCtxStateChange = (): void => {
    if (this._disposed) return;
    if (this.ctx.state === "suspended") {
      if (this._suspendedAtCtx < 0) this._suspendedAtCtx = this.ctx.currentTime;
      return;
    }
    if (this.ctx.state === "running" && this._suspendedAtCtx >= 0) {
      const lost = Math.max(0, this.ctx.currentTime - this._suspendedAtCtx);
      this._anchorCtx += lost;
      if (this._resumeAtCtx >= 0) this._resumeAtCtx += lost;
      this._suspendedAtCtx = -1;
    }
  };

  /**
   * Real-time bass energy (0–1) from the actual music — drives the field's
   * breathing so it stays locked to the audio even when BPM math would drift.
   */
  getBassEnergy(): number {
    if (!this._playing || this._paused || this._disposed) return 0;
    this.analyser.getByteFrequencyData(this.freqData);
    let sum = 0;
    const bins = Math.min(10, this.freqData.length);
    for (let i = 0; i < bins; i++) sum += this.freqData[i];
    return sum / (bins * 255);
  }

  /**
   * "The drop" — duck the music into a low-pass for a breath, then open the
   * gate. Fired when the run reaches ON AIR: the song literally opens up.
   */
  sweepOpen(ms = 380): void {
    if (this._disposed) return;
    const now = this.ctx.currentTime;
    const f = this.filter.frequency;
    f.cancelScheduledValues(now);
    f.setValueAtTime(f.value, now);
    f.exponentialRampToValueAtTime(280, now + 0.06);
    f.exponentialRampToValueAtTime(18500, now + ms / 1000);
  }

  /** Set music bus gain (0–1, PRD §6.0.13 default 0.70). */
  setMusicVolume(v: number): void {
    this.gain.gain.value = Math.max(0, Math.min(1, v));
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

  /** Real milliseconds remaining before the scheduled song source starts. */
  get countdownRemainingMs(): number {
    if (!this._playing) return 0;
    if (this._resumeCountdownRemainingMs > 0) return this._resumeCountdownRemainingMs;
    if (this._resumeAtCtx >= 0) {
      return Math.max(0, (this._resumeAtCtx - this.ctx.currentTime) * 1000);
    }
    const songRemainingMs = this._playbackStartMs - this.songTimeMs();
    return Math.max(0, songRemainingMs / Math.max(0.01, this._rate));
  }

  get finished(): boolean {
    return this._finished;
  }

  /** Current music speed; exposed so Practice slowdown never looks like an unexplained audio fault. */
  get playbackRate(): number {
    this.update();
    return this._rate;
  }

  /** Persistent run tempo; temporary miss-assist slowdown never overwrites it. */
  get basePlaybackRate(): number {
    return this._baseRate;
  }

  /** Real-time duration left on the temporary Practice assist (0 when inactive). */
  get rateRemainingMs(): number {
    this.update();
    return this.pendingRateUntil > 0
      ? Math.max(0, this.pendingRateUntil - performance.now())
      : 0;
  }

  async load(url: string, onProgress?: (progress: AudioLoadProgress) => void): Promise<void> {
    if (this._disposed) throw audioLoadAborted();
    this.audioLease?.release();
    const revision = ++this.loadRevision;
    this.buffer = null;
    this._durationMs = 0;
    const lease = decodedAudioCache.acquire(this.ctx, url, onProgress);
    this.audioLease = lease;
    try {
      const buffer = await lease.promise;
      if (this._disposed || revision !== this.loadRevision) throw audioLoadAborted();
      this.buffer = buffer;
      this._durationMs = buffer.duration * 1000;
    } catch (error) {
      // An earlier load's rejection must not release a newer subscription.
      if (this.audioLease === lease) {
        lease.release();
        this.audioLease = null;
      }
      throw error;
    }
  }

  /** Resume the AudioContext inside a user gesture. */
  async unlock(): Promise<void> {
    if (this.ctx.state === "suspended") await this.ctx.resume();
  }

  /** Begin playback with a lead-in, optionally from an absolute audio position. */
  begin(countdownMs = 3000, startAtMs = 0): void {
    if (!this.buffer) return;
    this.stopSource();
    // Reset the drop gate — every run starts with the song wide open.
    const now = this.ctx.currentTime;
    this.filter.frequency.cancelScheduledValues(now);
    this.filter.frequency.setValueAtTime(20000, now);
    const safeCountdownMs = Number.isFinite(countdownMs) ? Math.max(0, countdownMs) : 0;
    const latestStartMs = Math.max(0, this._durationMs - 1);
    this._playbackStartMs = Number.isFinite(startAtMs)
      ? Math.min(latestStartMs, Math.max(0, startAtMs))
      : 0;
    this._rate = this._baseRate;
    // Countdown is always measured in real seconds. At a slower Practice
    // tempo the song clock starts proportionally closer to the source offset,
    // then reaches it on the same audio-clock frame that playback begins.
    this._accumMs = this._playbackStartMs - safeCountdownMs * this._rate;
    this._lastCtx = now;
    this._playing = true;
    this._paused = false;
    this._finished = false;
    this._resumeAtCtx = -1;
    this._resumeCountdownRemainingMs = 0;
    this.pendingRateUntil = 0;
    this._audioMs = this._accumMs;
    this._tickPerf = performance.now();
    this.startSource(safeCountdownMs / 1000, this._playbackStartMs / 1000);
  }

  /** Authoritative absolute audio time; full runs are negative during countdown. */
  songTimeMs(): number {
    this.update();
    if (!this._playing || this._paused || this._resumeAtCtx >= 0) return this._accumMs;
    // 音频时钟值是权威的；它两跳之间用 performance.now() 插值，抹掉 128 采样的
    // 台阶，让同一帧内多次读取也能平滑推进（判定的正确性仍由音频时钟保证）。
    const ahead = Math.min(MAX_INTERP_MS, Math.max(0, performance.now() - this._tickPerf));
    return this._audioMs + ahead * this._rate;
  }

  private update(): void {
    const now = this.ctx.currentTime;
    // A resume countdown deliberately freezes chart time. The source is
    // scheduled against the same AudioContext deadline, so there is no UI
    // timer drift and no note can age into a Miss while hands return to lanes.
    if (this._resumeAtCtx >= 0) {
      if (now < this._resumeAtCtx) {
        if (now > this._lastCtx) this._lastCtx = now;
        this._audioMs = this._accumMs;
        this._tickPerf = performance.now();
        return;
      }
      this._lastCtx = Math.max(this._lastCtx, this._resumeAtCtx);
      this._resumeAtCtx = -1;
    }
    // 音频时钟还停在同一个 128 采样量子上 —— 不重复积分，交给帧内插值。
    if (now <= this._lastCtx) return;
    const dt = (now - this._lastCtx) * 1000;
    // 先记账：下面 setRate() 可能重入 update()，避免同一段时间被积分两次。
    this._lastCtx = now;
    if (this._playing && !this._paused) {
      this._accumMs += dt * this._rate;
      // P2-6：向音源真实位置软修正，误差一定会收敛，但永远听不出跳变。
      const err = this.trueSongMs(now) - this._accumMs;
      if (err !== 0) {
        const budget = (dt / 1000) * MAX_CORRECTION_MS_PER_SEC;
        this._accumMs += Math.abs(err) <= budget ? err : Math.sign(err) * budget;
      }
      if (this.pendingRateUntil && performance.now() >= this.pendingRateUntil) {
        this.pendingRateUntil = 0;
        this.setRate(this._baseRate);
      }
    }
    this._audioMs = this._accumMs;
    this._tickPerf = performance.now();
  }

  /** 音源真实位置(ms)：锚点时刻的歌曲时间 + 之后经过的音频时间 × 倍速。 */
  private trueSongMs(now: number): number {
    return this._anchorSongMs + (now - this._anchorCtx) * 1000 * this._rate;
  }

  /** 重设锚点：此刻累加器的值就是音源的真实位置（起播 / 恢复 / 换倍速时调用）。 */
  private reanchor(): void {
    this.update();
    this._anchorCtx = this.ctx.currentTime;
    this._anchorSongMs = this._accumMs;
  }

  /** Practice slow-down: 0.5× for `durationMs` real milliseconds. */
  setRate(rate: number, durationMs = 0): void {
    // 倍速一变，"锚点之后 × 倍速"的历史就不再成立，必须就地重设锚点。
    if (rate !== this._rate) this.reanchor();
    this._rate = rate;
    if (this.source) this.source.playbackRate.value = rate;
    this.pendingRateUntil = durationMs > 0 ? performance.now() + durationMs : 0;
  }

  /**
   * Set the player's persistent tempo for this run. A deliberate pause-menu
   * choice cancels any temporary miss assist immediately; subsequent starts,
   * resumes and drill repetitions all inherit the selected rate.
   */
  setBaseRate(rate: number): void {
    const safeRate = Number.isFinite(rate) ? Math.min(2, Math.max(0.25, rate)) : 1;
    this._baseRate = safeRate;
    this.pendingRateUntil = 0;
    this.setRate(safeRate);
  }

  pause(): void {
    if (!this._playing || this._paused) return;
    this._resumeCountdownRemainingMs = this._resumeAtCtx >= 0
      ? Math.max(0, (this._resumeAtCtx - this.ctx.currentTime) * 1000)
      : 0;
    this.update();
    this._resumeAtCtx = -1;
    this._paused = true;
    this.stopSource();
  }

  /** Resume now, or after an AudioContext-aligned frozen re-entry countdown. */
  resume(countdownMs = 0): void {
    if (!this._playing || !this._paused) return;
    const requestedCountdownMs = Number.isFinite(countdownMs) ? Math.max(0, countdownMs) : 0;
    const carriedCountdownMs = this._resumeCountdownRemainingMs;
    this._resumeCountdownRemainingMs = 0;
    this._paused = false;
    const now = this.ctx.currentTime;
    this._lastCtx = now;
    // During a section-practice lead-in `_accumMs` can be positive even though
    // the source has not started yet. Compare with the scheduled audio start,
    // not zero, so pausing countdown never skips the rest of it.
    const waitingForSource = this._accumMs < this._playbackStartMs;
    const resumeCountdownMs = waitingForSource
      ? 0
      : carriedCountdownMs > 0
        ? carriedCountdownMs
        : requestedCountdownMs;
    const offsetSec = Math.max(0, waitingForSource ? this._playbackStartMs : this._accumMs) / 1000;
    const initialDelaySec = waitingForSource
      ? (this._playbackStartMs - this._accumMs) / (1000 * Math.max(0.01, this._rate))
      : 0;
    const delaySec = initialDelaySec + resumeCountdownMs / 1000;
    this._resumeAtCtx = resumeCountdownMs > 0 ? now + resumeCountdownMs / 1000 : -1;
    this.startSource(delaySec, offsetSec);
  }

  /** Stop everything (leave the run). */
  stop(): void {
    this._playing = false;
    this._paused = false;
    this._resumeAtCtx = -1;
    this._resumeCountdownRemainingMs = 0;
    this.stopSource();
  }

  /**
   * 彻底拆掉音频图（离开对局 / 卸载组件时调用）。幂等，可以重复调用。
   * 与 `stop()` 的区别：`stop()` 只停音源、保留整条播放链以便恢复播放，
   * `dispose()` 会把 gain / filter / analyser 全部断开，让它们能被回收。
   */
  dispose(): void {
    if (this._disposed) return;
    this._disposed = true;
    this.loadRevision++;
    this.audioLease?.release();
    this.audioLease = null;
    this._playing = false;
    this._paused = false;
    this._resumeAtCtx = -1;
    this._resumeCountdownRemainingMs = 0;
    this.onEnded = null;
    this.pendingRateUntil = 0;
    this.ctx.removeEventListener("statechange", this.onCtxStateChange);
    this.stopSource();
    try {
      this.filter.disconnect();
      this.analyser.disconnect();
      this.gain.disconnect();
    } catch {
      /* already disconnected */
    }
    this.buffer = null;
  }

  private startSource(delaySec: number, offsetSec = 0): void {
    if (!this.buffer) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.buffer;
    src.playbackRate.value = this._rate;
    src.connect(this.filter);
    src.onended = () => {
      if (this._playing && !this._paused) {
        this._finished = true;
        this.onEnded?.();
      }
    };
    this.source = src;
    const when = this.ctx.currentTime + Math.max(0, delaySec);
    const safeOffsetSec = Math.max(0, offsetSec);
    src.start(when, safeOffsetSec);
    // Anchor to the source's actual scheduled start. During the initial
    // countdown this is mathematically equivalent to a negative song clock;
    // during resume countdowns the update loop freezes until this deadline.
    this._anchorCtx = when;
    this._anchorSongMs = safeOffsetSec * 1000;
    this._lastCtx = this.ctx.currentTime;
    this._suspendedAtCtx = -1;
    this._audioMs = this._accumMs;
    this._tickPerf = performance.now();
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
