# Agent 指南 — MusicSaas

> **slug:** `musicsaas` · profile: `generic`  
> 外接第二大脑；写代码前必读 Harness。

## 开干前（强制）

1. 确认工作区根有 `.secondbrain`
2. 读 [docs/KNOWLEDGE-BASE.md](docs/KNOWLEDGE-BASE.md) — 项目知识库入口
3. 读 [docs/CODE-INDEX.md](docs/CODE-INDEX.md) — 代码地图与索引边界
4. 读 [SESSION.md](SESSION.md) — 当前 `phase` / `next` / `blockers`
5. 任务涉及 BeatScape → 先读 [docs/PRD-BEATSCAPE.md](docs/PRD-BEATSCAPE.md)

Vault 权威规范：`docs/VAULT-HARNESS.md`（由 `sync-all-harness` 生成）

## 编码原则

- **最小 diff**：只改任务相关文件
- **复用约定**：Gateway 用 Hono + Prisma；BeatScape 判定窗 **15/30/50**（非 NeonBeat）
- **构建门禁**：`pnpm test` 或任务相关验收通过再交付
- **中文沟通，代码英文**

## 模块速查

| 任务类型 | 入口 |
|----------|------|
| REST / Job | `apps/gateway/` |
| Demo Web | `apps/demo/` |
| BeatScape | `apps/beatscape/` |
| MLX 推理 | `workers/ace-step/` · `workers/sa3/` |
| 内容流水线 | `scripts/beatscape-*` · `data/beatscape-preview/` |
| **AI 公司交付** | `.delivery/beatscape/` · `agent-safe` Issue 队列 |

## BeatScape 角色 IP（anime + LoRA）— 跨 IDE 真相源

7 个 District 角色用**本地 Animagine XL 4.0 + MPS diffusers** 出图并各训一个 SDXL LoRA（触发词 `<char>bs`）锁身份。完整 runbook + 已知坑（CLIP BPE 截断 / peft key bug / 过拟合噪点 / 模型版本 4.0 非 3.0）见 **[docs/BEATSCAPE-CHARACTER-LORA.md](docs/BEATSCAPE-CHARACTER-LORA.md)**（换 AI IDE 必读，避免重蹈覆辙）。

> 接手 AI 三条铁律：① 训练用 **rank 8 / 8 epoch / lr 5e-5**（rank16/20ep 会塌成噪点）；② 存 LoRA 用 `save_lora_weights`+`convert_state_dict_to_diffusers`，加载用 `load_lora_weights`+`set_adapters`；③ 模型是 **Animagine XL 4.0**，不是 3.0。

## 常用命令

```bash
bash scripts/print-status.sh    # 进展
pnpm test                       # 单元测试
bash scripts/harness.sh all     # CI 默认档
pnpm dev:beatscape              # 游戏本地预览
```

## 禁止

- commit `.env`、密钥、token
- 在 Gateway 内嵌 PyTorch
- 把 NeonBeat 判定常量混入 BeatScape
- 未经要求 git commit / push

## 收工（有实质推进时）

1. 更新 [SESSION.md](SESSION.md) 的 `next` / `updated`
2. 追加 `worklog/YYYY-MM-DD.md` 的 `## 已完成`
3. 里程碑可静默 deposit 到第二大脑
