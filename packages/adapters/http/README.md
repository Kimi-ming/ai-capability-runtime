# HTTP 适配器

HTTP adapter 是 OpenCap 的第一个执行目标。

它应支持：

- 模板化 URL
- 常见 HTTP 方法
- JSON request body
- 通过环境变量读取 API key
- timeout
- 输出校验

V1 应优先支持固定 Host API。允许用户传入完整 URL 的 Capability 必须在 Registry 中标记为高审查风险。
