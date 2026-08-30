# PRD：Local AI Music SaaS

**本地推理 · 双引擎 · 音乐 SaaS 平台**

| 字段 | 内容 |
|------|------|
| 项目名称 | MusicSaas |
| 文档版本 | **v1.2** |
| 状态 | 立项定稿（**MVP = API + 配套 Demo**） |
| 更新日期 | 2026-08-23 |
| 仓库 | https://github.com/chenzh/MusicSaas |
| 产品类型 | **音乐生成 API 服务**（MVP）→ 完整 SaaS（后续版本） |

### 修订记录

| 版本 | 日期 | 说明 |
|------|------|------|
| v0.1 | 2026-08-23 | 初版立项 |
| v0.2 | 2026-08-23 | 补充许可矩阵、Stable Audio 3 |
| v1.0 | 2026-08-23 | 完善双引擎分工、API/数据模型、版本规划 |
| **v1.1** | 2026-08-23 | MVP 收窄为音乐生成 API 服务 |
| **v1.2** | 2026-08-23 | MVP 增加 **配套 Web Demo** + curl/Python 示例 |

---

## 0. 执行摘要

**MVP 定义（v1.2 锁定）：** 提供 **音乐生成 API 服务** + **配套 Demo**（单页 Web 试用 + curl/Python 示例）。客户端通过 REST 提交任务、轮询、获取音频；Demo 用于演示、调试与验收。**不做** 注册登录、积分、社区 Feed（Post-MVP SaaS）。

**资产层定位（v1.3 补充，2026-08-30）：** 音乐 API + BeatScape 游戏 = **人物 IP + 音乐 IP 两个资产线**（见 §21）。本 PRD 描述**能力层**（怎么造），IP 战略描述**资产层**（造出来的东西怎么变成可持续 IP），两者通过 §21 桥接。

**MVP 交付物：**

- Inference Gateway（路由、鉴权、队列）
- Mac 双 Worker：ACE-Step 1.5（人声）+ Stable Audio 3（BGM）
- 异步 Job API + 健康检查
- 音频返回（URL 或流）
- **配套 Demo：** `apps/demo` 单页 Web + `examples/curl` + Python 最小客户端（见 [docs/DEMO.md](./docs/DEMO.md)）

**两条业务线（API 能力不变）：**

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

### 1.2 为何先做 API 而非完整 SaaS

| 维度 | MVP（API 服务） | Post-MVP（SaaS） |
|------|-----------------|------------------|
| 交付形态 | REST + Job 轮询 | Web App + 作品库 |
| 用户体系 | API Key / 内网免鉴权（二选一） | 注册登录、多租户 |
| 计费 | 无（内测）或简单 QPS 限流 | 积分、Polar |
| 存储 | 任务级音频 URL，可选 TTL | 永久作品库、封面 |
| 开发量 | 网关 + Worker + 接口字典 | 前端 + 全量 SaaS |

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

**一句话（能力层）：** 可商用的 **本地双引擎音乐生成 API** — 人声走 ACE-Step，游戏 BGM 走 Stable Audio 3；MVP 仅 API，Web SaaS 后续叠加。

**一句话（资产层，v1.3 补充）：** BeatScape **不是游戏 + BGM**——它是 **7 个 District 角色 + 85+ 首 AI 原创 BGM** 两个 IP 资产；API 与游戏是**生产工具**，不是产品本身。

**价值主张：**

- **对集成方：** 「一个 API，人声 + 游戏 BGM，许可清晰、数据在己方 Mac」
- **对游戏客户：** 「BGM 专用 SA3 路由，避免人声泄漏」
- **对运营方：** 「算力自持，先 API 验证再扩 SaaS」
- **对 IP 价值（v1.3 新增）：** 「7 个原创角色 + 85+ 首 AI 原创音乐，可作为可持续运营的品牌资产」

**MVP 非目标：** 无完整 SaaS 控制台、无用户注册、无积分/支付、无社区、无封面图 API、无分轨/inpainting（v0.2）。

**长期非目标：** 闭源 API 套壳；DAW 级编辑器；**原生移动端 App（native iOS/Android 安装包）**。
> 注：「原生 App」≠「移动端体验」。手机玩家体验（浏览器竖屏音游 + 可安装 PWA + 触控/离线/分享）为 BeatScape 第一优先级交付物，详见 `PRD_mobile.md`。

**新增资产层约束（v1.3）：**

- **音乐 IP 仅做自有产品内用**（游戏 BGM / 周边视频配乐 / 品牌内容）；**不对外授权**（sync / 流媒体 / 二次分发）—— 见 §21.1
- **角色 IP 受 `RESONANCE-VISUAL-PLAN.md` 硬约束**（不画脸 / 不画武器 / 不穿制服 / 不借用人格面具或塔罗）—— 见 §21.3
- **所有可注册标识必须先注册商标再使用**（见 §19 #4 + §21.1 清单）

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

### 5.0 MVP 范围（API 服务 v0.1）

**必做：**

| 能力 | 说明 |
|------|------|
| `POST /v1/jobs` | 创建生成任务（`mode` + `prompt` / `lyrics` + `duration_sec`） |
| `GET /v1/jobs/{id}` | 任务状态：`queued` → `generating` → `completed` / `failed` |
| `GET /v1/jobs/{id}/audio` | 完成后下载 WAV/MP3（URL 或流） |
| `GET /v1/health` | 网关存活 |
| `GET /v1/health/inference` | ACE / SA3 Worker 状态 |
| 双引擎路由 | `vocal_*` → ACE-Step；`game_bgm*` → SA3 |
| 鉴权 | MVP 默认：`X-API-Key` 静态密钥（环境变量配置） |
| 队列 | 单 Mac 串行或每引擎 1 并发；超时与失败可观测 |
| **配套 Demo** | 单页 Web（4 mode 可试、播放、下载）+ curl/Python 示例 |

**MVP 支持的 `mode`（首期 4 个）：**

| mode | 引擎 | 说明 |
|------|------|------|
| `vocal_lyrics` | ACE-Step 1.5 | 歌词 + 风格标签 → 整曲 |
| `vocal_desc` | ACE-Step 1.5 | 描述 → 整曲（可选服务端写词 v0.1.1） |
| `game_bgm` | SA3 Small/Medium | 器乐 BGM |
| `game_theme_vocal` | ACE-Step 1.5 | 游戏主题曲（有人声） |

**暂缓（Post-MVP API v0.2+）：** `game_sfx`、`game_bgm_inpaint`、Webhook、批量任务、分轨导出。

**永久不做（MVP）：** 注册登录、积分、Polar、社区 Feed、封面图 API、永久作品库。

**Demo 不做（见 DEMO.md）：** 注册、计费、社区、封面；仅会话级最近任务列表。

### 5.1 功能地图（全产品路线图）

| 模块 | MVP API v0.1 | API v0.2 | SaaS v1.0 |
|------|--------------|----------|------------|
| REST Job API | ✅ | Webhook、SFX | — |
| **配套 Demo Web** | ✅ | 同 API 扩展 | 升级为正式控制台 |
| curl / Python 示例 | ✅ | 扩展 mode | — |
| API Key 鉴权 | ✅ 静态 Key | 多 Key、限流 | 用户绑定 Key |
| 人声生成 | ✅ ACE-Step | YuE 备选 | 作品库 |
| 游戏 BGM | ✅ SA3 | inpainting | 项目空间 |
| 游戏 SFX | | ✅ Small SFX | 素材库 |
| 注册 / 登录 | ❌ | ❌ | ✅ |
| Web 作品库 | ❌ | ❌ | ✅ |
| 积分 / Polar | ❌ | ❌ | ✅ |
| 社区 Feed | ❌ | ❌ | ✅ |

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

### 5.3 API 服务能力（MVP）

- **异步任务：** `POST` 立即返回 `job_id`；客户端轮询 `GET /v1/jobs/{id}`
- **鉴权：** `X-API-Key`；无 Key 返回 `401`
- **隔离：** 任务仅 Key 持有者可查询（内存/DB 按 `api_key_id` 隔离）
- **审计：** 日志记录 `mode`、引擎、耗时、状态（不记录完整 prompt 可选配置）
- **限流：** MVP 固定 QPS / 日上限（环境变量）

~~SaaS 基础能力（Post-MVP）~~：多租户 Web、积分、管理后台 — 见 SaaS v1.0 路线图。

---

## 6. 用户旅程

### 6.0 MVP：API 客户端旅程（主路径）

```text
集成方持有 API Key
  → POST /v1/jobs { mode, prompt, duration_sec }
  → 收到 { job_id, status: "queued" }
  → 轮询 GET /v1/jobs/{id} 直至 completed
  → GET /v1/jobs/{id}/audio 下载 WAV
  → 写入游戏工程 / 自有产品
```

### 6.1 人声歌曲（API：`vocal_*`）

```text
POST mode=vocal_lyrics → ACE-Step 1.5 生成
  → 轮询 → 下载音频（无 Web 作品库）
```

### 6.2 游戏 BGM（API：`game_bgm`）

```text
POST mode=game_bgm → SA3 生成器乐
  → 轮询 → 下载 WAV → 导入 Unity / Wwise
```

### 6.3 Post-MVP：Web SaaS 旅程（暂缓）

注册、积分、作品库、在线播放等 — 见 SaaS v1.0，不在 MVP API 范围。

### 6.4 游戏 SFX（API v0.2，暂缓）

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

### 7.3 API 运营（MVP）

| ID | 故事 | 验收 |
|----|------|------|
| S-01 | Mac Worker 离线时任务排队 | 恢复后继续 |
| S-02 | 无 API Key 拒绝请求 | `401` |
| S-03 | `GET /v1/health/inference` 区分 ACE/SA3 | 状态准确 |
| S-04 | 错误 `mode` 路由 | `400` + 明确错误码 |

### 7.4 Post-MVP：SaaS 运营（暂缓）

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

### MVP — API + Demo v0.1（当前）

- Gateway + 4 个 `mode` + Job 轮询 + API Key + Mac 双 Worker
- **`apps/demo`** 单页 Web + **`examples/`** curl/Python

### API v0.2

- `game_sfx`、inpainting、Webhook、多 Key 限流

### SaaS v1.0（Post-MVP）

- Next.js 控制台、注册、作品库、积分、Polar（**复用同一套 API**）

---

## 16. 里程碑

| 阶段 | 周期 | 交付 | 引擎验证重点 |
|------|------|------|--------------|
| **M0 立项** | 2026-08 | PRD v1.0、GitHub 仓库 | — |
| **M1 推理验证** | +2 周 | Mac 基准测试报告 | ACE 人声 10 首；SA3 BGM 10 + SFX 10 |
| **M2 API + Demo MVP** | +4 周 | Job API + Web Demo + examples 验收 |
| **M3 API v0.2** | +3 周 | SFX、inpainting | SA3 扩展 |
| **M4 SaaS v1.0** | +4 周 | Web 控制台叠在 API 上 | — |

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

| # | 问题 | 影响 | 建议默认 | 状态 |
|---|------|------|----------|------|
| 1 | 控制面公网 vs 纯内网 | 安全与获客 | 内测内网，公网 v0.3 | 待定 |
| 2 | 积分按首 vs 按分钟 | 定价 | BGM 按分钟阶梯 | 待定 |
| 3 | 歌词/封面是否允许云 LLM | 依赖与合规 | 默认本地 Ollama | 待定 |
| 4 | **产品正式品牌名 + 17 个商标注册** | **IP 战略阻塞项**：没有商标就没有可衍生的品牌 | M1 前必须确定（**v1.3 升级为阻塞**） | **阻塞** |
| 5 | YuE 是否 v0.2 默认开启 | 资源与质量 | 先 A/B，非默认 | 待定 |
| 6 | 角色 IP 与 BeatScape 无角色原则的兼容（v1.3 新增） | 视觉/法律 | 删除 RESONANCE-VISUAL-PLAN §1.1/§8「无角色」约束，明列角色系统 | 进行中 |

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

## 21. IP 资产线（v1.3 新增）

> **权威文档**：[`docs/BEATSCAPE-IP-STRATEGY.md`](./docs/BEATSCAPE-IP-STRATEGY.md)
> 关联：[`docs/RESONANCE-VISUAL-PLAN.md`](./docs/RESONANCE-VISUAL-PLAN.md) · [`docs/RESONANCE-SONIC-DIRECTION.md`](./docs/BEATSCAPE-SONIC-DIRECTION.md) · [`docs/licenses/README.md`](./docs/licenses/README.md)
>
> 本节是 PRD 与 IP 战略文档的桥接——描述**能力层产出如何变成资产层产出**。具体战略、市场、衍生品分级见 IP 战略文档。

### 21.1 音乐 IP

- **可用**：录音制作者权（母带）+ 商标（曲名、艺人名、BeatScape、RESONANCE、各 District 名）
- **不可用**：编曲著作权（纯 AI 生成的编曲在大多数司法辖区不受保护）
- **商业边界**：
  - ✅ 自有产品内用（BeatScape 游戏 BGM、周边视频配乐、品牌内容、v0.2+ 角色语音/互动音频）
  - ❌ 对外授权（影视 / 广告 / 流媒体 / 第三方游戏再分发 / 实体 CD / 贴牌 BGM 库）
- **必须先做**：**17 个商标注册**（BeatScape + RESONANCE + 7 District + 7 角色代号）—— 这是衍生品第一道门，详见 §19 #4
- **可重评估边界的时间点**：(a) 司法环境对 AI 著作权更明确，或 (b) 引入人类创作性介入（编曲师人工 remix / 现场录音）产生**新**的可保护录音制作者权

### 21.2 人物 IP — 7 District 角色

- 7 个 District（Pulse Core / Night Grid / Glass Rim / Afterhours Lane / Chrome Yard / Slide District / Skyline Hook） ↔ 7 个原创角色（VOLTA / STATIC / PRISM / EMBER / RIVET / GLIDE / HALO）
- 角色挂在 District 上，**与 85+ 曲库 + 7 District 配色 + 5 曲风配额 + 4 听感 Vibe 天然咬合**
- 完整角色圣经、设计稿（7 张 District 角色设计稿）、Do/Don't 规则见 [`docs/BEATSCAPE-IP-STRATEGY.md`](./docs/BEATSCAPE-IP-STRATEGY.md) §2

### 21.3 人物 IP 硬约束（叠加在 `RESONANCE-VISUAL-PLAN.md` §1.1 之上）

- 角色不画脸（脸在阴影里或被头戴物覆盖）—— 避免具体真人/动漫角色联想
- 标志物 = **职业工具**（不是武器/徽章/面具/塔罗）
- 不穿校服、不穿制服、不戴面具、不披披风
- 64px 剪影必须可区分（这是 IP 可衍生性的硬约束）
- 衍生品上线前必须经 `docs/RESONANCE-BLINDTEST.md` 盲测（不玩日式 RPG 的观察者，**任一人识别出来源作品即不通过**）
- 手办 / 模型品类须**独立法律意见**（`Tetris v. Xio` 判例）

### 21.4 与 PRD 其他章节的关系

| 章节 | 影响 |
|------|------|
| §0 / §2 定位 | 已加资产层段落 |
| §9 选型 | 不影响（仍是 ACE-Step + SA3） |
| §13 合规 | **必须补** AI 生成音乐 IP 披露话术（v0.3 修订） |
| §14 积分 | 不影响自有产品内用；对外授权相关的定价无意义 |
| §15 版本规划 | 增加 IP 资产线相关 milestone（见 IP 战略 §6） |
| §19 待决问题 | #4 升级为阻塞（商标注册）；新增 #6（角色 vs 无角色原则兼容） |
| §20 附录 | 增补 IP 战略文档为权威外部引用 |

### 21.5 能力层 vs 资产层 — 边界与责任

| 维度 | 能力层（PRD） | 资产层（IP 战略） |
|------|---------------|-------------------|
| 关注 | 产品怎么造 | 造出来的东西怎么变成可持续 IP |
| 产出 | API、引擎、Worker、Job | 品牌商标、角色版权、衍生品矩阵 |
| 决策 | 引擎选型、限流、合规 | 角色系统、商标注册、衍生品分级 |
| 风险 | 技术债、引擎许可 | 商标抢注、look-and-feel 误认、衍生品翻车 |
| 主责 | 工程 | 产品 + 品牌 + 法务（后期） |

---

*v1.3 — 能力层（API 引擎 / Worker / Job）+ 资产层（人物 IP / 音乐 IP）双层定位。SaaS 控制台、IP 资产持续运营后续叠加。*
