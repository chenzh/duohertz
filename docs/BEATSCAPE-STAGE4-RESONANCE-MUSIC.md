# BeatScape Stage 4 — RESONANCE 声波补曲（10 首）

> **状态**：文档定稿 · **待生成**（human-only 流水线）  
> **更新**：2026-08-29  
> **槽位**：`bs-s4-01` … `bs-s4-10`（Stage 4 第一波，25 → **35** 首）  
> **声波真值**：[`BEATSCAPE-SONIC-DIRECTION.md`](./BEATSCAPE-SONIC-DIRECTION.md) — 全曲库 **车载 + 都市爵士战斗感**（对内参照女神异闻录气质，对外 RESONANCE）  
> **关联**：[`RESONANCE-VISUAL-PLAN.md`](./RESONANCE-VISUAL-PLAN.md) · [`RESONANCE-BLINDTEST.md`](./RESONANCE-BLINDTEST.md) · [`PRD-BEATSCAPE.md`](./PRD-BEATSCAPE.md) §6.0 · [`catalog-roadmap.json`](../apps/beatscape/catalog-roadmap.json)

---

## 1. 为什么要做这一波

RESONANCE 视觉已把 BeatScape 拉到「高对比漫画 / 都市夜行」气质。**产品声波方向**已定为：全曲库追求 **车载级宽声场** + **都市爵士战斗感**（funk / acid jazz / neo-soul / brass），见 [`BEATSCAPE-SONIC-DIRECTION.md`](./BEATSCAPE-SONIC-DIRECTION.md)。

现有 25 首以欧美流行 + EDM 主仓为主，**律动复杂度与 jazz-fusion 色彩不足**，和 UI 的「夜间都市战斗感」不够齐。本波 **10 首** 是声波方向的首批完全对齐批次。

目标：**补 10 首「听感上更燃、更 groove、更有戏剧性」的 AI 原创**——玩家感到「像深夜开车听 stylish urban RPG BGM 那种劲道」，但：

- **不采样、不仿旋律、不碰 J-pop / 动漫 OP 语感**
- **不出现任何第三方 IP、曲目名、角色名、系列名**
- 仍满足 PRD §1.3a：**英文曲名 · 幻境城市主题 · `rights: owned`**

---

## 2. 音乐侧法律边界（必读）

与视觉盲测同理，音乐风险在 **「是否会被误认为某首已知曲」**，而非「是否用了同一种风格」。  
完整红线与耳检规程见 [`BEATSCAPE-SONIC-DIRECTION.md`](./BEATSCAPE-SONIC-DIRECTION.md) §2 · §6。

### 2.1 可以借（公共技法 / 类型）

| 技法层 | 说明 | 在本批中的用法 |
|--------|------|----------------|
| **Syncopated funk groove** | 切分低音、反拍 hi-hat | Hip-hop / R&B / Pop 槽位 |
| **Acid jazz / jazz-funk harmony** | Rhodes、行走贝斯、小号点缀 | Pop / R&B，**无人声爵士 scat** |
| **Brass stabs** | 短促铜管切片 | EDM / Rock 高潮段 |
| **Nu-disco filter** | 滤波律动、disco 底鼓 | EDM 槽位 |
| **Dance-rock / funk rock** | 哇音吉他 + 四四鼓 | Rock 槽位 |
| **Neo-soul** | 温暖和弦、松驰 groove | R&B 槽位 |
| **Battle-energy build → drop** | 张力堆积后释放 | EDM climax 槽位 |

### 2.2 绝对不能碰（表达层）

| 类别 | 禁止示例 |
|------|----------|
| **商标 / 系列** | Persona、ペルソナ、Atlus、Megami Tensei、P5、Royal |
| **名曲意象** | Life Will Change、Beneath the Mask、Last Surprise 等旋律或编曲复刻 |
| **日系听感包** | j-pop、anime opening、vocaloid、日系摇滚、和风、神社 bell |
| **人声语言** | 日语歌词；本批 **10/10 器乐曲**（Stage 4 先不上人声） |
| **外部音源** | 任何非 MusicSaas 本地 job 的 WAV / 采样包 |

### 2.3 入库前音乐抽检（建议）

1. **团队耳检**：是否脱口而出某首 Atlus / 动漫曲？→ 有则废弃重生成  
2. **频谱/结构**：禁止 8 小节内与已知热歌主旋律高度相似（人工即可，不必上 Shazam）  
3. **主题闸门**：曲名含 §1.3a 关键词；艺人名为虚构英文  
4. **谱面闸门**：`pnpm audit:beatscape` FAIL=0 · `earcheck` PASS  

---

## 3. 「车载 × 都市爵士战斗感」在本批中的定义

> **对内**可说「女神异闻录战斗/探索曲那类气质」；**对外与 Prompt** 禁止 Persona / 女神异闻录等字样。  
> 权威对照表：[`BEATSCAPE-SONIC-DIRECTION.md`](./BEATSCAPE-SONIC-DIRECTION.md) §3–§4。

| 玩家口头描述 | 生成 Prompt 应写成 | 避免写成 |
|--------------|-------------------|----------|
| 「开车听很带劲」 | `night drive mix, wide stereo, punchy bass, clear downbeat` | highway anime, city pop japan |
| 「打怪盗团那种劲」 | `syncopated funk groove, confident urban night drive` | phantom thief, rebellion anthem |
| 「爵士味战斗曲」 | `jazz-funk rhythm, brass stabs, chart-friendly 4/4` | boss battle anime, tokyo jazz club |
| 「踩点很骚」 | `off-beat hi-hats, tight snare, clear downbeat for rhythm game` | shuffle anime fight |
| 「很潮的都市夜」 | `neon cityscape, afterhours energy, western production` | shibuya, japanese city pop |

**一句话**：借 **funk / jazz-fusion / neo-soul / nu-disco 的律动语法** + **车载宽声场混音**，输出 **欧美制作审美的器乐曲**，锚在 BeatScape 幻境城市词表。

---

## 4. 新增 Style Pack（对接 MusicSaas）

在 PRD §6.0.2 既有 `bs-*` 包之上，Stage 4 第一波新增 **6 个 RESONANCE 包**（写入 `preset_id`，生成脚本 human-only 配置）：

| preset_id | 曲风归类 | BPM | 听感关键词（Prompt 核心） |
|-----------|----------|-----|---------------------------|
| `bs-resonance-brass` | EDM | 158–164 | brass stabs, four-on-floor, dramatic build, instrumental |
| `bs-resonance-climax` | EDM | 166–172 | intense drop, filtered disco layer, chart drums |
| `bs-resonance-funkhop` | Hip-hop | 96–104 | syncopated 808, funk bass, off-beat hats, instrumental |
| `bs-resonance-rhodes` | Pop | 118–126 | rhodes chords, funky pop groove, bright snare, instrumental |
| `bs-resonance-neosoul` | R&B | 88–96 | neo-soul groove, warm bass, spacious kick, instrumental |
| `bs-resonance-stomp` | Rock | 128–136 | funk rock guitar, stomp beat, brass hits optional, instrumental |

**通用后缀（每首强制）**：

```text
clear 4/4 beat, night drive energy, wide stereo mix, [scape keyword x2],
beatscape original, rhythm game chart music, owned rights, instrumental,
no vocals, loop-friendly, western production
```

**禁止词**：`persona, atlus, anime, j-pop, japanese, vocaloid, tarot, velvet room, megaten`

---

## 5. 十首曲目表（定名 · 待生成）

| # | track_id | 曲名 | 艺人 | 曲风 | BPM | preset_id | District | 标签 | 玩法职责 |
|---|----------|------|------|------|-----|-----------|----------|------|----------|
| 1 | `bs-s4-01` | **Brass Scape Rush** | Neon Arc | EDM | 160 | `bs-resonance-brass` | Pulse Core | Hot Chart Style | 铜管切片 + Drop≤8s 种草 |
| 2 | `bs-s4-02` | **Syncopated Grid** | Subline | Hip-hop | 98 | `bs-resonance-funkhop` | Night Grid | Classic Style | 反拍 groove 练习曲 |
| 3 | `bs-s4-03` | **Halftone Drive** | Luma Rim | Pop | 122 | `bs-resonance-rhodes` | Glass Rim | Viral Style | 前 10s Rhodes hook |
| 4 | `bs-s4-04` | **Satin Afterpulse** | Mira Lane | R&B | 92 | `bs-resonance-neosoul` | Afterhours Lane | Classic Style | 宽窗友好 · 低密度 |
| 5 | `bs-s4-05` | **Ink Stomp Riff** | Iron Echo | Rock | 132 | `bs-resonance-stomp` | Chrome Yard | Hot Chart Style | 吉他 riff 密度曲 |
| 6 | `bs-s4-06` | **Resonance Overload** | Gridline | EDM | 168 | `bs-resonance-climax` | Pulse Core | Hot Chart Style | 高密度 · Hard 验收 |
| 7 | `bs-s4-07` | **Lane Shuffle Flow** | Low Voltage | Hip-hop | 102 | `bs-resonance-funkhop` | Night Grid | Viral Style | Shuffle 体感 · 中 BPM |
| 8 | `bs-s4-08` | **Crimson Hookline** | Ada North | Pop | 126 | `bs-resonance-rhodes` | Glass Rim | New Release | 副歌钩子明显 |
| 9 | `bs-s4-09` | **Moonlit Groove** | Quiet Neon | R&B | 94 | `bs-resonance-neosoul` | Afterhours Lane | Classic Style | Hold 友好长音 |
| 10 | `bs-s4-10` | **Strike Vector** | Redline Co. | Rock | 134 | `bs-resonance-stomp` | Slide District | Hot Chart Style | 可含 Slide（Std/Hard） |

**曲风配额（本波 10 首）**：EDM 2 · Hip-hop 2 · Pop 2 · R&B 2 · Rock 2 — 与 `catalog-roadmap.json` Stage 4 前两波分布一致。

**时长真值**：游戏切片 **120s** · 流媒体完整版 **180–210s**（双资产，见 PRD §6.0.27）。

**命名说明**：

- 全部含主题词：`scape` / `pulse` / `grid` / `chrome` / `afterhours` / `lane` / `vector` 等  
- **刻意不用** `Velvet`（盲测回退项，见 `RESONANCE-BLINDTEST.md` §6）  
- `Resonance Overload` 用产品自有风格名 RESONANCE，**不**出现第三方系列名

---

## 6. 逐首 Prompt 草案（复制到 MusicSaas job）

> BPM 与上表一致；每条含 **≥2** 个主题词。

### bs-s4-01 · Brass Scape Rush

```text
EDM rhythm game track, 160 BPM, clear 4/4 kick, brass stab hooks, neon pulse energy,
urban scape at night, night drive wide mix, build-up and drop within 8 seconds,
chart-friendly drums, instrumental, no vocals, beatscape original, owned rights,
loop-friendly, western production
```

### bs-s4-02 · Syncopated Grid

```text
hip-hop rhythm game track, 98 BPM, syncopated funk groove, 808 bass, off-beat hi-hats,
night grid atmosphere, clear downbeat for charts, instrumental, no vocals,
beatscape original, owned rights, loop-friendly, western production
```

### bs-s4-03 · Halftone Drive

```text
pop rhythm game track, 122 BPM, rhodes electric piano hook, funky groove, bright snare,
glass horizon mood, clear 4/4 beat, instrumental, no vocals, beatscape original,
owned rights, loop-friendly, western production
```

### bs-s4-04 · Satin Afterpulse

```text
R&B rhythm game track, 92 BPM, neo-soul groove, warm bass, soft kick, spacious mix,
afterhours pulse, clear downbeat, instrumental, no vocals, beatscape original,
owned rights, loop-friendly, western production
```

### bs-s4-05 · Ink Stomp Riff

```text
rock rhythm game track, 132 BPM, funk rock electric guitar riff, stomp drum pattern,
chrome edge energy, tight 4/4 kit, instrumental, no vocals, beatscape original,
owned rights, loop-friendly, western production
```

### bs-s4-06 · Resonance Overload

```text
EDM rhythm game track, 168 BPM, intense drop, filtered nu-disco layer, dramatic tension,
pulse core overload, chart-friendly dense drums, instrumental, no vocals,
beatscape original, owned rights, loop-friendly, western production
```

### bs-s4-07 · Lane Shuffle Flow

```text
hip-hop rhythm game track, 102 BPM, shuffle groove, funk bass line, crisp snare,
lane grid syncopation, clear beat for rhythm game, instrumental, no vocals,
beatscape original, owned rights, loop-friendly, western production
```

### bs-s4-08 · Crimson Hookline

```text
pop rhythm game track, 126 BPM, catchy synth hook, funky bass, driving 4/4,
crimson night skyline, bright production, instrumental, no vocals, beatscape original,
owned rights, loop-friendly, western production
```

### bs-s4-09 · Moonlit Groove

```text
R&B rhythm game track, 94 BPM, neo-soul chords, smooth groove, legato-friendly pockets,
moonlit afterhours scape, clear kick and snare, instrumental, no vocals,
beatscape original, owned rights, loop-friendly, western production
```

### bs-s4-10 · Strike Vector

```text
rock rhythm game track, 134 BPM, funk rock drive, wah guitar accents, brass hits optional,
slide district energy, tight drums for lane charts, instrumental, no vocals,
beatscape original, owned rights, loop-friendly, western production
```

---

## 7. 封面与 District 色（程序化）

封面仍由 `scripts/beatscape-cover.py` 按 `track_id` seed 生成；District 建议扩展 token（实现阶段写入 `scape.ts`）：

| District | 主色建议 | 封面几何语言 |
|----------|----------|--------------|
| Pulse Core | `#E23D3D` | 放射线 + 菱形体 |
| Night Grid | `#6E2426` | 网格 + 半调点 |
| Glass Rim | `#E4D8C4` | 斜切玻璃面 |
| Afterhours Lane | `#B0765A` | 长阴影条 |
| Chrome Yard | `#8C8079` | 金属折线 |
| Slide District | `#FFB020` | 对角速度线 |

**禁止**：面具、塔罗、丝绒房间、任何可识别 JRPG UI 纹章。

---

## 8. 入库流水线

**Agent-safe 部分已完成**；音频生成仍需 MLX 人工跑批。

```bash
# 0. 同步 manifest（改 specs 后）
python3 scripts/beatscape-stage4-sync-manifest.py

# 1. 预览 job 列表 + 逐首生成（Gateway 在 MLX 节点）
bash scripts/beatscape-stage4-batch-jobs.sh
python3 scripts/beatscape-generate-tracks.py --manifest scripts/beatscape-stage4-manifest.json --track bs-s4-01

# 2. 一键流水线（母带 + 切片已就绪后）
pnpm pipeline:beatscape-stage4

# 或分步：
python3 scripts/beatscape-clip-game.py --track bs-s4-01 --t0 0 --duration 120
python3 scripts/beatscape-stitch-stream.py --all-stage4
pnpm ingest:beatscape-stage4 -- --dry-run
pnpm ingest:beatscape-stage4
python3 scripts/beatscape-chartgen.py --track bs-s4-01
pnpm audit:beatscape && pnpm earcheck:beatscape
pnpm catalog:beatscape -- --stage 4
```

| 脚本 | 说明 |
|------|------|
| `scripts/beatscape-stage4-specs.py` | 元数据真值 |
| `scripts/beatscape-stage4-manifest.json` | MusicSaas job |
| `scripts/beatscape-ingest-stage4.py` | 入库 |
| `scripts/beatscape-stage4-pipeline.py` | 端到端 |
| `scripts/beatscape-stage4-batch-jobs.sh` | 打印 10 个 job 命令 |
| `docs/BEATSCAPE-RESONANCE-PRESETS.md` | PRD §6.0.2 附录 |

**Definition of Done（本波 10 首）**

- [ ] 10/10 `catalog.json` 可播放 · `rights: owned` · `theme: beatscape`  
- [ ] 10/10 双资产 `stream.m4a` · `audit` FAIL=0  
- [ ] 10/10 `earcheck` PASS · 首音 1.0–2.5s  
- [ ] `bs-s4-10` Slide 谱面实机一局（若含 slide）  
- [ ] 团队耳检：**无人**联想到具体 Atlus / 动漫名曲  
- [ ] 视觉盲测仍独立进行（[`RESONANCE-BLINDTEST.md`](./RESONANCE-BLINDTEST.md)）

---

## 9. 与路线图衔接

| 文档 / 文件 | 动作 |
|-------------|------|
| `apps/beatscape/catalog-roadmap.json` | 将 `bs-s4-01`–`10` 填入 `title` / `artist` / `district` / `tags` | ✅ 2026-08-29 |
| `scripts/beatscape-stage4-manifest.json` | MusicSaas job 真值（10 首 Prompt + BPM） | ✅ |
| `scripts/beatscape-stage4-specs.py` | Python 侧 specs / preset 索引 | ✅ |
| `docs/BEATSCAPE-CATALOG-ROADMAP.md` | §3 增加「Stage 4 RESONANCE 波」引用本文件 |
| `docs/PRD-BEATSCAPE.md` | §6.0.2 增补 6 个 `bs-resonance-*` preset（human PR 合入） | 见 `BEATSCAPE-RESONANCE-PRESETS.md` |
| `SESSION.md` | next 增加「Stage4 RESONANCE 10 首生成」 | ✅ |

**剩余 Stage 4 槽位**：`bs-s4-11` … `bs-s4-15`（第三波 5 首）留待本波 QA 通过后再规划。

---

## 10. 风险与回退

| 风险 | 信号 | 回退 |
|------|------|------|
| 旋律撞车知名曲 | 耳检脱口而出歌名 | 废弃 job，改 BPM ±4 或换 preset 重生成 |
| 日系听感过重 | 像动漫战斗曲 | Prompt 加 `western production`；去掉 Rhodes/铜管其一 |
| 谱面过密 | Hard NPS 超标 | `beatscape-chart-difficulty.py` 降档后重跑 chartgen |
| 与视觉盲测冲突 | 曲名/封面触发联想 | 优先改曲名（不用 Velvet 等），再改封面 seed |

---

## 附录 A · 曲风缺口（35 首后）

本波完成后累计 **35/50**。距正式版仍缺 **15 首**（`bs-s4-11`–`15` + `bs-s5-01`–`10`），届时按 §6.0.1 五风配额表补齐即可。
