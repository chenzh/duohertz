# MusicSaas 项目 TODO

> **本文件是待办的唯一入口**，只登记**当前真实未完事项**，细节一律链接到对应权威文档，不在此复制正文。
> **本轮改动（2026-09-22 第二十八次）**：① 开局 `rev-list` = **`0 0`**、HEAD `3cc2770` 即上次刷新 → **连续第二十八轮无新落地项**，为**校验型刷新 + 新维度**（不为了刷新而改日期或硬加条目）。② **网络正常**（代理 `7897` → 200，其余端口 000），线上取证与 `gh` 全部成功，**本轮无需沿用旧值**。③ **逐项实测复核，既有断言全部仍成立**：105 首 / 各季分布（s1 6 · s2 4 · s3 15 · s4 15 · s5 10 · s6 35 · p3 10 · p4 10）/ 315 谱面 / `stream_app_url` **0-105** / `stream_audio`·`preview`·`audio`·`cover`·`og` **各 105-105** / 线上 catalog **105 首 315 谱面、`stream_app_url` 0-105、`preview` 仍 25-105** 且**曲目 ID 集合与本地一致**（only-online 0 · only-local 0）/ 线上 bundle 仍 `index-CDXE9BO-.js`（325,768 B；`scapemusic.pages.dev` 0 · `No account, no ads` 0 · `App link coming soon` 1 · `Signal lost` 1）/ `release.json`·`og.png` 与缺失路径同 **2146 B** / `robots.txt` 133 B / `sitemap.xml` 911 B / p4 谱面 200（19,241 B）/ 放行七字段**全 null** / **252 个受控源码文件**零 TODO-FIXME-XXX-HACK、零 `@ts-ignore` / `any` 受控命中 **4 处**（3 测试桩 + `Duo.tsx:310` 注释假阳性；未入库的 `routePreload.ts:7` 另计）/ `socialMetaTags` 有测试（`pageMeta.test.ts:184`）、`copyImageBlob` **仍零测试**（行号漂移到 `Results.tsx:114/608/618`）/ **16 条文件链接 + 56 个锚点全 OK、MISS 0** / 部署 **9 failure + 1 cancelled**、`34675948678`（09-12T05:34Z）之后**无新增 run** / `gh workflow list` 仍漏报只返 6 条（**连续第十五轮**）/ 6 个未关闭 Issue（#34–#39）· 0 PR / 未跟踪文件仍 **1190** 个、105 张单曲 `og.png` **仍未入库**。④ **数字**：CI run 号 `35459105488` → **`35528074175`**（success，09-20T18:08:06Z，`headSha` = `3cc2770` = HEAD）—— **连续第十八轮**命中「写入即过期」；部署债务 **51 → 52**（触及 `apps/beatscape/**` 的**仍 11 个、名单不变**）；`a136592` 之后 36 → **37**。⑤ **新增维度：「曲库元数据与实测资产一致性」盘点**（详见 [专节](#曲库元数据与实测资产一致性盘点2026-09-22-第二十八次新增维度)）——前二十七轮只做过「声明 → 磁盘」的**存在性**对账，从未把 **`catalog.json` 声明的数值**与**音频 / 谱面的实测值**对账。结论是**七项对账全部干净、据此不生成待办**；但过程中差点造出一个假阻塞：**`total_notes` 按「数组长度」比对会得出「315 张谱面里 314 张对不上」**，实际它是 **PRD §4.4 的判定对象数**（hold=2 / chord=len(lanes) / slide=1），按该规则 **315/315 全对** → 顺带澄清本文件沿用多轮的 **112,511** 是**音符条目数**，而**准确率分母（判定对象数）是 143,066**，两者都对但含义不同。⑥ 本轮**未做顺手收尾**（无符合「极小动作」的候选）。
>
> **本轮改动（2026-09-21 第二十七次）**：① 开局 `rev-list` = **`0 0`**、HEAD `760ac23` 即上次刷新 → **连续第二十七轮无新落地项**，为**校验型刷新 + 新维度**（不为了刷新而改日期或硬加条目）。② **网络正常**（代理 `7897` → 200，其余端口 000），线上取证与 `gh` 全部成功，**本轮无需沿用旧值**。③ **逐项实测复核，既有断言全部仍成立**：105 首 / 各季分布（s1 6 · s2 4 · s3 15 · s4 15 · s5 10 · s6 35 · p3 10 · p4 10）/ 315 谱面 / `stream_app_url` **0-105** / `stream_audio` **105-105** / `preview` 本地 105-105、线上仍 **25-105** / 线上 catalog **105 首 315 谱面且曲目 ID 集合与本地完全一致**（only-online 0 · only-local 0）/ 线上 bundle 仍 `index-CDXE9BO-.js`（325,768 B；`scapemusic.pages.dev` 0 · `No account, no ads` 0 · `App link coming soon` 1 · `Signal lost` 1）/ `release.json` 与 `og.png` 均与缺失路径同 **2146 B** / `robots.txt` 133 B / `sitemap.xml` 911 B / p4 谱面 200（19,241 B）/ 放行七字段**全 null** / 源码零 TODO-FIXME-XXX-HACK / 零 `@ts-ignore` / **78 条链接（文件 + 锚点）MISS 0** / 部署 **9 failure + 1 cancelled、最后成功 `33895713222`、09-12 后无新增 run** / `gh workflow list` 仍漏报只返 6 条（**连续第十四轮**）/ 6 个未关闭 Issue（#34–#39）· 0 PR。④ **数字**：CI run 号 `35251553547` → **`35459105488`**（success，09-19T17:46:14Z，`headSha` = `760ac23` = HEAD）—— **连续第十七轮**命中「写入即过期」；部署债务 **50 → 51**（触及 `apps/beatscape/**` 的**仍 11 个、名单不变**）；`a136592` 之后 35 → **36**。⑤ **行号漂移**：`pages/Duo.tsx` 注释假阳性 **307 → 310**；`any` 命中数见速览（受控源码 **4** 处 = 3 测试桩 + 1 注释假阳性；工作区另有未入库的 `routePreload.ts:7`）。⑥ **新增维度：「未入库资产（git index 覆盖）盘点」**（详见 [专节](#未入库资产盘点2026-09-21-第二十七次新增维度)）——前二十六轮只**数过**未跟踪条目、从未**枚举**其内容。核心发现：**`catalog.json` 声明的 105 张单曲 `og.png` 全部在磁盘上、未被 gitignore 忽略、却从未入库**，而生成脚本 `generate:og` **不在 CI/部署链路里** → **即使 P0-6 部署门禁解锁，这 105 张图也不会上线**；另 **907 个 Playwright 产物因目录改名（`test-results-*`）绕过 `.gitignore:61` 的精确名规则**堆在未跟踪区。⑦ **纠正一条连续多轮的错误计数**：此前每轮写的「10 项未跟踪」是 `git status --short` 的**目录级**计数，实测 `git ls-files --others --exclude-standard` 为 **1190 个文件**。
> **本轮改动（2026-09-20 第二十六次）**：① **先补推上一轮欠下的 commit** —— 开局 `rev-list` = **`0 1`**，HEAD `e8a0cd8` 是上一轮刷新但**没能 push**（上一轮网络不可达）。本轮第一步即用 `127.0.0.1:7897` 代理一次推成功（`501d42e..e8a0cd8`，`rev-list` 归 `0 0`）→ **本轮开工前先确认上一轮是否真的推上去了，已固化为必做动作**。② 因此 HEAD 仍即上次刷新 → **本轮无新落地项**，为**校验型刷新 + 补做上一轮欠下的线上取证 + 新增维度**。③ **网络已恢复（代理 7897 → 200）**，上一轮因不可达而「沿用旧值」的线上断言**本轮全部重新取证，且与 09-18 结论逐条一致**：线上 bundle 仍 `index-CDXE9BO-.js`（325,768 B；`scapemusic.pages.dev` **0** · `No account, no ads` **0** · `App link coming soon` **1** · `Signal lost` **1**）、线上 `catalog.json` **105 首 / 315 谱面 / `stream_app_url` 0-105 / `preview` 仍仅 25-105** 且**曲目 ID 集合与本地完全一致**（only-online 0 · only-local 0）、`release.json` 与 `og.png` 均与确定缺失路径同 **2146 B**（仍 SPA 回落）、`robots.txt` **133 B**、`sitemap.xml` **911 B**。④ **上一轮明写「下轮必查」的 CI run 号已核实过期并更正**：main 最新**已完成** CI 实为 **`35251553547`**（success，09-17T17:14:55Z，`headSha` = `501d42e`），上一轮沿用的 `34675948677`（对应 `231bad5`）确已过时；另有 `35458816086`（09-19T17:40Z，**in_progress**，`headSha` = `e8a0cd8`）是本轮补推触发的。**「写入即过期」规律再次成立。**⑤ **新增维度：「仓库治理与安全配置」盘点**（详见 [专节](#仓库治理与安全配置盘点2026-09-20-第二十六次新增维度)）——前二十五轮盘过工作流本身，却从未盘**仓库侧护栏**。核心结论与 **P1-6 直接耦合**：`launch:check` 目前是**唯一**挡在「push 到 main」与「生产发布」之间的东西 —— 实测 GitHub 侧**无分支保护**（私有仓库 + Free 计划，API 返回 `Upgrade to GitHub Pro or make this repository public`）、**Dependabot alerts 关闭**（403）、**`security_and_analysis` 为 null**（无 secret scanning / push protection）；而 `deploy-beatscape-cloudflare.yml` **无 `environment:`、无人工审批**（全仓仅 `deploy-neonbeat.yml:51` 有 `environment:`）；本地 `.github/` 除 7 个 workflow 外**只有 1 个 ISSUE_TEMPLATE**，**无 CODEOWNERS / 无 `dependabot.yml` / 无 PR 模板**。→ **若 P1-6 选方案 2 放宽门禁，等于让 main 上任何触及 `apps/beatscape/**` 的 push 在零人工审批下自动发布到生产**，这是此前各轮都没说出来的、该决策的真实代价。⑥ **数字**：部署债务 **49 → 50**（触及 `apps/beatscape/**` 的**仍 11 个、名单不变**，增量仍是本文件刷新 commit 自己）；`a136592` 之后的 commit 数 33 → **35**。⑦ **行号漂移更正**：`pages/Duo.tsx` 的英文注释假阳性由 **271 → 307**；`any` 仍 **5 处命中**（3 测试桩 `audio/hitsounds.test.ts:6/69/73` + `src/routePreload.ts:7` 非测试源码 + `Duo.tsx:307` 注释假阳性）。⑧ 其余断言本轮实测**全部仍成立**：曲库 **105** 首（s1 6 · s2 4 · s3 15 · s4 15 · s5 10 · s6 35 · p3 10 · p4 10）、**315** 谱面、`stream_app_url` **0/105**、`stream_audio` / `preview` / `audio` / `cover` / `og` **各 105/105**；`launch-signoff.json` **七字段仍全 null**；`apps/beatscape/src` **零 TODO/FIXME/XXX/HACK**、**零 `@ts-ignore`/`@ts-expect-error`**；`socialMetaTags` **已有测试**（`pageMeta.test.ts:184`）、`copyImageBlob` **仍零测试命中**（`Results.tsx:114/577/587`）；**16 条文件链接 + 51 个内部锚点全 OK、MISS 0**（连续第九轮）；部署管道仍 **9 failure + 1 cancelled**、最后一次 run `34675948678`（09-12）、**09-12 之后无新增 run**；`gh workflow list` **仍只返 6 条**（连续第十四轮漏报 `agent-delivery-dispatch.yml`）。
>
> **本轮改动（2026-09-19 第二十五次）**：① **`rev-list` 仍 `0 0`、HEAD `501d42e` 就是上一轮刷新 commit** → 本轮**无新落地项**，为**校验型刷新 + 新增维度**。② **⚠️ 本轮网络全程不可达（下轮先看这条）**：代理 `127.0.0.1:7897` **未监听**（`curl -x` 立即返回 `Couldn't connect to 127.0.0.1 port 7897 after 0 ms`，不是超时而是拒绝连接），7890/1087/8888/1080 同样 000，直连 `beatscape.pages.dev` / `api.github.com` 亦全 000 → **线上取证与 `gh` 本轮一次都没跑成**。按纪律**不得把「拿不到返回」记为「线上异常」**：P0-6 / P1-3 的线上断言**沿用 2026-09-18 第二十四次实测结论，并显式标注「本轮未重新取证」**。③ **CI run 号本轮查不到，但逻辑上已确定过期**：实测 `ci.yml` 的 `on.push` **只有 `branches: [main]`、没有 `paths` 过滤** → 09-18 推送的 `501d42e` **必然触发过一次新的 CI run**，故速览里的 `34675948677`（对应 `231bad5`）**逻辑上已不是最新**；因无网络无法取得新编号，**本轮刻意不改写数值，只标注「下轮恢复网络后必查」**——这与前十六轮「写入即过期」成因不同：那几次是**能查而没查**，这次是**查不到**。④ **数字**：部署债务 **48 → 49**（`git rev-list --count ffe1ec0..HEAD`），触及 `apps/beatscape/**` 的**仍 11 个**，增量仍全部来自本文件自身的刷新 commit；链接自检 **16 个去重文件链接 + 47 个锚点全 OK、MISS 0**（连续第八轮确认 `#bs-d001` 从来不是问题）。⑤ **新增维度：「命令与脚本入口盘点」**（详见 [专节](#命令与脚本入口盘点2026-09-19-第二十五次新增维度)）——前二十四轮只盘过 `scripts/` 目录里的孤儿文件，从未盘过 `package.json` 里声明的命令。核心结论是**同名命令跨层异义**：根 `pnpm test` 与根 `pnpm test:e2e` **都走 `scripts/harness.sh`**，而 `harness.sh:110-118` 的 `run_e2e()` 实测**只 `start_gateway` + `start_demo` 并跑 `scripts/acceptance-demo-web.py`**（:112 的 log 原文即 `tier: e2e (gateway + demo acceptance)`）→ **根 `pnpm test:e2e` 完全不含 BeatScape e2e**，手动补跑必须 `pnpm --filter @musicsaas/beatscape test:e2e`。这对第十三次「BeatScape e2e 自 09-06 起未在 GitHub 跑过」是直接补充：**想手动补跑时最直觉的那条命令根本跑不到它**。⑥ **其余断言本轮实测全部仍成立**：曲库 **105** 首（s1 6 · s2 4 · s3 15 · s4 15 · s5 10 · s6 35 · p3 10 · p4 10）、**315** 谱面、`stream_app_url` **0/105**、`stream_audio` **105/105**、`preview` **105/105**、`audio` **105/105**（本地，与上一轮一致）；`launch-signoff.json` **七字段仍全 null**；`apps/beatscape/src` **零 TODO/FIXME/XXX/HACK**、**零 `@ts-ignore`/`@ts-expect-error`**；`any` 仍 **5 处命中**（3 测试桩 `audio/hitsounds.test.ts:6/69/73` + `src/routePreload.ts:7` 非测试源码 + `pages/Duo.tsx:271` 英文注释假阳性）；`socialMetaTags` **已有测试**（`seo/pageMeta.test.ts:184`）、`copyImageBlob` **仍零测试命中**（`Results.tsx:114/577/587`，行号较上一轮记录的 72/242 已漂移）。
>
> **历史（2026-09-18 第二十四次）**：① **HEAD 仍是 `231bad5`（09-12），自第二十三次刷新以来无新落地 commit** → 本轮为**校验型刷新 + 纠错**，并**首次打破连续十五轮「CI run 号写入即过期」的规律**：main 最新 CI 实测仍为 **`34675948677`**（success，09-12T05:34:59Z，`headSha` = `231bad5` = 当前 HEAD），**本轮无需更正** —— 该规律的前提是「两轮之间有新 commit」，无新 commit 时自然不生效（此前十五轮每轮都有新 commit，故从未出现过）。② **纠错：速览长期写的「无未关闭 PR、无未关闭 Issue」是错的** —— 实测 `gh issue list --state open` 有 **6 个未关闭 Issue**（**#34–#39**，全部 2026-09-09T13:00Z 创建、均带 `agent-safe` 标签：`[TICKET-B06]` Library / `B07` Calibration / `B08` Settings / `B09` 404 / `B10` Home 页 SEO title·description、`B11` Play 页 SEO 回归测试补强）；**PR 仍为 0**。③ **上条真正有价值的不是「有 6 个」，而是对账结果（本轮新发现）**：这 6 个 Issue 所要求的工作**在代码里已全部完成且已有测试** —— `Library.tsx:66` / `Calibration.tsx:47` / `Settings.tsx:94` / `NotFound.tsx:5` / `Home.tsx:35` 均已 `usePageMeta(...)`，`pageMeta.test.ts` 有对应 `HOME_PAGE_META`(105) / `LIBRARY_PAGE_META`(122) / `CALIBRATION_PAGE_META`(134) / `SETTINGS_PAGE_META`(146) / `NOT_FOUND_PAGE_META`(173) 断言，`B11` 要求的「`buildPlayPageMeta` 无 seo block 边界」也在 `pageMeta.test.ts:59/68` 两条用例中 → **这 6 个是「做完没回来关」的僵尸条目，不是待办**。按纪律**不自行 close**（关闭 GitHub Issue 属外部动作、需授权），登记为 P5 待授权项。④ **新增「本地数据持久化与隐私声明一致性」维度**（前二十三轮从未盘过浏览器端存储，也从未把隐私文案与代码对账）：BeatScape **19 个 `bs_*`** localStorage/sessionStorage key、ScapeMusic **3 个 `sm_*`**；**零 IndexedDB、零 cookie、零 `sendBeacon`**；非测试源码 `fetch` 仅 3 处且**全部同源**（`catalog.json` / 谱面 / 音频）→ **对外承诺「Scores stay on your device」实测成立**。⑤ **本维度唯一值得登记的残留（惰性外发面，非现状缺陷）**：`src/lib/analytics.ts` 定义 **23 类埋点事件**（`home_view` … `calibrate_open`），在 **9 个文件**中被真实调用，写入 `bs_analytics`（`slice(-120)` 有界）；其中 `analytics.ts:38-39` 有一处 **Plausible 第三方转发钩子** `window.plausible?.(event, { props })` —— **当前无任何 Plausible 脚本被加载**（全仓 `grep -i plausible` 除本文件外只命中 `docs/TODO.md:28`、`apps/beatscape/PRD.md:98/418/435`、`docs/BEATSCAPE-COMMERCIALIZATION-GAP.md:49/143` 与构建产物），故**实际零外发**，与第十六次「运行时外域只有 Google Fonts」一致；**但只要在 `index.html` 加一行脚本，23 类行为事件就会在零代码改动下开始向第三方发送**，而 `Legal.tsx:20` 的隐私文案只承诺「do not run third-party **ad** trackers on the play surface」（限定为「广告」追踪），**全文未提及事件埋点与可选的第三方分析转发** → 登记为 P0-3 签审确认项。⑥ **附带一条「有代码无测试」**：`analytics.ts` 是全仓唯一**零单测**的 `lib/` 模块（同目录 `firstShift.ts` / `progress.ts` 均有 `.test.ts`），且它恰好带第三方转发分支 → 与第十七次「测试存在 ≠ 覆盖了会变的地方」同类。⑦ 其余断言本轮实测**全部仍成立**：105 首 / 各季分布（s1 6·s2 4·s3 15·s4 15·s5 10·s6 35·p3 10·p4 10）/ 315 谱面 / `stream_app_url` 0-105 / `stream_audio` 105-105 / **`preview` 105-105（本地）** / 线上 catalog **105 首 · 315 谱面 · `stream_app_url` 0 · `preview` 仍 25** 且**曲目 ID 集合与本地完全一致**（only-online 0 / only-local 0）/ 线上 bundle 仍 `index-CDXE9BO-.js`（325,768 B；`scapemusic.pages.dev` 0 · `No account, no ads` 0 · `App link coming soon` 1 · `Signal lost` 1）/ `release.json` 与 `og.png` 与缺失路径同为 **2146 B**（仍 SPA 回落）/ `robots.txt` 133 B / `sitemap.xml` 911 B / 放行七字段全 null / 源码零 TODO-FIXME-XXX-HACK / 零 `@ts-ignore` / `any` 共 **5 命中**（3 处 `hitsounds.test.ts:6/69/73` 测试桩 + `routePreload.ts:7` 非测试新命中 + `Duo.tsx:271` 英文注释假阳性）/ `socialMetaTags` 已有测试（`pageMeta.test.ts:184`）、`copyImageBlob` 仍零单测 / **23 条文件链接 + 45 个内部锚点全 OK、MISS 0**（连续第八轮）/ 部署仍 **9 failure + 1 cancelled**、最后成功 `33895713222`（09-04）、**无新增 run** / `gh workflow list` 仍只返 6 条（连续第十三轮漏报 `agent-delivery-dispatch.yml`）/ `.git` 仍 1.9 GiB / 0 tag 0 release。
>
> **历史（2026-09-17 第二十三次）**：① **`rev-list` 仍是 `0 0`，但 HEAD 已不是上次刷新 commit —— 连续二十一轮「无新落地项」终结**。上次刷新 `67e8686`，本轮 HEAD `231bad5`，中间有 **10 个新落地 commit（全部在 2026-09-12 一天内）**：`24244a1` 首页即开局改版 + 视觉走查修复 + 谱面-音频匹配入库门禁 · `ba6fcfb` harness / 公司配置同步 · `ffa2927` 改版候选 `604cebd9` 重测 28 项性能预算全部通过 · `44f7efb` **补齐全曲库 `preview_48s`（25 → 105）并修复 Safari catalog 双取** · `5a2c0dd` worklog · `4b9557e` 移除误入库的 54 个 `preview_48s.wav` · `a8d4583` make-preview 中间 wav 改走系统临时目录 · `231bad5` 重编码 `bs-s1-01` 预览 → 已并入 [近期已完成](#近期已完成区分本地候选与已推送提交)。② **上一轮登记的「80 首 Preview 按钮实际播放全长 `audio.m4a`」残留已消除**：实测 `catalog.json` 的 `preview` 字段 **105/105**、磁盘**零缺失**（[专节](#曲库资产引用完整性盘点2026-09-11-第二十二次新增维度) 已按 as-built 更正）。**但线上 `catalog.json` 的 `preview` 仍只有 25/105** —— 本次补齐是**内容资产 + catalog 字段**改动，同样被 P0-6 卡住未部署，**不得据此宣称「线上 preview 已补齐」**；这也再次印证「线上内容 vs 线上代码」必须分开断言。③ **P0-6 的「连续 5 次 failure、截至 09-11 无新增 run」已过期**：09-12 一天内新增 **5 次 run**（**4 failure + 1 cancelled**），累计 **9 failure + 1 cancelled**；最近一次 `34675948678`（09-12T05:34:59Z）经 `gh run view --json jobs` 实测，**失败步仍是第 9 步 `Check launch sign-off`、第 10 步 `Publish to Cloudflare Pages` skipped**（wrangler 仍未执行），与既有结论一致。新增一条此前未记录的机制：workflow 有 `concurrency: cancel-in-progress: true`，09-12 那次 **cancelled** 是被 2 分钟后同分支的新 push 抢先取消，**不是管道恢复**。④ **部署债务 37 → 48**，其中触及 `apps/beatscape/**` 的 **6 → 11**（新增 `24244a1` / `ffa2927` / `44f7efb` / `4b9557e` / `231bad5`）；原先「`a136592` 之后**全是** docs-only」的表述**已失真**（33 个 commit 中有 5 个触及 beatscape），本轮按实测改写。⑤ **CI run 号连续第十五轮「写入即过期」**：main 最新 CI 实为 **`34675948677`**（success，09-12T05:34:59Z，对应 HEAD `231bad5`）；上一轮写的 `34559257629` 对应的是 `003e411`。⑥ **「非测试源码零 `any`」断言已被打破 1 处**：`apps/beatscape/src/routePreload.ts:7` `type LazyPageModule = { default: ComponentType<any> }`（**工作区未提交的新文件**，上一行有 `// eslint-disable-next-line @typescript-eslint/no-explicit-any` 并注明「路由组件 props 不同，故意放宽」）；`Duo.tsx` 的英文注释假阳性行号由 **114 → 271**。零 TODO/FIXME、零 `@ts-ignore` 仍成立。⑦ **`socialMetaTags` 已补上测试覆盖**（`pageMeta.test.ts:184`，该测试文件共 21 例）→ 上一轮「T1b / T5b 两处零测试覆盖」**只剩 `copyImageBlob` 一处仍零单测**（`Results.tsx:114/577/587`）。⑧ **新增「Git 历史与仓库体积健康度」维度**（前二十二轮从未查过 `.git` 本身）：`.git` **1.9 GiB** vs 受控工作区 **530.5 MiB**（1311 个文件）→ 历史是工作区的 **3.6 倍**；其中 **54 个 `preview_48s.wav`（合计 436.05 MiB）由 `44f7efb` 入库、`4b9557e` 删除，但删除不等于回收**，仍永久留在 main 历史里；另有 1 个 **09-01 遗留的 `tmp_pack_6ae4gx`（270.15 MiB）** 判为可回收垃圾 → 见 [专节](#git-历史与仓库体积健康度盘点2026-09-17-第二十三次新增维度)。
> **历史（2026-09-11 第二十二次）**：① **CI run 号连续第十四轮「写入即过期」，已更正**：main 最新 CI 实为 **`34559257629`**（success，09-11T03:39:22Z），`headSha` = `003e411ffe7c…` = 当前 HEAD；上一轮写的 `34493338937` 对应的是再上一个 commit `4553e36`（速览表与工作流表**两处**均已同步更正）；② **部署债务 36 → 37**（触及 `apps/beatscape/**` 的**仍为 6 个、名单不变**；`a136592` 之后的 docs-only 由 21 → **22**，增量仍全部来自本文件自身的刷新 commit）；③ **新增「曲库资产引用完整性」维度（详见 [专节](#曲库资产引用完整性盘点2026-09-11-第二十二次新增维度)）——前二十一轮只做过「磁盘 → 声明」这一个方向（第十四次发现的 trials/ 孤儿文件），从未做过反方向「声明 → 磁盘」**，两条结论：(a) **引用完整性 100% 干净，据此不生成待办**——105 首 × 4 类资产（`audio` / `cover` / `stream_audio` / `og`）**声明即存在、缺失 0**；315 张谱面**声明集合与磁盘集合完全相等**（declared-not-on-disk **0**、on-disk-not-declared **0**）、**315 份全部可解析**、**零音符谱面 0**，合计 **112,511** 个音符；三档难度**逐档单调递增无倒挂**（easy min 110 / 中位 214 / max 261；standard 181 / 359 / 457；hard 245 / 558 / 651）；(b) **`preview_48s.m4a` 只有 25/105 首有**（s1 6 · s2 4 · s3 15 全有；s4 / s5 / s6 / p3 / p4 **全无**）——**但这条必须先溯源再定性，否则会误记成「有文件忘了登记」**：`docs/BEATSCAPE-OPTIMIZATION-AUDIT.md:32 / 151 / 339` 显示这本来就是审计里的 **P1-2 项，且已结项**（「登记 15 个孤儿 `preview_48s.m4a` 进 catalog.json（10→25）」✅）；实测这 25 个文件共 **27.78 MiB**，与审计文档记载的 **27.8 MB** 吻合 → **剩下 80 首不是「有文件没登记」，而是从未生成过 preview 文件**；④ **本维度唯一值得登记的残留（候选、非缺陷、不认领）**：`preview` 是可选字段（`types/catalog.ts:26` `preview?: string`），两处用法都是 `track.preview ?? track.audio`（`Home.tsx:29`、`Track.tsx:83`）→ **80 首无 preview 的曲目，点 Track 页标签为「Preview」的按钮实际播放的是全长 `audio.m4a`（中位 3.80 MB、最大 3.93 MB），而不是 48s 预览（1.11 MB）；`Home.tsx:53` 的 `AudioBar` 是 `preload="none"`，故不影响首屏带宽，差异只在用户点播时发生** → 是否给 s4 及以后补生成 preview 是**产品 / 带宽权衡，不是 bug，仅登记**；⑤ **判读纪律（第十次印证「零 ≠ 该补」）**：本维度两个「零」——「零缺失 / 零孤儿谱面」是**干净**的；「80 首零 preview」**也不是缺陷**，依据是 `docs/BEATSCAPE-STAGE1-DUAL-ASSET.md:84` 把 `preview` 明列为**可选**字段，且审计项已按 25 首的范围结项。**若据此生成「补 80 个 preview」待办，等于把一个已结项的设计决策重新打开**；⑥ 其余断言本轮实测**全部仍成立且与上一轮一致、无变化**：曲库 105 首（s1 6/s2 4/s3 15/s4 15/s5 10/s6 35/p3 10/p4 10）、315 谱面、`stream_app_url` 0-105 / `stream_audio` 105-105、线上 catalog **105 首 / 315 谱面 / `stream_app_url` 0 / `preview` 25** 且**曲目 ID 集合与本地完全一致**（only-online 0 / only-local 0）、p4 谱面 **200**（19,241 B）、线上 bundle 仍 `index-CDXE9BO-.js`（325,768 B；`scapemusic.pages.dev` 0 / `No account, no ads` 0 / `App link coming soon` 1 / `Signal lost` 1）、`release.json` 与缺失路径同为 **2146 B**（仍 SPA 回落）、**`og.png` 仍 2146 B（仍不存在）**、`robots.txt` 133 B、`sitemap.xml` 911 B、放行七字段全 null、源码零 TODO/FIXME/XXX/HACK、零 `@ts-ignore`、非测试源码零 `any`（4 命中 = 3 处 `hitsounds.test.ts:6/69/73` 测试桩 + `Duo.tsx:114` 注释英文假阳性）、`socialMetaTags` 仍只命中 `pageMeta.ts:80/113`、`copyImageBlob` 仍只命中 `Results.tsx:72/242`（**两者仍零测试命中**）、**16 条文件链接 + 37 个内部锚点全 OK、MISS 为 0**（连续第七轮）、部署管道仍 5 连败、最后成功 `33895713222`（09-04）、**无新增 run**、`gh workflow list` **仍只返回 6 条**（连续第十二轮印证它漏报）。
>
> **历史（2026-09-11 第二十一次）**：① **CI run 号连续第十三轮「写入即过期」，已更正**：main 最新 CI 实为 **`34493338937`**（success，09-10T15:05:17Z），`headSha` = `4553e363275f…` = 当前 HEAD；上一轮写的 `34481257223` 对应的是再上一个 commit `5889955`（速览表与工作流表**两处**均已同步更正）；② **部署债务 35 → 36**（触及 `apps/beatscape/**` 的**仍为 6 个、名单不变**；`a136592` 之后的 docs-only 由 20 → **21**，增量仍全部来自本文件自身的刷新 commit）；③ **新增「运行时错误可观测性与崩溃兜底」维度（详见 [专节](#运行时错误可观测性与崩溃兜底盘点2026-09-11-第二十一次新增维度)）——前二十轮从未问过「线上崩了之后谁能知道」**，六条实测结论：(a) **BeatScape 有且仅有 1 个 ErrorBoundary，且已上线**（`components/ErrorBoundary.tsx` 包在 Router 外，fallback「Signal lost」；引入 commit `51489b3`（09-01 12:12）经 `git merge-base --is-ancestor` 确认**是最后成功部署 `ffe1ec0` 的祖先** → 线上 bundle 实测 `grep -c "Signal lost"` = **1**，兜底确实生效）→ **干净结论，不生成待办**；(b) **ScapeMusic / Demo / NeonBeat 零 ErrorBoundary**（`grep -rl` 全 0），ScapeMusic 线上 bundle `index-DwW6K_-S.js`（264,752 B）`Signal lost` **0 命中** → **ScapeMusic 任何渲染期异常即白屏、无兜底**；(c) **零全局错误兜底**：全仓 `window.onerror` / 窗口级 `addEventListener('error')` / `unhandledrejection` **0 命中**（唯一 1 处是 ScapeMusic `playerContext.tsx:292` 给 `<audio>` 元素挂的 error 监听）→ **渲染期之外的异步异常无人接管**；(d) **零错误上报**：与第十六次维度交叉印证——受控源码 17 个外部域名里**运行时真正发起请求的只有 Google Fonts**，**没有任何监控 / 上报端点**；全仓 `console.error` 仅 **1 处**（就是 ErrorBoundary 那一行），ScapeMusic 5 处 → **用户真机崩溃时没有任何一条错误信息能回到开发侧**；(e) **无 sourcemap**：三个 app 的 vite config **均未配 `sourcemap`**（默认 false），`dist/assets/*.map` **0 个**、git 受控 `.map` **0 个**、线上 `.map` 均返回 SPA 回落页（BeatScape 2146 B / ScapeMusic 1944 B）→ **一面干净（不泄露源码），一面也无任何生产可调试性**；(f) 45 个 catch 中**空 catch 为 0**（无静默吞异常）→ 这一条干净。④ **本维度最有价值的一条是 (d)+(e) 合成**：**已上线的 BeatScape / ScapeMusic 对真机错误是「全盲」的**——既无上报也无 sourcemap，唯一线索是用户手动打开 devtools 抄 console。**这直接影响 P0-4「英语叙事真人试玩」**：试玩中若发生崩溃，**没有任何取证手段**，只能依赖用户口述复现。已在 P0-4 登记为前置确认项。⑤ **判读纪律（第九次印证「零 ≠ 该补」）**：(a) 的「1 个 ErrorBoundary」与 (f) 的「0 个空 catch」是**干净**的，不生成待办；(b)(c)(e) 的「零」里，**只有 (d)+(e) 会改变「能否发现用户遇到的问题」**。另外 (b) 之所以值得登记而非忽略，依据是**本项目自己的判准**——`ErrorBoundary.tsx:9` 的 docstring 明确写着「改造前项目里一个错误边界都没有……用户看到的是一片纯白，连发生了什么都无从得知」，即**白屏无兜底已被本项目定义为不可接受**，故 ScapeMusic 的现状不是中性事实；⑥ 其余断言本轮实测**全部仍成立且与上一轮一致、无变化**：曲库 105 首（s1 6/s2 4/s3 15/s4 15/s5 10/s6 35/p3 10/p4 10）、315 谱面、`stream_app_url` 0-105 / `stream_audio` 105-105、线上 catalog **105 首 / 315 谱面 / `stream_app_url` 0** 且**曲目 ID 集合与本地完全一致**（only-online 0 / only-local 0）、p4 谱面 **200**（19,241 B）、线上 bundle 仍 `index-CDXE9BO-.js`（325,768 B；`scapemusic.pages.dev` 0 / `No account, no ads` 0 / `App link coming soon` 1）、`release.json` 与缺失路径同为 **2146 B**（仍 SPA 回落）、**`og.png` 仍 2146 B（仍不存在）**、放行七字段全 null、源码零 TODO/FIXME/XXX/HACK、零 `@ts-ignore`、非测试源码零 `any`（4 命中 = 3 处 `hitsounds.test.ts:6/69/73` 测试桩 + `Duo.tsx:114` 注释英文假阳性）、`socialMetaTags` 仍只命中 `pageMeta.ts:80/113`、`copyImageBlob` 仍只命中 `Results.tsx:72/242`（**两者仍零测试命中**）、**16 条文件链接 + 34 个内部锚点全 OK、MISS 为 0**（连续第六轮确认 `#bs-d001` 从来不是问题）、部署管道仍 5 连败、最后成功 `33895713222`（09-04）、**无新增 run**、`gh workflow list` **仍只返回 6 条**（连续第十一轮印证它漏报 `agent-delivery-dispatch.yml`）。
>
> **历史（2026-09-10 第二十次）**：① **CI run 号连续第十二轮「写入即过期」，已更正**：main 最新 CI 实为 **`34481257223`**（success，09-10T13:13:03Z），`headSha` = `5889955567…` = 当前 HEAD；上一轮写的 `34469117993` 对应的是再上一个 commit `c105e2d`（速览表与工作流表**两处**均已同步更正）；② **部署债务 34 → 35**（触及 `apps/beatscape/**` 的**仍为 6 个、名单不变**；`a136592` 之后的 docs-only 由 19 → **20**）；③ **新增「可访问性与社交预览资产」维度（详见 [专节](#可访问性与社交预览资产盘点2026-09-10-第二十次新增维度)）——本轮最有价值的是一条此前无人记录的、用户可见的症状**：**`og.png` 本地存在（1,200×630、39,195 B、已受控），线上却返回 2146 B 的 SPA 回落页**（与一个确定不存在的路径**字节数完全相同**）→ **所有社交分享预览（Reddit / X / Discord / Slack 抓取 `og:image` / `twitter:image`）当前拿到的都是一段 HTML 而不是图片**。已按纪律溯源：`git log -1 -- apps/beatscape/public/og.png` 显示它由 **`8b710a3`（2026-09-05 16:06 +0800）**引入，**比最后一次成功部署 `ffe1ec0`（09-05 00:31）晚约 15.5 小时** → **这是 P0-6 部署阻断的直接后果，不是「忘了上传」，不得记为独立缺陷**；④ **同源的第二条证据**：线上 `sitemap.xml`（**911 B**）与本地（**1,025 B**）**逐行 diff 只差一行**——线上缺 `<url><loc>https://beatscape.pages.dev/shift</loc>…</url>`；该文件最后由 `735208b`（09-05 21:51）修改，同样晚于最后成功部署 → **线上跑的是旧版 sitemap**（`robots.txt` 线上 133 B 与本地一致，部署前已存在，无差异）。**这两条把「线上落后」从「JS 代码」进一步精确到「静态资产」层面，且逐文件结论不同**——再次印证第八次「『线上内容落后』必须分文件断言，不能合成一句」；⑤ **a11y 基线实测为「干净」，据此不生成任何待办**：`apps/beatscape/src` 有 **87 处 `aria-`（39 `aria-label` · 33 `aria-hidden`）· 15 处 `role=` · 12 处 `:focus-visible`**；`styles.css` 有 **12 个 `@media (prefers-reduced-motion: reduce)` 块**（对应 49 `animation` / 28 `transition` / 19 `@keyframes`）；**38 个 `<button>` vs 48 处 `onClick`**；`index.html` 有**完整静态 meta**（description · canonical · og:type/title/description/url/image/image:alt · twitter:card/title/description/image）→ 不依赖 JS 注入。**唯一一处可点击非按钮元素**是 `Duo.tsx:326` 的 `<div className="duo-start" onClick=…>`（无 `role`、无 `tabIndex`）→ 键盘用户无法启动 Duo 模式，**登记为候选、本轮不改**（改源码超出「只提交 TODO.md」的范围，需单独提交）；⑥ 其余断言本轮实测**全部仍成立且与上一轮一致、无变化**：曲库 105 首（s1 6/s2 4/s3 15/s4 15/s5 10/s6 35/p3 10/p4 10）、315 谱面、`stream_app_url` 0-105 / `stream_audio` 105-105、线上 catalog **105 首 / 315 谱面 / `stream_app_url` 0** 且**曲目 ID 集合与本地完全一致**、p4 谱面 **200**、线上 bundle 仍 `index-CDXE9BO-.js`（325,768 B；`scapemusic.pages.dev` 0 / `No account, no ads` 0 / `App link coming soon` 1）、`release.json` 与缺失路径同为 **2146 B**、放行**七字段全 null**、源码零 TODO/FIXME、零 `@ts-ignore`、非测试源码零 `any`（4 命中 = 3 处 `hitsounds.test.ts:6/69/73` 测试桩 + `Duo.tsx:114` 注释英文假阳性）、**16 条文件链接 + 32 个内部锚点全部解析成功、MISS 为 0**、部署管道仍 5 连败、最后成功 `33895713222`（09-04）、**无新增 run**、`gh workflow list` **仍只返回 6 条**（连续第十一轮印证它漏报）。
>
> **历史（2026-09-10 第十九次）**：① **CI run 号连续第十一轮「写入即过期」，已更正**：main 最新 CI 实为 **`34469117993`**（success，09-10T11:01:42Z），`headSha` = `c105e2df0800…` = 当前 HEAD；上一轮写的 `34457550792` 对应的是再上一个 commit `0d4151b`（速览表与工作流表**两处**均已同步更正）；② **部署债务 33 → 34**（`git rev-list --count ffe1ec0..HEAD`；触及 `apps/beatscape/**` 的**仍为 6 个、名单不变**，增量仍全部来自本文件自身的刷新 commit；`a136592` 之后的 docs-only 由 18 → **19**）；③ **新增「依赖与运行环境」维度（详见 [专节](#依赖与运行环境清单盘点2026-09-10-第十九次新增维度)）——前十八轮只查过「代码里写了什么」，从未查过「声明的依赖与实际的引用是否对得上」**，四条结论：(a) **Node 侧完全干净：6 个包零「幽灵依赖」**（import 了却没声明，pnpm 严格链接下这类问题本就会立刻炸），实测确为 0；而所谓「声明了却从未 import」的 9 项**全部**是 `@types/*` / `typescript` / `tsx` / `prisma`，经 tsconfig 与 CLI **隐式**使用 → **据此不生成任何清理待办**（第八次印证「零 ≠ 该补 / 清单 ≠ 该清」）；(b) **Python 侧是三分的**：`tests/` 有 `tests/requirements.txt`、`workers/ace-step` 与 `workers/sa3` 各有一份，而 **`scripts/`（全仓 82 个受控 `.py` 中的绝大多数）需要 17 个第三方包**（`torch` / `diffusers` / `transformers` / `accelerate` / `PIL` / `peft` / `datasets` / `torchvision` / `wandb` / `xformers` / `bitsandbytes` / `mlx` / `mlx_lm` / `acestep` …）**却没有任何 requirements 文件**；(c) **但这不是 CI 阻塞——本维度最反直觉的一条**：7 条工作流的 yml 里 `grep "pip install\|requirements.txt"` **零命中**，Python 依赖的安装发生在 `scripts/harness.sh:34-40` 的 `ensure_py_env`（自建 `tests/.venv` 并装 `tests/` + `workers/ace-step` 两份），**只服务 unit / integration / e2e 三个 tier**；而 CI 的 `beatscape` job **不经过 harness.sh**，是 `setup-python@v5` 后直接 `python3` 跑三个脚本 → 实测这三个脚本（`beatscape-audit.py` / `beatscape-catalog-status.py` / `beatscape-earcheck.py`）**100% 标准库**，`scripts/` 未声明依赖的缺口**完全落在 CI 之外**；(d) 由此得到一条**此前无人记录、且极易踩的隐藏约束**：**那 3 个脚本必须永远保持纯标准库**——一旦有人给 `beatscape-audit.py` 加上 `import numpy`，**本地（开发机装有 torch/numpy）照常通过，CI 的 beatscape job 却会直接红**，而现有流程没有任何环节会提前拦住它；④ **顺带查实两条次要事实**：`mlx` / `mlx_lm` / `acestep` **仅出现在 `scripts/mac-ace-verify.py`** → 内容生产链的这一环**绑定 Apple Silicon**；`workers/sa3/requirements.txt` **从未被任何自动化安装**（harness 只装 ace-step 那份），但两者**逐行相同**（fastapi / uvicorn / numpy 同版本）→ 无实际缺口，**仅留档、不生成待办**；⑤ 其余断言本轮实测**全部仍成立且与上一轮一致、无变化**：曲库 105 首（s1 6/s2 4/s3 15/s4 15/s5 10/s6 35/p3 10/p4 10）、315 谱面、`stream_app_url` 0-105 / `stream_audio` 105-105、线上 catalog **105 首 / 315 谱面 / `stream_app_url` 0** 且**曲目 ID 集合与本地完全一致**、p4 谱面 **200**、线上 bundle 仍 `index-CDXE9BO-.js`（325,768 B；`scapemusic.pages.dev` 0 / `No account, no ads` 0 / `App link coming soon` 1 / `127.0.0.1:5175` 0）、`release.json` 与缺失路径同为 **2146 B**（仍 SPA 回落）、放行七字段全 null、源码零 TODO/FIXME、零 `@ts-ignore`、非测试源码零 `any`（4 命中 = 3 处 `hitsounds.test.ts:6/69/73` 测试桩 + `Duo.tsx:114` 注释英文假阳性）、`socialMetaTags` 仍只命中 `pageMeta.ts:80/113`、`copyImageBlob` 仍只命中 `Results.tsx:72/242`（**两者仍零测试命中**）、**16 条文件链接 + 30 个内部锚点全部解析成功、MISS 为 0**（`#bs-d001` 经查确在 `docs/BEATSCAPE-DECISIONS.md:5`，连续第五轮确认不是问题）、部署管道仍 5 连败、最后成功 `33895713222`（09-04）、**无新增 run**、`gh workflow list` **仍只返回 6 条**（连续第十轮印证它漏报）。
>
> **历史（2026-09-10 第十八次）**：① **CI run 号连续第十轮「写入即过期」，已更正**：main 最新 CI 实为 **`34457550792`**（success，09-10T08:52:45Z），`headSha` 核对为 `0d4151b6311d…` = 当前 HEAD；上一轮写的 `34446200971` 对应的是再上一个 commit `9eeee79`。**该值已连续十轮证明不可跨轮沿用，每轮开头必须复查**（速览表与工作流表**两处**均已同步更正）；② **部署债务 32 → 33**（`git rev-list --count ffe1ec0..HEAD`；触及 `apps/beatscape/**` 的**仍为 6 个、名单不变**，增量仍全部来自本文件自身的刷新 commit；`a136592` 之后的 docs-only 数由 17 → **18**）；③ **新增「i18n / 文案清单」维度（详见 [专节](#i18n-与文案清单盘点2026-09-10-第十八次新增维度)），首次盘点多语言接线度**，四条结论：(a) **40 个文案 key 中只有 10 个真被接线**（`t.ui.*`），15 个页面里只有 **Home / Track** 两个走 i18n（外加组件 `TrackAudioPreview`）；(b) **`leaderboard` 命名空间（9 个 key）零调用点、却有 2 个单测** —— `Leaderboard.tsx` 根本没 import i18n，属**「有测试无调用方」**，与第十三次「有测试但没在 CI 跑」是同一族的假安全感；(c) **`zh` locale 运行时不可达**：3 个 `getMessages()` 调用点**全部不传参** → 恒为 `DEFAULT_LOCALE = "en"`；全仓**无 locale 切换入口**（`Settings.tsx` 无语言项）、**无** `navigator.language` 探测、两个 `index.html` 均硬编码 `<html lang="en">` → **40 key × 2 locale 的维护成本与 2 个 shape-parity 测试，保护的是一个没有任何代码路径能到达的分支**；(d) `zh.ts` 有 **7 个值仍是英文**（其中 `leaderboard.title` / `subtitle` 是整句未翻译），但 **shape-parity 测试只比对 key 形状、不比对值** → CI 全绿；④ **判读：不生成「补中文 / 补翻译」待办** —— 英文是对外发布语言（P0-4 英语叙事试玩）、`<html lang="en">` 硬编码、`zh.ts:3` docstring 自述「阶段一用 zh 做第二语言占位；完整 UI 翻译在后续里程碑补齐」→ **现状是有意设计，不是缺陷**。本维度真正的价值是**揭示「支持中文」的真实成本**：不是「翻 7 句英文」，而是「先把 13 个页面的硬编码文案抽进 i18n，再补切换入口」，量级差一个数量级；⑤ 其余断言本轮实测**全部仍成立且与上一轮一致、无变化**：曲库 105 首（s1 6/s2 4/s3 15/s4 15/s5 10/s6 35/p3 10/p4 10）、315 谱面、`stream_app_url` 0-105 / `stream_audio` 105-105、线上 catalog **105 首 / 315 谱面 / `stream_app_url` 0** 且**曲目 ID 集合与本地完全一致**、p4 谱面 **200**、线上 bundle 仍 `index-CDXE9BO-.js`、`release.json` 与缺失路径同为 **2146 B**（仍 SPA 回落）、放行七字段全 null、源码零 TODO/FIXME、零 `@ts-ignore`、非测试源码零 `any`（4 命中 = 3 处 `hitsounds.test.ts:6/69/73` 测试桩 + `Duo.tsx:114` 注释英文假阳性）、`socialMetaTags` 仍只命中 `pageMeta.ts:80/113`、`copyImageBlob` 仍只命中 `Results.tsx:72/242`（**两者仍零测试命中**）、**23 条文件链接 + 26 个内部锚点全 OK、MISS 为 0**（连续第四轮）、部署管道仍 5 连败、最后成功 `33895713222`（09-04）、**无新增 run**、`gh workflow list` **仍只返回 6 条**（连续第九轮印证它漏报磁盘上的 7 个 yml）。
>
> **历史（2026-09-10 第十七次）**：① **CI run 号连续第九轮「写入即过期」，已更正**：main 最新 CI 实为 **`34446200971`**（success，09-10T06:39:37Z），`headSha` 核对为 `9eeee798a5d3…` = 当前 HEAD；上一轮写的 `34437400256` 对应的是再上一个 commit `7817d5d`。**该值已连续九轮证明不可跨轮沿用，每轮开头必须复查**（速览表与工作流表**两处**均已同步更正）；② **部署债务 31 → 32**（`git rev-list --count ffe1ec0..HEAD`；触及 `apps/beatscape/**` 的**仍为 6 个、名单不变**，增量仍全部来自本文件自身的刷新 commit；`a136592` 之后的 docs-only 数由 16 → **17**）；③ **新增「Cloudflare Pages 路由与缓存配置」维度（详见 [专节](#cloudflare-pages-路由与缓存配置盘点2026-09-10-第十七次新增维度)），首次查 BeatScape / ScapeMusic / Demo 三个 app 的 `_redirects` / `_headers` / `wrangler.toml`**，五条结论：(a) BeatScape 的 `_redirects` 是 `/*    /index.html   200`（SPA 回落规则）——这就是 `/release.json` 返回 2146 B SPA HTML 的**机制**；(b) **`release.json` 是 `release.mjs:113` 生成的构建产物**，本地 `dist/release.json` 实存 **61,500 B**，线上却返回 2146 B 回落页 → **直接证明生成它的那次构建从未部署**（比此前用「bundle 缺某字符串」更干净——不需要先验证字符串引入时间）；(c) **`_headers` 在 `8b710a3`（09-05 16:06 +0800）修改，晚于最后成功部署 `ffe1ec0`（09-05 00:31 +0800）** → 线上 cache-control 是旧版本：线上 `catalog.json` 返回 `max-age=300`（与 `ffe1ec0` 版 `_headers` 一致），当前仓库 `_headers` 已改为 `max-age=0`；线上 `/catalog/*` 为 `max-age=2592000`（30 天），当前已改为 `max-age=0` → **部署债务不只影响 JS 代码，还影响缓存策略**；(d) **ScapeMusic 零 CF Pages 配置文件**（无 `_redirects` / `_headers` / `wrangler.toml`），完全依赖 Cloudflare 默认 SPA 回落 → 既无缓存头也无安全头，是上一轮「trials/ 5 个 m4a 能上线」成因的又一佐证；(e) 仅 BeatScape 有 `wrangler.toml`（极简 4 行），Demo 门户的完整 CSP 在 `dist-portal/_headers`（构建产物目录，非源控）；④ 其余断言本轮实测**全部仍成立且与上一轮一致、无变化**：曲库 105 首（s1 6/s2 4/s3 15/s4 15/s5 10/s6 35/p3 10/p4 10）、315 谱面、`stream_app_url` 0-105 / `stream_audio` 105-105、线上 catalog **105 首 / 315 谱面 / `stream_app_url` 0 且曲目 ID 集合与本地完全一致**、p4 谱面 **200**、线上 bundle 仍 `index-CDXE9BO-.js`（325,768 B；`scapemusic.pages.dev` 0 / `No account, no ads` 0 / `App link coming soon` 1 / `127.0.0.1:5175` 0）、`release.json` 与缺失路径同为 **2146 B**（仍 SPA 回落）、放行七字段全 null、源码零 TODO/FIXME、零 `@ts-ignore`、非测试源码零 `any`（4 命中 = 3 处 `hitsounds.test.ts:6/69/73` 测试桩 + `Duo.tsx:114` 注释英文假阳性）、T1b·T5b 零测试命中、**23 条文件链接 + 22 个内部锚点全 OK、MISS 为 0**（连续第三轮确认）、部署管道仍 5 连败、最后成功 `33895713222`（09-04）、**无新增 run**、`gh workflow list` **仍只返回 6 条**（连续第八轮印证它漏报 `agent-delivery-dispatch.yml`）。
>
> **历史（2026-09-10 第十六次）**：① **CI run 号连续第八轮「写入即过期」，已更正**：main 最新 CI 实为 **`34437400256`**（success，09-10T04:29:49Z），`gh run list --json headSha` 核对为 `7817d5d2f54d…` = 当前 HEAD；上一轮写的 `34428724668` 对应的是再上一个 commit `89c5cd6`。**该值已连续八轮证明不可跨轮沿用，每轮开头必须复查**（速览表与工作流表**两处**均已同步更正）；② **部署债务 29 → 31**（`git rev-list --count ffe1ec0..HEAD`；触及 `apps/beatscape/**` 的**仍为 6 个、名单不变**，增量仍全部来自本文件自身的刷新 commit；`a136592` 之后的 docs-only 数由 14 → **16**）；③ **新增「运行时外部依赖与字体供应链」维度（详见 [专节](#运行时外部依赖与字体供应链盘点2026-09-10-第十六次新增维度)），首次枚举「受控源码里哪些外部域名会在用户浏览器运行时真正发起请求」**，核心发现：**BeatScape / ScapeMusic / NeonBeat 三个 app 的三款字体（Anton 展示体 · Sora · IBM Plex Sans）100% 取自 Google Fonts CDN，仓库零本地字体文件**（`git ls-files` 无 `woff2`/`otf`/`ttf`）。已做非阻塞加载（`preload`→`onload` 切 `rel` + `noscript` 兜底）**不会卡首屏，但失败是静默的**——`styles.css` 有 10+ 处把 Anton 写作首选展示字体，CDN 不可达时静默回退 `system-ui`，**无任何报错、无任何监控**；④ **同维度顺带核对的四条「干净」结论（均为本轮实测，非沿用旧值）**：受控文件**零** `node_modules`/`dist` 类误提交、**零** `.env`（非 `.example`）曾进入 git 历史、**零** 私钥 / `sk-` / `ghp_` / `AKIA` 型凭据字面量、8 个构建产物目录**全部**被 gitignore 覆盖；另查得 `apps/beatscape/public/_headers` **没有 CSP**（只有缓存头 + `nosniff` + `referrer-policy`），因此**当前与 Google Fonts 不冲突**——但 `apps/demo` 门户的 CSP 是 `font-src 'self'` + `style-src 'self' 'unsafe-inline'`，**将来若把门户那套 CSP 复用到 BeatScape/ScapeMusic，字体会被完整阻断且同样静默**；⑤ 其余断言本轮实测**全部仍成立且与上一轮一致、无变化**：曲库 105 首（s1 6/s2 4/s3 15/s4 15/s5 10/s6 35/p3 10/p4 10）、315 谱面、`stream_app_url` 0-105 / `stream_audio` 105-105、线上 catalog **105 首 / 315 谱面 / `stream_app_url` 0 且曲目 ID 集合与本地完全一致**、p4 谱面 **200**、线上 bundle 仍 `index-CDXE9BO-.js`（325,768 B；`scapemusic.pages.dev` 0 / `No account, no ads` 0 / `App link coming soon` 1 / `127.0.0.1:5175` 0）、`release.json` 与缺失路径同为 **2146 B**（仍 SPA 回落）、放行七字段全 null、源码零 TODO/FIXME、零 `@ts-ignore`、非测试源码零 `any`（4 命中 = 3 处 `hitsounds.test.ts:6/69/73` 测试桩 + `Duo.tsx:114` 注释英文假阳性）、T1b·T5b 零测试命中、**23 条文件链接 + 22 个内部锚点全 OK、MISS 为 0**（连续第二轮确认 `#bs-d001` 从来不是问题）、部署管道仍 5 连败、最后成功 `33895713222`（09-04）、**无新增 run**、`gh workflow list` **仍只返回 6 条**（连续第七轮印证它漏报 `agent-delivery-dispatch.yml`）。
>
> **历史（2026-09-10 第十五次）**：① **CI run 号连续第七轮「写入即过期」，已更正**：main 最新 CI 实为 **`34428724668`**（success，09-10T02:15:24Z），`headSha` = `89c5cd6fc643…` = 当前 HEAD；上一轮写的 `34419589870` 对应的是再上一个 commit `119d50a`。**该值已连续七轮证明不可跨轮沿用，每轮开头必须复查**（速览表与工作流表**两处**均已同步更正）；② **部署债务 28 → 29**（`git rev-list --count ffe1ec0..HEAD`；触及 `apps/beatscape/**` 的**仍为 6 个、名单不变**，增量仍全部来自本文件自身的刷新 commit）；③ **新增「构建期环境变量与部署路径」维度（详见 [专节](#构建期环境变量与部署路径盘点2026-09-10-第十五次新增维度)），首次枚举全部构建期变量引用点并逐个反查注入方**，三条结论：(a) 3 个自定义 `VITE_*` 中 **`VITE_GAME_URL` 只在部署脚本注入、`VITE_API_BASE` 全仓零注入**（后者只被本阶段明确不做的 NeonBeat 引用 → 不认领）；(b) **`VITE_STREAM_APP_URL` 的 hash 路由修正被硬编码成「域名字符串精确等于 `https://scapemusic.pages.dev`」**（`streamLink.ts:10`）——实测 ScapeMusic 确为自研 hash 路由（`App.tsx` 全为 `#/` `#/library` …），且**路径式深链 `scapemusic.pages.dev/track/bs-s1-01` 返回 200 / 1944 B，与确定缺失路径字节数完全相同 = 命中 SPA 回落**，故该修正**必要但脆弱**：换任何域名即静默失效，而现有 2 个单测**恰好只测了这个字面域名**，换域名后仍全绿；(c) **ScapeMusic 完全没有 CI/CD 工作流**（`grep -rn "scapemusic" .github/workflows/` **0 命中**），部署只靠 `scripts/deploy-scapemusic-cf-pages.sh`，而该脚本**全仓只在 `SESSION.md:68` 与 `worklog/2026-09-05.md:59` 被提到过** → **这正好解释了上一轮暴露面发现的成因**：`public/trials/` 下 5 个 m4a 能上线不是一次意外，而是「ScapeMusic 没有管道、任何丢进 `public/` 的文件都会在下一次手动部署时直接对外」的必然结果；④ **修正一条连续六轮重复的错误结论**：此前每轮都写「链接自检唯一 MISS 是 `#bs-d001` 锚点假阳性」，实测**是自检脚本本身没对 `#` 切分**，把带锚点的文件链接整串当路径判不存在。本轮脚本改为按 `#` 切分后再判 → **23 条文件链接 + 17 个内部锚点全部存在，MISS 为 0**，`#bs-d001` 从来不是问题；⑤ 其余断言本轮实测**全部仍成立且与上一轮一致、无变化**：曲库 105 首（s1 6/s2 4/s3 15/s4 15/s5 10/s6 35/p3 10/p4 10）、315 谱面、`stream_app_url` 0-105 / `stream_audio` 105-105、线上 catalog **105 首 / 315 谱面 / `stream_app_url` 0 且曲目 ID 集合与本地完全一致**、p4 谱面 **200**、线上 bundle 仍 `index-CDXE9BO-.js`（325,768 B；`scapemusic.pages.dev` 0 / `No account, no ads` 0 / `App link coming soon` 1 / `127.0.0.1:5175` 0）、`release.json` 与缺失路径同为 **2146 B**（仍 SPA 回落）、放行七字段全 null、源码零 TODO/FIXME、零 `@ts-ignore`、非测试源码零 `any`（4 命中 = 3 处 `hitsounds.test.ts:6/69/73` 测试桩 + `Duo.tsx:114` 注释英文假阳性）、T1b·T5b 仍零测试命中、部署管道仍 5 连败、最后成功 `33895713222`（09-04）、**无新增 run**、`gh workflow list` **仍只返回 6 条**（连续第六轮印证它漏报，磁盘实为 7 个）。
>
> 整理日期：2026-09-18（**第二十四次刷新**；实测 `origin/main` 与本地 **0/0** 同步，HEAD `231bad5` **与第二十三次刷新时相同** → **本轮无新落地 commit**，为**校验型刷新 + 纠错**；新增维度：**「本地数据持久化与隐私声明一致性」盘点**）｜ 来源：[SESSION.md](SESSION.md) · [docs/BEATSCAPE-DECISIONS.md](docs/BEATSCAPE-DECISIONS.md) · [审计报告 §6](docs/COMPANY-PROJECT-HARNESS-AUDIT-2026-09-06.md)
>
> 整理日期：2026-09-17（**第二十三次刷新**；实测 `origin/main` 与本地 **0/0** 同步，但 HEAD `231bad5` **不再是**上一轮刷新 commit `67e8686` → **有 10 个新落地 commit，终结连续二十一轮「无新落地项」**，本轮为**新落地型刷新 + 校验型复核**；新增维度：**「Git 历史与仓库体积健康度」盘点**）
>
> 整理日期：2026-09-11（**第二十二次刷新**；实测 `origin/main` 与本地 **0/0** 同步，HEAD `003e411` 即上一轮 TODO 刷新，本轮 `git log --stat` 与 `worklog/` 均无新完成项 → **连续第二十一轮无新落地项**，仍是**校验型刷新**——本轮新增维度：**「曲库资产引用完整性」盘点**（反方向「声明 → 磁盘」实测 **100% 干净**：105×4 类资产零缺失、315 谱面零孤儿零空谱；`preview` 仅 25/105，经溯源属**已结项的设计范围**而非遗漏 → 仅登记不认领），并**连续第十四轮抓到 CI run 号过期**、**更正部署债务 36 → 37**）｜ 来源：[SESSION.md](SESSION.md) · [docs/BEATSCAPE-DECISIONS.md](docs/BEATSCAPE-DECISIONS.md) · [审计报告 §6](docs/COMPANY-PROJECT-HARNESS-AUDIT-2026-09-06.md)
> **上一轮（2026-09-10 第十四次）**：① **CI run 号连续第六轮「写入即过期」，已更正**：main 最新 CI 实为 **`34419589870`**（success，09-10T00:03:18Z），`headSha` 核对为 `119d50a73d…` = 当前 HEAD；上一轮写的 `34409481296` 对应的是再上一个 commit `a29bc04`。**该值已连续六轮证明不可跨轮沿用，每轮开头必须复查**；② **部署债务 27 → 28**（触及 `apps/beatscape/**` 的**仍为 6 个、名单不变**，增量仍全部来自本文件自身的刷新 commit）；③ **新增「受控二进制资产与公开资产暴露面」维度（详见 [专节](#受控二进制资产与公开资产暴露面盘点2026-09-10-第十四次新增维度)），并挖到本轮最有价值的一条**：`apps/scapemusic/public/trials/` 下 **5 个 m4a（共 27.81 MiB）未被任何源码或 catalog 引用，却已随 ScapeMusic 部署上线、`https://scapemusic.pages.dev/trials/*.m4a` 全部返回 200 可公开下载**。其中 `demo-b1/b2/b3` 命名像生成变体，属疑似实验残留。**与 P0-1 的关系（本条真正的价值）**：P0-1 耳检范围是 catalog 里的 **105 首**，而这 5 个文件**不在任何 catalog 中**（`grep -c "demo-" catalog.json` = 0），因此**从未进入耳检范围，却已可从生产域名下载**——P0-1 的目的是「确认无第三方名曲衍生风险」，这是一个此前没人看到的覆盖缺口。**本文件不判断这 5 个文件是否有风险（未听过），只登记为待确认项**；④ **顺带摸清仓库体积结构**：受控文件 **1209 个 / 440.1 MiB**，其中 `.m4a` 占 **410.9 MiB（93.4%）**；`git lfs` 已安装但**未使用**（无 `.gitattributes`、`git lfs ls-files` 为空），所有二进制直接进 git → `.git` 目录 **1.4 G**。另查明 `apps/scapemusic/public/catalog` 是指向 `../../beatscape/public/catalog` 的**符号链接**（ScapeMusic 复用 BeatScape 音频，非重复资产）；⑤ 其余断言本轮实测**全部仍成立且与上一轮一致、无变化**：曲库 105 首（s1 6/s2 4/s3 15/s4 15/s5 10/s6 35/p3 10/p4 10）、315 谱面、`stream_app_url` 0-105 / `stream_audio` 105-105、线上 catalog **105 首 / 315 谱面 / `stream_app_url` 0 且曲目 ID 集合与本地完全一致**、p4 谱面 **200**、线上 bundle 仍 `index-CDXE9BO-.js`（325,768 B；`scapemusic.pages.dev` 0 / `No account, no ads` 0 / `App link coming soon` 1）、`release.json` 与缺失路径同为 **2146 B**（仍 SPA 回落）、放行七字段全 null、源码零 TODO/FIXME、零 `@ts-ignore`、非测试源码零 `any`（4 命中 = 3 处 `hitsounds.test.ts:6/69/73` 测试桩 + `Duo.tsx:114` 注释英文假阳性）、T1b·T5b 零测试命中、17 条文档链接 + 7 个内部锚点全 OK（唯一 MISS 仍是 `#bs-d001` 锚点假阳性）、部署管道仍 5 连败、最后成功 `33895713222`（09-04）、**无新增 run**、`gh workflow list` **仍只返回 6 条**（连续第五轮印证它漏报）。
>
> **历史（2026-09-10 第十三次）**：① **CI run 号连续第五轮「写入即过期」，已更正**：main 最新 CI 实为 **`34409481296`**（success，09-09T21:54:54Z），`gh run view --json headSha` 核对为 `a29bc0427f…` = 当前 HEAD；上一轮写的 `34397187366` 对应的是再上一个 commit `80351d5`。**该值已连续五轮证明不可跨轮沿用**；② **部署债务 26 → 27**（触及 `apps/beatscape/**` 的**仍为 6 个、名单不变**，增量仍全部来自本文件自身的刷新 commit，不是功能积压）；③ **新增「测试覆盖盲区」维度（详见 [专节](#测试覆盖盲区盘点2026-09-10-第十三次新增维度)），并挖到本轮最有价值的一条**：**Playwright e2e 不在 CI 工作流里，只在部署管道里跑** —— `ci.yml` 的 beatscape job 只有 `pnpm --filter @musicsaas/beatscape test`（= `vitest run`）+ 2 个 python 脚本，**没有 playwright**；4 个 e2e spec 只在部署工作流 "Verify release candidate"（`pnpm release:beatscape` → `release:check` → `test:e2e`）中执行，该工作流才会 `playwright install --with-deps chromium`。**后果：e2e 自 2026-09-06（最后一次部署 run `34064117995`）起未在 GitHub 上跑过**；同期主 CI 已跑 **13 次、全部 success**，但**没有一次包含浏览器回归** → 本文件与 SESSION 里反复出现的「CI 绿」**覆盖范围比字面窄**；④ **15 个页面中有 4 个既无单测、也无任何 e2e 触及**：`Calibration` / `FirstShift` / `Legal` / `NotFound`（在 `apps/beatscape/e2e/` 全目录 grep 0 命中）；⑤ **判读纪律（与「孤儿 ≠ 该删」「未勾 ≠ 没做」同源）：零单测 ≠ 未覆盖**——`pages/` 15 个文件虽零单测，但由 e2e 覆盖，因此**拒绝生成「补 39 个单测」这种条目**，只登记「是否把 e2e 接入 CI」一条候选（代价是 CI 时长 + 装 chromium，属用户判断）；⑥ 其余断言本轮实测**全部仍成立且与上一轮一致、无变化**：曲库 105 首（s1 6/s2 4/s3 15/s4 15/s5 10/s6 35/p3 10/p4 10）、315 谱面、`stream_app_url` 0-105 / `stream_audio` 105-105、线上 catalog **105 首 / 315 谱面 / `stream_app_url` 0**、p4 谱面 **200**、线上 bundle 仍 `index-CDXE9BO-.js`、`release.json` 与缺失路径同为 **2146 B**（仍 SPA 回落）、放行七字段全 null、源码零 TODO/FIXME、零 `@ts-ignore`、非测试源码零 `any`（4 命中 = 3 处 `hitsounds.test.ts:6/69/73` 测试桩 + `Duo.tsx:114` 注释英文假阳性）、T1b·T5b 零测试命中、17 条文档链接全 OK（唯一 MISS 仍是 `#bs-d001` 锚点假阳性）、部署管道仍 5 连败、最后成功 `33895713222`（09-04）、**无新增 run**、`gh workflow list` **仍只返回 6 条**（连续第四轮印证它漏报）。
>
> **历史（2026-09-10 第十二次）**：① **CI run 号连续第四轮「写入即过期」，已更正**：main 最新 CI 实为 **`34397187366`**（success，09-09T19:47:51Z），`gh run view --json headSha` 核对为 `80351d5b…` = 当前 HEAD；本文件里写的 `34384329456` 对应的是再上一个 commit `5c9e9a7`。**该值已连续四轮证明不可跨轮沿用；本轮还发现它同时污染了正文与速览表两处（见 ②）**；② **部署债务 25 → 26，并修正速览表残留**：`git rev-list --count ffe1ec0..HEAD` 实测 **26**；触及 `apps/beatscape/**` 的**仍为 6 个、名单不变**。**同时发现上一轮只改了正文没改速览表——速览仍写着 23** → 同一数字在文件两处互相矛盾，本轮一并统一为 26；③ **新增「散落待办清单」维度（详见 [专节](#散落待办清单盘点2026-09-10-第十二次新增维度)）**：本文件自称「待办唯一入口」，实测仓库内**另有 5 个受控文件在承载未勾选项，共 91 个未勾复选框**（不含本文件自身的 8 个与 `SESSION.md` 的 8 个）。其中 `.delivery/beatscape/backlog.md` 是本文件**从未提及过**的一处，含 **1 条仍未关闭的 TICKET-B05**（Reddit 启动页 CTA 文案）。**但判读结论是「不该批量回填」**：未勾最多的 `docs/RESONANCE-VISUAL-PLAN.md`（26 个）经实测其描述的「霓虹 → 漫画硬边」改造**已基本落地**（Anton 15 命中 / `halftone` 10 命中 / `--glow-accent: none`），**是计划文档的勾选态与事实脱节，不是真有 26 件事没做**；④ **因此只登记 1 条真实候选**：`docs/_visual-baseline/` 视觉回归截图基线目录**确认不存在**（`RESONANCE-VISUAL-PLAN.md:247` 要求建立），属小而明确、**未被本文件任何条目覆盖**的缺口，登记为候选、不认领、不列阻塞项；⑤ 其余断言本轮实测**全部仍成立且与上一轮一致、无变化**：曲库 105 首（s1 6/s2 4/s3 15/s4 15/s5 10/s6 35/p3 10/p4 10）、315 谱面、`stream_app_url` 0-105 / `stream_audio` 105-105、线上 catalog **105 首 / 315 谱面 / `stream_app_url` 0** 且 ID 集合与本地一致、p4 谱面 **200**、线上 bundle 仍 `index-CDXE9BO-.js`、`release.json` 与缺失路径同为 **2146 B**（仍 SPA 回落）、放行七字段全 null、源码零 TODO/FIXME、零 `@ts-ignore`、非测试源码零 `any`（4 命中 = 3 处 `hitsounds.test.ts:6/69/73` 测试桩 + `Duo.tsx:114` 注释英文假阳性）、T1b·T5b 零测试命中、17 条文档链接全 OK（唯一 MISS 仍是 `#bs-d001` 锚点假阳性）、部署管道仍 5 连败、最后成功 `33895713222`（09-04）、无新增 run、`gh workflow list` **仍只返回 6 条**（连续第三轮印证它漏报）。
>
> **历史（2026-09-10 第十次）**：① **更正过期的 CI run 号**（连续第二轮命中同类问题）：main 最新 CI 实为 **`34340240726`**（success，09-09T10:26:44Z），经 `gh run view --json headSha` 核对为 **`b882307`**（= 当前 HEAD）；上一轮写的 `34310382154` 对应的是再上一个 commit `696431b`。**这类「会随时间变化的值」每轮开头必须复查**；② **推翻上一轮「仓库共 6 条工作流」——实为 7 条**：`.github/workflows/` 磁盘上有 **7 个** yml 文件，但 `gh workflow list`（即使加 `--limit 50`）**只返回 6 条**，漏掉的是 `agent-delivery-dispatch.yml`；实测该文件**确有 7 次 run** → `gh workflow list` 会漏报，**可靠盘点手法是枚举磁盘文件而非信任 `gh workflow list`**；③ **该第 7 条工作流的 7 次 failure 是「设计如此」，不是坏掉的门禁**：`agent-delivery-dispatch.yml` 只有 `workflow_dispatch` 触发，唯一 job 以 `exit 1` 结束并打印「工程派单已迁移到指定执行主机的 Codex CLI / 本工作流未领取任何 issue、未启动任何实现」的路标文案 → **不得当成故障去修，也不计入阻塞项**；④ **新增「版本与分支」盘点**：**0 个 git tag、0 个 GitHub Release**（`git tag | wc -l` = 0、`gh release list` 为空）→ **没有任何版本化发布物，部署完全靠 main 持续部署**；对 P0-3 的意义是**签审没有 tag/release 可锚定，只能锚 commit SHA**；本地 **32** 个分支 / 远程 **11** 个，其中 **6 个已合并到 main**（含大量 `agent/musicsaas/*` 历史分支）；⑤ **复核 API contract gate**：文件 `on:` 块确认为 `pull_request`（4 条 paths，**含 workflow 自身**）+ `workflow_dispatch`，**确无 push 触发**，与上一轮一致；它为何会出现 `event: push` 的 run **仍未查清，继续标注「不臆断、不作阻塞项」**；⑥ 其余断言本轮实测**全部仍成立且与上一轮一致、无变化**：线上 bundle 仍 `index-CDXE9BO-.js`（325,768 B，`scapemusic.pages.dev` / `No account, no ads` 均 0 命中、`App link coming soon` 1 命中）、线上 catalog **105 首 / 315 谱面 / `stream_app_url` 0-105 且曲目 ID 集合与本地完全一致**、p4 谱面 **200**、`release.json` 与缺失路径同为 2146 B（仍 SPA 回落）、放行七字段全 null、源码零 TODO-FIXME、零 `@ts-ignore`、非测试源码零 `any`（4 命中中 3 处已知测试桩 + 1 处 `Duo.tsx:114` 注释假阳性）、T1b·T5b 零测试命中、文档链接完整（唯一 MISS 仍是 `#bs-d001` 锚点假阳性）；部署管道仍 5 连败、最后成功 `33895713222`（09-04）、**无新增 run**。
>
> **历史（2026-09-09 第九次）**：① **更正过期的 CI run 号**：main 最新 CI 实为 **`34310382154`**（success，对应 HEAD `696431b`，09-09T04:17:19Z），上一轮写的 `34242405531` 已过期——原因是该 run 在上一轮 TODO 提交的同一时刻才刚触发、尚未出结果，本轮补齐；② **部署债务首次量化**：自最后一次成功部署 head `ffe1ec0`（09-04）起**累计 23 个 commit 未部署**，其中**触及 `apps/beatscape/**` 的共 6 个**（`8b710a3` / `735208b` / `134115a` / `6418d3f` / `e3ba64f` / `a136592`），正好对应全部 5 次失败 run（`8b710a3` 与 `735208b` 同批推送共用一个 run）→ **每个触及 BeatScape 代码的 commit 都确实触发并失败了，不存在「漏触发」**，说明 `paths` 过滤工作正常，问题 100% 在门禁；③ **澄清上一轮的时区表述**：最后一次部署 run `34064117995`（09-06T22:28:24Z）**正是由 `a136592` 触发的**（该 commit 本地时间 09-07 06:28 +0800 = 22:28Z），所以「09-07 之后没有新 run」的准确说法是「`a136592` 之后的 **8 个 commit 全是 docs-only**，不命中 `paths` 过滤」，而非「09-07 之后的提交都没触发」；④ **P1-6 新增可操作结论**：`on.push.paths` 同时包含 `apps/beatscape/**`（覆盖 `apps/beatscape/scripts/launch-check.mjs`）**与** `.github/workflows/deploy-beatscape-cloudflare.yml` → **按方案 2 改门禁的那个提交会自动触发重新部署，无需再补一个「空提交」去 kick**，这是此前各轮都没确认的关键一环；⑤ **新增「全仓工作流」维度**（见 [专节](#全仓工作流盘点2026-09-09-新增维度)）：仓库共 **6 条**工作流，此前只跟踪 2 条；其中 **Portal release check 最后一次是 success**（`33970422632`，09-05），与 P0-5 门户发布直接相关；⑥ 其余断言本轮实测**全部仍成立且与上一轮一致、无变化**：线上 bundle 仍 `index-CDXE9BO-.js`、线上 catalog **105 首 / 315 谱面 / `stream_app_url` 0-105**、p4 谱面 **200**、`release.json` 仍 2146 B 回落页（与缺失路径同字节）、放行七字段全 null、源码零 TODO-FIXME、零 `@ts-ignore`、非测试源码零 `any`、T1b·T5b 零测试命中、文档链接完整（唯一 MISS 仍是 `#bs-d001` 锚点假阳性）。
>
> **历史（2026-09-09 第八次）**：① **线上「内容」其实是当前版本，落后的只有「JS 代码」**（推翻此前「线上整体落后」的笼统表述）：实测 `https://beatscape.pages.dev/catalog.json`（115,172 B，真 JSON）为 **105 首 / 315 谱面 / `stream_app_url` 0-105**，曲目 ID 集合与本地**完全一致**；`/catalog/bs-p4-01/easy.json`（19,241 B）与 `/catalog/bs-p4-10/hard.json`（51,507 B）均返回 **200** → p4 内容确实在线上。成因已查明：p4 进入 catalog 的 `f9d8c8f`（2026-09-04T16:31:54Z）经 `git merge-base --is-ancestor` 确认是最后一次成功部署 head `ffe1ec0` 的**祖先**，两者仅相隔 **35 秒**（部署 run `33895713222` 于 16:32:29Z）→ 线上内容本就落在部署窗口内；② **代码侧确实陈旧**：线上 bundle 仍为 `index-CDXE9BO-.js`（325,768 B），其中 `No account, no ads`（`a136592`，09-07）**0 命中**、`scapemusic.pages.dev`（`8b710a3`，09-05）**0 命中**，且二者引入时间**均晚于** 09-04 部署 → 与「代码落后」一致（本轮已按上一轮教训逐一核对引入时间，避免「缺字符串即证据」的误判）；③ **`/release.json` 线上确实不存在**：返回 2146 B 的 `text/html`，与一个确定不存在的路径 `/definitely-not-here-xyz` **字节数完全相同** → 是 SPA 回落页而非真文件（上一轮因网络中断只能沿用旧值，本轮实测确认）；④ **部署管道无新变化**：仍为 5 连败，最后一次成功 `33895713222`（09-04），**截至 09-09 无新增 run**（最新一条仍是 09-06 的 `34064117995`）；⑤ main 最新 CI 更新为 **`34242405531`**（success，对应 `38c0243`）；GitHub **无未关闭 PR、无未关闭 Issue**（本轮新增盘点）；⑥ 其余断言（105 首 / 各季分布 / 315 谱面 / `stream_app_url` 0-105 / 放行七字段全 null / 源码零 TODO-FIXME / 零 `@ts-ignore` / 非测试源码零 `any` / T1b·T5b 仍无单测 / 文档链接完整）本轮实测**全部仍成立**；链接自检唯一 MISS 仍是 `#bs-d001` 锚点假阳性。
>
> **更早（2026-09-08 第七次，已归档、仅备查）**：① **溯源到部署门禁的引入点**——`git log -S` 实测：workflow 的 "Check launch sign-off" 步骤与 `launch-check.mjs` 的 `deviceTestRecord` 必需项，是**同一个 commit `8b710a3`**（2026-09-05 16:06 +0800，"chore: audit agent guidance and release workflow"）**一次性**加进去的；它与 `735208b`（09-05 21:51）同批推送，触发了**首个失败 run `33970422633`**（09-05T13:58:22Z），而此前 `33895713222`(09-04) / `33895023150` / `33817015569` **全部 success** → 部署受阻**不是渐进退化，而是门禁上线当天一次性造成**；② **排除第四条路径**——读 workflow 全文确认 `workflow_dispatch` 在 main 上**照样跑 `launch:check`**（"Check launch sign-off" 与 "Publish to Cloudflare Pages" **共用**条件 `github.event_name != 'pull_request' && github.ref == 'refs/heads/main'`），非 main 分支派发或 PR 事件则两个步骤**一起跳过**（含发布）→ **不存在任何「只跳门禁、保留发布」的路径**，P1-6 的三选一仍待用户拍板；③ main 最新 CI 更新为 **`34207150512`**（对应 `778e2be`）；④ **本轮线上核对未能执行**：`beatscape.pages.dev` / `scapemusic.pages.dev` / `api.github.com` 经代理与直连**均 SSL 握手失败**（本地网络中断），P0-6 / P1-3 的线上断言**沿用上一轮 09-08 实测、未重新取证**；⑤ 其余断言（105 首 / 各季分布 / 315 谱面 / `stream_app_url` 0-105 / 放行七字段全 null / 源码零 TODO-FIXME / 零 `@ts-ignore` / 非测试源码零 `any` / T1b·T5b 仍无单测 / 文档链接完整）本轮实测**全部仍成立**；链接自检唯一 MISS 是 `#bs-d001` 锚点，经查位于 `docs/BEATSCAPE-DECISIONS.md:5`，属假阳性。
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
| CI / 部署管道 | **CI 绿**（main 最新**已完成** run 为 **`35528074175`** success，09-20T18:08:06Z，`headSha` = **`3cc2770`** = HEAD；**2026-09-22 第二十八次更正**：上一轮写入的 `35459105488`（对应 `760ac23`）**已过期并已更正**，此为**连续第十八轮**命中「写入即过期」）· **Deploy BeatScape 累计 9 failure + 1 cancelled**（**2026-09-20 已重新取证**：最后一次 run 仍为 `34675948678`（09-12T05:34Z），**09-12 之后无新增 run**），全部卡在 `launch:check`（门禁由 `8b710a3` 于 09-05 一次性引入）。**09-12 一天内新增 5 次 run**（`34662323856` / `34667824455` / `34671971307`cancelled / `34671988856` / `34675948678`），最近一次仍失败在第 9 步 `Check launch sign-off`、第 10 步 `Publish` skipped → 见 P0-6 / P1-6 |
| **部署债务** | 自最后一次成功部署 `ffe1ec0`（09-04）起 **52 个 commit 未部署**，其中触及 `apps/beatscape/**` 的 **11 个**（每个都触发并失败，无「漏触发」）→ 见 [全仓工作流盘点](#全仓工作流盘点2026-09-09-新增维度)（**2026-09-22 第二十八次：51 → 52，触及 `apps/beatscape/**` 的仍 11 个、名单不变**，增量仍是本文件刷新 commit；**2026-09-21 第二十七次：50 → 51，增量仍是本文件刷新 commit；另实测 `231bad5..HEAD` 仅 3 个 commit 且触及 `apps/beatscape/**` 的为 0 → 解释了「债务在涨但 09-12 后无新增 run」**：部署 workflow 的 `on.push.paths` 过滤掉了纯文档 commit，属**未触发**而非**漏触发**）；（**2026-09-20 第二十六次：49 → 50，增量仍是本文件刷新 commit**；2026-09-17 第二十三次：37 → 48、触及代码的 6 → **11**，增量**首次不是**文档刷新，而是 5 个真实代码 / 资产 commit） |
| **曲库资产引用完整性** 🆕 | **声明 → 磁盘方向 100% 干净、不生成待办**：105 首 × 4 类资产（`audio` / `cover` / `stream_audio` / `og`）**零缺失**；315 谱面**声明集合 = 磁盘集合**（双向差集均 0）、**全部可解析**、**零音符谱面 0**，合计 **112,511** 音符条目（**判定对象数另为 143,066**，见 [第二十八次新增维度](#曲库元数据与实测资产一致性盘点2026-09-22-第二十八次新增维度)），三档难度**单调递增无倒挂**。**2026-09-17 更正：`preview` 已 105/105**（`44f7efb` 补齐全曲库并修复 Safari catalog 双取，磁盘零缺失）→ 上一轮登记的「80 首 Preview 按钮实际播放全长 `audio.m4a`」残留**已消除**；**但线上 `catalog.json` 的 `preview` 仍只有 25/105**（该改动未部署），不得据此说线上已补齐 → 见 [专节](#曲库资产引用完整性盘点2026-09-11-第二十二次新增维度) |
| **错误可观测性与崩溃兜底** 🆕 | BeatScape **1 个 ErrorBoundary 且已上线**（线上 bundle 实测含 `Signal lost`）· **ScapeMusic / Demo / NeonBeat 零兜底**（ScapeMusic 线上 bundle `Signal lost` 0 命中 → 渲染异常即白屏）· **零全局错误接管**（`window.onerror`/`unhandledrejection` 0）· **零错误上报**（运行时外域只有 Google Fonts）· **零 sourcemap**（3 个 app 均未配置）→ **已上线产品对真机错误全盲，直接影响 P0-4 试玩取证**；45 个 catch 中**空 catch 0**（干净）→ 见 [专节](#运行时错误可观测性与崩溃兜底盘点2026-09-11-第二十一次新增维度) |
| **可访问性与社交预览** 🆕 | **a11y 基线干净、不生成待办**：87 处 `aria-` / 15 `role=` / 12 `:focus-visible` / **12 个 `prefers-reduced-motion` 媒体查询** / 38 `<button>` vs 48 `onClick` / `index.html` 完整静态 meta。**但 `og.png` 线上返回 SPA 回落页 → 社交分享预览全线失效**（该图由 `8b710a3` 引入、晚于最后成功部署 15.5h，属 P0-6 后果）；线上 `sitemap.xml` 亦缺 `/shift` 一行 → 见 [专节](#可访问性与社交预览资产盘点2026-09-10-第二十次新增维度) |
| **依赖与运行环境** 🆕 | Node 侧 **6 个包零幽灵依赖**（「声明未 import」的 9 项全是 `@types/*`/`typescript`/`tsx`/`prisma` 工具链，非真闲置）；Python 侧 **`scripts/`（内容生产链）需 17 个第三方包却无 requirements**，但 **CI 实际执行的 3 个脚本是纯标准库 → 不阻塞**；`mlx`/`acestep` 仅 `scripts/mac-ace-verify.py` → 绑定 Apple Silicon → 见 [专节](#依赖与运行环境清单盘点2026-09-10-第十九次新增维度) |
| **i18n / 文案** 🆕 | 共 **40 个**文案 key（en/zh 双份），但**只有 10 个真被接线**；15 个页面里**仅 Home / Track** 走 i18n。**`zh` locale 运行时不可达**（3 个 `getMessages()` 全不传参 → 恒 `en`，无切换入口、无 `navigator.language` 探测、`<html lang="en">` 硬编码）；`leaderboard` 命名空间 9 个 key **零调用点却有 2 个单测** → 见 [专节](#i18n-与文案清单盘点2026-09-10-第十八次新增维度) |
| **运行时外部依赖** | **BeatScape 已收口（2026-09-13）**：Anton / Sora / IBM Plex Sans / IBM Plex Mono 共 12 个 Latin/Latin Extended WOFF2 自托管，运行时 Google 字体请求 0，OFL 随包，真实离线可用，且满足 `font-src 'self'`。ScapeMusic / NeonBeat 仍依赖 Google Fonts 并静默回退；不得把 BeatScape 的结项外推 → 见 [专节](#运行时外部依赖与字体供应链盘点2026-09-10-第十六次新增维度) |
| **CF Pages 路由与缓存** 🆕 | BeatScape 有 `_redirects` `/* /index.html 200`（SPA 回落）；`release.json` 是构建产物（本地 `dist/` 61,500 B，线上返回 2146 B 回落页 → 从未部署）；`_headers` 在 `8b710a3`（09-05 16:06）修改晚于最后成功部署 `ffe1ec0`（09-05 00:31）→ **线上 cache-control 是旧版本**（`catalog.json` `max-age=300` vs 当前 `max-age=0`）；ScapeMusic **零** CF 配置文件（无 `_redirects` / `_headers` / `wrangler.toml`）→ 见 [专节](#cloudflare-pages-路由与缓存配置盘点2026-09-10-第十七次新增维度) |
| **构建期环境变量** 🆕 | 全仓 3 个自定义 `VITE_*`：`VITE_STREAM_APP_URL` 仅 `build:cf` 注入（已知）· **`VITE_GAME_URL` 仅部署脚本注入、`pnpm build` 会产出 `127.0.0.1:5175` 死链** · **`VITE_API_BASE` 全仓零注入**（仅 NeonBeat，本阶段不做）。**另：hash 路由修正硬编码为单一域名**，**全仓 11 个源文件写死生产域名**(5 处静默 / 3 处护栏) · **ScapeMusic 完全无 CI/CD 工作流** → 见 [专节](#构建期环境变量与部署路径盘点2026-09-10-第十五次新增维度) |
| **公开资产暴露面** 🆕 | `apps/scapemusic/public/trials/` **5 个 m4a / 27.81 MiB 未被任何源码或 catalog 引用，却已上线可公开下载**（`scapemusic.pages.dev/trials/*.m4a` 全 200）→ **不在 P0-1 耳检的 105 首范围内**，见 [专节](#受控二进制资产与公开资产暴露面盘点2026-09-10-第十四次新增维度) |
| **测试覆盖** 🆕 | `apps/beatscape/src` **81 源码 / 25 单测**；**6 个目录零单测**（`pages/` 15 · `components/` 16 · `data/` 2 · `types/` 2 · `constants/` 1 · 根 3）→ 但由 `e2e/` 4 个 Playwright spec 部分覆盖。**⚠️ e2e 不在 CI 里，只在部署管道跑 → 自 09-06 起未在 GitHub 执行过**（**2026-09-19 第二十五次补强：根 `pnpm test:e2e` 也跑不到 BeatScape** —— 它走 `scripts/harness.sh e2e`，实测只跑 Gateway + Demo；补跑必须 `pnpm --filter @musicsaas/beatscape test:e2e`，见 [命令与脚本入口盘点](#命令与脚本入口盘点2026-09-19-第二十五次新增维度)）；同期 13 次 CI 全绿但均无浏览器回归；15 个页面中 **4 个**（Calibration / FirstShift / Legal / NotFound）**两种测试都未触及** → 见 [测试覆盖盲区盘点](#测试覆盖盲区盘点2026-09-10-第十三次新增维度) |
| **命令与脚本入口** 🆕 | 6 个 `package.json` 共 **56 个脚本**；**同名命令跨层异义**——根 `pnpm test` / `pnpm test:e2e` 都走 `scripts/harness.sh`，实测 **只跑 Gateway + Demo、不含 BeatScape**（补跑 BeatScape e2e 必须 `--filter @musicsaas/beatscape test:e2e`）· **15 个脚本全仓零提及**（多为一次性生产命令；`test:prd` 实测已被 `vitest run` 覆盖 → **不生成清理待办**）· 文档 4 处裸 `npm run` 缺 `cd apps/beatscape` 前提（仅登记）→ 见 [专节](#命令与脚本入口盘点2026-09-19-第二十五次新增维度) |
| GitHub 未决项 | **0 个未关闭 PR · 6 个未关闭 Issue**（#34–#39，`[TICKET-B06]`~`B11`，均 2026-09-09 创建、`agent-safe`）。**但经对账：6 个 Issue 要求的工作在代码里已全部完成且已有测试**（`Library.tsx:66` / `Calibration.tsx:47` / `Settings.tsx:94` / `NotFound.tsx:5` / `Home.tsx:35` 均已 `usePageMeta`；`pageMeta.test.ts:105/122/134/146/173` + `buildPlayPageMeta` 无 seo block 边界 `59/68`）→ **属「做完没回来关」的僵尸条目，不是待办**；按纪律**不自行 close**（外部动作需授权）→ 见 P5（2026-09-18 第二十四次更正：上一版「无未关闭 Issue」是错的） |
| **仓库治理与安全配置** 🆕 | **`launch:check` 是当前唯一的生产护栏** —— GitHub 侧**无分支保护**（私有仓库 + Free 计划，API 返回 `Upgrade to GitHub Pro or make this repository public`）· **Dependabot alerts 关闭**（403）· **`security_and_analysis` = null**（无 secret scanning / push protection）；`deploy-beatscape-cloudflare.yml` **无 `environment:`、无人工审批**（全仓仅 `deploy-neonbeat.yml:51` 有 `environment:`）；本地 `.github/` 除 7 个 workflow 外**只有 1 个 ISSUE_TEMPLATE**，**无 CODEOWNERS / 无 `dependabot.yml` / 无 PR 模板**。→ **P1-6 若选方案 2 放宽门禁，等于让 main 上任何触及 `apps/beatscape/**` 的 push 在零审批下自动发布到生产** → 见 [专节](#仓库治理与安全配置盘点2026-09-20-第二十六次新增维度) |
| **未入库资产（git index 覆盖）** 🆕 | **1190 个未跟踪文件**（**此前每轮写的「10 项未跟踪」是目录级计数，实际是文件数**）。三类：① **`catalog.json` 声明的 105 张单曲 `og.png` 全部在磁盘、未被 gitignore 忽略、但从未入库**，而生成脚本 `scripts/beatscape-generate-og.py`（`generate:og`）**不在 `build` / `build:cf` / `release:check` / 任何 workflow 里** → **即使 P0-6 部署门禁解锁，CI 从 git checkout 构建仍不会带上这 105 张图**（实测线上 `catalog/bs-p3-01/og.png` 返回 2146 B 回落页，而同目录 `cover.svg` 正常 8148 B）；② **907 个 Playwright 产物**因目录改名为 `test-results-*` 绕过了 `.gitignore:61` 的**精确名**规则 `apps/beatscape/test-results/`；③ **81 个未入库 `.ts/.tsx` 源码**（并行会话在制品，按纪律不碰）。→ 见 [专节](#未入库资产盘点2026-09-21-第二十七次新增维度) |
| **曲库元数据与实测资产一致性** 🆕 | **全维度干净、据此不生成待办**（2026-09-22 第二十八次实测）：`duration_sec` / `stream_duration_sec` 与 `audio.m4a`·`stream.m4a` 实测**零偏差**；105 个 `preview` **全部恰好 48.0s**；catalog `bpm` 与谱面 `bpm`·`beat_map.detected_bpm` **最大偏差 0.5、中位 0.00**；315 张谱面**末音符均不超出音频时长**、覆盖率 **93.2%–99.2%**；50 个 `slide` 音符**全部落在 5 首 `allows_slide: true` 的曲目内**；`total_notes` 按 PRD §4.4 判定规则 **315/315 一致**（112,511 条目 / **143,066** 判定对象）→ 见 [专节](#曲库元数据与实测资产一致性盘点2026-09-22-第二十八次新增维度) |
| 仓库工作流 | **共 7 条**（2026-09-10 更正：上一轮写 6 条是错的，`gh workflow list` 漏报了 `agent-delivery-dispatch.yml`；2026-09-17 复核：`gh workflow list` **仍只返 6 条、连续第十三轮漏报**；**2026-09-20 第二十六次复核：仍只返 6 条 → 连续第十四轮漏报**）：CI success · Deploy BeatScape **9 failure + 1 cancelled** · **Portal release check success** · Deploy NeonBeat failure · API contract gate 存疑 · Agent delivery gate 仅 PR · **Agent delivery dispatch 7 连败但属设计如此** → 见 [专节](#全仓工作流盘点2026-09-09-新增维度) |
| 版本与分支 | **0 个 git tag · 0 个 GitHub Release**（无版本化发布物，部署靠 main 持续部署）· 本地 **32** 分支 / 远程 **11**，其中 6 个已合并到 main（2026-09-10 新增维度）→ 见 [版本与分支盘点](#版本与分支盘点2026-09-10-新增维度) |
| 孤儿资产 🆕 | `scripts/` **92 个脚本中 22 个（24%）**未被任何受控文件按名引用；`docs/` **49 个 md 中 1 个孤儿**（2026-09-10 第十一次新增维度）→ 见 [孤儿资产盘点](#孤儿资产盘点2026-09-10-第十一次新增维度) |
| 代码质量 | `strict: true` · 零 `@ts-ignore`/`@ts-expect-error` · **零 TODO/FIXME/XXX/HACK 标记**（2026-09-21 第二十七次复查：`git ls-files` 过滤出 `apps/*/src|e2e|scripts` 共 **252 个受控源码文件**，命中 0）· **`any` 命中数（2026-09-21 第二十七次按口径重述）**：**受控源码 4 处** = 3 处测试桩（`audio/hitsounds.test.ts:6/69/73`，伪造 `OfflineAudioContext`）+ 1 处注释假阳性（`pages/Duo.tsx:310` 英文 "any pause action"，行号持续漂移：114 → 271 → 307 → **310**）；**工作区另有 1 处**未入库的 `src/routePreload.ts:7` `ComponentType<any>`（带 `eslint-disable` + 说明，故意放宽）→ 合并口径仍是 **5 处**，但**按「受控 / 未入库」分开记，避免把并行会话的未提交文件算进仓库断言** |
| **本地数据持久化与隐私** 🆕 | **对外承诺实测成立、不生成待办**：BeatScape **19 个 `bs_*`** + ScapeMusic **3 个 `sm_*`** 存储 key；**零 IndexedDB / 零 cookie / 零 `sendBeacon`**，非测试源码 `fetch` 仅 3 处且**全部同源** → 「Scores stay on your device」为真。**唯一登记的残留是惰性外发面**：`lib/analytics.ts` 定义 **23 类事件**（9 个文件真调用，缓冲 `bs_analytics` cap 120），内嵌 **Plausible 转发钩子**（`analytics.ts:38-39`）——当前**无脚本加载、实际零外发**，但**加一行脚本即在零代码改动下开始向第三方发送行为事件**；`Legal.tsx:20` 只承诺不做第三方「广告」追踪，**未提及埋点与可选转发** → 登记为 P0-3 签审确认项。另 `analytics.ts` 是唯一**零单测**的 `lib/` 模块 → 见 [专节](#本地数据持久化与隐私声明一致性盘点2026-09-18-第二十四次新增维度) |
| 判定反馈 | T3 结算页误差条已随 `a136592` 推送（未部署）；对局内早/晚即时提示仍待做 |
| 性能 | 第二轮已随 `e3ba64f` 提交：`ae15d3778b3f` 同指纹 28 项固定预算全部通过；最慢冷开局 3.908s、8 场整局 0 异常间隔、绘制峰值最高 3.5ms；未部署 |
| 阻塞发布 | 耳检 105 首 · 差异化盲测 / 英语叙事试玩 · **线上产物与 `main` 不同步（P0-6）** · 最终签审；真机执行取消与门禁冲突保持记录 |

---

## 全仓工作流盘点（2026-09-09 新增维度）

> 此前各轮只跟踪 CI 与 Deploy BeatScape 两条；2026-09-09 第九次用 `gh workflow list` 盘点为「6 条」，**2026-09-10 第十次更正为实为 7 条**（见下方「⚠️ 更正」）。**结论：除 BeatScape 部署外，其余工作流均不构成当前阻塞。**

| 工作流 | 触发方式 | 最新 run | 结论 | 备注 |
|---|---|---|---|---|
| **CI** | push main | **`34675948677`**（09-12T05:34Z） | ✅ success | 对应 HEAD **`231bad5`**（2026-09-17 第二十三次更正，**连续第十五轮**「写入即过期」）。**CI 绿 ≠ 部署成功**，这是两条独立工作流。**另注（第十三次新增）：该 CI 不跑 e2e**，见 [测试覆盖盲区盘点](#测试覆盖盲区盘点2026-09-10-第十三次新增维度) |
| **Deploy BeatScape (Cloudflare Pages)** | push main（6 条 `paths`） | `34675948678`（09-12T05:34Z） | ❌ failure | **9 failure + 1 cancelled**（09-12 新增 5 次 run），全部卡在第 9 步 `Check launch sign-off`、第 10 步 `Publish` 被 skip → 见 P0-6 / P1-6 |
| **Portal release check** | push main | `33970422632`（09-05T13:58Z） | ✅ success | 与 **P0-5 门户发布**直接相关：**门户门禁本身是通的**，门户不是被门禁卡住的一方 |
| **Deploy NeonBeat** | push main（`apps/neonbeat/**`） | `33524238082`（09-01T15:11Z） | ❌ failure | `apps/neonbeat` 存在，但 NeonBeat 本阶段**明确不做**（见「已取消」）→ 不认领、不修 |
| **API contract gate** | `pull_request` + `workflow_dispatch` | `33934368984`（09-05T00:52Z） | ❌ failure | **成因未确认，不作为阻塞项**：run 的 `jobs` 为空、耗时 0s；文件 `on:` 块**只有** `pull_request` 与 `workflow_dispatch`（`git log -S "  push:"` 显示 push 触发**从未存在过**），却记录了 `event: push` 的 run；且其 `paths` 含 `api/**`，而**该目录在仓库中不存在** → 该门禁在 main 上实际休眠。**不臆断成因，等有 PR 触及 `apps/gateway/**` 时再观察。** |
| **Agent delivery gate** | `pull_request` + `pull_request_review` + `workflow_dispatch` | `33259937514`（08-29） | ✅ success | 只在 PR 上运行，与 main 部署无关 |
| **Agent delivery dispatch (local Codex)** 🆕 | 仅 `workflow_dispatch` | `33226074914`（08-29） | ❌ failure ×7 | **2026-09-10 第十次新增，且是「设计如此」不是故障**：唯一 job 以 `exit 1` 结束，打印「工程派单已迁移到指定执行主机的 Codex CLI…本工作流未领取任何 issue、未启动任何实现」→ **是一条路标 / 防误用护栏，不要当成坏门禁去修，也不计入阻塞项** |

### ⚠️ 更正（2026-09-10 第十次）：仓库是 7 条工作流，不是 6 条

- **上一轮结论「共 6 条」是错的**，错因是**只信了 `gh workflow list`**。实测：
  - `.github/workflows/` 磁盘上共 **7 个** yml 文件：`agent-delivery-dispatch.yml` / `agent-delivery-gate.yml` / `api-contract-gate.yml` / `ci.yml` / `deploy-beatscape-cloudflare.yml` / `deploy-neonbeat.yml` / `portal-check.yml`；
  - `gh workflow list` **即使加 `--limit 50` 也只返回 6 行**，缺的就是 `agent-delivery-dispatch.yml`；
  - 但 `gh run list --workflow=agent-delivery-dispatch.yml --limit 200` **返回 7 条 run** → 该文件确实存在且被 GitHub 注册过，**是 `gh workflow list` 漏报，不是文件废弃**。
- **可复用手法（下轮必守）**：盘点工作流要**枚举 `.github/workflows/*.yml` 磁盘文件**，再对每个文件名跑 `gh run list --workflow=<文件名>`；**不要把 `gh workflow list` 的输出当作全集**。判断某条是否被废弃，用「有没有 run」而不是「在不在 list 里」。
- **另补一条判读规则**：看到 `failure` 先读 job 的最后几行再下结论。`agent-delivery-dispatch.yml` 的 7 次 failure **全部是主动 `exit 1` 的路标**，若只看结论列会误判成「又一个坏掉的门禁」，进而产生一个根本不存在的待办。

- **可复用手法**：`gh workflow list` 列出全部工作流 → 逐条 `gh run list --workflow="<名称>" --limit 2` 看结论与最后时间 → `gh run view <id> --json conclusion,event,jobs` 判断是否真有 job 跑过（`jobs: []` + 0s = 空跑失败，不要当成真实的门禁失败去排查）。

### 部署债务（2026-09-09 量化）

- **52 个 commit 未部署**（`git rev-list --count ffe1ec0..HEAD`，**2026-09-22 第二十八次实测**；2026-09-21 为 51、2026-09-20 为 50、2026-09-19 为 49、2026-09-17 为 48、2026-09-11 为 37），起点是最后一次成功部署 head `ffe1ec0`（本地时间 09-05 00:31:54 +0800 = 09-04T16:31:54Z）。**触及 `apps/beatscape/**` 的仍为 11 个、名单未变** → 增量全部来自本文件自身的刷新 commit，**不是功能积压**。
- 其中**触及 `apps/beatscape/**` 的有 11 个**：`8b710a3` → `735208b` → `134115a` → `6418d3f` → `e3ba64f` → `a136592`（以上 6 个为旧名单）**+ 2026-09-12 新增 5 个**：`24244a1` → `ffa2927` → `44f7efb` → `4b9557e` → `231bad5`。**本轮是连续二十二轮里第一次「债务增量不是文档刷新，而是真实代码 / 资产 commit」。**
- **因此「每个改了 BeatScape 代码的 commit 都触发并失败了」，`paths` 过滤工作正常，问题 100% 在 `launch:check` 门禁**，不存在「提交没触发部署」这种情况。
- **`a136592` 之后的 commit 共 37 个**（`git rev-list --count a136592..HEAD`，**2026-09-22 第二十八次实测**；2026-09-21 为 36、2026-09-20 为 35、上一轮为 33），其中 **5 个触及 `apps/beatscape/**`**（即上面新增的 5 个）、30 个不命中 `paths`（TODO 刷新 / worklog / 记忆日志 / harness 配置）。→ **修正上一轮「`a136592` 之后**全是** docs-only」的表述**：该说法在 09-12 之前成立，09-12 之后已失真，**本文件此前据此写下的「无新 run 属预期、不代表管道恢复」也随之作废**——现在真的有新 run，且全部失败。
- **新记一条机制（2026-09-17）**：该 workflow 有 `concurrency: group: beatscape-cloudflare-pages-${{ github.ref }}` + **`cancel-in-progress: true`** → 09-12 的 `34671971307` 之所以是 **cancelled**，是因为 2 分钟后同分支又推了一个 commit 把它抢先取消。**看到 cancelled 不等于管道有变化，要先看是不是被后续 push 顶掉。**
- **注意（2026-09-10 第十二次）**：债务 23 → 25 → **26**，**增量全部是本文件自身的刷新 commit**，不是新代码堆积——触及代码的仍是那 6 个。**解读债务数字时必须同时看「总数」与「其中触及代码的个数」，否则会把「文档刷新」误读成「功能积压」。**
- **同一数字在本文件里出现过三个版本（23 / 25 / 26）**：上一轮改了正文（→25）却漏了速览（仍 23），本轮实测 26 并**同时改正文与速览**。**教训：任何一个会变的数字，在本文件里往往有多处出现，改动时必须全局搜一遍该数字再统一**（本轮用 `grep -n "部署债务\|个 commit 未部署" TODO.md` 一次性定位三处）。

---

## 版本与分支盘点（2026-09-10 新增维度）

> 前九轮从未查过版本与分支。本轮用 `git tag`、`gh release list`、`git branch -a` 实测，**结论本身不构成待办，但改变了对 P0-3 签审方式的理解**。

| 项 | 实测值 | 含义 |
|---|---|---|
| git tag | **0 个**（`git tag \| wc -l` = 0） | 从未打过版本标签 |
| GitHub Release | **0 个**（`gh release list` 为空） | 从未发过 Release |
| 本地分支 | **32** 个（含 `* main`） | 大量 `agent/musicsaas/*` 历史分支留存 |
| 远程分支 | **11** 个（含 `origin/HEAD -> origin/main`） | 含一条备份分支 `origin/backup/pre-filter-repo-2026-09-01` |
| 已合并到 main 的本地分支 | **6** 个（`git branch --merged main`） | 其余 26 个未合并，多为历史实验分支 |

- **对 P0-3 的实质影响（本轮最有价值的一条）**：仓库**没有任何版本化发布物**——既无 tag 也无 Release，线上跑的就是 main 上某个 commit 的构建产物。因此**「正式上线放行」没有 tag/release 可以锚定，只能锚定 commit SHA**。填写 `launch-signoff.json` 的 `artifactSha256` 时，必须同时记录**对应的 commit SHA**，否则「已签审的产物」将无法追溯到底是哪份代码。建议在 P0-3 动作里补上「记录签审所对应 commit SHA」这一步。
- **不建议现在做**：清理 26 个未合并的历史分支属仓库整理，但其中可能仍有并行会话在用，**不动、不删、不列为待办**，仅在此留档。
- **可复用手法**：`git tag | wc -l` + `gh release list --limit 10` 判有无版本化发布；`git branch | wc -l` / `git branch -r | wc -l` / `git branch --merged main | wc -l` 快速摸清分支规模。

---

## 仓库治理与安全配置盘点（2026-09-20 第二十六次新增维度）

> 前二十五轮盘过**工作流本身**（7 条、各自的触发方式与结论），但从未盘**仓库侧的护栏** —— 即「一次 push 从提交到上线，中间究竟有什么能拦住它」。本轮用 `gh api` 查 GitHub 侧配置，用 `find .github` 查本地配置。

### 实测结果

| 项 | 实测值 | 判读 |
|---|---|---|
| 仓库可见性 | **private**（`visibility: private`、`archived: false`、`default_branch: main`、`has_issues: true`） | 非公开仓库 |
| 分支保护（main） | **不可用**：`gh api .../branches/main/protection` → 403 `Upgrade to GitHub Pro or make this repository public` | **main 无强制 review、无强制 status check、无禁止 force-push** |
| Dependabot alerts | **关闭**：403 `Dependabot alerts are disabled for this repository` | 依赖漏洞无自动告警 |
| Secret scanning / push protection | **`security_and_analysis: null`** | 未启用 |
| 部署工作流的人工审批 | `grep -rn "environment:" .github/workflows/` **仅 `deploy-neonbeat.yml:51` 命中** → **BeatScape 部署无 `environment:`、无审批步骤** | push 直达生产 |
| 本地 `.github/` 内容 | 共 **8 个文件** = 7 个 workflow + `ISSUE_TEMPLATE/agent_safe_task.yml`；**无 `CODEOWNERS`、无 `dependabot.yml`、无 `PULL_REQUEST_TEMPLATE.md`** | 无 owner 指派、无依赖自动更新 |

### 本维度唯一值得登记的结论（与 P1-6 直接耦合）

- **`launch:check` 目前是唯一一道生产护栏。** 「部署有门禁」本身是好事，但这里的结构是反常的：分支保护不可用 + 部署工作流无 `environment:` / 无人工审批 + 无 CODEOWNERS → **一旦 `launch:check` 因任何原因通过（或被放宽），main 上任何触及 `apps/beatscape/**` 的 push 都会在无人审批的情况下直接发布到生产。**
- **这改变了 P1-6 方案 2 的代价表述。** 此前各轮把方案 2 写成「授权调整/移除 `deviceTestRecord` 门禁」，听起来只是「解锁部署」；实测后准确表述应为「**解锁部署的同时，也移除了目前唯一一道上线前卡点**」。这是用户拍板前需要知道的信息，已同步进 P1-6。
- **方案 1 / 方案 3 不受影响**：方案 1（恢复真机验收）保留门禁；方案 3（维持现状）门禁继续挡着，护栏结构不变。

### 判读纪律（第十二次印证「零 ≠ 该补」）

- 本维度扫出四个「零 / 关闭」，但**只登记上面一条**：
  - **「Dependabot 关闭」「无 secret scanning」不生成待办** —— 前者是仓库设置变更（属管理动作，当前 `pnpm` 依赖树在本阶段无已知漏洞），后者对私有单人开发仓库收益有限。**不适用就是不适用，写出来是为了以后不必重复排查。**
  - **「无分支保护」不生成待办** —— 不是「忘了配」，而是**当前套餐下无法启用**（API 明确要求 Pro 或公开仓库）→ **不可执行的待办是噪音**。
  - **「无 CODEOWNERS / 无 PR 模板」不生成待办** —— 仓库实际以「直接 push main + 部署门禁」运作（PR 数为 0），这些文件在当前工作流下无意义。
- **真正值得写的只有一条，且它不来自任何一个「零」本身**，而来自**两个事实的交叉**：「唯一护栏是 `launch:check`」×「P1-6 正在决定它的去留」→ 与第十次「孤儿 × 已上线 = 暴露面」同源。**盘点出「缺什么」之后，多问一句「它和哪个待决事项是同一件事」。**

### 可复用手法

- `gh api repos/<owner>/<repo> --jq '{visibility,archived,default_branch,security_and_analysis}'` —— 一眼看仓库治理开关；
- `gh api repos/<owner>/<repo>/branches/main/protection` —— **403 有两种成因必须分清**：`admin:repo_hook` scope 缺失（可 `gh auth refresh -s admin:repo_hook`）vs `Upgrade to GitHub Pro`（**套餐限制，重试无用**）；
- `gh api repos/<owner>/<repo>/dependabot/alerts` —— 403 `alerts are disabled` = 功能未启用（**不等于没有漏洞**）；
- **判「部署有没有人工卡点」用 `grep -rn "environment:" .github/workflows/`，不要凭 workflow 名字猜** —— 本轮就是反例：`deploy-neonbeat.yml` 有、`deploy-beatscape-cloudflare.yml` 没有，两者前缀完全相同。

---

## 未入库资产盘点（2026-09-21 第二十七次新增维度）

> 前二十六轮在 `git status` 里**数过**未跟踪条目（每轮都写「N 项未跟踪」），却从未**枚举**这些条目到底是什么。本轮第一次展开：`git ls-files --others --exclude-standard` = **1190 个文件**（此前记录的「10 项」是 `git status --short` 的**目录级**计数，两者差两个数量级）。

### 构成（1190 个文件）

| 类别 | 数量 | 说明 |
|---|---|---|
| Playwright 产物 `apps/beatscape/test-results-*/` | **907** | 12 个不同命名的结果目录（`test-results-current-full` 362 · `test-results-current-fixed-full` 359 · `test-results-clock-adjacent` 30 等） |
| 单曲 OG 图 `public/catalog/<id>/og.png` | **105** | 每首曲目一张，1200×630 |
| 未入库源码 `src/**/*.ts(x)` | **81** | 并行会话在制品（`routePreload.ts` / `pwa.ts` / `gamepadInput.ts` 等），**按纪律不碰** |
| 其他 | 97 | `public/icons/` 4 · `src/assets/` 13 · `docs/evidence/` · `worklog/2026-09-13.md` · `.workbuddy-ai/memory/` 3 等 |

### 本维度唯一真正值钱的发现：105 张单曲 `og.png` 从未入库

- **声明方存在**：`catalog.json` 每首曲目都有 `og` 字段，指向 `/catalog/<id>/og.png`，**105/105 磁盘零缺失**。
- **但 git index 里 0 命中**，且 `git check-ignore` 确认**未被 gitignore 忽略** —— 是「生成了、忘了 `git add`」，不是「有意忽略」。
- **对照：`cover` 字段指向 `.svg` 且已入库** → 所以这不是「整类资产都不入库」，而是**只有 `og.png` 这一类漏了**。
- **生成脚本不在任何自动化链路里**：`scripts/beatscape-generate-og.py`（经 `pnpm --filter @musicsaas/beatscape generate:og` 调用）在 `.github/workflows/` 与 `scripts/*.sh` 中**零命中**；`build` / `build:cf` / `release:check` / `release:beatscape` **都不包含它**（同类 `generate:og:site` 也只是独立脚本）。
- **线上实测**：`beatscape.pages.dev/catalog/bs-p3-01/og.png` → **200 但 2146 B `text/html`**（与缺失路径同字节数 = SPA 回落）；同目录 `cover.svg` → **200 / 8148 B / `image/svg+xml`** ✅。

**因果必须分开断言**（沿用第八次教训）：线上缺这 105 张图有**两个独立成因** —— (a) 部署自 09-04 卡死（P0-6，og.png 生成于 09-13 16:12，无部署机会）；(b) **文件根本不在 git 里**。只有 (b) 是本轮新发现，且 **(b) 在 (a) 修复后依然成立** → **不能并入 P0-6 了事**。

**当前影响面**（如实陈述，不夸大）：受控源码中 `track.og` **零消费方**（`socialMetaTags` 只输出 `og:title/description/url`，未输出 `og:image`；`index.html` 的静态 `og:image` 指向根 `og.png`）。所以这 105 张图**今天没有任何代码路径引用**，实际影响为 0 —— 登记为**候选、不认领、不阻塞**：要么补 `git add`（并决定是否在 CI 生成/入库），要么在确认无人消费后从 `catalog.json` 撤下该字段。**这是产品判断，不是缺陷。**

### 第二条（工程卫生，可低成本修复）：907 个测试产物绕过 gitignore

`.gitignore:61` 只忽略**精确名** `apps/beatscape/test-results/`。并行会话用 Playwright 自定义 `--output` 生成了 `test-results-current-full`、`test-results-clock-adjacent`、`test-results-poster-*`、`test-results-duration-*` 等 **12 个变体目录**，全部**不匹配**该规则 → 907 个文件堆在未跟踪区。

- **风险不是「占空间」，而是放大误操作**：本自动化每轮的硬性纪律是「只 `git add TODO.md`、绝不 `git add -A`」，而未跟踪区有 1190 个文件时，一次 `git add -A` 的破坏面比「10 项」大得多。
- **修复极简**：`.gitignore:61` 改为 `apps/beatscape/test-results*/`（同理 `apps/demo/`）。
- **本轮不动手**：`.gitignore` 属并行会话高频使用的文件，且本自动化纪律是只提交 `TODO.md`；**仅登记为一处候选收尾动作**。

### 判读纪律（第十三次印证「零 ≠ 该补」）

本次三个「缺口」里只有一个值得登记：

- **105 张 og.png 未入库** → 登记（**有声明方、有线上后果、有明确修复动作**）；
- **907 个测试产物** → 登记（**放大 `git add -A` 误操作面**，与本自动化的核心纪律直接相关）；
- **81 个未入库源码** → **不登记**（并行会话在制品，落单是正常形态，与第十次「孤儿 ≠ 该删」同源）。

**判据仍是「会不会在没人注意的情况下改变某个可观察结果」** —— 前两条会，第三条不会。

### 可复用手法

- **枚举未跟踪文件必须用 `git ls-files --others --exclude-standard`**，不能用 `git status --short`（后者按目录折叠，会低估一到两个数量级）。
- **`git ls-files 'apps/*/src'` 会静默返回 0**（git pathspec 的 `*` 不匹配 `/`）。本轮第一次跑就因此把「零 TODO / 零 `@ts-ignore`」判成了假阴性 —— 正确写法是 `git ls-files | grep -E '^apps/[^/]+/(src|e2e|scripts)/'`。**任何基于 `git ls-files <glob>` 的零结果，先验证文件数非零再采信。**
- **判「某类资产是否真会随部署上线」，查三件事**：① 在不在 git index；② 有没有被 gitignore 排除；③ 生成脚本在不在 `build` / `release:check` / workflow 里。三者都过才会上线。

---

## 曲库元数据与实测资产一致性盘点（2026-09-22 第二十八次新增维度）

> 前二十七轮在曲库资产上只做过**存在性**对账（第二十二次「声明 → 磁盘」零缺失），从未把 **`catalog.json` 里声明的数值** 与 **音频 / 谱面的实测值** 对账。本轮用 `afinfo` 实测 105×3 个音频文件（105 个 `audio.m4a` + 105 个 `stream.m4a` + 105 个 `preview_48s.m4a`），并逐张解析 315 份谱面。

### 实测结果（七项全干净，据此不生成待办）

| 对账项 | 实测 | 判读 |
|---|---|---|
| `duration_sec` vs `audio.m4a` 实测时长 | **0 处偏差 >1.5s**（105/105） | 实测分布：`bs-s1-*` 75s（`bs-s1-05` 60s）· `bs-s2/s3-*` 90s · s4 及以后 120s |
| `stream_duration_sec` vs `stream.m4a` 实测时长 | **0 处偏差 >1.5s** | 198s / 180s（`bs-s1-05`）/ 216s |
| `preview_48s.m4a` 实测时长 | **105/105 恰好 48.0s** | 无长短不一，与字段命名一致 |
| catalog `bpm` vs 谱面 `bpm` | **最大偏差 0.5、中位 0.00** | 且 315 张谱面的 `bpm` 与 `beat_map.detected_bpm` **完全一致（0 处偏差）** |
| 谱面末音符 vs 音频时长 | **超出音频的谱面 0 张**；覆盖率 **93.2%–99.2%**（中位 99.1%） | 无「音符落在音频结束之后」 |
| `slide` 音符 vs `allows_slide` | **0 处冲突**：50 个 slide 全在 5 首 `allows_slide: true` 的曲目（10 张谱面）里 | `beatscape-audit.py` 的「Stage1 禁 slide」规则不会被触发 |
| `total_notes` vs 实测判定对象数 | **315/315 一致**（差一点被误报成 314 处失败） | 见下 |

### 本维度唯一「差点写成待办」的一条：`total_notes` 的口径

- **按「`notes` 数组长度」比对，会得到「315 张谱面里 314 张对不上」**（如 `bs-p3-01/hard.json` 声明 **811**、`notes` 数组只有 **575** 项）。**这是假阳性。**
- **正确口径在 PRD §4.4，且同一规则在代码里被写了两遍**：`scripts/beatscape-audit.py:378-390` 的 `note_count()` docstring 明写「hold = head+tail = 2，slide = 1，chord = len(lanes)，tap = 1……`chart.total_notes` is the correct accuracy denominator」；`apps/beatscape/scripts/release.mjs:238` 的 `assert(chart.total_notes === count)` 用的是同一规则（`count += note.type === 'hold' ? 2 : lanes.length`）。
- **按该规则实测：315/315 全部一致，偏差 0。** 音符类型分布：tap **88,534** · chord **22,211** · hold **1,716** · slide **50**。
- **由此澄清本文件沿用多轮的一个数字**：**112,511** 是 **`notes` 数组条目数**；**准确率分母（判定对象数）是 143,066**。两者都对，但**含义不同** —— 下轮任何人拿数组长度去比对 `total_notes`，都会复现这个假阳性。

### 判读纪律（第十四次印证「零 ≠ 该补」，并新增一条「mismatch ≠ bug」）

- 本维度七项对账**全部干净** → **不生成任何待办**，写出来是为了**后续不必再查**（与第十九次「Node 侧零幽灵依赖」、第二十二次「引用完整性 100% 干净」同类）。
- **新增判读规则：看到「声明值 ≠ 实测值」时，第一件事是找「双方各自的计量规则」，而不是记缺陷。** 本轮 314/315 的「不一致」**全是口径差**——`release.mjs` 用正确口径跑本来就是绿的（否则 `release:check` 早就在部署管道第 8 步红了，而不是只红第 9 步 `launch:check`）。
- **通用化**：仓库里凡是「声明型字段」（`total_notes` / `duration_sec` / `bpm` / `totalNotes`），**先找消费它的 assert 或 docstring 确认口径，再判对错**；这一步成本极低，但能挡掉本轮这种「差点把 314 张谱面记成损坏」的假阻塞。

### 可复用手法

- 音频实测时长：`afinfo <file> | grep "estimated duration"`（macOS 自带，315 个文件约 1 分钟；仓库另有 `ffprobe`）。**不要用 `du`/文件大小反推时长。**
- 谱面声明值 vs 实测判定数：必须按 PRD §4.4 规则（`hold`=2 / `chord`=`len(lanes)` / `slide`=1 / `tap`=1）计数，**不要用 `notes.length`**。
- 「末音符是否超出音频」：`max(note.t) + audio_offset_ms/1000 <= duration_sec`（本轮 315 张全部满足，`audio_offset_ms` 全仓均为 0）。
- 交叉字段一致性：`slide` 音符必须落在 `allows_slide: true` 的曲目里（否则 `beatscape-audit.py:547` 的 Stage1 规则会 FAIL）。

---

## 孤儿资产盘点（2026-09-10 第十一次新增维度）

> 前十轮从未查过「哪些文件从来没有被任何地方引用过」。本轮以「文件名是否出现在任何受控文本文件（`.md` / `.json` / `.yml` / `.sh` / `.py` / `.ts` / `.js` / `.txt`，排除 `node_modules` / `apps/beatscape/public` / `data/`）中」为判据实测。**孤儿 ≠ 死代码**，多数是一次性流水线脚本，本来就靠人手动跑而不写进文档；本维度的价值是**把它们从「不可发现」变成「可发现」**。

| 范围 | 总数 | 孤儿数 | 占比 |
|---|---|---|---|
| `scripts/`（`.sh` + `.py`） | 92 | **22** | 24% |
| `docs/`（`.md`） | 49 | **1** | 2% |

**22 个孤儿脚本**（抽查 5 个用 `grep -rl "<文件名>"` 全仓直查均 0 命中，确认为真孤儿，非脚本误判）：

- **模型 / 训练**：`_train_text_to_image_lora.py`、`_train_text_to_image_lora_sdxl.py`（以下划线开头，本就暗示内部/实验用）
- **ACE-Step 环境**：`mac-ace-macos-only.py`、`mac-ace-pip-install.sh`、`mac-ace-pip-staged.sh`、`mac-ace-verify.py`、`mac-mlx-benchmark.sh`（`mac-ace-verify.py` 仅 8 行，是个 import 冒烟脚本）
- **曲库生成流水线（一次性 Ingest）**：`beatscape-ingest-p3.py`、`beatscape-ingest-p4.py`、`beatscape-p3-specs.py`、`beatscape-p4-specs.py`、`beatscape-generate-hum.py`、`beatscape-cover-character.py`、`beatscape-make-preview.py`
- **诊断 / 验证**：`beatscape-chart-sync-check.py`、`verify-examples.py`、`run-benchmark.py`
- **派单 Harness**：`agent-delivery/dispatch-cursor-agent-cli.sh`、`agent-delivery/dispatch-cursor-agent.sh`、`agent-delivery/merge-evidence.py`、`agent-delivery/review_codex.py`、`ai-company/codex-run.py`

**1 个孤儿文档**：`docs/BEATSCAPE-STAGE4-RESONANCE-SONIC-BATCH.md` —— 未被任何 md/索引引用。按下方「已取消（不自动恢复）」段的口径，「Stage4 40 首」类历史冲刺项**不回填为待办**，因此**只留档、不动、不删**。

### 从孤儿清单里挖出的唯一候选接线项（登记但不认领）

- **`scripts/beatscape-chart-sync-check.py`（121 行）不在任何验收命令或 CI 中**。它做的是「谱面音符 × 音频 onset 能量**互相关**对齐诊断」，且文档字符串里明确解释了**为什么不能只用「最近 onset 距离」**（120s 的曲子有 1300+ onset，平均每 88ms 一个，任意时间点附近都能找到 onset，「最近距离 18ms」与随机猜测无异，是假阳性指标）——这不是随手写的玩具，作者踩过坑。
- **相关性**：本文件[当前状态速览](#当前状态速览)记的是「315 张已按『拍网格亲和力』全量重出」，而[验收命令](#验收命令)段目前**没有任何一条谱面-音频对齐 QA 命令**（`catalog:beatscape` / `audit:beatscape` / `earcheck:beatscape` 分别管 catalog、内容审计、人工耳检）。
- **处理意见**：仅登记为候选，**不认领、不列为 P0/P1 阻塞项**。是否把它接进验收命令，取决于用户是否认为「重出后的 315 张谱面」需要一次对齐复核——**这是产品判断，不是技术问题**。若要做，动作是：先跑一遍看基线结论，再决定是否固化进 `scripts/harness.sh` 或文档。

### 可复用手法

```bash
# 孤儿扫描：文件名是否出现在任何受控文本文件里（排除产物/数据目录）
git ls-files | grep -E '\.(md|json|yml|yaml|sh|ts|tsx|mjs|js|txt)$' \
  | grep -v node_modules | grep -v 'apps/beatscape/public' | grep -v '^data/' > /tmp/corpus.txt

# 逐个待查文件判是否被引（用 basename 与相对路径各查一次，避免漏判）
grep -Fq "$(basename $f)" $(cat /tmp/corpus.txt) || echo "ORPHAN $f"
```

- **判读纪律（本轮最重要的一条）**：**孤儿 ≠ 该删**。一次性 Ingest / 训练 / 环境脚本天然不被引；**只有「诊断类」脚本落单才值得追问**（诊断没人跑等于没诊断）。因此本清单不生成「清理 22 个脚本」这种待办——那会制造噪音并可能误删流水线工具。
- **另一条**：扫描判据是「文件名字符串」，若某脚本通过变量拼接或 glob 间接调用会被误判为孤儿。**抽查确认后再下结论**（本轮抽查 5 个全为真孤儿）。

---

## 散落待办清单盘点（2026-09-10 第十二次新增维度）

> 本文件第 3 行主张「**待办的唯一入口**」。前十一轮从未检验过这个主张——本轮首次实测：**除本文件外，仓库里还有 5 个受控文件在承载未勾选项，共 91 个未勾复选框**。本维度的价值不是把它们回填进来，而是**判断哪些是真的漏登记、哪些只是计划文档的勾选态没跟上事实**。

| 文件 | 未勾 / 已勾 | 最后一次改动 | 与本文件的关系 | 判读 |
|---|---|---|---|---|
| `docs/BEATSCAPE-TODO-ACCEPTANCE.md` | **28** / 0 | 2026-08-25 | 已在 P5-1 加「历史冲刺归档」横幅 | 历史冲刺规格，**不回填**（已有横幅，无需再动） |
| `docs/RESONANCE-VISUAL-PLAN.md` | **26** / 0 | 2026-08-29 | **本文件从未提及** | ⚠️ **勾选态与事实脱节**，见下方判读 |
| `docs/PRD-BEATSCAPE.md` | **15** / 2 | 持续 | PRD，非待办清单 | 属需求文档的待决项，不属「漏登记待办」 |
| `docs/BEATSCAPE-IP-STRATEGY.md` | **12** / 6 | 2026-08-30 | **本文件只通过 P1-2 覆盖了商标部分** | IP 策略其余未勾项（授权文件归档等）**未被本文件任何条目覆盖** → 候选，见下 |
| `docs/TODO.md` | **10** / 20 | 2026-08-25 | 已作为 P3 与「明确不做」的来源被引用 | 已覆盖（P3 段已声明不继承其中两条过期项） |

**另有 1 处非复选框形态的清单**：`.delivery/beatscape/backlog.md`（30 行，2026-08-29）——**本文件从未提及**。含 5 个 TICKET，B01–B04 已 `[done]`，**`TICKET-B05` Reddit 启动页 CTA 文案（AC：CEO 勾文案后再 merge）仍未关闭**。它实质落在 P3「发帖素材包 — 见 docs/BEATSCAPE-REDDIT-LAUNCH.md」这一条的范围内，**因此不新开条目，仅在此登记该位置，避免两处状态分叉**。

### 关键判读：26 个未勾 ≠ 26 件事没做

`docs/RESONANCE-VISUAL-PLAN.md` 是未勾最多的一份（26/26 全未勾，0 个已勾），内容是「霓虹 → 漫画硬边」视觉改造。若只看复选框会以为这套改造完全没做。**本轮实测代码，它其实已基本落地**：

| 计划条目 | 实测证据 | 结论 |
|---|---|---|
| 移除霓虹辉光（`--glow-accent`） | `styles.css:40` 为 `--glow-accent: none;`，全仓 `.ts/.tsx` **0 处引用** | ✅ 已落地（变量保留但置空，未物理删除） |
| 引入 Anton 字体 | `styles.css` 中 `Anton` **15 处命中** | ✅ 已落地 |
| 半调网点背景（`.bg-fx`） | `styles.css` 中 `halftone` **10 处命中** | ✅ 已落地 |
| 视觉回归截图存档到 `docs/_visual-baseline/` | **该目录不存在**（`ls` 报 No such file or directory） | ❌ **确实未做** |

- **结论**：这份计划文档是**「做完了但没人回头勾选」**，不是「26 件事待办」。若据此生成 26 条待办，会一次性制造 25 条假待办。
- **可复用规则（下轮必守）**：**计划文档里的未勾复选框，必须先回到代码里实测再决定要不要登记**。判据是「找该条目必然留下的代码痕迹」（字体名、CSS 变量、目录、函数名），而不是读文档文字。「0 个已勾」本身就是强烈信号——**一份 26 项全未勾的计划，通常不是因为一项都没做，而是因为做完后没人回来维护**。
- **与上一轮「孤儿资产」维度的同一条纪律呼应**：盘点出新清单时，先问「这类东西落单/未勾是否正常」，再决定要不要生成待办。

### 本维度登记的唯一候选（不认领、不阻塞）

- **`docs/_visual-baseline/` 视觉回归基线目录不存在**（`RESONANCE-VISUAL-PLAN.md:247`：「视觉回归：截图存档到 `docs/_visual-baseline/`，便于后续比对」）。
  - 这是本轮 91 个未勾项中，**唯一既有明确验收物、又确认未在代码/仓库中落地、且未被本文件任何条目覆盖**的一条。
  - 性质是「锦上添花的基线建设」，不是发布阻塞。**不认领、不列 P 级条目**——是否建库取决于用户是否要做视觉回归比对。
- 其余（`docs/BEATSCAPE-IP-STRATEGY.md` 的 12 项、`docs/PRD-BEATSCAPE.md` 的 15 项）：属需求/策略文档的待决项，**本文件已通过 P1-1 / P1-2 覆盖其决策出口**，补一份文件级索引收益低于制造重复维护成本，故**只留档、不建立条目**。

### 可复用手法

```bash
# 1) 找出所有名似清单的受控文件
git ls-files | grep -iE '(^|/)(todo|backlog|next|checklist|roadmap)'

# 2) 统计每个受控 md 的未勾/已勾数量（比只看未勾更能发现「全未勾」的漂移文档）
for f in $(git ls-files '*.md' | grep -v node_modules); do
  u=$(grep -c '\[ \]' "$f"); d=$(grep -c '\[x\]' "$f")
  [ "$u" -gt 0 ] && echo "$u 未勾 / $d 已勾  $f"
done | sort -rn

# 3) 判读：把条目翻译成「必然留下的代码痕迹」再实测，不要读文字就下结论
grep -c "Anton" apps/beatscape/src/styles.css
grep -n "glow-accent" apps/beatscape/src/styles.css
ls -d docs/_visual-baseline 2>&1

# 4) 本文件内部的数字一致性检查（本轮就是靠它发现 23/25/26 三个版本）
grep -n "个 commit 未部署\|部署债务" TODO.md
```

---

## 测试覆盖盲区盘点（2026-09-10 第十三次新增维度）

> 前十二轮从未查过「哪些源码没有测试、以及测试到底在哪跑」。本轮先按目录统计单测分布，再追到 CI 与部署工作流去查「谁真的执行了浏览器回归」。**价值不在于「补测试」，而在于发现「CI 绿」这个说法的覆盖范围比字面窄。**

### 分布（`apps/beatscape/src`，81 个源码文件 / 25 个 `*.test.ts(x)`）

| 目录 | 源码 | 单测 | 备注 |
|---|---|---|---|
| `pages/` | 15 | **0** | 最大的零单测目录；由 `e2e/` 覆盖（见下） |
| `components/` | 16 | **0** | 子目录 `components/playfield/` 另有 3 个单测 |
| `data/` `types/` `constants/` 根 | 2 / 2 / 1 / 3 | **0** | 多为纯数据/类型，零单测可接受 |
| `audio/` | 5 | 3 | |
| `catalog/` | 4 | 2 | |
| `engine/` | 5 | 5 | |
| `i18n/` | 4 | 2 | |
| `input/` | 2 | 2 | |
| `lib/` | 10 | 5 | |
| `seo/` | 1 | 1 | ✅ 2026-09-12 已补 `socialMetaTags`、route meta 与英语数字格式覆盖，当前 `pageMeta.test.ts` 21 例（本表其余目录数量仍是 09-10 快照） |
| `storage/` | 3 | 1 | |

### 本维度的核心发现：e2e 不在 CI 里，只在部署管道里

- `apps/beatscape/e2e/` 有 **4 个 Playwright spec**（`exit-dialog` 294 行 / `release` 169 行 / `narrative` 144 行 / `early-audio` 79 行），是 `pages/`（15 个文件、零单测）**唯一的自动化覆盖**。
- **但 CI 工作流不跑它们**：`.github/workflows/ci.yml` 的 `beatscape` job 只有 `pnpm --filter @musicsaas/beatscape test`（= `vitest run`）+ `beatscape-audit.py` + `beatscape-catalog-status.py`，**没有任何 playwright 步骤**。
- **只有部署工作流跑**：`deploy-beatscape-cloudflare.yml` 先 `playwright install --with-deps chromium`，再在 "Verify release candidate" 里执行 `pnpm release:beatscape` → `release:check` → `npm run test:e2e`。
- **后果（可量化，2026-09-17 第二十三次实测更正）**：09-06 至 09-11 之间确实是「e2e 空窗期」（最后一次 run `34064117995`，2026-09-06T22:28Z）。**但 09-12 部署管道被重新触发了 5 次，e2e 已恢复在 GitHub 上执行**：最近一次 run `34675948678` 的第 7 步 `Verify release candidate` 日志实测含 **Vitest 27 文件 / 193 passed** 与 **`playwright test` → "62 passed (14.0m)"**，且 5 次 run 的第 7 步**全部 success**。**结论修正为：浏览器回归不再缺失，缺的只是「Publish」这一步**（第 9 步 `Check launch sign-off` 失败 → 第 10 步 skip）。**这正是当前唯一能远程取得浏览器回归证据的窗口，且它现在真的在产出证据。**
- **因此**：本文件与 `SESSION.md` 里反复出现的「CI 绿」，准确含义是「vitest + 2 个 python 脚本绿」，**不含任何浏览器回归**。在 P0-6 解除门禁前，想在 GitHub 上拿到一次 e2e 结果，只有触发一次必定失败的部署 run 这一条路（因为 `release:check` 排在 `launch:check` 之前，**e2e 仍会跑并出结果**——这是当前唯一能远程取得浏览器回归证据的窗口）。

### 15 个页面中，4 个两种测试都未触及

在 `apps/beatscape/e2e/` 全目录按页面名 grep，**0 命中**的有 4 个：`Calibration`、`FirstShift`、`Legal`、`NotFound`。其余 11 个至少被 1 个 spec 触及（`Play` 4 / `Track` 4 / `Home` 3 / `Duo` 3 / `Characters` 2 / `Radio` 2 / `Results` 2 / `Library` 2 / `Leaderboard` 1 / `Profile` 1 / `Settings` 1）。

### 判读纪律与登记意见

- **零单测 ≠ 未覆盖**（与前两轮「孤儿 ≠ 该删」「未勾 ≠ 没做」同一条纪律）。`pages/` 是 React 页面组件，用 e2e 覆盖本就是合理层级；**据此生成「补 39 个单测」会制造大批低价值条目**，本轮明确拒绝。
- **只登记 1 条候选（不认领、不阻塞）**：是否把 `test:e2e` 接入 `ci.yml`。收益是让浏览器回归不再依赖部署管道；代价是每次 CI 多装 chromium + 多跑 4 个 spec（本地 `release:check` 全量约十几分钟）。**这是工程权衡，不是缺陷，等用户判断。**
- 4 个未触及页面中，`NotFound`（404 兜底）与 `Legal`（法务文案）风险最低；`Calibration`（音画同步校准）无回归覆盖**相对更值得关注**——它直接影响判定手感，且 P0-1 耳检也在听判定相关的东西。同样只登记、不认领。

### 可复用手法

```bash
# 1) 按目录统计单测分布（找出零单测目录）
for d in $(find apps/beatscape/src -type d | sort); do
  n=$(find "$d" -maxdepth 1 -type f \( -name '*.ts' -o -name '*.tsx' \) ! -name '*.test.*' ! -name '*.d.ts' | wc -l)
  t=$(find "$d" -maxdepth 1 -type f -name '*.test.*' | wc -l)
  [ "$n" -gt 0 ] && echo "$d src=$n test=$t"
done

# 2) 关键：别只看「有没有测试文件」，要查「谁真的执行它」
grep -n "e2e\|playwright\|test" .github/workflows/ci.yml          # 本仓：无 playwright
sed -n '44,66p' .github/workflows/deploy-beatscape-cloudflare.yml # 部署工作流：install chromium → release:beatscape → launch:check
python3 -c "import json;print(json.load(open('apps/beatscape/package.json'))['scripts']['release:check'])"
# → npm test && node --test scripts/release.test.mjs && npm run test:performance && npm run build:cf && npm run test:e2e && npm run release:verify

# 3) 判断某页面是否被 e2e 触及（0 命中 = 两种测试都没覆盖）
grep -ril "<PageName>" apps/beatscape/e2e/ | wc -l

# 4) 统计「自某时刻起 CI 跑了几次」（量化「e2e 空窗期」）
gh run list --workflow=ci.yml --limit 50 --json conclusion,createdAt \
  --jq '[.[] | select(.createdAt > "2026-09-06T22:28:24Z")] | "总计 \(length) 次，success \(map(select(.conclusion=="success"))|length) 次"'
```

---

## 受控二进制资产与公开资产暴露面盘点（2026-09-10 第十四次新增维度）

> 前十三轮从未查过「哪些大文件进了 git」以及「有没有资产不在任何 catalog 里、却能从生产域名直接下载」。本轮用 `git ls-files` + `os.path.getsize` 统计体积结构，再对最大的可疑资产做「是否被引用 / 是否已上线」双重实测。**本维度的价值不在「瘦身」，而在于发现一个 P0-1 耳检的覆盖缺口。**

### 体积结构（受控文件 1209 个 / 440.1 MiB）

| 扩展名 | 体积 | 占比 |
|---|---|---|
| `.m4a` | **410.9 MiB** | **93.4%** |
| `.json` | 11.9 MiB | 2.7% |
| `.png` | 8.6 MiB | 2.0% |
| `.wav` | 4.2 MiB | 1.0% |
| 其余（md/svg/py/ts/tsx/…） | 约 4.5 MiB | ~1% |

- **单个最大文件**：`apps/scapemusic/public/trials/demo-b1.m4a`（5.63 MiB）；BeatScape 侧最大是 `catalog/bs-*/audio.m4a`（各 3.75 MiB，属正常曲库资产）。
- **git-lfs 已安装但从未使用**：本机 `git lfs/3.8.0`，但仓库**无 `.gitattributes`**、`git lfs ls-files` 为空 → 410 MiB 音频**全部直接进 git 历史**，`.git` 目录已达 **1.4 G**。
- **一个易误判的点**：`apps/scapemusic/public/catalog` 是指向 `../../beatscape/public/catalog` 的**符号链接**（`ls -la` 可见 `lrwxr-xr-x`），ScapeMusic 复用 BeatScape 音频，**不是重复资产**。按目录 `du` 时会算成 1073 MiB，实际占 0。（`os.walk` 默认不跟随符号链接，所以统计脚本给出 27.8 MiB，一度看起来自相矛盾。）

### 本维度核心发现：5 个未被引用的音频已上线、可公开下载

`apps/scapemusic/public/trials/`：

| 文件 | 大小 | 源码引用 | 在任何 catalog | 线上 |
|---|---|---|---|---|
| `demo-a.m4a` | 5.40 MiB | ❌ 0 命中 | ❌ | ✅ 200（5,660,681 B） |
| `demo-b.m4a` | 5.59 MiB | ❌ 0 命中 | ❌ | ✅ 200（5,860,167 B） |
| `demo-b1.m4a` | 5.63 MiB | ❌ 0 命中 | ❌ | ✅ 200（5,899,459 B） |
| `demo-b2.m4a` | 5.62 MiB | ❌ 0 命中 | ❌ | ✅ 200（5,897,484 B） |
| `demo-b3.m4a` | 5.58 MiB | ❌ 0 命中 | ❌ | ✅ 200（5,847,063 B） |
| **合计** | **27.81 MiB** | | | |

判据（四条独立证据，避免误判）：

1. `apps/scapemusic/src` 全目录 grep `trials|m4a|import.meta.glob` → 无任何命中指向 `trials/`；ScapeMusic 自己的 `src/data/catalog.json` 只引用 `/catalog/bs-*/stream.m4a`。
2. 全仓 grep `demo-a|demo-b\.m4a|trials/` → 仅 4 处命中，逐条回看**全部无关**：`apps/demo/src/Portal.tsx:39` 是英文文案 "Online generation trials are not open yet"、`worklog/2026-09-05.md` 与 `docs/PRD-WEB-RHYTHM-GAME.md` 同为英文词 trials、`apps/demo/dist-portal/` 是构建产物。**零处是真实引用。**
3. `grep -c "demo-" apps/beatscape/public/catalog.json` = **0** → 不在 BeatScape 的 105 首里。
4. `curl` 生产域名 `https://scapemusic.pages.dev/trials/<file>.m4a` → **5 个全部 200**，字节数与本地一致 → **确实已随 ScapeMusic 部署上线**。

### 与 P0-1 的关系（本条真正的价值）

- **P0-1 耳检的范围是 catalog 里的 105 首**，而这 5 个文件**不在任何 catalog 中**，因此**从未进入耳检范围，却已经可以从生产域名公开下载**。
- P0-1 的存在理由是「确认无『脱口而出第三方名曲』的衍生风险」。**这 5 个文件是否是 ACE-Step 生成、是否用了受版权保护的素材，本文件不做判断（未听过、无元数据可查）**，只指出：**它们落在现有所有内容 QA（耳检 / audit / catalog 核对）的视野之外。**
- `demo-b1/b2/b3` 的命名像是同一 prompt 的多次生成变体，属**疑似实验残留**。

### 处理意见（登记、不认领）

- **不做任何删除动作**。理由与「孤儿 ≠ 该删」同源：这些可能是有意保留的试听样例（ScapeMusic 是流媒体站，trials 目录名本身暗示「试听」），删除前需要确认意图。
- **建议的最小确认动作（供用户判断）**：① 确认这 5 个文件的来源与授权；② 若确认是实验残留 → 从 `public/` 移出并重新部署（**注意：删除也要走部署管道，而管道当前被 P1-6 门禁卡死**）；③ 若确认要保留 → 把它们纳入 P0-1 耳检范围或显式登记豁免。
- **不列 P 级条目、不作阻塞项**——是否处置取决于「这些内容是否安全」，那是需要人工确认的事实问题，不是本文件能推断的结论。

### 可复用手法

```bash
# 1) 体积结构：受控文件按扩展名聚合（git ls-files + stat，注意 macOS 无 stat -c）
python3 -c "
import subprocess, os, collections
files=[f for f in subprocess.check_output(['git','ls-files','-z']).decode().split('\0') if f]
sizes=[(os.path.getsize(f),f) for f in files if os.path.isfile(f)]
sizes.sort(reverse=True)
print('top:', [(round(s/1048576,2),f) for s,f in sizes[:10]])
by=collections.Counter()
for s,f in sizes: by[f.rsplit('.',1)[-1]]+=s
print([(e,round(v/1048576,1)) for e,v in by.most_common(5)])
"

# 2) git-lfs 是否真在用：无 .gitattributes 或 lfs ls-files 为空 = 没用
cat .gitattributes 2>/dev/null || echo "(none)" ; git lfs ls-files | head

# 3) 符号链接识别（否则 du 会重复计算、os.walk 会漏算）
ls -la apps/scapemusic/public/    # lrwxr-xr-x 开头即符号链接

# 4) 「是否上线可下载」：直接 curl 生产域名，看状态码与字节数
for f in demo-a demo-b demo-b1 demo-b2 demo-b3; do
  curl -s -x http://127.0.0.1:7897 -o /dev/null -w "$f=%{http_code}(%{size_download}B) " \
    "https://scapemusic.pages.dev/trials/$f.m4a"
done

# 5) 「是否被引用」：先 grep 源码，再 grep 全仓，且必须逐条回看命中行
#    （本轮 4 处命中全是英文单词 trials / 构建产物，无一是真引用）
grep -c "demo-" apps/beatscape/public/catalog.json   # 0 = 不在曲库
```

- **判读纪律（第四次印证「零 ≠ 该补 / 该删」）**：与「孤儿 ≠ 该删」「未勾 ≠ 没做」「零单测 ≠ 未覆盖」同源——**「未被引」在本地只是噪音，一旦「未被引 + 已上线可下载」就变成了暴露面**。因此本维度真正该问的不是「有几个孤儿文件」，而是**「有没有文件既不在受审清单里、又能被外人拿到」**。**盘点时把「受控 / 已发布 / 已受审」三个集合交叉比对，比单独看任何一个都有价值。**

---

## 构建期环境变量与部署路径盘点（2026-09-10 第十五次新增维度）

> 前十四轮只逐个核对过**单个**变量（P1-3 从头到尾只覆盖 `VITE_STREAM_APP_URL` 一个），从未**枚举全部**构建期变量并追问「每个变量究竟由谁注入、没注入会回落成什么、错了会不会被发现」。本轮先用 `grep -rhoE "import\.meta\.env\.[A-Za-z_0-9]+"` 枚举引用点，再逐个反查注入方（`package.json` 脚本 / 部署脚本 / 工作流 `env:` / `.env.example`）。**结论：3 个自定义变量里有 2 个不在 `pnpm build` 路径上；且 ScapeMusic 这个已上线的站点完全没有 CI/CD 工作流。**

### 变量清单

| 变量 | 引用处 | 注入点 | 未注入时回落 | 状态 |
|---|---|---|---|---|
| `BASE_URL`（Vite 内置） | 9 处（beatscape 8 / demo 1） | `vite.config.ts` 的 `base: process.env.VITE_BASE ?? …` | `/beatscape/`（bs）· `/`（scapemusic）· `/neonbeat/` | ✅ 三种构建方式一致 |
| `DEV`（Vite 内置） | 7 处 | Vite 内置 | — | ✅ |
| `VITE_STREAM_APP_URL` | `beatscape/src/lib/streamLink.ts:4` | **仅** `apps/beatscape/package.json:9` 的 `build:cf` 内联 | `null` → UI 显示 "App link coming soon" | 已知，见 P1-3 |
| `VITE_GAME_URL` | `scapemusic/src/lib/catalog.ts:124` | **仅** `scripts/deploy-scapemusic-cf-pages.sh:35`；`apps/scapemusic/package.json` 的 `build` **无注入**（`tsc --noEmit && vite build`） | `http://127.0.0.1:5175/beatscape` —— **死链** | 🆕 与 BeatScape 不对称 |
| `VITE_API_BASE` | `neonbeat/src/api/musicsaas.ts:4` | **全仓零注入**：`deploy-neonbeat.yml:33` 只注入 `VITE_BASE`；三个 `.env.example` 均未列出；全仓仅 3 处出现（README 的 dev 示例、`vite-env.d.ts` 声明、引用点本身） | `""` | 🆕 但只被 NeonBeat 引用，本阶段明确不做 → **不认领** |

**附带一处文档缺口**：`apps/beatscape/.env.example` 有 `VITE_STREAM_APP_URL`，而 **`apps/scapemusic/.env.example` 不存在** —— 也就是说「已写进 `package.json` 的那个变量有 dev 样例，没写进 `package.json` 的那个（`VITE_GAME_URL`）反而没有任何样例」。开发者在 ScapeMusic 里直接 `pnpm dev` 会拿到 `127.0.0.1:5175` 死链且无从得知要配什么。

### 本维度最有价值的一条：hash 路由修正被硬编码成单一域名

- `streamLink.ts:9-12` 有一段特判：当 `STREAM_APP_BASE === "https://scapemusic.pages.dev"` 时补 `/#`，注释写明「Scape Music uses a hash router; a pathname deep link silently opens Discover」。该特判由 **`8b710a3`**（与部署门禁同一个 commit）引入。
- **实测该修正确有必要**：ScapeMusic 是自研 hash 路由（`App.tsx` 里全是 `#/` `#/library` `#/playlists` `#/favorites`，无 `HashRouter` 库调用）；且 `curl https://scapemusic.pages.dev/track/bs-s1-01` 返回 **200 / 1944 B**，与确定不存在的路径 **字节数完全相同** → 命中 SPA 回落，**路径式深链确实打不到单曲页**。
- **但它是按「域名字符串精确相等」判断的，不是按路由类型推导的** → 只要 ScapeMusic 换成任何其他来源（自定义域名、CF 预览域 `*.scapemusic.pages.dev`、或按 P1-3「Scape Music 为工作名」改名），特判失效，深链**静默**退化成路径式并落到 Discover，**不报错、不告警**。
- **现有单测不会发现**：`streamLink.test.ts` 只有 2 个用例，第 1 个用的**恰好就是** `https://scapemusic.pages.dev/`（断言得到 `/#/track/…`），**没有任何用例覆盖「非该域名」的分支** → 换域名后测试仍全绿。**这是一条「测试只覆盖了硬编码生效的那条路径」的覆盖缺口**，与第十三次「e2e 不在 CI」是同类问题：测试存在，但覆盖不到会变的地方。
- **与 P1-3 的关系（已同步写入 P1-3 动作项）**：P1-3 现有动作是「部署后复测 `/#/track/{id}` 可达」，这只在**域名不变**的前提下成立。**补充：若 `VITE_STREAM_APP_URL` 的取值将来不是 `https://scapemusic.pages.dev`，必须同步修改 `streamLink.ts:10` 的判等（或改为按路由类型推导的通用规则），并补一个「非该域名」用例。** 属**登记、不认领**——是否改取决于是否打算换域名，那是 P1-1「流媒体终点」的拍板范围。

### 顺带：全仓硬编码生产域名清单（换域名的 blast radius）

> 上一条是「有一个变量的值被硬编码进逻辑分支」，顺手把范围扩大到全仓：**除构建产物外，共 13 个文件 / 30 处**写死了 `*.pages.dev` 生产域名。（构建产物 `dist/` `dist-deploy/` `dist-portal/` 已确认**全部 gitignore、受控数 0**，不计入，也不是仓库污染。）

| 类型 | 文件（命中数） | 换域名后的表现 |
|---|---|---|
| **静默失效（5 个文件）** | `beatscape/index.html`(4：canonical / og:url / og:image / twitter:image)、`beatscape/public/sitemap.xml`(8)、`beatscape/public/robots.txt`(1)、`beatscape/src/lib/streamLink.ts`(1)、`demo/src/Portal.tsx`(2：两个产品外链) | **指向旧域名且不报错** —— SEO 与 og 图错、深链落 Discover、门户外链失效 |
| **显式护栏（3 个文件）** | `beatscape/e2e/release.spec.ts`(1)、`demo/e2e/portal.spec.ts`(2)、`demo/scripts/release.mjs`(1) | **断言直接红**，能挡住遗漏 |
| 配置 / 默认参数（2） | `beatscape/package.json`(1：`build:cf` 的 env)、`beatscape/scripts/live-smoke.mjs`(1：CLI 默认 URL) | 属配置入口，需同步改 |
| 注释 / 测试夹具（3） | `scapemusic/src/vite-env.d.ts`(1 注释)、`beatscape/src/lib/streamLink.test.ts`(2)、`demo/scripts/release.test.mjs`(5，用的是 `portal.` / `musicsaas.` 示例域) | 不随生产域名变化；但 `streamLink.test.ts` 那 2 处正是上一条「只覆盖硬编码生效路径」的来源 |

- **可操作结论**：**一次域名变更要动 11 个真实文件**（13 减去注释与夹具），其中 **5 个静默失效、3 个会显式报错**。
- **本条最有价值的一点（与上一条同源，但结论相反）**：**同样是硬编码域名，写在 `assert` 里是护栏，写在 `if` / 静态资源里是陷阱。** `streamLink.ts:10` 是全仓**唯一**把域名写进**逻辑分支**的地方（`===` 判等决定是否补 `/#`），因此它既静默失效、又没有护栏；而 `e2e/release.spec.ts:35` 把同一个域名写进 `expect(...).toHaveAttribute('href', ...)`，反而会在域名变更时立刻报错。**判读硬编码时，看它在「表达式」还是「断言」里，比数它出现几次更有意义。**
- **不生成待办**：是否换域名属 P1-1「流媒体终点」与 P1-3「Scape Music 为工作名」的拍板范围，本条只提供**变更成本**供拍板参考。

### 第二条：ScapeMusic 完全没有 CI/CD 工作流

- `grep -rn "scapemusic" .github/workflows/` → **0 命中**。7 条工作流里没有任何一条构建、测试或部署 ScapeMusic；`ci.yml` 只跑 `pnpm --filter @musicsaas/beatscape test`。
- ScapeMusic 的部署只靠 `scripts/deploy-scapemusic-cf-pages.sh`，而该脚本**全仓只在 `SESSION.md:68` 与 `worklog/2026-09-05.md:59` 被提到过**，没有写进任何文档、工作流或验收命令。
- **与上一轮（第十四次）暴露面发现的因果关系（本条真正的价值）**：上一轮查到 `apps/scapemusic/public/trials/` 下 5 个 m4a（27.81 MiB）未被引用、不在任何 catalog，**却已上线可公开下载**。本轮给出了成因——**ScapeMusic 的部署是手动脚本，没有门禁、没有产物检查、没有 CI**，任何放进 `public/` 的文件都会在下一次手动部署时直接对外。**因此那 5 个文件不是「一次意外」，而是「没有管道」的必然结果**；即使现在删掉，同样的事仍可能再次发生。
- **脚本本身有护栏**：`deploy-scapemusic-cf-pages.sh:38-45` 会做产物自查（残留 `127.0.0.1:5175` 或找不到目标域名即 FATAL 退出）。**问题不在脚本，在于它不自动跑、也没人知道要跑它。**
- **登记、不认领、不作阻塞项**：是否为 ScapeMusic 补一条工作流属工程选型；且当前 BeatScape 那条还被 P1-6 门禁卡死，参考价值有限。

### 可复用手法

```bash
# 1) 枚举全部前端环境变量引用点（P1-3 只核对过单个变量，枚举才能发现漏注入的）
grep -rhoE "import\.meta\.env\.[A-Za-z_0-9]+" apps/*/src | sed 's/import.meta.env.//' | sort | uniq -c | sort -rn

# 2) 逐个变量反查注入点：包脚本 / 部署脚本 / 工作流 env: / .env.example
for p in apps/*/package.json; do python3 -c "import json;print('$p',[v for k,v in json.load(open('$p'))['scripts'].items() if 'build' in k])"; done
grep -rn "VITE_" .github/workflows/ scripts/*.sh

# 3) 关键：判断「某个 app 有没有被任何工作流覆盖」
grep -rn "<appname>" .github/workflows/    # 0 命中 = 完全无 CI/CD（本轮 ScapeMusic 即如此）

# 4) 验证「路径式深链是否真的打得到」：与确定缺失路径比字节数
#    本轮 1944B == 1944B → 命中 SPA 回落，深链无效
curl -s -o /dev/null -w "path=%{http_code}(%{size_download}B)\n" https://scapemusic.pages.dev/track/bs-s1-01
curl -s -o /dev/null -w "missing=%{http_code}(%{size_download}B)\n" https://scapemusic.pages.dev/definitely-not-here-xyz

# 5) 看硬编码分支是否被测试覆盖：测试里用的值恰好等于硬编码值时 = 只覆盖了「生效」那条路
grep -n "scapemusic.pages.dev" apps/beatscape/src/lib/streamLink.test.ts

# 6) 硬编码生产域名 blast radius（排除 dist 等构建产物，先看它们是否被 gitignore）
for d in apps/beatscape/dist apps/scapemusic/dist-deploy apps/demo/dist-portal; do
  echo "$d tracked=$(git ls-files $d | wc -l)"
done
grep -rnE "https?://[a-zA-Z0-9._-]*pages\.dev" apps/*/src apps/*/public apps/*/e2e apps/*/scripts \
  apps/*/index.html apps/*/package.json | grep -vE "/dist|dist-deploy|dist-portal" \
  | awk -F: '{print $1}' | sort | uniq -c | sort -rn
# 判读：看命中行在「表达式/if」还是「expect/assert」里 —— 前者是陷阱，后者是护栏
```

- **判读纪律（第五次印证「零 ≠ 该补 / 该删」，且比前四次更进一步）**：`VITE_API_BASE` 零注入看着像缺陷，但它只被本阶段明确不做的 NeonBeat 引用 → **不生成待办**。**反过来，「有值」也不等于安全**：`VITE_STREAM_APP_URL` 是有注入的，可它的正确性依赖一个硬编码的域名判等。**因此判据应是「这个变量错了会不会被谁发现」，而不是「它有没有被注入」**——后者只能发现「完全没配」，发现不了「配的值已经不适用了」。
- **另一条**：与上一轮「把『受控 / 已发布 / 已受审』三个集合交叉比对」同源，本轮有效的是**把「变量引用点集合」与「变量注入点集合」交叉比对**。单独看任一边都看不出问题：引用点都有默认值所以「跑得起来」，注入点都有值所以「配过了」。

---

## 运行时外部依赖与字体供应链盘点（2026-09-10 第十六次新增维度）

> 前十五轮**从未盘过「用户浏览器运行时会去连哪些外部主机」**。此前查过「构建期环境变量」（编译期注入什么）与「硬编码生产域名」（自己的域名写死在哪），**但没有一轮问过第三方主机**。本轮以「受控源码中出现的外部域名」为全集，再逐条判读「运行时 / 构建期 / 文档」。

> **状态更新（2026-09-13）**：本节保留 09-10 的盘点快照，但 **BeatScape 已完成候选 1**。它不再请求 Google Fonts，四家族 12 个 Latin/Latin Extended WOFF2 已自托管、随 PWA shell 离线缓存，浏览器守门验证外部字体请求为 0；隐私披露与未来 CSP 的两个 BeatScape 风险随之消失。ScapeMusic / NeonBeat 仍维持本节记录的 CDN 现状，不得把 BeatScape 的结项外推给它们。

### 方法：先取全集，再判「运行时 / 构建期 / 文档」

| 类别 | 数量 | 说明 |
|---|---|---|
| 受控源码中出现的外部域名（已排除自有 `pages.dev` / localhost / schema 类） | **17** | 直接 grep 全集 |
| 其中**运行时**真正发起请求的 | **2**：`fonts.googleapis.com` + `fonts.gstatic.com` | 字体 CSS 与字体文件 |
| 构建期 / 工具脚本 | `raw.githubusercontent.com`（`generate-site-og.mjs`）· `developers.cloudflare.com`（注释） | 不在用户浏览器里跑 |
| 文档 / 归档 | `github.com`（`.delivery/.agent-runs/*` 归档 24 处） | 非运行时 |
| demo 门户测试夹具 | `invited.demo.dev` / `demo.local` / `portal.test` 等 10 个 | 均在 `.test.` 或 `e2e/` 内，非生产 |

> **取舍记录**：第一版把 `tests/.venv/`、`package-lock.json`、`.workbuddy-ai/backups/` 一起扫了，得到 **49 个域名全是噪音**（`registry.npmjs.org` 199 处、`docs.rs` 79 处……）。限定为 `git ls-files` 并排除 `data/` 后只剩 **17 个**，才看得到真正的一条。**扫域名前先定范围，否则信噪比会淹没结论。**

### 本维度核心发现：三款字体 100% 依赖 Google Fonts，且失败是静默的

- `apps/beatscape/index.html:36-51`、`apps/scapemusic/index.html:24-28`、`apps/neonbeat/index.html` **均**从 `fonts.googleapis.com` 加载 **Anton（展示）/ Sora（次级）/ IBM Plex Sans（正文）** 三款字体；`git ls-files | grep -iE '\.(woff2?|otf|ttf)$'` = **0** → **仓库零本地字体文件，完全依赖 CDN**。
- `apps/beatscape/src/styles.css` 有 **10+ 处**把 Anton 写作**首选**展示字体（`font-family: Anton, "Sora", sans-serif`；正文 `font-family: "IBM Plex Sans", system-ui, sans-serif`），回退链末端是 `system-ui`。
- **已做非阻塞加载**（`index.html:40` 注释里写明了动机）：`rel="preload" as="style"` + `onload="this.onload=null;this.rel='stylesheet'"`，并有 `<noscript>` 兜底 → **不会卡首屏**。这一点是加分项，本维度**不主张把它当成 bug**。
- **但失败是完全静默的**：CDN 不可达时 Anton 直接回退 `system-ui`，**没有报错、没有监控、没有任何信号**。Anton 是「漫画硬边」视觉语言的核心展示体（见 [散落待办清单盘点](#散落待办清单盘点2026-09-10-第十二次新增维度) 中 Anton 15 命中 / `halftone` 10 命中），回退后页面照样能玩，只是视觉与基线不一致——**这正是它难被发现的原因**。

### 顺带核对的四条「干净」结论（本轮实测，均为 0 / 全覆盖）

| 检查 | 结果 |
|---|---|
| 受控文件里的 `node_modules` / `dist` / `coverage` 类误提交 | **0** |
| 构建产物目录是否被 gitignore 覆盖 | **8/8 全部 IGNORED**（demo / beatscape / scapemusic / gateway / neonbeat 的 `dist` 及 `dist-deploy`、`dist-portal`） |
| `.env`（非 `.example`）是否曾进入 git 历史 | **0**（`git log --all --diff-filter=A` 无命中；受控的只有 3 个 `.env.example`，`.gitignore:13` 有 `!.env.example` 白名单） |
| 私钥 / `sk-` / `ghp_` / `github_pat_` / `AKIA` / `xox*` 型凭据字面量 | **0** |

> **这四条都不生成待办，仅留档**：**「没有发现问题」本身是本轮的有效结论**，写出来是为了以后不必重复排查。

### 与现有条目的交叉：一个「将来才会炸」的耦合

- `apps/beatscape/public/_headers` **没有 CSP** —— 只有 `Cache-Control` 分组 + `X-Content-Type-Options: nosniff` + `Referrer-Policy` → **当前与 Google Fonts 不冲突**（本轮实测确认；**不得断言成「已被 CSP 阻断」**）。
- 但 `apps/demo/scripts/release.mjs:91` 给门户生成的 CSP 是 `default-src 'none'` 起步，含 **`font-src 'self'` + `style-src 'self' 'unsafe-inline'`**。**若把这套 CSP 复用到 BeatScape / ScapeMusic**：字体 CSS 违反 `style-src 'self'`、字体文件违反 `font-src 'self'` → 字体被**完整阻断**，且因为非阻塞加载 + 静默回退，**同样没有任何报错**。
- 另：`apps/beatscape/src/pages/Legal.tsx:20` 的隐私表述是「不做第三方广告追踪、不请求麦克风 / 通讯录 / 位置」，**未提及字体 CDN**；而每次访问都会向 Google 发起请求（携带 IP / UA）。**本文件只陈述事实，不作法律结论**；是否需在隐私条款中披露，属 P0-3 签审前需确认项。

### 处理意见（登记、不认领、不阻塞）

- **自托管 vs CDN 是产品 / 合规判断，不是缺陷**：三款字体均为 **SIL OFL**（见 `docs/licenses/fonts/` 下的 OFL 文本），自托管在法律上允许；但 Anton + Sora + IBM Plex 全字重自托管会增加首屏资源体积，与已通过的 28 项性能预算存在张力 → **需实测后再定，不认领**。
- 因此只登记三条候选：
  1. （工程）~~评估 BeatScape 三款字体自托管~~ —— **已完成（2026-09-13）**：实际补齐 IBM Plex Mono 后为四家族，12 个子集约 280 KiB；性能规则 50/50、在线/离线双端字体测试通过。
  2. （合规）BeatScape 已无 Google Fonts 请求；ScapeMusic / NeonBeat 是否披露按各自发布签审处理。
  3. （护栏）BeatScape 现满足 `font-src 'self'`；ScapeMusic / NeonBeat 将来若复用门户 CSP，仍须同步放开外域或自托管。

### 判读纪律与可复用手法

- **判读纪律（第六次印证「零 ≠ 该补 / 该删」，且首次把「静默」作为判据）**：本轮遇到两个「零」——**零本地字体文件**与**零凭据泄露**。前者**值得登记**（因为它同时满足「唯一的运行时外部依赖」+「失败静默」），后者**不生成待办**（干净就是干净）。区分标准是：**这个「零」会不会在没人注意的情况下，改变用户实际看到的东西。** 前几轮的「孤儿脚本零引用」「未勾复选框」都属于后者 → 不生成待办。

```bash
# 1) 枚举受控源码里的外部域名（必须先限定 git ls-files 并排除 data/，否则全是噪音）
python3 - <<'PY'
import re,subprocess,collections
files=subprocess.run(['git','ls-files'],capture_output=True,text=True).stdout.split()
OWN=('pages.dev','localhost','127.0.0.1','example.com','schema.org','w3.org','sitemaps.org','invalid')
dom=collections.Counter()
for p in files:
    if '/node_modules/' in p or p.startswith('data/'): continue
    try: s=open(p,encoding='utf-8',errors='ignore').read()
    except: continue
    for m in re.findall(r'https?://([A-Za-z0-9._\-]+)',s):
        if not m.lower().endswith(OWN): dom[m.lower()]+=1
PY
# 判「运行时 vs 构建期」：命中文件在 src/ 或 index.html → 运行时；在 scripts/、.delivery/ → 非运行时

# 2) 判字体是不是真的没有本地副本（0 命中 = 完全依赖 CDN）
git ls-files | grep -iE '\.(woff2?|otf|ttf)$'

# 3) 凭据 / 卫生扫描（只报路径，输出必须脱敏，不得把字面量写进任何文件）
git log --all --diff-filter=A --name-only --format="%h" -- '.env' '*/.env'
git grep -n -I -E "BEGIN (RSA |EC |OPENSSH |PGP )?PRIVATE KEY" -- .
git grep -n -I -E "(sk-[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{30,}|AKIA[0-9A-Z]{16})" -- .

# 4) 判 CSP 会不会误伤第三方资源：先看自己的 _headers 有没有 CSP，再对比门户那套 font-src 'self'
grep -n "font-src\|Content-Security-Policy" apps/beatscape/public/_headers apps/demo/scripts/release.mjs
```

---

## Cloudflare Pages 路由与缓存配置盘点（2026-09-10 第十七次新增维度）

> 前十六轮查过构建期变量、硬编码域名、运行时外部依赖，但**从未查过 Cloudflare Pages 自己的路由与缓存配置文件**（`_redirects` / `_headers` / `wrangler.toml`）。这些文件决定了「构建产物上线后如何被路由和缓存」，是介于源码与线上产物之间的关键层。本轮首次枚举三个 app 的 CF Pages 配置文件，五条结论均有可操作价值。

### 文件清单

| App | `_redirects` | `_headers` | `wrangler.toml` |
|---|---|---|---|
| **BeatScape** | ✅ `/* /index.html 200`（76 B） | ✅（1,709 B，10 条规则） | ✅（极简 4 行：name / date / output_dir） |
| **ScapeMusic** | ❌ **不存在** | ❌ **不存在** | ❌ **不存在** |
| **Demo** | ❌（不在 `public/`） | ✅ 在 `dist-portal/_headers`（构建产物目录，非源控） | ❌ |

### 五条结论

#### (a) `_redirects` `/* /index.html 200` 是 `/release.json` 返回 SPA HTML 的机制

- BeatScape 的 `_redirects` 只有一行：`/*    /index.html   200`。Cloudflare Pages 按顺序匹配：先找静态文件，找不到的路径全部回退到 `/index.html` 并返回 **200**（不是 404）。
- **这就是 `/release.json` 返回 2146 B SPA HTML 的原因**——不是「文件不存在返回 404」，而是「被 `_redirects` 规则捕获后返回 index.html」。此前各轮只观察到现象（字节数相同），本轮定位了机制。

#### (b) `release.json` 是构建产物，本地有 61,500 B，线上从未部署

- `apps/beatscape/scripts/release.mjs:113` 在 `release:check` 阶段往 `dist/` 写入 `release.json`（含 `schema` / `sourceCatalogSha256` / `artifactSha256` / `files` 四字段，是对全部 dist 文件的 SHA256 清单）。
- 本地 `dist/release.json` 实存 **61,500 B**；线上 `/release.json` 返回 **2146 B**（= SPA 回落页）→ **生成它的那次构建从未被部署**。
- **这比此前用「bundle 缺某字符串」当证据更干净**：不需要先 `git log -S` 验证字符串引入时间——`release.json` 是构建过程本身的产物，它的在线缺失直接等于「带 `release:check` 的构建从未部署过」。

#### (c) `_headers` 在 `8b710a3` 修改，晚于最后成功部署 → 线上 cache-control 是旧版本

- `_headers` 最后一次 commit 是 **`8b710a3`**（2026-09-05 16:06 +0800），而最后一次成功部署 head 是 **`ffe1ec0`**（2026-09-05 00:31 +0800）→ **线上跑的是 `ffe1ec0` 版本的 `_headers`**，仓库里的 `8b710a3` 版从未上线。
- **可测量的差异**：

| 路径 | 线上（`ffe1ec0` 版） | 当前仓库（`8b710a3` 版） |
|---|---|---|
| `/catalog.json` | `max-age=300`（5 分钟） | `max-age=0, must-revalidate` |
| `/catalog/*` | `max-age=2592000`（30 天） | `max-age=0, must-revalidate` |
| `/*`（安全头） | **无**（`ffe1ec0` 版没有全局 `nosniff` / `referrer-policy`） | 有 `nosniff` + `strict-origin-when-cross-origin` |
| `/release.json` | **无规则**（`ffe1ec0` 版没有此条） | `no-cache` |

- 实测线上 `catalog.json` 响应头确实返回 `cache-control: public, max-age=300, must-revalidate`（与 `ffe1ec0` 版一致），**而非**当前仓库的 `max-age=0`。线上同时有 `x-content-type-options: nosniff` 和 `referrer-policy: strict-origin-when-cross-origin`，但 `ffe1ec0` 版 `_headers` 没有这些——它们可能是 Cloudflare Pages 平台默认添加的。
- **结论：部署债务不只影响 JS 代码，还影响缓存策略与安全头**。一旦部署恢复，线上 cache-control 会从「5 分钟」骤变为「每次都回源」（`max-age=0`），可能影响回访性能。

#### (d) ScapeMusic 零 CF Pages 配置文件

- `find apps/scapemusic/ -name '_redirects' -o -name '_headers' -o -name 'wrangler.toml'` → **全部 No such file or directory**。
- ScapeMusic 完全依赖 **Cloudflare Pages 的默认 SPA 回落**（找不到静态文件时自动返回 `index.html`），没有显式路由规则。
- **也没有缓存头** → 所有 ScapeMusic 资产（含上一轮发现的 `trials/` 下 5 个 m4a）使用 Cloudflare 默认缓存策略，无法自定义。
- **没有安全头** → 无 `nosniff` / `referrer-policy` / CSP。是上一轮「trials/ m4a 能上线」成因的又一佐证：不只是没有 CI/CD 管道，连最基本的 CF Pages 配置文件都没有。

#### (e) 仅 BeatScape 有 `wrangler.toml`，Demo 门户 CSP 在构建产物目录

- BeatScape 的 `wrangler.toml` 极简（4 行：`name = "beatscape"` / `compatibility_date = "2026-08-26"` / `pages_build_output_dir = "dist"` + 注释），不含任何自定义配置。
- Demo 门户的完整 CSP（`default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; media-src 'self'; font-src 'self'; ...`）在 `apps/demo/dist-portal/_headers`——**这是构建产物目录**（已 gitignore），不是源控文件。意味着 CSP 的源在构建脚本（`apps/demo/scripts/release.mjs`）里生成，而非直接维护。

### 判读纪律与可复用手法

- **判读纪律（与上轮同源）**：**配置文件的「线上版本」≠ 「仓库版本」**。此前各轮只查仓库里的文件，本轮首次把仓库版本与线上实测对比，立刻发现 cache-control 差异。通用规则：**凡是「最后一次修改时间晚于最后一次成功部署」的配置文件，线上版本必然落后**——这不需逐字对比内容，只需 `git log -1 --format=%ai -- <file>` 与部署时间比一下。
- **不生成待办**：`_headers` 版本差异会在 P0-6 部署恢复后自动解决（因为 `8b710a3` 版 `_headers` 已在仓库里，下次部署就会带上）。ScapeMusic 缺 CF 配置文件属 P1-1「流媒体终点」拍板后的工程选型，不认领。

```bash
# 1) 枚举三个 app 的 CF Pages 配置文件
find apps/ -name '_redirects' -o -name '_headers' -o -name 'wrangler.toml' -o -name 'wrangler.jsonc' \
  | grep -v node_modules | sort

# 2) 判「仓库版本 vs 线上版本」是否一致：对比 _headers 最后修改时间与最后一次成功部署时间
git log -1 --format="%H %ai %s" -- apps/beatscape/public/_headers
# 最后成功部署 head 是 ffe1ec0（09-05 00:31 +0800）；_headers 最后改于 8b710a3（09-05 16:06 +0800）→ 线上是旧版

# 3) 看 ffe1ec0 版 _headers 长什么样（线上实际跑的版本）
git show ffe1ec0:apps/beatscape/public/_headers

# 4) 实测线上 catalog.json 的 cache-control（应与 ffe1ec0 版一致，而非当前仓库版）
curl -sS -x http://127.0.0.1:7897 -D - -o /dev/null https://beatscape.pages.dev/catalog.json | grep -i cache-control

# 5) 确认 release.json 是构建产物（在 dist/ 里但不在 public/ 里 = 构建时生成）
ls -la apps/beatscape/dist/release.json apps/beatscape/public/release.json
# 期望：dist/ 有（61,500 B），public/ 无

# 6) 确认 ScapeMusic 没有 CF 配置文件
ls -la apps/scapemusic/public/_redirects apps/scapemusic/public/_headers apps/scapemusic/wrangler.toml
# 期望：全部 No such file or directory
```

---

## i18n 与文案清单盘点（2026-09-10 第十八次新增维度）

> 前十七轮**从未盘过多语言**。此前查过「构建期变量」「运行时外部依赖」「CF 路由缓存」，但没有任何一轮问过「UI 文案到底有多少进了 i18n、另一套 locale 用户能不能走到」。本轮以「定义的 key 集合 / 被引用的 key 集合 / 可达的 locale 集合」三组交叉比对实测。**结论不是「中文没翻译完」，而是「多语言的接线度只有 25%，且第二 locale 根本不可达」——这个成本差了一个数量级，之前没人量过。**

### 三组集合的交叉比对

| 集合 | 数量 | 说明 |
|---|---|---|
| 定义的文案 key（`en.ts` / `zh.ts` 各 40 个叶子） | **40** | 两个命名空间：`leaderboard` 9 · `ui` 31 |
| **真正被接线引用的 key** | **10**（均 `t.ui.*`） | `preview`×2 · `tier` · `seeAll` · `mode` · `meetNightshift` · `library` · `featuredInScape` · `favorited` · `favorite` · `exploreCity` · `browseTracks` |
| 使用 i18n 的页面 | **2 / 15**（`Home` · `Track`） | 外加 1 个组件 `TrackAudioPreview`；其余 13 个页面文案**硬编码英文** |
| 运行时可达的 locale | **1 / 2**（仅 `en`） | 见下 |

> **一处易误判**：`grep -oE "t\.[A-Za-z0-9_.]+"` 在 src 里能抓到 20+ 个不同 key，但**绝大多数不是 i18n 的 `t`**——`t.track_id`(15) / `t.title`(5) / `t.genre`(4) / `t.bpm`(2) / `t.meanMs` / `t.early` 等是遍历曲目对象与计时数据的同名局部变量。**只有 `t.ui.*` / `t.leaderboard.*` 才是 i18n**，逐个回看命中行才能区分（与第十六次「扫域名必须先定范围」同源）。

### (a) `leaderboard` 命名空间：零调用点，却有 2 个单测

- `i18n/leaderboard.test.ts` 与 `i18n/i18n.test.ts` 都断言了 `leaderboard` 相关条目（`leaderboard.test.ts:19` 甚至断言 zh 的 `emptyState` 不等于 en 的），**但 `leaderboard.*` 在整个 `src/` 里零引用**——`grep -rn "emptyState\|leaderboard\.(title\|subtitle)" apps/beatscape/src | grep -v src/i18n/` 无命中。
- `pages/Leaderboard.tsx` **根本没有 import i18n**（`grep -n "i18n\|getMessages"` 无命中），排行榜页的文案是硬编码英文。
- **性质判定**：这是**「有测试无调用方」**，与第十三次「有测试（e2e）但没在 CI 跑」是同一族——**测试给了「这块有人管」的假安全感，但没人真正用它**。区别是 e2e 至少还会在部署时跑一次，`leaderboard.*` 是**彻底没人调用**。

### (b) `zh` locale 运行时不可达（本维度最反直觉的一条）

四条独立证据，全部实测：

| 判据 | 实测结果 |
|---|---|
| `getMessages()` 调用点是否传 locale | **3 个调用点全部不传参**（`Home.tsx:62` · `Track.tsx:18` · `TrackAudioPreview.tsx:13`）→ 恒取 `DEFAULT_LOCALE = "en"` |
| 有无语言切换入口 | `Settings.tsx` grep `language\|语言\|locale\|中文\|English` **0 命中**；全仓无 `setLocale` |
| 有无浏览器语言自动探测 | `grep -rn "navigator.language\|navigator.languages\|Accept-Language"` 跨 `apps/*/src` 与 `index.html` → **NONE** |
| HTML lang 属性 | `apps/beatscape/index.html:2` 与 `apps/scapemusic/index.html:2` 均为硬编码 `<html lang="en">` |

- **因此**：`zh.ts` 的 40 条中文文案**在运行时没有任何路径能到达**，唯一会读到它的是 `i18n.test.ts:30`（`getMessages("zh").ui.pause`）与 `leaderboard.test.ts` 这两个测试。
- **但这不是 bug**：`zh.ts:3` 的 docstring 自己写明「阶段一用 zh 做第二语言占位；完整 UI 翻译在后续里程碑补齐」，且英文是对外发布语言（P0-4 英语叙事真人试玩）。**有意设计 ≠ 缺陷，不生成待办。**

### (c) `zh.ts` 有 7 个值仍是英文，且 shape-parity 测试查不出来

| key | zh 的值 | 判读 |
|---|---|---|
| `leaderboard.title` | `Local Board` | 整句未翻译（但该命名空间零调用） |
| `leaderboard.subtitle` | `This device only — no global upload in Stage 1–3.` | **整句未翻译**（同上） |
| `leaderboard.columns.rank` | `#` | 符号，属正常 |
| `leaderboard.columns.track` | `Track` | 短标签，疑似有意沿用 |
| `leaderboard.columns.score` | `Score` | 同上 |
| `leaderboard.columns.accuracy` | `Acc` | 缩写，同上 |
| `leaderboard.columns.name` | `Name` | 同上 |

- **测试为什么没抓到**：`i18n.test.ts:22` 的用例名写的是「en and zh have identical key shape (CI guard against dropped translations)」，但它只递归比对 **key 路径**（`keyPaths(en)` vs `keyPaths(zh)`），**完全不比对 value**。所以「key 在、值是英文」这种情况 CI 永远全绿。
- `leaderboard.test.ts:19` 是唯一比对 value 的断言，但它**只测了 `emptyState` 一个 key** —— 而 `emptyState` 恰好是 `leaderboard` 命名空间里**唯一译了的**（「暂无成绩……」）。**测试选中了唯一正确的那个，于是永远通过。**

### 判读：不生成「补中文」待办，但把真实成本写清楚

- **拒绝生成**：「翻译 7 条文案」「给 Settings 加语言切换」——英文是发布语言、`<html lang="en">` 硬编码、`zh.ts` 自述占位，**现状是有意设计**（第七次印证「零 ≠ 该补 / 孤儿 ≠ 该删 / 未勾 ≠ 没做」：这次是「未接线 ≠ 漏做」）。
- **本维度真正留下的价值**：如果将来有人（例如 P1-1「经营主体 / 目标市场」拍板面向中文市场）问「补中文要多久」，**从本文件任何一处看都像「翻 7 句英文」的小活**；实测的真实范围是 **13 个页面的硬编码文案先抽进 i18n + 补切换入口 + 补 lang 属性**，量级差约一个数量级。**这是给未来决策的成本提示，不是待办。**
- **另一条可复用判读**：`leaderboard.*` 这种「有测试无调用方」，与第十三次「有测试没在 CI 跑」共同指向同一条规则——**判断一块代码/文案是否真的被保障，要问「谁在运行时到达它」，而不是「有没有测试提到它」。**

### 可复用手法

```bash
# 1) 定义 vs 接线：比对 en.ts 的叶子 key 与 src 里真正引用的 t.ui.* / t.leaderboard.*
python3 - <<'PY'
import re
def load(p):
    s=open(p,encoding='utf-8').read()
    return dict(re.findall(r'^\s*([A-Za-z0-9_]+):\s*"((?:[^"\\]|\\.)*)"',s,re.M))
en=load('apps/beatscape/src/i18n/en.ts'); zh=load('apps/beatscape/src/i18n/zh.ts')
print('defined',len(en),'| zh==en (未翻译/有意相同):',[k for k in en if en.get(k)==zh.get(k)])
PY
grep -rhoE "\bt\.(ui|leaderboard)\.[A-Za-z0-9_.]+" apps/beatscape/src | sort -u   # 真正接线
# ⚠️ 注意：t.track_id / t.title / t.bpm 等是遍历曲目的同名局部变量，不是 i18n，必须回看命中行

# 2) 某个命名空间是否真的有调用方（排除 i18n/ 自身后 0 命中 = 死命名空间）
grep -rn "emptyState\|leaderboard\.(title\|subtitle)" apps/beatscape/src | grep -v "src/i18n/"
grep -n "i18n\|getMessages" apps/beatscape/src/pages/Leaderboard.tsx   # 页面是否真的接了

# 3) locale 是否可达：调用点传不传参 + 有无切换入口 + 有无自动探测 + lang 属性
grep -rn "getMessages(" apps/beatscape/src                       # 全部无参 = 恒用 DEFAULT_LOCALE
grep -rn "navigator.language\|Accept-Language" apps/*/src apps/*/index.html
grep -n "lang=" apps/beatscape/index.html apps/scapemusic/index.html
grep -niE "language|语言|locale" apps/beatscape/src/pages/Settings.tsx

# 4) 关键：parity 测试比的是「key 形状」还是「value」
grep -n "keyPaths\|toEqual\|not.toBe" apps/beatscape/src/i18n/i18n.test.ts
# → 只比 keyPaths = 值未翻译也能全绿；只有 leaderboard.test.ts 比了 value，且只比了 1 个 key
```

- **判读纪律（第七次印证「零 ≠ 该补 / 该删」）**：本轮三个「零」——**零 locale 切换入口**（有意设计，不生成待办）、**零 `leaderboard.*` 调用方**（留档，说明测试给了假安全感）、**零中文可达路径**（同前者）。**区分标准是「这个零是有意的还是漏的」**——`zh.ts:3` 的 docstring 直接回答了这个问题。**先找文档里的自述意图，再决定要不要登记。**
- **另一条（与第十五次「测试存在 ≠ 覆盖会变的地方」同源但角度不同）**：`leaderboard.test.ts:19` 断言 `zh.emptyState !== en.emptyState`，而 `emptyState` 恰是 `leaderboard` 里唯一译了的 key → **测试挑了一个必然通过的对象**。判据：**看测试选中的样本是不是「唯一正确的那个」**，若是，则该测试对整体质量没有约束力。

---

## 依赖与运行环境清单盘点（2026-09-10 第十九次新增维度）

> 前十八轮盘过源码、资产、工作流、环境变量、外部域名，但**从未核对过「声明的依赖」与「代码里实际的引用」是否对得上**。本轮分 Node / Python 两侧实测。

### Node 侧：零幽灵依赖，「未被引」全是工具链

| 包 | 声明数 | 幽灵依赖（import 了却未声明） | 「声明了却从未 import」 |
|---|---|---|---|
| `apps/beatscape` | 9 | **0** | `@types/react` · `@types/react-dom` · `typescript` |
| `apps/scapemusic` | 8 | **0** | 同上 |
| `apps/demo` | 10 | **0** | 同上 + `@types/node` · `tsx` |
| `apps/gateway` | 12 | **0** | `@types/node` · `prisma` · `tsx` · `typescript` |
| `apps/neonbeat` | 8 | **0** | 同上 react 系 3 项 |
| 根 `package.json` | **0** | — | **无任何 dependencies**，只有 30+ 个 scripts |

- **零幽灵依赖是预期之内的**：pnpm 的严格 `node_modules` 下，import 一个未声明的包会立刻解析失败，不可能长期存活 → **这条不算成果，只是把「不用担心」确认下来**。
- **那 9 项「声明未 import」全是假的**：`@types/*` 经 tsconfig 生效、`typescript` 经 `tsc` 生效、`tsx` 是运行器、`prisma` 是 CLI → **拒绝生成「清理未使用依赖」待办**（第八次印证「清单 ≠ 该清」）。

### Python 侧：三分局面，且缺口精确落在 CI 之外

| 目录 | 需要的第三方包 | 有 requirements？ |
|---|---|---|
| `scripts/`（**内容生产链**，全仓 82 个受控 `.py` 的绝大多数） | **17 个**：`torch` · `diffusers` · `transformers` · `accelerate` · `PIL` · `peft` · `datasets` · `torchvision` · `wandb` · `xformers` · `bitsandbytes` · `safetensors` · `huggingface_hub` · `tqdm` · `packaging` · `mlx` · `mlx_lm` · `acestep` | ❌ **无** |
| `tests/` | `pytest` · `httpx` · `fastapi` · `numpy` | ✅ `tests/requirements.txt` |
| `workers/ace-step`、`workers/sa3` | `fastapi` · `uvicorn` · `numpy` | ✅ 各一份（**内容逐行相同**） |

- **`scripts/` 是唯一没有依赖声明、且恰好是最大的一面。** 根 `package.json` 把它其中约 15 个脚本暴露成 `pnpm` 命令（`ingest:*` / `pipeline:*` / `regenerate:*` / `stitch:*` / `earcheck:beatscape` / `audit:*` / `catalog:*` / `harness` / `acceptance` …），却没有任何地方记录跑它们需要什么环境。
- **但必须说清楚：这不影响 CI。** 实测 7 条工作流的 yml 里 `grep "pip install\|requirements.txt"` **零命中**；Python 依赖只在 `scripts/harness.sh:34-40` 的 `ensure_py_env` 里安装（自建 `tests/.venv`，装 `tests/` + `workers/ace-step` 两份），**仅服务 unit / integration / e2e 三个 tier**。CI 的 `beatscape` job **不经过 harness.sh**，是 `setup-python@v5` 之后直接 `python3` 跑脚本。
- **因此逐个查了 CI 实际执行的那 3 个脚本的 import**（`beatscape-audit.py` 859 行 / `beatscape-catalog-status.py` 171 行 / `beatscape-earcheck.py` 114 行）→ **全部 100% 标准库，连 numpy 都没有** → `scripts/` 缺 requirements **完全落在 CI 之外，当前零影响**。

### 本维度最有价值的一条：一条没人记录、且极易踩的隐藏约束

- **那 3 个脚本必须永远保持纯标准库。** CI 的 beatscape job 用**裸 `python3`**（无任何依赖安装）跑它们，而开发机上装着 torch/numpy 全套 → **一旦有人给 `beatscape-audit.py` 加一句 `import numpy`，本地跑得好好的，CI 会立刻红**，且现有流程没有任何环节会提前拦住（没有 lint 规则，CI 里也没有注释说明）。
- 处理意见：**不生成待办，只在此留档**——补一条 CI 注释或文档说明的成本极低，但它属工程约定而非缺陷，且当前无人踩到。

### 顺带查实的两条次要事实

- `mlx` / `mlx_lm` / `acestep` **仅出现在 `scripts/mac-ace-verify.py`** → 内容生产链的这一环**绑定 Apple Silicon**（MLX 是 Apple 芯片专有框架），换机器无法复现。
- `workers/sa3/requirements.txt` **从未被任何自动化安装**（`harness.sh` 只装 ace-step 那份），但两份**逐行相同**（fastapi / uvicorn / numpy 同版本）→ **无实际缺口，仅留档**。

### 可复用手法

```bash
# 1) Node 侧：把「声明集合」与「引用集合」交叉比对，幽灵依赖与未使用依赖一次出来
#    import specifier → 包名：@scope/x/y 取前两段，其余取第一段
#    判「假未使用」：@types/* · typescript · tsx · prisma 都是经 tsconfig/CLI 隐式使用的工具链

# 2) Python 侧：按目录聚合第三方 import（必须先排除标准库，否则全是噪音）
git ls-files '*.py' | xargs grep -hoE "^\s*(import|from)\s+[A-Za-z_][A-Za-z_0-9]*" | sort | uniq -c | sort -rn

# 3) 关键：判「缺口是否真的会炸」——先查有没有人安装这些依赖
grep -rn "pip install\|requirements.txt" .github/workflows/     # 本轮 0 命中 ≠ 没人装
grep -n "ensure_py_env" -A 8 scripts/harness.sh                 # 真正的安装点在 harness 里，且有 venv 缓存分支

# 4) 收口验证：把 CI 实际执行的那几个脚本的 import 全列出来，确认是否纯标准库
for f in scripts/beatscape-audit.py scripts/beatscape-catalog-status.py scripts/beatscape-earcheck.py; do
  grep -hoE "^\s*(import|from)\s+[A-Za-z_][A-Za-z_0-9]*" "$f" | sort -u | tr '\n' ' '; echo
done
```

- **判读纪律（第八次印证）**：本轮的「零幽灵依赖」与「9 个未使用依赖」**都不生成待办**——前者是 pnpm 严格链接的必然结果，后者是工具链的隐式使用。**看到一份「未使用」清单，先问「这类东西是不是本来就不该出现在 import 里」。**

---

## 可访问性与社交预览资产盘点（2026-09-10 第二十次新增维度）

> 前十九轮从未查过可访问性（a11y）与动效偏好，也从未验证 `index.html` 里那些分享 / OG 资产是否真的在线。本轮一次做完。

### a11y 基线：实测干净，据此不生成待办

| 项 | 实测值 | 判读 |
|---|---|---|
| `aria-*` 属性 | **87 处**（`aria-label` 39 · `aria-hidden` 33） | 已系统标注，不是零 |
| `role=` | 15 处 | — |
| `:focus-visible` / `outline` | **12** / 8 处 | 键盘焦点可见 |
| `@media (prefers-reduced-motion: reduce)` | **12 个块**（另有 `animation` 49 · `transition` 28 · `@keyframes` 19） | **动效降级是真的覆盖了**，不是只写一处装样子 |
| `<button>` vs `onClick` | **38** / 48 | 绝大多数交互用真按钮 |
| 无语义可点击非按钮元素 | **0 处**（2026-09-12 复核） | 原开始页缺口已修复；AudioBar slider 有完整语义 |
| `index.html` 静态 meta | description · canonical · og:type/title/description/url/image/image:alt · twitter:card/title/description/image | **不依赖 JS 注入**，爬虫与抓取器可直接读取 |

- ✅ **开始页可点击非按钮已于 2026-09-12 清零**：删除 Play `.overlay-tap` 与 Duo `.duo-start` 背景的 `onClick`，各自保留语义完整、键盘可达的真按钮作为唯一启动入口；同时补防双触发、音频拒绝可重试与失败后全屏回滚。desktop / Pixel 7 静态扫描与 E2E 均覆盖，背景误触现在不会开局。
- **处理结论**：不采用 `role="button"` 包真按钮的嵌套交互方案；单一真按钮既满足键盘与辅助技术，也避免整屏隐形热区和重复 activation path。

### 社交预览资产：`og.png` 线上不存在（本轮最有价值的一条）

- **实测**：本地 `apps/beatscape/public/og.png` 存在且已受控（**1,200×630**、39,195 B，与 `index.html` 声明的 `og:image:width/height` **完全吻合**）；但 `https://beatscape.pages.dev/og.png` 返回 **200 + 2146 B `text/html`**，与一个确定不存在的路径**字节数完全相同** → **SPA 回落页，该文件线上并不存在**。
- **成因（已按纪律溯源，不敢凭「线上没有」直接下结论）**：`git log -1 --format=%h -- apps/beatscape/public/og.png` = **`8b710a3`（2026-09-05 16:06 +0800）**，而最后一次成功部署 head 是 `ffe1ec0`（2026-09-05 00:31 +0800）→ **该图进入仓库的时间比最后一次成功部署晚约 15.5 小时，从未有过部署机会**。
- **因此它是 P0-6 的症状、不是独立缺陷**，已在 P0-6 与 P3 两处登记，**不单开待办**。
- **影响面值得单独说**：`og:image` / `twitter:image` 是 Reddit、X、Discord、Slack 生成分享卡片的唯一来源 → **当前所有站外分享都拿不到图片**。对 P3（Reddit 首发）而言这是**发帖前必验项**。

### 同源证据：线上 `sitemap.xml` 是旧版（缺 `/shift` 一行）

```bash
curl -s https://beatscape.pages.dev/sitemap.xml -o /tmp/sm.xml && diff /tmp/sm.xml apps/beatscape/public/sitemap.xml
# 6a7
# >   <url><loc>https://beatscape.pages.dev/shift</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>
```

- 线上 **911 B** vs 本地 **1,025 B**，**只差这一行**；该文件最后由 `735208b`（09-05 21:51）修改，同样晚于最后一次成功部署 → 线上跑的是部署时的旧版。
- `robots.txt` 线上 133 B 与本地一致（部署前已存在），**无差异**。
- **判读意义**：这把「线上落后」从「JS 代码」进一步精确到**静态资产层面**，而且**逐文件结论不同**——`catalog.json` 最新、谱面最新、`robots.txt` 一致、`sitemap.xml` 落后一行、`og.png` 完全不存在。**再次印证第八次的教训：「线上内容落后」必须分文件断言，合成一句必然出错。**

### 可复用手法

```bash
# 1) a11y 基线（一次看出有没有系统做过，而不是只写了 1 处）
for p in "aria-" "role=" "alt=" "tabIndex" "prefers-reduced-motion" ":focus-visible"; do
  echo "$p: $(grep -ro "$p" src src/styles.css | wc -l)"; done

# 2) 找「可点击但不是按钮」的元素（真 a11y 缺口，比数 aria 更有用）
grep -rn '<div[^>]*onClick' src            # 本轮 1 处：Duo.tsx:326

# 3) 分享 / OG 资产是否真的在线：与一个确定不存在的路径比字节数
curl -s -o /dev/null -w "%{http_code} %{size_download} %{content_type}\n" https://beatscape.pages.dev/og.png
curl -s -o /dev/null -w "%{http_code} %{size_download} %{content_type}\n" https://beatscape.pages.dev/nope-xyz-9999.png
# 同字节 + text/html = SPA 回落 = 文件不存在

# 4) 判「线上是旧版」而不是「线上坏了」：直接 diff
curl -s https://beatscape.pages.dev/sitemap.xml -o /tmp/sm.xml && diff /tmp/sm.xml public/sitemap.xml

# 5) 溯源（下任何断言之前）：该资产什么时候进的仓库？比最后一次成功部署晚吗？
git log -1 --format='%h %ad' --date=iso -- <资产路径>
git log -1 --format='%h %ad' --date=iso ffe1ec0
```

- **判读纪律（第九次印证「清单 ≠ 该补 / 零 ≠ 该补」）**：本轮两个结论**都不生成待办**——**a11y 基线干净**（干净就是干净，写出来是为了以后不必重复排查），**`og.png` 缺失**（是 P0-6 的症状，解法在 P0-6）。**判断标准是「这个缺口有没有独立的解法」**：`og.png` 再补一张图也没用，只有部署通了它才会出现 → 归到 P0-6，不新开条目。

---

## 运行时错误可观测性与崩溃兜底盘点（2026-09-11 第二十一次新增维度）

> 前二十轮查过构建期变量、运行时外域、CF 路由、a11y，却**从未问过「线上崩了之后谁能知道」**。本轮以「兜底 → 接管 → 上报 → 可调试性」四层逐层实测。

### 四层实测结果

| 层 | 实测值 | 判读 |
|---|---|---|
| **① 崩溃兜底（ErrorBoundary）** | BeatScape **1 个**（`components/ErrorBoundary.tsx`，`App.tsx:44/68` 包在 Router 外）；**ScapeMusic / Demo / NeonBeat 各 0 个** | BeatScape **已上线且生效**：引入 commit `51489b3`（09-01 12:12），`git merge-base --is-ancestor` 确认是最后成功部署 `ffe1ec0` 的**祖先**，线上 bundle 实测 `grep -c "Signal lost"` = **1**。ScapeMusic 线上 bundle（`index-DwW6K_-S.js`，264,752 B）`Signal lost` **0 命中** |
| **② 全局错误接管** | `window.onerror` / 窗口级 `addEventListener('error')` / `unhandledrejection` **全仓 0 命中** | 唯一 1 处命中是 ScapeMusic `playerContext.tsx:292` 给 `<audio>` 元素挂的 error 监听（**不是全局接管**）。→ **渲染期之外的异步异常、Promise rejection、资源加载失败全部无人接管** |
| **③ 错误上报** | **零上报端点**；全仓 `console.error` 仅 **1 处**（BeatScape `ErrorBoundary.tsx:25`），ScapeMusic 5 处 | 与第十六次维度交叉印证：受控源码 17 个外部域名里**运行时真正发起请求的只有 Google Fonts** → **没有任何监控 / 遥测** |
| **④ 可调试性（sourcemap）** | 3 个 app 的 vite config **均未配 `sourcemap`**（默认 false）；`dist/assets/*.map` **0 个**、git 受控 `.map` **0 个**、线上 `.map` 均返回 SPA 回落页（BeatScape 2146 B / ScapeMusic 1944 B） | **一面干净：不泄露源码**（无 source-exposure 风险）；**一面为零：无任何生产可调试性** |
| 附：静默吞异常 | 45 个 `catch` 中**空 catch 为 0**（`grep -E "catch\s*\{\s*\}"` = 0） | **干净，不生成待办** |

### 本维度最有价值的一条：已上线产品对真机错误是「全盲」的

- **③ + ④ 合成**：既无错误上报、也无 sourcemap，且**全局无接管** → **用户真机上发生任何非渲染期异常，开发侧拿不到任何信息**；唯一取证途径是「用户手动打开 devtools 抄 console」。
- **对 P0-4「英语叙事真人试玩」的直接冲击（此前无人记录）**：试玩的设计目的就是让真人在真实设备上跑一遍英语叙事流程；而**当前若发生崩溃，没有任何取证手段**，只能依赖用户口述复现。已在 P0-4 登记为前置确认项。
- **另一条此前不可见的**：ScapeMusic 已是**公开可访问**的线上产品（第十四次已实测 `scapemusic.pages.dev/trials/*.m4a` 全部 200），却**零崩溃兜底** → 任何渲染期异常即白屏，且**连一句提示都没有**。

### 判读纪律（第九次印证「零 ≠ 该补」）

- **不生成待办的「零」**：第 ④ 层的「零 sourcemap」**不能**单独当成「该开 sourcemap」——它同时意味着**不泄露源码**，开不开是安全与可调试性的权衡，**需用户判断**。空 catch 为 0 同样是干净结论。
- **值得登记的「零」**：只有**会改变「能否发现用户遇到的问题」**的那几个（②③ + ④ 的可调试性一半）。
- **(b) ScapeMusic 零兜底为何不是中性事实**：依据是**本项目自己的判准**——`ErrorBoundary.tsx:9` 的 docstring 明确写着「改造前项目里一个错误边界都没有……用户看到的是一片纯白，连『发生了什么』都无从得知」。即**「白屏无兜底」已被本项目定义为不可接受**，因此 ScapeMusic 的现状属于偏离自建标准，而非单纯的「还没做」。
- **处理意见**：合并登记为 **1 条候选**（「是否补 ScapeMusic 崩溃兜底 + 是否引入错误上报 / sourcemap」），**不认领、不阻塞**——属工程与产品权衡。

### 可复用手法

```bash
# 1) 崩溃兜底：有没有 ErrorBoundary，且是否真的包在根上
grep -rn -E "ErrorBoundary|componentDidCatch|getDerivedStateFromError" apps/*/src
# → BeatScape 7 命中（3 个文件）；scapemusic/demo/neonbeat 各 0

# 2) 关键：兜底到底上没上线？先溯源引入时间，再直接 grep 线上 bundle
git log -1 --format='%h %ad %s' --date=iso -- apps/beatscape/src/components/ErrorBoundary.tsx
git merge-base --is-ancestor <该commit> ffe1ec0 && echo "已在部署内" || echo "晚于部署"
curl -s -x http://127.0.0.1:7897 https://beatscape.pages.dev/assets/<bundle>.js | grep -c "Signal lost"
# ⚠️ 只查源码会得出「有兜底」，但必须再查线上，否则不知道用户实际有没有

# 3) 全局错误接管（注意排除元素级监听的假阳性）
grep -rn -E "window\.onerror|addEventListener\(.error.|unhandledrejection" apps/*/src apps/*/index.html

# 4) 静默吞异常：空 catch 数量
grep -rn -E "catch\s*\{?\s*\}" apps/beatscape/src | wc -l

# 5) sourcemap 三连问：配置 / 产物 / 线上是否暴露
grep -n "sourcemap" apps/*/vite.config.ts          # 均无 = 默认 false
ls -1 apps/beatscape/dist/assets/*.map 2>/dev/null | wc -l
git ls-files | grep -c "\.map$"
curl -s -o /dev/null -w "%{http_code} %{size_download}\n" -x http://127.0.0.1:7897 \
  https://beatscape.pages.dev/assets/<bundle>.js.map   # 2146 B = SPA 回落 = 不存在
```

---

## 曲库资产引用完整性盘点（2026-09-11 第二十二次新增维度）

> 前二十一轮在资产维度上只做过一个方向：第十四次查的是「**磁盘上有、但没被 catalog 声明**」（`trials/` 5 个 m4a 已上线可下载）。本轮做**反方向**——「**catalog 声明了的，磁盘 / 线上是否真的都有**」。两条结论：完整性 100% 干净；`preview` 覆盖 25/105 但**溯源后确认不是遗漏**。

### (a) 引用完整性：四个「0」，据此不生成待办

| 检查项 | 实测 | 结论 |
|---|---|---|
| 105 首 × `audio` / `cover` / `stream_audio` / `og` | 各 **105 / 105** 存在，**缺失 0** | ✅ 干净 |
| 315 张谱面：声明集合 vs 磁盘集合 | declared-not-on-disk **0** · on-disk-not-declared **0** | ✅ **完全相等**，无孤儿谱面、无漏登记谱面 |
| 315 份谱面 JSON 可解析 | unparseable **0** | ✅ 干净 |
| 零音符谱面 | **0** 张 | ✅ 无空谱（合计 **112,511** 个音符条目；判定对象数 **143,066**，见第二十八次新增维度） |
| 音频体积异常（< 10 KB） | **0** | ✅ 最小 `audio.m4a` 1,467,496 B |

**难度分档无倒挂**（三档的 min / 中位数 / max 均逐档递增，是「难度分级确实生效」的硬证据）：

| 难度 | 谱面数 | 最少音符 | 中位 | 最多音符 | 合计 |
|---|---|---|---|---|---|
| easy | 105 | 110（`bs-s1-01`） | 214 | 261（`bs-s5-05`） | 21,536 |
| standard | 105 | 181（`bs-s1-01`） | 359 | 457（`bs-p4-05`） | 35,974 |
| hard | 105 | 245（`bs-s1-01`） | 558 | 651（`bs-p3-06`） | 55,001 |

- 音频体积：`audio.m4a` 105 个共 **355.3 MiB**（中位 3.80 MB）；`stream.m4a` 105 个共 **677.3 MiB**（中位 6.83 MB）。
- **这一节的意义是「排除」**：此前所有「曲库 105 首 / 315 谱面」的断言都只统计了 `catalog.json` 里的**字段**，从未验证过这些字段指向的文件真的存在。本轮证伪了「声明与磁盘脱节」这一整类风险，**后续轮次不必重复排查**。

### (b) `preview_48s.m4a` 只有 25/105，但溯源后确认「不是遗漏」

> **✅ 已解决（2026-09-17 第二十三次实测更正）**：本节的 25/105 快照**已过期**。commit `44f7efb`（2026-09-12）「补齐全曲库 `preview_48s` 并修复 Safari catalog 双取」已把 `preview` 字段补到 **105/105**，实测磁盘**零缺失**（105 个 `preview_48s.m4a` 全部存在），下方「本维度唯一登记的残留」**相应作废**。保留原快照是为了记录「溯源后确认不是遗漏」这条判读。
> **⚠️ 但线上仍未生效**：线上 `https://beatscape.pages.dev/catalog.json` 实测 **`preview` 字段仍只有 25/105**（曲目 / 谱面 ID 集合仍与本地完全一致）。原因是该改动属内容资产 + catalog 字段，**同样被 P0-6 卡住未部署**。**不得据此宣称「线上 preview 已补齐」**——这与「线上内容已同步」的旧结论并不矛盾：catalog 这类**已存在于线上的文件**会被内容渠道同步，但**新增字段与新增文件**不会。

| 季 | 曲目数 | 有 preview | 覆盖率 |
|---|---|---|---|
| s1 | 6 | **6** | 100% |
| s2 | 4 | **4** | 100% |
| s3 | 15 | **15** | 100% |
| s4 | 15 | **0** | 0% |
| s5 | 10 | **0** | 0% |
| s6 | 35 | **0** | 0% |
| p3 | 10 | **0** | 0% |
| p4 | 10 | **0** | 0% |
| **合计** | **105** | **25** | **23.8%** |

- **先溯源再定性（本维度的关键一步）**：若只看「80 首没登记」，会顺手写下「补登记 80 个 preview」的假待办。实测 `docs/BEATSCAPE-OPTIMIZATION-AUDIT.md:32 / 151 / 339` 表明：
  - 审计早已把 `preview_48s.m4a` 记为 **27.8 MB / 25 个**，并标注「⚠️ 仅 10 首登记进 catalog.json」；
  - 其 **P1-2 项**就是「登记 15 个孤儿 `preview_48s.m4a` 进 catalog.json（10→25）」，状态 **✅ 已完成**；
  - 实测这 25 个文件共 **27.78 MiB**，与审计记载的 27.8 MB 吻合 → **范围本来就是这 25 首**。
- **结论：剩下的 80 首不是「有文件没登记」，而是从未生成过 preview 文件**。`docs/BEATSCAPE-STAGE1-DUAL-ASSET.md:84` 也把 `preview` 明列为**可选**字段。**据此不生成「补 80 个 preview」待办**——那等于把一个已结项的设计决策重新打开。

### 本维度唯一登记的残留（候选、非缺陷、不认领）

> **✅ 2026-09-17 作废**：`44f7efb` 已补齐全曲库 `preview_48s.m4a`（105/105、磁盘零缺失），「80 首无 preview」不再存在，本残留关闭。下方原文保留备查。

- （原文保留）**`preview` 是可选字段，两处调用都写成 `track.preview ?? track.audio`**（`types/catalog.ts:26` `preview?: string`；`Home.tsx:29`、`Track.tsx:83`）。因此 **80 首无 preview 的曲目，Track 页上标签为「Preview」的按钮实际播放的是全长 `audio.m4a`**（中位 **3.80 MB**、最大 3.93 MB），而不是 48s 预览（**1.11 MB**）。
  - **影响边界（必须写清，否则会被误读成性能缺陷）**：`Home.tsx:53` 的 `AudioBar` 是 `preload="none"`，`TrackAudioPreview` 同样走 `AudioBar` → **不产生任何首屏带宽**，差异只在用户主动点播时才发生。
  - **处置**：是否给 s4 及以后补生成 `preview_48s.m4a` 是**产品 / 带宽权衡，不是 bug**。仅在此登记事实与量级，**不认领、不列 P 级条目**。

### 可复用手法

```bash
# 声明 → 磁盘：把 catalog.json 里每个路径字段拼到 public/ 下判存在性
python3 - <<'EOF'
import json, os
PUB='apps/beatscape/public'
t=json.load(open(f'{PUB}/catalog.json'))['tracks']
for f in ('audio','cover','stream_audio','og','preview'):
    miss=[x['track_id'] for x in t if x.get(f) and not os.path.exists(PUB+x[f])]
    print(f, 'declared', sum(1 for x in t if x.get(f)), 'missing', len(miss))
# 双向差集：谱面「声明集合」vs「磁盘集合」
declared={p.lstrip('/') for x in t for p in x['charts'].values()}
disk={os.path.relpath(os.path.join(r,f),PUB) for r,_,fs in os.walk(f'{PUB}/catalog') for f in fs if f.endswith('.json')}
print('declared-only', declared-disk, 'disk-only', disk-declared)
EOF

# 目录里出现了预期外的文件（本轮靠它发现 preview_48s.m4a）
# expected = {audio.m4a, cover.svg, easy.json, standard.json, hard.json, stream.m4a, og.png}
```

- **判读纪律（第十次印证「零 ≠ 该补」）**：本维度两个「零」都不生成待办——「零缺失 / 零孤儿谱面」是**干净**；「80 首零 preview」**是已结项的设计范围**。
- **另一条（本轮最值得记住的）**：**发现「覆盖率不足」时，先查这份覆盖率是不是某个已结项任务的范围**。本轮若跳过 `git log` / 审计文档直接写待办，就会把一个 ✅ 完成项重新打开。**手法：`grep -rn "<文件名/字段名>" docs/*.md`，看它是否已被某份文档记账。**
- **与前几轮的关系**：第十四次是「磁盘 → 声明」（找未声明的暴露面），本轮是「声明 → 磁盘」（找悬空引用）。两个方向合起来才算盘完；只做一个方向会漏掉另一类。

---

## Git 历史与仓库体积健康度盘点（2026-09-17 第二十三次新增维度）

> **为什么现在才查**：前二十二轮盘过曲库资产、公开暴露面、依赖、字体、CF 配置、i18n、可观测性……**唯独没查过 `.git` 本身**。而 2026-09-12 恰好发生了一次真实事故——`44f7efb` 误把 **54 个 `preview_48s.wav`（合计 436.05 MiB）**提交进 main，`4b9557e` 在 2 分钟后删除。这让本维度从「理论风险」变成「已经付出的成本」。

### 实测结果

| 指标 | 实测 | 判读 |
|---|---|---|
| `.git` 目录 | **1.9 GiB** | 对比受控工作区 **530.5 MiB（1311 个文件）** → **历史体积是工作区的 3.6 倍** |
| `git count-objects -vH` | pack **1.10 GiB** + loose **560.60 MiB** + **garbage 270.15 MiB（1 个）** | garbage 即 `.git/objects/pack/tmp_pack_6ae4gx` |
| 历史中 > 5 MB 的 blob | **163 个 / 1,161.36 MiB** | 多数是曲库音频（合法资产），但其中一部分是纯浪费 |
| `preview_48s.wav`（已被删除） | **54 个 / 436.05 MiB** | `44f7efb` 入库、`4b9557e` 删除 → **「删掉」≠「回收」** |
| 最大单个 blob | **45.4 MB** `.tools/lark-cli/bin/lark-cli` | 仅存在于**非 main 分支**的历史（`41d769b` / `b099cfc` 经 `git merge-base --is-ancestor … HEAD` 判定均为 **NO**） |
| git-lfs | **未使用**（无 `.gitattributes`，第十四次已确认） | 仓库没有任何体积护栏 |

### 三条结论

- **(a) 436 MiB 是永久性历史债务，不是「已经处理完」。** 这 54 个 wav 在 **main 上可达**（`git branch -a --contains 44f7efb` → `main` / `origin/main`），且已 push 到 GitHub → **任何一次 `git clone` 都要为这 2 分钟的失误多下载 436 MiB**。回收只能靠重写历史（`git filter-repo` / BFG），**属破坏性操作、会影响所有协作者** → **仅登记，不执行、不认领，需用户明确授权**。
- **(b) 270.15 MiB 是可回收垃圾，且判定为「陈旧」而非「并发写入」。** `.git/objects/pack/tmp_pack_6ae4gx` 的 mtime 是 **2026-09-01 23:01**（本轮实测时已 16 天未变），是中断的 pack / fetch 残留。**清理同样属仓库维护动作，本轮不执行**（`git gc` 不保证清理 `tmp_pack_*`，通常需人工确认后删除）→ 见 [P5-3](#p5-3-git-历史体积债务2026-09-17-新增)。
- **(c) 根因已修，但护栏仍然为零。** `a8d4583` 已让 `scripts/beatscape-make-preview.py` 把中间 wav 写到系统临时目录 → **同类事故不会从这个脚本复发**；但全仓**没有任何**阻止「大文件直推」的机制：**无 pre-commit hook、无 `.gitattributes`、无 CI 体积检查、无 git-lfs**。换一个脚本仍可重演。**只留档，不生成待办**（与第十九次「隐藏约束」同类：当前无人踩到）。

### 判读纪律

- **第十一次印证「零 ≠ 该补」**：本维度真正的产出不是「发现了几个零」，而是区分了**两个不同的「已删除」**——工作树里删掉了（`4b9557e`，`git status` 干净、`public/` 无 wav），**但历史里没删掉**。
- **本轮最值得记住的一条新规则：判断一次事故是否「结束」，要问「它留下的痕迹是否仍在被付费」，而不是「代码里还看不看得见」。** 本例代码层面已完全干净，但每个 clone 仍在为它买单。**推广：以后凡是「提交了大文件又删除」的收尾，都要补一句「历史债务是否接受」。**

### 可复用手法

```bash
# 1) 仓库体积总览（.git vs 工作区）
du -sh .git
git count-objects -vH      # size-pack + size + size-garbage

# 2) 历史里最大的 blob（注意：--all 会把所有分支的历史都算进来）
git rev-list --objects --all \
  | git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' \
  | awk '$1=="blob" && $3>5000000 {print $3, $4}' | sort -rn | head -25

# 3) 只给某一类文件在历史里「算总账」（本轮靠它得到 54 个 / 436.05 MiB）
  ... | awk '$1=="blob" && $4 ~ /preview_48s\.wav$/ {n++; s+=$3} END{print n, s/1048576" MiB"}'

# 4) 判「这笔账是不是只欠在别的分支上」
git merge-base --is-ancestor <commit> HEAD && echo YES || echo NO
git branch -a --contains <commit>

# 5) 判 tmp_pack_* 是并发写入还是陈旧垃圾：看 mtime
ls -la .git/objects/pack/ | grep tmp_pack
```

---

## 命令与脚本入口盘点（2026-09-19 第二十五次新增维度）

> 前二十四轮盘过 `scripts/` 目录里的孤儿**文件**（第十一次：`92` 个脚本中 `22` 个未被引），但**从未盘过 `package.json` 里声明的命令**。本轮把 6 个 `package.json` 的 **56 个脚本**与「全仓受控文档 / 工作流 / 脚本中实际被调用的命令」做双向对账。**全部为本地实测（本轮网络不可达，不涉及 `gh` 与线上）。**

### (a) 同名命令跨层异义 —— 本维度唯一会直接浪费时间的坑

| 脚本名 | 根 `package.json` | `apps/beatscape` | 差异 |
|---|---|---|---|
| `test` | `bash scripts/harness.sh unit`（Gateway + Python unit） | `vitest run` | **根 `pnpm test` 不含 BeatScape**（AGENTS.md 已记，本轮实测再确认） |
| `test:e2e` | `bash scripts/harness.sh e2e` | `playwright test` | **根 `pnpm test:e2e` 不含 BeatScape e2e（本轮新发现，见下）** |
| `release:check` / `release:verify` | **无** | 有 | 根不存在 → 必须带 `--filter`（与已知坑 `pnpm launch:check` 同类） |
| `preview` / `preview:portal` | `preview:portal` 转发到 demo | `preview`（127.0.0.1:5175） | 同名不同目标 |

- **关键实测**：`scripts/harness.sh:110-118` 的 `run_e2e()` 只做 `start_gateway` + `start_demo` + `python3 scripts/acceptance-demo-web.py`；`:112` 的 log 原文是 `tier: e2e (gateway + demo acceptance)`、`:160` 帮助文本写 `e2e  Gateway + demo web acceptance` → **根 `pnpm test:e2e` 与 BeatScape 完全无关**。`docs/CODE-INDEX.md:150` 也把根 `pnpm test:e2e` 标为 "demo web acceptance"，与本轮实测一致（该行此前从未被本文件引用过）。
- **影响**：第十三次记录「BeatScape e2e 自 2026-09-06 起未在 GitHub 跑过」，而**想手动补跑时最直觉的那条命令根本跑不到它** —— 必须 `pnpm --filter @musicsaas/beatscape test:e2e`。已在 [验收命令](#验收命令) 补上该对照。

### (b) 15 个已声明命令在全仓受控文件里零提及 —— 按「清单 ≠ 该清」不生成待办

`build:portal` · `cover:beatscape` · `db:migrate` · `generate:og:site` · `ingest:beatscape-stage3` · `ingest:stage1` · `pipeline:beatscape-stage3` · `postinstall` · `regenerate:beatscape-stage3` · `stitch:beatscape-stream` · `test:all` · `test:prd` · `test:sa3` · `test:unit` · `test:watch`。

- **判读**：绝大多数是一次性内容生产 / 迁移命令，与第十一次「孤儿脚本」同源 —— **落单是它们的正常形态**（靠人手动跑，不写进文档）。
- **唯一看起来像遗漏的 `test:prd`，实测并不漏跑**：`apps/beatscape/src/acceptance/prdAcceptance.test.ts` 存在，而 `apps/beatscape/vite.config.ts:56` 的 `test.include = ["src/**/*.test.ts"]` → `pnpm --filter @musicsaas/beatscape test`（`vitest run`）**已经包含它**，`test:prd` 只是个没人提及的便捷别名。
- **第十次印证「零 ≠ 该补 / 清单 ≠ 该清」：不生成「清理 15 个命令」的待办。**

### (c) 文档中 4 处裸 `npm run <script>` 缺「`cd apps/beatscape`」前提 —— 登记为候选、本轮不认领

- `docs/BEATSCAPE-PERFORMANCE.md:204-213` **有**前提（同段开头写明「从仓库根进入应用目录……`cd apps/beatscape`」）→ 正确，不算问题；同一文档 `:327-331` 又给出了 `pnpm --filter @musicsaas/beatscape …` 的等价形式。
- **无前提的有 4 处**：`docs/BEATSCAPE-NARRATIVE-UPDATE.md:28`（`npm run build:cf`）、`:31`（`npm run test:e2e`）、`docs/BEATSCAPE-RELEASE-READINESS.md:62`（`npm run generate:og`）、`docs/BEATSCAPE-COMMERCIALIZATION-GAP.md:90`（`npm run deploy:cf`）—— 三个文件里 `grep -n "cd apps/beatscape"` 均 **0 命中**，从仓库根执行会得到 `ERR_PNPM_NO_SCRIPT`；而同一批文档里也有写全的 `--filter` 形式（`BEATSCAPE-RELEASE-READINESS.md:44/46/53/154`）。
- 与第六次记录的坑（根 `pnpm launch:check` 不存在）是同一类，本轮把它**从一个个案扩成一类**。**改文档超出本轮「只提交 `TODO.md`」的范围，仅登记、不认领、不作阻塞项。**

### 可复用手法

```bash
# 1) 枚举全部 package.json 的 scripts（本轮：6 个包 / 56 个脚本）
python3 -c "import json,glob;[print(p,*json.load(open(p)).get('scripts',{})) for p in glob.glob('*/package.json')+glob.glob('apps/*/package.json')+['package.json']]"

# 2) 反向找「零提及」：在 git ls-files 的全部受控文本里逐个搜脚本名（先排除 data/ 与 catalog/，否则噪音）

# 3) 正向找「坏命令」：正则抓 pnpm/npm 调用（含 --filter / -r），解析到具体 package 后判脚本是否存在
#    注意：解析器要把根 package.json 路径规范化（os.walk 在 '.' 下给出 './package.json'）

# 4) 判同名命令是否跨层异义（本轮真正的发现全来自这一步，不是来自 1/2/3）

# 5) 关键：`pnpm test:e2e` 到底跑谁，必须读 harness.sh 的 run_e2e() 实际启动了什么，不能看命令名
```

> **判读纪律（与「孤儿 ≠ 该删」「未勾 ≠ 没做」同源）**：**「一个命令没人提」通常是正常形态，不值钱；真正值钱的是「两个同名命令指的不是同一件事」** —— 因为只有后者会在人最直觉的操作下**静默跑错目标**，而它不会报任何错。

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
- **⚠️ 范围缺口（2026-09-10 第十四次新增）**：耳检口径是「catalog 里的 105 首」，但实测 `apps/scapemusic/public/trials/` 下 **5 个 m4a（27.81 MiB）不在任何 catalog 中，却已随 ScapeMusic 上线、`scapemusic.pages.dev/trials/*.m4a` 全部 200 可公开下载** → 它们**从未进入耳检范围**。**本文件不判断其是否有风险（未听过）**，但做耳检/签审时应显式确认这 5 个文件的来源与授权，或登记豁免。详见 [受控二进制资产与公开资产暴露面盘点](#受控二进制资产与公开资产暴露面盘点2026-09-10-第十四次新增维度)。
- **阻塞**：正式发布签审。

### P0-2 差异化盲测
- **为什么**：阻塞「对外宣称原创差异化」的一切表述。
- **规格**：[docs/RESONANCE-BLINDTEST.md](docs/RESONANCE-BLINDTEST.md)
- **阻塞**：需 5–10 名「不玩日式 RPG」的观察者（人工招募）。
- **注意**：叙事优化后界面已变，旧候选 `74840f1fc466` 的视觉截图属历史工作包，**新界面需重新绑定视觉盲测材料**。

### P0-3 正式上线放行
- **前置**：P0-1、P0-2、P0-4 全部完成。仓库 CI 已在 `e3ba64f` 通过；当前本地候选的固定条件性能预算已通过，[同指纹证据与覆盖边界](docs/BEATSCAPE-PERFORMANCE.md) 保持记录。**注意 CI 绿 ≠ 部署可用**：部署工作流是独立一条，且当前被 `launch:check` 卡死（见 P0-6 / P1-6）。
- **动作**：据实填写 `apps/beatscape/launch-signoff.json`。
- **2026-09-10 第十次新增（签审锚点）**：实测仓库 **0 个 git tag、0 个 GitHub Release**（见 [版本与分支盘点](#版本与分支盘点2026-09-10-新增维度)）→ 没有版本化发布物可锚定，**填 `artifactSha256` 时必须同时记录其对应的 commit SHA**，否则「已签审产物」无法追溯到具体代码。
- **2026-09-18 第二十四次新增（签审确认项：埋点与可选第三方转发未披露）**：`src/lib/analytics.ts` 定义 **23 类行为事件**（`home_view` / `play_start` / `play_finish` / `share_*` / `calibrate_open` …），在 **9 个文件**中真实调用，写入 `bs_analytics`（cap 120）；`analytics.ts:38-39` 内嵌 **Plausible 转发钩子** `window.plausible?.(event, { props })`。**当前无任何 Plausible 脚本被加载 → 实际零外发**，与「运行时外域只有 Google Fonts」一致；**但加一行脚本即可在零代码改动下开始向第三方发送行为事件**。而 `Legal.tsx:20` 的隐私文案只承诺「do not run third-party **ad** trackers on the play surface」（限定为**广告**追踪），**全文未提及事件埋点与可选第三方转发**。→ 放行前需确认：隐私条款是否要补充披露埋点与可选的第三方分析转发（本文件**不作法律结论，只陈述事实**）。详见 [专节](#本地数据持久化与隐私声明一致性盘点2026-09-18-第二十四次新增维度)。
- **2026-09-13 状态更新（原签审披露项已对 BeatScape 消失）**：BeatScape 已自托管四家族并由浏览器守门证明 Google 字体请求为 0，因此其 Legal 不再需要为字体 CDN 补披露；ScapeMusic 仍请求 Google Fonts，按其自己的发布签审处理。详见 [运行时外部依赖与字体供应链盘点](#运行时外部依赖与字体供应链盘点2026-09-10-第十六次新增维度)。
- **实测现状（2026-09-09 第八次复查，与上一轮一致、仍无进展）**：`launch-signoff.json` **七个**字段 `artifactSha256` / `reviewedBy` / `reviewedAt` / `contentAudit` / `earcheckReport` / `blindtestRecord` / `deviceTestRecord` **全部仍为 `null`**，即放行材料一份未填。（注：上一轮摘要误写「六字段」，本轮以实测七字段为准。）
- **门禁**：`launch:check` 当前**应阻止**正式发布（`deviceTestRecord` 缺失，按 BS-D001 如实报告，不得当作通过）；状态详见 [docs/BEATSCAPE-RELEASE-READINESS.md](docs/BEATSCAPE-RELEASE-READINESS.md)。

### P0-4 英语叙事真人试玩
- **规格**：[docs/BEATSCAPE-NARRATIVE-PLAYTEST.md](docs/BEATSCAPE-NARRATIVE-PLAYTEST.md)（五分钟协议）
- **采集**：理解度 · 角色记忆 · 继续意愿 · 英语自然度。**尚无参与者结果。**
- **背景**：叙事深度优化候选 `fa4bca512a38`（139 单测 / 6 发布器回归 / 28 浏览器流程通过，本地未提交）。
- **2026-09-11 第二十一次新增（试玩取证能力前置确认）**：实测本仓库**零错误上报、零 sourcemap、零全局错误接管**（见 [运行时错误可观测性与崩溃兜底盘点](#运行时错误可观测性与崩溃兜底盘点2026-09-11-第二十一次新增维度)）→ **试玩过程中若发生崩溃，开发侧拿不到任何信息，只能依赖参与者口述复现**。BeatScape 侧至少有 ErrorBoundary 兜底并会 `console.error("[beatscape] render error:")` 带上 `componentStack`（且该兜底**已上线**）；但**渲染期之外的异常无人接管**。→ **建议试玩前确认取证方式**（例如：让参与者遇到问题直接截图 console，或临时开 sourcemap 构建一份试玩专用产物）。**登记为前置确认项，不阻塞试玩本身。**

### P0-5 门户发布配置
- **等待**：门户域名 + Cloudflare Pages 项目名；确定后按真实域名重建并复核，**发布另需对应授权**。
- **现状**：[docs/PORTAL-RELEASE-READINESS.md](docs/PORTAL-RELEASE-READINESS.md)，候选 `53f83162ad6e`（本地未提交）。
- **CI 注意**：仓库 CI 已在 `e3ba64f` 通过；门户候选仍需独立按真实域名、Pages 项目和门户发布脚本验收，不能用 BeatScape CI 代替。
- **2026-09-09 第九次新增**：`gh workflow list` 盘点发现仓库另有 **Portal release check** 工作流，其最后一次 run **`33970422632`（09-05T13:58Z）为 success** → **门户侧的发布门禁是通的**，P0-5 的阻塞点只是「域名 + Pages 项目名未定」这一人工等待项，不像 BeatScape 那样被门禁结构性卡死（见 [全仓工作流盘点](#全仓工作流盘点2026-09-09-新增维度)）。

### P0-6 线上部署与 `main` 不同步 —— 根因已定位：部署管道被 `launch:check` 卡死
- **实测（2026-09-08 第六次刷新，首次核对 GitHub Actions 部署管道）**：线上 `https://beatscape.pages.dev` 落后于 `main`，**且当前没有任何可行路径能重新部署**：
  - **最后一次成功部署**：`33895713222`，2026-09-04T16:32:29Z，head `ffe1ec0`（`feat(p4): ingest 脚本 …`）。此后**连续 10 次 run 无一成功（9 failure + 1 cancelled）**：`33970422633`(09-05) / `34011510454` / `34013428332` / `34033551869` / `34064117995`(09-06 22:28) **+ 2026-09-12 新增 5 次**：`34662323856`(00:38Z) / `34667824455`(02:29Z) / `34671971307`(04:02Z，**cancelled**，被 2 分钟后的同分支 push 顶掉) / `34671988856`(04:03Z) / `34675948678`(05:34Z)。**（2026-09-17 第二十三次更正：本条此前写「连续 5 次、截至 09-11 无新增 run」，已过期。）** 最近一次 `34675948678` 经 `gh run view --json jobs` 实测：第 7 步 `Verify release candidate` **success**（含 Vitest 27 文件 / 193 passed 与 `playwright test` **62 passed**），**第 9 步 `Check launch sign-off` failure、第 10 步 `Publish to Cloudflare Pages` skipped** → **wrangler 依旧从未执行**。
  - **失败点是 `launch:check`，且它排在发布之前**：`.github/workflows/deploy-beatscape-cloudflare.yml` 的顺序是 `Verify release candidate` → `Check launch sign-off` → `Publish to Cloudflare Pages`；`34064117995` 的日志显示「Release verified: 105 tracks / 315 charts / 594 files / 402.7 MiB」之后立刻 `Launch blocked` 六条并 exit 1，**wrangler 从未执行**。
  - **后果**：T3 误差条（`a136592`）、退出弹窗（`6418d3f`）、性能第二轮（`e3ba64f`）等「已推送」改动**线上均不存在**，与实测一致——线上 bundle `/assets/index-CDXE9BO-.js`（325,768 B）不含 `No account, no ads`。
  - **但「落后」仅限 JS 代码，内容资产是当前版本（2026-09-09 首次实测，修正此前笼统表述）**：线上 `catalog.json` 返回真 JSON（115,172 B），**105 首 / 315 谱面 / `stream_app_url` 0-105**，曲目 ID 集合与本地**完全一致**；`/catalog/bs-p4-01/easy.json`（19,241 B）、`/catalog/bs-p4-10/hard.json`（51,507 B）均 **200** → 玩家线上能玩到完整的 105 首与 p4 谱面。**成因**：p4 进入 catalog 的 `f9d8c8f`（2026-09-04T16:31:54Z）经 `git merge-base --is-ancestor f9d8c8f ffe1ec0` 判定为 YES，是最后一次成功部署 head 的**祖先**，且仅早于部署 run `33895713222`（16:32:29Z）**35 秒**。因此「线上缺内容」不成立，待部署的只是代码改动。
  - **补充（2026-09-10 第二十次）：「落后」不止 JS 代码，静态资产同样落后，且逐文件结论不同。** 实测：`og.png` 本地存在（`apps/beatscape/public/og.png`，**1,200×630**、39,195 B、已受控），但**线上 `https://beatscape.pages.dev/og.png` 返回 200 而内容是 2146 B 的 `text/html`**，与一个确定不存在的路径**字节数完全相同** → 是 SPA 回落页，**该文件线上并不存在**。成因已按纪律溯源：`git log -1 --format=%h -- apps/beatscape/public/og.png` = **`8b710a3`（2026-09-05 16:06 +0800）**，比最后一次成功部署 `ffe1ec0`（09-05 00:31 +0800）**晚约 15.5 小时** → **从未有机会部署，是本条部署阻断的直接后果，不是「忘了上传」，不得记为独立缺陷**。同源证据：线上 `sitemap.xml`（**911 B**）与本地（**1,025 B**）**逐行 diff 只差一行**（缺 `/shift` 条目），该文件最后由 `735208b`（09-05 21:51）修改，同样晚于最后成功部署；`robots.txt`（133 B）线上与本地一致（部署前已存在，无差异）。**影响面**：`index.html` 的 `og:image` 与 `twitter:image` 均指向该图 → **Reddit / X / Discord / Slack 抓取分享预览时拿到的是一段 HTML 而不是图片**，与 **P3「Reddit 首发运营」** 直接相关。
  - **注（2026-09-09 第九次重述，修正上一轮的时区歧义）**：最后一次 run `34064117995`（09-06**T22:28:24Z**）**正是由 `a136592` 触发的**——该 commit 的本地时间是 09-07 06:28 +0800，即 22:28Z，两者是同一时刻。所以准确表述是：**`a136592` 之后的 8 个 commit 全是 docs-only，不命中 `paths` 过滤**，故无新 run；而非「09-07 之后的提交都没触发」。**无新 run 属预期，不代表管道恢复。**
  - **门禁引入点（2026-09-08 第七次新测）**：`git log -S "Check launch sign-off" -- .github/workflows/deploy-beatscape-cloudflare.yml` 与 `git log -S "deviceTestRecord" -- apps/beatscape/scripts/launch-check.mjs` **两条命令都只命中 `8b710a3`**（2026-09-05 16:06 +0800，"chore: audit agent guidance and release workflow"）→ workflow 的门禁步骤与 `launch-check.mjs` 的必需字段是**同一 commit 一次性引入**。该 commit 与 `735208b`（09-05 21:51）同批推送 → 首个失败 run `33970422633`；此前 `33895713222`/`33895023150`/`33817015569` 全部 success。**部署是自 09-05 当天起被一次性卡死的，不是逐步退化。**
- **更正上一轮的两条证据（均作废）**：上一轮用「bundle 中 `scapemusic.pages.dev` 0 命中」和「`/release.json` 返回回落页」推断「线上不是 `build:cf` 产物」。实测二者都是 `8b710a3`（2026-09-05 `chore: audit agent guidance and release workflow`）才引入源码的（`streamLink.ts` 的域名字面量、`release.mjs prepare` 生成 `dist/release.json`），**均晚于最后一次成功部署（09-04）** → 线上没有它们是必然，不能证明 env 未注入。**教训：用「线上缺某字符串」当证据前，必须先确认该字符串进入源码的时间早于线上部署时间。**
- **动作项（四条路径目前全部不可达）**：
  - ~~推送触发 `.github/workflows/deploy-beatscape-cloudflare.yml`~~ —— **无效**，只要 `apps/beatscape/**` 有改动就必挂（已连续 9 次 + 1 次 cancelled）。
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
| **首页即开局改版 + 谱面-音频匹配入库门禁**（🆕 2026-09-12） | `24244a1` | Home 重构为「即开局」首屏（219 行改动）；新增 `CuratedRow` 精选区（含 why 与选段试听）、`homeEntry.ts` / `curated.ts` 与各自单测；Duo 入口改为通关后出现；新增**谱面-音频匹配入库门禁**（>50ms 判定 + gridfit 贴格率下限 easy/standard 55 / hard 85，重跑可用 `--min-*` 放宽）。**已推送，未部署** |
| **改版候选性能重测 28 项预算全通过**（🆕 2026-09-12） | `ffa2927` | 候选 `604cebd9`（即上一行改版）重测，记录进 `docs/BEATSCAPE-PERFORMANCE.md`；**已推送，未部署** |
| **补齐全曲库 `preview_48s`（25 → 105）并修复 Safari catalog 双取**（🆕 2026-09-12） | `44f7efb` | 上一轮登记的「80 首 Preview 按钮实际播放全长 `audio.m4a`」残留**由此关闭**；同时修 WebKit 下 catalog 被取两次。**已推送，未部署** → 线上 `catalog.json` 的 `preview` 仍为 25/105 |
| **移除误入库的 54 个 `preview_48s.wav` 中间产物**（🆕 2026-09-12） | `4b9557e` | 48s PCM 临时文件（各 8,467,244 B，合计 **436.05 MiB**）曾被 `44f7efb` 误提交；文件已从工作树删除，**但历史里的 blob 永久保留**（见 [Git 历史与仓库体积健康度](#git-历史与仓库体积健康度盘点2026-09-17-第二十三次新增维度)） |
| **make-preview 中间 wav 改走系统临时目录**（🆕 2026-09-12） | `a8d4583` | 上一条的**根因修复**：脚本不再往 `public/` 写中间 wav，同类误入库不会复发 |
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
- **⚠️ 2026-09-10 第十五次新增（深链修正是「按域名硬编码」，换域名会静默失效）**：`streamLink.ts:9-12` 的特判是 `STREAM_APP_BASE === "https://scapemusic.pages.dev"` 才补 `/#`，**不是按路由类型推导**。实测该修正确有必要（ScapeMusic 是自研 hash 路由；`scapemusic.pages.dev/track/bs-s1-01` 返回 200/1944 B，与缺失路径**同字节数** = SPA 回落，路径式深链无效），**但域名一旦变更（自定义域名 / CF 预览域 / 按本条「Scape Music 为工作名」改名），特判即失效，深链静默落到 Discover 且不报错**，而 `streamLink.test.ts` 的 2 个用例**恰好只测了这个字面域名** → 换域名后测试仍全绿。**因此上面的动作 ② 只在域名不变的前提下成立**：若改用其他域名，必须同步改 `streamLink.ts:10` 的判等（或改为通用规则）并补「非该域名」用例。详见 [构建期环境变量与部署路径盘点](#构建期环境变量与部署路径盘点2026-09-10-第十五次新增维度)。
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
  3. **（2026-09-09 第九次新增，可操作）按方案 2 改门禁后会自动重新部署，不必额外 kick**：`.github/workflows/deploy-beatscape-cloudflare.yml` 的 `on.push.paths` 共 6 条，其中**同时包含** `apps/beatscape/**`（覆盖 `apps/beatscape/scripts/launch-check.mjs`）**与** `.github/workflows/deploy-beatscape-cloudflare.yml` 自身 → 无论改哪一处门禁，该提交本身就会触发部署工作流。此前各轮一直没确认这一环，容易误以为还要再补一个「空提交」才能把改动推上线。
- **（2026-09-20 第二十六次新增，拍板前必读）方案 2 的真实代价：会同时移除目前唯一一道上线前卡点。** 实测仓库侧**没有任何护栏** —— GitHub 分支保护**不可用**（私有仓库 + Free 计划，API 返回 `Upgrade to GitHub Pro or make this repository public`）、`deploy-beatscape-cloudflare.yml` **无 `environment:`、无人工审批步骤**、本地 `.github/` **无 CODEOWNERS**（详见 [仓库治理与安全配置盘点](#仓库治理与安全配置盘点2026-09-20-第二十六次新增维度)）。因此**方案 2 不只是「解锁部署」，而是「解锁部署 + 移除唯一护栏」**：放宽后，main 上任何触及 `apps/beatscape/**` 的 push 都会在**零人工审批**下自动发布到生产。**方案 1 与方案 3 不改变这一结构**（方案 1 保留门禁、方案 3 维持现状）。→ 若选方案 2，建议同步考虑是否要补一道替代卡点（如 GitHub Environment + required reviewers，或保留一个不含 `deviceTestRecord` 的精简门禁）。**本文件不代为决策。**
- **来源**：`launch-check.mjs:19` · 本轮 `git log -S` 溯源 · 上一轮 `gh run view 34064117995 --log-failed`。

---

## P2 — 产品增强（可玩性 / 增长）

> 来源：[docs/BEATSCAPE-PLAYABILITY-GROWTH-TODO.md](docs/BEATSCAPE-PLAYABILITY-GROWTH-TODO.md)。**T1a（站点级 OG 卡）与 T2（全模式 Note speed）已确认落地**，不重复列为待办。

| ID | 事项 | 价值 | 状态 |
|---|---|---|---|
| **T5a** | 分享文案加 privacy 卖点（无账号 / 数据留在本机） | ★★ 低成本差异点 | ✅ **已核实落地**（2026-09-06）：`session.ts` shareResultsCopy / `pageMeta.ts` description / `index.html` og:description 均已含 "No account, no ads. Scores stay in your browser."，`session.test.ts`、`pageMeta.test.ts` 有断言。此前清单标「待做」属过期 |
| **T3** | 判定偏早/偏晚提示 + 结算页误差条 | ★★★ 「能玩」→「能练」 | ✅ **已完成**：`renderLoop.ts` 已按 signed `deltaMs` 在判定线显示 EARLY/LATE 并作方向微偏移；`playState.ts` → `PlayResult.timing` → `LastRun.timing` → Results 双向误差条与 Next move 已贯通。此前“场内待做”与本表来源文档的完成状态及当前实现冲突，2026-09-12 按 as-built 纠正 |
| **T4** | 从失败点重开（挂 `MissReplayPanel`） | ★★ 啃高难度谱的前提 | ✅ **已完成**：Miss section 可从 `MissReplayPanel` 直达有界 `?seek=&until=` Practice；只判该段、跨段长物件可收尾，分段局不计榜/PB/生涯且可重试或回完整 Arcade。此前待做状态已落后于来源文档和当前实现，2026-09-12 纠正 |
| **弱网音频恢复** | 瞬时故障自动恢复；持续故障原地重连 | ★★★ 手机网络韧性 | ✅ **已完成（2026-09-12）**：共享缓存对网络/响应体、408/425/429/5xx 做初次 + 250/750ms 两次重试；Play/Duo/parser 抢跑共用，最后消费者离开即取消，4xx/解码失败不重复下载。耗尽后单人保留页面/谱面原地 Retry，Duo 只显示一个共享故障对话框并同步重连两端；焦点陷阱、Escape/返回出口和成功后 Start 焦点均覆盖。production desktop + Pixel 7 故障恢复 6/6、完整 release 24/24、提前音频/Duo/catalog 30/30 |
| **320px 窄屏横向收口** | 全站主路由、精选卡与 Track 开玩配置不出屏 | ★★★ 小屏手机基础可用性 | ✅ **已完成（2026-09-12）**：修复 Home / Library 300px grid 最小列与双 CTA 固有宽度导致的 348px 文档、Track grid min-content 与 nowrap 流媒体 CTA 导致的 345/326px 文档；≤360px 精选卡与按钮可收缩，Track 正文使用 `minmax(0,1fr)`，full-track CTA 独占全宽一行。320×568 的 desktop / Pixel 7 行为项目覆盖 12 个主路由及逐卡边界 **6/6**，production release **24/24**，截图目检无横向裁切 |
| **短横屏完整可玩区** | 单人 / Duo 判定线与暂停操作始终留在屏内 | ★★★ 手机横屏核心可玩性 | ✅ **已完成（2026-09-12）**：844×390 production 基线 desktop/mobile 的单人/Duo 4/4 失败，场地底部到 496/476px。≤520px 横屏现以 flex column 让 44px meta 固定、场地占剩余视口并取消桌面 min-height；≤700px Duo 仍左右双轨，窄档隐藏重复键位但保留 Exit/曲名/模式；overlay 自身可滚动，页面不滚。`landscape-layout.spec.ts` 覆盖 844×390 / 667×375、开始/暂停/恢复、双轨/judgment 边界、44px 目标和零滚动 8/8；完整 Playwright 187 passed / 1 desktop-only skip，截图与顶栏坐标复核通过 |
| **设备旋转安全暂停** | 横竖屏切换期间不制造不可避免的 Miss | ★★★ 手机公平性 / 对局连续性 | ✅ **已完成（2026-09-13）**：运行中的触屏单人/Duo 只有真正跨 portrait/landscape 才自动暂停；地址栏收放等同方向高度变化、桌面 resize、未开局和已暂停状态均不打断。Duo 合并为一次同步暂停，旋回后仍等待玩家 Resume，并复用 3 秒安全倒计时。`orientation-change.spec.ts` 基线 desktop 2/2 通过、mobile 2/2 失败，修复后 4/4；受影响回归 55 passed / 1 skip，完整 Playwright 191 passed / 1 desktop-only skip |
| **多源输入所有权** | 多指、键盘与触控并用时 Hold/Slide 不误断 | ★★★ 核心手感 / 公平性 | ✅ **已完成（2026-09-13）**：source→lane→owners 统一管理键盘和 pointer；同道只在最后 source 离开时 release，移入 5% guard 会释放旧道，lost capture/cancel/Pause/中断/重开/卸载清空遗留输入。修复前同道双指 Hold desktop/mobile 2/2 失败，修复后所有权/边缘/暂停恢复 6/6，纯逻辑 7/7 |
| **自托管生产字体 / 离线字体壳** | 欧美视觉不依赖 Google 可达性，PWA 离线不退化 | ★★★ 品牌一致性 / 弱网韧性 | ✅ **已完成（2026-09-13）**：Anton、Sora、IBM Plex Sans/Mono 的 Latin + Latin Extended 共 12 个 WOFF2 随 app `/assets/` 发布，SIL OFL 许可同包留档；移除 Google preconnect/CSS。浏览器测试验证四家族同源加载、零外部字体请求；PWA shell 缓存 12/12，并对同源 immutable assets 忽略 `Vary: Origin` 后断网刷新仍可加载。字体专项 6/6，HUD 字体 metrics 回归 desktop/mobile × 单人/Duo 4/4 |
| **核心玩法 44px 热区** | Exit / Pause 在单人和 Duo 均可稳定触达 | ★★★ 运行中防误触 | ✅ **已完成（2026-09-12）**：修复 Exit 34px、单人 Pause 38px、Duo Pause 30px；交互外层统一 44px，原视觉尺寸留在内层，Duo 焦点环不被裁切。基线几何 4/4 失败，修复后 desktop/mobile 4/4；启动/全屏/320px 全路由 23 passed / 1 desktop-only skip，真实退出/暂停 4/4，四张窄屏截图无 HUD 重叠 |
| **赛前 / 导航 44px 热区** | 手机进入选曲、配置、校准和设置时不需要精准点按 | ★★★ 移动端首局可达性 | ✅ **已完成（2026-09-12）**：修复 Profile、Home 分区入口、Showcase、Library 筛选/搜索/下拉、Track 返回/试听、Sound check、Adjust timing、No sound/Settings、Fullscreen 与键位预设等 17.8–42px 目标；真实按钮/链接统一 ≥44px，头像与试听保留紧凑视觉内层。`pregame-touch-targets.spec.ts` 基线 desktop/mobile 6/6 失败，修复后 6/6；320px 组合 12/12、完整 Playwright 171 passed / 1 desktop-only skip，六张截图无裁切或遮挡 |
| **T1b / T5b** | OG 随路由同步 / 成绩海报跨设备分享 | ★ 锦上添花 | ✅ **已完成（2026-09-12）**：Track / Results / Leaderboard 补齐 route meta；canonical 去 query，Open Graph / X title、description、URL 随 SPA 路由同步，成绩摘要使用英语数字格式。海报按能力显示原生 `Share poster`、图片剪贴板 `Copy poster` 或仅下载，不再让不支持的手机先渲染再失败；原生分享发送真实 PNG 文件和挑战文案，取消静默、误报可降级复制。`pageMeta.test.ts` 21 例；`results-sharing.spec.ts` 基线 desktop/mobile 4 failed / 4 passed，修复后 8/8，完整 Playwright 179 passed / 1 desktop-only skip；双视口截图无空列/溢出。爬虫不执行 JS，静态 `index.html` 仍是首次 unfurl 来源；本地 `og.png` 的公网可达性仍随部署门禁处理 |

---

## P3 — Reddit 首发运营（人工）

> 来源：[docs/TODO.md](docs/TODO.md)（P3/P4 段）。**不继承**：「Stage4 40 首」与「真 180s 流媒体母带」已被 105 首曲库 / 216s 双资产覆盖，属过期项。
> **2026-09-10 第十二次新增**：另有 **`.delivery/beatscape/backlog.md:21` 的 `TICKET-B05`（Reddit 启动页 CTA 文案，AC「CEO 勾文案后再 merge」）仍未关闭**，它落在本段首条「发帖素材包」范围内 → **不新开条目，但两处状态需保持一致**：关闭本段首条时应同步把 `TICKET-B05` 标记为 done。详见 [散落待办清单盘点](#散落待办清单盘点2026-09-10-第十二次新增维度)。
> **2026-09-10 第二十次新增**：**社交分享预览当前是坏的**——`index.html` 的 `og:image` / `twitter:image` 均指向 `https://beatscape.pages.dev/og.png`，而该文件线上返回 SPA 回落页（2146 B HTML，与确定缺失路径同字节数）→ **Reddit / X 抓取分享预览时拿不到图片，只会拿到一段 HTML**。成因与解法都在 **P0-6**：该图由 `8b710a3` 引入、晚于最后一次成功部署约 15.5 小时 → **这不是「补一张图」，而是必须等部署打通**。**本段不新开条目**（属 P0-6 的症状，非运营侧独立动作）。

- [ ] 发帖素材包 — 见 [docs/BEATSCAPE-REDDIT-LAUNCH.md](docs/BEATSCAPE-REDDIT-LAUNCH.md)
- [ ] 目标 sub 调研
- [ ] 开发者向帖子（可选）
- [ ] 反馈入口（Discord / Discussions）
- [ ] 公网 URL < 3s（需部署后测）
- [x] 荣誉段位 / 成就 — 四段位、八成就、Results 解锁提示与 Profile 已落地；2026-09-12 补当前/下一段量化进度、文字锁定状态、坏旧存档过滤及 desktop/Pixel 7 回归
- [x] PWA + 离线缓存 — 可安装 shell；已打开的完整曲目按需缓存（最多 6 首）、预览最多 12 首，支持离线刷新、Range 播放和明确断网提示；不预下载 491.7 MiB 全曲库。发布时生成内容版本化 shell，升级 worker 等旧页面关闭后再接管，避免正在游玩或后续懒加载被新版本断开。2026-09-12 desktop + Pixel 7 安装/无断局升级/离线开局 E2E 6/6
- [x] 对局防熄屏 Wake Lock — 单人/Duo 运行中按能力持有一把屏幕锁，暂停、退出面板、结束或离开即释放，继续时重取；拒绝/不支持不阻塞玩法。2026-09-12 desktop + Pixel 7 8/8
- [x] Pause 安全再入场 — 单人/Duo 的 Resume、切后台/退出全屏后的手动恢复及 Keep playing 统一给 3 秒 AudioContext 同轴倒计时；期间冻结歌曲时间、判定与输入，倒计时再次暂停时保留剩余时间。2026-09-12 双端退出/暂停 18/18，关联组合 39 passed / 1 desktop-only skip
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
- **2026-09-17 第二十三次实测更新**：工作区改动已从「连续多轮 10 项 + 10 项未跟踪、构成完全一致」**暴涨到 113 项改动 + 238 项未跟踪（共 351 项）**，HEAD `231bad5`、`origin/main` 与本地 **0/0** 同步。增量主体是 2026-09-12～09-13 的 BeatScape 玩法/无障碍/字体自托管等一批未提交工作（`worklog/2026-09-12.md`、`worklog/2026-09-13.md` 均有「未提交」记载），**本文件只负责记录，不代为提交、不回滚**。
- 截至 **2026-09-10 第二十次刷新**（实测 `git status`，`origin/main` 与本地已同步 0/0，HEAD `5889955`），工作区有并行会话未提交改动（**连续第八轮构成完全一致、零变化**：仍 **10 项改动** + **10 项未跟踪**；另加本文件 `TODO.md` 待提交）：
  - **T1b / T5b（已完成、仍未提交）**：原 2026-09-10 盘点时确实零测试覆盖；2026-09-12 已扩展为 Track / Results / Leaderboard route meta 与 Share Sheet / Clipboard / Download 能力分流，`pageMeta.test.ts`、`results-sharing.spec.ts` 及完整双项目矩阵均已覆盖，见 P2 表。提交时仍应按文件归属整理，不使用 `git add -A`
  - **需求文档**：`PRD.md`（§19 待决 7/8、§20.1 验证清单、MiniMax/YuE 官方链接）、`docs/COMPLIANCE.md`（许可表 + C-06）、`SESSION.md`（P1-4 音乐模型候选评估）
  - **Harness / 项目规范**：`AGENTS.md`（追加 cursor-codex-sync 区块）、未跟踪的 `.agents/skills/{company-harness,vault-harness,zbrain-session}/`、`.codex/`
  - **其他**：`.delivery/README.md`、`.delivery/prompts/orchestrator-kickoff.md`、`worklog/2026-09-06.md`、`.workbuddy-ai/memory/2026-09-06.md` ~ `2026-09-10.md`（5 个日志文件）、`.workbuddy-ai/memory/automations/ff19e388-…/memory.md`（本自动化自己的记录）
- **已落地不再列**：T3 结算页误差条的原工作区改动已随 `a136592` 提交并推送；`docs/CODE-INDEX.md` 的历史冲刺归档标注随上一轮 TODO 刷新一并提交（P5-1 收口，本轮复查三处归档横幅均仍在）。
- **动作**：由各改动所有者分别提交；**不要 `git add -A` 一次性扫入**，避免把并行会话的半成品混入。

### P5-3 Git 历史体积债务（2026-09-17 新增）
- **事实**：`.git` **1.9 GiB**，其中两笔明确的浪费（2026-09-17 实测，见 [专节](#git-历史与仓库体积健康度盘点2026-09-17-第二十三次新增维度)）：
  1. **436.05 MiB**：54 个 `preview_48s.wav`，`44f7efb` 误入库、`4b9557e` 删除，**在 main 上永久可达**，回收需重写历史（`git filter-repo`）→ **破坏性操作，需用户明确授权，本文件不认领、不执行**。
  2. **270.15 MiB**：`.git/objects/pack/tmp_pack_6ae4gx`，mtime **2026-09-01 23:01**（16 天未变，判为中断的 pack/fetch 残留而非并发写入）→ 可回收，但删除 `.git` 内文件属仓库维护，**同样需用户授权后执行**。
- **根因已修**：`a8d4583` 已让 `scripts/beatscape-make-preview.py` 把中间 wav 写到系统临时目录，同类误入库不会从该脚本复发。
- **仍缺护栏（仅留档）**：无 pre-commit hook、无 `.gitattributes`、无 CI 体积检查、无 git-lfs → 换脚本仍可能重演。**当前无人踩到，不生成独立待办。**

### P5-4 关闭 6 个已实现的僵尸 Issue（2026-09-18 新增，**需用户授权后执行**）
- **事实（2026-09-18 第二十四次实测）**：`gh issue list --state open` 有 **6 个未关闭 Issue**（**#34–#39**，`[TICKET-B06]` Library / `B07` Calibration / `B08` Settings / `B09` 404 / `B10` Home 页 SEO title·description、`B11` Play 页 SEO 回归测试补强；均 2026-09-09T13:00Z 创建、带 `agent-safe` 标签）。**PR 为 0。**
- **本条的价值在于对账，不在于「有 6 个」**：这 6 个 Issue 要求的工作**在代码里已全部完成且已有测试** —— `Library.tsx:66` / `Calibration.tsx:47` / `Settings.tsx:94` / `NotFound.tsx:5` / `Home.tsx:35` 均已 `usePageMeta(...)`；`pageMeta.test.ts` 有 `HOME_PAGE_META`(105) / `LIBRARY_PAGE_META`(122) / `CALIBRATION_PAGE_META`(134) / `SETTINGS_PAGE_META`(146) / `NOT_FOUND_PAGE_META`(173) 断言；`B11` 要求的「`buildPlayPageMeta` 无 seo block 边界」在 `pageMeta.test.ts:59/68` 两条用例中。**结论：属「做完没回来关」的僵尸条目，不是待办**，此前 TODO 声称「无未关闭 Issue」反而是错的。
- **不自行 close**：关闭 GitHub Issue 属**外部动作**，按仓库纪律需用户明确授权后才执行。**当前仅登记、不认领。** 授权后动作：`gh issue close 34 35 36 37 38 39 -c "已在代码中实现并有测试覆盖：…"`。
- **纪律提醒（第十一次印证「零 ≠ 该补」的镜像形态：「有条目 ≠ 有活」）**：盘点未决项时**必须回代码对账**，否则会把已完成的工作当成积压，同时漏掉真正没做的事。

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

# ⚠️ 同名命令跨层异义（2026-09-19 第二十五次实测，别在最直觉的命令上跑错目标）
#   根 pnpm test      → harness.sh unit（Gateway + Python unit），不含 BeatScape
#   根 pnpm test:e2e  → harness.sh e2e（Gateway + Demo acceptance），不含 BeatScape e2e
#   BeatScape 单测 / e2e 必须带 filter：
pnpm --filter @musicsaas/beatscape test
pnpm --filter @musicsaas/beatscape test:e2e

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

# GitHub 未决项盘点（2026-09-18 第二十四次更正：PR 为 0，但 Issue 有 6 个，且均为僵尸条目）
gh pr list --state open --limit 20                                   # 期望 0
gh issue list --state open --limit 20                                # 2026-09-18 实测 = 6（#34–#39）
echo "PR: $(gh pr list --state open --limit 100 --json number --jq 'length')"
echo "Issue: $(gh issue list --state open --limit 100 --json number --jq 'length')"
# ⚠️ 关键：列出未决项后必须回代码对账，否则「有 6 个」会被当成 6 件活（本轮实测 6 个全部已完成）

# 全仓工作流盘点（2026-09-09 新增维度：仓库共 6 条，别只盯 CI 和 Deploy BeatScape）
gh workflow list
gh run list --workflow="Portal release check" --limit 2      # 门户门禁：期望 success
gh run view <run-id> --json conclusion,event,jobs             # jobs=[] + 0s = 空跑失败，别当真门禁失败排查

# 部署债务量化（ffe1ec0 = 最后一次成功部署的 head）
git rev-list --count ffe1ec0..HEAD                    # 未部署 commit 总数
git log --oneline ffe1ec0..HEAD -- apps/beatscape/    # 其中真正会触发部署的（期望每个都对应一次失败 run）

# CI run 号核对（会随时间变化，每轮开头必查；用 headSha 对 HEAD 而不是看标题猜）
gh run view <run-id> --json displayTitle,conclusion,headSha,createdAt,event
git log -1 --format='%H %s' HEAD

# 工作流盘点（2026-09-10 更正：不要只信 gh workflow list，它会漏报）
ls -1 .github/workflows/                                     # 磁盘全集（本仓 7 个）
for f in .github/workflows/*.yml; do echo "$f: $(gh run list --workflow=$(basename $f) --limit 200 | wc -l) runs"; done
awk '/^on:/,/^jobs:/' .github/workflows/<file>.yml           # 看真实触发器，不要凭名称推断

# 版本与分支盘点（2026-09-10 新增维度）
git tag | wc -l ; gh release list --limit 10                 # 有无版本化发布物（本仓 0/0）
git branch | wc -l ; git branch -r | wc -l ; git branch --merged main | wc -l

# 孤儿资产盘点（2026-09-10 第十一次新增维度：脚本 92 个中 22 个、docs 49 个中 1 个从未被引）
# 语料 = 受控文本文件，排除产物/数据目录
git ls-files | grep -E '\.(md|json|yml|yaml|sh|ts|tsx|mjs|js|txt)$' \
  | grep -v node_modules | grep -v 'apps/beatscape/public' | grep -v '^data/' > /tmp/corpus.txt
for f in scripts/*.py scripts/*.sh docs/*.md; do
  grep -Fq "$(basename $f)" $(cat /tmp/corpus.txt) || echo "ORPHAN $f"
done
# 抽查：文件名直接全仓搜，确认不是脚本误判（期望 0 命中）
grep -rl "beatscape-chart-sync-check.py" . 2>/dev/null | grep -v node_modules

# 散落待办清单盘点（2026-09-10 第十二次新增维度：本文件自称「唯一入口」，实测另有 5 个文件 91 个未勾）
git ls-files | grep -iE '(^|/)(todo|backlog|next|checklist|roadmap)'
for f in $(git ls-files '*.md' | grep -v node_modules); do
  u=$(grep -c '\[ \]' "$f"); d=$(grep -c '\[x\]' "$f")
  [ "$u" -gt 0 ] && echo "$u 未勾 / $d 已勾  $f"
done | sort -rn
# 判读：把条目翻译成「必然留下的代码痕迹」再实测，不要读文档文字就下结论
grep -n "glow-accent" apps/beatscape/src/styles.css ; ls -d docs/_visual-baseline 2>&1

# 本文件内部数字一致性检查（本轮靠它发现同一数字有 23/25/26 三个版本）
grep -n "个 commit 未部署\|部署债务" TODO.md

# 测试覆盖盲区盘点（2026-09-10 第十三次新增维度：零单测目录 + e2e 到底在不在 CI）
for d in $(find apps/beatscape/src -type d | sort); do
  n=$(find "$d" -maxdepth 1 -type f \( -name '*.ts' -o -name '*.tsx' \) ! -name '*.test.*' ! -name '*.d.ts' | wc -l)
  t=$(find "$d" -maxdepth 1 -type f -name '*.test.*' | wc -l)
  [ "$n" -gt 0 ] && echo "$d src=$n test=$t"
done
grep -n "e2e\|playwright" .github/workflows/ci.yml            # 期望 0 命中 = e2e 不在 CI
grep -ril "<PageName>" apps/beatscape/e2e/ | wc -l            # 某页面是否被 e2e 触及
gh run list --workflow=ci.yml --limit 50 --json conclusion,createdAt \
  --jq '[.[] | select(.createdAt > "2026-09-06T22:28:24Z")] | "总计 \(length) 次，success \(map(select(.conclusion=="success"))|length) 次"'

# 受控二进制资产与公开资产暴露面（2026-09-10 第十四次新增维度）
# 核心问法：有没有文件「既不在受审清单里、又能被外人从生产域名拿到」
git ls-files | wc -l ; du -sh .git                      # 本仓 1209 个受控文件 / .git 1.4G
cat .gitattributes 2>/dev/null || echo "(no .gitattributes)" ; git lfs ls-files   # lfs 装了但没用？
ls -la apps/scapemusic/public/                          # 看有无符号链接（catalog -> ../../beatscape/...）
# 是否上线可下载：直接打生产域名，200 即公开可得
for f in demo-a demo-b demo-b1 demo-b2 demo-b3; do
  curl -s -x http://127.0.0.1:7897 -o /dev/null -w "$f=%{http_code}(%{size_download}B) " \
    "https://scapemusic.pages.dev/trials/$f.m4a"
done
# 是否在受审清单内
grep -c "demo-" apps/beatscape/public/catalog.json      # 0 = 不在 105 首耳检范围内

# 构建期环境变量与部署路径盘点（2026-09-10 第十五次新增维度）
# 核心问法：把「变量引用点集合」与「变量注入点集合」交叉比对，看谁的默认值会静默生效
grep -rhoE "import\.meta\.env\.[A-Za-z_0-9]+" apps/*/src | sed 's/import.meta.env.//' | sort | uniq -c | sort -rn
for p in apps/*/package.json; do python3 -c "import json;print('$p',[v for k,v in json.load(open('$p'))['scripts'].items() if 'build' in k])"; done
grep -rn "VITE_" .github/workflows/ scripts/*.sh
grep -rn "scapemusic" .github/workflows/                # 0 命中 = 该 app 完全无 CI/CD
# 路径式深链是否真打得到：与确定缺失路径比字节数（同字节 = SPA 回落 = 无效）
curl -s -o /dev/null -w "path=%{http_code}(%{size_download}B)\n" https://scapemusic.pages.dev/track/bs-s1-01
curl -s -o /dev/null -w "missing=%{http_code}(%{size_download}B)\n" https://scapemusic.pages.dev/definitely-not-here-xyz
# 硬编码分支是否被测试覆盖：测试用的值恰好等于硬编码值 = 只覆盖了「生效」那条路
grep -n "scapemusic.pages.dev" apps/beatscape/src/lib/streamLink.test.ts

# Cloudflare Pages 路由与缓存配置盘点（2026-09-10 第十七次新增维度）
find apps/ -name '_redirects' -o -name '_headers' -o -name 'wrangler.toml' | grep -v node_modules | sort
git log -1 --format="%H %ai %s" -- apps/beatscape/public/_headers   # 最后修改时间 vs 最后部署时间
git show ffe1ec0:apps/beatscape/public/_headers                      # 线上实际跑的版本
curl -sS -x http://127.0.0.1:7897 -D - -o /dev/null https://beatscape.pages.dev/catalog.json | grep -i cache-control
ls -la apps/beatscape/dist/release.json apps/beatscape/public/release.json  # dist 有 / public 无 = 构建产物
ls -la apps/scapemusic/public/_redirects apps/scapemusic/public/_headers     # 全部 No such file = 零 CF 配置

# i18n / 文案清单盘点（2026-09-10 第十八次新增维度）
# 核心问法：把「定义的 key 集合」「被引用的 key 集合」「可达的 locale 集合」三组交叉比对
python3 - <<'PY'
import re
def load(p):
    s=open(p,encoding='utf-8').read()
    return dict(re.findall(r'^\s*([A-Za-z0-9_]+):\s*"((?:[^"\\]|\\.)*)"',s,re.M))
en=load('apps/beatscape/src/i18n/en.ts'); zh=load('apps/beatscape/src/i18n/zh.ts')
print('defined',len(en),'| zh==en:',[k for k in en if en.get(k)==zh.get(k)])
PY
grep -rhoE "\bt\.(ui|leaderboard)\.[A-Za-z0-9_.]+" apps/beatscape/src | sort -u   # 真正接线
# ⚠️ t.track_id / t.title / t.bpm 等是遍历曲目的同名局部变量，必须回看命中行再判定
grep -rn "emptyState\|leaderboard\.\(title\|subtitle\)" apps/beatscape/src | grep -v "src/i18n/"   # 死命名空间？
grep -rn "getMessages(" apps/beatscape/src                                # 全无参 = 恒用 DEFAULT_LOCALE
grep -rn "navigator.language\|Accept-Language" apps/*/src apps/*/index.html
grep -n "lang=" apps/beatscape/index.html apps/scapemusic/index.html
grep -niE "language|语言|locale" apps/beatscape/src/pages/Settings.tsx    # 有无切换入口
grep -n "keyPaths\|toEqual\|not.toBe" apps/beatscape/src/i18n/i18n.test.ts # parity 比 key 还是比 value

# 依赖与运行环境清单盘点（2026-09-10 第十九次新增维度）
# 核心问法：把「声明的依赖集合」与「代码里实际的引用集合」交叉比对（幽灵依赖 / 未使用依赖）
# 1) Node 侧：逐包比对 dependencies+devDependencies 与源码里的 import specifier
#    specifier → 包名：@scope/x/y 取前两段，其余取第一段；排除相对路径与 node: 内置
# 2) Python 侧：按目录聚合第三方 import（先排除标准库，否则全是噪音）
git ls-files '*.py' | xargs grep -hoE "^\s*(import|from)\s+[A-Za-z_][A-Za-z_0-9]*" | sort | uniq -c | sort -rn
# 3) 关键：判「缺口会不会炸」——先查谁在安装依赖（workflows 里 0 命中 ≠ 没人装）
grep -rn "pip install\|requirements.txt" .github/workflows/
grep -n "ensure_py_env" -A 8 scripts/harness.sh      # 真正的安装点，且有 venv 缓存分支
# 4) 收口：CI 实际执行的那几个脚本是否纯标准库（本轮 3 个全是，故 scripts/ 缺 requirements 不影响 CI）
for f in scripts/beatscape-audit.py scripts/beatscape-catalog-status.py scripts/beatscape-earcheck.py; do
  grep -hoE "^\s*(import|from)\s+[A-Za-z_][A-Za-z_0-9]*" "$f" | sort -u | tr '\n' ' '; echo
done

# 运行时错误可观测性与崩溃兜底盘点（2026-09-11 第二十一次新增维度）
# 核心问法：线上崩了之后谁能知道？按「兜底 → 接管 → 上报 → 可调试性」四层逐层查
# 1) 崩溃兜底：有没有 ErrorBoundary，哪些 app 有
grep -rn -E "ErrorBoundary|componentDidCatch|getDerivedStateFromError" apps/*/src
for a in beatscape scapemusic demo neonbeat; do echo -n "$a: "; grep -rl -E "ErrorBoundary|componentDidCatch" apps/$a/src 2>/dev/null | wc -l; done
# 2) 关键：兜底到底上没上线？先溯源引入时间，再直接 grep 线上 bundle
git log -1 --format='%h %ad %s' --date=iso -- apps/beatscape/src/components/ErrorBoundary.tsx
git merge-base --is-ancestor <该commit> ffe1ec0 && echo "已在部署内" || echo "晚于部署"
curl -s -x http://127.0.0.1:7897 https://beatscape.pages.dev/assets/<bundle>.js | grep -c "Signal lost"
#    ⚠️ 只查源码会得出「有兜底」，但必须再查线上，否则不知道用户实际有没有
# 3) 全局错误接管（注意排除元素级监听的假阳性）
grep -rn -E "window\.onerror|addEventListener\(.error.|unhandledrejection" apps/*/src apps/*/index.html
# 4) 静默吞异常：空 catch 数量（0 = 没有静默吞）
grep -rn -E "catch\s*\{?\s*\}" apps/beatscape/src | wc -l
# 5) sourcemap 三连问：配置 / 产物 / 线上是否暴露
grep -n "sourcemap" apps/*/vite.config.ts                       # 均无 = 默认 false
ls -1 apps/beatscape/dist/assets/*.map 2>/dev/null | wc -l
git ls-files | grep -c "\.map$"
curl -s -o /dev/null -w "%{http_code} %{size_download}\n" -x http://127.0.0.1:7897 \
  https://beatscape.pages.dev/assets/<bundle>.js.map            # 2146 B = SPA 回落 = 不存在

# 链接自检（2026-09-10 第十五次修正：必须按 # 切分，否则带锚点的链接会假报 MISS）
python3 -c "
import re,os
txt=open('TODO.md').read(); links=re.findall(r'\]\(([^)]+)\)',txt)
files=[l for l in links if not l.startswith('#') and not l.startswith('http')]
print('MISS:',[f for f in files if not os.path.exists(f.split('#')[0])])   # 注意 split('#')
"

# Git 历史与仓库体积健康度盘点（2026-09-17 第二十三次新增维度）
# 核心问法：事故「删掉了」不等于「结束了」——它留下的痕迹是否仍在被每个 clone 付费？
du -sh .git                       # 本轮 1.9 GiB
git count-objects -vH             # size-pack 1.10 GiB / size 560.60 MiB / size-garbage 270.15 MiB
# 历史里最大的 blob（--all 含所有分支；只看 main 就把 --all 换成 HEAD）
git rev-list --objects --all \
  | git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' \
  | awk '$1=="blob" && $3>5000000 {print $3, $4}' | sort -rn | head -25
# 只给某一类文件「算总账」（本轮靠它得到 preview_48s.wav = 54 个 / 436.05 MiB）
  ... | awk '$1=="blob" && $4 ~ /preview_48s\.wav$/ {n++; s+=$3} END{print n, s/1048576" MiB"}'
# 判这笔账是否在 main 上（是 → 永久债务；否 → 只在别的分支）
git merge-base --is-ancestor <commit> HEAD && echo YES || echo NO
git branch -a --contains <commit>
# 判 tmp_pack_* 是并发写入还是陈旧垃圾（看 mtime；本轮 09-01 遗留、16 天未变 → 陈旧）
ls -la .git/objects/pack/ | grep tmp_pack
```

**说明**：`bash scripts/harness.sh all` = unit + workspace build + mock integration。技术检查通过不替代人工耳检、盲测与上线签审。

> **2026-09-11 第二十二次刷新提示**：连续第二十一轮无新落地项。本轮两条经验：① **资产盘点有两个方向，前二十一轮只做了一个**——第十四次做的是「磁盘 → 声明」（找未声明却已上线的暴露面，`trials/` 5 个 m4a），本轮补上反方向「**声明 → 磁盘**」（找悬空引用）：105 首 × 4 类资产零缺失、315 谱面双向差集均为 0、零空谱、难度逐档递增。**两个方向合起来才算盘完**，只做一个会漏掉另一类；本轮这个方向「干净」的价值是**排除了一整类风险，后续不必再查**。② **发现「覆盖率不足」时，先查这份覆盖率是不是某个已结项任务的范围**——`preview_48s.m4a` 只有 25/105，单看像「80 首忘了登记」；`grep -rn "preview_48s" docs/*.md` 一查发现 `docs/BEATSCAPE-OPTIMIZATION-AUDIT.md` 早就把它记为审计 **P1-2 项且已 ✅ 结项**（10→25，27.8 MB 与实测 27.78 MiB 吻合）→ **剩下 80 首是「从未生成」而非「生成了没登记」**。若跳过这一步直接写待办，就会把一个已完成项重新打开。**手法：覆盖率数字异常时，先 `grep -rn "<字段/文件名>" docs/*.md` 看它是否已被某份文档记账。** 另注：CI run 号已**连续第十四轮**写入即过期；本轮工作区 10 项改动 + 11 项未跟踪（较上一轮多 1 项未跟踪的 memory 日志，非功能改动），未触碰。
>
> **2026-09-11 第二十一次刷新提示**：连续第二十轮无新落地项。本轮两条经验：① **「有没有兜底」必须查线上，不能只查源码**——这是第六次「先溯源再定性」的变体。源码里有 `ErrorBoundary.tsx` 只说明「写了」，本轮用 `git log -1 -- <文件>`（`51489b3`，09-01）→ `git merge-base --is-ancestor … ffe1ec0` 确认它是最后成功部署的祖先 → 再 grep 线上 bundle 拿到 `Signal lost` **1 命中**，才敢断言「兜底**已上线且生效**」。同一手法反过来用在 ScapeMusic 上，就得到「线上 bundle `Signal lost` **0 命中** → 渲染异常即白屏」——**同一条命令，在两个 app 上给出相反结论，这正是必须逐个 app 实测、不能用一个 app 代表全仓的理由。** ② **四个「零」里只有一个值得登记，判据是「会不会改变我们能否发现用户遇到的问题」**：零 sourcemap（同时也意味着不泄露源码，是安全与可调试性的权衡，**不单独立待办**）· 零全局接管 · 零上报 · 零空 catch（**干净**）。真正有价值的是**零上报 + 零 sourcemap 的合成结论**：**已上线产品对真机错误全盲**，而 P0-4 英语叙事真人试玩恰恰完全依赖真机反馈 → **试玩中崩溃将无任何取证手段**。这条直接影响 P0-4 的可执行性，此前二十轮无人提出。另注：CI run 号已**连续第十三轮**写入即过期；本轮工作区 10 项改动 + 10 项未跟踪，**连续第九轮构成完全一致**。
>
> **2026-09-10 第二十次刷新提示**：连续第十九轮无新落地项。本轮两条经验：① **把「线上落后」的粒度从「代码 / 内容」再往下拆到「逐文件」**——此前只断言到「内容（catalog / 谱面）是最新的、只有 JS 代码落后」，本轮一查静态资产就发现**逐文件结论完全不同**：`robots.txt` 线上与本地一致、`sitemap.xml` 落后一行（缺 `/shift`）、**`og.png` 线上根本不存在**（返回 2146 B SPA 回落页）。而 `og.png` 是 `og:image` / `twitter:image` 的唯一来源 → **所有站外分享（Reddit / X / Discord / Slack）当前都拿不到预览图**，这对 P3 Reddit 首发是发帖前必验项。**判据：只要断言对象是一个「目录」或「一类文件」，就还要再往下拆一层。** ② **抓到「线上缺某个文件」时的正确动作是溯源，不是登记**：本轮先 `git log -1 -- apps/beatscape/public/og.png` 查出它由 `8b710a3`（09-05 16:06）引入、比最后一次成功部署 `ffe1ec0`（09-05 00:31）晚约 15.5 小时 → **直接判定为 P0-6 的症状、归到 P0-6，不新开「补图片」待办**（补了也没用，只有部署通了它才会出现，见「判断标准是这个缺口有没有独立解法」）。③ **a11y 是本轮又一类「查完发现干净」的维度**（此前有凭据卫生、依赖声明、构建产物覆盖）：87 处 `aria-`、15 `role=`、**12 个 `prefers-reduced-motion` 媒体查询**、38 `<button>` vs 48 `onClick`、`index.html` 静态 meta 齐全且不依赖 JS 注入 → **零待办**。唯一缺口是 `Duo.tsx:326` 一个可点击 `div`（无 `role` / `tabIndex`），**因属源码改动、需单独提交，本轮只登记不动手**。另注：CI run 号已**连续第十二轮**写入即过期；工作区 10 项改动 + 10 项未跟踪，**连续第八轮构成完全一致**。
>
> **2026-09-10 第十九次刷新提示**：连续第十八轮无新落地项。本轮两条经验：① **「声明的依赖」与「实际的引用」是前十八轮唯一没交叉比对过的一整类清单，一查就出现三分局面**：Node 侧 6 个包**零幽灵依赖**（pnpm 严格链接下本就不可能存活），而那份「声明了却从未 import」的 9 项**全部**是 `@types/*` / `typescript` / `tsx` / `prisma` 经 tsconfig 与 CLI 隐式使用的工具链 → **再次印证「清单 ≠ 该清」，拒绝生成清理待办**；Python 侧则相反——`tests/` 与 `workers/*` 都有 requirements，**唯独 `scripts/`（内容生产链、全仓最大的 Python 面，需 17 个第三方包）一份都没有**。② **但「有缺口」不等于「会炸」，本轮最有价值的是把边界查清楚了**：7 条工作流的 yml 里 `grep "pip install|requirements.txt"` 零命中，**差点就写成「CI 装不上依赖」——实际安装发生在 `scripts/harness.sh:34-40` 的 `ensure_py_env`**，只服务 unit/integration/e2e 三个 tier；而 CI 的 `beatscape` job **不经过 harness.sh**，是裸 `python3` 直跑脚本，实测那 3 个脚本 **100% 标准库** → **缺口完全落在 CI 之外，当前零影响，不构成阻塞项**。**教训：发现「少了某个文件」后，下一步必须查「谁会用到它」，而不是直接登记待办。** 由此沉淀出一条此前无人记录的隐藏约束：**那 3 个脚本必须永远保持纯标准库**——开发机装了 torch/numpy，加一句 `import numpy` 本地照过、CI 立刻红，而现有流程无任何环节拦得住（仅留档，不生成待办）。另注：CI run 号已**连续第十一轮**写入即过期；本轮工作区 10 项改动 + 10 项未跟踪，**连续第七轮构成完全一致**。
>
> **2026-09-10 第十八次刷新提示**：连续第十七轮无新落地项。本轮两条经验：① **多语言是前十七轮唯一没盘过的一整类「清单」，一查就发现接线度只有 25%**——定义了 40 个文案 key，真正被 `t.ui.*` 引用的只有 **10 个**，15 个页面里只有 **Home / Track** 走 i18n。**最反直觉的是 `zh` locale 运行时完全不可达**：3 个 `getMessages()` 调用点**全部不传参**，恒取 `DEFAULT_LOCALE="en"`，加上无切换入口、无 `navigator.language` 探测、`<html lang="en">` 硬编码 → 那 40 条中文文案和 2 个 parity 测试保护的是一个没有任何代码路径能到达的分支。**这依然不是缺陷**（`zh.ts:3` 自述「阶段一占位」、英文是发布语言），本轮**拒绝生成「补中文」待办**；价值在于**揭示真实成本**——从本文件任何一处看都像「翻 7 句英文」，实测是「13 个页面先抽文案 + 补切换入口」，差一个数量级。② **发现一种新形态的假安全感：「有测试无调用方」**——`leaderboard` 命名空间 9 个 key 在 `src/` 里**零引用**（`Leaderboard.tsx` 根本没 import i18n），却有 2 个单测；其中 `leaderboard.test.ts:19` 断言「zh 的 `emptyState` ≠ en」，而 `emptyState` 恰好是该命名空间**唯一译了的** key → **测试挑了必然通过的那个样本**。这与第十三次「有测试（e2e）但没在 CI 跑」合起来给出一条通用判据：**判断一块东西是否真被保障，要问「谁在运行时到达它」，而不是「有没有测试提到它」。** 另注：CI run 号已**连续第十轮**写入即过期；本轮工作区 10 项改动 + 10 项未跟踪，**连续第六轮构成完全一致**。
>
> **2026-09-10 第十七次刷新提示**：连续第十六轮无新落地项。本轮两条经验：① **配置文件的「线上版本」≠「仓库版本」**——`_headers` 在 `8b710a3`（09-05 16:06）修改，晚于最后一次成功部署 `ffe1ec0`（09-05 00:31），因此线上 cache-control 是旧版本（`catalog.json` 线上 `max-age=300` vs 仓库 `max-age=0`）。判据极简：**`git log -1 --format=%ai -- <配置文件>` 与部署时间一比即可**，不需逐字对比内容。**部署债务不只影响 JS 代码，还影响缓存策略与安全头。** ② **`release.json` 是构建产物（`release.mjs:113` 生成），本地 `dist/` 有 61,500 B，线上返回 2146 B SPA 回落 → 直接证明生成它的构建从未部署**。这比此前用「bundle 缺某字符串」当证据更干净——不需要先验证字符串引入时间，构建产物的在线缺失直接等于「带 `release:check` 的构建从未部署过」。另注：CI run 号已**连续第九轮**写入即过期；本轮工作区 10 项改动 + 10 项未跟踪，**连续第五轮构成完全一致**。
>
> **2026-09-10 第十五次刷新提示**：连续第十四轮无新落地项。本轮三条经验：① **把「变量引用点集合」与「变量注入点集合」交叉比对**——单独看任一边都正常（引用点都有默认值所以跑得起来，注入点都有值所以「配过了」），一比对就发现 `VITE_GAME_URL` 只在部署脚本注入、`VITE_API_BASE` 全仓零注入。**更关键的是它还能发现「配了但已经不适用」这类问题**：`VITE_STREAM_APP_URL` 有注入，但其 hash 路由修正是**按域名字符串硬编码**的（`streamLink.ts:10`），换任何域名即静默失效——**「有没有配」发现不了「配的值还成不成立」**，判据应该是「错了会不会被谁发现」。② **测试存在 ≠ 覆盖了会变的地方**：`streamLink.test.ts` 的第 1 个用例用的**恰好就是**被硬编码的那个域名 → 测试只证明了「硬编码生效时是对的」，换域名后仍全绿。**这与第十三次「e2e 不在 CI」是同一类缺口**；检查硬编码分支时，看一眼测试用的取值是否恰好等于硬编码值，一次就能发现。③ **修正一条连续六轮重复的错误结论**：每轮都写「链接自检唯一 MISS 是 `#bs-d001` 锚点假阳性」，实际是**自检脚本没对 `#` 切分**，把 `docs/BEATSCAPE-DECISIONS.md#bs-d001` 整串当路径判不存在。改正后 **23 条文件链接 + 17 个锚点全 OK、MISS 为 0**。**教训：一个每轮都复现的「已知假阳性」，往往不是真相，而是检查脚本本身的 bug**——连续六轮都没人去查脚本。另注：CI run 号已**连续第七轮**写入即过期；本轮工作区 10 项改动 + 10 项未跟踪，**连续第三轮构成完全一致**。
>
> **2026-09-10 第十四次刷新提示**：连续第十三轮无新落地项。本轮两条经验：① **把「受控 / 已发布 / 已受审」三个集合交叉比对，比单独看任何一个都有效**——单看孤儿文件只是噪音（前几轮「孤儿 ≠ 该删」已证明），但本轮问「有没有文件**既不在受审清单里、又能被外人从生产域名拿到**」，一问就抓到 `apps/scapemusic/public/trials/` 的 5 个 m4a：源码 0 引用、不在任何 catalog、**却已上线且全部 200 可下载**，且**从未进入 P0-1 耳检的 105 首范围**。**「未被引」在本地无害，「未被引 + 已公开」才是暴露面。** ② **统计体积时先查符号链接**：`apps/scapemusic/public/catalog` 是指向 BeatScape catalog 的 symlink，`du` 会算成 1073 MiB、`os.walk` 默认不跟随又算成 27.8 MiB，两个都对不上；`ls -la` 看 `lrwxr-xr-x` 才解开矛盾。另：本轮确认 **git-lfs 装了但从未使用**（无 `.gitattributes`），410 MiB 音频全进 git 历史，`.git` 已 1.4 G——**这是「没有的东西」型事实，与上一轮「0 tag / 0 Release」同类**，平时没人查但决定了后续迁移成本。
>
> **2026-09-10 第十三次刷新提示**：连续第十二轮无新落地项。本轮两条经验：① **查「有没有测试」之前，先查「测试在哪跑」**——本轮按目录统计发现 `pages/` 15 个文件零单测，看似严重；但追到工作流才发现真正的问题是 **4 个 Playwright e2e spec 不在 `ci.yml` 里，只在部署管道里跑**，而部署管道自 09-06 起无新 run → **e2e 已空窗 4 天，同期 13 次「CI 绿」没有一次包含浏览器回归**。**「有测试」和「测试被执行」是两件事**，只统计前者会得出完全错误的结论。② **又一次印证「零 ≠ 该补」**：与「孤儿 ≠ 该删」「未勾 ≠ 没做」同源，`pages/` 用 e2e 覆盖是合理层级，本轮**拒绝生成「补 39 个单测」**，只登记「是否把 e2e 接入 CI」一条候选（属工程权衡，非缺陷）。附带一条可操作信息：**当前想在远程拿到 e2e 结果，只能触发一次部署 run**——因为 `release:check`（含 `test:e2e`）排在 `launch:check` 之前，即使门禁注定失败，e2e 也会跑完并上传 `beatscape-release-evidence` 产物。
>
> **2026-09-10 第十二次刷新提示**：连续第十一轮无新落地项。本轮两条经验：① **「未勾复选框」是最容易骗人的待办来源**——`docs/RESONANCE-VISUAL-PLAN.md` 有 26 个未勾、0 个已勾，看着像一整份没做的改造，实测代码后发现 Anton / halftone / `--glow-accent: none` 全部已落地，**真正没做的只有 1 条**（视觉回归基线目录）。**一份「全未勾」的计划文档，通常不是因为一项都没做，而是因为做完后没人回来勾选。** 判读手法是把条目翻译成「必然留下的代码痕迹」（字体名、CSS 变量、目录、函数名）再实测。② **同一个会变的数字在本文件里可能有多处副本**：本轮部署债务出现了 23（速览）/ 25（正文）/ 26（实测）三个版本——上一轮只改了正文。**改任何数字前先 `grep -n` 全局找一遍它的所有出现位置**，本轮 CI run 号同样是「正文 + 速览」两处不一致（且速览比正文还落后两轮）。
>
> **2026-09-09 第八次刷新提示**：网络已于本轮恢复（代理端口 `7897` 可用），**上一轮搁置的线上取证已全部补做**，结论见 P0-6 / P1-3。沿用规则不变：**网络不可达时不得把「拿不到返回」记为「线上异常」**，须沿用上一次成功取证的日期与结论；恢复后优先补做。另本轮确认一条易错点：**「线上内容落后」与「线上代码落后」必须分开断言**——`catalog.json` 与谱面资产是数据文件，可能已随早先成功部署上线，只有 bundle JS 才必然落后于 `main`；合并成一句「线上落后」会误导判断。
>
> **2026-09-10 第十一次刷新提示**：连续第十轮无新落地项。本轮两条经验：① **「孤儿清单」是一种此前完全没查过的维度，而且它带来的是「候选」而不是「待办」**——92 个脚本里 22 个从未被引，但其中绝大多数是一次性 Ingest / 训练 / 环境脚本，**落单是它们的正常形态**；真正值得追问的只有**诊断类**脚本（诊断没人跑等于没诊断）。**盘点出新清单时，先问「这类文件落单是否正常」，再决定要不要生成待办**，否则会批量制造噪音（本轮因此拒绝生成「清理 22 个孤儿脚本」这种条目）。② **债务类数字要拆成两个看**：本轮部署债务 23→25，看着像恶化，但拆开看「触及 `apps/beatscape/**` 的仍是 6 个、名单不变」，增量全是 TODO 刷新自身 → **「总数」与「其中触及代码的个数」必须同时记录**，否则文档刷新会被误读成功能积压。另注：CI run 号**连续第三轮**出现「写入即过期」，这类值已被反复证明不可跨轮沿用。
>
> **2026-09-10 第十次刷新提示**：连续第九轮无新落地项，价值仍来自**纠错与新增盘点维度**。本轮三条经验：① **`gh workflow list` 不是全集**——它漏报了 `agent-delivery-dispatch.yml`（磁盘 7 个 yml，list 只给 6 行，加 `--limit 50` 也没用），但该文件的 run 一查就有 7 条。**盘点「有哪些工作流」必须枚举磁盘文件；判断「是否废弃」要看有没有 run，而不是在不在 list 里。** ② **看到 `failure` 先读 job 结尾再下结论**——`agent-delivery-dispatch.yml` 的 7 次失败全是主动 `exit 1` 的路标文案（派单已迁到本地 Codex CLI，本工作流不干活），只看结论列会凭空造出一个不存在的待办。这提醒一个通用风险：**本文件里的「failure」若不加判读，会持续污染待办清单。** ③ **把「没有的东西」也记下来**——「0 tag / 0 Release」这种负面事实平时没人查，但它直接决定了 P0-3 的签审只能锚 commit SHA；**盘点维度不必都是「有什么」，「没有什么」同样能改变结论。** 另注：CI run 号已连续两轮出现「写入即过期」，这类值已被证明不可跨轮沿用。
>
> **2026-09-09 第九次刷新提示**：连续第八轮无新落地项，价值仍来自**纠错与新增盘点维度**，本轮三条：① **CI run 号这类「会随时间变化的值」要在下一轮开头就复查**——上一轮写 `34242405531` 时它确实还没出结果，属「写入即过期」，不是写错；② **把「债务」量化成数字比形容更有用**：「23 个 commit 未部署 / 其中 6 个触及代码且每个都触发失败」，一句话就能排除「是不是没触发」这类猜测；③ **新增维度优先选「从未查过的清单」**——本轮 `gh workflow list` 一查就发现还有 4 条此前完全没跟踪的工作流，其中 Portal release check 是 success，直接改变了对 P0-5 的判断。另记一条**诚实边界**：API contract gate 的失败成因本轮**未查清**（`jobs` 为空、文件里没有 push 触发却出现 push 事件的 run），已明确标注「不臆断成因、不作为阻塞项」，**不得写成「已排除」**。

# 本地数据持久化与隐私声明一致性盘点（2026-09-18 第二十四次新增维度）

> **为什么查这个**：前二十三轮盘过构建期变量、运行时外域、CF 缓存、公开资产暴露面，但**从未盘过「浏览器里到底存了什么」**，也**从未把对外隐私承诺与代码对账**。而 `index.html` 与 `Legal.tsx` 对外明确写着「No account, no ads. Scores stay on your device」——这是一条**可被证伪的公开承诺**。

## 实测结论

**(a) 存储清单（BeatScape 19 个 key，ScapeMusic 3 个）**
`bs_last_run` · `bs_last_run_local` · `bs_board` · `bs_daily_board` · `bs_display_name` · `bs_new_achievements` · `bs_rank_up` · `bs_settings` · `bs_offset_ms` · `bs_keys` · `bs_onboarded` · `bs_favorites` · `bs_scores` · `bs_first_shift_v1` · `bs_analytics` · `bs_runs` · `bs_achievements` · `bs_rank` · `bs_streak_update`；ScapeMusic：`sm_favorites` / `sm_player` / `sm_recent`。

**(b) 对外承诺实测成立，据此不生成待办（第十一次印证「零 ≠ 该补」，这里是「零外发 = 干净」）**
- **零 IndexedDB、零 `document.cookie`、零 `navigator.sendBeacon`**（`apps/beatscape/src` 全量 grep，排除测试与 `node_modules`）。
- 非测试源码 `fetch` 仅 **3 处，全部同源**：`loadCatalog.ts:21`（`catalog.json`）、`loadCatalog.ts:48`（谱面）、`decodedAudioCache.ts:195`（音频）→ **无任何跨源数据外发**。
- `navigator.clipboard` / `navigator.share` 均为**用户主动触发的本地能力**（`Results.tsx:84/124/172`），非后台采集。
- `Legal.tsx:16` 自述「play records, personal bests, calibration offset, and settings in your browser only (localStorage) …… no server upload of scores in Stage1–3」→ 与实测一致。

**(c) 唯一登记的残留：一处「惰性外发面」（不是现状缺陷，是未来零成本开启的口子）**
- `src/lib/analytics.ts` 定义 **23 类埋点事件**（`home_view` / `home_play_click` / `home_sound_toggle` / `home_hero_play_start` / `home_hero_play_finish` / `daily_challenge_click` / `radio_view` / `play_start` / `play_finish` / `duo_start` / `duo_finish` / `share_copy` / `share_poster` / `share_poster_copy` / `share_poster_share` / `results_next_track` / `pwa_install_prompt` / `note_speed_ready_change` / `practice_tempo_change` / `curated_play` / `shift_continue` / `sound_check` / `calibrate_open`），在 **9 个文件**中被真实调用（`Home` / `Play` / `Duo` / `Results` / `Radio` / `HomeHeroPlay` / `CuratedRow` / `PlayField` / `PwaInstallCard`），缓冲写 `bs_analytics`（`slice(-120)`，**有界**）。
- `analytics.ts:38-39` 有一处 **Plausible 第三方转发钩子**：`window.plausible?.(event, { props })`（try/catch 包裹，可选挂载）。
- **当前实际零外发**：全仓 `grep -i plausible` 除本文件外**只命中文档**（`docs/TODO.md:28`、`apps/beatscape/PRD.md:98/418/435`、`docs/BEATSCAPE-COMMERCIALIZATION-GAP.md:49/143`）与构建产物 → **没有任何 Plausible 脚本被加载**，钩子是死路。与第十六次「运行时外域只有 Google Fonts」交叉印证。
- **风险形态**：只要在 `index.html` 加一行 Plausible 脚本，**23 类行为事件即在零代码改动下开始向第三方发送**；而 `Legal.tsx:20` 只承诺不做第三方「**广告**」追踪，**全文未提及事件埋点与可选转发** → 已登记为 **P0-3 签审确认项**（只陈述事实，不作法律结论）。

**(d) 附带一条「有代码无测试」**：`analytics.ts` 是 `apps/beatscape/src/lib/` 下**唯一零单测**的模块（同目录 `firstShift.ts`、`progress.ts` 均有 `.test.ts`），且它恰好带第三方转发分支 → 与第十七次「测试存在 ≠ 覆盖了会变的地方」同类。**仅留档，不生成独立待办。**

## 可复用命令

```bash
# 1) 存储 key 全集（⚠️ 必须先排除 node_modules / dist，否则全是噪音）
grep -rn '"bs_[a-z0-9_]*"' apps/beatscape/src --include='*.ts'   # zsh 下改用 Grep 工具，--include 会被 glob 报错

# 2) 有没有外发：三件套 + fetch 是否同源
#    IndexedDB / cookie / sendBeacon 期望全 0；fetch 命中应只有 catalog/谱面/音频

# 3) 埋点是否真的被调用（区分「定义了」和「在用」）：grep trackEvent 的命中文件数

# 4) 隐私文案对账：读 Legal.tsx 的英文承诺，逐条对照上面三问
```

## 判读纪律
- **「零外发」是干净结论，不生成待办**；值得登记的只有**「加一行配置就能开启、且文案没提」的惰性外发面**——判据仍是那句：*这个事实会不会在没人注意的情况下改变用户实际被采集的东西*。
- **模块名会骗人**：`analytics.ts` 听起来像「在上报」，实测是**本地缓冲 + 死钩子**。判读顺序固定为：**先看有没有调用方 → 再看有没有传输通道 → 最后看传输通道有没有被接线**，顺序反了就会凭名字写出假的隐私待办。
