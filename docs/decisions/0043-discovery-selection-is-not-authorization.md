# 架构决策 0043：发现和选择不是授权

日期：2026-05-08

状态：已接受

## 背景

能力生态需要发现、分类、搜索、Host 暴露和模型选择。但如果把 discovery score、Host selection reason 或 commercial ranking 当成执行依据，就会绕过 OpenCap 的核心安全承诺。

## 决策

OpenCap 把 discovery、install、tools/list、model selection 和 Runtime execution 分层。发现和选择只能产生 evidence，不能授权执行。每次调用仍必须经过 validation、policy、confirmation、quota、secret resolution、execution 和 audit。

## 影响

- 未来 discovery/ranking profile 不能修改 Runtime policy。
- selection evidence 只用于调试和审计。
- paid/sponsored ranking 必须与 safety metadata 分离。
