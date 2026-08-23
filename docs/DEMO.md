# Demo 规格（MVP 配套）

**版本：** v1.0  
**关联：** [PRD.md](../PRD.md) v1.2 · MVP = API + **配套 Demo**

Demo 不是完整 SaaS，而是 **API 的可视化试用与验收工具**：对内调试、对外展示集成方式、Cursor 验收走通全链路。

---

## 1. Demo 定位

| 维度 | Demo（MVP） | SaaS v1.0（后续） |
|------|-------------|-------------------|
| 目的 | 试 API、演示、验收 | 商业化产品 |
| 用户体系 | 无注册 | 注册登录 |
| 数据 | 当次会话任务列表（可选本地） | 永久作品库 |
| 计费 | 无 | 积分 / Polar |
| 实现 | 单页 Web + curl 示例 | 完整控制台 |

**原则：** Demo **只调用公开 REST API**，不绕过 Gateway 直连 Worker（保证 Demo 即集成参考）。

---

## 2. MVP Demo 交付物

| 交付物 | 路径（规划） | 说明 |
|--------|--------------|------|
| Web Demo | `apps/demo/` | 单页应用，4 种 mode 可试 |
| curl 示例 | `examples/curl/` | 每个接口一条可复制命令 |
| Python 示例 | `examples/python/minimal_client.py` | 提交 → 轮询 → 保存文件 |
| 环境说明 | 本文 §6 | 本地一键启动顺序 |

---

## 3. Web Demo 功能范围（必做）

### 3.1 页面结构（单页，无路由）

```text
┌─────────────────────────────────────────────────┐
│  Local AI Music API · Demo                        │
│  [健康状态] ACE: ●  SA3: ●  Gateway: ●              │
├─────────────────────────────────────────────────┤
│  任务类型: [人声-歌词 ▼]  时长: [90]s              │
│  风格/描述: [________________________]          │
│  歌词(可选): [________________________]          │
│  [生成]                                           │
├─────────────────────────────────────────────────┤
│  状态: generating... 45%  (或 queued / failed)   │
├─────────────────────────────────────────────────┤
│  ▶ 播放器  [下载 WAV]   job_id: abc-123           │
├─────────────────────────────────────────────────┤
│  最近任务（本页会话，最多 10 条）                 │
└─────────────────────────────────────────────────┘
```

### 3.2 交互规则

| 规则 | 说明 |
|------|------|
| mode 切换 | 切换后表单项变化：`vocal_lyrics` 显示歌词框；`game_bgm` 隐藏歌词、强调「无人声」提示 |
| 提交 | 调用 `POST /v1/jobs`；按钮 loading，禁止重复提交至返回 `job_id` |
| 轮询 | 每 2s `GET /v1/jobs/{id}`，最长 10min；超时显示可重试文案 |
| 完成 | 自动加载 `GET /v1/jobs/{id}/audio` 到 `<audio>` |
| 失败 | 展示 `error_code` + `message`（来自 API，不自定义掩盖） |
| 空状态 | 未生成时播放器区显示「提交任务后开始生成」 |

### 3.3 mode 与表单字段

| mode | 必填 | 选填 |
|------|------|------|
| `vocal_lyrics` | `style_tags`, `lyrics` | `duration_sec`（默认 180） |
| `vocal_desc` | `prompt` | `duration_sec` |
| `game_bgm` | `prompt` | `duration_sec`（默认 90） |
| `game_theme_vocal` | `prompt` 或 `lyrics` | `duration_sec` |

### 3.4 鉴权方式（二选一，TECH_SPEC 锁定）

**推荐 A — BFF 代理（Demo 不暴露 Key）：**

```text
浏览器 → Demo 静态页 → 同源 /demo/api/* → Gateway（服务端注入 X-API-Key）
```

**备选 B — 开发模式：** 页面输入 API Key，仅存 `sessionStorage`（仅内网演示用）。

MVP 默认采用 **A**。

---

## 4. UI 极简规范（Demo 专用，非 SaaS UI_SPEC）

| 项 | 值 |
|----|-----|
| 框架 | Vite + React 或 Next.js 单页（与 TECH_SPEC 一致） |
| 配色 | 背景 `#0f1419`，主色 `#3b82f6`，成功 `#22c55e`，错误 `#ef4444` |
| 字体 | `system-ui`，正文 14px，标题 18px |
| 圆角 | 按钮/输入框 8px |
| 间距 | 表单项间距 16px，区块 24px |
| 加载 | 按钮 disabled +「生成中…」；进度用状态文案而非假百分比（除非 API 返回 progress） |

完整 SaaS 视觉规范在 **SaaS v1.0** 写入 `UI_SPEC.md`；Demo 仅遵守上表。

---

## 5. curl 示例（须与 DATA_API.md 一致）

`examples/curl/create_vocal_lyrics.sh`：

```bash
curl -sS -X POST "${API_BASE}/v1/jobs" \
  -H "X-API-Key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "vocal_lyrics",
    "style_tags": "j-pop, female vocal, emotional",
    "lyrics": "[Verse]\n...\n[Chorus]\n...",
    "duration_sec": 120
  }'
```

须配套：`create_game_bgm.sh`、`poll_job.sh`、`download_audio.sh`、`health.sh`。

---

## 6. 本地启动（目标体验）

```text
1. Mac 上 ACE + SA3 Worker 已启动（见 INFERENCE.md）
2. 启动 Gateway：localhost:8080
3. 启动 Demo：localhost:3000（或 Gateway 静态挂载 /demo）
4. 打开浏览器 → 选 mode → 生成 → 听到音频
```

**一键脚本（OPS.md 细化）：** `scripts/dev-up.sh` 检查 health 后打开 Demo URL。

---

## 7. Demo 验收标准（写入 ACCEPTANCE.md）

| ID | 用例 | 预期 |
|----|------|------|
| D-01 | Web 提交 `game_bgm` | 90s 内状态变 completed，可播放 |
| D-02 | Web 提交 `vocal_lyrics` | 有可人声，可下载 |
| D-03 | Worker 离线时提交 | 页面显示 queued/failed，不白屏 |
| D-04 | curl `create_vocal_lyrics.sh` | 与 Web 结果一致 |
| D-05 | Python `minimal_client.py` | 本地写出 `.wav` 文件 |
| D-06 | 无 API Key 的 curl | `401` |

---

## 8. 明确不做（Demo 边界）

- ❌ 用户注册 / 登录页
- ❌ 积分、支付、分享社区
- ❌ 永久历史作品库（仅会话内最近 10 条）
- ❌ 封面图生成展示
- ❌ 移动端专门适配（响应式即可）

---

## 9. 与文档体系关系

| 文档 | Demo 相关内容 |
|------|----------------|
| DATA_API.md | 接口字段 Demo 必须全部使用 |
| RULES.md | 错误码与轮询超时 |
| TECH_SPEC.md | `apps/demo` 目录与 BFF 代理 |
| UI_SPEC.md | **MVP 不写**；Demo 以本文 §4 为准 |
| ACCEPTANCE.md | 包含 §7 Demo 用例 |

---

*Demo 随 API 版本迭代；接口变更须同步更新 examples 与 Web Demo。*
