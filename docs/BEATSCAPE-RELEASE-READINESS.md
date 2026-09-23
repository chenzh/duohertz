# BeatScape 上线准备 · 2026-09-05

> **2026-09-06 执行决策**：用户取消专项真机验收，状态为“已取消／默认不做”，不得自动恢复为 TODO 或 next。详见 [BS-D001](BEATSCAPE-DECISIONS.md#bs-d001)。现有 `deviceTestRecord` 发布门禁尚未调整，取消执行不等于该门禁通过。

当前为 **105 首 / 315 张谱的本地发布候选**。本地历史内容审计为 FAIL=0；人工耳检、差异化盲测与最终签审仍未完成，专项真机执行已取消，**不能据此宣称正式上线准备全部完成**。现有免费、无账号、设备本地存档的产品范围保持不变。

## 当前分享与暂停计时候选（2026-09-20，未部署）

当前本地产物为 `1f925c9bc54cb5e7a4858612fd96848195fbd4dcff1ddba42ca46c36afa37644`（105 首 / 315 谱 / 906 文件）。Results 的图片分享与复制在点击前完成字体加载和 PNG 导出，曲库元数据迟到时仍可先分享成绩；单人/Duo 的暂停和退出确认现于事件发生时记录时钟边界，避免面板可见后延迟 effect 把等待时间误计入 `durationMs`。当前产物完整 production 浏览器套件 **683 passed / 33 条条件 skip / 0 failed**（716 项，桌面 Chrome + Pixel 7 模拟，39.6 分钟）；上一分享产物 `26d7ed5f98a5` 为 **678 passed / 33 skip / 1 failed**（712 项），唯一失败为移动端退出确认多计约 120 秒，隔离复测旧实现 **4/5 失败**，仅用 layout effect 的中间版本仍 **3/10 失败**。当前产物旧失败用例 **10/10**、相邻 Chromium **80 passed / 2 skip**、iPhone/WebKit 模拟 **21/21**，Results 分享/下一步路径 Chromium **24/24**、WebKit **12/12**；Vitest **428/428**、常规/CF 构建及发布资产校验通过。同指纹固定性能矩阵 **26/26 条观察通过**，预算检查器 `overallPass: true`、`missing: []`、`issues: []`；手机模拟最慢冷开局 3.806 秒，距 4 秒预算约 194 ms，原始数据见 [性能保障](BEATSCAPE-PERFORMANCE.md#当前分享与暂停计时候选固定矩阵2026-09-20自动预算通过本地未部署)。自动证据不代替人工耳检、盲测、发布签审，也不改变 BS-D001 或现有 `deviceTestRecord` 门禁。

时长补充复验：当前产物新增 Duo 退出确认等待合同 Chromium 桌面/手机各重复 3 次、WebKit 模拟重复 3 次，**9/9**；单人纯暂停手机模拟重复 **5/5**；完整 `run-duration.spec.ts` Chromium 桌面/手机 **10/10**、WebKit 模拟 **5/5**。各组有测试项重叠，不能相加充当新矩阵。

## 上一 UI 候选的固定性能证据（2026-09-20，未部署）

上一 UI 产物为 `eaea6394d9c4ee28b1b8e8bb41c5cc056beb5b1d3a91d894f1a8698688cca993`（105 首 / 315 谱 / 906 文件）。窄屏 Duo `SIGNAL` 徽标遮挡分数卡与 First Shift 漏拍提示可读性已作定向修复；该产物 Vitest **428/428**、横屏 Chromium **16/16**、WebKit 模拟 **8/8**、Duo 320px 启动/HUD Chromium **2/2** 与 WebKit **1/1**，Results 路径 WebKit **7/7**、触控与 Slide WebKit **16/16**。同指纹固定性能矩阵 **26/26 条观察通过**，预算检查器 `overallPass: true`、`missing: []`、`issues: []`；移动模拟最慢冷开局 3.801 秒，距 4 秒预算约 199 ms。方法、局限和原始数据见 [性能保障](BEATSCAPE-PERFORMANCE.md#上一-ui-候选固定矩阵2026-09-20自动预算通过本地未部署)。这些结果是历史对照，不能充当当前分享候选的同指纹性能证明。

## 历史技术候选与性能证据（2026-09-14，未部署）

当时技术候选为 `28557a2cb41bb7180dabcf8f9291429f7bbaa9bcddc395ff441e437ae3f3f1d9`（105 tracks / 315 charts / 906 files / 497.0 MiB）。production 走查发现 Home、Library 等非 Results 页面上的手机固定中心动作虽然已指向真实下一局，可见标签仍始终写成 `Play`，会与页面 `Retry last run`、继续剧情或成功重玩语义冲突。现 `homeEntry` 显式携带 start / continue / play / replay / retry 意图，固定栏分别显示 `Start / Continue / Play / Replay / Retry`，回放类使用 replay 图标，可访问名称包含真实曲目、tier 和 mode；Results 的 Daily、挑战、Practice、普通 Replay/Retry 与零命中故事 Retry 仍保持专用优先级。旧产物状态合同 **6 failed / 3 passed**；该次 Home / First Shift / Results / Daily / 挑战 / Practice / 移动导航双端 production **61 passed / 3 个按项目限定的 skip**，320px Start、Continue、Replay 截图目检无挤压。Vitest **46 文件 / 347 用例**、tsc、CF build 与最终资产核验通过。未改谱，BS-D002 不触发。该候选当时尚未重跑同指纹完整 production 或固定性能矩阵，因此不把更早候选结果改记到该产物。

最近完成完整浏览器回归与固定性能矩阵的上一候选是 `2dd2c62bc57d7fe99bf312f9b9fba17006152bc26cc9762d4c83bf51c2f46dcd`：Playwright production **427 passed / 19 个按设备或项目限定的 skip / 0 failed**（446 项，27.7m）；同指纹 26 条固定观察全部通过，最慢 ready 为桌面 1695.8ms、4× CPU 移动模拟 3778.7ms，六场完整 Hard 均约 60.002 FPS、Canvas 峰值 2.4ms，内存循环在预算内。原始证据见 [完整结果](../data/beatscape-performance/2026-09-14/v1.9.110-current-all/results.json) 与 [预算结果](../data/beatscape-performance/2026-09-14/v1.9.110-current-all/budget.json)；这些历史证据不得外推为 `28557a2cb41b` 的同指纹结论。更早完整固定性能候选 `0ad273eeb025` 及 Background dim 专项 `304eaba97747` 继续作为历史对照。固定实验室结果不改变人工门禁或 BS-D001 状态。

此前候选 `02c00319b3281829079532d7d1603179d3692af224cc0b1c1f2e805f09bf8347`（在首页即开局改版 / 视觉走查 / 谱面门禁基础上，新增 105 首 preview 音频接入、Safari catalog 双取修复与 H1 字距调整），同指纹 **28 项自动性能预算全部通过**（含补充压力曲隔离复测共 30 行观察，`overallPass: true`、`issues: []`）：18 次冷加载移动模拟 song-cold / duo-cold 最慢 3939.1 / 3935.2 ms（预算 ≤4000 ms），完整 Hard 场景最高特效均 60.00 FPS（移动 duo-fx-max 59.99 FPS / 连续异常 1，容差 ≤1）；补充压力曲 bs-s6-11 首测因与移动端 e2e 并发抢 CPU 而失败（测量方法论错误），无并发隔离复测 3 局为 1 / 0 / 0，原始数据如实保留，详见 [性能保障](BEATSCAPE-PERFORMANCE.md) 第三轮记录。更早候选 `604cebd9c0464532cea180aa9334e9884b4ce35895334df99161cfd8df14533c` 与 `ae15d3778b3fea374e4a30a28c690edf82a8f3f05d9e742ed54fb74f87e35c3e` 的 28 项通过记录见下文第三、二轮。

候选为 `ae15d3778b3fea374e4a30a28c690edf82a8f3f05d9e742ed54fb74f87e35c3e`，在退出面板版本上进一步提前下载选定音频、裁剪远期音符遍历、预绘里程碑文字和桌面键名。179 应用单测、6 项相关生产浏览器回归、类型检查、构建与资产核验通过；发布器 11 项和性能脚本 50 项回归保持有效。当前候选的同指纹 **28 项自动性能预算全部通过**：18 次冷加载最慢开局 3.908 秒，8 场完整 Hard / 最高特效 / Duo 均约 60 FPS、0 异常间隔、绘制峰值最高 3.5 ms；两种配置各 12 次重开与切歌后，监听器稳定、退出活动音源与待解码均为 0。仅代表固定本地浏览器条件；不宣称所有设备或线上环境已通过。完整阶段证据及此前失败记录见 [性能保障](BEATSCAPE-PERFORMANCE.md)。

以下退出面板及更早候选均为历史阶段，不代表当前候选已经部署。正式上线仍需真实耳检、盲测、英语叙事试玩与最终签审；专项真机执行按 BS-D001 取消，现有门禁状态如实保留。

上一轮远端 CI（提交 `1290f0c`、[运行 34018671896](https://github.com/chenzh/MusicSaas/actions/runs/34018671896)）的两个失败原因已修复：公司派单校验回归，以及 CI checkout 不含被 `.gitignore` 排除的 stream masters。新提交 `e3ba64f` 的 [CI 34033551898](https://github.com/chenzh/MusicSaas/actions/runs/34033551898) 已通过 unit / build / beatscape / integration；CI 审计显式使用 `--allow-missing-stream` 将外部母带记为 WARN，本地默认审计仍严格要求母带。性能候选已包含在该提交，但上线仍受人工证据与签审门禁约束。

当前产物已重新执行 `node apps/beatscape/scripts/launch-check.mjs`，按预期退出 1：缺当前产物签审、审核者 / 日期及四类通过证据。原始输出见 [launch-check.log](../data/beatscape-performance/2026-09-06/assurance/launch-check.log)。这不会把已取消的真机执行重新列入待办。

## 退出确认候选基线（2026-09-06）

单人／Duo 退出使用游戏内确认面板，打开时暂停音画和判定；取消恢复原暂停状态，确认后退出全屏并返回曲目页。产物 SHA-256 为 `f4015d14bd22eab0c94490e7bcbdc682b60a72360f6e6f7474d784c3934020bb`。156 单测、28 项相关桌面／移动布局浏览器回归、类型检查、CF 构建与资产核验通过；含按键释放、延迟音频恢复、原暂停与开始前退出。4 张截图与指纹位于 `data/beatscape-release/2026-09-06/exit-dialog/`，命令见 [当日记录](../worklog/2026-09-06.md)。退出确认交付当时未重跑完整性能测量；此后该产物已作为第二轮完整性能基线，见上方性能保障记录。

## 自动性能优化基线（2026-09-06）

产物 SHA-256 为 `bd6f4017a63e6c1e598f347fec4bd483944f0c9d2fc99fcbdf434d9126acf9a0`。目录预加载与请求去重、按需首页谱面、选定音频与谱面并行、64 MiB 有界解码缓存 / Duo 共享缓冲、加载取消和 R 重开修复已实现。156 应用单测、6 发布器回归、24 性能探针 / 覆盖校验回归、32 桌面 / 移动布局生产浏览器流程、类型检查、构建与全资产核验通过。性能采样条件、预算结论及证据统一见 [自动性能记录](BEATSCAPE-PERFORMANCE.md)；功能测试通过不代替性能预算结论。

## 叙事候选基线（2026-09-05，本地未发布）

First shift 三节点、角色页、24 集多人对白与 105 首虚构来电已更新。该次产物 SHA-256 为 `fa4bca512a3893919ca619fd6e9e1aa632229203995c3719b16e07c388e5668c`；139 单测、6 发布器回归、28 桌面/手机模拟浏览器流程、类型检查、构建与资产核验通过，该次结果及截图见 [叙事优化交付](BEATSCAPE-NARRATIVE-UPDATE.md)。

下表与原盲测工作包记录的是**叙事调整前**的技术基线，不是对新界面的人工认可。新版本的受众叙事接受度按 [叙事试玩协议](BEATSCAPE-NARRATIVE-PLAYTEST.md) 待执行；视觉盲测需重新绑定当前候选截图，耳检与正式签审仍未完成。专项真机验收执行已取消，门禁现状见页首决定。

## 叙事调整前技术基线（历史证据）

| 项目 | 当前结果 | 复验/证据 |
|---|---|---|
| 曲库登记 | Stage6 85/85 + P3/P4 20/20 = 105；五曲风缺口 0 | `pnpm catalog:beatscape` |
| 前端单元/PRD 测试 | 18 文件，127 用例 | `pnpm --filter @musicsaas/beatscape test` |
| 发布器回归 | 6 用例：缺谱、HTML 假音频、计数、重复 ID、版本变化、产物篡改 | `node --test apps/beatscape/scripts/release.test.mjs` |
| 生产构建 | 类型检查通过；591 文件，402.7 MiB；主 JS gzip 约 105.5 kB | `pnpm --filter @musicsaas/beatscape build:cf` |
| 全资产检查 | 105 个 M4A 文件头、105 张封面、315 张完整谱结构/计数/路径/时间/道号；逐文件 SHA-256 | `dist/release.json`、`release:verify` |
| 浏览器回归 | 桌面 Chrome + Pixel 7 视口/触控模拟；16 项流程 | `PLAYWRIGHT_CHANNEL=chrome pnpm --filter @musicsaas/beatscape test:e2e` |
| 实际音频/结算 | 两种视口均完整运行 Voltage Drop，正确结算全 Miss，成功导出 PNG；双人键位独立与同步暂停 | `e2e/release.spec.ts`；`test-results/` 截图 |
| 根测试 | Gateway 6 + pytest 8 通过 | `pnpm test` |
| 音乐站同步 | 105 首同步一致；40 单测与构建通过 | `python3 scripts/scapemusic-sync-catalog.py --check` |
| 人工工作单工具 | 105 行、姓名必填、指纹/待审导出、三首 216s 实际 M4A 加载通过 | `earcheck-worksheet.html`；没有生成虚假 Clear |
| 谱面自动体检 | 105 首、106 PASS、0 FAIL | `pnpm earcheck:beatscape`；**不是人工耳检** |
| 内容审计 | **4726 PASS / 9 WARN / 0 FAIL** | 本地 `data/beatscape-release/2026-09-05/content-final/audit-report.json` |
| 正式放行 | **BLOCKED，预期退出 1** | `pnpm --filter @musicsaas/beatscape launch:check` |

此历史候选产物 SHA-256：`74840f1fc466c78a1f02c59fa2800878659c5ca1a08ba1f4963058c44226a4e6`。`release.json` 同时记录源码 commit、工作区 dirty 状态、catalog 与全部文件哈希；本次源码未 commit/push。任何内容变更后，以重建产出的哈希为准，原签审失效。

## 本次修复

- 三个发布入口统一执行类型检查、测试、同一生产构建与产物核验。CI 改用 pnpm 锁文件，PR 运行验收，生产发布前检查签审证据。
- 构建仅清理 `dist` 内的完整版母带与历史报告；105 张单曲 OG 是必需公开资产，缺失、非 PNG 或不是 1200×630 时发布器直接失败。本地私有母带仍不会进入候选包。
- 音频、封面、试听、谱面和单曲 OG URL 带内容哈希；曲库请求重验证，修复原地重出资产后仍命中旧 30 天缓存的问题。
- 首页保留静态 OG/Twitter 标签和 1200×630 站点卡片；105 个静态 Track 页各自引用含曲名、艺人、BPM、曲风、街区及浏览器游玩 CTA 的单曲卡。两套图均只用已归档 OFL 字体；单曲卡可用 `npm run generate:og` 重出。
- 2026-09-14 最新技术候选：105 tracks / 315 charts / 906 files / 497.0 MiB，artifact `28557a2cb41b`。Home、Library 等非 Results 页面的手机固定中心动作按真实下一局显示 `Start / Continue / Play / Replay / Retry`，回放类同步使用 replay 图标，可访问名称读出曲目、tier 与 mode；Result 专用 Daily、挑战、Practice、Replay/Retry 和零命中故事 Retry 继续优先。旧产物状态合同 **6 failed / 3 passed**；Home / First Shift / Results / Daily / 挑战 / Practice / 移动导航 production **61 passed / 3 个按项目限定的 skip**，320px Start、Continue、Replay 截图目检通过。Vitest **46 文件 / 347 用例**、tsc、CF build 与最终资产核验通过。未重跑同指纹完整 production 或固定性能矩阵；未改谱，BS-D002 不触发。
- 2026-09-14 上一技术候选：105 tracks / 315 charts / 906 files / 497.0 MiB，artifact `e58c56a88204`。未产生 First Shift 推进凭证的零命中故事局，手机固定主动作由 `Play` 改为与正文一致的精确 `Retry`；成功故事局继续进入下一段。Miss review 同时以 `counts.miss` 为总数真值，兼容存档缺 `missEvents` 时明确 details unavailable，不再把 116 Miss 写成 clean run。两项旧产物合同均红灯；故事 / Home / 普通 Results / Daily / 挑战 / 分享 / streak / 移动导航 production **79 passed / 3 个按设备限定的 skip**，含双端三首真实剧情歌曲完整链路，零命中手机全页截图目检通过。Vitest **46 文件 / 346 用例**、发布器 **16/16**、性能规则 **51/51**、PRD **8/8**、tsc、CF build 与最终资产核验通过。未重跑同指纹完整 production 或固定性能矩阵；未改谱，BS-D002 不触发。
- 2026-09-14 上一技术候选：105 tracks / 315 charts / 906 files / 497.0 MiB，artifact `6eb5cfad0c4c`。正式手机首局的四条 lane 继续说明点击位置，短提示由 `Tap the four lanes` 改为 `Tap notes on the line`，补齐音符到达判定线时点击的时机教学；Home demo、桌面键位和手柄提示不变。新合同在旧产物明确红灯；首局 / Home 入口 / 单人与 Duo 启动恢复 / HUD / 键位 / 赛前触控 production **63 passed / 3 个按项目限定的 skip**，320×568 截图目检通过。Vitest **46 文件 / 346 用例**、发布器 **16/16**、性能规则 **51/51**、PRD **8/8**、tsc、CF build 与最终资产核验通过。未重跑同指纹完整 446 项 production 或固定性能矩阵；未改谱，BS-D002 不触发。
- 2026-09-14 上一技术候选：105 tracks / 315 charts / 906 files / 497.0 MiB，artifact `d4887eaa58f3`。Local Board 原有 hover 反馈却无动作的误导已消除：All-time 行整卡显示 `Replay →` 并按原曲目/难度重开 Arcade，Daily 行显示 `Play today →` 并保留当天 date/Daily 身份；键盘焦点环、≥44px 点击区和 320px PTS/ACC 同行均有 production 合同。旧产物新增 replay link 合同明确红灯；Board / Daily / Profile / 导航 / 320px 相邻 production **38 passed / 2 个按项目限定的 skip**，截图目检通过。Vitest **46 文件 / 346 用例**、发布器 **16/16**、性能规则 **51/51**、tsc、CF build 与最终资产核验通过。未重跑同指纹完整 446 项 production 或固定性能矩阵；未改谱，BS-D002 不触发。
- 2026-09-14 上一技术候选：105 tracks / 315 charts / 906 files / 497.0 MiB，artifact `7de837b0a385`。普通成功 Results 的 `Next move` 从分享、通用电台回信和诊断之后前移到核心成绩/当局奖励之后；分享紧随，手机主 CTA 完整位于固定导航上方。旧 artifact coach top desktop/mobile **1053.3 / 1020.8px**、晚于 share **351 / 431px**，新顺序合同转绿；失败恢复与 First Shift 剧情优先不变。Results / 分享 / First Shift / Daily / 挑战 production **43 passed / 1 个按项目限定的 skip**，截图目检通过。Vitest **46 文件 / 346 用例**、发布器 **16/16**、性能规则 **51/51**、tsc、CF build 与最终资产核验通过。未重跑同指纹完整 446 项 production 或固定性能矩阵；未改谱，BS-D002 不触发。
- 2026-09-14 上一技术候选：105 tracks / 315 charts / 906 files / 497.0 MiB，artifact `e016f44dd225`。320×568 正式 `Start playing` 从 **98px 双行**收为单行、≥44px 且 ≤64px；四条 lane、`Tap the four lanes` 与 `Chart moves` 完整位于首屏，Home hero 不变。旧产物新几何合同以 `98px > 64px` 红灯；正式开局 / HUD / 两档横屏 / 赛前触控 production **35 passed / 1 个按项目限定的 skip**，320px 截图目检通过。Vitest **46 文件 / 346 用例**、性能规则 **51/51**、tsc、CF build 与最终资产核验通过。未重跑同指纹完整 446 项 production 或固定性能矩阵；未改谱，BS-D002 不触发。
- 2026-09-14 上一技术候选：105 tracks / 315 charts / 906 files / 497.0 MiB，artifact `72624178ef7d`。正式粗指针 Play 不再复用 Home demo 的 no-save 文案，开局前显示四条彩色触控 lane、`Four touch lanes` 可访问名称与 `Tap the four lanes`；Home `Try it here` 继续明确不保存，细指针桌面继续显示当前实体键位。旧产物新 mobile 合同以 lane **0/4** 红灯；当前 Home / Play / 键位 / 320px production **30 passed / 2 个按项目限定的 skip**，Pixel 7 与 320px 截图目检通过。Vitest **46 文件 / 346 用例**、tsc、CF build 与最终资产核验通过。未重跑同指纹完整 446 项 production 或固定性能矩阵；未改谱，BS-D002 不触发。
- 2026-09-14 上一技术候选：105 tracks / 315 charts / 906 files / 497.0 MiB，artifact `ecade1e039fa`。Home 正式首局、页面内试玩与手机固定 Play 三种意图完成分层：主动作 `Start first run`，试玩 `Try it here`，并以可访问区域和可见 `Demo · no progress saved` 明确试玩不保存进度；提示先于装饰性触控 lane，Pixel 7 默认首屏与固定导航保留 ≥8px。First Shift 已完成但 catalog 仍加载时使用 `Start a run`。Vitest **46 文件 / 346 用例**、Home production **15 passed / 1 个 desktop-only skip**、CF build 与最终资产核验通过。该 artifact 尚含正式 touch Play 误用 no-save 的后续发现，已由 `72624178ef7d` 修复；未重跑同指纹完整 446 项 production 或固定性能矩阵，未改谱。
- 2026-09-14 上一完整技术候选：105 tracks / 315 charts / 906 files / 497.0 MiB，artifact `2dd2c62bc57d`。320×568 竖屏 Duo 的两块完整 Canvas、判定线和 Pause 现在同时位于视口内，每场 lane travel ≥180px，页面不滚动；旧产物 P2 Canvas 底边 623.4px 的明确红灯已转绿。新合同 **2/2**，Duo 启动/HUD、暂停、旋转与短横屏相邻 production **56/56**；Vitest **46 文件 / 345 用例**、tsc、CF build 与最终资产核验通过，短屏截图目检通过。同指纹完整 production **427 passed / 19 个按设备或项目限定的 skip / 0 failed**（446 项，27.7m）；同指纹 **26 条固定性能观察**与独立预算检查整体通过，最慢 ready 1695.8 / 3778.7ms，六场约 60.002 FPS，Canvas 峰值 2.4ms，内存循环在预算内；这些结果不外推到 `72624178ef7d`。未改谱，BS-D002 不触发。
- 2026-09-14 上一技术候选：105 tracks / 315 charts / 906 files / 497.0 MiB，artifact `5ce4886f691c`。短竖屏单人/Duo 暂停层默认把 Quick controls 收为 48px `Adjust`，让 Resume、Restart、Leave 全部无需滚动进入 320×568 首屏；桌面、宽裕竖屏与短横屏保持默认展开。暂停 Quick controls 合同 **4/4**，暂停、退出、旋转、短横屏与 Gamepad 相邻 production **68/68**；Vitest **46 文件 / 345 用例**、tsc、CF build 与最终资产核验通过，两张短屏截图目检通过。完整 production 和性能矩阵未重跑，旧结果不外推；未改谱，BS-D002 不触发。
- 2026-09-14 上一技术候选：105 tracks / 315 charts / 906 files / 497.0 MiB，artifact `a8e27d465f52`。assigned controller 局中断连/替换会释放输入并自动冻结；单人显示设备状态，Duo 只冻结一次并指出 P1/P2，重连后仍由玩家显式安全恢复。Gamepad 连接/断连合同 **4/4**，输入所有权、暂停、系统中断、退出保护、Duo、快捷键相邻 production **77 passed / 1 个项目限定 skip**；Vitest **46 文件 / 345 用例**、tsc、CF build 与最终资产核验通过，四张双端截图目检通过。完整 production 和性能矩阵未重跑，旧结果不外推；未改谱，BS-D002 不触发。
- 2026-09-14 上一技术候选：105 tracks / 315 charts / 906 files / 497.0 MiB，artifact `3850bcaa0d55`。标准手柄可用 D-pad / face diamond 操作四道、Menu 暂停/恢复；单人第一只、Duo 两只稳定分配，断连不让幸存控制器串位。准备卡和 lane 提示反馈连接状态，320×568 Duo 顶栏与 Start 通过目检。Gamepad 新合同 **4/4**，输入/暂停/Duo/快捷键相邻 production **51 passed / 1 个项目限定 skip**；Vitest **46 文件 / 345 用例**、tsc、CF build 与最终资产核验通过。完整 production 和性能矩阵未重跑，旧结果不外推；未改谱，BS-D002 不触发。
- 2026-09-14 此前候选：105 tracks / 315 charts / 906 files / 497.0 MiB，artifact `275a713e3d83`。Results 的 judgment 与 timing 统一进入 `Run details`；≤640px 默认收起并保留总音符/Miss 摘要，桌面默认展开，断点往返与用户手动展开均有合同覆盖。旧候选 desktop/mobile **2/2 红灯**；当前新增合同 **2/2**，Results / 分享 / First Shift / 挑战 / streak 相邻矩阵 **37 passed / 1 个 desktop-only skip**；完整 production **420 passed / 18 个按项目或设备限定的 skip**，Vitest 44 文件 / 337 用例、发布器 16/16、性能规则 51/51、PRD 8/8，最终资产核验通过。Pixel 7 截图目检通过；本轮只改 Results DOM/CSS 与响应式披露状态，未重跑性能采样、未改谱，BS-D002 不触发。
- 2026-09-14 上一技术候选：105 tracks / 315 charts / 906 files / 497.0 MiB，artifact `b9ad3b23e85e`。手机 Track 固定栏左侧已选摘要升级为 48px `Change ↑` 操作，保留实时曲名、tier/mode 与可用紧凑 PB；点击后回到 Run configurator 并聚焦当前 Difficulty，Reduce Motion 即时滚动。右侧唯一 `Play now` 与所选 URL 不变。新增合同 **1 passed / 1 个 desktop-only skip**，Track / Library / 导航 / 320px / 触控相邻矩阵 **59 passed / 5 个设备限定 skip**，320×568 截图目检通过；完整 production **418 passed / 18 个按项目或设备限定的 skip**，Vitest 44 文件 / 337 用例、发布器 16/16、性能规则 51/51、PRD 8/8，最终资产核验通过。本轮只改 DOM/CSS 与焦点/滚动交互，未重跑性能采样、未改谱，BS-D002 不触发。
- 2026-09-14 上一技术候选：105 tracks / 315 charts / 906 files / 497.0 MiB，artifact `e4b9a581fe96`。Settings 在 ≥900px 使用 Profile/Audio 与 Gameplay/Keyboard 两列独立控制栈，<900px 保持 Profile → Audio → Gameplay → Keyboard 的单列 DOM 顺序；触屏键盘折叠、自动保存、焦点与设置语义不变。新增布局合同 **2/2**，完整 Settings **13 passed / 1 个设备限定 skip**，键位/导航/320px/触控相邻矩阵 **43 passed / 1 个设备限定 skip**，桌面/手机全页截图目检通过；完整 production **417 passed / 17 个按项目或设备限定的 skip**，Vitest 44 文件 / 337 用例、发布器 16/16、性能规则 51/51、PRD 8/8，最终资产核验通过。本轮仅改响应式布局，未重跑性能采样、未改谱，BS-D002 不触发。
- 2026-09-14 上一技术候选：105 tracks / 315 charts / 906 files / 497.0 MiB，artifact `304eaba97747`。Settings 与单人/Duo 暂停 `Quick controls` 提供 0–100% Background dim，默认 25%；环境层即时暗化，玩法元素保持后绘。定向 production **57 passed / 1 个设备限定 skip**，Duo 焦点相邻套件 **20/20**，桌面/手机/667×375 短横屏截图目检通过；完整 production **415 passed / 17 个按项目或设备限定的 skip**，Vitest 44 文件 / 337 用例、发布器 16/16、性能规则 51/51、PRD 8/8，最终资产核验通过。4× CPU 手机模拟最高特效单人/Duo 两场完整 Hard 均约 60.002 FPS、最长帧 16.8ms、Canvas 峰值 1.8ms、零异常间隔；局部复测不替代 `0ad273eeb025` 的 26 项完整矩阵。本轮未改谱，BS-D002 不触发。
- 2026-09-14 上一技术候选：105 tracks / 315 charts / 906 files / 497.0 MiB，artifact `2f57ff78c28c`。普通 Results 的分享区从页面后段前移到核心成绩/奖励之后，先于通用电台回信与四档判定；移动端 `Copy link` 完整位于固定底栏上方。真实 First Shift 仍先给连接结果与下一首，再出现分享。Share Sheet、图片复制、4:5 下载、挑战 URL 与 Replay 行为不变。Results / First Shift / 分享定向 **24/24**，挑战 / Daily / 320px 相邻矩阵 **27 passed / 1 个 desktop-only skip**，双端截图目检通过；完整 production **415 passed / 17 个按项目或设备限定的 skip**，Vitest 44 文件 / 333 用例、发布器 16/16、性能规则 51/51、PRD 8/8，最终资产核验通过。Duo 离线位移合同另修正为等待异步自动全屏过渡后再取基线，1px 阈值不变，连续 desktop/mobile **20/20**。本轮未重跑固定性能采样，上一 artifact 数据不外推；未改谱，BS-D002 不触发。
- 2026-09-14 上一技术候选：105 tracks / 315 charts / 906 files / 497.0 MiB，artifact `0ad273eeb025`。production 截图复核发现旧手机 Duo 默认以上方 P2 / 下方 P1 排列，ready card 却仍写 Left/Right 并只展示键盘键位；现触屏固定 P1→P2，竖屏按实际场地显示 Top/Bottom，短横屏与宽屏显示 Left/Right，ready 与 live meta 明确两位玩家各自 `Tap 4 lanes`。桌面键盘继续按物理左右键区安排座位，保存键位与判定不变。Duo 触屏座位/提示定向 desktop+mobile **2/2**，相邻 Duo / 横屏 / 触控目标 / 键位 / HUD 扩大矩阵修正后全绿；完整 production **415 passed / 17 个按项目或设备限定的 skip**，Vitest 44 文件 / 333 用例、发布器 16/16、性能规则 51/51、PRD 8/8，最终资产核验通过。该 artifact 随后完成 26 条固定性能观察：最慢 ready 桌面 1718.5ms / 移动模拟 3764.2ms，六场完整 Hard 约 60.002 FPS、零异常间隔、Canvas 峰值 2.2ms，两端各 8 次重开与 8 次 Duo 切歌；预算整体通过。测量器已按真实退出确认修复，首个 `status: incomplete` 报告继续保留且不计通过。当前修复不改谱，BS-D002 不触发。
- 2026-09-14 上一技术候选：105 tracks / 315 charts / 906 files / 497.0 MiB，artifact `f6c6a05c5a5b`；桌面键帽从永久占屏改为渐进教学。赛前与 3 秒倒计时始终显示，前三个有效完整局常驻；第 4 局起单人 Casual / Arcade 在 GO 后 650ms 淡出，Resume / Restart 安全倒计时重新显示。Practice、Duo 与 Home hero 常驻，触屏继续不分配键帽精灵；Reduce Motion 在 GO 后直接隐藏。行为合同在旧候选 **1/1 红灯**（GO 后最后绘制距采样仅 1.5ms），当前实体布局、单人渐退、Resume、新玩家常驻、Duo 标签与 touch 分流矩阵 **5 passed / 1 个 touch-only skip**；完整 production **415 passed / 17 个按项目或设备限定的 skip**，Vitest 44 文件 / 333 用例、发布器 16/16、性能规则 51/51、PRD 8/8，最终资产核验通过。本轮未重跑性能采样；只保留上一候选的专项数据，不外推为当前 artifact。当前修复不改谱，BS-D002 不触发。
- 2026-09-14 上一技术候选：artifact `daaf71a85437`。街区角色立绘已从 Canvas 上方的 DOM 水印移入 Canvas 环境背景层，轨道、判定线、音符与瞬时判定后绘，解决手机及桌面 lane 4 的角色面部与 MISS / 尾点重叠。单人保留 SIGNAL 升温，Duo 透明度独立封顶。旧候选的新增 production 契约 desktop/mobile **2/2 红灯**，HUD / 分层矩阵 **12/12**，截图目检通过；Vitest 44 文件 / 333 用例、发布器 16/16、性能规则 51/51、PRD 8/8。该 artifact 的 4× CPU mobile-emulated 完整 Hard 最高特效单人 / Duo 均约 **60.002 FPS**，最长帧 **16.8ms**、Canvas 峰值 **2.0ms**（预算 5ms）、零异常间隔，每位玩家 929/929 判定覆盖；这是针对渲染改动的两场压力复测，不冒充完整固定性能矩阵或真机验收。该修复不改谱，BS-D002 不触发。
- 2026-09-14 上一技术候选：artifact `8a829c5a4fd0`。成功 Hold 尾点现在以事件真值在原 Perfect / Great / Good 判定音上叠加一枚预渲染的程序合成下行释放音；过早/过晚松开只播放 Miss，关闭 Hitsounds 时完整静默。红测先验证旧实现缺事件标记、缓存仍为 19 项且只起一个音源；核心专项 **32/32**，Hold / 多指所有权 / 边缘漂移 / 暂停重抓 / 音频恢复 / Slide / Duo production desktop+mobile **26/26**。未做人耳音色验收；自动验收不替代本页尚未完成的人工耳检、盲测与签审。该修复不改谱，BS-D002 不触发。
- 2026-09-14 上一技术候选：artifact `2d2a486b7e27`。成功 Slide 在原判定音上叠加一枚程序合成上扬锁定音；Miss 不叠加，关闭 Hitsounds 时完整静默。核心专项 **32/32**，Slide 完成 / 锁定 / 暂停重抓 / Duo production desktop+mobile **12/12**。该修复不改谱，BS-D002 不触发。
- 2026-09-14 上一技术候选：artifact `ca0c988fcf66`。手机固定底栏已用统一内联 SVG 取代跨系统不稳定的字符图标，Board 使用明确的排名柱形；中心动作的新局显示 Play，Results 的 Replay / Retry / Improve / Practice 显示回放箭头，同时保留精确文本和可访问名称。旧候选 mobile 合同 **1/1 红灯**，当前专项 **1/1**，导航 / Home / Results / Daily / Practice / 320px / 触控目标 production 矩阵 **71 passed / 1 个 desktop-only skip**，Results 手机截图目检通过。该修复不改谱，BS-D002 不触发。
- 分享成绩改为携带同曲/难度/模式的可玩挑战链接；旧 `results?run=local` 仍兼容本机读取。文案准确描述本地存档。
- 修复 Scape Music 深链为 `/#/track/:id`；修复时长四舍五入出现 `1:60`。线上音乐站 JS 已只读核实包含 105 个曲目 ID。
- Settings 增加 0.5–2× Note speed，覆盖全部模式。映射为 `scrollBias = 1/speed - 1`（提高数值应下落更快），音频速率及 15/30/50 判定窗不变。
- 损坏成绩存档回退、Daily 榜分数上限与总榜一致、Casual/失败局不再误标 NEW RECORD、音频失败增加 Retry loading。
- 人工耳检工作单扩至完整 105 首，导出审核 JSON 并绑定实际音频 SHA-256；音频更换会使旧勾选失效。

## 内容修复与人工复核

| 曲目 | 实测 | 当前要求 | 处理状态 |
|---|---|---|---|
| bs-p3-01 · Midnight Haze | stream 216s / game 120s | stream ≥216s | 时长通过；循环接缝待耳检 |
| bs-p3-04 · Lounge Ember | stream 216s / game 120s | stream ≥216s | 同上 |
| bs-p3-07 · Glass Echo Drive | stream 216s / game 120s | stream ≥216s | 同上 |

`afinfo` 证实原有三首完整版为 180s。现已用既有 `beatscape-stitch-stream.py` 从**当前 180s 母带**制作 216s 循环扩展候选，再以 `beatscape-ingest-stream.py` 入库；没有使用目录中的旧名资产，没有改变游戏音频、谱面或放宽规格。原 stream 备份于 `data/beatscape-release/2026-09-05/original-streams/`，新旧指纹与来源见同目录 `stream-candidates.json`。这是循环扩展，未经人工认可的接缝仍须耳检；原始母带保持不变。

Scape Music 的本地曲库已同步到 216s（同时修正既有 bs-p3-02 BPM 156→158 的元数据漂移），同步检查、40 单测及构建通过。音乐站线上尚未替换这三首候选；正式放行时需通过其现有发布脚本配套发布，确保带正确 `VITE_GAME_URL`，再核对线上时长与播放。

9 WARN 已对照当前谱和审计器逐条定位。审计器对 `onset-v1` 使用已有扩展区间；以下为告警记录，未改阈值、未自动重出谱，也未代填人工接受。

| 曲目 | 档位 / 项目 | 当前测量 | 审计区间 | 待验内容 |
|---|---|---|---|---|
| bs-p4-04 · Echo Glow Chorus | 命名主题词 | title/artist 未命中词表 | 主题词匹配 | 核对命名与世界观；单纯缺词不证明音频或资产错误 |
| bs-s2-03 · Blue Hour Loop | Hard 和弦/10s | 18.67 | 0–18 | 连打负担 |
| bs-s3-05 · Chrome Grid | Hard 和弦/10s | 19.00 | 0–18 | 连打负担 |
| bs-s4-13 · Halftone Skyline | Hard 和弦/10s | 18.08 | 0–18 | 连打负担 |
| bs-s4-14 · Chrome Mile Anthem | Hard 和弦/10s | 18.42 | 0–18 | 连打负担 |
| bs-s5-05 · Chrome Vector | Hard 和弦/10s | 18.58 | 0–18 | 连打负担 |
| bs-s6-04 · Moonlit Turnpike | Standard 和弦/10s | 7.42 | 0–7 | Standard 难度与双拇指体验 |
| bs-s6-05 · Chrome Foundry | Hard 和弦/10s | 20.33 | 0–18 | 优先实玩，和弦偏高最明显 |
| bs-s6-21 · Halftone Parade | Standard NPS | 2.33 | 2.4–6.4 | 留白与节奏是否自然 |

和弦频度按全曲时长取平均，不能据此推断每个 10s 区段或真机手感。实际接受或要求返工须记录曲目、档位、理由及审核者。

## 人工验收工作包

2026-09-05 用户明确确认人工验收未完成；2026-09-06 取消其中的专项真机验收。以下两项仍为执行清单。

1. **105 首耳检**：运行 `python3 scripts/beatscape-earcheck-worksheet.py --all`，在浏览器打开 `apps/beatscape/earcheck-worksheet.html`。逐曲听、选 Clear/Derivative、填写备注和 reviewer 后导出 JSON。三首新循环扩展候选要额外听接缝，保持 pending 直到真实审核完成。自动 `earcheck:beatscape` 不替代此记录。
2. **差异化盲测**：叙事调整前候选的 5 张截图保留于 `data/beatscape-release/2026-09-05/blindtest/index.html`，附产物与图片哈希；正式盲测前须用当前候选重新捕获既定展示面。按 [RESONANCE-BLINDTEST.md](RESONANCE-BLINDTEST.md) §结果记录，邀请 5–10 名不玩日式 RPG 的观察者，对既定展示面记原话与结论。PRD §7.7/§11.4 明确要求上线前完成；本轮叙事截图不自动代替该工作包。
**已取消：专项真机验收。** 原 iPhone／Android／桌面设备矩阵及整局、连续多局、后台／锁屏恢复、多指与音画同步的真机记录不再安排，不列入 TODO。执行范围与恢复条件见 [BS-D001](BEATSCAPE-DECISIONS.md#bs-d001)。实际发布脚本仍会报告缺少 `deviceTestRecord`，该门禁尚未变更。

对本候选的限制：无全站离线缓存承诺；未证明所有真机稳定 60fps、≤30ms 音画误差、1.5s 首屏；105 个 Track 已有静态 HTML 与单曲爬虫 OG，Library、Profile、动态 Results 等仍由 SPA 渲染；榜单为设备本地。宣传草稿已按实际功能和 105 首更新，未发布。

## 复验、签审、发布与回退

技术准备（不联网发布、不读取部署密钥）：

```bash
pnpm install --frozen-lockfile --filter @musicsaas/beatscape
pnpm --filter @musicsaas/beatscape exec playwright install chromium
pnpm release:beatscape
# 等价部署前自检入口
bash scripts/deploy-beatscape-cf-pages.sh --check
```

本机浏览器下载受到代理证书链影响，因此已使用本机已安装的 Chrome、默认音频权限策略完成验收（未绕过用户手势解锁）：`PLAYWRIGHT_CHANNEL=chrome pnpm release:beatscape`。无需关闭 TLS 验证。CI 使用 Playwright 自带 Chromium；其远程运行需在后续提交后验证。

续作切到受限环境后，系统 pnpm 在切换项目指定的 9.15.0 时因 registry fetch 失败无法完成签名验证；没有跳过该验证。本轮直接执行 `node apps/beatscape/scripts/launch-check.mjs`，与 package 脚本内容相同，产物校验通过并正确拒绝缺失签审。原始环境错误保存在 `data/beatscape-release/2026-09-05/launch-check-pnpm-environment.log`；此前整套技术验收证据不变。

所有门禁实际通过后，由审核者填写 `apps/beatscape/launch-signoff.json`：

- `artifactSha256` = 最终 `dist/release.json` 的值；`reviewedBy` / `reviewedAt` = 实际审核者和 ISO 日期。
- `contentAudit`、`earcheckReport`、`blindtestRecord`、`deviceTestRecord` 各为 `{ "status": "pass", "evidence": "相对 apps/beatscape 的证据文件路径", "sha256": "证据文件 SHA-256" }`。
- contentAudit 使用完整 `audit-report.json`（必须 FAIL=0 且覆盖 105 首），earcheckReport 使用上述工作单导出的 JSON（所有当前音频 Clear）；另两项使用真实填写的 Markdown/JSON 记录。
- 可将签审证据归档到 `docs/releases/<版本>/` 以供 CI 读取；`data/` 内临时文件不会随 Git 到 CI。签审是对原有 PRD 人工验收的记录，不能由自动测试代填。CI 不携带 stream 母带，以产物/证据哈希绑定已审核记录；本地有母带时额外核对音频指纹。

```bash
pnpm --filter @musicsaas/beatscape launch:check
# 真正发布命令：仅在门禁通过且获准发布时执行
bash scripts/deploy-beatscape-cf-pages.sh
# 发布后的只读验收：比对线上和本地产物哈希、深链、OG、代表曲谱面/音频
pnpm --filter @musicsaas/beatscape release:live https://beatscape.pages.dev/
```

发布前在 Cloudflare Pages 的 Deployments 中记录上一份成功生产部署 ID/URL。出现无法开局、音频/谱面资源失败、成绩流程异常时，停止宣传并在该旧生产部署菜单选择 **Rollback to this deployment**；预览部署不能作为回退目标。[Cloudflare 官方回退说明](https://developers.cloudflare.com/pages/configuration/rollbacks/)

回退后用上一份保存的 `release.json` 进行 `release:live`，再实测开局/暂停/结算；第一次引入 manifest 的回退目标可能没有 `release.json`，此时核对保留的旧 catalog/JS 哈希与手动游玩记录。当前没有执行正式部署、回退或发送社区帖子。

缓存头实现依据 [Cloudflare Headers](https://developers.cloudflare.com/pages/configuration/headers/)。音频请求允许 Pages 返回完整 200 或部分 206；完整响应还会核对 SHA-256，避免把 SPA 的 HTML 200 当成成功音频。[Cloudflare 静态资源行为](https://developers.cloudflare.com/pages/configuration/serving-pages/)
