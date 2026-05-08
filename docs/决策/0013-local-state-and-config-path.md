# 架构决策 0013：本地状态和配置路径

日期：2026-05-07

状态：已接受

## 背景

OpenCap V1 需要一个清晰、可测试、可删除的本地状态目录。早期如果直接写用户 home，会让开发和测试状态不透明。

## 决策

V1 state dir 解析顺序：

```text
1. --state-dir
2. OPENCAP_STATE_DIR
3. <cwd>/opencap.local
```

Registry root 解析顺序：

```text
1. --registry
2. OPENCAP_REGISTRY_DIR
3. <cwd>/registry
```

V1 不实现全局 config 文件，`policies.yml` 是 state dir 中唯一用户手写配置。

## 影响

- 测试可以使用临时 state dir。
- 用户能通过删除 `opencap.local/` 重置状态。
- `--state-dir` 是 CLI 全局参数。
- 未来如支持 home-level config，需要新增 ADR。
