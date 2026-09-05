# SESSION — MusicSaas

| 字段 | 值 |
|------|-----|
| **phase** | 曲库 **105/105**（s1 6 · s2 4 · s3 15 · s4 15 · s5 10 · s6 35 · p3 10 · p4 10）· 315 张谱已按「拍网格亲和力」全量重出 · 线上体验 <https://beatscape.pages.dev> · 待人工耳检 |
| **updated** | 2026-09-05 |
| **slug** | musicsaas |

## next（P0）

> 验收入口：本页 · `pnpm catalog:beatscape` · `pnpm audit:beatscape` · `pnpm earcheck:beatscape`

- [x] **人工验收材料备齐（2026-09-05，未签审）**：当前候选 `74840f1fc466` 的 5 张盲测截图及 SHA-256 清单位于 `data/beatscape-release/2026-09-05/blindtest/`；截图等待字体加载，Play/Results 来自真实对局。9 WARN 已逐项定位到曲目/档位/测量值；资产归档更新为 105 首、7 PNG + 14 WebP、NIGHTSHIFT 三人。用户明确尚未完成耳检/盲测/真机，下一步使用 [`docs/RESONANCE-BLINDTEST.md`](docs/RESONANCE-BLINDTEST.md) 与上线清单记录真实结果后签审。

- [x] **Agent 规则与工作流审计（2026-09-05，本地未提交）**：按 GPT-6 Astra 官方指导精简 AGENTS、常驻规则、角色与交付模板，新增按需验证/交付 skills，修复 CI/派单/合并资格校验。下一次上游 Harness 同步须审查 diff、保留本仓适配；自动合并须另行明确启用仓库变量。依据、验收与边界见 [AGENT-WORKFLOW-AUDIT](docs/AGENT-WORKFLOW-AUDIT.md)。

- [x] **上线技术准备（2026-09-05，本地未提交/未发布）**：105 首 / 315 张谱候选包；统一锁文件/类型检查/构建与 CI 门禁；内容哈希 URL 修旧谱缓存；静态 OG 卡、全模式 Note speed、跨设备同曲分享、音乐站 hash 深链；修损坏存档、Daily 榜上限与误报纪录。`pnpm release:beatscape` 通过：127 单测 + 6 发布器回归 + 16 桌面/移动模拟 E2E，根测试 6+8 通过；产物 591 文件 / 402.7 MiB。详见 [`docs/BEATSCAPE-RELEASE-READINESS.md`](docs/BEATSCAPE-RELEASE-READINESS.md)。
- [ ] **正式上线放行**：bs-p3-01/04/07 已从当前母带循环扩展至 216s（原版已备份，最终 audit **PASS=4726 WARN=9 FAIL=0**）；接缝听感仍待审核，继续完成 105 首人工耳检、差异化盲测、Safari/iPhone/Android/Windows 真机记录。工作单使用 `python3 scripts/beatscape-earcheck-worksheet.py --all`，带音频指纹与导出。`launch:check` 当前应阻止正式发布；待实际验收后填写 `apps/beatscape/launch-signoff.json`，不得把技术检查通过当成全部上线门禁通过。

- [x] **三人立绘重出（已完成 2026-09-02）**：本地 MPS + LoRA 重出 JUNO/ATLAS/TORQUE（prompt 母本 v2，锚点前置 + 赛璐璐夜色模板，BPE 66-71 通过）；锚点 checklist 目验过（单耳挂耳机/场强仪/扳手鼓槌+铬面锣/共振菱形 MOTIF）；已替换 `public/characters/` 三图并推送（commit `6b97c2e`）· 剩余市场评估（女性首位风险）为人工判断
- [ ] **商业化差距决策点 5 项待拍板**：[`docs/BEATSCAPE-COMMERCIALIZATION-GAP.md`](docs/BEATSCAPE-COMMERCIALIZATION-GAP.md) §6（变现模式 / 经营主体 / 后端栈 / 流媒体终点 / 商标批次）——拍板后解锁对应 P0
- [ ] **世界观 Bible 待办（仅剩人工项）**：[`docs/BEATSCAPE-WORLDBIBLE.md`](docs/BEATSCAPE-WORLDBIBLE.md) §12——文档/文案/判定皮肤/美术/回归语/昵称合规/点歌文案包/**S1 电台剧集包**完成；**商标深检索已完成**（2026-08-30，Justia 全 4 页 73 条 + serial 级核证，§11）：NIGHTSHIFT 游戏内可用但 **Class 41 有 LIVE 在册近邻（Kennelly Reg. 6359178，乐队现场演出）**，商品化/对外品牌化前必须 TSDR 全类正式检索；**备选名初筛已备好**（The Late Static 首推 / Scape City 次选，均无精确同名）；MONOLITH 证实 LIVE（华纳 Reg. 5880307 · Class 9 游戏软件全线）→ 限游戏内叙事不变
- [ ] **人工耳检 105 首**（与内容失败/盲测/真机共同组成上线门禁）：是否脱口而出第三方名曲 → 有则废弃重生成。**工具已备**：`python3 scripts/beatscape-earcheck-worksheet.py --all` 生成 `apps/beatscape/earcheck-worksheet.html`，浏览器打开逐曲听+勾，进度自动保存且绑定音频指纹，可导出审核记录 · 曲目数 105（s1 6 / s2 4 / s3 15 / s4 15 / s5 10 / s6 35 / p3 10 / p4 10）
- [x] **重新部署 Cloudflare Pages（已完成）**：线上 95 首（85+P3-10）+ 全部氛围层 + 自定义播放条 + 无红框；audiobar 渲染 30 处、原生控件 0；`bash scripts/deploy-beatscape-cf-pages.sh` 已验证 · 2026-09-02
- [ ] **差异化盲测**（人类 · 阻塞对外宣称上线）：[`docs/RESONANCE-BLINDTEST.md`](docs/RESONANCE-BLINDTEST.md)
- [x] **SIGNAL 氛围层已合入主工作区（未提交）**：高命中玩家对局氛围——SIGNAL 表三档 TUNING/LIVE/ON AIR 点亮 PlayField + 进档音效 + 掉档红闪；结算页 PEAK SIGNAL 徽标 + 海报 ON AIR 金章；计分/判定窗零改动 · patch `git apply` 合入 + 主区 vitest **105/105** + 构建干净 · 回退 `git apply -R docs/BEATSCAPE-SURGE-FX.patch` · 待人工：音色听感 / 真机帧率 / 文案入 Bible §9（文档 §8 草案已备）· worktree `../MusicSaas-wt-surge` 保留可删 · 2026-08-30
- [x] **FEEL PACK 爽感包 + LIGHTING 灯光组 + NEON P1 已实施（未提交）**：打击音按档位分层 / the drop（ON AIR 音乐 low-pass 开闸）/ FFT 呼吸 / 触觉（Android）/ R 键即时重开 / 结算盖章+分数滚动+徽标 pop / 灯光组（跑马灯·光柱·扫光·换色纸，驱动已切 **ScoreStreak 连续得分** 30/70/120 三档，combo 驱动退役）/ NEON P1 侧翼灯管 ×4（CSS steps() 闪烁，body[data-neon] 驱动，≥1100px）· PRD §7.6 霓虹灯管 as-built 注记已补 · vitest **111/111** · 待人工：音色/帧率/阈值口味；P2（灯牌+呼吸边框）待做 · 规格 docs/BEATSCAPE-SURGE-FX.md §2.2b/c + docs/BEATSCAPE-NEON-AMBIENCE.md · 2026-08-31
- [x] **NEON 氛围层 P1–P3 全部实施（未提交→已推）**：P1 ScoreStreak 驱动 + 侧翼灯管；P2 L2 城市灯牌 ×4；P3 L3 呼吸边框（N3 8s 极缓呼吸）· 实时验证 data-neon=3 + 截图确认 · vitest **120/120** · 已部署线上 · 剩余：调参盲测（人工）· 方案 [`docs/BEATSCAPE-NEON-AMBIENCE.md`](docs/BEATSCAPE-NEON-AMBIENCE.md) · 2026-09-02
- [x] **Scape Music 流媒体站 MVP（类汽水音乐 · GAP 5-1 最小终点）已合入 main + 已部署**：commit `7b649c5` 合入 main 并推送；线上 **https://scapemusic.pages.dev**（CF Pages，瘦身 dist 仅 stream/cover/og）——85 首 `stream.m4a` 完整版播放、竖版沉浸发现流（每日混合 · 上滑切歌）、曲库搜索筛选、The Late Static 四栏目歌单、`/#/track/:id` 单曲深链页；vitest 40/40 · tsc/build 绿 · 根 harness unit 回归过；待接线：游戏侧 `VITE_STREAM_APP_URL` 仍 0/85 指向本站（详见 `docs/BEATSCAPE-MUSIC-WEB.md`）；「Scape Music」为工作名对外前需商标初筛 · 2026-09-01

## 已完成（勿再当 P0）

- [x] **UI 视觉审计 + A 档改造（未提交）**：全站 UI 审计结论是动效/完成度分布极不均（只有结算页有动效，其余 7 页零动效硬切），共列 12 项分四档（明细见 `docs/BEATSCAPE-OPTIMIZATION-AUDIT.md` 的「A 档视觉改造」行）。已完成 A 档：新增 `components/useReveal.ts`（IntersectionObserver 滚动揭示，fail-safe —— 隐藏态只由 JS 加的 `.reveal-armed` 驱动，元素默认可见）；Home 按段 / Library 按 `.track-card` / Characters 按 `.character-card` 接入；`styles.css` 加 halftone 封面交互层（网点静息 0.34 → hover 0.08 + 图 `scale(1.06)`）、Hero 漫画字幕条 + 仅 `!live` 显示的 ON AIR 倾斜标签（否则压住下落音符）、网格错峰。**三个决策**：Library 的 key 用 `tracks.length` 而非 `filtered.length`（否则搜索时逐键重扫会闪）；`router.Link` 不透传任意 props，故 hook 支持 selector 按 class 选、CSS 规则不挂 `[data-reveal]` 前缀（挂了会静默失效）；位移用独立 `translate` 而非 `transform`（否则顶掉卡片 hover 位移），揭示后置 `none` 避免 ~80 个元素长期背着 containing block。**顺手修 bug**：`.track-hero-cover` 的 `box-shadow: var(--shadow-card), var(--shadow-glow)` 因 `--shadow-glow` 是关键字 `none`（不能进逗号列表）而整条声明非法 → 大封面一直无阴影，已修。门禁：`tsc` 干净 / `vitest 120` / `vite build` 绿 / dev 冒烟 200 · 2026-09-02
- [x] **AudioBar 播放条四项优化（未提交）**：`apps/beatscape/src/components/AudioBar.tsx` 重写 + `styles.css` 增补。① **拖拽性能**：rect 改 `pointerdown` 缓存、拖拽期用 ref 直写 DOM（fill/thumb/时间/气泡）、`pointerup` 才提交一次 state（原为每次 `pointermove` 一次 `getBoundingClientRect` + 一次 re-render），拖拽期 `timeupdate`/`progress` 早退消除抖动；② **键盘+无障碍**：`role="slider"` 补 `tabIndex` + `onKeyDown`（←→±5s / PageUp·Down±10s / Home·End / Space·Enter 播放暂停）、`aria-valuetext`（M:SS 而非裸秒）、`:focus-visible` 焦点环；③ **健壮性**：补 `onEnded`（按钮不再卡 pause 图标）、`onError`、`onDurationChange`，`currentTime` 赋值前查 `readyState>0`（Safari InvalidStateError），`fmt` 提到模块作用域；④ **视觉**：缓冲进度条 + 拖拽/悬停时间气泡 + thumb 悬停放大 + 热区 8px→22px。**React 坑已规避**：手动 `textContent` 改写要求元素只有单一 Text 子节点，故时间 span 用单插值写法。门禁：`tsc` 干净 / `vitest 120` / `vite build` 绿（CSS gzip 9.13→9.58 KB）。组件测试覆盖仍 0（测试环境 `node` 无 jsdom）· 2026-09-02

- [x] **D 档视觉打磨（本地提交 `df94640`，未 push）**：① chip 色板——所有色彩由单一 `--chip-ink` 派生（border 40% / bg 10% / 文字），新增 `.chip-beginner`(冷绿 `--ok`)/`.chip-vocals`(`--lane3`)/`.chip-tier`，通用 chip 也加描边；Home 的 district 改复用已有 `<DistrictBadge>`，Library 的 Beginner/Vocals 挂语义色板；② 骨架屏——新增 `components/Skeletons.tsx`（TrackCardSkeleton + TrackGridSkeleton，复刻 .track-card 盒模型 CLS≈0），顺手修真 bug：Library 原本没解构 `loading`，85 首曲库加载期会闪 "No tracks match your filters."；③ 路由切换过渡——Layout 给 `<main>` 加 `key={path}` 重放 `route-in` 动画（只动 opacity，不动 transform，否则给 `.play-bg`/`.neon-layer` 这些 fixed 后代建 containing block 致背景错位），`/play` 挂 `.route-plain` 跳过。全带 `prefers-reduced-motion` guard。门禁：tsc 干净 / vitest 120 / build 绿 · 2026-09-02
- [x] **UI 炫酷化 B/C 档全部完成（本地 4 chunk 已提交，待 push）**：B-1 分镜式 HUD（PlayField 20Hz rAF 写 liveStats + PlayHud 直写 DOM，combo/score/signal/judgments 四色计数条）、B-2 调频式加载（THE LATE STATIC 搜台意象）+ Overlay 硬边网点卡片、C-1 Radio 收音机面板（调频刻度盘+信号强度条+频道按钮，频率 88.6/90.0/91.4 MHz 由三季数据驱动）、C-2 Characters 语言统一（去 1px 白描边/16px 圆角→2px 黑边+radius-md+硬投影）+ Profile/Leaderboard 卡片化（board-row/rank-card 硬投影、achievement 已解锁/未解锁 grayscale 差异加强）。四档各一 commit：`417ece9`/`fa10253`/`60e5db1`/`4310b12`，门禁全绿（tsc/vitest 120/build）。· 2026-09-03
- [x] **Play 页双 HUD 重叠修复（commit `fac3118`）**：B-1 引入 PlayHud 时没关 renderLoop 内置的 canvas HUD，对局页两套同时画（左上双分数卡/右上 0.00%/左中竖排 SIGNAL）；`.pause-btn` 与 `.hud-signal` 都顶中互相遮挡。修复：`PlayfieldRenderContext.useComicHud` 标志（传 statsRef ⇒ PlayHud 接管、canvas 旧 HUD 跳过），pause-btn 挪右上。headless 实测 + 门禁绿 · 2026-09-03
- [x] **DUO 同屏分屏对战（commit `cc732dd`）**：`/duo/:id` 两人一键盘打同一张谱——双 PlayField 并排、startGate 同帧起跑（两 field 解码完 → 一次点击手势内 unlockAudio + 同一 React commit 双 begin）、P2 `muteMusic` 防同曲叠出 flanger、键位 arrows↔DFJK 自动避让（触屏各摸半屏）、PlayHud P1/P2 徽标、双 finish 后胜负结算卡 + Rematch。headless 实测：P2 DFJK 命中 900 分而 P1 全 miss（独立键位/计分/同步起跑通过）。顺手修 fa10253 误删 `.loading-spinner`（三处加载态渲染空 div）。Duo chunk gzip 1.93 kB · 2026-09-03
- [x] **DUO 联动暂停（commit `1760c1b`）**：上一版暂停/重开各自独立，任一边按 Esc 只有自己停、另一边继续下落，两张谱立刻失去同步。改为父层仲裁——PlayField 新增 `onPauseChange`（给了就不再本地 toggle，改上报）+ `pauseSync`（每次 bump 翻转自身），两者都经 ref 传递避免 inline 闭包触发音频重载 effect 重新解码；Duo 的 `broadcastPause` 把一次用户动作收敛成一次 bump。**踩坑**：两个 field 的 window keydown 会为同一次按键各触发一次，而浏览器在监听器之间跑 microtask checkpoint，`queueMicrotask` 防抖会漏掉第二次上报 → 两次 bump = 两次翻转 = 什么都没停；改用 `setTimeout(0)` 落在整个 dispatch task 之后，两次上报并成一次（切后台两 field 同时报 visibilitychange 同理）。双人下禁用 R 单侧重开（破坏起跑锁相，走结算卡 Rematch）。`partnerKeys` 从 Duo.tsx 挪进 `input/keyMap.ts`（`partnerKeysFor`）并补单测（任意 P1 输入 P2 都满 4 键且零重叠）。入口：`lib/firstPlay` 加 `duoHref()`，Home 主 CTA 旁加 Duo 按钮跟 hero 曲目走。headless 实测三方向全 PASS（Esc→Esc / 暂停按钮→恢复按钮 / Esc→恢复按钮）；门禁 tsc 干净 / vitest 121 / build 绿 · 2026-09-04
- [x] **DUO 的 P2 键位 D F J K → WASD（commit `c35c541`）**：用户反馈 DFJK 与 P1 默认方向键挨太近（DFJK 横跨主键盘区 D F … J K，右手区正压在右下角方向键旁，两人手会碰）。`partnerKeysFor` 从「`arrows ? dfjk : arrows`」改为按 `DUO_PARTNER_PRESETS = ["wasd","arrows","dfjk"]` 候选顺序发牌，取第一个与 P1 零重叠的——WASD 最紧凑（W 正压在 A S D 上方，四键同处一个 3×2 区块、一只手兜得住）且在左手区，离方向键最远；DFJK 垫底（横跨主键盘区 + 与 WASD 在 `D` 上冲突 + 紧贴方向键簇）。兜底：P1 若自定义到同时踩住三套预设（只要三颗键如 A+←+J），池化 12 个 preset code 发 4 个不冲突的键，保证 P2 永远可玩（单测覆盖）。headless 实测：提示渲染「P1 ← · ↓ · ↑ · → | P2 A · S · W · D」，只敲 WASD 连打 P2 得 1600 分而 P1 全程 19 miss（零串键）。门禁 tsc 干净 / vitest 122 / build 绿 · 2026-09-04
- [x] **游戏页左上角 X 退出按钮（commit `ae7d5a0`）**：用户反馈全屏游戏里点左上角应该能退出。实测原 Exit 文字按钮被 `.btn.compact` 的 `margin-left:auto` 推到右上角（x=1211），左上角（x=23）只是曲目标题、点了没反应；全屏后没有 Esc（触屏尤其），右上角够不着，等于没有退出入口。改动：Play / Duo 的 `.play-meta` 最左侧加 `.play-exit`（✕，硬边语言同 pause-btn），删掉右上角重复的 Exit（触屏 Fullscreen 仍在右）；`.play-meta` 加 `position:relative` + `z-index:31`，**特意夹在 `duo-start`(30) 与 `duo-result`(40) 之间**——DUO 的「Duel ready」是 `fixed inset:0` 全屏卡，原来把 X 整个盖住，等待解码那几秒只能靠浏览器后退；结算卡 40 仍盖住 X 但它自带 Exit。`exitDuo` 补 confirm（X 挪到左上后误触代价是丢整局），结算卡 Exit 改用不拦的 `leaveDuo`。headless 四组全 PASS（play/duo × START 阶段/对局中）：X 落在 (23,11)，点它弹确认并退出到 `/track/:id`，且不会误触发 duo-start 的「点任意处开始」。门禁 tsc 干净 / vitest 122 / build 绿 · 2026-09-04
- [x] **DUO 用 WASD 的玩家面板排到屏幕左侧（commit `7107134`）**：用户指出 WASD 在键盘左半、方向键在右下，原来 P1（默认方向键）永远左、P2（WASD）永远右，两人手交叉别扭且易碰。判定 `p2OnLeft = presetIdFor(p2Keys) === "wasd"`，谁用 WASD 谁坐左；两个 PlayField 抽成 `fieldP1`/`fieldP2` 元素按序渲染，React 按 `key` 匹配、翻序只移动 DOM 不 remount（同步起跑锁相照旧）。PlayField 加 `className?` prop。起跑卡键位提示 `keyHints` 与结算卡 `scoreCols` 都按 `p2OnLeft` reverse，跟面板左右一致。headless 全 PASS：提示 "P2 A · S · W · D | P1 ← · ↓ · ↑ · →"，面板左→右 P2(x=16)/P1(x=645)，敲 WASD 8s 左边 P2 得 1500 分而 P1 全程 19 miss——换位置没打乱键位绑定。门禁 tsc 干净 / vitest 122 / build 绿 · 2026-09-04
- [x] **谱面跟拍感根治（105 首 × 3 档全量重出）**：用户反馈《Satin Underpass》"不跟拍"。根因不是 onset 检测也不是 BPM，而是 `select_onsets()` **只按能量排序**——onset 密度约 11/s 而 90 BPM 的八分网格只有 3/s，音符必然撒在拍与拍之间的微位置上：每个音都有声，但相邻间隔忽长忽短，玩家锁不住脉冲。修法是排序键加拍网格亲和力 `score = norm(energy) + grid_w × grid_affinity(t, beat, offset)`（整拍 1.00 / 八分 0.78 / 十六分 0.50 / 格间 0，容差 22ms 取 onset 抖动量级），`grid_w` 按档位扫描定出 easy 0.60 / standard 0.50 / hard 0.40（约束是响度 x ≥ 0.95，避免"贴格但听不见"的踩空感）；`enforce_peak_nps` 的删音符也改为优先删**最不贴格**的那个（保留节奏骨架），并加"窗口内贴格程度无差异则退回取中间"的护栏，免得全离格时退化成"删最早"而白白改变既有谱面。全量重出 315 张后：网格内% 中位 easy 46.7→81.7、standard 32.6→79.6、hard 33.9→97.1（hard 按十六分格计，见下条）；《Satin Underpass》easy 25.2→82.7，响度 x 0.96。仅 3/3/4 首轻微回退。门禁 tsc 干净 / vitest 122 · 2026-09-05
- [x] **跟拍感诊断工具的两个尺子坑（`scripts/beatscape-chart-gridfit.py`）**：为量化"跟拍"写了这个工具，结果**它自己错了两次**，两次都差点误导到改谱。① 最初拿 `beat_map.first_beat_ms` 当相位基准——实测 `PlayField` 运行时**根本不读**这个字段（只读顶层 `audio_offset_ms`，生成器恒输出 0），它纯是元数据且检测常偏（bs-s5-01 偏 2 秒，原相位下 21.7% 贴格、最优相位 84.0%）。改为**搜索最优相位**（差分数组区间投票 O(n+steps)，315 张谱否则跑到分钟级）后，基线从"31.3%"修正为 46.7%。② 又给 hard 用八分格判定，但 hard 合法使用十六分加花——低速曲 hard 在八分格下 53.0%、十六分格下 95.9%，差的 43pp 全是尺子的错。改为按档位选判定网格（`TIER_GRID_PER_BEAT`：easy/standard 每拍 2 格、hard 4 格），并写明"网格越密判定越松，随机基线八分 24%/十六分 48%，**别跨档横比**"。另加 `--bpm-scan`（±8% 搜最适 bpm，区分"谱不好"和"bpm 检错了"）。残留低分的结论已写进脚本头部：既不是 bpm 也不是谱，是**音频本身不规整**（弱曲 onset 池只有 26~46% 落在最优网格上；grid_w 从 0.6 拉到 4.0 这些曲只涨 0~7pp，bs-p4-09 反跌 4.5pp）——属于音源硬上限，改谱无解 · 2026-09-05
- [x] **BeatScape 线上体验地址打通（<https://beatscape.pages.dev>）**：此前一直是本地跑，没有可分享链接。新增 `scripts/deploy-beatscape-cf-pages.sh`（`wrangler pages deploy` Direct Upload）。**卡点**：`public/catalog` 下每个曲目目录都有 `audio.m4a`+`stream.m4a`，后者在 BeatScape 里**从不播放**（只被 `streamLink.ts` 用来判断是否显示"跳转流媒体 App"），却占 ~680MB，导致 dist 1.1GB 超 CF Pages 部署上限。解法是 build 后 `find "$OUT/catalog" -name 'stream.m4a' -delete`——删掉的是运行时根本不请求的文件，dist 降到 416MB / 682 个文件（单文件最大 ~3.8MB）。另需 `HTTPS_PROXY=http://127.0.0.1:7897`（wrangler 与 git 同代理）。**注意 CF 内容寻址的副作用**：被移出部署清单的旧 `stream.m4a` 哈希 blob 仍可 200，属正常，新清单不含它、游戏也不请求；验证新部署是否生效要看从未上线过的 p4 谱（`/catalog/bs-p4-01/easy.json`）是否 200 · 2026-09-05
- [x] **ScapeMusic 线上站修复（<https://scapemusic.pages.dev>）**：原以为线上落后于源码（seek 拖动修复等未部署），**对照构建证伪**——当前源码产出的正是线上在跑的 `index-CNBoF0kG.js`（字节一致），那些改动早就在线上。真正的问题是 `catalog.ts` 的 `gameTrackUrl()` 兜底 `http://127.0.0.1:5175/beatscape`，部署没设 `VITE_GAME_URL`，于是线上"在游戏里玩这首"两处深链全指向访客本机 5175 端口（链接看着正常、点过去打不开，本地开发暴露不出）。`deploy-scapemusic-cf-pages.sh` 默认注入 `VITE_GAME_URL=https://beatscape.pages.dev` 并加构建后自检（残留 127.0.0.1 即 FATAL）。已部署，线上现跑 `index-DwW6K_-S.js`。瘦身用 rsync 排除 `audio.m4a`/`preview_48s.m4a`/`easy|standard|hard.json`（ScapeMusic 只播 `stream.m4a`，与 BeatScape 互补）。scapemusic vitest 40 passed · 2026-09-05

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
- [x] **P2-2 余量 · useDevQaParams 抽取（未提交）**：3 个 dev-only `useMemo`（?surge/?autostart/?streak|?combo）抽成 `components/playfield/useDevQaParams.ts`（纯读取 location.search，无副作用）；`PlayField.tsx` 672→656。`useConductor`（audio 生命周期+dispose，高风险零测试）暂缓，`useSprites` 已随深层拆分落入 `renderLoop.ts` · 2026-09-01

## blockers

- bs-p3-01/04/07 的 216s 循环扩展候选已过时长审计；接缝待人工耳检，Scape Music 已本地同步但尚未配套发布
- 耳检需人工（105 首，须记录当前音频版本）
- 盲测需 5–10 名「不玩日式 RPG」观察者（人工）
- 真机兼容性与高密度手感/帧率记录待人工；正式发布签审未完成

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
