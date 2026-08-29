# BeatScape Stage1 双资产改造清单（PRD §6.0.27）

> **权威**：`docs/PRD-BEATSCAPE.md` v1.9.2 · 生成顺序 · catalog 字段  
> **现状**：6 首仅有 **游戏切片** `audio.m4a`（60–75s）；`stream_duration_sec` 为计划值，**无** `stream_audio` / 母带  
> **工具**：`scripts/beatscape-ingest-stream.py` · `scripts/beatscape-chartgen.py` · `scripts/beatscape-audit.py`

---

## 1. 原则（别搞混）

| 概念 | Stage1 真值 | 要不要重生成 |
|------|-------------|--------------|
| **游戏切片** `duration_sec` | **60–75s 不变**（#05=60，其余 75） | ❌ 不必为「PRD 改长度」整批重做 |
| **流媒体完整版** `stream_duration_sec` | **2:30–3:30**（见下表） | ✅ **要补生成**（当前没有文件） |
| **精剪关系** | 切片应是母带的 **时间轴子集** | ⚠️ 现有 75s 若是「只生成短曲」，建议 **从母带重剪** 替换 `audio.m4a` |

---

## 2. 六首参数表（生成 + 入库）

| # | track_id | 风格包 | BPM | **游戏切片** `duration_sec` | **流媒体目标** `stream_duration_sec` | 预览 stem | SA3 `duration_sec`（job） |
|---|----------|--------|-----|------------------------------|--------------------------------------|-----------|---------------------------|
| 01 | `bs-s1-01` | `bs-edm-main` | 160 | **75** | **198** (3:18) | `01-Neon-Pulse` | 流：**180*** / 剪：**75** |
| 02 | `bs-s1-02` | `bs-pop-hook` | 118 | **75** | **198** | `02-Glass-Horizon` | 流：**180*** / 剪：**75** |
| 03 | `bs-s1-03` | `bs-hiphop-808` | 95 | **75** | **198** | `03-Night-Drive-808` | 流：**180*** / 剪：**75** |
| 04 | `bs-s1-04` | `bs-rnb-groove` | 88 | **75** | **198** | `04-Velvet-Afterhours` | 流：**180*** / 剪：**75** |
| 05 | `bs-s1-05` | `bs-edm-climax` | 170 | **60** | **180** (3:00) | `05-Voltage-Drop` | 流：**180** / 剪：**60** |
| 06 | `bs-s1-06` | `bs-rock-drive` | 132 | **75** | **198** | `06-Chrome-Riff` | 流：**180*** / 剪：**75** |

\* Gateway `game_bgm` 单次 **上限 180s**（`docs/RULES.md`）。目标 198s 可选：  
- **MVP**：先生 **180s** 完整版，`stream_duration_sec` 按实测写入；或  
- **Stage2**：两段 job 拼接至 198–210s（需 `masters/` 拼接脚本，待建）

**生成顺序（强制）**

```text
1. MusicSaas job → 完整版母带 WAV（stream 目标时长）
2. QA：BPM · 响度 · 鼓点清晰度（beatscape-audit.py + 耳听）
3. 从母带精剪游戏切片（对齐 drop / 首拍 1–2.5s · §6.0.8）
4. 仅对切片跑 beatscape-chartgen.py（onset 自动谱）
5. 转码入库 + 更新 catalog.json
```

---

## 3. 目录与文件约定

### 3.1 预览仓（gitignore）`data/beatscape-preview/`

```text
data/beatscape-preview/
├── masters/
│   ├── 01-Neon-Pulse.wav          # 流媒体母带（完整版）
│   └── …
├── stream/
│   ├── bs-s1-01-stream.m4a        # 可选：已转码完整版
│   └── 01-Neon-Pulse-full.m4a
├── clips/                         # 建议新增：精剪切片 WAV
│   └── 01-Neon-Pulse-game.wav     # 75s 游戏切片源
├── 01-Neon-Pulse.m4a              # legacy：当前游戏切片（可被 clips 替代）
└── serve.py
```

### 3.2 游戏 public 目录 `apps/beatscape/public/catalog/{track_id}/`

| 文件 | 用途 | Stage1 现状 |
|------|------|-------------|
| `audio.m4a` | **游戏切片**（对局 + 谱面） | ✅ 有 |
| `stream.m4a` | **流媒体完整版** | ❌ 缺 |
| `easy.json` / `standard.json` / `hard.json` | 谱面 | ✅ 有（onset-v1） |
| `cover.png` | 封面 | ✅ 有 |
| `preview_48s.m4a` | 营销 Instant Demo（可选） | ❌ 缺 |

### 3.3 catalog.json 字段

| 字段 | 必填 | 示例 | 说明 |
|------|------|------|------|
| `duration_sec` | ✅ | `75` | 游戏切片时长（秒） |
| `audio` | ✅ | `/catalog/bs-s1-01/audio.m4a` | 游戏切片 URL |
| `stream_duration_sec` | 计划/实测 | `198` | 完整版时长；无文件时可 `--targets-only` |
| `stream_audio` | 有完整版时 | `/catalog/bs-s1-01/stream.m4a` | 完整版 m4a |
| `stream_app_url` | 引流时 | `https://…/track/bs-s1-01` | MusicSaas App 深链；或 env `VITE_STREAM_APP_URL` |
| `audio_master` | 推荐 | `masters/bs-s1-01.wav` | 仓内母带路径（audit 用，可不暴露给浏览器） |
| `preview` | 可选 | `/catalog/bs-s1-01/preview_48s.m4a` | ≤48s 营销预览 |

---

## 4. 精剪规则（游戏切片从母带切）

对齐 PRD §6.0.8：

| 规则 | 要求 |
|------|------|
| 首音 | 切片内开局后 **1.0–2.5s** 有清晰鼓点 |
| #01 Instant | `drop` 起点 ≤ 开局后 **8s** |
| 切片长度 | #01–04、06：**75s**；#05：**60s** |
| 切点 | 优先包含完整 **build → drop → groove**；`outro` 可截断 |
| 审计 | 切片波形时间轴 ⊆ 母带；记录 `clip_t0` / `clip_t1`（可写入 chart `beat_map`） |

**建议切片起点（人工耳听后微调）**

| track_id | 建议 `clip_t0`（母带秒） | 切片长 | 备注 |
|----------|-------------------------|--------|------|
| `bs-s1-01` | 待测（通常 0–15s 内找 drop） | 75s | Drop≤8s |
| `bs-s1-02` | 待测 | 75s | 新手曲，前段别太稀 |
| `bs-s1-03` | 待测 | 75s | BPM 95，勿 double-time 显示 |
| `bs-s1-04` | 待测 | 75s | 长按段落要够 |
| `bs-s1-05` | 待测 | 60s | 高密度段 |
| `bs-s1-06` | 待测 | 75s | Rock riff 清晰 |

---

## 5. MusicSaas 生成 Job 草案

`mode`: **`game_bgm`** · `engine`: **stable-audio-3**

### 5.1 流媒体完整版（第一步）

```json
{
  "mode": "game_bgm",
  "duration_sec": 180,
  "prompt": "<PRD §6.0.10 对应曲 prompt> + full length pop/edm single, 3 minute structure, intro build drop groove outro, chart-friendly drums, instrumental, beatscape original"
}
```

导出：**44.1kHz stereo WAV** → `data/beatscape-preview/masters/{stem}.wav`

### 5.2 游戏切片

**不要**再单独生成 75s 短 job（违反 §6.0.27）。从母带 `ffmpeg` / `afconvert` 精剪：

```bash
# 示例（t0 需耳听确定）
ffmpeg -y -ss 12.0 -t 75 -i masters/01-Neon-Pulse.wav \
  -c:a aac -b:a 256k clips/01-Neon-Pulse-game.m4a
```

再入库：`clips/*.m4a` → `public/catalog/{id}/audio.m4a`

---

## 6. 入库命令流水线

```bash
# 0. 生成母带放入 data/beatscape-preview/masters/*.wav

# 1. 精剪游戏切片 → preview/*.m4a 或 clips/（需 clip 脚本，见下步）

# 2. 游戏切片 + 旧版 cover 入库（若替换 audio）
python3 scripts/beatscape-ingest-stage1.py   # 或仅复制 audio 的轻量脚本

# 3. 流媒体完整版入库 + 更新 catalog
python3 scripts/beatscape-ingest-stream.py

# 4. onset 自动谱（仅针对新 audio.m4a）
python3 scripts/beatscape-chartgen.py

# 5. QA
pnpm audit:beatscape

# 6. 仅设置计划 stream 时长（尚无完整版文件时）
python3 scripts/beatscape-ingest-stream.py --targets-only
```

**环境变量（Web 引流）**

```bash
# apps/beatscape/.env
VITE_STREAM_APP_URL=https://your-musicsaas-app.example/track
```

---

## 7. QA 闸门

| 检查 | 工具 / 门槛 |
|------|-------------|
| 游戏切片时长 | `duration_sec` ±1.5s |
| 流媒体 ≥ 游戏 ×1.8 | `beatscape-audit.py` `catalog.stream_duration` |
| `stream_audio` 文件存在 | 有 CTA 时必须 |
| 谱面 onset 对齐 | `chart.onset.align` PASS |
| 耳听 | 全表 §6.0.6-A 验收映射 |
| 切片 ⊆ 母带 | 人工 + 可选波形对齐脚本 |

---

## 8. 产品/UI（已就绪）

- `StreamFullCTA`：Results / Track 页「Hear the full track」  
- 有 `stream_duration_sec` 无 `stream_audio` 时显示 **Coming soon**  
- 接入 `stream_audio` + `stream_app_url` 后按钮可点

---

## 9. 执行优先级（建议）

| 优先级 | 曲目 | 动作 |
|--------|------|------|
| P0 | #01 Neon Pulse | 母带 180s → 精剪 75s → 重跑 chart → stream 入库 |
| P0 | #02 Glass Horizon | 同上（新手漏斗） |
| P1 | #05 Voltage Drop | 母带 180s → 精剪 **60s** |
| P1 | #03 / #04 / #06 | 批量补母带 + 切片 |
| P2 | 全表 | `preview_48s.m4a` · `stream_app_url` 接 MusicSaas App |

---

## 10. 待建脚本（可选下一迭代）

| 脚本 | 职责 |
|------|------|
| `beatscape-clip-game.py` | 从 `masters/*.wav` 按 `clip_t0` + `duration_sec` 输出 `audio.m4a` |
| `beatscape-stitch-stream.py` | 两段 SA3 job 拼接至 198s+（突破 180s 上限） |
| `beatscape-ingest-stage1.py` | 改为 **只复制 clip**，不再 `build_chart` 占位（chart 交给 chartgen） |

---

## 11. 与「跟拍」的关系

- **补完整版** ≠ 解决跟拍；跟拍靠 **onset 谱面**（已完成 v1）。  
- **从母带重剪 75s** 可能改善切片鼓点质量 → 值得做，但 **不必** 为 PRD 时长去「把游戏曲改成 3 分钟」。
