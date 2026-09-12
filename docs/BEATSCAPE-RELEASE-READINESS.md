# BeatScape 上线准备 · 2026-09-05

> **2026-09-06 执行决策**：用户取消专项真机验收，状态为“已取消／默认不做”，不得自动恢复为 TODO 或 next。详见 [BS-D001](BEATSCAPE-DECISIONS.md#bs-d001)。现有 `deviceTestRecord` 发布门禁尚未调整，取消执行不等于该门禁通过。

当前为 **105 首 / 315 张谱的本地发布候选**。本地历史内容审计为 FAIL=0；人工耳检、差异化盲测与最终签审仍未完成，专项真机执行已取消，**不能据此宣称正式上线准备全部完成**。现有免费、无账号、设备本地存档的产品范围保持不变。

## 当前性能保障候选（2026-09-12，自动预算通过、未部署）

候选为 `604cebd9c0464532cea180aa9334e9884b4ce35895334df99161cfd8df14533c`（首页即开局改版 + 视觉走查 + 谱面门禁），同指纹 **28 项自动性能预算全部通过**：18 次冷加载移动模拟 song-cold / duo-cold 最慢 3892.8 / 3905.1 ms（预算 ≤4000 ms），8 场完整 Hard（含两首补充压力曲）均 60.00 FPS、0 异常间隔；补充压力曲 bs-s6-11 首次单局复测出现一次连续 2 异常间隔（未复现，3 局复测均为 0，如实保留原始数据），详见 [性能保障](BEATSCAPE-PERFORMANCE.md) 第三轮记录。此前候选 `ae15d3778b3fea374e4a30a28c690edf82a8f3f05d9e742ed54fb74f87e35c3e` 的 28 项通过记录见下文第二轮。

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
- 构建仅清理 `dist` 内的完整版母带、历史报告与未跟踪的单曲 OG；单曲 OG 字段统一回退到版本控制中的站点卡片。本地额外素材不会让 CI 产生另一份发布包。
- 音频、封面、试听和谱面 URL 带内容哈希；曲库请求重验证，修复原地重出谱面后仍命中旧 30 天缓存的问题。
- 首页增加静态 OG/Twitter 标签和 1200×630 站点卡片。图由现有四道/菱形/色板及 OFL Anton 字体排版，源为 `scripts/og-card.html`，可用 `generate:og:site` 重出。
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

对本候选的限制：无全站离线缓存承诺；未证明所有真机稳定 60fps、≤30ms 音画误差、1.5s 首屏；全站 SPA，单曲 HTML 预渲染/单曲爬虫 OG 仍为后续工作；榜单为设备本地。宣传草稿已按实际功能和 105 首更新，未发布。

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
