# MusicSaas

**MVP：音乐生成 API + 配套 Demo**

| 组件 | 说明 |
|------|------|
| **API** | REST Job 异步接口，双引擎路由 |
| **Demo** | 单页 Web 试用 + curl/Python 示例 |

| 业务 | 引擎 | MVP `mode` |
|------|------|------------|
| 人声 | ACE-Step 1.5 | `vocal_lyrics`, `vocal_desc` |
| 游戏 BGM | Stable Audio 3 | `game_bgm` |
| 游戏主题曲 | ACE-Step 1.5 | `game_theme_vocal` |

推理节点：MacBook Pro M5 Pro 48GB · `192.168.0.199`

## 文档

| 文档 | 说明 |
|------|------|
| [PRD.md](./PRD.md) | 产品需求 **v1.2** |
| [docs/DEMO.md](./docs/DEMO.md) | 配套 Demo 规格 |
| [docs/README.md](./docs/README.md) | 文档索引 |

## 状态

🟢 **MVP v0.1 + MLX 人声推理已跑通** — Gateway + Demo + Workers + examples（见 [docs/MODULES.md](./docs/MODULES.md)）

| 能力 | 状态 | 预期耗时 |
|------|------|----------|
| ACE MLX 人声 (`vocal_lyrics` 10s) | ✅ 实测 PASS | **~3s**（P50） |
| Gateway → MLX 端到端 | ✅ `acceptance-mlx-vocal.py` PASS | ~10s（30s 音频） |
| SA3 BGM 真实 MLX | ⏳ synth 链路 | Post-MVP |

详见 [docs/reports/M1-benchmark.md](./docs/reports/M1-benchmark.md) · [docs/reports/mlx-acceleration-plan.md](./docs/reports/mlx-acceleration-plan.md)

### 快速启动

```bash
pnpm install
cp apps/gateway/.env.example apps/gateway/.env
pnpm --filter gateway db:push
# Mac 上（MLX）：
bash scripts/mac-services-up.sh
# 或仅 Workers：scripts/mac-worker-setup.sh
pnpm --filter gateway dev   # :8080（需 Node 20+）
pnpm --filter demo dev      # :3000
```

验收：`pnpm test` · `bash scripts/mac-mlx-test.sh` · `python scripts/acceptance-mlx-vocal.py`

## 仓库

https://github.com/chenzh/MusicSaas
