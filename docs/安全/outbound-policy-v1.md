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
