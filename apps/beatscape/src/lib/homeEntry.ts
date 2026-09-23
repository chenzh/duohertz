import { FIRST_SHIFT, shiftPlayHref, type CrewLine, type ShiftStep } from "../data/firstShift";
import { HOME_COPY } from "../constants/scape";
import { loadShiftProgress, type ShiftProgress } from "./firstShift";
import type { CatalogTrack } from "../types/catalog";
import { CURATED_NEXT_PICKS, type CuratedPick } from "../data/curated";
import { playHref } from "./playHref";
import type { ChartTier, PlayMode } from "../types/chart";
import { latestRunForTrackIds, loadRuns, runNeedsRetry, type RunRecord } from "./progress";
import { MODE_GUIDANCE, TIER_GUIDANCE } from "./runSetup";
import { nextTrackForRun } from "./nextTrack";

/**
 * 首页主入口。
 *
 * 首页不是"介绍这个游戏"，而是下一局的入口：同一个位置根据这台机器上的真实
 * 进度给出不同的按钮，回来的玩家不会再看一遍欢迎词。进度只存在本机
 * （见 lib/firstShift），所以这里不做账号、也不假装跨设备记住玩家。
 */
export type HomeEntry = {
  /** 主按钮文案。永远对应一首确定的歌。 */
  cta: string;
  /** 按钮下面那行：曲目名 · 时长 · 进度，让人知道点下去会发生什么。 */
  sub: string;
  /** 进度标签，例如 "First Shift 1/3"；没有 First Shift 进度时为 ""。 */
  progress: string;
  /** 上方那句角色台词。 */
  line: CrewLine;
  href: string;
  trackId: string;
  track: CatalogTrack | null;
  tier: ChartTier;
  mode: PlayMode;
  /** 只有 First Shift 还没走完时为 true（用于决定要不要显示进度条）。 */
  inShift: boolean;
  /** Fixed mobile action semantics; keeps the persistent CTA honest. */
  intent: "start" | "continue" | "play" | "replay" | "retry";
};

export type HomeMobileAction = {
  label: "Start" | "Continue" | "Play" | "Replay" | "Retry";
  ariaLabel: string;
  replayIcon: boolean;
};

function secondsLabel(sec: number): string {
  if (!Number.isFinite(sec) || sec <= 0) return "";
  const s = Math.round(sec);
  if (s % 60 === 0) return `${s / 60}-minute track`;
  return `${s}-second track`;
}

function trackSub(track: CatalogTrack | null, extra: string): string {
  if (!track) return extra;
  const bits = [track.title];
  const len = secondsLabel(track.duration_sec);
  if (len) bits.push(len);
  if (extra) bits.push(extra);
  return bits.join(" · ");
}

function findTrack(tracks: CatalogTrack[], id: string): CatalogTrack | null {
  return tracks.find((t) => t.track_id === id) ?? null;
}

/** First Shift 还没走完：按钮直指下一个节点（含第 1 个）。 */
function shiftEntry(tracks: CatalogTrack[], step: ShiftStep, index: number, hasCompletedRun: boolean): HomeEntry {
  const total = FIRST_SHIFT.length;
  const started = index > 0;
  return {
    cta: started
      ? `Continue First Shift · ${index + 1}/${total}`
      : hasCompletedRun
        ? "Start First Shift"
        : "Start first run",
    sub: trackSub(findTrack(tracks, step.trackId), `First Shift ${index + 1}/${total}`),
    progress: index === 0
      ? hasCompletedRun ? "First Shift not started" : "Nothing played yet"
      : `First Shift ${index}/${total} done`,
    line: started
      ? step.opening?.[0] ?? step.before[0] ?? HOME_COPY.crew
      : HOME_COPY.crew,
    href: shiftPlayHref(step),
    trackId: step.trackId,
    track: findTrack(tracks, step.trackId),
    tier: "easy",
    mode: "casual",
    inShift: true,
    intent: started ? "continue" : "start",
  };
}

/** First Shift 三首都完成了：给一首人工精选的曲子，理由写在按钮下面。 */
function curatedEntry(tracks: CatalogTrack[], pick: CuratedPick): HomeEntry {
  const track = findTrack(tracks, pick.trackId);
  return {
    cta: `Play ${track?.title ?? pick.trackId}`,
    sub: track ? `${track.artist} · ${pick.tier} · ${secondsLabel(track.duration_sec) || "full track"}` : "",
    progress: "First Shift complete",
    line: pick.line,
    href: playHref(pick.trackId, pick.tier, pick.mode),
    trackId: pick.trackId,
    track,
    tier: pick.tier,
    mode: pick.mode,
    inShift: false,
    intent: "play",
  };
}

function returningEntry(tracks: CatalogTrack[], run: RunRecord): HomeEntry {
  const track = findTrack(tracks, run.track_id)!;
  const tier = TIER_GUIDANCE[run.tier].label;
  const mode = MODE_GUIDANCE[run.mode].label;
  const needsRetry = runNeedsRetry(run);
  const noHit = !run.failed && run.accuracy <= 0;
  return {
    cta: needsRetry ? "Retry last run" : "Play again",
    sub: `${track.title} · ${tier} ${mode} · ${run.accuracy}% ACC`,
    progress: run.failed ? "Last run dropped" : noHit ? "No notes hit" : "Last run complete",
    line: run.failed
      ? { speaker: "JUNO", text: "The signal dropped, but the track is still here. Take it from the top." }
      : noHit
        ? { speaker: "JUNO", text: "The track's still here. Next pass, meet the notes on the line." }
        : { speaker: "JUNO", text: "Your last signal is still warm. Run it back." },
    href: playHref(run.track_id, run.tier, run.mode),
    trackId: run.track_id,
    track,
    tier: run.tier,
    mode: run.mode,
    inShift: false,
    intent: needsRetry ? "retry" : "replay",
  };
}

/** A successful free-play run should move the set forward instead of trapping Home on Replay. */
function followUpEntry(run: RunRecord, track: CatalogTrack): HomeEntry {
  const tier = TIER_GUIDANCE[run.tier].label;
  const mode = MODE_GUIDANCE[run.mode].label;
  return {
    cta: "Continue the set",
    sub: `${track.title} · ${track.artist} · ${tier} ${mode} · ${track.bpm} BPM`,
    progress: `Last run ${run.accuracy}% ACC`,
    line: {
      speaker: "JUNO",
      text: "Your last signal landed. Keep the set moving.",
    },
    href: playHref(track.track_id, run.tier, run.mode),
    trackId: track.track_id,
    track,
    tier: run.tier,
    mode: run.mode,
    inShift: false,
    intent: "play",
  };
}

export function homeEntry(
  tracks: CatalogTrack[],
  progress: ShiftProgress = loadShiftProgress(),
  runs: RunRecord[] = loadRuns(),
): HomeEntry {
  const done = Math.min(progress.completed.length, FIRST_SHIFT.length);
  const next = FIRST_SHIFT[done];
  if (next) return shiftEntry(tracks, next, done, runs.length > 0);

  const latestRun = latestRunForTrackIds(runs, tracks.map((track) => track.track_id));
  if (latestRun) {
    if (!runNeedsRetry(latestRun) && latestRun.mode !== "practice") {
      const nextTrack = nextTrackForRun(tracks, latestRun.track_id, latestRun.tier, runs);
      if (nextTrack) return followUpEntry(latestRun, nextTrack);
    }
    return returningEntry(tracks, latestRun);
  }

  // 三首通关后：给 CURATED_NEXT_PICKS 里第一首本机确实有的曲子。
  for (const pick of CURATED_NEXT_PICKS) {
    if (findTrack(tracks, pick.trackId)) return curatedEntry(tracks, pick);
  }
  // 曲库还没加载完时也要给出一个能点的入口。
  const fallbackPick = CURATED_NEXT_PICKS[0]!;
  return {
    cta: "Start a run",
    sub: "",
    progress: "First Shift complete",
    line: HOME_COPY.crew,
    href: playHref(fallbackPick.trackId, fallbackPick.tier, fallbackPick.mode),
    trackId: fallbackPick.trackId,
    track: null,
    tier: fallbackPick.tier,
    mode: fallbackPick.mode,
    inShift: false,
    intent: "play",
  };
}

/** Compact but exact copy for the persistent mobile primary action. */
export function homeMobileAction(entry: HomeEntry): HomeMobileAction {
  const title = entry.track?.title ?? "next track";
  const setup = `${TIER_GUIDANCE[entry.tier].label} ${MODE_GUIDANCE[entry.mode].label}`;
  switch (entry.intent) {
    case "start":
      return {
        label: "Start",
        ariaLabel: `${entry.cta} · ${title} · ${setup}`,
        replayIcon: false,
      };
    case "continue":
      return {
        label: "Continue",
        ariaLabel: `${entry.cta} · ${title} · ${setup}`,
        replayIcon: false,
      };
    case "retry":
      return {
        label: "Retry",
        ariaLabel: `Retry ${title} · ${setup}`,
        replayIcon: true,
      };
    case "replay":
      return {
        label: "Replay",
        ariaLabel: `Replay ${title} · ${setup}`,
        replayIcon: true,
      };
    case "play":
      return {
        label: "Play",
        ariaLabel: `Play ${title} · ${setup}`,
        replayIcon: false,
      };
  }
}

/** Fixed Play navigation follows the same resolved run as the Home hero. */
export function nextHomePlayHref(
  tracks: CatalogTrack[],
  progress: ShiftProgress = loadShiftProgress(),
  runs: RunRecord[] = loadRuns(),
): string {
  return homeEntry(tracks, progress, runs).href;
}
