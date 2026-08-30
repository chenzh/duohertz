# SESSION — MusicSaas

| 字段 | 值 |
|------|-----|
| **phase** | 曲库 **85/85** · Stage6 扩容 50 首已入库（SA3 MLX 真推理）· 待人工耳检 |
| **updated** | 2026-08-30 |
| **slug** | musicsaas |

## next（P0）

> 验收入口：本页 · `pnpm catalog:beatscape` · `pnpm audit:beatscape` · `pnpm earcheck:beatscape`

- [ ] **商业化差距决策点 5 项待拍板**：[`docs/BEATSCAPE-COMMERCIALIZATION-GAP.md`](docs/BEATSCAPE-COMMERCIALIZATION-GAP.md) §6（变现模式 / 经营主体 / 后端栈 / 流媒体终点 / 商标批次）——拍板后解锁对应 P0
- [ ] **人工耳检 50 首**（DoD 唯一剩余项）：是否脱口而出第三方名曲 → 有则废弃重生成
- [ ] **重新部署 Cloudflare Pages**（当前线上为 35 首版本）：`bash scripts/deploy-beatscape-cf-pages.sh`
- [ ] **差异化盲测**（人类 · 阻塞对外宣称上线）：[`docs/RESONANCE-BLINDTEST.md`](docs/RESONANCE-BLINDTEST.md)
- [ ] **同手和弦偏高**（观察项，非阻塞）：新 50 首 hard 同手均值 67.8 vs 旧 35 首 52.9，见下

## 已完成（勿再当 P0）

- [x] **BeatScape 商业化差距分析**：[`docs/BEATSCAPE-COMMERCIALIZATION-GAP.md`](docs/BEATSCAPE-COMMERCIALIZATION-GAP.md)（7 域 34 项 · P0×9/P1×14/P2×11 · 变现模式建议 C+D）· 2026-08-30
- [x] **BeatScape 文档 as-built 对齐**：`apps/beatscape/PRD.md`（实现级 PRD）+ 总纲 `docs/PRD-BEATSCAPE.md` v1.9.3（18 项差异按代码回写，未实现项标注〔规划〕）· 2026-08-30
- [x] **Stage6 扩容 50 首** — 35 → **85** · 全部 SA3 MLX 真推理母带（非 synth fallback）
- [x] 双资产入库（120s 游戏切片 + 216s 流媒体）· audit **FAIL=0** · earcheck **86/86 PASS**
- [x] 五曲风 / 标签 / Vibe / 难度四套配额全部对齐（`catalog:beatscape --stage 6` 缺口 0）
- [x] Stage1–4 曲库 35/35 · 全曲 `stream.m4a` · Cloudflare Pages 流水线（PR #31/#32）
- [x] 移动端触控 · 后台时序自愈 · 分享/OG · Privacy/Terms · 难度降级
- [x] MLX 真推理已跑通（SA3 small · 180s 母带约 5s/首 · 峰值 RAM 1.7 GB）

## blockers

- 耳检需人工（50 首，约 1 轮）
- 盲测需 5–10 名「不玩日式 RPG」观察者（人工）

## 角色 IP / LoRA 工作流（并行 · 跨 IDE 真相见 docs/BEATSCAPE-CHARACTER-LORA.md）

- [x] RIVET LoRA 验证 ✅（身份锁定，无 §2 红线）
- [x] VOLTA / STATIC / PRISM LoRA 产出
- [~] EMBER / GLIDE / HALO 批训练中（`scripts/beatscape-anime-lora-batch.py` 串行）
- 模型 = **Animagine XL 4.0**（非 3.0）；训练参数 rank 8 / 8ep / lr 5e-5（rank16/20ep 会塌成噪点）
- 剩余阻塞（非技术）：PRD §19 商标 17 项；盲测封面门（需人类观察者）

## 本波新增脚本（Stage6）

| 脚本 | 用途 |
|------|------|
| `scripts/beatscape-stage6-specs.py` | 50 首真值 + `validate()` 约束校验 |
| `scripts/beatscape-stage6-sync-manifest.py` | 同步 manifest / vibes / roadmap |
| `scripts/beatscape-ingest-stage6.py` | 入库（支持 `--batch` / `--track`） |
| `scripts/beatscape-stage6-pipeline.py` | 端到端编排 |
| `scripts/beatscape-stage6-batch-jobs.sh` | 打印 / 执行 50 个生成 job |

`pnpm` 入口：`sync:beatscape-stage6` · `ingest:beatscape-stage6` · `pipeline:beatscape-stage6`

## 链接

- [docs/BEATSCAPE-STAGE6-EXPANSION-MUSIC.md](docs/BEATSCAPE-STAGE6-EXPANSION-MUSIC.md) — **本波曲目表与配额真值**
- [docs/BEATSCAPE-SONIC-DIRECTION.md](docs/BEATSCAPE-SONIC-DIRECTION.md)
- [docs/BEATSCAPE-CATALOG-ROADMAP.md](docs/BEATSCAPE-CATALOG-ROADMAP.md)
- [docs/RESONANCE-BLINDTEST.md](docs/RESONANCE-BLINDTEST.md)
- [docs/BEATSCAPE-REDDIT-LAUNCH.md](docs/BEATSCAPE-REDDIT-LAUNCH.md)
- [docs/KNOWLEDGE-BASE.md](docs/KNOWLEDGE-BASE.md)
