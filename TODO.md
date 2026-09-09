# MusicSaas 项目 TODO

> **本文件是待办的唯一入口**，只登记**当前真实未完事项**，细节一律链接到对应权威文档，不在此复制正文。
> 整理日期：2026-09-09（**第八次刷新**；实测 `origin/main` 与本地 0/0 同步，上一轮 TODO 刷新为 `38c0243`，**连续第七轮无新落地项**，仍是**校验型刷新**——本轮新增两个维度：**线上「内容 vs 代码」分离核对**（首次实测线上 `catalog.json` 与谱面资产）与 **GitHub PR / Issue 盘点**；上一轮因本地网络中断而搁置的线上取证**本轮已全部补做**）｜ 来源：[SESSION.md](SESSION.md) · [docs/BEATSCAPE-DECISIONS.md](docs/BEATSCAPE-DECISIONS.md) · [审计报告 §6](docs/COMPANY-PROJECT-HARNESS-AUDIT-2026-09-06.md)
> **本轮改动（2026-09-09 第八次）**：① **线上「内容」其实是当前版本，落后的只有「JS 代码」**（推翻此前「线上整体落后」的笼统表述）：实测 `https://beatscape.pages.dev/catalog.json`（115,172 B，真 JSON）为 **105 首 / 315 谱面 / `stream_app_url` 0-105**，曲目 ID 集合与本地**完全一致**；`/catalog/bs-p4-01/easy.json`（19,241 B）与 `/catalog/bs-p4-10/hard.json`（51,507 B）均返回 **200** → p4 内容确实在线上。成因已查明：p4 进入 catalog 的 `f9d8c8f`（2026-09-04T16:31:54Z）经 `git merge-base --is-ancestor` 确认是最后一次成功部署 head `ffe1ec0` 的**祖先**，两者仅相隔 **35 秒**（部署 run `33895713222` 于 16:32:29Z）→ 线上内容本就落在部署窗口内；② **代码侧确实陈旧**：线上 bundle 仍为 `index-CDXE9BO-.js`（325,768 B），其中 `No account, no ads`（`a136592`，09-07）**0 命中**、`scapemusic.pages.dev`（`8b710a3`，09-05）**0 命中**，且二者引入时间**均晚于** 09-04 部署 → 与「代码落后」一致（本轮已按上一轮教训逐一核对引入时间，避免「缺字符串即证据」的误判）；③ **`/release.json` 线上确实不存在**：返回 2146 B 的 `text/html`，与一个确定不存在的路径 `/definitely-not-here-xyz` **字节数完全相同** → 是 SPA 回落页而非真文件（上一轮因网络中断只能沿用旧值，本轮实测确认）；④ **部署管道无新变化**：仍为 5 连败，最后一次成功 `33895713222`（09-04），**截至 09-09 无新增 run**（最新一条仍是 09-06 的 `34064117995`）；⑤ main 最新 CI 更新为 **`34242405531`**（success，对应 `38c0243`）；GitHub **无未关闭 PR、无未关闭 Issue**（本轮新增盘点）；⑥ 其余断言（105 首 / 各季分布 / 315 谱面 / `stream_app_url` 0-105 / 放行七字段全 null / 源码零 TODO-FIXME / 零 `@ts-ignore` / 非测试源码零 `any` / T1b·T5b 仍无单测 / 文档链接完整）本轮实测**全部仍成立**；链接自检唯一 MISS 仍是 `#bs-d001` 锚点假阳性。
>
> **上一轮（2026-09-08 第七次）要点（保留备查）**：① **溯源到部署门禁的引入点**——`git log -S` 实测：workflow 的 "Check launch sign-off" 步骤与 `launch-check.mjs` 的 `deviceTestRecord` 必需项，是**同一个 commit `8b710a3`**（2026-09-05 16:06 +0800，"chore: audit agent guidance and release workflow"）**一次性**加进去的；它与 `735208b`（09-05 21:51）同批推送，触发了**首个失败 run `33970422633`**（09-05T13:58:22Z），而此前 `33895713222`(09-04) / `33895023150` / `33817015569` **全部 success** → 部署受阻**不是渐进退化，而是门禁上线当天一次性造成**；② **排除第四条路径**——读 workflow 全文确认 `workflow_dispatch` 在 main 上**照样跑 `launch:check`**（"Check launch sign-off" 与 "Publish to Cloudflare Pages" **共用**条件 `github.event_name != 'pull_request' && github.ref == 'refs/heads/main'`），非 main 分支派发或 PR 事件则两个步骤**一起跳过**（含发布）→ **不存在任何「只跳门禁、保留发布」的路径**，P1-6 的三选一仍待用户拍板；③ main 最新 CI 更新为 **`34207150512`**（对应 `778e2be`）；④ **本轮线上核对未能执行**：`beatscape.pages.dev` / `scapemusic.pages.dev` / `api.github.com` 经代理与直连**均 SSL 握手失败**（本地网络中断），P0-6 / P1-3 的线上断言**沿用上一轮 09-08 实测、未重新取证**；⑤ 其余断言（105 首 / 各季分布 / 315 谱面 / `stream_app_url` 0-105 / 放行七字段全 null / 源码零 TODO-FIXME / 零 `@ts-ignore` / 非测试源码零 `any` / T1b·T5b 仍无单测 / 文档链接完整）本轮实测**全部仍成立**；链接自检唯一 MISS 是 `#bs-d001` 锚点，经查位于 `docs/BEATSCAPE-DECISIONS.md:5`，属假阳性。
> 整理原则：**已取消 ≠ 延期 ≠ 通过**。历史 PRD、工作日志、审计建议中的条目不得自动回填为本文件待办。

## 维护规则

1. 每条待办只在一个位置维护正文，本文件只做导航 + 记录状态与验收方式。
2. 新增/关闭条目时同步 `SESSION.md` 的 `next`，避免两处状态分叉。
3. **专项真机验收（BS-D001）已由用户取消，禁止再进入本文件或 `next`，也不得作为发布通过依据**（见下方「已取消」）。
4. 技术脚本通过 ≠ 人工验收通过。耳检、盲测、发布签审均为人工项，脚本只能记录结果。

---

## 当前状态速览

| 领域 | 状态 |
|---|---|
| 曲库 | **105/105**（s1 6 · s2 4 · s3 15 · s4 15 · s5 10 · s6 35 · p3 10 · p4 10）· **线上同 105**（2026-09-09 实测 `catalog.json` 曲目集合与本地一致） |
| 谱面 | 315 张已按「拍网格亲和力」全量重出 · **线上可下载**（p4 谱面实测 200） |
| 线上 | BeatScape <https://beatscape.pages.dev> · ScapeMusic <https://scapemusic.pages.dev> · **内容已同步、仅 JS 代码落后于 `main`**（最后一次成功部署 2026-09-04 `33895713222`）→ 见 P0-6 |
| CI / 部署管道 | **CI 绿**（main 最新 `34242405531` success）· **Deploy BeatScape 连续 5 次 failure**，全部卡在 `launch:check`（门禁由 `8b710a3` 于 09-05 一次性引入；截至 09-09 无新增 run）→ 见 P0-6 / P1-6 |
| GitHub 未决项 | **无未关闭 PR、无未关闭 Issue**（2026-09-09 实测） |
| 代码质量 | `strict: true` · **非测试源码零 `any`** · 零 `@ts-ignore`/`@ts-expect-error` · **零 TODO/FIXME 标记**（2026-09-09 第八次复查：`apps/beatscape/src` 全量 grep 确认，命中 0）。**例外（仅测试桩）**：`audio/hitsounds.test.ts:6/69/73` 共 3 处 `any`，用于伪造 `OfflineAudioContext`，非生产代码 |
| 判定反馈 | T3 结算页误差条已随 `a136592` 推送（未部署）；对局内早/晚即时提示仍待做 |
| 性能 | 第二轮已随 `e3ba64f` 提交：`ae15d3778b3f` 同指纹 28 项固定预算全部通过；最慢冷开局 3.908s、8 场整局 0 异常间隔、绘制峰值最高 3.5ms；未部署 |
| 阻塞发布 | 耳检 105 首 · 差异化盲测 / 英语叙事试玩 · **线上产物与 `main` 不同步（P0-6）** · 最终签审；真机执行取消与门禁冲突保持记录 |

---

## 已取消（不自动恢复）

| ID | 事项 | 依据 |
|---|---|---|
| **BS-D001** | 专项真机验收（iPhone Safari / 中端 Android Chrome 真机矩阵；整局・连续多局・切后台・锁屏恢复・多指触控・音画同步） | [BEATSCAPE-DECISIONS.md#bs-d001](docs/BEATSCAPE-DECISIONS.md#bs-d001)，用户 2026-09-06 明确取消。仅用户明确要求才恢复 |
| — | 明确不做（本阶段） | 采购热单 · NeonBeat 常量混入 · 全球榜后端 API（见 [docs/TODO.md](docs/TODO.md)） |

> **发布门禁现状**：`launch-check.mjs` 仍要求 `deviceTestRecord`，当前无通过记录。移除该必需门禁的补丁已被自动审批拒绝（无放宽授权）。对外表述须写「未做专项真机验收（用户取消）」，**不得宣称真机通过**。

---

## P0 — 阻塞正式上线

### P0-1 人工耳检 105 首
- **为什么**：确认无「脱口而出第三方名曲」的衍生风险，命中即废弃重生成。这是上线前不可自动化替代的一关。
- **工具已备**：`python3 scripts/beatscape-earcheck-worksheet.py --all` → 浏览器打开 `apps/beatscape/earcheck-worksheet.html`，逐曲听 + 勾选，进度自动保存且**绑定音频指纹**，可导出审核记录。
- **范围**：105 首（s1 6 / s2 4 / s3 15 / s4 15 / s5 10 / s6 35 / p3 10 / p4 10）
- **重点**：`bs-p3-01 / 04 / 07` 已从母带循环扩展至 216s（原版已备份，audit **PASS=4726 WARN=9 FAIL=0**），**接缝听感待人工审核**。
- **阻塞**：正式发布签审。

### P0-2 差异化盲测
- **为什么**：阻塞「对外宣称原创差异化」的一切表述。
- **规格**：[docs/RESONANCE-BLINDTEST.md](docs/RESONANCE-BLINDTEST.md)
- **阻塞**：需 5–10 名「不玩日式 RPG」的观察者（人工招募）。
- **注意**：叙事优化后界面已变，旧候选 `74840f1fc466` 的视觉截图属历史工作包，**新界面需重新绑定视觉盲测材料**。

### P0-3 正式上线放行
- **前置**：P0-1、P0-2、P0-4 全部完成。仓库 CI 已在 `e3ba64f` 通过；当前本地候选的固定条件性能预算已通过，[同指纹证据与覆盖边界](docs/BEATSCAPE-PERFORMANCE.md) 保持记录。**注意 CI 绿 ≠ 部署可用**：部署工作流是独立一条，且当前被 `launch:check` 卡死（见 P0-6 / P1-6）。
- **动作**：据实填写 `apps/beatscape/launch-signoff.json`。
- **实测现状（2026-09-09 第八次复查，与上一轮一致、仍无进展）**：`launch-signoff.json` **七个**字段 `artifactSha256` / `reviewedBy` / `reviewedAt` / `contentAudit` / `earcheckReport` / `blindtestRecord` / `deviceTestRecord` **全部仍为 `null`**，即放行材料一份未填。（注：上一轮摘要误写「六字段」，本轮以实测七字段为准。）
- **门禁**：`launch:check` 当前**应阻止**正式发布（`deviceTestRecord` 缺失，按 BS-D001 如实报告，不得当作通过）；状态详见 [docs/BEATSCAPE-RELEASE-READINESS.md](docs/BEATSCAPE-RELEASE-READINESS.md)。

### P0-4 英语叙事真人试玩
- **规格**：[docs/BEATSCAPE-NARRATIVE-PLAYTEST.md](docs/BEATSCAPE-NARRATIVE-PLAYTEST.md)（五分钟协议）
- **采集**：理解度 · 角色记忆 · 继续意愿 · 英语自然度。**尚无参与者结果。**
- **背景**：叙事深度优化候选 `fa4bca512a38`（139 单测 / 6 发布器回归 / 28 浏览器流程通过，本地未提交）。

### P0-5 门户发布配置
- **等待**：门户域名 + Cloudflare Pages 项目名；确定后按真实域名重建并复核，**发布另需对应授权**。
- **现状**：[docs/PORTAL-RELEASE-READINESS.md](docs/PORTAL-RELEASE-READINESS.md)，候选 `53f83162ad6e`（本地未提交）。
- **CI 注意**：仓库 CI 已在 `e3ba64f` 通过；门户候选仍需独立按真实域名、Pages 项目和门户发布脚本验收，不能用 BeatScape CI 代替。

### P0-6 线上部署与 `main` 不同步 —— 根因已定位：部署管道被 `launch:check` 卡死
- **实测（2026-09-08 第六次刷新，首次核对 GitHub Actions 部署管道）**：线上 `https://beatscape.pages.dev` 落后于 `main`，**且当前没有任何可行路径能重新部署**：
  - **最后一次成功部署**：`33895713222`，2026-09-04T16:32:29Z，head `ffe1ec0`（`feat(p4): ingest 脚本 …`）。此后**连续 5 次部署全部 failure**：`33970422633`(09-05) / `34011510454` / `34013428332` / `34033551869` / `34064117995`(09-06 22:28)。
  - **失败点是 `launch:check`，且它排在发布之前**：`.github/workflows/deploy-beatscape-cloudflare.yml` 的顺序是 `Verify release candidate` → `Check launch sign-off` → `Publish to Cloudflare Pages`；`34064117995` 的日志显示「Release verified: 105 tracks / 315 charts / 594 files / 402.7 MiB」之后立刻 `Launch blocked` 六条并 exit 1，**wrangler 从未执行**。
  - **后果**：T3 误差条（`a136592`）、退出弹窗（`6418d3f`）、性能第二轮（`e3ba64f`）等「已推送」改动**线上均不存在**，与实测一致——线上 bundle `/assets/index-CDXE9BO-.js`（325,768 B）不含 `No account, no ads`。
  - **但「落后」仅限 JS 代码，内容资产是当前版本（2026-09-09 首次实测，修正此前笼统表述）**：线上 `catalog.json` 返回真 JSON（115,172 B），**105 首 / 315 谱面 / `stream_app_url` 0-105**，曲目 ID 集合与本地**完全一致**；`/catalog/bs-p4-01/easy.json`（19,241 B）、`/catalog/bs-p4-10/hard.json`（51,507 B）均 **200** → 玩家线上能玩到完整的 105 首与 p4 谱面。**成因**：p4 进入 catalog 的 `f9d8c8f`（2026-09-04T16:31:54Z）经 `git merge-base --is-ancestor f9d8c8f ffe1ec0` 判定为 YES，是最后一次成功部署 head 的**祖先**，且仅早于部署 run `33895713222`（16:32:29Z）**35 秒**。因此「线上缺内容」不成立，待部署的只是代码改动。
  - 注：09-07 之后没有新的部署 run，是因为后续 commit 都是 docs-only，不命中工作流的 `paths` 过滤（`apps/beatscape/**` 等）；**不代表管道恢复**。
  - **门禁引入点（2026-09-08 第七次新测）**：`git log -S "Check launch sign-off" -- .github/workflows/deploy-beatscape-cloudflare.yml` 与 `git log -S "deviceTestRecord" -- apps/beatscape/scripts/launch-check.mjs` **两条命令都只命中 `8b710a3`**（2026-09-05 16:06 +0800，"chore: audit agent guidance and release workflow"）→ workflow 的门禁步骤与 `launch-check.mjs` 的必需字段是**同一 commit 一次性引入**。该 commit 与 `735208b`（09-05 21:51）同批推送 → 首个失败 run `33970422633`；此前 `33895713222`/`33895023150`/`33817015569` 全部 success。**部署是自 09-05 当天起被一次性卡死的，不是逐步退化。**
- **更正上一轮的两条证据（均作废）**：上一轮用「bundle 中 `scapemusic.pages.dev` 0 命中」和「`/release.json` 返回回落页」推断「线上不是 `build:cf` 产物」。实测二者都是 `8b710a3`（2026-09-05 `chore: audit agent guidance and release workflow`）才引入源码的（`streamLink.ts` 的域名字面量、`release.mjs prepare` 生成 `dist/release.json`），**均晚于最后一次成功部署（09-04）** → 线上没有它们是必然，不能证明 env 未注入。**教训：用「线上缺某字符串」当证据前，必须先确认该字符串进入源码的时间早于线上部署时间。**
- **动作项（四条路径目前全部不可达）**：
  - ~~推送触发 `.github/workflows/deploy-beatscape-cloudflare.yml`~~ —— **无效**，只要 `apps/beatscape/**` 有改动就必挂（已连续 5 次）。
  - ~~`bash scripts/deploy-beatscape-cf-pages.sh`~~ —— **同样被拦**：该脚本在 `pnpm release:beatscape` 之后紧接着执行 `pnpm --filter @musicsaas/beatscape launch:check`（脚本内可见），不是上一轮认为的「只走 `release:beatscape`」。
  - ~~GitHub 手动 `workflow_dispatch`~~ —— **本轮排除**：workflow 确有 `workflow_dispatch:` 触发器，但 "Check launch sign-off" 与 "Publish to Cloudflare Pages" **共用**条件 `github.event_name != 'pull_request' && github.ref == 'refs/heads/main'` → 在 main 上手动派发**照样跑 `launch:check`**；若在**非 main 分支**派发（或走 PR 事件），两个步骤**一起被跳过**，发布也不会发生 → **无法只跳门禁而保留发布**。
  - ~~本地 `wrangler pages deploy`~~ —— 未验证（需 `CLOUDFLARE_API_TOKEN`）。**若走这条路，等于绕开全部发布门禁，属于 P1-6 方案 2 的同级决策，须用户明确授权，不得自行执行。**
- **因此**：「线上未部署」**不是遗漏，而是现行门禁下的必然状态**。要解决必须先解 P1-6 的决策冲突。
- **为什么仍阻塞 P0-3**：放行要填 `artifactSha256`，但待签审产物与线上运行产物不是同一个；且即使签审完成，部署仍会因 `deviceTestRecord` 继续失败（见 P1-6）。
- **复测**：部署真正发生后，确认线上 bundle 出现 `scapemusic.pages.dev`、`/release.json` 返回 JSON 而非回落页，再回填本条结论。**重新部署 ≠ 放行**，P0-1 / P0-2 / P0-4 仍是人工阻塞项。

---

## 近期已完成（区分本地候选与已推送提交）

| 事项 | commit | 说明 |
|---|---|---|
| 结算页判定误差条（T3 前半） | `a136592` | `playState` 累计有符号偏差 → `PlayResult.timing` → `LastRun.timing` → 结算页早/晚计数 + 平均偏差条；**已推送**（2026-09-07），未部署 |
| 性能保障第二轮 | `e3ba64f` | 候选 `ae15d3778b3f` 的 28 项固定预算通过；179 单测、6 当前相关浏览器回归，完整结果见 [性能记录](docs/BEATSCAPE-PERFORMANCE.md)；未部署 |
| 仓库 CI 修复 | `e3ba64f` | 修复派单校验回归与 CI 外部 stream master 审计口径；CI `34033551898` 的 unit / build / beatscape / integration 全部通过 |
| 游戏内退出确认（替换 `window.confirm`） | `6418d3f` | 单人 / Duo 顶层面板，打开时暂停音频与判定；156 单测 + 28 浏览器回归通过，**未部署** |
| 自动性能基线与加载优化（第一轮） | `134115a` | 目录预加载/去重、首页按需谱面、64 MiB 解码缓存；移动冷开局仍 4.18 / 4.46s，**不等于性能达标**，第二轮已完成，见性能记录 |

> 其余历史完成项见 [SESSION.md](SESSION.md)「已完成（勿再当 P0）」。

---

## P1 — 待拍板 / 待接线

### P1-1 商业化差距决策点（5 项待拍板）
- **来源**：[docs/BEATSCAPE-COMMERCIALIZATION-GAP.md](docs/BEATSCAPE-COMMERCIALIZATION-GAP.md) §6
- **五项**：变现模式 · 经营主体 · 后端栈 · 流媒体终点 · 商标批次
- **影响**：拍板后解锁对应 P0。属决策阻塞，非技术阻塞。

### P1-2 世界观 Bible 待办（仅剩人工项）
- **来源**：[docs/BEATSCAPE-WORLDBIBLE.md](docs/BEATSCAPE-WORLDBIBLE.md) §12（文档/文案/判定皮肤/美术/回归语/昵称合规/点歌文案包/S1 电台剧集包已完成）
- **商标深检索结论（2026-08-30）**：
  - `NIGHTSHIFT` — 游戏内可用，但 **Class 41 有 LIVE 在册近邻**（Kennelly Reg. 6359178 · 乐队现场演出）→ **商品化/对外品牌化前必须做 TSDR 全类正式检索**
  - `MONOLITH` — 证实 LIVE（华纳 Reg. 5880307 · Class 9 游戏软件全线）→ **限游戏内叙事，不得对外**
  - 备选名初筛已备：The Late Static（首推）/ Scape City（次选），均无精确同名

### P1-3 ScapeMusic 游戏侧接线
- **实测（2026-09-07 第三次复查，更正早期「0/85」的过期表述）**：`apps/beatscape/public/catalog.json` 现 **105 首**，其中 per-track `stream_app_url` 字段 **0/105 有值**，`stream_audio` **105/105 有值**。
- **真实阻塞点**：深链由 `src/lib/streamLink.ts` 按「per-track `stream_app_url` → 构建期 `VITE_STREAM_APP_URL`」两级回落解析；仓库内**只有** `apps/beatscape/package.json` 的 `build:cf` 脚本注入 `VITE_STREAM_APP_URL=https://scapemusic.pages.dev`，dev / 其他构建方式下该 env 为空 → 回落为 `null`，UI 显示 "App link coming soon"。
- **线上状态（2026-09-08 第六次，更正为「未验证」）**：上一轮断言「深链线上确实不生效」**证据不成立**——所依据的 `scapemusic.pages.dev` 字面量是 `8b710a3`（09-05）才进 `streamLink.ts` 的，晚于最后一次成功部署（09-04）。**当前线上深链是否生效属于未验证**，须等 P0-6 部署成功后再实测。理论路径本身没问题：两条部署路径都经 `release:check` → `build:cf`（`apps/beatscape/package.json`，`release:check` 内含 `npm run build:cf`）注入 `VITE_STREAM_APP_URL=https://scapemusic.pages.dev`。
- **更正**：上一轮收窄为「确认 CF Pages 控制台构建命令」也是错的——`.github/workflows/deploy-beatscape-cloudflare.yml` 用 `wrangler pages deploy dist` **直接上传预构建产物**，不存在控制台构建这一环。真实阻塞是 **P0-6 的 `launch:check`**，不是管道配置。
- **反向深链已实测 OK**：ScapeMusic 线上 `index-DwW6K_-S.js`（264,752 B）中 `beatscape.pages.dev` 命中 **1 次**、遗留 bug 串 `127.0.0.1:5175` 命中 **0 次** → `VITE_GAME_URL` 修复已上线，游戏↔流媒体**只有 BeatScape→ScapeMusic 这一侧未验证**。（2026-09-09 第八次复核：网络已恢复，本轮**重新取证**——线上 `/assets/index-CDXE9BO-.js` 中 `scapemusic.pages.dev` **0 命中**、`127.0.0.1:5175` **0 命中**，`App link coming soon` **1 命中**；因该字面量晚于 09-04 部署，**深链线上是否生效仍属未验证**，须等 P0-6 解除门禁后复测。另实测线上 `catalog.json` 为 **105 首、`stream_app_url` 0-105**，与本地一致 → 「补 per-track `stream_app_url`」在本地与线上是同一件事。）
- **待办**：① 随 **P0-6** 先解除部署门禁；② 部署后复测线上 bundle 是否出现 `scapemusic.pages.dev`、并实测 `/#/track/{id}` 可达；③ 再决定是否补齐 per-track `stream_app_url`（当前 0/105，本地与线上 catalog 一致）。
- **来源**：[docs/BEATSCAPE-MUSIC-WEB.md](docs/BEATSCAPE-MUSIC-WEB.md) · `apps/beatscape/PRD.md:400`（记录「数据中无 `stream_app_url` 字段，深链走全局 env」）
- **另注**：「Scape Music」为工作名，对外前需商标初筛。

### P1-4 音乐模型候选评估（MiniMax Music 3.0 / YuE）
- **待办**：MiniMax Music 3.0 **优先于 YuE** 做 10 首小样本（中文歌词 / 器乐 / BPM 与段落结构 / Apple Silicon 内存）；YuE 仅在有 CUDA 机器时做 5 首人声对照。
- **前置阻塞**：许可与合规留档——MiniMax **Community License**（非 Apache/MIT）需核实品牌展示显著度、年收入门槛、内容安全与版权防护义务（[docs/COMPLIANCE.md](docs/COMPLIANCE.md) C-06）。**完成前不得切为生产默认引擎**，继续用 SA3 + ACE-Step。
- **来源**：[PRD.md](PRD.md) §19 待决 7/8 · §20.1 验证清单 · [docs/COMPLIANCE.md](docs/COMPLIANCE.md)。
- **状态**：需求已写入 SESSION/PRD/COMPLIANCE（工作区未提交），**尚未开始实测**。

### P1-5 三人立绘市场评估
- **性质**：人工判断（非技术项）。
- **风险点**：女性首位（JUNO）的市场接受度。
- **背景**：LoRA 重出已完成并上线（commit `6b97c2e`），锚点 checklist 目验已过。

### P1-6 部署门禁与 BS-D001 冲突（需拍板）🆕
- **冲突**：`apps/beatscape/scripts/launch-check.mjs:19` 的必需项循环为 `['contentAudit', 'earcheckReport', 'blindtestRecord', 'deviceTestRecord']`，**四项缺一即 blocker**。而 `deviceTestRecord` 来自**专项真机验收**，该项已按 [BS-D001](docs/BEATSCAPE-DECISIONS.md#bs-d001) 由用户取消 → **该字段无法产生** → 即使 P0-1 / P0-2 / P0-4 全部完成并签审，**部署仍会 100% 失败**（`34064117995` 日志的六条 blocker 中它就占一条）。
- **影响面**：不只是「不能正式发布」，而是**任何线上更新都不可能**（含 bug 修复与已推送功能），线上会永久停在 2026-09-04 的产物。
- **三选一（需用户拍板，本文件不自行决定）**：
  1. 重新授权真机验收 —— 按 BS-D001，**仅用户明确要求**才恢复；
  2. 授权调整/移除 `deviceTestRecord` 门禁 —— 此前移除该必需门禁的补丁已被自动审批拒绝（无放宽授权），需明确授权；
  3. 维持现状 —— 接受线上停留在 09-04 版本，所有「已推送未部署」项继续挂起。
- **不可选**：不得为绕过门禁而伪造 `deviceTestRecord`，也不得把「技术检查通过」记为真机通过（BS-D001）。
- **本轮新增（2026-09-08 第七次）**：
  1. 已排除 `workflow_dispatch` 与 PR 触发这两条「只跳门禁、保留发布」的路径（依据见 P0-6），**当前零可行路径**，方案 3「维持现状」是默认生效状态而非需要额外操作。
  2. 门禁的**精确引入点是 `8b710a3`**——该 commit 同时改了 `.github/workflows/deploy-beatscape-cloudflare.yml`（新增门禁步骤）与 `apps/beatscape/scripts/launch-check.mjs`（新增 `deviceTestRecord` 必需项）。若用户选方案 2，改动范围可直接定位到这两处，无需全仓搜索。
- **来源**：`launch-check.mjs:19` · 本轮 `git log -S` 溯源 · 上一轮 `gh run view 34064117995 --log-failed`。

---

## P2 — 产品增强（可玩性 / 增长）

> 来源：[docs/BEATSCAPE-PLAYABILITY-GROWTH-TODO.md](docs/BEATSCAPE-PLAYABILITY-GROWTH-TODO.md)。**T1a（站点级 OG 卡）与 T2（全模式 Note speed）已确认落地**，不重复列为待办。

| ID | 事项 | 价值 | 状态 |
|---|---|---|---|
| **T5a** | 分享文案加 privacy 卖点（无账号 / 数据留在本机） | ★★ 低成本差异点 | ✅ **已核实落地**（2026-09-06）：`session.ts` shareResultsCopy / `pageMeta.ts` description / `index.html` og:description 均已含 "No account, no ads. Scores stay in your browser."，`session.test.ts`、`pageMeta.test.ts` 有断言。此前清单标「待做」属过期 |
| **T3** | 判定偏早/偏晚提示 + 结算页误差条 | ★★★ 「能玩」→「能练」 | 🟡 **结算页误差条已落地并推送**（`a136592`，2026-09-07）：`playState.ts` 累计有符号偏差 → `PlayResult.timing` → `LastRun.timing` → 结算页双向误差条（早/晚计数 + 平均 ms），184 单测 / tsc 干净，未部署。**对局内早/晚即时提示**待做，受 `renderLoop.ts` 归属限制（该文件属性能任务） |
| **T4** | 从失败点重开（挂 `MissReplayPanel`） | ★★ 啃高难度谱的前提 | 待做（跨 5 文件，涉计分完整性） |
| **T1b / T5b** | OG 随路由同步 / 海报复制到剪贴板 | ★ 锦上添花 | 🟡 **代码已在工作区、未提交**：`seo/pageMeta.ts` 新增 `socialMetaTags()` 并在 `setPageMeta` 同步 og:/twitter:；`pages/Results.tsx` 新增 `copyImageBlob()` + “Copy poster” 按钮（非安全上下文回落提示下载）。**两处仍无单测覆盖**（2026-09-09 第八次复查：grep 仍只命中实现文件 `pageMeta.ts:80/113`、`Results.tsx:72/242`，**零测试文件命中**），提交前需补 `pageMeta.test.ts` / Results 相关断言 + tsc/vitest/build 门禁，并说明爬虫不执行 JS、静态 `index.html` 仍是首次 unfurl 来源 |

---

## P3 — Reddit 首发运营（人工）

> 来源：[docs/TODO.md](docs/TODO.md)（P3/P4 段）。**不继承**：「Stage4 40 首」与「真 180s 流媒体母带」已被 105 首曲库 / 216s 双资产覆盖，属过期项。

- [ ] 发帖素材包 — 见 [docs/BEATSCAPE-REDDIT-LAUNCH.md](docs/BEATSCAPE-REDDIT-LAUNCH.md)
- [ ] 目标 sub 调研
- [ ] 开发者向帖子（可选）
- [ ] 反馈入口（Discord / Discussions）
- [ ] 公网 URL < 3s（需部署后测）
- [ ] 荣誉段位 / 成就
- [ ] PWA + 离线缓存
- [ ] Stage3+ AI 写实封面

---

## P4 — 跨仓 Harness 修复（2026-09-06 审计，本次未执行）

> 来源：[docs/COMPANY-PROJECT-HARNESS-AUDIT-2026-09-06.md](docs/COMPANY-PROJECT-HARNESS-AUDIT-2026-09-06.md) §6。**责任范围在本仓之外**，本文件只登记不认领；建议按「源规则与生成器 → 项目接入 → 受控同步 → 验收」推进，直接批量 `--force` 会传播已有错误。

| # | 待办 | 应修改位置 | 完成条件 |
|---|---|---|---|
| 1 | 修复相对链接转换；给复制/投影管道加链接检查 | Codex project-sync 生成器；HQ Company OS 导出 | 20 条坏链接修复且不复发 |
| 2 | 统一按需读取、写入授权、会话 ID、active-site 规则 | Vault canonical、Codex managed command | 同一行为无相反条款 |
| 3 | 补齐 MeiGen 项目说明/规范副本，恢复产品与单票文档分层 | meigen-replica；landing-tool-a | 无未填写占位；单票 AC 可追溯 |
| 4 | 完成 HQ 规范迁移，再按受控版本同步产品副本 | multica `.ai-company/`、manifest、各 `.delivery/company-os/` | 副本与来源逐项一致、版本可追溯 |
| 5 | 补项目入口与台账映射 | metadata-viewer、VideoSaas、zstock；HQ 与 Vault registry | 乱码/旧链接修复；profile 有续作入口 |
| 6 | 清理重复/过期状态，保持索引只做导航 | 各项目 SESSION/TODO/KB/CODE-INDEX | 旧 TODO 标明迁移；索引不维护易过期状态 |
| 7 | 把文件契约与语义校验接入规范 Doctor | HQ 检查脚本与 Codex projector verifier | 逐项目 PASS/FAIL/SKIP，未核验不计通过 |

---

## P5 — 仓库内部清理

### P5-1 ~~归档过期冲刺清单~~ ✅ 已完成（2026-09-07 收口）
- 已给 `docs/BEATSCAPE-TODO-ACCEPTANCE.md` 加**历史冲刺归档**横幅：27 条未勾选项属 2026-08-25 的 Stage1/Stage2 冲刺，明确不得回填为当前待办、不得清空勾选态伪造完成；保留正文作历史验收规格。
- 两处索引均已标注「历史冲刺归档」：`docs/KNOWLEDGE-BASE.md` 第 9 条（2026-09-06）、`docs/CODE-INDEX.md:155`（2026-09-07 补，并指向本文件为当前入口）。**本项无剩余动作。**

### P5-2 整理未提交的工作区改动
- 截至 **2026-09-09 第八次刷新**（实测 `git status`，`origin/main` 与本地已同步 0/0，HEAD `38c0243`），工作区有并行会话未提交改动（与上一轮相比**构成不变**，仍是 10 项并行会话改动 + 7 项未跟踪，另加本文件 `TODO.md` 待提交）：
  - **T1b / T5b（新）**：`apps/beatscape/src/seo/pageMeta.ts:80`（`socialMetaTags`）、`pageMeta.ts:113`（`setPageMeta` 内同步 og:/twitter:）、`apps/beatscape/src/pages/Results.tsx:72`（`copyImageBlob`）、`Results.tsx:242`（调用点）——**本轮复查仍无任何测试文件命中这两个符号**，见 P2 表
  - **需求文档**：`PRD.md`（§19 待决 7/8、§20.1 验证清单、MiniMax/YuE 官方链接）、`docs/COMPLIANCE.md`（许可表 + C-06）、`SESSION.md`（P1-4 音乐模型候选评估）
  - **Harness / 项目规范**：`AGENTS.md`（追加 cursor-codex-sync 区块）、未跟踪的 `.agents/skills/{company-harness,vault-harness,zbrain-session}/`、`.codex/`
  - **其他**：`.delivery/README.md`、`.delivery/prompts/orchestrator-kickoff.md`、`worklog/2026-09-06.md`、`.workbuddy-ai/memory/2026-09-06.md` / `2026-09-07.md` / `2026-09-08.md`、`.workbuddy-ai/memory/automations/ff19e388-…/memory.md`（本自动化自己的记录）
- **已落地不再列**：T3 结算页误差条的原工作区改动已随 `a136592` 提交并推送；`docs/CODE-INDEX.md` 的历史冲刺归档标注随上一轮 TODO 刷新一并提交（P5-1 收口，本轮复查三处归档横幅均仍在）。
- **动作**：由各改动所有者分别提交；**不要 `git add -A` 一次性扫入**，避免把并行会话的半成品混入。

---

## 验收命令

```bash
# 曲库与内容 QA
pnpm catalog:beatscape
pnpm audit:beatscape
pnpm earcheck:beatscape

# 耳检工作单（人工逐曲听）
python3 scripts/beatscape-earcheck-worksheet.py --all

# 单元 + 集成（pnpm test 仅含 Gateway + Python unit，不含 BeatScape）
pnpm test
bash scripts/harness.sh all

# 发布门禁（在 apps/beatscape 包内，当前应阻止正式发布）
pnpm --filter @musicsaas/beatscape launch:check

# 性能测量与固定预算核验（在 apps/beatscape 包内）
npm run performance:measure   # 采集，产物指纹固定
npm run performance:check -- ../../data/beatscape-performance/2026-09-06/assurance/release-all/results.json ../../data/beatscape-performance/2026-09-06/assurance/release-peak-second/results.json ../../data/beatscape-performance/2026-09-06/assurance/release-peak-objects/results.json

# 部署管道核对（P0-6 / P1-6：CI 绿 ≠ 部署成功，这是两条独立工作流）
gh run list --workflow=deploy-beatscape-cloudflare.yml --limit 10   # 看 Deploy 工作流结论
gh run view <run-id> --log-failed                                   # 看失败点：是否卡在 launch:check
gh run list --branch main --limit 5                                 # CI 工作流（unit/build）结论

# 门禁溯源：定位某条门禁/字段是哪一个 commit 引入的（实测两条都只命中 8b710a3）
git log -S "Check launch sign-off" --oneline -- .github/workflows/deploy-beatscape-cloudflare.yml
git log -S "deviceTestRecord" --oneline -- apps/beatscape/scripts/launch-check.mjs

# 线上产物核对（P0-6 / P1-3：确认线上跑的就是待签审的那份）
curl -s https://beatscape.pages.dev/ | grep -oE 'src="[^"]*\.js"'          # 取当前 bundle 名
curl -s https://beatscape.pages.dev/assets/index-CDXE9BO-.js | grep -c "scapemusic.pages.dev"  # 期望 >=1；注：09-04 产物必为 0，不构成证据
curl -s https://beatscape.pages.dev/release.json | head -c 80              # 期望 JSON；返回 <!doctype html> = 产物早于 8b710a3
curl -s https://scapemusic.pages.dev/assets/index-DwW6K_-S.js | grep -c "127.0.0.1:5175"  # 期望 0（VITE_GAME_URL 已注入）

# 线上「内容 vs 代码」分离核对（2026-09-09 新增维度：内容可能已是最新，只有 JS 代码会落后）
curl -s https://beatscape.pages.dev/catalog.json | python3 -c "import json,sys,collections;d=json.load(sys.stdin)['tracks'];print(len(d),dict(sorted(collections.Counter(t['track_id'].split('-')[1] for t in d).items())))"
curl -s -o /dev/null -w "%{http_code}\n" https://beatscape.pages.dev/catalog/bs-p4-01/easy.json  # 期望 200（内容在线）
# 判「是否 SPA 回落」：与一个确定不存在的路径比字节数，相同即文件不存在
curl -s -o /dev/null -w "missing=%{size_download}\n" https://beatscape.pages.dev/definitely-not-here-xyz
curl -s -o /dev/null -w "release=%{size_download}\n" https://beatscape.pages.dev/release.json

# GitHub 未决项盘点（2026-09-09 实测：均为空）
gh pr list --limit 10 ; gh issue list --limit 10
```

**说明**：`bash scripts/harness.sh all` = unit + workspace build + mock integration。技术检查通过不替代人工耳检、盲测与上线签审。

> **2026-09-09 第八次刷新提示**：网络已于本轮恢复（代理端口 `7897` 可用），**上一轮搁置的线上取证已全部补做**，结论见 P0-6 / P1-3。沿用规则不变：**网络不可达时不得把「拿不到返回」记为「线上异常」**，须沿用上一次成功取证的日期与结论；恢复后优先补做。另本轮确认一条易错点：**「线上内容落后」与「线上代码落后」必须分开断言**——`catalog.json` 与谱面资产是数据文件，可能已随早先成功部署上线，只有 bundle JS 才必然落后于 `main`；合并成一句「线上落后」会误导判断。
