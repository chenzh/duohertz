# BeatScape 资产与授权归档

> 当前资产快照：**2026-09-05，105 首曲库**。对应 [PRD](../PRD-BEATSCAPE.md) §7.5、§7.7、§11.4。
> 本页记录资产来源、许可证文件与验收证据状态。`rights: "owned"` 是曲库声明，不能替代人工耳检或差异化盲测。
> 用户已确认耳检、盲测、真机验收尚未完成；当前放行状态以[上线准备清单](../BEATSCAPE-RELEASE-READINESS.md)及签审记录为准。

## 1. 字体归档

| 字体 | 当前用途 | 归档授权 | 授权文本 |
|------|----------|----------|----------|
| **Anton** | Display：标题、HUD 数字、判定文案；站点与单曲 OG 卡 | SIL OFL 1.1 | [fonts/anton-OFL.txt](fonts/anton-OFL.txt) |
| **Sora** | 次级标题、强调标签 | SIL OFL 1.1 | [fonts/sora-OFL.txt](fonts/sora-OFL.txt) |
| **IBM Plex Sans** | 数据、正文、UI；单曲 OG 元数据与 CTA | SIL OFL 1.1 | [fonts/ibmplexsans-OFL.txt](fonts/ibmplexsans-OFL.txt) |

字体引用见 [index.html](../../apps/beatscape/index.html) 与 [styles.css](../../apps/beatscape/src/styles.css)；归档文本来自 Google Fonts 上游仓库的 `ofl/<family>/OFL.txt`。站点 OG 的 [HTML 模板](../../apps/beatscape/scripts/og-card.html) 与[生成脚本](../../apps/beatscape/scripts/generate-site-og.mjs)使用 Anton；[单曲 OG 生成器](../../scripts/beatscape-generate-og.py)固定读取仓内 Anton / IBM Plex Sans WOFF2，不使用系统商业字体。

当前单曲 OG 生成器要求 Pillow 与仓内字体；缺少依赖或字体会失败，不允许静默退化为无文字几何图。105 张当前卡均由该脚本生成，发布器逐张校验 PNG 签名与 1200×630 尺寸。技术校验和三张跨街区视觉抽样不替代完整人工美术签审。

## 2. 音频资产快照

事实来源：[public/catalog.json](../../apps/beatscape/public/catalog.json)。

| 项目 | 当前数量 / 状态 | 证据边界 |
|------|-----------------|----------|
| 曲目 | 105 首 | 当前曲库条目数 |
| 生成引擎字段 | `stable-audio-3` 104 首；`ace-step` 1 首 | 曲库记录的生成来源 |
| 权利字段 | 105/105 `rights: "owned"` | 项目元数据声明，不是逐曲审核结果 |
| 人工耳检 | **尚未完成** | 尚无覆盖当前音频指纹的完整人工记录 |

不能用 `owned` 字段推导“无任何第三方旋律、采样、音效”或“原曲相似度检查已通过”。当前候选音频与人工记录的绑定方式、三首循环扩展候选的接缝耳检要求见[上线准备清单](../BEATSCAPE-RELEASE-READINESS.md)。

## 3. 美术资产快照

| 资产 | 当前事实 | 来源 / 打包依据 |
|------|----------|-----------------|
| 曲目封面 | 105 张 `catalog/<track_id>/cover.svg` | [public/catalog](../../apps/beatscape/public/catalog/)；[封面生成器](../../scripts/beatscape-cover.py) |
| 站点 OG | 1 张 `og.png`，1200 × 630 | [当前站点图](../../apps/beatscape/public/og.png)；§1 中的模板与生成脚本 |
| 单曲 OG | 105 张 `catalog/<track_id>/og.png`，1200 × 630，约 4.8 MiB；当前随静态 Track 页发布 | [单曲 OG 生成器](../../scripts/beatscape-generate-og.py)；[release.mjs](../../apps/beatscape/scripts/release.mjs) 强制存在、尺寸与内容哈希 |
| 角色位图 | **7 个 District 文件组，共 7 张 PNG + 14 张 WebP**，当前均随发布包复制 | [public/characters](../../apps/beatscape/public/characters/)；当前 `dist/characters` 文件清单 |

七个文件组的名称为 `afterhours-lane`、`chrome-yard`、`glass-rim`、`night-grid`、`pulse-core`、`skyline-hook`、`slide-district`；每组包含 `<slug>.png`、`<slug>-128.webp`、`<slug>-512.webp`。不能继续将当前站点描述为“无人物位图”或“全部程序化几何素材”。

当前页面的主角色是 **NIGHTSHIFT 三人组：JUNO、ATLAS、TORQUE**。角色映射分别使用 `pulse-core`、`skyline-hook`、`chrome-yard` 文件组，其余 District 的页面角色回退 JUNO；页面通过 WebP 变体显示头像。依据为 [scape.ts](../../apps/beatscape/src/constants/scape.ts)、[CharacterAvatar.tsx](../../apps/beatscape/src/components/CharacterAvatar.tsx) 与[角色页](../../apps/beatscape/src/pages/Characters.tsx)。其余四个文件组仍在包内，不能因页面只展示三人而从资产盘点中省略。

角色创作与生成来源见 [World Bible](../BEATSCAPE-WORLDBIBLE.md) 和[角色 LoRA runbook](../BEATSCAPE-CHARACTER-LORA.md)。runbook 记录的是本地 Animagine XL 4.0 / LoRA 管线；旧七人叙事已退役，当前人物设定以 World Bible 三人组为准。本次归档只核对文件与文档关系，未重新验证模型版本、权重或签署角色人工审查结论。

## 4. 差异化红线：当前证据状态

此前本页的“25 首、零人物位图、逐项通过”属于旧资产阶段记录，**不能作为当前 105 首曲库及角色位图的验收证据**。正文关键词搜索只能定位文本，不能证明图片、旋律或整体视觉已经通过人工检查。

| 检查对象 | 已有事实 | 当前结论 |
|----------|----------|----------|
| 字体 | 三份 OFL 文本已归档，当前页面字体引用可追溯 | 归档在本页 §1 |
| 音频旋律、采样、音效 | 105 首曲库及生成引擎元数据可追溯 | 人工耳检尚未完成，不能写“通过” |
| 角色造型、图案、视觉元素 | 七组位图仍随包，页面主角色为三人 | 需覆盖当前实际资产；不沿用“无位图”结论 |
| 第三方名称、标识、整体视觉联想 | 项目有 PRD §7.7 红线与盲测规程 | 当前差异化盲测尚未完成 |

项目视觉名称为 **RESONANCE（共振）**。品牌命名、元数据声明与技术测试均不替代上述人工记录。

## 5. 差异化盲测（上线前门禁）

按 PRD §11.4 与[差异化盲测规程](../RESONANCE-BLINDTEST.md)，找 **5–10 名不玩日式 RPG** 的观察者，**只给当前截图、不给提示**，问“这看起来像哪款游戏”。任一人说出来源作品即判定不通过，退回处理差异化。

截图范围、原话记录、证据文件与签审绑定方式见[盲测规程](../RESONANCE-BLINDTEST.md)及[上线准备清单](../BEATSCAPE-RELEASE-READINESS.md)。不得将测试模板、截图生成成功或自动化检查结果登记为观察者结论。

## 6. 盲测结果

| 日期 | 观察者数 | 说出来源作品的人数 | 结论 |
|------|----------|--------------------|------|
| 2026-09-05 | 尚未执行 | 无记录 | **待人工验收，未放行** |

用户已明确尚未完成这些人工验收；本轮仅更新资产归档，未填写或代签盲测结果。完成后保留观察者原话与当前截图版本，并依上线准备清单接入签审。

## 7. 记录维护

曲库、角色图片、页面视觉或字体变动后，更新本页资产快照并核对原有人工记录是否仍覆盖当前候选。不得从历史勾选项自动继承当前版本的通过状态。
