# PRD：Local AI Music SaaS

**本地推理 · 双引擎 · 音乐 SaaS 平台**

| 字段 | 内容 |
|------|------|
| 项目名称 | Local AI Music Platform（品牌名待定） |
| 文档版本 | **v1.0** |
| 状态 | 立项定稿 |
| 更新日期 | 2026-08-23 |
| 仓库 | https://github.com/huagechen-lab/local-ai-music-platform |
| 产品类型 | B2B / B2C **音乐 SaaS**（Web 多租户 + 本地 GPU 推理） |

### 修订记录

| 版本 | 日期 | 说明 |
|------|------|------|
| v0.1 | 2026-08-23 | 初版立项 |
| v0.2 | 2026-08-23 | 补充许可矩阵、Stable Audio 3 |
| **v1.0** | 2026-08-23 | 完善双引擎分工、API/数据模型、版本规划，去重合并 |

---

## 0. 执行摘要

本项目是一个 **音乐 SaaS 平台**：对外提供 Web 应用、账号体系、任务队列、积分与 API；对内以自有 **MacBook Pro M5 Pro（48GB）** 为推理节点，在局域网/可控环境完成 AI 音乐生成，避免长期依赖 Modal 等云 GPU 与闭源 Suno 类服务的商用限制。

**两条业务线：**

1. **人声音乐** — 描述/歌词 → 带人声完整歌曲（Creator SaaS）
2. **游戏配乐** — BGM、氛围、音效 SFX、片段修改与工程交付（Game Audio SaaS）

**核心架构决策（立项共识，不可混用）：**

| 业务 | 主引擎 | 备选 |
|------|--------|------|
| **人声音乐** | **ACE-Step 1.5**（MIT） | YuE（Apache 2.0） |
| **游戏 BGM** | **Stable Audio 3** Small / Medium | — |
| **游戏 SFX** | **Stable Audio 3 Small SFX** | — |

> 不存在「一个模型搞定全部且零版权风险」。许可以各模型官方 LICENSE 为准；用户协议中声明 AI 生成与原创性责任。

---

## 1. 背景与机会

### 1.1 市场现状

Suno、Udio、MELO、海绵等验证了 AI 音乐需求，但存在：

| 问题 | 闭源/云平台 | 本项目方向 |
|------|-------------|------------|
| 商用条款 | 免费试听 ≠ 可商业交付 | 仅采用许可清晰的**开源权重** |
| 数据主权 | 音频在第三方云 | 推理在自有 Mac，存储可自控 |
| 游戏生产流 | 缺分轨、SFX、inpainting | SA3 + ACE-Step 编辑能力 |
| 成本 | 订阅 + 按量，规模越大越贵 | 本地推理，边际成本主要为电费与运维 |

### 1.2 为何是 SaaS 而非单机工具

| 维度 | 单机工具（tadpole-studio 等） | 本音乐 SaaS |
|------|------------------------------|-------------|
| 用户 | 单人 | 多租户、可扩展团队 |
| 接入 | 本机 UI | Web + REST API |
| 计费 | 无 | 积分 / 订阅（v0.3） |
| 资产 | 本地文件 | 对象存储 + 权限隔离 + 审计 |
| 运维 | 无 | 队列、监控、节点健康 |

### 1.3 推理节点（已验证）

| 项目 | 配置 |
|------|------|
| 机型 | MacBook Pro（Mac17,8） |
| 芯片 | Apple **M5 Pro**，18 核（6 Super + 12 Performance） |
| 内存 | **48 GB** |
| 系统 | macOS 26.6.2 |
| 局域网 IP | 192.168.0.199 |
| 远程管理 | SSH 免密已配置（`zhenhuachen@192.168.0.199`） |

---

## 2. 产品定位

**一句话：** 面向创作者与游戏团队的 AI 音乐 SaaS — 本地双引擎推理、许可可商用、同时覆盖人声歌曲与游戏音频生产。

**价值主张：**

- **对人声客户：** 「像 Suno，但产出可商用、数据在己方」
- **对游戏客户：** 「BGM + SFX 一站式，支持改片段与风格统一，非纯玩具生成器」
- **对运营方：** 「算力自持，不绑云 GPU 账单」

**非目标：** 不做闭源 API 套壳；首版不做 DAW 级实时协作编辑器；不做移动端原生 App。

---

## 3. 双引擎分工（立项铁律）

本节为全文档**最高优先级**技术产品决策。

### 3.1 人声音乐 → ACE-Step 1.5

| 项 | 说明 |
|----|------|
| **用途** | 带歌词完整歌曲、宣传曲、有人声短视频配乐 |
| **模型** | [ACE-Step 1.5](https://github.com/ace-step/ACE-Step-1.5) |
| **许可** | **MIT**（v1 仓库为 Apache 2.0，本 SaaS 以 1.5 为准） |
| **运行时** | MLX（Apple Silicon） |
| **能力** | 歌词结构、多语言人声、Repaint、Cover、分轨 Extract、LoRA |
| **备选** | YuE — 人声质量补强，Apache 2.0，M1 后按需接入 |

**禁止作为主引擎：**

- Stable Audio 3（不擅长完整人声歌）
- SongGeneration（许可禁止商业）
- MusicGen（权重 NC，禁止商用）
- MELO / 海绵 / X Studio（闭源云产品，非自托管引擎）

### 3.2 游戏配乐 → Stable Audio 3

| 子场景 | 模型变体 | 说明 |
|--------|----------|------|
| **BGM / 氛围 / 循环** | SA3 **Small** 或 **Medium** | 探索、战斗、菜单、过场 |
| **音效 SFX** | SA3 **Small SFX** | 爆炸、UI、脚步、环境音等 |
| **改片段 / 续写** | SA3 **inpainting** | 循环点衔接、局部替换 |
| **风格统一** | SA3 **MLX LoRA** | 同一游戏世界观音色一致 |

| 项 | 说明 |
|----|------|
| **仓库** | [Stability-AI/stable-audio-3](https://github.com/Stability-AI/stable-audio-3) |
| **许可** | Stability AI **Community License** |
| **商用** | 组织年收入 **＜100 万美元** 可免费商用；产出归用户；须在 [community-license](https://stability.ai/community-license) **登记**；超 100 万需 **Enterprise** |
| **运行时** | `optimized/mlx`（Apple Silicon 官方） |

**ACE-Step 在游戏线的角色（辅助）：** 仅当需要 **带人声主题曲 / 宣传歌** 时使用，不作为 BGM/SFX 主路径。

**禁止作为主引擎：**

- RWKV-4-Music（MIDI 向，非成品音频交付级）
- ACE-Step 纯器乐模式（易人声泄漏，不如 SA3 专精器乐）

### 3.3 任务路由表（SaaS 实现依据）

```text
generation_mode          → engine              → model_variant
─────────────────────────────────────────────────────────────
vocal_song               → ace-step-1.5        → turbo / xl
vocal_song_premium       → yue                 → (v0.2+)
game_bgm                 → stable-audio-3      → small | medium
game_sfx                 → stable-audio-3      → small-sfx
game_bgm_inpaint         → stable-audio-3      → small | medium + inpainting
game_theme_vocal         → ace-step-1.5        → turbo / xl
instrumental_only_legacy → ace-step-1.5        → 仅兼容，默认引导至 SA3
```

### 3.4 路由决策流程（用户侧）

```text
用户创建任务
    │
    ├─ 选择「人声歌曲」 ──────────→ ACE-Step 1.5
    │
    ├─ 选择「游戏 BGM」 ──────────→ Stable Audio 3 (Small/Medium)
    │
    ├─ 选择「游戏音效」 ──────────→ Stable Audio 3 (Small SFX)
    │
    └─ 选择「游戏主题曲(有人声)」 ─→ ACE-Step 1.5
```

---

## 4. 目标用户与场景

### 4.1 人声音乐（Creator SaaS）

| 用户 | 场景 | 典型输入 |
|------|------|----------|
| 独立音乐人 |  demo、完整单曲 | 风格 + 歌词 |
| 短视频 / MCN | 15s–3min 配乐 | 情绪描述 + 自动写词 |
| 广告小团队 | 低成本原创曲 | 品牌调性描述 |

### 4.2 游戏配乐（Game Audio SaaS）

| 用户 | 场景 | 典型输入 |
|------|------|----------|
| 独立工作室 | 探索/战斗/菜单 BGM | 氛围 + 无人声 + 可循环 |
| 音效师 | SFX 素材包 | 音效类型 + 时长 |
| 制作人 | 版本迭代 | 对 30s 片段 inpainting |
| 音频外包 | 多项目交付 | 项目空间 + LoRA 风格包 |

### 4.3 企业内网（Phase 2）

局域网部署，团队共享 Mac 推理节点，数据不出内网。

---

## 5. 产品功能

### 5.1 功能地图

| 模块 | v0.1 MVP | v0.2 | v0.3 |
|------|----------|------|------|
| 注册 / 登录 | ✅ | | |
| 人声歌曲生成 | ✅ ACE-Step | YuE 备选 | |
| 游戏 BGM 生成 | ✅ SA3 | 模板库 | |
| 游戏 SFX 生成 | | ✅ Small SFX | 素材库分类 |
| 封面图 | ✅ | | |
| 作品库 / 播放 / 下载 | ✅ | | |
| 任务队列与状态 | ✅ | | |
| 积分扣费 | ✅ | 按模式差异化 | Polar 购买 |
| 分轨导出 | | ✅ | |
| SA3 inpainting | | ✅ | |
| LoRA 风格包 | | ✅ | 团队级 |
| 社区 Feed | | | ✅ |
| API Key | | | ✅ |
| 团队空间 | | | ✅ |

### 5.2 生成模式（面向用户的产品形态）

#### A. 人声歌曲（引擎：ACE-Step 1.5）

| 模式 ID | 名称 | 输入 | 输出 |
|---------|------|------|------|
| `vocal_desc` | 描述成歌 | 文本描述 | 歌词 + 整曲 + 封面 |
| `vocal_lyrics` | 歌词成歌 | 歌词 + 风格标签 | 整曲 + 封面 |
| `vocal_desc_lyrics` | 描述 + 自动写词 | 描述 | AI 歌词 + 整曲 + 封面 |

#### B. 游戏 BGM（引擎：Stable Audio 3）

| 模式 ID | 名称 | 输入 | 输出 |
|---------|------|------|------|
| `game_bgm` | 氛围 BGM | 场景描述 + 时长 | 器乐 WAV（无人声） |
| `game_bgm_loop` | 可循环 BGM | 场景 + loop 提示 | 器乐 WAV，首尾可衔接 |
| `game_bgm_battle` | 战斗 BGM | 强度 + 节奏倾向 | 高能量器乐 |
| `game_bgm_inpaint` | 片段修改 | 音频 + 时间范围 + 新描述 | 局部替换后 WAV |

#### C. 游戏 SFX（引擎：SA3 Small SFX）

| 模式 ID | 名称 | 输入 | 输出 |
|---------|------|------|------|
| `game_sfx` | 单次音效 | 音效描述 + 时长（短） | WAV |
| `game_sfx_pack` | 音效批次 | 多条描述 | 多条 WAV（v0.2） |

#### D. 游戏主题曲（引擎：ACE-Step 1.5）

| 模式 ID | 名称 | 输入 | 输出 |
|---------|------|------|------|
| `game_theme_vocal` | 主题曲（有人声） | 歌词/描述 + 游戏世界观 | 整曲 + 封面 |

### 5.3 SaaS 基础能力

- **多租户隔离：** 用户只能访问自己的曲目与任务
- **异步任务：** 提交后立即返回 `job_id`，轮询或 Webhook（v0.2）
- **积分：** 提交前校验余额；失败任务退还积分
- **管理后台：** 用户数、队列深度、Mac 节点在线状态、今日生成量
- **审计：** 任务日志（提示词、引擎、模型版本、耗时、状态）

---

## 6. 用户旅程

### 6.1 人声歌曲（Creator）

```text
注册 → 领取赠送积分 → 选择「人声歌曲」
  → 输入描述或歌词 → 确认扣费 → 排队
  → 生成中（ACE-Step 1.5）→ 作品库出现条目
  → 在线播放 → 下载 MP3/WAV → （可选）标注 AI 生成
```

### 6.2 游戏 BGM（Game）

```text
注册 → 创建「游戏项目」→ 选择「游戏 BGM」
  → 选模板（探索/战斗/菜单）或自由描述
  → 指定时长 → 确认扣费 → 排队
  → 生成中（SA3）→ 下载 WAV → 导入 Unity / Wwise
  → （v0.2）对循环不佳处 inpainting 重生成片段
```

### 6.3 游戏 SFX（v0.2）

```text
选择「游戏音效」→ 描述（如 metal door slam）→ 短时长
  → SA3 Small SFX 生成 → 下载 → 入项目素材库
```

---

## 7. 用户故事与验收标准

### 7.1 人声

| ID | 故事 | 引擎 | 验收 |
|----|------|------|------|
| U-01 | 输入「日系摇滚、失恋、女声」并自动写词成歌 | ACE-Step 1.5 | P95 ≤180s，可听人声，可下载 |
| U-02 | 粘贴歌词 + 选风格生成 | ACE-Step 1.5 | 歌词咬字可接受，无严重崩坏 |
| U-03 | 作品库播放、下载、展示封面 | — | MP3/WAV + 封面 URL |

### 7.2 游戏

| ID | 故事 | 引擎 | 验收 |
|----|------|------|------|
| G-01 | 「暗黑地牢探索、紧张、无人声」得 BGM | SA3 Small/Medium | 无人声泄漏，WAV 可导入引擎 |
| G-02 | 生成战斗 BGM 30–120s | SA3 | 能量感符合描述 |
| G-03 | 对 BGM 某 30s inpainting | SA3 | 仅该段变化（v0.2） |
| G-04 | 生成 UI 点击音效 | SA3 Small SFX | 时长 ≤5s，无明显音乐化（v0.2） |
| G-05 | 游戏主题曲带人声 | ACE-Step 1.5 | 与 G-01 无人声要求区分开 |

### 7.3 SaaS 运营

| ID | 故事 | 验收 |
|----|------|------|
| S-01 | Mac 离线时任务排队不丢 | 恢复后自动继续 |
| S-02 | 积分不足拒绝提交 | 前后端双重校验 |
| S-03 | 管理台可见双引擎健康 | ACE / SA3 分别上报 |

---

## 8. 系统架构

```text
                         ┌──────────────────────────┐
                         │   用户 / 游戏客户 / API    │
                         └────────────┬─────────────┘
                                      │ HTTPS
                         ┌────────────▼─────────────┐
                         │      SaaS 控制面           │
                         │  Next.js 15 Web UI         │
                         │  BetterAuth · Prisma · PG  │
                         │  Inngest 任务编排          │
                         │  Polar 计费 (v0.3)         │
                         └────────────┬─────────────┘
                                      │
                         ┌────────────▼─────────────┐
                         │    Inference Gateway       │
                         │  路由 · 限流 · 健康检查    │
                         │  按 generation_mode 分发   │
                         └────────────┬─────────────┘
                                      │ HTTP (LAN)
              ┌───────────────────────┴───────────────────────┐
              │         MacBook Pro M5 Pro 48GB               │
              │              192.168.0.199                    │
              │  ┌─────────────────┐  ┌──────────────────┐  │
              │  │ Worker: ACE-Step│  │ Worker: SA3 MLX  │  │
              │  │ 1.5 MLX         │  │ Small/Med/SFX    │  │
              │  │ 人声 / 主题曲   │  │ BGM / SFX        │  │
              │  └─────────────────┘  └──────────────────┘  │
              └─────────────────────────────────────────────┘
                                      │
                         ┌────────────▼─────────────┐
                         │  R2 / S3 · 音频与封面    │
                         └──────────────────────────┘
```

### 8.1 与开源模板的关系

| 来源 | 采用 | 不采用 |
|------|------|--------|
| Andreaswt/ai-music-generation-saas | Auth、积分、Inngest、作品库结构 | Modal 云 GPU |
| tadpole-studio | ACE-Step 工作流参考 | 作为最终前端 |
| stable-audio-3/optimized/mlx | 游戏向推理与 LoRA | — |

---

## 9. 技术选型

| 层级 | 选型 | 说明 |
|------|------|------|
| 前端 | Next.js 15、React 19、Tailwind、Shadcn | 参考成熟音乐 SaaS |
| 认证 | BetterAuth | 邮箱密码，可扩展 OAuth |
| 队列 | Inngest | 长任务、重试、可观测 |
| 数据库 | PostgreSQL + Prisma（Neon 或内网 PG） | 用户、任务、曲目、积分 |
| 存储 | Cloudflare R2 / AWS S3 | 音频、封面；私有 + 签名 URL |
| 计费 | Polar.sh（v0.3） | 积分包 |
| **人声引擎** | **ACE-Step 1.5** | MIT，MLX |
| **游戏引擎** | **Stable Audio 3** | Community License，MLX |
| 人声备选 | YuE | v0.2+ 评估接入 |
| 歌词 / 提示词 | Ollama + Qwen（优先） | 避免 Groq 依赖（可配置） |
| 封面 | SDXL-Turbo | Modal/Mac CPU，非关键路径 |
| 推理网关 | 自研轻量服务（Node 或 Go） | 路由到 Mac 上两个 Worker |

---

## 10. API 概要（v0.1）

### 10.1 认证

- Session Cookie（Web）或 `Authorization: Bearer <api_key>`（v0.3）

### 10.2 核心端点

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/v1/jobs` | 创建生成任务 |
| `GET` | `/v1/jobs/{id}` | 查询任务状态 |
| `GET` | `/v1/tracks` | 我的曲目列表 |
| `GET` | `/v1/tracks/{id}` | 曲目详情 + 播放 URL |
| `GET` | `/v1/tracks/{id}/download` | 签名下载 |
| `GET` | `/v1/credits` | 积分余额 |
| `GET` | `/v1/health` | 控制面健康 |
| `GET` | `/v1/health/inference` | 双引擎节点状态 |

### 10.3 创建任务请求示例

```json
{
  "mode": "game_bgm",
  "prompt": "dark dungeon exploration, tense, no vocals, loopable",
  "duration_sec": 90,
  "project_id": "optional-game-project-uuid"
}
```

```json
{
  "mode": "vocal_lyrics",
  "style_tags": "j-pop, female vocal, emotional rock",
  "lyrics": "[Verse]\n...\n[Chorus]\n...",
  "duration_sec": 180
}
```

### 10.4 任务状态

`queued` → `routing` → `generating` → `uploading` → `completed` | `failed` | `cancelled`

失败且非用户原因（节点超时等）→ **退还积分**。

---

## 11. 数据模型概要

```text
User
  id, email, credits, created_at

Track
  id, user_id, title, mode, engine, model_variant
  audio_url, cover_url, duration_sec, metadata_json
  project_id (nullable), is_public, created_at

GenerationJob
  id, user_id, track_id (nullable), mode, status
  engine, prompt, params_json, error_message
  credits_charged, started_at, completed_at

CreditLedger
  id, user_id, delta, reason, job_id, created_at

GameProject (v0.2)
  id, user_id, name, description

InferenceNode
  id, host, worker_type (ace_step | sa3), status, last_heartbeat
```

---

## 12. 非功能需求

| 类别 | 要求 |
|------|------|
| 可用性 | 控制面 99.5%（内测）；推理节点允许维护窗口 |
| 延迟 | 人声整曲 P95 ≤180s（4min，M1 实测校准）；SFX ≤60s |
| 并发 | M1 目标：单引擎 1 路生成；双引擎各 1 路不互相 OOM |
| 安全 | 推理 API 仅内网；对象存储私有；防提示词注入日志污染 |
| 合规 | 用户协议 + 禁止模仿指定艺人/作品；AI 生成标注引导 |
| 可观测 | 每任务记录 engine、耗时、模型版本 |

---

## 13. 商用许可与合规

> **不存在「完全零风险、无任何版权纠纷」的模型。**

### 13.1 本项目采用的引擎

| 引擎 | 许可 | 商用条件 | 官方 LICENSE |
|------|------|----------|--------------|
| ACE-Step 1.5 | MIT | ✅ | https://github.com/ace-step/ACE-Step-1.5/blob/main/LICENSE |
| Stable Audio 3 | Community | ✅ 年收入 &lt;100 万美元；须登记 | https://huggingface.co/stabilityai/stable-audio-3-medium/blob/main/LICENSE.md |
| YuE（备选） | Apache 2.0 | ✅ 建议署名 | https://github.com/multimodal-art-projection/YuE/blob/main/LICENSE |

### 13.2 明确禁止用于商业交付

| 名称 | 原因 |
|------|------|
| SongGeneration (LeVo) | 许可限定学术/研究/教育，**禁止商业/生产** |
| MusicGen 权重 | CC-BY-NC 4.0，**禁止商用** |
| MELO / 海绵 / X Studio | 闭源云服务，**非**可自托管开源权重 |

### 13.3 常见误传纠正

| 误传 | 事实 |
|------|------|
| SongGeneration「MIT 零限制」 | 主许可禁止商用；「commercial-grade」指音质 |
| ACE-Step 全是 Apache 2.0 | **1.5 = MIT**；v1 = Apache 2.0 |
| MusicGen 代码 MIT 即可商用 | **权重 NC**，产出不可商用 |
| 云平台免费 = 可商业交付 | 须读**平台服务协议** |

### 13.4 运营合规 checklist

- [ ] Stability AI Community License 登记（SA3 商用）
- [ ] 服务条款：产出归属、AI 标注、禁止侵权提示
- [ ] 年收入接近 100 万美元时启动 SA3 Enterprise 评估
- [ ] 保存任务元数据（引擎版本、时间、用户 ID）备查

---

## 14. 积分与定价（框架，待拍板）

| 模式 | 建议积分（占位） | 引擎 | 备注 |
|------|------------------|------|------|
| 人声歌曲 | 10 | ACE-Step | 按首 |
| 游戏主题曲（人声） | 10 | ACE-Step | 同人声 |
| 游戏 BGM | 5 | SA3 | 按首，可按时长阶梯 |
| 游戏 SFX | 2 | SA3 SFX | 短音效 |
| inpainting | 3 | SA3 | v0.2 |
| 分轨包 | 5 | ACE/Demucs | v0.2 |

新用户赠送积分：内测 20 点（可调）。

---

## 15. 版本规划

### v0.1 — SaaS MVP + 双引擎闭环

- SaaS：注册、积分、队列、作品库、下载
- 人声：`vocal_*` 全走 ACE-Step 1.5
- 游戏：`game_bgm` 走 SA3 Small/Medium
- Mac 双 Worker 联调

### v0.2 — 游戏生产增强

- SA3 Small SFX、`game_sfx`
- SA3 inpainting、游戏项目空间
- 分轨导出、LoRA 风格包
- YuE 人声备选 A/B

### v0.3 — 商业 SaaS

- Polar 积分购买、API Key、社区 Feed、团队空间

---

## 16. 里程碑

| 阶段 | 周期 | 交付 | 引擎验证重点 |
|------|------|------|--------------|
| **M0 立项** | 2026-08 | PRD v1.0、GitHub 仓库 | — |
| **M1 推理验证** | +2 周 | Mac 基准测试报告 | ACE 人声 10 首；SA3 BGM 10 + SFX 10 |
| **M2 SaaS MVP** | +4 周 | 可内测的 Web + API | 端到端双引擎路由 |
| **M3 游戏增强** | +3 周 | inpainting、SFX 库、分轨 | SA3 生产流 |
| **M4 商业化** | +3 周 | Polar、API Key | — |

---

## 17. 风险与缓解

| 风险 | 影响 | 缓解 |
|------|------|------|
| Mac 单点故障 | 服务不可用 | 队列持久化；告警；未来多节点 |
| 风格相似侵权 | 法律纠纷 | 用户协议；禁止指定艺人；v0.2 相似度检测 |
| SA3 收入超 100 万 | 许可终止 | 财务触发 Enterprise 采购 |
| 双引擎内存竞争 | OOM / 变慢 | 网关串行或分进程；M1 压测 |
| 人声泄漏进 BGM | 游戏交付失败 | BGM **强制 SA3**，不用 ACE 器乐模式 |
| 闭源云 API 误接入 | 合规风险 | 架构评审禁止非白名单端点 |

---

## 18. 成功指标（6 个月）

| 指标 | 目标 |
|------|------|
| 内测用户 | ≥50 |
| 月生成任务 | ≥500 |
| 人声任务成功率 | ≥85% |
| 游戏 BGM 无人声泄漏率 | ≥95%（人工抽检） |
| 双引擎路由准确率 | 100%（按 mode 映射） |
| 商用合规引擎占比 | 100%（仅 ACE + SA3 + 可选 YuE） |

---

## 19. 待决问题

| # | 问题 | 影响 | 建议默认 |
|---|------|------|----------|
| 1 | 控制面公网 vs 纯内网 | 安全与获客 | 内测内网，公网 v0.3 |
| 2 | 积分按首 vs 按分钟 | 定价 | BGM 按分钟阶梯 |
| 3 | 歌词/封面是否允许云 LLM | 依赖与合规 | 默认本地 Ollama |
| 4 | 产品正式品牌名 | 市场 | M1 前确定 |
| 5 | YuE 是否 v0.2 默认开启 | 资源与质量 | 先 A/B，非默认 |

---

## 20. 附录

### 20.1 M1 硬件实测清单

- [ ] ACE-Step 1.5（4B LM）人声整曲：耗时、内存、质量抽样
- [ ] SA3 MLX：Small / Medium / Small SFX 各 10 条
- [ ] 双 Worker 同时运行是否 OOM
- [ ] 局域网 Windows → Mac API P95 延迟
- [ ] BGM 无人声泄漏抽检（10 首）
- [ ] 24h 连续生成：温升、降频、稳定性

### 20.2 官方链接速查

| 资源 | URL |
|------|-----|
| ACE-Step 1.5 | https://github.com/ace-step/ACE-Step-1.5 |
| Stable Audio 3 | https://github.com/Stability-AI/stable-audio-3 |
| SA3 MLX 安装 | https://github.com/Stability-AI/stable-audio-3/tree/main/optimized/mlx |
| YuE | https://github.com/multimodal-art-projection/YuE |
| tadpole-studio | https://github.com/proximasan/tadpole-studio |
| SaaS 模板参考 | https://github.com/Andreaswt/ai-music-generation-saas |
| Stability 商用登记 | https://stability.ai/community-license |

### 20.3 术语

| 术语 | 含义 |
|------|------|
| 控制面 | Web、Auth、队列、计费，不跑大模型 |
| 推理 Worker | Mac 上实际跑 ACE-Step 或 SA3 的进程 |
| generation_mode | 产品侧模式 ID，决定引擎路由 |
| Community License | Stability AI 年收入 &lt;100 万美元商用许可 |

---

*v1.0 立项定稿。后续变更请更新修订记录并 bump 版本号。*
