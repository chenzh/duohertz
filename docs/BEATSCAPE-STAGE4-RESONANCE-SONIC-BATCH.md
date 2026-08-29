# BeatScape Stage 4 · RESONANCE 声波批次（10 首规划）

> **⚠️ 已合并** — 权威文档：  
> - 声波真值：[`BEATSCAPE-SONIC-DIRECTION.md`](./BEATSCAPE-SONIC-DIRECTION.md)  
> - 曲目表 / Prompt：[`BEATSCAPE-STAGE4-RESONANCE-MUSIC.md`](./BEATSCAPE-STAGE4-RESONANCE-MUSIC.md)  
> 本文件仅作历史草稿留存，**勿按本文件曲名生成**。  
> 本文件保留早期 brainstorm，**勿按本表曲名生成**。

> **状态**：文档定稿 · **待生成**（human-only 流水线）  
> **槽位**：`bs-s4-01` … `bs-s4-10`（Stage 4 第一波 + 第二波，共 10 首）  
> **目标**：在 RESONANCE 漫画视觉上线后，补一批**都市夜行 + 爵士放克感**的自有 AI 原曲——气质上接近「 stylish urban RPG 战斗/探索 BGM」的**类型**，但**绝不复刻**任何第三方 OST 旋律、编曲套路或日系 OP 人声美学。  
> **权威**：`docs/PRD-BEATSCAPE.md` §1.3a · §6.0.1–6.0.6 · `docs/RESONANCE-BLINDTEST.md` · `docs/RESONANCE-VISUAL-PLAN.md` §1  
> **路线图**：`apps/beatscape/catalog-roadmap.json` · `docs/BEATSCAPE-CATALOG-ROADMAP.md`

---

## 1. 为什么要做这一批

| 现状 | 缺口 |
|------|------|
| 曲库 **25/25**（Stage 3）已齐五风配额 | 听感偏 **欧美流行/EDM/Trap**，缺少与 RESONANCE UI 匹配的 **放克 / 酸爵士 / 都市摇摆** 纹理 |
| 视觉已切到高对比漫画都市 | 音频若仍全是霓虹 EDM，**视听不一致** |
| 目标用户想要「那种很酷的夜都市节奏感」 | 必须通过 **自有生成 + Prompt 合同** 实现，不能外采或「仿曲」 |

**本批次定位（对外话术）**

> *Late-night city funk & jazz-groove originals for BeatScape — Western production, owned AI rights, built for 4-lane charts.*

**对内话术（禁止写进 Prompt / 商店页）**

> 借鉴的是公共类型：**acid jazz、nu-disco、funk rock、boom-bap with live bass、neo-soul groove**——不是某部作品的配乐表。

---

## 2. 声波红线（音乐版 · 与视觉盲测并列）

### 2.1 绝对不能碰

| 类别 | 说明 |
|------|------|
| **旋律/动机** | 不得刻意贴近已知 JRPG 战斗曲、菜单曲、偷心曲的**可识别动机**（含「改几个音」的改写） |
| **人声** | 默认 **全器乐**；若用人声仅允许 **英文** 且 ≤8 小节、意象对齐 §1.3a，禁止日语/二次元 OP 唱法 |
| **Prompt 禁词** | `persona` `atlus` `megami` `anime opening` `j-pop` `vocaloid` `velvet room` `phantom thieves` `tarot` `mask` 及任何真实歌手/曲名 |
| **曲名/艺人** | 禁止塔罗、面具、怪盗、天鹅绒等 **系列强符号**；`Velvet` 已在库内出现，本批**不再新增 Velvet* 曲名** |
| **版权** | 非 MusicSaas 本地 job、无 `rights: owned` → 禁止入库 |

### 2.2 可以借的「类型层」（安全）

- 电钢琴 / Rhodes、铜管 stab、指弹贝斯、十六分 Funk 吉他切分  
- 摇摆鼓组（ride + ghost note）、半音上行 bass line  
- Nu-disco 四四拍、滤波器 sweep（EDM 槽位）  
- Boom-bap + jazz chord voicing（Hip-hop 槽位）  
- **Western** 混音审美：近鼓、宽场、中高频清晰（服务 15/30/50 判定可读性）

### 2.3 入库前耳检（除常规 audit/earcheck 外）

1. **剥离测试**：制作人自听——能否联想到某首**具体**第三方曲目？能 → 废弃重生成。  
2. **盲听**（可选）：给 3 名不玩 JRPG 的听者 30s 片段，问「像哪款游戏的音乐？」若有人点名来源 → 不通过。  
3. **谱面可读**：`pnpm chart:beatscape` + `pnpm earcheck:beatscape` + 首音 1.0–2.5s 鼓点清晰。

---

## 3. 批次规模与曲风配额

| 项目 | 值 |
|------|-----|
| 本批数量 | **10** |
| track_id | `bs-s4-01` … `bs-s4-10` |
| 游戏切片 | **120s**（路线图 Stage 4 默认） |
| 流媒体母带 | **180–210s**（双资产，见 `BEATSCAPE-STAGE1-DUAL-ASSET.md`） |
| 累计目标 | 25 → **35/50**（Stage 4 共需 +15；本批为前 10 首） |

**本批曲风分布**（对齐 `catalog-roadmap.json` 槽位，不改动机器真值）：

| 曲风 | 本批数量 | track_id |
|------|----------|----------|
| EDM | 2 | s4-01, s4-06 |
| Hip-hop | 2 | s4-02, s4-07 |
| Pop | 2 | s4-03, s4-08 |
| R&B | 2 | s4-04, s4-09 |
| Rock | 2 | s4-05, s4-10 |

---

## 4. 建议新增风格包（PRD §6.0.2 扩展 · 入库前需人类补登记）

在既有 `bs-*` 预设上，本批**优先**使用下列 **扩展 preset_id**（生成脚本与 `beatscape-track-registry.py` 后续批次再锁元数据）：

| preset_id | 曲风槽位 | BPM 建议 | 听感关键词（Prompt 用） |
|-----------|----------|----------|-------------------------|
| `bs-nu-disco-funk` | EDM | 124–132 | nu-disco, funky bassline, filtered house, four on floor, instrumental |
| `bs-edm-funk-drop` | EDM | 160–168 | funky synth bass, brass stab, club drop, chart drums |
| `bs-jazz-hop` | Hip-hop | 90–98 | boom bap, upright bass, jazz chords, laid back groove |
| `bs-lofi-jazz-grid` | Hip-hop | 84–92 | lofi jazz hop, vinyl texture, night city, mellow |
| `bs-swing-pop` | Pop | 118–126 | english pop, swing feel, brass accent, bright hook |
| `bs-chill-jazz-pop` | Pop | 112–120 | soft jazz harmony, glass pads, easy chart |
| `bs-acid-jazz-groove` | R&B | 88–94 | acid jazz, rhodes electric piano, walking bass, lounge |
| `bs-neo-soul-scape` | R&B | 82–88 | neo soul, warm chords, rimshot groove, intimate |
| `bs-funk-rock-drive` | Rock | 126–134 | funk rock, muted guitar chop, tight live drums |
| `bs-jazz-rock-anthem` | Rock | 132–140 | jazz rock fusion, melodic guitar, syncopated drums |

> 若暂不改 PRD 表，可退化为路线图已有 `preset_id`，但 **Prompt 必须写满上表听感词**，避免退化成通用 EDM。

---

## 5. 十首定名表（待生成 · 玩法 + 主题双锁）

默认难度建议：**Casual + Easy** 占 4 首（种草），其余 Standard Arcade。  
全部 `allows_slide: false`（Slide 仍留给 Stage 2 曲目示范；本批不强制 Slide）。

| # | track_id | 英文曲名 | 艺人 | 曲风 | BPM | preset_id | District | 标签 | 默认模式/难度 | 玩法职责 |
|---|----------|----------|------|------|-----|-----------|----------|------|---------------|----------|
| 26 | `bs-s4-01` | **Disco Pulse Grid** | Neon Arc | EDM | 128 | `bs-nu-disco-funk` | Pulse Core | Hot Chart Style | Std / Arcade | Nu-disco 放克 House；中速可读谱 |
| 27 | `bs-s4-02` | **Brass Grid Walk** | Subline | Hip-hop | 94 | `bs-jazz-hop` | Night Grid | Classic Style | Casual / Easy | 爵士 Boom-bap；新手友好 |
| 28 | `bs-s4-03` | **Skyline Swing** | Luma Rim | Pop | 124 | `bs-swing-pop` | Glass Rim | Viral Style | Casual / Easy | 铜管+摇摆；短视频钩子 |
| 29 | `bs-s4-04` | **Afterhours Rhodes** | Mira Lane | R&B | 92 | `bs-acid-jazz-groove` | Afterhours Lane | Classic Style | Casual / Easy | 酸爵士 lounge；弱打击铺底 |
| 30 | `bs-s4-05` | **Funk Chrome Drive** | Iron Echo | Rock | 128 | `bs-funk-rock-drive` | Chrome Yard | Hot Chart Style | Std / Arcade | Funk 吉他切分；能量曲 |
| 31 | `bs-s4-06` | **Filter Scape Drop** | Gridline | EDM | 165 | `bs-edm-funk-drop` | Pulse Core | Hot Chart Style | Std / Arcade | 高 BPM 放克 Drop；密度验收 |
| 32 | `bs-s4-07` | **Cipher Night Loop** | Low Voltage | Hip-hop | 88 | `bs-lofi-jazz-grid` | Night Grid | Classic Style | Casual / Easy | Lofi jazz hop；宽节拍窗练习 |
| 33 | `bs-s4-08` | **Glass Swing Hour** | Quiet Neon | Pop | 116 | `bs-chill-jazz-pop` | Glass Rim | Classic Style | Casual / Easy | 轻爵士和声；与 #03 差异化 |
| 34 | `bs-s4-09` | **Echo Lane Groove** | Sparrow Mint | R&B | 86 | `bs-neo-soul-scape` | Halftone Block | New Release | Casual / Easy | Neo-soul；新 District 首秀 |
| 35 | `bs-s4-10` | **Riff Resonance** | Redline Co. | Rock | 134 | `bs-jazz-rock-anthem` | Resonance Row | New Release | Std / Hard | 爵士摇滚；Hard 密度抽检 |

**主题关键词覆盖**：每曲曲名含 `scape` / `pulse` / `grid` / `chrome` / `horizon` / `lane` / `glass` / `afterhours` / `disco` / `swing` / `resonance` 之一（见 §1.3a 池）。

**新 District（封面/元数据用，非 IP）**

| District | 色板建议（RESONANCE） | 说明 |
|----------|----------------------|------|
| Halftone Block | `#C94B4B` + 网点纹理 | 半调街区 |
| Resonance Row | `#E23D3D` + 骨白字 | 共振大道；**仅作地名，不作 UI motif 名** |

---

## 6. 逐首 Prompt 草案（复制进 MusicSaas job）

统一后缀（每首必带）：

```text
instrumental, no vocals, clear 4/4 downbeat, chart-friendly drums,
minimal neon city atmosphere, beatscape original, owned rights, loop-friendly
```

| track_id | Prompt 正文 |
|----------|-------------|
| `bs-s4-01` | Nu-disco rhythm game track, 128 BPM, funky electric bass, four on floor kick, filtered disco house, pulse grid energy, brass stab accents, {后缀} |
| `bs-s4-02` | Jazz hip-hop rhythm game, 94 BPM, boom bap drums, upright bass walk, minor jazz chords, night grid alley, brass sample hit, {后缀} |
| `bs-s4-03` | English swing pop rhythm game, 124 BPM, bright horn section stabs, skyline hook melody, glass rim sparkle, syncopated groove, {后缀} |
| `bs-s4-04` | Acid jazz rhythm game, 90 BPM, rhodes electric piano, walking bass, afterhours lounge, soft ride cymbal, warm tape saturation, {后缀} |
| `bs-s4-05` | Funk rock rhythm game, 128 BPM, muted funk guitar chops, tight live drum kit, chrome yard drive, syncopated bass, {后缀} |
| `bs-s4-06` | EDM funk drop, 165 BPM, funky synth bass, filter sweep build, brass stab drop, pulse core overload, {后缀} |
| `bs-s4-07` | Lo-fi jazz hip-hop, 88 BPM, dusty vinyl texture, mellow piano chords, cipher night loop, sparse kick snare, {后缀} |
| `bs-s4-08` | Chill jazz pop, 116 BPM, glass swing chords, soft bell melody, blue hour loop feel, gentle groove, {后缀} |
| `bs-s4-09` | Neo soul rhythm game, 86 BPM, warm electric piano, rimshot groove, echo lane intimacy, smooth bass, {后缀} |
| `bs-s4-10` | Jazz rock fusion, 134 BPM, melodic electric guitar riff, syncopated rock drums, resonance row anthem, {后缀} |

**生成参数建议**

| 字段 | 值 |
|------|-----|
| engine | `stable-audio-3`（`game_bgm`） |
| job_duration_sec | **210**（母带；再精剪 120s 游戏切片） |
| clip_t0 | 耳听定；目标首音 **1.2–2.0s** |
| rights | `owned` |
| theme | `beatscape` |

---

## 7. 封面与 OG（程序化 · 与声波批次一致）

- 脚本：`scripts/beatscape-cover.py` · `scripts/beatscape-generate-og.py`  
- 视觉语言：RESONANCE 半调 + 斜切标题；**禁止**面具/塔罗/怪盗剪影  
- 封面 motif 建议：铜管几何、贝斯指纹、唱片纹、城市天际线块面（与曲风列对应）  
- 入库后跑：`pnpm audit:beatscape` 确认 `cover` / `og` 闸门

---

## 8. 入库流水线（human-only · 本批执行顺序）

```bash
# 1. 人类：按 §6 提交 10 个 MusicSaas job → masters/ 落盘
# 2. 精剪 120s 游戏切片 + stream 双资产
pnpm ingest:beatscape-stage4 -- --dry-run   # 待脚本就绪后
# 3. 自动谱 + 难度
python3 scripts/beatscape-chartgen.py --track bs-s4-01
# 4. QA
pnpm audit:beatscape
pnpm earcheck:beatscape
pnpm catalog:beatscape -- --stage 4
pnpm --filter @musicsaas/beatscape test
```

**代码跟进（本批文档之后）**

| 交付物 | 路径 | 说明 |
|--------|------|------|
| Stage4 元数据锁 | `scripts/beatscape-stage4-specs.py` | 仿 `beatscape-stage3-specs.py` |
| 路线图状态 | `catalog-roadmap.json` | `title` / `status: shipped` |
| PRD 风格包 | `docs/PRD-BEATSCAPE.md` §6.0.2 | 登记 §4 新 preset_id |
| 注册表 | `scripts/beatscape-track-registry.py` | `STAGE4_TRACKS` |

---

## 9. 验收标准（本批 Definition of Done）

- [ ] 10 首 `audio.m4a` + `stream.m4a` 可播放，`catalog.json` **35** 条  
- [ ] `pnpm catalog:beatscape -- --stage 4` → **10/10** 本批槽位 shipped  
- [ ] `pnpm audit:beatscape` **FAIL=0**  
- [ ] `pnpm earcheck:beatscape` **35/35 PASS**  
- [ ] §2.3 声波耳检记录（可附 `worklog/`）  
- [ ] 视觉盲测未因新曲名/封面回退（见 `RESONANCE-BLINDTEST.md`）

---

## 10. 相关文档

- [BEATSCAPE-CATALOG-ROADMAP.md](./BEATSCAPE-CATALOG-ROADMAP.md)  
- [PRD-BEATSCAPE.md](./PRD-BEATSCAPE.md) §6.0  
- [RESONANCE-VISUAL-PLAN.md](./RESONANCE-VISUAL-PLAN.md)  
- [RESONANCE-BLINDTEST.md](./RESONANCE-BLINDTEST.md)  
- [BEATSCAPE-STAGE1-DUAL-ASSET.md](./BEATSCAPE-STAGE1-DUAL-ASSET.md)

---

**变更记录**

| 日期 | 说明 |
|------|------|
| 2026-08-29 | 初稿：Stage 4 前 10 首 RESONANCE 声波批次定名 + Prompt + 红线 |
