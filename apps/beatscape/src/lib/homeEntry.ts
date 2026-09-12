import { FIRST_SHIFT, shiftPlayHref, type CrewLine, type ShiftStep } from "../data/firstShift";
import { HOME_COPY } from "../constants/scape";
import { loadShiftProgress, type ShiftProgress } from "./firstShift";
import type { CatalogTrack } from "../types/catalog";
import { CURATED_NEXT_PICKS, type CuratedPick } from "../data/curated";
import { playHref } from "./playHref";

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
  track: CatalogTrack | null;
  /** 只有 First Shift 还没走完时为 true（用于决定要不要显示进度条）。 */
  inShift: boolean;
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
function shiftEntry(tracks: CatalogTrack[], step: ShiftStep, index: number): HomeEntry {
  const total = FIRST_SHIFT.length;
  const started = index > 0;
  return {
    cta: started ? `Continue First Shift · ${index + 1}/${total}` : "Play first track",
    sub: trackSub(findTrack(tracks, step.trackId), `First Shift ${index + 1}/${total}`),
    progress: index === 0 ? "Nothing played yet" : `First Shift ${index}/${total} done`,
    line: started
      ? step.opening?.[0] ?? step.before[0] ?? HOME_COPY.crew
      : HOME_COPY.crew,
    href: shiftPlayHref(step),
    track: findTrack(tracks, step.trackId),
    inShift: true,
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
    track,
    inShift: false,
  };
}

export function homeEntry(
  tracks: CatalogTrack[],
  progress: ShiftProgress = loadShiftProgress(),
): HomeEntry {
  const done = Math.min(progress.completed.length, FIRST_SHIFT.length);
  const next = FIRST_SHIFT[done];
  if (next) return shiftEntry(tracks, next, done);

  // 三首通关后：给 CURATED_NEXT_PICKS 里第一首本机确实有的曲子。
  for (const pick of CURATED_NEXT_PICKS) {
    if (findTrack(tracks, pick.trackId)) return curatedEntry(tracks, pick);
  }
  // 曲库还没加载完时也要给出一个能点的入口。
  return {
    cta: "Play first track",
    sub: "",
    progress: "First Shift complete",
    line: HOME_COPY.crew,
    href: shiftPlayHref(FIRST_SHIFT[0]!),
    track: null,
    inShift: false,
  };
}
