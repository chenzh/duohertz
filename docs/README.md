# 文档索引（Vibe Coding）

**MVP 范围：音乐生成 API 服务**（见 [PRD.md](../PRD.md) v1.1）

Cursor 开发前请按顺序阅读：`PRD.md` → 本目录下 **P0 文档**。

## P0 — MVP API 必建（开发前完成）

| 文档 | 状态 | 说明 |
|------|------|------|
| [PRD.md](../PRD.md) | ✅ v1.1 | 产品总纲、双引擎、MVP 边界 |
| [RULES.md](./RULES.md) | ⬜ 待写 | 不做清单、异常、状态机、限流、错误码行为 |
| [DATA_API.md](./DATA_API.md) | ⬜ 待写 | **核心**：全接口字典 + Job 表结构 + `mode` 枚举 |
| [TECH_SPEC.md](./TECH_SPEC.md) | ⬜ 待写 | 技术栈、目录、Gateway/Worker 分层 |
| [INFERENCE.md](./INFERENCE.md) | ⬜ 待写 | Mac 双 Worker、ACE + SA3 MLX、端口与健康检查 |
| [ACCEPTANCE.md](./ACCEPTANCE.md) | ⬜ 待写 | API 验收用例（curl / 自动化测试清单） |
| [OPS.md](./OPS.md) | ⬜ 待写 | 部署、日志、监控、回滚 |
| [COMPLIANCE.md](./COMPLIANCE.md) | ⬜ 待写 | MIT / SA3 Community 商用 checklist |

## P1 — MVP 可极简或延后

| 文档 | MVP 是否需要 | 说明 |
|------|--------------|------|
| [UI_SPEC.md](./UI_SPEC.md) | ❌ 暂缓 | 无 Web UI；SaaS v1.0 再写 |
| [MODULES.md](./MODULES.md) | ⬜ 建议 | API 模块拆分与开发顺序 |

## Post-MVP（SaaS v1.0）

- Web 控制台 UI_SPEC
- 用户表、积分、Polar 计费规则（扩展 RULES / DATA_API）
- 社区 Feed、作品库永久存储策略

## 双引擎速查

| 业务 | mode（MVP） | 引擎 |
|------|-------------|------|
| 人声 | `vocal_lyrics`, `vocal_desc` | ACE-Step 1.5 |
| 游戏 BGM | `game_bgm` | Stable Audio 3 |
| 游戏主题曲 | `game_theme_vocal` | ACE-Step 1.5 |
