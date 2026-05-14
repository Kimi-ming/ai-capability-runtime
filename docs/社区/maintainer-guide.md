# 维护者指南

本文定义 OpenCap 维护者如何处理 PR、Capability review、发布和安全事件。

## 维护者职责

- 保护 Runtime 安全边界。
- 保持 docs/code 一致。
- 审查 Registry Capability 权限和风险。
- 维护任务、ADR、风险登记。
- 推动 release gate。

## PR Review 顺序

1. 是否改变安全边界。
2. 是否改变公共契约。
3. 是否有测试。
4. 是否更新文档。
5. 实现质量和风格。

## Capability PR

Capability PR 必须先确认 `.github/PULL_REQUEST_TEMPLATE.md` 的 “Capability Registry PR” 区块已完成。维护者随后按 `docs/社区/registry-supply-chain-review.md` 做供应链 review，再使用 `docs/社区/capability-review-checklist.md` 做逐项内容检查。

维护者不应只看 schema 是否通过，还要判断：

- 权限是否诚实。
- 风险是否低估。
- endpoint 是否可信。
- README 是否误导用户。
- tests 是否避免真实 secret。

如果 PR 修改 `registry/**` 但没有勾选 Capability Registry PR 区块、没有说明 `pnpm validate` 结果，或没有补齐 manifest/README/tests，应要求提交者补齐后再进入正式 review。

## Design PR

如果争议超过普通 PR 范围：

- 要求 RFC。
- 接受后补 ADR。
- 更新 SYSTEM/INDEX。

## Release

发布前维护者必须确认：

- CI 通过。
- CHANGELOG 更新。
- docs/HANDOFF 更新。
- High 风险已处理。
- package/version 与 release notes 一致。

## 安全问题

安全报告按 SECURITY.md 处理。不要要求用户在公开 issue 暴露漏洞细节。

## 合并原则

- 小 PR 优先。
- Capability 和 Runtime 改动分开。
- 安全修复优先。
- 不让 Cloud-only 需求破坏 OSS 主路径。
