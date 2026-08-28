# BeatScape Reddit 首发 TODO

> **更新**：2026-08-25（P0–P2 Goal 落地）  
> **北极星**：陌生 Reddit 用户 3 秒看懂 → 10 秒内开玩 → 打完想分享 → 有理由回来  
> **关联**：`docs/PRD-BEATSCAPE.md` · `SESSION.md` · `docs/BEATSCAPE-REDDIT-LAUNCH.md`  
> **分支**：`preview/beatscape-try`

---

## P0 — 发帖前必做

- [x] **生产部署 + CDN** — `apps/beatscape/netlify.toml` · `vercel.json`（需人工绑定域名）
- [x] **首局零摩擦** — Play Now → `bs-s1-01` easy/casual；校准可选（Settings / 首页链接）
- [x] **Landing gameplay 预览** — `HeroGameplayPreview` CSS 动画
- [x] **音频解锁 UX** — 全屏 overlay 一次点击开声
- [x] **Stage3 听感差异化** — `TRACK_PROMPTS` 每曲锁定（重生成音频需跑 pipeline）
- [x] **封面品质统一** — `beatscape-cover.py` Stage2/3

---

## P1 — 留存与传播

- [x] **结算 Share Poster** — Canvas 1200×630 下载
- [x] **分享深链** — `/results?run=local` + 战绩卡片
- [x] **Daily Challenge（MVP）** — 首页入口 + Daily 榜
- [x] **曲库试听强化** — Featured 卡片 inline preview
- [x] **全球榜 / 周榜（MVP）** — Local + Daily tab；Settings 昵称
- [x] **漏斗埋点** — `analytics.ts` local buffer + Plausible hook

---

## P2 — 移动端与手感

- [x] **移动沉浸** — 触控边缘 guard · 全屏请求 · `100dvh` play 区
- [x] **延迟体验** — Settings offset + Recalibrate 链
- [x] **展示谱面** — `SHOWCASE_TRACK_IDS` + Library chips
- [x] **复盘默认可用** — Miss 时间轴 + 段落统计

---

## P3 — Reddit 运营包（人工）

- [ ] **发帖素材包** — 见 `BEATSCAPE-REDDIT-LAUNCH.md`
- [ ] **目标 sub 调研**
- [ ] **开发者向帖子**（可选）
- [ ] **反馈入口**（Discord / Discussions）
- [x] **发帖文档** — `docs/BEATSCAPE-REDDIT-LAUNCH.md`

---

## P4 — 中长期

- [ ] Stage4 40 首
- [ ] 荣誉段位 / 成就
- [ ] PWA + 离线缓存
- [ ] 真 180s 流媒体母带
- [ ] Stage3+ AI 写实封面

---

## 验收闸门

```bash
pnpm catalog:beatscape -- --stage 3
pnpm audit:beatscape
pnpm earcheck:beatscape
npm --prefix apps/beatscape test
```

**手测**

- [x] 新用户直达首局（无强制校准）
- [x] 首屏 gameplay 预览
- [x] 结算 Share Poster
- [ ] 公网 URL < 3s（需部署后测）

---

## 明确不做（本阶段）

- 采购热单 · NeonBeat 常量混入 · 全球榜后端 API
