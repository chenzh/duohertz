# BeatScape 节拍幻境｜欧美英文曲库音乐游戏站

**正式产品 PRD（AI 原生 · Vibe Coding · 海外出海版）**

| 字段 | 内容 |
|------|------|
| 文档类型 | 产品需求文档（PRD） |
| 产品名称 | **BeatScape**（节拍幻境） |
| 文档版本 | **v1.9.2（游戏切片 + 流媒体完整版双资产）** |
| 日期 | 2026-08-25 |
| 适配开发范式 | Vibe Coding 体感驱动、增量迭代、AI 自主开发 |
| 对标竞品 | Rhythm Plus（手感追平、体验超车） |
| 曲库音源 | **仅本地 MusicSaas AI 独立生成** |
| 曲库版权 | **全曲自有版权** |
| 内容总则 | **游戏内一切可感知内容均为自有生成，且必须契合 BeatScape「节拍幻境」主题** |
| 底层依据 | 项目 AI 标准架构、体感规范、工程红线、BUG 禁区、验收标准 |
| 状态 | **终版、可直接投产** |
| 父平台 | MusicSaas（本地 AI 音乐生成 API） |
| 关联文档 | `docs/PRD-WEB-RHYTHM-GAME.md`（NeonBeat 工作室向；可共享生成引擎与自动谱面管线） |

### 修订记录

| 版本 | 日期 | 说明 |
|------|------|------|
| v1.0 | 2026-08-24 | 终版量产 PRD：定位、架构、手感真值、功能、出海合规、SEO、运营全闭环 |
| v1.1 | 2026-08-24 | 曲库供给真值锁定：本地 MusicSaas AI 独立生成；五曲风配额 + Stage 上架数 + 生成/QA/自动谱面流水线 |
| v1.2 | 2026-08-24 | 版权真值：入库曲目均为产品方自有版权资产；页面与合规话术统一标注 Owned / AI Original |
| v1.3 | 2026-08-24 | 初版曲目表：结合玩法验收锁定 Stage 1 六首 + Stage 2 补齐至十首 |
| v1.4 | 2026-08-24 | 主题契合强制：全站自有生成内容对齐「节拍幻境」世界观 |
| **v1.5** | 2026-08-24 | 内容设计补全：4K/计分/模式/曲结构/catalog/街区/token/成就 |
| **v1.6** | 2026-08-24 | 防返工：chart.json；计分计数；首局分流；锁定 Prompt；IA/存档；AR |
| **v1.7** | 2026-08-24 | 二次防返工：速度模组/倒计时开声/HP/Miss/PB/舞台/Stage2 Prompt/字体/base |
| **v1.8** | 2026-08-24 | 三次防返工：输入边角；Slide；收束；校准；响度；道色；程序化封面；分享 URL |
| **v1.9** | 2026-08-24 | 矛盾清算 + Stage1 冻结 |
| **v1.9.1** | 2026-08-24 | 终检：MaxScore/封面措辞对齐 Local Board与程序化封面；确认无阻塞缺口，停扩规格 |
| **v1.9.2** | 2026-08-25 | 双资产真值：游戏切片（BeatScape）+ 流媒体完整版（MusicSaas App 引流）；时长分层与 catalog 字段 |

---

## 1. 项目概述

### 1.1 产品定位

一款国际化、高质感、极致顺滑的**浏览器节奏游戏平台**，面向海外轻量音游玩家社区。产品构建完整的 **「节拍幻境 BeatScape」自有内容宇宙**：音频、谱面、封面、音效、艺人笔名、曲名、UI 文案**全部自有生成**，统一服务同一主题——*Feel the Beat, Own the Scape.* 曲库不采购、不搬运商用热单，由运营方本地 **MusicSaas AI** 按 **车载听感 + 都市爵士战斗感（RESONANCE 声波）** 与幻境世界观独立生成，**全曲自有版权**。无需下载、即开即玩，以顶级丝滑音游手感为核心，以专业化数据复盘、极简现代视觉、全端统一律动体验为差异化优势，适配 Reddit、短视频等海外社区传播。

### 1.2 产品核心价值（三层价值）

1. **核心层（必须第一优先级）**  
   极致音游手感：超低时序延迟、稳定 60 帧、多端统一手感、智能设备补偿

2. **体验层（竞品超车）**  
   更细腻的判定容错、防断连、防误触、防时序漂移、后台时序自愈

3. **产品层（商业化完整）**  
   完整自有曲库、收藏、检索、个人战绩、精度复盘、排行榜、沉浸 UI 氛围（全部内容主题统一）

### 1.3 产品核心口号

> **Feel the Beat, Own the Scape.**  
> 手感顶级顺滑，节奏自成世界。

### 1.3a 主题世界观（内容创作唯一母题 · 强制）

**一句话世界观**：玩家进入由节拍构成的极简「幻境城市」——每一次 Perfect 都是点亮街区的光，曲库是这座城市的街区地图，全部由产品方自建。

| 维度 | 必须对齐（On-theme） | 严禁偏离（Off-theme） |
|------|----------------------|------------------------|
| 世界意象 | neon / glass / chrome / pulse / horizon / night drive / voltage / scape / skyline / afterhours | 二次元校园、魔法少女、和风神社、国风仙侠、像素复古堆砌 |
| 听觉 | **车载级宽声场** + **都市爵士战斗感**（funk / acid jazz / neo-soul / brass；RESONANCE 声波）；拍点清晰、可谱面化。全曲库方向见 [`BEATSCAPE-SONIC-DIRECTION.md`](BEATSCAPE-SONIC-DIRECTION.md) | 日系 OP、Vocaloid 感、戏曲、未授权成曲仿唱；复刻第三方 OST 旋律 |
| 视觉 | 低饱和赛博轻奢、通透留白、节奏光效、英文 UI | 高饱和二次元立绘、花哨边框、表情包风 |
| 命名 | 英文曲名 + 虚构英文艺人；词汇贴近「城市幻境 / 节拍地形」 | 真实歌手/歌名、中文曲名上架、梗图乱码标题 |
| 权利话术 | AI Original · Owned Rights · BeatScape | 「正版热单」「官方翻唱」「原曲授权引进」等误导表述 |
| 生成来源 | MusicSaas 本地 job + 自有封面/音效管线 | 外链商用曲、素材站成曲、玩家上传成曲入库 |

**主题关键词池（生成曲名 / Prompt / 封面时必须从中取至少 1 个语义锚点）**

`scape` · `neon` · `pulse` · `horizon` · `glass` · `chrome` · `voltage` · `skyline` · `afterhours` · `grid` · `echo` · `drive` · `atlas` · `circuit` · `rift` · `bloom` · `lane` · `vector`

### 1.4 目标用户

| 用户类型 | 画像与诉求 |
|----------|------------|
| 海外休闲乐迷（核心） | 偏好 **night-drive groove / stylish urban energy** 听感；要简约高级节奏体验；接受并偏好 **AI 原曲自有版权**，不要二次元与扒曲热单 |
| Reddit / 短视频社区玩家（增长） | 免安装、秒开、高帧率、低延迟纯网页体验；乐于分享丝滑手感与高分复盘截图 |
| 音游精度核心玩家（口碑） | 关注时序精准度、设备手感统一、高密度谱面稳定性；需要专业复盘数据练度提升 |
| 通勤轻量用户（泛用户） | 移动端碎片化；防误触、无弹窗、无系统干扰、弱网可用 |

### 1.5 开发铁律（继承架构红线）

优先级绝对不可颠倒：

```text
音频时序同步 ＞ 60fps 稳态帧率 ＞ 判定手感一致性 ＞ 运行稳定性 ＞ 功能完整性 ＞ UI 美观
```

---

## 2. 竞品分析（PRD 落地版）

### 2.1 对标对象

**核心对标：Rhythm Plus**（行业标杆网页开源音游）

### 2.2 竞品优势（我方必须 1:1 持平）

- 成熟的基础手感逻辑
- 轻量化架构、极低启动成本
- 多端基础可用

### 2.3 竞品致命短板（我方核心卖点）

1. 高密度谱面时序漂移、越打越不准  
2. 大难度谱面断崖掉帧  
3. 长按收尾极易无故断连  
4. 手机端手势干扰、误触严重  
5. 切后台时序彻底错乱  
6. 无复盘、无精度分析、无失误统计  
7. 曲库体系简陋、无运营能力  
8. 视觉单调、无节奏沉浸感  

### 2.4 我方产品差异化定位

手感持平行业标杆、稳定性碾压竞品、英文曲库垂直深耕、社区体验极致轻量化、专业数据复盘差异化、极简高级视觉适配海外审美。彻底区别于日系二次元音游，打造「欧美流行乐专属轻量化节奏游戏」唯一赛道标杆。

---

## 3. 整体产品架构（严格继承 AI 架构）

### 3.1 五层解耦架构（强制）

1. **音频时序层**（全局唯一真值）  
2. **渲染底层**  
3. **游戏判定内核层**  
4. **业务数据层**  
5. **UI 展示层**  

### 3.2 核心设计原则

- 游戏内核完全无 UI 依赖  
- 时序只跟随 WebAudio 时间轴，不跟随帧时间  
- 所有手感参数可配置、可自适应  
- 所有功能增量迭代、禁止大重构  

---

## 4. 核心游戏玩法需求（内容设计真值）

### 4.1 玩法形态：4 道下落式（Neon Lanes）

> 废止模糊表述「单键下落」。BeatScape 初版起即锁定 **4K 下落式**，与 Rhythm Plus / Web osu!mania 手感对齐。

| 元素 | 规格 | 说明 |
|------|------|------|
| 道数 | **4 lanes**（左→右 0–3） | 固定不可改 |
| 滚动 | 默认 **下落**（downscroll） | 上落为 Post-MVP |
| 默认键位 | `D` `F` `J` `K` → lane 0–3 | 可 remap，见 §4.8 |
| 触屏 | 底部判定线四等分热区；按住 = Hold | 边缘防误触见 §8.2 |
| 判定线 | 屏高约 **15%** 处固定 receptor | — |
| 道语义（生成提示） | 0=kick · 3=snare · 1–2=hat/旋律 | 自动谱面优先外道清晰 |
| Approach Rate | Easy **22** / Standard **28** / Hard **34** | **定义见 §4.10**（提前可见拍数） |
| 曲长窗口 | **游戏切片** 60–90s（Stage1 已定 60–75s）；**流媒体完整版** 见 §6.0.27 | Instant Demo 可裁前 48s |

### 4.2 音符类型与生成规则

| 类型 | 视觉 | 输入 | Stage 1 | Stage 2+ |
|------|------|------|---------|----------|
| **Tap** | **霓虹菱形**（唯一造型，禁止圆点混用） | 在判定线按下 | ✅ | ✅ |
| **Hold** | 头 + 身条 + 尾 | 头按下，持续按住至尾 | ✅（#04 主验） | ✅ |
| **Chord** | 同帧 2–3 道 | 15ms 内齐按 | ✅ Hard 可出 | ✅ |
| **Slide** | 跨道轨迹 | 滑动或顺序触达 | ❌ 禁止 | ✅（#07 主验） |

**Hold 判定**

- 头部：按 Tap 四档判定并计分  
- 身段：**不计 tick 分**（头+尾两次判定即可）  
- 尾部：须在 `end` 释放；窗口 = 当前模式 Good 窗 + **±20ms 吸附**；提前/过晚 = 尾 Miss（头分保留）  
- 尾 Miss / 头 Miss 均 **断连击**  
- 自动谱：能量持续 ≥400ms → Hold  

**Slide 判定（Stage 2）**

| 输入 | 成功条件 |
|------|----------|
| 触屏 | 自 `lane` 滑向 `to`；在 `end` 前进入目标道中心 ±半道宽；路径不偏离半道宽 |
| 键鼠 | **顺序键**：先在起点窗内按下 `lane` 对应键，再在 `end` 前按下 `to` 键（无需物理滑动）；两键间隔 ≤ `end - t` |

- 仅相邻道；跨 2 道以上禁止  
- **只在完成瞬间判 1 次**（以到达 `to` 的时刻 vs `end` 的 Δt 定档）；失败 = 1 次 Miss  
- Stage 1 谱面禁止出现 `slide`  

**Chord**

- 同帧最多 3 键；每键独立计数  
- 各键相对 `note.t` 在窗内，且键间互差 ≤ **15ms**  
- 漏键：漏道 Miss，其余正常  

### 4.3 四档判定窗口（固定业务真值）

与 §22.2 一致。时间轴 = `AudioContext.currentTime`。

> **禁止**从 NeonBeat / 其他项目拷贝判定窗常数（NeonBeat 为 22/45/80；BeatScape **锁定 15/30/50 Arcade**）。

| 档位 | Arcade / Practice（±ms） | Casual（±ms） | 单点基础分 | 连击 | 反馈 |
|------|--------------------------|---------------|------------|------|------|
| Perfect | **15** | **28** | 300 | 不断 | 金光 + 微震 |
| Great | **30** | **55** | 200 | 不断 | 道色爆发 |
| Good | **50** | **90** | 100 | **断** | 弱绿 |
| Miss | 超出 Good | 超出 Good | 0 | **断** | 红闪 + SFX |

**产品规则**：空按无惩罚；杜绝无故 Miss。 

### 4.4 计分、准确率、字母评级

**判定对象计数（TotalNotes · 防返工真值）**

| 音符 | 计入 TotalNotes | 说明 |
|------|-----------------|------|
| Tap | 1 | — |
| Hold | **2**（头 + 尾） | 头、尾各一次判定与得分 |
| Chord（n 键） | **n** | 每键独立 |
| Slide | **1** | 完成或 Miss 只计一次 |

**连击倍率**

| Combo | 倍率 |
|-------|------|
| 0–49 | ×1 |
| 50–99 | ×2 |
| 100–199 | ×3 |
| 200+ | ×4（封顶） |

**单次判定得分** = 基础分（Perfect300 / Great200 / Good100 / Miss0）× 当前连击倍率  

**理论满分（排行归一用）**

```text
MaxScore = TotalNotes × 300 × 4
（按全 Perfect 且全程处于 ×4；实际难达，仅作上限校验）
写入 Local Board 的 score > MaxScore × 1.01 → 拒收（防篡改）
```

**准确率**

```text
Accuracy% = (P×1.0 + Gr×0.75 + Go×0.40 + M×0) / TotalNotes × 100
保留 2 位小数；P/Gr/Go/M 为各档判定次数
```

**单局字母评级**

| Grade | Accuracy | 附加徽章 |
|-------|----------|----------|
| **S** | ≥ 95% | — |
| **A** | ≥ 90% | — |
| **B** | ≥ 80% | — |
| **C** | ≥ 70% | — |
| **D** | < 70% | — |
| **FC** | 无 Miss | 可叠任何 Grade |
| **AP** | 全 Perfect | 叠在 S |

**荣誉段位** 与单局 Grade 分离，见 §17。

### 4.5 游玩模式（内容绑定）

| 模式 | 失败 | 速度 | 默认推荐曲 | 目标 |
|------|------|------|------------|------|
| **Casual** | 无失败，必打完 | 0.75× / 1.0× / 1.25× | #02 Glass Horizon | 新手、种草 |
| **Arcade** | HP 归零失败 | 仅 1.0× | #01 Neon Pulse / #05 | 挑战、排行 |
| **Practice** | 无失败；连 Miss×3 → 自动 0.5× 持续 5s | 0.5×–1.0× | #09 Blue Hour Loop | 练度 |

**Arcade HP**

- 初始 **100**；**上限封顶 100**（Perfect 不能加破 100）  
- Perfect +2 · Great +1 · Good 0 · Miss **−7** · Hold 尾 Miss **−5**  
- HP ≤ 0 → Failed（不进 Arcade 榜）

**速度模组（防实现分歧）**

| 模式 | 速度选项 | 音频 | 谱面时钟 | 判定窗 |
|------|----------|------|----------|--------|
| Casual | 0.75 / 1.0 / 1.25 | **恒 1.0×** | 视觉下落变快/慢 | **不变** |
| Arcade | 仅 1.0 | 1.0× | 1.0× | 不变 |
| Practice | 0.5–1.0 | **与谱面同步变速** | 同步 | **仍用 Practice=Arcade 窗 ms** |
| Practice 连 Miss×3 | 自动降至 **max(0.5×, 当前×0.5)** 持续 5s | 同步 | 同步 | 不变 |

### 4.6 难度档密度指标（自动谱面验收）

| 档位 | 目标 NPS（均） | 峰值 NPS（2s） | Hold 占比 | Chord：平均每 10s 组数 | Slide（Stage2+） |
|------|----------------|----------------|-----------|------------------------|------------------|
| Easy | 2.0–3.5 | ≤ 5 | 5–15% | **0–1** | 0 |
| Standard | 3.5–5.5 | ≤ 8 | 10–25% | **1–3** | 0–2 段/曲 |
| Hard | 5.5–8.5 | ≤ 12 | 15–30% | **3–6** | ≤ 8 段/曲 |

**自动谱量化网格**

- 主网格 **1/4**；允许 **1/8**；Hard 允许 **1/16**  
- 初版 **禁止三连音网格**  
- 所有 `t`/`end` 吸附网格后写入 chart.json  

不达标 → 调参或重生成。

### 4.7 对局状态机

```text
Loading → Countdown(3s) → Playing ⇄ Paused → Finished → Results / Replay
         ↘ Exit confirm → Library（本局分丢弃）
         ↘ (Arcade HP=0) → Failed → Retry | Casual clear
```

对局中：禁页面滚动、双指缩放、误触刷新。

### 4.8 设置与按键

| 设置 | 范围 | 存储 |
|------|------|------|
| Key remap | 任意 4 键 | `bs_keys` |
| Global offset | −200…+200 ms；与 chart.`audio_offset_ms` **相加** | `bs_offset_ms` |
| Scroll bias | ±15% → 只乘 `approach_sec` | `bs_settings` |
| Hitsounds | On/Off | — |
| Fancy FX | On/Off；`prefers-reduced-motion` 强制 Off | — |
| Casual speed | 0.75 / 1.0 / 1.25（仅视觉） | — |
| Practice speed | 0.5–1.0（音画同步） | — |

### 4.9 首次引导 vs Play Now

| 条件 | 行为 |
|------|------|
| 未引导 | 强制引导 → #02 Easy Casual（Skip → #01 Std **Casual**） |
| 已引导 + Play Now | #01 Std **Arcade** |
| 已引导 + 曲库 | 自选；默认 catalog |
| 中途 Exit | 确认 *Leave the Scape?* → 丢弃本局分 |
| Replay | 同 chart + 用户 offset；重新 Countdown |

```text
1. 闪屏 ≤1.5s
2. Tap to enter the Scape（解锁 AudioContext）
3. Calibration 8 拍 @120（可 Skip）
4. #02 Easy Casual → bs_onboarded=true
5. CTA → Play Now / Neon Pulse
```

### 4.10 Approach Rate

```text
approach_beats = 50 / AR
approach_sec   = approach_beats × (60 / BPM) × (1 + scroll_bias)
```

Easy22 / Std28 / Hard34；@160BPM 约 0.85s / 0.67s / 0.55s。禁止另造像素速度常数。

### 4.11 倒计时 / 暂停 / Miss / 失败

| 事件 | 行为 |
|------|------|
| Loading 完成 | **上架音频**（m4a）decode 成功 + chart 解析 + `total_notes` 校验通过 |
| Countdown 3.0s | 可弱节拍器；**主曲未起、不判定** |
| GO = t=0 | 主曲与谱面时钟 **同时启动** |
| 有效击中时刻 | `note.t + audio_offset_ms/1000 + user_offset_ms/1000` |
| 未击中自动 Miss | 过点后超出 Good 窗仍无击中 → Miss，断连 |
| Hold 中段松开 | 尾预定 Miss（头分保留） |
| Pause / 切后台 | 冻音画时钟；回前台自愈后再 Resume |
| Arcade HP=0 | 停谱；淡出 ≤300ms；不上传 |
| Chord 齐按 | 各键相对 `note.t` 落在窗内，且键间互差 ≤ **15ms** |

### 4.12 舞台几何（防 UI 返工）

| 项 | 真值 |
|----|------|
| 判定线 | 距底 = 短边 × **15%**（含 safe-area） |
| 四道 | 对局区均分；热区=道宽 |
| 移动端 | 竖屏提示；`touch-action: none` |
| PC 对局区 | 最大宽 **560px** 居中 |
| 键位浮层 | 前 3 局显示 D F J K |

### 4.13 个人最佳（PB）

同一 `track_id + tier + mode`：

1. Arcade：更高 score 覆盖；同分比 Accuracy  
2. Casual/Practice：只存本地 PB，默认不上传  
3. `history` 最多 10 条  
4. 低分永不覆盖高分 PB  

### 4.14 输入与击中边角（防漏判 / 防连触返工）

| 规则 | 真值 |
|------|------|
| 判定时钟 | 仅 WebAudio；渲染可 vsync，**逻辑不跟帧** |
| 同一 note | 只接受 **第一次** 有效击中；其后忽略 |
| 键盘 | `keydown` 边沿触发；忽略系统 key repeat |
| 空按 / 错道空按 | 无惩罚、不断连 |
| 幽灵击 | Miss 之后在同道乱按 → 忽略 |
| 防抖 | 同道两次 keydown 间隔 < **20ms** 视为一次 |
| 多指 | 每指绑定一道热区；滑出热区按该道抬起处理 |

### 4.15 校准算法（8 拍）

```text
期望时刻: t_i = t0 + i * (60/120), i = 0..7
用户击打: u_i
offset_ms = median(u_i - t_i)   // 取中位数，抗误触
写入 bs_offset_ms；夹紧到 [-200, 200]
```

Skip → offset=0。可在 Settings 重做。

### 4.16 对局收束条件

满足任一即进入 Finished：

1. 主曲 `ended` / 播放头 ≥ `duration_sec`  
2. 或：最后一判定对象已结算且再经过 **500ms**  

收束后 **禁止**再写入新判定；然后进 Results。

### 4.17 结果页数据传递

对局结束写入 `sessionStorage.bs_last_run`，**schema 固定**：

```json
{
  "v": 1,
  "track_id": "bs-s1-01",
  "title": "Neon Pulse",
  "artist": "Pulse Atlas",
  "tier": "standard",
  "mode": "arcade",
  "score": 0,
  "accuracy": 0,
  "maxCombo": 0,
  "grade": "A",
  "fc": false,
  "ap": false,
  "counts": { "perfect": 0, "great": 0, "good": 0, "miss": 0 },
  "totalNotes": 0,
  "durationMs": 0,
  "endedAt": "ISO-8601"
}
```

- `/results` 只读该对象；缺 `v` 或字段 → 回 `/library`  
- Replay：用 `track_id/tier/mode` 重开 `/play/...`，不复用上局判定流  

### 4.18 Stage1 内容设计冻结声明

自 **v1.9** 起，Stage1（6 首 + §4 玩法真值）视为 **冻结**：

- 允许：修文档笔误、修实现 bug、补测试  
- 禁止：未开变更单就改判定窗 / 计分 / 曲目表 / Prompt / AR 公式  
- Stage2（Slide/#07–10）按既有表推进，不回溯改 Stage1 手感常数  

**终检结论（v1.9.1）**：玩法 / 曲库 / 主题 / 音频格式 / 榜 / 目录 / schema **无阻塞性缺口**；继续加规格易导致文档膨胀返工。下一步应 **实现** `apps/beatscape/` 或生成 #01，而非再扩 PRD。

英文文案见 §6.0.11。

---

## 5. 核心体验能力（技术壁垒 + 出海差异化）

### 5.1 行业顶级时序能力

- 全局音画同步误差 ≤30ms（优于竞品 40ms）  
- 杜绝高密度谱面时序累计漂移  
- 后台切出、切回自动时序校准自愈  

### 5.2 全设备智能自适应

- **Stage1–2**：仅 §4.15 手动校准 offset；**不做**隐式自动延迟检测（避免与校准双源冲突）  
- **Stage3+（可选）**：自动建议 offset，仍须用户确认后写入 `bs_offset_ms`  
- 手机 / 电脑判定窗与计分规则同一套真值（仅触控热区不同） 

### 5.3 极致手感优化（竞品短板全覆盖）

- 长按防断连优化  
- 滑动轨迹容错增强  
- 多指触控隔离  
- 移动端系统手势全屏蔽  
- 全局防抖、防误触体系  

### 5.4 极限性能标准

- 对局稳态 60fps 无波动  
- 千键高密度谱面零断崖掉帧  
- 帧循环无冗余计算、无 DOM 阻塞  

---

## 6. 功能模块详细需求（AI 英文风格曲库 + 出海适配）

### 6.0 曲库供给总则（强制真值 · 不可改）

| 规则 | 真值 |
|------|------|
| 唯一音源 | 本地 **MusicSaas** AI 生成（Stable Audio 3 器乐 / ACE-Step 英文人声） |
| **版权归属** | **全曲自有版权**：入库音频、自动谱面、曲目元数据、配套封面均为产品方可运营资产 |
| **主题契合** | 每首入库曲必须通过 §1.3a 主题闸门：曲名 / Prompt / 封面 / 艺人笔名均落在「节拍幻境」语义内；离题内容一律废弃 |
| **内容自有范围** | 音频、谱面、封面、hitsound、结算海报底板、曲库文案、虚构艺人设定 —— **全部自有生成，禁止外采成曲与离题素材** |
| 禁止项 | 商用版权曲、流媒体扒曲、用户上传成曲入库、日系 / 国风 / 二次元曲风包、任何非自有版权或离题音源 |
| 「热单感」含义 | 仅指 **风格标签与听感定位**，不是真实授权曲目；不暗示外部版权使用权 |
| 作者署名 | `BeatScape AI` 宇宙下的虚构英文艺人；元数据含 `engine` + `preset_id` + `job_id` + `rights: owned` + **`theme: beatscape`** |
| 谱面来源 | MusicSaas 音频 → 自动谱面（Easy / Standard / Hard）；人工仅 QA 微调 |
| 与 NeonBeat 关系 | 共享生成 API 与自动谱面；BeatScape 运营预生成入库；**主题包与人声包以本文为准，禁止直接搬 NeonBeat 日系 OP** |

**标准供给流水线（每首必过）**

```text
选定风格包 + BPM 真值
  → 本地 MusicSaas 提交 job（prompt 合同见 §6.0.3）
  → 导出 **流媒体母带 WAV**（完整版时长见 §6.0.27）
  → 音频 QA（BPM 可检、拍点清晰、无违规人声渗漏）
  → 从母带精剪 **游戏切片** + 转码 game m4a（谱面对齐切片时间轴）
  → 自动谱面 ×3 难度（仅覆盖游戏切片）
  → 谱面 QA（首音时机、drop 密度、无故 Miss 抽检）
  → 写入曲库清单 catalog.json + 静态资源（game + stream 双路径）
  → 上架（标签 / SEO / 封面 / 流媒体引流链）
```

#### 6.0.1 五曲风配额与上架规模（产品规划真值）

曲风筛选固定 **5 类**。正式版目标 **50 首 AI 原曲**（每风 10 首）；EDM 为音游手感主仓，Stage 早期可略超配。

| 曲风 | 听感定位（AI 风格包） | BPM 建议区间 | 引擎偏好 | Stage 1 最小可玩 | Stage 3 曲库产品化 | 正式版目标 |
|------|----------------------|--------------|----------|------------------|--------------------|------------|
| **EDM** | 强 kick/snare、build + drop、电子舞曲 | 128–170 | SA3 `game_bgm` | **2** | **6** | **12** |
| **Pop** | 欧美流行钩子、明亮合成器、可循环段落 | 100–128 | SA3；可选 ACE 英文短副歌 | **1** | **5** | **10** |
| **Hip-hop** | 808、切分鼓点、trap / boom-bap 感 | 80–110 | SA3 `game_bgm` | **1** | **5** | **10** |
| **R&B** | 平滑 groove、弱打击、氛围铺底 | 70–100 | SA3；可选 ACE 英文弱人声 | **1** | **4** | **8** |
| **Rock** | 电吉他 riff、鼓组清晰、4/4 推进 | 110–150 | SA3 `game_bgm` | **1** | **5** | **10** |
| **合计** | — | — | — | **6** | **25** | **50** |

**运营标签（4 类 · 仅营销/筛选，不代表版权来源）**

| 标签 | 含义 | 建议占比（正式版 50 首内） |
|------|------|---------------------------|
| Hot Chart Style | 高能量、适合种草截图 | ~30%（15） |
| Viral Style | 短钩子、前 10s 抓耳、适短视频 | ~25%（12） |
| Classic Style | 稳、好练、偏低难度友好 | ~25%（12） |
| New Release | 当月新生成上架 | ~20%（滚动池，每月 +2～4） |

#### 6.0.2 BeatScape 风格包（对接本地 MusicSaas preset）

在 NeonBeat 既有 `mg-*` 预设之上，BeatScape 运营曲库使用独立风格包 ID（生成时写入 `preset_id`）：

| Style Pack ID | 曲风 | BPM 真值 | 时长 | Prompt 要点（强制含拍点合同） |
|---------------|------|----------|------|------------------------------|
| `bs-edm-main` | EDM | 160 | 75s | clear beat, 4/4 kick, build-up + drop, instrumental, loop-friendly |
| `bs-edm-climax` | EDM | 170 | 60s | intense drop, synth lead, chart-friendly drums |
| `bs-pop-hook` | Pop | 118 | 75s | english pop energy, bright synth, clear snare, instrumental（或短英文副歌 ACE） |
| `bs-hiphop-808` | Hip-hop | 95 | 75s | 808 bass, crisp hats, clear downbeat, instrumental |
| `bs-rnb-groove` | R&B | 88 | 75s | smooth groove, soft kick, spacious, instrumental |
| `bs-rock-drive` | Rock | 132 | 75s | electric guitar riff, tight drum kit, 4/4, instrumental |
| `bs-chill-pop` | Pop / Classic | 120 | 75s | soft pads, easy chart mood, clear beat |
| `bs-theme-en` | Pop 人声 | 128 | 45s | **English lyrics only**，ACE-Step；禁止日语 / 二次元 OP 风格 |

> 禁止将 NeonBeat 的 `mg-theme-vocal`（日系 OP）直接入库 BeatScape。

#### 6.0.3 Prompt 合同（每首生成强制）

所有入库曲必须满足：

- 明示 **BPM**（与风格包一致）  
- 含 **`clear beat` / `4/4`（或风格对应清晰 downbeat）**  
- 器乐曲：`instrumental, no vocals`  
- 人声曲：仅 **英文歌词**，且歌词意象对齐 §1.3a（neon / scape / pulse 等），禁止日语与二次元台词  
- **主题锚点**：Prompt 必须含至少 **2** 个 §1.3a 主题关键词，并含固定后缀：`beatscape original, rhythm game chart music, owned rights`  
- **禁止**真实歌手名、真实歌曲名、版权 IP、anime / j-pop / vocaloid / 二次元相关词  
- 产出格式：**WAV · 44.1 kHz · stereo**  

**主题 Prompt 模板（示例）**

```text
[genre] rhythm game track, [BPM] BPM, clear 4/4 beat, [scape keyword x2],
minimal neon city atmosphere, chart-friendly drums, instrumental, no vocals,
beatscape original, owned rights, loop-friendly
```  

#### 6.0.4 生成与 QA 验收门槛（入库闸门）

| 检查项 | 门槛 |
|--------|------|
| BPM 可检测且与标注偏差 | ≤ ±3 BPM（≥ 90% 批次达标） |
| 自动谱面三难度可玩、无需手改 | ≥ 85% |
| 器乐曲人声渗漏 | ≤ 5%（抽检） |
| 音画同步抽检（手感） | 符合 §22 时序真值 |
| 元数据完整 | `track_id` / `genre` / `bpm` / `engine` / `preset_id` / `job_id` / `created_at` / `rights: owned` / **`theme: beatscape`** |
| 版权闸门 | 缺 `rights: owned` 或来源非 MusicSaas 本地 job → **禁止入库** |
| **主题闸门** | 曲名/艺人/Prompt/封面任一离题（二次元、真实热单感仿冒、国风等）→ **禁止入库并重生成** |

不达标 → **整曲废弃重生成**，禁止「将就上架」。

#### 6.0.5 分 Stage 曲库交付清单

| Stage | 曲库目标 | 说明 |
|-------|----------|------|
| Stage 1 | **6 首**（§6.0.6-A 定名表） | 手感验证优先；可本地离线包，不依赖在线生成 |
| Stage 2 | **10 首**（+ §6.0.6-B） | #07 起允许 Slide；#08 人声稀疏谱 |
| Stage 3 | **25 首**（五风齐） | 曲库页搜索 / 分类 / 收藏 / 缓存全开 |
| Stage 4 | **40 首** | 排行榜与复盘有足够样本；New Release 滚动开始 |
| Stage 5 / 正式版 | **50 首** + 每月 +2～4 | 差异化打磨；CDN 静态分发；停用未过 QA 曲 |

**维护节奏（对齐 §21）**

- 每周：手感修 + **0～1** 首替补 / 新曲（本地生成）  
- 每月：批量生成候选 **8～12** 首 → QA 过关入库 **2～4** 首  

#### 6.0.6 初版曲目表（结合游戏设计 + 主题世界观 · 强制按表生成）

**原则：先定玩法职责，再定歌；歌必须落在「节拍幻境」里。**  
每首歌同时满足：① 至少一个玩法验收目标；② §1.3a 主题锚点；③ 自有版权生成。禁止「好听但离题」或「有主题但不可玩」。

##### A. Stage 1 最小可玩包（6 首 · 初版必交付）

默认「**Play Now**」（已引导用户）= **#01 Neon Pulse** · Standard · Arcade。  
未引导用户走 §4.9，不直接进 Arcade。全部 `rights: owned` + `theme: beatscape`。

| # | track_id | 英文曲名 | 艺人 | 曲风 | BPM | 时长 | 风格包 | District | 标签 | 默认难度/模式 | 允许音符 | 玩法职责 |
|---|----------|----------|------|------|-----|------|--------|----------|------|---------------|----------|----------|
| 01 | `bs-s1-01` | Neon Pulse | Pulse Atlas | EDM | 160 | 75s | `bs-edm-main` | Pulse Core | Hot Chart | Std / Arcade | Tap Hold Chord | Instant；Drop≤8s |
| 02 | `bs-s1-02` | Glass Horizon | Soft Circuit | Pop | 118 | 75s | `bs-pop-hook` | Glass Rim | Viral | Easy / Casual | Tap Hold | 新手首局 |
| 03 | `bs-s1-03` | Night Drive 808 | Low Voltage | Hip-hop | 95 | 75s | `bs-hiphop-808` | Night Grid | Classic | Std / Arcade | Tap Hold Chord | 低 BPM |
| 04 | `bs-s1-04` | Velvet Afterhours | Mira Lane | R&B | 88 | 75s | `bs-rnb-groove` | Afterhours Lane | Classic | Easy / Casual | Tap Hold | 长按主验 |
| 05 | `bs-s1-05` | Voltage Drop | Gridline | EDM | 170 | 60s | `bs-edm-climax` | Pulse Core | Hot Chart | Hard / Arcade | Tap Hold Chord | 高密度 |
| 06 | `bs-s1-06` | Chrome Riff | Iron Echo | Rock | 132 | 75s | `bs-rock-drive` | Chrome Yard | New Release | Std / Arcade | Tap Hold Chord | Rock 五风 |

> Stage 1 **全曲禁止 Slide**。Hip-hop 谱面网格按 **标注 BPM**（95）出谱，不做 double-time 显示歧义；若鼓点听感偏 double，仍以 metadata.bpm=95 为判定真值。

**Stage 1 验收映射**

| 验收项 | 主测曲 | 辅测曲 |
|--------|--------|--------|
| 音画同步 ≤30ms、首音时机 | #01 Neon Pulse | #05 |
| 新手无无故 Miss、空按无罚 | #02 Glass Horizon | #04 |
| 低 BPM / 切分手感 | #03 Night Drive 808 | #04 |
| 长按防断连 | #04 Velvet Afterhours | #01 |
| 高密度稳 60fps、无漂移 | #05 Voltage Drop | — |
| 非 EDM + 主题仍统一 | #06 Chrome Riff | #03 |
| 主题视觉/命名一致 | 全表曲名含 scape 意象 | 封面同母题 |

##### B. Stage 2 补齐至 10 首（完整闭环 · 初版+）

| # | track_id | 英文曲名 | 艺人 | 曲风 | BPM | 风格包 | District | 允许音符 | 玩法职责 |
|---|----------|----------|------|------|-----|--------|----------|----------|----------|
| 07 | `bs-s2-01` | Slide City | Vector Bloom | EDM | 140 | `bs-edm-main`+sweep | Slide District | +Slide | 滑动主验 |
| 08 | `bs-s2-02` | Skyline Hook | Ada North | Pop | 128 | `bs-theme-en` | Skyline Hook | Tap Hold（人声稀疏） | 英文人声 |
| 09 | `bs-s2-03` | Blue Hour Loop | Quiet Neon | Pop | 120 | `bs-chill-pop` | Glass Rim | Tap Hold | Practice |
| 10 | `bs-s2-04` | Asphalt Anthem | Redline Co. | Rock | 148 | `bs-rock-drive` | Chrome Yard | Tap Hold Chord | 高速摇滚 |

##### C. 初版不做什么（边界）

- 不上真实热单、仿唱、外采成曲  
- 不上日系 OP、二次元立绘封面、离题曲名  
- 初版不做 50 首铺量；**先打穿 6→10 首「可玩 + 主题统一」**  
- 未过版权闸门 / 主题闸门 / 手感 QA 者不得进 Play Now 默认池  

##### D. 生成优先级

```text
P0  #01 Neon Pulse  → Instant Demo / 主题主视觉曲
P0  #05 Voltage Drop → 高压稳定性
P0  #02 Glass Horizon → 新手漏斗
P1  #04 Velvet Afterhours → 长按
P1  #03 Night Drive 808 → 低 BPM
P1  #06 Chrome Riff → 五风齐
P2  #07–#10 → 滑动 / 英文人声 / 练度 / 高速摇滚
```

#### 6.0.7 全站自有内容资产清单（必须主题契合）

| 资产类型 | 生成方式 | 主题要求 | 入库标记 |
|----------|----------|----------|----------|
| 曲目音频 | 本地 MusicSaas → **流媒体母带 WAV** + **游戏切片 m4a**；格式见 §6.0.23 · §6.0.27 | `rights: owned` |
| 自动谱面 | 自研 auto-chart | Easy/Std/Hard |
| 曲目封面 | **Stage1–2：程序化**（§7.5 token + district 色 + 几何）；禁止等 AI 出图才上架 | 同 `track_id` |
| Hitsound | 自有短采样；清单 §6.0.13；**hold-tick 默认 Off** | `theme: beatscape` |
| 虚构艺人 | 文案自拟英文笔名 | 与曲名意象配套（如 Pulse Atlas） | 写进 catalog |
| 结算海报 / OG 图 | 自有模板渲染 | Logo + 英文战绩 + 极简幻境底 | Owned 露出 |
| 全站 UI 文案 | 原生英文撰写 | 无中文残留上架；术语统一 | — |

任一资产离题或非自有 → **整曲/整页不可上架**。

#### 6.0.8 曲目结构模板（所有入库曲统一）

时间以曲长 T 归一；生成与自动谱面按段落打标。

| 段落 ID | 时间占比 | 听感 | 谱面倾向 |
|---------|----------|------|----------|
| `intro` | 0–12% | 铺垫、拍点建立 | 稀疏 Tap，无 Slide |
| `build` | 12–28% | 能量爬升 | 密度缓增，可少量 Hold |
| `drop` | 28–55% | 主高潮 | 峰值 NPS；Hard 可 Chord |
| `groove` | 55–78% | 稳定中段 | Standard 密度；可 Hold |
| `outro` | 78–100% | 收束 | 降密度；禁止突兀超密 |

**硬规则**

- Instant / 主推曲（#01）：`drop` 起点 ≤ 开局后 **8s**  
- 首音：开局后 **1000–2500ms**  
- **Instant Demo 裁剪**：仅用于营销预览时取音频 **[0, 48s]**；正式对局仍用全长 `duration_sec`  
- 段落 metadata：`sections[{id,t0,t1}]`   

#### 6.0.9 `catalog.json` Schema（强制）

```json
{
  "version": 1,
  "tracks": [
    {
      "track_id": "bs-s1-01",
      "title": "Neon Pulse",
      "artist": "Pulse Atlas",
      "genre": "EDM",
      "bpm": 160,
      "duration_sec": 75,
      "stream_duration_sec": 198,
      "preset_id": "bs-edm-main",
      "engine": "stable-audio-3",
      "job_id": "local-...",
      "rights": "owned",
      "theme": "beatscape",
      "tags": ["Hot Chart Style"],
      "district": "Pulse Core",
      "default_mode": "arcade",
      "default_tier": "standard",
      "audio": "/catalog/bs-s1-01/audio.m4a",
      "stream_audio": "/catalog/bs-s1-01/stream.m4a",
      "stream_app_url": "https://music.example.com/track/bs-s1-01",
      "audio_master": "masters/bs-s1-01.wav",
      "preview": "/catalog/bs-s1-01/preview_48s.m4a",
      "cover": "/catalog/bs-s1-01/cover.webp",
      "charts": {
        "easy": "/catalog/bs-s1-01/easy.json",
        "standard": "/catalog/bs-s1-01/standard.json",
        "hard": "/catalog/bs-s1-01/hard.json"
      },
      "seo": {
        "title": "Neon Pulse — BeatScape AI Original",
        "description": "Own the Scape. 160 BPM EDM chart."
      }
    }
  ]
}
```

缺 `rights` / `theme` / 三难度 chart 路径 → 构建失败，不可发版。

**Stage 1 过渡**：现有 6 首可仅含 `audio`（游戏切片 = 当前 m4a）；`stream_audio` / `stream_app_url` **可选**。Stage 2 起新曲必须按 §6.0.27 双资产入库。

#### 6.0.10 幻境街区宇宙（曲 ↔ 地图）

整座 **BeatScape City** 分街区；每首曲归属一区，封面色调跟区走。

| 街区 District | 意象 | 初版曲目 |
|---------------|------|----------|
| **Pulse Core** | 城市心脏、主霓虹 | #01 Neon Pulse、#05 Voltage Drop |
| **Glass Rim** | 通透天际、新手大道 | #02 Glass Horizon、#09 Blue Hour Loop |
| **Night Grid** | 夜航、808 街区 | #03 Night Drive 808 |
| **Afterhours Lane** | 深夜巷、长音 | #04 Velvet Afterhours |
| **Chrome Yard** | 金属、摇滚干道 | #06 Chrome Riff、#10 Asphalt Anthem |
| **Slide District** | 曲线滑道 | #07 Slide City |
| **Skyline Hook** | 天际钩子、人声灯牌 | #08 Skyline Hook |

**艺人一句设定（上架可见英文 bio ≤120 chars）**

| 艺人 | Bio |
|------|-----|
| Pulse Atlas | Maps the city’s heartbeat into pure voltage. |
| Soft Circuit | Soft synths on the glass edge of dawn. |
| Low Voltage | Slow rides through the Night Grid. |
| Mira Lane | Holds the note until Afterhours fades. |
| Gridline | Overloads the Core — then drops. |
| Iron Echo | Chrome riffs ringing off warehouse walls. |
| Vector Bloom | Draws slides across district lines. |
| Ada North | Hooks the skyline with an English chorus. |
| Quiet Neon | Loops the blue hour for practice minds. |
| Redline Co. | Anthems for asphalt at redline speed. |

#### 6.0.11 英文内容文案库（上架无中文）

| 场景 | 固定英文 |
|------|----------|
| 口号 | Feel the Beat, Own the Scape. |
| 权利条 | AI Original · Owned Rights · Generated with MusicSaas |
| 解锁音频 | Tap to enter the Scape |
| Play Now | Play Now — D F J K |
| 校准中 | Tap with the pulse |
| 校准完成 | Offset saved. You’re synced to the Scape. |
| 校准跳过 | Playing with zero offset — recalibrate anytime in Settings. |
| 首局引导 | Start gentle on Glass Horizon — then chase Neon Pulse. |
| 引导结束 | The Scape is open. Play Now for Neon Pulse. |
| Countdown | 3 · 2 · 1 · GO |
| Pause | Scape paused |
| 中途退出确认 | Leave the Scape? Progress this run won’t be saved. |
| 确认离开 | Leave |
| 留下 | Keep playing |
| Arcade 失败 | HP empty. Retry Arcade or finish in Casual. |
| 加载失败 | Signal lost. Retry load. |
| 弱网 | Loading core beat first… |
| FC | Full Combo — the Scape remembers. |
| AP | All Perfect — legend voltage. |
| New Record | New personal best |
| 空收藏 | No favorites yet — pin a track from the Library. |
| Home 页脚 | BeatScape · AI Original · Owned Rights · v{app} |

#### 6.0.12 #08 Skyline Hook 样例歌词（ACE 生成用）

```text
[Verse]
Neon on the glass, I follow the line
Pulse in the grid, the city is mine
[Chorus]
Own the scape, feel the beat tonight
Skyline hook — we light the height
```

禁止日语、二次元称呼、真实艺人名。

#### 6.0.13 必做音效与大厅曲（自有）

| ID | 用途 | 规格 |
|----|------|------|
| `sfx-tap` | Tap / Great | ≤80ms；0 dBFS 峰值归一后播放增益 **−8 dB** |
| `sfx-hold-tick` | Hold 身段 | **默认关闭**；开启时 −18 dB |
| `sfx-slide` | Slide 完成 | −10 dB |
| `sfx-miss` | Miss | −6 dB；忌搞笑拟声 |
| `sfx-perfect` | Perfect | −6 dB；比 tap 更亮 |
| `sfx-countdown` | 3-2-1 | 极弱 −16 dB |
| `bgm-song-select` | 大厅循环 | 30–45s loop；大厅音乐默认增益 **−14 dB** |
| 默认用户音量 | Music **0.70** · SFX **0.55** | Settings 可改；写入 `bs_settings` |

#### 6.0.14 Stage 3–5 扩曲命名与配额规则

在 10 首初版之上扩至 25 / 40 / 50 时：

1. **曲名**：英文 ≤ 3 词，必须含 §1.3a 关键词池至少 1 个语义（或明确街区意象）  
2. **track_id**：`bs-s{N}-{nn}` 递增  
3. **district**：必须落入 §6.0.10 七区之一（可新增区，但需先补世界观一行）  
4. **曲风配额**：严格追赶 §6.0.1 正式版表（EDM 可略超）  
5. **月更选题**：优先缺口曲风 + 缺验收类型（如尚无足够 Slide 曲）  
6. **每首仍走**：生成 → 主题闸门 → QA → catalog  

#### 6.0.15 游客排行榜（无登录）

| Stage | 排行实现（防返工） |
|-------|-------------------|
| **Stage1–3** | **纯本地榜**：成绩写入 `localStorage.bs_board`；本机 Top50；**无服务端 upload**（文案用 “Local Board”） |
| **Stage4+** | 可接轻量后端；此前禁止假装有全球榜 |

其它规则：

- 身份：`bs_player_id`；名 `Runner-XXXX` / 可改  
- 仅 Arcade 通关写入本地榜；失败/退出不写  
- 加权分 = `score × tier_weight`（E1.0 / S1.1 / H1.25）  
- 校验：`score ≤ MaxScore×1.01` 且 counts 与 TotalNotes 一致  

#### 6.0.16 `chart.json` Schema（引擎唯一谱面真值）

```json
{
  "track_id": "bs-s1-01",
  "tier": "standard",
  "format": 1,
  "bpm": 160,
  "audio_offset_ms": 0,
  "ar": 28,
  "total_notes": 420,
  "sections": [
    { "id": "intro", "t0": 0.0, "t1": 8.0 },
    { "id": "build", "t0": 8.0, "t1": 18.0 },
    { "id": "drop", "t0": 18.0, "t1": 40.0 },
    { "id": "groove", "t0": 40.0, "t1": 58.0 },
    { "id": "outro", "t0": 58.0, "t1": 75.0 }
  ],
  "notes": [
    { "t": 1.25, "type": "tap", "lane": 0 },
    { "t": 2.00, "type": "hold", "lane": 1, "end": 3.50 },
    { "t": 4.00, "type": "chord", "lanes": [0, 3] },
    { "t": 5.00, "type": "slide", "lane": 0, "to": 1, "end": 5.40 }
  ]
}
```

**字段硬规则**

| 规则 | 真值 |
|------|------|
| 时间单位 | 秒，相对音频 0；已含 `audio_offset_ms` 校正后写入 |
| `tap` | 必有 `lane` 0–3 |
| `hold` | 必有 `end` > `t`；时长 ≥0.4s |
| `chord` | 必有 `lanes` 长度 2–3，禁止 4 |
| `slide` | 必有 `to`；`|to-lane|===1`；Stage1 文件不得出现 |
| `total_notes` | 必须与 §4.4 计数规则一致（构建时校验） |
| 排序 | `notes` 按 `t` 升序 |

#### 6.0.17 Stage 1 逐曲锁定 Prompt（禁止临场改词）

生成时 **原样使用**（可追加 `beatscape original, owned rights` 若未含）：

| track_id | Prompt |
|----------|--------|
| `bs-s1-01` | `EDM rhythm game track, 160 BPM, clear 4/4 beat, strong kick and snare, neon pulse city atmosphere, build-up and early drop, instrumental, no vocals, chart-friendly, beatscape original, owned rights, loop-friendly` |
| `bs-s1-02` | `English pop rhythm game track, 118 BPM, clear snare, bright soft synth, glass horizon atmosphere, gentle energy, instrumental, no vocals, easy chart mood, beatscape original, owned rights` |
| `bs-s1-03` | `Hip-hop rhythm game track, 95 BPM, 808 bass, crisp hats, clear downbeat, night drive voltage atmosphere, instrumental, no vocals, chart-friendly, beatscape original, owned rights` |
| `bs-s1-04` | `R&B rhythm game track, 88 BPM, smooth groove, soft kick, spacious pads, velvet afterhours lane atmosphere, long sustained tones, instrumental, no vocals, beatscape original, owned rights` |
| `bs-s1-05` | `EDM climax rhythm game track, 170 BPM, intense build-up and drop, synth lead, voltage grid overload atmosphere, instrumental, no vocals, dense chart-friendly drums, beatscape original, owned rights` |
| `bs-s1-06` | `Rock rhythm game track, 132 BPM, electric guitar riff, tight drum kit, clear 4/4, chrome echo yard atmosphere, instrumental, no vocals, beatscape original, owned rights` |

封面：Stage1–2 **程序化生成**（§7.5 + district 色，seed=`track_id`）。上表「封面 Prompt」仅作 Stage3+ 可选 AI 封面参考，**不得阻塞** Stage1 上架。

#### 6.0.17b Stage 2 逐曲锁定 Prompt

| track_id | Prompt |
|----------|--------|
| `bs-s2-01` | `EDM rhythm game track, 140 BPM, clear 4/4 beat, sidechain sweep, slide city atmosphere, instrumental, no vocals, chart-friendly for slide notes, beatscape original, owned rights` |
| `bs-s2-02` | 使用 §6.0.12 歌词 + ACE：`English pop vocal rhythm theme, 128 BPM, skyline hook, neon scape lyrics, clear beat, beatscape original, owned rights`（style_tags 禁 anime/j-pop） |
| `bs-s2-03` | `Chill pop rhythm game track, 120 BPM, soft pads, blue hour neon loop, clear beat, instrumental, no vocals, practice-friendly, beatscape original, owned rights` |
| `bs-s2-04` | `Rock rhythm game track, 148 BPM, asphalt anthem, electric guitar, tight drums, clear 4/4, chrome yard energy, instrumental, no vocals, beatscape original, owned rights` |

#### 6.0.18 信息架构（页面与路由）

**站点 base path（部署真值）**：`/beatscape/`（本地与静态托管均用此 base；勿与 NeonBeat `/neonbeat/` 混用）

| 路由（相对 base） | 页面 | 内容职责 |
|------|------|----------|
| `/` | Home | 口号、Play Now、Owned Rights；精选：Neon Pulse / Glass Horizon / Voltage Drop |
| `/library` | Library | 搜索/筛选/收藏/街区 |
| `/track/:id` | Track | 封面、bio、难度、模式、Play |
| `/play/:id` | Play | query: `tier` `mode` `speed` |
| `/results` | Results | 读 `sessionStorage.bs_last_run` |
| `/replay` | 复盘 | Miss 时间轴（可与 Results 同页折叠） |
| `/settings` | Settings | §4.8 |
| `/leaderboard` | Boards | 单曲 Top 50；全局 Top 100 |
| `/profile` | Profile | 段位、成就、档案 |

未引导访问 `/play/*` → 引导流。分享 URL 见 §6.0.24。

#### 6.0.19 结算页字段（强制展示顺序）

1. Grade 大号 + FC/AP 徽章  
2. Score · Accuracy% · Max Combo  
3. P / Gr / Go / M 计数条  
4. 曲名 · 艺人 · District · Tier · Mode  
5. vs Personal Best（高则 New Record）  
6. Replay · Share Poster · Library · Play Now  
7. 底栏 Owned Rights  

复盘（可同页折叠）：按时间轴 Miss 点；高频失误段落名（section id）。

#### 6.0.20 分享海报规格

| 项 | 真值 |
|----|------|
| 尺寸 | **1080×1350**（4:5，适 Reddit/IG/TikTok） |
| 格式 | WebP/PNG；客户端 Canvas 导出 |
| 必含 | Logo、曲名、艺人、Accuracy、Grade、Max Combo、Owned Rights |
| 禁含 | 真实热单暗示、外链广告、二次元贴纸 |

#### 6.0.21 本地存档键（localStorage）

| Key | 内容 |
|-----|------|
| `bs_onboarded` | `"true"` |
| `bs_offset_ms` | number |
| `bs_keys` | `["D","F","J","K"]` |
| `bs_settings` | hitsound/fx/bias/… |
| `bs_player_id` | UUID |
| `bs_display_name` | string |
| `bs_scores` | 见下方结构 |
| `bs_favorites` | string[] |
| `bs_achievements` | string[] |
| `bs_rank` | 段位 id |
| `bs_upload_casual` | 废弃（Stage1–3 无上传）；保留键但忽略 |
| `bs_board` | 本地榜数组 `{track_id,tier,score,accuracy,name,at}[]` |

**`bs_scores` 结构**

```json
{
  "bs-s1-01": {
    "arcade": {
      "standard": { "score": 0, "accuracy": 0, "maxCombo": 0, "grade": "D", "fc": false, "ap": false, "updatedAt": "" }
    },
    "casual": { "easy": { "score": 0, "accuracy": 0, "maxCombo": 0, "grade": "D", "updatedAt": "" } },
    "history": []
  }
}
```

禁止把整段 WAV 塞进 localStorage（Cache API / IndexedDB）。

#### 6.0.22 内容设计冻结清单（开干前勾选）

- [ ] §4 全玩法 + **v1.9 冻结声明**已确认  
- [ ] Loading decode = **m4a**（非 WAV）  
- [ ] 判定窗 15/30/50；未拷 NeonBeat  
- [ ] 榜 = **Local Board**（无假全球服）  
- [ ] Hip-hop **无** double-time 歧义  
- [ ] Stage1 Prompt / 程序化封面 / 目录 §6.0.26  
- [ ] auto-chart 道映射 §6.0.25  
- [ ] `bs_last_run` schema 字段齐全  
- [ ] 首局 / Play Now / Exit / PB / MaxScore  

#### 6.0.23 音频母带与上架格式（防体积/兼容返工）

| 层级 | 格式 | 规格 |
|------|------|------|
| 母带（仓内 `masters/`） | WAV | 44.1 kHz · stereo · 16/24-bit；`rights: owned` |
| 上架（catalog 播放） | **仅 M4A (AAC)**（Stage1–3） | 192 kbps；现代浏览器；**不做**双格式并行 |
| 响度 | 峰值 ≤ **−1.0 dBTP**；目标 **−14 LUFS ±1** | 入库 QA 必测 |
| Instant 预览 | `preview_48s.m4a` = 母带 [0,48s] | 非正式对局默认 |

catalog.`audio` 指向上架 m4a，不是巨量 WAV。

#### 6.0.24 分享与深度链接 URL

```text
曲目页:   /beatscape/track/{track_id}
开玩:     /beatscape/play/{track_id}?tier=standard&mode=arcade
成绩卡:   /beatscape/results?run=local
OG:       /catalog/{id}/og.png 1200×630
复制文案: "I just ran {title} on BeatScape — {accuracy}% {grade}. Feel the Beat, Own the Scape. {url}"
```

显示名：`[A-Za-z0-9 _\-]` 3–16 字；blocklist：`apps/beatscape/public/profanity-en.txt`。

#### 6.0.25 自动谱面内容规则（道映射 · 防谱面乱）

| 规则 | 真值 |
|------|------|
| 工程位置 | `apps/beatscape/`（勿写入 NeonBeat 业务曲库） |
| Kick / 低频 | 优先 **lane 0** |
| Snare / 中高打击 | 优先 **lane 3** |
| Hat / 碎打 | lane **1–2** 交替 |
| 旋律持续 | Hold 优先 1–2 |
| Chord | 优先 [0,3]；禁止 4 键 |
| Stage1 | 不得含 `slide` |
| 密度 | 必须落入 §4.6，否则重跑 |

#### 6.0.26 Stage1 交付包目录

```text
apps/beatscape/
  public/catalog/{track_id}/audio.m4a|stream.m4a|cover.webp|easy.json|standard.json|hard.json|og.png
  masters/{track_id}.wav
  public/catalog.json
  public/sfx/*.wav
  src/…
```

#### 6.0.27 游戏切片与流媒体完整版（双资产 · 引流真值）

BeatScape 曲库与 **MusicSaas 音乐流媒体 App** 共用同一 `track_id` 与版权资产，但 **音频长度与用途分层**。禁止把「游戏关卡长度」误当作流媒体单曲标准。

**定位**

| 资产 | 用途 | 消费场景 |
|------|------|----------|
| **游戏切片** `audio.m4a` | BeatScape 对局、谱面、Web 试玩 | 浏览器 · 短局 · 种草 |
| **流媒体完整版** `stream.m4a`（或 App 内流） | 完整听歌、收藏、播放列表 | MusicSaas 流媒体 App |
| **母带** `masters/{id}.wav` | 生成源、精剪、响度 QA | 仓内 · 不直接给玩家 |

**时长建议（欧美年轻用户 · 产品真值）**

| 类型 | 目标时长 | 说明 |
|------|----------|------|
| **流媒体完整版**（主仓） | **2:30–3:30** | Pop / Hip-hop / R&B / Rock 单曲习惯（Spotify 心智） |
| **流媒体 EDM / Club** | **3:00–4:00** | 可多一段 drop / breakdown |
| **流媒体人声单曲** | **2:45–3:30** | 副歌完整、可循环 |
| **游戏切片 Stage 1**（已交付） | **60–75s** | 六首定名表；#05 为 60s；**维持不改** |
| **游戏切片 Stage 2+** | **90s–2:00** | 可有完整 build→drop arc，仍短于流媒体版 |
| **游戏高密度挑战** | **60–90s** | 如 `bs-edm-climax` 类 |
| **Instant 营销预览** | **≤48s** | `preview_48s.m4a`，非对局默认 |

> 欧美音游 **试玩关** 常 30–90s；**正经曲库关** 常见 2–4 分钟。BeatScape 用切片做引流，用流媒体完整版做留存；二者时长应明显不同（完整版通常为游戏切片的 **2–3 倍** 或以上）。

**生成顺序（Stage 2 起强制）**

1. MusicSaas 按风格包生成 **完整版母带**（`stream_duration_sec` 目标）  
2. QA：BPM、段落、响度（§6.0.23）  
3. 从母带 **精剪游戏切片**（对齐 drop / 首拍；写入 `duration_sec`）  
4. 仅对切片跑 auto-chart + 谱面 QA  
5. 母带与切片分别转码 m4a；catalog 双路径入库  

禁止「只生成 75s」再假装是流媒体单曲。

**catalog 字段（§6.0.9 扩展）**

| 字段 | 必填 | 含义 |
|------|------|------|
| `duration_sec` | ✅ | **游戏切片**时长（秒）；谱面与对局时钟以此为准 |
| `audio` | ✅ | 游戏切片 URL（`audio.m4a`） |
| `stream_duration_sec` | Stage2+ | 流媒体完整版时长 |
| `stream_audio` | Stage2+ | 完整版 m4a 路径（或 App CDN URL） |
| `stream_app_url` | Stage2+ | 流媒体 App 深链（曲目页 / 播放页） |
| `audio_master` | 推荐 | 母带 WAV 仓内路径 |

**BeatScape → 流媒体引流（产品）**

- Results / 曲目页 CTA：**「Hear the full track · {stream_duration} on MusicSaas」**  
- 点击跳转 `stream_app_url`；App 内播放 **完整版**，不复播 75s 游戏切片  
- 分享文案可带 App 深链；游戏短链仍指向 `/beatscape/play/…`

**与 §6.0.2 风格包关系**

| Style Pack | 游戏切片（生成目标） | 流媒体完整版（生成目标） |
|------------|----------------------|---------------------------|
| `bs-edm-main` 等 75s 包 | 75s（Stage1）/ 90–120s（Stage2+） | **3:00–3:30** |
| `bs-edm-climax` | 60s | **2:30–3:00**（高密度短曲） |
| `bs-theme-en` 人声 | 45s 游戏 sparse 谱 | **2:45–3:30** 完整人声版 |

风格包表 §6.0.2 中「时长」列 **默认指游戏切片**；流媒体时长以本表为准，生成 job 须单独指定 `target_duration`（或等价 API 参数）。

**QA 补充**

| 检查项 | 门槛 |
|--------|------|
| `stream_duration_sec` ≥ `duration_sec` × **1.8** | Stage2+ 新曲 |
| 游戏切片为母带子集 | 波形时间轴包含于母带；切片起止可审计 |
| 深链可打开且播放完整版 | 引流验收（人工 + 自动化 smoke） |

### 6.1 曲库系统（玩家侧）

**功能清单**

- 曲目封面、曲名、作者（AI 笔名）、难度展示  
- 难度分级标识（Easy / Standard / Hard，同源 AI 音频）  
- 热门曲目排序（游玩量 / 高光局，非外部热单榜）  
- 搜索（模糊匹配英文标题 / 标签）  
- 分类筛选（难度 / BPM / 曲风：Pop、EDM、R&B、Hip-hop、Rock）  
- 收藏曲目  
- 风格运营标签：Hot Chart Style、Viral Style、Classic Style、New Release  
- 曲目详情展示合规提示：**「AI Original · Owned Rights · Generated with MusicSaas」**  
  （中文内部口径：自有版权 · AI 原曲 · 本地 MusicSaas 生成）  

**加载体验**

- 预加载、本地缓存（Cache API 缓存 **m4a + chart**）  
- 加载进度条（decode + parse）  
- 失败自动三重试  
- 弱网：先内核后封面   

### 6.2 游戏对局系统

- 对局倒计时 3s  
- 实时分数、实时连击展示  
- 节拍提示动效  
- 暂停 / 继续 / 退出  
- 对局中禁止页面滚动、缩放、刷新  

### 6.3 结算 & 复盘系统（独家）

**结算页展示**

- 总分、准确率、评级  
- 最大连击、总音符数  
- Perfect / Great / Good / Miss 详细统计  

**复盘能力**

- 失误分布可视化  
- 高频失误节拍分析  
- 本次成绩与历史最高分对比  

### 6.4 个人数据系统

- 单曲最高分记录  
- 最高连击留存  
- 每曲历史成绩记录  
- 成绩覆盖规则：高分覆盖、低分保留历史  

### 6.5 排行榜系统

- Stage1–3：**Local Board**（本机，见 §6.0.15）；UI 不得写 Global / Worldwide  
- Stage4+：可接服务端单曲榜 / 全局榜  
- 加权：准确率、分数、难度（tier_weight） 

### 6.6 设置系统

对齐 §4.8：下落速度 / 全局延迟 / 判定松紧快捷 / 音量 / 特效开关 / **四键 remap**。  

---

## 7. UI / 视觉体验规范（海外极简 · 节拍幻境主题）

### 7.1 视觉核心基调

极简、通透、赛博轻奢、低饱和高级感、纯节奏驱动——即 **BeatScape 幻境城市** 的可视化。彻底摒弃二次元高饱和、繁复装饰。画面干净留白，重点聚焦节拍与「Scape」空间感（霓虹边缘光、玻璃折射、网格地平线）。

### 7.2 必须具备的节奏动效

- 节拍闪光反馈（对齐 BPM，像点亮街区）  
- 判定层级动效（Perfect 特效更强）  
- 连击梯度动态光效  
- 音符下落质感统一  
- 结算页面层级动画  

### 7.3 全局体验要求

- 所有动画对齐 BPM 节奏  
- 特效不抢优先级、不造成掉帧  
- 整体风格统一、现代高级、无冗余 UI；截图即种草  

### 7.4 主题视觉硬规则（与自有内容绑定）

- 曲库封面、加载页、结算海报必须共享同一套 **Scape 设计 token**（§7.5）  
- 禁止单曲使用与主题无关的插画风格「各曲各画风」  
- 对局内特效文案可用 `PULSE` / `SCAPE` / `DROP`，禁止二次元拟声与表情贴纸  
- 所有可视素材默认自有生成，随曲走 `theme: beatscape`  

### 7.5 设计 Token（内容视觉真值）

> **v2.0 · RESONANCE 视觉改版（2026-08-29）**
> 霓虹青色板整组替换为「RESONANCE」高对比漫画色板。配色属内容视觉真值，故在此留档。
> **本次只改视觉**：判定窗 15/30/50、菱形音符、曲库内容、玩法一律不变。

| Token | 值 | 用途 |
|-------|-----|------|
| `--scape-bg-0` | `#12100F` | 页面墨底（去蓝味） |
| `--scape-bg-1` | `#1C1717` | 次级底 / 曲库卡片底 |
| `--scape-line` | `#000000` | 分割线、漫画框线 |
| `--scape-text` | `#F5EFE6` | 主文案（微暖） |
| `--scape-muted` | `#A8928B` | 次文案 |
| `--scape-accent` | `#E23D3D` | 主强调（朱红） |
| `--scape-accent-2` | `#F2E4C9` | Perfect / 正向（米白） |
| `--scape-warn` | `#FFB020` | Good / 警示（琥珀） |
| `--scape-gold` | `#FFB020` | S / AP |
| Font display | **Anton**（Google Fonts；OFL） | 标题、HUD 数字、判定文案 |
| Font secondary | **Sora**（Google Fonts；OFL） | 次级标题、强调标签 |
| Font body | **IBM Plex Sans**（OFL） | 数据与 UI |
| 封面构图 | 60% 几何 + 40% 留黑；**Stage1–3 程序化**（seed=`track_id`）；无人物脸 | — |
| 海报模板 | 上曲名/艺人 · 中 Accuracy+Grade · 下 Owned Rights 条 | 统一可截图 |

字体**只许使用 SIL OFL / Apache 授权**字体，授权文本归档 `docs/licenses/`。
理由：美国字体形状不受著作权保护但字体软件受保护；**中国独创性高的字体单字可作为美术作品受保护**，
字库按计算机软件保护（方正诉暴雪，最高法判赔 205 万）。风险按最严口径管理。

**四道颜色（对局固定）**

| Lane | 色值 | 说明 |
|------|------|------|
| 0 | `#E23D3D` | 朱红，与主强调同系 |
| 1 | `#F2E4C9` | 米白，靠明度而非色相与道 0 拉开 |
| 2 | `#FFB020` | 琥珀 |
| 3 | `#5B8DEF` | 钢蓝 —— **刻意保留冷色**。全暖配色会让四道在高速下落时糊成一片，属可用性要求 |

判定线 `#F5EFE6` @ 0.9 透明。

**街区染色（封面主色倾向）**

| District | 主色倾向 |
|----------|----------|
| Pulse Core | crimson `#E23D3D` |
| Glass Rim | bone `#E4D8C4` |
| Night Grid | oxblood `#6E2426` |
| Afterhours Lane | clay `#B0765A` |
| Chrome Yard | ash `#8C8079` |
| Slide District | amber `#FFB020` |
| Skyline Hook | steel-blue `#5B8DEF` |

### 7.6 RESONANCE 视觉语言

**风格命名**：RESONANCE（共振）。对外一律使用本名，**禁止在代码、文案、素材命名中出现任何第三方作品名**。

**五条语法**

1. **平涂硬边** —— 不用渐变、柔光、霓虹辉光；色块刀切。
2. **粗描边** —— UI 容器、卡片、按钮 2–3px 纯黑描边，如漫画分格框线。
3. **高对比三色结构** —— 墨黑底 → 大面积朱红 → 米白文字，中间色调尽量少。
4. **漫画符码** —— 放射线、半调网点、集中线、爆炸星形气泡、斜切矩形。均为公共领域技法。
5. **自创 motif：共振菱形** —— 四个同心菱形由内向外扩散、中心实心。用于 logo、封面、
   判定特效、加载动画。它是 BeatScape 的符号，**不得替换为任何第三方作品的标志性图形**。

**与「极简高级」的关系**（§12 产品定位）：极简指**布局不堆砌**，漫画指**视觉语言**。
两者共存 —— 用极简的版面承载漫画的笔触，不做信息密度堆叠。

**判定文案排版**：允许美式波普风格的强调排版（英文单词 + 粗描边 + 轻微倾斜，
如 `PERFECT` `GREAT` 做成漫画强调字）。**维持 §7.4 禁令：禁止日文／二次元拟声词与表情贴纸**。
美式波普源自 Lichtenstein 一脉的公共领域传统，日文拟声词则属第三方作品强识别符号。

### 7.7 差异化红线（法务约束，不可协商）

改造的取舍依据是：`Tetris Holding v. Xio Interactive`（2012）——
被告使用**全新绘制**的美术资产仍被判侵权，因整体 *look and feel* 易被误认，
且以当时技术条件**本可做出区分而未做**。`Spry Fox v. Lolapps`（2012）结论相同。
由此得出：**「素材全部重画」不构成免责，必须主动差异化。**

| 禁止项 | 说明 |
|--------|------|
| 第三方作品名称、logo、系列徽记 | 含字体造型上的模仿 |
| 任何具体角色 | 形象、剪影、配色组合 |
| 人格面具 / 塔罗牌 / 天鹅绒房间等强识别 motif | 见 §7.6，一律用共振菱形替代 |
| 原曲旋律、采样、音效 | 曲库保持 100% MusicSaas 自研 AI 原创 |
| 官方美术资产与定制字体文件 | 一张不用 |
| 非 OFL/Apache 字体 | 见 §7.5 字体条款 |
| 日文／二次元拟声词与表情贴纸 | 见 §7.6 |

**上线前必须通过差异化盲测**（§11.4）：找 5–10 名**不玩日式 RPG** 的观察者，
只给截图、不给提示，问"这看起来像哪款游戏"。**任一人说出来源作品即判定不通过**，退回重做差异化。

---

## 8. 多端适配产品规范

### 8.1 PC 端

- 键盘多键无冲突  
- 精准瞬时判定  
- 大屏渲染饱满  

### 8.2 移动端

- 全屏游玩、无系统干扰  
- 边缘防误触  
- 多指稳定识别  
- 触控跟手零延迟  

---

## 9. 出海合规 & 非功能硬性标准

### 9.1 性能

- 常态稳 60fps；大谱面稳 60fps  
- 启动速度快、二次打开秒加载  
- 无内存泄漏  

### 9.2 稳定性

- 无崩溃、无卡死  
- 无音画错位  
- 无状态残留  
- 极端场景全部容错  

### 9.3 兼容性

兼容所有现代浏览器内核，全主流手机、电脑设备，适配海外主流机型，无机型适配 bug。

### 9.4 出海合规规范（强制上线标准）

| 维度 | 要求 |
|------|------|
| 版权合规 | **全曲自有版权**：100% 本地 MusicSaas AI 原曲入库；产品方拥有音频 / 谱面 / 封面运营权；禁止第三方商用成曲与扒流；提示词禁止真实歌名与艺人名；对外可主张 Owned / AI Original |
| 隐私合规 | 无强制注册、无隐私窃取；本地仅留存游玩记录与最高分 |
| 内容合规 | 无血腥、二次元低俗、违规图案；全页面极简干净；人声曲仅英文、无二次元 OP |
| 命名合规 | BeatScape 无商标冲突、无敏感词根；可全平台合规传播 |

### 9.5 轻量无广告准则（社区核心口碑）

产品永久保持：无开屏广告、无弹窗广告、无强制跳转、无内购诱导，维持纯粹游玩体验，契合 Reddit 对轻量化干净产品的核心诉求。

---

## 10. 版本迭代规划（Vibe Coding 滚雪球）

| Stage | 目标 | 交付要点 |
|-------|------|----------|
| Stage 1 | 最小可玩内核（手感优先） | 音频时序 + 帧循环 + 四档判定 + 结算；**初版 6 首见 §6.0.6-A**（默认 Play Now = Neon Pulse） |
| Stage 2 | 完整游戏闭环 | 状态机、连击、计分、长按滑动、容错；**补齐至 10 首见 §6.0.6-B** |
| Stage 3 | 曲库产品化 | 展示 / 搜索 / 分类 / 收藏 / 缓存；**五风齐 · 25 首** |
| Stage 4 | 数据与社交闭环 | 个人数据、复盘、排行榜；**40 首** |
| Stage 5 | 极致打磨 & 差异化超车 | 自适应、稳压、视觉、出海；**正式版 50 首** + 月更 AI 新曲 |

---

## 11. 验收标准（产品最终交付底线）

### 11.1 功能验收

所有模块流程闭环、无报错、无卡死、无异常数据。

### 11.2 体感验收（最高优先级）

- 音画同步极致跟手  
- 全设备手感统一  
- 无无故 Miss、无断连 BUG  
- 高密度谱面依旧顺滑  

### 11.3 竞品对标验收

- 手感完全追平 Rhythm Plus  
- 稳定性、容错、时序、防误触全部优于竞品  
- 功能体验、复盘、曲库、UI 全面超越竞品  

### 11.4 内容设计验收（v1.9）

- [ ] 菱形音符 + 四道色；判定窗 15/30/50（未拷 NeonBeat）  
- [ ] Casual 仅视觉变速；Practice 音画同步；GO 同时开声  
- [ ] m4a 可玩；Local Board；校准为唯一 offset 源  
- [ ] Kick→0 / Snare→3；`bs_last_run` schema  
- [ ] §4.18 Stage1 冻结；§6.0.22 清单勾选完毕  
- [x] **RESONANCE v2.0 视觉**：色板与代码一致（§7.5）；共振菱形为唯一 motif（§7.6）  
  *2026-08-29 已验：`src/` `scripts/` `dist/` 全仓终扫无残留旧色板（青 `#3DDCFF`／薄荷 `#7CFFB2`／粉 `#FF5C7A`／旧金 `#F5C542`）；25/25 封面为程序化 SVG。*
- [x] **红线自检**：§7.7 表格逐项通过；字体全部 OFL 且授权文本已归档  
  *2026-08-29 已验：见 [`docs/licenses/README.md`](licenses/README.md) §4；OFL 文本归档于 `docs/licenses/fonts/`。*
- [ ] **差异化盲测**：5–10 名非日式 RPG 玩家，无人识别出来源作品（§7.7）  
  **⬅ 上线前唯一未通过项。** 规程与记录表见 [`docs/RESONANCE-BLINDTEST.md`](RESONANCE-BLINDTEST.md)。

---

## 12. 社区传播 & 产品终极定位

交付一款全球首创英文流行乐专属、极简高级画风、极致丝滑手感、零广告轻量化、专业数据复盘的浏览器节奏游戏。精准卡位海外空白赛道，适配 Reddit、YouTube Shorts、TikTok 种草传播，成为海外轻量化网页音游标杆产品。

### 12.1 Reddit 核心种草卖点（固定传播话术）

- **No Download, No Ads, Pure Vibe**：免安装、零广告、纯粹节奏体验  
- **Perfect for English Pop/EDM**：欧美流行 / EDM **风格** AI 原曲，专为节奏游玩生成  
- **AI Original · Owned Rights**：全曲 MusicSaas 本地生成且**自有版权**，无扒曲、无第三方热单授权依赖  
- **60fps Stable & Zero Lag**：全设备稳态 60 帧，无延迟无时序漂移  
- **Professional Score Analysis**：独家精准复盘数据  
- **Minimal & Clean UI**：极简高级审美  

### 12.2 产品核心差异化赛道总结

市面上主流网页音游均以日系二次元曲库为主，BeatScape 完全差异化切入欧美英文流行乐垂直赛道，结合碾压竞品的技术稳定性、极致手感、极简出海画风、无广告轻量化体验，精准击中海外社区用户痛点，具备天然出圈传播属性。

### 12.3 核心用户故事（可直接转化为开发用例）

1. **海外休闲乐迷**：只听欧美流行 / EDM 英文歌，讨厌二次元与日系曲库；要干净、高级、无广告、打开就能玩的节奏小游戏。  
2. **Reddit 社区用户**：追求高帧率丝滑网页体验；愿意分享高分截图与完美复盘视频。  
3. **核心练度玩家**：需要时序精准、手感统一、无 BUG 断连；通过失误复盘持续提升精度。  
4. **移动端通勤用户**：手机防误触、无系统手势干扰、弱网也能玩。  

---

## 13. 产品硬性约束与边界规则（开发强制红线）

### 13.1 功能边界约束

- 不做复杂社交、不做公会、不做付费氪金，永久轻量化  
- 不接入日系、国风、二次元曲库与人声包；全程聚焦欧美英文**风格** + **节拍幻境**主题 AI 原曲  
- 不采购、不扒取商用成曲；曲库增量只走本地 MusicSaas 生成 → 主题闸门 → QA → 入库  
- **一切游戏内容自有生成且必须契合主题**；离题素材不得上架  
- 不堆砌冗余特效、不做花哨 UI，坚守极简高级出海视觉  
- 不强制注册、不强制登录，游客模式可体验 100% 核心游玩功能  

### 13.2 技术边界约束

- 全程浏览器原生架构，不依赖重型游戏引擎  
- 音频时序永久以 WebAudio 为唯一真值，禁止帧时序替代校准  
- 内核与 UI 彻底解耦，禁止业务层 / UI 层侵入核心判定  
- 性能优化优先保障帧率与时序精度，其次是视觉特效  

### 13.3 运营边界约束

- 永久零广告、零弹窗、零内购诱导  
- 曲库更新仅接受自有版权 AI 原曲，杜绝引入第三方成曲导致的 DMCA 风险  
- 每首入库资产默认权利标记：`rights: owned`（不可缺省）  
- 社区传播内容统一极简高级风格，杜绝低俗与二次元同质化  

---

## 14. 全局容错与降级兜底机制

### 14.1 网络容错降级

- **弱网**：优先加载核心游戏内核，延迟加载封面、动效等非必要资源  
- **断网**：已缓存曲目可离线游玩，无卡死、无闪退  
- **加载失败**：自动三重重试；失败展示友好兜底提示，支持手动刷新  

### 14.2 设备性能降级

- 低端设备自动降级特效：关闭高阶连击动效、节拍闪光，保留核心判定与帧率  
- 自动适配设备刷新率，优先锁定 60fps  

### 14.3 时序异常兜底

- 后台休眠唤醒、页面切回自动时序重置校准  
- 音频解码异常自动重启音频上下文，不中断对局体验  

---

## 15. 出海 SEO & 流量增长方案

### 15.1 核心 SEO 关键词布局

| 类型 | 关键词 |
|------|--------|
| Core | English rhythm game、browser beat game、AI original rhythm game |
| Long-tail | owned rights beat game、neon minimal rhythm game、beatscape |

### 15.2 页面 SEO 规范

- 全站英文 Meta 标题、描述、关键词，适配谷歌爬虫  
- 曲目页面独立静态化，单曲独立 SEO 页面，积累长尾流量  

### 15.3 完整页面 SEO 落地规范

- **全站静态化**：首页、曲库列表、单曲详情、个人数据页、排行榜采用静态渲染，规避动态渲染收录失败  
- **独立 Meta**：每页专属英文 Title / Description / Keywords；单曲页绑定曲风、BPM、难度等长尾词  
- **Sitemap & Robots**：自动生成 `Sitemap.xml`、`Robots.txt`；屏蔽无效 / 测试页  
- **权重兜底**：友好 404、死链 301、重复内容 `canonical`  
- **多媒体 SEO**：封面与素材标准化英文 Alt、文件命名  

### 15.4 社区分享裂变体系（社区裂变核心）

- **高光成绩海报**：结算页一键生成极简英文成绩海报（曲目、准确率、最大连击、评级、Logo），适配 Reddit / X / TikTok  
- **OG / Twitter Card**：游玩链接、单曲链接、战绩链接配置标准预览卡片  
- **短链引流**：每首曲目、每条高光战绩专属短链，打开直达对应游玩页  
- **高光场景**：Full Combo、All Perfect、高难度通关触发专属海报与标识  
- **一键复制分享链接**：对局结果 / 复盘页支持复制，便于社区发帖引流  

---

## 16. 海外全维度本地化适配规范

### 16.1 语言体系百分百本地化

- 全站原生英文，无中文残留、无中式英语；UI / 提示 / 报错 / 复盘 / 成就全部海外标准话术  
- 音乐术语、曲风标签、难度标识、榜单称谓沿用欧美行业通用词汇  
- 时间、数值精度、百分比、数据单位适配欧美展示规范  

### 16.2 内容与审美本地化

- 曲库优先级：本地 AI 按欧美听感生成；运营排序优先 **EDM / Pop Viral Style**，再补 R&B、Hip-hop、Rock；**永不依赖真实 Billboard / TikTok 曲目授权**  
- 视觉彻底剥离亚洲二次元繁复设计：低饱和、高留白、赛博轻奢极简  
- 无本土化小众元素、无文化壁垒，全海外用户无门槛体验  
- 曲目页固定露出 **AI Original · Owned Rights** 标识；社区话术统一为 *AI-made English-style beats — all tracks owned by BeatScape*  

---

## 17. 轻量化用户激励与留存体系（无氪金 · 纯荣誉驱动）

基于「永久零广告、零内购、零付费」准则，搭建纯荣誉、轻量化激励体系。

### 17.1 四段式全球荣誉评级体系

依据 **近 20 局 Arcade 加权准确率** + 最高连击 + 通关 Hard 数：

| 段位 | 英文名 | 解锁条件（满足其一主条件 + 不违约） |
|------|--------|--------------------------------------|
| 初学回响 | Echo Novice | 默认；完成首局即可 |
| 节拍玩家 | Beat Player | 累计通关 ≥5 **或** 任一手局 Accuracy ≥90% |
| 节奏大师 | Rhythm Master | 累计 FC ≥3 **且** 平均 Accuracy ≥92% |
| 幻境传奇 | Scape Legend | AP ≥1 **且** Hard 通关 ≥3 **且** 平均 Accuracy ≥95% |

降级：不自动降段（轻量荣誉，只升不降）。

### 17.2 成就解锁与个人档案体系

| 成就 ID | 英文名 | 条件 |
|---------|--------|------|
| `ach-first-clear` | First Light | 任意曲通关 1 次 |
| `ach-first-fc` | Full Circuit | 首次 FC |
| `ach-first-ap` | Absolute Pulse | 首次 AP |
| `ach-combo-100` | Hundred Echo | 单局 Max Combo ≥100 |
| `ach-combo-200` | Overload | 单局 Max Combo ≥200 |
| `ach-hard-clear` | Core Breach | 任意 Hard 通关 |
| `ach-district-5` | City Walker | 玩过 ≥5 个不同 district 的曲 |
| `ach-streak-3` | Three Nights | 连续 3 个日历日各 ≥1 局 |

**个人档案字段**：总时长、曲目数、最高连击、平均准确率、擅长曲风、当前段位、已解锁成就列表。  

---

## 18. 合规轻量化数据埋点体系（海外隐私友好）

符合 GDPR 与海外社区隐私规范：无强制收集、无隐私窃取、无第三方违规统计。

### 18.1 核心用户行为埋点

- **页面流量**：PV / UV、各页占比、曲库浏览、单曲详情、排行榜访问  
- **游玩行为**：开始、完成、中途退出、重试、高光对局  
- **功能交互**：收藏、搜索、筛选、参数调节、链接分享  

### 18.2 产品体验质量埋点

- **性能**：首屏耗时、曲目资源加载耗时、帧率波动  
- **异常**：加载失败、音频时序异常、对局卡顿、设备适配异常  
- **优化溯源**：高频失误曲目、高频调节的手感参数  

---

## 19. 风险识别与全场景应急兜底预案

### 19.1 版权风险防控（自有版权 · 规避 DMCA）

- 曲库合规台账：每首记录 `job_id` / `preset_id` / 生成时间 / QA 结果 / **`rights: owned`**；**禁止**上架非自有版权音源  
- 权利主张口径：音频与谱面为产品方自有运营资产；分享海报、短链、OG 预览均基于自有曲库  
- 极速下架：若单曲疑似过度相似外部成曲或提示词违规，一键批量下架并重生成（仍走自有生成路径）  
- 引擎使用遵循 SA3 / ACE-Step 许可路径；封面与素材自有生成或开源  

### 19.2 访问与服务稳定性

- 静态资源 / 音频 / 封面全球 CDN（覆盖欧美）  
- 核心游戏内核本地缓存兜底，保障基础可玩  

### 19.3 社区舆情与内容审核

- 全内容合规自检：无血腥、低俗、政治敏感；全年龄段适配  
- 官方反馈通道：Reddit / X / TikTok 体验与 BUG 上报，快速响应  

---

## 20. 海外社区 UGC 内容规范

### 20.1 官方固定内容调性

极简、高级、纯粹、专注节奏；无夸张营销、无低俗引流、无二次元同质化素材。

### 20.2 用户 UGC 引导规范

- **鼓励产出**：高分截图、AP 录屏、60fps 实录、手感参数教程、曲库测评、练度成长记录  
- **讨论方向**：英文曲推荐、设备手感适配、高阶练度方法、版本体验建议  

---

## 21. 版本迭代与长期维护规范

### 21.1 固定迭代节奏

- **每周轻量迭代**：手感微调、已知 BUG、**0～1 首本地 AI 新曲 / 替补**、体验细节  
- **月度版本更新**：轻量新功能、视觉动效、**批量生成候选后入库 2～4 首**、全局性能、新浏览器 / 设备适配  

### 21.2 海外版本公示规范

- 英文更新日志同步 Reddit 官方社群、X 官方账号  
- 核心手感 / 判定参数调整提前公示，保障老用户习惯连贯  

### 21.3 灰度发布与版本迭代策略

| 阶段 | 规则 |
|------|------|
| 内测版 | 封闭测试核心手感、时序、性能；修复致命 BUG |
| 灰度版 | 小流量开放；验证多端适配、弱网容错、社区体验 |
| 正式版 | 全量上线；开放曲库、复盘、排行；开启社区传播 |

**迭代原则**

- 小步增量，单次不做大重构；优先修体验、补曲库  
- 优先适配老用户手感习惯，不随意改核心判定参数  
- 每版本同步海外社区更新日志  

---

## 22. 产品全局参数白皮书（AI 开发唯一真值）

### 22.1 时序核心参数（固定不可改）

| 参数 | 真值 |
|------|------|
| 全局最大音画同步误差 | ≤30ms |
| 设备自动补偿阈值 | 10ms ~ 60ms 动态自适应 |
| 后台时序校准恢复耗时 | ≤100ms |

### 22.2 判定容错参数（行业最优平衡）

| 档位 | Arcade / Practice | Casual（§4.3） |
|------|-------------------|----------------|
| Perfect | ±15ms | ±28ms |
| Great | ±30ms | ±55ms |
| Good | ±50ms | ±90ms |
| 长按结尾缓冲 | 20ms 智能吸附 | 同左 |

### 22.3 性能硬性参数

| 参数 | 真值 |
|------|------|
| 稳态帧率 | 全局稳定 60fps；瞬时波动 ≤2 帧；无连续掉帧 |
| 大谱面渲染延迟 | ≤5ms |
| 首屏加载 | ≤1.5s |
| 完整加载 | ≤4s |

---

## 23. 全文终版收敛总结

本 PRD 为 **BeatScape 节拍幻境** 唯一官方终版量产文档，是聚焦「欧美英文流行乐」的轻量化浏览器节奏游戏完整产品规范，适配 AI 原生 Vibe Coding 增量迭代，可直接用于 AI 投产、多版本迭代、海外合规上线与长期社区运营。

**六大核心壁垒**

1. 行业顶级稳定手感  
2. 零广告纯净体验  
3. **本地 MusicSaas AI 英文风格曲库 · 全曲自有版权**  
4. 专业数据复盘体系  
5. 极简海外审美  
6. 全维度出海合规  

文档覆盖：主题世界观、**防返工内容真值至 v1.9（§4 + §6.0.16–26，Stage1 已冻结）**、自有版权曲库、视觉 token、出海运营全闭环。

**与 NeonBeat 关系说明**：`PRD-WEB-RHYTHM-GAME.md` 为 MusicSaas 工作室向（玩家当场生成 + 自动谱面）产品线；本文件为 **BeatScape 海外站**——**运营方用同一套本地 AI 预生成并策划上架曲库**。共享引擎层与 Vibe Coding 红线；曲库运营、风格包与禁止二次元人声包等产品策略以本文为准。工程实现落在 `apps/beatscape/`。

---

*End of Document — BeatScape PRD v1.9.1 · Stage1 Content Freeze · Audit Pass*
