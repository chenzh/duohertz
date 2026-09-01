# BeatScape Reddit 首发文案包

> **更新**：2026-08-30 · 全面重写（85 曲库 + World Bible 语音 + 商标红线 + 合规守则）
> **发帖前置门（未过不发）**：① Cloudflare Pages 重新部署（线上仍是 35 首旧版）；② `docs/RESONANCE-BLINDTEST.md` 盲测未做前，帖文**不得出现**任何"音质/差异化优于同类"的宣称——只陈述事实（自有版权、可玩性、免费无账号）。

## 0. 红线（每篇帖文发前自查）

- **商标**：帖子主标/首句**不得以 NIGHTSHIFT 作为产品品牌名**（游戏内虚构乐队名 ≠ 产品名，且 Class 41 有在册近邻，见 World Bible §11）；**MONOLITH 一律不出现**在帖文（Warner Class 9 注册）。世界观只做轻调味（"the station" / "keep your block loud" 一句即可），**不发 lore 长文**。
- **合规腔**：不用 epic / legendary / win big / rewards；不承诺排行奖励。
- **诚实**：AI 生成音乐**明说**（owned AI originals 是卖点不是羞耻点）；判定窗 15/30/50 是工程真值可说；不吹"best rhythm game"。
- 每个目标 sub 发帖前**先读当周版规**（很多 sub 要求特定 flair / 禁视频 / 限自宣传频率）。

## 1. 差异化一句话（事实版，盲测过了才可加语气）

> **BeatScape** — a free browser 4-lane rhythm game. 85 AI-original tracks we own outright (night-drive, groove, battle, chill), onset-generated charts with 15/30/50 ms windows, keyboard or two-thumb touch. No download, no account — play in ~10 seconds.

## 2. 帖文成稿（三篇，按 sub 二选一起发，间隔 ≥1 周）

### Post A — r/rhythmgames（硬核向：判定与谱面）

**标题**：`[Web] BeatScape — free browser 4-lane rhythm game, 85 owned AI-original tracks, 15/30/50ms windows`

**正文**：

> Hi all — long-time lurker, finally shipping mine.
>
> **BeatScape** is a browser 4-lane rhythm game (D F J K on desktop, two-thumb lanes on mobile). No download, no account, saves stay on your device.
>
> What it is:
> - **85 tracks, all AI-generated in-house, rights owned outright** — no licensed hits, no takedown risk, and the catalog keeps growing
> - Charts are generated from audio onsets (not a fixed BPM grid), then filtered per tier: easy/standard/hard with peak-NPS caps
> - **15/30/50 ms judgment windows** (Perfect/Great/Good/Miss), arcade + casual modes, per-track offset calibration
> - Local leaderboard + a rotating daily challenge; shareable result poster
> - Touch gets a chord-assist so one-thumb-per-lane still clears 3-lane chords (banked as Great, never Perfect)
>
> Honest caveats: it's AI music — if that's a dealbreaker, totally fair. Charts are machine-generated with density audits; a human ear-pass on all 85 masters is in progress.
>
> Feedback I'd love: judgment feel at your offset, chart readability on hard, anything that feels unfair.
>
> Link: https://beatscape.pages.dev/beatscape/ （部署后替换为实际域名）

**首评（自己补）**：

> Tech notes: charts come from an onset pipeline (onset energy → lane by band, min-gap filtering per tier). Judge windows: ±15/±30/±50 ms. Everything runs client-side; the only network fetch is the catalog JSON and audio files. Happy to go deeper if anyone's curious.

### Post B — r/WebGames（休闲向：10 秒开玩）

**标题**：`BeatScape — play a rhythm game in your browser right now, no download, no signup`

**正文**：

> Made a little thing: a 4-lane rhythm game that runs in the browser. Hit the link, press Play, you're tapping to the beat in about ten seconds — D F J K, or thumbs if you're on a phone.
>
> - 85 original tracks (all ours — funk, neo-soul, night-drive EDM flavors)
> - Daily challenge track, local high scores, a shareable result card
> - There's a whole pirate-radio storyline wrapped around it if you're into that ("keep your block loud")
>
> It's free, no ads, no account. If a song hooks you, the results page links the full stream. Feedback welcome — especially "the offset calibration saved me" or "the calibration lied to me" stories.

**首评**：

> Dev here — everything is stored locally in your browser (scores, settings). No accounts because I don't want your email. If the timing feels off, Settings → offset, or the Calibrate page (8-tap test).

### Post C — r/gamedev（开发向：管线故事，间隔 ≥2 周发）

**标题**：`I generated an 85-track, fully-owned music catalog for my rhythm game — here's the pipeline and the cost traps`

**正文**：

> My rhythm game needed music I could actually own, so I built a generation pipeline instead of licensing. Numbers, mistakes, and what I'd do differently:
>
> - **Pipeline**: local inference (MLX on Apple silicon) → 216s masters → 120s game clips + full streams, dual assets per track; batch manifest + quota checks per vibe/difficulty
> - **Charts**: generated from onsets, not grids — tier specs cap NPS and chord probability; a profiler flags peak density and thumb-impossible chords (mobile gets an assist, not silent charts)
> - **Cost traps**: batch inference OOM at long durations (chunk it), transcoding time dominating the pipeline (parallelize early), and "generate 50 more tracks" failing at the audit stage ~10% of the time — budget for regeneration
> - **The weird part**: owning the masters means the game can link the full track on the results screen with zero rights conversation
>
> AMA about the pipeline; happy to share specifics on the audit gates.

**首评**（管线实测数，发帖时直接引用）：

> Numbers from the real run: 85 tracks across two expansions (35 → 85), all local inference — SA3 on MLX / Apple silicon, ~5s per 180s master, peak RAM 1.7 GB. Every track ships as dual assets (120s game clip + full stream master). Automated gates: catalog audit (quotas + density) FAIL=0 across all 85; density WARNs on ~8% of the last batch, same magnitude as v1. Human ear-pass on all masters in progress — that gate is the one that matters.

## 3. 预期问题与回答口径（评论区速查）

| 问题 | 回答口径 |
|------|---------|
| "AI slop?" | 不辩解。明说 in-house generated + rights owned + 人工耳检进行中；邀请点开一首自己判断。删偏见辱骂，留善意质疑。 |
| "为什么没有 X 歌手" | 全自有曲库是法律结构决定，不是审美声明。 |
| "手机能玩吗" | 能，双拇指 + chordAssist（同手和弦自动 bank Great，不判 Perfect 防止白给全 Perfect）。 |
| "有联机榜吗" | 本地榜 + 每日挑战（MVP 刻意不上账号），看反馈决定。 |
| "这电台剧情是什么" | 一句带过：*The Late Static, a pirate radio keeping the city loud. Stay tuned.* **不展开 lore**。 |
| "数据收集吗" | 无账号、无上传，存浏览器本地。 |

## 4. 素材清单（发帖前截图/录制）

| # | 内容 | 位置 |
|---|------|------|
| 1 | 首页 hero + On Air 横幅（电台第一集可见） | `/beatscape/` |
| 2 | Play 中段 In Phase 连击 + STREAK 字样 | 玩 `bs-s1-01` Easy |
| 3 | Results 页 + Download poster | 打完一局 |
| 4 | Characters 页三人立绘 | `/characters` |
| 5 | The Late Static 节目单（EP1 On air now） | `/radio` |
| 6 | 15s 录屏（OBS，60fps，Play 前 15s） | 可选，r/rhythmgames 加分 |

## 5. 目标 Sub 与节奏

| Sub | 定位 | 帖子 | 备注 |
|-----|------|------|------|
| r/rhythmgames | 硬核玩家 | Post A | 附判定窗/谱面说明；先读版规 |
| r/WebGames | 休闲即开即玩 | Post B | 最佳首发地 |
| r/gamedev | 开发者 | Post C（≥2 周后） | 管线故事向，标题党会删 |
| r/IndieGaming | 混合 | 备选，Post B 变体 | 自宣传限制宽松，仍先读版规 |

**节奏**：部署上线 → 等 48h 观察 crash/反馈 → Post B（最大盘） → 3–5 天后 Post A → ≥2 周后 Post C。所有帖子发出后 48h 内高频回评论（Reddit 算法看重早期互动）。

## 6. 验收复跑

```bash
pnpm catalog:beatscape
pnpm audit:beatscape
pnpm earcheck:beatscape
cd apps/beatscape && npx tsc --noEmit && npx vitest run
```
