# BeatScape PRD — 实现真值版（As-Built）

> **文档定位**：本文是 `apps/beatscape/` 的**实现级 PRD**，基于 2026-08-30 对全部源码（约 6.2k 行 TS/TSX）逐文件深度分析沉淀而成。
> **与 `docs/PRD-BEATSCAPE.md`（v1.9.2 产品总纲）的关系**：产品级愿景、世界观、曲库供给流水线、法务红线以总纲为准；**本文以代码实际行为为准**，并给出两者差异清单（§15）。接手本目录的 AI / 工程师先读本文 §4–§14，再按需回查总纲。

| 字段 | 值 |
|------|-----|
| 产品 | BeatScape（节拍幻境）— 浏览器 4K 下落式节奏游戏 |
| 口号 | Feel the Beat. Own the Scape. |
| 版本 | App v0.1.0（Layout 内 `APP_VERSION`）· 文档 as-built 2026-08-30 |
| 技术栈 | React 19 + TypeScript 5.7 + Vite 6，**零游戏引擎、零路由库、零 UI 库**，Canvas 2D 渲染 |
| 部署 | Cloudflare Pages（`wrangler pages deploy`，项目名 `beatscape`）· 备用 Netlify / Vercel 配置齐备 |
| 曲库 | **85 首** MusicSaas AI 原创（`rights: owned` / `theme: beatscape`），双资产（游戏切片 + 流媒体完整版） |
| 存储 | 纯 localStorage/sessionStorage，无账号、无服务端上传、零广告 |
| 测试 | Vitest **11 文件 / 67 用例全绿**（含 `prdAcceptance` PRD 验收测试） |
| 上游真值 | 判定窗 15/30/50（Arcade）——与 NeonBeat 22/45/80 严格隔离（`judge.ts` 首行注释即红线声明） |

---

## 1. 产品一句话

海外轻量音游玩家**免安装、秒开即玩**的浏览器节奏游戏：全自有 AI 曲库（车载听感 + 都市爵士战斗感）、RESONANCE 漫画风视觉、专业 Miss 复盘、Local Board 荣誉体系，并以流媒体完整版 CTA 向 MusicSaas App 引流。

**六层优先级铁律**（继承总纲 §1.5，代码严格遵守）：
`音频时序同步 ＞ 60fps 稳态 ＞ 判定手感一致性 ＞ 稳定性 ＞ 功能完整性 ＞ UI 美观`

---

## 2. 系统架构（五层解耦 · as-built）

```text
┌─ UI 层（React 页面 + Layout）─────────────────────────────┐
│  pages/ Home·Library·Track·Play·Results·Calibration·      │
│         Settings·Leaderboard·Legal·NotFound               │
├─ 渲染层（PlayField.tsx，约 975 行，对局核心容器）──────────┤
│  Canvas 2D · rAF 循环不触发 React 重渲 · HUD 全部画在 canvas│
├─ 判定内核层（engine/，纯逻辑，零 DOM 零音频依赖）──────────┤
│  judge.ts 判定窗/计分 · playState.ts GameSession 状态机    │
│  geometry.ts 下落几何 · noteSprite.ts 菱形精灵预渲染        │
├─ 音频时序层（audio/，全局唯一真值 = WebAudio 时钟）────────┤
│  context.ts 单例 AudioContext · playback.ts Conductor      │
│  hitsounds.ts 程序合成 SFX（零采样文件）                   │
├─ 业务数据层（storage/ catalog/ lib/）─────────────────────┤
│  settings.ts / session.ts 本地存档 · loadCatalog 曲库加载   │
│  dailyChallenge 每日挑战 · sharePoster 海报 · analytics    │
└──────────────────────────────────────────────────────────┘
```

**关键解耦事实**

- `GameSession` 不触碰 DOM/Audio，由外部时钟（Conductor）驱动；判定内核可单测（playState.test.ts 8 例）。
- `Conductor.songTimeMs()` 是**唯一歌曲时间真值**：倒计时期间为负值（3s countdown 属同一时间轴），暂停冻结、变速按 rate 累积，杜绝帧时间漂移。
- 渲染循环直接读 `sessionRef.current`，每帧零 React setState；HUD（分数/准度/HP/连击/键帽）全部 canvas 绘制。

### 文件地图（src/ 共 51 个源文件）

| 模块 | 文件 | 职责 |
|------|------|------|
| 引擎 | `engine/judge.ts` | 判定窗、分数、连击倍率、HP、准确率、评级、MaxScore |
| | `engine/playState.ts` | `GameSession`：note 运行时状态、press/release/tick、结算 |
| | `engine/geometry.ts` | approach 秒数、noteScreenY、proximity |
| | `engine/noteSprite.ts` | 菱形音符离屏 sprite（含黑描边 + 高光切面） |
| 音频 | `audio/context.ts` | AudioContext 单例 + unlock |
| | `audio/playback.ts` | Conductor（load/begin/pause/resume/setRate/stop） |
| | `audio/hitsounds.ts` | 程序合成 SFX（噪声瞬态 + 音调体，分层打击感） |
| 输入 | `input/keyMap.ts` | 物理键码绑定、3 预设、捕获、防重复 |
| | `input/touchInput.ts` | 判定线几何、触控 tracker、20ms 防抖、边缘 guard、拇指分Hand |
| 对局 | `components/PlayField.tsx` | 对局容器：加载/解锁 overlay、倒计时、循环、粒子/震屏、暂停 |
| 页面 | `pages/*.tsx`（10 页） | 见 §9 路由表 |
| 数据 | `catalog/loadCatalog.ts` | catalog.json + chart JSON 拉取（模块级缓存） |
| | `catalog/trackVibe.ts` | vibe 四类解析（显式字段 → 关键词推断兜底） |
| | `storage/settings.ts` | bs_* 键读写、PB 查询 |
| | `storage/session.ts` | LastRun 写读、Local Board / Daily Board、分享文案 |
| | `lib/dailyChallenge.ts` | UTC 日期哈希确定性选题 |
| | `lib/sharePoster.ts` | 1200×630 结算海报 Canvas 导出 |
| | `lib/streamLink.ts` | 流媒体 App 深链解析（`VITE_STREAM_APP_URL`） |
| | `lib/analytics.ts` | Plausible + localStorage 缓冲（bs_analytics，cap 120） |
| | `lib/firstPlay.ts` | 首局/hero/引导曲目常量 |
| 视觉 | `constants/scape.ts` | RESONANCE 色板、四道色、判定色、街区色、艺人 bio、文案 token |
| | `styles.css` | 全站样式（:root token、漫画描边、移动端 tabbar） |
| SEO | `seo/pageMeta.ts` | 每页 title/description 动态设置 |
| i18n | `i18n/{en,zh,index,types}.ts` | en/zh 词条已备（仅 leaderboard 消息有测试）——**页面未接线** |

---

## 3. 玩法形态

**4 道下落式（Neon Lanes）**，lane 0–3 左→右，与总纲 §4.1 一致。四种音符类型全部实现：

| 类型 | 视觉 | 输入 | 判定 |
|------|------|------|------|
| Tap | 霓虹菱形（黑描边 + 高光，唯一造型） | 按下 | 单次四档 |
| Hold | 头 + 半透明身条（按住时描边加亮） | 头按下持续至尾释放 | 头四档 + 尾四档（=2 判定对象） |
| Chord | 同帧多道菱形 | 每键独立 | 每键独立判定（漏道 Miss） |
| Slide | 头菱形 + 目标道虚线 + 0.95× 尾菱形 | 先按 `lane` 再在 `end` 前按 `to`（键盘顺序键 / 触屏滑动皆可，pointermove 换道即"松旧按新"） | 完成瞬间以到达时刻 vs `end` 判档一次 |

---

## 4. 核心判定与计分真值（代码级）

### 4.1 判定窗（`engine/judge.ts`，PRD 总纲 §4.3 ✓ 一致）

| 档位 | Arcade / Practice | Casual | 分 | 连击 |
|------|------|------|----|------|
| Perfect | ±15 ms | ±28 ms | 300 | 不断 |
| Great | ±30 ms | ±55 ms | 200 | 不断 |
| Good | ±50 ms | ±90 ms | 100 | **断** |
| Miss | 超 Good | 超 Good | 0 | 断 |

- **Hold 尾部**：`judgeHoldTail` 对三档**全部 +20 ms** 吸附（15+20/30+20/50+20）——比总纲「Good 窗 +20」略宽，属更宽松的 as-built 解释。
- **空按**：`press()` 找不到候选 → 返回 null，无惩罚、只响 `playKeyTick`（PRD §4.14 ✓）。
- **幽灵击**：Miss 后 note 已 `done`，同道再按不匹配任何对象 → 忽略（✓）。
- **防重复**：键盘 `e.repeat` 忽略 + `pressedRef` 按住去重；触控 `TouchLaneTracker` 同道 20ms 防抖（`LANE_DEBOUNCE_MS=20`，PRD §4.14 ✓）。
- **自动 Miss**：`tick()` 对超 Good 窗仍未击中的对象逐个补 Miss；Hold 头 Miss 时**头尾双 Miss 入账**（2 个判定对象都算 Miss）。

### 4.2 计分 / 准确率 / 评级（✓ 与总纲 §4.4 完全一致）

```text
单次得分 = 基础分 × 连击倍率（0–49 ×1 · 50–99 ×2 · 100–199 ×3 · 200+ ×4 封顶）
MaxScore = TotalNotes × 300 × 4      // Local Board 拒收 score > MaxScore×1.01
Accuracy = (P×1.0 + Gr×0.75 + Go×0.40) / TotalNotes × 100   // 2 位小数
Grade：S ≥95 · A ≥90 · B ≥80 · C ≥70 · D <70
FC = miss===0 ；AP = perfect===totalNotes 且 miss===0
TotalNotes：tap/slide=1 · hold=2（头尾） · chord=n 键
```

### 4.3 HP（Arcade 专属，✓ 总纲 §4.5）

初始 100、封顶 100；Perfect +2 · Great +1 · Good 0 · Miss −7 · **Hold 尾 Miss −5**；HP≤0 → `failed`，立即停止、不上榜。Casual/Practice 无失败。

### 4.4 三模式（✓ 总纲 §4.5 + 一个新增特性）

| 模式 | 失败 | 变速 | 特性 |
|------|------|------|------|
| Casual | 无 | 0.75/1.0/1.25× 仅视觉（乘 approach，判定窗不变，音频恒 1.0×） | 判定窗放宽 28/55/90 |
| Arcade | HP 归零 | 仅 1.0× | 上 Local Board |
| Practice | 无 | 连续 **3 Miss → `setRate(0.5, 5000)`** 音画同步减速 5s（`consumeSlowTrigger`） | 判定窗仍用 Arcade 毫秒值 |

**★ Chord Assist（总纲未记载的 as-built 特性）**：触屏设备（`pointer: coarse`）默认开启（Settings 可关）。同手和弦（lane 0+1 或 2+3 叠在一只拇指上）超时未按的那条道，若同手搭档道已击中 → **记 Great 而非 Miss**（故意不记 Perfect，保 AP 公平）。跨手和弦（1+2 / 0+3）不受影响。这是移动端双拇指握法的核心公平性设计（`playState.sameHandPartnerStruck`）。

### 4.5 下落几何（`engine/geometry.ts` — ⚠ 与总纲 §4.10 有偏差）

```text
as-built:  approach_sec = (64 / AR) × (60 / BPM) × (1 + scrollBias)
总纲 §4.10: approach_beats = 50 / AR
```

- 常量 `APPROACH_VISIBLE_BEATS = 64`（比总纲的 50 **多 28% 可见时间**，下落更慢、更易读）。
- 拍速感保留：160 BPM 显著快于 88 BPM（时间基随 BPM 缩放）。
- 判定线 = 短边 × **15%** 距底（`RECEPTOR_RATIO=0.15`，减 safe-area，✓ 总纲 §4.12）。
- **视觉缓动**：进度 >88% 后做 cubic ease-in（仅影响下落观感，不影响判定时刻——注释明示 "timing unchanged, only scroll feel"）。
- 进场放大：音符接近判定线 64px 带内放大 1.22×（`NOTE_PROXIMITY_GROWTH=0.22`）并提亮。

> 处置建议：**以 as-built 64 为手感真值**，反向修订总纲 §4.10（或在总纲登记变更单），避免后续 AI 按 50 复原。

### 4.6 对局状态机（as-built）

```text
Loading(decode m4a) → needsStart(Tap to enter the Scape / hero autoStart)
  → begin(): 3s Countdown（时间轴负段，A5→C♯6→F6 递升节拍器，主曲未起不判定）
  → Playing（唯一时钟 = AudioContext）
      ⇄ Pause（手动按钮；⧉ visibilitychange hidden → 自动 Pause，回前台用户手动 Resume）
      → Exit：window.confirm("Leave the Scape? This run won't be saved.")
  → Finished（任一）：
      ① Arcade HP=0（立即，淡出即停，不写榜）
      ② 全部对象结算 && 歌曲时间 ≥ 末音 end + 500ms
      ③ 音频自然 ended
  → writeLastRun(bs_last_run, session + local) → nav /results
```

倒计时结束 GO 与音频 t=0 严格同轴；offset = `bs_offset_ms + chart.audio_offset_ms`，夹紧 ±200ms。

---

## 5. 输入系统

### 5.1 键盘（`input/keyMap.ts` — ⚠ 默认键位与总纲不同）

- **绑定的是物理键码 `KeyboardEvent.code`** 而非字符：法/德键盘布局下四道仍在同一物理位置，且可绑定方向键；旧版单字符存档经 `normalizeKeys` 自动升级，`key` 作为兜底匹配。
- **默认 = Arrow keys（← ↓ ↑ →）**——注释明示 "the Friday Night Funkin' layout"；总纲 §4.1 写的 D F J K 现为三预设之一：

| 预设 | 键码 | 定位 |
|------|------|------|
| `arrows`（默认） | ← ↓ ↑ → | FNF 布局 · 新手 |
| `wasd` | A S W D | 游戏手位 |
| `dfjk` | D F J K | osu!mania 老玩家 |

- Settings 逐道监听重绑（Esc 取消；Shift/Ctrl/Tab 等修饰键拒绝绑定；两道同键禁止保存）。
- 键帽提示**始终**绘制在判定线下方（非触屏），按道着色、按下反色——总纲 §4.12「前 3 局显示」未实现为限时逻辑。

### 5.2 触控

- `pointerdown/move/up/cancel` + `setPointerCapture`；**多指各绑一道**，move 滑入新道 = 释放旧道 + 按下新道（天然支持滑键手势）。
- **5% 边缘 guard**：左右各 5% 区域的触摸直接拒绝（防拇指边缘误触，`laneFromClientX` 返回 null）。
- 判定线几何、热区=道宽；对局自动进入 immersive 模式（body class 隐藏站点 chrome），移动端 Play 页提供 Fullscreen 按钮，开始时尝试 `requestFullscreen`。
- `index.html`：`viewport-fit=cover`、`theme-color #12100F`、iOS/Android web-app meta。

---

## 6. 音频系统

| 项 | as-built |
|----|----------|
| 上下文 | 全站**单例 AudioContext**（音乐 + SFX 共钟，判定与歌采样对齐） |
| 解锁 | 首次用户手势 `unlockAudio()`（Tap overlay / Home 音画合一按钮 / 校准敲击） |
| Conductor | `begin(3000)` 负时间轴倒计时；pause 冻结并停源，resume 按 `accumMs` 重排源；`setRate` 同时改累积速率与 `source.playbackRate`（Practice 变速音画同步） |
| 音量 | Music 总线默认 **0.70**、SFX **0.55**（= 总纲 §6.0.13 默认值，Settings 可调；muted 覆写 0） |
| SFX | **程序合成**（零采样文件，自有版权 ✓）：噪声瞬态（highpass/bandpass 滤波）+ 短音调体。Perfect 2800/5200Hz 脆响 + 1760/2640Hz 亮音；Great/Good 依次降频；Miss = 噪声拍 + 95→48Hz 低频 thump（"firm, not goofy"）；断连 combo-break 专用；倒计时 A5→C♯6→F6 |
| hold-tick | 未实现（总纲默认 Off，无影响） |
| 加载 | `fetch → decodeAudioData`（m4a）；失败显示 "Signal lost" 错误 overlay |

---

## 7. 渲染与性能架构

- **精灵预渲染**：四道菱形音符启动时各渲染一张 120px 离屏 canvas（含黑描边、0.4 透明度高光三角），每帧仅 `drawImage`——代码注释明示 shadowBlur 是旧版掉帧主因，已彻底移除。
- **rAF 循环**：判定 `tick` + 绘制全在循环内，**零 React 重渲**（HUD 也在 canvas 上）；`getResult()` 每帧分配对象的坑已被规避（HUD 直调 `accuracyPercent`）。
- DPR ≤ 2；`ResizeObserver` 自适应；震动/粒子/里程碑闪光全部受 `fancyFx` 开关 + `prefers-reduced-motion` 双闸（✓ 总纲 §4.8）。
- 打击感（fancyFx 开时）：Perfect 22 粒 / Great 14 / Good·Miss 8，方形碎片 + 重力；判定 150ms 震屏（Perfect 6px / Miss 7px）；连击里程碑 [10,25,50,100,150,200,300] 全屏 Anton 大字 + 强震。
- HUD 视觉语言（RESONANCE v2.0）：墨底 `#12100F` + 朱红呼吸 wash（随 BPM 余弦脉动）、斜切平行四边形面板 + 2px 纯黑描边、判定文案 Anton 斜体墨描 + EARLY/LATE 微偏移（≥8ms 时显示）、连击四档增热（米白→琥珀→朱红）。

---

## 8. 内容与曲库（catalog.json as-built 实况 · 2026-08-29 audit）

### 8.1 规模与配额（85 首，全部 `rights: owned` + `theme: beatscape` + `engine: stable-audio-3`）

| 维度 | 实况 |
|------|------|
| 曲风 | EDM 20 · Pop 17 · Hip-hop 17 · R&B 14 · Rock 17 |
| 街区 | Pulse Core 19 · Night Grid 17 · Glass Rim 16 · Chrome Yard 16 · Afterhours Lane 14 · Slide District 2 · Skyline Hook 1 |
| Vibe（玩家情绪筛） | battle 30 · groove 22 · chill 19 · night-drive 14 |
| 运营标签 | Hot Chart 26 · Viral 20 · Classic 20 · New Release 19 · Beginner Pick 3 |
| BPM | 86–200 |
| 游戏切片 | 60–120s（`duration_sec`，谱面时钟真值） |
| 双资产 | `stream.m4a` 完整版 **85/85**、`og.png` **85/85**、`preview_48s` 10 首、人声曲 1 首 |
| Stage 分布（track_id 段） | s1:6 · s2:4 · s3:15 · s4:15 · s5:10 · s6:35（Stage5/6 扩容已入库，待重部署上线） |

- 每曲资源：`audio.m4a`（切片）+ `stream.m4a`（完整版）+ `cover.svg`（程序化）+ `og.png` + `easy/standard/hard.json` 三谱。
- **vibe 兜底推断**：catalog 无 `vibe` 字段时按 title/tags/genre/BPM 推断（night-drive 关键词 → Beginner/Classic+R&B/BPM<100 → chill → Hot+EDM/Rock → battle → Pop/Hip-hop → groove）。
- 流媒体引流：Track/Results 页 `StreamFullCTA`（"Hear the full track (m:ss) on MusicSaas — not the Xs game clip"），深链优先 per-track `stream_app_url`，否则 `VITE_STREAM_APP_URL` 环境变量拼 `/track/{id}`；无配置显示 "App link coming soon"。

### 8.2 数据契约（`types/catalog.ts` / `types/chart.ts`）

- `CatalogTrack` 含：`track_id/title/artist/genre/bpm/duration_sec/preset_id/engine/job_id/rights/theme/tags/vibe/district/default_mode/default_tier/audio/cover/charts{easy,standard,hard}/seo/og/stream_audio/stream_duration_sec/preview/artist_bio?`。总纲 §6.0.9 的 `audio_master`、per-track `stream_app_url` 实际未出现在 catalog 数据里（后者走全局 env）。
- `ChartJSON`：`{track_id, tier, format:1, bpm, audio_offset_ms, ar, total_notes, sections?, notes[]}`；note 四型同总纲 §6.0.16（slide 仅相邻道、Stage1 无 slide——acceptance 测试对 bs-s2-01 做了结构断言）。
- 谱面加载：`loadChart(track, tier)` 拼 BASE_URL 相对路径，404 即抛错进 "Chart load failed" 兜底。

### 8.3 运营机制

- **Daily Challenge**：`hashDate(UTC日期) % N` 从**排序后** track_id 确定性选题，固定 `standard · arcade`，`?daily=1` 入局，成绩写独立 Daily Board（按 dateKey 过滤）。
- **Home 运营位**：精选 3 首 = `bs-s1-01 Neon Pulse / bs-s1-02 Glass Horizon / bs-s1-05 Voltage Drop`（✓ 总纲 §6.0.18 精选）；Showcase 图表链 = `bs-s1-01 / bs-s1-05 / bs-s2-01 / bs-s1-04 / bs-s3-06`；其余曲目进 "Explore the city" 横滑。
- **首局真值（⚠ 变更）**：`FIRST_PLAY = bs-s4-10 "Strike Vector" · Easy · Casual`（Home Play Now 与移动端 tabbar Play 皆指此曲）；引导 warm-up 曲 = `bs-s1-02 Glass Horizon` Easy Casual。总纲 §4.9 的「Play Now = #01 Neon Pulse Std Arcade」已被取代。
- **首访引导**：非阻塞 Home 弹窗（"First time in the Scape?" → Start the warm-up / Explore on my own），替代总纲的强制引导流；`bs_onboarded` 在任意一局完成 / 校准完成 / 引导任一操作时置 true。

---

## 9. 页面与路由

自研 router（`router.tsx`，History API + 模式匹配 + `Link/Navigate/useSearchParams`），base 可配（本地 `/beatscape/`，CF 构建 `/`）。

| 路由 | 页面 | as-built 职责 |
|------|------|--------------|
| `/` | Home | 双栏 hero（左文案+键帽+CTA，右 **HomeHeroPlay 真机可玩 demo**：PlayField hero 变体，蒙版后为 HeroGameplayPreview 循环动画，一键 Play+Sound 解锁后 autoStart）· Daily banner · **电台 On Air 横幅**（当前集 + Season program 入口）· **48h 回归欢迎语**（radio-welcome）· Featured 卡（含 48s 音频试听 `<audio controls>`）· Explore 横滑 · 首访 intro 弹窗 |
| `/library` | Library | 搜索（title/artist/district/genre/vibe/tags 联合 hay）+ genre 下拉 + vibe 四 chip + Beginner/With vocals/Favorites 快筛 + 卡片网格（Vibe/District/Beginner/Vocals 徽章） |
| `/track/:id` | Track | 封面 hero + 艺人 bio（catalog 字段优先，fallback `ARTIST_BIOS`）+ **电台点歌引语**（`trackRequests` 85/85 覆盖，缺 key 降级隐藏）+ 音频试听 + Stream CTA + tier/mode 选择器（默认取 track `default_*`）+ Favorite |
| `/play/:id` | Play | query `tier`（缺省 easy）`mode`（缺省 casual）`daily=1`；加载封面做背景；Exit confirm；finish → `writeLastRun` + `setOnboarded` + `/results` |
| `/results` | Results | 读 `bs_last_run`（`?run=local` 时优先 localStorage 深链）· Grade 大字 + FC/AP/NEW RECORD 徽章 · Score/Acc/MaxCombo 药丸 · 四档占比条 · **MissReplayPanel**（分道时间轴点图 + section 聚合 + 明细）· PB 对比 · Replay/Copy link/Poster/Library/Play Now · Owned Rights 条 |
| `/calibrate` | Calibration | 8 拍 @120 BPM 四道轮流闪；`AudioContext` 时钟取 Δ；≥3 次取**中位数**建议 offset；Save → 写入并进首局；Skip → offset 0 |
| `/settings` | Settings | 名字（≤24）/ Global offset ±200 / Hitsound / 双音量滑条 / FancyFX / Casual speed / **触屏专属 Thumb chord assist** / 键位三预设 + 逐道重绑（重复键禁存） |
| `/leaderboard` | Leaderboard | **Local Board**：All-time（`bs_board` Top50）+ Daily challenge 双 tab；明示 "Scores stay on this device" |
| `/characters` | Characters | NIGHTSHIFT 三人 crew 页（JUNO/ATLAS/TORQUE 档案卡 + 头像条入口），IP 主页面 |
| `/radio` | Radio | **The Late Static 节目单**：Year 1 三季 24 集周播（`radioEpisodes.ts` season+week 结构，首播 2026-08-28）；已播全文 / 当前集 "On air now" 高亮 / 未播集只露 teaser；按季分组渲染 |
| `/profile` | Profile | 荣誉段位 + 成就 + 统计（设备本地） |
| `/privacy` `/terms` | Legal | 静态英文条款（2026-08-26 更新；本地存储声明、无追踪声明） |
| fallback | NotFound | — |

- 站点 chrome：顶部 logo（共振菱形 SVG）+ Library/Characters/Radio/Local Board/Profile/Settings + 玩家头像缩写；移动端底部 **5-tab tabbar**（Home/Library/Play/Board/Settings，Radio 走 Home 横幅进入）；页脚 `BeatScape · AI Original · Owned Rights · v0.1.0`。
- 每页 `usePageMeta` 动态 title/description（Play 页由 track seo 拼装）。`public/sitemap.xml`（6 主路由，beatscape.pages.dev）+ `robots.txt`（Disallow settings/profile/calibrate）随构建发布。

---

## 10. 本地存档（localStorage as-built 键表）

| Key | 内容 | 备注 |
|-----|------|------|
| `bs_settings` | `{hitsound, fancyFx, scrollBias, casualSpeed, musicVolume:0.7, sfxVolume:0.55, chordAssist:true}` | merge 默认值容错 |
| `bs_offset_ms` | number，读写均夹紧 ±200 | 与 chart offset 相加 |
| `bs_keys` | `string[4]`（物理键码） | 旧单字符自动升级 |
| `bs_onboarded` | `"true"` | — |
| `bs_favorites` | `track_id[]` | — |
| `bs_scores` | PB 列表 `{track_id,tier,mode,score,accuracy,at}` | **每键只留最高分**；全局 cap 200（总纲「history 10 条」语义已变） |
| `bs_display_name` | string（默认 "Player"） | 无 UUID（`bs_player_id` 未实现） |
| `bs_board` | Local Board Top50 `{track_id,title?,tier,score,accuracy,name,at}` | 仅 Arcade 且未失败且 ≤MaxScore×1.01 写入 |
| `bs_daily_board` | Daily 条目 + `dateKey`，cap 200，读时按今日过滤 | — |
| `bs_last_run` | LastRun v1（sessionStorage + `bs_last_run_local` localStorage 双写） | 含 `prevBestScore`（写前快照，Results 用于判定真 NEW RECORD）、`missEvents` |
| `bs_analytics` | 事件缓冲 cap 120 | Plausible 无阻塞转发 |

**LastRun schema（Results 唯一输入）**：`v, track_id, title, artist, tier, mode, score, accuracy, maxCombo, grade, fc, ap, counts{perfect,great,good,miss}, totalNotes, missEvents?, durationMs, endedAt, prevBestScore?`。缺对象 → Results 显示 "No recent run on this device" 并给 `?run=local` 提示。

**未实现（总纲有、代码无）**：`bs_player_id`、`bs_achievements`、`bs_rank`（成就/段位体系整体缺位，见 §15）。

**分享**：Copy link = `"{origin}{base}/results?run=local"` + 固定文案 `"I just ran {title} on BeatScape — {acc}% {grade}. Feel the Beat, Own the Scape. {url}"`（✓ 总纲 §6.0.24）；海报 = Canvas 1200×630 PNG（半调网点 + 共振菱形 motif + 曲名/Grade/Acc/Combo/Owned 条），`beatscape-{id}-{grade}.png` 下载。

---

## 11. 埋点（隐私友好）

Plausible（`window.plausible` 可选挂载，不注入第三方脚本本身）+ localStorage 缓冲。事件集：`home_view / home_play_click / home_sound_toggle / home_hero_play_start / home_hero_play_finish / daily_challenge_click / intro_start / intro_dismiss / radio_view / play_start / play_finish / share_copy / share_poster`。DEV 下 console.debug。

---

## 12. 视觉规范 as-built（RESONANCE v2.0）

| Token | 值 |
|-------|-----|
| 墨底 / 次底 | `#12100F` / `#1C1717` |
| 主文案 / 次文案 | `#F5EFE6` / `#A8928B` |
| 主强调（朱红）/ 正向（米白）/ 警示（琥珀） | `#E23D3D` / `#F2E4C9` / `#FFB020` |
| 四道色 | `#E23D3D` · `#F2E4C9` · `#FFB020` · `#5B8DEF`（道 3 刻意保留冷色——高速下落可读性） |
| 判定色 | Perfect 米白 · Great 琥珀 · Good 钢蓝 · Miss 朱红 |
| 街区色 | Pulse Core 朱红 · Glass Rim 骨白 `#E4D8C4` · Night Grid 牛血 `#6E2426` · Afterhours 陶土 `#B0765A` · Chrome Yard 灰烬 `#8C8079` · Slide 琥珀 · Skyline 钢蓝 |
| 字体 | Anton（展示/HUD）· Sora（次级）· IBM Plex Sans（正文）——全 OFL |
| Motif | 共振菱形（同心菱形外描边内实心）：logo、海报、判定特效、favicon 一以贯之 |
| 语法 | 平涂硬边、2–3px 黑描边、斜切面板、漫画星芒/半调网点、美式波普判定字；**禁**渐变辉光、日文拟声、二次元贴纸（§7.7 红线） |

---

## 13. 构建与部署

```bash
pnpm dev:beatscape            # Vite 5175，base /beatscape/，根路径 302 → /beatscape/
pnpm --filter @musicsaas/beatscape test   # vitest run（node 环境）
npm run build                 # tsc --noEmit && vite build（base /beatscape/）
npm run build:cf              # VITE_BASE=/ → Cloudflare Pages 构建
npm run deploy:cf             # build:cf + wrangler pages deploy dist --project-name=beatscape
```

- 依赖仅 `react / react-dom`（runtime 零额外依赖）；dev：vite/vitest/typescript/plugin-react。
- SPA fallback 三套齐备：CF `public/_redirects`（`/* /index.html 200`）、`netlify.toml`（+ catalog 1d / assets 1y immutable 缓存头）、`vercel.json` rewrite。
- `index.html`：Google Fonts（Anton/Sora/IBM Plex Sans）+ preconnect；SVG data-URI favicon（共振菱形）。
- **部署状态**：线上 CF Pages 仍为 35 首旧版——85 首版本已构建待重部署（SESSION P0）。

---

## 14. 质量与验收（2026-08-30 实测 · 晚间更新）

- `vitest run`：**14 文件 / 96 用例全部通过**（~250ms）。
- 关键验收面（`prdAcceptance.test.ts`）：Arcade 窗 15/30/50、MaxScore=N×300×4、准确率权重（P1+Gr0.75 → 2 音符 87.5%）、hold=2 计数、51ms=Miss、防抖 20ms、判定线几何、Stage2 Slide 结构合法性（相邻道、end>t、仅出现在 intro 段之后）。
- 其余单测覆盖：judge / playState（含 chordAssist bank great 语义）/ geometry / noteSprite / touchInput / keyMap / session 存档 / pageMeta（18 例）/ i18n leaderboard / trackVibe / **profanity（leet 归一化 + Scunthorpe 防误报）** / **radio（跨季调度 + MONOLITH 真名按季 ≤3 + 违禁词护栏）**。
- 谱面 QA：`python3 scripts/beatscape-chart-difficulty.py --tier hard`——85 张 hard 同手率 **40.5%** ≈ 生成器理论值 2/5（同手和弦观察项已关闭，非缺陷）。
- 内容 QA：`public/reports/audit-report.json`（2026-08-29 生成）85 首逐曲字段 PASS；`pnpm catalog:beatscape` 配额缺口 0（SESSION 记录）。
- 人工验收待办（SESSION P0）：50 首耳检（**工具已备**：`python3 scripts/beatscape-earcheck-worksheet.py` → `earcheck-worksheet.html`，逐曲播放器 + 判定持久化，仓库本地不部署）、CF 重部署、RESONANCE 差异化盲测（上线前唯一未过项）。

---

## 15. ⚠ 与总纲（docs/PRD-BEATSCAPE.md v1.9.2）的差异清单

> **✅ 状态更新（2026-08-30）**：下表差异已**全部回写** `docs/PRD-BEATSCAPE.md` **v1.9.3**——运行时真值改按代码（键位 / Play Now / 引导 / AR / Hold 尾窗 / 海报 / 榜单 / 存档 / IA / 曲目表 BPM 与默认值 / catalog schema / chart schema 等），未实现项在总纲中显式标注〔规划〕。本表保留为差异分析记录，**新接手者以两份 PRD 现行版为准**。

> 以下为**代码事实 ≠ 文档事实**的全部发现。按影响排序；建议在总纲下一次修订时逐条登记（总纲 §4.18 冻结条款要求玩法/键位类变更走变更单）。

| # | 主题 | 总纲真值 | as-built 真值 | 评估 / 建议 |
|---|------|----------|---------------|-------------|
| 1 | 默认键位 | D F J K | **Arrow keys ←↓↑→**（FNF 布局）；DFJK 为预设 | 面向海外新手合理；修订总纲 §4.1/§4.9 |
| 2 | Play Now 默认局 | #01 Neon Pulse · Standard · Arcade | **bs-s4-10 Strike Vector · Easy · Casual** | 首局降门槛；修订总纲 §4.9 |
| 3 | 首访引导 | 强制引导（Skip→#01 Casual） | **非阻塞 Home intro 弹窗**，可 "Explore on my own" | commit 834fb12 产品决策；修订总纲 §4.9 |
| 4 | Approach 公式 | `approach_beats = 50/AR` | **`APPROACH_VISIBLE_BEATS = 64`**（+28% 可见时长） | 手感真值以 64 为准；反向修订总纲 §4.10 |
| 5 | 分享海报 | 1080×1350（4:5 竖版） | **1200×630 横版**（与 OG 同比例） | 如需 IG 4:5 传播需另出模板 |
| 6 | 榜单加权 | `score × tier_weight`（1.0/1.1/1.25） | 纯 score 排序，无跨难度加权 | 简化实现；跨 tier 比较场景出现时补 |
| 7 | 成就/段位 | §17 八成就 + 四段位 + `/profile` 页 | **整体未实现**（键 `bs_achievements/bs_rank/bs_player_id` 均无） | 曲库已 85 首，留存抓手缺口；建议列为下一 Stage 候选 |
| 8 | SEO 静态化 | sitemap.xml / robots.txt / canonical | **均未生成**（纯 SPA + `_redirects`） | 站点已上线，长尾 SEO 缺口；低成本可补 |
| 9 | 屏蔽词 | `profanity-en.txt` 过滤玩家名 | **未实现**（仅 maxLength 24） | Local Board 无公开展示面，风险低；上服务端榜前必须补 |
| 10 | i18n | 全站英文 | en/zh 词条模块已备（含测试）但**页面未接线**，UI 全英文 | 出海站保持英文合理；zh 资产闲置待接 |
| 11 | Hold 尾窗 | 「Good 窗 + ±20ms 吸附」 | 三档**全部 +20ms**（15/30/50 → 35/50/70） | 比文档更宽松；如需严格对齐改 `judgeHoldTail` |
| 12 | 键位浮层 | 前 3 局显示 | 始终显示（非触屏） | 无害 |
| 13 | 后台恢复 | 「回前台自愈后再 Resume」 | hidden 即**自动 Pause**，用户手动 Resume | 更保守安全；修订总纲 §4.11 措辞 |
| 14 | 存档历史 | 每曲 history ≤10 条 | `bs_scores` 全局 cap 200、每键只留最高 | 语义简化 |
| 15 | catalog 字段 | `audio_master` / per-track `stream_app_url` | 数据中无此二字段（深链走 `VITE_STREAM_APP_URL` 全局 env） | 文档滞后于数据 |
| 16 | hold-tick SFX | 默认 Off | 未实现 | 与「默认 Off」等效 |
| 17 | Calibrate 中位数 | 8 拍取中位数 | ≥3 次才取中位数，<3 记 0 | 防误触保护，合理 |
| 18 | Exit 弹窗 | 自绘确认（未规定实现） | 原生 `window.confirm` | 可接受；视觉党可后续自绘 |

**已验证无偏差的关键红线**（防「抄错引擎」复查结论）：判定窗 15/30/50（非 NeonBeat 22/45/80）✓ · Casal 28/55/90 ✓ · Good 断连 ✓ · 空按无惩罚 ✓ · MaxScore 闸门 ✓ · m4a decode ✓ · Local Board 无假全球榜 ✓ · 零广告零账号 ✓ · SFX/字体/封面全自有 ✓ · Hip-hop 无 double-time 特判需求（判定以 metadata BPM 为准）✓。

---

## 16. 已知缺口与下一步建议

**P0（上线门槛，承接 SESSION）**
1. 重新部署 CF Pages（85 首）→ `npm run deploy:cf`。
2. 50 首人工耳检 + RESONANCE 盲测（§7.7，5–10 名非日式 RPG 观察者）。

**P1（产品缺口，按 ROI 排序）**
1. **成就 + 段位体系**（总纲 §17 已有完整规格，纯前端可做）：85 首规模下是最大留存抓手；顺带补 `bs_player_id`。
2. **sitemap.xml / robots.txt** + 预渲染关键静态页：解锁长尾 SEO（85 个 track 页现在是爬虫盲区）。
3. ✅ ~~总纲差异清单 §15 的 1–4 项回写~~ — **已完成**：`docs/PRD-BEATSCAPE.md` 已升至 v1.9.3（as-built 全量对齐，含 §15 全部 18 项）。
4. i18n 接线（zh 已备）或删除模块，避免死代码。
5. 海报 4:5 竖版模板（IG/TikTok 传播位）。

**P2（打磨）**
- 自绘 Exit 确认弹窗（替换 `window.confirm`）。
- `audio_master` 字段与仓内 masters 台账对齐；per-track `stream_app_url` 落数据。
- 玩家名 profanity 过滤（上服务端榜前）。

---

## 17. 附录：关键常量速查

| 常量 | 值 | 出处 |
|------|-----|------|
| `WINDOWS_ARCADE` | 15 / 30 / 50 ms | judge.ts |
| `WINDOWS_CASUAL` | 28 / 55 / 90 ms | judge.ts |
| Hold 尾吸附 | 各档 +20 ms | judge.ts `judgeHoldTail` |
| 基础分 | 300 / 200 / 100 / 0 | judge.ts |
| 连击倍率 | 50→×2 · 100→×3 · 200→×4 | judge.ts |
| HP 增减 | +2/+1/0/−7，尾 Miss −5，cap 100 | judge.ts |
| Practice 减速 | 3 Miss → 0.5× 持续 5000 ms | playState + PlayField |
| `APPROACH_VISIBLE_BEATS` | 64 | geometry.ts |
| 判定线 | 短边 × 15% 距底 | touchInput.ts |
| 道内防抖 | 20 ms | touchInput.ts |
| 触控边缘 guard | 左右各 5% | touchInput.ts |
| 音符尺寸 | 道宽 0.8、上限 60px、近线放大 0.22 | noteSprite.ts |
| 倒计时 | 3000 ms | PlayField.ts |
| 连击里程碑 | 10/25/50/100/150/200/300 | PlayField.tsx |
| Offset 夹紧 | ±200 ms | settings.ts |
| Music/SFX 默认音量 | 0.70 / 0.55 | settings.ts |
| 校准 | 8 拍 @120 BPM · ≥3 次取中位数 | Calibration.tsx |
| Board 容量 | Local 50 · Daily 200 · scores 200 | session/settings.ts |
| 首局曲 | `bs-s4-10` Easy Casual | lib/firstPlay.ts |
| 引导曲 | `bs-s1-02` Easy Casual | lib/firstPlay.ts |
| 精选 | `bs-s1-01/02/05` · Showcase `bs-s1-01/05, bs-s2-01, bs-s1-04, bs-s3-06` | constants/scape.ts |

---

*End of Document — BeatScape apps/beatscape/PRD.md · As-Built 2026-08-30 · 67/67 tests green*
