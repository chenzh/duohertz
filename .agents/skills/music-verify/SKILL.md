---
name: music-verify
description: 为 MusicSaas 变更选择并执行相关测试、构建和验收；用于验证实现、修复 CI 或检查 BeatScape 发布候选包。
---

# MusicSaas 验证

从仓库根运行。先看本任务 diff、受影响模块和任务 AC，按下表选检查；跨模块变更合并相关行。以当前 `package.json` 和脚本实现为准，命令失效先核对，不猜工具。

| 变更 | 起点；根据影响补充 |
|------|--------------------|
| 文档 / AGENTS / skills | `git diff --check`、核对相对链接与引用命令；新 skill 检查 YAML `name` / `description` 与触发边界。无需启动应用栈 |
| BeatScape 代码 | `pnpm --filter @musicsaas/beatscape test` + `pnpm build:beatscape`（含类型检查）；交互变化做对应浏览器验证 |
| ScapeMusic 代码 | `pnpm --filter @musicsaas/scapemusic test` + `pnpm --filter @musicsaas/scapemusic build` |
| NeonBeat 代码 | `pnpm --filter @musicsaas/neonbeat test` + `pnpm --filter @musicsaas/neonbeat build` |
| Gateway / Worker unit | `pnpm test`（Gateway Vitest + `tests/unit` pytest）；脚本会创建测试 venv、同步测试数据库 |
| Gateway 接口 / Job / shared | 上一行 + `pnpm test:integration`（mock Worker）与相关包 build；API 契约变化核对 `api-contract-gate.yml` |
| Demo UI / BFF | `pnpm --filter demo build`；用户流程/BFF 变化加 `pnpm test:e2e`，后者启动 mock Gateway |
| 曲库 / 谱面 | `pnpm catalog:beatscape` + `pnpm audit:beatscape`；音频变化加 `pnpm earcheck:beatscape`；生成逻辑变化跑相关脚本回归 |
| CI / 交付脚本 | YAML 解析，修改的 shell 用 `bash -n`；运行相关脚本回归。核对 job 名、事件、权限、checkout ref 与 required checks，勿用真实合并/部署验证 |
| BeatScape 发布候选 | `pnpm release:beatscape`（单测、发布器回归、CF 构建、Playwright E2E、资产校验）；需先安装对应 Chromium |

`pnpm test` 不测三个音乐前端；`bash scripts/harness.sh all` 只串联 unit、workspace build、mock integration。不得把任一命令写成“全仓全部测试通过”。真实 MLX 验收使用 `pnpm test:mlx`，仅在任务涉及实际推理且环境可用时运行；脚本 skip 不等于验收通过。

任务显式指定的 AC 和受保护 CI 检查仍需通过。选定检查完成后不机械重复全量测试；新增测试应覆盖可观察行为、缺陷或边界，不为纯文字/格式变更添加镜像断言。

记录命令、结果和未覆盖项。环境阻塞先定位原因并执行仍可运行的检查；不得把缺依赖、skip 或人工项目写成 PASS。发布候选验证不会发布；正式发布另需实际人工记录通过 `pnpm --filter @musicsaas/beatscape launch:check`，详见 [上线准备](../../../docs/BEATSCAPE-RELEASE-READINESS.md)。
