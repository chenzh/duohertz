# Backlog — beatscape (MusicSaas)

仅 **agent-safe**；推理/Gateway 见 `human-only-queue.md`。

### TICKET-B01 [agent-safe] 补齐 Play 页 SEO title/description

- **What:** `apps/beatscape` 路由级 metadata 或 `index.html`  
- **AC:** AC-B2、AC-B3  

### TICKET-B02 [agent-safe] Settings 页隐私链接检查

- **What:** 确保 Settings 含 Privacy/Terms 外链或路由  
- **AC:** AC-B2  

### TICKET-B03 [agent-safe] 修复/补全 playState 单测回归

- **What:** `apps/beatscape/src/engine/playState.test.ts` 若 CI 红则修  
- **AC:** AC-B2、AC-B4  

### TICKET-B04 [agent-safe] Leaderboard 空状态文案 i18n-ready

- **What:** 空列表英文文案 + 预留 i18n 结构（不必全量翻译）  
- **AC:** AC-B2  

### TICKET-B05 [agent-assisted] Reddit 启动页 CTA 文案（docs/BEATSCAPE-REDDIT-LAUNCH.md）

- **AC:** CEO 勾文案后再 merge  

## human-only（永不 agent-safe）

- Gateway Job API 变更  
- MLX worker / `workers/**`  
- Catalog ingest / stage3 pipeline  
- 部署密钥 / Cloudflare / 生产 env  
