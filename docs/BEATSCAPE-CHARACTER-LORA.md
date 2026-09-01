# BeatScape 角色 LoRA 训练 Runbook

> 目标：给 7 个 District 角色各训一个 SDXL LoRA（触发词 `<char>bs`），把角色身份锁死，使后续批量出图/衍生品一致可商用。
> 基础模型：**Animagine XL 4.0**（`cagliostrolab/animagine-xl-4.0`，Apache 2.0 / CreativeML Open RAIL++-M，可商用）。
> **版本雷区**：用户确认用的是 **4.0，不是 3.0**。换基础模型前先跟用户确认版本——3.0 的触发词/分辨率/质量标签不同。
> 全部**本地**运行，不碰网络（模型已缓存；托管生图 API 有 429 限流，本地 diffusers 不受影响）。

> **本文件是跨 AI IDE 的真相源**：换 Cursor / CodeBuddy / Claude Code / Codex 打开本仓都应先读此文件，避免重蹈下面「已知坑」。

---

## 0. 触发词约定

| 角色 | District | 触发词 |
|------|----------|--------|
| volta  | Pulse Core      | `voltabs` |
| static | Night Grid      | `staticbs` |
| prism  | Glass Rim       | `prismbs` |
| ember  | Afterhours Lane| `emberbs` |
| rivet  | Chrome Yard     | `rivetbs` |
| glide  | Slide District  | `glidebs` |
| halo   | Skyline Hook    | `halobs`  |

> **⚠️ 2026-08-30 起**：世界观切换为三人组 NIGHTSHIFT（[`BEATSCAPE-WORLDBIBLE.md`](./BEATSCAPE-WORLDBIBLE.md)），旧 7 角色人设退役、LoRA 停止新增投入（已训好的权重保留存档）。新角色触发词：

| 角色 | District | 触发词 | anchor（front-1337） |
|------|----------|--------|----------------------|
| juno  | Pulse Core   | `junobs`   | `juno-front-1337-00-1571306751.png` |
| atlas | Skyline Hook | `atlasbs`  | `atlas-front-1337-03-1647999605.png` |
| torque| Chrome Yard  | `torquebs` | `torque-front-1337-00-1571306751.png` |

新角色 prompt 定义已入 `scripts/beatscape-anime-prompts.py`（CHARACTERS 追加 juno/atlas/torque，ATLAS 用 `1other, androgynous`）；生图环境 = 托管 venv `~/.workbuddy/binaries/python/envs/default`（torch 2.13 / diffusers 0.40 / MPS）。

---

## 1. 三步流水线（每角色）

### Step A — 造一致性训练集（img2img，8 张同脸异姿态）
```bash
export HF_HUB_OFFLINE=1 HF_ENDPOINT=https://hf-mirror.com
python scripts/beatscape-anime-trainset.py \
  --character rivet \
  --anchor data/beatscape-characters/anime/rivet/rivet-front-1341-00-1945552655.png \
  --count 8
```
- 输出：`data/beatscape-characters/anime/<char>/train/*.png` + 同名词 `.txt`（caption，触发词前置）。
- 锚点图用"正面 seed-00"那张辨识度最高的；img2img strength 0.45 锁身份。

### Step B — 训 LoRA（本地 MPS，**已验证参数**）
```bash
export HF_HUB_OFFLINE=1 HF_ENDPOINT=https://hf-mirror.com
python scripts/beatscape-anime-lora-train.py \
  --train-dir data/beatscape-characters/anime/rivet/train \
  --output-dir data/beatscape-characters/anime/rivet/lora \
  --character rivet --epochs 8 --resolution 768 --rank 8 --lr 5e-5
```
- 产物：`<output-dir>/pytorch_lora_weights.safetensors`（约 46.6 MB）。
- **✅ 已验证可用参数：rank 8 / 8 epoch / lr 5e-5 / 8 图 = 64 步。** 这是 RIVET 上锁住身份、loss 稳定 ~1.4 的配置。
- **❌ 踩过的坑（勿复现）**：`rank 16 / 20 epoch / lr 1e-4`（160 步）会**过拟合塌成噪点**。原因：小训练集（8 图）配大 rank + 多轮，把噪声当特征学进去了。
- 关键实现：脚本自包含，用 PIL 读图绕开 `datasets`（沙箱 pip 装 datasets 解压 pyarrow 时 SIGKILL 137）；fp32、v_prediction 目标、`local_files_only=True`；仅 unet attention 层挂 LoRA。

### Step C — 验证（加载 LoRA 出图看身份是否锁住）
```bash
export HF_HUB_OFFLINE=1 HF_ENDPOINT=https://hf-mirror.com
python scripts/beatscape-anime-gen.py \
  --character rivet --view front --count 6 \
  --lora data/beatscape-characters/anime/rivet/lora/pytorch_lora_weights.safetensors \
  --trigger rivetbs --lora-scale 0.9
```
- 验收：同脸一致 / 战术背心+橙共振球一致 / **共振钻石 MOTIF（金色悬浮菱形光环）出现且不过曝** / 无 §2 红线（面具·校服·披风·塔罗·武器·日文）。
- diffusers 0.40 加载 API：`pipe.load_lora_weights(path)` + `pipe.set_adapters(['default_0'], adapter_weights=[scale])`（**不要用** 已废弃的 `cross_attention_kwargs`）。

---

## 2. Draw Things 备选（Mac 原生 GUI，更稳更快）

CLI 在 MPS 上已验证可跑；但若想要更快/更稳，用 **Draw Things**（App Store 免费，Mac 原生 MPS 优化）：

1. 训练集已备好：`data/beatscape-characters/anime/<char>/train/`（图 + caption，触发词前置）。
2. Draw Things → Training → 选这 8 张图 → 类型选 **LoRA** → 基础模型选 **Anima(Animagine XL)**。
3. Trigger word 填 `<char>bs`；Resolution 768；**Rank 8；Epochs 8；LR 5e-5**（与 CLI 验证参数一致，别用 16/20）。
4. 点 Start，5–15 min 出 `rivetbs.safetensors`。
5. 之后在生成页加载该 LoRA，prompt 里写 `<char>bs` 即可。

产物与 CLI 完全一致（都是 SDXL LoRA safetensors），可互换验证。

---

## 3. 复制到 7 角色

- **一键批处理**：`python scripts/beatscape-anime-lora-batch.py`（按 `volta → static → prism → ember → glide → halo` 串行，RIVET 跳过；每个角色自动 trainset→train→validate）。
- 手动顺序建议（辨识度从高到低，先验证管线再铺量）：`rivet → prism → glide → static → halo → ember → volta`（volta 基础色先验最偏，需重点调 prompt 或加训练图）。

---

## 4. 已知坑（换 AI IDE 必读，避免重蹈覆辙）

- **① CLIP 77-token 截断（最隐蔽）**：Danbooru prompt 按 **BPE 子词**计，不是逗号数。34 个 tag ≈ 85 BPE > 77，共振菱形 MOTIF 会被无声截断。`fit_clip()`（`scripts/beatscape-anime-prompts.py`）用真实 tokenizer 对整串 tokenize 后裁切，保留 HEAD（身份+rating+MOTIF）+ TAIL（质量标签如 `absurdres`），丢中间填充。所有「角色×视角」prompt 必须 ≤77 BPE，且 MOTIF + 质量标签不得被裁掉。
- **② peft 存盘 key 命名 bug（致命）**：peft 0.x 存的 key 是 `unet.base_model.model.up_blocks...`，diffusers 直接 `load_lora_weights` 读不出。**正确存盘链**：`convert_state_dict_to_diffusers(get_peft_model_state_dict(unet))` → `StableDiffusionXLPipeline.save_lora_weights(..., unet_lora_layers=sd, safe_serialization=True)`。若已产出错误 key 的文件，用 `scripts/beatscape-lora-fix-keys.py` 改名为 `unet.X`（去 `base_model.model.` 前缀）。`convert_state_dict_to_diffusers` 在 `diffusers.utils.state_dict_utils`（0.40）。
- **③ 过拟合塌成噪点**：见 §1 Step B。小数据集（8 图）务必 rank 8 / 8 epoch / lr 5e-5。
- **④ datasets 装不上**：沙箱 pip 解压 pyarrow SIGKILL(137)，训练脚本已用 PIL 绕开，勿再引入 `datasets`。
- **⑤ 429 限流**：限的是托管生图 API，本地 diffusers + `local_files_only=True` 完全不受影响。
- **⑥ 模型版本**：Animagine XL **4.0**（非 3.0）。换基础模型前先跟用户确认版本。
- **⑦ `fit_clip` 的 `head_n/tail_n` 默认会丢主题 tag（衍生坑）**：默认 `head_n=14, tail_n=4` 只保留「身份 14 + 质量 4」，中间 `mid` 从尾部 pop 掉。结果：VOLTA 的「album cover/cd jacket」能保住（因为正好在 mid 前段），但「red theme/crimson red/red background/red spotlight/concert stage/sound waves」整块 9 个红主题 tag 全部被 pop 掉——非红色角色（HALO 蓝、PRISM 白等）做主题 CD 封面会直接失效。**修法**（`scripts/beatscape-anime-cdcover.py`）：`head_n=8`（只留 trigger+subject+rating+MOTIF，视觉身份交给 LoRA 扛），`tail_n=4+len(theme)`（主题+质量进必保留尾）。VOLTA/red 实测：72 BPE、9/9 主题 + 3/3 MOTIF 全保。一般角色图不需要这个 trick，仍用默认参数。

---

## 5. 状态

- [x] 管线验证：RIVET LoRA 产出 + 6 张验证图身份锁定 ✅（战术背心 + 金共振菱形光环 + 橙胸共振球一致，无 §2 红线）
- [x] VOLTA / STATIC / PRISM LoRA 产出（旧 7 角色资产，2026-08-30 起退役存档）
- [x] **NIGHTSHIFT 三人 LoRA 全部产出 ✅（2026-08-30）**：JUNO（loss 1.39）/ ATLAS（1.36）/ TORQUE（1.38），各 8 图训练集 + 6 张验证图身份锁定，MOTIF 就位、无红线；权重在 `data/beatscape-characters/anime/{juno,atlas,torque}/lora/pytorch_lora_weights.safetensors`
- 共振钻石 MOTIF = 核心 IP 元素；§2 红线 = 面具/校服/披风/塔罗/武器/日文，任何产出禁止出现。

---

## 6. 脚本索引

| 脚本 | 用途 |
|------|------|
| `scripts/beatscape-anime-prompts.py` | `build_prompt()` + `fit_clip()`（CLIP 77 BPE 截断修复） |
| `scripts/beatscape-anime-gen.py` | 本地出图，支持 `--lora/--trigger/--lora-scale` |
| `scripts/beatscape-anime-trainset.py` | img2img 造 8 张一致性训练集 |
| `scripts/beatscape-anime-lora-train.py` | 自包含 SDXL LoRA 训练（MPS，已验证） |
| `scripts/beatscape-lora-fix-keys.py` | 救援：改名 peft 错误 key |
| `scripts/beatscape-anime-lora-batch.py` | 7 角色批量 trainset→train→validate |
| `scripts/beatscape-anime-cdcover.py` | 单角色音乐 CD/专辑封面（方形，主题色，已修 fit_clip 见 §4⑦）|

---

## 7. 跨 IDE 红线（给接手 AI，别再踩）

- 别用 `rank 16 / 20 epoch` 重训（会噪点）；用 **rank 8 / 8 epoch / lr 5e-5**。
- 别信逗号数算 CLIP 77，用 `fit_clip()`。
- 存 LoRA 用 `save_lora_weights` + `convert_state_dict_to_diffusers`，别直接存 peft state_dict。
- 加载用 `load_lora_weights` + `set_adapters`，别用 `cross_attention_kwargs`。
- 模型是 **Animagine XL 4.0**，不是 3.0。
- 训练/出图前务必 `export HF_HUB_OFFLINE=1 HF_ENDPOINT=https://hf-mirror.com`（代理封 huggingface.co，离线走镜像）。
