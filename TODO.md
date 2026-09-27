# MusicSaas 项目 TODO

> **本文件是待办的唯一入口**，只登记**当前真实未完事项**，细节一律链接到对应权威文档，不在此复制正文。
> 主线节奏游戏自 2026-09-23 起为 **duohertz（真我赫兹）**；迁移期代码目录仍为 `apps/beatscape/`，包名、线上站点、旧存档保持原样。旧版 BeatScape 的历次审计刷新记录已移出本入口，历史见 git。
> 续作按 [BS-D003](docs/BEATSCAPE-DECISIONS.md#bs-d003) 默认只做本机测试：不部署、不访问线上站点、不启动云端图片／音频生成。

## 维护规则

1. 每条待办只在一个位置维护正文，本文件只做导航 + 记录状态与验收方式。
2. 新增/关闭条目时同步 `SESSION.md` 的 `next`，避免两处状态分叉。
3. **专项真机验收（BS-D001）已由用户取消，禁止再进入本文件或 `next`，也不得作为发布通过依据**（见下方「已取消 / 不做」）。
4. 技术脚本通过 ≠ 人工验收通过。耳检、盲测、发布签审均为人工项，脚本只能记录结果。

---

## 当前状态速览

**duohertz 主线**（来源：[apps/beatscape/PRD.md](apps/beatscape/PRD.md)、`apps/beatscape/public/duohertz-v2/catalog.json`、[worklog/2026-09-24.md](worklog/2026-09-24.md)、[worklog/2026-09-25.md](worklog/2026-09-25.md)）

| 领域 | 状态 |
|---|---|
| 曲目 | **105 首电音技术候选**（Melodic House / Synthwave / Future Bass / Drum & Bass / Trance **各 21**）；`duohertz-v2/catalog.json` 为 `brand: duohertz` · `version: 2` |
| 谱面 | **315 张** `format: 2`（每首 Easy / Standard / Hard），已在隔离目录过自动技术门禁并可在开发页实际游玩 |
| 角色 | 三名**暂名**角色（工作名 RHYVORI / NIVAREO / ZORYMELA）；正式命名、近似性与美术未定稿 → [DUOHERTZ-BRAND-SCREENING.md](docs/DUOHERTZ-BRAND-SCREENING.md) |
| 人工签审 | **0/105** —— 耳检、内容、权利、美术、发布签审均未完成 |
| 站点批准 | `site_and_deployment_approval: false`（`scripts/duohertz-build-catalog.py` 输出） |
| 候选资产 | 真实音频 / 谱面仅在**本机** `apps/beatscape/candidates/duohertz/`（751MB、315 个 `.m4a`，gitignore 未入库）；`apps/beatscape/public/catalog/dh-*/` 只有 `cover-thumb.webp` |
| 线上 | 仍是**旧版 BeatScape** <https://beatscape.pages.dev>；duohertz **未部署、未 push** |
| 本机入口 | dev lab `…/beatscape/lab/duohertz/home`、v2 `…/beatscape/lab/duohertz/v2/home`；构建 `build:duohertz:preview`（`dist-duohertz/`）、`build:duohertz:source`（`dist-duohertz-source/`，noindex） |

**历史线（旧版 BeatScape）**：曲库 105 首 / 315 谱，线上 <https://beatscape.pages.dev>、<https://scapemusic.pages.dev>；门禁与上线准备见 [BEATSCAPE-RELEASE-READINESS.md](docs/BEATSCAPE-RELEASE-READINESS.md)，**不再作为 duohertz 的完成口径**。

---

## P0（duohertz 主线）

- [ ] **人工签审与最终包**：完成 105 首的耳检、内容、权利、美术与发布签审，并把 `site_and_deployment_approval` 置真。权威入口：[apps/beatscape/PRD.md](apps/beatscape/PRD.md)、[DUOHERTZ-CATALOG-PROMOTION.md](docs/DUOHERTZ-CATALOG-PROMOTION.md)、[BEATSCAPE-RELEASE-READINESS.md](docs/BEATSCAPE-RELEASE-READINESS.md)；工作表 `apps/beatscape/candidates/duohertz/review-worksheet.html`。**脚本通过不代替人工签审**。
- [ ] **本机候选资产入库与暂存**：105 首音频 / 315 张谱目前只在本机 `apps/beatscape/candidates/duohertz/`。先决定入库范围与暂存策略（[DUOHERTZ-CATALOG-PROMOTION.md](docs/DUOHERTZ-CATALOG-PROMOTION.md)），再谈发布；谱面生成／重生成须过 BS-D002 门禁。
- [ ] **判定窗 / 校准 / 计分 / 节奏密度锁定**：以新谱单独测量为准；**不得**沿用旧版 15/30/50 ms、旧分数上限或 NeonBeat 常量（[apps/beatscape/PRD.md](apps/beatscape/PRD.md)、[DUOHERTZ-PERFORMANCE.md](docs/DUOHERTZ-PERFORMANCE.md)）。
- [ ] **三名角色与品牌定稿**：角色名近似性（[命名初筛](apps/beatscape/candidates/duohertz/characters/name-screening.md)）、正式美术、英文 slogan（[DUOHERTZ-BRAND-SCREENING.md](docs/DUOHERTZ-BRAND-SCREENING.md)、[DUOHERTZ-VISUAL-DESIGN-BRIEF.md](docs/DUOHERTZ-VISUAL-DESIGN-BRIEF.md)）。
- [ ] **默认入口与旧站切换决策**：dev 默认入口已指向 duohertz hub；线上站点切换与旧站处置需单独授权（迁移期约定见 [apps/beatscape/PRD.md](apps/beatscape/PRD.md) 开篇）。

## 已取消 / 不做

- **专项真机验收（BS-D001）**：用户于 2026-09-06 决定不做，**不自动恢复为 TODO，取消不记为通过，也不改变发布门禁** → 见 [BS-D001](docs/BEATSCAPE-DECISIONS.md#bs-d001)。
- 未经要求不部署、不 push、不访问线上站点；不为验证启动云端图片／音频生成（[BS-D003](docs/BEATSCAPE-DECISIONS.md#bs-d003)）。

## 旧版遗留（冻结）

- 旧版 BeatScape／平台的历次审计刷新记录（含 331KB 专节与「第三十一次刷新」等）**已不在此入口维护**，历史见 git；旧版耳检、盲测与发布签审的存量状态见 [SESSION.md 旧版遗留（冻结）](SESSION.md#旧版遗留冻结)。
- **不因上述遗留重开 BS-D001**；如确需处理旧站事项，另行确认后单独建条目。

## 链接

- [SESSION.md](SESSION.md) — 项目级战略 todo（唯一真相）
- [docs/KNOWLEDGE-BASE.md](docs/KNOWLEDGE-BASE.md) · [docs/CODE-INDEX.md](docs/CODE-INDEX.md)
- [docs/BEATSCAPE-DECISIONS.md](docs/BEATSCAPE-DECISIONS.md) — 项目硬约束决策