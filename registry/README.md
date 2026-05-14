# OpenCap Registry

OpenCap Registry 是 Git-based Capability 注册表。它保存可以被 OpenCap Runtime 安装、校验和暴露给 AI Host 的 Capability 条目。

Registry 不是一个随意的工具目录。每个条目都必须声明真实执行行为、权限、风险、凭据需求、测试样例和维护信息。

## 目录结构

```text
registry/
  developer-tools/
    github.create_issue/
      manifest.yml
      README.md
      tests/
        basic.yml
```

当前 V1 已有分类：

| 分类 | 用途 |
| --- | --- |
| `developer-tools` | GitHub、Vercel、数据库、部署、协作和工程工作流能力。 |

后续新增分类前，应先确认它代表稳定的用户场景，而不是某个单独厂商或临时实验。

## Capability 条目要求

每个 Capability 目录必须包含：

- `manifest.yml`
- `README.md`
- `tests/` 下至少一个 registry test，例如 `tests/basic.yml`

`manifest.yml` 必须声明：

- 稳定 `id`
- `type: http`
- `input` 和 `output` JSON Schema
- `auth`
- `permissions`
- `execution`
- `metadata.trust_level`

`README.md` 必须说明：

- 这个 Capability 做什么。
- 输入和输出是什么。
- 需要什么凭据和环境变量。
- 会访问哪个外部服务。
- 权限和风险等级是什么。
- 如何 dry-run 或验证。

测试样例不能包含真实 token、cookie、私有 URL 或用户数据。

## Trust Level

OpenCap 使用 trust level 帮用户理解条目的成熟度。trust level 不是执行授权来源，Runtime 仍以 policy、permissions 和 confirmation 为准。

| 等级 | 含义 |
| --- | --- |
| `experimental` | 默认等级。schema 合法，但只做基础评审。 |
| `listed` | 通过 registry 基础要求并可被安装发现。 |
| `tested` | 有更完整测试，且测试在 CI 中稳定通过。 |
| `verified` | 维护者身份、服务所有权或集成边界经过验证。 |
| `official` | OpenCap 核心团队维护。 |

新贡献条目默认必须使用：

```yaml
metadata:
  trust_level: experimental
```

不得在没有维护者确认的情况下把第三方条目标成 `verified` 或 `official`。

## 提交流程

1. 选择合适分类，例如 `developer-tools`。
2. 创建目录：`registry/<category>/<capability_id>/`。
3. 编写 `manifest.yml`。
4. 编写 `README.md`。
5. 添加 `tests/basic.yml`。
6. 本地运行校验：

```bash
pnpm validate
```

7. 提交 Pull Request。
8. 等待 GitHub Actions Registry CI 通过。
9. 维护者按 Capability PR 评审指南人工检查权限、风险、端点、auth/secret、README 和 tests。

## 安全边界

Registry 不接收以下内容：

- 真实 API token、cookie、私钥、session 或 OAuth refresh token。
- 私有用户数据、内部域名、内部 IP 或生产环境敏感 URL。
- 绕过 policy、confirmation、audit 或 Host 安全边界的说明。
- prompt injection、要求模型忽略指令、隐藏调用或泄露 secret 的 model-visible 文本。
- 默认执行 destructive、financial、code_execution 或不受限 external_send 的能力。
- 未标记 `metadata.unsafe_by_default: true` 的任意 URL / proxy capability。
- token query string placement。

如果 Capability 需要高风险能力，应先通过设计讨论或 RFC，而不是直接提交 registry 条目。

## 维护者评审

维护者评审时至少检查：

- manifest schema 是否通过。
- Capability id 是否稳定且与目录名一致。
- 描述是否匹配真实 `execution` 行为。
- 权限是否最小化，风险等级是否诚实。
- 外部端点是否固定且清楚声明。
- auth 是否只通过 env/secret resolver 路径，不通过 input 或 query string。
- README 是否说明凭据、风险、输入输出和 dry-run。
- registry tests 是否覆盖最小 dry-run 或 validation 场景。
- unsafe-by-default 标记是否用于任意 URL 或代理类能力。

完整供应链 review 流程见 [Registry 供应链 Review 工作流](../docs/社区/registry-supply-chain-review.md)；逐项 Capability 内容检查见 [能力评审清单](../docs/社区/capability-review-checklist.md)。

## 相关文档

- [编写一个 Capability](../docs/教程/write-a-capability.md)
- [评审一个 Capability PR](../docs/教程/review-a-capability.md)
- [注册表指南](../docs/社区/registry-guidelines.md)
- [Registry 供应链 Review 工作流](../docs/社区/registry-supply-chain-review.md)
- [能力评审清单](../docs/社区/capability-review-checklist.md)
- [能力清单](../docs/规范/capability-manifest.md)
- [权限模型](../docs/安全/permission-model.md)
