# Local AI Music Platform

**MVP：音乐生成 API + 配套 Demo**

| 组件 | 说明 |
|------|------|
| **API** | REST Job 异步接口，双引擎路由 |
| **Demo** | 单页 Web 试用 + curl/Python 示例 |

| 业务 | 引擎 | MVP `mode` |
|------|------|------------|
| 人声 | ACE-Step 1.5 | `vocal_lyrics`, `vocal_desc` |
| 游戏 BGM | Stable Audio 3 | `game_bgm` |
| 游戏主题曲 | ACE-Step 1.5 | `game_theme_vocal` |

推理节点：MacBook Pro M5 Pro 48GB · `192.168.0.199`

## 文档

| 文档 | 说明 |
|------|------|
| [PRD.md](./PRD.md) | 产品需求 **v1.2** |
| [docs/DEMO.md](./docs/DEMO.md) | 配套 Demo 规格 |
| [docs/README.md](./docs/README.md) | 文档索引 |

## 状态

🟢 **立项文档齐全** — 可进入 M1 推理验证 / M2 代码脚手架（见 [docs/MODULES.md](./docs/MODULES.md)）

## 仓库

https://github.com/huagechen-lab/local-ai-music-platform
