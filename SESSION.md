# SESSION — MusicSaas

| 字段 | 值 |
|------|-----|
| **phase** | Stage4 RESONANCE 流水线就绪 · 待 MLX 跑批 10 首 |
| **updated** | 2026-08-29 |
| **slug** | musicsaas |

## next

> 验收：[docs/BEATSCAPE-TODO-ACCEPTANCE.md](docs/BEATSCAPE-TODO-ACCEPTANCE.md) · Stage4：[docs/BEATSCAPE-STAGE4-RESONANCE-MUSIC.md](docs/BEATSCAPE-STAGE4-RESONANCE-MUSIC.md)

- [x] Stage4 10 首定名 + manifest + ingest/pipeline 脚本 + pnpm 命令
- [ ] **MLX 跑批**（human）：`bash scripts/beatscape-stage4-batch-jobs.sh` → `pnpm pipeline:beatscape-stage4`
- [ ] **差异化盲测**（阻塞上线）：[`docs/RESONANCE-BLINDTEST.md`](docs/RESONANCE-BLINDTEST.md)
- [ ] **公网部署** + Reddit（`docs/BEATSCAPE-REDDIT-LAUNCH.md`）
- [ ] PRD §6.0.2 合入 [`docs/BEATSCAPE-RESONANCE-PRESETS.md`](docs/BEATSCAPE-RESONANCE-PRESETS.md)

## blockers

- Stage4 音频需 Gateway + MLX 人工生成（`data/beatscape-preview/*.m4a` 尚不存在）

## 近期完成

- `ingest:beatscape-stage4` / `pipeline:beatscape-stage4` / stitch `--all-stage4`
- 音符放大 + 下落放慢 · 首页演示对齐真实键位

## 链接

- [docs/BEATSCAPE-STAGE4-RESONANCE-MUSIC.md](docs/BEATSCAPE-STAGE4-RESONANCE-MUSIC.md)
- [docs/BEATSCAPE-RESONANCE-PRESETS.md](docs/BEATSCAPE-RESONANCE-PRESETS.md)
- [docs/KNOWLEDGE-BASE.md](docs/KNOWLEDGE-BASE.md)
