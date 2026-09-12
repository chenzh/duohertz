# 自动化 ff19e388 — BeatScape UI 炫酷化续作

## 最近执行（2026-09-03）
- 一次性完成 B-1 / B-2 / C-1 / C-2 四档，每档一 chunk 提交，门禁全绿（tsc / vitest 120 / build）。
- commits：`417ece9`(B-1) `fa10253`(B-2) `60e5db1`(C-1) `4310b12`(C-2) + `8fa64ce`(doc 收工)。已 push 到 origin/main（`ab12d4a..8fa64ce`）。
- 关键实现纪律（已验证可行，下次直接复用）：
  - B-1：PlayField 加 `statsRef?: RefObject<LiveStats>` prop，内部独立 ~20Hz rAF 写 sessionRef/surgeTierRef；PlayHud 自身 20Hz rAF 直写 DOM（数值不变跳过写入），容器 pointer-events:none。绝不让 canvas 循环触发 React re-render。
  - B-2：`.loading-state` 改调频搜台；overlay 包 `.overlay-card` 硬边卡片 + `.overlay-title` skewX。
  - C-1：Radio 顶部 `.radio-deck`（频率 88.6/90.0/91.4 由 RADIO_SEASONS 三季驱动）。注意 `episodeState` 返回值是 `"now"|"aired"|"upcoming"`（不是 past）。
  - C-2：`.character-card` 去白描边/16px→2px 黑边+radius-md+硬投影；`.board-row`/`.rank-card` 硬投影；`.achievement-card` 未解锁 grayscale 差异。
- 协作：只 `git add` 本次改的文件，未碰并行会话的 bs-p4-* / catalog.json / scripts / workers（仍在工作区未提交）。

## 终止条件
- 开工先读 SESSION.md：若 B-1/B-2/C-1/C-2 已全部标记完成 → 直接报告「UI 升级已全部完成」并什么都不做。
- 当前（2026-09-03）四档均已完成并提交，后续触发应命中终止条件。

## 本次执行（2026-09-04）
- 命中终止条件：读取 SESSION.md 与 `git log` 确认 B-1/B-2/C-1/C-2 四档均已完成并提交（commits `417ece9`/`fa10253`/`60e5db1`/`4310b12`）。
- 直接报告「UI 升级已全部完成」，未做任何改动。
- 工作区另有并行会话未提交改动（bs-p4-*/catalog.json/scripts/workers 等），按协作规矩未触碰，亦未 `git add -A`。

## 本次执行（2026-09-05）
- 再次命中终止条件：读 SESSION.md（line 30 已标记 B/C 档全部完成）+ 实测确认交付物在场——`src/components/playfield/PlayHud.tsx`(5442B) 与 `liveStats.ts`(1098B) 存在、`styles.css` 含 `loading-state`/`radio-deck`/`halftone`（14 处）、`.character-card` 已统一全站硬边语言。
- 未做任何代码改动，未 `git add`。仅本条记录供后续触发参考。

## 本次执行（2026-09-06）— 用户指令已变更为「整理项目 TODO」
- 不再执行 UI 续作。改为：归集项目 TODO → 写入 `TODO.md` → 提交并 push。
- 新建根目录 `TODO.md`（173 行）作为待办唯一入口，P0–P5 分层，细节一律链接权威文档而非复制正文（符合审计 §5「每种状态只在一个位置维护」）。
- commit `f34cb73`，已 push 到 origin/main（`735208b..f34cb73`）；`rev-list --left-right --count` 确认 0/0。
- 纪律：只 `git add TODO.md`，未动并行会话活跃改动（AGENTS.md / SESSION.md / docs/ / scripts/agent-delivery/ / apps/beatscape/src 下 decodedAudioCache 等）。
- 遵循 BS-D001：专项真机验收写入「已取消」区块，不回填 TODO，不记为通过；`launch-check.mjs` 仍要求 `deviceTestRecord`。
- 坑：`pnpm launch:check` 在根不存在，实际为 `pnpm --filter @musicsaas/beatscape launch:check`。
- 后续触发：先确认用户当前指令；若仍是 UI 续作，则继续按上方终止条件检查。

## 本次执行（2026-09-06 第二次）— 指令仍为「整理项目 TODO」
- 复用已有 `TODO.md` 做增量刷新，而非重建：新增 P0-6「性能保障第二轮（进行中 · 未部署，候选 `198acfbcd3dd`，矩阵证据待采集）」、新增「近期已完成」区块（`6418d3f` 退出弹窗 / `134115a` 性能第一轮）、P0-3 前置补 P0-6、P5-2 按实测 `git status` 重写、P3 标注 docs/TODO.md 两条过期项不继承、验收命令补 `performance:measure` / `performance:check`。
- commit `1290f0c`，已 push（`6418d3f..1290f0c`，`rev-list` 0/0）。
- 坑复用：`git push` 默认代理会挂，直接用 `git -c http.proxy=http://127.0.0.1:7897 -c https.proxy=http://127.0.0.1:7897 push origin main`；只 `git add TODO.md`，绝不 `git add -A`（并行会话有 early-audio / performance-budget / .codex / .agents 等活跃改动）。
- 刷新 TODO 的可靠信息源顺序：`SESSION.md` 的 next/blockers → `git log --stat -N` 看新落地项 → `worklog/YYYY-MM-DD.md` → `docs/BEATSCAPE-PERFORMANCE.md`（进行中项的证据边界）。

## 本次执行（2026-09-07）— 指令仍为「整理项目 TODO」
- 增量刷新 `TODO.md`，commit `c9f948c`，已 push（`a136592..c9f948c`）。主要变更：T3 结算页误差条已随 `a136592` 落地并推送 → 移入「近期已完成」、P2 行改已落地；T1b/T5b 改为「工作区已实现、未提交、无单测」；新增 P1-4 音乐模型候选评估（MiniMax/YuE + C-06 许可前置），立绘评估顺延 P1-5；P5-1/P5-2 按实测 `git status` 与 grep 复查重写。
- 判别「是否已有新落地」的快速手法：先 `git rev-list --left-right --count origin/main...main`（本次开局 0/0，说明上次已全推），再 `git log --stat -6` 找自上次记录以来的新 commit。
- 坑：`push` 后的 `git fetch` 在默认网络下会挂住（本次挂 3 分钟被杀）；push 本身用 `127.0.0.1:7897` 代理一次成功，**push 输出行即权威证据，不必再等 fetch 验证**。
- 仍然只 `git add TODO.md`，绝不 `git add -A`；未改 `SESSION.md`（正被并行会话修改，避免冲突）。

## 本次执行（2026-09-07 第二次）— 指令仍为「整理项目 TODO」
- 开局实测 `rev-list --left-right --count origin/main...main` = 0/0，最新 commit `c9f948c` 就是上一次 TODO 刷新 → **本次无任何新落地项**，因此不做大改，只在既有 `TODO.md` 上做小增量：头部标注「本轮无新落地项」、P5-1 收口、T1b/T5b 复查日期与命中行号、P5-2 补一行说明。
- 顺手真正做掉了 P5-1 的唯一遗留动作：给 `docs/CODE-INDEX.md:155` 加「历史冲刺归档」标注并指向根 `TODO.md`（`docs/KNOWLEDGE-BASE.md` 上次已改），至此 P5-1 无剩余动作。
- 因此本次 `git add` 两个文件：`TODO.md` + `docs/CODE-INDEX.md`。commit `89b0b5d`，已 push（`c9f948c..89b0b5d`）。
- 经验固化：**TODO 刷新时若发现某条目只剩一个极小的收尾动作（如补索引标注），直接顺手做完再标完成**，比继续挂条更有价值；前提是该文件不在 `git status` 的并行改动列表里。
- 坑复用：macOS 无 `timeout` 命令（zsh 报 command not found），push 直接跑即可；push 仍走 `127.0.0.1:7897` 代理一次成功。

## 本次执行（2026-09-07 第三次）— 指令仍为「整理项目 TODO」
- 开局 `rev-list` = 0/0、HEAD `89b0b5d` 即上次刷新 → **连续两轮无新落地项**。不再做「改日期式」刷新，改为**纠错型刷新**：重新实测 TODO 里的每条数字/路径断言，抓出两条不准的表述并修正。commit `524f12a`，已 push（`89b0b5d..524f12a`）。
- 抓到的过期项：① P1-3 的「0/85」→ 实测 catalog 已 105 首、`stream_app_url` 0/105、`stream_audio` 105/105，且真实阻塞点是**只有 `build:cf` 注入 `VITE_STREAM_APP_URL`**（`streamLink.ts` 两级回落）；② P0-3 补硬证据 `launch-signoff.json` 七字段全 null。另 P5-2 按实测 git status 重写、源码零 TODO/FIXME 复查。
- **核心经验（下次直接套用）**：无新落地项时，TODO 刷新的价值不在「加条目」而在**校验已有条目的数字与路径是否仍成立**。具体廉价实测手段：
  - `git rev-list --left-right --count origin/main...main` 判断有无新落地；
  - `python3 -c` 读 `apps/beatscape/public/catalog.json` 统计字段覆盖率（曲库数、stream_app_url、stream_audio）；
  - `cat apps/beatscape/launch-signoff.json` 看放行字段是否仍为 null；
  - Grep 工具查 `socialMetaTags|copyImageBlob` 是否有 `.test.` 命中（zsh 下 `grep -r --include` 会被 glob 报错，必须用 Grep 工具）。
- 纪律不变：只 `git add TODO.md`，绝不 `git add -A`；不碰 `SESSION.md`（并行会话在改）；push 走 `127.0.0.1:7897` 代理。

## 本次执行（2026-09-08）— 指令仍为「整理项目 TODO」
- 开局 `rev-list` = 0/0、HEAD `524f12a` 即上次刷新 → **连续三轮无新落地项**。沿用上轮定式做**校验型刷新**，commit `1fee76f`，已 push（`524f12a..1fee76f`）。
- 本轮抓到的两条真实错误（均为上轮自己写进去的，说明「校验型刷新」确实能抓到东西）：
  - ① 上轮**摘要**写 `launch-signoff.json`「六字段」，正文写七字段 → 实测 `cat` 确认是**七字段**全 null。教训：**摘要与正文互相矛盾时，两个都要实测，别只信一个**。
  - ② 顶部速览长期写「零 `any`」**过强**：生产源码确实零，但 `audio/hitsounds.test.ts:6/69/73` 有 3 处测试桩 `any`。已改为「非测试源码零 `any` + 列明测试桩例外」。
- 另 P1-3 有实质性收窄：实测 `package.json:18` 的 `release:check` **本身已串接 `build:cf`**，所以「仓库发布流程不注入 env」的担忧不成立，剩余唯一不确定项是 **CF Pages 控制台配的构建命令**。这属于「细化待办、缩小未知」的正向价值，即使没有新落地项也值得做。
- 新增有效实测手法（下轮直接复用）：
  - `grep -rn -E "@ts-ignore|@ts-expect-error"` 必须用 `-E`，否则 BRE 下 `|` 是字面量、会假报 0（上轮就踩过，本轮修正）。
  - 查 `any` 用 `-E ":\s*any\b|as any\b|<any>"`，但**必须回看命中行再判真假**——本轮 4 命中里 1 条是 `Duo.tsx:114` 注释里的英文单词 "any pause action"，是假阳性。
  - `python3 -c` 读 catalog 时用 `collections.Counter(t['track_id'].split('-')[1])` 可一次性核对各季分布（s1 6/s2 4/s3 15/s4 15/s5 10/s6 35/p3 10/p4 10 全部对上），并 `sum(len(t.get('charts') or {}))` 核对 315 谱面。
- 仍未变的纪律：只 `git add TODO.md`；`SESSION.md`/`PRD.md`/`docs/COMPLIANCE.md`/`Results.tsx`/`pageMeta.ts` 等并行会话改动一律不碰；push 走 `127.0.0.1:7897` 一次成功。

## 本次执行（2026-09-08 第二次）— 指令仍为「整理项目 TODO」
- 开局 `rev-list` = 0/0、HEAD `1fee76f` 即上次刷新 → **连续四轮无新落地项**。沿用校验型刷新，commit `d71d806`，已 push（`1fee76f..d71d806`）。
- **本轮最有价值的突破：新增「线上产物核对」维度**（前几轮都只查本地，第一次去查线上，立刻抓到真问题）。新增 **P0-6 线上部署与 main 不同步**，三条硬证据：
  - 线上 bundle `/assets/index-CDXE9BO-.js`（325,768 B）中 `scapemusic.pages.dev` **0 命中**、`App link coming soon` 1 命中 → 深链线上确实不生效；
  - 同 bundle 不含 `a136592`（09-07 已推送）的 `No account, no ads` → 线上 JS 落后于 main；
  - `GET /release.json` 返回 SPA 回落页（与任意缺失路径同为 2146 B）→ 线上 dist 很可能不是 `build:cf` 产物。
- **并因此推翻上一轮自己的结论**：P1-3 上轮收窄为「确认 CF Pages 控制台构建命令」是错的。读 `.github/workflows/deploy-beatscape-cloudflare.yml` 可知部署是 `wrangler pages deploy dist` **直接上传预构建产物**，根本没有控制台构建命令这一环；`scripts/deploy-beatscape-cf-pages.sh:12` 走 `pnpm release:beatscape`。两条路径都会经 `release:check` → `build:cf` 注入 env。**教训：上一轮的「收窄」是没读部署管道就下的判断，收窄前必须先看 CI/部署脚本。**
- 另修正表头残留的过期 HEAD（`524f12a` → `1fee76f`，上一轮改了正文没改表头）；新增校验维度：本文件 17 条文档/脚本链接 + `#bs-d001` 锚点 + 3 个性能数据路径 + 3 个根脚本全部存在。
- **可直接复用的新手法（下轮必做）**：
  - 线上核对：`curl -s -x http://127.0.0.1:7897 https://beatscape.pages.dev/ | grep -oE 'src="[^"]*\.js"'` 取 bundle 名 → 再 curl 该 bundle grep 关键字符串；
  - 判「是否 SPA 回落」：先 curl 一个**确定不存在**的路径看返回（本次缺失路径也返回 2146 B index.html），再对比目标路径，尺寸相同即说明目标文件不存在；
  - 链接完整性自检：`grep -oE '\]\([^)#][^)]*\)' TODO.md | sed ... | while read f; do [ -e "$f" ] ...`（带 `#` 锚点的会假报 MISS，需单独 grep 锚点标题）。
- 纪律不变：只 `git add TODO.md`；push 走 `127.0.0.1:7897` 一次成功；push 后不要 `git fetch`（会挂住）。

## 本次执行（2026-09-08 第四次）— 指令仍为「整理项目 TODO」
- 开局 `rev-list` = 0/0、HEAD `778e2be` 即上次刷新 → **连续六轮无新落地项**。沿用校验型刷新，commit `38c0243`，已 push（`778e2be..38c0243`）。
- **本轮最有价值的两条成果（都是「溯源」而非「加条目」）**：
  - ① **部署门禁引入点精确定位到单个 commit**：`git log -S "Check launch sign-off" -- .github/workflows/deploy-beatscape-cloudflare.yml` 与 `git log -S "deviceTestRecord" -- apps/beatscape/scripts/launch-check.mjs` **都只命中 `8b710a3`**（2026-09-05 16:06，"chore: audit agent guidance and release workflow"）→ workflow 门禁步骤与必需字段是同一次改动引入；它与 `735208b` 同批推送触发首个失败 run `33970422633`，此前三次部署全 success。**结论：部署受阻是 09-05 当天一次性造成，不是渐进退化。**
  - ② **排除第四条路径**：workflow 有 `workflow_dispatch:`，但 "Check launch sign-off" 与 "Publish to Cloudflare Pages" **共用**条件 `github.event_name != 'pull_request' && github.ref == 'refs/heads/main'` → main 上手动派发照样跑门禁；非 main 分支/PR 事件则连发布一起跳过。**不存在「只跳门禁、保留发布」的路径**，P1-6 三选一仍是唯一出路。
- **本轮踩到的新坑：本地网络两次长时间中断**。`beatscape/scapemusic.pages.dev`、`api.github.com` 直连与代理均 `SSL_connect: SSL_ERROR_SYSCALL`；`gh` 也从 session 中段开始 EOF；`git push` 连续 5 次失败（重试循环 5×8s 全挂）。**处理办法：不要死循环重试，先探测代理端口是否还活着**——`for p in 7890 7897 1087 8888 1080; do curl -sS -m 6 -x http://127.0.0.1:$p -o /dev/null -w "%{http_code}" https://github.com; done`，哪个返回 200 用哪个（本轮 7897 恢复后一次 push 成功）。另：SSH 这条路**不可用**（`ssh -T git@github.com` 返回 `Permission denied (publickey)`，无密钥），只能走 HTTPS。
- **诚实记录原则**：网络不可达时线上取证无法重做，已在 TODO 中显式标注「沿用上一轮 09-08 实测、未重新取证」，并写明**不得把「拿不到返回」记为「线上异常」**。
- 其余断言本轮复核全部仍成立：105 首 / 各季分布 / 315 谱面 / `stream_app_url` 0-105 / 放行七字段全 null / 源码零 TODO-FIXME / 零 `@ts-ignore` / 非测试源码零 `any`（唯一命中 `Duo.tsx:114` 是注释里的英文 "any pause action"，假阳性）/ T1b·T5b 仍无单测。链接自检唯一 MISS 仍是 `#bs-d001`（锚点实际在 `docs/BEATSCAPE-DECISIONS.md:5`，假阳性）。
- **下轮可直接复用**：`git log -S "<字符串>" -- <路径>` 做「某条规则/字段是谁引入的」溯源，是定位回归与决策点的高效手段；读 workflow 时**务必逐字看步骤的 `if:` 条件**，不要凭触发器名称（如 `workflow_dispatch`）推断能否绕过门禁。

## 本次执行（2026-09-08 第三次）— 指令仍为「整理项目 TODO」
- 开局 `rev-list` = 0/0、HEAD `d71d806` 即上次刷新 → **连续五轮无新落地项**。沿用校验型刷新，commit `778e2be`，已 push（`d71d806..778e2be`）。
- **本轮最大突破：新增「GitHub Actions 部署管道」维度，一次性推翻前两轮结论并定位真根因**。核心发现：`Deploy BeatScape (Cloudflare Pages)` 工作流**连续 5 次 failure**（`33970422633`→`34064117995`，09-05 ~ 09-06），失败点全是 **"Check launch sign-off"（`launch:check`）**，而该步骤排在 **"Publish to Cloudflare Pages" 之前**，wrangler 从未执行；**最后一次成功部署停留在 2026-09-04 `33895713222`**。因此：
  - P0-6 根因不是「忘了部署」，而是**部署管道被发布门禁结构性卡死**；
  - `scripts/deploy-beatscape-cf-pages.sh` **自身也调 `launch:check`**（在 `pnpm release:beatscape` 之后），所以「本地脚本绕过」这条路**也不通**——上一轮把它当备选是错的；
  - 新增 **P1-6 决策点**：`launch-check.mjs:19` 的必需循环含 `deviceTestRecord`，而 BS-D001 已取消真机 → **该字段永远无法产生 → 任何部署都不可能成功**，需用户三选一拍板。
- **推翻上一轮自己的两条证据（重要教训）**：上一轮用「线上 bundle 中 `scapemusic.pages.dev` 0 命中」「`/release.json` 返回回落页」证明「线上非 `build:cf` 产物」。实测二者都是 `8b710a3`（2026-09-05）才进源码的，**晚于最后一次成功部署（09-04）** → 0 命中/回落页是必然，证据无效。**规则：拿「线上缺某字符串」当证据前，必须先用 `git log -S "<字符串>" -- <源码路径>` 确认它进源码的时间早于线上部署时间。**
- 另一条新维度：ScapeMusic 线上 `index-DwW6K_-S.js` 含 `beatscape.pages.dev` 1 次、`127.0.0.1:5175` **0 次** → 反向深链（`VITE_GAME_URL`）已修并上线；正向（BeatScape→ScapeMusic）仍「未验证」。
- **下轮直接复用（`gh` 可用，已装且已登录）**：
  - `gh run list --workflow=deploy-beatscape-cloudflare.yml --limit 20` 看部署结论与最后成功时间；
  - `gh run view <run-id> --log-failed` 看失败步骤（本次一眼看出卡在 launch:check 且 wrangler 未跑）；
  - `gh run view <run-id> --json headSha,createdAt,conclusion` 拿最后一次成功部署对应的 commit；
  - `gh run list --branch main --limit 5` 区分「CI 绿」与「部署红」（**两条独立工作流，CI 绿完全不代表部署成功**）。
- 纪律不变：只 `git add TODO.md`；push 走 `127.0.0.1:7897` 一次成功；push 后不 fetch。

## 本次执行（2026-09-09）— 指令仍为「整理项目 TODO」
- 开局 `rev-list` = 0/0、HEAD `38c0243` 即上次刷新 → **连续七轮无新落地项**。沿用校验型刷新，commit `696431b`，已 push（`38c0243..696431b`）。
- **网络已恢复**（代理 `7897` 返回 200），上一轮因 SSL 中断搁置的线上取证**本轮全部补做**。
- **本轮最大成果：把「线上落后」拆成「内容 / 代码」两条独立断言，并推翻了笼统结论。** 实测：
  - **内容是最新的**：线上 `beatscape.pages.dev/catalog.json`（115,172 B 真 JSON）= **105 首 / 315 谱面 / `stream_app_url` 0-105**，曲目 ID 集合与本地**完全一致**；`/catalog/bs-p4-01/easy.json`(19,241 B) / `/catalog/bs-p4-10/hard.json`(51,507 B) 均 **200**。
  - **只有 JS 代码落后**：bundle 仍是 `index-CDXE9BO-.js`（325,768 B），`No account, no ads`(`a136592`) 与 `scapemusic.pages.dev`(`8b710a3`) 均 0 命中，且二者引入时间**都晚于** 09-04 部署。
  - **因果闭环**：p4 进 catalog 的 `f9d8c8f`（09-04T16:31:54Z）经 `git merge-base --is-ancestor f9d8c8f ffe1ec0` = YES，且只比最后一次成功部署 run `33895713222`（16:32:29Z）早 **35 秒** → 内容本就在部署窗口内，不矛盾。
  - **教训（下轮必守）**：**「线上内容落后」与「线上代码落后」必须分开断言**。`catalog.json` / 谱面是数据文件，可能随早先成功部署上线；只有 bundle JS 才必然落后。合成一句「线上落后」会误导判断。
- 另一条补做结论：`/release.json` 返回 2146 B `text/html`，与确定不存在的路径 `/definitely-not-here-xyz` **字节数相同** → 确为 SPA 回落页，文件不存在（上一轮只能沿用旧值）。
- 新增盘点维度：GitHub **无未关闭 PR、无未关闭 Issue**；main 最新 CI 更新为 **`34242405531`**（对应 `38c0243`）。部署管道仍 5 连败、最后成功 `33895713222`，**截至 09-09 无新增 run**。
- 其余断言复核全部仍成立：放行七字段全 null / 源码零 TODO-FIXME / 零 `@ts-ignore` / 非测试源码零 `any`（唯一假阳性 `Duo.tsx:114` 注释英文 "any pause action"）/ T1b·T5b 零测试命中 / 链接自检唯一 MISS 仍是 `#bs-d001` 锚点假阳性。
- **踩坑**：zsh 下 `grep -rn -E "..." --include=*.ts` 会报 `no matches found`（glob 未展开）→ **必须用 Grep 工具**或给 `--include` 加引号。
- 纪律不变：只 `git add TODO.md`（本轮工作区仍是 10 项并行会话改动 + 7 项未跟踪，未触碰）；push 走 `127.0.0.1:7897` 一次成功；push 后不 fetch。

## 本次执行（2026-09-09 第二次）— 指令仍为「整理项目 TODO」
- 开局 `rev-list` = 0/0、HEAD `696431b` 即上次刷新 → **连续八轮无新落地项**。沿用校验型 + 新增维度刷新，commit `b882307`，已 push（`696431b..b882307`）。
- 本轮三条成果：① **更正过期 CI run 号** `34242405531` → `34310382154`（对应 HEAD `696431b`）——注意这类「会随时间变化的值」属**写入即过期**（上一轮提交时该 run 还没出结果），下轮开头必须复查；② **部署债务首次量化**：`git rev-list --count ffe1ec0..HEAD` = **23 个 commit 未部署**，其中 `git log --oneline ffe1ec0..HEAD -- apps/beatscape/` = **6 个**，正好对应 5 次失败 run（`8b710a3`+`735208b` 同批推送共用一个）→ **每个改代码的 commit 都触发并失败了，不存在「漏触发」**；③ **新增「全仓工作流」维度**：`gh workflow list` 显示共 **6 条**（此前只跟踪 2 条）——**Portal release check 为 success**（`33970422632`）→ 颠覆对 P0-5 的判断（门户没被门禁卡死）；Deploy NeonBeat failure 但本阶段不做；API contract gate 两次 failure 却 `jobs` 为空/0s，且文件 `on:` 无 push 触发（`git log -S "  push:"` 空）→ **成因未查清，明确标注「不臆断、不作阻塞项」**。
- **P1-6 新增可操作结论（此前各轮都漏了）**：workflow 的 `on.push.paths` **同时包含** `apps/beatscape/**`（覆盖 `launch-check.mjs`）和 workflow 文件自身 → 按方案 2 改门禁的提交**自动触发重新部署**，不需要额外空提交 kick。
- 澄清上轮时区歧义：最后的部署 run `34064117995`（09-06T22:28:24Z）**就是 `a136592` 触发的**（本地 09-07 06:28 +0800 = 22:28Z），正确表述是「`a136592` 之后 8 个 commit 全是 docs-only」。
- **下轮可直接复用**：`gh workflow list` 列全量工作流（本轮靠它发现 4 条盲区）→ 逐条 `gh run list --workflow="<名>" --limit 2` → `gh run view <id> --json conclusion,event,jobs`（`jobs: []` + 0s = 空跑失败，别当真门禁失败排查）；债务量化用 `git rev-list --count <lastGoodHead>..HEAD` 与 `git log --oneline <lastGoodHead>..HEAD -- apps/beatscape/`。
- 其余断言复核全部仍成立（线上 bundle `index-CDXE9BO-.js` / 线上 catalog 105 首 315 谱面 `stream_app_url` 0-105 / p4 谱面 200 / `release.json` 2146 B 回落页 / 放行七字段全 null / 零 TODO-FIXME / 零 `@ts-ignore` / 非测试源码零 `any` / T1b·T5b 零测试命中 / 17 条文档链接全 OK，唯一 MISS 仍是 `#bs-d001` 锚点假阳性）。
- 纪律不变：只 `git add TODO.md`（10 项改动 + 8 项未跟踪，未触碰）；push 走 `127.0.0.1:7897` 一次成功；push 后不 fetch。

## 本次执行（2026-09-10）— 指令仍为「整理项目 TODO」
- 开局 `rev-list` = 0/0、HEAD `b882307` 即上次刷新 → **连续九轮无新落地项**。沿用校验型刷新 + 新增维度，commit `5c9e9a7`，已 push（`b882307..5c9e9a7`）。
- **本轮最大成果：`gh workflow list` 会漏报工作流，上一轮「共 6 条」是错的，实为 7 条。** 磁盘 `.github/workflows/` 有 **7 个** yml，但 `gh workflow list`（**加 `--limit 50` 也只返回 6 行**）漏掉 `agent-delivery-dispatch.yml`，而该文件 `gh run list` 一查就有 **7 次 run**。
  - **下轮必守：盘点工作流要枚举磁盘文件**（`ls -1 .github/workflows/`，再逐文件 `gh run list --workflow=<basename>`）；**判「是否废弃」看有没有 run，不看在不在 list 里**。
- **第二条经验：看到 `failure` 先读 job 结尾再下结论。** `agent-delivery-dispatch.yml` 的 7 次 failure **全是主动 `exit 1` 的路标**（「派单已迁移到本地 Codex CLI，本工作流未领取 issue、未启动实现」），是防误用护栏。**只看结论列会凭空造出一个不存在的待办**——通用风险：TODO 里的「failure」不加判读会持续污染待办清单。
- **新增「版本与分支」维度**（前九轮从未查）：**0 个 git tag、0 个 GitHub Release** → 无版本化发布物，部署纯靠 main 持续部署；**对 P0-3 的实质影响：签审无 tag/release 可锚，只能锚 commit SHA**，已在 P0-3 补上该动作。分支：本地 32 / 远程 11 / 6 个已合并到 main（不动不删，仅留档）。
- **CI run 号连续第二轮「写入即过期」**：本次 `34310382154`→`34340240726`（headSha 核对为 `b882307`）。**这类值已被证明不可跨轮沿用，每轮开头必查**；核对用 `gh run view <id> --json headSha` 比对 `git log -1 --format=%H`，别看标题猜。
- 复核`on:` 块确认 API contract gate 只有 `pull_request`(4 paths 含自身)+`workflow_dispatch`，**确无 push 触发**；`event: push` 的 run 成因**仍未查清，继续标注「不臆断、不作阻塞项」**。
- 其余断言全部仍成立：线上 bundle `index-CDXE9BO-.js`(325,768 B，`scapemusic.pages.dev`/`No account, no ads` 0 命中、`App link coming soon` 1 命中)、线上 catalog 105 首/315 谱面/`stream_app_url` 0-105 且 ID 集合与本地一致、p4 谱面 200、`release.json` 与缺失路径同 2146 B、放行七字段全 null、零 TODO-FIXME、零 `@ts-ignore`、非测试源码零 `any`（4 命中=3 测试桩+`Duo.tsx:114` 注释假阳性）、T1b·T5b 零测试命中、链接自检唯一 MISS 仍是 `#bs-d001` 锚点假阳性。部署管道仍 5 连败、最后成功 `33895713222`、无新增 run。
- **网络**：代理 `7897` 返回 200 可用（7890/1087/8888/1080 均 000）。push 一次成功，push 后未 fetch。
- 纪律不变：只 `git add TODO.md`（10 项改动 + 9 项未跟踪，未触碰）；未改 SESSION.md。

## 调度变更（2026-09-09 23:33 用户要求）
- 频率由 **每 6 小时** 改为 **每 2 小时**（`FREQ=HOURLY;INTERVAL=2`，24×7，status ACTIVE），首次新调度运行 2026-09-10 01:33 CST。
- 选择「更新本自动化」而非新建：本自动化已在做「整理项目 TODO → 写入 TODO.md → 提交 push」，再建一个会重复处理同一文件。
- **prompt 已扩充**（下次运行会看到的新版），把前九轮积累的纪律固化进去：判有无新落地 → 校验型刷新 vs 新落地登记；九项实测校验维度；每轮尽量新增一个「从未查过的清单」维度；只 `git add TODO.md`、绝不 `-A`；不改 SESSION.md；BS-D001 不回填不记为通过、`deviceTestRecord` 门禁不得自行放宽；网络不可达不得记为线上异常；push 走 `127.0.0.1:7897`、push 后不 fetch；**无实质变更就不提交，不制造空提交**。
- 频率提高后注意：绝大多数轮次没有新落地项（已连续八轮），此时应只做校验、无变化即不提交，避免产生大量无意义 commit。

## 调度变更（2026-09-10 22:56 用户要求）
- 频率由 **每 2 小时** 改回 **每 6 小时**（`FREQ=HOURLY;INTERVAL=6`，24×7，status ACTIVE），下次运行 **2026-09-11 04:57 CST**。
- 用户原话是「创建自动化任务每 6 个小时干一次」，但**本自动化已在做完全同一件事**（整理 TODO.md → 提交 push），新建一条会让两条同时读写 `TODO.md` → **再次选择「更新频率」而非新建**（与 2026-09-09 那次同因）。已就此询问用户，未获选择，按推荐方案（改频率、不新建）执行并明确告知。
- **可复用规则：收到「创建自动化」类请求时，先 `automation_update list` 查是否已有同类任务**；若已存在且目标文件相同，默认改频率/改提示词，不新建重复任务，并说明理由。
- 频率降回 6 小时后：每轮仍是「先判有无新落地 → 校验型刷新 → 有实质变更才提交」。截至本次改频率时已**连续第十八轮无新落地项**，无变化即不提交的原则不变。

## 本次执行（2026-09-10 第二次）— 指令仍为「整理项目 TODO」
- 开局 `rev-list` = 0/0、HEAD `5c9e9a7` 即上次刷新 → **连续第十轮无新落地项**。校验型刷新 + 新维度，commit `80351d5`，已 push（`5c9e9a7..80351d5`）。
- **本轮新增维度：「孤儿资产」盘点**（前十轮从未查）。判据：文件名是否出现在任何受控文本文件（md/json/yml/sh/py/ts/js/txt，排除 node_modules、apps/beatscape/public、data/）中。结果：`scripts/` **92 个脚本中 22 个（24%）、docs/ 49 个 md 中 1 个**从未被引。抽查 5 个用 `grep -rl "<文件名>"` 全仓直查均 0 命中 → 确认真孤儿。
- **本轮最重要的判读纪律（直接决定这个维度是资产还是噪音）**：**孤儿 ≠ 该删**。22 个里绝大多数是一次性 Ingest / LoRA 训练 / ACE-Step 环境脚本，**落单是它们的正常形态**（靠人手动跑、不写进文档）。**只有「诊断类」脚本落单才值得追问**（诊断没人跑等于没诊断）。因此**拒绝生成「清理 22 个孤儿脚本」这种待办**——那会制造噪音并可能误删流水线工具。通用规则：**盘点出新清单时，先问「这类文件落单是否正常」，再决定要不要生成待办。**
- **从孤儿清单挖出的唯一候选**：`scripts/beatscape-chart-sync-check.py`（121 行，谱面音符 × 音频 onset 能量**互相关**对齐诊断，docstring 明确写了为何不能只用「最近 onset 距离」——120s 曲子 1300+ onset，平均 88ms 一个，「最近 18ms」与随机猜测无异）。它**不在任何验收命令或 CI**，而验收命令段确实**没有任何谱面-音频对齐 QA**（根 `package.json` 的 catalog/audit/earcheck:beatscape 分别管 catalog 状态、内容审计、耳检，已实测核对）。**仅登记为候选、不认领、不作阻塞项**——是否接线是产品判断。
- **两条数字纠错（都是「写入即过期」类）**：① CI run 号 `34340240726`→`34384329456`（**连续第三轮**命中同类问题，`gh run view --json headSha` 核对为 `5c9e9a7`）；② 部署债务 **23→25**，但**触及 `apps/beatscape/**` 的仍是 6 个、名单不变** → 增量全来自 TODO 刷新自身。**教训：债务类数字必须同时记「总数」与「其中触及代码的个数」**，否则文档刷新会被误读成功能积压。
- 其余断言复核全部仍成立：105 首 / 各季分布 / 315 谱面 / `stream_app_url` 0-105 / 线上 catalog 105 首 315 谱面 ID 集合与本地一致 / p4 谱面 200 / 线上 bundle `index-CDXE9BO-.js`(325,768 B) / `release.json` 与缺失路径同 2146 B / 放行七字段全 null / 零 TODO-FIXME / 零 `@ts-ignore` / 非测试源码零 `any`（3 测试桩 + `Duo.tsx:114` 注释假阳性）/ T1b·T5b 零测试命中 / 17 条链接全 OK（唯一 MISS 仍 `#bs-d001`）/ 部署 5 连败无新增 run / `gh workflow list` 仍只返回 6 条（再次印证漏报）。
- **网络**：代理 `7897` 返回 200，线上取证全部成功；push 一次成功，push 后未 fetch。
- 纪律不变：只 `git add TODO.md`（10 项改动 + 10 项未跟踪，未触碰）；未改 SESSION.md。

## 本次执行（2026-09-10 第三次）— 指令仍为「整理项目 TODO」
- 开局 `rev-list` = 0/0、HEAD `80351d5` 即上次刷新 → **连续第十一轮无新落地项**。校验型刷新 + 新维度，commit `a29bc04`，已 push（`80351d5..a29bc04`）。
- **本轮新增维度：「散落待办清单」盘点**（直接检验 TODO.md 自称的「待办唯一入口」是否成立，前十一轮从未查）。实测除根 TODO.md 外**另有 5 个受控文件承载未勾选项、共 91 个未勾复选框**（`BEATSCAPE-TODO-ACCEPTANCE` 28 / `RESONANCE-VISUAL-PLAN` 26 / `PRD-BEATSCAPE` 15 / `BEATSCAPE-IP-STRATEGY` 12 / `docs/TODO.md` 10）。另有非复选框形态的 `.delivery/beatscape/backlog.md`，**本文件从未提及**，含 1 条未关闭的 `TICKET-B05`（Reddit CTA 文案，落在 P3 首条范围内 → 不新开条目，仅标注两处状态需同步）。
- **本轮最重要判读（与上一轮「孤儿 ≠ 该删」同源）**：**「未勾复选框」是最容易骗人的待办来源**。`docs/RESONANCE-VISUAL-PLAN.md` **26 个未勾、0 个已勾**，看着像整套「霓虹→漫画硬边」改造没做；实测代码后 Anton 15 命中 / `halftone` 10 命中 / `--glow-accent: none`（且 `.ts/.tsx` 0 引用）→ **基本已落地，真正没做的只有 1 条**：`docs/_visual-baseline/` 视觉回归基线目录不存在（`ls` 报 No such file）。**规则：一份「全未勾」的计划文档，通常不是因为一项都没做，而是做完后没人回来勾选。** 判读手法 = 把条目翻译成「必然留下的代码痕迹」（字体名/CSS 变量/目录/函数名）再 grep，而不是读文档文字。
- **通用规则固化（本轮踩到）**：**同一个会变的数字在本文件里往往有多处副本**。部署债务出现了 23（速览）/ 25（正文）/ 26（实测）三个版本——上一轮只改了正文漏了速览；CI run 号同样「正文 + 速览」两处不一致，**且速览比正文还落后两轮**（正文 `34384329456`/`5c9e9a7`，速览 `34340240726`/`b882307`，实测最新 `34397187366`/`80351d5`）。**改任何数字前先 `grep -n` 全局找一遍所有出现位置**（`grep -n "个 commit 未部署\|部署债务" TODO.md`）。CI run 号已**连续第四轮**写入即过期。
- 其余断言复核全部仍成立：105 首 / 各季分布 / 315 谱面 / `stream_app_url` 0-105 / `stream_audio` 105-105 / 线上 catalog 105 首 315 谱面 `stream_app_url` 0 且 ID 集合与本地一致 / p4 谱面 200 / 线上 bundle `index-CDXE9BO-.js` / `release.json` 与缺失路径同 2146 B / 放行七字段全 null / 零 TODO-FIXME / 零 `@ts-ignore` / 非测试源码零 `any`（3 测试桩 + `Duo.tsx:114` 注释假阳性）/ T1b·T5b 零测试命中 / 18 条链接全 OK（唯一 MISS 仍 `#bs-d001`）/ 部署 5 连败无新增 run / 债务 26 其中触及代码 6 个 / `gh workflow list` 仍漏报只返 6 条。
- **网络**：代理 `7897` 返回 200，线上取证全部成功；push 一次成功，push 后未 fetch。
- 纪律不变：只 `git add TODO.md`（10 项改动 + 10 项未跟踪，构成与上一轮完全一致、未触碰）；未改 SESSION.md。未做顺手收尾（`docs/_visual-baseline/` 需截图非极小动作；TICKET-B05 需用户文案决策）。

## 本次执行（2026-09-10 第四次）— 指令仍为「整理项目 TODO」
- 开局 `rev-list` = 0/0、HEAD `a29bc04` 即上次刷新 → **连续第十二轮无新落地项**。校验型刷新 + 新维度，commit `119d50a`，已 push（`a29bc04..119d50a`）。
- **本轮新增维度：「测试覆盖盲区」盘点**（前十二轮从未查）。先按目录统计 → 再追到工作流查「谁真的执行测试」。**核心发现：4 个 Playwright e2e spec 不在 `ci.yml` 里，只在部署管道跑。** 依据：`ci.yml` 的 beatscape job 只有 `pnpm --filter @musicsaas/beatscape test`（= vitest）+ 2 个 python 脚本，**grep `e2e|playwright` 0 命中**；而 `deploy-beatscape-cloudflare.yml` 会 `playwright install --with-deps chromium` 并在 "Verify release candidate" 走 `pnpm release:beatscape` → `release:check` → `npm run test:e2e`。部署最后一次 run 是 `34064117995`（09-06T22:28Z）→ **e2e 空窗至今**；同期 CI 跑了 **13 次全 success**（`gh run list --workflow=ci.yml --limit 50 --json conclusion,createdAt --jq '[.[]|select(.createdAt>"2026-09-06T22:28:24Z")]...'`），**没有一次含浏览器回归** → 「CI 绿」的覆盖范围比字面窄。
- **本轮最有价值的方法论（下轮必守）**：**查「有没有测试」之前，先查「测试在哪跑」。** 只统计测试文件数会得出错误结论——`pages/` 15 个文件零单测看似严重，但真问题是 e2e 不进 CI。通用化：**任何「有 X」的断言，都要再追一层「X 被谁执行/在哪生效」。**
- **第三次印证「零 ≠ 该补」**（与「孤儿 ≠ 该删」「未勾 ≠ 没做」同源）：`pages/` 用 e2e 覆盖是合理层级，**拒绝生成「补 39 个单测」**，只登记「是否把 e2e 接入 CI」一条候选（工程权衡，非缺陷）。附带可操作信息：**`release:check` 排在 `launch:check` 之前，所以触发一次注定失败的部署 run，是当前唯一能在远程拿到 e2e 结果的窗口**。
- 另查得 15 个页面中 **4 个两种测试都未触及**：`Calibration` / `FirstShift` / `Legal` / `NotFound`（`grep -ril "<PageName>" apps/beatscape/e2e/ | wc -l` = 0）；其中 `Calibration`（音画同步校准）相对最值得关注，仅登记不认领。
- **数字纠错（老问题复现）**：① CI run 号 `34397187366` → **`34409481296`**（headSha 核对为 `a29bc04`），**连续第五轮**写入即过期；② 部署债务 **26 → 27**，触及 `apps/beatscape/**` 的**仍 6 个名单不变**，增量全来自 TODO 刷新自身。本轮因上轮已统一过速览/正文，两处未再分叉。
- 其余断言复核全部仍成立：105 首 / 各季分布 / 315 谱面 / `stream_app_url` 0-105 / `stream_audio` 105-105 / 线上 catalog 105 首 315 谱面 `stream_app_url` 0 / p4 谱面 200 / 线上 bundle `index-CDXE9BO-.js` / `release.json` 与缺失路径同 2146 B / 放行七字段全 null / 零 TODO-FIXME / 零 `@ts-ignore` / 非测试源码零 `any`（3 测试桩 + `Duo.tsx:114` 注释假阳性）/ T1b·T5b 零测试命中 / 17 条链接全 OK（唯一 MISS 仍 `#bs-d001` 锚点假阳性）/ 部署 5 连败无新增 run / `gh workflow list` 仍漏报只返 6 条。
- **新手法：锚点自检**（此前只做文件路径自检）。用 python 把 `^#{2,3} (.+)$` 标题转 slug（小写、去 `（）()、,。·`、空格→`-`）建集合，再对 `](#...)` 逐一比对 → 本轮 7 个内部锚点全 OK。
- **网络**：代理 `7897` 返回 200（其余端口 000），线上取证与 `gh` 全部成功；push 一次成功，push 后未 fetch。
- 纪律不变：只 `git add TODO.md`（10 项改动 + 10 项未跟踪，构成与上一轮一致、未触碰）；未改 SESSION.md。本轮**未做顺手收尾**（无符合「极小动作」的候选）。

## 本次执行（2026-09-10 第五次）— 指令仍为「整理项目 TODO」
- 开局 `rev-list` = 0/0、HEAD `119d50a` 即上次刷新 → **连续第十三轮无新落地项**。校验型刷新 + 新维度，commit `89c5cd6`，已 push（`119d50a..89c5cd6`）。
- **本轮新增维度：「受控二进制资产与公开资产暴露面」盘点**（前十三轮从未查）。体积结构：受控 **1209 文件 / 440.1 MiB**，`.m4a` 占 **410.9 MiB（93.4%）**；**git-lfs 装了但从未使用**（无 `.gitattributes`、`git lfs ls-files` 空）→ 410 MiB 全进 git 历史，`.git` 已 **1.4 G**。
- **核心发现（本轮最有价值）**：`apps/scapemusic/public/trials/` 下 **5 个 m4a / 27.81 MiB**，源码 0 引用、**不在任何 catalog**（`grep -c "demo-" catalog.json`=0），**却已上线、`scapemusic.pages.dev/trials/*.m4a` 全部 200 可公开下载**。`demo-b1/b2/b3` 像生成变体，疑似实验残留。**真正价值在跨集合比对**：P0-1 耳检范围是 catalog 的 105 首 → 这 5 个文件**从未进入耳检视野却已可公开下载**，是此前没人看到的覆盖缺口。已在 P0-1 登记，**明确不判断其是否有风险（未听过）**，也不做删除动作。
- **通用规则（第四次印证「零 ≠ 该补/该删」，且比前三次更进一步）**：单独看「未被引」只是噪音（孤儿 ≠ 该删），但**「未被引 + 已上线可下载」就构成暴露面**。下轮可复用的问法：**把「受控 / 已发布 / 已受审」三个集合交叉比对**，问「有没有文件既不在受审清单里、又能被外人拿到」——比单独看任何一个集合都有效。
- **新坑：同一文件的多个 Edit 并行调用会互相覆盖**。本轮为改 4 处历史段落标签连发 4 个 Edit（均返回成功），结果**只有最后一个生效**，其余 3 处仍是旧标签，靠复查才发现。→ **对同一文件的多个 Edit 必须串行执行**。
- **新坑：macOS 下 `sort -rn` 处理 `stat -f "%z path"` 输出不可靠**（本轮 top12 全是 0.0 MiB 小文件）。改用 python `os.path.getsize` 聚合，一次到位。另：**统计目录体积前先查符号链接**——`apps/scapemusic/public/catalog` 是指向 `../../beatscape/public/catalog` 的 symlink，`du` 算成 1073 MiB、`os.walk`（默认不跟随）算成 27.8 MiB，两者都对不上；`ls -la` 看 `lrwxr-xr-x` 才解开矛盾。
- **数字纠错（老问题）**：① CI run 号 `34409481296` → **`34419589870`**（headSha `119d50a73d…` = HEAD），**连续第六轮**写入即过期；② 部署债务 **27 → 28**，触及 `apps/beatscape/**` 的**仍 6 个名单不变**。本轮速览/正文两处未分叉。
- 其余断言复核全部仍成立：105 首 / 各季分布 / 315 谱面 / `stream_app_url` 0-105 / `stream_audio` 105-105 / 线上 catalog 105 首 315 谱面 ID 集合与本地一致 / p4 谱面 200 / 线上 bundle `index-CDXE9BO-.js`(325,768 B) / `release.json` 与缺失路径同 2146 B / 放行七字段全 null / 零 TODO-FIXME / 零 `@ts-ignore` / 非测试源码零 `any`（3 测试桩 + `Duo.tsx:114` 注释假阳性）/ T1b·T5b 零测试命中 / 17 条链接 + 8 个锚点全 OK（唯一 MISS 仍 `#bs-d001`）/ 部署 5 连败无新增 run / `gh workflow list` 仍漏报只返 6 条（连续第五轮）。
- **网络**：代理 `7897` → 200（其余端口 000），线上取证与 `gh` 全部成功；push 一次成功，push 后未 fetch。
- 纪律不变：只 `git add TODO.md`（10 项改动 + 10 项未跟踪，未触碰）；未改 SESSION.md。本轮**未做顺手收尾**（trials 文件处置需人工确认来源与授权，非极小动作）。

## 本次执行（2026-09-10 第六次）— 指令仍为「整理项目 TODO」
- 开局 `rev-list` = 0/0、HEAD `89c5cd6` 即上次刷新 → **连续第十四轮无新落地项**。校验型刷新 + 新维度，commit `faad2da`，已 push（`89c5cd6..faad2da`）。
- **本轮新增维度：「构建期环境变量与部署路径」盘点**（前十四轮只逐个核对过单个变量，从未枚举全集）。手法：`grep -rhoE "import\.meta\.env\.[A-Za-z_0-9]+" apps/*/src` 枚举引用点 → 逐个反查注入方（包脚本 / 部署脚本 / 工作流 `env:` / `.env.example`）。三条结论：
  - (a) 3 个自定义 `VITE_*` 中 **`VITE_GAME_URL` 只在 `scripts/deploy-scapemusic-cf-pages.sh:35` 注入**（ScapeMusic 的 `package.json build` 无注入 → 直接 `pnpm build` 产出 `127.0.0.1:5175` 死链），**`VITE_API_BASE` 全仓零注入**（只被本阶段明确不做的 NeonBeat 引用 → 不认领）。
  - (b) **`VITE_STREAM_APP_URL` 的 hash 路由修正被硬编码成「域名字符串精确等于 `https://scapemusic.pages.dev`」**（`streamLink.ts:10`，由 `8b710a3` 引入，与部署门禁同 commit）。实测修正**确有必要**（ScapeMusic 是自研 hash 路由；`scapemusic.pages.dev/track/bs-s1-01` 返回 200/**1944 B**，与确定缺失路径**同字节数** = SPA 回落，路径式深链无效），**但换任何域名即静默失效**，而 `streamLink.test.ts` 的 2 个用例**恰好只测了这个字面域名** → 换域名后仍全绿。已写入 P1-3 动作项。
  - (c) **ScapeMusic 完全没有 CI/CD 工作流**（`grep -rn "scapemusic" .github/workflows/` **0 命中**），部署只靠一个**全仓仅在 `SESSION.md:68` 与 `worklog/2026-09-05.md:59` 被提到过**的手动脚本 → **这解释了上一轮 trials/ 5 个 m4a 能上线的成因**：不是意外，是「没有管道」的必然结果，删了也会再发生。
- **本轮最有价值的两条方法论**：① **把「变量引用点集合」与「变量注入点集合」交叉比对**——单独看任一边都正常（引用点有默认值所以跑得起来，注入点有值所以「配过了」）。**「有没有配」发现不了「配的值还成不成立」**，判据应是「错了会不会被谁发现」。② **测试存在 ≠ 覆盖了会变的地方**——检查硬编码分支时，**看一眼测试用的取值是否恰好等于硬编码值**，一次就能发现「只覆盖了生效那条路」（与第十三次「e2e 不在 CI」同类）。
- **修正一条连续六轮重复的错误结论**：每轮都写「链接自检唯一 MISS 是 `#bs-d001` 锚点假阳性」，实际是**自检脚本没对 `#` 切分**（把 `docs/BEATSCAPE-DECISIONS.md#bs-d001` 整串当路径）。改正后 **23 条文件链接 + 20 个锚点全 OK、MISS 为 0**。**教训：一个每轮都复现的「已知假阳性」，往往是检查脚本本身的 bug，不是真相。**
- **数字纠错（老问题）**：① CI run 号 `34419589870` → **`34428724668`**（headSha 核对为 `89c5cd6`），**连续第七轮**写入即过期；② 部署债务 **28 → 29**，触及 `apps/beatscape/**` 的**仍 6 个名单不变**；③ 顺带修正 `a136592` 之后的 docs-only 数 11 → **14**（`git rev-list --count a136592..HEAD`，其中触及 beatscape 的为 0）。本轮速览/正文两处未分叉。
- 其余断言复核全部仍成立：105 首 / 各季分布 / 315 谱面 / `stream_app_url` 0-105 / `stream_audio` 105-105 / 线上 catalog 105 首 315 谱面 ID 集合与本地一致 / p4 谱面 200 / 线上 bundle `index-CDXE9BO-.js`(325,768 B) / `release.json` 与缺失路径同 2146 B / 放行七字段全 null / 零 TODO-FIXME / 零 `@ts-ignore` / 非测试源码零 `any`（3 测试桩 + `Duo.tsx:114` 注释假阳性）/ T1b·T5b 零测试命中 / 部署 5 连败无新增 run / `gh workflow list` 仍漏报只返 6 条（连续第六轮）。
- **网络**：代理 `7897` → 200，线上取证与 `gh` 全部成功；push 一次成功，push 后未 fetch。
- 纪律不变：只 `git add TODO.md`（10 项改动 + 10 项未跟踪，**连续第三轮构成完全一致**、未触碰）；未改 SESSION.md。本轮**未做顺手收尾**（改 `streamLink.ts` 判等属产品/域名决策，非极小动作）。
- **同轮第二次提交 `7817d5d`**（用户说 continue）：把硬编码域名问题从「单个变量」扩大到全仓 → **除构建产物外 13 个文件 / 30 处写死 `*.pages.dev`**（`dist`/`dist-deploy`/`dist-portal` 已确认全 gitignore、受控 0，不是污染）。分类：**5 个静默失效**（`index.html` 4 处 canonical/og、`sitemap.xml` 8、`robots.txt`、`streamLink.ts`、`Portal.tsx` 2）、**3 个显式护栏**（`e2e/release.spec.ts`、`demo/e2e/portal.spec.ts` 2、`demo/scripts/release.mjs`）、2 个配置入口、3 个注释/夹具 → **一次域名变更要动 11 个真实文件**。
- **本轮最通用的一条规则（比「测试存在≠覆盖」更进一步）**：**同样是硬编码域名，写在 `assert` 里是护栏，写在 `if` / 静态资源里是陷阱。** `streamLink.ts:10` 是全仓唯一把域名写进**逻辑分支**的，所以既静默又无护栏；`e2e/release.spec.ts:35` 把同一域名写进 `expect().toHaveAttribute('href',...)`，反而在变更时立刻报错。**判读硬编码时，看它在「表达式」还是「断言」里，比数它出现几次更有意义。**
- 另注：`grep` 生产域名时**必须先排除 `dist*` 构建产物**，否则 30 处命中里有一半是产物；判「产物是否污染仓库」用 `git ls-files <dir> | wc -l`。

## 本次执行（2026-09-10 第七次）— 指令仍为「整理项目 TODO」
- 开局 `rev-list` = 0/0、HEAD `7817d5d` 即上次刷新 → **连续第十五轮无新落地项**。校验型刷新 + 新维度，commit `9eeee79`，已 push（`7817d5d..9eeee79`）。
- **本轮新增维度：「运行时外部依赖与字体供应链」盘点**（前十五轮只查过**构建期**变量与**自己的**硬编码域名，从未问过**第三方主机**）。手法：枚举受控源码（`git ls-files`）里的外部域名，再逐条判「运行时 / 构建期 / 文档」。
  - **核心发现**：BeatScape / ScapeMusic / NeonBeat 三个 app 的**三款字体（Anton 展示 / Sora 次级 / IBM Plex Sans 正文）100% 取自 Google Fonts CDN**，**仓库零本地字体文件**（`git ls-files | grep -iE '\.(woff2?|otf|ttf)$'` = 0）。已做非阻塞加载（`preload`→`onload` 切 `rel` + `noscript`）**不卡首屏**，但 **CDN 不可达时静默回退 `system-ui`，无报错无监控**，而 `styles.css` 有 10+ 处把 Anton 写作首选展示字体。
  - **同维度四条「干净」结论（实测、非沿用）**：受控文件零 `node_modules`/`dist` 误提交、8 个构建产物目录**全部**被 gitignore 覆盖、零 `.env`（非 `.example`）曾进 git 历史、零私钥/`sk-`/`ghp_`/`AKIA` 凭据字面量 → **这四条不生成待办，写出来是为了以后不必重复排查**。
  - **一个「将来才会炸」的耦合**：`apps/beatscape/public/_headers` **没有 CSP**（只有缓存头 + nosniff + referrer-policy）→ **当前不冲突，不得断言成「已被阻断」**；但 `apps/demo/scripts/release.mjs:91` 门户 CSP 是 `font-src 'self'` + `style-src 'self' 'unsafe-inline'` → **将来复用该 CSP 到 BeatScape/ScapeMusic 会完整阻断字体且同样静默**。另 Legal.tsx 隐私表述**未提及字体 CDN**（只说不做广告追踪），登记为 P0-3 签审确认项，**只陈述事实不作法律结论**。
- **判读纪律（第六次印证「零 ≠ 该补/该删」，且首次把「静默」当判据）**：本轮两个「零」——**零本地字体文件**（值得登记：唯一运行时外部依赖 + 失败静默）vs **零凭据泄露**（不生成待办：干净就是干净）。**区分标准：这个「零」会不会在没人注意的情况下改变用户实际看到的东西。**
- **新坑：扫域名必须先定范围**。第一版把 `tests/.venv/`、`package-lock.json`、`.workbuddy-ai/backups/` 一起扫 → **49 个域名全是噪音**（`registry.npmjs.org` 199 处、`docs.rs` 79 处）；限定 `git ls-files` + 排除 `data/` 后只剩 **17 个**才看得到真结论。**判运行时 vs 构建期：命中文件在 `src/`、`index.html` 就是运行时，在 `scripts/`、`.delivery/` 就不是。**
- **数字纠错（老问题）**：① CI run 号 `34428724668` → **`34437400256`**（headSha 核对为 `7817d5d`），**连续第八轮**写入即过期；② 部署债务 **29 → 31**，触及 `apps/beatscape/**` 的**仍 6 个名单不变**；③ docs-only 数 14 → **16**。本轮速览/正文两处未分叉（改前先 `grep -n` 全文找副本）。
- 其余断言复核全部仍成立：105 首 / 各季分布 / 315 谱面 / `stream_app_url` 0-105 / `stream_audio` 105-105 / 线上 catalog 105 首 315 谱面 ID 集合与本地一致 / p4 谱面 200 / 线上 bundle `index-CDXE9BO-.js`(325,768 B) / `release.json` 与缺失路径同 2146 B / 放行七字段全 null / 零 TODO-FIXME / 零 `@ts-ignore` / 非测试源码零 `any`（3 测试桩 + `Duo.tsx:114` 注释假阳性）/ T1b·T5b 零测试命中 / **23 条文件链接 + 26 个锚点全 OK、MISS 0**（连续第二轮确认 `#bs-d001` 不是问题）/ 部署 5 连败无新增 run / `gh workflow list` 仍漏报只返 6 条（连续第七轮）。
- **网络**：代理 `7897` → 200（其余端口 000），线上取证与 `gh` 全部成功；push 一次成功，push 后未 fetch。
- 纪律不变：只 `git add TODO.md`（10 项改动 + 10 项未跟踪，**连续第四轮构成完全一致**、未触碰）；未改 SESSION.md。本轮**未做顺手收尾**（字体自托管 vs CDN 是产品/合规权衡且与性能预算有张力，非极小动作）。

## 本次执行（2026-09-10 第八次）— 指令仍为「整理项目 TODO」
- 开局 `rev-list` = 0/0、HEAD `9eeee79` 即上次刷新 → **连续第十六轮无新落地项**。校验型刷新 + 新维度，commit `0d4151b`，已 push（`9eeee79..0d4151b`）。
- **本轮新增维度：「Cloudflare Pages 路由与缓存配置」盘点**（前十六轮从未查 CF Pages 自身的路由/缓存规则文件）。五条结论：
  - (a) `_redirects` 只有 `/* /index.html 200` SPA 回落 → `/release.json` 返回 2146 B HTML 的机制是这条规则；
  - (b) `release.json` 是构建期产物（`release.mjs:113` writeFileSync），本地 `dist/` 61,500 B，线上 2146 B = 从未部署；
  - (c) `_headers` 在 commit `8b710a3`（09-05 16:06）改过，晚于最后成功部署 `ffe1ec0`（09-05 00:31）→ 线上缓存头过期（线上 catalog.json `max-age=300` vs 仓库 `max-age=0`）；
  - (d) ScapeMusic 零 CF Pages 配置文件（无 `_redirects`/`_headers`/`wrangler.toml`）；
  - (e) 只有 BeatScape 有 `wrangler.toml`；Demo CSP 在构建产物目录（gitignore）。
- **数字纠错（老问题）**：① CI run 号 `34437400256` → **`34446200971`**（headSha 核对为 `9eeee79`），**连续第九轮**写入即过期；② 部署债务 **31 → 32**，触及 `apps/beatscape/**` 的**仍 6 个名单不变**；③ docs-only 数 16 → **17**。速览/正文两处未分叉（改前先 `grep -n` 全文找副本）。
- 其余断言复核全部仍成立：105 首 / 各季分布 / 315 谱面 / `stream_app_url` 0-105 / `stream_audio` 105-105 / 线上 catalog 105 首 315 谱面 ID 集合与本地一致 / p4 谱面 200 / 线上 bundle `index-CDXE9BO-.js`(325,768 B) / `release.json` 与缺失路径同 2146 B / 放行七字段全 null / 零 TODO-FIXME / 零 `@ts-ignore` / 非测试源码零 `any`（3 测试桩 + `Duo.tsx:114` 注释假阳性）/ T1b·T5b 零测试命中 / **23 条文件链接 + 26 个锚点全 OK、MISS 0**（连续第三轮）/ 部署 5 连败无新增 run / `gh workflow list` 仍漏报只返 6 条（连续第八轮）。
- **网络**：代理 `7897` → 200，线上取证与 `gh` 全部成功；push 一次成功，push 后未 fetch。
- 纪律不变：只 `git add TODO.md`（10 项改动 + 10 项未跟踪，**连续第五轮构成完全一致**、未触碰）；未改 SESSION.md。本轮**未做顺手收尾**（CF Pages 配置修改属部署基建决策，非极小动作）。

## 本次执行（2026-09-10 第九次）— 指令仍为「整理项目 TODO」
- 开局 `rev-list` = 0/0、HEAD `0d4151b` 即上次刷新 → **连续第十七轮无新落地项**。校验型刷新 + 新维度，commit `c105e2d`，已 push（`0d4151b..c105e2d`）。
- **本轮新增维度：「i18n / 文案清单」盘点**（前十七轮从未盘多语言）。定义 40 个文案 key（en/zh 双份），实测**只有 10 个真被接线**、15 个页面里**仅 Home / Track** 走 i18n（外加组件 `TrackAudioPreview`）。
- **最反直觉的一条：`zh` locale 运行时完全不可达**（四条独立证据）：3 个 `getMessages()` 调用点（`Home.tsx:62` / `Track.tsx:18` / `TrackAudioPreview.tsx:13`）**全部不传参** → 恒 `DEFAULT_LOCALE="en"`；`Settings.tsx` grep 语言相关词 0 命中、无 `setLocale`；跨 `apps/*/src` 与 `index.html` 无 `navigator.language`/`Accept-Language` 探测；两个 `index.html` 均硬编码 `<html lang="en">`。→ **40 key × 2 locale 的维护与 2 个 parity 测试，保护的是没有任何代码路径能到达的分支。**
- **但仍判定为「有意设计」而非缺陷、拒绝生成「补中文」待办**（第七次印证「零 ≠ 该补」）：`zh.ts:3` docstring 自述「阶段一占位、完整翻译后续里程碑补齐」，英文是发布语言（P0-4 英语叙事试玩）。**本维度真正的价值是揭示成本量级**：从 TODO 任何一处看都像「翻 7 句英文」，实测是「13 个页面先抽文案 + 补切换入口」，差约一个数量级。
- **发现新形态假安全感：「有测试无调用方」**。`leaderboard` 命名空间 9 个 key 在 `src/` **零引用**（`Leaderboard.tsx` 根本没 import i18n），却有 2 个单测；`leaderboard.test.ts:19` 断言「zh `emptyState` ≠ en」，而 `emptyState` 恰是该命名空间**唯一译了的** key → **测试挑了必然通过的那个样本**。与第十三次「有测试（e2e）但没在 CI 跑」合成通用判据：**判断一块东西是否真被保障，问「谁在运行时到达它」，而不是「有没有测试提到它」。**
- **两个新坑**：① `grep -oE "t\.[A-Za-z0-9_.]+"` 在 src 会抓到 20+ key，但**绝大多数不是 i18n 的 `t`**（`t.track_id`/`t.title`/`t.bpm`/`t.meanMs` 是遍历曲目与计时数据的同名局部变量）→ **只有 `t.ui.*`/`t.leaderboard.*` 才是 i18n，必须回看命中行**；② **标题里带 `/` 会让锚点 slug 与自检脚本不一致**（GitHub 会删 `/`，脚本不删）→ 新增章节标题**避免用 `/`**，本轮改名为「i18n 与文案清单盘点」。
- **数字纠错（老问题）**：① CI run 号 `34446200971` → **`34457550792`**（headSha 核对 `0d4151b`），**连续第十轮**写入即过期；② 部署债务 **32 → 33**，触及 `apps/beatscape/**` 的**仍 6 个名单不变**；③ docs-only 17 → **18**。速览/正文两处未分叉（改前先 `grep -n` 找副本）。
- 其余断言复核全部仍成立：105 首 / 各季分布 / 315 谱面 / `stream_app_url` 0-105 / `stream_audio` 105-105 / 线上 catalog 105 首 315 谱面 `stream_app_url` 0 且**曲目 ID 集合与本地完全一致** / p4 谱面 200 / 线上 bundle `index-CDXE9BO-.js` / `release.json` 与缺失路径同 2146 B / 放行七字段全 null / 零 TODO-FIXME / 零 `@ts-ignore` / 非测试源码零 `any`（3 测试桩 + `Duo.tsx:114` 注释假阳性）/ `socialMetaTags` 仅 `pageMeta.ts:80/113`、`copyImageBlob` 仅 `Results.tsx:72/242`（**均零测试命中**）/ **23 条文件链接 + 28 个锚点全 OK、MISS 0**（连续第四轮）/ 部署 5 连败无新增 run / `gh workflow list` 仍漏报只返 6 条（连续第九轮）。
- **网络**：代理 `7897` → 200（其余端口 000），线上取证与 `gh` 全部成功；push 一次成功，push 后未 fetch。
- 纪律不变：只 `git add TODO.md`（10 项改动 + 10 项未跟踪，**连续第六轮构成完全一致**、未触碰）；未改 SESSION.md。本轮**未做顺手收尾**（i18n 接线属产品/市场决策，非极小动作）。

## 本次执行（2026-09-10 第八次之后 · 第十九次刷新）— 指令仍为「整理项目 TODO」
- 开局 `rev-list` = 0/0、HEAD `c105e2d` 即上次刷新 → **连续第十八轮无新落地项**。校验型刷新 + 新维度，commit `5889955`，已 push（`c105e2d..5889955`，rev-list 0/0）。
- **本轮新增维度：「依赖与运行环境清单」盘点**（前十八轮只查过「代码里写了什么」，从未交叉比对「声明的依赖」与「实际的引用」）。三分局面：
  - **Node 侧完全干净**：6 个包**零幽灵依赖**（import 未声明；pnpm 严格链接下本就活不下来 → 不算成果，只是确认不用担心）；「声明了却从未 import」的 9 项**全部**是 `@types/*` / `typescript` / `tsx` / `prisma`，经 tsconfig 与 CLI 隐式使用 → **第八次印证「清单 ≠ 该清」，拒绝生成清理待办**。
  - **Python 侧**：`tests/` 有 `tests/requirements.txt`、`workers/ace-step` 与 `workers/sa3` 各一份，**唯独 `scripts/`（内容生产链，全仓 82 个受控 .py 的绝大多数，需 17 个第三方包：torch/diffusers/transformers/accelerate/PIL/peft/datasets/torchvision/wandb/xformers/bitsandbytes/mlx/mlx_lm/acestep…）一份都没有**，而根 `package.json` 把其中约 15 个暴露成 pnpm 命令。
- **本轮最有价值的判读：发现「少了某个文件」后，下一步必须查「谁会用到它」，而不是直接登记待办。** 差点写成「CI 装不上 Python 依赖」这个假阻塞：7 条工作流 yml 里 `grep "pip install|requirements.txt"` **零命中**，但**实际安装发生在 `scripts/harness.sh:34-40` 的 `ensure_py_env`**（自建 `tests/.venv`，装 `tests/` + `workers/ace-step` 两份，且有 venv 缓存分支），只服务 unit/integration/e2e 三个 tier；而 CI 的 `beatscape` job **不经过 harness.sh**，是 `setup-python@v5` 后裸 `python3` 直跑 → 实测那 3 个脚本（`beatscape-audit.py` 859 行 / `-catalog-status.py` 171 行 / `-earcheck.py` 114 行）**100% 标准库** → **`scripts/` 缺 requirements 完全落在 CI 之外，当前零影响，明确不列为阻塞项**。
- **由此沉淀一条此前无人记录的隐藏约束（本轮唯一建议长期记住的工程约定）**：**那 3 个脚本必须永远保持纯标准库**——开发机装了 torch/numpy，给 `beatscape-audit.py` 加一句 `import numpy` 会「本地照过、CI 立刻红」，且现有流程无任何环节拦得住（无 lint 规则、CI 无注释说明）。仅留档、不生成待办。
- 顺带两条次要事实：`mlx`/`mlx_lm`/`acestep` **仅出现在 `scripts/mac-ace-verify.py`** → 内容生产链这一环**绑定 Apple Silicon**；`workers/sa3/requirements.txt` **从未被任何自动化安装**（harness 只装 ace-step 那份），但两份**逐行相同** → 无实际缺口，仅留档。
- **数字纠错（老问题）**：① CI run 号 `34457550792` → **`34469117993`**（headSha `c105e2df…` = HEAD），**连续第十一轮**写入即过期；② 部署债务 **33 → 34**，触及 `apps/beatscape/**` 的**仍 6 个名单不变**；③ docs-only 18 → **19**。改前用 `grep -n` 找了速览/正文两处，未分叉。
- 其余断言复核全部仍成立：105 首 / 各季分布 / 315 谱面 / `stream_app_url` 0-105 / `stream_audio` 105-105 / 线上 catalog 105 首 315 谱面且 ID 集合与本地一致 / p4 谱面 200 / 线上 bundle `index-CDXE9BO-.js`(325,768 B) / `release.json` 与缺失路径同 2146 B / 放行七字段全 null / 零 TODO-FIXME / 零 `@ts-ignore` / 非测试源码零 `any`（3 测试桩 + `Duo.tsx:114` 注释假阳性）/ `socialMetaTags` 仅 `pageMeta.ts:80/113`、`copyImageBlob` 仅 `Results.tsx:72/242`（均零测试命中）/ **16 条文件链接 + 32 个锚点全解析成功 MISS 0**（连续第五轮确认 `#bs-d001` 不是问题）/ 部署 5 连败无新增 run / `gh workflow list` 仍漏报只返 6 条（连续第十轮）。
- **网络（重要）**：本轮**会话中途断网**——开局探测 7897 → 200，线上取证与 `gh` 全部成功；但 `git push` 时突变为 `SSL_ERROR_SYSCALL`，复测 5 个端口**全 000**。处理：**不要死循环重试，先重新探测端口**；本轮约 1 分钟后 7897 恢复，第二次 push 一次成功。**坑：用 `git push ... | tail -3` 后判 `$?` 取到的是 `tail` 的退出码，会误报 PUSHED** —— 判断是否真的推上去必须看 `git rev-list --left-right --count origin/main...main` 是否为 `0	0`。
- 纪律不变：只 `git add TODO.md`（10 项改动 + 10 项未跟踪，**连续第七轮构成完全一致**、未触碰）；未改 SESSION.md。本轮**未做顺手收尾**（补 CI 注释属工程约定，当前无人踩到，且非「极小收尾」）。

## 本次执行（2026-09-10 第二十次，用户手动触发）— 指令仍为「整理项目 TODO」
- 用户把频率由 2h 改回 6h 后说「现在就可以干一次」，手动跑一轮。开局 `rev-list` 0/0、HEAD `5889955` 即上次刷新 → **连续第十九轮无新落地项**。校验型刷新 + 新维度，commit `4553e36`，已 push（`5889955..4553e36`）。
- **本轮新增维度：「可访问性与社交预览资产」盘点**（前十九轮从未查 a11y / 动效偏好 / OG 资产是否真在线）。
- **本轮最有价值的一条：`og.png` 线上不存在 → 社交分享预览全线失效。** 本地 `apps/beatscape/public/og.png` 存在且已受控（**1,200×630**、39,195 B，与 `index.html` 声明的 `og:image:width/height` 完全吻合），但 `https://beatscape.pages.dev/og.png` 返回 **200 + 2146 B `text/html`**，与确定缺失路径**同字节数** = SPA 回落页。`og:image` / `twitter:image` 都指向它 → **Reddit / X / Discord / Slack 抓取分享卡片时拿到的是一段 HTML 而不是图**。
  - **关键：先溯源再定性**（否则会误记成「忘了上传」或新开「补图片」待办）。`git log -1 -- apps/beatscape/public/og.png` = **`8b710a3`（09-05 16:06）**，晚于最后一次成功部署 `ffe1ec0`（09-05 00:31）**约 15.5 小时** → **从未有过部署机会，是 P0-6 的症状，不是独立缺陷**。已在 P0-6 与 P3 两处登记，**不单开待办**（补图没用，只有部署通了它才会出现）。
- **同源第二条证据**：线上 `sitemap.xml` **911 B** vs 本地 **1,025 B**，`diff` 只差一行（缺 `/shift`）；该文件最后由 `735208b`（09-05 21:51）修改，同样晚于最后成功部署。`robots.txt` 线上 133 B 与本地一致。
- **由此把「线上落后」的粒度又细化一层**（第八次教训的延伸）：此前只断言到「内容最新 / JS 代码落后」，本轮证明**必须逐文件断言**——`catalog.json` 最新、谱面最新、`robots.txt` 一致、`sitemap.xml` 落后一行、`og.png` 完全不存在。**判据：断言对象一旦是「目录」或「一类文件」，就还要往下拆一层。**
- **a11y 基线实测干净，不生成待办**（第四类「查完发现干净」的维度）：87 处 `aria-`（39 `aria-label` / 33 `aria-hidden`）、15 `role=`、12 `:focus-visible`、**12 个 `@media (prefers-reduced-motion: reduce)` 块**（对应 49 `animation` / 19 `@keyframes`，是真覆盖不是装样子）、38 `<button>` vs 48 `onClick`、`index.html` 静态 meta 齐全（description/canonical/og/twitter，**不依赖 JS 注入**）。**唯一缺口**：`Duo.tsx:326` `<div className="duo-start" onClick=…>` 无 `role`、无 `tabIndex` → 键盘用户无法启动 Duo；**因属源码改动需单独提交，本轮只登记不动手**（不伪造为已完成）。
- **数字纠错（老问题）**：① CI run 号 `34469117993` → **`34481257223`**（headSha `5889955…` = HEAD），**连续第十二轮**；② 部署债务 **34 → 35**，触及 `apps/beatscape/**` 仍 6 个；③ docs-only 19 → **20**。改前 `grep -n` 找了速览/正文两处，未分叉。
- 其余断言复核全部仍成立：105 首 / 各季分布 / 315 谱面 / `stream_app_url` 0-105 / `stream_audio` 105-105 / 线上 catalog 105 首 315 谱面 ID 集合与本地一致 / 线上 bundle `index-CDXE9BO-.js`(325,768 B) / `release.json` 与缺失路径同 2146 B / 放行七字段全 null / 零 TODO-FIXME / 零 `@ts-ignore` / 非测试源码零 `any`（3 测试桩 + `Duo.tsx:114` 注释假阳性）/ **16 条文件链接 + 34 个锚点全 OK、MISS 0** / 部署 5 连败无新增 run / `gh workflow list` 仍漏报只返 6 条。
- **网络**：代理 7897 → 200，线上取证与 `gh` 全部成功；push 一次成功（用 `rev-list` 判 0/0 确认，不再信 `$?`）。push 后未 fetch。
- 纪律不变：只 `git add TODO.md`（10 项改动 + 10 项未跟踪，**连续第八轮构成完全一致**、未触碰）；未改 SESSION.md。

## 本次执行（2026-09-11）— 指令仍为「整理项目 TODO」
- 开局 `rev-list` = 0/0、HEAD `4553e36` 即上次刷新 → **连续第二十轮无新落地项**。校验型刷新 + 新维度，commit `003e411`，已 push（`4553e36..003e411`，rev-list 0/0）。
- **本轮新增维度：「运行时错误可观测性与崩溃兜底」盘点**（前二十轮从未问过「线上崩了之后谁能知道」）。按「兜底 → 接管 → 上报 → 可调试性」四层实测：BeatScape **有 1 个 ErrorBoundary 且已上线生效**（线上 bundle 实测 `Signal lost` 1 命中）；**ScapeMusic / Demo / NeonBeat 零兜底**（ScapeMusic 线上 bundle 0 命中 → 渲染异常即白屏）；**零全局错误接管**（`window.onerror`/`unhandledrejection` 全仓 0，唯一命中是 ScapeMusic 给 `<audio>` 挂的元素级监听 = 假阳性）；**零错误上报**（与第十六次「运行时外域只有 Google Fonts」交叉印证）；**零 sourcemap**（3 个 app 均未配、`dist` 与受控 `.map` 均 0、线上 `.map` 均 SPA 回落）。
- **本轮最有价值的判读：四个「零」里只有一个值得登记，判据是「会不会改变我们能否发现用户遇到的问题」。** 零 sourcemap **不能**单独立「该开 sourcemap」待办——它同时意味着不泄露源码，是安全与可调试性的权衡。**零上报 + 零 sourcemap 的合成结论才是真问题：已上线产品对真机错误全盲**，而 P0-4 英语叙事真人试玩完全依赖真机反馈 → **试玩中崩溃无任何取证手段**，已登记为 P0-4 前置确认项（不阻塞试玩本身）。另：ScapeMusic 零兜底**不是中性事实**，依据是本项目自己的判准——`ErrorBoundary.tsx:9` docstring 已把「白屏无兜底」定义为不可接受。
- **可复用手法（下轮必守）：「有没有兜底」必须查线上，不能只查源码。** 源码有 `ErrorBoundary.tsx` 只说明「写了」；完整链路 = `git log -1 -- <文件>` 拿引入 commit → `git merge-base --is-ancestor <commit> ffe1ec0` 判是否在部署内 → 再 `curl` 线上 bundle `grep -c "Signal lost"`。**同一条命令在 BeatScape（1）与 ScapeMusic（0）给出相反结论——这正是必须逐个 app 实测、不能用一个 app 代表全仓的理由。**
- **数字纠错（老问题）**：① CI run 号 `34481257223` → **`34493338937`**（headSha = HEAD `4553e36`），**连续第十三轮**写入即过期；② 部署债务 **35 → 36**，触及 `apps/beatscape/**` 的**仍 6 个名单不变**；③ docs-only 20 → **21**。改前 `grep -n` 找了速览/正文两处，未分叉。
- 其余断言复核全部仍成立：105 首 / 各季分布（s1 6·s2 4·s3 15·s4 15·s5 10·s6 35·p3 10·p4 10）/ 315 谱面 / `stream_app_url` 0-105 / `stream_audio` 105-105 / 线上 catalog 105 首 315 谱面且 **ID 集合与本地完全一致**（only-online 0 / only-local 0）/ p4 谱面 200（19,241 B）/ 线上 bundle `index-CDXE9BO-.js`(325,768 B；`scapemusic.pages.dev` 0 · `No account, no ads` 0 · `App link coming soon` 1) / `release.json` 与缺失路径同 2146 B / **`og.png` 仍 2146 B（仍不存在）** / 放行七字段全 null / 零 TODO-FIXME-XXX-HACK / 零 `@ts-ignore` / 非测试源码零 `any`（3 测试桩 + `Duo.tsx:114` 注释假阳性）/ `socialMetaTags` 仅 `pageMeta.ts:80/113`、`copyImageBlob` 仅 `Results.tsx:72/242`（均零测试命中）/ **16 条文件链接 + 37 个锚点全 OK、MISS 0**（连续第六轮）/ 部署 5 连败无新增 run / `gh workflow list` 仍漏报只返 6 条（连续第十一轮）。
- **网络**：代理 7897 → 200（其余端口 000），线上取证与 `gh` 全部成功；push 一次成功（用 `rev-list` 判 0/0 确认），push 后未 fetch。
- 纪律不变：只 `git add TODO.md`（10 项改动 + 10 项未跟踪，**连续第九轮构成完全一致**、未触碰）；未改 SESSION.md。本轮**未做顺手收尾**（候选均为源码改动，不满足「极小动作」）。

## 本次执行（2026-09-11 第二次）— 指令仍为「整理项目 TODO」
- 开局 `rev-list` = 0/0、HEAD `003e411` 即上次刷新 → **连续第二十一轮无新落地项**。校验型刷新 + 新维度，commit `67e8686`，已 push（`003e411..67e8686`，rev-list 0/0）。
- **本轮新增维度：「曲库资产引用完整性」盘点**（前二十一轮在资产上只做过**一个方向**）。第十四次做的是「磁盘 → 声明」（找未声明却已上线的暴露面 = `trials/` 5 个 m4a）；本轮补上**反方向「声明 → 磁盘」**（找悬空引用）。**两个方向合起来才算盘完，只做一个会漏掉另一类。**
- 结果（本方向**干净、据此不生成待办**，价值是**排除一整类风险、后续不必再查**）：105 首 × 4 类资产（`audio`/`cover`/`stream_audio`/`og`）**各 105/105 存在、缺失 0**；315 谱面**声明集合 = 磁盘集合**（declared-not-on-disk 0、on-disk-not-declared 0）；315 份**全部可解析**；**零音符谱面 0**；合计 **112,511** 音符；**三档难度逐档单调递增无倒挂**（easy 110/214/261、standard 181/359/457、hard 245/558/651）。音频无异常小文件（最小 `audio.m4a` 1,467,496 B）；`audio` 共 355.3 MiB、`stream` 共 677.3 MiB。
- **本轮最有价值的一条（新判读规则）**：**发现「覆盖率不足」时，先查这份覆盖率是不是某个已结项任务的范围。** `preview_48s.m4a` 只有 **25/105**（s1 6 / s2 4 / s3 15 全有，s4/s5/s6/p3/p4 **全无**），单看像「80 首忘了登记」。但 `grep -rn "preview_48s" docs/*.md` 一查：`docs/BEATSCAPE-OPTIMIZATION-AUDIT.md:32/151/339` 早就把它记为审计 **P1-2 项、且已 ✅ 结项**（「登记 15 个孤儿进 catalog.json（10→25）」），实测 25 个文件 **27.78 MiB** 与文档记载 **27.8 MB** 吻合 → **剩下 80 首是「从未生成」而非「生成了没登记」**；且 `docs/BEATSCAPE-STAGE1-DUAL-ASSET.md:84` 把 `preview` 明列为**可选**字段。**若跳过溯源直接写待办，就会把一个已完成项重新打开。**（第十次印证「零 ≠ 该补」。）
- **唯一登记的残留（候选、非缺陷、不认领）**：`preview` 是可选（`types/catalog.ts:26`），两处调用均为 `track.preview ?? track.audio`（`Home.tsx:29`/`Track.tsx:83`）→ **80 首无 preview 的曲目，Track 页标签为「Preview」的按钮实际播放全长 `audio.m4a`（中位 3.80 MB）而非 48s 预览（1.11 MB）**；但 `AudioBar` 是 `preload="none"`，**不影响首屏带宽**，差异只在用户点播时 → 属产品/带宽权衡，非 bug。
- **数字纠错（老问题）**：① CI run 号 `34493338937` → **`34559257629`**（09-11T03:39:22Z，headSha `003e411` = HEAD），**连续第十四轮**写入即过期；② 部署债务 **36 → 37**，触及 `apps/beatscape/**` 的**仍 6 个名单不变**；③ docs-only 21 → **22**。改前用 `grep -n` 找了速览/正文/工作流表三处，未分叉。
- 其余断言复核全部仍成立：105 首 / 各季分布 / 315 谱面 / `stream_app_url` 0-105 / `stream_audio` 105-105 / 线上 catalog 105 首 315 谱面 `stream_app_url` 0 `preview` 25 且 ID 集合与本地一致 / p4 谱面 200（19,241 B）/ 线上 bundle `index-CDXE9BO-.js`(325,768 B；`scapemusic.pages.dev` 0 · `No account, no ads` 0 · `App link coming soon` 1 · `Signal lost` 1) / `release.json` 与缺失路径同 2146 B / `og.png` 仍 2146 B / `robots.txt` 133 B / `sitemap.xml` 911 B / 放行七字段全 null / 零 TODO-FIXME-XXX-HACK / 零 `@ts-ignore` / 非测试源码零 `any`（3 测试桩 + `Duo.tsx:114` 注释假阳性）/ `socialMetaTags` 仅 `pageMeta.ts:80/113`、`copyImageBlob` 仅 `Results.tsx:72/242`（均零测试命中）/ **16 条文件链接 + 37 个锚点全 OK、MISS 0**（连续第七轮）/ 部署 5 连败无新增 run / `gh workflow list` 仍漏报只返 6 条（连续第十二轮）。
- **网络**：代理 7897 → 200（其余 000）。**中途一次假性失败**：带 `-m 25` 的批量 curl 全返 `000`（exit 5 = 无法解析代理），重试即恢复 → **遇到全 000 先单次重试再判定**，不要立刻记为「线上不可达」。线上取证与 `gh` 全部成功；push 一次成功（`rev-list` 判 0/0），push 后未 fetch。
- **新脚本坑**：锚点自检脚本原先不处理「纯 `#anchor`」（f 为空）的链接，会把 35 条**本文件内锚点**全判 MISS。修法：`f` 为空时改用 `TODO.md` 自身的标题集比对。
- 纪律不变：只 `git add TODO.md`（10 项改动 + **11** 项未跟踪，较上一轮多 1 项 memory 日志、非功能改动，未触碰）；未改 SESSION.md。本轮**未做顺手收尾**（补生成 preview 属产品决策，非极小动作）。
