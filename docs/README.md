# 文档索引（Vibe Coding）

**MVP：** 音乐生成 **API + 配套 Demo** · [PRD.md](../PRD.md) v1.2

Cursor 开发前阅读顺序：

1. [PRD.md](../PRD.md)
2. [DEMO.md](./DEMO.md)
3. [RULES.md](./RULES.md)
4. [DATA_API.md](./DATA_API.md)
5. [TECH_SPEC.md](./TECH_SPEC.md)
6. [MODULES.md](./MODULES.md) → 按模块开发

---

## P0 文档状态

| 文档 | 状态 | 说明 |
|------|------|------|
| [PRD.md](../PRD.md) | ✅ v1.2 | 产品总纲 |
| Demo Web v2 | ✅ | 商用级演示（见 [reports/demo-commercial-plan.md](./reports/demo-commercial-plan.md)） |
| [RULES.md](./RULES.md) | ✅ v1.0 | 规则与边界 |
| [DATA_API.md](./DATA_API.md) | ✅ v1.0 | 接口与数据库 |
| [TECH_SPEC.md](./TECH_SPEC.md) | ✅ v1.0 | 技术栈与目录 |
| [INFERENCE.md](./INFERENCE.md) | ✅ v1.0 | Mac 双 Worker |
| [ACCEPTANCE.md](./ACCEPTANCE.md) | ✅ v1.0 | 验收用例 |
| [OPS.md](./OPS.md) | ✅ v1.0 | 部署运维 |
| [COMPLIANCE.md](./COMPLIANCE.md) | ✅ v1.0 | 商用许可 |
| [MODULES.md](./MODULES.md) | ✅ v1.0 | 开发顺序 |

## 规划 / 报告

| 文档 | 说明 |
|------|------|
| [reports/demo-commercial-plan.md](./reports/demo-commercial-plan.md) | Demo 商用级演示升级计划 |
| [reports/mlx-acceleration-plan.md](./reports/mlx-acceleration-plan.md) | MLX 推理加速（已完成） |
| [reports/M1-benchmark.md](./reports/M1-benchmark.md) | 推理基准实测 |

## 暂缓

| 文档 | 说明 |
|------|------|
| UI_SPEC.md | SaaS v1.0；Demo 见 DEMO.md §4 |

## 代码目录（规划）

```text
apps/gateway/   apps/demo/
workers/ace-step/   workers/sa3/
examples/curl/   examples/python/
```

## 双引擎速查

| 业务 | mode | 引擎 |
|------|------|------|
| 人声 | `vocal_lyrics`, `vocal_desc` | ACE-Step 1.5 |
| 游戏 BGM | `game_bgm` | Stable Audio 3 |
| 游戏主题曲 | `game_theme_vocal` | ACE-Step 1.5 |
