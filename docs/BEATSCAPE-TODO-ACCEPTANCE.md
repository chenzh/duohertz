# BeatScape 待办与验收标准

> ## 📦 历史冲刺归档（2026-09-06 起生效）
>
> **本文件不再承载当前待办。** 正文中 27 条未勾选 `- [ ]` 全部属于 2026-08-25 的 Stage1 / Stage2 冲刺，该阶段目标（曲库 25 首）早已被当前 105 首 / 315 张谱覆盖：
> - **当前待办唯一入口**：仓库根 [`TODO.md`](../../TODO.md)
> - **当前上线准备**：[BEATSCAPE-RELEASE-READINESS.md](BEATSCAPE-RELEASE-READINESS.md)
> - **纪律**：不得把本文件的未勾选项回填为当前 TODO，也不得清空勾选态伪造历史完成。仅作历史验收规格与决策依据查阅。

> **取消项优先**：专项真机验收已于 2026-09-06 由用户取消，后续不得从下文历史验收规格自动恢复 TODO。执行状态与发布门禁区别见 [BS-D001](BEATSCAPE-DECISIONS.md#bs-d001)。

> **当前上线准备（2026-09-05）**：见 [BEATSCAPE-RELEASE-READINESS.md](BEATSCAPE-RELEASE-READINESS.md)，105 首 / 315 张谱。本文以下为 Stage1–3 历史验收规格，旧测试数及勾选状态不能充当当前版本的验收证据。

> **更新**：2026-08-25（Stage3 验收）  
> **进度入口**：`SESSION.md` · `pnpm catalog:beatscape`  
> **权威 PRD**：`docs/PRD-BEATSCAPE.md`

## 冲刺状态（Stage3 · 2026-08-25）

| 任务 | 状态 | 证据 |
|------|------|------|
| L1 曲库 25 首 | ✅ | `catalog:beatscape --stage 3` → **25/25** |
| T1 耳检 | ✅ | `earcheck:beatscape` **25/25 PASS** |
| T2–T5 Stage1 双资产 | ✅ | 6/6 `stream.m4a` |
| T6–T8 Stage2 | ✅ | Slide City · **10/10** |
| T9–T12 工具/CI | ✅ | pipeline · vitest · CI job |
| 内容 QA | ✅ | `audit:beatscape` **FAIL=0 WARN=0** |
| T1-A4 #05 60fps | ✅ | rAF 12s smoke：est **120fps** · p95 **9.3ms** · 0 帧 >16ms |

**一键复验（Stage3）**

```bash
pnpm catalog:beatscape -- --stage 3   # 25/25
pnpm audit:beatscape                # FAIL=0
pnpm earcheck:beatscape             # 25/25 PASS
npm --prefix apps/beatscape test    # 17/17
```

---

## 总览

| 阶段 | 目标 | 当前 | 缺口 |
|------|------|------|------|
| Stage 1 手感 | 6 首可玩 + 跟拍 | 6/6 上架 | 耳检微调 |
| Stage 1 双资产 | 6 首 game + stream | 0/6 有 `stream.m4a` | 6 |
| Stage 2 | 10 首累计 | 6/10 | 4 |
| 正式版 | 50 首 | 6/50 | 44 |
| 平台 Harness | CI 日常化 | Basic | Advanced |

---

## P0 — Stage1 手感收尾

### T1 · 人工试听微调（六首）

**待办**

- [ ] 每曲打一局 **Arcade · Standard**（#02 另测 Easy/Casual 引导局）
- [ ] 记录：首音时机、无故 Miss 簇、空按惩罚、高密度稳定性（#05）
- [ ] 若有问题：调 `beatscape-chartgen.py` 的 `TIER_SPEC` / onset 选取，重跑单首

**验收标准**

| # | 标准 | 验证方式 |
|---|------|----------|
| A1 | 六首均完成耳检记录（可写在 `worklog/` 或 PR 备注） | 人工 sign-off |
| A2 | #01 首音在开局后 **1.0–2.5s**；Drop 主观可辨且 ≤8s | 耳听 + chart `sections.drop.t0` |
| A3 | #02 新手局无明显「空按罚分」或连续无故 Miss（≥3 连） | 实机 Casual 一局 |
| A4 | #05 Hard Arcade 全程 **60fps** 无音画漂移（DevTools Performance） | 浏览器实测 |
| A5 | 若重跑谱面：`pnpm audit:beatscape` **FAIL=0** | 命令输出 |

---

## P0 — Stage1 双资产（#01 · #02 优先）

> 清单：`docs/BEATSCAPE-STAGE1-DUAL-ASSET.md`

### T2 · #01 Neon Pulse 双资产

**待办**

- [ ] MusicSaas `game_bgm` 生成 **180s** 母带 → `masters/01-Neon-Pulse.wav`
- [ ] 耳听定 `clip_t0`，精剪 **75s** 游戏切片替换 `audio.m4a`
- [ ] 转码完整版 → `stream.m4a`
- [ ] `beatscape-ingest-stream.py --track bs-s1-01`
- [ ] `beatscape-chartgen.py --track bs-s1-01`（切片变更后）
- [ ] `pnpm audit:beatscape`

**验收标准**

| # | 标准 | 验证方式 |
|---|------|----------|
| B1 | `public/catalog/bs-s1-01/stream.m4a` 存在且可播放 | 文件 + 浏览器 |
| B2 | `stream_duration_sec` ≥ `duration_sec` × **1.8**（75×1.8=135，目标 180+） | catalog.json + audit `catalog.stream_duration` PASS |
| B3 | 游戏切片 `duration_sec` = **75 ±1.5s** | audit / `beatscape-audio.py` |
| B4 | 切片鼓点为母带子集（同一段落听感一致） | 耳听 |
| B5 | `chart.onset.align` 等对齐闸门 **PASS**（无 FAIL） | `pnpm audit:beatscape` |
| B6 | Results/Track 页 `StreamFullCTA` 可点（非 Coming soon） | 实机 UI |

### T3 · #02 Glass Horizon 双资产

**待办**：同 T2，曲目 `bs-s1-02`，切片 **75s**，stem `02-Glass-Horizon`

**验收标准**：同 B1–B6（track_id / 时长替换为 #02）

---

## P1 — Stage1 双资产补齐（#03–#06）

### T4 · #05 Voltage Drop（60s 切片）

**待办**

- [ ] 母带 180s → 精剪 **60s** → stream 入库 → chartgen → audit

**验收标准**

| # | 标准 | 验证方式 |
|---|------|----------|
| C1 | `duration_sec` = **60 ±1.5s** | catalog + audit |
| C2 | 双资产闸门同 B1–B5 | audit |
| C3 | Hard 密度曲耳听无「谱面跟不上鼓点」 | 耳听 Arcade |

### T5 · #03 · #04 · #06 批量双资产

**待办**

- [ ] 三首各：母带 → 75s 切片 → stream → chartgen → audit

**验收标准**

| # | 标准 | 验证方式 |
|---|------|----------|
| D1 | 三首均有 `stream_audio` + 实测 `stream_duration_sec` | audit 无 `catalog.stream_dual` FAIL |
| D2 | Stage1 六首 `pnpm catalog:beatscape` 仍 **6/6 shipped** | 命令输出 |
| D3 | 全表 audit：**FAIL=0** | `pnpm audit:beatscape` |

---

## P1 — Stage2 交付（#07–#10）

> 清单：`docs/BEATSCAPE-STAGE2-DELIVERY.md`

### T6 · 生成四首母带 + 游戏切片

**待办**

- [ ] 按 `scripts/beatscape-stage2-manifest.json` 提交 4 个 MusicSaas job
- [ ] 母带 WAV 入 `data/beatscape-preview/masters/`
- [ ] 精剪 **90s** → `07-Slide-City.m4a` … `10-Asphalt-Anthem.m4a`

**验收标准**

| # | 标准 | 验证方式 |
|---|------|----------|
| E1 | `ingest-stage2 --dry-run` 显示 **4/4 READY** | `pnpm ingest:beatscape-stage2 -- --dry-run` exit 0 |
| E2 | 每首 BPM 检测与标注偏差 **≤ ±3** | audit `audio.bpm` |
| E3 | 首音 1.0–2.5s 内有清晰鼓点 | 耳听 |

### T7 · Stage2 catalog + 谱面 + 流媒体入库

**待办**

- [ ] `pnpm ingest:beatscape-stage2`
- [ ] `beatscape-chartgen.py`（四首；#07 含 Slide）
- [ ] `pnpm ingest:beatscape-stream`（四首双资产）
- [ ] `pnpm audit:beatscape` · `pnpm catalog:beatscape -- --stage 2`

**验收标准**

| # | 标准 | 验证方式 |
|---|------|----------|
| F1 | `catalog.json` 含 **10** 条 track，均可播放 `audio.m4a` | 文件 + Library 页 |
| F2 | `pnpm catalog:beatscape -- --stage 2` → **10/10**，曲风配额与路线图一致 | 命令输出 |
| F3 | Stage2 四首均有 `stream_audio`；`stream_duration_sec` ≥ game×1.8 | audit 无 FAIL |
| F4 | **Slide City** Standard/Hard 含 `slide` 音符；Stage1 六首 **无** slide | audit `chart.slide` |
| F5 | #08 Skyline Hook 人声稀疏可玩（无违规人声渗漏主导） | 耳听 + audit WARN 可接受 |
| F6 | 全库 audit：**FAIL=0** | `pnpm audit:beatscape` |
| F7 | `pnpm --filter @musicsaas/beatscape test` **16/16** | vitest |

### T8 · Slide 玩法实机验收

**待办**

- [ ] #07 Slide City：Std/Hard 各完成一局，验证滑动判定与计分
- [ ] 确认 Stage1 曲目未误出现 Slide UI/谱面

**验收标准**

| # | 标准 | 验证方式 |
|---|------|----------|
| G1 | Slide 完成计 **1** 次判定；`|to-lane|=1` | 实机 + chart JSON |
| G2 | Slide Miss 不导致异常卡死或重复计分 | 实机 |
| G3 | `intro` 段（前 12%）无 Slide 音符 | chart `sections` + 谱面检查 |

---

## P2 — 工具与引流

### T9 · 精剪脚本 `beatscape-clip-game.py`

**待办**

- [ ] 从 `masters/*.wav` 按 `clip_t0` + `duration_sec` 输出游戏切片 m4a
- [ ] 文档接入 Stage1/2 流水线

**验收标准**

| # | 标准 | 验证方式 |
|---|------|----------|
| H1 | 单命令可产出与手工 ffmpeg 等价的 m4a | 对比时长 ±0.1s |
| H2 | README/双资产文档有调用示例 | 文档审查 |

### T10 · 流媒体 App 引流

**待办**

- [ ] 配置 `VITE_STREAM_APP_URL` 或 per-track `stream_app_url`
- [ ] （可选）六首 `preview_48s.m4a` 营销裁剪

**验收标准**

| # | 标准 | 验证方式 |
|---|------|----------|
| I1 | 有 `stream_audio` 的曲目，CTA 跳转正确 URL | 点击 Track/Results CTA |
| I2 | 无 stream 时仍显示 Coming soon（不 404） | 未入库曲 UI |

### T11 · UI 改版推送（若本地未推）

**待办**

- [ ] `git push` 分支 `preview/beatscape-try`（含 Western youth UI commit）

**验收标准**

| # | 标准 | 验证方式 |
|---|------|----------|
| J1 | Remote 含最新 UI + 谱面 + 路线图 commits | `git log origin/...` |

---

## P3 — 平台 Harness

### T12 · Harness Advanced

**待办**

- [ ] CI workflow 跑 `bash scripts/harness.sh all` 或等价档位
- [ ] `print-status.sh` 纳入日常/文档

**验收标准**

| # | 标准 | 验证方式 |
|---|------|----------|
| K1 | PR 上 CI 绿 | GitHub Actions |
| K2 | `bash scripts/print-status.sh` 输出 phase/next 与 SESSION 一致 | 本地命令 |

---

## 远期（Stage 3+ · 不在当前冲刺）

| ID | 待办 | 验收闸门 |
|----|------|----------|
| L1 | 曲库扩至 **25** 首（Stage 3） | `catalog:beatscape --stage 3` → 25/25 |
| L2 | 曲库页搜索/分类/收藏/缓存全开 | PRD §6.0.5 Stage3 功能清单 |
| L3 | 扩至 **40** / **50** 首 | 路线图 `genre_targets.by_stage` |
| L4 | Stage4+ 服务端排行榜 | PRD §6.0.15；此前仅 Local Board |
| L5 | 分享海报 Canvas 导出 | PRD §6.0.20 · 1080×1350 |

---

## 一键验收命令（当前冲刺）

```bash
# 曲库缺口
pnpm catalog:beatscape
pnpm catalog:beatscape -- --stage 2

# 内容 QA
pnpm audit:beatscape

# 单元 + PRD 验收
pnpm --filter @musicsaas/beatscape test

# Stage2 预览就绪检查
pnpm ingest:beatscape-stage2 -- --dry-run
```

**当前冲刺 Definition of Done（建议）**

1. T1 完成（耳检 sign-off）  
2. T2 + T3 完成（#01/#02 双资产 + CTA 可点）  
3. T7 + T8 完成（**10/10** 曲库 + Slide 可玩）  
4. 上述命令集 **FAIL=0** / vitest **16/16**

---

## 相关文档

- [BEATSCAPE-STAGE1-DUAL-ASSET.md](./BEATSCAPE-STAGE1-DUAL-ASSET.md)
- [BEATSCAPE-STAGE2-DELIVERY.md](./BEATSCAPE-STAGE2-DELIVERY.md)
- [BEATSCAPE-CATALOG-ROADMAP.md](./BEATSCAPE-CATALOG-ROADMAP.md)
- [SESSION.md](../SESSION.md)
