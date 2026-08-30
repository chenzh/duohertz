# BeatScape 曲库路线图（正式版 50 首）

> **机器真值**：`apps/beatscape/catalog-roadmap.json`  
> **权威 PRD**：`docs/PRD-BEATSCAPE.md` §6.0.1 · §6.0.5 · §6.0.14  
> **声波真值**：[`BEATSCAPE-SONIC-DIRECTION.md`](./BEATSCAPE-SONIC-DIRECTION.md) — 全曲库 **车载 + 都市爵士战斗感**  
> **缺口命令**：`pnpm catalog:beatscape`

---

## 1. 分 Stage 曲目数量（产品规划真值）

| Stage | 累计曲目 | 本 Stage 新增 | 交付要点 |
|-------|----------|---------------|----------|
| **Stage 1** | **6** | 6 | 手感验证；离线可玩；**已上架** |
| **Stage 2** | **10** | +4 | Slide / 英文人声 / 闭环 |
| **Stage 3** | **25** | +15 | 曲库页搜索·分类·收藏·缓存 |
| **Stage 4** | **40** | +15 | 本地榜样本充足；New Release 滚动 |
| **Stage 5 / 正式版** | **50** | +10 | 全量上线 + 月更 +2～4 |
| **Stage 6 / 扩容** | **85** | +35 | 首轮扩容，见 [`BEATSCAPE-STAGE6-EXPANSION-MUSIC.md`](./BEATSCAPE-STAGE6-EXPANSION-MUSIC.md) |

**维护节奏**（PRD §6.0.5）

- 每周：手感修 + 0～1 首替补  
- 每月：候选 8～12 首 → QA 过关入库 **2～4** 首  

---

## 1.5 声波方向（全曲库）

BeatScape **全部音乐**统一为 **车载级宽声场** + **都市爵士战斗感**（对内可称女神异闻录气质，对外 RESONANCE 声波）。  
不采样、不仿旋律、不出现第三方 IP。详见 [`BEATSCAPE-SONIC-DIRECTION.md`](./BEATSCAPE-SONIC-DIRECTION.md)。

---

## 2. 五曲风配额（累计）

| 曲风 | Stage 1 | Stage 2 | Stage 3 | Stage 4 | **正式版 50** | **Stage 6 / 85** |
|------|---------|---------|---------|---------|--------------|------------------|
| **EDM** | 2 | 3 | 6 | 10 | **12** | **20** |
| **Pop** | 1 | 3 | 5 | 8 | **10** | **17** |
| **Hip-hop** | 1 | 1 | 5 | 8 | **10** | **17** |
| **R&B** | 1 | 1 | 4 | 6 | **8** | **14** |
| **Rock** | 1 | 2 | 5 | 8 | **10** | **17** |
| **合计** | **6** | **10** | **25** | **40** | **50** | **85** |

EDM 为音游主仓，正式版可略超配（≤12 已锁定在路线图）。Stage 6 扩容按正式版比例 ×1.7 缩放，真值在 `catalog-roadmap.json` → `genre_targets.by_stage["6"]`。

---

## 3. track_id 命名与槽位

- 模式：`bs-s{stage}-{nn}`（例：`bs-s3-07`）  
- Stage 1–2：**曲名已定**（PRD §6.0.6）  
- Stage 3–5：槽位已分配 **曲风 + preset**，曲名入库前再定（须含主题关键词）  

### 已定名（10 首）

| seq | track_id | 曲名 | Stage | 曲风 | 状态 |
|-----|----------|------|-------|------|------|
| 01 | `bs-s1-01` | Neon Pulse | 1 | EDM | shipped |
| 02 | `bs-s1-02` | Glass Horizon | 1 | Pop | shipped |
| 03 | `bs-s1-03` | Night Drive 808 | 1 | Hip-hop | shipped |
| 04 | `bs-s1-04` | Velvet Afterhours | 1 | R&B | shipped |
| 05 | `bs-s1-05` | Voltage Drop | 1 | EDM | shipped |
| 06 | `bs-s1-06` | Chrome Riff | 1 | Rock | shipped |
| 07 | `bs-s2-01` | Slide City | 2 | EDM | planned |
| 08 | `bs-s2-02` | Skyline Hook | 2 | Pop | planned |
| 09 | `bs-s2-03` | Blue Hour Loop | 2 | Pop | planned |
| 10 | `bs-s2-04` | Asphalt Anthem | 2 | Rock | planned |

### 待命名槽位（40 首）

- **Stage 3**：`bs-s3-01` … `bs-s3-15`（分 3 波生成，每波 5 风交错）— **已上架 25/25**  
- **Stage 4**：`bs-s4-01` … `bs-s4-15` — 第一波 10 首见 [`BEATSCAPE-STAGE4-RESONANCE-MUSIC.md`](./BEATSCAPE-STAGE4-RESONANCE-MUSIC.md)；第三波 5 首（`bs-s4-11`…`15`）随 Stage 6 一起定名生成  
- **Stage 5**：`bs-s5-01` … `bs-s5-10`（正式版收官补齐）  
- **Stage 6**：`bs-s6-01` … `bs-s6-35`（首轮扩容）  

Stage 4 第三波 + Stage 5 + Stage 6 = **50 首一次交付**，曲目表见 [`BEATSCAPE-STAGE6-EXPANSION-MUSIC.md`](./BEATSCAPE-STAGE6-EXPANSION-MUSIC.md) §5。

完整槽位表见 `catalog-roadmap.json` → `slots[]`。

---

## 4. 游戏切片时长（按 Stage）

| Stage | 游戏切片 `duration_sec` | 说明 |
|-------|-------------------------|------|
| 1 | 60–75s | 已定；#05=60，其余 75 |
| 2+ | 90–120s | 路线图默认：S2=90s，S3–S5=120s |
| 流媒体完整版 | 180–210s | 见 [BEATSCAPE-STAGE1-DUAL-ASSET.md](./BEATSCAPE-STAGE1-DUAL-ASSET.md) |

---

## 5. 运营标签目标（正式版 50 首内）

| 标签 | 正式版 50 | Stage 6 / 85 |
|------|-----------|--------------|
| Hot Chart Style | 15 | **26** |
| Viral Style | 12 | **20** |
| Classic Style | 12 | **20** |
| New Release | 11 | **19** |

入库时写入 `catalog.json` → `tags[]`；月更曲优先打 **New Release**。Stage 6 目标在 `catalog-roadmap.json` → `tag_targets_stage6`。

---

## 6. 缺口统计

```bash
# 人类可读
pnpm catalog:beatscape

# JSON（CI / 脚本）
pnpm catalog:beatscape -- --json

# 只看 Stage 2 闸门
python3 scripts/beatscape-catalog-status.py --stage 2
```

**当前基线**（2026-08-30）：**35/85 shipped** · 声波方向见 [`BEATSCAPE-SONIC-DIRECTION.md`](./BEATSCAPE-SONIC-DIRECTION.md) · Stage 4 第一波 10 首见 [`BEATSCAPE-STAGE4-RESONANCE-MUSIC.md`](./BEATSCAPE-STAGE4-RESONANCE-MUSIC.md) · Stage 6 扩容 50 首见 [`BEATSCAPE-STAGE6-EXPANSION-MUSIC.md`](./BEATSCAPE-STAGE6-EXPANSION-MUSIC.md) · Stage 6 缺口 **50**。

---

## 7. 入库检查清单（每首）

1. 槽位 `track_id` 已在 `catalog-roadmap.json`  
2. MusicSaas 生成母带 → 精剪游戏切片 → 双资产入库（§6.0.27）  
3. `beatscape-chartgen.py` + `pnpm audit:beatscape`  
4. 更新 roadmap 槽位 `status: shipped`（可选；status 脚本以 catalog 音频为准）  
5. 重跑 `pnpm catalog:beatscape` 确认曲风配额  

---

## 8. 相关文档

- [PRD-BEATSCAPE.md](./PRD-BEATSCAPE.md) — 产品真值  
- [BEATSCAPE-STAGE1-DUAL-ASSET.md](./BEATSCAPE-STAGE1-DUAL-ASSET.md) — Stage1 双资产  
- [CODE-INDEX.md](./CODE-INDEX.md) — `catalog-roadmap.json` 索引  
