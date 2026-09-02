# BeatScape 优化盘点 — 2026-08-31

> 范围：`apps/beatscape`（src 11.5k 行 TS/TSX · 15 个测试文件 · 111 用例 · 85 首曲库）
> 方法：静态代码审计 + 实测（`du` / `sips` / `grep`）。所有数字均为本机实测，非估算。
> 本文只盘点，不改代码。

---

## 0. 一句话结论

代码质量其实相当好（strict 全开、零 `any`、零 `@ts-ignore`、零 TODO、rAF 单 canvas 无 setState 风暴）。
**真正的大问题只有三个，且都不在代码逻辑里：**

1. **部署产物 886 MB**，其中 **546 MB 是游戏永远不加载的 `stream.m4a`**
2. **立绘 PNG 7.1 MB 被塞进 52–72 px 的框里**（首屏白烧 ~6.4 MB）
3. **Cloudflare Pages 上缓存头全部失效**（`_headers` 不存在，规则只写在 netlify.toml）

外加一个**一行的真 bug**：ScoreStreak 衰减恒为 0，导致 NEON/LIGHTING 氛围层的"间奏暗下来"设计从未生效。

---

## P0 — 立刻做（字节/正确性，性价比最高）

### P0-1 · 546 MB `stream.m4a` 从未被游戏加载，却每次都部署

实测：

| 资产 | 总量 | 首数 | 是否被 `src/` 引用 |
|------|------|------|--------------------|
| `stream.m4a`（216s 流媒体版） | **546 MB** | 85 | ❌ 从未 fetch |
| `audio.m4a`（120s 游戏切片） | 283 MB | 85 | ✅ 游戏只用这个 |
| `preview_48s.m4a` | 27.8 MB | 25 | ⚠️ 仅 10 首登记进 catalog.json |
| `og.png`（1200×630） | 1.6 MB | 85 | ❌ 无任何 og:image 发射器引用 |

`grep -rn "stream_audio" src/` 只有两处，且都是布尔判断，不读 URL：

```ts
src/types/catalog.ts:28   stream_audio?: string;
src/lib/streamLink.ts:20  return Boolean(track.stream_audio || track.stream_app_url || STREAM_APP_BASE);
```

**影响**：每次 `deploy:cf` 推 886 MB；Cloudflare Pages 构建/上传耗时与配额全被这 546 MB 吃掉。
**修复**：`stream.m4a` + `og.png` 移出 `public/`，改投 R2/CDN（Scape Music 站才是它真正的消费者）。
**收益**：部署体积 **886 MB → ~340 MB（−62%）**。

### P0-2 · 立绘 PNG 7.1 MB → 显示尺寸 52–72 px

实测 7 张 PNG 原图 **640×935 / 832×1216**，单张 828 KB–1.3 MB：

```
chrome-yard.png     832×1216   1.3M
pulse-core.png      832×1216   1.3M
skyline-hook.png    832×1216   1.3M
afterhours-lane.png 640×935    836K
night-grid.png      640×935    836K
slide-district.png  640×935    832K
glass-rim.png       640×935    828K
```

但 `CharacterAvatar.tsx` 把它们渲染进 **52–72 px** 的框：

```tsx
src/components/CharacterAvatar.tsx:18
  src={`${import.meta.env.BASE_URL}${ca.art.replace(/^\//, "")}`} width={size} height={size} loading="lazy"
```

- `Home.tsx:150-157` 一次渲染全部 7 张（`CHARACTER_LIST = Object.values(CHARACTER_ART)`）
- `Library.tsx:147` 每张卡片一张 @52px → 移动端首屏 6 张卡 ≈ **6.4 MB**

`loading="lazy"` 救不了 Library（首屏就在视口内）。PNG 已压过，gzip 反而更大（855,976 → 856,279），传输层无压缩空间。
**修复**：导出 128×128 WebP/AVIF，或 `srcset` 96w/192w。
**收益**：**7.1 MB → ~40 KB（−99%）**，顺便解决 Library 首屏 LCP。

### P0-3 · Cloudflare Pages 上所有缓存头失效

`public/_headers` **不存在**（实测 `No such file or directory`）。规则只写在 Netlify 专属的 `netlify.toml`：

```toml
[[headers]]  for = "/catalog/*"  Cache-Control = "public, max-age=86400"
[[headers]]  for = "/assets/*"   Cache-Control = "public, max-age=31536000, immutable"
```

`wrangler.toml` 无任何缓存配置，`vercel.json` 只有 rewrite。
**后果**：`dist/assets/index-CiDCqaLN.js` 这类**内容哈希文件**在 CF Pages 上拿到短 TTL 甚至 0；回访用户每次重下整个 bundle。
**修复**：新建 `public/_headers`：

```
/assets/*
  Cache-Control: public, max-age=31536000, immutable
/catalog/*
  Cache-Control: public, max-age=31536000, immutable
```

（catalog 路径按 track id 寻址，内容稳定，可安全 immutable。）

### P0-4 · ScoreStreak 衰减恒为 0（真 bug，一行修复）

`src/components/PlayField.tsx:1030-1035`：

```ts
surgeRef.current.decay(Math.min(250, Math.max(0, eff - lastEffMsRef.current)));
lastEffMsRef.current = eff;                                    // ← 先赋值
// ScoreStreak feeds the LIGHTING rig + NEON ambience (survives good).
streakRef.current.decay(Math.min(250, Math.max(0, eff - lastEffMsRef.current)));  // ← 恒为 0
```

上一行刚赋过值，delta 永远 0；`ScoreStreak.decay()` 在 `dtMs <= 0` 直接 return（`surge.ts:105`），
所以 `surge.ts:104-115` 的 grace window + bleed 整段是死代码，**NEON/LIGHTING 的"间奏变暗"从未生效**——
与 `surge.ts:71-73` 的设计注释直接矛盾。

**修复**：

```ts
const dt = Math.min(250, Math.max(0, eff - lastEffMsRef.current));
lastEffMsRef.current = eff;
surgeRef.current.decay(dt);
streakRef.current.decay(dt);
```

并补一条回归测试（现有 `surge.test.ts` 漏了这个 case）：断言静默 2s 后 `streak` 确实衰减。

---

## P1 — 明显该做（首屏体验 / 健壮性）

### P1-1 · 每帧调用 `matchMedia()` 约 85 次

`PlayField.tsx:47-52` 定义在函数里，每次调用都新建 `MediaQueryList` + 跑一次样式查询：

```ts
function fancyFxOn(settings: { fancyFx: boolean }): boolean {
  if (!settings.fancyFx) return false;
  if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  return true;
}
```

全文件 **13 处调用**，其中 `:404` / `:422` 在 `drawNote` 内（**每个可见音符每帧 2 次**）。
按 40 个同屏音符算 ≈ **85 次/帧 ≈ 5000 次/秒**。中端机上是实打实零点几毫秒的预算占用。
**修复**：effect 作用域内算一次布尔常量，需要动态响应就挂 `change` 监听。

### P1-2 · Play 页整段下载 + 解码 120s 音频才开始

```ts
src/audio/playback.ts:101-104
  const res = await fetch(url); const ab = await res.arrayBuffer();
  this.buffer = await this.ctx.decodeAudioData(ab.slice(0));
```

无 Range/流式：3.4 MB 全部落地后，再解码成 ~42 MB Float32 常驻内存。
另：`Track.tsx:73` 的"Preview"也指向完整 `audio.m4a`（3.4 MB），而不是现成的 `preview_48s.m4a`。
**修复**：Preview 切到 `preview_48s.m4a`（27.8 MB 已存在，把 25 首全部登记进 catalog.json，现在只有 10 首登记、15 个孤儿文件）；Play 页改用 `<audio>` + `MediaElementSource` 边下边播。

### P1-3 · Home 页 85 个封面请求，且无法 lazy

```tsx
src/pages/Home.tsx:202
  <div className="trend-cover" style={{ backgroundImage: `url(${assetUrl(t.cover)})` }}>
```

CSS `background-image` 不支持 `loading="lazy"`，而 `.trending-scroll` 是横向滚动容器，
Chrome 会连视口外的也一起取 → 首屏 **85 个请求**。
`cover.svg` 源 viewBox 是 512×512，实际显示约 150 px。
**修复**：换成 `<img loading="lazy" width height>`，或 `content-visibility:auto` + 前 8 张 eager。
**收益**：85 → ~9 请求。

### P1-4 · 无 Error Boundary，三处 catalog 加载无 catch

```ts
src/pages/Home.tsx:51      void loadCatalog().then((c) => setTracks(c.tracks));
src/pages/Library.tsx:32   void loadCatalog().then((c) => setTracks(c.tracks));
```

catalog.json 一旦 404 → unhandled rejection + **空白页零反馈**。（`Leaderboard.tsx:20` 有 catch，不一致。）
同理 `Play.tsx:36` 的 `await getTrack(id)` 在 try 块**外面**，失败时永远卡在 "Loading chart…"。
全项目 `ErrorBoundary|componentDidCatch|getDerivedStateFromError` **0 命中**。
**修复**：抽 `useCatalog()` hook（`{tracks, loading, error}`）+ 错误态 UI；`App.tsx` 包一层 ErrorBoundary；`getTrack` 移进 try。

### P1-5 · 15 处 `localStorage.setItem` 全部未加保护（读却大多加了）

`settings.ts`（36/48/61/85/115/120）、`session.ts`（33/105/106）、`progress.ts`（113/220/226）直接 setItem。
Safari 隐私模式 / 配额超限会抛异常，**直接打断结算页的存档流程**。
另：`loadSettings`（`settings.ts:28`）是 `{...DEFAULT, ...JSON.parse(raw)}`，无 schema 校验——
`{"musicVolume":"x"}` 会产出 `NaN` gain。
**修复**：统一 `safeStorage` 包装 + 逐字段 clamp 校验。

---

## P2 — 值得排期（架构 / 可维护性）

### P2-1 · 零代码分割：13 个路由全在一个 chunk

`App.tsx:2-14` 全部静态 import，`router.tsx` 无 `React.lazy`/`Suspense`。
326 KB 单 chunk 里装着 Leaderboard / Radio / Characters / Calibration / Settings / Legal / Profile。
**修复**：8 个非关键路由改 `React.lazy`，保留 `/` `/library` `/play/:id` eager。
（注：JS gzip 仅 99.6 KB，此项优先级低于上面所有 P0/P1。）

### P2-2 · `PlayField.tsx` 1487 行，可拆 5 块

实测重复：
- **FX-commit 三段完全相同**（`:1146-1166` `addFx` / `:1186-1190` `handlePress` / `:1204-1208` `handleRelease`）——同样 5 步：`fxRef.push / surge.apply / streak.apply / spawnHitFx / playHit`
- **Reset 逻辑重复**：`:162-179`（18 行）vs `restartRun` `:292-319`（28 行）
- **`skewPath` 与 `HeroGameplayPreview.tsx:20-34` 逐字符相同**
- 可抽 hooks：`useConductor` / `useSprites` / `useDevQaParams`（`:117-133`）+ 约 700 行的 `draw()` 闭包 → `engine/renderer.ts`

**进度（2026-09-01 → 09-02）**：两层拆分均已完成。① **安全层**（2026-09-01）：8 个纯函数（`prefersReducedMotion`/`fancyFxOn`/`skewPath`/`inkedText`/`hexToRgb`/`makeHalftonePattern`/`makeRaysSprite`/`makeDiamondRingSprite`）抽离到 `src/components/playfield/canvasHelpers.ts`（162 行），`PlayField.tsx` 由 1643 → 1497 行。② **深层**（2026-09-02）：整段 ~880 行 rAF `useEffect` **逐字节 verbatim** 迁到 `src/components/playfield/renderLoop.ts`（1069 行），导出 `createPlayfieldRenderer(ctx): () => void`；`PlayField.tsx` 进一步降到 **664 行**（累计 −979 行 / −59.6%）。仅一处 `onFinishRef.current(` → `onFinish(` 改名，其余靠 `tsc` strict 保证无 ref 漏迁；常量 `LANE_FLASH_MS`/`JUDGE_LABEL`/`JUDGE_COLOR`/`COMBO_MILESTONES` 一并迁入。`tsc`/`vitest 120`/`vite build` 全绿。**仍可选做**（纯重构、零组件测试覆盖，暂不做）：`useConductor`/`useSprites`/`useDevQaParams` hooks 抽取、FX-commit 三段去重、Reset 逻辑去重。

### P2-3 · 每帧六次 `.filter()` 分配 + `tick()` 全量扫描

`:621/641/650/686/759/813` 每帧 6 个新数组 + 6 个闭包（360 数组/秒）→ GC 抖动。
`playState.ts:104` `get isComplete() { return this.notes.every(...) }` 被 `tick()` 和 `press()` 各调一次，
配合 `PlayField.tsx:562` 无窗口裁剪的全量遍历，1500 音符的谱面每帧白跑 ~3000 次迭代。
**修复**：维护按 `tMs` 排序的 `cursor` + `doneCount` 计数器；粒子池原地压缩（swap-with-last）。

### P2-4 · 打击音每次命中新建约 50 个 AudioNode

`hitsounds.ts:200-230`：tier-3 PERFECT 触发 `strike`×2（各 4 节点）+ `bell`×4（各 10 节点）+ `padLow`，
无池化、无声部上限、无 `disconnect()`。8 hits/s ≈ **430 节点/秒**在主线程创建销毁。
**修复**：每种变体预渲染成小 `AudioBuffer`，用单个 `BufferSource` 播放 + 硬性声部上限。

### P2-5 · `Conductor` 卸载时整条音频图泄漏

`playback.ts:37-51` 建了 gain/filter/analyser 接到 destination，但 `stop():174` 只停 buffer source，
**从不 disconnect，也没有 `dispose()`**。更糟：`PlayField.tsx:216` 的 effect 依赖含 `settings.musicVolume/sfxVolume/hitsound`，
**任何音量/音色改动都会在会话中构造第二条泄漏的图**。
**修复**：加 `dispose()`（解绑 onended + disconnect 三个节点）并在 cleanup 调用；把可变音量更新挪进 `:219` 的 live-toggle effect，从 deps 移除。

### P2-6 · 时序积分器永不重锚

`playback.ts:132-148` 是 `_accumMs += dt * _rate`，从不向 `ctx.currentTime - startedAt + offset` 重锚。
任何代码看不到的挂起（iOS 路由切换 / 来电中断）会留下**永久性**歌曲时间误差且无法恢复；
全项目**无 `statechange`/interruption 处理**，只有 `startRun()` 里一次性 `unlockAudio()`。
另外原始 `currentTime` 以 128 采样为步进（48kHz ≈ 2.7ms），对 60Hz rAF 会呈阶梯抖动。
**修复**：记录 `startedAt`/`startOffset`，周期性地把 `_accumMs` 向真实位置软校正（限幅 ±5ms/s）；
用 `performance.now()` 在音频时钟更新之间插值；加 `ctx.onstatechange` → 重新 `resume()`。

> 这是全项目**风险最高且零测试覆盖**的模块（`Conductor` 是权威歌曲时钟，0 个测试）。

### P2-7 · 其他每帧浪费

- `:835` `session.score.toLocaleString()` —— `Intl` 是浏览器最贵的 API 之一，每帧调用。**分数几秒才变一次，缓存即可**
- `:467` `hexToRgb(districtColor(...))` 与 `:451` `keyLabels(keys)` 每帧执行但结果恒定
- ~12 处 `fillStyle = \`rgba(${r},${g},${b},…)\`` 模板字符串（`:471/474/513/520/557/577/580/645/659/707/750/872/986`）——每次都让 canvas 重新解析 CSS 颜色。**改用 `globalAlpha` + 缓存的实色**
- `:387` `getContext("2d")!` ——画面每帧不透明全覆盖（`:469`），`alpha:true` 白白多一次合成。**改 `{ alpha: false, desynchronized: true }`**
- `:1256` `wrap.getBoundingClientRect()` 在 `onPointerMove` 里 —— 每次指针移动强制读布局（移动端 120Hz+）。**缓存到 resize**
- `Play.tsx:26` `const settings = loadSettings()` 每次渲染都读 localStorage + JSON.parse。**用 `useMemo`**
- `:1173` rAF deps 含 `settings.fancyFx`/`hitsound` → 中途改音效会销毁重建循环并重跑 sprite 预渲染，可见卡帧；同时 `muted` 在 `:1057` 被读但**不在 deps**（stale closure）。**两者都改用 ref**

### P2-8 · 无障碍

- `HeroGameplayPreview.tsx:200-204` **无条件无限 rAF 循环**，无 reduced-motion 检查也无 IntersectionObserver 暂停 → 首页常驻 CPU/耗电
- 全项目 `prefers-reduced-motion` 仅 3 处窄 CSS 块（`styles.css:1209/1251/2861`），却对着 10 个 `@keyframes` + 两个 rAF canvas
- `router.tsx:65-70` 路由切换无 scroll reset、无焦点管理、无 aria-live 播报
- `Home.tsx:216` intro 弹窗有 `role="dialog" aria-modal="true"` 但**无焦点陷阱、无 Escape 关闭、无焦点归还**
- `PlayField.tsx:1308-1327` `role="button" tabIndex={0}` 的 div 里嵌真 `<button>`；且只处理 Enter 不处理 Space
- 游戏可键盘玩（`:1212-1239` 通道键、R 重开），但**无 Escape/P 暂停**
- `styles.css:1872-1876` `.field input/select` 设了 `outline: none` 且无替代可见焦点 → **WCAG 2.4.7 失败**

### P2-9 · 字体：请求 10 个 face，其中 Sora 500 没用上

`index.html:22` 请求 Anton + IBM Plex Sans（5 个变体含斜体）+ Sora（4 个 weight）= **10 faces**。
`styles.css` 实际用到 400/500/600/700/800，但所有 `font-family: Sora` 声明（`:944/973/2173/2238`）配的都是 600/700/800，**Sora 500 从未使用**。
`&display=swap` 已带（✅），两个 preconnect 正确（✅）。
另外 Google Fonts 的 `<link rel=stylesheet>` 排在入口 `<script type="module">` **之前**，会阻塞 326 KB 入口脚本执行。
**修复**：删掉 `Sora:wght@500`；考虑自托管字体消除 2 个跨域 RTT；加 `<link rel="preload" as="script">`。

### P2-10 · i18n 是空壳（已确认）

`en.ts` / `zh.ts` **key 集完全相同**（各 13 行），但 `zh.ts:3` 自己写明是 stub，只有 `emptyState` 真翻译了。
同时 JSX 里散落 **50+ 处硬编码英文**，例如：

```
Home.tsx:144  >Meet NIGHTSHIFT<          Home.tsx:182  >Featured in the Scape<
Home.tsx:197  >Explore the city<         Settings.tsx:75/81/107/139/179  Settings/Profile/Audio/Gameplay/Key map
PlayField.tsx:19-22  JUDGE_LABEL (PERFECT/GREAT/GOOD/MISS)
PlayField.tsx:730  "EARLY"/"LATE"        :935  "STREAK"     :1097  `${combo} COMBO!`
PlayField.tsx:1298  "Cueing audio"       :1303  "Signal lost"    sharePoster.ts:108  "ON AIR"
```

**修复**：扩充 `Messages` 覆盖 UI，加 CI 断言 `Object.keys(en)` 深等于 `Object.keys(zh)`。

---

## P3 — 清理项

- **死导出**：`router.tsx:156` `Navigate`、`touchInput.ts` `debounceOk`、`firstPlay.ts:6-7` 两个常量、`i18n/index.ts:6` `Locale`、`geometry.ts:6` `RECEPTOR_BOTTOM_RATIO`、`judge.ts:4-5` `WINDOWS_ARCADE/CASUAL`、`surge.ts:75/77` `STREAK_TIERS/StreakLevel`
- **~19 个未使用 CSS 类**（218 个顶层选择器中约 9%）：`advanced-toggle`、`cover-lg`、`encourage`、`field-row`、`filter-toggle`、`hero-cover-card`、`hero-cover-card-float`、`hp-bar`、`hp-fill`、`play-hud`、`practice-btn` 等（`grade-A…S` 是 `Results.tsx:149-150` 动态拼接，误报）
- **CLS**：`Library.tsx:146`、`Track.tsx:54` 的封面 `<img>` 无 `width`/`height`；Track 页 hero 是 LCP 候选，应加 `fetchpriority="high"`
- **TypeScript**：strict ✅、`noUnusedLocals` ✅、**零 `any`、零 `@ts-ignore`**（这点很干净）。仅 3 处 `as unknown as`（`PlayField.tsx:270/276` 仅 dev 用 `__bs`、`analytics.ts:23`、`context.ts:12`）与 22 处非空断言；最该改的是 `:387` `getContext("2d")!` 和 `:452` `sessionRef.current!`（都在 rAF 路径上）
- **安全**：`dangerouslySetInnerHTML|innerHTML|eval(` **0 命中**；昵称经 trim/24 + 脏词过滤后以文本渲染；`analytics.ts` 只存 `{event, props, t}` 无 PII；`sharePoster.ts` 自绘 canvas 无跨域污染 —— **这块确实干净**
- **`Calibration.tsx:32` 用 `setInterval` 打拍子**，而命中时间用 `AudioContext.currentTime` 测量 → 计算出的 offset 有系统性偏差。**改成在音频时钟上预排 8 拍**

## 测试覆盖缺口

15 个测试文件覆盖：engine（judge/geometry/playState/surge/noteSprite）、input（keyMap/touchInput）、lib（progress/profanity/radio）、catalog/trackVibe、seo/pageMeta、storage/session、i18n/leaderboard。
**未覆盖且风险最高**：

| 模块 | 风险 |
|------|------|
| `audio/playback.ts`（211 行） | **最高** —— 权威歌曲时钟，pause/resume、`setRate` 慢放、`sweepOpen`、`_accumMs` 漂移全无测试 |
| `audio/hitsounds.ts`（314 行） | 最大的未测逻辑文件 |
| `catalog/loadCatalog.ts` | 无 `!res.ok` 路径测试，直接关联 P1-4 |
| `lib/sharePoster.ts` | 未测的 canvas 导出 |
| `lib/{analytics,dailyChallenge,firstPlay}.ts` | `getDailyChallenge` 确定性极易测却未验证 |
| `storage/settings.ts` | 无未校验解析路径的测试（P1-5） |
| 全部 14 个 .tsx | **零组件测试**——所以 P2-8 的焦点管理/对话框语义问题一直没被发现 |

---

## 建议执行顺序

1. **P0-4**（一行修复 + 一条回归测试）
2. **P0-1 → P0-2 → P0-3**（部署体积 886 MB → ~340 MB，立绘 −99%，缓存头生效）
3. **P1-4 / P1-5**（错误边界 + storage 保护，防白屏与存档丢失）
4. **P1-1 / P2-7**（每帧 matchMedia 与各类每帧分配，中端机帧率）
5. **P2-5 / P2-6**（Conductor 泄漏与时序重锚，**同时补测试**）
6. **P2-1 → P2-2 → P2-8 → P2-9 → P2-10**（分割、拆组件、无障碍、字体、i18n）
7. **P3 清理**

> 与 `SESSION.md` 的关系：本文只覆盖代码/资产层面的优化，不含**耳检 50 首**、**盲测**、**商业化决策点 5 项**、**商标 TSDR 正式检索**等人工阻塞项。

---

## 修复状态（2026-08-31 → 09-01）

| 项 | 状态 | 说明 |
|----|------|------|
| P0-4 ScoreStreak decay | ✅ | `decayAtmosphere()` + `surge.test.ts` 3 条回归（baseline 111→114） |
| P0-3 `_headers` | ✅ | 新建 `public/_headers`（CF Pages 真缓存头，替代失效的 netlify.toml） |
| P0-2 立绘 WebP | ✅ | 7 张 PNG（7.1 MB）→ 128w/512w WebP 共 14 张（339 KB，−95.3%）；`CharacterAvatar` + PlayField 水印改吃 WebP + `srcset` |
| P1-4 错误边界 / catalog | ✅ | `ErrorBoundary` 包 Router；`useCatalog()` hook（含 error 态）；Home/Library 提示条；`App.tsx` 9 条路由 `React.lazy` + `Suspense` |
| P1-5 safeStorage | ✅ | `safeStorage.ts` 统一封装 + `coerceSettings` 逐字段校验（防 NaN gain） |
| P1-1 / P2-7 每帧优化 | ✅ | `matchMedia` 提出循环；`score` 文本缓存；`keyLabels`→`keyHint`；6 处 `.filter()`→原地压缩；`getContext("2d",{alpha:false})`；rect 缓存；rAF 依赖去音量项；`conductor.dispose()` |
| P2-5 / P2-6 Conductor | ✅ | `dispose()` + 时序重锚（已在 uncommitted 工作中落地，本次补 `dispose()` 调用 + 校验） |
| P2-4 打击音 AudioNode 复用 | ✅ | `hitsounds.ts` 重写为「VOICES 注册表 + OfflineAudioContext 预渲染缓存」：`ensureRendered()` 一次性把 18 种复合打击音（tier 折叠 perfect→t0/t1/t2/t3、great→t0/t1/t3、good→t0/t3、miss→"miss"）渲染成 `AudioBuffer` 入 `voiceCache`；`playVoice()` 改为单 `BufferSource` 回放（≈2 节点/hit vs 原 ~49），声部上限 + `disconnect()` 兜底；所有合成参数（频率/泛音/增益/时长）与原实现逐字节一致，音色不变。新增 `hitsounds.test.ts` 3 条回归：① 缓存恰好 18 项 ② 缓存回放 ≤2 节点且 0 振荡器/0 biquad（证明预渲染） ③ `voiceKeyFor` tier 折叠正确。 |
| P2-2 PlayField 拆分 | ✅ | 两层拆分均落地。**安全层**：8 个纯函数抽至 `src/components/playfield/canvasHelpers.ts`（162 行）。**深层层**：整段 ~880 行 rAF `useEffect`（canvas 初始化、sprite 预渲染、`drawNote`/`resize`/`panel`/`scoreTextFor`/`draw`/`loop`/`finishRun`/`addFx`）**逐字节 verbatim** 迁到 `src/components/playfield/renderLoop.ts`（1069 行），导出 `createPlayfieldRenderer(ctx: PlayfieldRenderContext): () => void`（返回 dispose：cancel rAF + disconnect ResizeObserver）。`PlayField.tsx` 由 1643 → **664 行**（−979 行，−59.6%）。仅 `onFinishRef.current(` → `onFinish(` 一处改名；`tsc` 作回归网（漏迁/错类型任一 ref 即 strict 失败）；常量 `LANE_FLASH_MS`/`JUDGE_LABEL`/`JUDGE_COLOR`/`COMBO_MILESTONES` 一并迁入。验证：`tsc --noEmit` 干净、`vitest run` 120 passed、`vite build` 成功。**余量纯重构进度（2026-09-01）**：FX-commit 三段去重已完成——`handlePress`/`handleRelease` 内逐字节相同的 5 步块抽成 `commitFx(fx: JudgeFx)`（`PlayField.tsx` 664 → 672 行，净增因 helper 包装；重点是消除两处重复逻辑）；`renderLoop.ts` 的 `addFx` 本就是单函数（非重复），拆分时已自然收口；Reset 去重经核查原审计指的两处初始化块现已合并为单一 `restartRun`（`grep` 仅 1 处 `new GameSession`），不适用。**仍可选做**：`useConductor` 抽取（audio 生命周期连 dispose/实时音量，风险高、零组件测试，暂缓）；`useSprites` 已随深层拆分落入 `renderLoop.ts` 的 sprite 预渲染，无需单抽。 |
| P2-1 代码分割 | ✅ | 见上 `App.tsx`；构建产物 11 个 lazy chunk（首屏 JS 101 KB gzip） |
| **P0-1 `stream.m4a` 外迁** | ✅ **已做（安全迁移）** | 深入核查：`stream_audio` 仅被 `streamLink.ts` 用作布尔存在性判断（`Boolean(track.stream_audio \|\| ...)`），游戏**从不读取其 URL**；`resolveStreamAppUrl` 走 `STREAM_APP_BASE/track/{id}`（env 未设→null），且 0 首设 `stream_app_url`——即外部站当前也未从游戏 UI 链出。`og.png`（85×1.6 MB）经 grep 确认**零引用**（`index.html` 无 `og:image` 发射器）。`stream.m4a`（546 MB / 85 首）为 git-tracked 且外部站潜在消费者。**已按用户确认执行安全迁移**：85×`stream.m4a` + 85×`og.png`（共 548 MB）移出 `public/catalog` → gitignored 的 `data/beatscape-stream/`（本地磁盘保留供外部站 re-host），git 索引已解除追踪（170 文件 staged 为删除，未 commit）。BeatScape 部署 886 MB → **385 MB**，`dist/` 已无此二资产；游戏代码零改动（仅依赖布尔存在性标志）。外部 Scape Music 站若需这些音频，需改从 `data/beatscape-stream/` 自行托管或走 R2/CDN。 |
| P1-2 preview_48s | ✅ | 登记 15 个孤儿 `preview_48s.m4a` 进 `catalog.json`（10→25）；`Track.tsx` 预览优先 `track.preview` 回退 `track.audio` |
| P1-3 Home 封面 | ✅ | 3 处 `background-image` → `<img loading=lazy width height decoding=async>` + `srcset` 思路；新增 `.trend-cover-img` CSS |
| P2-9 字体 | ✅ | 字体 CSS 改非阻塞（preload+onload / noscript 兜底）；去掉未用的 Sora 500 |
| P2-8 无障碍 | ✅ | `HeroGameplayPreview` rAF 受 reduced-motion + IntersectionObserver 控制；`router` 路由切换 scroll/focus 复位；PlayField `Esc/P` 暂停（togglePause 改函数式更新防 stale）；修复 `role=button` 套 `<button>` 非法结构；`.field` 已有 `:focus-visible` 可见焦点环 |
| P2-10 i18n | ✅* | `Messages.ui` 字典（en+zh）+ `i18n.test.ts` 递归 key-parity 断言（CI 守门）；Home/Track/TrackAudioPreview 已接 `getMessages()`。剩余组件（Settings/Results 等）的机械迁移留作后续增量 |
| **AudioBar 播放条（新增）** | ✅ | 四项一次做完。**① 拖拽性能**：`getBoundingClientRect()` 从「每次 `pointermove`」改为 `pointerdown` 缓存进 `rectRef`（同 P2-7 思路）；新增 `paint(seconds,total)`，拖拽期间**直接写 DOM**（fill 宽 / thumb 左 / 时间文本 / 气泡），`setTime` 只在 `pointerup` 提交一次 → 每次手势最多 2 次 re-render，而非每帧一次。拖拽期间 `onTimeUpdate`/`onProgress` 均早退，杜绝进度抖动。**② 键盘 + 无障碍**：`role="slider"` 补 `tabIndex={0}` + `onKeyDown`（←/↓ −5s、→/↑ +5s、PageUp/Down ±10s、Home/End、Space/Enter 播放暂停，全部 `preventDefault`），补 `aria-valuetext`（`M:SS of M:SS`，不再是裸秒数）、`:focus-visible` 橙色焦点环。**③ 健壮性**：补 `onEnded`（按钮不再卡在 pause 图标，并归零便于重播）、`onError`、`onDurationChange`；`el.currentTime` 赋值前检查 `readyState > 0`（Safari 元数据未加载时抛 `InvalidStateError`）；`src` 变化时一并重置 `buf`/rect/drag；`fmt` 提到模块作用域（不再每次 render 重建）。**④ 视觉/交互**：新增缓冲进度条 `onProgress` → `.audiobar-buffer`；拖拽/悬停/聚焦时显示时间气泡 `.audiobar-bubble`；thumb 悬停 `scale(1.25)`；`.audiobar-track::after` 把 8px 的热区上下各撑 7px（触屏更好按）。**React 细节坑（已规避）**：`paint()` 用 `textContent` 改写时间文本，只有在该 span 恰好是**单一 Text 子节点**时才会复用节点（`string replace all` 规范），否则 React 持有的 text node 会脱钩、后续时间更新静默失效——故时间 span 写成 `{`${fmt(time)} / ${fmt(dur)}`}` 单插值。验证：`tsc --noEmit` 干净、`vitest run` 120 passed、`vite build` 成功（CSS 42.89→44.90 KB / gzip 9.13→9.58 KB，首屏 JS gzip 102→103.6 KB）。**测试覆盖仍为 0**（`vite.config.ts` 测试环境是 `node`、无 jsdom，`.tsx` 组件无法渲染），如需覆盖要另加 jsdom + testing-library。 |
| **A 档视觉改造（滚动揭示 / 封面交互 / Hero 画框）** | ✅ | 新增 `src/components/useReveal.ts`（IntersectionObserver 滚动揭示），Home 按段（`.radio-episode-banner`/`.meet-characters`/`.daily-challenge-banner`/`.trending-section`，`key=tracks.length`）、Library 按 `.track-card`、Characters 按 `.character-card`。**三个关键决策**：① 隐藏态只由 JS 加的 `.reveal-armed` 驱动，元素默认可见 → **fail-safe**（异步内容/未扫描到的节点不会卡在 opacity 0）；② Library 的 key 用 `tracks.length` 而非 `filtered.length`——每次按键重扫会把已显示的行重新 arm，搜索时会闪；③ 因为 `router.Link` **不透传任意 props**（只认 to/children/className/onClick/title/aria-label），卡片拿不到 `data-reveal`，故 hook 支持**可选 selector 参数**按 class 选中，CSS 规则也不挂 `[data-reveal]` 前缀（挂了会静默失效）。位移用独立 `translate` 属性而非 `transform`——否则 `.track-card:hover { transform: translate(-2px,-2px) }` 会被揭示动画顶掉；揭示后置 `none` 而非 `0 0`，避免 ~80 个元素长期背着一个 containing block / 层叠上下文。**封面交互层**：`.trend-cover` / `.track-card-cover-wrap` / `.track-hero-cover` / `.character-card-art` 加 halftone 网点 `::after`（静息 0.34 → hover 0.08）+ 图片 `scale(1.06)`，`.trend-bpm`/`.track-card-avatar` 提 `z-index: 2` 防被网点盖住。**Hero 漫画画框**：`.home-hero-play-meta` 改漫画字幕条（左侧 4px 强调线 + 横向渐隐），新增 `.home-hero-onair` 倾斜硬边"ON AIR · DEMO"标签（`skewX(-8deg)` + 内部 `skewX(8deg)` 反向校正 + `steps(1,end)` 闪烁方点），**仅在 `!live` 时渲染**——否则会压在下落的音符上。全部动效自带 `prefers-reduced-motion` 兜底（原有 3 处 guard 不会覆盖新动画）。**顺手修的 bug**：`.track-hero-cover` 原写 `box-shadow: var(--shadow-card), var(--shadow-glow)`，而 `--shadow-glow` 是关键字 `none`、`none` 不能出现在逗号列表里 → 整条声明非法，**大封面一直没阴影**；已改为 `box-shadow: var(--shadow-card)`。验证：`tsc` 干净 / `vitest 120` / `vite build` 绿（CSS gzip 9.58→~9.7 KB，首屏 JS gzip 103.9 KB）；dev server 冒烟 200（`useReveal.ts` 转译正常、产物 CSS 含新规则）。已核对全站 4 处 `position: fixed`（`.play-bg`/`.neon-layer`/`.mobile-tabbar`/`.home-intro-backdrop`）**均不在**被揭示的元素内，不会被 `translate` 生成的 containing block 破坏。 |
| P3 清理 | ✅ | 封面 img 加 `width/height`/`fetchpriority`（Track hero=`high`）；移除死导出 `Navigate`/`debounceOk`/`RECEPTOR_BOTTOM_RATIO`（WINDOWS_*/STREAK_* 经核查仍被内部使用，保留）。**未用 CSS 类已清理**：用 token 交叉检测 + 动态拼接复核，从 audit 估计的 ~19 收敛为 **11 个确认死类**（`advanced-toggle`/`cover-lg`/`encourage`/`field-row`/`filter-toggle`/`hero-cover-card`(+3 `:nth-child`)/`hero-cover-card-float`/`hp-bar`/`hp-fill`/`play-hud`(+`.label`)/`practice-btn`），删除 127 行；`grade-*`/`vibe-*`/`rank-*`/`pickers`（实为 `track-pickers`）因动态拼接/复合名**保留**。CSS 大括号平衡 455/455 校验通过。 |

**验收**：`tsc --noEmit` 干净；`vitest run` 120 passed（117 + 3 新增 P2-4）；`vite build` 成功（11 lazy chunk + 首屏 101 KB gzip，CSS 包降至 42.89 KB / 9.13 KB gzip）；`dist/_headers`、14 张角色 WebP、`catalog.json` 25 previews 均落地；死 CSS 删除后 `styles.css` 大括号平衡 455/455；`hitsounds.ts` 预渲染缓存 18 项，命中回放节点数 −96%（~49→~2）。

\* P2-10 / P3 的余量项是机械增量，核心结构 + 守门测试已就位。
