# 商用许可与合规

**版本：** v1.0  
**产品：** 音乐生成 API + Demo（本地推理）

> **不存在零风险。** 本文记录许可边界与运营 checklist。

---

## 1. 本项目采用的模型

| 引擎 | 许可 | 商用条件 | 产出权利 |
|------|------|----------|----------|
| ACE-Step 1.5 | **MIT** | 允许商用 | 官方鼓励商用；用户自担侵权风险 |
| Stable Audio 3 | **Community License** | 组织年收入 **&lt;100 万美元** 免费商用 | **产出归用户**（Stability 声明） |
| YuE（v0.2 备选） | Apache 2.0 | 允许；建议署名 | 用户自担侵权风险 |

**官方 LICENSE：**

- ACE-Step 1.5: https://github.com/ace-step/ACE-Step-1.5/blob/main/LICENSE
- SA3: https://huggingface.co/stabilityai/stable-audio-3-medium/blob/main/LICENSE.md
- YuE: https://github.com/multimodal-art-projection/YuE/blob/main/LICENSE

---

## 2. 必须完成的合规动作

| # | 动作 | 状态 | 负责人 |
|---|------|------|--------|
| C-01 | Stability AI [Community License 登记](https://stability.ai/community-license) | ⬜ | 运营 |
| C-02 | 服务条款：AI 生成标注、用户原创责任 | ⬜ | 法务/产品 |
| C-03 | 禁止用户 prompt 模仿指定艺人（RULES 可 enforcement） | ⬜ | 产品 |
| C-04 | 年收入接近 100 万美元时启动 SA3 Enterprise 评估 | ⬜ | 财务 |
| C-05 | 保存 Job 元数据备查（engine、时间、mode） | ⬜ | 工程 |

---

## 3. 明确禁止接入的模型/服务

| 名称 | 原因 |
|------|------|
| **SongGeneration (LeVo)** | 许可仅限学术/研究/教育，**禁止商业/生产** |
| **MusicGen 权重** | CC-BY-NC 4.0，**禁止商用** |
| **MELO / 海绵 / X Studio API** | 闭源平台条款，非自托管权重 |
| **Suno / Udio API 套壳** | 产品策略禁止 |

「commercial-grade」营销表述 **不等于** 许可允许商用 — 以 LICENSE 原文为准。

---

## 4. 常见误传纠正

| 误传 | 事实 |
|------|------|
| SongGeneration MIT 零限制 | 主许可 **禁止商用** |
| ACE-Step 全是 Apache 2.0 | **1.5 = MIT** |
| MusicGen 代码 MIT 即可 | **权重 NC** |
| 开源 = 无版权纠纷 | 风格相似仍可能侵权 |

---

## 5. 用户协议要点（API 客户）

建议在 `/legal/terms`（SaaS 时）或商务合同中包含：

1. 生成内容为 AI 产出，客户须自行确保不侵犯第三方权利。
2. 禁止用于违法、深度伪造冒充真人等滥用场景。
3. 客户对其 prompt 与下游使用负责。
4. 服务按「现状」提供；不保证无相似性侵权。

Demo 页脚 MVP 可加一行：「AI 生成内容，商用前请自行评估合规。」

---

## 6. 数据与隐私

| 项 | MVP 策略 |
|----|----------|
| 音频存储 | 本地/S3，TTL 72h 默认 |
| prompt/lyrics | DB 存储；日志默认不打印全文 |
| 训练 | **不使用**用户音频训练模型 |
| 跨境 | 数据在己方 Mac/指定区域 |

---

## 7. 对外宣传用语（合规）

**可以说：**

- 「基于 MIT / Stability Community 许可的开源模型本地部署」
- 「在符合条件时支持商业项目使用生成音频」

**避免说：**

- 「100% 无版权风险」「绝对干净版权」
- 「可替代任何商用音乐库无限制」

---

## 8. 审计记录

| 日期 | 变更 | 审核人 |
|------|------|--------|
| 2026-08-23 | 初版：ACE + SA3 双引擎 | 立项 |

许可变更时更新本文 + PRD §14。
