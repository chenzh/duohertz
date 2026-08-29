# BeatScape Stage2 交付清单（6 → 10 首）

> **权威**：`docs/PRD-BEATSCAPE.md` §6.0.6-B · §6.0.17b · §6.0.27  
> **路线图**：`apps/beatscape/catalog-roadmap.json`  
> **生成 Job**：`scripts/beatscape-stage2-manifest.json`  
> **元数据真值**：`scripts/beatscape-track-registry.py`

---

## 1. 目标

| 项 | 值 |
|----|-----|
| Stage2 累计 | **10 首**（+4） |
| 本批新增 | #07–#10 |
| 游戏切片 | **90s**（Stage2 默认） |
| 流媒体完整版 | **180–198s**（双资产 **强制**） |
| 新玩法 | **Slide**（#07 Slide City 主验） |

---

## 2. 四首参数表

| # | track_id | 曲名 | 曲风 | BPM | 风格包 | District | 玩法 |
|---|----------|------|------|-----|--------|----------|------|
| 07 | `bs-s2-01` | Slide City | EDM | 140 | `bs-edm-main` | Slide District | **Slide 主验** |
| 08 | `bs-s2-02` | Skyline Hook | Pop | 128 | `bs-theme-en` | Skyline Hook | 英文人声 |
| 09 | `bs-s2-03` | Blue Hour Loop | Pop | 120 | `bs-chill-pop` | Glass Rim | Practice |
| 10 | `bs-s2-04` | Asphalt Anthem | Rock | 148 | `bs-rock-drive` | Chrome Yard | 高速摇滚 |

预览文件名（放入 `data/beatscape-preview/`）：

```text
07-Slide-City.m4a
08-Skyline-Hook.m4a
09-Blue-Hour-Loop.m4a
10-Asphalt-Anthem.m4a
```

母带路径：`data/beatscape-preview/masters/{preview_stem}.wav`

---

## 3. 生成顺序（强制 · 同 Stage1 双资产）

```text
1. MusicSaas job → 180s 母带 WAV（见 stage2-manifest.json）
2. QA：BPM · 响度 · 鼓点清晰
3. 从母带精剪 90s 游戏切片 → preview/*.m4a
4. beatscape-ingest-stage2.py → 合并 catalog（不覆盖 Stage1）
5. beatscape-chartgen.py → onset 谱 + Slide City 自动 Slide
6. beatscape-ingest-stream.py → stream.m4a 入库
7. pnpm audit:beatscape + pnpm catalog:beatscape
```

---

## 4. 入库命令

```bash
# 检查预览音频是否就绪
python3 scripts/beatscape-ingest-stage2.py --dry-run

# 入库游戏切片 + catalog 元数据
python3 scripts/beatscape-ingest-stage2.py

# 单首
python3 scripts/beatscape-ingest-stage2.py --track bs-s2-01

# 自动谱（Slide City 含 slide）
python3 scripts/beatscape-chartgen.py --track bs-s2-01

# 流媒体完整版
python3 scripts/beatscape-ingest-stream.py

# QA + 缺口
pnpm audit:beatscape
pnpm catalog:beatscape -- --stage 2
```

---

## 5. Slide 谱面规则（#07）

| 档位 | Slide 段数 |
|------|------------|
| Easy | **0** |
| Standard | **0–2** / 曲 |
| Hard | **≤ 8** / 曲 |

- `|to - lane| === 1`  
- `intro` 段禁止 Slide（phase < 28%）  
- audit：`chart.slide.required` 对 Slide City Standard/Hard 无 Slide 会 WARN  

---

## 6. QA 闸门（Stage2 增量）

| 检查 | 门槛 |
|------|------|
| `stream_audio` 存在 | Stage2+ **FAIL** 若缺 |
| `stream_duration_sec` ≥ `duration_sec` × 1.8 | 强制 |
| Slide City Std/Hard 含 slide | WARN |
| Stage1 曲仍禁止 slide | FAIL |
| 曲库累计 | `pnpm catalog:beatscape -- --stage 2` → **10/10** |

---

## 7. 执行优先级

| 优先级 | 曲目 | 原因 |
|--------|------|------|
| P0 | `bs-s2-01` Slide City | Slide 玩法解锁 |
| P0 | `bs-s2-02` Skyline Hook | 英文人声验收 |
| P1 | `bs-s2-03` Blue Hour Loop | Practice 练度 |
| P1 | `bs-s2-04` Asphalt Anthem | 高速 Rock |

---

## 8. 当前状态

| 项 | 状态 |
|----|------|
| 路线图槽位 | ✅ 已定 |
| ingest / chartgen / audit 脚本 | ✅ 已接 |
| 预览音频 | ❌ 待 MusicSaas 生成 |
| catalog 上架 | ❌ 6/10 |

音频就绪后跑 §4 命令即可补齐至 **10 首**。
