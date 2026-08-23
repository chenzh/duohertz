# 模块拆分与开发顺序

**版本：** v1.0  
**目标：** Cursor 按模块闭环开发，每步可测可提交。

---

## 1. 模块列表

| 模块 ID | 名称 | 路径 | 依赖 |
|---------|------|------|------|
| M0 | 文档与脚手架 | `docs/`, root | — |
| M1 | Gateway 骨架 | `apps/gateway` | M0 |
| M2 | 数据库与 Job CRUD | `apps/gateway` | M1 |
| M3 | Worker Client + 队列 | `apps/gateway` | M2 |
| M4 | ACE Worker | `workers/ace-step` | INFERENCE 安装 |
| M5 | SA3 Worker | `workers/sa3` | INFERENCE 安装 |
| M6 | 端到端人声 | M3+M4 | M3,M4 |
| M7 | 端到端 BGM | M3+M5 | M3,M5 |
| M8 | Demo Web | `apps/demo` | M2 |
| M9 | examples | `examples/` | M6,M7 |
| M10 | 验收与 OPS 脚本 | `scripts/` | M8,M9 |

---

## 2. 推荐开发顺序

```text
M0 ✅ 文档
  → M1 Gateway health + auth middleware
  → M2 Prisma jobs + POST/GET jobs（mock generating）
  → M4 ACE Worker health + generate（Mac）
  → M5 SA3 Worker health + generate（Mac）
  → M3 队列调度 + 真实 Worker 调用
  → M6 集成测试 vocal_lyrics（ACCEPTANCE U-01）
  → M7 集成测试 game_bgm（ACCEPTANCE G-01）
  → M8 Demo 单页 + BFF 代理
  → M9 curl + Python 示例
  → M10 dev-up.sh + CI 单元测试
```

**并行：** M4 与 M5 可在 M2 后并行；M8 可在 M2 后用 mock 先行。

---

## 3. 单模块 Cursor 指令模板

```markdown
## 模块：M2 Job CRUD

### 必读
- docs/DATA_API.md §5.3–5.5
- docs/RULES.md §3–§6
- docs/TECH_SPEC.md §2–§5

### 交付
- apps/gateway/src/routes/jobs.ts
- zod schemas
- prisma migrate

### 验收
- ACCEPTANCE A-03, V-01, V-02, J-01

### 禁止
- 新增依赖未在 TECH_SPEC 列出
- 修改 mode 枚举不同步 DATA_API
```

---

## 4. 每模块 Git 提交规范

```text
feat(gateway): M2 job CRUD and validation
test(gateway): A-03 V-01 V-02
docs: sync DATA_API if needed
```

---

## 5. Mock 策略（加速 M2/M8）

| 阶段 | Mock |
|------|------|
| M2 | POST job 后 status 直接 `completed`，假 audio 文件 |
| M8 | 对接 mock Gateway |
| M3 完成后 | 切换真实 Worker |

环境变量：`MOCK_WORKERS=true`

---

## 6. 完成定义（MVP Done）

- [ ] ACCEPTANCE 全部 P0 PASS
- [ ] `docs/` P0 与代码一致
- [ ] `examples/` 可跑通
- [ ] Demo 四 mode 可试
- [ ] COMPLIANCE C-01 登记（运营）

---

## 7. Post-MVP 模块预览

| 模块 | 版本 |
|------|------|
| `game_sfx` + SA3 Small SFX | API v0.2 |
| Webhook | API v0.2 |
| SaaS 控制台 + Polar | SaaS v1.0 |
| YuE Worker | API v0.2 |
