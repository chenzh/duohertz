# MusicSaas 项目 TODO

> **本文件是待办的唯一入口**，只登记**当前真实未完事项**，细节一律链接到对应权威文档，不在此复制正文。
> **本轮改动（2026-09-10 第十七次）**：① **CI run 号连续第九轮「写入即过期」，已更正**：main 最新 CI 实为 **`34446200971`**（success，09-10T06:39:37Z），`headSha` 核对为 `9eeee798a5d3…` = 当前 HEAD；上一轮写的 `34437400256` 对应的是再上一个 commit `7817d5d`。**该值已连续九轮证明不可跨轮沿用，每轮开头必须复查**（速览表与工作流表**两处**均已同步更正）；② **部署债务 31 → 32**（`git rev-list --count ffe1ec0..HEAD`；触及 `apps/beatscape/**` 的**仍为 6 个、名单不变**，增量仍全部来自本文件自身的刷新 commit；`a136592` 之后的 docs-only 数由 16 → **17**）；③ **新增「Cloudflare Pages 路由与缓存配置」维度（详见 [专节](#cloudflare-pages-路由与缓存配置盘点2026-09-10-第十七次新增维度)），首次查 BeatScape / ScapeMusic / Demo 三个 app 的 `_redirects` / `_headers` / `wrangler.toml`**，五条结论：(a) BeatScape 的 `_redirects` 是 `/*    /index.html   200`（SPA 回落规则）——这就是 `/release.json` 返回 2146 B SPA HTML 的**机制**；(b) **`release.json` 是 `release.mjs:113` 生成的构建产物**，本地 `dist/release.json` 实存 **61,500 B**，线上却返回 2146 B 回落页 → **直接证明生成它的那次构建从未部署**（比此前用「bundle 缺某字符串」更干净——不需要先验证字符串引入时间）；(c) **`_headers` 在 `8b710a3`（09-05 16:06 +0800）修改，晚于最后成功部署 `ffe1ec0`（09-05 00:31 +0800）** → 线上 cache-control 是旧版本：线上 `catalog.json` 返回 `max-age=300`（与 `ffe1ec0` 版 `_headers` 一致），当前仓库 `_headers` 已改为 `max-age=0`；线上 `/catalog/*` 为 `max-age=2592000`（30 天），当前已改为 `max-age=0` → **部署债务不只影响 JS 代码，还影响缓存策略**；(d) **ScapeMusic 零 CF Pages 配置文件**（无 `_redirects` / `_headers` / `wrangler.toml`），完全依赖 Cloudflare 默认 SPA 回落 → 既无缓存头也无安全头，是上一轮「trials/ 5 个 m4a 能上线」成因的又一佐证；(e) 仅 BeatScape 有 `wrangler.toml`（极简 4 行），Demo 门户的完整 CSP 在 `dist-portal/_headers`（构建产物目录，非源控）；④ 其余断言本轮实测**全部仍成立且与上一轮一致、无变化**：曲库 105 首（s1 6/s2 4/s3 15/s4 15/s5 10/s6 35/p3 10/p4 10）、315 谱面、`stream_app_url` 0-105 / `stream_audio` 105-105、线上 catalog **105 首 / 315 谱面 / `stream_app_url` 0 且曲目 ID 集合与本地完全一致**、p4 谱面 **200**、线上 bundle 仍 `index-CDXE9BO-.js`（325,768 B；`scapemusic.pages.dev` 0 / `No account, no ads` 0 / `App link coming soon` 1 / `127.0.0.1:5175` 0）、`release.json` 与缺失路径同为 **2146 B**（仍 SPA 回落）、放行七字段全 null、源码零 TODO/FIXME、零 `@ts-ignore`、非测试源码零 `any`（4 命中 = 3 处 `hitsounds.test.ts:6/69/73` 测试桩 + `Duo.tsx:114` 注释英文假阳性）、T1b·T5b 零测试命中、**23 条文件链接 + 22 个内部锚点全 OK、MISS 为 0**（连续第三轮确认）、部署管道仍 5 连败、最后成功 `33895713222`（09-04）、**无新增 run**、`gh workflow list` **仍只返回 6 条**（连续第八轮印证它漏报 `agent-delivery-dispatch.yml`）。
>
> **历史（2026-09-10 第十六次）**：① **CI run 号连续第八轮「写入即过期」，已更正**：main 最新 CI 实为 **`34437400256`**（success，09-10T04:29:49Z），`gh run list --json headSha` 核对为 `7817d5d2f54d…` = 当前 HEAD；上一轮写的 `34428724668` 对应的是再上一个 commit `89c5cd6`。**该值已连续八轮证明不可跨轮沿用，每轮开头必须复查**（速览表与工作流表**两处**均已同步更正）；② **部署债务 29 → 31**（`git rev-list --count ffe1ec0..HEAD`；触及 `apps/beatscape/**` 的**仍为 6 个、名单不变**，增量仍全部来自本文件自身的刷新 commit；`a136592` 之后的 docs-only 数由 14 → **16**）；③ **新增「运行时外部依赖与字体供应链」维度（详见 [专节](#运行时外部依赖与字体供应链盘点2026-09-10-第十六次新增维度)），首次枚举「受控源码里哪些外部域名会在用户浏览器运行时真正发起请求」**，核心发现：**BeatScape / ScapeMusic / NeonBeat 三个 app 的三款字体（Anton 展示体 · Sora · IBM Plex Sans）100% 取自 Google Fonts CDN，仓库零本地字体文件**（`git ls-files` 无 `woff2`/`otf`/`ttf`）。已做非阻塞加载（`preload`→`onload` 切 `rel` + `noscript` 兜底）**不会卡首屏，但失败是静默的**——`styles.css` 有 10+ 处把 Anton 写作首选展示字体，CDN 不可达时静默回退 `system-ui`，**无任何报错、无任何监控**；④ **同维度顺带核对的四条「干净」结论（均为本轮实测，非沿用旧值）**：受控文件**零** `node_modules`/`dist` 类误提交、**零** `.env`（非 `.example`）曾进入 git 历史、**零** 私钥 / `sk-` / `ghp_` / `AKIA` 型凭据字面量、8 个构建产物目录**全部**被 gitignore 覆盖；另查得 `apps/beatscape/public/_headers` **没有 CSP**（只有缓存头 + `nosniff` + `referrer-policy`），因此**当前与 Google Fonts 不冲突**——但 `apps/demo` 门户的 CSP 是 `font-src 'self'` + `style-src 'self' 'unsafe-inline'`，**将来若把门户那套 CSP 复用到 BeatScape/ScapeMusic，字体会被完整阻断且同样静默**；⑤ 其余断言本轮实测**全部仍成立且与上一轮一致、无变化**：曲库 105 首（s1 6/s2 4/s3 15/s4 15/s5 10/s6 35/p3 10/p4 10）、315 谱面、`stream_app_url` 0-105 / `stream_audio` 105-105、线上 catalog **105 首 / 315 谱面 / `stream_app_url` 0 且曲目 ID 集合与本地完全一致**、p4 谱面 **200**、线上 bundle 仍 `index-CDXE9BO-.js`（325,768 B；`scapemusic.pages.dev` 0 / `No account, no ads` 0 / `App link coming soon` 1 / `127.0.0.1:5175` 0）、`release.json` 与缺失路径同为 **2146 B**（仍 SPA 回落）、放行七字段全 null、源码零 TODO/FIXME、零 `@ts-ignore`、非测试源码零 `any`（4 命中 = 3 处 `hitsounds.test.ts:6/69/73` 测试桩 + `Duo.tsx:114` 注释英文假阳性）、T1b·T5b 零测试命中、**23 条文件链接 + 22 个内部锚点全 OK、MISS 为 0**（连续第二轮确认 `#bs-d001` 从来不是问题）、部署管道仍 5 连败、最后成功 `33895713222`（09-04）、**无新增 run**、`gh workflow list` **仍只返回 6 条**（连续第七轮印证它漏报 `agent-delivery-dispatch.yml`）。
>
> **历史（2026-09-10 第十五次）**：① **CI run 号连续第七轮「写入即过期」，已更正**：main 最新 CI 实为 **`34428724668`**（success，09-10T02:15:24Z），`headSha` = `89c5cd6fc643…` = 当前 HEAD；上一轮写的 `34419589870` 对应的是再上一个 commit `119d50a`。**该值已连续七轮证明不可跨轮沿用，每轮开头必须复查**（速览表与工作流表**两处**均已同步更正）；② **部署债务 28 → 29**（`git rev-list --count ffe1ec0..HEAD`；触及 `apps/beatscape/**` 的**仍为 6 个、名单不变**，增量仍全部来自本文件自身的刷新 commit）；③ **新增「构建期环境变量与部署路径」维度（详见 [专节](#构建期环境变量与部署路径盘点2026-09-10-第十五次新增维度)），首次枚举全部构建期变量引用点并逐个反查注入方**，三条结论：(a) 3 个自定义 `VITE_*` 中 **`VITE_GAME_URL` 只在部署脚本注入、`VITE_API_BASE` 全仓零注入**（后者只被本阶段明确不做的 NeonBeat 引用 → 不认领）；(b) **`VITE_STREAM_APP_URL` 的 hash 路由修正被硬编码成「域名字符串精确等于 `https://scapemusic.pages.dev`」**（`streamLink.ts:10`）——实测 ScapeMusic 确为自研 hash 路由（`App.tsx` 全为 `#/` `#/library` …），且**路径式深链 `scapemusic.pages.dev/track/bs-s1-01` 返回 200 / 1944 B，与确定缺失路径字节数完全相同 = 命中 SPA 回落**，故该修正**必要但脆弱**：换任何域名即静默失效，而现有 2 个单测**恰好只测了这个字面域名**，换域名后仍全绿；(c) **ScapeMusic 完全没有 CI/CD 工作流**（`grep -rn "scapemusic" .github/workflows/` **0 命中**），部署只靠 `scripts/deploy-scapemusic-cf-pages.sh`，而该脚本**全仓只在 `SESSION.md:68` 与 `worklog/2026-09-05.md:59` 被提到过** → **这正好解释了上一轮暴露面发现的成因**：`public/trials/` 下 5 个 m4a 能上线不是一次意外，而是「ScapeMusic 没有管道、任何丢进 `public/` 的文件都会在下一次手动部署时直接对外」的必然结果；④ **修正一条连续六轮重复的错误结论**：此前每轮都写「链接自检唯一 MISS 是 `#bs-d001` 锚点假阳性」，实测**是自检脚本本身没对 `#` 切分**，把带锚点的文件链接整串当路径判不存在。本轮脚本改为按 `#` 切分后再判 → **23 条文件链接 + 17 个内部锚点全部存在，MISS 为 0**，`#bs-d001` 从来不是问题；⑤ 其余断言本轮实测**全部仍成立且与上一轮一致、无变化**：曲库 105 首（s1 6/s2 4/s3 15/s4 15/s5 10/s6 35/p3 10/p4 10）、315 谱面、`stream_app_url` 0-105 / `stream_audio` 105-105、线上 catalog **105 首 / 315 谱面 / `stream_app_url` 0 且曲目 ID 集合与本地完全一致**、p4 谱面 **200**、线上 bundle 仍 `index-CDXE9BO-.js`（325,768 B；`scapemusic.pages.dev` 0 / `No account, no ads` 0 / `App link coming soon` 1 / `127.0.0.1:5175` 0）、`release.json` 与缺失路径同为 **2146 B**（仍 SPA 回落）、放行七字段全 null、源码零 TODO/FIXME、零 `@ts-ignore`、非测试源码零 `any`（4 命中 = 3 处 `hitsounds.test.ts:6/69/73` 测试桩 + `Duo.tsx:114` 注释英文假阳性）、T1b·T5b 仍零测试命中、部署管道仍 5 连败、最后成功 `33895713222`（09-04）、**无新增 run**、`gh workflow list` **仍只返回 6 条**（连续第六轮印证它漏报，磁盘实为 7 个）。
>
> 整理日期：2026-09-10（**第十七次刷新**；实测 `origin/main` 与本地 **0/0** 同步，HEAD `9eeee79` 即上一轮 TODO 刷新，本轮 `git log --stat` 与 `worklog/` 均无新完成项 → **连续第十六轮无新落地项**，仍是**校验型刷新**——本轮新增维度：**「Cloudflare Pages 路由与缓存配置」盘点**（首次查 `_redirects` / `_headers` / `wrangler.toml`；发现 `release.json` 是构建产物但从未部署、线上 cache-control 是旧版本、ScapeMusic 零 CF 配置），并**连续第九轮抓到 CI run 号过期**、**更正部署债务 31 → 32**）｜ 来源：[SESSION.md](SESSION.md) · [docs/BEATSCAPE-DECISIONS.md](docs/BEATSCAPE-DECISIONS.md) · [审计报告 §6](docs/COMPANY-PROJECT-HARNESS-AUDIT-2026-09-06.md)
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
| CI / 部署管道 | **CI 绿**（main 最新 `34446200971` success，对应 HEAD `9eeee79`；2026-09-10 第十七次更正，**连续第九轮**命中「写入即过期」）· **Deploy BeatScape 连续 5 次 failure**，全部卡在 `launch:check`（门禁由 `8b710a3` 于 09-05 一次性引入；截至 09-10 仍无新增 run）→ 见 P0-6 / P1-6 |
| **部署债务** | 自最后一次成功部署 `ffe1ec0`（09-04）起 **32 个 commit 未部署**，其中触及 `apps/beatscape/**` 的 **6 个**（每个都触发并失败，无「漏触发」）→ 见 [全仓工作流盘点](#全仓工作流盘点2026-09-09-新增维度)（2026-09-10 第十七次：31 → **32**，增量仍全部来自本文件自身的刷新） |
| **运行时外部依赖** | 受控源码共引用 **17 个**外部域名，但**真正在用户浏览器运行时发起请求的只有 Google Fonts**：BeatScape / ScapeMusic / NeonBeat **三款字体（Anton · Sora · IBM Plex Sans）全部取自 CDN，仓库零本地字体文件**；失败**静默**回退 `system-ui`。BeatScape `_headers` **无 CSP**（当前不冲突），但门户 CSP 是 `font-src 'self'` → 复用即炸 → 见 [专节](#运行时外部依赖与字体供应链盘点2026-09-10-第十六次新增维度) |
| **CF Pages 路由与缓存** 🆕 | BeatScape 有 `_redirects` `/* /index.html 200`（SPA 回落）；`release.json` 是构建产物（本地 `dist/` 61,500 B，线上返回 2146 B 回落页 → 从未部署）；`_headers` 在 `8b710a3`（09-05 16:06）修改晚于最后成功部署 `ffe1ec0`（09-05 00:31）→ **线上 cache-control 是旧版本**（`catalog.json` `max-age=300` vs 当前 `max-age=0`）；ScapeMusic **零** CF 配置文件（无 `_redirects` / `_headers` / `wrangler.toml`）→ 见 [专节](#cloudflare-pages-路由与缓存配置盘点2026-09-10-第十七次新增维度) |
| **构建期环境变量** 🆕 | 全仓 3 个自定义 `VITE_*`：`VITE_STREAM_APP_URL` 仅 `build:cf` 注入（已知）· **`VITE_GAME_URL` 仅部署脚本注入、`pnpm build` 会产出 `127.0.0.1:5175` 死链** · **`VITE_API_BASE` 全仓零注入**（仅 NeonBeat，本阶段不做）。**另：hash 路由修正硬编码为单一域名**，**全仓 11 个源文件写死生产域名**(5 处静默 / 3 处护栏) · **ScapeMusic 完全无 CI/CD 工作流** → 见 [专节](#构建期环境变量与部署路径盘点2026-09-10-第十五次新增维度) |
| **公开资产暴露面** 🆕 | `apps/scapemusic/public/trials/` **5 个 m4a / 27.81 MiB 未被任何源码或 catalog 引用，却已上线可公开下载**（`scapemusic.pages.dev/trials/*.m4a` 全 200）→ **不在 P0-1 耳检的 105 首范围内**，见 [专节](#受控二进制资产与公开资产暴露面盘点2026-09-10-第十四次新增维度) |
| **测试覆盖** 🆕 | `apps/beatscape/src` **81 源码 / 25 单测**；**6 个目录零单测**（`pages/` 15 · `components/` 16 · `data/` 2 · `types/` 2 · `constants/` 1 · 根 3）→ 但由 `e2e/` 4 个 Playwright spec 部分覆盖。**⚠️ e2e 不在 CI 里，只在部署管道跑 → 自 09-06 起未在 GitHub 执行过**；同期 13 次 CI 全绿但均无浏览器回归；15 个页面中 **4 个**（Calibration / FirstShift / Legal / NotFound）**两种测试都未触及** → 见 [测试覆盖盲区盘点](#测试覆盖盲区盘点2026-09-10-第十三次新增维度) |
| GitHub 未决项 | **无未关闭 PR、无未关闭 Issue**（2026-09-09 实测） |
| 仓库工作流 | **共 7 条**（2026-09-10 更正：上一轮写 6 条是错的，`gh workflow list` 漏报了 `agent-delivery-dispatch.yml`）：CI success · Deploy BeatScape 5 连败 · **Portal release check success** · Deploy NeonBeat failure · API contract gate 存疑 · Agent delivery gate 仅 PR · **Agent delivery dispatch 7 连败但属设计如此** → 见 [专节](#全仓工作流盘点2026-09-09-新增维度) |
| 版本与分支 | **0 个 git tag · 0 个 GitHub Release**（无版本化发布物，部署靠 main 持续部署）· 本地 **32** 分支 / 远程 **11**，其中 6 个已合并到 main（2026-09-10 新增维度）→ 见 [版本与分支盘点](#版本与分支盘点2026-09-10-新增维度) |
| 孤儿资产 🆕 | `scripts/` **92 个脚本中 22 个（24%）**未被任何受控文件按名引用；`docs/` **49 个 md 中 1 个孤儿**（2026-09-10 第十一次新增维度）→ 见 [孤儿资产盘点](#孤儿资产盘点2026-09-10-第十一次新增维度) |
| 代码质量 | `strict: true` · **非测试源码零 `any`** · 零 `@ts-ignore`/`@ts-expect-error` · **零 TODO/FIXME 标记**（2026-09-09 第八次复查：`apps/beatscape/src` 全量 grep 确认，命中 0）。**例外（仅测试桩）**：`audio/hitsounds.test.ts:6/69/73` 共 3 处 `any`，用于伪造 `OfflineAudioContext`，非生产代码 |
| 判定反馈 | T3 结算页误差条已随 `a136592` 推送（未部署）；对局内早/晚即时提示仍待做 |
| 性能 | 第二轮已随 `e3ba64f` 提交：`ae15d3778b3f` 同指纹 28 项固定预算全部通过；最慢冷开局 3.908s、8 场整局 0 异常间隔、绘制峰值最高 3.5ms；未部署 |
| 阻塞发布 | 耳检 105 首 · 差异化盲测 / 英语叙事试玩 · **线上产物与 `main` 不同步（P0-6）** · 最终签审；真机执行取消与门禁冲突保持记录 |

---

## 全仓工作流盘点（2026-09-09 新增维度）

> 此前各轮只跟踪 CI 与 Deploy BeatScape 两条；2026-09-09 第九次用 `gh workflow list` 盘点为「6 条」，**2026-09-10 第十次更正为实为 7 条**（见下方「⚠️ 更正」）。**结论：除 BeatScape 部署外，其余工作流均不构成当前阻塞。**

| 工作流 | 触发方式 | 最新 run | 结论 | 备注 |
|---|---|---|---|---|
| **CI** | push main | `34446200971`（09-10T06:39Z） | ✅ success | 对应 HEAD `9eeee79`（2026-09-10 第十七次更正，`headSha` 核对；**连续第九轮**「写入即过期」）。**CI 绿 ≠ 部署成功**，这是两条独立工作流。**另注（第十三次新增）：该 CI 不跑 e2e**，见 [测试覆盖盲区盘点](#测试覆盖盲区盘点2026-09-10-第十三次新增维度) |
| **Deploy BeatScape (Cloudflare Pages)** | push main（6 条 `paths`） | `34064117995`（09-06T22:28Z） | ❌ failure | 5 连败，卡在 `launch:check` → 见 P0-6 / P1-6 |
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

- **32 个 commit 未部署**（`git rev-list --count ffe1ec0..HEAD`，2026-09-10 第十七次实测；上一轮为 31，本轮 31 → **32**），起点是最后一次成功部署 head `ffe1ec0`（本地时间 09-05 00:31:54 +0800 = 09-04T16:31:54Z）。
- 其中**触及 `apps/beatscape/**` 的只有 6 个，名单与上一轮完全一致**：`8b710a3` → `735208b` → `134115a` → `6418d3f` → `e3ba64f` → `a136592`，正好对应 5 次失败 run（`8b710a3` 与 `735208b` 同批推送共用一个 run）。
- **因此「每个改了 BeatScape 代码的 commit 都触发并失败了」，`paths` 过滤工作正常，问题 100% 在 `launch:check` 门禁**，不存在「提交没触发部署」这种情况。
- `a136592` 之后的 **17 个** commit 全是 docs-only（TODO 刷新；`git rev-list --count a136592..HEAD` = 17，且其中触及 `apps/beatscape/` 的为 **0**），不命中 `paths` → 无新 run 属预期，**不代表管道恢复**。
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
| `seo/` | 1 | 1 | ⚠️ 该单测**不覆盖**工作区新增的 `socialMetaTags`（见 P2 T1b/T5b） |
| `storage/` | 3 | 1 | |

### 本维度的核心发现：e2e 不在 CI 里，只在部署管道里

- `apps/beatscape/e2e/` 有 **4 个 Playwright spec**（`exit-dialog` 294 行 / `release` 169 行 / `narrative` 144 行 / `early-audio` 79 行），是 `pages/`（15 个文件、零单测）**唯一的自动化覆盖**。
- **但 CI 工作流不跑它们**：`.github/workflows/ci.yml` 的 `beatscape` job 只有 `pnpm --filter @musicsaas/beatscape test`（= `vitest run`）+ `beatscape-audit.py` + `beatscape-catalog-status.py`，**没有任何 playwright 步骤**。
- **只有部署工作流跑**：`deploy-beatscape-cloudflare.yml` 先 `playwright install --with-deps chromium`，再在 "Verify release candidate" 里执行 `pnpm release:beatscape` → `release:check` → `npm run test:e2e`。
- **后果（可量化）**：部署工作流最后一次 run 是 `34064117995`（**2026-09-06T22:28Z**），此后无新 run → **e2e 自 09-06 起未在 GitHub 上执行过**。同期 CI 工作流跑了 **13 次、全部 success**，**没有一次包含浏览器回归**。
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
  1. （工程）评估三款字体自托管，消除唯一的运行时第三方依赖 —— 与性能预算有张力，需实测。
  2. （合规）P0-3 签审前确认：隐私条款是否需披露向 Google Fonts 发起的请求。
  3. （护栏）将来若复用门户那套 CSP，须同步放开 `style-src` / `font-src` 或改为自托管 —— 记入「复用 CSP 时必查」。

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
- **2026-09-10 第十六次新增（签审前需确认的披露项）**：BeatScape / ScapeMusic **运行时向 Google Fonts 发起请求**（加载 Anton / Sora / IBM Plex Sans，仓库零本地字体文件），而 `apps/beatscape/src/pages/Legal.tsx` 的隐私表述**未提及字体 CDN**。本文件**只陈述事实、不作法律结论**，是否需在隐私条款中披露属签审确认项。详见 [运行时外部依赖与字体供应链盘点](#运行时外部依赖与字体供应链盘点2026-09-10-第十六次新增维度)。
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
- **2026-09-09 第九次新增**：`gh workflow list` 盘点发现仓库另有 **Portal release check** 工作流，其最后一次 run **`33970422632`（09-05T13:58Z）为 success** → **门户侧的发布门禁是通的**，P0-5 的阻塞点只是「域名 + Pages 项目名未定」这一人工等待项，不像 BeatScape 那样被门禁结构性卡死（见 [全仓工作流盘点](#全仓工作流盘点2026-09-09-新增维度)）。

### P0-6 线上部署与 `main` 不同步 —— 根因已定位：部署管道被 `launch:check` 卡死
- **实测（2026-09-08 第六次刷新，首次核对 GitHub Actions 部署管道）**：线上 `https://beatscape.pages.dev` 落后于 `main`，**且当前没有任何可行路径能重新部署**：
  - **最后一次成功部署**：`33895713222`，2026-09-04T16:32:29Z，head `ffe1ec0`（`feat(p4): ingest 脚本 …`）。此后**连续 5 次部署全部 failure**：`33970422633`(09-05) / `34011510454` / `34013428332` / `34033551869` / `34064117995`(09-06 22:28)。
  - **失败点是 `launch:check`，且它排在发布之前**：`.github/workflows/deploy-beatscape-cloudflare.yml` 的顺序是 `Verify release candidate` → `Check launch sign-off` → `Publish to Cloudflare Pages`；`34064117995` 的日志显示「Release verified: 105 tracks / 315 charts / 594 files / 402.7 MiB」之后立刻 `Launch blocked` 六条并 exit 1，**wrangler 从未执行**。
  - **后果**：T3 误差条（`a136592`）、退出弹窗（`6418d3f`）、性能第二轮（`e3ba64f`）等「已推送」改动**线上均不存在**，与实测一致——线上 bundle `/assets/index-CDXE9BO-.js`（325,768 B）不含 `No account, no ads`。
  - **但「落后」仅限 JS 代码，内容资产是当前版本（2026-09-09 首次实测，修正此前笼统表述）**：线上 `catalog.json` 返回真 JSON（115,172 B），**105 首 / 315 谱面 / `stream_app_url` 0-105**，曲目 ID 集合与本地**完全一致**；`/catalog/bs-p4-01/easy.json`（19,241 B）、`/catalog/bs-p4-10/hard.json`（51,507 B）均 **200** → 玩家线上能玩到完整的 105 首与 p4 谱面。**成因**：p4 进入 catalog 的 `f9d8c8f`（2026-09-04T16:31:54Z）经 `git merge-base --is-ancestor f9d8c8f ffe1ec0` 判定为 YES，是最后一次成功部署 head 的**祖先**，且仅早于部署 run `33895713222`（16:32:29Z）**35 秒**。因此「线上缺内容」不成立，待部署的只是代码改动。
  - **注（2026-09-09 第九次重述，修正上一轮的时区歧义）**：最后一次 run `34064117995`（09-06**T22:28:24Z**）**正是由 `a136592` 触发的**——该 commit 的本地时间是 09-07 06:28 +0800，即 22:28Z，两者是同一时刻。所以准确表述是：**`a136592` 之后的 8 个 commit 全是 docs-only，不命中 `paths` 过滤**，故无新 run；而非「09-07 之后的提交都没触发」。**无新 run 属预期，不代表管道恢复。**
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
> **2026-09-10 第十二次新增**：另有 **`.delivery/beatscape/backlog.md:21` 的 `TICKET-B05`（Reddit 启动页 CTA 文案，AC「CEO 勾文案后再 merge」）仍未关闭**，它落在本段首条「发帖素材包」范围内 → **不新开条目，但两处状态需保持一致**：关闭本段首条时应同步把 `TICKET-B05` 标记为 done。详见 [散落待办清单盘点](#散落待办清单盘点2026-09-10-第十二次新增维度)。

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
- 截至 **2026-09-10 第十七次刷新**（实测 `git status`，`origin/main` 与本地已同步 0/0，HEAD `9eeee79`），工作区有并行会话未提交改动（**连续第五轮构成完全一致、零变化**：仍 **10 项改动** + **10 项未跟踪**；另加本文件 `TODO.md` 待提交）：
  - **T1b / T5b（新）**：`apps/beatscape/src/seo/pageMeta.ts:80`（`socialMetaTags`）、`pageMeta.ts:113`（`setPageMeta` 内同步 og:/twitter:）、`apps/beatscape/src/pages/Results.tsx:72`（`copyImageBlob`）、`Results.tsx:242`（调用点）——**本轮复查仍无任何测试文件命中这两个符号**，见 P2 表
  - **需求文档**：`PRD.md`（§19 待决 7/8、§20.1 验证清单、MiniMax/YuE 官方链接）、`docs/COMPLIANCE.md`（许可表 + C-06）、`SESSION.md`（P1-4 音乐模型候选评估）
  - **Harness / 项目规范**：`AGENTS.md`（追加 cursor-codex-sync 区块）、未跟踪的 `.agents/skills/{company-harness,vault-harness,zbrain-session}/`、`.codex/`
  - **其他**：`.delivery/README.md`、`.delivery/prompts/orchestrator-kickoff.md`、`worklog/2026-09-06.md`、`.workbuddy-ai/memory/2026-09-06.md` ~ `2026-09-10.md`（5 个日志文件）、`.workbuddy-ai/memory/automations/ff19e388-…/memory.md`（本自动化自己的记录）
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

# 链接自检（2026-09-10 第十五次修正：必须按 # 切分，否则带锚点的链接会假报 MISS）
python3 -c "
import re,os
txt=open('TODO.md').read(); links=re.findall(r'\]\(([^)]+)\)',txt)
files=[l for l in links if not l.startswith('#') and not l.startswith('http')]
print('MISS:',[f for f in files if not os.path.exists(f.split('#')[0])])   # 注意 split('#')
"
```

**说明**：`bash scripts/harness.sh all` = unit + workspace build + mock integration。技术检查通过不替代人工耳检、盲测与上线签审。

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
