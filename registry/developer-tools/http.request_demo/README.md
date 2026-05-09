# http.request_demo

演示最简单的 OpenCap HTTP Capability。

## 风险

`read_only`，但 `metadata.network_access: arbitrary_url` 且 `metadata.unsafe_by_default: true`。

该 demo 会对用户提供的 URL 执行 GET 请求。没有 outbound policy 时，它可能变成 SSRF、内网探测或 metadata service 访问入口。生产 Runtime 必须对这种能力应用 outbound network policy。

该 Capability 只适合作为风险示例，不适合默认安装到可信 Registry。

## 输入示例

```json
{
  "url": "https://example.com"
}
```
