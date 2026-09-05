# MusicSaas 门户上线准备

更新：2026-09-05。这里的门户是 `apps/demo` 的独立静态构建，发布目录为 `apps/demo/dist-portal/`，站点部署在域名根路径。原有需要 Gateway 的 Demo 继续使用原构建命令；门户首版不启动后端或推理服务。

## 首发范围

- 中文 / English 产品介绍、BeatScape 与 Scape Music 入口、页面内 API 速查和模型许可来源。
- 产品链接固定为 [BeatScape](https://beatscape.pages.dev) 与 [Scape Music](https://scapemusic.pages.dev)。门户上线不会替这两个产品完成各自的内容审核或发布验收。
- 音频只包含现有 `samples/bgm-demo.wav`、`samples/vocal-demo.wav` 两段各 5 秒的技术样例，真实标明用途与限制。它们不是正式作品或完整人声生成效果；本次不会生成新曲，也不发布旧 `showcase/` 中未审核的音乐。
- 门户不收 API Key，不提交生成任务，不创建账号、不收款。可选 `PORTAL_DEMO_URL` 只显示指向独立受控服务的外链；没有配置时不显示试用入口。
- 静态 HTML 提供 canonical、Open Graph / Twitter 卡片、1200 × 630 PNG；发布器提供双语 404、安全头、robots 和 sitemap。

## 待确定的发布输入

| 输入 / 人工项 | 当前状态 | 需要记录的依据 |
|---|---|---|
| `PORTAL_SITE_URL` | **待确定**；`https://portal-preview.invalid` 仅供本地 / CI 预览 | 实际公开 HTTPS origin，以及该域名映射到目标 Pages 项目的确认 |
| `CF_PAGES_PROJECT` | **待确定**；脚本无项目默认值 | 已存在的 Cloudflare Pages 项目、账号及其 production branch |
| `PORTAL_DEMO_URL` | 可选，默认不开放生成入口 | 如启用，独立服务的鉴权、配额、隐私和可用性验收，以及最终公开 HTTPS URL |
| 两段样例的听感与对外文案 | 未代替用户作听感或品牌判断 | 当前只作为技术测试片段标注；若改为正式作品展示，需要相应内容验收 |
| 正式发布操作 | **未执行** | 用户对应授权、所审候选 SHA-256、部署 ID、域名验收结果 |

这是上线准备任务，技术验收与发布决定分开记录。当前技术候选已完成，正式域名配置尚待提供；预览域不代表存在可访问的公网门户。

## 构建与技术验证

要求 Node.js >= 22、仓库锁定的 pnpm 9.15.0。先安装依赖与 Chromium：

```bash
pnpm install --frozen-lockfile --filter demo
pnpm --filter demo exec playwright install --with-deps chromium
```

本地 / CI 使用保留域生成不可索引的预览候选：

```bash
PORTAL_SITE_URL=https://portal-preview.invalid pnpm --filter demo release:check
```

`PORTAL_SITE_URL` 和 `PORTAL_DEMO_URL` 只从显式进程环境读取；Vite 与发布器共享校验，不从隐式 `.env.portal` 带入未审阅的演示入口。本机可用已安装 Chrome：`PORTAL_SITE_URL=https://portal-preview.invalid PLAYWRIGHT_CHANNEL=chrome pnpm release:portal`。浏览器下载遇到代理证书问题时配置可信 CA，不关闭 TLS。

已构建候选的本地预览：`pnpm preview:portal`，打开 `http://127.0.0.1:4180/`。预览服务会应用发布包安全头、缓存策略与真实 404。它只监听本机；无需启动 Gateway。

等价的脚本入口是 `PORTAL_SITE_URL=https://portal-preview.invalid bash scripts/deploy-portal-cf-pages.sh --check`。它只验证，不读取部署凭据或上传文件。

`release:check` 运行门户类型检查和构建、发布器回归、浏览器验收及产物复核。发布器检查：

- 所有实际文件与 `portal-release.json` 的文件集合、逐文件 SHA-256 和整体 `artifactSha256` 一致。
- 两段样例的固定原始指纹、RIFF/WAVE 完整性、PCM 16 bit / 单声道 / 44.1 kHz / 恰好 5 秒元数据一致。
- 页面、样式、脚本中可静态识别的本地资源引用存在；两产品和两样例入口存在；canonical、og:url 和站点环境一致。
- 输出不含 `.env`、符号链接、source map、Gateway 服务端文件、旧 showcase 音乐或其他非允许文件；拒绝本机地址、占位域和 API 凭据标记。
- CSP 禁止连接后端、提交表单和嵌入外部页面；JS/CSS 本地加载，哈希资源使用不可变缓存，HTML / 固定样例 URL 需重新验证缓存。

静态扫描不能证明所有动态行为，浏览器验收需要一起检查实际请求、音频播放和桌面 / 移动宽度交互。Chromium 模拟不是 Safari / iPhone 真机证明。

### 当前验证证据

2026-09-05 实际执行并复核：

| 检查 | 结果与覆盖 |
|---|---|
| `PORTAL_SITE_URL=https://portal-preview.invalid PLAYWRIGHT_CHANNEL=chrome npm run release:check`（`apps/demo`） | **通过**：8 前端/配置行为测试、12 发布器回归、类型检查与静态构建、22 浏览器 E2E、清单复核 |
| 桌面与 Pixel 7 模拟浏览器 | 22/22；中文/英文、导航、零后端请求、播放/互斥/下载、媒体失败恢复、存储禁用、真实 404/缓存头/Range；Demo 离线禁生成、试听重试、真实 WAV 波形、终态停轮询、任务切换竞态和超时刷新 |
| Gateway | 构建通过，44/44 单测；伪造豁免头仍限流、默认生产关闭 BFF、主/Demo 身份与任务隔离 |
| Mock 集成与 Demo HTTP 验收 | 17/17 与 14/14，通过模拟 Worker 完成创建/轮询/下载；没有启动真实推理 |
| 当前共享工作区 `pnpm test` | Gateway 44/44；Python **32 通过 / 38 失败**。失败均在并行修改的 `test_agent_delivery.py` / `test_agent_dispatch.py`，不宣称当前全仓 CI 全绿 |
| HEAD 基线 + 本任务 HTTP 客户端修改 | 独立临时快照 Python **70/70**；两项覆盖文件与当前源码逐字节一致，定位上述失败来自并行公司脚本变更。完整原始日志归档到 `data/portal-release/python-unit-head.log` |
| 发布脚本 / 工作流 | `bash -n`、Node 语法、Ruby YAML 解析与 `git diff --check` 通过；上传 stdin 关闭，错误项目名不会进入交互创建流程 |
| 外链 | 匿名 HTTP 核实两个产品站和两个模型许可入口均 200；原 GitHub 项目 API 文档返回 404，因此改为站内 API 速查 |

最终候选 `artifactSha256`：`53f83162ad6e1c2388cabc039231f6b55a7ca9b64378439d05be6435ededc88c`。目录 `apps/demo/dist-portal/` 约 **1.1 MiB**，13 个哈希覆盖文件 + 1 份清单。站点 `https://portal-preview.invalid`，`demoUrl: null`，预览不索引。源码未提交，清单标记 `sourceDirty: true`。

四张实际截图位于 `data/portal-release/screenshots/{desktop,mobile}-{zh,en}.png`；已目视检查桌面中文、手机英文和分享 PNG。候选身份与截图指纹记录在 `data/portal-release/verification.json`。这不是 Safari / 真机或人工耳检记录。

Pages 同名响应头会合并，所以全局规则只设置安全头，各路径分别设置缓存，避免同时出现两个 `max-age`。本地预览和发布器回归按同样语义验证，依据 [Cloudflare Headers 文档](https://developers.cloudflare.com/pages/configuration/headers/)。

尚未完成：实际域名/Pages 项目绑定、按该域名重建后的验收和公网部署。当前共享区公司脚本的 38 项失败需要对应工作线修复后再核实整体 CI；本任务未恢复或修改这些并行改动。

## 正式发布步骤

先确认实际目标并取得对应发布授权。以下环境变量必须从已确认输入设置；这里不提供伪造域名或默认项目。

1. 在同一终端设置公开站点 origin，以及可选受控 Demo 地址。正式构建会将站点写入页面和 sitemap：

   ```bash
   export PORTAL_SITE_URL
   export PORTAL_DEMO_URL
   unset PORTAL_ARTIFACT_SHA256
   pnpm --filter demo release:check
   ```

2. 审阅浏览器证据与候选，读取其完整身份，并保存整个 `apps/demo/dist-portal/` 目录作为不可修改的回退包：

   ```bash
   node -e 'const fs = require("node:fs"); const r = JSON.parse(fs.readFileSync("apps/demo/dist-portal/portal-release.json", "utf8")); console.log(r.artifactSha256)'
   ```

3. 将审阅通过的完整哈希设置为 `PORTAL_ARTIFACT_SHA256`，设置已有项目与凭据，随后才运行部署命令：

   ```bash
   export CF_PAGES_PROJECT
   export CF_PAGES_BRANCH
   export PORTAL_ARTIFACT_SHA256
   export CLOUDFLARE_API_TOKEN
   export CLOUDFLARE_ACCOUNT_ID
   bash scripts/deploy-portal-cf-pages.sh deploy
   ```

   脚本默认分支为 `main`，需要与既有项目 production branch 一致。脚本拒绝本机 / 保留域、空目标、无审阅哈希、被篡改产物和关闭 TLS 校验；不重新构建、不创建项目、不设置 DNS、不查找或生成凭据。`PORTAL_DEMO_URL` 必须与构建时一致。自定义 CA 使用 `NODE_EXTRA_CA_CERTS`。

4. 在真实域名打开首页、中英切换、两段音频与两个产品外链；确认 `/does-not-exist` 是 404，检查安全响应头、robots/sitemap、PNG 卡片，并读取线上 `portal-release.json` 比对 `artifactSha256`。记录 Pages 部署 ID 与验收人 / 时间。

`.github/workflows/portal-check.yml` 只运行检查、保留候选及浏览器证据；没有自动发布步骤，没有部署 secrets 或写入权限。

## 回滚

优先在 Cloudflare Pages 控制台选中已记录的上一个成功生产部署，执行该部署的回滚操作，再验证域名与候选身份。不要把重新构建历史代码当成同一回退产物。

如果采用归档产物重新上传：将已审核的整个历史目录恢复到 `apps/demo/dist-portal/`，恢复其 `siteUrl`、`demoUrl` 与完整 `artifactSha256` 到对应环境变量，保持同一个已确认项目，再运行 `bash scripts/deploy-portal-cf-pages.sh deploy`。发布器与当前安全 / 样例规则不一致时会阻止上传；先评估差异，不跳过校验。完成后再次读取线上 `portal-release.json` 并检查核心入口。
