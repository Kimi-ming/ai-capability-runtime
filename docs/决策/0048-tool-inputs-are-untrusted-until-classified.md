# 架构决策 0048：工具输入 分类前视为不可信数据

日期：2026-05-08

状态：已接受

## 背景

Tool input 可能由用户、模型、Host 或上一步工具生成。即使符合 JSON Schema，也可能包含 secret、PII、客户数据、源码或内部 URL。Schema validation 只能证明结构合法，不能证明适合外发。

## 决策

OpenCap V1 将所有 tool input 视为 untrusted data，直到完成 input classification、redaction/minimization 和 egress decision。input token 不得作为下游 auth，敏感输入不得静默外发。

## 影响

- confirmation summary 必须展示 data classes 和 egress target。
- input provenance 进入 audit/evidence。
- PII/source_code/free_text_unknown 等类别进入 policy 和测试。
