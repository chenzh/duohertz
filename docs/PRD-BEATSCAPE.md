# BeatScape 节拍幻境｜英语市场音乐游戏站

> **2026-09-23 产品转型**：本文件是 BeatScape v1.9 的历史产品总纲，不再定义新产品的品牌、玩法、角色或曲库。将现有游戏改造成 **duohertz（真我赫兹）** 的目标要求，以 [应用 PRD 顶部 v2.0 目标版](../apps/beatscape/PRD.md) 为准；该目标尚未实现。下文“终版、可直接投产”仅代表当时的 BeatScape 版本，不可用来判定 duohertz 已可发布。

> **2026-09-06 执行决策**：专项真机验收已由用户取消，不得依据本文历史验收条款自动恢复 TODO。该决定不声明真机通过、不自动修改发布门禁，详见 [BS-D001](BEATSCAPE-DECISIONS.md#bs-d001)。

**正式产品 PRD（AI 原生 · Vibe Coding · 海外出海版）**

| 字段 | 内容 |
|------|------|
| 文档类型 | 产品需求文档（PRD） |
| 产品名称 | **BeatScape**（节拍幻境） |
| 文档版本 | **v1.9.221（as-built 对齐修正 · 以 `apps/beatscape` 代码为唯一事实）** |
| 日期 | 2026-09-19 |
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
| **v1.9.3** | 2026-08-30 | **as-built 对齐修正**：以 `apps/beatscape/` 代码为唯一事实，校正运行时真值（默认键位 / Play Now / 首访引导 / AR 公式 / Hold 尾窗 / 海报 / 榜单 / 存档 / IA / 曲库默认值等 18 项），未实现项显式标注〔规划〕；实现级细节唯一入口 = `apps/beatscape/PRD.md` |
| **v1.9.4** | 2026-08-30 | **叙事层 as-built**：新增 §6.7 电台叙事系统（The Late Static Year 1 三季 24 集）；§1.3a 叙事真相源指向 World Bible |
| **v1.9.5** | 2026-09-13 | **首访到首局入口收口**：移除已废弃的 Home intro / Glass Horizon warm-up / Strike Vector Play Now 描述；Home 主 CTA、固定 Play 导航与可玩 demo 统一跟随当前 First Shift 下一局，三首完成后进入精选下一曲。 |
| **v1.9.6** | 2026-09-13 | **首局结果留存收口**：First Shift 结算先展示 Grade 与三项核心成绩，再显示简短连接结果和下一首主 CTA；完整成员回信与线路图默认折叠，避免剧情挡住续玩。 |
| **v1.9.7** | 2026-09-13 | **打歌判定区去歧义**：四档累计判定只在 Results 展示；运行中保留瞬时判定、四色轨道线、Score / Accuracy / Progress / Combo / SIGNAL，避免把四种全局成绩误画成四条轨道标签。 |
| **v1.9.8** | 2026-09-13 | **Arcade HP 顶栏收口**：移除横跨场地并与 Score / SIGNAL / Pause 同层重叠的无标签 Canvas HP 条；HP 标签、余量与精确值统一进入左上表现卡，低血变红，Casual 不显示，单人 / Duo 与竖屏 / 短横屏共用同一真值。 |
| **v1.9.9** | 2026-09-13 | **Arcade 失败可理解性**：HP 归零后立即停谱、冻结输入，并在场内保留 300ms `SIGNAL LOST / HP DEPLETED` 失败帧；Results 显示 `ARCADE FAILED` 和不计 PB / Local Board 的明确说明。Duo 已失败半场保持失败卡，另一半场可继续。 |
| **v1.9.10** | 2026-09-13 | **Duo Arcade 胜负与结算语义**：一方通关、一方 HP 归零时，通关方无条件获胜；双方状态相同再比分，同分为 `DEAD HEAT`。结算逐人标记 `CLEARED` / `HP DEPLETED`，准确率按既有 0–100 数值直接显示，并为分数与 P/G/G/M 判定数补齐标签。 |
| **v1.9.11** | 2026-09-13 | **Duo 结果键盘闭环**：结果层声明为真正 modal，出现后焦点进入 Rematch，Tab / Shift+Tab 只在 Rematch 与 Exit 间循环，Escape 退出；Rematch 后待双场重新就绪，再把焦点交还唯一 Start。 |
| **v1.9.12** | 2026-09-13 | **移动 Track 上下文主动作**：曲目页不再显示会跳去另一首歌的全局 Play tab；固定底栏由当前曲目拥有，实时显示曲名、难度和模式并直达对应对局。页内重复 Play 在移动端隐藏，桌面结构不变，页尾内容可完整滚到固定栏上方。 |
| **v1.9.13** | 2026-09-13 | **320px Home 首局上下文无遮挡**：最窄支持宽度下，首局主 CTA 及其曲名、时长、First Shift 进度必须完整位于固定导航上方；次级 Browse / Calibrate 可继续向下滚动。 |
| **v1.9.14** | 2026-09-13 | **欧美社交 4:5 成绩卡 + 首局续玩安全区**：文件 Share Sheet 与下载使用 1080×1350 竖版成绩卡，桌面图片剪贴板保留 1200×630 横版；First Shift 下一首 CTA 在首屏/固定导航上方至少保留 8px。 |
| **v1.9.15** | 2026-09-13 | **无后端异步成绩挑战**：完整对局分享链接携带同曲、难度、模式及 score / accuracy / grade 目标；接收者开局前看到目标，结算紧接核心成绩显示 cleared / tied / missed 与分差。参数只作好友挑战上下文，不写榜、不作为可信竞技成绩；分段 Practice 不携带目标。 |
| **v1.9.16** | 2026-09-13 | **挑战复赛闭环 + 正式根路径收口**：精确重试保留原 challenge，桌面在挑战卡内提供 Retry、手机固定中间动作切为 `↻ Retry`；换模式/难度或进入分段练习主动离开不可比目标。Cloudflare 根构建的新链接统一为 `/play`、`/library` 等根路径，并兼容旧候选曾发出的 `/beatscape/*` 深链。 |
| **v1.9.17** | 2026-09-13 | **旧深链 canonical 收口**：Cloudflare 根构建打开兼容的 `/beatscape/*` 旧深链时，页面 canonical 与 `og:url` 统一声明对应根路径，避免同一曲目形成两套搜索/分享 URL；本地 `/beatscape/` 开发 base 不变。 |
| **v1.9.18** | 2026-09-13 | **105 首曲库发现层级收口**：Search / Genre 提到通用推荐之前；搜索覆盖 title / artist / district / genre / BPM / vibe / tags，支持 Escape 与 Clear filters。筛选激活后隐藏通用推荐和 Showcase，让 Matches 直接接管页面；手机将低频筛选折叠为 44px `More filters`，桌面完整展开，320×568 下首个匹配结果须露在固定导航上方。 |
| **v1.9.19** | 2026-09-13 | **NIGHTSHIFT 手机人物 roster**：桌面保留三人并列比较；≤680px 通过 JUNO / ATLAS / TORQUE 三个 ≥44px 选择器一次只展示一张完整人物故事，避免三篇长传记纵向堆叠。切换保持焦点与 `aria-pressed` 状态，320↔800 断点往返不丢当前选择，并修复隐藏卡受滚动揭示影响后仍为透明的冲突。 |
| **v1.9.20** | 2026-09-13 | **The Late Static 手机节目折叠与深链揭示**：桌面继续展示当前季全部已播转录；≤680px 默认只展开当前节目，已播节目以 ≥44px 可访问按钮单选展开，避免周播内容持续拉长页面。`#ep-N` 直接打开对应已播节目或未来季度预告，选择已播节目同步可分享 hash。 |
| **v1.9.21** | 2026-09-13 | **The Late Static 频道调频真状态**：收音机频道按钮现在真正改变频率、刻度指针、选择高亮、信号强度与展开季度，并以 `aria-pressed` 暴露状态；当前直播季度用独立 Live 标记保留，调到未来季不会误标 on air，节目深链同步调到所属频道。 |
| **v1.9.22** | 2026-09-13 | **Local Board 扫描与下一局闭环**：移除面向玩家的内部 Stage 文案；All-time / Daily 升级为支持方向键、Home/End 和完整 ARIA 状态的 tabs。榜单用语义 list 暴露完整名次，PTS/ACC 明确标注并在 320px 同行；空榜直接进入 Arcade 曲库或当天挑战；损坏本地榜单行在渲染前过滤。 |
| **v1.9.23** | 2026-09-13 | **Daily Challenge 身份与留存闭环**：Daily URL 固定 UTC 日期，只有当天确定性曲目 + Standard Arcade 可获得 Daily 身份并写榜，伪造 `daily=1` 静默降级。Home 显示今日最佳/clear 次数与 Improve，Results 显示 Daily 完成反馈并精确复赛；手机固定中间动作保持 Daily，榜单支持 `?view=daily` 深链并过滤旧伪造曲目。历史 cap 改为保留最近挑战，避免旧高分永久挤掉今日完成态。 |
| **v1.9.24** | 2026-09-13 | **Track 难度 / 模式选择语义闭环**：Difficulty 与 Mode 从六个独立 pressed 按钮升级为两个真正的互斥 radio group；每组只保留一个 Tab 停靠点，方向键循环选择，Home / End 跳到首尾，焦点、Run setup 与桌面/手机 Play 参数同步。视觉与 ≥44px 触控尺寸保持不变。 |
| **v1.9.25** | 2026-09-13 | **Night streak 留存闭环**：生涯统计拆分“可在今天续上的 active streak”与历史 best streak；按玩家本地日历记录，区分今天已计入、今天仍可续和已中断。Home Daily 在主动作前显示对应提示，Profile 提供当前状态、明确续玩动作并把原含混的 `Night streak` 统计改名为 `Best streak`。 |
| **v1.9.26** | 2026-09-13 | **Results streak 即时奖励**：当天第一局写入一次性 session 更新，Results 在核心成绩之后立即确认 `Night N secured`，新纪录标记 `New best` 并可直达 Profile；同日重复局和刷新不重复庆祝。失败局可保住日活，分段 Practice 继续不计。 |
| **v1.9.27** | 2026-09-13 | **Library 收藏与回访闭环**：105 首卡片提供独立 ≥44px 收藏动作，和曲目链接保持合法兄弟结构；Favorites 成为搜索区常驻一级筛选并显示本机数量，刷新及 Track 页状态一致。手机将 Favorites / More filters 并排，筛选后首张卡及收藏动作完整位于固定导航上方；空收藏可一键返回全部曲目。 |
| **v1.9.28** | 2026-09-13 | **Library 最近一局重开闭环**：有完整本机历史时，在筛选区与通用推荐之间显示最新且仍在当前曲库中的对局；明确曲目、ACC、难度、模式和完成/失败状态，可按原曲/难度/模式直接 Play again / Retry，或进入 Change setup。筛选激活后隐藏该区，优先展示 Matches；手机双动作均 ≥44px 且不横向溢出。非法完成时间和已下架曲目不进入回访入口。 |
| **v1.9.29** | 2026-09-13 | **Track 赛前个人最佳目标闭环**：Run setup 随所选 tier/mode 显示当前 Arcade PB 的 PTS/ACC；没有成绩时明确首个目标，Casual/Practice 明确不计排名。≤640px 固定 Play 条在有纪录时同步显示紧凑 PB。`bs_scores` 在进入 UI 前过滤非法曲目、档位、模式、分数、准确率和时间；同分以更高 Accuracy 更新。 |
| **v1.9.30** | 2026-09-13 | **Home 回流玩家续玩闭环**：First Shift 完成后，若当前曲库存在本机最近完整局，Home 主 CTA、可玩 demo 与移动固定 Play 同时恢复该曲及原 tier/mode；成功局显示 Play again，失败局显示 Retry last run，并在 CTA 下给出曲目、配置和 ACC。未完成 First Shift 不被历史覆盖；无有效历史或曲目已下架时继续回退人工精选。 |
| **v1.9.31** | 2026-09-13 | **Play 实时追分目标 + 320px 顶栏**：普通完整 Arcade 在赛前显示当前本机 PB，开局后于 Score 卡持续显示诚实的原始分差 `PB −924K / TIED / +1.2K`；有效好友挑战优先显示 `GOAL` 分差，Daily 使用自身目标，不叠加 PB，Casual/Practice 不显示排名目标。320px 竖屏将 Fullscreen 收为仍具 44×44px 命中区的图标，并保证曲名/档位、Score/目标、SIGNAL 与 Pause 不重叠。 |
| **v1.9.32** | 2026-09-13 | **Duo 共享暂停与同步重开**：任一玩家暂停、退出全屏、切后台或旋转时仍冻结两块场地，但只展示一张跨双场的 `Duo paused` 面板，明确二者共享 3 秒 Resume；提供同步 `Restart duel` 与 `Leave duel`，杜绝两张 Resume 卡造成可单独恢复的误解。面板为可访问 modal，打开聚焦 Resume，Tab / Shift+Tab 闭环，Escape 同步恢复；重开清零暂停广播代次，双场重新 ready 后焦点返回唯一 Start。 |
| **v1.9.33** | 2026-09-13 | **连续时机偏差 → 校准闭环**：完整 Arcade 成绩把可选 timing profile 写入本机历史；最近 3 次成功完整 Arcade 均有至少 20 个有效命中、同向平均偏差均 ≥8ms 且中位偏差 ≥10ms 时，Results 的唯一 Next move 改为 `Calibrate timing`。一次偏差、混合方向、失败、Practice、低样本与损坏历史仍走原单局建议；校准保存或保留后精确返回原曲、难度、模式及 Daily/挑战身份。 |
| **v1.9.34** | 2026-09-13 | **单人暂停可访问闭环**：`Scape paused` 升级为真正的可访问 modal，明确音频/谱面冻结与 3 秒 Resume；提供 Resume、Restart track/section、Leave track 三个完整动作。打开聚焦 Resume，Tab / Shift+Tab 不穿透，Escape 恢复；退出确认取消后回到暂停层，恢复或重开后焦点返回 44px Pause。320px、Pixel 7 与 667×375 / 844×390 横屏均保证动作可达。 |
| **v1.9.35** | 2026-09-13 | **桌面原生链接与当前页语义闭环**：站内链接只在未修饰的主键点击时接管 SPA 导航；Ctrl / Cmd / Shift / Alt + 点击、中键、显式 `target` 与 `download` 保留浏览器原生行为。桌面顶部导航与手机底栏为当前页链接声明 `aria-current="page"`，让视觉、键盘、辅助技术和多标签页工作流共享同一导航真值。 |
| **v1.9.36** | 2026-09-13 | **键位设置可访问状态闭环**：Arrow keys / WASD / D F J K 预设以 `aria-pressed` 暴露当前选择；逐道重绑按钮读出当前键与等待按键状态。非法 Board name 和重复键分别通过 `aria-invalid`、`aria-describedby` 与 alert 关联到对应控件/组，错误边框不再只靠邻近红字猜测；存储与判定逻辑不变。 |
| **v1.9.37** | 2026-09-13 | **320px Home 首屏动作安全区 + 头像英文命名**：JUNO 来电引语从浏览器默认 blockquote 留白收为带 RESONANCE 红线、说话人与正文同组的紧凑品牌组件；Browse tracks / Calibrate 两个次级动作在 320×568 首屏完整位于固定 tabbar 上方并保留至少 8px。顶部头像按默认或自定义玩家名输出简洁的 `<name> profile`，不再重复朗读 Player。 |
| **v1.9.38** | 2026-09-13 | **105 首 Library 渐进展示**：All tracks / Matches 首批只挂载 24 张卡，按 24 首继续展示，最后一批按剩余数量收口；搜索与筛选始终计算完整 105 首，不牺牲可发现性。计数 live status 同步已展示/总数；展开后焦点进入新批次第一首并滚到固定 tabbar 上方，避免键盘与读屏位置脱节。 |
| **v1.9.39** | 2026-09-13 | **Library 可预测排序**：All tracks / Matches 默认按英文标题 A–Z 排列，并提供 Tempo · fast first / slow first；同 BPM 以标题稳定排序。筛选和搜索先覆盖完整 105 首再排序，切换排序回到首批 24 首。排序位于既有 More filters 内，手机默认首屏高度不增加；控件 ≥44px，320px 无横向溢出。 |
| **v1.9.40** | 2026-09-13 | **Library 发现意图可恢复**：搜索、genre、vibe、Beginner、With vocals、Favorites 与排序写入当前 `/library` URL；打开曲目后 Back 或刷新均恢复同一结果和控件，不为每次输入污染浏览器历史。无效枚举降级为默认，失效 genre 在 catalog 就绪后清除。手机继续默认折叠高级筛选，以可访问数字徽标提示活动条件，320×568 保持首个结果可见；空收藏的 Browse all tracks 清除全部筛选。 |
| **v1.9.41** | 2026-09-13 | **Library 可见返回链路闭环**：带搜索/筛选/排序状态的曲目卡把安全的本地 Library 返回目标传入 Track，并继续贯穿单人 Play 与 Duo。Track 的可见返回、赛前显式退出及错误出口均回到原发现结果；直接打开 Track 仍使用干净 URL。外站、协议相对和相邻路径不能注入返回目标，进入 Library 后移除临时 `returnTo`，避免递归嵌套。 |
| **v1.9.42** | 2026-09-13 | **Library → Results 完整回路**：由筛选结果开始的完整单人局在 finish 后继续携带安全 Library 来源；Results 的 Replay、教练升级/降压建议、Miss 分段练习、Daily 重试、Change setup 与 Browse Library 均保留同一发现上下文。直接开局和直接打开 Results 仍输出干净链接；本地 `returnTo` 不进入成绩分享 URL 或 canonical。 |
| **v1.9.43** | 2026-09-13 | **手机 Results 固定续玩动作对齐**：普通结算的固定中间动作从全局推荐改为当前局精确 Replay，并读出曲名、难度与模式；分段练习保持原 `seek/until` 并显示 Practice。Daily 与好友挑战继续保留各自身份，First Shift 仍优先进入下一段剧情。页面 Replay 与固定栏复用同一链接生成器，Library 来源不会在固定入口丢失。 |
| **v1.9.44** | 2026-09-13 | **Library 卡内按需试听**：当前已展示的曲目卡提供独立 44px Preview / Pause，不进入详情即可比较歌曲；所有列表试听均为 `preload="none"`，点击前不请求音频，任一新试听开始会暂停上一首，切到后台也会停止。控制名称包含曲名，试听条参与卡片高度并完整避让移动固定导航。 |
| **v1.9.45** | 2026-09-13 | **手机 Track 赛前信息渐进披露**：≤640px 的 Run setup 默认只保留当前 tier/mode 与 Personal Best，玩法说明和谱面统计由单一 ≥44px `Details` 开关按需展开；桌面继续默认完整展示。谱面加载失败会自动展开错误与 Retry，避免压缩信息时藏住恢复入口。 |
| **v1.9.46** | 2026-09-13 | **手机 Haptics 与 Hitsounds 解耦**：触屏 Settings 新增默认开启的 Haptics 控制，命中、Miss、Combo / SIGNAL 里程碑短振动不再依赖 Hitsounds；玩家可独立选择音频与触觉反馈。桌面不显示无意义控件，不支持 Vibration API 的浏览器安全无操作，旧存档按默认开启迁移。 |
| **v1.9.47** | 2026-09-13 | **手机 Profile 成长动作优先级**：Night streak 提到完整 Rank ladder 之前；≤640px 默认折叠与 Current / Next rank 重复的四级天梯，以 ≥44px `All ranks` 按需展开并保留完整列表语义。桌面继续默认展示全部天梯，手机核心 streak CTA 不再被四张阶梯卡推后一整屏。 |
| **v1.9.48** | 2026-09-13 | **手机外轨 Hold 边缘漂移容错**：左右 5% guard 继续拒绝从屏幕边缘开始的误触，但已合法拥有外轨的 pointer 短暂漂入 guard 时不再提前 release；抬手、cancel、lost capture、暂停与系统中断仍会清理。保持 15/30/50ms 判定窗不变，消除拇指自然漂移制造的错误 Hold 尾 Miss。 |
| **v1.9.49** | 2026-09-13 | **Home 对局代码按意图加载**：Home 待机只运行轻量 `HeroGameplayPreview`，完整 `PlayField` 在玩家点击 Play+Sound 后才与谱面并行加载；单人/Duo 直达页也复用同一异步模块。PWA 首装只预缓存初始入口 JS，后续路由/对局 chunk 首次请求时写入版本化 shell cache，已访问内容仍可离线重载。 |
| **v1.9.50** | 2026-09-13 | **105 首单曲静态发现面**：CF release 为每个已知 `/track/{id}` 生成无需 JavaScript 即可读取的独立 Title / Description / canonical / Open Graph / X 与 `MusicRecording` JSON-LD；sitemap 自动纳入全部 105 首。精确重写兼容根路径与旧 `/beatscape/track/*` 链，未知 ID 继续进入 SPA 404。Track 静态卡移除无用的 105 首早期音频映射，单页约 3.2 kB。 |
| **v1.9.51** | 2026-09-13 | **105 首可识别单曲分享卡**：每个静态 Track 页面改用自身 1200×630 PNG，卡内烘焙曲名、艺人、BPM、曲风、街区与浏览器游玩 CTA；生成器固定复用已归档 OFL 字体。CF release 要求 105/105 卡片存在且尺寸正确，为 URL 写入内容哈希；缺失或错误尺寸直接拒绝构建，不再静默回退站点通用图。 |
| **v1.9.52** | 2026-09-13 | **系统失焦与 Hold 安全再入场**：运行中的可见页面发生 `window.blur` 时与切后台一致自动冻结，覆盖桌面切窗、系统面板及可能丢失 keyup/pointerup 的中断；单人进入 `Scape paused`，Duo 两块场地同步冻结且只显示一张共享面板。暂停会清理物理输入所有权，已命中的未完成 Hold 可在 3 秒 Resume 倒计时内重新按住，Fresh note 仍到 GO 后才接受输入，避免中断后产生不可避免的 Hold 尾 Miss。 |
| **v1.9.53** | 2026-09-13 | **系统音频焦点中断恢复闭环**：运行中的共享 `AudioContext` 进入 `suspended` / Safari `interrupted` 等非 running 状态时，单人自动暂停、Duo 同步冻结。Resume 与退出面板 Keep playing 必须由当次用户手势先重新解锁音频，再开始 3 秒同轴倒计时；浏览器拒绝恢复时保持 modal 和冻结状态、显示可重试错误，不能把玩家放回无声或停钟的对局。 |
| **v1.9.54** | 2026-09-13 | **系统中断后的事务性 Restart**：单人 `Restart track/section` 与 R 快捷键必须先在当次用户手势中恢复 AudioContext，成功后才丢弃旧局并创建新局；恢复被拒时保留原暂停局、modal 与可重试错误，不能清局后留下无声空场。若解锁等待期间打开退出确认，已接受的 Restart 意图保留，但新局继续冻结在确认层背后，Keep playing 后才进入安全倒计时。 |
| **v1.9.55** | 2026-09-13 | **赛前 Sound check 可恢复闭环**：可选声音检查必须在当前用户手势中解锁音频，并以同步 guard 阻止 React 提交前的双击重复请求。等待时显示 `Checking…`；浏览器拒绝权限时保留赛前配置与开始入口、显示可读错误并恢复按钮重试，不得产生未处理 Promise。成功后只播放一次检查音并显示 `Sound check ✓`。 |
| **v1.9.56** | 2026-09-13 | **Home Play+Sound 首局恢复闭环**：首页可玩 demo 的音频权限拒绝与谱面/对局资源失败不得替换整块试玩或暴露原始异常；保留轻量预览、曲目上下文和同一 Play+Sound 入口，分别显示音频或连接错误并可原地重试。同步 guard 阻止同 turn 双激活；入口变化或离页会废止等待中的尝试，恢复后不得下载已放弃的完整对局资源。 |
| **v1.9.57** | 2026-09-13 | **校准启动可恢复闭环**：初次 `Start 8-pulse test` 与结果页 `Try again` 共用同步启动所有权；同 turn 双激活只允许一次 AudioContext 恢复。等待时按钮禁用并显示 `Starting…`；权限拒绝保留当前 intro/result 面板、显示可读 alert 并恢复原地重试。返回或保留当前 offset 会废止等待尝试，迟到的权限结果不得开启旧轮次。 |
| **v1.9.58** | 2026-09-13 | **Play / Duo 初始载入恢复闭环**：曲目元数据、谱面或异步对局模块在赛前失败时显示共享 `Run could not load`，隐藏内部异常，并在当前 URL 原地 `Try again`；返回 Track 保留安全的 Library 来源。无效曲目独立显示 `Track not found` + `Browse Library`，不提供无意义重试。Home 曲库故障只保留一个权威 alert/恢复入口，试玩区以 `Demo offline` 占位，不再重复暴露原始错误或提供必失败的完整对局链接。 |
| **v1.9.59** | 2026-09-13 | **主页重连完整恢复 + 致命路由自愈**：Home catalog 重连成功后不仅恢复主 CTA，也重新装载同一首真实试玩，清除 `Demo offline`。全局分包/渲染故障改用品牌化 `Signal lost` 兜底，不向玩家显示模块异常；`Reload page` 保留当前目的地并通过整页重载恢复已拒绝的 lazy import，`Back to home` 使用当前部署 base 的原生链接。 |
| **v1.9.60** | 2026-09-13 | **慢分包恢复出口 + 对局掉线零位移**：lazy route 超过 3 秒时从无出口 Loading 升级为品牌化 `Still connecting`，继续等待的同时提供保留目的地的 Reload 与部署 base 首页出口。Offline mode 在赛前继续可见，单人/Duo 真正开局后抑制横幅，避免网络状态变化推动 HUD、判定线或双场布局；离开运行态后自动恢复普通页面提示。 |
| **v1.9.61** | 2026-09-13 | **Settings 玩家身份即时一致**：有效 Board name 保存成功后，当前页头头像的名称、可访问标签与首字母必须立即更新，无需跳页或刷新；同源其他标签页通过 storage 事件同步。敏感词、非法输入或浏览器拒绝存储时继续保留上一份已保存身份，不能显示未落盘的新名称。 |
| **v1.9.62** | 2026-09-13 | **欧美实体键盘布局感知**：输入继续绑定物理 `KeyboardEvent.code`，支持 Keyboard Map API 的浏览器把当前键盘实际印字同步到 Settings、Home、Play 与 Duo；例如 AZERTY 的 WASD 物理位置显示为 Q / S / Z / D。布局切换即时刷新；API 缺失、拒绝或返回异常时使用既有稳定标签，存档与判定不变。 |
| **v1.9.63** | 2026-09-13 | **对局暂停 Quick mix**：单人 `Scape paused` 与 Duo 共享暂停面板提供 Music、SFX 和 Hitsounds 三项即时混音；成功调整立即作用于当前音频总线并保存在本机，不重建 session、不重新下载或解码歌曲。非音频玩法设置仍锁定在开局值。控件进入完整 modal 焦点环；320px 竖屏可滚动，844×390 与 667×375 短横屏将混音和三项动作各压成一行，全部命中区保持可达。 |
| **v1.9.64** | 2026-09-13 | **音频硬失败支持码收口**：Play / Duo 自动重试耗尽后继续提供友好说明、原地 Retry 与安全返回，但界面只展示稳定 `Support code`（如 `AUDIO-503`、`AUDIO-NETWORK`、`AUDIO-DECODE`），不再直出浏览器异常、内部地址或签名音频 URL。单人和双人共用同一映射，HTTP 状态仍可用于支持定位。 |
| **v1.9.65** | 2026-09-13 | **Hold 释放点可读性**：每个 Hold 必须绘制独立的头部与尾部菱形，不得只用无端点色条表达释放时机。尾标在头部命中前保持次级层级，进入持续按住后提升为主目标；桌面与手机使用同一 Canvas 真值，不改变头/尾两次判定、15/30/50ms 窗口或音频时序。 |
| **v1.9.66** | 2026-09-13 | **Slide 单次结算与旧纪录迁移**：Slide 起点只激活轨迹，不推进分数、连击、HP 或 SIGNAL；目标道完成后按起点/终点较差档位结算一次，终点沿用 +20ms 完成吸附，任一端失败整条只记 1 Miss。受旧版首尾双计分影响的 10 张正式谱淘汰无 v2 标记的历史 PB/Local/Daily 纪录，无 Slide 的历史成绩保留；任何判定合计与 TotalNotes 不一致的结果拒绝进入排名。 |
| **v1.9.67** | 2026-09-13 | **判定得分与谱面输入公平性**：修复 Good 虽断连却漏记 100 基础分；明确 Good 重置后按 ×1 计分。Chord 每条道只按自身相对谱点的窗口独立判定，不再保留未实现且对触屏不公平的 15ms 键间限制。发布器新增同道相邻 press ≥100ms 与 Hold 占道闸门；生成器自动微调 Slide 尾点，现库 7 张谱的 15 个冲突尾点已修正并通过 5 首 / 15 谱 BS-D002。全 315 张正式谱已由真实输入所有权状态机完成 AP 模拟。 |
| **v1.9.68** | 2026-09-13 | **Hold 尾判 HP 契约落地**：修复运行时未把尾部 Miss 标记传给 HP 计算、导致主动早/晚松键与自动尾超时都错误扣 7 HP。Hold 尾 Miss 现统一扣 5 HP，头 Miss 仍扣 7 HP；整条 Hold 未起按记两个 Miss、合计扣 12 HP。桌面与手机真实触控均通过 live HUD 95 HP 验证。 |
| **v1.9.69** | 2026-09-13 | **Full Combo 语义与荣誉可信度**：Good 与 Miss 都会断连，因此 FC 只在判定数完整且没有 Good / Miss 时成立，Great 可叠；AP 只在全部判定均为 Perfect 时成立。引擎、最近一局与成长统计共用同一推导真值，不再信任调用方或旧存档中的荣誉布尔值。带完整判定数的旧最近一局会自动修正；无法区分 Great FC 与错误 Good FC 的旧累计历史不做破坏性清理。 |
| **v1.9.70** | 2026-09-13 | **命中得分反馈闭环**：正常键盘/触控命中必须在判定线附近显示与当次实际结算完全一致的 `+分数` 浮字。Perfect / Great 使用引擎提交后的 Combo 倍率，Good 在断连后显示重置倍率的 `+100`，Miss 不显示虚假得分；自动 Chord assist 与玩家输入共用同一规则。 |
| **v1.9.71** | 2026-09-13 | **对局 Reduce motion 语义闭环**：Settings 开关与系统 `prefers-reduced-motion` 在运行中的单人/Duo Canvas 使用同一实时真值；关闭屏幕震动、命中粒子及判定/得分位移动画，同时保留静止后淡出的判定、星芒与 `+分数` 关键反馈。系统偏好在对局中改变须即时生效，无需刷新或重新开局。 |
| **v1.9.72** | 2026-09-13 | **批量判定得分反馈原子化**：每个判定事件必须携带引擎在该事件发生时实际提交的得分增量，Canvas 不得从整批处理后的最终 Combo 反算。触屏同手 Chord assist 跨过 ×2/×3/×4 门槛后，即使同一帧的后续 Miss 已断连，先前 Great 的浮字仍显示真实倍率得分；直接输入、自动补判与最终成绩共用同一事件真值。 |
| **v1.9.73** | 2026-09-13 | **Arcade HP 归零原子截止**：`tick()` 一帧处理多个过窗对象时，导致 HP 首次归零的判定仍须完整入账并产生失败反馈，随后立即停止本批及后续判定。Results 只保留失败发生前和触发失败的真实对象，不得把同帧剩余音符继续记为 Miss；单人和 Duo 使用同一引擎语义。整条未起按 Hold 仍按既定原子对象记头/尾两个 Miss。 |
| **v1.9.74** | 2026-09-13 | **Arcade 失败恢复动作首屏化**：普通 Arcade 失败后，桌面必须在核心统计之后、长叙事与判定明细之前显示恢复建议，以 `Try Casual` 为主动作并保留精确 `Retry Arcade`；≤640px 固定中间动作改用失败语义 `Retry` 并复用同一局链接，滚动卡不重复精确重试。Daily、共享挑战与 First Shift 继续由各自专用恢复流程承接。 |
| **v1.9.75** | 2026-09-13 | **320px Library 首屏发现压缩**：默认未筛选状态在 ≤640px 将 Library 标题与曲目总数并排，省略重复的氛围说明和搜索 eyebrow，并收紧发现卡间距；搜索、genre、Favorites、More filters 与 ≥44px 触控合同保持不变。320×568 首屏须在固定 tabbar 上方露出第一首精选曲的标题，不再要求玩家先盲滚后才看到音乐。桌面及活动筛选结果布局不变。 |
| **v1.9.76** | 2026-09-13 | **Slide 提前到达持续手势容错**：起点成功后，玩家可提前滑入或按住目标道并持续到尾点，由歌曲时间轴在尾点完成判定；过早离开目标道则放弃这次尾点持有，后续仍按整条 1 Miss 超时。暂停、失焦或系统中断会清空瞬时输入，只允许中断前确实持有的 Slide 目标在 Resume 倒计时重新抓取；Fresh note 仍不可提前输入。首尾取较差档位、单对象计分和 15/30/50ms 头窗保持不变。 |
| **v1.9.77** | 2026-09-13 | **Slide 目标锁定即时反馈**：Slide 起点激活后仍以高亮虚线提示移动方向；玩家提前到达并持续持有目标道时，轨迹立即升级为 5px 实线，目标菱形放大并增加静态外层确认，让手机拇指和键盘玩家都能看见持续手势已被接管。该状态只读取真实输入所有权，不改变尾点时钟、判定窗、计分或 Reduce Motion。 |
| **v1.9.78** | 2026-09-13 | **Slide 锁定轻触觉确认**：触屏布局在目标道首次锁定，以及系统中断后合法重新抓取原目标时，若玩家开启 Haptics 且设备支持 Vibration API，给出一次 6ms 轻脉冲；最终尾点判定仍使用既有命中反馈。关闭 Haptics、桌面布局与不支持 API 的浏览器保持静默，且该反馈继续独立于 Hitsounds。 |
| **v1.9.79** | 2026-09-14 | **对局浏览器手势隔离**：沉浸式 Play / Duo 在文档根层阻断滚动链与边缘回弹，实时 Canvas 独占触控、禁长按菜单并拒绝右键/手写笔侧键计分；准备、暂停与错误覆盖层恢复正常纵向触控滚动和页面缩放。Library 等普通页面不受影响。 |
| **v1.9.80** | 2026-09-14 | **桌面浏览器快捷键隔离**：带 Ctrl、Command/Meta 或 Alt 的键盘组合全部交还浏览器/操作系统，不得触发轨道、R 重开或 P 暂停；因此 Ctrl/Cmd+R、Ctrl/Cmd+P 与 Alt+方向键不再被对局截获。无修饰轨道键、R、P/Escape 及只带 Shift 的玩法输入保持原行为。 |
| **v1.9.81** | 2026-09-14 | **键位重绑浏览器快捷键隔离**：Settings 等待新键位时同样不得截获 Ctrl、Command/Meta 或 Alt 组合，也不得把组合键中的普通键误存为轨道；浏览器命令后继续等待真正的键位输入。Escape 取消，Tab 保持原生焦点导航并退出等待，Shift 加普通键仍按物理键码绑定。 |
| **v1.9.82** | 2026-09-14 | **自定义键位与赛前原生操作隔离**：PlayField 只在开局事务提交后接管 lane、R 与 P/Escape；准备层期间由聚焦控件保留原生键盘语义。因此即使玩家把 Space 或 Enter 绑定为轨道，仍可用该键激活单人 `Start playing` 与 Duo `Start`，开始倒计时后同一键才进入玩法输入。 |
| **v1.9.83** | 2026-09-14 | **混合设备 Chord assist 判定隔离**：Two-thumb chord assist 的资格绑定到实际触摸命中，不再由整台设备的粗指针能力代表输入来源。Surface / 平板外接键盘及鼠标命中即使在触屏布局中也按完整和弦判定，不能把漏道自动补为 Great；真实触摸仍保留同手和弦辅助。单人、Duo 与 Arcade / Casual / Practice 共用该输入来源真值。 |
| **v1.9.84** | 2026-09-14 | **混合设备触摸设置可发现性**：Settings 以 `maxTouchPoints` / `any-pointer: coarse` 识别任意触摸能力，而手机紧凑布局仍只看主指针。触摸屏笔电即使主要使用精细触控板或鼠标，也能看到并关闭 Thumb chord assist；Keyboard controls 继续默认完整展开，不会被误折叠成手机的 External keyboard 面板。 |
| **v1.9.85** | 2026-09-14 | **首屏输入引导与候选预览真值**：Home 轻量试玩按主输入能力分流，触屏手机显示四条彩色触控 lane 与拇指提示，不再展示方向键键帽；桌面继续显示当前物理键盘布局。`npm run preview` 从已构建入口自动识别 `/beatscape/` 本地 base 或 `/` Cloudflare base，人工 UI 验收与 Playwright 均直接预览实际产物，不能因隐藏环境变量漂移成资源 404 白屏。 |
| **v1.9.86** | 2026-09-14 | **桌面准备屏键位信息去重**：Play 准备卡以四个实体布局键帽承担“按什么”，短句 `Hit the line` 只承担“何时按”，不再在下一行重复完整键位。键帽组以 `Lane keys: …` 可访问名称保留相同信息，Home 试玩键帽同步采用该语义；触屏拇指提示保持不变。 |
| **v1.9.87** | 2026-09-14 | **Results 空状态恢复路径**：直接打开结算页或遇到损坏成绩存档时，不再向玩家暴露内部 `?run=local` 参数。页面改为品牌化 `No result yet` 卡片，明确完成一首即可解锁成绩拆解与指导，并提供 `Choose a track` 主动作和 `Back to Home` 次动作；320×568 下两项均 ≥44px、无横向溢出并完整位于固定导航上方至少 8px。 |
| **v1.9.88** | 2026-09-14 | **桌面 Track 首屏开局优先**：常见 1280×720 视口在完成难度、模式和速度选择后即可完整看到所选 `Play` 主动作，不再被永久展开的约 300px Run setup 详情推到首屏外。桌面与手机统一默认保留 tier/mode + Personal Best 摘要，并以 ≥44px `Details` 按需展开规则和谱面统计；谱面错误仍自动展开。桌面 Library 返回入口同时贴齐封面顶边，不再因 Grid 拉伸漂在左侧空白中。 |
| **v1.9.89** | 2026-09-14 | **懒加载路由壳层连续性**：普通页面切换到 Settings / Characters 等分包路由时，加载边界只替换主内容，不再卸载品牌页头、当前导航和手机固定 tabbar。快速加载态预留剩余视口，避免 footer 上跳；超过 3 秒仍升级为 `Still connecting` 并保留 Reload / Home 出口。目标路由在等待期间立即更新 URL、焦点宿主与 `aria-current`。Play / Duo 沉浸式运行结构不变。 |
| **v1.9.90** | 2026-09-14 | **Home 分阶段 Daily 优先级**：First Shift 未完成的新玩家继续先看到入门剧情，再在后续内容区发现 Daily；完成 First Shift 后，Daily 前移到 hero / 回归欢迎语之后、剧情与编辑内容之前，成为首个回流目标。挑战曲、难度/模式、成绩、连续游玩与榜单逻辑均不变。 |
| **v1.9.91** | 2026-09-14 | **精选试听高光段真值**：Home / Library 精选卡在 `preload="none"` 下仍须先显示真实的 15 秒试听长度，不再以 `0:00 / 0:00` 像损坏音频。首次播放等待 metadata 后从人工选定的代表段落开始；进度条、读数、键盘 Home/End 与自动停止统一使用相对 0–15 秒时间轴，且点击前继续保持零音频请求。 |
| **v1.9.92** | 2026-09-14 | **手机主导航图标与动作意图统一**：手机固定底栏不再依赖跨系统字形不一致的 `⌂ / ♫ / ★ / ⚙`，改用一套确定性的内联 SVG；Board 使用排名柱形而非易与收藏混淆的星形。中心动作在首次/下一局使用 Play 三角，在 Results 的 Replay、Retry、Improve 与 Practice 使用回放箭头；文本与可访问名称继续承担完整语义，桌面文字导航不变。 |
| **v1.9.93** | 2026-09-14 | **Slide 完成听觉确认**：成功完成 Slide 时保留原 Perfect / Great / Good 判定音，并叠加一枚短促上扬的程序合成锁定音，让连续手势的终点与普通 Tap 可听辨；Slide Miss 只播放既有失败音，关闭 Hitsounds 时两层音效都静默。音色进入统一预渲染缓存，不改变评分、谱面、判定窗或触觉设置。 |
| **v1.9.94** | 2026-09-14 | **Hold 释放听觉确认**：成功松开 Hold 尾点时保留原 Perfect / Great / Good 判定音，并叠加一枚短促下行的程序合成释放音，让按下与正确松开形成不同听觉动作；过早/过晚松开仍只播放 Miss。新音色进入统一预渲染缓存并服从 Hitsounds，不增加持续 tick，不改变头尾双判定、HP 或尾窗。 |
| **v1.9.95** | 2026-09-14 | **对局角色立绘可读性分层**：街区角色图从 Canvas 上方的 DOM 图片移入 Canvas 环境背景层；轨道、判定线、音符、瞬时判定与 HUD 必须后绘并始终压住立绘。保留单人随 SIGNAL 升温的氛围强度，Duo 使用独立低透明度上限；Reduce Motion 取消透明度过渡，不改变判定、输入或谱面。 |
| **v1.9.96** | 2026-09-14 | **桌面对局键位提示渐退**：桌面赛前准备与 3 秒倒计时始终显示实际实体布局键帽；前三个有效完整局继续常驻。第 4 局起，单人 Casual / Arcade 在 GO 后以 650ms 淡出，Resume / Restart 的安全倒计时重新显示并再次淡出；Reduce Motion 在 GO 后直接隐藏。Practice、Duo 与 Home hero 始终保留，触屏继续不创建键帽精灵。 |
| **v1.9.97** | 2026-09-14 | **触屏 Duo 座位与输入提示对齐**：触屏不再沿用 WASD/方向键决定双场顺序，固定以 P1→P2 排列；竖屏准备卡按实际上下场显示 `Top / Bottom`，短横屏与宽屏显示 `Left / Right`，并明确两位玩家各自 `Tap 4 lanes`。桌面键盘继续按物理左侧键区与右侧方向键区安排座位。 |
| **v1.9.98** | 2026-09-14 | **当前候选固定性能矩阵回绑**：性能采样器离开已开始的单人/Duo 对局时必须走真实 Exit → Leave 确认，再在同一 JS realm 返回 Library；不得用会被产品退出保护拦截的合成 History 导航。当前 artifact `0ad273eeb025` 已完成桌面与 4× CPU 移动模拟共 26 条固定观察，预算检查 `overallPass: true`、`issues: []`；专项真机状态不变。 |
| **v1.9.99** | 2026-09-14 | **Results 社交回路前置**：普通成绩把具名 `Share this run` 放到通用电台回信与详细判定之前，移动端至少让 `Copy link` 完整位于初始 viewport 的固定底栏上方；实际 First Shift 仍先给故事回报和下一首主 CTA，再出现分享。Share Sheet / 图片复制 / 4:5 下载的能力降级、挑战 URL 与续玩真值保持不变。 |
| **v1.9.100** | 2026-09-14 | **可调游戏背景暗化**：Settings 与单人/Duo 暂停层提供 0–100% `Background dim`，旧存档默认 25%。暗层只覆盖环境 wash、光束与角色立绘，轨道、判定线、音符、瞬时判定和 HUD 后绘保持清晰；暂停调整成功落盘后立即作用于当前单人或两块 Duo 场地，不重建 session、音频或渲染循环。 |
| **v1.9.101** | 2026-09-14 | **Settings 桌面控制台与窄屏阅读顺序**：≥900px 将 Profile / Audio 与 Gameplay / Keyboard controls 分为两列独立控制栈，在 1280×720 首屏同时露出身份、音频和玩法设置；<900px 恢复 Profile → Audio → Gameplay → Keyboard controls 的单列 DOM 顺序。触屏键盘折叠、自动保存、焦点与设置语义不变。 |
| **v1.9.102** | 2026-09-14 | **手机 Track 已选配置直接回跳**：≤640px 固定栏左侧的曲名与 tier/mode/PB 从静态摘要升级为明确的 `Change ↑` 操作；点击后平滑回到 Run configurator，并把键盘/读屏焦点交给当前 Difficulty。右侧 `Play now` 继续保持唯一开局主动作，320px 下两侧均为 ≥44px 目标且不横向溢出；Reduce Motion 使用即时滚动。 |
| **v1.9.103** | 2026-09-14 | **手机 Results 诊断渐进披露**：四档判定与 signed early/late 统一进入原生 `Run details`；≤640px 默认收起并在摘要保留总音符数与 Miss 数，让唯一 `Next move` 更早进入扫描顺序，桌面默认展开。断点跨越会同步默认状态，用户仍可随时展开/收起；独立 Miss review、分享、剧情与精确 Replay 行为不变。 |
| **v1.9.104** | 2026-09-14 | **Track 赛前分段 Practice**：选择 Practice 后直接显示 Full track 与当前谱面的具名段落及时间范围；互斥 radio group 支持方向键循环、Home / End 与 ≥44px 触控，选择后桌面主动作和手机固定栏同步为精确 `seek/until`。切换难度回到 Full track，加载失败仍可整曲练习；1280×720 的段落选择与主动作保持首屏可见。 |
| **v1.9.105** | 2026-09-14 | **手机 Library 首屏直接开玩**：≤640px 只常显搜索，将 Genre、Favorites、Sort、Vibe、Beginner 与 Vocals 收进统一 `Filters`；320×568 的搜索与披露同排，默认首屏须完整露出第一首推荐的 `Play now` 并与固定导航保留 ≥8px。筛选徽标统计全部次级条件，窄屏应用 Favorites 后自动收起面板并立即显示结果；桌面继续完整展开。 |
| **v1.9.106** | 2026-09-14 | **标准手柄输入与 Duo 独立座位**：浏览器标记为 W3C `standard` 的控制器可用 D-pad 或右侧四个 face buttons 操作四道，Menu 暂停/恢复；键盘和触屏始终并行可用。单人占用第一只可见手柄，Duo 稳定分配两只并在断连时保留幸存玩家座位，禁止 P2 手柄串到 P1。准备卡显示控制器状态，运行中 lane 提示切为方向图形；≤700px Duo 顶栏隐藏重复输入长文，320×568 保留完整曲名、模式与 Start。判定、计分、音频时钟和谱面不变。 |
| **v1.9.107** | 2026-09-14 | **手柄断连公平冻结与恢复反馈**：已分配控制器在开局后断连或被替换时，单人立即冻结当前音画，Duo 只触发一次共享冻结，清空该控制器持有的 lane，避免玩家在设备故障期间被动累计 Miss。暂停层明确指出哪位玩家断连、键盘/触屏后备仍可用；原手柄或替代手柄恢复后更新为 ready 状态，但仍由玩家显式 Resume/Menu 进入安全倒计时。赛前断连只更新准备卡，不产生过期警告。 |
| **v1.9.108** | 2026-09-14 | **短竖屏暂停动作首屏化**：portrait、≤640px 宽且 ≤700px 高时，单人和 Duo 暂停层默认把 Quick controls 收为 48px `Adjust` 披露入口，让 Resume、Restart、Leave 三个核心动作无需滚动即可完整进入 320×568 首屏；展开后仍可即时调整 Music、SFX、Background dim 与 Hitsounds。桌面、宽裕竖屏和 ≤520px 高短横屏继续默认展开完整控件，跨越条件时同步回到该布局默认值。 |
| **v1.9.109** | 2026-09-14 | **320px Duo 双场完整视口**：竖屏上下分场时，每个 PlayField 由自己的 Grid row 决定高度，并覆盖只适用于单人的 `58dvh` Canvas 最小高度；320×568 不再把 P2 Canvas 和判定线裁到视口外。双场、两枚 Pause 与页面均无需纵向滚动，每场保留至少 180px 轨道高度；同时回收原先闲置的底部 64px 给双人 lane travel。Pixel 7、桌面及 844×390 / 667×375 短横屏布局不变。 |
| **v1.9.110** | 2026-09-14 | **当前候选完整生产回归回绑**：`2dd2c62bc57d` 在桌面 Chrome 与 Pixel 7 模拟两个项目完成全部 446 条 Playwright production 合同，结果为 **427 passed / 19 个按设备或项目限定的 skip / 0 failed**，耗时 27.7 分钟。覆盖真实 M4A、三首真实剧情歌曲、触屏/键盘/手柄、单人/Duo、PWA 离线、短屏与横屏、恢复路径、结果与分享；这项证据替代此前只绑定 `29a9daa7cfcd` 的完整回归，不替代未重采的同指纹性能矩阵、人工耳检或已取消的专项真机验收。 |
| **v1.9.111** | 2026-09-14 | **当前候选固定性能矩阵回绑**：同一 `2dd2c62bc57d` artifact 完成桌面与 4× CPU 移动模拟共 26 条固定观察：各 9 次冷加载、3 场 120 秒 / 929 判定完整 Hard、8 次重开与 8 次 Duo 切歌。最慢 ready 为 1695.8 / 3778.7ms；六场均约 60.002 FPS、最长帧 16.8ms、零连续异常间隔，Canvas 峰值 2.4ms；末 4 次 post-GC heap 范围 310,192 / 275,772 B。独立预算 `overallPass: true`、`issues: []`。固定实验室证据不替代人工耳检、最终签审或已取消的专项真机验收。 |
| **v1.9.112** | 2026-09-14 | **Home 正式进度与不存档试玩分层**：新访客主动作使用 `Start first run`，页面内试玩使用 `Try it here`，并以名为 `Interactive demo. Progress is not saved.` 的可访问区域和可见 `Demo · no progress saved` 明确不保存进度。提示位于动作之后、装饰性触控 lane 之前，Pixel 7 默认首屏与固定导航保持 ≥8px；First Shift 已完成但 catalog 仍加载时使用 `Start a run`。当前 artifact `ecade1e039fa` 的 Vitest **46 文件 / 346 用例**、Home production **15 passed / 1 个 desktop-only skip**、CF build/release verify 通过。`2dd2c62bc57d` 的 446 项完整 production 与 26 条性能观察仅作为上一候选证据，不外推到当前产物。 |
| **v1.9.113** | 2026-09-14 | **正式手机对局触控教学与 demo 语义隔离**：粗指针正式 Play 开局卡显示四条彩色触控 lane、`Four touch lanes` 可访问名称与 `Tap the four lanes`，不再复用 Home hero 的 `Demo · no progress saved`；Home `Try it here` 继续明确不保存，细指针桌面继续显示当前实体键位。旧 artifact 新 mobile 合同以触控 lane **0/4** 红灯；当前 `72624178ef7d` 的 Home / Play / 键位 / 320px production **30 passed / 2 个按项目限定的 skip**，Pixel 7 与 320px 截图目检通过；Vitest **46 文件 / 346 用例**、tsc、CF build/release verify 通过。未重跑当前同指纹完整 446 项 Playwright 或固定性能矩阵。 |
| **v1.9.114** | 2026-09-14 | **320px 正式开局主动作压缩**：最窄支持手机上的 `Start playing` 从 98px 双行块收为单行、≥44px 且 ≤64px 的明确主动作，把纵向空间还给四轨触控提示、Note speed、Chart moves 与声音工具；Home hero 试玩因选择器隔离不变。新增 320×568 粗指针 production 几何合同锁定主动作尺寸、四轨提示、操作文案、谱面机制首屏可见及无横向溢出。当前 `e016f44dd225` 的相关 production **35 passed / 1 个按项目限定的 skip**，Vitest **46 文件 / 346 用例**、性能规则 **51/51**、tsc、CF build/release verify 通过。未重跑当前同指纹完整 446 项 Playwright 或固定性能矩阵。 |
| **v1.9.115** | 2026-09-14 | **普通 Results 下一步优先于分享**：成功普通局在核心成绩与当局奖励后立即显示唯一 `Next move`，再显示 `Share this run`、通用电台回信与诊断，避免练习/复赛建议被低频增长工具推到第三屏；手机主建议 CTA 必须完整位于固定导航上方。普通 Arcade 失败继续在成绩后立即恢复，First Shift 继续以剧情下一首优先。旧 artifact 的 coach top 为 desktop/mobile **1053.3 / 1020.8px**，均晚于 share **351 / 431px**；新顺序合同转绿。当前 `7de837b0a385` 的 Results / 分享 / First Shift / Daily / 挑战 production **43 passed / 1 个按项目限定的 skip**，Vitest **46 文件 / 346 用例**、发布器 **16/16**、性能规则 **51/51**、tsc、CF build/release verify 通过。未重跑同指纹完整 446 项 Playwright 或固定性能矩阵。 |
| **v1.9.116** | 2026-09-14 | **Local Board 追分闭环**：榜单行原有 hover 位移和强调色却没有动作，现 All-time 每行整卡可聚焦、可点击，并以 `Replay →` 明确按该曲目/难度重开 Arcade；Daily 有效行显示 `Play today →`，保留当天确定性曲目、日期和 Daily 身份。键盘焦点环、≥44px 行点击区及 320px PTS/ACC 同行受 production 合同保护。新增合同在旧产物因不存在 replay link 明确红灯；当前 `d4887eaa58f3` 的 Board / Daily / Profile / 导航 / 320px 相邻 production **38 passed / 2 个按项目限定的 skip**，Vitest **46 文件 / 346 用例**、发布器 **16/16**、性能规则 **51/51**、tsc、CF build/release verify 通过。未重跑同指纹完整 446 项 Playwright 或固定性能矩阵。 |
| **v1.9.117** | 2026-09-14 | **正式手机首局补齐击打时机**：四条彩色 lane 继续说明点击位置，短提示由只说明位置的 `Tap the four lanes` 改为 `Tap notes on the line`，让第一次接触下落式音游的玩家在 Start 前同时知道“点哪里”和“什么时候点”。新文案合同先在旧产物明确红灯；当前 `6eb5cfad0c4c` 的首局、Home 入口、单人/Duo 启动与恢复、HUD、键位和 44px 赛前触控 production **63 passed / 3 个按项目限定的 skip**，320×568 截图目检通过。Vitest **46 文件 / 346 用例**、发布器 **16/16**、性能规则 **51/51**、PRD **8/8**、tsc、CF build/release verify 通过。未重跑同指纹完整 446 项 Playwright 或固定性能矩阵。 |
| **v1.9.118** | 2026-09-14 | **零命中首局恢复与 Miss 真值**：First Shift 未产生推进凭证时，手机固定主动作从泛化 `Play` 改为精确 `Retry`，与正文 `Try this connection again` 指向同一曲目、档位、模式和故事节点；成功局仍进入下一段。Results 的 Miss review 同时改为以权威判定总数为准：旧存档有 Miss 但缺少 `missEvents` 坐标时显示总数并说明详细位置不可用，不再错误宣称 `clean run`。两项 production 合同均在旧产物明确红灯；当前 `e58c56a88204` 的故事、Home、普通 Results、Daily、挑战、分享、streak 与移动导航扩大矩阵 **79 passed / 3 个按设备限定的 skip**，含双端三首真实剧情歌曲完整链路，零命中手机全页截图目检通过。Vitest **46 文件 / 346 用例**、发布器 **16/16**、性能规则 **51/51**、PRD **8/8**、tsc、CF build/release verify 通过；未重跑同指纹完整 production 或固定性能矩阵。 |
| **v1.9.119** | 2026-09-14 | **手机固定主动作全状态真值**：Home、Library 等非 Results 页面虽然已让固定中心动作指向真实下一局，标签却始终写成泛化 `Play`；回流失败局因此与页面 `Retry last run` 直接冲突。现下一局决策显式携带 `start / continue / play / replay / retry` 意图，固定栏分别显示 `Start / Continue / Play / Replay / Retry`，回放类动作同步使用回放图标；可访问名称包含真实曲目、难度和模式。旧产物状态矩阵 **6 failed / 3 passed**，当前 `28557a2cb41b` 的 Home / First Shift / Results / Daily / 挑战 / Practice / 移动导航双端 production **61 passed / 3 个按项目限定的 skip**；320px Start、Continue、Replay 截图无挤压。Vitest **46 文件 / 347 用例**、tsc、CF build/release verify 与 105 tracks / 315 charts / 906 files / 497.0 MiB 资产核验通过；未重跑同指纹完整 production 或固定性能矩阵。 |
| **v1.9.120** | 2026-09-14 | **First Shift 开场漏拍实时救援与完成态门控**：精确 `studio` / Voltage Drop / Easy Casual 且故事节点尚未完成时，若开场前 3 个判定全为 Miss 且零命中，HUD 在表现卡下显示 `Find the line`；触屏提示 `Tap`，键盘/手柄提示 `Press`，首次 Perfect / Great / Good 后立即退场。失败或未完成的重试继续获得帮助，完成后的 Journal 重玩不再弹出新手提示。基础 helper 合同先红；完成态重玩合同在旧产物 desktop/mobile **2/2 红灯**。当前 `4f357b59b9b3` 的 `gameplay-guidance` production **9 passed / 1 个视口限定 skip**，Vitest **46 文件 / 348 用例**、tsc、CF build/release verify 与 105 tracks / 315 charts / 906 files / 497.0 MiB 资产核验通过。前序 `dba83e0b28b4` 的扩大矩阵 **53 passed / 1 个项目限定 skip**，不外推为当前产物证据；计分、音频、Canvas 60fps loop 与谱面均未改变。 |
| **v1.9.121** | 2026-09-14 | **First Shift 救援卡不遮谱**：上一候选把实时帮助放在表现卡下方，虽避开判定线却横跨中央音符下落通道。现救援态直接复用左上零分表现卡的 footprint；蓝色 `Find the line` 出现时不再增加第二块轨道遮挡，首次命中后退场并露出实时 Score / ACC / Progress。新增几何合同在旧产物 desktop/mobile **2/2 红灯**，横向偏移 186.6 / 89.4 CSS px；当前 `52b110a907f3` 专项 **2/2**，开局/音频恢复、Practice、HUD、两档短横屏、320px、Duo 与双端三首真实 First Shift 全链路 **75 passed / 1 个视口限定 skip / 0 failed**。Vitest **46 文件 / 348 用例**、tsc、CF build/release verify 与 105 tracks / 315 charts / 906 files / 497.0 MiB 资产核验通过；只改 HUD CSS、几何合同与文档，计分、音频、Canvas 60fps loop 与谱面均未改变。 |
| **v1.9.122** | 2026-09-14 | **赛前高级动作匹配当前输入面**：手机开始层原先一边写 `Tap notes on the line`，一边让 Hold / Slide 固定使用 `Press`，造成触控术语冲突。现纯触屏 Hold 使用 `Touch and hold… Lift…`、Chord 使用 `Touch every marked lane…`、Slide 使用 `Touch… slide…`；键盘和已连接手柄继续使用 `Press / Release`。默认 press 与 touch 三种动作均由纯函数合同覆盖，设备/手柄变化会重新选择。旧产物 desktop 正确、mobile 常规/320px **2/2 红灯**；当前 `e53f3c44c1ce` 专项 **3 passed / 1 个视口限定 skip**，开局/音频恢复、救援、Practice、Duo、手柄、两档短横屏、320px、窄屏与 44px 触控目标扩大矩阵 **61 passed / 1 个视口限定 skip / 0 failed**。Vitest **46 文件 / 348 用例**、tsc、CF build/release verify 与 105 tracks / 315 charts / 906 files / 497.0 MiB 资产核验通过；输入事件、计分、音频、Canvas 与谱面均未改变。 |
| **v1.9.123** | 2026-09-14 | **正式开局改为任务 / 玩法优先**：正式 Play 不再把 `AI Original · Owned Rights` 放在开始卡第一视觉层。普通 Casual 使用 `Ready to play`，Arcade / Practice 分别使用 `Arcade run` / `Practice loop`；有效 First Shift 路由显示 `First Shift · {node}`，让新玩家在动作前确认当前任务。权利声明继续以同一固定文案保留在卡片底部，Home hero 的 `Try the beat` 不变。旧产物的新层级合同 desktop/mobile **4/4 红灯**；当前 `412523b7afeb` 的任务、模式、320px 可达性、挑战、Daily、First Shift、Duo、窄屏与触控目标 production 合计 **72 passed / 2 个按项目限定的 skip / 0 failed**，Pixel 7、桌面及 320×568 截图目检通过。Vitest **46 文件 / 348 用例**、tsc、CF build/release verify 与 **105 tracks / 315 charts / 906 files / 497.0 MiB** 资产核验通过；输入、计分、音频、Canvas 与谱面均未改变。 |
| **v1.9.124** | 2026-09-14 | **未推进 First Shift 的结算只保留恢复路径**：当前故事节点因零命中、Arcade 失败或 Practice 未恢复时，剧情卡已有 `Try this connection again`，因此不再紧接着展示 0 分/失败成绩分享，也不再在页尾重复 `Choose the next run` / Replay。手机固定中间动作继续指向同一精确 Retry；`Run details`、Miss review、曲目信息与完整音乐入口仍可达。成功推进的故事结果继续先给下一首、随后分享；普通 Results 的教练与分享不变。旧产物的聚焦恢复合同 desktop/mobile **2/2 红灯**；当前 `42716876b9e0` 的 First Shift 成功/失败/旁听/Practice、普通 Results、分享能力、Library 返回与移动固定动作 production **38 passed / 0 failed**，零命中 Pixel 7 长页截图目检通过。Vitest **46 文件 / 348 用例**、tsc、CF build/release verify 与 **105 tracks / 315 charts / 906 files / 497.0 MiB** 资产核验通过；未重跑同指纹三首真实歌曲长链，输入、计分、音频、Canvas 与谱面均未改变。 |
| **v1.9.125** | 2026-09-14 | **零判定 Accuracy 不预先奖励**：倒计时和尚无任何判定时，单人与 Duo HUD 均显示中性 `ACC —`，不再以虚假 `100.00%` 暗示已有满分表现；第一次 Perfect / Great / Good / Miss 后再切换为真实两位小数百分比。底层计分数值未变。变更前单人 / Duo、desktop / mobile 合同 **4/4 红灯**；当前 `4972bce04814` 的 HUD production **12 passed / 0 failed**，覆盖 Casual / Arcade、PB、HP 与背景层级，Duo 移动截图目检通过。Vitest **46 文件 / 348 用例**、tsc、CF build/release verify 与 **105 tracks / 315 charts / 906 files / 497.0 MiB** 资产核验通过；未重跑同指纹完整 production、固定性能或三首真实歌曲长链，输入、计分、音频、Canvas 与谱面均未改变。 |
| **v1.9.126** | 2026-09-14 | **Duo 准度数据保留标签**：紧凑的桌面半宽和手机上下分场表现卡不再隐藏 `ACC`；零判定的 `—` 与实时百分比都有明确语义，与 `judged/total` 并列时无需猜测。表现卡内容和 Score / SIGNAL / Pause 几何均未溢出。桌面场地仍按 WASD 左、方向键右避免两人交叉手臂；触屏保持 P1→P2。变更前可见性合同 desktop/mobile **2/2 红灯**；当前 `322816b62788` 的 HUD、Duo Ready 与 320px Home 几何 production **18 passed / 0 failed**，桌面/移动 HUD 及 Ready 三布局截图目检通过。Vitest **46 文件 / 348 用例**、tsc、CF build/release verify 与 **105 tracks / 315 charts / 906 files / 497.0 MiB** 资产核验通过；未重跑同指纹完整 production、固定性能或三首真实歌曲长链，输入、计分、音频、Canvas 与谱面均未改变。 |
| **v1.9.127** | 2026-09-14 | **Calibration 保留 Settings 导航方位**：Calibration 明确归属 Settings 子流程，在桌面顶部导航与手机固定底栏都继续只将 Settings 标记为当前页；Settings 首屏提示同时覆盖 early / late，并直接指向快速校准和下方 Global offset。变更前导航位置合同 desktop/mobile **2/2 红灯**；当前 `91a6f9a0daf9` 的 Navigation、Calibration 与手机导航 production **19 passed / 1 个 desktop-only skip / 0 failed**，390×844 Calibration 选中态与 Settings 文案截图目检通过。Vitest **46 文件 / 348 用例**、tsc、CF build/release verify 与 **105 tracks / 315 charts / 906 files / 497.0 MiB** 资产核验通过；未重跑同指纹完整 production、固定性能或三首真实歌曲长链，输入、计分、音频、Canvas 与谱面均未改变。 |
| **v1.9.128** | 2026-09-14 | **Track 保留 Library 导航方位**：桌面从曲库进入任一 Track 详情后，顶部导航继续只将 Library 标为当前页，保留曲库 → 曲目详情的父子层级；≤640px 继续隐藏全局 tabbar，使用当前曲目的专属固定操作栏。变更前 desktop 合同 **1/1 红灯**，手机专属栏正常；当前 `8f122a57f8e4` 的 Navigation、Library discovery、Track setup 与 Back navigation production **56 passed / 6 个设备限定 skip / 0 failed**，1280×720 Track 详情截图目检通过。Vitest **46 文件 / 348 用例**、tsc、CF build/release verify 与 **105 tracks / 315 charts / 906 files / 497.0 MiB** 资产核验通过；未重跑同指纹完整 production、固定性能或三首真实歌曲长链，输入、计分、音频、Canvas 与谱面均未改变。 |
| **v1.9.129** | 2026-09-14 | **First Shift 救援保留整局进度**：`Find the line` 覆盖零分表现卡期间新增实时 `{judged} / {total} notes`，持续漏拍的新手仍知道歌曲推进到哪里。数字保持在原 128–158px 卡内，不扩大遮谱 footprint；作为高频视觉辅助从 live region 隐藏，避免每次 Miss 重复播报整段提示。变更前 desktop/mobile 合同 **2/2 红灯**；当前 `f79f2b2cd43b` 的 First Shift、Gameplay guidance、HUD、Pause、320px 与两档横屏 production **53 passed / 1 个视口限定 skip / 0 failed**，正式 desktop/Pixel 7 截图及 390×844 实时画面目检通过。Vitest **46 文件 / 348 用例**、tsc、CF build/release verify 与 **105 tracks / 315 charts / 906 files / 497.0 MiB** 资产核验通过；未重跑同指纹完整 production、固定性能或三首真实歌曲长链，输入、计分、音频、Canvas 与谱面均未改变。 |
| **v1.9.130** | 2026-09-14 | **First Shift 零命中恢复提示匹配输入面**：未推进的首局结算不再在桌面要求玩家 `tap a lane`；粗指针触屏使用 `tap a lane`，键盘使用 `press a lane key`，已连接标准手柄优先使用 `press a lane button`，精确 Retry 与故事节点保持不变。变更前定向合同 desktop **1/1 红灯**、mobile **1/1 通过**；当前 artifact `8d3e27fa88e2` 的 First Shift、三首真实歌曲叙事长链、Gameplay guidance、Gamepad、Results next move / sharing production **55 passed / 1 个视口限定 skip / 0 failed**（10.9m），追加手柄结果页合同 **2/2 passed**，正式 desktop / Pixel 7 长页截图与 1280×720 / 390×844 实时布局目检通过。Vitest **46 文件 / 348 用例**、tsc、CF build/release verify 与 **105 tracks / 315 charts / 906 files / 497.0 MiB** 资产核验通过；未重跑同指纹完整 production 或固定性能，未改输入事件、计分、音频、Canvas、谱面或对局 rAF。 |
| **v1.9.131** | 2026-09-14 | **零命中回流恢复语义统一**：完成 First Shift 后，最近对局有有效命中且完成时继续显示 Play again / Replay；Arcade 失败或虽完成但零命中时，Home、手机固定动作与 Library 统一显示 Retry last run / Retry。Home 使用支持性的 JUNO 台词；Library 明示 `No notes hit`，且该恢复状态在 320px 保持可见，正常完成状态仍按原紧凑布局隐藏。变更前 Home / Library 的 desktop/mobile 合同 **4/4 红灯**；当前 artifact `e12a26612432` 的 Home / Library 回流、First Shift、Navigation、320px 窄屏与 44px 赛前触控 production **76 passed / 4 个设备限定 skip / 0 failed**，正式 desktop / Pixel 7 Home 截图与 320×568 Library 实时产物目检通过。Vitest **46 文件 / 349 用例**、tsc、CF build/release verify 与 **105 tracks / 315 charts / 906 files / 497.0 MiB** 资产核验通过；未重跑同指纹完整 production 或固定性能，未改输入事件、计分、音频、Canvas、谱面或对局 rAF。 |
| **v1.9.132** | 2026-09-14 | **Home 首行按真实输入面表达可玩能力**：hero 不再统一显示 `keyboard or touch`；已连接 W3C standard 手柄时优先显示 `controller ready`，否则粗指针设备显示 `touch ready`，其余桌面显示 `keyboard + controller`，让手柄优先的欧美桌面玩家在进入对局前即可确认支持。变更前 desktop/mobile + 已连接手柄合同 **4/4 红灯**；当前 artifact `522a2a1091f0` 的 Home、First Shift、Gamepad、键盘布局、Navigation、320px 窄屏与 44px 赛前触控 production **66 passed / 2 个设备限定 skip / 0 failed**，desktop 与 320×568 的键盘/触控/手柄四种 Home 截图目检通过。Vitest **46 文件 / 349 用例**、tsc、CF build/release verify 与 **105 tracks / 315 charts / 906 files / 497.0 MiB** 资产核验通过；未重跑同指纹完整 production 或固定性能，未改输入事件、计分、音频、Canvas、谱面或对局 rAF。 |
| **v1.9.133** | 2026-09-14 | **Home 手柄承诺贯穿可玩试玩**：hero 首行检测到的同一标准手柄分配继续传入 demo 蒙版和真实 `PlayField`；试玩前明确显示 D-pad / face buttons，并说明键盘或触控仍可用，试玩开始后可直接用实际 D-pad 命中。320×568 复核同时移除会覆盖试玩按钮的装饰性 `ON AIR` slab，手柄卡、按钮和固定导航净空受 production 几何合同保护。变更前 demo 手柄提示合同 desktop/mobile **2/2 红灯**；当前 artifact `f41d9e06d7df` 的 Home 输入能力与试玩、First Shift、Gamepad、键盘布局、Navigation、320px 窄屏与 44px 赛前触控 production **68 passed / 2 个设备限定 skip / 0 failed**，真实 D-pad 命中双端通过，desktop 与 320×568 手柄试玩截图目检通过。Vitest **46 文件 / 349 用例**、tsc、CF build/release verify 与 **105 tracks / 315 charts / 906 files / 497.0 MiB** 资产核验通过；未重跑同指纹完整 production 或固定性能，未改底层输入映射、计分、音频时钟、Canvas、谱面或对局 rAF。 |
| **v1.9.134** | 2026-09-14 | **Home 试玩完成后形成正式局转化闭环**：demo 结束不再静默自动重开；独立 live summary 显示 Demo complete，有命中时显示 ACC / Grade，零命中显示 `No notes hit`，并始终明确 `Progress was not saved.`。主动作复用当前 Home 下一局的精确 href 与动作名，次动作 `Try demo again` 原地重开，试玩仍不写 First Shift、last run、PB 或榜单。变更前 desktop/mobile 结束转化合同 **2/2 红灯**；当前 artifact `a5508153875a` 的 Home 输入、试玩结束态、First Shift、Gamepad、键盘布局、Navigation、320px 窄屏与 44px 赛前触控 production **70 passed / 2 个设备限定 skip / 0 failed**，零命中、实际 D-pad 命中、原地再试和精确正式入口均双端通过，desktop 与 320×568 结束态截图目检通过。Vitest **46 文件 / 349 用例**、tsc、CF build/release verify 与 **105 tracks / 315 charts / 906 files / 497.0 MiB** 资产核验通过；未重跑同指纹完整 production 或固定性能，未改底层输入映射、正式局计分/存档、音频时钟、Canvas、谱面或对局 rAF。 |
| **v1.9.135** | 2026-09-14 | **Home 试玩成绩卡补齐标准手柄闭环**：连接手柄时显示位置中立的 `Face down · Full run` / `Face right · Retry`；底部面键进入当前 Home 精确正式局，右侧面键原地重试。结果出现以及断连/重分配后都必须先观察到两个动作键共同松开，最后一次 gameplay hit 跨结束态按住不会误跳。变更前 desktop/mobile 手柄结果动作合同 **2/2 红灯**；当前 artifact `210aaf7dfff1` 的 Home 输入与试玩闭环、First Shift、Gamepad、键盘布局、Navigation、320px 窄屏与 44px 赛前触控 production **70 passed / 2 个设备限定 skip / 0 failed**，实际面键命中、持键防误触、右侧面键重试和底部面键精确 `shift=studio` 正式入口均双端通过，desktop 与 320×568 结果控制截图目检通过。Vitest **46 文件 / 349 用例**、tsc、CF build/release verify 与 **105 tracks / 315 charts / 906 files / 497.0 MiB** 资产核验通过；未重跑同指纹完整 production 或固定性能，未改正式局输入/计分/存档、音频时钟、Canvas、谱面或对局 rAF。 |
| **v1.9.136** | 2026-09-14 | **Home→正式局手柄路径贯通至开局且不绕过音频门槛**：共享 AudioContext 已运行时，正式单人准备卡显示 `Face down · Start`，Home 成绩卡的导航按键必须释放后再按一次才开局；直接深链且音频未解锁时不接受手柄起播，按桌面/触屏显示 `Click/Tap Start once · Browser audio`，保留原生 Start 作为首次可信手势。变更前 desktop/mobile 正式局手柄启动/音频边界合同 **4/4 红灯**；当前 artifact `7e56a45d857e` 的 Home→正式局手柄链、首次音频解锁、Gamepad、Duo、输入所有权、Gameplay guidance、提前音频、全屏、production release 与赛前触控 production **121 passed / 3 个设备限定 skip / 0 failed**，两种开局状态及 fresh-press 防穿透均双端通过，desktop 与 320×568 准备卡截图目检通过。Vitest **46 文件 / 349 用例**、tsc、CF build/release verify 与 **105 tracks / 315 charts / 906 files / 497.0 MiB** 资产核验通过；未重跑同指纹完整 production 或固定性能，未改计分、音频时钟、Canvas、谱面或正式局存档。 |
| **v1.9.137** | 2026-09-14 | **正式 Results 标准手柄主动作闭环**：核心统计后显示 `Face down · {当前主动作}`，底部面键复用当前成绩页既有首要决策，而不是固定 Replay；可进入 Miss review、失败恢复、Daily / 挑战精确重试或 First Shift 下一首。Results 挂载后必须先观察到松键，最后一次 gameplay hit 持键不会穿透结算。变更前 desktop/mobile 的 Miss review、挑战与 First Shift 合同 **6/6 红灯**；当前 artifact `98fed3bef33f` 的 Results 手柄主动作、Results next move、失败恢复、Daily、挑战、First Shift 三首真实歌曲长链、Gamepad、Duo 与 Navigation production **81 passed / 1 个项目限定 skip / 0 failed**（82 项，11.7m），desktop 与 320×568 长页截图目检且无横向溢出。Vitest **46 文件 / 349 用例**、tsc、CF build/release verify 与 **105 tracks / 315 charts / 906 files / 497.0 MiB** 资产核验通过；未重跑同指纹完整 production 或固定性能，未改计分、音频时钟、Canvas、谱面或正式局存档。 |
| **v1.9.138** | 2026-09-14 | **非游戏页面补齐标准手柄空间导航**：Library、Track、Settings 等内容页使用 D-pad 在可见控件间按几何方向移动，长按可重复；底部面键激活焦点项，右侧面键优先触发页面显式返回入口、否则回 Home，Track 的筛选后 Library `returnTo` 不丢失。聚焦 range/number/select 时左右方向直接调值；首次连接、换路由或重分配先经过 neutral frame，避免持键穿透。显示短时、位置中立的 Controller 提示和强焦点环；320×568 提示不溢出且位于固定 Play 栏上方。Home、Play、Duo、Results、Calibration 继续由各自专用输入层拥有，不参与站点导航，避免与试玩、判定、结果动作和音频可信手势冲突。变更前定向 E2E desktop/mobile **6/6 红灯**且空间导航模块缺失；当前 artifact `e1b68e145025` 的相邻 production 回归 **116 passed / 8 个设备或项目限定 skip / 0 failed**（124 项，3.1m），Vitest **47 文件 / 352 用例**、tsc、CF build 与 **105 tracks / 315 charts / 906 files / 497.1 MiB** 资产构建通过。未重跑同指纹完整 446 项 production 或固定性能；未改计分、音频时钟、Canvas、谱面或正式局存档。 |
| **v1.9.139** | 2026-09-14 | **Calibration 使用真实手柄输入并修复短屏操作面**：第一只 W3C standard 控制器可在 8-pulse 测试中以 D-pad 或 face diamond 的 fresh press 记录实际设备延迟，键盘与触控仍并行；进入测试前已持住的按钮必须先全部释放，不能成为伪样本。首次音频解锁仍要求原生 Click/Tap，不用 Gamepad polling 绕过浏览器可信手势。连接时赛前显示 Controller ready；结果页以 bottom face 执行当前主动作、right face 执行重试/保留等次动作，并在最后一次采样后再次要求 neutral。320×568 原布局把 Start 底边推到 **666.5px**、超过固定导航安全线 **496px**，进行态四轨和结果主动作也被站点 chrome 遮挡；现赛前按“事实 → Controller → Start → 设备说明”排序，Start 完整位于导航上方，采样及结果期间保持专注布局，收起全局页头/导航、完整展示四轨、Cancel、结果提示与动作，离开后恢复。变更前控制器合同 desktop/mobile **2/2 红灯**，短屏专注、结果动作与结果短屏合同各 **1/1 红灯**；当前 artifact `dd6b2a762915` 的 Calibration、Gamepad、Navigation、Settings、320px 与触控目标 production **65 passed / 1 个项目限定 skip / 0 failed**（66 项，2.5m），Vitest **47 文件 / 352 用例**、tsc、CF build/release verify 与 **105 tracks / 315 charts / 906 files / 497.1 MiB** 通过。未重跑同指纹完整 446 项 production 或固定性能；未改 offset 算法、音频时钟、计分、Canvas 或谱面。 |
| **v1.9.140** | 2026-09-14 | **暂停、快速控制与退出确认形成完整标准手柄闭环**：单人 `Scape paused`、共享 `Duo paused` 与顶层 `Leave the Scape?` 统一显示位置中立的 Controller 图例。D-pad 上下按稳定 DOM 顺序移动，左右在 range/number/select 上调值、其余控件按几何移动；bottom face 激活焦点，right face 返回仍冻结的游戏或执行 Keep playing。Duo 任一已分配控制器都可操作共享菜单，但同帧只接收一个动作；每次 modal 交接、断连或重分配后先等待所有相关方向/动作键 neutral，暂停前的最后一个 lane/select 持键不得穿透成重开或离开。320×568 的单人暂停从场地内层提升为 100dvh 专注 modal，Resume、Restart、Leave 与完整图例首屏可见，Quick controls 折叠后仍可由手柄展开、调节与切换。当前 artifact `5f50b641a6e3` 的单人/Duo 开局与暂停、退出冻结/恢复、Gamepad、站点导航、快捷键隔离、Quick controls 与 320px 回归 desktop/mobile **80 passed / 0 failed**（4.2m）；Vitest **47 文件 / 352 用例**、tsc、CF build/release prepare 与 **105 tracks / 315 charts / 906 files / 497.1 MiB** 通过，桌面及 320×568 单人/Duo 暂停、退出截图目检通过。未重跑同指纹完整 446 项 production 或固定性能；未改判定、计分、AudioContext 时钟、Canvas 或谱面。 |
| **v1.9.141** | 2026-09-14 | **Duo 标准手柄贯通准备、结算与重赛循环**：共享 AudioContext 已运行时，P1/P2 任一已分配控制器可在 `Duel ready` 以 fresh bottom-face press 启动；首次音频尚未解锁时仍只接受原生 Click/Tap Start，Gamepad polling 不绕过浏览器可信手势。结算层默认 Rematch，任一控制器可用 D-pad 移动、bottom face 选择、right face 退出；从结算按住动作键进入重赛准备层时必须先回 neutral，不能自动二次开局。320×568 准备层使用 `Top/Bottom · Pad 1/2 · 4 lanes` 的短文案，Start 与控制器动作提示完整位于固定导航上方；结算统计、Rematch/Exit 与图例同样完整位于视口。当前 artifact `22eb6217bc9a` 的 Duo 开局/音频边界/结算/重赛、单人/Duo 暂停、退出冻结/恢复、Gamepad、键盘座位语义、Quick controls 与 320px 回归 desktop/mobile **69 passed / 1 个项目限定 skip / 0 failed**（70 项，3.9m）；Vitest **47 文件 / 352 用例**、tsc、CF build/release verify 与 **105 tracks / 315 charts / 906 files / 497.1 MiB** 通过，桌面及 320×568 Duo 准备、结算和重赛截图目检通过。未重跑同指纹完整 446 项 production 或固定性能；未改判定、计分、AudioContext 时钟、Canvas 或谱面。 |
| **v1.9.142** | 2026-09-14 | **正式 Results 从单一快捷键升级为完整标准手柄导航**：核心统计后的 Controller 提示明确 D-pad 移动、bottom face 选择、right face 返回 Track，并继续显示由本局上下文决定的默认动作。未移动焦点时 bottom face 仍执行 Miss review、失败恢复、Daily/挑战精确重试或 First Shift 下一首；一旦用 D-pad 导航，则可遍历分享、剧情、Run details、Miss review、Practice、Replay/Change setup、Library/Home 与完整曲目等全部可见控件，并自动滚动保持焦点可见。right face 回到当前曲目且保留精确 Library `returnTo`；缺成绩时回 Home。页面挂载仍先等待 neutral，最后一次 gameplay hit 不穿透。手机隐藏的 Daily/挑战卡内重复主 CTA 仍可作为 bottom-face 默认动作，D-pad 只聚焦实际可见控件；320×568 四行图例无横向溢出。当前 artifact `9fb5db9ba30c` 的 Results、分享、Daily、挑战、First Shift 三首真实歌曲、移动固定栏、单人/Duo Gamepad/退出、Calibration 与站点导航 desktop/mobile **118 passed / 2 个项目限定 skip / 0 failed**（120 项，14.2m）；Vitest **47 文件 / 352 用例**、tsc、CF build/release verify 与 **105 tracks / 315 charts / 906 files / 497.1 MiB** 通过，桌面与 320×568 Results 长页及聚焦态截图目检通过。未重跑同指纹完整 446 项 production 或固定性能；未改判定、计分、音频、Canvas 或谱面。 |
| **v1.9.143** | 2026-09-14 | **触觉反馈从触屏扩展到标准手柄**：Settings 的 Haptics 成为桌面与手机均可预先关闭的跨设备开关；支持 `Gamepad.vibrationActuator` 的已分配 W3C standard 手柄在命中、Miss、Slide 锁定/合法重抓、SIGNAL 升档与 Combo 里程碑收到短促 `dual-rumble`。命中偏高频且轻，Miss 偏低频、持续更久；Duo 按手柄 index 独立节流，不会因 P1 反馈吞掉 P2。设备/浏览器无能力、效果不支持、页面隐藏导致拒绝或同步异常均静默降级，Promise 不进入判定热路径。当前 artifact `f56374a9288b` 的 Haptics、标准手柄输入/站点导航、Settings 保存、单人暂停、Duo 启动及 Slide 锁定/重抓相邻 production 为 **64 passed / 2 个设备或项目限定 skip / 0 failed**（66 项，3.6m）；Vitest **48 文件 / 356 用例**、PRD **8/8**、tsc、CF build/release verify 与 **105 tracks / 315 charts / 906 files / 497.1 MiB** 通过，320×568 Settings 全页截图目检无溢出。未做实体手柄触感主观评价，未重跑同指纹完整 production 或固定性能；未改判定、计分、音频时钟、Canvas 绘制或谱面。 |
| **v1.9.144** | 2026-09-14 | **标准手柄菜单补齐左摇杆导航，同时隔离 gameplay 判定**：站点内容页、单人/Duo 暂停与退出、Duo 结算及正式 Results 均接受 D-pad 或左摇杆移动；摇杆使用 0.65 死区、对角输入取主轴且同幅时优先纵向，实体 D-pad 同帧优先。两种方向输入共用既有 neutral-first、长按重复、焦点可见与调值合同；提示统一为 `D-pad / stick · Move`。正式打歌四道和 Calibration 时序采样仍只接受 D-pad / face，不把模拟漂移变成判定。当前 artifact `aad608736d7c` 的站点导航、Results、标准手柄 gameplay、Home demo、Duo 启动/暂停、单人暂停与退出冻结/恢复 desktop/mobile 相邻 production 为 **68 passed / 0 failed**（3.6m）；Vitest **48 文件 / 358 用例**、PRD **8/8**、tsc、CF build/release verify 与 **105 tracks / 315 charts / 906 files / 497.1 MiB** 通过，桌面及 320×568 Track/Results 提示截图目检无溢出或固定导航遮挡。未重跑同指纹完整 446 项 production 或固定性能，未做实体摇杆主观验收；未改判定、计分、音频时钟、Canvas、谱面或 Calibration 输入合同。 |
| **v1.9.145** | 2026-09-15 | **全站键盘首次进入与 SPA 换页焦点闭环**：每个 Layout 页面在重复导航前提供 `Skip to main content`，默认移出画布，首次 Tab 时以高对比 44px 入口显示在 safe area 内，Enter 聚焦静态 `#main-content`。首次文档载入不再强制抢焦点；站内路径变化仍滚回顶部并聚焦新主内容，让键盘与读屏用户获得换页反馈。桌面主导航补 `Primary` landmark；Skip 不进入标准手柄空间导航目标。当前 artifact `b1de49b14b86` 的导航、左摇杆、Back/退出保护、Calibration、单人/Duo 开局暂停、键盘快捷键隔离、Results、Settings、Track 配置与 44px 赛前控件 desktop/mobile 相邻 production 为 **139 passed / 5 个设备限定 skip / 0 failed**（144 项，5.1m）；Vitest **48 文件 / 358 用例**、tsc、CF build 与 **105 tracks / 315 charts / 906 files / 497.1 MiB** 通过，真实桌面首 Tab/Enter 状态目检通过。未重跑同指纹完整 446 项 production 或固定性能；未改 gameplay 输入、判定、计分、音频、Canvas 或谱面。 |
| **v1.9.146** | 2026-09-15 | **懒加载页面按真实导航意图提前取包**：Track、Duo、Characters、Radio、First Shift、Calibration、Settings、Local Board、Profile 与 Legal 统一复用可重试 route loader；桌面指针进入、键盘/手柄聚焦或触屏按下站内链接时即开始加载目标 chunk，不再等 SPA click 后才发请求。并发/重复意图共享同一请求，预取失败静默释放缓存，正式导航仍可重试并复用原有 loading / `Still connecting` / `Signal lost` 恢复链；Home、Library、Play 与 Results 等 eager 页面不额外取包。当前 artifact `c8432f95c50e` 的意图预加载、稳定 Layout、canonical/旧深链、modified click、移动导航、浏览器 Back、站点手柄导航与键盘快捷键隔离 desktop/mobile 相邻 production 为 **39 passed / 1 个项目限定 skip / 0 failed**（40 项，1.1m）；Vitest **49 文件 / 360 用例**、tsc、CF build/release verify 与 **105 tracks / 315 charts / 906 files / 497.1 MiB** 通过。主 JS 为 **396.00 kB / 128.35 kB gzip**；未重跑同指纹完整 446 项 production 或固定性能，未改 gameplay 输入、判定、计分、音频、Canvas 或谱面。 |
| **v1.9.147** | 2026-09-15 | **社交分享直达 Track 消除路由代码瀑布**：105 个静态曲目发现页在发布准备时解析实际 hashed `Track-*.js`，于 HTML head 写入唯一 `modulepreload`；浏览器无需等待 396 kB 主入口下载、解析和 React 路由执行，就能并行请求 22.16 kB Track chunk。发布器要求恰好一个 Track chunk，缺失或歧义立即阻止候选；静态页面校验绑定精确文件。production 时序合同故意挂起主入口，桌面与 Pixel 7 模拟均先观察到 Track 请求，恢复后只请求一次。当前 artifact `a3279b0f5e83` 的静态元数据/时序、导航意图、canonical/旧深链、PWA 安装/升级、离线开局与网络变化稳定性 desktop/mobile 为 **34/34 passed**；发布器 **17/17**、Vitest **49 文件 / 360 用例**、PRD **8/8**、tsc、CF build/release verify 与 **105 tracks / 315 charts / 906 files / 497.1 MiB** 通过。未重跑同指纹完整 446 项 production 或固定性能；未改应用运行时、gameplay 输入、判定、计分、音频、Canvas 或谱面。 |
| **v1.9.148** | 2026-09-15 | **所有懒路由直达首载消除主入口依赖瀑布**：发布 HTML 的轻量 pathname bootstrap 按当前/旧 `/beatscape/*` 路径只预取所需 hashed chunk，覆盖 Track、Duo、Characters、Radio、First Shift、Calibration、Settings、Local Board、Profile、Legal 与 NotFound；Home、Library、Play、Results 不额外下载懒包。105 个静态 Track 页继续用声明式唯一 preload，并移除重复 bootstrap 字节。发布器要求所有映射各自恰好一个 chunk，失败即阻止候选。production 故意挂起主入口后，Track 与 Duo 在桌面/Pixel 7 均先发请求、React 接管后仍各一次；5xx 后 Reload 可恢复，4.5 秒慢包继续显示安全出口。当前 artifact `0a171f04d943` 的直达时序、early audio、导航、慢/失败恢复、PWA 安装/升级、离线开局与网络变化稳定性 **54/54 passed**；发布器 **18/18**、Vitest **49 文件 / 360 用例**、PRD **8/8**、tsc、CF build/release verify 与 **105 tracks / 315 charts / 906 files / 497.1 MiB** 通过。未重跑同指纹完整 446 项 production 或固定性能；未改 gameplay 输入、判定、计分、音频、Canvas 或谱面。 |
| **v1.9.149** | 2026-09-15 | **主线程排队不再把准点 DOM 输入误判为 Late**：键盘与 pointer 的 `Event.timeStamp` 归一到当前 performance 时间轴，使用权威 WebAudio 歌曲时钟按“事件年龄 × 当前播放倍率”回投到物理输入时刻，再应用用户/谱面 offset；Tap、Hold 头尾与 pointer 滑道共用同一时间真值。最多补偿 250ms，异常、过旧或未来时间戳回退为当前时刻；本阶段 Gamepad 仍使用每帧快照。旧 artifact 中人为排队 65ms 的准点输入在桌面键盘和手机触控均降为 Good（100 分），新 artifact `0be8e2395316` 的 Tap 与 Hold 头尾 **4/4** 恢复 Perfect。输入、计分、暂停恢复、Slide、手柄与速度相邻 production **65 passed / 3 个项目限定 skip / 0 failed**（68 项）；发布器 **18/18**、Vitest **50 文件 / 365 用例**、PRD **8/8**、tsc、CF build/release verify 与 **105 tracks / 315 charts / 906 files / 497.1 MiB** 通过。未重跑同指纹完整 446 项 production 或固定性能；未改判定窗、计分规则、音频播放、Canvas 或谱面。 |
| **v1.9.150** | 2026-09-15 | **标准手柄消除 animation-frame 轮询延迟降档**：单人、Home demo 与 Duo 的 W3C standard Gamepad 仍逐帧读取最新状态，但 press/release 边沿改用 `Gamepad.timestamp` 记录的浏览器硬件更新时间，将 WebAudio 歌曲时钟回投到该输入更新时刻。时间戳与 DOM 输入共用 250ms 有界校验；0、NaN、过旧、未来或浏览器不支持时安全回退当前 rAF，不猜测硬件时间。旧 artifact `0be8e2395316` 中，准点硬件更新后让主线程延后 32ms 轮询，桌面/手机均被判 Good（100 分）；新 artifact `41c9d17f4962` 的 Tap 与 Hold 头尾 **4/4** 恢复 Perfect。完整 Gamepad 闭环 **12/12**，相邻输入/计分/暂停恢复/Slide/触觉/快捷键 production **56 passed / 4 个设备限定 skip / 0 failed**（60 项）；合计 **68 passed / 4 skip / 0 failed**（72 项）。Vitest **50 文件 / 365 用例**、发布器 **18/18**、PRD **8/8**、tsc、CF build/release verify 与 **105 tracks / 315 charts / 906 files / 497.1 MiB** 通过。未重跑同指纹完整 production 或固定性能，未做实体手柄主观评价；未改判定窗、计分规则、音频播放、Canvas 或谱面。 |
| **v1.9.151** | 2026-09-15 | **Gamepad 输入与自动 Miss 收口到同一权威游戏帧**：旧实现的 Gamepad poll 与 Canvas/session 各自维护 rAF，后注册的输入轮询可能在同一恢复帧输给 `session.tick()`；即使硬件时间戳仍在 250ms 可信范围，音符也会先被不可逆地自动结算为 Miss。现 renderer 每帧先调用 Gamepad sampler，再读取 WebAudio 时钟并推进自动判定；同时删除独立手柄 rAF，不放宽窗口、不回滚已结算状态。旧 artifact `41c9d17f4962` 在准点更新后排队 65ms 时 desktop/mobile **2/2** 先记 Miss；新 artifact `32368482f982` 的 65ms Tap 与 85ms Hold 头尾 **4/4** 均为 Perfect，全部 queued Gamepad 合同 **6/6**。完整 Gamepad 闭环 **14/14**，相邻 DOM 输入/所有权/计分/暂停/Slide/触觉 production **43 passed / 3 个设备限定 skip / 0 failed**（46 项），合计 **57 passed / 3 skip / 0 failed**（60 项）。Vitest **50 文件 / 365 用例**、发布器 **18/18**、性能规则 **51/51**、PRD **8/8**、tsc、CF build/release verify 与 **105 tracks / 315 charts / 906 files / 497.1 MiB** 通过。未重跑完整 production 或固定性能采样，未做实体手柄主观评价；未改判定窗、计分规则、音频播放、Canvas draw 或谱面。 |
| **v1.9.152** | 2026-09-15 | **手机实战 HUD 让出谱面来路**：≤520px 竖屏将单人表现卡从旧版约三分之一场宽收为不超过 30%、高度不超过 72px，并同步压缩 Score、ACC、进度、PB/GOAL 差值与 Arcade HP 的字阶/间距；SIGNAL 与 44px Pause 对齐更紧凑的顶部安全区。320px 的 `PB −924K` 仍完整可读；First Shift `Find the line` 救援提示沿用同一左上锚点，但允许最多 36% 宽以保留可读指令。旧 artifact `32368482f982` 的 Pixel 7 表现卡占场宽 **33.4%**，新 artifact `7b56880330e7` 收至 **≤30%**。HUD / 新手引导 production **23 passed / 1 个设备限定 skip / 0 failed**（24 项）；未改输入、判定、计分、音频、Canvas draw 或谱面。 |
| **v1.9.153** | 2026-09-15 | **手机 Results 固定主动作复用个性化教练决策**：普通结算的固定中间动作不再一律覆盖成 Replay / Retry，而与页面 `Next move` 共用同一 `buildRunCoach` 决策和最近对局历史；Miss 聚类显示 `Review` 并展开、聚焦 Miss review，失败局显示 `Casual`，晋级显示 `Arcade` / 对应 tier，连续偏差显示 `Calibrate`，精确重玩仍显示 Replay。Daily、好友挑战、First Shift 与分段 Practice 继续保留更高优先级的专用动作，Library 返回状态贯穿所有链接。旧 artifact `7b56880330e7` 在四类个性化状态下仍显示通用 Replay / Retry，新增合同先得到 **5 failed / 3 passed**；artifact `4e1c7ea1b90e` 的 Results、留存、导航、挑战、练习和标准手柄相邻 production 为 **58 passed / 2 个项目限定 skip / 0 failed**（60 项）。未改 gameplay 输入、判定、计分、音频、Canvas draw 或谱面。 |
| **v1.9.154** | 2026-09-15 | **回流玩家的首局与故事身份不再互相矛盾**：真正没有完整历史的新玩家继续看到 `Start first run`；已有完整对局但 First Shift 尚为 0/3 的玩家改看 `Start First Shift`，桌面 Hero、Home demo 交接与手机固定 Start 共用同一文案和精确故事 URL。仍处于 Echo Novice 的回流玩家在 Profile 改看 `First run complete — keep building your signal.`，下一段目标继续由独立 Beat Player 进度卡说明，不再重复要求已经完成的首局。旧 artifact `4e1c7ea1b90e` 的 Home / Profile desktop/mobile 新合同 **4/4 failed**，单元合同 **1 failed / 10 passed**；artifact `9fd0a87d0a3f` 的定向合同 **4/4 passed**、Home / Profile / Daily / 首局留存 / 剧情 / 移动导航相邻 production **64 passed / 2 个项目限定 skip / 0 failed**（66 项，含双端三首真实剧情全链）。未改 First Shift 进度规则、段位门槛、存档格式、gameplay、音频或谱面。 |
| **v1.9.155** | 2026-09-15 | **Arcade HP 扣除获得即时因果反馈**：左上 HP 条在真实余量下降时短暂显示精确 `−N`，让玩家把当前 Miss、断连红闪与生存损失直接对应；20Hz HUD 若在一帧采到多个扣血对象会显示真实聚合差值，因而 Hold 尾 Miss 为 `−5`、整条 Hold 未起按为 `−12`，不伪造单次常量。初始采样、HP 回升、Casual 与 Practice 均不显示扣血徽标。artifact `e653aedba109` 的 HP / HUD / Arcade 失败 / 判定计分 / 新手与 Practice 引导相邻 production **41 passed / 3 个项目限定 skip / 0 failed**（44 项）；Vitest **50 文件 / 367 用例**、发布器 **18/18**、性能规则 **51/51**、PRD **8/8**、tsc、CF build/release verify 与 **105 tracks / 315 charts / 906 files / 497.1 MiB** 通过，桌面及 320×568 扣血态截图目检通过。未重跑完整 production 或固定性能采样；未改 HP 数值、判定、计分、音频、Canvas draw 或谱面。 |
| **v1.9.156** | 2026-09-15 | **Hold 尾判失败明确说明松早还是松晚**：主动提前松开在 `MISS` 下显示 `EARLY RELEASE`，主动延后松开或持续按过尾点显示 `LATE RELEASE`；成功但有可读偏差的尾判沿用同一 release 语义。整条 Hold 从未起按仍只显示 `MISS`，不把未发生的动作伪装成松晚。直接输入与自动尾超时 FX 均保留尾判来源；320px 外轨的长文案单独约束在 Canvas 内，星爆和主判定继续锚定真实道位。artifact `09646d967981` 的 Hold / 输入时序 / 判定计分 / HUD / Arcade 失败 / 新手与 Practice 引导相邻 production **49 passed / 3 个项目限定 skip / 0 failed**（52 项）；Vitest **51 文件 / 371 用例**、发布器 **18/18**、性能规则 **51/51**、PRD **8/8**、tsc、CF build/release verify 与 **105 tracks / 315 charts / 906 files / 497.1 MiB** 通过，桌面及 320×568 外轨提示截图目检通过。未重跑完整 production 或固定性能采样；未改判定窗、HP、计分、音频或谱面。 |
| **v1.9.157** | 2026-09-15 | **Slide 失败从泛化 Miss 升级为可执行纠错**：起点已命中但从未到达目标道时显示 `REACH TARGET`；曾提前到达目标道、随后在尾点前离开时显示 `HOLD TO END`；整条未起步仍只显示 `MISS`。运行态只多记录“目标曾到达”这一非计分事实，整条 Slide 继续只结算一个判定对象；长副标签沿用窄屏 Canvas 边界约束，不移动星爆与主判定。artifact `b46f0deb65ab` 的 Slide / Hold production **22/22 passed**，其中 Slide 桌面、手机、320×568、真实滑动、提前锁定、暂停重抓、触觉开关与 Duo **16/16 passed**；Vitest **51 文件 / 372 用例**、发布器 **18/18**、性能规则 **51/51**、PRD **8/8**、tsc、CF build/release verify 与 **105 tracks / 315 charts / 906 files / 497.1 MiB** 通过。未重跑完整 production 或固定性能采样；未改判定窗、HP、计分、音频行为或谱面。 |
| **v1.9.158** | 2026-09-15 | **Chord 获得可识别的组关系与辅助透明度**：同一 Chord 的多道菱形由黑色外框 + 米白内芯的静态连接轨串成一个同时输入对象，不再与两个碰巧同拍的 Tap 混淆；部分命中时连接轨保留并按剩余输入轻微降权。触屏同手 Chord assist 自动补成 Great 时显示 `ASSIST`，且判定组保持目标道居中，不再把提交补判所用的超时帧误画成玩家 `LATE`。连接轨热路径使用常量级无数组分配扫描。artifact `05ed509aad3e` 的 Chord / 判定反馈 production **10 passed / 2 个触屏项目限定 skip / 0 failed**（12 项），其中桌面与 320×568 Chord 连接轨及按道位 ASSIST 合同 **2/2 passed**；Vitest **51 文件 / 373 用例**、发布器 **18/18**、性能规则 **51/51**、PRD **8/8**、tsc、CF build/release verify 与 **105 tracks / 315 charts / 906 files / 497.1 MiB** 通过，桌面与 320×568 连接轨截图目检通过。未重跑完整 production 或固定性能采样；未改判定窗、Chord assist 得分、HP、音频行为或谱面。 |
| **v1.9.159** | 2026-09-15 | **Combo 断裂获得明确、无歧义的现场解释**：已有 Combo 被 Good 或 Miss 归零时，场中央稳定显示 520ms `COMBO BREAK`，与既有红色暗角和专用音效形成视觉、听觉闭环；同帧撤销尚未结束的 Combo 里程碑庆祝，避免断连后仍显示旧连击奖励。提示只做原位淡出，在 Reduce Motion 下仍保留，不改变判定、计分、HP、输入或谱面。artifact `a0940b605660` 的完整判定反馈 production **10 passed / 2 个桌面触屏限定 skip / 0 failed**（12 项），并在确切候选上复验新增断连合同 desktop/mobile **2/2 passed**；Vitest **51 文件 / 373 用例**、发布器 **18/18**、性能规则 **51/51**、PRD **8/8**、tsc、CF build/release verify 与 **105 tracks / 315 charts / 906 files / 497.1 MiB** 通过，桌面与 320×568 断连截图目检通过。未重跑完整 production 或固定性能采样。 |
| **v1.9.160** | 2026-09-15 | **曲目详情试听从 48 秒资产收敛为明确的 15 秒决策窗口**：Track 页不再把完整 `preview_48s.m4a` 当成一次试听，而只暴露 0–15 秒相对时间轴；进度条、键盘 Home/End 与到点停止均服从该窗口，游戏切片、完整流媒体版和 Library 卡片行为不变。旧 artifact `a0940b605660` 的新增合同 desktop/mobile **2/2 failed**，均实际显示 `0:00 / 0:48`；artifact `820fd7b3c503` 在确切候选上 **2/2 passed**。试听与 Track 配置相邻 production **21 passed / 3 个视口限定 skip / 0 failed**（24 项）；Vitest **51 文件 / 373 用例**、发布器 **18/18**、性能规则 **51/51**、PRD **8/8**、tsc、CF build/release verify 与 **105 tracks / 315 charts / 906 files / 497.1 MiB** 通过，桌面与 Pixel 7 试听终点截图目检无溢出或固定 Play 遮挡。未重跑完整 production 或固定性能采样；未改游戏音频、谱面、判定、计分或对局加载。 |
| **v1.9.161** | 2026-09-15 | **同帧恢复不再吞掉真实 Combo 断裂**：判定状态机新增单调递增的断连事件序号；渲染层消费事件，而不是用一帧处理完后的最终 Combo 是否为 0 反推。因而 Good/Miss 打断 Combo 后，即使同一 rAF 内另一道立刻 Perfect 并把最终 Combo 恢复到 1，仍显示且只显示一次 `COMBO BREAK`。旧 artifact `820fd7b3c503` 在同时出现 `GOOD +100` 与恢复命中的 `PERFECT +300` 时，新增合同 desktop/mobile **2/2 failed**；artifact `d14041fd3c9e` 在确切候选上 **2/2 passed**。完整判定反馈 production **12 passed / 2 个桌面触屏限定 skip / 0 failed**（14 项）；Vitest **51 文件 / 374 用例**、发布器 **18/18**、性能规则 **51/51**、PRD **8/8**、tsc、CF build/release verify 与 **105 tracks / 315 charts / 906 files / 497.1 MiB** 通过，桌面与 320×568 同帧双判定截图目检通过。未重跑完整 production 或固定性能采样；未改判定窗、得分、Combo 数值、HP、音频行为或谱面。 |
| **v1.9.162** | 2026-09-15 | **同帧 Chord 不再跳过跨越的 Combo 里程碑**：里程碑触发由“帧末 Combo 恰好等于阈值”改为检测上一帧与当前帧之间跨过的最高阈值，因此两道 Chord 将 Combo 从 9 直接推进到 11 时仍显示并触发 `10 COMBO!`；若同帧发生真实断连，`COMBO BREAK` 继续优先，避免庆祝与失败并存。新建 chart/session 时同步归零渲染基线，防止换谱沿用旧 Combo。旧 artifact `d14041fd3c9e` 的实际精灵绘制合同 desktop/mobile **2/2 failed**；artifact `62a3c187bf71` 在确切候选上 **2/2 passed**。完整判定反馈 production **14 passed / 2 个桌面触屏限定 skip / 0 failed**（16 项）；Vitest **52 文件 / 378 用例**、发布器 **18/18**、性能规则 **51/51**、PRD **8/8**、tsc、CF build/release verify 与 **105 tracks / 315 charts / 906 files / 497.1 MiB** 通过，桌面与 320×568 的 11 Combo / `10 COMBO!` 同屏截图目检通过。未重跑完整 production 或固定性能采样；未改判定窗、得分、Combo 数值、HP、音频行为或谱面。 |
| **v1.9.163** | 2026-09-15 | **窄屏外轨判定主文案不再被画布裁切**：`PERFECT / GREAT / GOOD / MISS` 将真实字体宽度、黑色描边、当前弹出缩放和本帧震屏位移一并纳入边界约束；最右道 Late、最左道 Early 只在即将越界时把文字组向内收，星爆、道位与得分浮字继续锚定真实 lane。四种主词宽度首次测量后缓存，Anton 字体加载完成时失效重测，不把 `measureText` 留在逐帧热路径。旧 artifact `62a3c187bf71` 的新合同 desktop **passed**、320×568 mobile **failed**，实测最右边界 **614.33 / 596px**；artifact `2cc910a6d4cc` 在确切候选上 desktop/mobile **2/2 passed**。完整判定反馈 production **16 passed / 2 个桌面触屏限定 skip / 0 failed**（18 项），Hold / Slide / Chord 相邻 production **24/24 passed**；Vitest **52 文件 / 380 用例**、发布器 **18/18**、性能规则 **51/51**、PRD **8/8**、tsc、CF build/release verify 与 **105 tracks / 315 charts / 906 files / 497.1 MiB** 通过，桌面与 320×568 截图目检通过。未重跑完整 production 或固定性能采样；未改输入、判定窗、得分、Combo、HP、音频行为或谱面。 |
| **v1.9.164** | 2026-09-15 | **窄屏 Chord 判定从文字墙收敛为单一组摘要**：Chord 各 lane 继续独立判定、计分并保留各自星爆与 `+分数`，主判定词等整组结算后只显示一次，并以组内最差档位居中于整个和弦跨度；同档位取绝对时差最大者决定 EARLY/LATE。Thumb chord assist 产生组级 `GREAT` 时，主词仍按组居中，`ASSIST` 副标签继续锚定真实补判道。旧 artifact `2cc910a6d4cc` 的三键合同 desktop **passed**、320×568 mobile **failed**，手机三枚 `PERFECT` 发生 **2268.96 px²** 重叠；artifact `d6469dde3924` 的组摘要与 ASSIST 双端精确合同 **4/4 passed**，完整判定反馈 **18 passed / 2 个桌面触屏限定 skip / 0 failed**（20 项）。Vitest **52 文件 / 381 用例**、发布器 **18/18**、性能规则 **51/51**、PRD **8/8**、tsc、CF build/release verify 与 **105 tracks / 315 charts / 906 files / 497.1 MiB** 通过，桌面与 320×568 截图目检通过。未重跑完整 production 或固定性能采样；未改输入、判定窗、逐道得分、Combo、HP、音频行为或谱面。 |
| **v1.9.165** | 2026-09-15 | **中央 Combo 退到来音之后，连续读谱不再被战绩数字遮挡**：持续 Combo 数字保留原位置、尺寸、颜色与升温节奏，但在 Canvas 中先于音符和 Chord 连接轨绘制；320px 中央两道与两/三位 Combo 的包围盒相交时，来音始终后绘并完整压回数字。旧 artifact `d6469dde3924` 的真实包围盒/绘制顺序合同 desktop/mobile **2/2 failed**，均由 Combo 最后覆盖；artifact `8e74bf12face` 在确切候选上 **2/2 passed**。完整判定反馈、HUD、Duo、实体键位与新手/Practice 引导相邻 production **48 passed / 4 个设备限定 skip / 0 failed**（52 项），其中完整判定反馈 **20 passed / 2 个桌面触屏限定 skip / 0 failed**（22 项）。Vitest **52 文件 / 381 用例**、发布器 **18/18**、性能规则 **51/51**、PRD **8/8**、tsc、CF build/release verify 与 **105 tracks / 315 charts / 906 files / 497.1 MiB** 通过。未重跑完整 production 或固定性能采样；未改 Combo 数值、判定、输入、得分、HP、音频行为或谱面。 |
| **v1.9.166** | 2026-09-15 | **开局倒计时退到预滚来音之后，玩家可先读下一拍**：`3 / 2 / 1 / GO` 保留 3 秒负时间预滚、96px Anton、位置、颜色、描边、音效和时序，但在 Canvas 中先于预滚音符与 Chord 连接轨绘制；两者真实包围盒在中央相交时，来音后绘并保持输入目标的最高阅读优先级。旧 artifact `8e74bf12face` 的倒计时包围盒/绘制顺序合同 desktop/mobile **2/2 failed**，均由倒计时最后覆盖；artifact `2667bdfcace9` 在确切候选上 **2/2 passed**，并与 Combo 层级合同合并复验 **4/4 passed**。判定、首局引导、键位、输入归属、退出/恢复、Slide 与 Duo 相邻 production **88 passed / 4 个设备限定 skip / 0 failed**（92 项），其中完整判定反馈 **22 passed / 2 个桌面触屏限定 skip / 0 failed**（24 项）。Vitest **52 文件 / 381 用例**、发布器 **18/18**、性能规则 **51/51**、PRD **8/8**、tsc 与 CF build/release verify 通过。未重跑完整 production 或固定性能采样；未改倒计时内容、时长、音效、歌曲时钟、判定、输入、得分、HP 或谱面。 |
| **v1.9.167** | 2026-09-15 | **真实首局先教会再允许开始，熟练入口继续快速开局**：尚未完成的 First Shift `studio` 首关把当前输入面的四轨/键位提示、击打时机、Note speed 与本谱 `Chart moves` 放在 `Start playing` 之前；玩家先看到 `Hold` 的按住/松开规则，再主动开始。普通 Casual、Arcade、Practice、Daily、挑战和已完成节点的重玩继续保持 CTA 在机制说明之前，不向所有玩家重复施加新手摩擦。320×568 上教学和 CTA 同时位于首屏，按钮保持单行且 ≥44px。旧 artifact `2667bdfcace9` 的真实 DOM/视觉顺序合同 desktop/mobile **2/2 failed**；artifact `6aaa5b4f82f9` 在确切候选上 **2/2 passed**，320px 移动合同 **1/1 passed**。首局留存、Home 入口、正式引导与三首真实 First Shift 全链相邻 production **56 passed / 2 个设备限定 skip / 0 failed**（58 项，10.6m）；上一轮 Combo/倒计时可读性合同在当前产物复验 **4/4 passed**。Vitest **52 文件 / 381 用例**、发布器 **18/18**、性能规则 **51/51**、PRD **8/8**、tsc 与 CF build/release verify 通过。未重跑完整 production 或固定性能采样；未改一般开局顺序、音频、倒计时、判定、输入、计分、HP、剧情进度或谱面。 |
| **v1.9.168** | 2026-09-15 | **主流手机顶栏收回 Fullscreen 文字占位，保住曲名与模式身份**：手动全屏 fallback 不再只在 ≤340px 图标化；341–520px 的单人和 Duo 同样显示标准四角图标，按钮本体保持 44×44px、`aria-label="Fullscreen"` 与功能不变。平板及更宽触屏继续显示文字，不牺牲可发现性。旧 artifact `6aaa5b4f82f9` 的 Pixel 7 单人/Duo 组合合同 **1/1 failed**，实际仍显示文字；artifact `da627e6ed87c` 在确切候选上 **1/1 passed**。全屏事务、音频拒绝恢复、单人/Duo 开局、320px、667×375、844×390 与旋转暂停相邻 production **52 passed / 2 个触屏限定 skip / 0 failed**（54 项，1.0m）。Vitest **52 文件 / 381 用例**、发布器 **18/18**、性能规则 **51/51**、PRD **8/8**、tsc 与 CF build/release verify 通过，Pixel 7 Duo 截图目检曲名、模式与图标完整。未重跑完整 production 或固定性能采样；未改全屏能力、自动请求、音频、判定、输入、计分、HP 或谱面。 |
| **v1.9.169** | 2026-09-15 | **Miss 聚类复盘紧跟教练动作，不再跨过分享与剧情**：普通 Results 仅在 `Next move` 选择 Review 时，把仍默认折叠的 `Miss review` 前移到教练卡正下方；展开后分道图、最忙分段 Practice 与明细就地出现，Share、The Late Static 回信和底层 telemetry 随后排列。其他建议、Daily、挑战、First Shift 与分段 Practice 的结算顺序不变。标准手柄向下首先到相邻 Miss review 摘要，向上回教练按钮，默认 bottom face 仍执行 Review；320×568 点击固定 Review 后首个 Practice 完整位于底栏上方。旧 artifact `da627e6ed87c` 的新手机层级合同 **1/1 failed**，实测 Miss review **1248.41px** 晚于 Share **660.59px**；artifact `29b1626a2351` 的确切合同 **1/1 passed**。Results 全状态 production **14/14 passed**；Results、Miss Practice、分享、返回与手柄相邻 production **46/46 passed**。Vitest **52 文件 / 381 用例**、发布器 **18/18**、性能规则 **51/51**、PRD **8/8**、tsc 与 CF build/release verify **105 tracks / 315 charts / 906 files / 497.1 MiB** 通过，Pixel 7 展开页截图目检通过。未重跑完整 production 或固定性能采样；未改判定、输入、计分、HP、音频或谱面。 |
| **v1.9.170** | 2026-09-16 | **Miss 分段恢复从一次试跑升级为不中断的三轮 Drill**：Miss review 的具名分段入口明确显示 `Drill ×3` 并携带受限 `reps=3`；每轮结束后留在同一 Play 页面，重建该 section 的独立判定状态并进入新的 3 秒安全倒计时，不再往返 Results / Start。顶栏实时显示 `Rep 1/3…3/3`，暂停菜单的 Restart section 只重启当前轮。第三轮后 Results 明示 `3-rep drill complete`、`Final rep shown` 与 not ranked，正文、教练、手机固定动作和精确重练均保留 `reps=3`；只保存最后一轮统计，且继续隔离 PB、榜单、Daily、run history、rank 与 achievements。Track 手动选择的普通 section Practice 保持单次；`reps` 只接受有 `seek+until` 的 2–5 整数，开放区间、整曲和畸形 URL 均降级单次。旧 artifact `29b1626a2351` 的新入口合同 **1/1 failed**；artifact `88c001d73545` 的 desktop / 320×568 三轮合同及相邻 Practice、Results、分享、返回、手柄 **46/46 passed**，其中 Practice 全路径 **8/8 passed**。Vitest **53 文件 / 387 用例**、发布器 **18/18**、性能规则 **51/51**、PRD **8/8**、tsc 与 CF build/release verify **105 tracks / 315 charts / 906 files / 497.1 MiB** 通过；320×568 暂停及长 Results 截图目检通过。退出原生 Fullscreen 时即使浏览器漏报进入事件也会冻结单人/Duo。未重跑完整 production 或固定性能采样；未改判定窗、输入映射、计分、HP 或谱面。 |
| **v1.9.171** | 2026-09-16 | **Drill 轮间重置从隐式行为升级为可读的表现交接**：第一、二轮结束后不增加新的确认或等待，直接复用既有 3 秒安全倒计时，在场地内显示 `Rep N complete`、上一轮 Accuracy / Miss 数与 `Next · Rep N+1/3`。交接卡使用 polite atomic status；倒计时暂停时保留，真正恢复判定时自动消失，Restart section 清除旧交接，不把上一轮视觉状态带入当前轮。预滚音符和中央倒计时继续可读，320×568 与桌面均限制在 playfield 内。旧 artifact `88c001d73545` 的交接合同 **1/1 failed**；artifact `b4385d27f69b` 的 desktop / 320×568 精确 Drill 合同 **2/2 passed**，Practice、HUD、单人暂停与 Fullscreen 相邻 production **28 passed / 2 个按项目限定的 skip / 0 failed**（30 项）。Vitest **53 文件 / 387 用例**、发布器 **18/18**、性能规则 **51/51**、PRD **8/8**、tsc 与 CF build/release verify **105 tracks / 315 charts / 906 files / 497.1 MiB** 通过；双端交接截图目检无溢出或判定线遮挡。未重跑当前指纹完整 production 或固定性能采样；未改倒计时时长、判定、输入、计分、音频、存档或谱面。 |
| **v1.9.172** | 2026-09-16 | **Drill 结算从“只看最后一轮”升级为可比较的完整训练趋势**：Results 在核心统计后新增 `Drill progress`，按轮显示 Accuracy、Miss、Grade，明确 `Final vs first` 的 Accuracy 百分点和 Miss 变化，并以 Accuracy 优先、Miss 次之、同表现取较后轮的确定性规则标出一个 `BEST`。标题 Score / Accuracy / Max Combo、分享与竞争性路径仍只代表最后一轮；所有轮次只作为本次训练反馈，不写 PB、排行榜、Daily、run history、rank 或 achievements。`practiceAttempts` 只接受与 2–5 次合法有界 Drill 精确同长、字段有效的本地可选数组，损坏趋势会被单独丢弃而不杀死旧成绩。旧 artifact `b4385d27f69b` 的新趋势合同 **1/1 failed**；artifact `faeea6a18fce` 的 desktop / 320×568 精确合同 **2/2 passed**，完整 Practice、Results、分享、返回与手柄相邻 production **40/40 passed**。Vitest **53 文件 / 390 用例**、发布器 **18/18**、性能规则 **51/51**、PRD **8/8**、tsc 与 CF build/release verify **105 tracks / 315 charts / 906 files / 497.1 MiB** 通过；双端长 Results 截图目检无横向溢出或主动作被固定栏遮挡。未重跑当前指纹完整 production 或固定性能采样；未改判定、输入、计分、PB/榜单逻辑、音频或谱面。 |
| **v1.9.173** | 2026-09-16 | **可安装 PWA 从隐藏浏览器能力升级为完局后的克制留存动作**：应用入口在 lazy Results 加载前捕获浏览器一次性的 `beforeinstallprompt`，但 Home、Play、失败局和未推进的 First Shift 恢复都不显示推广；只有浏览器确认可安装且玩家完成有效旅程后，Results 在分享/回信之后显示 `Install BeatScape`，说明独立窗口与已打开曲目的离线收益。按钮由真实用户手势调用原生安装确认，忙碌时防重复；接受、拒绝、异常、外部 `appinstalled` 或 standalone 启动都会清除入口，不支持该事件的浏览器不渲染假按钮。旧 artifact `faeea6a18fce` 的 desktop 安装合同 **2/2 failed**；artifact `f8bdde4409c4` 的 desktop / 320×568 捕获、接受、拒绝、异常、外部安装、失败恢复与 standalone 排除精确合同 **12/12 passed**，真实 PWA 安装/升级/离线、Results 教练、分享与手柄相邻 production **56/56 passed**。Vitest **53 文件 / 390 用例**、发布器 **18/18**、性能规则 **51/51**、PRD **8/8**、tsc 与 CF build/release verify **105 tracks / 315 charts / 906 files / 497.1 MiB** 通过；双端安装卡截图目检无横向溢出或固定栏遮挡。未重跑当前指纹完整 production 或固定性能采样；未改 Service Worker 缓存策略、对局、判定、输入、计分、音频或谱面。 |
| **v1.9.174** | 2026-09-16 | **Practice 从被动救援升级为玩家可控的分档训练速度**：单人 Practice 暂停层新增原生 radio 语义的 50% / 75% / 100% `Practice tempo`，音乐与谱面时钟同步变速，选择只作用于当前 run，不写长期设置；当前档位在开局卡与 HUD 可见，并贯穿 Resume、Restart track/section 和自动 Drill 轮次。每次恢复仍保持真实 3 秒安全倒计时，不会因慢速拉长；连续 3 Miss 的临时 0.5× assist 结束后恢复玩家所选档位，手动 0.5× 不伪装成临时 assist。Casual、Arcade、Duo 与排名路径不暴露该控件。旧 artifact `f8bdde4409c4` 的新增 Practice tempo 合同 desktop/mobile **2/2 failed**；artifact `57526755d447` 的分档、真实音源倍率、重开、自动轮次持久性与 Casual 排除精确合同 **6/6 passed**，暂停、Practice、HUD、退出与输入时序相邻 production **67 passed / 1 个项目限定 skip / 0 failed**（68 项）。Vitest **53 文件 / 393 用例**、发布器 **18/18**、性能规则 **51/51**、PRD **8/8**、tsc 与 CF build/release verify **105 tracks / 315 charts / 906 files / 497.1 MiB** 通过；桌面与 320×568 暂停层截图目检无溢出，三个动作均首屏可见。未重跑当前指纹完整 446 项 production 或固定性能采样；未改判定窗、输入、计分、PB/榜单、HP、谱面或音频资产。 |
| **v1.9.175** | 2026-09-16 | **Practice 训练速度移到第一拍之前，取消“先开局再暂停”的设置摩擦**：单人 Practice 准备卡与暂停层复用同一组原生 50% / 75% / 100% radio；玩家可在按下 Start 前选速，首个音乐源即以所选倍率启动，之后仍可在暂停层修改并贯穿同一 run 的 Resume、Restart track/section 与自动 Drill 轮次。320×568 首屏同时容纳 Start、四轨提示、击打时机、Note speed 与三档 tempo，且无横向溢出。旧 artifact `57526755d447` 的新增赛前合同 desktop/mobile **2/2 failed**；artifact `12dbff54ff44` 的赛前首源倍率、HUD 与既有暂停行为精确合同 **8/8 passed**，Practice、引导、触控目标、暂停、重试、Note speed、窄屏与手柄相邻 production **65 passed / 1 个项目限定 skip / 0 failed**（66 项）。Vitest **53 文件 / 393 用例**、发布器 **18/18**、性能规则 **51/51**、PRD **8/8**、tsc 与 CF build/release verify **105 tracks / 315 charts / 906 files / 497.1 MiB** 通过；桌面与 320×568 准备卡截图目检通过。未重跑当前指纹完整 446 项 production 或固定性能采样；未改倒计时、判定窗、输入、计分、PB/榜单、HP、谱面或音频资产。 |
| **v1.9.176** | 2026-09-16 | **手机对局顶栏按游玩决策压缩，不再让 Drill 元数据吃掉曲名**：≤520px 的单人 Play 顶栏将完整 `tier · mode · Daily/target/Drill/section/time` 收为按当前身份选择的紧凑状态；普通局保留 mode，Daily 显示 Daily，挑战显示 Goal，分段显示段名，Drill 显示 `Rep N/M`。完整身份仍作为视觉隐藏文本和 `title` 保留，桌面继续原样展示。320px Drill 从只剩 40px、被省略的曲名恢复为完整 `Neon Pulse` + `easy · Rep 2/3`，Exit、Fullscreen、HUD 与场地不移位。旧 artifact `12dbff54ff44` 的 320px 曲名合同 **1/1 failed**；artifact `0e024c979a6d` 的 desktop / 320×568 精确合同 **2/2 passed**，Daily、挑战、Practice、全屏、Note speed 与窄屏相邻 production **56 passed / 4 个项目限定 skip / 0 failed**（60 项）。Vitest **53 文件 / 393 用例**、发布器 **18/18**、性能规则 **51/51**、PRD **8/8**、tsc 与 CF build/release verify **105 tracks / 315 charts / 906 files / 497.1 MiB** 通过；双端 Drill 截图目检通过。未重跑当前指纹完整 446 项 production 或固定性能采样；未改玩法、判定、输入、计分、音频、谱面或存档。 |
| **v1.9.177** | 2026-09-16 | **Note speed 快调进入第一拍之前，直达玩家不再被迫退出对局**：普通完整 Play 的准备卡新增 44px `− / +` 控件，以 0.25× 在 0.5–2.0× 内调整全模式 Note speed；Replay、Daily、挑战与深链玩家均可在 Start 前修改并立即保存。当前场地只更新音符 approach，不重建 session、renderer 或已解码音频；保存失败时明确显示 `This run only`。开始后控件消失并锁定本局值。未完成的 First Shift 首关与 Home demo 保留静态读数，避免给首次教学增加决策。旧 artifact `0e024c979a6d` 的新增直达合同 desktop/mobile **2/2 failed**；artifact `f5251bdeb116` 的 Note speed 双端合同合并 **6/6 passed**，玩法引导、Practice、挑战、Daily、手柄、触控与窄屏相邻 production **72 passed / 2 个项目限定 skip / 0 failed**（74 项）。Vitest **53 文件 / 393 用例**、Gateway **44/44**、Python **68/68**、发布器 **18/18**、性能规则 **51/51**、PRD **8/8**、tsc、CF build/release verify **105 tracks / 315 charts / 906 files / 497.1 MiB** 通过；320×568 准备卡截图目检通过。未重跑当前指纹完整 446 项 production 或固定性能采样；未改判定窗、输入、计分、音频资产或谱面。 |
| **v1.9.178** | 2026-09-16 | **Settings 核心开关从 18px 原生框升级为可读、可触、可键盘操作的品牌控件**：Hitsound、Haptics、Fancy FX、Reduce motion 与触屏 Thumb chord assist 保留原生 checkbox 语义和 checked 状态，但统一显示 `On / Off`、48×44px 实际输入区域、硬边 switch 视觉和高对比 `:focus-visible`；整行继续可点，手机与桌面共享同一合同。旧 artifact `f5251bdeb116` 的新增双端状态/尺寸合同 **2/2 failed**；artifact `1baa8fa38a94` 的精确合同 **2/2 passed**，Settings 保存/异常、320px、触控目标、手柄导航与真实音频/暂停相邻 production **61 passed / 1 个项目限定 skip / 0 failed**（62 项）。Vitest **53 文件 / 393 用例**、发布器 **18/18**、性能规则 **51/51**、PRD **8/8**、tsc、CF build/release verify **105 tracks / 315 charts / 906 files / 497.1 MiB** 通过；桌面与 320×568 Settings 截图目检通过。未重跑当前指纹完整 446 项 production 或固定性能采样；未改设置含义、默认值、玩法、判定、计分、音频资产或谱面。 |
| **v1.9.179** | 2026-09-16 | **Settings 滑杆从细系统轨道升级为完整触控与品牌反馈**：Music volume、SFX volume、Playfield background 与 Note speed 继续使用原生 range 语义，但输入高度统一为 44px，内部显示 8px 硬边轨道、24px 方形滑块、实时红色进度与高对比键盘焦点；Arrow 键、手柄调值、自动保存及现有数值步长不变。旧 artifact `1baa8fa38a94` 的新增双端拖动目标合同 **2/2 failed**，实测仅 34px 高；artifact `f022a47b6467` 的精确合同 **2/2 passed**，Settings、320px、触控目标、手柄导航、真实音频/暂停与完整结算相邻 production **63 passed / 1 个项目限定 skip / 0 failed**（64 项）。Vitest **53 文件 / 393 用例**、发布器 **18/18**、性能规则 **51/51**、PRD **8/8**、tsc、CF build/release verify **105 tracks / 315 charts / 906 files / 497.1 MiB** 通过；桌面与 320×568 Settings 截图目检通过。未重跑当前指纹完整 446 项 production 或固定性能采样；未改取值范围、步长、设置含义、玩法、判定、计分、音频资产或谱面。 |
| **v1.9.180** | 2026-09-16 | **Settings 时序微调从易误输的窄数字框升级为双端可靠控制**：Board name 与 Global offset 输入区由 39px 提升至 44px；Global offset 改为可保留未完成负号草稿的自定义 spinbutton，逐键输入 `-37` 不再被改写为 `37`。合法整数即时保存；空值、孤立负号、越界和非有限值显示错误且不覆盖最后合法存档。Arrow 调 1ms，PageUp/PageDown 与 44px 触控按钮调 10ms，并提供 Reset；Calibration 测量与返回路径不变。旧 artifact `f022a47b6467` 的新增双端合同 **2/2 failed**，实测两输入框仅 39px，独立逐键探针确认负号丢失；artifact `051b4b61801c` 的精确合同 **2/2 passed**，Settings、校准、手柄导航、320px、触控目标、真实音频、Duo 与完整结算相邻 production **77 passed / 1 个项目限定 skip / 0 failed**（78 项）。Vitest **53 文件 / 394 用例**、发布器 **18/18**、性能规则 **51/51**、PRD **8/8**、tsc、CF build/release verify **105 tracks / 315 charts / 906 files / 497.1 MiB** 通过；桌面与 320×568 Settings 截图目检通过。未重跑当前指纹完整 446 项 production 或固定性能采样；未改玩法、判定、计分、音频资产或谱面。 |
| **v1.9.181** | 2026-09-16 | **Practice 救援提示与短横屏暂停控件不再遮挡或塌缩**：连续 Miss 触发的 Practice assist 从横跨中间音轨的宽条移入顶部 SIGNAL 槽，显示期间让位隐藏 SIGNAL；桌面保留 `PRACTICE ASSIST`，≤360px 使用 `ASSIST` / `TEMPO` 短标签，完整无障碍名称、0.5× 倍率和五秒倒计时不变。≤520px 短横屏暂停层按模式显式分栏：Casual / Arcade 的 Quick controls 使用完整单栏宽度；Practice 使用左侧 Tempo + 右侧 2×2 Quick controls，三条 range 均保持至少 44px 可拖动几何。旧 artifact `051b4b61801c` 的 assist 位置合同 desktop/mobile **2/2 failed**，提示比 SIGNAL 低 88/92px；中间 artifact `209618697954` 的 844×390 / 667×375 暂停合同 desktop/mobile **4/4 failed**，三条 range 宽度均为 0。artifact `1492f8368784` 的 Practice assist 精确合同 **2/2 passed**、横屏四种布局双端合同 **16/16 passed**，HUD、暂停、Practice、旋转、320px、真实音频、Duo 与完整结算相邻 production **89 passed / 1 个项目限定 skip / 0 failed**（90 项）。Vitest **53 文件 / 394 用例**、发布器 **18/18**、性能规则 **51/51**、PRD **8/8**、tsc、CF build/release verify **105 tracks / 315 charts / 906 files / 497.1 MiB** 通过；桌面、320×568、844×390 与 667×375 截图目检通过。未重跑当前指纹完整 446 项 production 或固定性能采样；未改 assist 规则、倒计时、玩法、判定、计分、音频资产或谱面。 |
| **v1.9.182** | 2026-09-16 | **First Shift 线路修复从裸文本升级为可读的叙事状态路径**：故事入口和成功 Results 以 FROM / TO 状态卡、方向箭头、故障红与恢复绿明确呈现“哪里断线、哪里恢复”，同时用单一 `role=img` 名称表达完整转换；入口卡保持双端 ≥44px。Results 使用紧凑回执版，第一段状态与下一段故事主动作继续完整位于固定导航上方。旧 artifact `1492f8368784` 的新增双端语义/几何合同 **2/2 failed**；artifact `d6f17b99b6f4` 的精确故事/首局留存合同 **10/10 passed**，Home、完整三首真实剧情、异常剧情状态、320px、Results 与移动导航相邻 production **70 passed / 2 个项目限定 skip / 0 failed**（72 项）。Vitest **53 文件 / 394 用例**、发布器 **18/18**、性能规则 **51/51**、PRD **8/8**、tsc、CF build/release verify **105 tracks / 315 charts / 906 files / 497.1 MiB** 通过；桌面与 Pixel 7 故事入口/第一关结果截图目检通过。未重跑当前指纹完整 446 项 production 或固定性能采样；未改剧情进度规则、玩法、判定、计分、音频资产或谱面。 |
| **v1.9.183** | 2026-09-16 | **手机长叙事状态不截断、人物切换不丢位置**：成功 Results 的紧凑线路卡利用标题已有节点名，只显示 `silent → holding a steady signal` 等状态变化，完整地点与转换继续保留在 `role=img` 名称；三段 FROM / TO 均无视觉裁切或横向溢出。NIGHTSHIFT 手机人物切换器在长传记阅读中 sticky 常驻；从卡片深处换人时，React 提交后把新人物卡顶端对齐到切换器下方，桌面三卡布局不变。旧 artifact `d6f17b99b6f4` 的三段可读合同 desktop **passed**、mobile **failed**，第二段目标状态被裁掉 36px；中间 artifact `175d3eac9d65` 的 320×568 长读合同因切换器完全离开视口 **failed**。artifact `89a263560369` 的 Results / 首局留存 / 故事入口 / 手机角色长读 / 桌面人物布局双端合同 **14 passed / 2 个设备限定 skip / 0 failed**（16 项）。Vitest **53 文件 / 394 用例**、发布器 **18/18**、性能规则 **51/51**、PRD **8/8**、tsc、CF build/release verify **105 tracks / 315 charts / 906 files / 497.1 MiB** 通过；Pixel 7 第二、三段回执和 320×568 sticky 角色切换截图目检通过。未重跑当前指纹完整 production 套件或固定性能采样；未改剧情进度、人物内容、玩法、判定、计分、音频资产或谱面。 |
| **v1.9.184** | 2026-09-16 | **赛前高级音符从文字规则升级为可视预演**：准备卡只为当前谱面真实出现的 Hold / Chord / Slide 显示对应缩略谱型；Hold 用同道双菱形与身条、Chord 用横向连接的双色菱形、Slide 用斜向虚线路径，把操作文案直接映射到玩家即将在轨道中看到的形状。预览为装饰性、从辅助技术隐藏，既有 Chart moves 文本继续承担完整语义；未完成 First Shift 的 320×568 教学顺序、Start、Sound check 与 Adjust timing 均保持可见。新增合同在旧发布构建 **3 failed / 1 个设备限定 skip**；artifact `0492e67f5ca9` 的完整 Gameplay guidance 与赛前 44px 触控矩阵 **19 passed / 1 个设备限定 skip / 0 failed**（20 项）。Vitest **53 文件 / 394 用例**、发布器 **18/18**、性能规则 **51/51**、PRD **8/8**、tsc、CF build/release verify **105 tracks / 315 charts / 906 files / 497.1 MiB** 通过；桌面三谱型、Pixel 7 三谱型与 320×568 First Shift 截图目检通过。未重跑当前指纹完整 production 套件或固定性能采样；未改判定、输入、计分、音频、谱面或故事进度，BS-D002 不触发。 |
| **v1.9.185** | 2026-09-16 | **校准结果从裸偏移数升级为可理解的补偿建议**：结果页根据 `median(u_i - t_i)` 的符号明确显示 `Late input detected`、`Early input detected` 或 `Timing centered`，并说明应用后补偿的毫秒数；正偏移仍表示输入晚于脉冲，负偏移表示早于脉冲，存储、夹紧、MAD 质量判断和返回路径均不变。纯逻辑方向测试覆盖正/负/零值，完整 Calibration 双端矩阵 **12/12 passed**；artifact `eee22016f4da` 的 Vitest **53 文件 / 395 用例**、发布器 **18/18**、性能规则 **51/51**、PRD **8/8**、tsc、CF build/release verify **105 tracks / 315 charts / 906 files / 497.1 MiB** 通过。桌面、Pixel 7 与 320×568 控制器结果态截图目检通过，短屏保存/重试动作仍完整位于专注视口内。未重跑当前指纹完整 production 套件或固定性能采样；未改 offset 算法、音频排程、玩法、判定、计分或谱面。 |
| **v1.9.186** | 2026-09-16 | **自动结束的校准结果补齐焦点交接**：第八拍结束或样本不足时，焦点从即将卸载的轨道输入自动转入具名 `Calibration result` region；键盘/读屏玩家无需猜测页面是否变化，下一次 Tab 直接进入结果动作。程序化焦点不滚动页面；键盘 modality 显示高对比焦点环，触控完成不额外制造视觉框。新增合同在旧 artifact `eee22016f4da` 上 desktop/mobile **2/2 failed**；artifact `d1e0190a4dbe` 的完整 Calibration 双端矩阵 **12/12 passed**，包含稳定与样本不足结果。桌面、Pixel 7 与 320×568 控制器结果态截图目检通过；未重跑当前指纹完整 production 套件或固定性能采样，未改 offset 算法、音频、玩法、判定、计分或谱面。 |
| **v1.9.187** | 2026-09-16 | **零 Miss 成绩移除无内容的复盘控件**：权威 `counts.miss=0` 且没有位置数据时不再渲染 `Miss review — clean run` disclosure；FC/AP/核心统计和 `Run details · 0 misses` 继续承担成绩确认，移动长页少一层无操作价值的折叠项。真实 Miss、异常存在 `missEvents`、以及旧存档有 Miss 但缺坐标时仍保留完整/降级复盘。新增合同在旧 artifact `d1e0190a4dbe` 上 desktop/mobile **2/2 failed**；artifact `993b7c0d6af0` 的普通 Results、First Shift 与手柄结果导航双端矩阵 **34/34 passed**，320px 连续偏差长页截图目检通过。未重跑当前指纹完整 production 套件或固定性能采样；未改 gameplay、判定、计分、成绩存档、音频或谱面。 |
| **v1.9.188** | 2026-09-16 | **手机 Library 筛选补齐结果提交闭环**：≤640px 展开的 Filters 在全部条件后提供实时 `View N matches/tracks` 主动作；激活后收起筛选、把焦点交给 `Matches` / `All tracks` 并滚到带 12px 顶部安全距的结果标题，玩家无需反向寻找顶部折叠入口，单改排序也可跳过推荐区直达曲目。动作高 48px，滚动到视口后与固定 tabbar 保留 ≥8px；桌面不显示，Favorites 原有自动收起行为不变。新增合同在旧 artifact `993b7c0d6af0` 上 **1/1 failed**；artifact `196463fe1e55` 的 Library、320px、触控、返回链、导航与手柄相邻矩阵 **67 passed / 3 个设备限定 skip / 0 failed**（70 项）。Vitest **53 文件 / 395 用例**、发布器 **18/18**、性能规则 **51/51**、tsc、CF build/release verify **105 tracks / 315 charts / 906 files / 497.1 MiB** 通过，320px 动作与结果落点截图目检通过。未重跑当前指纹完整 production 套件或固定性能采样；未改玩法、判定、计分、音频、存档或谱面。 |
| **v1.9.189** | 2026-09-16 | **Library 曲目卡从隐式详情入口升级为可见直玩**：All tracks / Matches 每张卡在 Preview 旁新增显式 `Play`，第二行展示 catalog 的默认 `tier · mode`；点击直接进入精确赛前准备，筛选/搜索/排序存在时继续携带完整 Library 返回状态。整张标题区域仍进入 Track 配置页，Preview、Play、Favorite 与详情链接保持合法兄弟交互，不制造嵌套链接。Preview 与 Play 双端均 ≥48px，320px 滚动后完整位于固定 tabbar 上方。新增合同在旧 artifact `196463fe1e55` 上 desktop/mobile **2/2 failed**；artifact `b5b9da0b1a4d` 的 Library、320px、触控、返回链、导航与手柄相邻矩阵 **69 passed / 3 个设备限定 skip / 0 failed**（72 项）。Vitest **53 文件 / 395 用例**、发布器 **18/18**、性能规则 **51/51**、tsc、CF build/release verify **105 tracks / 315 charts / 906 files / 497.1 MiB** 通过，1280×720 与 320×568 结果卡截图目检通过。未重跑当前指纹完整 production 套件或固定性能采样；未改玩法、默认配置真值、判定、计分、音频、存档或谱面。 |
| **v1.9.190** | 2026-09-16 | **Note speed 可在看见真实谱面后于暂停层即时修正**：单人 `Scape paused` 与共享 `Duo paused` 的 Quick controls 新增原生 0.5–2.0× `Note speed` 滑杆；调整成功即保存并只在场地已冻结时更新当前单场或两块 Duo 的可见 approach，Resume 继续先走 3 秒安全倒计时。音乐时钟、判定时间、session、分数与谱面均不重建；运行中的其他标签页设置变化不会突然改速。短竖屏默认折叠仍让 Resume / Restart / Leave 首屏可达，展开后可滚动；667×375 与 844×390 的单人 / Practice 四条滑杆均 ≥44px 且三个动作同屏。新增合同在旧 artifact `b5b9da0b1a4d` 上 desktop/mobile × single/Duo **4/4 failed**；artifact `211292b71b84` 的暂停、Note speed、Practice、旋转、触控、两档短横屏与 Duo 相邻矩阵 **44/44 passed**，手柄焦点/调值、输入计时、Duo 分配与退出相邻矩阵 **42/42 passed**。Vitest **53 文件 / 395 用例**、发布器 **18/18**、性能规则 **51/51**、PRD **8/8**、tsc、CF build/release verify **105 tracks / 315 charts / 906 files / 497.1 MiB** 通过；桌面、320×568、667×375 与 844×390 截图目检通过。未重跑当前指纹完整 production 套件或固定性能采样；未改音频、判定窗、玩法输入、计分、PB/榜单、HP 或谱面。 |
| **v1.9.191** | 2026-09-16 | **零命中完整局不再伪装成成长奖励**：完整但 0 分 / 0% 的 all-Miss 尝试继续写入 run history、保留 Retry、Miss review 和回流语义，但不再计为 Clear、Night streak、近期 Arcade 表现、district 探索或 `First Light`；同日稍后首个有命中完整局仍能正常启动/延长 streak。有至少一次成功判定的失败局继续计入日活，分段 Practice 继续完全隔离。新增 2 个逻辑合同与 desktop/mobile 合同在旧行为上 **4 failed**；artifact `a2539f4f738a` 的新增双端合同 **2/2 passed**，成长、首局、Profile、Home/Library 回流与 Results 教练相邻矩阵 **63 passed / 1 个设备限定 skip / 0 failed**（64 项）。Vitest **53 文件 / 397 用例**、发布器 **18/18**、性能规则 **51/51**、PRD **8/8**、tsc、CF build/release verify **105 tracks / 315 charts / 906 files / 497.1 MiB** 通过。未重跑当前指纹完整 production 套件或固定性能采样；未改玩法判定、当局计分、PB/榜单、音频、HP 或谱面。 |
| **v1.9.192** | 2026-09-16 | **手机次级交互统一补齐 44px 可点面积**：320×568 全站几何审计确认无横向溢出和无名控件，但页头 Home Logo、Radio 季标题、Results `Miss review`、Local Board 的 Profile 链以及试听 seek rail 仍分别只有约 30 / 32 / 20 / 41.8 / 22px 的命中高度。视觉字号、轨道厚度和内容层级不变，只扩展真实或透明 hit area 至 ≥44px；Radio 最长季标题的 `8 EPS` 固定同列不拆行。四个真实几何合同在旧产物 **4/4 failed**，季计数 no-wrap 与试听 rail 上下命中合同同步补齐；artifact `9eaa5c184bb9` 的五项手机精确流程 **5/5 passed**，导航、Radio、Results、榜单、试听、320px、首局与成长相邻矩阵 **69 passed / 3 个设备限定 skip / 0 failed**（72 项）。Vitest **53 文件 / 397 用例**、发布器 **18/18**、性能规则 **51/51**、PRD **8/8**、tsc、CF build/release verify **105 tracks / 315 charts / 906 files / 497.1 MiB** 通过；320×568 Home、Radio 与 Results 截图目检无固定导航覆盖。未重跑完整 production 套件或固定性能采样；未改玩法、判定、输入、计分、音频播放、HP 或谱面。 |
| **v1.9.193** | 2026-09-16 | **Home 发现曲廊从 4px 死链接恢复为真正可滑的音乐卡**：运行时几何审计发现 `Explore the city` 的 18 个 Link 是横向 flex 容器的直接子项，却仍依赖已不存在的 `.trend-card-wrap` 提供宽度；默认 `flex-shrink` 因而在桌面与 320×568 手机都把每张卡压成约 4px，只在辅助树留下不可用的曲目入口。现每张卡固定为 200px、不收缩，保留现有封面、scroll snap 与细滚动条；手机首张完整、下一张局部露出形成滑动提示，横向滚动只发生在 rail 内，页面根节点继续无溢出。新增几何合同在旧 artifact 上 desktop/mobile **2/2 failed**；artifact `06f12f7204d1` 的专项 **2/2 passed**，Home、Library、首局、导航、移动图标与 320px 相邻矩阵 **89 passed / 5 个设备限定 skip / 0 failed**（94 项）。Vitest **53 文件 / 397 用例**、发布器 **18/18**、性能规则 **51/51**、PRD **8/8**、tsc、CF build/release verify **105 tracks / 315 charts / 906 files / 497.1 MiB** 通过，Pixel 7 曲廊截图确认首卡和下一卡滑动提示。未重跑完整 production 套件或固定性能采样；未改曲目选择、路由、玩法、判定、输入、音频或谱面。 |
| **v1.9.194** | 2026-09-16 | **手机自动全屏补齐可见退出路径**：触屏 Start 成功进入全屏后不再隐藏唯一的应用内全屏控件；同一 44×44px 按钮改为向内收拢图标与具名 `Exit fullscreen`，激活即可退出。退出继续复用既有 `fullscreenchange` 安全边界自动暂停，玩家确认 Resume 后再入场；退出完成后按钮恢复为 `Fullscreen`。桌面仍使用 Esc 且不渲染冗余按钮，不支持 Fullscreen API 的触屏浏览器仍不显示死控件。新增移动合同在旧实现上 **1/1 failed**；artifact `e680d12b6cd7` 的全屏专项 **6 passed / 2 个桌面设计性 skip / 0 failed**，全屏、暂停、退出、旋转、320px、触控目标、HUD 与 Duo 相邻矩阵 **80 passed / 2 个桌面设计性 skip / 0 failed**（82 项）。Vitest **53 文件 / 397 用例**、发布器 **18/18**、性能规则 **51/51**、PRD **8/8**、tsc、CF build/release verify **105 tracks / 315 charts / 906 files / 497.1 MiB** 通过，Pixel 7 活跃全屏截图确认顶栏完整且退出目标可达。未重跑完整 production 套件或固定性能采样；未改玩法、判定、输入、计分、音频、HP 或谱面。 |
| **v1.9.195** | 2026-09-16 | **关键对局图标与键位选中态不再依赖脆弱字体/低对比颜色**：单人和 Duo 的 Exit、各场 Pause 从自托管 Latin 字体不保证覆盖的 `✕` / `‖` 字符改为 `currentColor` 内联 SVG，保持原可访问名称、焦点、44×44px 命中区和退出/暂停逻辑不变；320px Duo 截图确认顶部 Exit 与两枚 Pause 清晰、对称且不挤压曲名或 HUD。Settings 的当前键位预设原为 12px 红字叠深棕底，实测仅 **4.0108:1**；现改为骨白底深墨字，并新增 **≥4.5:1** 合同。新增三项合同在旧实现上 **3/3 failed**；artifact `b470b5337fff` 的目标合同 **3/3 passed**，全屏、暂停、退出、320px、两档横屏、单人/Duo、键位、字体与 Settings 相邻矩阵 **96 passed / 4 个设备限定 skip / 0 failed**（100 项）。Vitest **53 文件 / 397 用例**、发布器 **18/18**、性能规则 **51/51**、PRD **8/8**、tsc、CF build/release verify **105 tracks / 315 charts / 906 files / 497.1 MiB** 通过。未重跑完整 production 套件或固定性能采样；未改玩法、判定、输入、计分、音频、HP 或谱面，BS-D002 不触发。 |
| **v1.9.196** | 2026-09-16 | **Combo 里程碑触感不再被同一击的普通反馈吞掉**：10 / 25 / 50 等 Combo 里程碑本来紧跟跨线击中发出，但触屏与手柄的共享节流会把专属 cue 识别成 80 / 55ms 内的重复反馈，导致视觉庆祝出现而 18ms 触屏脉冲和 82ms shaped rumble 通常缺席。现仅让稀疏、语义优先的 `milestone` 绕过普通击中节流，常规 Hit / Miss / confirm 的防连震边界保持不变。原单测标题声称覆盖 milestone 却实际只调用本就零间隔的 surge；改为真实 milestone 后旧实现 **1/1 failed**，修复后转绿。artifact `471ad6c73198` 的同帧 Chord 跨 10 Combo 精确合同 desktop/mobile **2/2 passed**，手机同时观测到 `18ms` cue；Haptics、Chord 与 Judgment 相邻浏览器矩阵 **27 passed / 3 个设备限定 skip / 0 failed**（30 项）。Vitest **53 文件 / 397 用例**、发布器 **18/18**、性能规则 **51/51**、PRD **8/8**、tsc、CF build/release verify **105 tracks / 315 charts / 906 files / 497.1 MiB** 通过。未重跑完整 production 套件或固定性能采样；未改判定窗、输入、计分、音频、HP 或谱面，BS-D002 不触发。 |
| **v1.9.197** | 2026-09-16 | **触感可在暂停层即时关闭，不再要求退出对局**：Haptics 明确独立于 Hitsounds，但原单人/Duo 共用 Quick controls 只有 Hitsounds，默认开启触感的手机或手柄玩家若中途不适只能离场去 Settings。现新增 `Haptics · Touch & controller`，整行 ≥44px，保存到本设备并纳入键盘焦点闭环与手柄 D-pad/面键操作；短竖屏继续默认折叠，844×390 / 667×375 的普通与 Practice 暂停卡保持全控件、动作和零文档滚动。旧 artifact 的新增控件合同 desktop/mobile **2/2 failed**；首个 UI 版本虽能保存，移动端恢复后进度已推进仍出现两次 `35ms` Miss 震动，暴露 PlayField 读取启动时旧快照。现 Haptics 与 Music/SFX/Dim/Note speed 一样订阅活动设置，关闭后当前局立即静默且复开暂停层仍保持关闭。artifact `122ba38bcf6a` 的单人/Duo Quick controls 精确合同 **4/4 passed**，暂停、两档横屏、触感、手柄输入/UI 导航与快捷键隔离矩阵 **55 passed / 1 个设备限定 skip / 0 failed**（56 项）。Vitest **53 文件 / 397 用例**、发布器 **18/18**、性能规则 **51/51**、PRD **8/8**、tsc、CF build/release verify **105 tracks / 315 charts / 906 files / 497.1 MiB** 通过。未重跑完整 production 套件或固定性能采样；未改判定窗、输入映射、计分、Music/SFX、HP 或谱面，BS-D002 不触发。 |
| **v1.9.198** | 2026-09-16 | **减弱动态效果可在暂停层即时启用并作用于当前局**：单人/Duo 共用 Quick controls 新增 `Reduce motion · Shake & moving FX`，整行 ≥44px，保存到本设备并纳入键盘焦点闭环与手柄 D-pad/面键操作；Resume 后立即关闭场景摇晃与移动粒子，不重建 Canvas、音频、session 或谱面。短竖屏继续默认折叠；宽屏/平板将 Hitsounds、Haptics、Reduce motion 同排，修复初版在 1280×720 把 Leave track 推出首屏的问题，同时 844×390 / 667×375 的普通与 Practice 暂停卡保持全控件、动作和零文档滚动。v1.9.197 artifact 的新增控件与活动 Canvas 合同 desktop/mobile **4/4 failed**；artifact `b9b050c225f2` 的暂停、两档横屏、手柄导航与当前局动效精确矩阵 **16/16 passed**，其中恢复游戏后分数反馈 Y 轴位移 ≤1px、移动粒子为 0。Vitest **53 文件 / 397 用例**、发布器 **18/18**、性能规则 **51/51**、PRD **8/8**、tsc、CF build/release verify **105 tracks / 315 charts / 906 files / 497.1 MiB** 通过。未重跑完整 production 套件或固定性能采样；未改判定窗、输入映射、计分、音频、HP 或谱面，BS-D002 不触发。 |
| **v1.9.199** | 2026-09-16 | **触屏同手和弦辅助可在暂停层即时修正当前局**：具备触摸能力的单人/Duo 暂停 Quick controls 新增 `Thumb assist · Same-hand chords`，整行 ≥44px，设置持久化并纳入键盘焦点闭环与手柄 D-pad/面键操作；纯桌面不显示无关控件。玩家 Resume 后，开关只作用于尚未完成判定的同手 Chord，不回写既有判定、分数或 Combo，也不重建 session、Canvas、音频或谱面；真实 touch 资格、自动补判 Great 与 `ASSIST` 标记规则保持不变。短竖屏继续默认折叠，844×390 / 667×375 的普通与 Practice 暂停卡保持全控件、动作和零文档滚动。旧实现的引擎运行时合同 **1/1 failed**（缺少切换能力），移动活动局合同 **1/1 failed**（缺少控件；桌面按设计 skip）；artifact `7e588c6b5fbe` 的 Chord、单人/Duo 暂停、持久化、焦点、手柄导航与两档横屏矩阵 **21 passed / 1 个桌面非触屏设计性 skip / 0 failed**。Vitest **53 文件 / 398 用例**、发布器 **18/18**、性能规则 **51/51**、PRD **8/8**、tsc、CF build/release verify **105 tracks / 315 charts / 906 files / 497.1 MiB** 通过。未重跑完整 production 套件或固定性能采样；未改判定窗、逐道计分、HP、音频、输入映射或谱面，BS-D002 不触发。 |
| **v1.9.200** | 2026-09-16 | **Duo 共享 3/2/1 倒计时不再双响**：两块 PlayField 仍各自维护同步倒计时与玩家判定反馈，但只有承载主音轨的场地发出全局 count-in cue；P2 不再把同一 3/2/1 叠播一次。双方独立命中、Miss、Combo 与 SIGNAL 音效继续保留，单人行为不变；开场、暂停恢复和系统中断恢复共用同一所有权规则。实时 AudioContext 合同在旧实现上 **1/1 failed**（第二拍前已观察到 4 个短 SFX 源，预期完整 count-in 共 3 个）；artifact `78b16b1db031` 的 desktop/mobile 精确合同 **2/2 passed**，完整 Duo 启动、暂停、恢复、重开与拒绝恢复矩阵 **22/22 passed**。Vitest **53 文件 / 398 用例**、发布器 **18/18**、性能规则 **51/51**、PRD **8/8**、tsc、CF build/release verify **105 tracks / 315 charts / 906 files / 497.1 MiB** 通过。未重跑完整 production 套件或固定性能采样；仅调整现有程序化提示音的播放所有权，未改音频资产、判定窗、输入、计分、HP 或谱面，BS-D002 不触发。 |
| **v1.9.201** | 2026-09-16 | **键位预设从三个独立 toggle 收敛为真正的互斥单选组**：Settings 的 Arrow keys / WASD / D F J K 现在以 `radiogroup` + `radio` 暴露唯一当前布局，不再被辅助技术误读成可多选 checkbox/toggle；仅当前项进入 Tab 顺序，方向键循环选择，Home / End 跳到首尾，焦点、实际物理键位存档和 AZERTY/QWERTZ 印字同步更新。自定义逐道绑定继续保留，并在无预设匹配时让首个预设作为可达入口。新合同在旧实现上 desktop **1/1 failed**；artifact `e2426ef44a5b` 的 desktop/mobile 精确合同 **2/2 passed**，Settings 自动保存、布局感知、44px 触控、手机折叠与站点手柄导航相邻矩阵 **36 passed / 2 个设备限定 skip / 0 failed**（38 项）。Vitest **53 文件 / 398 用例**、发布器 **18/18**、性能规则 **51/51**、PRD **8/8**、tsc、CF build/release verify **105 tracks / 315 charts / 906 files / 497.1 MiB** 通过；320px 辅助树复核为一个具名组与三个 radio。未重跑完整 production 套件或固定性能采样；未改玩法输入映射、判定、计分、音频、HP 或谱面，BS-D002 不触发。 |
| **v1.9.202** | 2026-09-16 | **手机人物 roster 从三个独立 toggle 升级为内容标签页**：≤680px 的 JUNO / ATLAS / TORQUE 现在以 `tablist` + `tab` + `tabpanel` 暴露唯一当前人物；仅选中 tab 进入 Tab 顺序，方向键循环切换，Home / End 跳到首尾，焦点、sticky 长读对齐和当前完整故事同步更新。>680px 继续同时展示三篇普通 article，不残留隐藏标签页语义。新合同在旧实现上 mobile **1/1 failed**；artifact `db70e0f68a84` 的手机/桌面精确合同 **2/2 passed**（另 2 个设备限定 skip），Characters、叙事、320px、导航、移动图标与站点手柄相邻矩阵 **37 passed / 3 个设备限定 skip / 0 failed**（40 项）。Vitest **53 文件 / 398 用例**、发布器 **18/18**、性能规则 **51/51**、PRD **8/8**、tsc、CF build/release verify **105 tracks / 315 charts / 906 files / 497.1 MiB** 通过；320×568 辅助树与截图复核为一个具名 tab group、三个 tab 和唯一活动面板，固定底栏无遮挡。未重跑完整 production 套件或固定性能采样；未改人物内容、剧情进度、玩法、判定、计分、音频或谱面，BS-D002 不触发。 |
| **v1.9.203** | 2026-09-16 | **Radio 调频频道从三个独立 toggle 收敛为真正的互斥单选组**：CH1–3 现在以具名 `radiogroup` + `radio` 暴露唯一当前频道，不再被辅助技术误读成可多选 checkbox；仅当前频道进入 Tab 顺序，方向键循环调频，Home / End 跳到首尾，焦点、MHz、指针、信号、活动样式和展开季度同步更新。独立 Live 标记继续只表示真实直播季度，不随用户调频移动；站点手柄仍可用 D-pad / 左摇杆选台、bottom face 确认。新合同在旧 artifact `db70e0f68a84` 上 desktop/mobile **2/2 failed**；artifact `0f64a4a09157` 的精确合同 **2/2 passed**，Radio、叙事、320px、导航、移动图标与手柄相邻矩阵 **41 passed / 3 个设备限定 skip / 0 failed**（44 项）。Vitest **53 文件 / 398 用例**、发布器 **18/18**、性能规则 **51/51**、PRD **8/8**、tsc、CF build/release verify **105 tracks / 315 charts / 906 files / 497.1 MiB** 通过；320px 辅助树与键盘实测确认一个具名单选组、三枚 radio、唯一 checked 项及 CH1→CH2 联动，Live 仍停留在真实直播季。未重跑完整 production 套件或固定性能采样；未改节目内容、玩法、判定、计分、音频或谱面，BS-D002 不触发。 |
| **v1.9.204** | 2026-09-16 | **First Shift 开场救援补全输入对象与自然英文**：连续漏掉前三个音符时出现的 `Find the line` 原正文只有 `Tap/Press as notes cross the bright line`，视觉和辅助技术都会得到缺少操作对象的残句。现触屏明确显示 `Tap the lanes as notes cross the line`，键盘与手柄统一显示 `Press the lane controls as notes cross the line`；输入面含义完整，同时维持原左上表现卡 footprint、实时进度和首次有效命中后退场。新合同在旧 artifact `0f64a4a09157` 上 desktop/mobile **2/2 failed**；artifact `5394fde43a0d` 的精确合同 **2/2 passed**，First Shift、Gameplay guidance、HUD 与 44px 触控目标相邻矩阵 **39 passed / 1 个设备限定 skip / 0 failed**（40 项）。Vitest **53 文件 / 398 用例**、发布器 **18/18**、性能规则 **51/51**、PRD **8/8**、tsc、CF build/release verify **105 tracks / 315 charts / 906 files / 497.1 MiB** 通过；Pixel 7 触屏截图与 320px 辅助树复核确认完整文案未扩大卡片、未遮谱。未重跑完整 production 套件或固定性能采样；未改输入事件、判定、计分、音频、Canvas draw 或谱面，BS-D002 不触发。 |
| **v1.9.205** | 2026-09-16 | **Library Vibe 从五个独立 toggle 收敛为真正互斥的单选组**：All、Night Drive、Groove、Battle、Chill 现在以具名 `radiogroup` + `radio` 暴露唯一当前项，不再被辅助技术误读成五个可多选 checkbox。仅已选项进入 Tab 顺序，方向键循环选择，Home / End 跳到首尾，焦点、URL 与结果同步更新；再次点击已选 vibe 保持选中，清除筛选必须显式选择 All。Favorites、Beginner 与 Vocals 继续作为独立 toggle。新合同在旧 artifact `5394fde43a0d` 上 desktop/mobile **2/2 failed**；artifact `62141eb00cea` 的精确合同 **2/2 passed**、手柄合同 **2/2 passed**，Library、320px、导航、移动图标与手柄相邻矩阵 **64 passed / 4 个设备或项目限定 skip / 0 failed**（68 项）。Vitest **53 文件 / 398 用例**、发布器 **18/18**、性能规则 **51/51**、PRD **8/8**、tsc、CF build/release verify **105 tracks / 315 charts / 906 files / 497.1 MiB** 通过；辅助树和键盘实测确认一个具名单选组、五枚 radio、唯一 checked 项，All → Night Drive 后 URL 为 `?vibe=night-drive` 且结果为 18 首。未重跑完整 production 套件或固定性能采样；未改玩法输入、判定、计分、音频、Canvas draw 或谱面，BS-D002 不触发。 |
| **v1.9.206** | 2026-09-16 | **Daily 榜单深链与标签切换不再沿用错误的 Local 标题**：`?view=daily` 初始载入及切到 Daily challenge 后，页面 H1 与浏览器/社交标题统一为 `Daily Challenge Board`；切回 All-time local 时同步恢复 `Local Board` / `Local Leaderboard`。tab 选中状态、URL、榜单数据、回放入口和“仅存本机”说明保持不变。新合同在旧 artifact `62141eb00cea` 上 desktop/mobile **2/2 failed**；artifact `173f54a2a75c` 的精确合同 **2/2 passed**，Daily 回流、Leaderboard、320px、主导航与移动图标相邻矩阵 **44 passed / 2 个项目限定 skip / 0 failed**（46 项）。Vitest **53 文件 / 398 用例**、发布器 **18/18**、性能规则 **51/51**、PRD **8/8**、tsc、CF build/release verify **105 tracks / 315 charts / 906 files / 497.1 MiB** 通过；运行态辅助树复核确认 Daily/Local 两种 H1、document title、URL 与选中 tab 同步切换。未重跑完整 production 套件或固定性能采样；未改榜单记录、玩法输入、判定、计分、音频或谱面，BS-D002 不触发。 |
| **v1.9.207** | 2026-09-16 | **电脑端暂停与重开快捷键从隐藏能力变成赛前可发现提示**：非触屏单人正式开局卡在 Start 之后以轻量键帽显示 `P / Esc · Pause` 与 `R · Restart`；手机、Duo 和 Home demo 不增加无关信息。若玩家把 `P` 或 `R` 自定义为任一轨道键，对应快捷提示自动移除，避免文案与实际“轨道键优先”规则冲突。新增桌面合同在旧 artifact `173f54a2a75c` 上 **1/1 failed**，移动端排除合同同期通过；artifact `ab3ce9ca1766` 的默认桌面/手机与自定义占键精确合同 **3/3 passed**，Gameplay guidance 与快捷键隔离相邻矩阵 **24 passed / 2 个设备限定 skip / 0 failed**（26 项）。Vitest **53 文件 / 398 用例**、发布器 **18/18**、性能规则 **51/51**、PRD **8/8**、tsc、CF build/release verify **105 tracks / 315 charts / 906 files / 497.1 MiB** 通过；桌面发布候选截图与运行态辅助树确认提示位于主动作之后且具名为 `Keyboard shortcuts. P or Escape pauses. R restarts.`，手机布局保持原样。未重跑完整 production 套件或固定性能采样；未改快捷键行为、输入映射、判定、计分、音频或谱面，BS-D002 不触发。 |
| **v1.9.208** | 2026-09-16 | **赛前公布的电脑快捷键在暂停层继续兑现**：单人运行中按 `P` / `Esc` 打开暂停后，未占用的 `P` 与 `Esc` 都能恢复，未占用的 `R` 可直接重开，不再被 modal 全部吞掉；桌面暂停正文同步提示 `Press P or Esc to resume.`。若 `P` / `R` 已绑定任一 lane，对应暂停层动作继续禁用并只提示 `Esc`，不会与实体轨道键冲突；触屏不增加键盘文案，但外接键盘行为保持可用。`Cmd/Ctrl/Alt` 修饰的浏览器命令保持原生，不会恢复或重开。旧 artifact `ab3ce9ca1766` 的普通 `P` 恢复合同 **1/1 failed**，默认/占键暂停文案合同 **2/2 failed**；artifact `6d4ddcdb461a` 的默认、占键、浏览器修饰键与双端合同 **4/4 passed**，单人暂停、退出确认、音频恢复、Hold 所有权与快捷键隔离相邻矩阵 **50/50 passed**。Vitest **53 文件 / 398 用例**、发布器 **18/18**、性能规则 **51/51**、PRD **8/8**、tsc、CF build/release verify **105 tracks / 315 charts / 906 files / 497.1 MiB** 通过；运行态辅助树与真实按键复核确认暂停正文、焦点恢复及 `P` / `R` 动作一致。未重跑完整 production 套件或固定性能采样；未改 lane 映射、判定、计分、音频内容或谱面，BS-D002 不触发。 |

| **v1.9.209** | 2026-09-16 | **长按暂停快捷键不再反向穿透暂停层**：玩家按住 `P` 或 `Esc` 打开暂停时，键盘自动重复产生的后续 keydown 不再立刻恢复；按住 `R` 也不会重复重开。只有新的非 repeat 按下边沿执行恢复或重开，普通短按、P/R 占键避让、触屏外接键盘与 `Cmd/Ctrl/Alt` 浏览器命令规则保持不变。新增 repeat 合同在旧 artifact `6d4ddcdb461a` 上 desktop **1/1 failed**；artifact `3720099b6b26` 的 desktop/mobile 精确合同 **2/2 passed**。同指纹完整 production 浏览器矩阵 **587 passed / 25 个按设备限定 skip / 0 failed**（612 项，35.4m）；固定性能矩阵 **26 条观察全部通过**，桌面 / 移动模拟 Home 最慢 0.244 / 0.586s、单/Duo 冷开局最慢 1.689 / 3.793s，六场完整 Hard 均约 60.00 FPS、0 异常间隔、draw 峰值最高 2.6ms，两组 8 次重开/切歌后资源预算通过。Vitest **53 文件 / 398 用例**、发布器 **18/18**、性能规则 **51/51**、PRD **8/8**、tsc、CF build/release verify **105 tracks / 315 charts / 906 files / 497.1 MiB** 通过；未改 lane 映射、判定、计分、音频内容或谱面，BS-D002 不触发。 |
| **v1.9.210** | 2026-09-16 | **Daily 重置从固定时区说明升级为实时倒计时与无刷新换题**：Home 与 Daily Challenge Board 显示紧凑 `Resets in {h}h {m}m`，每分钟更新并在页面重新可见时立即校准；跨过 UTC 午夜后无需 reload 即切换新曲、日期化 Play URL 和新日期的本机分数集，旧日挑战不再继续冒充 today，榜单异步刷新期间也不会短暂暴露昨日续玩 URL。新合同在旧 artifact `3720099b6b26` 上 desktop **1/1 failed**；artifact `bd59ee483eab` 的完整 Daily 留存/身份矩阵 desktop/mobile **16/16 passed**，合并 Leaderboard 语义与 320px 合同为 **21 passed / 1 个按项目限定 skip / 0 failed**（22 项）。Vitest **53 文件 / 399 用例**、发布器 **18/18**、性能规则 **51/51**、PRD **8/8**、tsc、CF build/release verify **105 tracks / 315 charts / 906 files / 497.1 MiB** 通过；320×568 Daily 榜单目检无溢出或固定导航遮挡。未重跑完整 production 套件或固定性能采样；未改 Daily 选题算法、榜单记录、玩法输入、判定、计分、音频或谱面，BS-D002 不触发。 |
| **v1.9.211** | 2026-09-16 | **普通成功结算增加低摩擦 `Up next` 连续打歌入口**：完整 Casual / Arcade 成功局在既有教练主建议、复盘、分享和结果信息之后，于 `Choose the next run` 内显示一首确定性下一曲；优先未玩曲目，同组内优先相同 vibe、接近 BPM / 时长，全部玩过后优先最久未玩的同 vibe 曲目。`Play next` 保持当前 tier / mode 与安全 Library `returnTo`，并记录 `results_next_track`；失败、Daily、共享挑战、First Shift、完整 Practice 与分段 Practice 均不显示，原主建议和手机固定动作不变。artifact `0c7c39c27a63` 的 Results、手柄、Daily、挑战、First Shift、Practice 与 Back 关联矩阵 **69 passed / 1 个按项目限定 skip / 0 failed**（70 项）；Vitest **54 文件 / 402 用例**、tsc、CF build/release verify **105 tracks / 315 charts / 906 files / 497.1 MiB** 通过。320×568 完整结算截图目检无横向溢出或固定导航遮挡。未重跑完整 production 浏览器矩阵、发布器/性能规则测试或固定性能采样；未改玩法输入、判定、计分、音频、Canvas draw 或谱面，BS-D002 不触发。 |
| **v1.9.212** | 2026-09-16 | **Home 成功回流从重复上一首升级为连续打歌**：First Shift 完成后，最近一局若为成功且有命中的非 Practice 完整局，Home 主 CTA 显示 `Continue the set`，复用 Results 的确定性下一曲规则并保留原 tier / mode；主 CTA、可玩 demo 与手机固定 Play 始终指向同一下一首。失败或零命中仍按原曲配置 Retry，完整 Practice 仍 Replay，First Shift 顺序与无历史精选回退不变。≤640px 隐藏与固定 Library 导航重复的 Browse、全局页脚已覆盖的 hero rights 及不适用于触屏首屏的键盘 chips；320×568 的 Duo / Calibrate 均保持 ≥44px，且距固定 tabbar ≥8px。最终 artifact `585452194611` 的精确 Home 连播与窄屏合同 **4/4 passed**；同逻辑候选 `abeccac311d5` 的 Home、Daily、streak、First Shift、手柄、移动导航与窄屏关联矩阵 **82 passed / 2 个设备能力限定 skip / 0 failed**（84 项）。Vitest **54 文件 / 403 用例**、tsc、最终 CF build/release verify **105 tracks / 315 charts / 906 files / 497.1 MiB** 通过。未重跑完整 production 浏览器矩阵、发布器/性能规则测试或固定性能采样；未改玩法输入、判定、计分、音频、Canvas draw 或谱面，BS-D002 不触发。 |
| **v1.9.213** | 2026-09-16 | **Results 的下一首从长页末端提升到主决策区**：普通成功完整 Casual / Arcade 的确定性 `Up next` 不再埋在分享、剧情与详细统计之后，而是紧跟唯一教练建议和必要的 Miss review、早于分享；教练建议仍是首要决策，失败、Daily、共享挑战、First Shift 与完整/分段 Practice 继续排除。页尾原 `Choose the next run` 收敛为 `Stay on this track`，只承载 Replay / Play full Arcade / Change setup，不再把原曲操作和下一曲混为一组。旧 artifact `585452194611` 的顺序合同 desktop **1/1 failed**（Next 约 1842px，Share 约 942px）；最终 artifact `47c814110788` 的双端精确合同 **2/2 passed**，Results、分享、手柄、Daily、挑战、三首真实 First Shift、Practice 与移动导航关联矩阵 **74 passed / 2 个项目限定 skip / 0 failed**（76 项，10.9m）。Vitest **54 文件 / 403 用例**、tsc、CF build/release verify **105 tracks / 315 charts / 906 files / 497.1 MiB** 通过；320px 长页截图复核层级清晰且无横向溢出。未重跑完整 production 浏览器矩阵、发布器/性能规则测试或固定性能采样；未改玩法输入、判定、计分、音频、Canvas draw 或谱面，BS-D002 不触发。 |
| **v1.9.214** | 2026-09-16 | **Profile 的成长与连胜入口直达精确下一局**：Night streak 未在今天完成时，不再用 `Keep it alive` / `Start a streak` 把玩家丢回 Library 二次选择；现与 Home 共用唯一下一局决策，按本机 First Shift、最近成功/失败/零命中与 Practice 状态显示 `Start First Shift`、`Continue the set`、Retry 或 Replay，并保留精确曲目、tier、mode 与 shift 参数。连胜卡同时预告曲名/配置，页尾主 CTA 复用同一目标；今天已计入时仍保留 `Today counted`。旧 artifact `47c814110788` 的两条新增 Profile 合同 mobile **2/2 failed**；最终 artifact `e19c6b359b0d` 的 Profile desktop/mobile 精确合同 **8/8 passed**，Profile、Home、First Shift、Daily、streak、导航与移动图标关联矩阵 **86 passed / 2 个项目限定 skip / 0 failed**（88 项）。Vitest **54 文件 / 403 用例**、tsc、CF build/release verify **105 tracks / 315 charts / 906 files / 497.1 MiB** 通过；320px 长页截图复核 CTA、下一曲说明、天梯、统计和成就无横向溢出或固定导航遮挡。未重跑完整 production 浏览器矩阵、发布器/性能规则测试或固定性能采样；未改 gameplay、判定、计分、音频、Canvas 或谱面，BS-D002 不触发。 |
| **v1.9.215** | 2026-09-16 | **Track 配置成为可刷新、可返回的精确运行状态**：Track 读取并安全校验 URL 中的 `tier` / `mode`，玩家切换配置时用 History replace 回写，同时保留 Library `returnTo`；刷新、浏览器返回与分享精确 Track URL 不再重置为 catalog 默认。Results / Library latest run 的 `Change setup`、单人/Duo 退出、载入失败返回与 Results 手柄 right-face 都回到原曲原 tier/mode；非法参数安全降级，Practice Duo 仍按既有规则降为 Casual。旧 artifact `e19c6b359b0d` 的新增精确配置合同 desktop **1/1 failed**；最终 artifact `26618a9890a0` 的双端合同 **2/2 passed**，相关桌面/手机生产浏览器矩阵 **132 passed / 6 个按视口限定 skip / 0 failed**（138 项，5.4m）。Vitest **55 文件 / 405 用例**、tsc、CF build/release verify **105 tracks / 315 charts / 906 files / 497.1 MiB** 通过。未重跑发布器/性能规则测试、完整 612 项 production 基线或固定性能采样；未改玩法输入、判定、计分、音频、Canvas 或谱面，BS-D002 不触发。 |
| **v1.9.216** | 2026-09-16 | **Practice 段落加入精确配置连续性**：Track 选择具名 section 后把 `seek` / `until` 与 tier/mode 一起写入 URL；刷新、精确深链、赛前/运行中退出、载入恢复、Results `Change setup` 与标准手柄 right-face 都回到同一练习段，不再降回 Full track。换 tier、选择 Full track 或离开 Practice 会清除旧范围；只有能与当前谱面 section 精确匹配的合法范围才恢复，非法/过期范围安全显示 Full track。Drill 的 `reps` 仍属于直接重练动作，不写入配置器。旧 artifact `26618a9890a0` 的新增链接 unit **1/1 failed**，段落刷新与退出合同 desktop **2/2 failed**；最终 artifact `8d45b7d45878` 的双端段落刷新/退出 **4/4 passed**、三轮 Drill → Results → Change setup **2/2 passed**，相关桌面/手机生产浏览器矩阵 **132 passed / 6 个按视口限定 skip / 0 failed**（138 项，6.1m）。Vitest **55 文件 / 405 用例**、tsc、CF build/release verify **105 tracks / 315 charts / 906 files / 497.1 MiB** 通过。未重跑发布器/性能规则测试、完整 612 项 production 基线或固定性能采样；未改玩法输入、判定、计分、音频、Canvas 或谱面，BS-D002 不触发。 |
| **v1.9.217** | 2026-09-19 | **赛前退出去除错误的“未保存进度”确认**：单人或 Duo 尚未按 Start 时，点 X 直接回到原曲 Track 配置，保留 tier/mode、Practice 段落与 Library 筛选来源；不会启动音乐或写入结果。开局后 X / Back 仍走冻结音画的退出确认，避免丢失真实进度。旧 artifact 的赛前合同 desktop **3/3 failed**；当前 `45bac1f47c8d` 构建的退出、早期音频与 Track 配置双端专项 **57 passed / 3 个项目限定 skip / 0 failed**。扩大到浏览器 Back、双人、手柄、完整谱、三首剧情曲、曲库与断线恢复时，旧测试预期导致 **129 passed / 3 skip / 2 failed**；修正该测试后双端精确复跑 **2/2 passed**。Vitest **55 文件 / 405 用例**、tsc 与 CF build 通过；未重跑完整 612 项 production 或固定性能矩阵。未改判定、计分、音频内容、Canvas 或谱面，BS-D002 不触发。 |
| **v1.9.218** | 2026-09-19 | **正式单人开局加载期显示可学习的准备卡**：音频仍在下载/解码时，玩家已能看到四轨输入、击打时机与 `Chart moves`；`Loading song…` Start 明确禁用，音频可用后才变为 `Start playing`。Home demo 与 Duo 维持原加载态，未改判定、计分、音频或谱面。新增拦截音频的桌面/320×568 手机合同在旧 artifact **2/2 failed**、新 artifact **2/2 passed**；最终 `bf643e907c59` 的相邻生产浏览器矩阵 **95 passed / 5 个设备或视口限定 skip / 0 failed**，Vitest **55 文件 / 405 用例**、性能规则 **51/51**、tsc 与 CF build/release verify **105 tracks / 315 charts / 906 files / 497.1 MiB** 通过。修正性能脚本，只有 Start 可按才计作可开局；单次采样约 desktop **1.68s**、模拟移动网络/4× CPU **3.79s**，与改动前接近，属于等待体验改善而非下载提速。未重跑完整 production 套件或固定多样本性能矩阵；BS-D002 不触发。 |
| **v1.9.219** | 2026-09-19 | **Duo 等歌期改为共享双人准备卡**：替换两块场地各自重复的 `Cueing audio`，在同一层提前显示与正式开局一致的 P1/P2 左右或上下站位、当前输入方式、禁用的 `Loading song…` 及 `Back to track`；返回保留原 tier/mode，两侧解码完成前 Start 不可用。加载卡获焦，就绪后焦点交给真正的 Start；音频错误与双人原地重试仍由原共享对话框处理。新增合同在旧产物 desktop/mobile **2/2 failed**，最终 `dbba20ec519b` 双端加载与返回 **4/4 passed**，Duo/音频/退出/短横屏相邻浏览器矩阵 **80/80 passed**，音频硬失败恢复 **10/10 passed**；Vitest **55 文件 / 405 用例**、tsc、CF build/release verify **105 tracks / 315 charts / 906 files / 497.1 MiB** 通过。单次可开局采样 Duo desktop **1.68s**、模拟移动端 **3.79s**，未证明下载提速；未重跑完整 production 或固定多样本性能矩阵。未改判定、计分、音频内容、Canvas 或谱面，BS-D002 不触发。 |
| **v1.9.220** | 2026-09-19 | **触控边界抖动不再截断 Hold**：触控拖动越过轨边界 8px（窄轨按 15% 轨宽封顶）才换轨，消除拇指在分界附近 3px 摇摆造成的提前松手 Miss；初触、鼠标/手写笔仍精确映射，明确滑至目标轨的 Slide 保持可玩。坐标以可见 Canvas 的视口 DOMRect 为准，尺寸变化/全屏时使缓存失效。新增 Hold 边界合同在旧产物 desktop/mobile **2/2 failed**，修复后 Chromium 输入所有权 + Slide 双端相邻矩阵 **30/30 passed**；可选 iPhone/WebKit 模拟核心矩阵 **15/15 passed**（不等于真机验收）。Vitest **55 文件 / 408 用例**、tsc、CF build/release verify **105 tracks / 315 charts / 906 files / 497.1 MiB** 通过。未跑完整 production 浏览器/固定性能矩阵或真机手感；未改判定窗、计分、音频或谱面，BS-D002 不触发。 |
| **v1.9.221** | 2026-09-19 | **短屏 Home 试玩避免被固定底栏遮挡**：iPhone 13/WebKit 模拟的 390×664 可视区里，试玩按钮虽在浏览器视口内，却位于固定 tabbar 后面，no-save 提示排在按钮之后；现在先展示 `Demo · no progress saved`，再展示 `Try it here`，键盘/辅助操作聚焦时将两者滚至 tabbar 上方 ≥8px。320×568 同样适用，首屏正式开局 CTA、Calibrate 与长页顺序不变。旧产物新合同 WebKit **1/1 failed**；当前 artifact `a4973ce73973` 的 Home、320px、触控目标在 iPhone/WebKit 模拟 **22/22 passed**，Chromium 桌面/手机 **43 passed / 1 个桌面设备限定 skip / 0 failed**。Vitest **55 文件 / 408 用例**、tsc、CF build/release verify **105 tracks / 315 charts / 906 files / 497.1 MiB** 通过。WebKit 模拟不等于专项真机验收；未跑完整 production/固定性能矩阵；未改音频、判定、计分、Canvas 或谱面，BS-D002 不触发。 |

---

## 1. 项目概述

### 1.1 产品定位

一款国际化、高质感、极致顺滑的**浏览器节奏游戏平台**，面向英语市场中喜欢音乐、风格化都市幻想与乐队人物的轻量音游玩家社区。产品构建完整的 **「节拍幻境 BeatScape」自有内容宇宙**：音频、谱面、封面、音效、艺人笔名、曲名、UI 文案**全部自有生成**，统一服务同一主题——*Feel the Beat, Own the Scape.* 曲库不采购、不搬运商用热单，由运营方本地 **MusicSaas AI** 按 **车载听感 + 都市爵士战斗感（RESONANCE 声波）** 与幻境世界观独立生成，**全曲自有版权**。无需下载、即开即玩，以顶级丝滑音游手感为核心，以专业化数据复盘、极简现代视觉、全端统一律动体验为差异化优势，适配 Reddit、短视频等海外社区传播。

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

> **叙事真相源（2026-08-30 起）**：角色 / 世界观 / 电台剧集 / 商标约束统一以 [`BEATSCAPE-WORLDBIBLE.md`](BEATSCAPE-WORLDBIBLE.md) 为准（NIGHTSHIFT 三人组 · The Late Static 电台）；本节保留的是**内容生成层**的主题红线（关键词池 / 听觉视觉 / 命名 / 权利话术），两层并行不冲突。

**一句话世界观**：玩家进入由节拍构成的极简「幻境城市」——每一次 Perfect 都是点亮街区的光，曲库是这座城市的街区地图，全部由产品方自建。

| 维度 | 必须对齐（On-theme） | 严禁偏离（Off-theme） |
|------|----------------------|------------------------|
| 世界意象 | neon / glass / chrome / pulse / horizon / night drive / voltage / scape / skyline / afterhours | 二次元校园、魔法少女、和风神社、国风仙侠、像素复古堆砌 |
| 听觉 | **车载级宽声场** + **都市爵士战斗感**（funk / acid jazz / neo-soul / brass；RESONANCE 声波）；拍点清晰、可谱面化。全曲库方向见 [`BEATSCAPE-SONIC-DIRECTION.md`](BEATSCAPE-SONIC-DIRECTION.md) | 日系 OP、Vocaloid 感、戏曲、未授权成曲仿唱；复刻第三方 OST 旋律 |
| 视觉 | RESONANCE 漫画排版、既有 NIGHTSHIFT 动漫立绘、清楚的层级与留白、英文 UI | 离开都市音乐主题的插图、遮挡玩法的装饰、表情包风 |
| 命名 | 英文曲名 + 虚构英文艺人；词汇贴近「城市幻境 / 节拍地形」 | 真实歌手/歌名、中文曲名上架、梗图乱码标题 |
| 权利话术 | AI Original · Owned Rights · BeatScape | 「正版热单」「官方翻唱」「原曲授权引进」等误导表述 |
| 生成来源 | MusicSaas 本地 job + 自有封面/音效管线 | 外链商用曲、素材站成曲、玩家上传成曲入库 |

**主题关键词池（生成曲名 / Prompt / 封面时必须从中取至少 1 个语义锚点）**

`scape` · `neon` · `pulse` · `horizon` · `glass` · `chrome` · `voltage` · `skyline` · `afterhours` · `grid` · `echo` · `drive` · `atlas` · `circuit` · `rift` · `bloom` · `lane` · `vector`

### 1.4 目标用户

| 用户类型 | 画像与诉求 |
|----------|------------|
| 英语市场乐迷（核心） | 喜欢 **night-drive groove / stylish urban energy**，愿意尝试原创曲库与免安装节奏玩法；音乐、风格化都市幻想或乐队人物是潜在吸引点。AI 音乐接受度与视觉偏好须分别询问，不预设结论 |
| Reddit / 短视频社区玩家（增长） | 免安装、秒开、高帧率、低延迟纯网页体验；乐于分享丝滑手感与高分复盘截图 |
| 音游精度核心玩家（口碑） | 关注时序精准度、设备手感统一、高密度谱面稳定性；需要专业复盘数据练度提升 |
| 通勤轻量用户（泛用户） | 移动端碎片化；防误触、无弹窗、无系统干扰、弱网可用 |

受众划分是产品假设，不以国籍或“是否讨厌二次元”筛人。角色叙事验证按 [叙事试玩协议](BEATSCAPE-NARRATIVE-PLAYTEST.md) 执行；它与 §7.7 的视觉差异化盲测目的、问题和记录独立。

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

产品选择是原创曲库、免安装节奏玩法、专业数据复盘，以及由三人电台乐队串起的都市音乐故事。既有动漫立绘与漫画版式共同构成风格；不以排斥日系作品定义用户，也不把设计选择写成已证明的竞品优势。手感与叙事吸引力分别通过运行验收和目标受众试玩评估。

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
| 默认键位 | **方向键 ← ↓ ↑ →** → lane 0–3（按物理键码绑定，键盘布局无关） | 预设 Arrows / WASD / DFJK，可 remap，见 §4.8 |
| 手柄 | 仅浏览器 `mapping="standard"`；对局中 D-pad ←/↓/↑/→ 与 face-button 左/下/上/右 → lane 0–3，Menu 暂停/恢复；非游戏内容页 D-pad 空间移动、底部面键选择、右侧面键返回/Home；Calibration 用同一 lane buttons 采样真实设备延迟 | 单人第一只；Duo 两只稳定分配；局中断连自动冻结并释放输入；站点导航与 Home/Play/Duo/Results/Calibration 各专用输入层互斥；Calibration fresh-edge 前必须 neutral；键盘/触屏仍并行 |
| 触屏 | 底部判定线四等分热区；按住 = Hold | 边缘防误触见 §8.2 |
| 判定线 | 屏高约 **15%** 处固定 receptor | — |
| 道语义（生成提示） | 0=kick · 3=snare · 1–2=hat/旋律 | 自动谱面优先外道清晰 |
| Approach Rate | 逐曲写入 chart.`ar`（自动谱流水线；全库中位数 E17.8 / S20.0 / H24.0，区间 11.1–37.5） | **定义见 §4.10**（提前可见时间）；引擎缺省 24 |
| 曲长窗口 | **游戏切片** 60–120s（as-built 全库四档：60 / 75 / 90 / 120s）；**流媒体完整版** 180–216s，见 §6.0.27 | Instant Demo 可裁前 48s（10 首已产 preview） |

### 4.2 音符类型与生成规则

| 类型 | 视觉 | 输入 | Stage 1 | Stage 2+ |
|------|------|------|---------|----------|
| **Tap** | **霓虹菱形**（唯一造型，禁止圆点混用） | 在判定线按下 | ✅ | ✅ |
| **Hold** | 独立头菱形 + 身条 + 独立尾菱形；按住后尾标提升为主目标 | 头按下，持续按住至尾 | ✅（#04 主验） | ✅ |
| **Chord** | 同帧 2–3 道 | 每道独立落在自身判定窗 | ✅ Hard 可出 | ✅ |
| **Slide** | 跨道轨迹 | 滑动或顺序触达 | ❌ 禁止 | ✅（#07 主验） |

**Hold 判定**

- 头部：按 Tap 四档判定并计分  
- 身段：**不计 tick 分**（头+尾两次判定即可）  
- 尾部：须在 `end` 释放；**三档判定窗均 +20ms 吸附**（Arcade 35 / 50 / 70ms）；超窗释放 = 尾 Miss（头分保留）  
- 尾判有可信偏差时显示 `EARLY RELEASE` / `LATE RELEASE`；持续按过尾点属于 Late，整条未起按不显示 release 原因。320px 外轨长文案必须保持在 Canvas 内，主判定仍锚定原道位
- 尾 Miss / 头 Miss 均 **断连击**  
- 自动谱：能量持续 ≥400ms → Hold  

**Slide 判定（Stage 2）**

| 输入 | 成功条件 |
|------|----------|
| 触屏 | 在起点窗内按下 `lane`，再滑入相邻 `to` 道；可在 `end` 完成窗内到达，也可提前到达并持续按住至尾点 |
| 键鼠 | **顺序键**：先在起点窗内按下 `lane` 对应键，再在 `end` 完成窗内按下 `to` 键，或提前按住目标键直至尾点（无需物理滑动） |

- 仅相邻道；跨 2 道以上禁止  
- 起点按 15/30/50ms（Casual 28/55/90ms）记录候选档位，但**只激活轨迹，不计分、不加 Combo、不改 HP/SIGNAL**
- 目标道沿用 Hold tail 的三档 +20ms 完成吸附；在完成窗内到达或释放时即时判定，提前到达并持续拥有该道则由歌曲时间轴在尾点按 Perfect 完成
- 提前离开且尚未进入完成窗会放弃目标持有，后续超时整条只记 1 Miss；暂停/失焦会清空瞬时持有，仅中断前确实持有的目标可在 Resume 倒计时重新抓取，Fresh note 仍不可提前输入
- 起点已命中但从未到达目标道的超时 Miss 显示 `REACH TARGET`；曾提前到达但在尾点前离开的超时 Miss 显示 `HOLD TO END`；整条未起步仍只显示 `MISS`。该副提示不参与计分，窄屏只约束长文案、不移动真实道位 FX
- 视觉状态与所有权同步：未激活为弱虚线，起点命中后为高亮虚线；目标道被提前持续持有时立即切为 5px 实线并放大尾菱形，释放或完成后清除。该反馈不参与判定
- 完成时取起点/终点**较差档位**，只登记、计分一次；任一端超时 = 整条 1 次 Miss
- Stage 1 谱面禁止出现 `slide`  

**Chord**

- 同帧最多 3 键；每键独立计数  
- 同一对象的多道菱形以黑框/米白内芯的静态连接轨组成一组；部分命中后连接轨保留到其余分道结算，不能与同拍独立 Tap 混淆
- 各键相对 `note.t` 独立落在判定窗内；不另设键间时间差限制
- 漏键：漏道 Miss，其余正常  
- 每道命中继续即时显示自己的星爆与真实 `+分数`；主判定词在全部分道结算后只显示一次，以整组最差档位居中于和弦跨度。同档位时取绝对时差最大者决定 EARLY/LATE，不得用三枚相邻主词制造文字墙
- 开启 Thumb chord assist 时，真实 touch 命中同手搭档后自动补判的 Great 参与同一组摘要；组级 `GREAT` 居中于和弦跨度，`ASSIST` 副标签保持在真实补判道中心，不得使用超时帧显示 `LATE`

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

Perfect / Great 先推进连击再读取倍率；Good 会断连，但仍在重置后的 ×1 档计入 **100 分**，不得与 Miss 一样漏分。

**理论满分（排行归一用）**

```text
MaxScore = TotalNotes × 300 × 4
（按全 Perfect 且全程处于 ×4；实际难达，仅作上限校验）
写入 Local Board 的 score > MaxScore × 1.01 → 拒收（防篡改）
P/Gr/Go/M 合计 ≠ TotalNotes 或 Accuracy/MaxCombo 越界 → PB、Local Board、Daily 均拒收
```

**Slide 计分迁移**：`scoringVersion=2` 表示单次完成结算。只对曾含 Slide 的 10 个既有 `track_id+tier` 清理无版本旧纪录（`bs-p3-09`、`bs-s2-01`、`bs-s4-10`、`bs-s5-05`、`bs-s6-34` 的 Standard/Hard）；其他曲目与 Easy 历史成绩不受影响。

**命中得分反馈**：每个由玩家键盘或触控完成的非 Miss 判定，在判定线附近显示与引擎当次增量一致的浮字。Perfect / Great 使用判定提交后的 Combo 倍率；Good 断连后按重置倍率显示 `+100`；Miss 不显示得分。反馈不得依赖输入设备，也不得只在自动补判路径出现。窄屏外轨的判定主词须把字体、描边、当前动画缩放和震屏位移完整约束在 Canvas 内；仅文字组可在必要时向内收，星爆与得分仍锚定真实 lane。

**Chord 组摘要**：Chord 各 lane 的判定、星爆与得分仍独立，但主判定词须等整组完成后只显示一次：取最差档位，同档位取绝对时差最大者，并居中于整组跨度。Thumb chord assist 的主 `GREAT` 服从组居中，`ASSIST` 副标签仍锚定真实补判道。

**Combo 断裂反馈**：只要已有 Combo 被 Good 或 Miss 归零，场中央须以稳定、位置中立的 `COMBO BREAK` 明确解释状态变化，并与既有暗角/音效同步；可见时间为 520ms。断连同帧必须清除仍在播放的 Combo 里程碑，避免庆祝与失败语义并存。断连是判定状态机产生的独立事件，渲染不得根据一帧结束后的最终 Combo 反推；同一帧后续命中已经重新积累 Combo 时也不能吞掉先前断连。该文字属于必要反馈，Reduce Motion 只允许原位淡出，不得将其删除或改成位移动画。

**Combo 里程碑反馈**：阈值为 10 / 25 / 50 / 100 / 150 / 200 / 300。触发条件是本帧 Combo 的前开后闭区间跨过阈值，而不是帧末值必须与阈值相等；同帧多判定的 Chord 从 9 直接到 11 时须显示 `10 COMBO!`。单帧跨过多个阈值时只报告最高值；本帧若发生断连则不显示里程碑，由 `COMBO BREAK` 优先解释状态。

**来音绘制优先级**：持续 Combo 数字属于战绩上下文，必须先于音符与 Chord 连接轨绘制。`3 / 2 / 1 / GO` 倒计时同样属于开局上下文：保留 3 秒负时间预滚、96px 字号、位置、样式、音效与时序，但必须先于预滚音符和 Chord 连接轨绘制。任一上下文与来音包围盒在窄屏相交时，来音后绘覆盖上下文，不能让战绩数字或倒计时挡住下一次输入目标；该规则不改变 Combo、歌曲时钟、输入或判定。

**输入可玩性闸门**：同一 lane 上任何需要 press 的对象（Tap / Hold 头 / Chord 分道 / Slide 头尾）间隔必须 ≥ **100ms**，避免两个 ±50ms Arcade Good 窗重叠，也覆盖 20ms 输入防抖；Hold 从头到尾占用期间禁止同 lane 再出现 press。自动谱面生成器会在 250–550ms 手势时长内就近微调 Slide 尾点，release 校验再次独立拒绝冲突产物。

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
| **FC** | 判定完整且无 Good / Miss | Great 可叠，可叠任何 Grade |
| **AP** | 全 Perfect | 叠在 S |

**荣誉段位** 与单局 Grade 分离，见 §17。

### 4.5 游玩模式（内容绑定）

| 模式 | 失败 | 速度 | 默认推荐曲 | 目标 |
|------|------|------|------------|------|
| **Casual** | 无失败，必打完 | 0.75× / 1.0× / 1.25× | #02 Glass Horizon | 新手、种草 |
| **Arcade** | HP 归零失败 | 仅 1.0× | #01 Neon Pulse / #05 | 挑战、排行 |
| **Practice** | 无失败；高于 0.5× 时连 Miss×3 → 临时 0.5× 持续 5s（音画同步），场内显示倍速与剩余秒数 | 赛前 + 暂停层手动 0.5× / 0.75× / 1×；仅当前 run | #09 Blue Hour Loop | 练度 |

**Arcade HP**

- 初始 **100**；**上限封顶 100**（Perfect 不能加破 100）  
- Perfect +2 · Great +1 · Good 0 · Miss **−7** · Hold 尾 Miss **−5**（整条 Hold 未起按 = 头 −7 + 尾 −5，共 −12）
- 左上 HP 条每次真实下降时短暂显示精确 `−N`；同一次 20Hz HUD 采样内的多个扣血对象显示聚合差值（例如整条 Hold 未起按显示 `−12`）。初始采样、HP 回升以及无 HP 的 Casual / Practice 不显示
- HP ≤ 0 → Failed（不进 Arcade 榜）
- Failed 首帧立即停止音乐、判定与键盘/触控/暂停输入；场内显示 `SIGNAL LOST / HP DEPLETED` 300ms 后进入 Results。Duo 单侧失败时，该半场持续保留失败卡，另一位玩家继续完成本局
- Duo Arcade 结算先比较通关状态：`CLEARED` 必须胜过 `HP DEPLETED`，不能让失败方凭更高的中途分数获胜；双方都通关或都失败时再按 score 决胜，同分为 `DEAD HEAT`

**速度模组（防实现分歧）**

| 模式 | 速度选项 | 音频 | 谱面时钟 | 判定窗 |
|------|----------|------|----------|--------|
| Casual | Note speed 0.5–2.0× | **恒 1.0×** | 只改可见下落时长 | **不变** |
| Arcade | Note speed 0.5–2.0× | 1.0× | 只改可见下落时长 | 不变 |
| Practice | Note speed 0.5–2.0×；赛前与暂停层另选本局 0.5× / 0.75× / 1× tempo | 始终与所选 tempo 同步 | 始终与所选 tempo 同步 | **仍用 Practice=Arcade 窗 ms** |
| Practice 连 Miss×3 | 基础 tempo 高于 0.5× 时临时降至 **0.5×** 持续 5s，显示 `Practice assist · 0.5× · Ns`；随后恢复所选 tempo | 同步 | 同步 | 不变 |

**Note speed 赛前与暂停合同**：Settings 以 0.05× 精调，Track 与普通完整 Play 准备卡均以 0.25× 快调并立即保存到所有模式。准备卡控件只在 Start 前出现，按钮命中区不得小于 44px；开始后若需根据真实谱面修正，单人或 Duo 必须先冻结，再通过 Quick controls 的 0.5–2.0× 原生 range 以 0.05× 调整。变化只更新当前冻结场地的可见 approach，不得重建 session、renderer、音乐时钟或已解码音频，Resume 仍先走 3 秒倒计时；活动判定中的外部设置变化延迟到下一次暂停。准备卡存储失败时保留当前 run 的选择并显示 `This run only`，暂停存储失败则保留旧值并显示错误。未完成的 First Shift 首关与 Home demo 只显示静态值，避免首次教学额外决策。

**Practice tempo 合同**：只在单人 Practice 的准备卡与暂停层显示同一组 50% / 75% / 100% 三档，使用原生 radio 语义。玩家可在第一拍前选择；按下 Start 后创建的首个音乐源必须直接使用所选倍率，音乐与谱面时钟保持同步。局中选择即时取消旧的临时 assist，并贯穿 Resume、Restart track/section 与同一 run 的自动 Drill 轮次；新 run 重置为 1×，不写 `bs_settings`。恢复和轮间仍是 **3 个真实秒**的安全倒计时，慢速不得把倒计时拉长。手动 0.5× 的 HUD 显示 `Practice tempo`，不得伪装成有剩余秒数的自动 assist。320×568 的准备卡首屏必须同时看见 Start、四轨提示、击打时机、Note speed 与三档 tempo，且不得横向溢出。Casual、Arcade、Duo、Daily 与挑战路径不得暴露该控件。

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
Loading → Countdown(3s) → Playing ⇄ Paused → Resume countdown(3s) → Playing → Finished
         ↘ X / browser Back / mobile back → Exit confirm → 前一页（本局分丢弃）
         ↘ (Arcade HP=0) → Failed → Retry | Casual clear
```

同文档历史返回会先恢复当前 Play / Duo URL，再打开游戏内退出面板；Keep playing 保持本局，Leave 才执行原 Back。
关闭标签、刷新或跨文档返回在已开局期间使用浏览器原生 `beforeunload` 提示。加载中与未开局不拦截。

单人暂停菜单是可访问 modal，同时提供 **Resume**、指针/触控可用的 **Restart track** 与
**Leave track**；严格分段 Practice 显示 **Restart section** 并保留同一 `t0–t1`。打开时
聚焦 Resume，Tab / Shift+Tab 限制在暂停层的 Quick controls 与三个动作内，Escape 恢复；短竖屏（portrait、≤640×700）默认把
Quick controls 收为 48px `Adjust` 披露入口，使 Resume、Restart 与 Leave 无需滚动即可完整位于 320×568 首屏；展开后仍进入同一焦点环。
桌面、宽裕竖屏与 ≤520px 高短横屏默认直接展示完整控件。退出确认取消后回到暂停层，
恢复或重开后焦点返回 Pause。桌面 `R` 快捷键行为一致。Duo 不允许只重开
单侧；任一暂停来源都只显示一张共享面板，Resume 同步进入 3 秒倒计时，Restart duel 同时
重建两块场地并在二者 ready 后把焦点交给唯一 Start。

两种暂停层共用一个 **Quick controls**：Music、SFX 与 Background dim 为 0–100% 滑杆，Note speed 为 0.5–2.0× 原生滑杆，Hitsounds、Haptics 与 Reduce motion 为独立开关；具备触摸能力的设备另显示 Thumb chord assist。
只有成功写入本机设置后才广播变化；当前单人音乐总线、共享 SFX 总线与 Duo 主音乐端即时应用音频项，
Background dim 则即时应用到当前单人或两块 Duo Canvas；Note speed 只在场地已冻结时同步到当前单场或两块 Duo 的可见 approach，恢复前继续经过 3 秒倒计时。暗层必须绘在环境 wash、光束和角色立绘之后，
轨道、判定线、音符、瞬时判定与 HUD 之前，因此 100% 暗化也不能隐藏玩法信息。调整不得重新创建
`Conductor`、渲染循环或 session，不得重置分数或重新请求音频。运行中从其他标签页收到的 Note speed 变化要延迟到下一次暂停，不能让在判定中的音符突然跳位；Haptics、Fancy FX、Reduce motion
与触控辅助等其余玩法设置继续使用本局开局值。存储被浏览器拒绝时保留原值并显示错误。

正式开局浮层读取当前 chart，只对实际存在的 Hold / Chord / Slide 按首次出现顺序给出
一次简短操作说明，并以同道身条、横向连接或斜向路径缩略图预演实际谱型；Slide 明确提示“移动到目标道并持续按住至尾点”。缩略图为装饰性，完整语义继续由相邻文本承担。普通 Tap 已由键位/触控总提示覆盖，
不重复列出。该说明不改变判定与谱面。

单人和 Duo 的开始手势同时触发 AudioContext 解锁与全屏请求；标准 / WebKit API 统一处理。
准备层显示期间，全局玩法监听不得消费 lane、R 或 P/Escape。可绑定的 Space / Enter 聚焦在原生按钮时必须正常触发开始；只有开始事务成功、倒计时建立后，玩法监听才接管这些键。单人和 Duo 共用该边界，避免自定义键位把唯一键盘启动入口锁死。
触屏页在自动请求被浏览器拒绝时保留手动 Fullscreen 入口；进入后同一控件切换为具名 `Exit fullscreen` 的向内收拢图标，退出完成后恢复。无 API 时不显示。单人和 Duo 在 ≤520px 时收为仍具精确可访问名称的标准四角图标，按钮本体固定 44×44px，为曲名和当前模式让出顶栏空间；更宽触屏保留文字标签。
已开始且正在运行的对局通过该控件、系统或浏览器退出全屏时自动暂停，避免退出动画或误触期间继续判定；玩家主动 Resume 后再入场。

对局中，实时 Canvas 禁页面拖动、双指缩放与长按菜单；沉浸式文档根层阻断滚动链和边缘回弹。准备、暂停与错误覆盖层仍允许纵向触控滚动和页面缩放，不能因游戏手势锁导致小屏动作不可达。

### 4.8 设置与按键

| 设置 | 范围 | 存储 |
|------|------|------|
| Key remap | 任意 4 键（**物理键码**；预设 Arrows / WASD / DFJK，重复键禁存） | `bs_keys` |
| Global offset | −200…+200 ms；与 chart.`audio_offset_ms` **相加** | `bs_offset_ms` |
| Note speed | 0.5–2.0×，所有模式只改可见下落时长；Settings 0.05× 滑杆，Track 与普通完整 Play 准备卡 0.25× 快调并立即保存 | `bs_settings.scrollBias` |
| Background dim | 0–100%，默认 25%；只压暗环境 wash、光束与角色立绘，玩法元素保持后绘；Settings 与暂停 Quick controls 均可调整 | `bs_settings.backgroundDim` |
| Hitsounds | On/Off | `bs_settings` |
| Haptics | 默认 On，桌面与手机均显示；触屏在支持 Vibration API 时、已分配标准手柄在支持 `vibrationActuator` / `dual-rumble` 时，对命中、Miss、Slide 目标锁定/合法重抓、Combo / SIGNAL 里程碑给出短脉冲，与 Hitsounds 独立 | `bs_settings.haptics` |
| Fancy FX | On/Off；`prefers-reduced-motion` 强制 Off | `bs_settings` |

**Settings 开关合同**：所有布尔玩法/音频设置保留原生 `checkbox` 与 checked 状态，同时显示可见 `On / Off`；实际 input 命中区至少 48×44px，整行可点，键盘 Space 可切换且 `:focus-visible` 必须有独立高对比焦点环。桌面与手机不得退回仅靠颜色或 18px 系统框表达状态。

**Settings 滑杆合同**：Music volume、SFX volume、Playfield background 与 Note speed 保留原生 `range`、键盘 Arrow 和手柄调值行为；实际 input 高度不得小于 44px，轨道、当前位置和焦点必须有可见的非系统品牌反馈。视觉定制不得改变各字段现有 min/max/step、自动保存或辅助技术读出的数值。
| Practice tempo | 赛前与暂停层 0.5× / 0.75× / 1×，音画同步；赛前选择直接控制首个音乐源；仅当前单人 Practice run，重开与自动 Drill 轮次保留，新 run 重置 1×；Miss×3 临时 0.5× / 5s 后恢复所选档位 | 不持久化 |
| Thumb chord assist | 任意具备触摸能力的设备在 Settings 与暂停 Quick controls 均显示开关（默认 On）：暂停修改只作用于当前局尚未完成的判定，不回写既有成绩；只有搭档道由真实 touch pointer 命中时，同手和弦超时未按才记 Great；组级 `GREAT` 按和弦跨度居中，`ASSIST` 仍锚定补判道；外接键盘、鼠标或手写笔不继承设备级辅助 | `bs_settings.chordAssist` |
| Music / SFX 音量 | 0–100 滑条（默认 0.70 / 0.55） | `bs_settings` |
| Board name | ≤24 字（默认 "Player"）；保存成功后页头身份与首字母即时同步 | `bs_display_name` |

Settings 首屏提示同时覆盖 early / late，直接指向 quick calibration 与下方 Global offset；有效字段在修改时即时写入本机，不依赖页底 Save：返回手势、底部导航或进入校准不会丢失。
Background dim 在 Settings 与暂停 Quick controls 共用同一 0–1 存储值；旧存档缺字段或字段非法时回退 25%，合法值读取时限制在 0–100%。
非法 Board name 与重复键只阻止对应字段，其他设置继续保存；浏览器拒绝站点存储时显示失败状态，不宣称成功。
Board name 的同页成功写入必须立即更新全局页头头像；同源其他标签页也必须跟随已落盘值。校验失败或存储拒绝不得广播或渲染一个尚未保存的身份。
Recalibrate 与 Global offset 放在同一 Profile 卡内，手机无需滚过 Audio / Gameplay / Key map 才能进入校准。
Settings 在 ≥900px 使用两列独立控制栈：左列 Profile → Audio，右列 Gameplay → Keyboard controls，避免等高网格产生大块空白，并让常见 1280×720 桌面首屏同时看到核心玩法设置；<900px 按原 DOM 顺序恢复单列 Profile → Audio → Gameplay → Keyboard controls，不允许横向溢出。
触屏设备默认折叠 Key map 为“Keyboard controls · External keyboard”入口（≥44px），需要蓝牙/外接键盘时仍可展开；桌面默认完整展开。
Haptics 在桌面与手机均显示并独立于 Hitsounds 保存，允许玩家在连接控制器前预先关闭。触屏 Slide 目标锁定/合法重抓使用 6ms 轻脉冲；已分配标准手柄使用短促高频 `dual-rumble`，尾点完成继续使用既有判定脉冲。命中与 Miss 使用可区分的高/低频强度，Duo 的两只手柄独立节流。浏览器不支持 Vibration API / Gamepad vibration actuator、控制器不支持 `dual-rumble` 或 API 拒绝时静默无操作，不能因此阻断游玩、音效或判定。旧 `bs_settings` 缺少该字段时按默认 On 读取。
键位预设是互斥 `radiogroup`：Arrow keys / WASD / D F J K 只允许一个 `radio` 被选中，当前项是唯一 Tab 停靠点；方向键循环选择，Home / End 跳到首尾。自定义逐道绑定不伪装成第四个可选 preset，但必须保留首个预设作为键盘可达入口。逐道重绑会向辅助技术读出“当前键 → 等待新按键 → 保存/错误”的状态。非法 Board name 与重复键必须在控件自身声明 invalid 并关联具体错误，不能只依靠颜色或邻近文案。
键位存储与命中始终使用物理 `KeyboardEvent.code`；支持 [WICG Keyboard Map](https://wicg.github.io/keyboard-map/) 的浏览器须在 Settings、Home、Play、Duo、Calibration 显示当前布局实际印字，并监听布局切换。API 不存在、被拒绝或返回不可读标签时默认回退既有键名；Settings 须提供仅影响显示的手动 US QWERTY / French AZERTY / German QWERTZ 常见字母换位选项，并在手机外接键盘面板中保持 ≥44px 触控目标。手动选择不得改变存档键位、判定或阻断游玩。
触屏设备首次在非编辑区收到玩法键盘输入后，Home、单人赛前、Duo 座位及单人局内键帽须显示实体键位，并说明触控仍可使用；不把系统返回/媒体键当成该信号。纯触控局不分配键帽图像；局中接入键盘应按需绘制，不重启音频或对局循环。熟练玩家若在 GO 后首次用键盘，键帽立即显示 2.5 秒后按 650ms 淡出；Reduce Motion 到时直接隐藏，不改变正常开局与恢复的淡出规则。该提示状态只在当前页面生命周期保留，不持久推断键盘连接。320×568 的主开局动作与 Note speed 控件仍须完整可见，后者不得裁切说明或 ± 按钮。此显示切换不改变触控判定、辅助资格或谱面。
逐道重绑只消费可实际绑定的无 Ctrl/Command/Alt 键盘输入：浏览器快捷键不得被阻止或写入；Escape 取消等待，Tab 退出等待并继续原生焦点导航，避免离开控件后仍存在隐形全局捕获。只带 Shift 的普通键仍按物理位置绑定。

### 4.9 首次进入与下一局（as-built · 直接可玩）

> v1.9.5：Home 不再显示首访弹窗，也没有独立 warm-up 分流。新玩家和回访玩家在同一主位置看到**当前唯一下一局**；`bs_onboarded` 仍会在任意一局或校准完成时置位，但不再作为 Home 门控。

| 条件 | 行为 |
|------|------|
| 新玩家访问 Home | 主 CTA **Start first run** → `bs-s1-05 Voltage Drop · Easy · Casual · shift=studio`；没有前置弹窗或强制校准。页内 `Try it here` 试玩同一下一局，但以可见与可访问 no-save 提示明确不写入进度 |
| 回访玩家（First Shift 未完成） | Home 主 CTA、固定 Play 导航和 Home demo 同时指向下一未完成节点：Voltage Drop → Chrome Riff → Skyline Hook，均为 Easy · Casual 并保留 `shift` 参数。已有完整局但故事仍为 0/3 时显示 `Start First Shift`，不再误称 `Start first run`；故事已开始后显示 Continue |
| First Shift 已完成且有有效完整历史 | 最近一局成功、有命中且非 Practice 时，Home 主 CTA、固定 Play 导航和 Home demo 同时指向确定性下一曲，显示 `Continue the set` / `Play` 并保留原 tier / mode；失败或零命中局按原曲配置显示 `Retry last run` / `Retry`，完整 Practice 按原曲配置显示 `Play again` / `Replay`。Library 最近对局卡仍恢复最近原曲，零命中明示 `No notes hit`，且该恢复标签在 320px 仍可见 |
| First Shift 已完成但无有效历史 | 三处入口同时进入第一首可用的人工精选下一曲；当前为 `bs-s1-01 Neon Pulse · Easy · Casual`。已下架曲目的旧历史不生成入口 |
| 曲库 / 曲目页 | 自选；Difficulty / Mode 为 ≥44px 互斥 radio group，默认取 catalog `default_tier / default_mode`；每组单一 Tab 停靠并支持方向键循环、Home / End。Practice 额外显示 Full track + 当前谱面具名段落，选择后用精确 `seek/until` 开局；切换 tier 回到整曲。桌面 Play 紧接配置器并在 1280×720 首屏可见；手机固定栏右侧使用当前曲 Play，左侧已选摘要可直接回到配置器并聚焦当前 Difficulty。Run setup 双端默认常显选择与所选 Arcade PB，其余难度密度、谱型、失败/计榜规则通过单一 ≥44px Details 按需展开，谱面错误自动展开恢复入口 |
| 中途 Exit | X / browser Back / mobile back → 游戏内 *Leave the Scape?*；Keep playing 恢复，Leave 才丢弃本局并执行离开 |
| Replay | Results → 同 track / tier / mode 重开，重新 Countdown |
| 对局完成 | `setOnboarded()` + 写 `bs_last_run` → /results |

Home hero 的首行能力文案必须匹配当前可用的主要输入面：已连接 W3C standard 手柄时优先显示 `4-lane rhythm game · controller ready`；无手柄的粗指针设备显示 `4-lane rhythm game · touch ready`；其余桌面显示 `4-lane rhythm game · keyboard + controller`。Home 只维护一份标准手柄分配并继续传给可玩 demo：试玩蒙版显示 D-pad / face buttons 及键盘或触控后备，进入真实 `PlayField` 后同一手柄可直接判定；结束卡继续使用该分配，底部/右侧面键分别进入正式局/重试。结果动作必须先经历两个动作键都松开的 neutral frame，且断连或重分配后重新上锁，避免最后一次击打或带键重连误触。进入正式局后若共享 AudioContext 仍在运行，准备卡显示 `Face down · Start` 并要求导航按键释放后 fresh press；如果玩家直接深链进入且浏览器音频尚未解锁，则显示输入面适配的 `Click/Tap Start once · Browser audio`，不能用 Gamepad polling 假装可信音频手势。≤360px 时装饰性 `ON AIR` slab 必须给试玩按钮让位，按钮、手柄卡、结果动作与固定导航不得互相覆盖；这些展示规则不改变底层 lane 映射、键盘物理绑定或触控命中逻辑。

Home hero 在主 CTA 后以紧凑的 RESONANCE 来电引语补充 NIGHTSHIFT 语气，再嵌**真机可玩 demo**：曲目、难度和模式镜像同页主 CTA，但动作命名为 `Try it here`，并以名为 `Interactive demo. Progress is not saved.` 的区域和可见 `Demo · no progress saved` 区别于正式进度；蒙版下只运行轻量 `HeroGameplayPreview` 循环动画，不取谱面、音频或完整对局模块。试玩动作与 Sound 解锁 AudioContext 后，谱面与异步 `PlayField` 并行加载并 autoStart。等待时显示 `Starting…`，同 turn 双激活只接受一次；音频拒绝或 gameplay assets 加载失败均保留原试玩卡并按原因显示可重试 alert，不能用原始异常替换整个入口。玩家离页或 Home 下一局身份变化会废止未完成尝试，不能在权限 Promise 返回后继续下载已放弃的谱面/对局代码。试玩结束后显示可访问的 `Demo complete` 结果：有命中时给 ACC / Grade，零命中给 `No notes hit`；明确不存档，并提供当前精确正式局与原地再试，不得静默自动重开。连接标准手柄时，结果卡可见提示 `Face down · Full run` / `Face right · Retry`，对应 W3C standard buttons 0/1；卡片出现后必须先松键，最后一次 lane 输入不能穿透成结果动作。整个 catalog 不可用时，页面只由顶部 `Track list unavailable` 发出一个权威 alert，试玩区改为非交互 `Demo offline` 占位，不重复播报技术错误，也不提供必然失败的完整对局链接；重连成功后主 CTA 与同曲真实试玩必须一起恢复。demo 只供立即试打，不写 First Shift、last run、PB 或榜单；完整主 CTA / 固定 Play 导航才进入剧情局。

在带固定底栏的短屏上，`Demo · no progress saved` 必须在可见与 DOM 顺序中先于 `Try it here`；键盘或辅助操作聚焦试玩按钮时，按钮与提示都需位于底栏上方至少 8px。试玩是可向下滚动的次级入口，不要求在 320×568 或 Safari 浏览器 chrome 占用后的首屏与正式局主 CTA 同时出现。

```text
1. 首访 Home → Start first run（Voltage Drop · Easy · Casual · First Shift 1/3）；`Try it here` 仅试玩并明示不保存进度
2. 对局内唯一开始按钮解锁 AudioContext；可选 Sound check 以 `Checking…` / 成功 / 可重试错误明确反馈且双击只发起一次解锁；校准可随时从 Home / Settings / Track 进入，但两者都不阻塞首局
3. 完成 → bs_onboarded=true + First Shift 进度 → Results
4. Results / Home / 固定 Play 继续下一剧情局；三首完成后，最近成功且有命中的非 Practice 完整局推进到确定性下一曲，失败、零命中或 Practice 保留原曲配置重试；没有历史才进入精选下一曲
```

### 4.10 Approach Rate

```text
APPROACH_VISIBLE_BEATS = 64        // engine/geometry.ts（v1.9.3 as-built；旧值 50 作废）
approach_beats = APPROACH_VISIBLE_BEATS / chart.ar
note_speed     = clamp(1 / (1 + scroll_bias), 0.5, 2.0)
approach_sec   = approach_beats × (60 / BPM) / note_speed
```

- `ar` 为**逐曲值**，由自动谱流水线写入 chart.json（全库中位数 E17.8 / S20.0 / H24.0，区间 11.1–37.5）；引擎缺省 24。
- Note speed 只改变音符在屏幕上的可见时长，不改音频速度、歌曲时钟、谱面时间或判定窗；旧 `casualSpeed` 字段不再参与计算。
- 判定线 = 短边 × **15%** 距底（减 safe-area）；下落进度 >88% 后有视觉缓动——只改观感，不改判定时刻。
- 参考：ar20 @160BPM ≈ 1.20s 可见时间（全库 approach 中位数 E1.73s / S1.54s / H1.28s）。禁止另造像素速度常数。

### 4.11 倒计时 / 暂停 / Miss / 失败

| 事件 | 行为 |
|------|------|
| Loading 完成 | **上架音频**（m4a）decode 成功 + chart 解析 + `total_notes` 校验通过 |
| 赛前音频等待 | 普通 Casual 在音频下载或解码期间显示 `Preparing your run`，只有音频真正就绪、`Start playing` 可操作后才显示 `Ready to play`；First Shift / Arcade / Practice 保留各自任务标题。单人和 Duo 显示收到的真实下载字节进度，缺少文件总长度时使用不定进度，下载结束后单独提示解码，不编造完成百分比；失败重试与退出仍保留。 |
| 正式开局提示 | 第一视觉层必须先说明任务 / 玩法，不以生成来源或版权信息开场：有效 First Shift 显示 `First Shift · {node}`，普通 Casual 显示 `Ready to play`，Arcade 显示 `Arcade run`；整曲 Practice 显示 `Practice run`，单次有界分段显示 `Section practice`，多轮分段显示 `{N}-rep drill`。`AI Original · Owned Rights` 保留为开始卡底部的低层级声明，Home hero 继续使用独立 `Try the beat`。粗指针设备显示四条彩色触控 lane、可访问名称 `Four touch lanes` 与明确击打时机的 `Tap notes on the line`；细指针显示当前实体键位。Chart moves 必须匹配当前主输入面：纯触屏 Hold / Chord / Slide 使用 `Touch / Lift / slide`，键盘或已连接手柄使用 `Press / Release`；不得同屏混用冲突术语。每项同时显示与实战一致的连接关系缩略图，但缩略图从辅助技术隐藏，文本继续承担完整语义。单人 Practice 准备卡还必须显示与暂停层共用的 50% / 75% / 100% 原生 radio，当前选择直接控制首个音乐源。精确 `studio` / Voltage Drop / Easy Casual 且节点未完成的 First Shift 首关，输入提示、击打时机、Note speed 与 `Chart moves` 必须在 DOM 和视觉顺序中先于 `Start playing`，让新玩家读完当前谱面的 Hold 规则后再开始；普通 Casual、Arcade、Practice、Daily、挑战及已完成节点重玩继续由 CTA 先行。只有 Home hero 的 `Try it here` 试玩显示 `Demo · no progress saved`，正式 Play/Duo 不得复用该文案。320×568 上 `Start playing` 必须保持单行、≥44px 且 ≤64px，且四轨提示、操作文案、`Chart moves`、CTA 与 Practice 的三档 tempo（如适用）完整位于首屏内，底部权利声明可在同一开始层滚动到达。该 First Shift 首关若前 3 个判定全 Miss 且零命中，以 `aria-live` status 显示 `Find the line`；触屏正文为 `Tap the lanes as notes cross the line`，键盘/手柄正文为 `Press the lane controls as notes cross the line`，首次 Perfect / Great / Good 后隐藏。救援态复用左上零分表现卡 footprint，不得新增横跨音符下落通道的面板；失败/未完成重试仍启用，完成后的重玩不再启用 |
| Note speed 调整 | 普通完整 Play 在准备卡提供 44px `− / +` 快调，范围 0.5–2.0×、步长 0.25×，立即保存并以 `Visual · saves` 明示只改下落视觉且跨模式生效；存储失败改为 `This run only`。Start 后准备控件消失；单人或 Duo 暂停 Quick controls 提供同范围、0.05× 步长的原生 range，并只在冻结状态更新当前场地，Resume 仍走 3 秒倒计时。未完成的 First Shift 首关与 Home demo 保持静态读数 |
| First Shift 救援进度 | `Find the line` 显示期间在同一卡片内持续更新 `{judged} / {total} notes`，不得因覆盖零分表现卡而移除整局进度；不扩大卡片 footprint。该高频数字为视觉辅助并从 live region 隐藏，救援标题与动作提示仍只播报一次 |
| First Shift 零命中结算 | 未推进故事节点的恢复提示必须匹配当前输入面：粗指针触屏使用 `tap a lane`，键盘使用 `press a lane key`，已连接标准手柄优先使用 `press a lane button`；不得改变精确 Retry 或故事节点身份 |
| Catalog / Track / Run / Audio / Route 加载失败 | Home/Library 显示 `Track list unavailable` + 原地重试；Home 主 Play 临时改为 `Reconnect tracks`，试玩只显示非交互 `Demo offline`，全页保持单一 alert，恢复后主 CTA 与试玩一起回填；Library 隐藏筛选与假空结果；Track 网络失败与无效 ID 分别显示 `Signal interrupted` / `Track not found`。Play/Duo 在曲目、谱面或异步模块初始载入失败时显示 `Run could not load`，保留当前曲目、难度、模式、URL 与 Library 来源并原地重试；无效 ID 显示 `Track not found` + Library 出口且不提供 Retry。对局音频自动恢复耗尽后继续保留 route/chart/document 原地重连；Duo 两端共用一个故障对话框与一次同步 Retry；两类界面仅显示稳定 `Support code`，不展示原始浏览器错误或资源地址。全局 lazy route 的加载边界只替换主内容，页头、当前导航与手机 tabbar 保持稳定，快速态预留剩余视口；等待超过 3 秒显示仍继续加载的 `Still connecting` 与安全出口。reject 或渲染崩溃进入 `Signal lost`，不展示原始异常。两种整页 Reload 均保留当前目的地，Home 出口使用部署 base |
| Countdown 3.0s | 可弱节拍器；**主曲未起、不判定** |
| GO = t=0 | 主曲与谱面时钟 **同时启动** |
| 有效击中时刻 | `note.t + audio_offset_ms/1000 + user_offset_ms/1000` |
| 未击中自动 Miss | 过点后超出 Good 窗仍无击中 → Miss，断连 |
| Hold 中段松开 | 尾预定 Miss（头分保留） |
| Pause / 系统中断 / 手机旋转 | 手动 Pause 按钮或已分配标准手柄 Menu 冻音画时钟；`visibilitychange` hidden、运行中 `window.blur`、已分配手柄断连/替换，或共享 `AudioContext` 进入 `suspended` / Safari `interrupted` 等任意非 running 状态 → **自动 Pause**，覆盖切标签、桌面切窗、控制器故障、系统面板、来电/音频焦点与设备切换；运行中的触屏完整对局真正跨横竖方向 → **自动 Pause**，同方向浏览器 chrome 高度变化不打断。手柄故障会释放其全部 lane source，并在暂停层说明后备输入与重连状态；Duo 多场上报折叠为一次共享冻结。回到页面、设备恢复或旋转完成后均由用户手动 Resume；Resume/Menu 与退出面板 Keep playing 必须由当次用户手势先把 AudioContext 恢复为 running，再走 3.0s 同轴再入场，期间歌曲时间、判定和 Fresh-note 输入冻结，倒计时自身再暂停会续剩余时间。浏览器拒绝恢复时保持 modal 与冻结状态并显示可重试错误，不得放回无声/停钟对局。单人 Restart track/section 与 R 同样先恢复音频、成功后才清旧局；拒绝时保留旧暂停局，等待期间打开退出确认则保留 Restart 意图但把新局冻结在确认层背后。中断时清理可能丢失释放事件的物理 input source；若一个 Hold 的 head 已命中且 tail 未结算，玩家可在倒计时内重新按住该 lane，避免恢复后必吃尾 Miss。单人显示一张可访问 modal，聚焦/锁定 Resume、Restart track/section、Leave track 三个动作，Escape 或已分配标准手柄 Menu 恢复，取消退出回到暂停层，恢复/重开后焦点回 Pause。单人 Practice 在 Quick controls 之前增加本局 `Practice tempo` radio group，且其选择同样进入焦点环；Casual、Arcade 与 Duo 不显示。已分配标准手柄在暂停与退出层使用 D-pad 或左摇杆移动/调值、bottom face 选择、right face 返回，modal 交接先等待 neutral，且图例不依赖 Xbox/PlayStation 字母命名。Duo 任一座位可操作共享层但同帧只执行一个动作，不允许单场恢复或重开；320×568 单人暂停占满动态视口并让 Practice tempo、全部主动作与图例首屏可见 |
| 防熄屏 | 正在运行且未暂停/未打开退出面板时，按能力请求一把 screen Wake Lock；单人/Duo 共用页面级锁，Pause、退出面板、完成、离开或隐藏即释放，Resume 后重取；API 缺失、拒绝、低电量或系统撤销均静默降级，不阻止玩法 |
| Arcade HP=0 | 立即停谱并冻结判定/输入；场内显示 `SIGNAL LOST / HP DEPLETED` 300ms，再进入明确标记 `ARCADE FAILED` 的 Results；不写 PB / Local Board。Duo 已失败半场保持失败卡，另一半场继续 |
| Duo Arcade 结算 | 一方 `CLEARED`、一方 `HP DEPLETED` 时通关方获胜；双方状态相同才比较 score，同分为 `DEAD HEAT`。每位玩家的状态、Score、Accuracy、Max Combo 与 P/G/G/M 均显式标注；Accuracy 已是 0–100 百分数，不再二次乘 100 |
| Duo 结果交互 | 结果层使用 `aria-modal=true`；打开时聚焦 Rematch，Tab / Shift+Tab 在 Rematch 与 Exit 内闭环，Escape 直接离开已完成对局。任一已分配标准手柄可用 D-pad 或左摇杆移动、bottom face 选择默认 Rematch、right face 退出；进入结果及 Rematch 交接时均先等待相关动作键 neutral。Rematch 重建双场时不丢失键盘或手柄路径，待二者 ready 后聚焦唯一 Start |
| Chord 判定 | 各键相对 `note.t` 独立落在各自窗口；无额外键间截止线，漏道只记该道 Miss |

**单人键盘暂停补充**：Escape 始终恢复；P 未绑定 lane 时与 Escape 一样恢复，R 未绑定 lane 时从暂停层直接重开。P / R 已绑定 lane 时不触发冲突动作；桌面暂停正文只提示当前有效恢复键，触屏不增加键盘文案但外接键盘行为仍可用。Cmd/Ctrl/Alt 修饰命令保持浏览器所有权。P / Escape / R 的自动重复 keydown 不执行第二次恢复或重开，动作只接受新的非 repeat 按下边沿。

### 4.12 舞台几何（防 UI 返工）

| 项 | 真值 |
|----|------|
| 判定线 | 距底 = 短边 × **15%**（含 safe-area） |
| 四道 | 对局区均分；热区=道宽 |
| 移动端 | 竖屏与短横屏均可玩；仅实时 `.play-canvas` 使用 `touch-action: none`，覆盖层保留触控滚动与缩放；沉浸式根层禁止滚动链/回弹；320×568 竖屏 Duo 的两块 Canvas、判定线与 Pause 必须同时完整位于视口且每场 lane travel ≥180px，document 不滚动；≤520px 高横屏的完整判定线 / judgment / Pause 同样必须在视口内。运行中跨横竖方向自动暂停，同方向 viewport 高度变化不暂停。触屏 Duo 固定 P1→P2：竖屏为 Top/Bottom，短横屏为 Left/Right，准备卡明确每位玩家点击自己的四条 lane |
| PC 对局区 | 最大宽 **560px** 居中 |
| 键位浮层 | 非触屏或已识别外接键盘的触屏设备按当前实体键盘布局渲染；分配标准手柄后运行中改为 ◀ ▼ ▲ ▶，准备卡仍同时保留键盘后备键位和 `Controller ready`。非触屏单人正式准备卡在主动作后显示 `P / Esc · Pause` 与 `R · Restart`；若 `KeyP` / `KeyR` 已绑定任一 lane，就移除冲突项。触屏、Duo 与 Home hero 不显示该快捷提示。共享 AudioContext 已运行时，正式单人或 Duo 卡追加 `Face down · Start` 并接受已分配控制器释放后的 button 0 新边沿；未运行时按触屏/桌面显示 `Tap/Click Start once · Browser audio`，原生 Start 继续负责首次解锁。Duo 的 P1/P2 任一控制器均可启动，但同帧只执行一次；从结算重赛进入准备层时重新要求 neutral。赛前与 3 秒倒计时始终显示；前三个有效完整局常驻。第 4 局起单人 Casual / Arcade 在 GO 后 650ms 淡出，Resume / Restart 倒计时重新显示；Reduce Motion 在 GO 后直接隐藏。熟练玩家局中首次切入键盘时显示 2.5 秒并再次淡出。Practice、Duo、Home hero 常驻；纯触屏不创建键帽精灵 |

### 4.13 个人最佳（PB）

同一 `track_id + tier + mode`：

1. 仅成功完成的整曲 Arcade 写 PB；更高 score 覆盖，同分以更高 Accuracy 覆盖
2. Casual/Practice 保留完整局 run history，但不写 PB / Local Board；赛前明确标记 unranked
3. as-built：`bs_scores` 每个 `track|tier|mode` 键**只保留最高分一条**，全表上限 200 条（旧「history 10 条」作废）
4. 读取与写入均过滤空曲目、非法 tier/mode、负数/非有限 score、越界 Accuracy 与非法时间，坏记录不得进入 Track / Results UI
5. Track 的 Run setup 随选择显示 Arcade PB 的 PTS/ACC；无成绩显示首个 PB 目标；≤640px 固定 Play 条同步紧凑 `PB 924K` 形式，点击左侧摘要可回到配置器并聚焦当前 Difficulty
6. 普通完整 Arcade 的 Play 赛前卡显示当前 PB，开局后 Score 卡以当前原始分数持续显示 `PB −924K / TIED / +1.2K`；这不是基于历史逐音符回放的虚假 pace。有效好友挑战以 `GOAL` 覆盖本机 PB，Daily 使用独立目标，Casual/Practice 不显示排名目标
7. 低分或同分低 Accuracy 永不覆盖 PB；Results 用写入前快照 `prevBestScore` 判定真 NEW RECORD
8. **分段练习例外**：带 `seekedFrom` 的 Practice slice 不写 PB、All-time、Daily、run history、rank 或 achievement；`seekedUntil` 存独占结束秒数，只统计 `[seekedFrom, seekedUntil)` 内起头的谱面对象。Miss review 可为有界 section 附加 2–5 的 `practiceRepetitions`，轮间用 3 秒倒计时自动重建同一区间，并在倒计时内显示上一轮 Accuracy / Miss 与下一轮编号；该交接不增加等待，暂停倒计时时保留、恢复判定时消失。结算标题统计与分享只代表最后一轮，同时以可选 `practiceAttempts` 展示每轮 Accuracy / Miss / Grade、首末变化与确定性 BEST；各轮成绩只用于本次结算反馈

### 4.14 输入与击中边角（防漏判 / 防连触返工）

| 规则 | 真值 |
|------|------|
| 判定时钟 | 仅 WebAudio；渲染可 vsync，**逻辑不跟帧** |
| 输入事件时刻 | 键盘与 pointer 使用经校验的 `Event.timeStamp`，Gamepad 边沿使用 W3C `Gamepad.timestamp`；把当前 WebAudio 歌曲时间按输入年龄 × 播放倍率回投。最多补偿 250ms，异常/过旧/未来/不支持值均回退当前 handler 或 rAF 时刻。帧轮询手柄必须在同帧 `session.tick()` 自动 Miss 之前采样 |
| 同一 note | 只接受 **第一次** 有效击中；其后忽略 |
| 键盘 | `keydown` 边沿触发；忽略系统 key repeat；Ctrl / Meta / Alt 组合交还浏览器，不得触发 lane、R 重开或 P 暂停；Shift 单独不屏蔽 |
| 空按 / 错道空按 | 无惩罚、不断连 |
| 幽灵击 | Miss 之后在同道乱按 → 忽略 |
| 防抖 | 同道两次 keydown 间隔 < **20ms** 视为一次 |
| 输入所有权 | 键码、pointer 与每个 gamepad button 都是独立 source；第一个 source 入道触发 press，最后一个 source 离道才 release |
| 多指 | 每指独立绑定一道；同道多指不得由先抬起的一指截断 Hold；触控跨道须越过边界缓冲后才松旧道、按新道，防止 Hold 因几像素抖动提前 Miss；明确滑到目标道深处仍须即时完成 Slide |
| 触控边缘 guard | 以可见 Canvas 而非带边框父容器映射视口 `clientX`；左右 5% 拒绝新 pointer 从边缘入道；已拥有外轨的 pointer 漂入 guard 时保持原 lane，重新进入其他有效 lane 时再执行松旧道/按新道 |
| 非主按键 / 浏览器菜单 | 只接受 `button=0` 的主 pointer；右键与手写笔侧键不得触发判定，Canvas 的 `contextmenu` 必须被取消 |
| 丢失/中断 | pointer up/cancel/lost capture、Pause、方向/全屏中断、重开/换谱/卸载均释放或清空 source |

### 4.15 校准算法（8 拍）

```text
期望时刻: t_i = t0 + i * (60/120), i = 0..7
用户击打: u_i
offset_ms = median(u_i - t_i)   // 取中位数，抗误触；记录 <3 次不取中位数，建议 0
写入 bs_offset_ms；夹紧到 [-200, 200]
```

as-built 约束：

- 8 个脉冲由共享 `AudioContext` **提前排程**，视觉只跟随同一音频时钟；不得用
  `setInterval` 作为脉冲真值。
- 桌面接受当前四道物理键，手机/指针设备接受任意一道的 `pointerdown`；每拍最多记录一次，
  接受窗为 ±240ms（小于半拍，避免一次输入匹配相邻两拍）。
- ≥3 次有效输入才给建议；偶数样本取中间两项平均。除 median 外显示 MAD（中位绝对偏差），
  MAD >45ms 时优先建议重试，但允许玩家主动采用结果；最终写入仍夹紧 ±200ms。
- 结果页必须解释建议值而不只显示正负数字：正值表示输入相对脉冲偏晚，负值表示偏早，零值表示居中；
  同时说明应用该值将补偿多少毫秒的 early / late input。该说明不得反转 offset 符号，也不得替代 MAD 的可靠性提示。
- 初次启动与结果页重试共用同步 busy guard；等待 AudioContext 时按钮禁用并显示 `Starting…`，
  同一事件轮次的双激活只发起一次权限请求。拒绝时保留所在 intro/result 面板并显示可重试 alert；
  返回、保留当前 offset 或卸载页面会废止等待中的轮次，迟到结果不能重置采样或进入测试。
- 从 Settings 或具体 Play URL 进入时携带经校验的站内 `return` 路径；保存或保留当前值后回到原处，
  不得丢失 track / tier / mode。`Keep current offset` 不写存储，不得暗中重置为 0。
- Calibration 属于 Settings 子流程；无论桌面顶部导航还是手机固定底栏，`/calibrate` 都继续只把 Settings
  标为 `aria-current="page"`，同时保留页面内返回原入口的精确路径。
- 校准会在音频时钟驱动下自动结束；结果出现时必须把焦点从已卸载的轨道控件交给具名
  `Calibration result` region，且不得因程序化聚焦滚动页面。键盘 modality 保留可见焦点环，触控不强制显示。

可在 Home、Settings 或对局起跑卡重做。

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
  "missEvents": [{ "tMs": 0, "lane": 0 }],
  "prevBestScore": 0,
  "durationMs": 0,
  "endedAt": "ISO-8601"
}
```

- `/results` 只读该对象；缺对象或存档损坏 → 品牌空态 `No result yet`，提供 `Choose a track` / `Back to Home`，不暴露内部深链参数且不自动跳转
- `missEvents`：Miss 复盘时间轴数据；旧存档可缺省。Results 摘要必须以 `counts.miss` 为权威总数；总数大于零但缺坐标时说明详细位置不可用，不得显示 `clean run`；总数和位置数据都为零时不渲染无内容的 Miss review disclosure。`prevBestScore`：写入前 PB 快照（真 NEW RECORD 判定）
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
- 实时 Canvas 屏蔽系统触控手势，覆盖层保留可访问滚动与缩放
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

> v1.9.3 as-built：Stage6 扩容后曲库 **85 首**（EDM 20 / Pop 17 / Hip-hop 17 / R&B 14 / Rock 17），已超正式版目标；本表保留为原始配额规划。

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
| Stage 6（as-built 已入库） | **85 首**（35 → 85 扩容） | SA3 MLX 真推理双资产；待人工耳检 + 重部署上线 |

**维护节奏（对齐 §21）**

- 每周：手感修 + **0～1** 首替补 / 新曲（本地生成）  
- 每月：批量生成候选 **8～12** 首 → QA 过关入库 **2～4** 首  

#### 6.0.6 初版曲目表（结合游戏设计 + 主题世界观 · 强制按表生成）

**原则：先定玩法职责，再定歌；歌必须落在「节拍幻境」里。**  
每首歌同时满足：① 至少一个玩法验收目标；② §1.3a 主题锚点；③ 自有版权生成。禁止「好听但离题」或「有主题但不可玩」。

##### A. Stage 1 最小可玩包（6 首 · 初版必交付）

首次运行入口按 §4.9 从 **#05 Voltage Drop · Easy · Casual** 开始 First Shift；三节点完成后，当前精选下一曲为 **#01 Neon Pulse · Easy · Casual**。全部 `rights: owned` + `theme: beatscape`。

| # | track_id | 英文曲名 | 艺人 | 曲风 | BPM | 时长 | 风格包 | District | 标签 | 默认难度/模式 | 允许音符 | 玩法职责 |
|---|----------|----------|------|------|-----|------|--------|----------|------|---------------|----------|----------|
| 01 | `bs-s1-01` | Neon Pulse | Pulse Atlas | EDM | 162 | 75s | `bs-edm-main` | Pulse Core | Hot Chart | Easy / Casual | Tap Hold Chord | Instant；Drop≤8s |
| 02 | `bs-s1-02` | Glass Horizon | Soft Circuit | Pop | 118 | 75s | `bs-pop-hook` | Glass Rim | Viral | Easy / Casual | Tap Hold | 低密度入门 |
| 03 | `bs-s1-03` | Night Drive 808 | Low Voltage | Hip-hop | 95 | 75s | `bs-hiphop-808` | Night Grid | Classic | Easy / Casual | Tap Hold Chord | 低 BPM |
| 04 | `bs-s1-04` | Velvet Afterhours | Mira Lane | R&B | 88 | 75s | `bs-rnb-groove` | Afterhours Lane | Classic | Easy / Casual | Tap Hold | 长按主验 |
| 05 | `bs-s1-05` | Voltage Drop | Gridline | EDM | 171 | 60s | `bs-edm-climax` | Pulse Core | Hot Chart | Easy / Casual | Tap Hold Chord | First Shift 首局 |
| 06 | `bs-s1-06` | Chrome Riff | Iron Echo | Rock | 132 | 75s | `bs-rock-drive` | Chrome Yard | New Release | Easy / Casual | Tap Hold Chord | Rock 五风 |

> Stage 1 **全曲禁止 Slide**。Hip-hop 谱面网格按 **标注 BPM**（95）出谱，不做 double-time 显示歧义；若鼓点听感偏 double，仍以 metadata.bpm=95 为判定真值。
>
> v1.9.3 as-built：全部 Stage1 曲目 catalog `default_tier/default_mode` = **easy/casual**（曲目页选择器默认，玩家可任选任意 tier/mode）；BPM 为入库实测值——162 / 171 与生成 Prompt 的 160 / 170 属正常生成漂移，**以 catalog 为准**（chart.bpm 为逐曲精确值，如 162.2）。

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
| 08 | `bs-s2-02` | Skyline Hook | Ada North | Pop | 133 | `bs-theme-en` | Skyline Hook | Tap Hold（人声稀疏） | 英文人声 |
| 09 | `bs-s2-03` | Blue Hour Loop | Quiet Neon | Pop | 120 | `bs-chill-pop` | Glass Rim | Tap Hold | Practice |
| 10 | `bs-s2-04` | Asphalt Anthem | Redline Co. | Rock | 150 | `bs-rock-drive` | Chrome Yard | Tap Hold Chord | 高速摇滚 |

##### C. 初版不做什么（边界）

- 不上真实热单、仿唱、外采成曲  
- 不上日系 OP、二次元立绘封面、离题曲名  
- 初版不做 50 首铺量；**先打穿 6→10 首「可玩 + 主题统一」**  
- 未过版权闸门 / 主题闸门 / 手感 QA 者不得进入 Home 默认或精选下一局池

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
      "bpm": 162,
      "duration_sec": 75,
      "stream_duration_sec": 198,
      "preset_id": "bs-edm-main",
      "engine": "stable-audio-3",
      "job_id": "local-...",
      "rights": "owned",
      "theme": "beatscape",
      "tags": ["Hot Chart Style", "Beginner Pick"],
      "vibe": "battle",
      "district": "Pulse Core",
      "default_mode": "casual",
      "default_tier": "easy",
      "audio": "/catalog/bs-s1-01/audio.m4a",
      "stream_audio": "/catalog/bs-s1-01/stream.m4a",
      "preview": "/catalog/bs-s1-01/preview_48s.m4a",
      "cover": "/catalog/bs-s1-01/cover.svg",
      "og": "/catalog/bs-s1-01/og.png",
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

**as-built 字段说明（v1.9.3，对照 `src/types/catalog.ts`）**

| 字段 | 状态 |
|------|------|
| `vibe` | 玩家情绪筛 `night-drive / groove / battle / chill`；缺省由 `src/catalog/trackVibe.ts` 按关键词/曲风/BPM 推断 |
| `og` | per-track OG 图 1200×630（105/105 已产出并纳入发布） |
| `stream_app_url` | **不逐曲存储**——深链走全局 `VITE_STREAM_APP_URL` 拼 `/track/{id}`（`src/lib/streamLink.ts`） |
| `audio_master` | 预留字段，catalog 数据未落（母带台账在仓内 `data/`） |
| `artist_bio` | 可选；缺省回退 `src/constants/scape.ts` `ARTIST_BIOS` |
| `cover` | as-built 为程序化 `cover.svg`（非 webp） |

缺 `rights` / `theme` / 三难度 chart 路径 → 构建失败，不可发版。

**Stage 1 过渡（已完结）**：as-built 全 85 首均带 `stream_audio`（180–216s）与 `og.png`；`preview_48s` 仅 10 首产出（营销预览用，非必需字段）。

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

> as-built：上架文案以 `src/constants/scape.ts` `SCAPE_COPY` 为唯一真值；下表为设计全集，与代码冲突处以代码为准。

| 场景 | 固定英文 |
|------|----------|
| 口号 | Feel the Beat, Own the Scape. |
| 权利条 | AI Original · Owned Rights · Generated with MusicSaas |
| 解锁音频 | Start playing（键位由键帽 chips 展示） |
| Home 下一局 | Start first run（无完整历史）/ Start First Shift（已有完整局但故事 0/3）/ Continue First Shift · {n}/3 / Continue the set（最近成功非 Practice 完整局）/ Play again（Practice）/ Retry last run（失败或零命中）/ Play {track}（无有效历史精选）；页内试玩固定为 Try it here + Demo · no progress saved |
| 校准中 | Listen to the pulse, then tap any lane when you hear it. |
| 校准启动 | Start 8-pulse test / Starting… / Audio could not start. Check browser sound permission, then try again. |
| 校准结果 | Suggested offset · Late/Early input detected 或 Timing centered · Applying this offset compensates {ms} of late/early input · Consistent run / Another pass will be more reliable. |
| 校准保留 | Keep current offset · {signed ms} |
| Countdown | 3 · 2 · 1 · GO |
| Pause | Scape paused |
| 中途退出确认 | Leave the Scape? Progress this run won’t be saved. |
| 确认离开 | Leave |
| 留下 | Keep playing |
| Arcade 失败 | 场内 `SIGNAL LOST` / `HP DEPLETED`；结算 `ARCADE FAILED` / `HP depleted — run failed` / `This score was not added to your Personal Best or Local Board.`；普通局 Next move 引导 `Try Casual`，桌面保留次级 `Retry Arcade`，手机固定动作同步显示 `Casual` |
| 加载失败 | Signal lost. Retry loading in place or return to the track. Duo retries both receivers together. Support code: AUDIO-503. |
| 弱网 | Loading core beat first… |
| FC | Full Combo — the Scape remembers. |
| AP | All Perfect — legend voltage. |
| New Record | New personal best |
| 空收藏 | No favorites yet — use ☆ on any track. |
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
| `sfx-hold-release` | Hold 成功尾点 | as-built：原判定音上叠加短促下行的程序合成释放音；Miss 不叠加；服从 Hitsounds 开关 |
| `sfx-hold-tick` | Hold 身段 | **默认关闭**；开启时 −18 dB ·〔as-built：未实现〕 |
| `sfx-slide` | Slide 成功完成 | as-built：原判定音上叠加短促上扬的程序合成锁定音；Miss 不叠加；服从 Hitsounds 开关 |
| `sfx-miss` | Miss | −6 dB；忌搞笑拟声 |
| `sfx-perfect` | Perfect | −6 dB；比 tap 更亮 |
| `sfx-countdown` | 3-2-1 | 极弱 −16 dB |
| `bgm-song-select` | 大厅循环 | 30–45s loop；大厅音乐默认增益 **−14 dB** ·〔as-built：未实现〕 |
| 默认用户音量 | Music **0.70** · SFX **0.55** | Settings 可改；写入 `bs_settings` |

> as-built：已实现音效全部为**程序合成**（`src/audio/hitsounds.ts`，零采样文件，自有版权 ✓）——perfect / great / good / miss 分层打击音、Hold 成功尾点下行释放音、Slide 成功完成上扬锁定音、combo-break、countdown tick（A5→C♯6→F6）、空按 key tick。

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

- 身份：无账号无 UUID〔`bs_player_id` 规划未实现〕；名 = `bs_display_name`（默认 "Player"，Settings 可改，≤24 字）  
- 仅 Arcade 通关且未失败且 score ≤ MaxScore×1.01 写入本地榜  
- 排序：纯 score 降序〔`tier_weight` 加权为规划项，未实现〕  
- 校验：`score ≤ MaxScore×1.01` 且 counts 与 TotalNotes 一致  
- 有效榜单行整卡为可聚焦的续玩入口：All-time 按该行曲目/难度重开 Arcade；Daily 有效行保留当天 `date` / `daily=1` 身份。可见 `Replay →` / `Play today →` 与焦点环不能只靠 hover 暗示动作

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
    { "id": "n001", "t": 1.25, "type": "tap", "lane": 0 },
    { "id": "n002", "t": 2.00, "type": "hold", "lane": 1, "end": 3.50 },
    { "id": "n003", "t": 4.00, "type": "chord", "lanes": [0, 3] },
    { "id": "n004", "t": 5.00, "type": "slide", "lane": 0, "to": 1, "end": 5.40 }
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
| `id` | 每个 note 必带稳定 id（as-built 全库 92,288/92,288 全带） |
| `ar` | 逐曲由自动谱写入：as-built 全库 11.1–37.5（中位数 E17.8 / S20.0 / H24.0）；引擎缺省 24 |
| `audio_offset_ms` | as-built 全库为 0（时序校正由切片起点保证） |
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

**站点 base path（部署真值）**：本地 Vite dev 使用 `/beatscape/`；Cloudflare Pages 正式构建（`build:cf`）使用 `/`，新生成的内部链接统一为 `/play`、`/library` 等根路径。正式构建仍兼容旧候选曾发出的 `/beatscape/*` 深链，页面 canonical / `og:url` 和后续导航都会收口到对应根路径；勿与 NeonBeat `/neonbeat/` 混用。

**站内链接合同**：未修饰的鼠标主键点击使用 History API 保持无刷新导航；Ctrl / Cmd / Shift / Alt + 点击、中键、显式 `target` 与 `download` 交回浏览器原生处理，支持桌面玩家在新标签页打开曲目或设置。当前桌面导航与手机底栏链接必须声明 `aria-current="page"`，不能只依靠颜色或下划线表达当前位置；Calibration 继承 Settings，桌面 Track 详情继承 Library，且同一导航只允许一个当前位置。手机 Track 隐藏全局 tabbar，并使用当前曲目专属固定操作栏。手机底栏使用统一内联 SVG，Board 显示排名柱形；中心动作按当前意图选择图标：Review / Calibrate 使用目标图标，切换模式或档位使用 Play，精确重玩使用 Replay。可见文本与 `aria-label` 始终提供完整动作、曲目和局配置。

**Library 返回合同**：当曲目由带发现状态的 `/library` 打开时，曲目链接携带经白名单验证的本地 `/library?...` 返回目标；Track 的 Library 链接及其 Play/Duo 入口继续传递该目标，赛前显式退出、加载失败出口和回到 Track 后的可见返回均恢复原结果。单人完整局 finish 后 Results 继续保留该来源，Replay、教练建议、Miss 分段练习、Daily 重试、Up next、Change setup 与 Browse Library 不再中断回路。直接打开 Track/Play/Duo/Results 不追加空参数；外站、协议相对 URL 与 `/library-*` 相邻路径一律降级为 `/library`。进入 Library 时消费并移除临时 `returnTo`；分享 URL 与 canonical 不携带本地发现状态。

| 路由（相对 base） | 页面 | 内容职责（as-built） |
|------|------|----------|
| `/` | Home | 唯一下一局主 CTA + 与其曲目/难度/模式一致的可玩 hero demo + Daily Challenge + Featured（Neon Pulse / Glass Horizon / Voltage Drop）；hero 首行按已连接标准手柄、粗指针触屏、其余桌面依次显示 controller ready / touch ready / keyboard + controller。同一手柄分配继续驱动试玩蒙版的 D-pad / face buttons 与键盘/触控后备提示，并传入真实 PlayField；≤360px 装饰性 ON AIR slab 退让试玩按钮。手机固定中心动作与该下一局共享 URL 和状态意图，按实际阶段显示 Start / Continue / Play / Replay / Retry，并以可访问名称读出曲目与配置。无完整历史的新玩家显示 `Start first run`；已有完整局但故事仍为 0/3 时改为 `Start First Shift`，不否认玩家既有经历。First Shift 完成后，最近成功、有命中且非 Practice 的完整局显示 `Continue the set` 并按确定性规则推进下一曲，保持原 tier/mode；失败、零命中和 Practice 保留原曲配置重试。≤640px 不重复显示已有固定导航替代的 Browse、全局页脚已覆盖的 rights 或触屏不适用的键盘 chips；320×568 的 Duo / Calibrate 均为 ≥44px 且距固定 tabbar ≥8px。Daily 未完成时直达当天挑战，完成后显示本机今日最佳/clear 次数与 Improve / Daily Board；同时以小时/分钟倒计时解释 UTC 重置，页面跨 UTC 午夜会原地换题而不是保留昨日入口。First Shift 未完成时入门剧情保持在 Daily 之前；完成后 Daily 前移到 hero / 回归欢迎语之后、剧情与编辑内容之前，成为首个回流目标。精选卡的 15 秒试听在零预加载时仍显示有效总时长，首次播放从人工高光起点开始，进度与键盘 seek 使用片段相对时间。新玩家直达 First Shift 1/3，无首访弹窗 |
| `/library` | Library | 搜索 + vibe / genre / Beginner / Vocals 筛选；Favorites 显示本机收藏数。Vibe 是名为 `Vibe` 的互斥单选组，由 All 与 Night Drive / Groove / Battle / Chill 五枚 radio 组成；仅 checked 项进入 Tab 顺序，方向键循环选择，Home / End 跳到首尾，焦点、URL 与结果同步。再次选择当前项保持选中，只有 All 显式清除 vibe；Favorites、Beginner 与 Vocals 仍是独立 toggle。搜索、genre、vibe、Beginner、With vocals、Favorites 与排序同步到当前 URL，打开曲目后 Back 或刷新恢复同一发现状态；同步使用 replace，不把每次输入变成历史节点，无效值安全降级。All tracks / Matches 每张卡的标题区域进入 Track 配置页，Preview 旁的显式 Play 使用 catalog 默认 tier/mode 直接进入赛前准备并可见标注该组合；筛选状态继续作为安全 `returnTo` 贯穿 Play，Favorite 仍可直接收藏/取消，四类交互均为合法兄弟控件。有完整历史时在通用推荐前显示最新可玩曲目的 ACC / tier / mode / 完成状态，有有效命中的完成局按原组合 Play again，失败或零命中局显示 Retry，另可 Change setup；零命中明示 `No notes hit` 并在 320px 保持可见。筛选时最近局让位给 Matches；空收藏的 Browse all tracks 清除全部筛选并返回完整曲库。All tracks / Matches 默认按英文标题 A–Z，可切换 Tempo fast/slow，搜索和筛选先覆盖完整 105 首再排序；首批渲染 24 张卡，按 24 首渐进展示并以 live status 报告进度，切换排序复位首批，展开后焦点进入新批次第一首。桌面完整展开 Genre、Favorites、Sort、Vibe 与快速条件；≤640px 只常显搜索，其余条件统一进入默认收起的 `Filters`，数字徽标统计全部活动次级条件，应用 Favorites 后自动收起并露出结果；面板末尾的实时 `View N matches/tracks` 收起 Filters、聚焦并滚到结果标题，动作及落点避开固定导航与视口顶边。手机标题与曲目数并排，320×568 的搜索/Filters 同排且第一首精选 `Play now` 完整位于固定导航上方 ≥8px；筛选态首个匹配结果仍在首屏 |
| `/track/:id` | Track | 正方形封面、bio、基于 `preview_48s.m4a` 的明确 15 秒试听（0–15 秒相对时间轴、键盘 Home/End 与到点停止一致）、≥44px Difficulty/Mode 互斥 radio group（默认 catalog default；单一 Tab 停靠，方向键循环，Home/End 跳首尾）、动态 Run setup（judgments / pace / sections / patterns + 模式规则 + 所选 Arcade PB PTS/ACC）、明确组合的 Play CTA、Favorite、Stream CTA；选择后焦点、说明卡、PB 目标和桌面/手机 Play 参数保持同步。无 PB 时提示首个目标，Casual/Practice 明示 unranked。Practice 从当前 tier 谱面加载 Full track 与具名 section/time radio group，支持同组键盘导航；选段后 Play、Run setup 与手机摘要同步名称和精确 `seek/until`，换 tier 立即回到整曲，段落元数据失败不阻断 Full track。桌面 Difficulty / Mode / Note speed 三列同排、section 单排，使 Play 在 1280×720 首屏完整可见；Library 返回入口与封面顶边对齐。Run setup 双端默认压缩为 tier/mode + 常显 PB，≥44px `Details` 按需展开玩法说明与谱面统计，加载错误自动展开；Duo/Favorite 位于详情后，所有游戏动作均先于完整曲目导流。Practice 为 solo，Duo 不接受会独立变速的 Practice。≤640px 时隐藏会跳往全局下一曲的 Play tab 和页内桌面 Play；固定底栏左侧实时显示当前曲名、tier/mode、可用紧凑 PB 或 Practice section，并以 `Change ↑` 直接回到配置器、聚焦当前 Difficulty，右侧保留唯一当前曲 Play |
| `/play/:id` | Play | query: `tier`（缺省 easy）`mode`（缺省 casual）；Daily 链使用 `date=<UTC YYYY-MM-DD>&daily=1`，仅当日期为今天、track 为当天确定性选题且组合为 Standard Arcade 时显示/保存 Daily 身份，旧无 date 的 `daily=1` 只兼容当天正确选题，伪造或过期参数静默按普通局处理。分享挑战可附 `challenge=1&target=<score>&acc=<accuracy>&grade=<S-D>`；有效挑战在赛前卡与开局后的 Score 卡显示原始 `GOAL` 分差并优先于本机 PB。普通完整 Arcade 则显示赛前 PB 与实时原始 `PB` 分差；Daily 使用自身目标，Casual/Practice 不叠加排名目标，不用缺失的逐音符历史伪造 pace。畸形挑战参数静默忽略 |
| `/duo/:id` | Duo | 本地双人同曲同难度对战；Practice 直链降级为 Casual。两只 W3C standard 手柄按 P1/P2 稳定分配，D-pad/face 操作四道、Menu 同步暂停/恢复；左摇杆只操作菜单，不进入 gameplay lane 判定。任一已分配手柄局中断连/替换会释放输入并只触发一次共享冻结，暂停层指出 P1/P2 状态，幸存控制器不得串台；键盘和触屏始终可混用。没有两只手柄时，桌面键盘按实体左/右键区安排双场；触屏固定 P1→P2，并在竖屏以 Top/Bottom、短横屏以 Left/Right 标出实际场地。AudioContext 已由可信手势解锁时，P1/P2 任一控制器可用 fresh bottom-face press 启动 `Duel ready`；未解锁时必须 Click/Tap 原生 Start。任一侧 Pause/Menu、退出全屏、切后台或触屏旋转都冻结双场，只显示一张 `Duo paused` modal；Resume/Menu 同步走 3 秒倒计时，Restart duel 同时重建双场，Leave duel 进入退出确认，Tab/Shift+Tab 闭环且 Escape 恢复。任一已分配手柄可用 D-pad 或左摇杆移动/调值、bottom face 选择、right face 返回，以操作共享暂停、Quick controls、退出确认和结算；跨 modal 持键不穿透，同帧多控制器输入只执行一次。Arcade 单侧失败后另一侧继续，结算按通关状态优先、同状态比分、同分平局，并逐人显示清晰状态与带标签统计；结果 modal 接管键盘与手柄焦点，默认 Rematch，bottom face 选择、right face 退出。重赛回到 ready 后必须先等待 held 动作键 neutral，再接受新的 Start 边沿 |
| `/results` | Results | 读 `bs_last_run`（session 优先，`?run=local` 读 local）；缺对象或损坏存档时显示品牌化 `No result yet`，以 `Choose a track` / `Back to Home` 恢复，不向玩家暴露内部参数。Grade 后立即展示 Score / Accuracy / Max Combo；若本局是本地当天首个有成功判定的完整局，紧接显示一次性 `Night N secured`、可选 `New best` 与 Profile 入口，刷新和同日重复局不再显示；有效 Daily 局显示 DAILY COMPLETE / ATTEMPT、今日最佳与 clear 次数，桌面卡内 Improve/Retry、≤640px 固定中间动作保持同一带 date 的 Daily 链；若从有效分享挑战完成，则待分数滚动结束后紧接显示 cleared/tied/missed 与分差，并提供保留原目标的精确复赛；Arcade 失败在 hero 显示 `ARCADE FAILED`，并紧接说明 HP 已耗尽且本次不计 PB / Local Board；普通 Arcade 失败的恢复建议直接跟在核心统计之后，桌面同时提供 `Try Casual` 与精确 `Retry Arcade`，≤640px 滚动卡和固定中间动作都以 `Casual` 承接首要降压路径，桌面精确 Retry 仍为次级恢复；Daily、挑战与 First Shift 保留专用恢复流程；普通局按失败、Miss、时机偏差和完成度生成唯一主 `Next move`，在核心成绩/奖励后、分享与普通电台回信前立即出现，移动主 CTA 完整位于固定导航上方。普通成功完整 Casual / Arcade 的确定性 `Up next` 紧跟该教练建议及必要的 Miss review、早于分享/剧情/详细统计：优先未玩曲目、相同 vibe 与接近 BPM / 时长，全部玩过后优先最久未玩的同 vibe 曲目；`Play next` 保持当前 tier / mode 与 Library 来源。失败、Daily、挑战、First Shift、完整/分段 Practice 不显示该入口。随后显示具名 `Share this run`，仍早于通用回信和详细判定。实际 First Shift 不显示通用教练，先给简短连接结果与下一首主 CTA，再显示分享，固定栏继续进入下一段剧情；≤640px 普通固定中间动作复用同一首要教练决策，可显示 Review、Casual、Arcade / 新 tier、Calibrate 或 Replay；Review 为真实按钮并展开、聚焦 Miss review，其余链接保留 Library 返回状态。Miss review 只在总 Miss 数或位置数据真实存在时渲染；零 Miss 局由核心统计、徽章及 Run details 确认，不显示无内容 disclosure。页尾 `Stay on this track` 只承载原曲 Replay/Practice/Drill、分段局 Play full Arcade 与 Change setup；专用动作继续优先，原曲操作、分享与完整曲目导流保持分层。已分配标准手柄以本局首个 primary 作为默认 bottom-face 动作，D-pad 或左摇杆可遍历全部可见结果控件并自动滚动，right face 回当前 Track 且保留 Library 来源；挂载先 neutral，手机隐藏的重复主 CTA 仍可作为默认动作但不得获得不可见焦点 |
| `/calibrate` | Calibration | Settings 子流程，桌面/手机主导航继续只标记 Settings 为当前位置；8 个 Web Audio 预排脉冲 @120 BPM；键盘、触控及第一只 W3C standard 手柄的 D-pad/face fresh press 输入，median + MAD 质量反馈，并把结果解释为 early / late / centered 及对应补偿毫秒数。自动结束后焦点进入具名结果 region，下一次 Tab 直达结果动作，再安全返回原入口。首次音频仍由 Click/Tap 解锁；320×568 赛前 Start 位于固定导航上方，进行态与结果态收起站点 chrome、完整展示四轨、Cancel、建议含义与结果动作，结束后恢复（§4.15） |
| `/settings` | Settings | §4.8；首屏 early / late 提示直达校准或 Global offset；Haptics 作为触屏/标准手柄共用开关在桌面与手机均显示，并与 Hitsounds 独立保存；无支持硬件/API 时静默降级 |
| `/leaderboard` | Leaderboard | Local Board：All-time Top 50 + Daily Challenge 双 tab；`?view=daily` 可直达 Daily，tablist / tab / tabpanel 语义完整，方向键循环且 Home/End 可直达。Daily 选中时 H1 与浏览器/社交标题统一为 `Daily Challenge Board`，切回 All-time 时恢复 `Local Board` / `Local Leaderboard`，标题、URL 与 tab 状态保持一致。Daily 仅显示当天确定性曲目 + Standard 的有效行，隔离旧伪造路由成绩，并显示与 Home 同源的重置倒计时；页面跨 UTC 午夜时原地换成新日期分数集与 Play today 入口。榜单为语义 list，每项读出名次、曲目、分数、准确率、难度与玩家；整卡提供带可见焦点的 ≥44px 续玩入口，All-time 显示 `Replay →` 并精确重开该曲目/难度 Arcade，Daily 显示 `Play today →` 并保留当天 date/Daily 身份；可见 PTS/ACC 在 320px 同行。空 All-time 直达 Arcade 曲库，空 Daily 显示当天曲名并直达该 Standard Arcade；仅用玩家可理解的“Nothing is uploaded”，不暴露内部 Stage 文案 |
| `/privacy` `/terms` | Legal | 隐私与条款静态页 |
| ~~`/replay`~~ | — | 已并入 Results（MissReplayPanel） |
| `/profile` | Profile | 当前荣誉段位、下一段量化进度、Night streak、四段阶梯、设备内生涯统计与 8 项成就；锁定/解锁状态同时用文字与视觉表达。Echo Novice 无历史时提示完成首局，已有完整局时确认 `First run complete`，避免与真实 Runs/Clears 冲突；下一段要求只由 Beat Player 进度卡承担。Night streak 位于完整天梯之前；今天未完成时与 Home 共用同一精确下一局，按本机进度直接进入 First Shift、继续下一曲或重试/重玩原局，并显示目标曲目/配置；页尾主 CTA 复用该目标，不再先回 Library 二次选择。今天已完成时保留 `Today counted`。≤640px 天梯默认折叠为 ≥44px `All ranks`，桌面完整展示 |

精确 Track 配置连续性合同：`/track/:id` 的合法 `tier` / `mode` query 优先于 catalog 默认，玩家改变 Difficulty / Mode 时通过 History replace 回写当前 URL，同时保留安全 Library `returnTo`；刷新、浏览器返回和精确 Track 深链必须恢复同一配置，非法值安全降级。Practice 的具名 section 同时以 `seek` / `until` 持久化；只有与当前 tier 谱面 section 边界精确匹配的合法范围才恢复，换 tier、选择 Full track、离开 Practice 或遇到非法/过期范围时回到无范围的 Full track，Drill `reps` 不进入配置器。Results 与 Library latest run 的 `Change setup`、单人/Duo 的退出与载入失败返回、Results 手柄 right-face 均回到本局原曲原 tier/mode；section Practice 的单人退出、载入恢复、Results `Change setup` 与手柄返回还必须保留同一 `seek` / `until`，不得先重置为默认组合或 Full track。Practice Duo 继续按既有规则降级为 Casual。

全站键盘与读屏导航合同：每个 Layout 路由在重复页头导航之前提供 `Skip to main content`。入口默认位于画布外但保留在可访问树和首个 Tab 停靠点，聚焦时进入 safe area、使用高对比样式且高度 ≥44px；激活后聚焦唯一 `#main-content`。首次完整文档载入不得主动抢焦点，保留 Skip 入口；SPA 路径变化必须滚回顶部并聚焦新主内容，且该程序化焦点不显示包围整页的焦点环。单人 Play 与 Duo 沉浸式页面须各有一个原生 H1，读作 `Play {曲名}` / `Duo {曲名}`，只在视觉上隐藏，不占场地高度或替换现有紧凑曲名顶栏。桌面站点导航与移动固定导航均标记为 `Primary` landmark；Skip 不进入手柄空间导航候选。

站点标准手柄导航合同：除 Home、Play、Duo、Results、Calibration 这些已有专用输入循环的路由外，连接的第一只 W3C standard 控制器可用 D-pad 或左摇杆在当前页面可见、可操作控件间按空间方向移动焦点，按住方向先等待 360ms、再以 110ms 间隔重复；聚焦 range/number/select 时左右方向直接按合法步长调值。左摇杆以 0.65 为死区，对角输入只输出幅度更大的主轴，同幅时优先纵向；同帧出现实体 D-pad 时由 D-pad 优先，避免混合方向。底部面键激活焦点项，右侧面键优先点击当前页可见的 `.back-link`，否则返回 Home；Track 返回必须保留精确 Library query。挂载、换路由或手柄重分配后先等待相关方向与动作键全部松开，防止跨页持键或摇杆漂移误触。首次操作显示短时 `Controller · D-pad / stick · Move · Face down · Select · Face right · Back` 提示，手柄模式使用高对比焦点环；指针或键盘输入立即退出手柄焦点视觉模式。提示在 320px 不得横向溢出、遮住固定 Play 导航或制造新的横向滚动。左摇杆只属于 UI 导航；Play/Home demo 的四道判定与 Calibration 时序采样仍只接受 D-pad / face。

Results 的标准手柄补充合同：检测到已分配的 W3C standard 控制器时，核心 Score / Accuracy / Max Combo 后显示完整图例 `D-pad / stick · Move / Face down · Select / Face right · Track`，并另列本局 `Default · {当前主动作}`。未先移动焦点时，bottom face 必须调用成绩页按现有内容优先级选出的首个主动作，因此 Miss 聚类进入 Review、失败局进入恢复、Daily / 挑战保留精确目标、First Shift 进入下一首或当前节点 Retry；不得另行硬编码 Replay。D-pad 或左摇杆上下按 DOM 顺序遍历成绩页内全部实际可见控件，左右按空间关系移动，并在长页中自动滚动保持焦点可见；Review 场景从教练按钮向下必须先到相邻的 Miss review 摘要，向上返回教练，不得跨过复盘跳到 Share。bottom face 改为激活当前焦点。right face 返回当前 Track，且必须保留安全的 Library `returnTo`；无成绩恢复页则返回 Home。≤640px 隐藏的 Daily/挑战重复卡内主 CTA 可以继续承接未移动焦点的默认 bottom-face 动作，但方向导航不得把焦点送进不可见元素。页面挂载、断连或重分配后都必须先观察到 D-pad、左摇杆与动作键 neutral，避免最后一次 gameplay hit 或带方向跨页穿透结算；提示在 320px 不得横向溢出或覆盖固定主动作。

访问 `/play/*` 不因 `bs_onboarded` 强制跳转；Home 的默认路径按真实 First Shift 进度生成（§4.9）。分享 URL 见 §6.0.24。
站点 base：本地 dev = `/beatscape/`；Cloudflare Pages 构建（`build:cf`）= `/`。

#### 6.0.19 结算页字段（强制展示顺序）

1. Grade 大号 + FC/AP/New Record/Practice 状态徽章
2. Score · Accuracy% · Max Combo  
3. 有效分享挑战结果：等 Score 计数动画到达最终值后，显示 Challenge cleared / Target tied / Challenge missed（失败局为 Run failed）、分差与原目标；桌面同卡提供 `Retry challenge`，≤640px 固定中间动作提供 `↻ Retry`，两者均精确保留原目标
4. 当局上下文与奖励：Night streak、Daily / 分享挑战结果、Rank / Achievement；普通 Arcade 失败恢复卡在核心统计后直接出现，不等待其余内容
5. 普通局 `Next move`：在上述上下文后立即出现，只给一个主建议；优先级为分段再练 → 失败降压 → Miss 分段复盘 → 连续偏差校准 / 单局早晚纠偏 → Arcade/难度晋级 → 重玩。≤640px 固定中间动作复用同一首要决策：失败显示 `Casual`，Miss 聚类显示 `Review` 并展开、聚焦 Miss review，连续偏差显示 `Calibrate`，模式/档位晋级显示对应 Play，精确重玩才显示 Replay；桌面失败卡继续保留次级 `Retry Arcade`。连续偏差须由最近 3 次成功完整 Arcade 共同证明（每局 ≥20 个有效命中、同向平均偏差绝对值均 ≥8ms、中位数绝对值 ≥10ms），校准后精确返回当前 replay 身份。若该建议为 Review，默认折叠的 Miss 复盘必须直接位于教练卡后；展开时先看到最忙分段 Practice，不跨过分享或剧情
6. `Share this run`：Copy link · Share poster / Copy poster · Download 4:5；排在普通 `Next move`（以及 Review 场景紧随其后的 Miss 复盘）后、通用电台回信与诊断前
7. 开场节点专属结果（First Shift 局）：不显示通用 `Next move`。成功推进时先展示线路变化、简短恢复结果与下一首主 CTA，完整成员回信和线路图放入默认折叠的 `Read the crew reply & circuit`，分享随后出现；当前节点未推进时，剧情卡的精确 Retry 是页面唯一主恢复路径，隐藏不合时宜的成绩分享与页尾通用 `Choose the next run`，手机固定中间动作复用同一 Retry。零命中恢复提示按粗指针触屏、键盘或已连接标准手柄分别使用 `tap a lane`、`press a lane key` 或 `press a lane button`
8. 普通电台回信；随后是 `Run details`（P / Gr / Go / M + signed early/late，≤640px 默认收起）
9. 非 Review 主建议下仅在真实存在 Miss/位置数据时显示默认折叠的 Miss 复盘；随后为曲名 · 艺人 · District · Tier · Mode、Personal Best
10. 普通成功完整 Casual / Arcade 在教练建议及必要 Miss review 后立即显示非主 `Up next` 卡，且早于分享/剧情/详细统计；`Play next` 保持当前 tier / mode 与 Library 返回状态。页尾 `Stay on this track` 只收纳 Replay/Practice again/Drill again、Play full Arcade（分段局）与 Change setup
11. 完整版音乐入口（不得截断游戏续玩路径）
12. 底栏 Owned Rights

连接标准手柄时，在第 2 项核心统计之后插入一条紧凑、可访问的 `Face down · {当前主动作}` 提示。该提示只镜像后续流程已经选出的首个主动作，不改变上述内容排序或决策优先级；必须先经过 neutral frame 才接受底部面键新边沿。

复盘（可同页折叠）：按时间轴 Miss 点；高频失误段落名（section id）；每个失误 section
可直接用 `?seek=<t0>&until=<t1>&reps=3` 进入 3 秒 lead-in 的三轮严格分段 Drill，只判定该 section
内起头的谱面对象并在段尾结束（跨段长按/滑条允许完成尾部）。轮间不跳 Results，而是重建
独立 session 后再次 3 秒倒计时；顶栏必须显示当前 `Rep N/3`。任何 `?seek=` URL 都强制
Practice；仅传 `seek` 时兼容旧版“从这里练到曲末”，且 `reps` 只有在有界 section 中接受
2–5 整数，否则按单次处理。Track 手动选择 section 继续单次。三轮结果显示实际区间、
`3-rep drill complete — not ranked` 与 `Final rep shown`；核心统计只使用最后一轮，同时在
`Drill progress` 比较全部轮次、首末 Accuracy / Miss 变化并标出确定性 BEST。所有轮次不得进入完整曲 PB、排行榜、Daily 或生涯进度。

**安装留存合同**：运行入口须在任意 lazy route 之前捕获真实 `beforeinstallprompt`，只保存浏览器提供的一次性事件，不自行伪造安装能力。Home、赛前/局中、失败 Results 和未推进 First Shift 不显示推广；成功 Results 在核心续玩、分享与回信之后才可显示 `Install BeatScape`。点击必须由当前用户手势调用原生 `prompt()`，一次意图只调用一次；`userChoice` 无论接受或拒绝、调用失败、外部 `appinstalled`、已在 standalone 模式运行时都隐藏入口。不支持 `beforeinstallprompt` 的浏览器保持无安装按钮，不以失效 CTA 代替平台菜单说明。

移动端信息密度：320px 下 Score / Accuracy / Max Combo 保持同一行；Replay / Change setup
保持双列；分享动作最多两行。普通 Results 的 `Next move` 主 CTA 须完整位于初始 viewport
固定导航上方至少 8px；分享区紧随其后并保持早于通用回信和详细判定。所有按钮仍须 ≥44px，页面不得横向溢出。
First Shift 仍以故事下一首为更高优先级：下一首 CTA 必须先于分享，并位于初始 viewport /
固定导航上方至少 8px。

#### 6.0.20 分享海报规格

| 项 | 真值 |
|----|------|
| 尺寸 | **1080×1350**（4:5，文件 Share Sheet 与下载）+ **1200×630**（横版，桌面图片剪贴板） |
| 格式 | PNG；客户端 Canvas 导出（半调网点 + 共振菱形 motif） |
| 必含 | BeatScape 品牌、曲名、艺人、Accuracy、Grade、Max Combo、Owned Rights；4:5 版另含挑战 CTA、站点地址与 No account / No ads / Browser-local |
| 禁含 | 真实热单暗示、外链广告、二次元贴纸 |

> as-built：支持文件 Web Share 的设备显示 `Share poster`，发送 1080×1350 PNG + 英文挑战文案；支持图片剪贴板的桌面显示 `Copy poster` 并复制 1200×630 横版；所有能力档均提供明确的 `Download 4:5`，不渲染注定失败的 Share/Copy。系统分享文件名为 `beatscape-{id}-{grade}.png`，4:5 下载为 `beatscape-{id}-{grade}-4x5.png`。

#### 6.0.21 本地存档键（localStorage）

| Key | 内容 | as-built |
|-----|------|----------|
| `bs_onboarded` | `"true"` | ✅ |
| `bs_offset_ms` | number（读写均夹紧 ±200） | ✅ |
| `bs_keys` | 4 个**物理键码**，默认 `["ArrowLeft","ArrowDown","ArrowUp","ArrowRight"]` | ✅ |
| `bs_settings` | `{hitsound, fancyFx, scrollBias, musicVolume, sfxVolume, chordAssist, reduceMotion}` | ✅；旧 `casualSpeed` 读取时忽略 |
| `bs_display_name` | string（默认 "Player"，≤24 字） | ✅ |
| `bs_scores` | PB 平铺列表，见下方结构（cap 200） | ✅；仅完整成功 Arcade 写入；逐行严格校验，score 同分以 Accuracy 决胜 |
| `bs_favorites` | string[] | ✅；Library 卡片与 Track 详情共用，刷新后保留 |
| `bs_board` | Local Board Top50 `{track_id,title?,tier,score,accuracy,name,at}[]` | ✅ |
| `bs_daily_board` | Daily 榜（+合法 UTC `dateKey`，cap 200；容量按最近日期/时间保留，展示按当天 score 排序） | ✅ |
| `bs_last_run` / `bs_last_run_local` | LastRun（sessionStorage + localStorage 双写；有效 Daily 尝试含 `dailyDateKey`；合法 2–5 轮有界 Drill 可选含与轮数精确同长的 `practiceAttempts[{accuracy,misses,score,grade}]`） | ✅；损坏的可选 Drill 趋势单独丢弃，不连带杀死成绩 |
| `bs_streak_update` | 当天第一局产生的 `{kind,activeDays,newBest}` 一次性 Results 奖励（sessionStorage） | ✅；Results 读取后立即删除，刷新/分享旧结果不重复 |
| `bs_analytics` | 埋点事件缓冲（cap 120） | ✅ |
| `bs_player_id` | UUID 游客身份 | 〔规划·未实现〕 |
| `bs_runs` | 完整对局生涯记录（cap 100） | ✅；新记录可选保存 signed timing profile，旧记录继续兼容，损坏 timing 只删除可选字段；分段 Practice 不写入，坏旧记录与非法完成时间读取时过滤；Library 从中选择最新且仍在当前 catalog 的完整局作为回访入口 |
| `bs_achievements` | string[] | ✅；8 项本地成就，未知/退役 ID 读取时过滤 |
| `bs_rank` | 段位 id | ✅；只升不降 |

**`bs_scores` 结构**

```json
[
  { "track_id": "bs-s1-01", "tier": "easy", "mode": "arcade",
    "score": 0, "accuracy": 0, "at": "ISO-8601" }
]
```

> 每个 `track|tier|mode` 键只保留最高分一条；全表上限 200 条（§4.13）。

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
- [ ] 首局 / Home 下一局 / Exit / PB / MaxScore

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
曲目页:   {base}/track/{track_id}
开玩:     {base}/play/{track_id}?tier=standard&mode=arcade
成绩挑战: {base}/play/{track_id}?tier={tier}&mode={mode}&challenge=1&target={score}&acc={accuracy}&grade={grade}
成绩卡:   {base}/results?run=local
OG:       /catalog/{id}/og.png 1200×630（105/105 已产出）
复制文案: "I just ran {title} on BeatScape — {accuracy}% {grade}. Feel the Beat, Own the Scape. {url}"
```

> `{base}` = 标准化后的 `import.meta.env.BASE_URL`：本地 dev `/beatscape` · Cloudflare Pages 构建为空前缀。正式根构建继续接受旧 `/beatscape/*` 深链，但新导航、分享链接、canonical 与 `og:url` 均统一输出根路径。

完整非分段对局的 Copy link / 海报分享文案使用“成绩挑战”URL；接收者不需要发送者的
localStorage，开局前即可看到目标 Score / Accuracy / Grade，完成后在 Results 比较最终分数。
`target` 只接受 0–99,999,999 的安全整数，`acc` 限 0–100，`grade` 限 S/A/B/C/D；缺失或
畸形参数静默降级为普通对局。该 URL 是可修改的好友挑战上下文，**不是可信排行榜凭据**，
不会改变 PB / Local Board / Daily / 生涯规则。Results 的精确 Retry 会复用原目标；改 Casual/Arcade、切换 tier、回 Track setup 或进入分段 Practice 时主动离开挑战，因为规则已不可比。完成后的 Copy link 则以本局成绩建立一个新的挑战目标。带 `seekedFrom` 的分段 Practice 在写入和读取存档两侧都丢弃挑战目标。

显示名：Settings 输入，≤24 字（as-built）；`lib/profanity.ts` 已在本机写入前执行英文屏蔽词、leet 归一化与误伤豁免，非法名字不覆盖上一次有效值。未来若接服务端榜，服务端仍须独立复验，不能信任客户端过滤。

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
| **Instant 营销预览** | **≤48s** | `preview_48s.m4a`，非对局默认（as-built 仅 10 首产出） |

> **as-built 实况（85 首）**：游戏切片 = 60 / 75 / 90 / 120s 四档；流媒体完整版 = **180–216s**（全部满足 ≥ 切片 ×1.8 的 QA 门）。

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
- 分享文案可带 App 深链；游戏短链指向当前 `{base}/play/…`（Cloudflare Pages 正式构建为 `/play/…`）

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
- 热门曲目排序（游玩量 / 高光局，非外部热单榜）〔as-built：未实现——Home 精选为运营固定位〕  
- 搜索（模糊匹配英文标题 / 标签）  
- 分类筛选（难度 / BPM / 曲风：Pop、EDM、R&B、Hip-hop、Rock）  
- 收藏曲目  
- 风格运营标签：Hot Chart Style、Viral Style、Classic Style、New Release  
- 曲目详情展示合规提示：**「AI Original · Owned Rights · Generated with MusicSaas」**  
  （中文内部口径：自有版权 · AI 原曲 · 本地 MusicSaas 生成）  

**加载体验（as-built 修正）**

- catalog/chart 模块级内存缓存；Track chart profile 与随后 Play/Duo 共享同一 JSON pending/fulfilled 请求，失败后可重试；Home 待机不加载完整 `PlayField`，玩家点击 Play+Sound 后才与谱面并行获取，Play/Duo 直达页复用同一异步模块。普通 lazy route 在桌面 pointer enter、键盘/手柄 focus 或触屏 pointer down 时按真实导航意图提前请求；重复意图共享进行中/已成功请求，预取失败后释放并允许正式导航重试，eager route 不产生额外请求。直达文档还在 head 用 pathname-aware bootstrap 只预取当前 Track、Duo、Characters、Radio、First Shift、Calibration、Settings、Local Board、Profile、Legal 或 NotFound chunk，兼容旧 `/beatscape/*`；Home、Library、Play、Results 不额外取包。105 个静态 Track 分享/发现页使用更小的声明式唯一 preload，不重复内联通用 bootstrap。所有映射 chunk 缺失/重复均阻止发布，React 接管后复用同一模块请求。Suspense 边界位于稳定 Layout 主内容内：URL、页头、当前导航与手机 tabbar 在等待期间保持，快速态占满剩余视口；超过 3 秒仍继续请求，但升级为有 Reload/Home 出口的 `Still connecting`。production PWA 首装预缓存 app shell、初始入口 JS、全部 hashed 非 JS 资产与 12 个同源生产字体；lazy route / gameplay JS 在首次实际请求后写入版本化 shell cache。完整音频在实际打开后按需写入有界 Cache API（最多 6 首，预览最多 12 首），已打开曲目可离线刷新、Range 读取和开局；未打开的新曲仍需联网，不预下载 491.7 MiB 全曲库。Offline mode 在赛前保持可见；单人/Duo 运行中隐藏该布局横幅，保证网络变化不移动 HUD、判定线或场地，离开运行态后恢复。字体与 hashed assets 是同源 immutable 内容，service worker 匹配时忽略 `Vary: Origin`，确保 CORS 模式字体断网仍命中。编码音频下载由 `DecodedAudioCache` 统一恢复：网络/响应体中断及 408/425/429/5xx 在 250/750ms 退避后最多共尝试三次，单人、Duo 与 HTML parser 抢跑共用；4xx 永久错误和解码失败不自动重复下载，最后消费者离开立即取消请求/退避。自动恢复耗尽后单人在同一 document/route/chart 内原地 Retry；Duo 把两块场地合并为一个 `Both receivers offline` 对话框，一次同步重连两端，直到两者 ready 才退出 `Reconnecting…`。发布准备按候选内容生成独立 shell cache 版本；升级 worker 保持 waiting，不接管仍在游玩或可能懒加载旧 chunk 的页面，待旧页面关闭并激活后才清旧 shell，音频/预览/runtime 缓存跨发布保留
- 加载态：对局 overlay（"Cueing audio"）+ 曲目页 spinner  
- 加载失败：自动恢复耗尽后才显示错误 `alertdialog`（`Signal lost`）；人工 Retry 原地执行，不刷新文档。单人保留 `Back to track`，Duo 仅一个共享对话框与 `Retry both receivers`；Tab/Shift+Tab 不逃出，Escape 可返回，恢复后焦点回到 Start。界面只显示经过归一化的 `Support code`，不得输出原始异常、内部地址或签名资源 URL

### 6.2 游戏对局系统

- 对局倒计时 3s  
- 开始浮层按当前谱面列出 Hold / Chord / Slide 的简短操作说明；不存在的谱型不展示
- ≤520px 的单人对局顶栏按运行身份显示 `tier · mode/Daily/Goal/section/Rep N/M` 紧凑状态，不能让完整 Drill/section/time 串把曲名压成只剩省略号；完整运行身份继续提供给辅助技术与桌面视图
- 紧凑表现 HUD：实时 Score、按已判定音符计算的 live Accuracy、`judged/total` 进度条与 SIGNAL；零判定时以 `ACC —` 表示尚无可计算的玩家表现，第一次判定后才显示两位小数百分比；Duo 紧凑卡仍必须显示 `ACC` 标签，并保证与进度计数同行不溢出；可比较目标以原始 `PB` / `GOAL` 分差紧贴 Score 更新，挑战优先于本机 PB，Daily/Practice/Casual 不叠加不适用目标；Arcade 在同一卡片内增加带 `HP` 标签的余量条与精确值，≤30 时转为红色警戒，每次真实下降在条下短暂显示本次精确 `−N`（同采样多次扣血用聚合值），Casual / Practice 不显示；≤520px 单人竖屏表现卡不超过场宽 30% / 高 72px，320px 仍完整保留 PB/GOAL 差值，First Shift 救援提示同锚点且最多占 36%；瞬时判定和 Combo 留在判定线附近，四档累计判定只在 Results 展示，曲名/难度只在顶部栏出现
- Hold 尾判的瞬时副标签必须指出 `EARLY RELEASE` / `LATE RELEASE`；主动超窗松开与自动尾超时共用该语义，整条未起按只显示 `MISS`。窄屏先将主判定文字组按真实字体、描边、缩放和震屏约束进 Canvas，再单独约束长副标签；星爆和得分浮字不离开真实道位
- Slide 起点已命中但未到目标道显示 `REACH TARGET`；曾到目标道但未持有至尾点显示 `HOLD TO END`；整条未起步只显示 `MISS`。三者仍是同一个 Slide 判定对象
- Chord 多道音符必须以静态连接轨显示同时输入关系；各 lane 保留独立判定、星爆和真实得分，但整组只显示一条最差档位主判定并按和弦跨度居中。触屏同手 assist 的主 `GREAT` 服从组居中，`ASSIST` 副标签仍锚定被补道，不得伪装成玩家 `LATE`
- 持续 Combo 数字先于音符与 Chord 连接轨绘制；窄屏包围盒相交时来音必须后绘压回数字，不能让战绩反馈遮挡下一次输入目标
- 连击统一称为 Combo，只在判定线视线附近用 Canvas 展示一份，不与右上暂停按钮重叠；里程碑按上一帧到当前帧的跨阈值区间触发，Chord 从 9 同帧跳到 11 仍显示 `10 COMBO!`；已有 Combo 被 Good / Miss 归零时，场中央显示 520ms `COMBO BREAK` 并撤销未结束的 Combo 里程碑，Reduce Motion 仍保留静态淡出；Canvas 不再横跨绘制第二条 Arcade HP，避免与 Score / SIGNAL / Pause 争抢顶部空间
- 街区角色立绘属于 Canvas 环境背景层，必须先于轨道、判定线、音符与瞬时判定绘制；不得以 Canvas 上方 DOM 水印遮挡 lane 4。单人透明度随 SIGNAL 升温，Duo 使用更低的独立上限
- Arcade 失败反馈为覆盖场地的硬边红卡：`ARCADE RUN / SIGNAL LOST / HP DEPLETED`。失败帧出现时音乐、判定、输入与暂停广播立即冻结，300ms 后单人进入 Results；Duo 已失败半场保留该卡直到另一位完成
- Duo Arcade 结果以完成状态优先：通关者胜过 HP 失败者；状态相同才比分，同分为 `DEAD HEAT`。两列都显示 `CLEARED` / `HP DEPLETED`、Score、两位小数 Accuracy、Max Combo 与带 P/G/G/M 标签的判定统计
- Duo 暂停为跨双场的单一 modal：两侧 Pause 仍可由任一玩家触发，但界面只给一组 Resume / Restart duel / Leave duel；焦点默认进入 Resume，Tab/Shift+Tab 不逃出，Escape 同步恢复。Restart duel 清除旧 `pauseSync` 代次并重建两块场地，二者 ready 后聚焦唯一 Start
- Duo 结果是可访问 modal：出现时焦点从已遮挡场地转入 Rematch；Tab / Shift+Tab 仅遍历 Rematch 与 Exit，Escape 退出。选择 Rematch 后，双场重新 ready 才把焦点交给唯一 Start
- Practice 手动 tempo 非 1× 时持续显示 `Practice tempo`；基础档位高于 0.5× 且连续 3 Miss 触发临时音画 0.5× 时改显示带剩余秒数的 `Practice assist`，5 秒后恢复所选档位；手动 0.5× 不显示伪倒计时
- 节拍提示动效  
- 暂停 / 继续 / 退出  
- 实时 Canvas 禁止页面拖动、缩放与长按菜单；沉浸式根层禁止滚动链/边缘回弹，覆盖层仍可滚动

### 6.3 结算 & 复盘系统（独家）

**结算页展示**

- 总分、准确率、评级  
- 最大连击、总音符数  
- Perfect / Great / Good / Miss 详细统计  

**复盘能力**

- 失误分布可视化  
- 高频失误节拍分析  
- signed early / late 数量与平均毫秒偏差；旧存档无 timing 时安全隐藏
- 四档判定与 timing 统一放入 `Run details`；手机默认显示总音符/Miss 摘要并收起细节，桌面默认展开，玩家可手动切换
- `Next move` 把失败、Miss、偏差与完成度翻译为一个主建议；手机固定中间动作复用同一决策，普通失败承接 Casual、Miss 聚类承接 Review、连续偏差承接 Calibrate、晋级承接对应 Play，只有精确重玩使用 Replay。桌面失败卡仍保留次级精确 Retry；剧情、Daily、挑战与分段 Practice 不被通用教练覆盖
- 普通成功完整 Casual / Arcade 在教练建议及必要 Miss review 后、分享/剧情/详细统计前提供一首确定性 `Up next`：优先新曲，同组内按相同 vibe、BPM / 时长接近度排序；全部有历史时优先最久未玩的同 vibe 曲目。该入口不替代教练主建议，不进入失败、Daily、挑战、First Shift 或 Practice 路径；页尾 `Stay on this track` 只保留原曲重玩、完整 Arcade 与换配置
- Miss 聚集时先聚焦复盘并直达对应 section Practice；分段局可重复该段或返回完整 Arcade
- 本次成绩与历史最高分对比  

### 6.4 个人数据系统

- 单曲最高分记录  
- 最高连击留存  
- 每曲历史成绩记录  
- 成绩覆盖规则：高分覆盖、低分保留历史  

### 6.5 排行榜系统

- Stage1–3：**Local Board**（本机，见 §6.0.15）；UI 不得写 Global / Worldwide  
- 玩家界面只说明成绩留在设备且 Nothing is uploaded，不出现 Stage1–3 等内部交付术语。
- All-time / Daily 使用完整 tabs 键盘与读屏语义；榜单行明确标注 PTS / ACC，并在 320px 保持同行扫描。
- 空榜不是死胡同：All-time 直达曲库选择 Arcade，Daily 根据当日真实 catalog 挑选直达当天 Standard Arcade。
- 读取本地榜单时严格校验 track/tier/score/accuracy/name/time 与可选 title，损坏或越界行在 UI 格式化前丢弃，不能让旧存档导致整页错误。
- Daily 身份不是裸 query flag：生成链接固定 UTC `date`，Play 必须重新核对“今天 + 当日确定性 track + Standard Arcade”；任一不符均按普通局处理，不写 Daily。Home / Results / 手机固定动作复用同一身份，Results 重试不得丢失 date/daily。
- 今日进度、Daily tab 与 clear 次数只统计当日指定 track + tier，旧版本被伪造 `daily=1` 写入的其他曲目不得展示；`?view=daily` 是 Home / Results 的稳定深链。
- `bs_daily_board` 的 200 条容量保留最近日期/时间，而非全历史最高分；否则旧高分会永久挤掉当天较低分。当天展示仍按 score、accuracy 排序。
- Stage4+：可接服务端单曲榜 / 全局榜  
- 加权：准确率、分数、难度（tier_weight）〔as-built：纯 score 排序，加权未实现〕 

### 6.6 设置系统

对齐 §4.8：下落速度 / 全局延迟 / 判定松紧快捷 / 音量 / Hitsounds / 触屏与标准手柄 Haptics / 特效开关 / **四键 remap**。

### 6.7 电台叙事系统（2026-09-05 本地叙事优化）

The Late Static 用可玩开场、短对白和固定周播让玩家认识三人，不要求先看长过场或等待日期才能经历第一个完整小故事。人物与内容边界见 [World Bible](BEATSCAPE-WORLDBIBLE.md)；本地改动不代表已发布或真人受众验证完成。

- **可玩开场** `/shift`：First shift 依次修复 Pulse Core 演播室回传通路、Chrome Yard 借来的扬声器、Skyline Hook 天台转播器，对应 `bs-s1-05` / `bs-s1-06` / `bs-s2-02`，分别由 JUNO / TORQUE / ATLAS 接应。首页、电台均有入口；可继续自由选曲。
- **推进与恢复**：完成当前节点指定曲目的完整 Casual/Arcade 对局且至少一次命中，才推进本机进度；低分可继续。失败、退出、零命中或 Practice 不推进，有对应回应；未推进的 Results 正文与手机固定主动作必须共同提供保留曲目、档位、模式和故事节点的明确 Retry，成功推进时固定动作继续进入下一段。重读对白与本机继续不要求等待周播，不跨设备同步，不因离线倒退。存储不可写时明确提示本次访问内保留。
- **局后回应**：First shift 结算确认本节点并给下一步；三节点完成以第四把椅子欢迎来电者。普通选曲结算按真实表现/街区回应，不声明全城共享状态或读取未实现的玩家历史分支。
- **人物页** `/characters`：JUNO 想留下母亲的电台却藏着租金压力；ATLAS 想保住自主广播与可靠线路却习惯独自处理风险；TORQUE 想让伙伴有可靠器材、不再靠加班苦撑。桌面三卡并列比较且保持普通文章语义；手机以具名 `tablist` / `tab` / `tabpanel` roster 一次展开一篇完整故事，选择器 ≥44px、仅当前项进入 Tab 顺序，并支持方向键循环及 Home / End。角色介绍展示动机、缺点与关系；训练触发词/美术规范不进入人物故事正文。
- **节目单** `/radio`：Year 1 三季 24 集固定周播（S1 Call-in / S2 Cold Blocks / S3 The Drop Wars），首播 2026-08-28，按客户端本地日期连续开放；每集 `#ep-N` 可深链并自动揭示、调到所属季度。已播全文可读，当前集 On air，未播只露 teaser 和 airs 日期；桌面展示当前季全部已播转录，≤680px 默认只展开当前节目并以 ≥44px 可访问节目按钮在已播全文间切换，避免周播累积成持续增长的手机长页。收音机的用户选择频道与正在直播季度是独立状态：选择会改变频率、指针、信号和展开季，Live 标记始终留在真实当前季。
- **周播边界**：`src/data/radioEpisodes.ts` + `src/lib/radio.ts` 的广播与 First shift 进度独立，既有三季仍为固定剧本；前两集提前呈现器材/电台困境。人物署名、代词与说话习惯一致，不声称周播是玩家的个人分支或实时对话。
- **日常触点**：Home On air 横幅、友好的 48h 回归欢迎语、105/105 Track 虚构来电引语与判定文案皮肤。the Hush 的四十八小时是世界背景，玩家离线无街区损失或内容惩罚。
- **内容校验**：点歌生成器 `python3 scripts/beatscape-track-requests.py --check` 核对当前曲库与落盘 JSON；引语是虚构故事，不虚构实际采样/制作来源。日期、状态与开场行为按相关单测和浏览器用例验收。
- **既有命名约束**：NIGHTSHIFT 不作产品品牌主标，MONOLITH 只作内部设定/游戏内代称，历史检索与正式检索要求见 World Bible §11。
- **未实现项保留**：15 秒台呼帧音频仍待制作；当前短对白不是已配音剧情。
- **叙事受众验收**：使用 [五分钟真实任务协议](BEATSCAPE-NARRATIVE-PLAYTEST.md)，分别记录设定理解、角色记忆、下一步意愿和英文生硬处；不把自动测试、视觉截图盲测或团队编辑判断当真人结果。

---

## 7. UI / 视觉体验规范（海外极简 · 节拍幻境主题）

### 7.1 视觉核心基调

**BeatScape 幻境城市**采用 RESONANCE 漫画版式与现有 NIGHTSHIFT 动漫立绘的混合风格：平涂、硬边、清楚的留白与节奏反馈。角色页用动机、关系与具体生活细节承接立绘；对局聚焦音符可读性。是否吸引目标受众由真实试玩判断，不用“亚洲/欧美审美”二分替代证据。

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
| Font display | **Anton**（自托管 Latin/Latin Extended WOFF2；OFL） | 标题、HUD 数字、判定文案 |
| Font secondary | **Sora**（自托管 variable 600–800 Latin/Latin Extended WOFF2；OFL） | 次级标题、强调标签 |
| Font body | **IBM Plex Sans**（自托管 variable 400–700 + italic 400；OFL） | 正文与 UI |
| Font data | **IBM Plex Mono**（自托管 600/700；OFL） | 数据、键位与紧凑 HUD |
| 封面构图 | 60% 几何 + 40% 留黑；**Stage1–3 程序化**（seed=`track_id`）；无人物脸 | — |
| 海报模板 | 上曲名/艺人 · 中 Accuracy+Grade · 下 Owned Rights 条 | 统一可截图 |

字体**只许使用 SIL OFL / Apache 授权**字体；源授权归档 `docs/licenses/`，随 Web 分发副本位于 `apps/beatscape/public/licenses/fonts/`。
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

   > **as-built 注记（2026-08-31）**：NEON 氛围层的"霓虹灯管"= **硬边描线 + steps() 步进闪烁**
   > 的表演元素（无渐变、无柔光、无辉光滤镜；alpha ≤ 0.22、闪烁 ≤ 1Hz、reduced-motion 全关），
   > 落在"城市夜景"漫画符码语法内，不违反第 1 条平涂硬边。规格：docs/BEATSCAPE-NEON-AMBIENCE.md。

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

- 单人 / Duo 开始手势自动请求全屏；标准 / WebKit API 兼容，手动入口按能力显示，进入后切换为具名 `Exit fullscreen` 的 44×44px 收拢图标；通过应用内控件、系统或浏览器退出时自动暂停，Resume 后再入场
- 320×568 为自动布局回归下限：12 个主路由的文档宽度不得超过 viewport；≤360px 的精选卡双操作保持 ≥44px 且不裁切，Track 配置与流媒体 CTA 必须完整收口
- 320–520px 竖屏 Play / Duo 顶栏保持 X、曲名/档位与 44×44px Fullscreen / Exit fullscreen 图标。单人 Play 将普通、Daily、Goal、section 与 Drill 分别压缩为当前最有用的短状态；Duo 将重复的 `DUO` 从视觉短状态移到完整可访问状态，视觉保留 `tier · mode`。320px 的常见短曲名和当前难度/模式必须完整可读，任何曲名都不得被压成只剩省略号；完整模式/目标/段落/时间身份保留给辅助技术与桌面。开局后 Score/追分目标、SIGNAL 与 Pause 各守其位，不得互相覆盖或产生横向溢出
- 320×568 的 Home 首屏必须同时完整露出首局主 CTA、曲名、时长、First Shift 进度，以及 Browse tracks / Calibrate 两个次级动作；所有动作底边与固定 tabbar 顶边至少保留 8px，不得出现半截可点击按钮
- 320×568 的 Library 默认首屏将页面标题与总数并排，隐藏重复 tagline / eyebrow；Search 与统一 `Filters` 同排，Genre、Favorites、Sort、Vibe、Beginner 与 Vocals 保留在默认折叠层内，所有控件 ≥44px。面板末尾必须提供实时 `View N matches/tracks`，完整位于固定 tabbar 上方至少 8px；激活后收起面板、聚焦 `Matches` / `All tracks` 并以至少 8px 顶部安全距直达结果。每张普通曲目卡必须同时提供 Preview 与标注默认 tier/mode 的直达 Play，二者 ≥44px 且可完整滚到 tabbar 上方；标题区域继续进入配置页。第一首精选曲的 `Play now` 也必须完整位于固定 tabbar 上方至少 8px；应用 Favorites 后折叠层自动收起并立即露出结果
- Library 默认只挂载首批 24 张曲目卡，按 24 首继续展示；Show more 本体 ≥44px，展开后新批次第一首接管焦点并完整位于固定 tabbar 上方至少 8px。搜索/筛选必须继续命中首批之外的全部 catalog，不得用分页缩小检索范围
- Library 默认顺序必须为英文标题 A–Z，并提供 Tempo fast first / slow first；同 BPM 以标题稳定排序。搜索/筛选必须在完整 catalog 上计算后再排序，切换排序必须回到首批 24 首；手机排序控件留在默认折叠的 Filters 内，本体 ≥44px，320px 不得产生横向溢出
- First Shift 结算的下一首 CTA 在桌面初始 viewport 或移动固定 tabbar 上方必须保留至少 8px，不以缩小 48px 动作目标换空间
- 移动 Track 页的底部动作必须属于当前曲目：左侧 ≥44px 已选摘要固定显示曲名与实时 tier/mode，有 Arcade 纪录时追加紧凑 PB，并以明确 `Change ↑` 回到 Run configurator、聚焦当前 Difficulty；右侧 ≥44px Play 直达对应 URL。该页隐藏全局 Play tab 和页内重复 Play；Run setup 默认只常显所选组合与 PB，其余玩法说明和谱面统计由单一 ≥44px Details 开关控制，收起态卡高不得超过 150px，错误与 Retry 必须自动显露；320px 不横向溢出，滚到页面尽头时 Duo/Favorite 与 Stream CTA 必须完整位于固定栏上方
- Profile 先给 Current / Next rank 与可行动的 Night streak，再展示完整天梯；≤640px 四级 Rank ladder 默认折叠为 ≥44px `All ranks`，展开后保留 Current / Reached / Locked 与 `aria-current`。桌面仍完整展示，不为手机压缩牺牲成长信息
- 844×390 与 667×375 为横屏对局自动回归档：顶部保留 Exit / 曲名 / 模式，单人 / Duo 场地使用剩余动态视口；判定线、四项 judgment、Pause/Resume 均完整在屏内且页面不滚动。≤700px Duo 仍左右双轨，不上下堆叠
- 触屏 Duo 不受已保存键盘布局影响，场地与结果始终按 P1→P2 阅读顺序排列；ready / live meta 使用 `Tap 4 lanes`，竖屏座位显示 Top/Bottom，短横屏切为 Left/Right。桌面继续按 WASD 等左手键区与方向键右手区安排左右座位
- 运行中的触屏单人 / Duo 真正跨 portrait / landscape 时自动暂停；浏览器地址栏收放等同方向高度变化不暂停，桌面 resize 不套用手机策略。Duo 合并为一次同步暂停；旋转完成后玩家主动 Resume，并复用 3 秒安全再入场
- Duo 在竖屏与 844×390 / 667×375 短横屏只显示一张共享暂停面板；Resume、Restart duel、Leave duel 均 ≥44px 且完整位于 viewport，不能退回两张看似可独立操作的场内暂停卡
- portrait、≤640×700 的短竖屏暂停层默认把 Quick controls 收为 48px `Adjust`，保证单人/Duo 的 Resume、Restart、Leave 三项均无需滚动完整位于 320×568 首屏；展开后全部即时设置仍可达。桌面、宽裕竖屏和短横屏继续默认展开完整控件
- 320×568 竖屏 Duo 的上下两块 PlayField 必须按各自 Grid row 拉伸，不能继承单人 Canvas 的 `58dvh` 最小高度；P1/P2 完整 Canvas、判定线、Pause 与至少 180px lane travel 同时位于视口内，页面不得纵向滚动或裁掉 P2
- 运行中 Exit 与单人 / Duo Pause 的按钮本体均 ≥44×44px；允许视觉面板更小，但命中区、可访问名称和 focus ring 必须完整
- 实时 Canvas 独占 pointer 手势并关闭长按/右键菜单，只接受主按键计分；准备、暂停与错误覆盖层不能继承 `touch-action: none`，必须保留纵向滚动和浏览器缩放。离开 Play / Duo 后根层滚动行为恢复
- 赛前与导航的 Profile、分区/返回入口、Showcase、筛选/搜索/下拉、试听、声音检查、校准/帮助/设置、Fullscreen 和键位预设等关键按钮或链接本体均 ≥44×44px；紧凑视觉可置于更大的语义控件内，不得只靠小图形承担点击
- 边缘防误触：左右 5% guard 拒绝初触；合法按住后允许拇指短暂漂入 guard，不得截断外轨 Hold
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
| Stage 1 | 最小可玩内核（手感优先） | 音频时序 + 帧循环 + 四档判定 + 结算；**初版 6 首见 §6.0.6-A**（当前首局 = Voltage Drop · Easy · Casual） |
| Stage 2 | 完整游戏闭环 | 状态机、连击、计分、长按滑动、容错；**补齐至 10 首见 §6.0.6-B** |
| Stage 3 | 曲库产品化 | 展示 / 搜索 / 分类 / 收藏 / 缓存；**五风齐 · 25 首** |
| Stage 4 | 数据与社交闭环 | 个人数据、复盘、排行榜；**40 首** |
| Stage 5 | 极致打磨 & 差异化超车 | 自适应、稳压、视觉、出海；**正式版 50 首** + 月更 AI 新曲 |
| Stage 6（as-built 已入库） | 曲库扩容 | **85 首**（35 → 85，SA3 MLX 真推理双资产）；待人工耳检 + 重部署 |

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

> **2026-09-05 当前状态**：以下 2026-08-29 的 25 首自检为历史记录，不覆盖当前 105 首和 NIGHTSHIFT 角色位图。当前技术候选已验证；人工耳检、差异化盲测、真机记录与最终签审仍待完成，详见 [发布准备](BEATSCAPE-RELEASE-READINESS.md) 和 [当前资产归档](licenses/README.md)。

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
  规程、当前截图包与记录表见 [`docs/RESONANCE-BLINDTEST.md`](RESONANCE-BLINDTEST.md)；该项与人工耳检、真机验收共同组成上线前门禁。

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

BeatScape 围绕原创音乐、短局节奏玩法与 The Late Static 电台人物建立自己的体验。当前叙事假设是：喜欢音乐、都市幻想与乐队群像的英语玩家，会愿意在游玩之间认识三位主持这间小电台的人。它仍需目标受众验证；不能从漫画风格或英文曲库推导传播效果。

### 12.3 核心用户故事（可直接转化为开发用例）

1. **英语市场乐迷**：希望快速找到一首喜欢的原创音乐，打开就能玩；可能也想认识电台里的三个人，能够自行选择先玩开场或自由选曲。
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
- 社区传播沿用城市音乐、动漫立绘与漫画排版的既有视觉；描述可体验到的音乐、人物与玩法，不凭地域或文化刻板印象宣称适配。

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

> as-built（2026-09-13）：**已落地** = release 按 catalog 生成 105 个单曲静态 HTML 与 105 条 sitemap URL；每页无需 JavaScript 即有独立 Title / Description / canonical / Open Graph / X 文本与 URL，以及 `MusicRecording` JSON-LD。根路径及旧 `/beatscape/track/*` 由精确 CF rewrite 指向对应静态卡，未知曲目仍回落 SPA 404。每页引用自身带内容哈希的 1200×630 `catalog/{id}/og.png`，图内包含曲名、艺人、BPM、曲风、街区与游玩 CTA；运行中 SPA 继续由 `seo/pageMeta.ts` 同步路由元数据，Results 等动态成绩页仍使用站点级首次 unfurl。

- **静态范围**：首页使用原始站点 HTML；105 个单曲详情拥有独立静态发现面。曲库、个人数据、排行榜与动态成绩仍由 SPA 渲染
- **独立 Meta**：每页专属英文 Title / Description / Keywords；单曲页绑定曲风、BPM、难度等长尾词  
- **Sitemap & Robots**：自动生成 `Sitemap.xml`、`Robots.txt`；屏蔽无效 / 测试页  
- **权重兜底**：友好 404、死链 301、重复内容 `canonical`  
- **多媒体 SEO**：封面与素材标准化英文 Alt、文件命名  

### 15.4 社区分享裂变体系（社区裂变核心）

- **局后留存优先、社交紧随**：普通成绩在核心 Score / Accuracy / Max Combo 与当局奖励后先显示唯一 `Next move`，再显示 `Share this run`；分享仍先于通用世界观回信与判定复盘。First Shift 保持下一首剧情 CTA 优先，避免增长入口打断新手续玩
- **高光成绩海报**：结算页一键生成极简英文成绩海报（曲目、准确率、最大连击、评级、Logo）；按浏览器能力提供系统 Share Sheet、图片复制或下载，适配 Reddit / X / Discord 等分享路径
- **可玩成绩目标**：完整对局分享把同曲 / tier / mode 与 Score / Accuracy / Grade 写入友好挑战 URL；接收者赛前看目标、局后看胜负与分差，无需账号或后端。URL 可编辑，只作社交挑战，不冒充可信全球榜
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
- 视觉采用既有 NIGHTSHIFT 动漫立绘与 RESONANCE 漫画版式；层级、留白与触控可读性服务实际任务。
- 先交代人物眼前的问题，再引入 Scape City 的术语。英语地区、母语/非母语、音乐兴趣与动漫接受度分别记录，不宣称“全海外无文化壁垒”。
- 曲目页固定露出 **AI Original · Owned Rights** 标识；社区话术统一为 *AI-made English-style beats — all tracks owned by BeatScape*  

---

## 17. 轻量化用户激励与留存体系（无氪金 · 纯荣誉驱动）

> as-built（2026-09-16）：四段位、八成就、完整局生涯记录、Results 解锁提示与 `/profile` 均已实现。Profile 明示当前段位、下一段的 `any/all` 条件和逐项进度，锁定状态不只依赖颜色；Echo Novice 只在无完整历史时提示完成首局，已有完整局时确认首局完成。Night streak 独立显示 active 与历史 best，今天已完成 / 尚可续 / 已中断三态有明确文案，并位于完整天梯之前；尚未完成时与 Home 共用精确下一局（含 First Shift / Continue / Retry / Replay 与原 tier/mode），页尾主 CTA 同步，不再先回 Library。≤640px 的四级天梯默认折叠、可由 `All ranks` 完整展开；桌面默认完整展示。当天首个有成功判定的完整局在 Results 核心成绩后确认一次 `Night N secured`，刷新和同日后续局不重复；有命中的失败局可计入，零命中尝试只保留历史与恢复、不产生 Clear/streak/honor/district 成长。分段 Practice 不计入。`bs_player_id` 仍未实现，但纯本地无账号体系不依赖该键。

基于「永久零广告、零内购、零付费」准则，搭建纯荣誉、轻量化激励体系。

### 17.1 四段式全球荣誉评级体系

Beat Player 使用任意完整局的入门条件；更高段位依据 **近 20 局 Arcade 平均准确率** + Arcade FC/AP/Hard 通关数：

| 段位 | 英文名 | 解锁条件（满足其一主条件 + 不违约） |
|------|--------|--------------------------------------|
| 初学回响 | Echo Novice | 默认段位；无完整历史时引导完成首局，已有完整局时确认首局已完成 |
| 节拍玩家 | Beat Player | 累计通关 ≥5 **或** 任一手局 Accuracy ≥90% |
| 节奏大师 | Rhythm Master | 累计 FC ≥3 **且** 平均 Accuracy ≥92% |
| 幻境传奇 | Scape Legend | AP ≥1 **且** Hard 通关 ≥3 **且** 平均 Accuracy ≥95% |

降级：不自动降段（轻量荣誉，只升不降）。

### 17.2 成就解锁与个人档案体系

| 成就 ID | 英文名 | 条件 |
|---------|--------|------|
| `ach-first-clear` | First Light | 至少命中一次并完成任意曲 1 次 |
| `ach-first-fc` | Full Circuit | 首次 FC |
| `ach-first-ap` | Absolute Pulse | 首次 AP |
| `ach-combo-100` | Hundred Echo | 单局 Max Combo ≥100 |
| `ach-combo-200` | Overload | 单局 Max Combo ≥200 |
| `ach-hard-clear` | Core Breach | 任意 Hard 通关 |
| `ach-district-5` | City Walker | 至少命中一次地玩过 ≥5 个不同 district 的曲 |
| `ach-streak-3` | Three Nights | 按玩家本地日历连续 3 日各 ≥1 个有命中的完整局 |

**个人档案字段**：总局数/通关数、总时长、曲目数、最高连击、近 20 局 Arcade 平均准确率、游玩街区数、active streak、best streak、今天的续玩状态、当前/下一段进度与已解锁成就列表。active streak 允许最后活动日在昨天时保留到今天，今天结束前完成一局即可续上；更早则归零，但 best streak 永久保留。Home Daily 同步展示该状态，避免只在 Profile 深层页面提示。

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

保持版面清楚、专注节奏与人物；避免夸张营销、低俗引流与第三方作品的标志性表达。

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
| 长按结尾缓冲 | 三档窗各 +20ms（Arcade 35/50/70） | 同左 |

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

*End of Document — BeatScape PRD v1.9.221 · As-Built Aligned · 实现级细节唯一入口 = apps/beatscape/PRD.md*
