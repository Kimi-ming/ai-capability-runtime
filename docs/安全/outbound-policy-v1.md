# 出站网络策略 V1

本文定义 HTTP Capability 的出站网络安全规则。OpenCap 调用真实世界能力时，不能把模型生成或用户提供的 URL 无约束地交给 Runtime。

## 为什么需要

任意 URL Capability 可能变成：

- SSRF 工具。
- 内网探测器。
- metadata service 凭据窃取入口。
- 数据外发通道。
- 成本消耗或 DoS 触发器。

## 默认规则

V1 默认允许：

- manifest 中写死的 `https` URL。
- URL 模板只替换 path/query 中的非 host 变量。

V1 默认阻断或要求显式 policy：

- host 来自用户输入。
- scheme 不是 `https`。
- resolved host 是 localhost、loopback、private IP、link-local。
- resolved host 是 cloud metadata service。
- redirect 到不允许的 host。

## 私有地址范围

必须阻断：

- `127.0.0.0/8`
- `10.0.0.0/8`
- `172.16.0.0/12`
- `192.168.0.0/16`
- `169.254.0.0/16`
- `::1`
- unique local IPv6
- metadata endpoints，例如 `169.254.169.254`

## 用户输入 URL

如果 manifest URL 是：

```yaml
url: "{{url}}"
```

则 Capability 必须被视为 unsafe-by-default。V1 行为：

- dry-run 可以展示计划。
- real invoke 需要 outbound policy 显式 allow。
- registry review 必须标记风险。


Registry 和示例 manifest 应使用以下 metadata 明示风险：

```yaml
metadata:
  network_access: arbitrary_url
  unsafe_by_default: true
  risk_notes: User-provided URLs can cause SSRF, private network access, or metadata service exposure without outbound policy.
```

Runtime 也必须检测 `url: "{{url}}"` 这类完整用户输入 URL 模板，即使 manifest 没有声明 metadata，也要产生 `arbitrary_url` 风险提示。


## 最小决策表

V1 最小 outbound policy 不依赖外部服务或企业策略中心，先在 Runtime 本地做硬边界判断。

| 目标类型 | 默认决策 | 说明 |
| --- | --- | --- |
| `fixed_https_origin` | allow | manifest 固定 `https` origin，且 host 不来自 input。 |
| `templated_path_or_query` | allow | host 固定，只替换 path/query 参数。 |
| `arbitrary_url` | ask/block | URL 整体来自 input，dry-run 展示风险，真实执行默认阻断，后续可加显式 allow。 |
| `localhost_or_loopback` | block | 包括 `localhost`、`127.0.0.0/8`、`::1`。 |
| `private_network` | block | 包括 RFC1918、link-local、unique local IPv6。 |
| `metadata_service` | block | 包括 `169.254.169.254` 和云 metadata host。 |
| `non_https` | block | V1 真实执行默认不允许非 HTTPS，localhost dev 只能在显式开发开关后讨论。 |
| `redirect_to_blocked_target` | block | 任何 redirect final URL 重新进入 outbound policy。 |

`block` 是硬安全边界，不能被普通 risk policy、`--yes`、future Console allow 或 breakglass 绕过。

## Runtime Gate 入口

HTTP executor 在真实请求前必须调用 outbound policy gate：

```text
manifest + validated input
        |
render URL template
        |
classify outbound target
        |
evaluate outbound policy
        |
allow -> resolve secret -> send request
block -> return OutboundBlockedError result + audit event
```

顺序要求：

1. URL 模板渲染必须发生在 outbound policy 前。
2. outbound policy 必须发生在 Secret Resolver 前。
3. outbound policy block 不能读取 secret 原值。
4. outbound policy block 必须写入 audit evidence。
5. redirect 后的 final URL 仍需重新判断。

## Dry-run 和真实执行

Dry-run：

- 可以生成 resolved URL。
- 可以标记 `warnings: ["arbitrary_url"]`。
- 可以展示 outbound decision preview。
- 不读取 secret 原值。
- 不发送网络请求。

真实执行：

- `fixed_https_origin` 和 `templated_path_or_query` 可以进入后续 policy/secret/request 流程。
- `arbitrary_url` 默认不直接执行，除非未来显式 outbound allow 配置允许。
- localhost、private network、metadata service 和 non-https 直接 block。
- block 结果应映射为 `OutboundBlockedError` 或等价结构化 tool result。

## 最小实现任务

后续实现可以拆成小任务：

1. 新增 `classifyOutboundTarget(resolvedUrl, manifest)`，输出目标类型和原因。
2. 新增 `evaluateOutboundPolicy(target, policy)`，返回 `allow` 或 `block`。
3. HTTP executor 在解析 secret 前调用 outbound gate。
4. dry-run plan 增加 outbound preview。
5. audit log 增加 outbound decision 和 blocked reason 字段。
6. registry test 增加 private IP、localhost、metadata service 和 arbitrary URL 场景。

## 测试计划

必须覆盖：

- 固定 `https://api.github.com/...` 允许。
- `https://api.example.com/{{path}}` 只替换 path/query 时允许。
- `url: "{{url}}"` 被识别为 `arbitrary_url`。
- `http://example.com` 在真实执行中阻断。
- `http://localhost:8080` 阻断。
- `http://127.0.0.1:8080` 阻断。
- `http://10.0.0.1`、`http://172.16.0.1`、`http://192.168.0.1` 阻断。
- `http://169.254.169.254/latest/meta-data/` 阻断。
- redirect 到 private/metadata target 时阻断。
- block 路径不读取 secret、不发送请求、写入 audit。

## policy 扩展示例

```yaml
outbound:
  default: deny_user_provided_hosts
  allow_hosts:
    - api.github.com
    - api.vercel.com
  allow_localhost: false
  allow_private_networks: false
```

V1 可以先实现最小版本：固定阻断私网和 localhost，后续再暴露完整配置。

## 审计要求

日志必须记录：

- resolved_url，脱敏后。
- outbound decision。
- blocked reason。
- redirect final URL，如果发生 redirect。

## 与 OWASP 风险映射

- Prompt Injection：恶意输入可以诱导模型调用任意 URL。
- Excessive Agency：过宽工具能力会让 AI 执行超出预期的动作。
- Supply Chain：恶意 Capability 可以把 host 暴露为 input。
- Sensitive Information Disclosure：URL 可作为数据外发通道。

## 关联任务

- T055：处理 arbitrary URL Capability 风险。
- T091：最小 outbound policy 设计。
- T128：Abuse Cases smoke tests。
