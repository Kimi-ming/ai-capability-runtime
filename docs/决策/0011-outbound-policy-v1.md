# 架构决策 0011：V1 引入最小 出站网络 策略

日期：2026-05-07

状态：已接受

## 背景

`http.request_demo` 使用用户输入 URL。若 Runtime 无限制地请求任意 URL，可能造成 SSRF、内网探测、metadata 凭据窃取或数据外发。

## 决策

V1 HTTP executor 在发请求前必须执行最小 outbound policy：

- 默认要求 `https`。
- 阻断 localhost、loopback、private IP、link-local、metadata service。
- 用户输入 host 的真实调用需要显式 policy allow。
- redirect 后 final URL 也要检查。

## 影响

- `http.request_demo` 只能作为高风险 demo，不应默认真实执行任意 URL。
- T055/T091 进入 V1 安全主路径。
- 审计日志需要记录 outbound decision 和 blocked reason。
