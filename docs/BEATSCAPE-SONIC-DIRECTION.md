# BeatScape 声波方向 — 车载 × 都市爵士战斗感（RESONANCE）

> **状态**：产品真值 · 2026-08-29  
> **适用范围**：**全曲库**（Stage 1–5，含已上架 25 首与未来 25 首）  
> **关联**：[`RESONANCE-VISUAL-PLAN.md`](./RESONANCE-VISUAL-PLAN.md) · [`BEATSCAPE-STAGE4-RESONANCE-MUSIC.md`](./BEATSCAPE-STAGE4-RESONANCE-MUSIC.md) · [`BEATSCAPE-RESONANCE-PRESETS.md`](./BEATSCAPE-RESONANCE-PRESETS.md) · PRD §1.3a · §6.0.2

---

## 1. 一句话定位

BeatScape **全部音乐**统一追求两种听感叠合：

1. **车载级（in-car）**：宽声场、饱满低频、中频清晰、长时间听不刺耳——像深夜开车穿过霓虹城区时，音响里该放的那种劲道。
2. **都市爵士战斗感（对内参照：女神异闻录系列战斗/探索 BGM 的「类型气质」）**：切分 funk、酸爵士和弦、铜管点缀、neo-soul 松弛、nu-disco 滤波——**/swagger、自信、夜间都市、可踩点的戏剧性**。

对外 **一律** 使用产品自有命名 **RESONANCE 声波** 或英文类型描述（*stylish urban night-drive groove*），**禁止** 在玩家可见文案、曲库标签、商店描述中出现「女神异闻录」「Persona」「P5」等第三方名称。

---

## 2. 为什么可以追求这种气质，又不侵权

与视觉相同，法律关心的是 **具体表达是否可被误认**，不是「能不能做爵士放克」。

| 层级 | 可以借（公共领域 / 音乐类型） | 不能借（受保护的表达） |
|------|------------------------------|------------------------|
| **和声 / 律动** | 切分低音、反拍 hi-hat、行走贝斯、Rhodes、铜管 stab、四四鼓 | 某首 OST 的**主旋律动机**、标志性 intro 八小节 |
| **制作审美** | 西方流行混音、车载宽动态、night-drive 能量 | 复刻某曲的编曲分轨编排、过门句式 |
| **情绪类型** | 都市夜行、探索张力、战斗前蓄力 → drop | 「怪盗」「天鹅绒房间」等**系列特有叙事符号** |
| **人声** | 英文流行人声（既有 Stage 2–3 曲） | 日语 OP 语感、Vocaloid 音色、仿唱知名曲 |

**判例提醒**（与视觉盲测同源）：`Tetris v. Xio`、`Spry Fox v. Lolapps` —— **全新制作仍可能因整体印象被误认而败诉**。  
因此声波侧也必须：**借类型技法，造自有旋律；借气质，不借名片段。**

---

## 3. 「车载」在本项目中的可操作定义

「车载」不是车型广告曲，而是 **混音与律动上的交付标准**：

| 维度 | 要求 | Prompt / QA 关键词 |
|------|------|-------------------|
| **低频** | 饱满但不糊，kick 与 bass 分离可辨 | `punchy low end`, `tight kick`, `clear sub` |
| **声场** | 左右有空间，主元素不挤在中间 | `wide stereo mix`, `in-car clarity` |
| **高频** | 镲片亮而不刺，长时间游玩不疲劳 | `smooth highs`, `not harsh` |
| **律动** | 四四拍清晰，适合音游谱面 onset | `clear 4/4 downbeat`, `chart-friendly drums` |
| **情绪** | 夜间都市行进感，自信、向前 | `night drive`, `urban highway groove`, `afterhours energy` |

**验收**：用普通手机外放 + 笔记本扬声器各听一遍；若低频糊成一片或高频刺耳，退回混音或重生成。

---

## 4. 「都市爵士战斗感」在本项目中的可操作定义

> **对内沟通**可称「女神异闻录气质」以对齐团队审美；**对外与生成 Prompt** 只用下表右栏。

| 团队口头描述 | 生成 Prompt 应写成 | 禁止写成 |
|--------------|-------------------|----------|
| 「P5 战斗曲那种骚」 | `syncopated funk groove, brass stabs, confident urban night energy` | phantom thief, rebellion anthem, persona battle |
| 「开车听很带劲」 | `night drive mix, wide stereo, punchy bass, instrumental hook` | last surprise, beneath the mask |
| 「爵士味但不慵懒」 | `jazz-funk rhythm, rhodes chords, tight drums, chart-friendly` | tokyo jazz club, anime boss battle |
| 「探索地图的背景」 | `stylish urban RPG exploration BGM, moderate energy, loop-friendly` | megaten, velvet room, shibuya |
| 「高潮要炸」 | `dramatic build, brass hits, drop within 8 seconds, EDM layer` | life will change, royal |

**技法清单（全曲库鼓励复用）**：

- Syncopated funk / 放克切分（Hip-hop、Pop、Rock 槽位）
- Acid jazz / Rhodes / 行走贝斯（Pop、R&B）
- Brass stabs / 铜管切片（EDM、Rock 高潮）
- Neo-soul 温暖 groove（R&B）
- Nu-disco 滤波层（EDM climax）
- Funk-rock 哇音吉他（Rock）

**全曲库默认后缀**（人声曲可去掉 `instrumental, no vocals`）：

```text
clear 4/4 beat, night drive energy, wide stereo mix, beatscape original,
owned rights, rhythm game chart music, loop-friendly, western production
```

**Prompt 禁止词**：

```text
persona, atlus, megami, megaten, p5, royal, anime, j-pop, japanese, vocaloid,
velvet room, tarot, phantom thief, life will change, beneath the mask, last surprise
```

---

## 5. 与现有 25 首的关系

| 阶段 | 曲目 | 声波状态 | 说明 |
|------|------|----------|------|
| Stage 1–2 | 10 首 | **部分对齐** | 以 EDM/Pop 为主，已有 night-drive 能量；缺系统性的 funk/jazz 纹理 |
| Stage 3 | 15 首 | **部分对齐** | 欧美流行/Trap 主仓；与 RESONANCE 视觉并排时 groove 层偏薄 |
| Stage 4 第一波 | 10 首 | **完全对齐** | 见 [`BEATSCAPE-STAGE4-RESONANCE-MUSIC.md`](./BEATSCAPE-STAGE4-RESONANCE-MUSIC.md) |
| Stage 4–5 剩余 | 15 首 | **规划对齐** | 新曲默认本文件标准；旧曲 **不强制重生成**，但替补/月更须符合 |

**原则**：不要求立刻推翻 25 首；**从现在起所有新生成与替换曲** 必须同时满足 §3 车载 + §4 都市爵士战斗感 + §6 红线。

---

## 6. 侵权红线（音乐专用）

### 6.1 绝对不能碰

| 类别 | 示例 |
|------|------|
| 商标 / 系列 | Persona、ペルソナ、Atlus、Megami Tensei、P5、Royal |
| 名曲复刻 | 任何 Atlus / 动漫 OST 可哼出的主旋律、标志性过门 |
| 日系听感包 | j-pop、anime opening、vocaloid、和风、神社 bell |
| 外部音源 | 非 MusicSaas 本地 job 的采样、Loop 包、扒带 |

### 6.2 入库前必做（音乐 QA）

1. **耳检盲问**：「这像哪首歌？」——若脱口而出第三方曲名 → 废弃  
2. **结构抽检**：禁止 8 小节内与已知热曲主旋律高度相似（人工即可）  
3. **主题闸门**：曲名含 PRD §1.3a 关键词；艺人虚构英文  
4. **机器闸门**：`pnpm audit:beatscape` FAIL=0 · `pnpm earcheck:beatscape` PASS  
5. **对外文案**：曲库只标 `AI Original · Owned Rights`，不暗示任何授权热单

---

## 7. 风格包与 RESONANCE 扩展

既有 `bs-edm-main` / `bs-pop-hook` 等 Stage 1–3 包：**保留 ID**，新 job 的 Prompt 须叠加 §3–§4 后缀。

Stage 4 起新增 6 个 **`bs-resonance-*`** 包（车载 + 爵士战斗感专用），详见 [`BEATSCAPE-RESONANCE-PRESETS.md`](./BEATSCAPE-RESONANCE-PRESETS.md)。

---

## 8. 与视觉 RESONANCE 的一致性

| 视觉（RESONANCE） | 声波（本文件） |
|-------------------|----------------|
| 高对比漫画 / 都市夜 | 夜间行车能量 / afterhours |
| 朱红 + 半调 + 斜切 | 铜管 stab + 切分 groove |
| 四道色泳道律动 | 四四清晰 downbeat，可谱面化 |
| 盲测：不说出来源游戏 | 耳检：不说出来源歌曲 |

视听不一致时（例如 EDM 纯垫无 groove），优先在 **月更 / Stage 4+** 补曲，而非改判定窗或 UI 色板。

---

## 9. 文档索引

| 文件 | 角色 |
|------|------|
| **本文件** | 全曲库声波真值 |
| `BEATSCAPE-STAGE4-RESONANCE-MUSIC.md` | Stage 4 第一波 10 首曲目表 + Prompt |
| `BEATSCAPE-RESONANCE-PRESETS.md` | `bs-resonance-*` preset 附录 |
| `RESONANCE-VISUAL-PLAN.md` | 视觉平行真值 |
| `RESONANCE-BLINDTEST.md` | 视觉上线盲测规程 |
| `PRD-BEATSCAPE.md` §1.3a · §6.0.2 | 产品母题与风格包主表 |

---

## 附录 · 对外一句话（Reddit / 商店用）

> **BeatScape** — browser rhythm game with **AI-original** tracks built for **night-drive groove** and **stylish urban energy**. Funk, jazz-fusion, and neo-soul textures — **not** licensed hits, **not** anime OPs. All owned rights.

**禁止版本**：「Persona-style」「女神异闻录同款」「P5 战斗曲风」等任何第三方挂靠表述。
