# 文档索引（Vibe Coding）

**MVP 范围：音乐生成 API + 配套 Demo**（见 [PRD.md](../PRD.md) v1.2）

Cursor 开发前请按顺序阅读：`PRD.md` → [DEMO.md](./DEMO.md) → 本目录 **P0 文档**。

## P0 — MVP 必建（开发前完成）

| 文档 | 状态 | 说明 |
|------|------|------|
| [PRD.md](../PRD.md) | ✅ v1.2 | 产品总纲、双引擎、MVP = API + Demo |
| [DEMO.md](./DEMO.md) | ✅ v1.0 | **配套 Demo** 功能、UI 极简规范、验收 |
| [RULES.md](./RULES.md) | ⬜ 待写 | 不做清单、异常、状态机、限流、错误码 |
| [DATA_API.md](./DATA_API.md) | ⬜ 待写 | 全接口字典 + Job 表 + `mode` 枚举 |
| [TECH_SPEC.md](./TECH_SPEC.md) | ⬜ 待写 | `apps/gateway` + `apps/demo` + `examples/` |
| [INFERENCE.md](./INFERENCE.md) | ⬜ 待写 | Mac 双 Worker、MLX |
| [ACCEPTANCE.md](./ACCEPTANCE.md) | ⬜ 待写 | API + **Demo D-01~D-06** 用例 |
| [OPS.md](./OPS.md) | ⬜ 待写 | 部署、一键 dev、日志 |
| [COMPLIANCE.md](./COMPLIANCE.md) | ⬜ 待写 | 商用许可 checklist |

## P1 — 建议

| 文档 | 说明 |
|------|------|
| [MODULES.md](./MODULES.md) | 开发顺序：Gateway → Demo → Workers |

## 暂缓（SaaS v1.0）

| 文档 | 说明 |
|------|------|
| UI_SPEC.md | 完整 SaaS 控制台视觉；Demo 用 DEMO.md §4 |

## 双引擎速查

| 业务 | mode（MVP） | 引擎 |
|------|-------------|------|
| 人声 | `vocal_lyrics`, `vocal_desc` | ACE-Step 1.5 |
| 游戏 BGM | `game_bgm` | Stable Audio 3 |
| 游戏主题曲 | `game_theme_vocal` | ACE-Step 1.5 |

## MVP 代码目录（规划）

```text
apps/
  gateway/     # REST API
  demo/        # 配套 Web Demo
examples/
  curl/
  python/
```
