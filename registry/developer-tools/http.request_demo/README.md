# http.request_demo

演示最简单的 OpenCap HTTP Capability。

## 风险

`read_only`

该 demo 会对用户提供的 URL 执行 GET 请求。生产 Runtime 必须对这种能力应用 outbound network policy。

该 Capability 适合作为示例，不适合默认安装到可信 Registry。

## 输入示例

```json
{
  "url": "https://example.com"
}
```
