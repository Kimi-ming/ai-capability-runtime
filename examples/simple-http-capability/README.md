# 简单 HTTP 能力示例

这个示例展示最小可用的 OpenCap Capability 形态。

它声明了：

- 一个必填输入字段
- 一个只读权限
- 不需要认证
- 一个 HTTP GET 执行目标

从仓库根目录运行校验：

```bash
pnpm validate
```

安装 registry 中的 demo 能力后，可以用示例输入做 dry-run：

```bash
opencap install http.request_demo
opencap invoke http.request_demo --dry-run --input examples/simple-http-capability/input.json
```

`http.request_demo` 是任意 URL 示例，真实执行前必须理解 outbound policy 风险。
