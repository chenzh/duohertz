# Demo 路演脚本

**时长：** 5 分钟（速览）/ 15 分钟（完整）

## 5 分钟速览

1. **开场（30s）** — 打开 `/demo/`，指着 Hero：「本地双引擎音乐 API，人声 ACE、BGM SA3，数据不出内网。」
2. **橱窗（60s）** — 滚动到精选，点一条 BGM + 一条人声试听，无需生成。
3. **体验（2min）** — 点「立即体验」，选「暗黑地牢」预设 → 下一步 → 生成 → 播放。
4. **集成（60s）** — 展开集成面板，复制 cURL / Python。
5. **收尾（30s）** — 定价预览：「Demo 免费，商用 SaaS 后续。」

## 15 分钟完整

- 增加 Trust 架构图讲解（Browser → Gateway → Workers → MLX）
- 增加 PoC 清单与硬件要求（Mac M 系列）
- 现场第二遍：人声 `vocal_lyrics` 预设
- Worker 离线时播放 `samples/` 兜底并说明

## 全屏路演

```bash
bash scripts/demo-present.sh --present
```

- 访问 `?present=1`
- `P` 显示讲稿备注，`←/→` 切换步骤点
