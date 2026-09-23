/** Measures a completed run, excluding loading, setup and paused intervals. */
export class RunClock {
  private startedAtMs: number | null = null;
  private pausedAtMs: number | null = null;
  private pausedTotalMs = 0;

  start(nowMs: number): void {
    this.startedAtMs = nowMs;
    this.pausedAtMs = null;
    this.pausedTotalMs = 0;
  }

  setPaused(paused: boolean, nowMs: number): void {
    if (this.startedAtMs === null) return;
    if (paused) {
      if (this.pausedAtMs === null) this.pausedAtMs = nowMs;
    } else if (this.pausedAtMs !== null) {
      this.pausedTotalMs += Math.max(0, nowMs - this.pausedAtMs);
      this.pausedAtMs = null;
    }
  }

  durationMs(nowMs: number): number {
    if (this.startedAtMs === null) return 0;
    const openPauseMs = this.pausedAtMs === null ? 0 : Math.max(0, nowMs - this.pausedAtMs);
    return Math.max(0, Math.round(nowMs - this.startedAtMs - this.pausedTotalMs - openPauseMs));
  }

  reset(): void {
    this.startedAtMs = null;
    this.pausedAtMs = null;
    this.pausedTotalMs = 0;
  }
}
