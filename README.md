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

🟢 **MVP v0.2 + 双引擎 Mac MLX 已跑通** — Gateway + Demo + ACE + SA3（见 [docs/MODULES.md](./docs/MODULES.md)）

| 能力 | 状态 | 预期耗时 |
|------|------|----------|
| ACE MLX 人声 (`vocal_lyrics` 10s) | ✅ 实测 PASS | **~3s**（P50） |
| SA3 MLX BGM (`game_bgm` 15s) | ✅ 实测 PASS | **~1s**（权重缓存后） |
| Demo Web 四 mode | ✅ `acceptance-demo-web.py` 12/12 | ~40s |
| Gateway → MLX 端到端 | ✅ vocal + BGM 验收脚本 | 见 M1-benchmark |

详见 [docs/reports/M1-benchmark.md](./docs/reports/M1-benchmark.md) · [docs/reports/mlx-acceleration-plan.md](./docs/reports/mlx-acceleration-plan.md)

### 快速启动

```bash
pnpm install
cp apps/gateway/.env.example apps/gateway/.env   # 编辑 API_KEY、Worker URL
pnpm --filter gateway db:push

# Mac 双引擎 MLX（ACE API + Workers + Gateway）
bash scripts/mac-services-up.sh
bash scripts/mac-stack-verify.sh

# 路演 / 开发者 Demo
bash scripts/demo-present.sh
open http://127.0.0.1:8080/demo/?demo=1    # 路演（隐藏调试）
open http://127.0.0.1:8080/demo/?dev=1       # 开发者（轮询调试）

# 开机自启（可选）
bash scripts/mac-launchd-install.sh
```

验收：`pnpm test` · `bash scripts/mac-mlx-test.sh` · `bash scripts/mac-sa3-test.sh` · `python scripts/acceptance-demo-web.py`

## 仓库

https://github.com/chenzh/MusicSaas
