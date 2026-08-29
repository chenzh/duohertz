# BeatScape RESONANCE 风格包扩展（PRD §6.0.2 附录）

> **状态**：待人类合入 `docs/PRD-BEATSCAPE.md` §6.0.2 主表  
> **用途**：Stage 4 第一波 `bs-s4-01` … `bs-s4-10`  
> **权威曲目表**：[`BEATSCAPE-STAGE4-RESONANCE-MUSIC.md`](./BEATSCAPE-STAGE4-RESONANCE-MUSIC.md)

在既有 `bs-edm-main` / `bs-pop-hook` 等包之外，本扩展包描述 **都市放克 / 酸爵士 / neo-soul** 听感，服务 RESONANCE 视听一致。**禁止**在 Prompt 中使用 Persona / Atlus / 动漫 OP 相关词。

| preset_id | 曲风槽位 | BPM 真值 | Prompt 要点 |
|-----------|----------|----------|-------------|
| `bs-resonance-brass` | EDM | 160 | brass stab hooks, four-on-floor, dramatic build, chart drums |
| `bs-resonance-climax` | EDM | 168 | intense drop, filtered nu-disco, pulse overload energy |
| `bs-resonance-funkhop` | Hip-hop | 98–102 | syncopated funk groove, 808 bass, off-beat hi-hats |
| `bs-resonance-rhodes` | Pop | 122–126 | rhodes electric piano, funky pop groove, bright snare |
| `bs-resonance-neosoul` | R&B | 92–94 | neo-soul groove, warm bass, spacious kick |
| `bs-resonance-stomp` | Rock | 132–134 | funk rock guitar riff, stomp drums, optional brass hits |

**机器索引**：`scripts/beatscape-stage4-specs.py` → `RESONANCE_PRESETS`

**生成后缀（强制）**：

```text
instrumental, no vocals, clear 4/4 downbeat, chart-friendly drums,
beatscape original, owned rights, loop-friendly, western production
```
