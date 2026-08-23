# Local AI Music Platform

**音乐 SaaS** — 本地推理、多租户 Web 服务，覆盖人声音乐创作与游戏配乐生产。

底层引擎 **ACE-Step 1.5**（MIT）+ **tadpole-studio** 工作流；推理节点为 MacBook Pro M5 Pro（48GB，MLX）。

## 产品形态

这不是单机音乐工具，而是完整的 **Music SaaS**：

- Web 应用（注册、作品库、播放、下载）
- 任务队列与积分体系
- REST API（对内/对外）
- 本地 Mac 推理节点（非 Modal 云 GPU）

## 业务线

| 业务 | 能力 |
|------|------|
| 人声音乐 | 描述/歌词 → 完整歌曲 + 封面 |
| 游戏配乐 | 器乐 BGM、分轨、片段修改、风格统一（LoRA） |

## 文档

- [PRD.md](./PRD.md) — 产品需求文档（立项 v0.1）

## 状态

🟡 **立项阶段** — PRD 已定稿，待 M1 推理验证

## 硬件（推理节点）

| 项目 | 配置 |
|------|------|
| 机型 | MacBook Pro (Mac17,8) |
| 芯片 | Apple M5 Pro, 18 核 |
| 内存 | 48 GB |
| 局域网 | 192.168.0.199 |

## 技术栈（规划）

Next.js · BetterAuth · Inngest · PostgreSQL · R2/S3 · ACE-Step 1.5 · tadpole-studio

## 许可

- 本仓库脚手架：MIT（待定）
- 音乐模型：ACE-Step 1.5 — MIT
