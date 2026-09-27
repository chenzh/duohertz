# duohertz 本地性能诊断（2026-09-25）

这份记录评估独立新品牌**审查包**的首屏、冷开局和首曲整局。按 [BS-D003](BEATSCAPE-DECISIONS.md#bs-d003) 在 `127.0.0.1` 测量，没有部署、访问线上站点或调用云端服务。测试目录是从 105 首**未审候选**的真实元数据和本地素材临时构造的“合成批准目录”；批准位仅为浏览器进入完整路径的测试 fixture，不是实际签审。没有真实最终发布包，也尚未确定 duohertz 的发布性能预算，因此以下数据均为诊断，不能写作上线达标。

## 方法与证据

`pnpm --filter @musicsaas/beatscape build:duohertz:preview` 后运行 `node apps/beatscape/scripts/measure-duohertz-local.mjs --repeats 3`；整局另用 `--repeats 1 --full-run`。脚本只在本机启动 Brotli 静态服务，禁止非 loopback HTTP 请求。Chromium 测桌面 1280×900、CPU 1×、25 Mbps／40 ms，以及手机模拟 412×915、DPR 2、CPU 4×、10 Mbps／100 ms；首屏与冷开局每组 3 次取中位数，整局每组只跑 1 次。首页需五张卡图实际解码，对局页需出现开局操作。`ready` 包含字体就绪；“点击至 playing state”是开局按钮点击到暂停按钮出现，**不是可听到音频的起点**，音频仍由游戏时钟稍后调度。传输量为观测期间已编码的 HTTP body，包括点击后的首曲音频。整局无音符输入，独立 `requestAnimationFrame` 记录帧间隔，直到出现结算状态；该指标不直接测 Canvas 绘制耗时或听觉同步。

基线：[本机 JSON](../data/duohertz-performance-local/2026-09-25T03-00-34.438Z/results.json)，审查包 SHA-256 `952e5572126b808ab1626b2eb5c24555f27949c98352b93f7ba0bf18e15a3ec0`。调整后：[本机 JSON](../data/duohertz-performance-local/2026-09-25T03-05-14.221Z/results.json)，审查包 SHA-256 `4dcbd2f427baebf675d0317fef9d88fa24033db61a4ee32249eccd95309e647c`。两次 fixture SHA-256 均为 `e1d3564c9ea0ff25e0e3522fdc0896c77612a4b53fdd9cf91a5e87dad33c5f5f`。原始 JSON 保存在忽略提交的 `data/`，本表保留可供代码审查的关键数字。

| 手机模拟，中位数 | 基线 | 调整后 |
|---|---:|---:|
| 首页 ready / FCP / LCP | 841 / 372 / 632 ms | 842 / 376 / 636 ms |
| 首页传输量 | 259,166 B | 259,222 B |
| 冷开局页 ready / FCP / LCP | 1170 / 372 / 892 ms | 1163 / 368 / 884 ms |
| 点击至 playing state | 2828 ms | 1833 ms |
| 冷开局总传输量 | 3,766,135 B | 1,551,256 B |

对局选择页只显示约 120px 的封面，基线却下载 1024px PNG（首曲 2,238,869 B）。现在该位置读取获批目录的 240px WebP 卡图（23,882 B）。相同 fixture 下冷开局少传 **2,214,879 B（58.8%）**，点击至 playing state 的中位数减少 **995 ms**。调整后首曲 AAC 仍占 1,352,952 B。12 条调整后观察均无脚本错误、非本地请求或横向溢出；首页没有预取音频。桌面调整后首页 ready 302 ms、冷开局页 ready 922 ms、点击至 playing state 794 ms，仅用于同条件参考。

## 首曲整局补测

首轮整局[本机 JSON](../data/duohertz-performance-local/2026-09-25T03-13-31.988Z/results.json)仍让桌面 190px／手机 78px 的结算小图下载原封面；同一 fixture 下，桌面和手机模拟整局均传输 3,790,125 B，其中原图占 2,238,869 B。随后结算也改用已加载的卡图，再以同样条件做[本机复测](../data/duohertz-performance-local/2026-09-25T03-17-45.402Z/results.json)：整局两档都传输 **1,551,207 B**，少 **2,238,918 B（59.1%）**，没有再请求原图。两次审查包 SHA-256 分别为 `4dcbd2f427baebf675d0317fef9d88fa24033db61a4ee32249eccd95309e647c`、`82b42e2b38fdbbd5d1d9ee603c6947dea34846d1d3f0da893eff5582ae58e06d`；fixture SHA-256 均为 `e1d3564c9ea0ff25e0e3522fdc0896c77612a4b53fdd9cf91a5e87dad33c5f5f`。49 B 的额外差额来自新包代码字节变化，不应全归于图片。

复测的桌面整局记录 3,876 个帧间隔，中位／p95／p99 为 16.7／16.7／16.8 ms，超过 33 ms 为 0 次；手机模拟 3,844 个帧间隔，中位／p95／p99 为 16.7／16.8／16.8 ms，超过 33 ms 为 1 次、最长 50 ms，期间有 1 个 67 ms long task。两档均完整进入结算，零非本地请求与横向溢出。这是首曲 Easy、无输入、各 1 次的本机 Chromium 诊断，不能外推为 105 首、双人或真实设备的帧率通过。

上表无输入整局没有覆盖 105 首逐曲冷开局、带输入的整局、双人、音画同步、真实网络/CDN、Safari、实体设备、真实批准目录和最终组装包。下面补测了首曲脚本输入整局，但仍没有覆盖真人操作。BeatScape 旧版的性能预算及通过结论不能直接沿用。未来有正式包时，应先确定 duohertz 独立预算，再针对**同一最终产物**做本地完整路径与长局测量；自动结果仍不替代内容、站点或发布签审。专项真机验收依 [BS-D001](BEATSCAPE-DECISIONS.md#bs-d001) 已取消，不自动列入 TODO。

随后对局运行期改为在 Web Audio 源结束和波纹计时器触发时立即移除对应引用，暂停／停止／卸载仍清理剩余项。相关本地行为回归通过；本页上表与整局帧间隔数字均来自**改动前的包**，不能据此宣称新包帧率提升或达标。

## 连续输入与重开内存诊断

改动后的审查包执行 `node apps/beatscape/scripts/measure-duohertz-local.mjs --input-memory`。同一 Chromium 页面会话连续开局、每局用 Playwright 模拟 120 次 Space 键输入、等待波纹消退、停止，共 10 局／1200 次输入；DOM 观察器逐局核实 120 次输入都产生波纹。每次观察前执行两次强制 GC，读取 CDP JS 堆和 DOM 计数。使用首曲本地候选音频、合成批准目录，不访问外网；[本机 JSON](../data/duohertz-performance-local/2026-09-25T04-24-59.630Z/results.json)绑定审查包 SHA-256 `2ccb5b440889f1d3970293082ee3d8a3dd99353839c38fc5a572b73e59bdff46`、上述 fixture SHA-256，Chromium `153.0.8010.12`。

停止后的 JS 堆从第 1 局 **3,493,084 B** 增至第 10 局 **3,927,592 B**，其中第 7–10 局为 3,904,512–3,927,592 B；后四局增量 **23,080 B**。每次停止后均为 **1 个 document、196 个 DOM 节点、196 个 JS 事件监听、0 个波纹节点**，且无页面错误或外部请求。堆没有在 10 局内严格归零或下降，增量可含浏览器和应用热身；后段增速较小，但本实验不能证明没有长期泄漏。它只覆盖桌面 Chromium、首曲 Easy、短时间密集键盘输入和停止重开，未测浏览器进程总内存、长局帧间隔、双键／Duo、其他设备或真实最终包。duohertz 仍无正式性能预算，本项不构成上线性能通过。

## 首曲持续输入整局

在同一改动后审查包执行 `node apps/beatscape/scripts/measure-duohertz-local.mjs --repeats 1 --full-run-input`；按约 250 ms 间隔用 Playwright 模拟 Space 键输入，直到首曲 Easy 完整结算，同时采集独立 rAF 帧间隔。[本机 JSON](../data/duohertz-performance-local/2026-09-25T04-28-28.483Z/results.json)绑定审查包 SHA-256 `2ccb5b440889f1d3970293082ee3d8a3dd99353839c38fc5a572b73e59bdff46`、上述同一 fixture SHA-256。桌面发送 252 次输入，记录 3,860 帧间隔，中位／p95／p99 为 16.7／16.8／16.8 ms，超过 33 ms 为 0；4× CPU 手机模拟发送 250 次输入，记录 3,837 帧间隔，中位／p95／p99 为 16.7／16.8／16.8 ms，超过 33 ms 为 1 次、最长 33.4 ms，并有 1 个 long task。两档均进入结算、零外部请求／脚本错误／横向溢出。

同一 fixture 的早前无输入整局来自不同代码包；它可作范围参考，**不能**作严格的输入前后性能差值。该脚本只制造频繁反馈负载，不按谱命中，也没有测可听音频起点、音画同步、真实玩家手感、长期运行、双键或最终批准产物。没有 duohertz 独立帧率预算与最终包，本结果仍为本地诊断。
