# BeatScape Stage 6 — 曲库扩容 50 首（35 → 85）

> **状态**：文档定稿 · 生成中（MLX 真推理流水线）
> **更新**：2026-08-30
> **槽位**：`bs-s4-11`…`15`（5）+ `bs-s5-01`…`10`（10）+ `bs-s6-01`…`35`（35）= **50 首**
> **声波真值**：[`BEATSCAPE-SONIC-DIRECTION.md`](./BEATSCAPE-SONIC-DIRECTION.md) — 车载宽声场 + 都市爵士战斗感（RESONANCE）
> **关联**：[`BEATSCAPE-STAGE4-RESONANCE-MUSIC.md`](./BEATSCAPE-STAGE4-RESONANCE-MUSIC.md) · [`BEATSCAPE-CATALOG-ROADMAP.md`](./BEATSCAPE-CATALOG-ROADMAP.md) · [`catalog-roadmap.json`](../apps/beatscape/catalog-roadmap.json)

---

## 1. 为什么要做这一波

正式版 50 首目标在 Stage 4 第一波后停在 **35/50**。本波一次性补齐：

| 批次 | 槽位 | 数量 | 职责 |
|------|------|------|------|
| `s4-wave-3` | `bs-s4-11`…`15` | 5 | Stage 4 第三波，补齐 Stage 4 累计 40 |
| `s5-formal` | `bs-s5-01`…`10` | 10 | Stage 5 正式版收官，达成 **50/50** |
| `s6-expansion` | `bs-s6-01`…`35` | 35 | 正式版之后的首轮扩容，达成 **85/85** |

**一句话**：把曲库从「能验收」推进到「能撑住 Library 筛选与长期月更」的量级，同时**全部**按 RESONANCE 声波标准生成——不复用旧曲，不重生成已上架的 35 首。

---

## 2. 法律边界（沿用 Stage 4，必读）

| 层级 | 可以借 | 不能碰 |
|------|--------|--------|
| 律动 / 和声 | 切分 funk、acid jazz 和弦、铜管 stab、neo-soul、nu-disco 滤波 | 任何已知 OST 的主旋律动机与标志性 intro |
| 制作审美 | 车载宽动态、西方流行混音、night-drive 能量 | 复刻某曲的分轨编排与过门句式 |
| 人声 | 英文人声（既有 Stage 2–3 曲） | **本波 50/50 全部器乐曲**；日语歌词、Vocaloid 音色 |

**Prompt 禁止词**（`scripts/beatscape-stage6-specs.py` → `BANNED_TOKENS`，`validate()` 强制拦截）：

```text
persona, atlus, megami, megaten, p5, royal, anime, j-pop, japanese, vocaloid,
velvet room, tarot, phantom thief, life will change, beneath the mask, last surprise
```

曲名刻意避开 `Velvet`（视觉盲测回退项）与任何 JRPG 叙事符号。

---

## 3. 配额设计（本波 50 首）

### 3.1 五曲风

沿用正式版 50 首的比例，本波 50 首同比例复制，扩容后累计目标按 ×1.7 缩放：

| 曲风 | 已上架 35 | 本波新增 50 | **扩容后 85** |
|------|-----------|-------------|----------------|
| EDM | 8 | **12** | **20** |
| Pop | 7 | **10** | **17** |
| Hip-hop | 7 | **10** | **17** |
| R&B | 6 | **8** | **14** |
| Rock | 7 | **10** | **17** |
| **合计** | **35** | **50** | **85** |

### 3.2 运营标签

| 标签 | 已上架 35 | 本波新增 50 | **扩容后 85** |
|------|-----------|-------------|----------------|
| Hot Chart Style | 13 | **13** | **26** |
| Viral Style | 7 | **13** | **20** |
| Classic Style | 11 | **9** | **20** |
| New Release | 4 | **15** | **19** |

扩容曲优先打 **New Release**（月更语义）。

### 3.3 听感 Vibe / 难度分层

| Vibe | 本波 50 | 扩容后 85 |
|------|---------|-----------|
| battle | 15 | 30 |
| groove | 14 | 22 |
| night-drive | 11 | 14 |
| chill | 10 | 19 |

| 难度 | 本波 50 | 扩容后 85 |
|------|---------|-----------|
| easy | 14 | 24 |
| standard | 24 | 43 |
| hard | 12 | 18 |

---

## 4. Style Pack 扩展

Stage 4 的 6 个 `bs-resonance-*` 包保留，Stage 6 新增 **6 个**，共 12 个覆盖 50 首（每包 1–6 首，避免听感重复）：

| preset_id | 曲风 | BPM | Prompt 核心 |
|-----------|------|-----|-------------|
| `bs-resonance-overdrive` | EDM | 174 | high-speed night drive, rolling bass, wide mix |
| `bs-resonance-nightfall` | EDM | 152 | moody nightfall build, filtered pads, steady four-on-floor |
| `bs-resonance-glassdrive` | Pop | 118 | glass rim pop drive, bright rhodes, crisp snare |
| `bs-resonance-trapline` | Hip-hop | 94 | trapline 808, sparse hats, swagger bass |
| `bs-resonance-satin` | R&B | 90 | satin neo-soul, warm rhodes, relaxed pocket |
| `bs-resonance-chromeline` | Rock | 140 | chrome rock drive, wah guitar accents, tight kit |

**通用后缀（每首强制，见 `SUFFIX`）**：

```text
clear 4/4 beat, night drive energy, wide stereo mix, chart-friendly drums,
beatscape original, owned rights, rhythm game chart music, instrumental,
no vocals, loop-friendly, western production
```

每条 Prompt 由 `genre lead + BPM + preset hint + motif + district keywords + 后缀` 拼装；
`motif` 为每首独有的意象短语（合计 ≥2 个主题关键词，满足 PRD §1.3a 主题闸门）。

---

## 5. 曲目表（50 首 · 定名 · 生成中）

| # | track_id | 曲名 | 艺人 | 曲风 | BPM | preset_id | District | 标签 | Vibe | 难度 | Slide |
|---|----------|------|------|------|-----|-----------|----------|------|------|------|-------|
| 1 | `bs-s4-11` | **Ember Pulse Line** | Halcyon Flux | EDM | 158 | `bs-resonance-brass` | Pulse Core | Hot Chart Style | battle | standard | — |
| 2 | `bs-s4-12` | **Gridline Cipher** | Subline | Hip-hop | 96 | `bs-resonance-funkhop` | Night Grid | Classic Style | groove | standard | — |
| 3 | `bs-s4-13` | **Halftone Skyline** | Luma Rim | Pop | 120 | `bs-resonance-rhodes` | Glass Rim | Viral Style | groove | easy | — |
| 4 | `bs-s4-14` | **Chrome Mile Anthem** | Iron Echo | Rock | 134 | `bs-resonance-stomp` | Chrome Yard | New Release | battle | hard | — |
| 5 | `bs-s4-15` | **Neon Scape Drift** | Nova Circuit | EDM | 166 | `bs-resonance-climax` | Pulse Core | Viral Style | night-drive | standard | — |
| 6 | `bs-s5-01` | **Pulse Overpass** | Halcyon Flux | EDM | 160 | `bs-resonance-brass` | Pulse Core | Hot Chart Style | battle | standard | — |
| 7 | `bs-s5-02` | **Glass Turnpike** | Ada North | Pop | 124 | `bs-resonance-rhodes` | Glass Rim | New Release | groove | easy | — |
| 8 | `bs-s5-03` | **Nightlane Static** | Low Voltage | Hip-hop | 100 | `bs-resonance-funkhop` | Night Grid | Classic Style | night-drive | standard | — |
| 9 | `bs-s5-04` | **Afterhours Satin** | Mira Lane | R&B | 90 | `bs-resonance-neosoul` | Afterhours Lane | Classic Style | chill | easy | — |
| 10 | `bs-s5-05` | **Chrome Vector** | Redline Co. | Rock | 134 | `bs-resonance-stomp` | Chrome Yard | Hot Chart Style | battle | standard | yes |
| 11 | `bs-s5-06` | **Overload Scape** | Gridline | EDM | 170 | `bs-resonance-climax` | Pulse Core | Hot Chart Style | battle | hard | — |
| 12 | `bs-s5-07` | **Halftone Harbour** | Kite Solar | Pop | 116 | `bs-resonance-glassdrive` | Glass Rim | Classic Style | chill | easy | — |
| 13 | `bs-s5-08` | **Gridlock Anthem** | Subline | Hip-hop | 94 | `bs-resonance-trapline` | Night Grid | Viral Style | groove | standard | — |
| 14 | `bs-s5-09` | **Satin Nightline** | Verity Lane | R&B | 88 | `bs-resonance-neosoul` | Afterhours Lane | New Release | chill | easy | — |
| 15 | `bs-s5-10` | **Iron Boulevard** | Iron Echo | Rock | 142 | `bs-resonance-chromeline` | Chrome Yard | Hot Chart Style | battle | hard | — |
| 16 | `bs-s6-01` | **Afterglow Scape** | Pale Ember | EDM | 162 | `bs-resonance-brass` | Pulse Core | Hot Chart Style | battle | standard | — |
| 17 | `bs-s6-02` | **Halftone Bloom** | Luma Rim | Pop | 120 | `bs-resonance-glassdrive` | Glass Rim | Viral Style | groove | easy | — |
| 18 | `bs-s6-03` | **Lowbeam Groove** | Low Voltage | Hip-hop | 98 | `bs-resonance-funkhop` | Night Grid | Classic Style | groove | standard | — |
| 19 | `bs-s6-04` | **Moonlit Turnpike** | Verity Lane | R&B | 92 | `bs-resonance-neosoul` | Afterhours Lane | New Release | chill | easy | — |
| 20 | `bs-s6-05` | **Chrome Foundry** | Iron Echo | Rock | 136 | `bs-resonance-stomp` | Chrome Yard | New Release | battle | hard | — |
| 21 | `bs-s6-06` | **Neon Overpass** | Gridline | EDM | 166 | `bs-resonance-climax` | Pulse Core | Hot Chart Style | battle | hard | — |
| 22 | `bs-s6-07` | **Glass Verandah** | Soft Circuit | Pop | 118 | `bs-resonance-glassdrive` | Glass Rim | New Release | chill | easy | — |
| 23 | `bs-s6-08` | **Grid Alley Flow** | Subline | Hip-hop | 96 | `bs-resonance-trapline` | Night Grid | Viral Style | groove | standard | — |
| 24 | `bs-s6-09` | **Voltage Causeway** | Redline Co. | Rock | 140 | `bs-resonance-chromeline` | Chrome Yard | Hot Chart Style | battle | hard | — |
| 25 | `bs-s6-10` | **Scape Ignition** | Nova Circuit | EDM | 168 | `bs-resonance-climax` | Pulse Core | Viral Style | night-drive | standard | — |
| 26 | `bs-s6-11` | **Prism Skyline** | Kite Solar | Pop | 122 | `bs-resonance-rhodes` | Glass Rim | Viral Style | groove | standard | — |
| 27 | `bs-s6-12` | **Nightlane Drift** | Low Voltage | Hip-hop | 102 | `bs-resonance-funkhop` | Night Grid | Classic Style | night-drive | standard | — |
| 28 | `bs-s6-13` | **Satin Underpass** | Mira Lane | R&B | 90 | `bs-resonance-satin` | Afterhours Lane | New Release | chill | easy | — |
| 29 | `bs-s6-14` | **Iron Skyline Riff** | Iron Echo | Rock | 144 | `bs-resonance-chromeline` | Chrome Yard | Hot Chart Style | battle | hard | — |
| 30 | `bs-s6-15` | **Midnight Overpass** | Halcyon Flux | EDM | 174 | `bs-resonance-overdrive` | Pulse Core | New Release | night-drive | hard | — |
| 31 | `bs-s6-16` | **Neon Chorus Line** | Ada North | Pop | 126 | `bs-resonance-rhodes` | Glass Rim | New Release | groove | standard | — |
| 32 | `bs-s6-17` | **Static Boulevard** | Subline | Hip-hop | 94 | `bs-resonance-trapline` | Night Grid | New Release | groove | standard | — |
| 33 | `bs-s6-18` | **Afterhours Cadence** | Verity Lane | R&B | 88 | `bs-resonance-satin` | Afterhours Lane | Viral Style | chill | easy | — |
| 34 | `bs-s6-19` | **Chrome Boulevard** | Redline Co. | Rock | 132 | `bs-resonance-stomp` | Chrome Yard | Classic Style | battle | standard | — |
| 35 | `bs-s6-20` | **Pulse Foundry** | Halcyon Flux | EDM | 158 | `bs-resonance-brass` | Pulse Core | Hot Chart Style | night-drive | standard | — |
| 36 | `bs-s6-21` | **Halftone Parade** | Luma Rim | Pop | 120 | `bs-resonance-glassdrive` | Glass Rim | Viral Style | groove | standard | — |
| 37 | `bs-s6-22` | **Grid Circuit Flow** | Low Voltage | Hip-hop | 100 | `bs-resonance-funkhop` | Night Grid | Viral Style | groove | standard | — |
| 38 | `bs-s6-23` | **Lantern Scape** | Quiet Neon | R&B | 94 | `bs-resonance-neosoul` | Afterhours Lane | New Release | chill | easy | — |
| 39 | `bs-s6-24` | **Asphalt Overdrive** | Iron Echo | Rock | 144 | `bs-resonance-chromeline` | Chrome Yard | Hot Chart Style | battle | hard | — |
| 40 | `bs-s6-25` | **Halftone Ignition** | Kite Solar | EDM | 152 | `bs-resonance-nightfall` | Pulse Core | Viral Style | night-drive | standard | — |
| 41 | `bs-s6-26` | **Prism Boulevard** | Kite Solar | Pop | 122 | `bs-resonance-rhodes` | Glass Rim | New Release | groove | easy | — |
| 42 | `bs-s6-27` | **Nightfall Cipher** | Subline | Hip-hop | 92 | `bs-resonance-trapline` | Night Grid | Viral Style | night-drive | standard | — |
| 43 | `bs-s6-28` | **Amber Afterhours** | Mira Lane | R&B | 90 | `bs-resonance-neosoul` | Afterhours Lane | Classic Style | chill | easy | — |
| 44 | `bs-s6-29` | **Riffline Overdrive** | Redline Co. | Rock | 142 | `bs-resonance-chromeline` | Chrome Yard | Viral Style | battle | hard | — |
| 45 | `bs-s6-30` | **Grid Apex Run** | Nova Circuit | EDM | 170 | `bs-resonance-climax` | Pulse Core | Hot Chart Style | night-drive | hard | — |
| 46 | `bs-s6-31` | **Skyline Cadence** | Soft Circuit | Pop | 124 | `bs-resonance-rhodes` | Glass Rim | New Release | groove | standard | — |
| 47 | `bs-s6-32` | **Alley Voltage** | Low Voltage | Hip-hop | 98 | `bs-resonance-funkhop` | Night Grid | Classic Style | night-drive | standard | — |
| 48 | `bs-s6-33` | **Scape Lullaby** | Quiet Neon | R&B | 88 | `bs-resonance-satin` | Afterhours Lane | New Release | chill | easy | — |
| 49 | `bs-s6-34` | **Foundry Boulevard** | Iron Echo | Rock | 134 | `bs-resonance-stomp` | Chrome Yard | Hot Chart Style | battle | standard | yes |
| 50 | `bs-s6-35` | **Zenith Scape** | Pulse Atlas | EDM | 172 | `bs-resonance-overdrive` | Pulse Core | New Release | night-drive | hard | — |

**时长真值**：游戏切片 **120s** · 流媒体完整版 **216s**（双资产，PRD §6.0.27）。

**Slide 曲**：`bs-s5-05` Chrome Vector、`bs-s6-34` Foundry Boulevard（Std/Hard 含 slide）。

---

## 6. 入库流水线

```bash
# 0. 同步真值（改 specs 后必跑）
python3 scripts/beatscape-stage6-sync-manifest.py

# 1. 逐首生成（Gateway :8080 + SA3 worker :8102 MLX）
bash scripts/beatscape-stage6-batch-jobs.sh          # 打印 50 条命令
bash scripts/beatscape-stage6-batch-jobs.sh --run    # 顺序执行

# 2. 一键端到端
python3 scripts/beatscape-stage6-pipeline.py --dry-run
python3 scripts/beatscape-stage6-pipeline.py
python3 scripts/beatscape-stage6-pipeline.py --skip-generate   # 母带已就绪时

# 3. 分步
python3 scripts/beatscape-clip-game.py --track bs-s6-01 --t0 0 --duration 120
python3 scripts/beatscape-stitch-stream.py --all-stage6
python3 scripts/beatscape-ingest-stage6.py --dry-run
python3 scripts/beatscape-ingest-stage6.py
python3 scripts/beatscape-chartgen.py --track bs-s6-01
pnpm audit:beatscape && pnpm earcheck:beatscape
python3 scripts/beatscape-catalog-status.py --stage 6
```

| 脚本 | 说明 |
|------|------|
| `scripts/beatscape-stage6-specs.py` | 50 首元数据真值 + `validate()` 约束校验 |
| `scripts/beatscape-stage6-sync-manifest.py` | 同步 manifest / vibes / roadmap 三处真值 |
| `scripts/beatscape-stage6-manifest.json` | MusicSaas job 真值（Prompt + BPM） |
| `scripts/beatscape-stage6-batch-jobs.sh` | 打印 / 执行 50 个生成 job |
| `scripts/beatscape-ingest-stage6.py` | 入库（支持 `--batch` / `--track` / `--dry-run`） |
| `scripts/beatscape-stage6-pipeline.py` | 端到端编排 |

---

## 7. Definition of Done（本波 50 首）

- [ ] 50/50 `catalog.json` 可播放 · `rights: owned` · `theme: beatscape`
- [ ] 50/50 母带为 **SA3 MLX 真推理**（立体声 44.1k，非 synth fallback）
- [ ] 50/50 双资产 `stream.m4a` · `pnpm audit:beatscape` **FAIL=0**
- [ ] 50/50 `pnpm earcheck:beatscape` PASS · 首音 1.0–2.5s
- [ ] 曲库累计 **85/85** · `python3 scripts/beatscape-catalog-status.py --stage 6` 缺口为 0
- [ ] 团队耳检：**无人**联想到具体第三方名曲（人工）

---

## 8. 风险与回退

| 风险 | 信号 | 回退 |
|------|------|------|
| synth fallback 混入 | 母带为单声道正弦 | 重启 worker 带 `SA3_FALLBACK_SYNTH=false`，重生成该首 |
| 旋律撞车知名曲 | 耳检脱口而出歌名 | 废弃 job，改 BPM ±4 或换 preset 重生成 |
| 日系听感过重 | 像动漫战斗曲 | Prompt 已强制 `western production`；去掉 Rhodes/铜管其一 |
| 谱面过密 | Hard NPS 超标 | `beatscape-chart-difficulty.py` 降档后重跑 chartgen |
| Prompt 含禁用词 | `validate()` 报错 | 改 motif / 曲名后重跑 sync |

---

## 9. 真值文件索引

| 文件 | 角色 |
|------|------|
| **本文件** | Stage 6 扩容 50 首曲目表与配额真值 |
| `scripts/beatscape-stage6-specs.py` | 机器真值（50 首 + 12 preset + 约束校验） |
| `scripts/beatscape-stage6-manifest.json` | 生成 job 真值 |
| `scripts/beatscape-track-vibes.json` | 85 首 vibe 映射 |
| `apps/beatscape/catalog-roadmap.json` | 85 槽位 + Stage 6 配额 |
| `BEATSCAPE-SONIC-DIRECTION.md` | 全曲库声波真值 |
