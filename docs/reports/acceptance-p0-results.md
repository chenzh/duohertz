# P0 验收报告

**日期：** 2026-08-23  
**命令：** `python scripts/acceptance-p0.py`  
**结果：** **30/30 PASS**

## 环境

| 组件 | 地址 |
|------|------|
| Gateway | `http://localhost:8080` (Windows 开发机) |
| Workers | Mac `127.0.0.1:8101/8102`（SSH 反向隧道 → Windows 推理进程） |
| API_KEY | `dev-api-key-change-me` |
| API_KEY_ALT | `dev-api-key-alt`（J-02 隔离测试） |

## 通过用例

H-01, H-02, A-01~03, V-01~06, U-01~04, G-01~03, J-01~04, R-01, D-01-proxy, D-04-proxy, D-05, D-06, E-01~04

## 未自动化 / 待补

| ID | 说明 |
|----|------|
| H-03 | 需手动停止 SA3 Worker 后复测 |
| D-01/D-02 | 浏览器 Demo 四 mode（需人工或 E2E） |
| D-03 | Worker 离线 UI（需停 Worker 后手测） |
| P-01~P-04 | 非功能（启动时延/日志脱敏） |

## 备注

- 当前 Worker 为 **合成 WAV 链路验证**；Mac 安装 Xcode CLT 后可切换官方 MLX 权重（见 `INFERENCE.md`）。
- `examples/curl/*.sh` 在 **Mac** 上 exit 0（`API_BASE=http://192.168.0.135:8080`）。
