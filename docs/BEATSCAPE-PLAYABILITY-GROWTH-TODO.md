# BeatScape 可玩性 & 欧美增长 TODO

> 目标：**提升可玩性** + **吸引欧美用户**。
> §0 的“现状”是 **2026-09-05 计划编制时的原始快照**，用于保留决策依据，不代表当前完成状态；各项最新状态见对应实施章节。
> 与 `SESSION.md` / `docs/BEATSCAPE-COMMERCIALIZATION-GAP.md` / `docs/BEATSCAPE-REDDIT-LAUNCH.md` 配套阅读。

---

## 0. 现状快照（核实结果）

| 能力 | 现状 | 证据 |
|------|------|------|
| 下落速度（arcade） | **完全不可调** —— `casualSpeed` 只对 casual 生效，arcade 恒为 1 | `PlayField.tsx:302` |
| 下落速度（通用） | `scrollBias` 两模式都生效、clamp −0.9..2（即 0.1×–3.0×），**但 UI 零入口** | `settings.ts:18/43`、`Settings.tsx`（无 scrollBias） |
| OG / Twitter 卡 | **全仓没有一条 `og:` / `twitter:` meta** | 全仓 grep 零命中（唯一命中是 `catalog:` 的假阳性） |
| OG 图素材 | **已备齐**：`public/catalog/<track_id>/og.png` × 105 张，1200×630 PNG ~16KB | `file catalog/bs-s1-01/og.png` |
| 站点级 OG 图 | **缺**（`public/` 根目录无 og.png） | `ls public/` |
| 判定偏早/偏晚 | **没有**。judge 只返回 4 档、丢符号；结算页零 timing 字段 | `judge.ts:14`、`Results.tsx`（grep timing 零命中） |
| 从失败点重开 | **没有**。`MissReplayPanel` 只读（时间轴/泳道图/分段计数），无重试入口 | `MissReplayPanel.tsx` 全文 |
| 分享 | **已有** "Copy link" + 文案模板；海报**只能下载**不能复制 | `Results.tsx:293`、`session.ts:162` |
| 排行榜 | localStorage-only，明示 "No global upload in Stage 1–3" | `Leaderboard.tsx:43` |
| i18n | en 为 `DEFAULT_LOCALE`（对英美无碍），但只接了 3/14 页 | `i18n/index.ts:7`、`getMessages()` 仅 Home/Track/TrackAudioPreview |
| SEO 其他 | title / description / canonical / robots.txt / sitemap.xml **齐备** | `seo/pageMeta.ts:71-88`、`public/` |

### 现成优势（可以直接写进文案，尚未对外讲）

- **键位按物理位置绑定**，QWERTY / AZERTY / QWERTZ 通吃 —— 欧洲键盘友好，目前只在代码注释里。
- **Privacy 页承诺「无账号、无广告追踪、不上传服务器」** —— 欧美用户真实痛点，`shareResultsCopy()` 里**一句都没提**。

---

## 1. 结论：做这 6 件，按此顺序

| ID | 事项 | 价值 | 成本 | 优先级 |
|----|------|------|------|--------|
| **T1a** | ✅ `index.html` 静态站点级 OG / Twitter 卡 | ★★★ 决定所有对外链接的长相 | 已落地：`public/og.png` 1200×630 | **P0** |
| **T2** | ✅ 统一全模式 Note speed + Track 快调（2026-09-12） | ★★★ 核心玩家第一诉求 | 已落地并清除反向 Casual 倍率 | **P0** |
| **T5a** | ✅ 分享文案加 privacy 卖点 | ★★ 低成本差异点 | 已落地：No account / no ads / browser-local | **P0（夹带）** |
| **T3** | ✅ 判定偏早/偏晚 + 结算页误差条（2026-09-12） | ★★★ 「能玩」→「能练」 | 已落地并接入 Next move | P1 |
| **T4** | ✅ 从失败点重开（挂 `MissReplayPanel`，2026-09-12） | ★★ 高难度谱能不能啃下来的前提 | 已落地，含计分完整性护栏 | P1 |
| **T1b/T5b** | ✅ OG / X 文本与 URL 随路由同步；✅ 海报跨设备能力分流；✅ 可玩成绩目标与精确复赛 | ★ | Share Sheet → 图片剪贴板 → 下载均已覆盖；完整局链接可赛前看目标、局后看分差并原目标重试；CF 新链接及 canonical/OG 统一根路径，旧 `/beatscape/*` 深链兼容；爬虫路由图属 T1c | P2 |
| **T1c** | ✅ 105 首 Track 无 JS 静态发现面（2026-09-13） | ★★ 搜索长尾与单曲 unfurl | release 自动生成静态 meta / JSON-LD / sitemap / 精确 CF rewrites；105 张逐曲分享卡已纳入门禁 | P1 |

---

## 2. 逐项实施规格

### T1a — 站点级 OG / Twitter 卡 【P0 · 已完成】

**落地状态：** `index.html` 已含静态 Open Graph / Twitter large-image 标签，`public/og.png` 为
1200×630；下面保留原始实施规格作为决策记录。

**为什么必须先做：** Reddit / Discord / X / Slack 的 unfurl 抓取器**不执行 JS**，只读静态 `index.html`。
现在发出去的任何 BeatScape 链接，在这些平台全部 unfurl 成**一行裸文本**——等于撒出去的链接全废。

**⚠️ 关键约束（决定了方案取舍）：**
CF Pages 是静态托管，`setPageMeta()` 里动态写的 og 对 unfurl **无效**。所以：
- **T1a（静态，必做）** —— 爬虫唯一能读到的。
- T1b（动态，P2） —— 只对 `navigator.share()` 和部分移动端分享面板（读当前 DOM）有效。

**改动**

1. `apps/beatscape/index.html` `<head>` 内追加：

```html
<meta property="og:type" content="website" />
<meta property="og:site_name" content="BeatScape" />
<meta property="og:title" content="BeatScape — Feel the Beat, Own the Scape" />
<meta property="og:description"
      content="English pop &amp; EDM browser rhythm game. 105 owned AI originals, no account, no trackers." />
<meta property="og:url" content="https://beatscape.pages.dev/" />
<meta property="og:image" content="https://beatscape.pages.dev/og.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="BeatScape — Feel the Beat, Own the Scape" />
<meta name="twitter:description"
      content="English pop &amp; EDM browser rhythm game. 105 owned AI originals, no account, no trackers." />
<meta name="twitter:image" content="https://beatscape.pages.dev/og.png" />
```

2. **需要一张 1200×630 站点级 `public/og.png`**（当前缺）。
   - 省事方案：从已备的 105 张单曲 og.png 里挑一张代表作复制为 `public/og.png`（~16KB，尺寸正好）。
   - 正经方案：按 `docs/BEATSCAPE-CHARACTER-ART-BRIEF.md` 的视觉语言新排一张（三人 + 台呼）。**人工项**，可后置。
   - 注意：`og:image` 必须是**绝对 URL**，Discord/Twitter 不接受相对路径。

**验收**
- `curl -s https://beatscape.pages.dev/ | grep -c 'og:image'` → ≥1
- 把链接粘进 Discord 私信自己，确认出大图卡片
- `https://www.opengraph.xyz/` 或 X 的 Card Validator 过一遍

**风险**：无。纯新增，不动任何运行时逻辑。

---

### T2 — Note speed 滑杆（arcade 也要能用）【P0 · 已完成 2026-09-12】

**落地状态：** Settings 提供 0.5–2.0×、0.05× 步长的全模式滑杆；Track 开玩区提供
48px 的 ±0.25× 快调并立即保存，开始浮层再次显示最终值。换算收口在 `lib/noteSpeed.ts`，
玩家看到的速度越高，`approach_sec` 越短。审计同时发现旧 `Casual visual speed` 的文案方向
与引擎相反（UI 0.75× 实际约 1.33×），故删除双倍率并忽略旧 `casualSpeed` 字段；旧极端
`scrollBias` 会归一到 UI 可表达范围。以下“背景/改动”保留为 2026-09-05 原计划快照。

**背景（比预想严重）：**
`PlayField.tsx:302`
```js
const scrollBiasMult = (1 + settings.scrollBias) * (mode === "casual" ? casualSpeed : 1);
```
- `casualSpeed` **只在 casual 生效** → arcade（唯一计分/进榜模式）**完全无法调下落速度**。
- `scrollBias` **两个模式都生效**，clamp −0.9..2 ⇒ 倍率 0.1×–3.0×，**但 UI 完全没有入口**（半成品设置）。

欧美音游玩家（osu! / Etterna / StepMania / Quaver）进游戏第一件事就是调 scroll speed；
现在 arcade 只有固定速度、casual 只有 3 档，会被直接判定为「这游戏没有这个选项」。

**改动**（引擎零改动，全在 UI）

1. `apps/beatscape/src/pages/Settings.tsx:148-158` 把 "Casual visual speed" 那一块改成两段：

```tsx
<label className="field">
  Note speed · {(1 + settings.scrollBias).toFixed(2)}×
  <input
    type="range"
    min={-0.5} max={1.5} step={0.05}
    value={settings.scrollBias}
    onChange={(e) => setSettings({ ...settings, scrollBias: Number(e.target.value) })}
  />
  <span className="hint">Applies to Arcade and Casual.</span>
</label>
<label className="field">
  Casual extra speed · {settings.casualSpeed.toFixed(2)}×
  <input
    type="range"
    min={0.75} max={1.5} step={0.05}
    value={settings.casualSpeed}
    onChange={(e) => setSettings({ ...settings, casualSpeed: Number(e.target.value) })}
  />
</label>
```

2. 滑杆范围说明：
   - `scrollBias` 存储层已 clamp −0.9..2，UI 收窄到 **−0.5..1.5（即 0.5×–2.5×）** 更实用，也留了余量。
   - `casualSpeed` 存储层 clamp 0.5..2，UI 收窄到 0.75..1.5。
   - **不要把 min 设成 −0.9**（0.1× 基本没法玩，容易误触后以为游戏坏了）。

3. （可选）`/settings` 说明文案里补一句键位按物理位置绑定、QWERTY/AZERTY/QWERTZ 通吃——现成的欧洲友好卖点。

**引擎路径（确认无需改动）**
`Settings` → `PlayField.tsx:302 scrollBiasMult` → `engine/geometry.ts:10 approachSec(ar, bpm, mult)`
→ `beats * (60/bpm) * mult`。UI 给值即可。

**验收**
- Settings 拖动滑杆 → 进 `/play/:id?mode=arcade` 确认音符下落速度真的变了（**arcade 下也要变**）
- 刷新页面后设置保留
- 旧存档（`casualSpeed` 是 0.75/1/1.25 之一）能正常读出，不出现 NaN
- `tsc` 干净 / `vitest` 122 / `vite build` 绿

**风险**：低。唯一要注意 `settings.ts` 的 `coerceSettings` 已逐字段校验，新滑杆值不会写坏。

---

### T5a — 分享文案加 privacy 卖点 【P0 · 已完成】

**落地状态：** 普通与分段练习分享文案已包含 no account / no ads / browser-local 语义；
下面保留原始实施规格。

`storage/session.ts:162`
```ts
export function shareResultsCopy(run: LastRun, url: string): string {
  return `I just ran ${run.title} on BeatScape — ${run.accuracy}% ${run.grade}. Feel the Beat, Own the Scape. ${url}`;
}
```

改成（欧美用户敏感点：no account / no tracking / no upload）：

```ts
return `I just ran ${run.title} on BeatScape — ${run.accuracy}% ${run.grade}. `
  + `No account, no trackers, no upload — it all stays in your browser. `
  + `Feel the Beat, Own the Scape. ${url}`;
```

**同步改**：`seo/pageMeta.ts` 的 `DEFAULT_PAGE_META.description` 与 `index.html` 的 description 一并加上这句（Reddit 的 link preview 会读 description）。

**验收**：`session.test.ts` / `pageMeta.test.ts` 里有断言 description 内容的（`pageMeta.test.ts:85-87`）会**跟着改**，别漏。

---

### T3 — 判定偏早/偏晚 + 结算页误差条 【P1 · 已完成 2026-09-12】

**落地状态：** `GameSession` 对已命中的 note 聚合 signed delta（负为 early、正为 late），
`TimingSummary {early,late,meanMs}` 随 `LastRun` 保存；读取侧会删除畸形 timing，旧存档没有该字段时
Results 安全隐藏。结算页显示 early/late 双向条、平均毫秒与 `Dead center / You hit early /
You hit late`。在此基础上新增 `Next move`：≥8ms 偏差给具体纠偏并重玩，且失败与多 Miss
拥有更高优先级，避免用 timing 建议掩盖真正阻塞。桌面与 Pixel 7 均已覆盖。

**为什么值得做：** 这是把「能玩」变成「能练」的关键。欧美核心玩家的自我提升闭环全靠
「你平均早了 12ms」。没有这个，玩家改进只能靠猜，留存上不去。

**现状卡点**
- `engine/judge.ts:14` `judgeDelta(deltaMs, mode)` **只返回 4 档，丢掉了符号**。
- `engine/playState.ts:187` 是唯一判定入口，`delta` 在那里是现成的，只是没存。
- `types/chart.ts:54-67` `PlayResult` 只有 `judgments` / `missEvents`，**没有任何误差数据**。
- `Results.tsx` grep `timing|early|late|hitError` **零命中**。

**改动（4 个文件）**

1. `engine/judge.ts` —— 新增聚合器（纯函数，好测）：
```ts
export type TimingStats = {
  n: number;          // 计入的 note 数（perfect/great/good，miss 不计）
  sumMs: number;      // 带符号求和，正 = 偏晚
  buckets: number[];  // 误差直方图，桶宽 10ms，覆盖 ±120ms ⇒ 24 桶
};
export function timingBucket(deltaMs: number): number;       // 超出范围返回 -1
export function emptyTimingStats(): TimingStats;
export function pushTiming(s: TimingStats, deltaMs: number): void;
export function timingMeanMs(s: TimingStats): number;        // n===0 返回 0
```

2. `engine/playState.ts:187` —— 判定后 `pushTiming(this.timing, delta)`；
   `finish()`（约 `:306`）把 `timing` 塞进 `PlayResult`。
   **只统计非 miss 的 note**，miss 没有 delta 语义（是"没按"，不是"按晚了"）。

3. `types/chart.ts` —— `PlayResult` 加 `timing?: TimingStats`；
   `LastRun`（`:69` 起）加 `timing?: TimingStats`。
   ⚠️ `storage/session.ts:109-112` 有注释明确要求**那两次写入绝不能抛异常**（后面还有成绩与排行榜存档）。
   新增字段是可选字段，`JSON.stringify` 天然容错，但**读取侧要防御旧存档没有 `timing`**（`readLastRun` 走 `JSON.parse` 无校验）。

4. `pages/Results.tsx` —— 在 `MissReplayPanel` 上方加一条误差条组件：
   - 中间 0ms，左偏早 / 右偏晚；柱子高度 = 该桶计数
   - 一行摘要：`Avg +12ms (late)` / `Avg −5ms (early)` / 全 perfect 时 `Dead center`
   - 尊重 `prefers-reduced-motion`

**验收**
- 新增 `engine/judge.test.ts` 用例：`pushTiming` 的符号、桶边界（±120ms 溢出）、`n===0` 不 NaN
- `Results.tsx` 在无 `timing` 的旧存档下**不崩**（手工构造一条 `bs_last_run_local` 验证）
- 跑一局故意早按，确认摘要显示 `early`
- `tsc` 干净 / `vitest` 递增 / `vite build` 绿

**风险**：中低。唯一要小心的是 localStorage 旧存档兼容。

---

### T4 — 从失败点重开 【P1 · 已完成 2026-09-12】

**落地状态：** Results 的 Miss Replay 现按失误 section 提供 `Practice` 入口；
`?seek=<t0>&until=<t1>` 会强制切到 Practice，从目标段前 3 秒倒计时，只判定 `[t0,t1)`
内起头的谱面对象并在段尾结束；跨越 `t1` 的长按/滑条允许完成尾部。仅传 `seek` 时兼容
旧版“从这里练到曲末”。结果页显示段名、实际区间与 `Practice run — not ranked`，可重复练
同一区间或返回完整 Arcade。成绩在 PB、All-time、Daily、run history、rank、achievement
六条路径均有代码护栏。单人暂停菜单为触屏补齐 `Restart track / Restart section`，与桌面
`R` 重开同能力；Duo 继续禁用单场重开，避免不同步。桌面 Chrome、Pixel 7 与 360px
窄屏流程通过。

**原背景：** 全 src 搜 `practice|autoplay|restart|retry` —— 只有 R 键整局重开（SESSION 已记录），
没有从中间起跑。`MissReplayPanel` 拿到了 `missEvents[].tMs` 和 `sections[]`（`{id,t0,t1}`），
是天然的挂载点，但它现在是**纯只读**的诊断面板。

**原计划（实现已扩展到音频时钟、进度和分享护栏）**

1. `MissReplayPanel.tsx` —— 每个失误分段给 `Practice` 按钮，跳
   `/play/:id?tier=..&mode=practice&seek=<t0>&until=<t1>`；不提供过碎的逐 miss 按钮。
2. `pages/Play.tsx` —— 解析、校验并传递 `seek` / `until`，显示段名和实际区间。
3. `PlayField` / `GameSession` —— 音频从 `seek` 起播，3 秒 lead-in；谱面只保留 `[seek,until)`
   内起头的对象并重算该段分母，在 `until` 结束；跨段长对象允许收尾。
4. `types/chart.ts` —— `PlayResult` 加 `seekedFrom?: number` 与 `seekedUntil?: number`
   （`seekedFrom` 存在表示分段练习；0 表示 Intro）。
5. `storage/session.ts:115` —— **计分完整性护栏**：
```ts
if (result.score <= ceiling && mode === "arcade" && !result.failed) {
```
加 `result.seekedFrom === undefined` 护栏 —— 从中途起跑的成绩**不得进榜、不得写 personal best**，
否则 105 首曲库的排行榜会被"只打副歌"刷掉。这是本项最容易出错的地方，必须写测试。

**验收（2026-09-12）**
- [x] 从 section 的 `t0` 起跑、在 `t1` 结束，只计算区间内对象与 accuracy 分母
- [x] 结算页显示段落 `t0–t1` 与 "Practice run — not ranked" → 排行与生涯存储不变
- [x] 构造 `mode=arcade&seek=…` → 页面仍强制 Practice
- [x] Intro `seek=0&until=…` 正确保留 Intro 音符并仍标记为分段练习
- [x] 单人暂停菜单的 48px `Restart track / Restart section` 可由鼠标与触控直接重开；Duo 不显示单场重开
- [x] 从暂停态重开同步清除 paused ref，不会让新倒计时再次冻结
- [x] `tsc` 干净 · Vitest 201/201 · Vite production build 通过
- [x] Playwright desktop + Pixel 7：严格分段/offset/暂停重开 8/8 + 完整曲主路径 4/4（含 44px 触控目标、360px 纵向布局、实际音频 seek 与 `until` 持久化）

**风险**：中。涉及计分路径，务必先写护栏测试再改 UI。

---

### T1b / T5b — 动态 OG + 海报跨设备分享 【P2 · 已完成 2026-09-12】

**落地状态：** Track / Results / Leaderboard 已接入 route title / description / canonical；
`setPageMeta()` 同步 OG / X title、description、URL，成绩数字使用 `en-US`。Results 按真实能力
提供文件 Web Share、PNG ClipboardItem 或仅下载，不渲染无效动作；系统分享取消静默、能力误报
可降级复制，权限拒绝引导下载。2026-09-13 进一步补齐 1080×1350 社交竖版：Share Sheet 与
下载使用 4:5，桌面图片复制保留 1200×630 横版，未增加结果页按钮数量。`pageMeta.test.ts` 21 例，
`results-sharing.spec.ts` desktop/mobile 8/8。2026-09-13 又把分享从“同曲入口”升级为无后端
异步成绩挑战：URL 携带 score / accuracy / grade，接收者赛前看到目标，局后得到 cleared / tied /
missed 与分差；分段 Practice 不携带目标，且 URL 明确不作为可信榜单凭据。挑战流程 desktop/mobile
与 320px 5 passed / 1 个预期 desktop skip，真实 60 秒完整曲落盘 1/1。客户端动态标签不能替代
Reddit / Discord 首次 unfurl；该基础设施已由下面的 T1c 静态发现面补齐。随后补齐精确
复赛：Results 同曲同 tier/mode 重试保留原目标，桌面挑战卡与手机固定 `↻ Retry` 各有唯一主动作；
换模式/难度、Track setup 或分段 Practice 离开不可比目标。CF 正式新链接统一为 `/play/*` 根路径，
同时兼容旧候选的 `/beatscape/*` 深链；从旧链打开时 canonical 与 `og:url` 也立即声明根路径，
避免同一曲目在搜索/分享层出现两套正式 URL。

- **T1b**：`seo/pageMeta.ts` 的 `setPageMeta()` 同步更新 `og:title/description/url` 与 X 对应字段。
  只对 `navigator.share()` 和部分移动端分享面板有效（它们读当前 DOM），**对 Discord/Reddit 的 unfurl 无效**——别抱错期望。
  客户端仍沿用静态站点图；per-track 图片要让爬虫读到，必须走下面的 T1c。
- **T5b**：优先用 `navigator.share({ files })` 发送真实 1080×1350 PNG 与挑战文案；不支持文件
  Share 时才显示 `Copy poster`，用 `ClipboardItem` 写 1200×630 横版；三种能力档均保留
  `Download 4:5`，无效 Share/Copy 不显示。完整局文案中的 play URL 带同曲 / tier / mode 与
  `challenge=1&target&acc&grade`，接收端完成对局后本地比较分数，并可用同一目标精确复赛；
  切换规则或进入分段 Practice 会退出挑战。不上传、也不写全球榜。
- **T1c（P1，已完成 2026-09-13）**：release 按 catalog 生成 105 个 `/track/:id` 静态 HTML、105 条 sitemap URL 与 420 条已知 ID 精确 CF rewrites；根路径和旧 `/beatscape/track/*` 均能在不执行 JS 时读到独立 title / description / canonical / OG / X 文本与 URL、`MusicRecording` JSON-LD。未知 ID 仍走 SPA 404。每页现使用该曲自己的 1200×630 PNG，卡内烘焙曲名、艺人、BPM、曲风、街区与浏览器游玩 CTA；release 对 105/105 图片做 PNG 签名、尺寸和内容哈希门禁，缺失或错误尺寸直接拒绝构建，不再回退站点通用图。

---

## 3. 明确**不做**（附理由，避免反复讨论）

| 事项 | 不做的理由 |
|------|-----------|
| **全球排行榜** | 需后端 + 反作弊，成本最高；且与 `Leaderboard.tsx:43` 明示的 "No global upload in Stage 1–3" 和 Privacy 页承诺**直接冲突**。先用 T1a + T5b 做社交替代（分享卡片带入新玩家），等 `COMMERCIALIZATION-GAP.md §6` 的「后端栈」拍板再说。 |
| **多语言 DE/FR/ES** | `DEFAULT_LOCALE = "en"` 对英美无碍；i18n 只接了 3/14 页说明基座还不成熟。等有真实的非英语流量再投。 |
| **完整练习模式**（变速 / 单段循环 / 自动演奏） | 先做 T4 最小版，看「从失败点重开」的使用率再决定要不要扩。 |
| **账号 / 云存档** | 同上，阻塞在 GAP §6 决策点。 |

---

## 4. 与现有 backlog 的交叉引用

| 现有项 | 关系 |
|--------|------|
| #14 人工耳检 105 首 | **无关的独立阻塞项**，仍是 DoD 唯一剩余。T1–T5 不依赖它，但**对外发链接前必须先过耳检**（发的是曲库） |
| #15 差异化盲测 | 同样阻塞对外宣称。T1a 让链接能看了，但不代表可以宣称原创性 |
| #18 gridfit CI 门禁 | 独立，按档位分设阈值 |
| #21 beatscape 部署脚本补自检 | **与 T1a 强相关**：T1a 改完 index.html 后，自检应加一条"产物里必须有 og:image"，否则下次部署漏了又发现不了（对齐 `VITE_GAME_URL` 那次的教训） |
| #22 清理 2.2GB 构建产物 | 独立 |
| #23 sync-check 的 corr 打印值不可读 | 独立 |

---

## 5. 建议执行批次与门禁

**第 1 批（P0，约 40 行 + 1 张图，纯前端零风险）**
T1a → T2 → T5a
- 门禁：`tsc` 干净 / `vitest` 122 / `vite build` 绿 / 部署后 `curl` 验 og / Discord 私信验卡片
- 依赖人工：站点级 og.png 一张

**第 2 批（P1，跨文件，需写测试）**
T3（误差反馈）→ T4（从失败点重开，**先写计分护栏测试再改 UI**）

**第 3 批（P2）**
T1b / T5b

每批单独 commit，不要混。

---

## 6. 修订记录

- **2026-09-05 初版**。起草过程中修正了两处基于印象的误判，均已在正文标注：
  1. ~~「下落速度改滑杆」~~ → 实际不是把 3 档改滑杆这么简单：`casualSpeed` **对 arcade 无效**，
     要暴露的是另一个 UI 无入口的 `scrollBias`（T2）。
  2. ~~「分享加复制到剪贴板」~~ → 实际 "Copy link" 早就有了（`Results.tsx:293`），
     真正缺的是 OG 卡片（T1a）和 privacy 文案（T5a）。
