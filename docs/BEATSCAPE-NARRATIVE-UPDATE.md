# BeatScape 叙事优化 · 2026-09-05

本地实现已把“音乐拯救城市”的设定落到玩家能经历的一晚：帮助 JUNO、TORQUE、ATLAS 修好广播，看到回应，再被邀请留下。创作面向英语市场中喜欢音乐、都市幻想和乐队人物的玩家；这是一组待验证的受众假设，没有真人测试结论。源码未提交、未推送、未部署。

## 体验变化与证据

| 改进目标 | 当前实现 | 实现/验证入口 |
|---|---|---|
| 不用读完设定才能参与 | 首访欢迎页和首页直接进入 `/shift`；可以继续自由选曲 | `src/pages/Home.tsx`、`e2e/narrative.spec.ts` |
| 尽早发生冲突，玩家有事可做 | 演播室回传 → 借来的扬声器 → 天台转播；实际游玩 Voltage Drop 60s、Chrome Riff 75s、Skyline Hook 90s | `src/data/firstShift.ts`、`src/pages/FirstShift.tsx` |
| 游玩产生可见反馈 | 真实结算后优先显示对应角色回信、已修复连接与下一站；三节点结束留出“第四把椅子”，可重读对白 | `src/components/ShiftStory.tsx`、`src/pages/Results.tsx` |
| 成为人物，而非美术说明 | 三人分别有需要、矛盾、关系、说话习惯和可播放的推荐曲；保留当前动漫立绘 | `src/constants/scape.ts`、`src/pages/Characters.tsx` |
| 英语对白有生活与因果 | 24 集重写并明确发言人；器材、演出费、误工、失约、争执、道歉与协商构成季线 | `src/data/radioEpisodes.ts`、`src/pages/Radio.tsx`、`src/lib/radio.test.ts` |
| 文案与产品事实一致 | 105 首引语标为虚构来电；周播标为文字稿；无缺席惩罚、虚构联网修复或已实现配音的暗示 | `scripts/beatscape-track-requests.py --check`、World Bible §10 |
| 验证受众而非猜测文化口味 | 8–12 名目标英语玩家的五分钟任务、中性问题、匿名记录与下一轮判断办法已备齐 | [叙事试玩协议](BEATSCAPE-NARRATIVE-PLAYTEST.md)，**待执行** |

First shift 默认 Easy · Casual。完整结束且至少一次命中即可推进，任何成绩等级都接受。退出、失败、零命中、Practice、错误曲目和乱序节点不推进；Results 读取和刷新不发放进度。它与按日期开放的周播独立，后者并非个人剧情分支。

进度保存在设备本地；损坏存档保留有效的连续节点并说明恢复情况，浏览器拒绝存储时当次成绩和剧情仍可继续，明确提示刷新后可能丢失。判定、计分、音频、谱面和立绘未因本任务改变。

## 当前候选与验证

候选 `artifactSha256`：`fa4bca512a3893919ca619fd6e9e1aa632229203995c3719b16e07c388e5668c`。105 首、315 张谱、594 文件、402.7 MiB。新页面不适用旧候选 `74840f1fc466` 的截图证据。

| 检查 | 当前结果 |
|---|---|
| BeatScape `npm test` | 19 文件 / **139 passed**；包括顺序推进、重复结算、失败/练习/零命中、坏存档与存储拒绝 |
| `npm run build:cf` | 类型检查、生产构建与资产准备通过 |
| `node --test scripts/release.test.mjs` | **6 passed** |
| `node scripts/release.mjs verify` | 当前候选全资产 SHA-256 与结构检查通过 |
| `PLAYWRIGHT_CHANNEL=chrome npm run test:e2e -- --workers=2` | **28 passed，6.2 分钟**；桌面 Chrome + Pixel 7 视口/触控模拟 |
| `python3 scripts/beatscape-track-requests.py --check` | **105/105** 覆盖且版本内 JSON 与生成内容一致 |
| `git diff --check` | 通过 |

Node v26.7.0；本机 pnpm 自动切换项目指定版本时受 registry 网络限制，使用已安装依赖执行上述等价 npm/Node 入口，未更改锁文件或关闭验证。E2E 的三节点主线使用生产谱面与 M4A、不拦截资源；另外的小谱面 fixture 仅隔离失败、零命中、练习与存储异常分支。浏览器模拟不等同真机验收，自动点击/触控也不证明真人手感或故事吸引力。

最终候选的桌面/手机 **8 张截图**与逐图 SHA-256、候选 manifest 已归档在本地 `data/beatscape-narrative/2026-09-05/`（忽略入库）。[开场](../data/beatscape-narrative/2026-09-05/desktop-first-shift.png)、[人物页](../data/beatscape-narrative/2026-09-05/desktop-characters.png)、[第一局真实回信](../data/beatscape-narrative/2026-09-05/desktop-first-reply.png)、[三节点结尾](../data/beatscape-narrative/2026-09-05/mobile-shift-complete.png) 与 [指纹清单](../data/beatscape-narrative/2026-09-05/screenshots.json) 可供本机复核；它们是自动化 UI 证据。

## 接续工作

使用新候选执行 [叙事试玩协议](BEATSCAPE-NARRATIVE-PLAYTEST.md)，根据参与者原话与实际路径继续编辑。目前没有参与者数据、配音、云端进度或动态城市系统。既有耳检、视觉差异化盲测、真机与正式发布签审仍按 [发布准备](BEATSCAPE-RELEASE-READINESS.md) 独立处理；本次没有代填或关闭这些人工项目。
