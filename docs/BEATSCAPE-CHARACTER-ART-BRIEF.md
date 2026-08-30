# BeatScape 角色美术发包需求书（anime 立绘）

> **用途**：直接交给画师，或等图像生成服务恢复后作为 prompt 母本。
> **决策日期**：2026-08-30 · 方向：**anime（日式动画）画风**
> **关联**：[`BEATSCAPE-IP-STRATEGY.md`](./BEATSCAPE-IP-STRATEGY.md) · [`RESONANCE-VISUAL-PLAN.md`](./RESONANCE-VISUAL-PLAN.md) · [`RESONANCE-BLINDTEST.md`](./RESONANCE-BLINDTEST.md)
> **已有资产**：7 张三视图 `data/beatscape-characters/{key}-views.png`（几何剪影版，作为比例与道具的参考，画风需重做）

---

## 0. 最重要的一句话（请画师先读这段）

我们要的是 **anime 画风**，**不是**「看起来像某款既有 JRPG」。

**画风（技法层）不受著作权保护，随便用**——赛璐璐上色、干净线稿、夸张发型剪影、大眼睛、 anime 比例，这些是几十年动画工业的公共语法。

**但具体的表达受保护**。下面 §2 的红线清单是硬约束，**任何一条踩到就整稿退回**。

判断标准不是「我们有没有抄」，而是 **`Tetris Holding v. Xio Interactive`（2012）**：被告素材全部重画，仍被判侵权——理由是整体 *look and feel* 容易被误认。所以必须主动差异化，而不是被动地「不抄袭」。

---

## 1. 画风规范（技法层 — 自由使用）

| 项目 | 要求 |
|------|------|
| 上色 | **赛璐璐（cel shading）**：2–3 阶明暗，硬边阴影，不用柔光/渐变/辉光 |
| 线稿 | 干净肯定的主线，外轮廓略粗、内部结构线略细 |
| 发型 | **强剪影优先**——头发是第一识别点，要在 64px 剪影下可读 |
| 眼睛 | 大而有神， anime 比例；但**不做**任何既有角色的特定眼型 |
| 头身比 | 6.5–7 头身（青年），不要 Q 版也不要写实 |
| 明暗光源 | 统一右上主光（与既有三视图一致） |
| 背景 | 允许抽象夜景 / bokeh / 半调网点；**不要**具体建筑或可识别地标 |

---

## 2. 红线清单（表达层 — 踩一条整稿退回）

### 2.1 绝对禁止的视觉元素

| 类别 | 禁止 |
|------|------|
| **面部覆盖物** | 面具（多米诺/鸟嘴/全覆盖/半脸）、面罩、眼罩 |
| **服装** | 校服、制服、披风、斗篷、紧身衣、手套+靴子的套装语汇 |
| **符号** | 塔罗牌、人格面具、天鹅绒、电梯、蓝色房间、纹章、徽记 |
| **主题** | 怪盗 / 义贼 / 盗窃 / 秘密结社 / 「觉醒」「叛逆」叙事 |
| **配色组合** | 任何既有作品角色的标志性配色组合（尤其红黑 + 特定明度关系） |
| **文字** | 日文假名 / 拟声词贴图（除非是原创排版设计）；不出现任何第三方作品名 |
| **姿势** | 任何可识别的经典角色招牌姿势 |

### 2.2 需要主动规避的「气质陷阱」

最容易在无意识中靠近的几个点，画师请自查：

- **「酷、沉默、戴面罩的少年」**——这是被用烂的 archetype，改用**职业身份**建立气质（快递员、电工、乐手、机械师）
- **红黑高对比 + 尖锐几何**——我们自己的 RESONANCE 已经是红黑，**必须靠原创 motif（共振菱形 + 四轨）拉出识别度**，不能靠「红黑很酷」这件事本身
- **角色群像的站位与构图**——不要做任何既有作品的群像构图复刻

---

## 3. BeatScape 自有语义（这是差异化的唯一来源）

画师必须把下面这些**画进角色里**——它们是我们唯一能主张「这是我们的东西」的依据：

| 元素 | 用法 |
|------|------|
| **共振菱形** | 四层同心菱形向外扩散，中心实心。**永远出现在「声源」位置**：胸口 / 耳机 / 乐器 / 肩上的信鸽 |
| **District 配色** | 每个角色严格用自己 District 的主色（见 §4） |
| **四色结构** | 墨黑 `#12100F` + District 主色 + 米白 `#F2E4C9` + 琥珀 `#FFB020` |
| **职业道具** | 每个角色的标志物是**工作工具**，不是武器、不是徽章 |
| **幻境城市** | 氛围：夜间都市、雨后反光、远处霓虹；**不出现任何具体城市地标** |

---

## 4. 7 个角色的 anime 化方向

> 代码名为内部代号，**不作为 logo 使用**（避免与既有作品 logo 撞视觉）。

### VOLTA · Pulse Core（EDM / battle / `#E23D3D`）

- **身份**：城市电网夜班调度员
- **体型**：青年男性，宽肩，中等身高，站姿稳
- **发型（第一识别点）**：短发 + **静电炸开的不对称尖角**
- **服装**：朱红工装夹克 + 绝缘手套 + 工装裤
- **道具**：胸口四层共振菱形徽记（**不是面具**）
- **表情**：自信，带一点夜班的倦意

### STATIC · Night Grid（Hip-hop / night-drive / `#6E2426`）

- **身份**：深夜街区信使
- **体型**：中等偏瘦，微前倾
- **发型**：中长发，**兜帽压住**（兜帽是本角色的剪影核心）
- **服装**：深酒红宽松连帽衫 + 斜挎信使包
- **道具**：头戴式耳机（戴在头上或挂脖）+ 信使包
- **表情**：冷静，观察中

### PRISM · Glass Rim（Pop / groove / `#E4D8C4`）

- **身份**：玻璃幕墙光影剪辑师
- **体型**：纤细、高挑，肩线斜切
- **发型**：中长发，侧分，有光泽感
- **服装**：米白轻薄夹克；**护目镜推在额头上**（不遮眼）
- **道具**：反光刮板（**工具，不是武器**）
- **表情**：专注、温和

### EMBER · Afterhours Lane（R&B / chill / `#B0765A`）

- **身份**：打烊后还在弹 Rhodes 的酒吧乐手
- **体型**：放松的坐姿，肩线柔和
- **发型**：略长的微卷发
- **服装**：棕陶色宽松衬衫 + 马甲
- **道具**：一杯冷掉的咖啡 + 翻起的键盘盖
- **表情**：慵懒、温柔

### RIVET · Chrome Yard（Rock / battle / `#8C8079`）

- **身份**：废旧车间的吉他改装师
- **体型**：壮实、宽肩、厚手
- **发型**：短发 + **反戴的鸭舌帽**
- **服装**：金属灰工装背心 + 工具腰带
- **道具**：工具腰带（挂满工具）+ **缺一角的拨片挂坠**
- **表情**：爽朗、咧嘴

### GLIDE · Slide District（EDM / battle / `#FFB020`）

- **身份**：天台之间滑索穿行的信使
- **体型**：轻盈、运动型，前倾
- **发型**：短发，被风吹起
- **服装**：琥珀色轻装 + **长围巾（全局唯一的动态元素）**
- **道具**：滑索手套 + 飘起的长围巾
- **表情**：兴奋、向前

### HALO · Skyline Hook（Pop / groove / `#5B8DEF`）

- **身份**：城市天际线观测员
- **体型**：高瘦、直立
- **发型**：整齐的中长发
- **服装**：钢蓝色长外套
- **道具**：肩上停着的**机械信鸽** + 手持测距仪
- **表情**：沉静、远望

---

## 5. 差异化自检（每稿必过）

### 5.1 机器自检

- [ ] 全图 grep / 目视：**无**面具、校服、披风、塔罗、纹章
- [ ] **无**日文假名 / 拟声词贴图
- [ ] 共振菱形出现在声源位置
- [ ] 配色严格 = District 主色 + 墨黑 + 米白 + 琥珀
- [ ] 64px 剪影下**能和其他 6 个角色区分**

### 5.2 人工盲测（**硬性关卡，不过不放行**）

沿用 [`RESONANCE-BLINDTEST.md`](./RESONANCE-BLINDTEST.md)，**加一关角色稿**：

- 观察者 **5–10 名**，必须**不玩日式 RPG**
- **只给角色立绘，不给任何提示**；不提「画风改造」，**不提任何既有作品名（包括不要说「不是某某」）**
- 逐字照念一句：**「这个角色看起来出自哪部作品？」**
- 判定：**任一人**说出来源作品 → ❌ 不通过，退回重做差异化

> 门槛是「任一人」，不是「多数」。一个人被误导就说明 look and feel 已达混淆程度。

---

## 6. 交付规格（衍生品可用）

| 项目 | 规格 |
|------|------|
| 立绘 | 3000 × 4000 px，300 dpi，PNG（透明底）+ 分层 PSD/Clip 源文件 |
| 三视图 | 正 / 侧 / 背，统一基线对齐，同比例（几何版已产出，画风重做） |
| 表情差分 | 每角色 4 种（平静 / 专注 / 兴奋 / 疲惫） |
| 印刷分色 | 提供 CMYK 分色确认稿；专色（District 主色）需给潘通号 |
| 字体 | 只使用 SIL OFL / Apache 授权字体（见 `licenses/README.md` §1） |
| 交付格式 | 源文件 + 导出件（PNG / SVG / PSD） |

---

## 7. 给画师的三句话

1. **借技法，不借表达。** anime 的画法随便用，具体的符号和造型不许碰。
2. **识别度来自我们的语义，不是来自"酷"。** 共振菱形、District 配色、职业道具——这三样画进去了，就是 BeatScape 的人。
3. **不确定就问。** 任何你觉得「这个会不会太像某个作品」的地方，宁可先问再做——退回重画的成本远高于提前确认。

---

## 8. 附：模型选型与 prompt 母本

### 8.1 模型：**Animagine XL 4.0**（`cagliostrolab/animagine-xl-4.0`）

**已核实（2026-08-30，官方 HuggingFace 仓库）**：

| 项 | 值 |
|---|---|
| 许可 | **CreativeML Open RAIL++-M** |
| 商用 | ✅ **明确允许**（Permitted: Commercial use, modifications, distributions, private use） |
| 禁止 | 非法活动、有害内容、歧视、剥削 |
| 要求 | 附许可副本、声明更改、保留署名 |
| 基座 | Stable Diffusion XL 1.0 |
| 训练数据 | 8,401,464 张 anime 图，知识截止 2025-01-07 |
| 最佳参数 | Euler a · 28 steps · CFG 5 · 1024×1024（或 832×1216 竖版） |

**为什么不用 Illustrious XL**（anime 圈默认选择、质量最好）：
它的授权是 CreativeML OpenRAIL-M / Fair AI Public License，官方 FAQ 明确
**禁止闭源专有商业化**，且衍生模型（含你训的角色 LoRA）必须开源。
我们要卖衍生品、角色 LoRA 是核心资产，这条直接冲突 → **出局**。

**也不要用 FLUX.1 [dev]**：模型本身是非商用授权，商用需向 Black Forest Labs 单独买。
（FLUX.1 [schnell] 与 FLUX.2 [klein] 是 Apache 2.0，可商用，但 anime 需额外挂 LoRA。）

### 8.2 Animagine 的 tag 语法（**不是**自然语言）

官方 prompt 顺序：

```text
1girl/1boy/1other, character name, from which series, rating,
everything else in any order, [quality tags at the end]
```

- 质量标签**必须放最后**：`masterpiece, high score, great score, absurdres`
- **我们是原创角色 → 不填 character name、不填 series**。
  留空是刻意的：填 series 会把模型推向既有 IP。
- `rating:safe` 必须显式写入（品牌 IP 全程锁 safe）

**推荐使用现成脚本**，别手敲：

```bash
python3 scripts/beatscape-anime-prompts.py --list
python3 scripts/beatscape-anime-prompts.py --character volta            # 正面
python3 scripts/beatscape-anime-prompts.py --character volta --view side
python3 scripts/beatscape-anime-prompts.py --character volta --json     # 喂给脚本/UI
```

### 8.3 负向 prompt（含 IP 红线）

脚本里的 `NEGATIVE` 除了常规质量项，还把 §2 的红线写进了负向——
这是把 IP 约束**落到模型层**的实用做法：

```text
lowres, bad anatomy, bad hands, text, error, missing finger, extra digits,
fewer digits, cropped, worst quality, low quality, low score, bad score,
average score, signature, watermark, username, blurry, jpeg artifacts,
rating:sensitive, rating:nsfw, rating:explicit,
mask, domino mask, face mask, gas mask, visor, eyepatch, helmet,
school uniform, uniform, military uniform, cape, cloak, robe,
bodysuit, skinsuit, tarot card, arcana, tarot spread, playing cards,
weapon, sword, knife, gun, pistol, rifle, blade,
japanese text, furigana, speech bubble, cigarette, alcohol
```

### 8.4 生图

```bash
# 检查运行时
python3 scripts/beatscape-anime-gen.py --check

# 单角色批量出参考图（用于挑 LoRA 训练集）
python3 scripts/beatscape-anime-gen.py --character volta --count 24

# 全部 7 个角色
python3 scripts/beatscape-anime-gen.py --all --count 8
```

产出：`data/beatscape-characters/anime/{key}/{key}-{view}-{seed}-{i}-{s}.png`

### 8.5 下一步：LoRA 才是 IP

纯文生图**做不到角色一致性**——同一 prompt 跑两次是两个角色。
要得到「可无限复用的角色资产」，必须**每个角色训一个 LoRA**：

1. 上面批量出图 → 人工挑 15–20 张一致的
2. 以 **Animagine XL 4.0 Zero**（中性底座，专为 LoRA 训练设计）为基座
3. 在 Mac 本地训练（推荐 **Draw Things**，支持 Mac 端 LoRA 训练；ComfyUI 在 Mac 上做不到）
4. 得到 7 个角色 LoRA → 三视图 / 表情差分 / 衍生品稿全部可批量复现

> 这一步做完，你才有「IP」；在那之前只是「一堆好看的图」。

### 8.6 训练数据出处的风险提示

Animagine 用 840 万张 anime 图训练，「来源多样」。这意味着模型可能记住了某些
既有角色的特征。**这不构成法律责任，但会让 §5.2 的盲测更容易失败**。
所以用了 anime 模型之后，盲测这道关**只会更重要，不会更轻松**。
