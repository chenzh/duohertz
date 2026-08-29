# 知识产权授权归档

> 对应 PRD §7.5 字体条款与 §7.7 差异化红线。
> **原则**：不依赖「我已重画素材」免责，而是**留档可举证的授权链 + 主动差异化**（`Tetris Holding v. Xio Interactive`, 2012）。

---

## 1. 字体（只使用 SIL OFL / Apache）

| 字体 | 用途 | 授权 | 授权文本 |
|------|------|------|----------|
| **Anton** | Display：标题、HUD 数字、判定文案 | SIL OFL 1.1 | [fonts/anton-OFL.txt](fonts/anton-OFL.txt) |
| **Sora** | 次级标题、强调标签 | SIL OFL 1.1 | [fonts/sora-OFL.txt](fonts/sora-OFL.txt) |
| **IBM Plex Sans** | 数据、正文、UI | SIL OFL 1.1 | [fonts/ibmplexsans-OFL.txt](fonts/ibmplexsans-OFL.txt) |

授权文本来源：`https://raw.githubusercontent.com/google/fonts/main/ofl/<family>/OFL.txt`（上游 google/fonts 仓库，官方权威副本）。

**为什么这条是硬的**

- 美国：字体**形状**不受著作权保护，但字体**软件**受保护。
- 中国：独创性高的字体单字**可作为美术作品**受保护，字库按**计算机软件**保护
  （方正诉暴雪，最高人民法院，判赔 205 万元）。
- 日本：字体形状本身不受保护。

→ 按**最严口径**管理：只用 OFL / Apache，全站零例外。

**已消除的隐患**：`scripts/beatscape-generate-og.py` 的 Pillow 分支原先用
`/System/Library/Fonts/Supplemental/Arial Bold.ttf` 渲染 OG 图文字。
Arial 是 Monotype 商业字体，**不得烘焙进交付资产**。
已改为 OFL 字体查找（Anton / IBM Plex / DejaVu），
**找不到安全字体时只输出几何图形、不写文字** ——
与 stdlib 分支输出一致，保证不同机器产出相同，也保证永不静默使用商业字体。

---

## 2. 音频（100% 自研 AI 原创）

- 曲库 25 首，`catalog.json` 中 **25/25 `rights: "owned"`**。
- 生成引擎：`stable-audio-3` × 24、`ace-step` × 1。
- **无任何第三方旋律、采样、音效。**

---

## 3. 美术资产（100% 程序化生成，零外部素材）

- `apps/beatscape/public/` 内**除 `catalog/*/og.png` 外无任何位图**。
- 25 张曲目封面：由 `scripts/beatscape-cover.py` 按 `seed = track_id` 程序化生成，**纯几何、无人物脸**（PRD §7.5）。
- 25 张 OG 图：由 `scripts/beatscape-generate-og.py` 程序化生成。
- 共振菱形 motif 为本项目原创，见 PRD §7.6。

---

## 4. 差异化红线自检（PRD §7.7）

| 红线 | 检查方式 | 结果 |
|------|----------|------|
| 第三方作品名称 / logo / 系列徽记 | 全仓 grep `persona` `atlus` `女神异闻录` 等 | ✅ 无命中（仅 `getPersonalBest` / "Personal Best" 误报） |
| 任何具体角色 | 无位图资产；封面为程序化几何，无人物脸 | ✅ 通过 |
| 人格面具 / 塔罗牌 / 天鹅绒房间 motif | grep `tarot` `arcana` `velvet room` `塔罗` `面具` | ✅ 无命中 |
| 原曲旋律 / 采样 / 音效 | `rights: owned` 25/25 | ✅ 通过 |
| 官方美术资产与定制字体文件 | 无外部图片；字体全部 OFL | ✅ 通过 |
| 非 OFL/Apache 字体 | 见 §1；Arial 隐患已消除 | ✅ 通过 |
| 日文 / 二次元拟声词与表情贴纸 | grep 日文假名字符区间 `U+3040–U+30FF` | ✅ 无命中 |

**风格名自建为 RESONANCE（共振）** —— 不称其为任何既有作品之名。这既是品牌，也是法律姿态。

---

## 5. 差异化盲测（上线前硬性关卡）

PRD §11.4 规定：找 **5–10 名不玩日式 RPG** 的观察者，**只给截图、不给提示**，
问「这看起来像哪款游戏」。**任一人说出来源作品即判定不通过**，退回重做差异化。

- 素材：[`../RESONANCE-BLINDTEST.md`](../RESONANCE-BLINDTEST.md)
- 结果记录：本文件 §6

---

## 6. 盲测结果

| 日期 | 观察者数 | 说出来源作品的人数 | 结论 |
|------|----------|--------------------|------|
| _待执行_ | — | — | — |

---

## 7. 遗留观察项（非违规，但需知悉）

**曲目名含 "Velvet"**：`Velvet Afterhours`、`Velvet Scape`、`Scape Velvet` 三首。

- `velvet` 是英语常用词（天鹅绒质感 / lounge-jazz 语境的常见搭配），
  与特定作品的专有名词 **Velvet Room** 并非同一复合词，单用词不构成可保护的要素。
- 但在朱红配色的整体语境下，属于**同一语义邻域**，会在盲测中被一并观察。
- 处置：**保留**（改名会破坏曲库既有链接与 seo 字段），但盲测时若有人因此联想到来源作品，
  优先改名这三首而非改配色。
