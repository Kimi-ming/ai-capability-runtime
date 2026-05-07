# ADR 0025：Capability Package V1 使用目录契约

日期：2026-05-07

状态：已接受

## 背景

Registry 不能只是 manifest 集合。开发者、reviewer、CLI 和用户都需要稳定的 package 边界来判断能力的用途、权限、测试和信任信息。

## 决策

V1 Capability Package 是 Git registry 中的目录契约，必须包含 `manifest.yml`、`README.md` 和至少一个 `tests/*.yml`。V1 package 不执行安装脚本，也不是 npm 包。

## 影响

- `opencap install` 只读取 package 元数据，不执行任意代码。
- Registry CI 可以增加 package lint。
- Trust Card 后续可由 package 和 CI 结果生成。
