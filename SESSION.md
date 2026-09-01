# SESSION — MusicSaas

| 字段 | 值 |
|------|-----|
| **phase** | 曲库 **85/85** · Stage6 扩容 50 首已入库（SA3 MLX 真推理）· 待人工耳检 |
| **updated** | 2026-08-31 |
| **slug** | musicsaas |

## next（P0）

> 验收入口：本页 · `pnpm catalog:beatscape` · `pnpm audit:beatscape` · `pnpm earcheck:beatscape`

- [ ] **三人立绘重出（prompt 母本 v2 已就绪）**：`scripts/beatscape-anime-prompts.py` 已按 Bible §7 锚点前置 + 统一赛璐璐夜色模板重写，并修复根因——**真实 CLIP BPE 实测**：旧 prompt 全员超标 79–150 被无声截断（白底/丢锚点元凶），新三人 prompt 实测 66–71 BPE（含 `--lora` 触发词）全量通过；跑本地 MPS 管线重出 JUNO/ATLAS/TORQUE → 锚点 checklist 目验（单耳挂耳机/场强仪/扳手鼓槌+铬面锣）→ 替换 `public/characters/` 三张图；市场评估：女性首位非欧美风险（anime 音游垂类常规最优解），真雷点是过度性感化与 AI slop 观感
- [ ] **商业化差距决策点 5 项待拍板**：[`docs/BEATSCAPE-COMMERCIALIZATION-GAP.md`](docs/BEATSCAPE-COMMERCIALIZATION-GAP.md) §6（变现模式 / 经营主体 / 后端栈 / 流媒体终点 / 商标批次）——拍板后解锁对应 P0
- [ ] **世界观 Bible 待办（仅剩人工项）**：[`docs/BEATSCAPE-WORLDBIBLE.md`](docs/BEATSCAPE-WORLDBIBLE.md) §12——文档/文案/判定皮肤/美术/回归语/昵称合规/点歌文案包/**S1 电台剧集包**完成；**商标深检索已完成**（2026-08-30，Justia 全 4 页 73 条 + serial 级核证，§11）：NIGHTSHIFT 游戏内可用但 **Class 41 有 LIVE 在册近邻（Kennelly Reg. 6359178，乐队现场演出）**，商品化/对外品牌化前必须 TSDR 全类正式检索；**备选名初筛已备好**（The Late Static 首推 / Scape City 次选，均无精确同名）；MONOLITH 证实 LIVE（华纳 Reg. 5880307 · Class 9 游戏软件全线）→ 限游戏内叙事不变
- [ ] **人工耳检 50 首**（DoD 唯一剩余项）：是否脱口而出第三方名曲 → 有则废弃重生成。**工具已备**：`python3 scripts/beatscape-earcheck-worksheet.py` 生成 `apps/beatscape/earcheck-worksheet.html`，浏览器打开逐曲听+勾，进度自动保存
- [ ] **重新部署 Cloudflare Pages**（当前线上为 35 首版本；**Reddit 首发文案包已就绪**，见 [`docs/BEATSCAPE-REDDIT-LAUNCH.md`](docs/BEATSCAPE-REDDIT-LAUNCH.md)，部署+盲测过了才发）：`bash scripts/deploy-beatscape-cf-pages.sh`
- [ ] **差异化盲测**（人类 · 阻塞对外宣称上线）：[`docs/RESONANCE-BLINDTEST.md`](docs/RESONANCE-BLINDTEST.md)
- [x] **SIGNAL 氛围层已合入主工作区（未提交）**：高命中玩家对局氛围——SIGNAL 表三档 TUNING/LIVE/ON AIR 点亮 PlayField + 进档音效 + 掉档红闪；结算页 PEAK SIGNAL 徽标 + 海报 ON AIR 金章；计分/判定窗零改动 · patch `git apply` 合入 + 主区 vitest **105/105** + 构建干净 · 回退 `git apply -R docs/BEATSCAPE-SURGE-FX.patch` · 待人工：音色听感 / 真机帧率 / 文案入 Bible §9（文档 §8 草案已备）· worktree `../MusicSaas-wt-surge` 保留可删 · 2026-08-30
- [x] **FEEL PACK 爽感包 + LIGHTING 灯光组 + NEON P1 已实施（未提交）**：打击音按档位分层 / the drop（ON AIR 音乐 low-pass 开闸）/ FFT 呼吸 / 触觉（Android）/ R 键即时重开 / 结算盖章+分数滚动+徽标 pop / 灯光组（跑马灯·光柱·扫光·换色纸，驱动已切 **ScoreStreak 连续得分** 30/70/120 三档，combo 驱动退役）/ NEON P1 侧翼灯管 ×4（CSS steps() 闪烁，body[data-neon] 驱动，≥1100px）· PRD §7.6 霓虹灯管 as-built 注记已补 · vitest **111/111** · 待人工：音色/帧率/阈值口味；P2（灯牌+呼吸边框）待做 · 规格 docs/BEATSCAPE-SURGE-FX.md §2.2b/c + docs/BEATSCAPE-NEON-AMBIENCE.md · 2026-08-31
- [ ] **NEON 氛围层 P2/P3**：L2 城市灯牌 + L3 呼吸边框 → 调参盲测；方案 [`docs/BEATSCAPE-NEON-AMBIENCE.md`](docs/BEATSCAPE-NEON-AMBIENCE.md)
- [ ] **Scape Music 流媒体站 MVP（类汽水音乐 · GAP 5-1 最小终点）已落地，待接线/部署**：worktree `../MusicSaas-wt-musicweb`（branch `feature/beatscape-music-web`）——85 首 `stream.m4a` 完整版播放、竖版沉浸发现流（每日混合 · 上滑切歌）、曲库搜索筛选、The Late Static 四栏目歌单、`/#/track/:id` 单曲深链页（游戏 StreamFullCTA 落点，游戏侧 `VITE_STREAM_APP_URL` 仍 0/85 待指向本站）；vitest 40/40 · tsc/build 绿 · 浏览器目验过；全文与待办（接线 / 部署形态 ≈960MB dist / "Scape Music" 商标初筛）见 worktree `docs/BEATSCAPE-MUSIC-WEB.md`；⚠️ 附带修复 `.gitignore` `data/` 未锚根（`apps/beatscape/src/data/` 的 radioEpisodes.ts / trackRequests.json / profanity-en.txt 从未入库，主仓+worktree 均已改 `/data/`，三文件仍 untracked 待下次提交收编）· 2026-08-30

## 已完成（勿再当 P0）

- [x] **同手和弦观察项关闭（非缺陷）**：全库 hard 同手率 40.5% ≈ 生成器理论值 2/5；新旧组 40.8%/40.2% 无差异，绝对数差来自新 SA3 onset 更密（每谱音符 +23%）；移动端 `chordAssist` 已闭环（同手道 bank great）；`chart-difficulty.py` 新增同手率列 · 2026-08-30
- [x] **Reddit 首发文案包**：[`docs/BEATSCAPE-REDDIT-LAUNCH.md`](docs/BEATSCAPE-REDDIT-LAUNCH.md) 三篇帖文成稿（r/rhythmgames · r/WebGames · r/gamedev）+ 评论区口径 6 问 + 商标/合规红线 + 发帖节奏 · 2026-08-30
- [x] **电台多季支持 + S2 "Cold Blocks" + S3 "The Drop Wars"**：Year 1 三季 24 集全部在库（EP9 起接档无缝）；`radioEpisodes.ts` season+week 结构、`/radio` 三季分组、MONOLITH 真名按季 ≤3 次护栏（实际全 0）；vitest 96/96 · 2026-08-30
- [x] **部署就绪验证 + TSDR 备选名初筛**：`npm run build` 干净出包（JS gzip 99.6 kB）；备选名 The Late Static（首推）/ Scape City（次选）Justia 初筛无精确同名，落 World Bible §11；盲测材料更新至 6 展示面；新增 sitemap.xml + robots.txt · 2026-08-30
- [x] **耳检工作单工具 + PRD as-built 补录**：`scripts/beatscape-earcheck-worksheet.py` → `earcheck-worksheet.html`（50 首逐曲播放器 + Clear/Derivative 判定 + localStorage 持久化，仓库本地不部署）；PRD §9/§11/§14 补录电台系统、路由、埋点、96 用例 · 2026-08-30
- [x] **文档索引登记**：CODE-INDEX §4 补齐 13 页 + 4 组新文件 + 3 个新脚本 + 世界观速查入口；KNOWLEDGE-BASE 新增"世界观/IP/商业化"文档组（6 篇）；.gitignore 补可再生产物；/radio 加集数锚点 + 播出日期 · 2026-08-30
- [x] **总纲 v1.9.4 + 台呼决策**：§1.3a 真相源指向 World Bible、新增 §6.7 电台叙事系统 as-built；15s 台呼评估后记为遗留〔规划〕（需 SA3 preset + 栈启动，不硬启）；Characters ↔ Radio 互链 · 2026-08-30

- [x] **BeatScape 商业化差距分析**：[`docs/BEATSCAPE-COMMERCIALIZATION-GAP.md`](docs/BEATSCAPE-COMMERCIALIZATION-GAP.md)（7 域 34 项 · P0×9/P1×14/P2×11 · 变现模式建议 C+D）· 2026-08-30
- [x] **BeatScape 文档 as-built 对齐**：`apps/beatscape/PRD.md`（实现级 PRD）+ 总纲 `docs/PRD-BEATSCAPE.md` v1.9.3（18 项差异按代码回写，未实现项标注〔规划〕）· 2026-08-30
- [x] **Stage6 扩容 50 首** — 35 → **85** · 全部 SA3 MLX 真推理母带（非 synth fallback）
- [x] 双资产入库（120s 游戏切片 + 216s 流媒体）· audit **FAIL=0** · earcheck **86/86 PASS**
- [x] 五曲风 / 标签 / Vibe / 难度四套配额全部对齐（`catalog:beatscape --stage 6` 缺口 0）
- [x] Stage1–4 曲库 35/35 · 全曲 `stream.m4a` · Cloudflare Pages 流水线（PR #31/#32）
- [x] 移动端触控 · 后台时序自愈 · 分享/OG · Privacy/Terms · 难度降级
- [x] **BeatScape 优化审计全量落地（P0–P3）**：部署 886MB→385MB（`stream.m4a`+`og.png` 548MB 迁出 `public/catalog` → gitignored `data/beatscape-stream/`，170 文件 git 解除追踪，未 commit）；立绘 PNG 7.1MB→339KB WebP（−95.3%）；CF Pages 真缓存头 `_headers`；ScoreStreak decay 真 bug 一行修复 + 回归测试；每帧 matchMedia/`.filter()` 去分配；`Conductor` 泄漏修复 + 时序重锚；9 路由 `React.lazy` 代码分割（11 chunk）；错误边界 + `safeStorage`；i18n 字典 + key-parity 守门测试；Home 封面 lazy `<img>` + 字体非阻塞 + 无障碍 rAF 门控；死 CSS 11 类 / 127 行清理；**P2-4 打击音 AudioNode 复用**：`hitsounds.ts` 重写为 VOICES 注册表 + OfflineAudioContext 预渲染缓存（18 种复合音一次性渲染为 `AudioBuffer`，命中回放改单 `BufferSource`，~49→~2 节点/hit，音色逐字节一致）+ `hitsounds.test.ts` 3 条回归。验收 `tsc` 干净 / `vitest` 120 passed / `vite build` 绿。审计文档 `docs/BEATSCAPE-OPTIMIZATION-AUDIT.md` · 2026-08-31
- [x] MLX 真推理已跑通（SA3 small · 180s 母带约 5s/首 · 峰值 RAM 1.7 GB）
- [x] **P2-2 PlayField 深层拆分完成（未提交）**：~880 行 rAF `useEffect` 逐字节 verbatim 迁到 `src/components/playfield/renderLoop.ts`（导 `createPlayfieldRenderer(ctx): () => void`，返回 dispose 取消 rAF + disconnect ResizeObserver），纯函数 + 常量一并迁入；`PlayField.tsx` 1643 → **664 行**（−59.6%）。`tsc`/`vitest 120`/`vite build` 全绿 · 2026-09-02
- [x] **P2-2 余量 · FX-commit 去重（未提交）**：`handlePress`/`handleRelease` 内逐字节相同的 5 步块抽成 `commitFx(fx: JudgeFx)`；`renderLoop.ts` 的 `addFx` 本就是单函数、Reset 去重经核查已无重复（仅 1 处 `restartRun`）。`tsc`/`vitest 120`/`vite build` 全绿 · 2026-09-01

## blockers

- 耳检需人工（50 首，约 1 轮）
- 盲测需 5–10 名「不玩日式 RPG」观察者（人工）

## 角色 IP / LoRA 工作流（并行 · 跨 IDE 真相见 docs/BEATSCAPE-CHARACTER-LORA.md）

- [x] **NIGHTSHIFT 三人（JUNO/ATLAS/TORQUE）LoRA 全部产出 ✅**（loss 1.36–1.39，验证图身份锁定，无红线）· 2026-08-30
- [x] 前端头像已换新三人图（`public/characters/{pulse-core,skyline-hook,chrome-yard}.png`）
- [x] 旧 7 角色（VOLTA/STATIC/PRISM/RIVET + EMBER/GLIDE/HALO）LoRA 退役存档（世界观切三人组 NIGHTSHIFT，见 docs/BEATSCAPE-WORLDBIBLE.md）
- 模型 = **Animagine XL 4.0**（非 3.0）；训练参数 rank 8 / 8ep / lr 5e-5（rank16/20ep 会塌成噪点）
- 生图环境 = `~/.workbuddy/binaries/python/envs/default`；剩余阻塞（非技术）：PRD §19 商标批次（NIGHTSHIFT / MONOLITH 待初筛）

## 本波新增脚本（Stage6）

| 脚本 | 用途 |
|------|------|
| `scripts/beatscape-stage6-specs.py` | 50 首真值 + `validate()` 约束校验 |
| `scripts/beatscape-stage6-sync-manifest.py` | 同步 manifest / vibes / roadmap |
| `scripts/beatscape-ingest-stage6.py` | 入库（支持 `--batch` / `--track`） |
| `scripts/beatscape-stage6-pipeline.py` | 端到端编排 |
| `scripts/beatscape-stage6-batch-jobs.sh` | 打印 / 执行 50 个生成 job |

`pnpm` 入口：`sync:beatscape-stage6` · `ingest:beatscape-stage6` · `pipeline:beatscape-stage6`

## 链接

- [docs/BEATSCAPE-STAGE6-EXPANSION-MUSIC.md](docs/BEATSCAPE-STAGE6-EXPANSION-MUSIC.md) — **本波曲目表与配额真值**
- [docs/BEATSCAPE-SONIC-DIRECTION.md](docs/BEATSCAPE-SONIC-DIRECTION.md)
- [docs/BEATSCAPE-CATALOG-ROADMAP.md](docs/BEATSCAPE-CATALOG-ROADMAP.md)
- [docs/RESONANCE-BLINDTEST.md](docs/RESONANCE-BLINDTEST.md)
- [docs/BEATSCAPE-REDDIT-LAUNCH.md](docs/BEATSCAPE-REDDIT-LAUNCH.md)
- [docs/KNOWLEDGE-BASE.md](docs/KNOWLEDGE-BASE.md)
