# BeatScape 自动性能保障与历史基线

本页汇总自 2026-09-06 起本地生产包的自动测量。专项真机验收已按 [BS-D001](BEATSCAPE-DECISIONS.md#bs-d001) 取消，不恢复为待办。自动测量的覆盖范围与发布签审分别记录。

> 当前技术候选 `1f925c9bc54c` 包含结果页海报预生成与单人/Duo 暂停时长修复。其完整 production 浏览器套件在桌面 Chrome + Pixel 7 模拟、单 worker 下 **683 passed / 33 个条件 skip / 0 failed**（716 项，39.6 分钟）；从 `apps/beatscape` 执行 `PLAYWRIGHT_CHANNEL=chrome pnpm exec playwright test --reporter=dot --output=test-results-current-fixed-full`，`.last-run.json` 为 `status: passed`、`failedTests: []`。上一分享产物 `26d7ed5f98a5` 的完整套件为 **678 passed / 33 skip / 1 failed**（712 项），唯一失败是手机模拟退出确认时把 120 秒等待计入 `durationMs`；隔离复测旧实现 5 次有 4 次复现，仅换 layout effect 后 10 次仍有 3 次失败。当前产物把暂停边界记在事件发生时，旧失败用例 **10/10**、相邻 Chromium **80 passed / 2 skip**、iPhone/WebKit 模拟 **21/21**，Results 分享/行动路径 Chromium **24/24**、WebKit **12/12**；Vitest **428/428**、常规/CF 构建与发布资产校验通过。同指纹固定性能矩阵现为 **26/26 条观察通过**，详见下方。自动结果也不代表真实手机、线上网络、人工耳检或最终发布签审；专项真机状态按 BS-D001 保持取消。

补充时长合同：当前产物新增 Duo 退出确认等待专项 Chromium 桌面/手机各重复 3 次、WebKit 模拟重复 3 次，**9/9**；单人纯暂停手机模拟重复 **5/5**；完整 `run-duration.spec.ts` Chromium 桌面/手机 **10/10**、WebKit 模拟 **5/5**。这些与上方相邻矩阵有重叠，不累加为独立覆盖数。

## 当前分享与暂停计时候选固定矩阵（2026-09-20，自动预算通过、本地未部署）

Artifact `1f925c9bc54cb5e7a4858612fd96848195fbd4dcff1ddba42ca46c36afa37644` 在无并发负载下完成压力曲 `bs-s4-14` 的 **26 条同指纹固定观察**：桌面与手机模拟各 9 次冷加载、3 场 120 秒 / 929 个 Hard 判定，以及 8 次重开、8 次切歌和加载中退出。独立 `performance-budget.mjs` 重新核对当前 `dist` 指纹、覆盖矩阵与预算，结果为 `overallPass: true`、`missing: []`、`issues: []`。

| 条件 | Home 最慢 | 单人冷开局最慢 | Duo 冷开局最慢 | 关特效 draw 峰值 | 最高特效 draw 峰值 | Duo 最高特效 draw 峰值 |
|---|---:|---:|---:|---:|---:|---:|
| 桌面 · 1280×900 / 1× CPU / 25 Mbps / 40 ms | 0.217 s | 1.692 s | 1.693 s | 0.8 ms | 0.9 ms | 1.0 ms |
| 手机模拟 · 412×915 / 4× CPU / 10 Mbps / 100 ms | 0.606 s | 3.806 s | 3.800 s | 2.8 ms | 2.8 ms | 2.5 ms |

六场完整 Hard 均约 60.00 FPS，最长帧间隔 16.8 ms，连续异常间隔为 0；Duo 两块场地均有完整采样。桌面 / 手机模拟最后四次切歌退出的 GC 后堆范围约 213 / 205 KiB，监听器均稳定为 1085；最终驻留 PCM 为 43.95 MiB，活动长音源为 0。手机模拟最慢冷开局距 4 秒预算仅约 194 ms，仍需关注弱网余量。Canvas draw 不测 GPU 完成与浏览器合成，合成触控不测物理触控或手感；这不是专项真机或发布签审通过。

原始测量：[results.json](../data/beatscape-performance/2026-09-20/share-clock-1f925-full/results.json) · [budget.json](../data/beatscape-performance/2026-09-20/share-clock-1f925-full/budget.json)。

## 上一 UI 候选固定矩阵（2026-09-20，自动预算通过、本地未部署）

Artifact `eaea6394d9c4ee28b1b8e8bb41c5cc056beb5b1d3a91d894f1a8698688cca993` 在无并发负载下完成默认压力曲 `bs-s4-14` 的 **26 条同指纹固定观察**：桌面与移动模拟各 9 次冷加载、3 场 120 秒 / 929 个 Hard 判定，以及 8 次重开、8 次切歌和加载中退出。独立 `performance-budget.mjs` 重新核对当前 `dist` 指纹、覆盖矩阵与预算，结果为 `overallPass: true`、`missing: []`、`issues: []`。

| 条件 | Home 最慢 | 单人冷开局最慢 | Duo 冷开局最慢 | 关特效 draw 峰值 | 最高特效 draw 峰值 | Duo 最高特效 draw 峰值 |
|---|---:|---:|---:|---:|---:|---:|
| 桌面 · 1280×900 / 1× CPU / 25 Mbps / 40 ms | 0.215 s | 1.685 s | 1.678 s | 0.5 ms | 2.0 ms | 1.7 ms |
| 移动模拟 · 412×915 / 4× CPU / 10 Mbps / 100 ms | 0.570 s | 3.792 s | 3.801 s | 2.0 ms | 2.8 ms | 2.7 ms |

六场完整 Hard 均约 60.00 FPS，最长帧间隔 16.8 ms，连续异常间隔为 0；两块 Duo 场地均有完整采样。桌面 / 移动模拟最后四次切歌退出的 GC 后堆范围约 260 / 221 KiB，监听器均稳定为 1085；最终驻留 PCM 为 43.95 MiB，活动长音源 / 待完成解码为 0 / 0。移动模拟最慢冷开局距 4 秒预算仅 199 ms，瓶颈余量仍小；Canvas draw 不测 GPU 完成与浏览器合成，合成触控不测物理触控或手感。该产物当时未执行完整 production 浏览器套件，也不替代人工验收或发布签审；更不能替代上方当前分享候选的同指纹性能测量。

原始测量：[results.json](../data/beatscape-performance/2026-09-20/ui-duo-eaea-full/results.json) · [budget.json](../data/beatscape-performance/2026-09-20/ui-duo-eaea-full/budget.json)。

## 上一功能候选固定矩阵（2026-09-20，自动预算通过、本地未部署）

Artifact `92e132b857496a93070ee70198579f29637bf8bd46f91b9985b297e22c65ae49` 在无并发负载下完成默认压力曲 `bs-s4-14` 的 26 条固定观察：桌面与移动模拟各 9 次冷加载、3 场 120 秒 / 929 个 Hard 判定，以及 8 次重开、8 次切歌和加载中退出。独立 `performance-budget.mjs` 当时核对该 `dist` 指纹、覆盖与预算，结果为 `overallPass: true`、`missing: []`、`issues: []`。

| 条件 | Home 最慢 | 单人冷开局最慢 | Duo 冷开局最慢 | 关特效 draw 峰值 | 最高特效 draw 峰值 | Duo 最高特效 draw 峰值 |
|---|---:|---:|---:|---:|---:|---:|
| 桌面 · 1280×900 / 1× CPU / 25 Mbps / 40 ms | 0.212 s | 1.669 s | 1.681 s | 0.8 ms | 1.1 ms | 0.8 ms |
| 移动模拟 · 412×915 / 4× CPU / 10 Mbps / 100 ms | 0.586 s | 3.790 s | 3.799 s | 2.5 ms | 2.6 ms | 2.6 ms |

六场完整 Hard 均约 60.00 FPS，最长帧间隔 16.8 ms，Canvas draw 峰值低于 5 ms。桌面 / 移动模拟最后四次切歌退出的 GC 后堆范围约 246 / 313 KiB，监听器均稳定为 1085；最终驻留 PCM 为 43.95 MiB，活动长音源 / 待完成解码为 0 / 0。手机模拟最慢直达冷开局距 4 秒预算仅约 201 ms；该实验不测玩家在剧情页阅读后点击 Play 的感知等待，也不测 GPU 完成、物理触控或真实设备。

原始测量：[results.json](../data/beatscape-performance/2026-09-20/first-shift-intent-92e132-full/results.json) · [budget.json](../data/beatscape-performance/2026-09-20/first-shift-intent-92e132-full/budget.json)。这是上一功能候选的历史记录，不替代上方当前 UI 候选的同指纹矩阵；当前 UI 候选仍未重跑完整 production 浏览器套件。

## 上一功能候选的首局预取专项（2026-09-20，本地未部署）

First Shift 页面在下一曲已确定且停留 500ms 后开始下载版本化音频，玩家点击 Play 时把同一个进行中请求交给现有解码缓存；提前离页会取消，`Save-Data` 下不预取。它把下载移入玩家阅读剧情的时间，但不缩小音频文件，也不改变音质、谱面或判定时钟。桌面与手机模拟的跨页单请求/进度接续和离页取消 **4/4 passed**；剧情入口与原有 Play/Duo 加载进度相邻回归 **20/20 passed**。BeatScape Vitest **60 文件 / 428 用例**、`pnpm build:beatscape` 与 CF 构建/发布资产校验均通过（105 首 / 315 谱 / 906 文件）。

补充点击延迟诊断在同一 `92e132…` 产物、412×915 / 4× CPU / 10 Mbps / 100 ms、禁用浏览器缓存与 Service Worker 的本地 Chrome 环境进行，各 3 次：进入 `/shift` 后停留 3 秒，预取组点击到可开局 **0.585–0.711 秒**，以 `Save-Data` 抑制预取的对照组 **1.569–1.574 秒**，差约 **0.86–0.99 秒**；下载的仍是同一份 1.47 MB 音频。**Home 的主 `Start first run` 直接进入 Play，不经过剧情页**；它的冷点击到可开局为 **1.602–1.692 秒**，音频在点击后约 0.136–0.225 秒开始请求。因此剧情预取收益不能外推给首访主入口，也不足以支持让所有首页访客自动下载整首歌。原始逐次观察与方法见 [首局入口延迟诊断](evidence/beatscape-entry-latency-2026-09-20.json)；这组 3 次对照不是上方固定 26 项预算，也不代表真实设备。

## 上一完整候选固定矩阵（2026-09-20，自动预算通过、本地未部署）

该 artifact `e660c4bb7903670d728f032ea739ea65dd907d9ad08260dd292cf7a797c1118e` 在无并发负载下完成默认压力曲 `bs-s4-14` 的 26 条固定观察：桌面与移动模拟各 9 次冷加载、3 场完整 Hard，以及 8 次重开、8 次切歌和加载中退出。`performance-budget.mjs` 核对当时的 `dist` 指纹、覆盖与预算，结果为 `overallPass: true`、`missing: []`、`issues: []`。压力谱为 120 秒 / 929 个 Hard 判定；Duo 两位玩家各完成 929 个判定。

| 条件 | Home 最慢 | 单人冷开局最慢 | Duo 冷开局最慢 | 关特效 draw 峰值 | 最高特效 draw 峰值 | Duo 最高特效 draw 峰值 |
|---|---:|---:|---:|---:|---:|---:|
| 桌面 · 1280×900 / 1× CPU / 25 Mbps / 40 ms | 0.213 s | 1.663 s | 1.657 s | 1.3 ms | 3.0 ms | 1.8 ms |
| 移动模拟 · 412×915 / 4× CPU / 10 Mbps / 100 ms | 0.564 s | 3.777 s | 3.779 s | 2.3 ms | 2.5 ms | 3.1 ms |

六场完整 Hard 均约 60.00 FPS，最长帧间隔 16.8 ms，无 `>25 ms` 异常间隔；Canvas draw 峰值均低于 5 ms。桌面 / 移动模拟最后四次切歌退出的 GC 后堆范围分别约 254 / 291 KiB，监听器均稳定为 1085；最终驻留 PCM 均为 43.95 MiB，活动长音源 / 待完成解码均为 0 / 0。Canvas draw 不包含 GPU 完成与浏览器合成；这些数字不外推到物理设备。

**启动余量与瓶颈**：移动模拟下冷开局最慢 3.779 秒，距 4 秒门槛仅约 221 ms。六次单人 / Duo 冷加载中，所选音频传输约 3.376–3.388 秒、3.93 MB；直达路由已由 HTML head 提前启动同一下载，且应用会接管该请求。因而当前余量主要受完整音频传输限制，不宜把较小的 JS/CSS 耗时误判为主因，也不能仅凭这组数据决定重编码音乐（音质和谱面时序仍需独立验证）。

原始测量：[results.json](../data/beatscape-performance/2026-09-20/current-artifact-full/results.json) · [budget.json](../data/beatscape-performance/2026-09-20/current-artifact-full/budget.json)。该产物没有重新执行全量 production 浏览器矩阵；它的定向浏览器验证与更早的全量结果应分别看待。

> 以下是旧 artifact 的历史基线，不能替代上方当前候选的证据。

## 上一完整候选固定矩阵（2026-09-16，自动预算通过、本地未部署）

该 artifact `3720099b6b260dc80f0cca3c9f195b0eafbe87bbe9fad35afd587efcb0e7a31b` 在无并发负载下完成默认压力曲 `bs-s4-14` 的 **26 条固定观察**，独立 `performance-budget.mjs` 核对当时的 `dist` 指纹、完整覆盖与所有预算后返回 `overallPass: true`、无缺失、无 issue。压力谱为 120 秒 / 929 个 Hard 判定；Duo 两位玩家各完成 929 个判定。

| 条件 | Home 最慢 | 单人冷开局最慢 | Duo 冷开局最慢 | 关特效 draw 峰值 | 最高特效 draw 峰值 | Duo 最高特效 draw 峰值 |
|---|---:|---:|---:|---:|---:|---:|
| 桌面 · 1280×900 / 1× CPU / 25 Mbps / 40 ms | 0.244 s | 1.678 s | 1.689 s | 1.5 ms | 1.7 ms | 2.0 ms |
| 移动模拟 · 412×915 / 4× CPU / 10 Mbps / 100 ms | 0.586 s | 3.791 s | 3.793 s | 1.9 ms | 1.9 ms | 2.6 ms |

六场完整 Hard 均约 **60.00 FPS**，`>25 ms` 异常间隔为 **0**，最大帧间隔为 **16.8 ms**；Canvas draw 峰值全部低于 5 ms，Duo 两块场地均有完整样本。桌面 / 移动模拟最后四次切歌退出的 GC 后堆范围分别约 **293 / 213 KiB**，监听器均稳定为 1083；最终驻留 PCM 均为 **43.95 MiB**，活动长音源 / 待完成解码均为 **0 / 0**。这些是自动化浏览器实验室结果，Canvas draw 不包含 GPU 完成与浏览器合成，也不外推到物理设备。

原始测量：[results.json](../data/beatscape-performance/2026-09-16T09-15-41.714Z/results.json) · [budget.json](../data/beatscape-performance/2026-09-16T09-15-41.714Z/budget.json)。同一 artifact 的完整 production 浏览器矩阵另为 **587 passed / 25 个按设备限定 skip / 0 failed**（612 项，35.4m）。

## 更早完整候选固定矩阵（2026-09-14，自动预算通过、本地未部署）

该 artifact `2dd2c62bc57d7fe99bf312f9b9fba17006152bc26cc9762d4c83bf51c2f46dcd` 在无并发负载下完成默认压力曲 `bs-s4-14` 的 **26 条固定观察**。压力谱为 120 秒 / 929 个 Hard 判定；Duo 两位玩家各覆盖 929 个判定。独立预算检查器核对当时的 `dist` 指纹、报告完成状态、固定 profile 与覆盖矩阵后整体通过。

| Profile | Home first visit（≤1.5s） | Song cold（≤4s） | Duo cold（≤4s） |
|---|---:|---:|---:|
| Desktop · 25 Mbps / 40ms / 1× CPU | 185.2–189.7 ms | 1667.5–1695.8 ms | 1659.9–1685.4 ms |
| Mobile emulated · 10 Mbps / 100ms / 4× CPU | 544.8–554.2 ms | 3769.1–3775.6 ms | 3769.6–3778.7 ms |

| Profile / 场景 | 平均 FPS | 最长帧 | 最长连续异常间隔 | Canvas 峰值 |
|---|---:|---:|---:|---:|
| Desktop / hard-fx-off | 60.002 | 16.8 ms | 0 | 1.8 ms |
| Desktop / hard-fx-max | 60.002 | 16.8 ms | 0 | 2.3 ms |
| Desktop / duo-fx-max | 60.002 | 16.8 ms | 0 | 1.8 ms |
| Mobile emulated / hard-fx-off | 60.002 | 16.8 ms | 0 | 1.7 ms |
| Mobile emulated / hard-fx-max | 60.002 | 16.8 ms | 0 | 2.0 ms |
| Mobile emulated / duo-fx-max | 60.002 | 16.8 ms | 0 | 2.4 ms |

| Profile | 末 4 次 post-GC heap 范围（≤1 MiB） | 监听器 | 最终 decoded PCM（≤64 MiB） |
|---|---:|---:|---:|
| Desktop | 310,192 B | 1050 → 1050 | 46,080,000 B |
| Mobile emulated | 275,772 B | 1050 → 1050 | 46,080,000 B |

原始证据：[完整结果](../data/beatscape-performance/2026-09-14/v1.9.110-current-all/results.json) · [预算结果](../data/beatscape-performance/2026-09-14/v1.9.110-current-all/budget.json)。这是固定本地 Chrome 条件下的自动证据，不外推为物理设备或人工质量门禁通过。

## Background dim 渲染专项（2026-09-14，上一渲染候选、本地未部署）

artifact `304eaba97747f9b7c23c7b50e376055ccd5a58131dc8a4e6791df7bda4e78296` 在默认 25% Background dim 下完成 4× CPU、412×915、DPR 2 的手机模拟最高特效压力曲 `bs-s4-14`。两场均实际覆盖 120 秒与 929 个真实判定对象；Duo 为两位玩家各 929 个。暗化新增的全屏 Canvas 填充未产生异常帧或超过 5ms 的 Canvas 提交。

| 场景 | 采样时长 | 平均 FPS | 最长帧 | 异常间隔 | Canvas 峰值 | 判定覆盖 |
|---|---:|---:|---:|---:|---:|---:|
| Mobile emulated / hard-fx-max | 119.462s | 60.002 | 16.8ms | 0 | 1.8ms | 929/929 |
| Mobile emulated / duo-fx-max | 119.679s | 60.002 | 16.8ms | 0 | 1.8ms | P1 929/929 · P2 929/929 |

原始证据：[Background dim mobile results](../data/beatscape-performance/2026-09-14/v1.9.100-background-dim-mobile/results.json)。这是渲染改动的两场定向观察，没有 load / memory / desktop 重复数，`performanceBudgetEvaluated: false`；因此不声明完整矩阵整体通过，也不外推到真实设备。

## 更早完整候选固定矩阵（2026-09-14，历史证据、本地未部署）

最近完成矩阵的 artifact `0ad273eeb0259f87d9dc6cc5ce3afbc8715ebd2aa8592b6197b35da46ea4028b` 已在无并发负载下完成默认压力曲 `bs-s4-14` 的 **26 条固定观察**：桌面与移动模拟各 9 次冷加载、3 场 120 秒 / 929 个真实判定的完整 Hard，以及 8 次真实重开、8 次 Duo 切歌与 3 次加载中退出。预算检查器重新核对该 `dist` 指纹、报告完成状态、固定 profile 与覆盖矩阵后得到 `overallPass: true`、`issues: []`。

| Profile | Home first visit（≤1.5s） | Song cold（≤4s） | Duo cold（≤4s） |
|---|---:|---:|---:|
| Desktop · 25 Mbps / 40ms / 1× CPU | 185.3–198.5 ms | 1683.1–1688.0 ms | 1676.0–1718.5 ms |
| Mobile emulated · 10 Mbps / 100ms / 4× CPU | 543.5–557.6 ms | 3755.0–3764.2 ms | 3762.2–3762.9 ms |

| Profile / 场景 | 平均 FPS | 最长帧 | 异常间隔 | Canvas 峰值 |
|---|---:|---:|---:|---:|
| Desktop / hard-fx-off | 60.002 | 16.8 ms | 0 | 1.6 ms |
| Desktop / hard-fx-max | 60.002 | 16.8 ms | 0 | 1.7 ms |
| Desktop / duo-fx-max | 60.002 | 16.8 ms | 0 | 1.9 ms |
| Mobile emulated / hard-fx-off | 60.002 | 16.8 ms | 0 | 1.9 ms |
| Mobile emulated / hard-fx-max | 60.002 | 16.8 ms | 0 | 1.9 ms |
| Mobile emulated / duo-fx-max | 60.002 | 16.8 ms | 0 | 2.2 ms |

首次全矩阵尝试在桌面 8/8 重开后停在返回 Library：产品已正确阻止已开始对局的合成 History 导航并打开退出确认，但旧测量器仍等待 Library 卡片。该报告保留为明确的 `status: incomplete` 历史失败，不能计入预算。测量器现改走真实 Exit → Leave，再在同一 JS realm 返回 Library；1×1 内存冒烟和完整 8×8 双 profile 循环随后通过。此修复只校正测量路径，不改变上述 artifact。原始证据：[完整结果](../data/beatscape-performance/2026-09-14/v1.9.98-current-all/results.json) · [预算结果](../data/beatscape-performance/2026-09-14/v1.9.98-current-all/budget.json) · [内存冒烟](../data/beatscape-performance/2026-09-14/v1.9.97-memory-smoke/results.json) · [保留的未完成首跑](../data/beatscape-performance/2026-09-14/v1.9.97-current-all/results.json)。

以上仍是固定本地 Chrome 实验室条件，不代表真实手机、全部浏览器、线上网络或 GPU 合成通过；BS-D001 状态保持取消，人工耳检、盲测与最终签审继续由上线准备文档管理。

## Home 对局代码按意图加载（2026-09-13，当前局部复测）

Home 待机原本虽只显示轻量预览，静态依赖仍把完整 `PlayField` 放进主包；同环境构建的主 JS 为 424.96 kB / 136.98 kB gzip。现三条入口共用一个异步对局模块：Home 只在 Play+Sound 后加载，Play / Duo 则在 chart 加载期并行预取。主 JS 降为 364.48 kB / 118.17 kB gzip（约 −14%），独立 `PlayField` 为 60.41 kB / 19.78 kB gzip。PWA 首装 JS 同时从 12 个降为初始入口 1 个，实际请求的 lazy chunk 继续进入版本化 shell cache。

当前 CF artifact `d6e53c091e80984e94e032e537e187c7d5a4b6b8885c1129d1ebf23052d56122` 运行 2 profile × 3 scenario × 3 repeat，共 18 条完整冷加载覆盖，逐行重新调用当前预算判定器均通过：

| Profile | Home first visit（预算 ≤1.5s） | Song cold（预算 ≤4s） | Duo cold（预算 ≤4s） |
|---|---:|---:|---:|
| Desktop · 25 Mbps / 40ms / 1× CPU | 184.6–187.1 ms | 1690.4–1691.8 ms | 1660.4–1674.7 ms |
| Mobile emulated · 10 Mbps / 100ms / 4× CPU | 675.7–751.7 ms | 3761.1–3768.2 ms | 3785.8–3827.6 ms |

原始证据：[home-playfield-lazy](../data/beatscape-performance/2026-09-13/home-playfield-lazy/results.json)。这次只重跑加载矩阵，不替代下方既有完整整局 / 内存矩阵，也不宣称专项真机通过；BS-D001 保持取消。

### 已否决：直达页提前 preload PlayField（2026-09-13）

在上述拆包后，曾实验由 `<head>` 内联启动器为合法 `/play` / `/duo` 直达路由提前插入 `modulepreload`。发布器与 desktop/mobile 浏览器合同均通过，但 19.78 kB gzip 对局 chunk 会与更关键的 256 kbps 完整音频争用移动弱网带宽：三轮中 mobile-emulated song-cold 最慢由 **3768.2 ms** 变为 **3796.6 ms**，duo-cold 由 **3827.6 ms** 变为 **3844.2 ms**。该实验已完整回退，当前候选不含该 preload；原始负结果保留于 [direct-gameplay-preload](../data/beatscape-performance/2026-09-13/direct-gameplay-preload/results.json)，避免后续把资源标签数量误当成真实启动收益。

## 第三轮：首页改版候选重测（2026-09-12，已完成，本地未部署）

> **2026-09-12 更新绑定**：`604cebd9…` 之后的改动（105 首 preview 音频接入、Safari catalog preload 双取修复、谱面同步门禁、H1 字距调整等）产生新产物指纹，28 项预算已在 `02c00319…` 上完整重跑，全部通过；下方第三轮正文描述的是 `604cebd9…` 那次测量，数字保留作历史记录。

**当前候选 `02c00319…`（含 preview 接入 + Safari 双取修复 + 谱面门禁，产物 SHA-256 `02c00319b3281829079532d7d1603179d3692af224cc0b1c1f2e805f09bf8347`）的同指纹 28 项固定条件自动性能预算全部通过，预算检查器 `overallPass: true`（含补充压力曲隔离复测共 30 行观察，`issues: []`）。** 证据目录：[assurance-rebind](../data/beatscape-performance/2026-09-12/assurance-rebind/)。

| 条件 | 结果 |
|---|---|
| 冷加载（18 次） | 桌面 song-cold / duo-cold 最慢 **1671.8 / 1668.4 ms**；移动模拟 home **676.1 ms**、song-cold **3939.1 ms**、duo-cold **3935.2 ms**（预算 ≤4000 ms） |
| 完整 Hard（8 场，含补充压力曲 bs-s6-11 / bs-p3-06） | 桌面 3 场 **60.00 FPS / 0 异常**；移动 hard-fx-off / hard-fx-max **60.00 / 0**，duo-fx-max 59.99 FPS / 连续异常 1（容差 ≤1 内通过） |
| 内存循环（2 组 × 12 次重开 / 切歌） | 预算内通过（`performance:check` 逐项判定） |

**补充压力曲 bs-s6-11（移动模拟 duo-fx-max）边缘记录**：本轮首测单局出现连续 5 异常间隔，**测量方法论错误所致**——该局与移动端 e2e（31 用例、多 Chrome 实例）并发执行，CPU 相互挤占（当时最长间隔 266 ms、canvasDraw 54 ms）。已在无任何并发负载下按 `--game-repeats 3` 隔离复测：3 局 FPS 59.99–60.00、连续异常间隔 **1 / 0 / 0**，全部计入最终检查并通过。原始失败数据如实保留在 [peak-second](../data/beatscape-performance/2026-09-12/assurance-rebind/peak-second/results.json)，隔离复测在 [peak-second-isolated](../data/beatscape-performance/2026-09-12/assurance-rebind/peak-second-isolated/results.json)。同曲在第二轮候选复测中也有 1 / 2 / 1 的波动，属同一边缘抖动，非代码回归。**测量前修复**：`performance.mjs` 的 `.overlay-tap button` 宽选择器被改版新增的 Sound check 按钮命中两元素（与 e2e 同款回归），已改为 `.overlay-tap .unlock-btn`。

604cebd9 那次测量（历史）：冷加载桌面 song-cold / duo-cold 最慢 1693.2 / 1693.2 ms，移动 home 623.5 ms、song-cold 3892.8 ms、duo-cold 3905.1 ms；bs-s6-11 首次单局复测连续 2 异常间隔后 3 局复测均为 0。

原始数据与检查输出：[final-all](../data/beatscape-performance/2026-09-12/assurance-rebind/final-all/results.json) · [peak-second-isolated](../data/beatscape-performance/2026-09-12/assurance-rebind/peak-second-isolated/results.json) · [peak-objects](../data/beatscape-performance/2026-09-12/assurance-rebind/peak-objects/results.json) · [budget.json（pass，绑定 02c00319）](../data/beatscape-performance/2026-09-12/assurance-rebind/budget.json)。自动化测量仅覆盖固定本地浏览器条件；人工耳检、盲测与签审门禁状态见 [上线准备](BEATSCAPE-RELEASE-READINESS.md)。

## 第二轮：性能保障（2026-09-06，已完成，本地未部署）

**当前候选的固定条件自动性能预算已全部通过。** 本轮重新采集完整基线，修复冷开局等待、双人最高特效与桌面键名的绘制开销，并增加独立预算检查器。以下阶段分别绑定产物指纹；中间版本通过的项目不能替代最终候选的同项证据。

### 阶段与已知结果

| 阶段 | 产物 SHA-256 | 已有证据与结论 |
|---|---|---|
| 本轮完整基线 | `f4015d14bd22eab0c94490e7bcbdc682b60a72360f6e6f7474d784c3934020bb` | 26 行：18 次冷加载、6 场完整 Hard、2 组内存循环。移动模拟单人 / 双人冷开局中位数 4.214 / 4.507 秒；双人最高特效平均 59.452 FPS，66 个异常间隔，最长连续 5 个。性能未达标。 |
| 提前下载与可见音符窗口 | `f4dbdde838ab3e80e9257db89636d92fb8f5ea339be72e323f0efc34301b2fe1` | 18 次冷加载各项通过；移动单人 / 双人中位数 3.888 / 3.842 秒，最慢分别 3.892 / 3.915 秒。移动双人最高特效复测 3 局，最长连续异常依次为 **1 / 2 / 1**；第 2 局失败保留，不能挑选其余两局宣称通过。 |
| 中间候选：里程碑文字缓存 | `198acfbcd3ddb4ec9dbb45f9bc1904706f77d40164187a45b760b84d4e59e900` | 18 次冷加载均通过，移动单人 / 双人最慢 3.895 / 3.898 秒；移动双人 3 局均约 60 FPS、0 异常间隔、绘制峰值最高 3.5 ms。单人四场复测中，移动两场峰值均 2.7 ms；桌面关特效 / 最高特效却分别出现 6.5 / 6.3 ms 绘制峰值，不能记整体通过。 |
| 当前候选：键名预绘缓存 | `ae15d3778b3fea374e4a30a28c690edf82a8f3f05d9e742ed54fb74f87e35c3e` | 新增桌面固定键名缓存，179 应用单测、6 项相关浏览器回归、构建与视觉检查通过。同指纹 28 项最终观测与预算检查全部通过；8 场整局均无异常间隔。 |

原始报告：[本轮基线](../data/beatscape-performance/2026-09-06/assurance/baseline/results.json) · [中间候选加载](../data/beatscape-performance/2026-09-06/assurance/after-load/results.json) · [中间候选三局双人](../data/beatscape-performance/2026-09-06/assurance/after-duo-mobile/results.json) · [里程碑候选三局双人](../data/beatscape-performance/2026-09-06/assurance/final-duo-mobile/results.json)。报告只有保存 `completedAt` 且 `status: measured` 后才是完成采集；完成采集也不等于预算通过。

### 本轮改动与诊断

1. 发布器把当前曲库的版本化音频映射注入 HTML head。有效单人 / 双人深链在应用模块启动前请求选定音频；缓存接管原 Promise 与取消控制器，保持一次下载、一次解码。首页和曲库不预取音频；版本不匹配、路由离开、失败和超时均清理。
2. 绘制只遍历当前接近窗口，保留尚未完成的 hold / slide；用不透明背景覆盖替代重复清屏。新增逐场地 `draw()` 计时，记录每次最大值、超预算样本和场地采样数。
3. 把八条里程碑文字预渲染成有界缓存，描边和填充分层，按原透明度分别混合；按 DPR / 基线 / 文本复用。字体完成加载时刷新，卸载时释放位图并阻止未完成的字体 Promise 恢复缓存。
4. 桌面四个实际键名各缓存闲置 / 按下两个字号，共八张单层图；保留键帽、颜色、位置和 flash 透明度。触屏不建缓存，IBM Plex Sans 完成加载或 DPR 更新后重新准备，卸载释放。

约 50 秒处出现的异常间隔经 48–56 秒 Trace 窗口定位到浏览器图层更新。文字缓存前后，该窗口内 `LayerTreeHost::DoUpdateLayers` 最大耗时 **26.353 → 14.798 ms**，异常 rAF 间隔 **8 → 0**。这是带 Trace 开销的局部诊断，**不计入正式预算矩阵，也不能证明整局或 GPU 完成时间通过**。[优化前诊断](../data/beatscape-performance/2026-09-06/assurance/diagnostic-old/summary.json) · [里程碑候选诊断](../data/beatscape-performance/2026-09-06/assurance/diagnostic-final/summary.json)

实际 Anton 字体已加载后，使用真实缓存 helper 比较 DPR 1 / 2、alphabetic / middle 基线、动画进度 0.1 / 0.5 / 0.9，共 12 种条件。缓存位图与直接文字绘制存在抗锯齿差异，**不是逐像素等同**。DPR 2 时八条文字的双层 RGBA 像素估算为每场地 **5.36 MiB**，不包含浏览器纹理管理开销；这部分不属于 64 MiB 音频缓存。[视觉比较与内存估算](../data/beatscape-performance/2026-09-06/assurance/sprite-visual-final/comparison.json)

键提示使用实际 IBM Plex Sans 比较箭头、字母与长标签，覆盖 DPR 1 / 2、闲置透明度 0.6 / 1、按下态，共 18 种条件。标签完整可读，位图采样存在抗锯齿差异；四箭头八张图在 DPR 2 的 RGBA 为 17,312 字节。缓存限制为每场地八张，不按键帽宽度裁剪长键名，因此不把该字节数当作任意自定义标签的统一上限。[键提示视觉与像素占用](../data/beatscape-performance/2026-09-06/assurance/key-hint-visual/comparison.json)

功能验证按阶段记录：当前候选代码通过 **179 项应用单测、6 项相关浏览器回归、11 项发布器回归和 50 项性能脚本回归**；中间候选 `f4dbdde8…` 已通过 **62 项完整生产浏览器回归**。后者不改记为当前产物的完整回归结果。音频内容、码率、播放时钟、难度、最高特效和 15/30/50 ms 判定窗均未调整。

桌面追加诊断使用与采样器相同的生产服务器，真实游玩至 31 秒。复现 8.2 ms 的 `draw()`，其中 `fillText("←")` 独占 6.5 ms，同一 rAF 的线程 CPU 为 6.813 ms，区间出现 `BeginRemoteFontLoad`。资源来自缓存，0.745 ms 已取完，不能将 6.5 ms 说成网络下载等待；也不能把此前 27.517 秒另一峰值自动归为同因。当前候选预绘固定键名并保留按下反馈；三场桌面完整复测峰值降至 2.3–2.8 ms。该诊断包含 Trace 与方法计时开销，仅用于定位，不作为验收通过样本。[桌面诊断](../data/beatscape-performance/2026-09-06/assurance/diagnostic-desktop-production/summary.json)

### 固定预算与证据范围

预算实现见 [performance-budget.mjs](../apps/beatscape/scripts/performance-budget.mjs)。条件沿用下方历史记录中的两种实验室配置：桌面 25 Mbps / 40 ms / 1× CPU，移动布局模拟 10 Mbps / 100 ms / 4× CPU。默认压力曲固定为 `bs-s4-14`，120 秒、929 个 Hard 判定。

| 检查项 | 通过条件 |
|---|---|
| 首页 | 每次按钮就绪、FCP、LCP 均 ≤1.5 秒。 |
| 冷开局 | 单人和双人每次可开局均 ≤4 秒。 |
| 帧间隔 | 平均 FPS ≥59.9、最大间隔 ≤50.1 ms、最长连续异常间隔 ≤1；异常指 >25 ms。59.9 / 50.1 是 60 Hz 实验测量容差，保留全部异常记录。 |
| 场地绘制 | 每次 `draw()` 最大耗时 ≤5 ms，实际超预算列表为空；每个场地的样本数与 rAF 间隔样本数相差不超过 3，双人两侧都必须有样本。该计时包含渲染函数 CPU / 墙钟耗时，不包含 GPU 完成与浏览器合成。 |
| 反复游玩后的资源 | 每种配置至少 8 次真实重开与 8 次双人切歌，加载中退出后无活动音乐源或待完成解码；所有 GC 后退出点的驻留解码 PCM ≤64 MiB。最后四次切歌退出堆范围 ≤1 MiB，监听器不增长；最终中断加载点的堆增长与监听器也对照尾部基线检查。 |
| 完整矩阵 | 两种配置各 3 次首页 / 单人 / 双人冷加载、3 类完整 Hard 场景，以及 1 组内存循环。补充曲目和局部诊断不能替代默认压力曲矩阵。 |

检查器核验当前 `dist` 的实际文件与指纹、报告完成状态、曲目时长 / 判定数和固定配置，重新计算覆盖；缺值、重复观察、漏掉声明的轮次、旧产物、运行错误或任意一行超预算均不能得到整体通过。

### 最终预算结果（`ae15d377…`）

**28 项全部通过，预算检查器退出 0。** 18 次冷加载、8 场真实完整 Hard（含两首补充压力曲）、两组各 12 次重开 / 12 次切歌 / 3 次加载中退出，均绑定当前实际产物。检查器核对实际文件哈希、曲目与完整矩阵后，逐项通过；未把之前失败的候选或诊断窗口计入通过样本。[可版本化证据摘要](evidence/beatscape-performance-assurance-2026-09-06.json) · [预算原始结果](../data/beatscape-performance/2026-09-06/assurance/budget.json)

下表加载数字均为每种配置三次冷加载的**最大值**，单位秒。

| 条件 | 首页按钮就绪 | 首页 FCP | 首页 LCP | 单人可开局 | 双人可开局 |
|---|---:|---:|---:|---:|---:|
| 桌面 | 0.187 | 0.200 | 0.464 | 1.686 | 1.682 |
| 移动模拟 | 0.639 | 0.568 | 0.664 | 3.895 | 3.908 |

| 条件 / 场景 | 曲目 | 平均 FPS | 异常间隔 | 绘制峰值 ms |
|---|---|---:|---:|---:|
| 桌面 / 单人关特效 | bs-s4-14 | 60.00 | 0 | 2.8 |
| 桌面 / 单人最高特效 | bs-s4-14 | 60.00 | 0 | 2.5 |
| 桌面 / 双人最高特效 | bs-s4-14 | 60.00 | 0 | 2.3 |
| 移动模拟 / 单人关特效 | bs-s4-14 | 60.00 | 0 | 2.3 |
| 移动模拟 / 单人最高特效 | bs-s4-14 | 60.00 | 0 | 3.0 |
| 移动模拟 / 双人最高特效 | bs-s4-14 | 60.00 | 0 | 3.3 |
| 移动模拟 / 双人最高特效 | bs-s6-11 | 60.00 | 0 | 3.5 |
| 移动模拟 / 双人最高特效 | bs-p3-06 | 60.00 | 0 | 3.3 |

`bs-s6-11` 覆盖曲库最高一秒判定密度（22 个判定），`bs-p3-06` 覆盖最大音符对象数（651）；均在移动模拟下跑完整双人最高特效。默认曲 `bs-s4-14` 覆盖最大游戏音频和最高平均 Hard 判定密度。运行覆盖为三首代表曲，不声称 105 首全部做过性能整局。

| 反复游玩条件 | 最后四次切歌退出堆范围 KiB | 最终监听器数 | 最终音频 PCM MiB | 活动音乐源 / 待解码 |
|---|---:|---:|---:|---:|
| 桌面 | 45.3 | 709 | 43.95 | 0 / 0 |
| 移动模拟 | 38.1 | 709 | 43.95 | 0 / 0 |

两组退出尾部的 JS 堆波动均低于 1 MiB。43.95 MiB PCM 是 64 MiB 有界缓存中的预期保留；该限制不代表浏览器总内存。12 次循环没有观测到监听器或音频持续累积，不证明无限长会话无泄漏。上述通过仅覆盖固定本地浏览器条件，不代表线上 CDN、所有设备或 GPU 完成延迟已获验证。

### 里程碑候选复测（`198acfb…`，未通过）

| 项目 | 当前状态 | 最终结论 |
|---|---|---|
| 18 次冷加载 | 两种配置均完成，移动最慢 3.898 秒 | 此候选通过 |
| 两种配置的完整 Hard 矩阵 | 移动双人 3 局与移动单人两种特效通过；桌面单人超出 5 ms，桌面双人未复测 | **未通过** |
| 两组反复游玩与内存 | 未采集，候选已被后续版本替换 | 不计为通过 |
| 该阶段预算汇总 | 桌面绘制超标，矩阵不完整 | **未通过** |

新候选的 [基础完整报告](../data/beatscape-performance/2026-09-06/assurance/release-all/results.json) 与两首补充曲报告均已完成。上表保留失败阶段，未并入新产物的通过记录。专项真机验收继续按 BS-D001 取消，现有发布门禁及人工签审规则不变。

### 本轮复现命令

从仓库根进入应用目录。先构建一次，随后所有报告均测量同一份 `dist`；示例使用新的 `repro-` 目录，避免覆盖上面的阶段证据。

```bash
cd apps/beatscape
npm run build:cf
PLAYWRIGHT_CHANNEL=chrome npm run performance:measure -- --suite all --profile all --track bs-s4-14 --repeats 3 --cycles 12 --output ../../data/beatscape-performance/2026-09-06/assurance/repro-final-all
PLAYWRIGHT_CHANNEL=chrome npm run performance:measure -- --suite game --profile mobile-emulated --track bs-s6-11 --scenarios duo-fx-max --output ../../data/beatscape-performance/2026-09-06/assurance/repro-peak-second
PLAYWRIGHT_CHANNEL=chrome npm run performance:measure -- --suite game --profile mobile-emulated --track bs-p3-06 --scenarios duo-fx-max --output ../../data/beatscape-performance/2026-09-06/assurance/repro-peak-objects
npm run performance:check -- --output ../../data/beatscape-performance/2026-09-06/assurance/repro-budget.json ../../data/beatscape-performance/2026-09-06/assurance/repro-final-all/results.json ../../data/beatscape-performance/2026-09-06/assurance/repro-peak-second/results.json ../../data/beatscape-performance/2026-09-06/assurance/repro-peak-objects/results.json
npm run test:performance
```

`performance:check` 的退出码为：0 全部通过；1 证据不完整或预算未通过；2 输入读取 / 当前产物校验等执行错误。它只检查，不构建或发布。局部诊断 JSON 不作为其输入。

## 第一轮：自动基线与首次优化（历史记录）

以下保留首次优化时的原始结论和数据，产物为 `fa4bca51…` → `bd6f4017…`，不代表上方第二轮当前候选的状态。

**自动基线、瓶颈修复和同条件复测已完成；性能尚不能记为全面达标。** 已改善首页加载、重复解码和资源取消，并修复 R 重开失效；剩余的实测限制是移动模拟冷开局超过 4 秒，以及双人最高特效出现连续两个异常帧间隔。完整结果的可版本化摘要见 [证据 JSON](evidence/beatscape-performance-2026-09-06.json)，包含 6 份原始数据的路径 / SHA-256、两版产物指纹、设备 / 浏览器 / 网络条件及逐项指标。

### 加载结果

基线产物为 `fa4bca512a3893919ca619fd6e9e1aa632229203995c3719b16e07c388e5668c`，优化候选为 `bd6f4017a63e6c1e598f347fec4bd483944f0c9d2fc99fcbdf434d9126acf9a0`。下表为每种条件 3 次冷加载的中位数；括号是优化后的最小—最大值，单位秒。

| 条件 / 指标 | 基线 | 优化后 |
|---|---:|---:|
| 桌面首页演示按钮 DOM 就绪 | 0.274 | 0.183（0.180–0.183） |
| 桌面首页 LCP | 0.276 | 0.236 |
| 桌面单人可开局 | 1.838 | 1.770（1.770–1.894） |
| 桌面双人可开局 | 2.155 | 2.042（2.037–2.045） |
| 移动模拟首页演示按钮 DOM 就绪 | 0.790 | 0.596（0.586–0.604） |
| 移动模拟首页 LCP | 0.784 | 0.616 |
| 移动模拟单人可开局 | 4.390 | 4.185（4.182–4.191） |
| 移动模拟双人可开局 | 4.647 | 4.462（4.455–4.466） |

首页首访弹窗保留，按钮 DOM 就绪不等于弹窗已关闭；首屏显示以 FCP / LCP 记录为准。双人每次解码由 2 次降为 1 次，持有的该曲 PCM 从 **87.89 MiB 降为 43.95 MiB**。桌面累计解码耗时中位数 501.5 → 236.8 ms，移动模拟为 557.0 → 257.7 ms。

**加载预算结论**：本轮首页低于 PRD 的 1.5 秒预算，桌面单 / 双人低于 4 秒；10 Mbps、100 ms 延迟、4× CPU 的移动模拟冷开局仍超过 4 秒，不能记为全面达标。该曲编码资源约 3.93 MB，模拟网络下音频请求约占 3.3 秒；优化后的瓶颈仍主要在完整音频传输及应用启动等待。三次样本适合复现本地基线，不是线上用户分位数统计。

加载原始证据：[基线](../data/beatscape-performance/2026-09-06/baseline-load-final/results.json) · [优化后](../data/beatscape-performance/2026-09-06/after-load-final/results.json)。开发测量器时的旧轮询计时以及中间候选实验不用于此表。

### 整局帧表现

每个场景都是一场完整 Hard。表中“异常间隔”指 >25 ms 的 rAF 间隔，“连续”指连续异常间隔的最大个数；它与单个长间隔内估算丢掉几帧分别统计，不能混为一谈。所有优化后场景均完成每位玩家 929 个判定，最高特效场景持续约 107 秒，Duo 两侧同时最高档超过 107 秒。

| 条件 / 场景 | 平均 FPS，前 → 后 | 异常间隔数，前 → 后 | 最大间隔 ms，前 → 后 | 优化后连续 | 应用 rAF CPU p95 ms，前 → 后 |
|---|---:|---:|---:|---:|---:|
| 桌面 / 单人关特效 | 59.98 → 59.99 | 2 → 2 | 50.0 → 33.4 | 1 | 0.7 → 1.0 |
| 桌面 / 单人最高特效 | 59.99 → 59.99 | 2 → 2 | 33.3 → 33.4 | 1 | 1.0 → 1.2 |
| 桌面 / 双人最高特效 | 59.85 → 59.98 | 5 → 3 | 166.7 → 33.4 | 1 | 1.1 → 1.4 |
| 移动模拟 / 单人关特效 | 60.00 → 60.00 | 0 → 0 | 16.8 → 16.8 | 0 | 1.6 → 1.4 |
| 移动模拟 / 单人最高特效 | 59.91 → 60.00 | 2 → 0 | 116.7 → 16.8 | 0 | 2.0 → 1.9 |
| 移动模拟 / 双人最高特效 | 59.82 → 59.91 | 22 → 11 | 33.4 → 33.4 | **2** | 3.6 → 3.4 |

所有场景优化后的帧间隔 p95 / p99 约 16.7–16.8 ms，未观测到 ≥50 ms 的主线程 Long Task。各场景只有一场对比，峰值和少量掉帧存在波动，不能把所有差值归因为本次代码改动。

**帧预算结论**：桌面及移动单人本轮接近 60 FPS，移动双人出现一段连续异常间隔，不能记“无连续掉帧”通过。每帧应用 rAF CPU p95 为 1.0–3.4 ms，p99 为 1.1–3.9 ms；完整观测中的 CPU 最大值桌面约 40 ms、移动双人 8.2 ms。该统计包含游戏逻辑、HUD 和收尾回调，并未单独测出纯谱面绘制 / GPU 完成延迟，因此不把 p95<5 ms 当作 PRD“渲染延迟始终≤5 ms”的证明。

整局原始证据：[基线](../data/beatscape-performance/2026-09-06/baseline-game/results.json) · [优化后](../data/beatscape-performance/2026-09-06/after-game/results.json)。旧 Duo 结果只有拼接文本，优化后同时保存 P1/P2 各自的结构化判定数，避免把最大 Combo 与 Perfect 数连读。

### 重开、切歌与内存

两种条件各在同一 SPA 内完成 8 次 R 重开、8 首不同歌曲的 Duo 启动 / 退出，以及 3 次加载中退出；每组 20 个 GC 后采样点。优化后的两组均通过实际音源计数和退出资源检查。

| 指标 | 基线 | 优化后桌面 | 优化后移动模拟 |
|---|---|---:|---:|
| R 重开后的累计音源启动次数 | 8 次操作后仍为 1，**覆盖无效** | 依次 2–9 | 依次 2–9 |
| 重开阶段 JS 堆 MiB | 因未真正重开，不作重开对比 | 3.55–3.64 | 3.56–3.67 |
| 最后四次切歌退出后的 JS 堆 MiB | 桌面 4.48–4.54；移动 4.50–4.56 | 4.50–4.56 | 4.52–4.57 |
| 退出后的活动音乐源 / 待完成解码 | 0 / 0 | 0 / 0 | 0 / 0 |
| 切歌退出后的监听器数 | 各轮 709 | 各轮 709 | 各轮 709 |
| 最终驻留的解码 PCM | 0 MiB | 43.95 MiB / 1 个缓冲 | 43.95 MiB / 1 个缓冲 |
| 音频累计解码次数（含中断尝试） | 桌面 20；移动 17 | 9 | 9 |

优化后驻留的一首歌是 **64 MiB 上限缓存中的预期保留**，便于重新进入时复用；缓存预算不等于整个浏览器或播放中全部原生内存的硬上限。Duo 两个音乐源共享同一个缓冲，退出后停止音源；三个尚未完成的音频请求均记录 `net::ERR_ABORTED`，没有运行时异常。

JS 堆从初始曲库约 3.2 MiB 到最终约 4.58 MiB 有增长，后四次切歌的范围只有约 0.06 MiB，监听器和 PCM 没有逐轮累加。本轮没有观测到持续放大的音频 / 监听器占用；8 次循环不能证明任意长会话都没有泄漏。旧基线的 R 缺陷、真实切歌观察和修复后的有效重开证据分别保留，没有将旧按键循环改写为通过。

内存原始证据：[基线](../data/beatscape-performance/2026-09-06/baseline-memory/results.json) · [优化后](../data/beatscape-performance/2026-09-06/after-memory/results.json)。本页 [证据摘要](evidence/beatscape-performance-2026-09-06.json) 已包含全部采样点；本地原始 JSON 和结算截图保留在 `data/beatscape-performance/2026-09-06/`，该目录不加入版本控制。

### 测量条件

宿主机为 Apple M5 Pro、18 个逻辑核心、48 GiB 内存、arm64，macOS 26.6.2；浏览器为隔离的无头 Google Chrome 152.0.7977.76。Node 为 26.7.0。每组测量保存生产包 SHA-256、源码 commit / dirty 状态、测量脚本指纹、浏览器版本及条件。

| 条件 | 桌面 | 移动布局模拟 |
|---|---|---|
| 视口 / DPR | 1280 × 900 / 1 | 412 × 915 / 2 |
| CPU 降速 | 1× | 4× |
| 下载 / 上传 | 25 / 5 Mbps | 10 / 2 Mbps |
| 延迟 | 40 ms | 100 ms |
| 布局 / 触控 | 桌面 / 无 | 移动 / 有 |

页面来自 localhost 的生产静态包，文本使用 Brotli、ETag 和产物 `_headers` 中的缓存规则。计时前预压缩服务端文本，各次加载仍使用全新的浏览器 context；不把首次压缩耗时计入首页。网络与 CPU 通过 CDP 模拟；Google Fonts 仍经过实际外网。各浏览器测量串行运行，没有并行跑另一套性能测试。

移动布局模拟不等同于一台具体 Android 或 iPhone；宿主 GPU、操作系统调度、网络协议和 CDN 均有边界。本页不宣称所有设备性能达标。

### 场景与口径

- **加载**：每种条件各 3 次冷首页、冷单人和冷双人。首页记录 FCP、LCP 和演示按钮出现时刻；首访引导保留。可开局时间从导航开始，直到真实全曲音频下载、解码、谱面加载完成且开始按钮可见，以 MutationObserver 标记时刻，避免自动化等待轮询的延迟。它不是下载完整 402.7 MiB 曲库的时间。
- **整局**：按当前曲库 Hard 判定数 / 时长选择最密的 `bs-s4-14`（Chrome Mile Anthem），120 秒、929 判定、平均 7.74 判定/秒。每种条件运行关特效、最高特效、双人最高特效三局。Casual 保证场景可跑完，但输入沿真实 AudioContext 时钟触发实际键盘事件，经历完整判定；不使用开发后门、不跳过音频、不改时钟或加速歌曲。最高特效须由真实命中达到，并保存持续时间。
- **帧耗时**：记录原生 rAF 帧间隔的 p95 / p99 / 最大值、平均 FPS，以及间隔 >25 ms 的数量、估算丢帧和最长连续异常间隔。另记每帧全部应用 rAF 回调 CPU 时间之和；这包含双人两个场地和 HUD，排除测量脚本与自动输入驱动，但不包含浏览器绘制 / GPU 完成时间。
- **内存**：同一 SPA 和 JS 运行环境内，先预热，再连续 8 次 R 重开、8 首不同歌曲进入双人并退出、3 次加载中退出。各检查点清空探针采样数组并强制两次 GC，记录 JS heap、DOM / 监听器、活动长音源与解码 AudioBuffer 的弱引用字节估算。未用刷新页面来“清理”内存。估算不包含 GPU 或全部浏览器原生内存。

场景覆盖校验与性能预算分开：完成采集不表示预算通过；缺少完整判定、对局时长、最高特效或运行异常会令证据无效。

### 已实施的优化

1. HTML 提前加载小型目录文件；应用复用该请求，同时到达的调用共享进行中的 Promise，失败后允许重试；首页不再发两次目录请求。
2. 首页程序化预览不等待用不到的谱面；点击 Play + Sound 后才加载真实谱面和音频。
3. 单人 / 双人选定曲目后，让该曲音频与谱面并行加载，缩短串行等待。
4. 按完整资源 URL（含发布内容指纹）和采样率共享音频 fetch / decode。双人复用同一个 AudioBuffer，各自保留独立音源和音量节点。
5. 解码缓存按 PCM 字节限制为 64 MiB，采用 LRU；超预算的单曲不驻留。取消最后一个等待者后中止下载，已开始解码的迟到结果丢弃；Conductor 销毁或重入后不再写回旧缓冲。移除压缩音频的额外复制。
6. 实测发现 R 重开被键盘监听器捕获的初始 `loading=true` 拦住。改为读取当前 Conductor 是否已有音频，并验证每次按键确实启动新音源；旧基线的按键循环不能当作有效重开覆盖。

未调整音源内容、编码质量、播放时钟、难度或 15/30/50 ms 判定窗。

### 复现

本候选 `bd6f4017a63e6c1e598f347fec4bd483944f0c9d2fc99fcbdf434d9126acf9a0` 已通过 156 应用单测、6 发布器回归、24 性能探针 / 覆盖检查回归及 32 项生产浏览器回归，类型检查、构建和全资产核验通过。新增浏览器回归确认首页没有提前请求谱面 / 音频、一次点击可播放真实音频，以及 R 连续三次确实启动新的音乐源。功能测试包含实际完整歌曲；最终性能整局采样另行保存。

从仓库根运行，先构建一次，再分别采集，以便保存阶段证据：

```bash
pnpm --filter @musicsaas/beatscape build:cf
PLAYWRIGHT_CHANNEL=chrome pnpm --filter @musicsaas/beatscape performance:measure --suite load --profile all --repeats 3
PLAYWRIGHT_CHANNEL=chrome pnpm --filter @musicsaas/beatscape performance:measure --suite game --profile all
PLAYWRIGHT_CHANNEL=chrome pnpm --filter @musicsaas/beatscape performance:measure --suite memory --profile all --cycles 8
pnpm --filter @musicsaas/beatscape test:performance
```

可用 `--output` 指定证据目录、`--track` 指定曲目；`--profile desktop` 或 `mobile-emulated` 单独运行一种条件。也可在 `apps/beatscape` 内用对应 `npm run` 命令（参数前加 `--`）。测量脚本只读取现有 `dist`，不会重建或发布。对比期间须保留基线产物，完成所有基线场景后再构建候选包。
