# Demo 商用级演示升级计划

**日期：** 2026-08-23  
**版本：** v0.1（规划稿）  
**目标：** 将 `apps/demo` 从 MVP 验收页升级为 **可对外路演、可给集成方试用、接近商用 SaaS 观感** 的演示产品  
**边界：** 仍 **不做** 注册登录 / 计费 / 永久作品库（见 PRD Post-MVP）；Demo 继续 **只走 Gateway BFF**，不直连 Worker

---

## 1. 现状与差距

### 1.1 已有能力（MVP ✅）

| 能力 | 现状 |
|------|------|
| 四 mode 表单 | `vocal_lyrics` / `vocal_desc` / `game_bgm` / `game_theme_vocal` |
| BFF 代理 | `/demo/api/*`，浏览器不暴露 API Key |
| 任务轮询 + 播放 + 下载 | `useJobPoll` + `<audio>` + WAV 下载 |
| 健康状态 | Gateway / ACE / SA3 三色点 |
| 会话任务列表 | `sessionStorage` 最近 10 条 |
| 部署 | Gateway 静态挂载 `/demo/`，局域网可访问 |
| MLX 人声 | 真实 ACE 推理 ~3s（10s 音频）已跑通 |

### 1.2 与「商用级演示」的差距

| 维度 | MVP 现状 | 商用演示期望 |
|------|----------|--------------|
| **品牌与首屏** | 纯文字标题，无 Logo / Hero | 有产品叙事、价值主张、引擎标识 |
| **视觉** | 单栏 720px，基础暗色 | 双栏布局、波形/封面占位、精致组件库 |
| **引导** | 无 onboarding | 预设示例一键填充、场景 Tab（游戏 / 人声） |
| **进度反馈** | 仅状态字符串 | 阶段时间线、预估耗时、引擎标签 |
| **作品展示** | 单条播放器 | 卡片列表、元数据（mode/时长/引擎/latency） |
| **错误体验** | `alert` + 红字 | 内联错误卡、重试、Worker 离线说明 |
| **移动端** | 仅基础响应式 | 路演平板 / 手机可演示 |
| **演示模式** | 无 | 全屏路演、隐藏调试信息、自动播放样例 |
| **集成说明** | 无页面内文档 | 内嵌 API 片段、cURL 复制、Python 入口 |
| **合规提示** | 无 | AI 生成声明、许可摘要（链到 COMPLIANCE） |
| **性能观感** | 首次 MLX 冷启动无提示 | 预热状态、排队说明、生成中骨架屏 |

---

## 2. 产品目标（Demo v2）

**一句话：** 让来访者在 **3 分钟内** 理解「双引擎本地音乐 API」并完成一次 **可播放、可下载、可分享局域网链接** 的生成体验。

### 2.1 成功标准

| 指标 | 目标 |
|------|------|
| 首屏理解 | 访客 10s 内知道「人声 vs 游戏 BGM」分工 |
| 首次生成 | 选预设 → 点生成 → 听到音频，全流程 < 2 分钟（含 30s 人声） |
| 路演稳定性 | 连续 5 次演示无白屏、无未处理异常 |
| 移动端 | iPad 横屏布局可用，核心流程不溢出 |
| 集成转化 | 页面内可一键复制 cURL / 查看 job_id 与 API 路径 |

### 2.2 明确不做（仍属 SaaS v1.0）

- 用户注册 / 登录 / 多租户
- 积分、支付、Polar
- 永久云端作品库、社交分享 Feed
- 封面图生成、分轨、inpainting 编辑器
- Demo 内嵌真实 API Key 输入（继续 BFF；开发模式可选）

---

## 3. 信息架构（目标页面）

```text
┌──────────────────────────────────────────────────────────────────┐
│  [Logo] MusicSaas Demo          ACE ●  SA3 ●  Gateway ●  [?帮助] │
├──────────────────────────────────────────────────────────────────┤
│  Hero：本地双引擎音乐 API · 数据在己方 Mac · MIT / Community     │
│  [游戏配乐] [人声创作]  ← 场景 Tab（切换默认 mode + 预设）        │
├────────────────────────────┬─────────────────────────────────────┤
│  创作区                     │  输出区                              │
│  · mode 选择（图标+说明）    │  · 大播放器 + 波形（可选）            │
│  · 预设 chips 一键填充       │  · 元数据：引擎/时长/latency/job_id   │
│  · 表单 + 字数/时长校验      │  · [下载 WAV] [复制 API 示例]         │
│  · [生成] 主按钮             │  · 生成时间线（queued→…→completed）   │
├────────────────────────────┴─────────────────────────────────────┤
│  最近作品（卡片网格，可切换播放）  │  集成指南折叠面板（cURL/Python）   │
├──────────────────────────────────────────────────────────────────┤
│  页脚：许可摘要 · 局域网地址 · 版本号 · 「非商用条款以 COMPLIANCE 为准」│
└──────────────────────────────────────────────────────────────────┘
```

---

## 4. 分阶段路线图

### Phase A — 演示可用性（P0，~3d）

**目标：** 路演不翻车，错误可解释，预设可一键演示。

| ID | 任务 | 交付 |
|----|------|------|
| A-1 | **场景预设库** | 每 mode 2–3 组 curated prompt/lyrics（中/英），点击填充表单 |
| A-2 | **生成时间线** | 展示 `queued → routing → generating → completed`，映射 API status |
| A-3 | **错误卡组件** | 替换 `alert`：展示 `error.code` + `message` + 重试按钮 |
| A-4 | **Worker 离线态** | `inference health` 非 ok 时顶部 Banner + 禁用生成 |
| A-5 | **加载骨架屏** | generating 时播放器区 skeleton +「MLX 推理中，约 10–60s」文案 |
| A-6 | **任务卡片** | 最近任务显示 mode 标签、状态徽章、点击切换播放 |
| A-7 | **验收** | 扩展 `acceptance-demo-web.py` 或 Playwright：D-01/D-02/D-03 自动化 |

**验收：** 同事无指导完成一次 BGM + 一次人声生成；Worker 停服时页面有明确提示。

---

### Phase B — 商用观感（P1，~5d）

**目标：** 视觉与交互接近 SaaS 试用页，适合客户屏幕共享。

| ID | 任务 | 交付 |
|----|------|------|
| B-1 | **设计系统** | 抽 `tokens.css`：色板、间距、圆角、阴影；引入轻量组件（Button/Card/Badge） |
| B-2 | **双栏布局** | 桌面 ≥1024px 左右分栏；移动单列折叠 |
| B-3 | **Hero + 场景 Tab** | 游戏 / 人声两大场景，切换默认 mode 与配色强调 |
| B-4 | **引擎徽章** | 输出区显示 `ACE-Step 1.5` / `Stable Audio 3` + MLX 标签 |
| B-5 | **元数据展示** | 完成后展示 `duration_sec`、`latency_ms`（API 若返回）、`job_id` 可复制 |
| B-6 | **波形可视化** | 使用 `wavesurfer.js` 或 Canvas 简易波形（静态 peaks 即可） |
| B-7 | **集成面板** | 折叠区：当前表单的等价 cURL + `poll_job.sh` 链接 |
| B-8 | **演示模式** | URL `?demo=1` 隐藏 job_id 细节、放大播放器、自动选预设 |

**验收：** 1080p 投屏 15 分钟演示无需滚动找按钮；视觉与 MVP 明显区隔。

---

### Phase C — 路演与运营（P2，~3d）

**目标：** 内网路演、展会、客户 PoC 可复制部署。

| ID | 任务 | 交付 |
|----|------|------|
| C-1 | **局域网发现** | 页脚展示 `http://{hostname}:8080/demo/`（由 BFF 注入或前端读 `location`） |
| C-2 | **预热提示** | 调 `GET /v1/health/inference`，展示 `lm_model` / `ace_api` 状态 |
| C-3 | **样例音频缓存** | `public/samples/` 预置 2 条高质量样例，离线可播放（Worker 挂时兜底） |
| C-4 | **一键路演脚本** | `scripts/demo-present.sh`：检查服务 → 打开浏览器 → 可选自动提交预设 |
| C-5 | **合规页脚** | 链到 `COMPLIANCE.md` 摘要：MIT / SA3 Community License |
| C-6 | **多语言壳** | i18n 结构（中/英），先覆盖 UI 文案，表单预设双语 |

**验收：** 断网（仅局域网）环境下可完成演示；Worker 故障时可播放缓存样例并说明。

---

### Phase D — 集成深化（P3，~4d，可选）

**目标：** Demo 即「活文档」，降低 API 接入门槛。

| ID | 任务 | 交付 |
|----|------|------|
| D-1 | **API Explorer -lite** | 只读展示 `POST /v1/jobs` body，随表单联动高亮 |
| D-2 | **轮询可视化** | 开发者模式展示最近 5 次 poll 请求与响应摘要 |
| D-3 | **Python 一键运行** | 页内显示 `minimal_client.py` 片段 + 复制 |
| D-4 | **Webhook 占位** | Post-MVP 功能灰色预告（不实现） |
| D-5 | **OpenAPI 链接** | 链到 `DATA_API.md` 或未来 `openapi.yaml` |

---

## 5. 技术方案

### 5.1 前端结构（建议）

```text
apps/demo/src/
  components/     # Card, Badge, Timeline, Player, PresetChips, ErrorBanner
  scenes/         # GameScene, VocalScene（场景 Tab 内容）
  hooks/          # useJobPoll（已有）, useInferenceHealth, usePresets
  presets/        # curated JSON（prompt/lyrics/mode/duration）
  i18n/           # zh.json, en.json（Phase C）
  styles/         # tokens.css, layout.css
  App.tsx         # 编排
```

**依赖增量（克制）：**

| 包 | 用途 | 阶段 |
|----|------|------|
| `wavesurfer.js` | 波形 | B |
| `clsx` | 条件 class | B |
| 无新增路由库 | 保持单页 | — |

### 5.2 Gateway / BFF 扩展（按需）

| 端点 | 说明 | 阶段 |
|------|------|------|
| `GET /demo/api/v1/health/inference` | 已有；前端展示 `lm_model` / `mode` | A |
| `GET /demo/meta` | 返回版本号、局域网 base URL、合规摘要 | C |
| 静态 `samples/*.wav` | 放在 `apps/demo/public/samples/` | C |

**原则：** 能放前端的不放 BFF；必须保密的仍在 Gateway 注入 Key。

### 5.3 状态与存储

| 数据 | 存储 | 说明 |
|------|------|------|
| 最近任务 | `sessionStorage` | 扩展到 20 条，存 `{job_id, mode, status, created_at}` |
| 用户表单草稿 | `localStorage` | 刷新不丢（可选） |
| 预设 | 静态 JSON | 随版本发布 |

---

## 6. UI / 品牌规范（Demo v2）

在 [DEMO.md §4](../DEMO.md) 基础上扩展：

| 项 | MVP | Demo v2 |
|----|-----|---------|
| 最大宽度 | 720px | 1200px（双栏） |
| 主色 | `#3b82f6` | 保留；增加场景色：游戏 `#8b5cf6`、人声 `#ec4899` |
| 字体 | system-ui 14px | 标题 24px Hero；正文 14–16px |
| 组件 | 原生 input | Card 阴影 `0 4px 24px #0003`；Badge 圆角 pill |
| 动效 | 无 | 状态切换 150ms；生成中 pulse |

**品牌文案（建议）：**

- 产品名：**MusicSaas**
- 副标题：本地双引擎音乐生成 API 演示
- 引擎标：ACE-Step 1.5（人声）· Stable Audio 3（BGM）

---

## 7. 预设内容（首批）

### 7.1 游戏 BGM

| 名称 | prompt | duration |
|------|--------|----------|
| 暗黑地牢 | `dark dungeon ambient, tense, no vocals, instrumental` | 60s |
| 草原探索 | `open world exploration, peaceful, orchestral, no vocals` | 90s |
| Boss 战 | `epic boss battle, intense drums, no vocals` | 45s |

### 7.2 人声

| 名称 | mode | 要点 |
|------|------|------|
| 日系抒情 | `vocal_lyrics` | j-pop, female vocal + 简短中英歌词 |
| 说唱描述 | `vocal_desc` | hip-hop, male vocal, city night |
| 游戏主题曲 | `game_theme_vocal` | epic orchestral + 中文歌词副歌 |

预设文件：`apps/demo/src/presets/index.json`（Phase A 落地）。

---

## 8. 测试与验收

### 8.1 新增 Demo 验收用例

| ID | 用例 | 预期 |
|----|------|------|
| D-10 | 点击预设「暗黑地牢」 | 表单填充，mode=`game_bgm` |
| D-11 | generating 过程中 | 时间线高亮当前阶段，按钮 disabled |
| D-12 | Worker down | 顶部 Banner，生成按钮 disabled |
| D-13 | 完成后 | 可复制 job_id；下载 WAV 成功 |
| D-14 | `?demo=1` | 进入演示模式，预设自动可见 |
| D-15 | iPad 1024 宽度 | 双栏或单栏无横向滚动 |

### 8.2 自动化

| 工具 | 范围 |
|------|------|
| Playwright | D-10 ~ D-13（headless） |
| 现有 `acceptance-demo-web.py` | 扩展 smoke |
| 人工 | 路演彩排清单（附录 A） |

---

## 9. 里程碑与排期（建议）

| 里程碑 | 内容 | 工期 | 依赖 |
|--------|------|------|------|
| **M1** | Phase A 完成，路演可用 | 3 天 | MLX 已通 |
| **M2** | Phase B 视觉升级 | 5 天 | M1 |
| **M3** | Phase C 运营 / 局域网 | 3 天 | M2 |
| **M4** | Phase D 集成文档（可选） | 4 天 | M2 |

**并行：** 预设文案 / 样例音频可与其他阶段并行准备。

---

## 10. 风险与缓解

| 风险 | 缓解 |
|------|------|
| MLX 首次生成慢，路演冷场 | 会前跑 `mac-mlx-test.sh` 预热；C-3 缓存样例兜底 |
| BGM 已为 SA3 MLX | 输出卡标注引擎 Stable Audio 3 · 不同 prompt 音色不同 |
| 波形库增大包体 | 懒加载 `wavesurfer`；或 Phase B 降为简易 Canvas |
| 范围膨胀成 SaaS | 本计划 §2.2 边界；每 Phase PR review |
| 移动端布局返工 | Phase B 先定断点再写组件 |

---

## 11. 执行顺序（推荐）

```text
A-1 预设 → A-3 错误卡 → A-4 离线 Banner → A-2 时间线
  → A-5 骨架屏 → A-6 任务卡片 → A-7 验收
    → B-1 设计系统 → B-2 双栏 → B-3 Hero/Tab
      → B-5 元数据 → B-6 波形 → B-7 集成面板
        → C-1~C-6 路演包 → D-* 按需
```

---

## 12. 签字（完成后填写）

| 阶段 | 完成条件 | 日期 |
|------|----------|------|
| Phase A | D-10~D-13 PASS，路演彩排通过 | 2026-08-23 ✅ |
| Phase B | 投屏演示通过，视觉评审 | 2026-08-23 ✅ |
| Phase C | 局域网 + 样例兜底验证 | 2026-08-23 ✅ |
| Phase D | 集成面板可用（可选） | 2026-08-23 ✅（JSON/cURL/Python + `?dev=1` 轮询） |

---

## 附录 A — 路演前检查清单

- [ ] `bash scripts/mac-services-up.sh` 或等价服务全部 ok
- [ ] `curl http://127.0.0.1:8080/demo/api/v1/health/inference` → ace/sa3 ok
- [ ] 浏览器打开 `http://192.168.0.199:8080/demo/`
- [ ] 各跑一条：游戏 BGM 预设 + 人声预设
- [ ] 确认音频可播放、可下载
- [ ] 准备 COMPLIANCE 一句话说明（MIT / SA3 登记）

---

*关联文档：[DEMO.md](../DEMO.md) · [PRD.md](../../PRD.md) · [COMPLIANCE.md](../COMPLIANCE.md) · [M1-benchmark.md](./M1-benchmark.md)*
