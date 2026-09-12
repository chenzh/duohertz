import type { ChartTier, PlayMode } from "../types/chart";
import type { CrewLine } from "./firstShift";

/**
 * 人工精选。
 *
 * 曲库要回答的是"下一首玩什么"，不是"105 首怎么摆"，所以最上面一层是几首
 * 真的试过、能说清"为什么从这首开始"的曲子；搜索和筛选留在下面给知道自己
 * 要什么的人用。
 *
 * 规则：
 *   · why 只能写曲目/谱面里真实存在的东西（时长、BPM、音符数、滑条数），
 *     改之前先按 `public/catalog/<track_id>/<tier>.json` + `catalog.json` 核对数字，
 *     别凭印象写“最快/最慢/第一次”——这类断言最容易写错；
 *   · previewStart 选的是这首最能代表自己的一段（drop 起点），不是歌曲开头；
 *   · 这是人排的歌单，界面上不能包装成"为你智能推荐"。
 */
export type CuratedPick = {
  trackId: string;
  tier: ChartTier;
  mode: PlayMode;
  /** "为什么从这首开始" —— 一句，讲事实。 */
  why: string;
  /** 一句角色口吻的补充（属于故事层，不代替 why）。 */
  line: CrewLine;
  /** 试听从哪里开始（秒）。 */
  previewStart: number;
  /** 试听时长（秒）。 */
  previewSeconds: number;
};

/** 还没打过 First Shift 的人：三首最好上手的入口曲。 */
export const CURATED_STARTER_PICKS: readonly CuratedPick[] = [
  {
    trackId: "bs-s1-05",
    tier: "easy",
    mode: "casual",
    why: "The shortest track in the catalog: 60 seconds and 116 notes, about two a second.",
    line: { speaker: "JUNO", text: "Sixty seconds. Hold a beat that long and I can hear you from here." },
    previewStart: 6,
    previewSeconds: 15,
  },
  {
    trackId: "bs-s1-02",
    tier: "easy",
    mode: "casual",
    why: "118 BPM over 75 seconds, with 17 hold notes — the most holds in the opening chapter, so it's a gentle place to learn holding a lane.",
    line: { speaker: "TORQUE", text: "Start easy, find your feet. No gig is too small." },
    previewStart: 21,
    previewSeconds: 15,
  },
  {
    trackId: "bs-s1-04",
    tier: "easy",
    mode: "casual",
    why: "The slowest track in the catalog at 88 BPM — the most room between notes.",
    line: { speaker: "JUNO", text: "My pick for when the callers have gone home and the mic is still warm." },
    previewStart: 21,
    previewSeconds: 15,
  },
];

/** 打完 First Shift 之后的下一组。 */
export const CURATED_NEXT_PICKS: readonly CuratedPick[] = [
  {
    trackId: "bs-s1-01",
    tier: "easy",
    mode: "casual",
    why: "162 BPM, but only 110 notes across 73 seconds — the sparsest easy chart in the opening chapter.",
    line: { speaker: "JUNO", text: "Don't read the BPM and run. The easy chart leaves you room." },
    previewStart: 6,
    previewSeconds: 15,
  },
  {
    trackId: "bs-s1-03",
    tier: "standard",
    mode: "casual",
    why: "95 BPM on a standard chart: 189 notes, 28 chords, no slides — the same four lanes, a few more at once.",
    line: { speaker: "ATLAS", text: "Same lanes, more of them. You already have the hands for it." },
    previewStart: 21,
    previewSeconds: 15,
  },
  {
    trackId: "bs-s2-01",
    tier: "standard",
    mode: "casual",
    why: "First track with slides: 140 BPM, standard tier, 90 seconds.",
    line: { speaker: "JUNO", text: "Now the notes start sliding. Hold them to the end of the line." },
    previewStart: 4,
    previewSeconds: 15,
  },
];

/** 首页 / 曲库顶部该显示哪一组。 */
export function curatedPicks(shiftCompleted: number): {
  title: string;
  subtitle: string;
  picks: readonly CuratedPick[];
} {
  return shiftCompleted >= 3
    ? {
        title: "Next up",
        subtitle: "Three hand-picked follow-ups to the first shift — why each one, in a line.",
        picks: CURATED_NEXT_PICKS,
      }
    : {
        title: "Start here",
        subtitle: "Three hand-picked entry tracks. Each one says why it's a good place to begin.",
        picks: CURATED_STARTER_PICKS,
      };
}
