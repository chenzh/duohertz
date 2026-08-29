# BeatScape RESONANCE 风格包扩展（PRD §6.0.2 附录）

> **状态**：待人类合入 `docs/PRD-BEATSCAPE.md` §6.0.2 主表  
> **声波真值**：[`BEATSCAPE-SONIC-DIRECTION.md`](./BEATSCAPE-SONIC-DIRECTION.md) — 全曲库 **车载 + 都市爵士战斗感**  
> **曲目表**：[`BEATSCAPE-STAGE4-RESONANCE-MUSIC.md`](./BEATSCAPE-STAGE4-RESONANCE-MUSIC.md)（Stage 4 第一波 10 首）

---

## 1. 定位

`bs-resonance-*` 六个包是 **RESONANCE 视听统一** 的声波专用 preset：  
在车载宽声场标准上，叠加 **funk / acid jazz / neo-soul / nu-disco / brass** 纹理——气质上对齐 stylish urban RPG 探索/战斗 BGM **类型**，**不**复刻任何第三方 OST。

**对内**可说「女神异闻录战斗曲那类劲道」；**Prompt 与对外文案** 只用本表关键词 + [`BEATSCAPE-SONIC-DIRECTION.md`](./BEATSCAPE-SONIC-DIRECTION.md) §4 禁止词表。

---

## 2. Preset 表

| preset_id | 曲风槽位 | BPM 真值 | Prompt 要点 |
|-----------|----------|----------|-------------|
| `bs-resonance-brass` | EDM | 158–164 | brass stab hooks, four-on-floor, dramatic build, night drive mix |
| `bs-resonance-climax` | EDM | 166–172 | intense drop, filtered nu-disco, pulse overload, wide stereo |
| `bs-resonance-funkhop` | Hip-hop | 96–104 | syncopated funk groove, 808 bass, off-beat hi-hats, chart downbeat |
| `bs-resonance-rhodes` | Pop | 118–126 | rhodes electric piano, funky pop groove, bright snare, in-car clarity |
| `bs-resonance-neosoul` | R&B | 88–96 | neo-soul groove, warm bass, spacious kick, afterhours energy |
| `bs-resonance-stomp` | Rock | 128–136 | funk rock guitar riff, stomp drums, optional brass hits |

**机器索引**：`scripts/beatscape-stage4-specs.py` → `RESONANCE_PRESETS`

---

## 3. 与既有 `bs-*` 包的关系

| 场景 | 用法 |
|------|------|
| Stage 1–3 已锁定曲 | 保留原 `preset_id`；**替补 / 重生成** 时叠加下方强制后缀 |
| Stage 4 第一波 10 首 | 必须使用上表 `bs-resonance-*` |
| Stage 4–5 新曲 | 优先 `bs-resonance-*`；五风配额不足时可用原 `bs-*` + 强制后缀 |

---

## 4. 生成后缀（强制）

```text
instrumental, no vocals, clear 4/4 downbeat, chart-friendly drums,
night drive energy, wide stereo mix, beatscape original, owned rights,
loop-friendly, western production
```

人声曲（Stage 2 等）去掉 `instrumental, no vocals`，保留其余项。

**禁止词**：见 [`BEATSCAPE-SONIC-DIRECTION.md`](./BEATSCAPE-SONIC-DIRECTION.md) §4。
