# MusicSaas 代码索引

> Agent 改代码前先定位模块；**勿**全仓盲搜 `node_modules` / `dist`。  
> 索引边界见 [.cursorignore](../.cursorignore) · [.cursor/rules/code-index.mdc](../.cursor/rules/code-index.mdc)

---

## 1. 仓库地图

```text
MusicSaas/
├── apps/
│   ├── gateway/          # M1–M3 REST API + Job 队列 + Demo BFF
│   ├── demo/             # M8 Vite React 演示页
│   ├── beatscape/        # duohertz 主线节奏游戏（迁移期目录名不变；旧版 BeatScape 代码同目录）
│   └── neonbeat/         # 参考节奏游戏（判定窗 22/45/50，勿混用）
├── workers/
│   ├── ace-step/         # M4 ACE MLX FastAPI Worker
│   ├── sa3/              # M5 SA3 MLX FastAPI Worker
│   └── common/           # Worker 共享工具
├── packages/shared/      # TS 共享类型（mode 枚举等）
├── scripts/              # 运维、验收、BeatScape 流水线
├── tests/                # pytest 单元 + harness
├── docs/                 # 产品与 Harness 文档
├── data/                 # 本地运行时（gitignore）
├── examples/             # curl / Python 调用示例
├── PRD.md                # 产品总纲
├── SESSION.md            # 项目续作真相
└── AGENTS.md             # Agent 入口
```

---

## 2. apps/gateway

| 路径 | 职责 |
|------|------|
| `src/index.ts` | Hono 入口、路由挂载 |
| `src/routes/jobs.ts` | POST/GET `/v1/jobs` |
| `src/routes/demo.ts` | Demo BFF `/demo/api/*` |
| `src/services/job-queue.ts` | 内存/DB 队列调度 |
| `src/services/worker-client.ts` | 调用 ACE/SA3 Worker |
| `src/services/storage.ts` | 音频文件存储 |
| `src/middleware/` | API Key、限流 |
| `prisma/schema.prisma` | Job 模型 |

**测试：** `pnpm --filter gateway test`（Vitest）

---

## 3. apps/demo

**公开门户**：`src/Portal.tsx` + `styles/portal.css`，`pnpm release:portal` 构建 `dist-portal/`；原 Demo 继续 `pnpm --filter demo build` → `/demo/`。`scripts/release.mjs` 校验域名/静态闭包/样例/哈希，`e2e/` 覆盖门户与本地 Demo，发布与回滚见 [PORTAL-RELEASE-READINESS.md](./PORTAL-RELEASE-READINESS.md)。

| 路径 | 职责 |
|------|------|
| `src/App.tsx` | 四 mode UI 入口 |
| `src/api.ts` | 仅调 Gateway `/demo/api` |
| `src/components/` | 表单、播放器、状态 |

**构建：** `pnpm --filter demo build` → Gateway 静态挂载 `/demo`

---

## 4. apps/beatscape（duohertz 主线）

### duohertz 入口速查

- **代码**：新前端在 `apps/beatscape/src/duohertz/`；目录名沿用 BeatScape（迁移期约定，见 `apps/beatscape/PRD.md` 开篇）。
- **dev 路由**（DEV-only，`src/App.tsx:32-64/154-174`）：`/beatscape/lab/duohertz/home`（开发 hub）、`/beatscape/lab/duohertz/library|characters|radio`、`/beatscape/lab/duohertz/v2/home|library|play/:id|radio|characters`（v2 目标版，独立 `V2Shell`）。
- **三种构建模式**：dev（`import.meta.env.DEV` 启用 lab 路由）· 独立审查包 `build:duohertz:preview`（`VITE_DUOHERTZ_PREVIEW=1` → `dist-duohertz/`）· 新品牌源码包 `build:duohertz:source`（`VITE_DUOHERTZ_RELEASE_SOURCE=1` → `dist-duohertz-source/`，noindex，不含旧 `public/`）。
- **本机命令**：`pnpm --filter @musicsaas/beatscape test`（Vitest）· `test:lab`（Playwright `lab-e2e/`，端口 4188）· `test:duohertz:preview` · `test:duohertz:source`。
- **候选暂存**：`apps/beatscape/candidates/duohertz/`（本机未入库，751MB、315 个 `.m4a`）。
- **易踩事实**：`public/catalog/dh-*/` 当前**只有 `cover-thumb.webp`**（105 个，已入库）；真实音频／谱面在本机 `candidates/duohertz/`（gitignore 未入库）→ 直接请求 `public/catalog/dh-*/audio.m4a` 会命中 SPA 回落而非音频。
- **谱面门禁**：生成／重生成须过 `scripts/beatscape-chart-gate.py`（BS-D002）；候选整体流程见 `docs/DUOHERTZ-CATALOG-PROMOTION.md`。

**duohertz 转型（隔离开发中）**：目标见 `apps/beatscape/PRD.md` 开篇；`src/duohertz/` 放新 `format: 2` 一／双键谱面解析、判定原型、开发首页／曲库预览、试玩页、Solo／Duo 结算卡、电台开发页及角色卡，`src/duohertz/candidate.ts` 从隔离候选 manifest 自动构建仅开发页使用的试听列表，`src/duohertz/catalog.ts` 独立解析未来 v2 目录并读取新谱（未接入正式入口）；`src/duohertz/trackCards.ts` 区分候选与公开 v2 卡片数据，`src/duohertz/TrackGrid.tsx` 共用卡片版式。`src/duohertz/Game.tsx` 是脱离候选导入的一／双键玩法组件，`TimingCalibration.tsx` 与 `timing.ts` 提供独立于旧站存档的本地时序校准，并复用 `src/input/eventTiming.ts` 对可信输入时间戳做有界补偿；`Lab.tsx` 只负责开发候选；`Radio.tsx` 是不导入候选清单的共享电台播放器，支持曲名／艺人搜索与曲风筛选，`RadioLab.tsx` 只装配开发长版母带；`ApprovedHome.tsx`、`ApprovedLibrary.tsx`、`ApprovedPlay.tsx`、`ApprovedRadio.tsx`、`ApprovedCharacters.tsx` 与 `approvedTrack.ts` 为 v2 审查路径，`characterCatalog.ts` 单独校验三人已批准清单及正／侧面图哈希字段格式；获批曲卡与电台以 `?track=<dh-id>` 互通，`V2Shell.tsx` 提供不挂载旧版曲库的独立品牌导航；`vite.config.ts` 在开发 v2 路由去掉旧目录 HTML 预载。`src/duohertz/DuohertzApp.tsx`、`main.tsx`、`base.css` 与 `duohertz-index.html` 构成独立 `build:duohertz:preview` 静态审查包，`LegacyTrackTransition.tsx` 为旧曲分享／对局链接提供无曲目映射的过渡页；构建后回归在 `preview-e2e/`，该包不含旧 `public/` 或 PWA，尚无真实批准目录及正式发布地址。这些页面拒绝未获站点批准的目录，按需读取目标谱面或长版音频，真实正式玩家入口仍待完成。`candidates/duohertz/` 放未签审音频、谱面、视觉与本地审稿工作表。`scripts/duohertz-candidate-gate.py` 可对单曲或以 `--all-staged` 对全部暂存曲目运行 BS-D002 音频对齐，`scripts/duohertz-catalog-structure.py` 核对 105 首／315 张新谱及五类配额，`scripts/duohertz-review-worksheet.py` 生成哈希绑定的人工观察入口，`scripts/duohertz-review-audit.py` 核对导出记录是否与当前素材一致；`scripts/duohertz-art-prompts/` 留存改版封面提示词、来源及旧版哈希，`scripts/duohertz-generate-sa3.py` 留存本地 Gateway 任务回执，`scripts/duohertz-chartgen.py` 从新音频实际起音生成一／双键技术草谱，`scripts/duohertz-stage-sa3.py` 用 `scripts/duohertz-recipes/` 的配方、SA3 WAV、匹配回执和原创图像组装隔离候选并先运行单曲门禁；`scripts/duohertz-build-catalog.py` 在内容、完整版和签审条件齐全后仅生成隔离的 v2 曲库，`scripts/duohertz-build-characters.py` 在角色文案／图片和四类人工签审齐全后仅生成隔离的三人角色包，`scripts/duohertz-check-staged-content.py` 只读复核两类暂存产物的数量、路径和内部哈希，规则见 `docs/DUOHERTZ-CATALOG-PROMOTION.md`。这些工具都不授予网站部署批准。旧 `public/catalog.json` 仍是 BeatScape 正式目录。

曲卡、电台、赛前与结算小图流量优化：`scripts/duohertz-cover-thumbs.py` 从哈希核对的 1024px 候选封面在本机派生 240px WebP；开发曲卡用 `candidates/duohertz/thumbnails/`，签审目录暂存器从原图重新派生并将缩略图 SHA-256 写入 v2 元数据。`src/duohertz/ApprovedRadio.tsx` 把获批目录卡图用于 240px 电台主图与 64px 列表，`approvedTrack.ts` 把卡图传给 `Game.tsx` 的赛前与结算小图，审稿仍用原图；`preview-e2e/brand-build.spec.ts` 核对赛前不请求原图。本机诊断脚本 `scripts/measure-duohertz-local.mjs --full-run` 实际跑完首曲并拒绝结算小图请求原图，方法见 [DUOHERTZ-PERFORMANCE.md](./DUOHERTZ-PERFORMANCE.md)，合成批准目录不能冒充正式性能验收。

`scripts/duohertz-check-staged-content.py` 可选带齐观察导出、曲库签审、已审角色 roster 与角色签审，重新核对暂存包与原始证据和素材哈希；结果仍不授予站点批准。

新站源码构建：`apps/beatscape/vite.config.ts` 的 `VITE_DUOHERTZ_RELEASE_SOURCE=1` 模式只编译 `src/duohertz/main.tsx`，输出独立 noindex `dist-duohertz-source/`，不复制旧 `public/`；`src/router.tsx`、`src/routePreload.ts` 和 `src/components/ErrorBoundary.tsx` 对两个 duohertz standalone 模式共用编译期隔离。`source-e2e/` 验证旧 chunk 不入包、真实未批准目录拒绝和合成新品牌路径。`scripts/duohertz-assemble-release.py` 在本地复核原始签审与站点批准后组装新品牌包，并在写出前核验成品；`scripts/duohertz-verify-release.py` 可独立复核包内一致性但不重放外部人工签审。协议见 `docs/DUOHERTZ-CATALOG-PROMOTION.md`。真实签审与真实最终包的浏览器／性能验收仍待完成。

duohertz 站点图候选：`apps/beatscape/scripts/render-duohertz-site-art-study.mjs` 用本机 Chromium 渲染原创 SVG、192／512／180 px 图标及 1200×630 分享图；`apps/beatscape/candidates/duohertz/site-art-study/` 为未审对照板与输出，不是正式 `--site-art` 来源。

duohertz 输入与目录会话：`src/duohertz/keymap.ts` 保存独立的一键／左右键物理键位，`Game.tsx` 提供重绑 UI；`src/duohertz/catalog.ts` 对通过批准字段检查的同 URL 目录复用一次会话读取，失败／未批准不缓存，显式重试清除缓存。`lab-e2e/keymap.spec.ts` 与 `preview-e2e/brand-build.spec.ts` 覆盖实际玩法键及跨页目录请求数。

duohertz 对局音频：`src/duohertz/Game.tsx` 复用 `src/audio/decodedAudioCache.ts` 的有界 PCM 缓存、取消订阅和失败重试；`lab-e2e/candidates.spec.ts` 核对同曲停止后重玩只下载一次游戏 AAC，正式路径仍从已批准目录提供 URL。旧 ScapeMusic `/#/track/bs-*` 分享地址由 `DuohertzApp.tsx` 提供的 `Router.hashRoute` 解析到现有 `LegacyTrackTransition.tsx`，仅根路径识别，打开过渡页不请求新目录。

正式对局首屏：`Game.tsx` 在未来获批单曲路径以当前曲名作为 h1，开发候选试玩仍以 duohertz 为 h1；`preview-e2e/brand-build.spec.ts` 用最长候选曲名检查 320px 标题、开局按钮和底栏几何。

双键打击反馈：`Game.tsx` 按输入轨显示波纹／光粒，`shell.css` 将第一轨设为电青、第二轨设为珊瑚色，`lab.css` 在系统或游戏内减少动态效果时改用淡出。`preview-e2e/brand-build.spec.ts` 用键盘实按检查两轨不同色及低动效模式；研究截图在 `candidates/duohertz/style-studies/two-key-feedback-study.png`。

对局临时资源：`Game.tsx` 将 Web Audio 音乐／提示音源保存在只含活跃节点的 `Runtime.sources`，`ended` 即移除；波纹计时器触发后从待清理集合移出，暂停／停止／卸载释放剩余项。`lab-e2e/` 覆盖行为回归；`scripts/measure-duohertz-local.mjs --input-memory` 用本地合成目录测同页 10 局密集输入的 CDP 堆与 DOM 趋势，`--full-run-input` 测首曲持续脚本输入整局的帧间隔；限定见 `docs/DUOHERTZ-PERFORMANCE.md`，不构成正式性能预算通过。

获批曲库逐批浏览：`src/duohertz/ApprovedLibrary.tsx` 首批展示 15 首，每次再展开 15 首；`src/duohertz/libraryDepth.ts` 校验 URL 中的展开数量，`ApprovedPlay.tsx` 在返回选曲时恢复该数量。搜索和曲风变化复位首批，`preview-e2e/brand-build.spec.ts` 覆盖刷新、对局返回、失效曲目回程与展开至 105 首。

音乐站与对局往返：`ApprovedRadio.tsx` 将新品牌对局地址传给共享 `Radio.tsx`，未来公开路径页头游戏入口指向当前选中曲目；搜索结果排除当前曲时，`Radio.tsx` 显示当前仍在播放、需点选结果才能换曲的提示，不由搜索自动中断播放。`ApprovedPlay.tsx` 将当前曲目 ID 带给 `Game.tsx` 的结算电台入口。开发候选电台仍通向开发试玩入口。`preview-e2e/brand-build.spec.ts` 核对筛选提示、选择、换曲、短局结算与同曲电台落点。

独立审查包本地浏览器矩阵：`playwright.duohertz-preview.config.ts` 使用 WebKit 可访问的 `127.0.0.1:4187`；默认 `test:duohertz:preview` 跑 Chromium，`pnpm exec playwright test --config playwright.duohertz-preview.config.ts --browser webkit` 复用 21 个用例检查 WebKit 引擎。分享链接用例用页面内剪贴板桩验证目标 URL，不请求浏览器专有权限；WebKit 引擎回归不算真机 Safari 验收。

人工耳检辅助：`scripts/duohertz-loudness-review.py` 用本机 ffmpeg 测量 105 首三个 AAC 版本并绑定当前 manifest／音频哈希，生成 `candidates/duohertz/loudness-review.html` 与 JSON；按曲间电平差排序供复听，不授予母带或发布通过。`scripts/duohertz-review-worksheet.py` 仍是人工观察导出入口。

**上线准备**：[BEATSCAPE-RELEASE-READINESS.md](./BEATSCAPE-RELEASE-READINESS.md) · `pnpm release:beatscape` 技术检查 · `apps/beatscape/scripts/release.mjs` 构建资产/哈希门禁 · `scripts/launch-check.mjs` 正式放行 · `scripts/live-smoke.mjs` 发布后只读检查 · `e2e/release.spec.ts` 生产包浏览器回归 · `scripts/capture-blindtest.mjs` 捕获绑定候选哈希的 5 张人工盲测截图。

**自动性能**：[BEATSCAPE-PERFORMANCE.md](./BEATSCAPE-PERFORMANCE.md) · `apps/beatscape/scripts/performance.mjs` 测现有生产包的冷加载、完整 Hard / 特效 / Duo、同一 SPA 内重开与切歌内存；`performance-probe.mjs` 采集真实时钟输入与帧 / 音频指标，`performance-coverage.mjs` 拒绝未实际跑完整场景的证据，`performance-budget.mjs` 对同一产物的完整报告检查加载 / 帧 / 绘制 / 内存固定预算。HTML head 音频预取与接管见 `scripts/early-audio.mjs`、`src/audio/earlyAudio.ts`；可见音符窗口和文字缓存见 `src/components/playfield/{visibleNoteEnd,milestoneTextSprites,keyHintSprites}.ts`。

| 路径 | 职责 |
|------|------|
| `src/App.tsx` | 路由壳 |
| `src/router.tsx` | 轻量自研路由（无 react-router-dom） |
| `src/pages/` | Home · FirstShift · Library · Track · Play · Results · Calibration · Settings · Leaderboard · Characters · Radio · Profile · Legal · NotFound |
| `src/data/firstShift.ts` + `src/lib/firstShift.ts` | 三节点可玩开场：对白/曲目、真实结算顺序推进、存档恢复与本次访问兜底 |
| `src/components/ShiftStory.tsx` + `src/pages/FirstShift.tsx` | `/shift`、首页继续入口、结算回信、连接状态与对白重读 |
| `src/data/radioEpisodes.ts` + `src/lib/radio.ts` | **The Late Static 电台**：Year 1 三季 24 集多人对白 + 固定周播调度；独立于开场进度（World Bible §8） |
| `src/constants/scape.ts` | JUDGE_COPY / COMBO_COPY 判定文案皮肤 + CHARACTER_ART 三人档案 |
| `src/lib/profanity.ts` + `src/data/profanity-en.txt` | 昵称脏词过滤（leet 归一化 + token 精确匹配） |
| `src/catalog/trackRequests.ts` + `src/data/trackRequests.json` | 105/105 首虚构点歌引语；`scripts/beatscape-track-requests.py --check` 校验覆盖及内容一致 |
| `e2e/narrative.spec.ts` | 桌面/手机模拟：首访、三首真实歌曲故事推进、回信/重载、退出/失败/练习/存储拒绝 |
| `src/components/PlayField.tsx` | 谱面渲染、Tap to Start、键盘（默认方向键，物理键码）+ 触控 |
| `src/components/ExitGameDialog.tsx` + `src/styles/exit-game-dialog.css` | 单人 / Duo 全屏退出确认；暂停、恢复、焦点与全屏清理，回归见 `e2e/exit-dialog.spec.ts` |
| `src/engine/judge.ts` | 判定窗 15/30/50 ms |
| `src/engine/surge.ts` + `surge.test.ts` | **SIGNAL 氛围层**：命中质量→热量→三档（TUNING/LIVE/ON AIR）纯逻辑；只驱动表现，不碰计分/判定窗（docs/BEATSCAPE-SURGE-FX.md） |
| `src/storage/settings.ts` | `bs_*` localStorage |
| `public/catalog.json` | 曲库元数据（85 首 · v1 · 双资产） |
| `catalog-roadmap.json` | 正式版 50 首槽位 · Stage/曲风配额真值 |
| `public/catalog/bs-s*/` | 85 首曲目录：audio/stream m4a + 三难度 chart + cover.svg + og.png |

**可玩性 / 欧美增长 TODO：** [BEATSCAPE-PLAYABILITY-GROWTH-TODO.md](./BEATSCAPE-PLAYABILITY-GROWTH-TODO.md)
—— T1a 站点级 OG 卡 / T2 Note speed 滑杆（arcade 也要能调）/ T3 判定偏早偏晚 /
T4 从失败点重开 / T5 分享文案。含 2026-09-05 逐条核实的状态快照与两处误判修订。

**脚本：**

- `scripts/beatscape-ingest-stage1.py` — Stage1 预览 → public catalog
- `scripts/beatscape-ingest-stage2.py` — Stage2 合并入库（#07–#10）
- `scripts/beatscape-stage6-specs.py` + `sync-manifest` + `ingest-stage6.py` + `pipeline.py` — Stage6 扩容 35→85 流水线
- `scripts/beatscape-track-registry.py` — Stage1+2 锁定元数据
- `scripts/beatscape-stage2-manifest.json` — Stage2 生成 Job 草案
- `scripts/beatscape-audit.py` — 时长/元数据 QA
- `scripts/beatscape-chart-difficulty.py` — 谱面难度画像（NPS/和弦/同手率 40.5% 结论）
- `scripts/beatscape-track-requests.py` — 电台点歌文案生成（4 vibe × 12 句轮转）
- `scripts/beatscape-earcheck-worksheet.py` — 人工耳检 HTML 工作单生成（50 首逐曲播放器）

**预览：** `pnpm dev:beatscape` · base `/beatscape/`

---

## 5. apps/neonbeat（参考）

判定与 BeatScape 不同（22/45/50）。仅作 UI/引擎参考，**不要**把 NeonBeat 常量抄进 BeatScape。

---

## 6. workers/

| Worker | 入口 | 端口（默认） |
|--------|------|-------------|
| ACE | `workers/ace-step/server.py` | 8001 |
| SA3 | `workers/sa3/server.py` | 8002 |

Mac 启停：`scripts/mac-services-up.sh` · `scripts/mac-stack-verify.sh`

---

## 7. scripts/（精选）

| 脚本 | 用途 |
|------|------|
| `harness.sh` | 统一测试入口（unit/integration/e2e/mlx） |
| `print-status.sh` | Harness 进展快照 |
| `acceptance-p0.py` | Gateway 快速验收 |
| `acceptance-demo-web.py` | Demo Web 12 项验收 |
| `acceptance-mlx-vocal.py` | MLX 人声 E2E |
| `mac-services-up.sh` | Mac 全栈启动 |
| `beatscape-ingest-stage1.py` | BeatScape 内容入库 |
| `beatscape-audit.py` | BeatScape 内容 QA |

---

## 8. 测试矩阵

| 命令 | 范围 |
|------|------|
| `pnpm test` | gateway vitest + pytest unit |
| `pnpm test:integration` | mock workers + acceptance-p0 |
| `pnpm test:e2e` | demo web acceptance |
| `pnpm test:mlx` | Mac MLX（不可达则 skip） |
| `pnpm audit:beatscape` | Stage1 catalog QA |
| `pnpm catalog:beatscape` | 路线图 vs 已上架缺口统计 |

BeatScape 待办与验收：[BEATSCAPE-TODO-ACCEPTANCE.md](./BEATSCAPE-TODO-ACCEPTANCE.md) — **历史冲刺归档**：Stage1–3 验收规格（2026-08-25），27 条未勾选项属过期冲刺，**不是当前待办**；当前入口为仓库根 [TODO.md](../../TODO.md)

---

## 9. 索引排除（勿当作源码）

以下目录 **存在但默认不参与 Agent 索引**：

- `**/node_modules/`
- `**/dist/`
- `data/`（本地 DB、预览音频、生成物）
- `apps/beatscape/public/catalog/**/*.m4a`（二进制资源，改元数据走 JSON + ingest）

---

## 10. 改哪里（决策树）

```text
改 API 契约？        → docs/DATA_API.md + apps/gateway/src/routes/
改 Demo UI？         → apps/demo/src/
改 BeatScape 玩法？  → apps/beatscape/src/engine/ + PRD-BEATSCAPE.md
改曲库/谱面？        → scripts/beatscape-* + public/catalog/
改世界观/电台剧集？  → docs/BEATSCAPE-WORLDBIBLE.md + src/data/radioEpisodes.ts
改可玩开场/回信？    → src/data/firstShift.ts + src/lib/firstShift.ts + components/ShiftStory.tsx
改可玩性/欧美增长？  → docs/BEATSCAPE-PLAYABILITY-GROWTH-TODO.md
改推理？             → workers/* + docs/INFERENCE.md
改 Harness/续作？    → AGENTS.md + .agents/skills/ + SESSION.md + worklog/
```

Agent 配置审计与维护：[AGENT-WORKFLOW-AUDIT.md](./AGENT-WORKFLOW-AUDIT.md)。按需流程：
[music-verify](../.agents/skills/music-verify/SKILL.md)（实际验收范围）、[music-delivery](../.agents/skills/music-delivery/SKILL.md)（agent-safe Issue）。
