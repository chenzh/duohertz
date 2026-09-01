# Scape Music — BeatScape 曲库流媒体站（类汽水音乐形态）

> **状态**：MVP 已落地可玩 · 2026-08-30 · worktree `../MusicSaas-wt-musicweb`（branch `feature/beatscape-music-web`）
> **定位**：[`BEATSCAPE-COMMERCIALIZATION-GAP.md`](BEATSCAPE-COMMERCIALIZATION-GAP.md) **5-1「流媒体引流终点」的最小形态①**——85 首 `stream.m4a` 完整版资产（180–216s）首次拥有可播放、可深链的 Web 出口（此前游戏内 `StreamFullCTA` 线上显示 "App link coming soon"）。
> **对标**：汽水音乐（Soda Music）的产品形态——竖版沉浸推荐流（上滑切歌）+ 每日推荐 + 底部常驻播放条 + 歌单/电台栏目。**品牌与代码均不使用 "Soda" 字样**（第三方商标）。

---

## 1. 产品形态（MVP 已实现）

| 页面 | 路由 | 说明 |
|------|------|------|
| Discover 沉浸流 | `#/` | 竖版 scroll-snap 大卡流，**上滑=切下一首**；每日混合（seed=UTC 日期，全体听众同一天同一份）；未解锁自动播放时显示 "Tap to tune in" 手势门 |
| Library 曲库 | `#/library` | 85 首全量：搜索（标题/艺人/District）+ 4 vibe 栏目筛选 + 5 曲风筛选 + 排序（标题/艺人/BPM/时长） |
| Shows 歌单 | `#/playlists` | 全自动生成（零人工维护）：**The Late Static 四栏目**（Overnight Drive / Groove Hour / Battle Call / Last Call，World Bible §8）+ Station Picks（New Release / Hot Chart / Beginner）+ 5 曲风 + 7 District 声学人格歌单 |
| 单曲深链页 | `#/track/:id` | **游戏 StreamFullCTA 的落地终点**：完整版播放 + 点歌引语 + "Play the chart in BeatScape ↗" 反向引流 |
| Saved 收藏 | `#/favorites` | 收藏 + 最近播放（localStorage `sm_*`，与游戏 `bs_*` 命名区隔，零账号零收集） |

全局播放器：单 `HTMLAudioElement` 引擎，队列/随机（确定性种子）/循环（off/all/one）/MediaSession 锁屏控制/断点续播（`sm_player`）。

## 2. 曲库真相源与同步机制

**单一真相源 = `apps/beatscape/public/catalog.json`（85 首 · 双资产）**，流媒体站不维护第二份曲库：

```bash
pnpm sync:scapemusic        # scripts/scapemusic-sync-catalog.py
python3 scripts/scapemusic-sync-catalog.py --check   # CI 漂移检查（exit 1）
```

- 元数据：生成 `apps/scapemusic/src/data/catalog.json`（流媒体子集 + `trackRequests.json` 点歌引语 85/85）
- 音频/封面：`apps/scapemusic/public/catalog` → **symlink** 到 `apps/beatscape/public/catalog`（git 零拷贝；fresh clone 后重跑 sync 脚本自动重建）
- 完整性校验：id 唯一、时长 150–240s、stream/cover/og 文件在盘（缺一即 FAIL）

## 3. 技术要点

- 栈与 beatscape 完全对齐：React 19 + Vite 6 + TS 5.7 strict + Vitest 3，端口 **5176**（beatscape 5175）
- 无路由依赖：hash 路由（`src/router.ts`），深链 `/#/track/bs-s1-01` 在任意静态_host 可用，无需 SPA fallback 配置
- 播放器 actions/state 双 context 拆分：actions 永不重建 → 发现流自动进档不会触发 effect 风暴；session resume 在模块加载期解析（先于一切 React effect，StrictMode 下无竞态）
- 自动播放策略：首次 `play()` 被拒 → `awaitingGesture` → 卡片手势门，解锁后滚动切歌自动续播
- 视觉：RESONANCE token（PRD §7.5）同源——扁平硬边、红/奶油/金、Anton/Sora/IBM Plex Sans（全 OFL），英文 UI，电台腔文案（World Bible §10 tone：无赌博腔、无高危词）

## 4. 与游戏的引流闭环（待接线）

```
BeatScape Track/Results StreamFullCTA ──VITE_STREAM_APP_URL──→ Scape Music /#/track/:id
Scape Music 单曲页 ──VITE_GAME_URL──→ BeatScape /track/:id（谱面）
```

- 本站侧：`VITE_GAME_URL` 已实现（默认 `http://127.0.0.1:5175/beatscape`，生产构建时传游戏站域名）
- 游戏侧：`VITE_STREAM_APP_URL` 仍为 0/85（见 GAP 5-1 实测），待本站部署后接线

## 5. 验收状态（2026-08-30）

- vitest **40/40**（队列数学/每日混合确定性/歌单全覆盖/曲库完整性 85 首资产校验）
- `tsc --noEmit` 0 错误 · `vite build` 干净（JS gzip 75 kB）
- dev 冒烟：`stream.m4a` HTTP **206** Range（seek 可用）· SPA 路由 · 封面 SVG 正常
- 浏览器目验（430×900 移动视口）：发现流自动开播/EQ 动效/全屏播放器/曲库筛选全部正常

## 6. 已知边界与下一步

| 事项 | 说明 |
|------|------|
| 部署形态 | `vite build` 会把 symlink 解引用为**全量音频拷贝（dist ≈ 960MB）**——功能正确但重；正式部署前二选一：① 与 GAP 6-1 合并决策（R2/CDN 只放 `stream.m4a`+封面）② 复用 beatscape 域名挂 `/music` 子路径共享一份音频 |
| 游戏侧接线 | `StreamFullCTA` 的 `VITE_STREAM_APP_URL` 0/85 → 指向本站 `/#/track/:id` |
| 商标 | "Scape Music" 为**工作名，未做初筛**；对外前按 World Bible §11 流程检索（SCAPE 后缀偏拥挤，备选：The Late Static 系） |
| 订阅/账号 | 按 GAP §2 拍板（C+D 线），MVP 刻意零账号零后端 |
| SEO | SPA + hash 路由对爬虫不可见，85 个曲目深链页的 SSR/预渲染 = GAP 5-3 范畴 |

## 7. 附带修复：`.gitignore` 根锚定（重要）

主仓原 `.gitignore` 的 `data/` 模式未锚定根目录，**`apps/beatscape/src/data/` 整目录从未入库**（`radioEpisodes.ts` 24 集电台 / `trackRequests.json` 85 条引语 / `profanity-en.txt` 只存在于本地盘）——任何 fresh clone / CI / worktree 的 BeatScape 都缺文件。本分支已改 `/data/`（根锚定）并修复；**合回主仓时务必带上这条**，否则 `pnpm -r build` 在新环境会因缺 `radioEpisodes.ts` 直接失败。
