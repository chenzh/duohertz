# BeatScape Reddit 首发指南

> **更新**：2026-08-25 · 配合 `docs/TODO.md` P0–P2 落地

## 公网部署

```bash
cd apps/beatscape
npm run build
# dist/ → Netlify（netlify.toml）或 Vercel（vercel.json）
# base path: /beatscape/
```

环境变量（可选）：

- `VITE_BASE=/beatscape/`（默认）
- `VITE_PLAUSIBLE_DOMAIN=` — 在 `index.html` 接入 Plausible 时填写

## 差异化一句话（帖文用）

> **BeatScape** — browser 4-lane rhythm game with **15/30/50 ms** judge windows, **AI-original** night-drive groove catalog (25 tracks → 35), no download. Funk, jazz-fusion, neo-soul textures — **not** licensed hits. Tap Play → **Neon Pulse** in under 10 seconds.

## 建议标题模板

1. `[Web] BeatScape — 4K browser rhythm game, 25 AI originals, 60fps`
2. `I built a no-download rhythm game with owned AI tracks — feedback welcome`
3. `BeatScape daily challenge — can you S-rank today's pick?`

## 首评话术（开发者自回帖）

- 键盘 `D F J K` · mobile bottom lanes · optional calibrate in Settings
- All tracks **AI Original · Owned Rights** — not licensed hits
- Local board + daily challenge (device-only MVP)
- Share poster on Results page

## 截图 / 素材清单

| # | 内容 | 路径/操作 |
|---|------|-----------|
| 1 | 首页 hero + gameplay 预览动画 | `/beatscape/` |
| 2 | Play 界面 Perfect 连击 | 玩 `bs-s1-01` |
| 3 | Results + Share Poster 下载 | 打完一局 → Download poster |
| 4 | Daily Challenge 横幅 | 首页 |
| 5 | 曲库 + Preview 试听 | `/library` |
| 6 | 15s 录屏（可选） | OBS 录 Play 前 15s |

## 目标 Sub（先读版规）

- r/WebGames
- r/incremental_games
- r/rhythmgames（偏硬核，附判定窗/谱面说明）

## 反馈入口

- GitHub Issues（本仓）
- Settings 页可后续加 Discord 链接

## 验收复跑

```bash
pnpm catalog:beatscape -- --stage 3
pnpm audit:beatscape
pnpm earcheck:beatscape
npm --prefix apps/beatscape test
```
