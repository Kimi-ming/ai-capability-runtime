# 评审一个 Capability PR

本文是维护者评审 Registry Capability PR 的操作指南。它面向已经了解 OpenCap Manifest 的维护者，目标是在合并前判断一个 Capability 是否可以安全进入 Registry。

相关参考：

- [能力清单](../规范/capability-manifest.md)
- [注册表指南](../社区/registry-guidelines.md)
- [能力评审清单](../社区/capability-review-checklist.md)
- [权限模型](../安全/permission-model.md)

## 评审结论

每次评审最后只给三类结论：

| 结论 | 含义 |
| --- | --- |
| 阻止合并 | 存在安全、权限、schema、测试或描述真实性问题。 |
| 可合并，带 follow-up | 不影响安全边界和执行真实性，但需要后续完善文档、示例或分类。 |
| 可合并 | schema、权限、风险、测试和 README 均满足 V1 要求。 |

如果不确定风险等级，默认选择更高风险并要求提交者解释。

## 第一步：确认目录和身份

检查 Registry 条目结构：

```text
registry/<category>/<capability_id>/
  manifest.yml
  README.md
  tests/
    basic.yml
```

必须阻止合并：

- Capability 目录名和 `manifest.yml` 的 `id` 不一致。
- 缺少 `manifest.yml`。
- 缺少 `README.md`。
- 缺少 registry test。
- `id` 不是稳定的 `provider.action_name` 风格，或和现有 Capability 冲突。

可以作为 follow-up：

- category 命名可以更清晰，但不影响路径稳定性。
- README 示例还可以更丰富，但已有基本用途、输入、输出和风险说明。

## 第二步：运行机器校验

在本地运行：

```bash
pnpm validate
```

CI 中同样会运行 `pnpm validate`。它必须覆盖：

- Capability manifest schema。
- registry test schema。
- 示例 `tests/basic.yml` 的基础结构。

必须阻止合并：

- `pnpm validate` 失败。
- schema 错误被提交者用绕过字段、删除测试或放宽 schema 的方式规避。
- test fixture 包含真实 token、cookie、私有 URL 或用户数据。

可以作为 follow-up：

- test 名称不够清楚，但 fixture 合法且能表达最小 dry-run 场景。

## 第三步：审 manifest 和真实行为是否一致

重点看这些字段：

- `name`
- `description`
- `input`
- `output`
- `auth`
- `permissions`
- `execution`
- `metadata`

必须阻止合并：

- `description` 描述的是读操作，但 `execution.method` 是 POST、PUT、PATCH 或 DELETE。
- `input` schema 没有限定关键字段，导致模型可以传入过宽参数。
- `execution.url` 指向未声明的服务、代理或跳转端点。
- `execution.body.fields` 缺失，但写操作需要 JSON body。
- `output` 和 README 承诺的结果不一致。
- manifest 声称 V1 不支持的类型，例如 `type: mcp` 或 `type: local`。

可以作为 follow-up：

- `output` schema 还可以更细，但已覆盖主要返回字段。
- `description` 可以更可读，但没有误导模型或用户。

## 第四步：审权限最小化

逐条检查 `permissions`：

```yaml
permissions:
  - resource: github.issue
    action: create
    risk: write
    confirmation: ask
```

必须阻止合并：

- 权限没有覆盖真实外部行为。
- 多个外部行为只声明了一个轻量权限。
- 写操作标成 `read_only`。
- 删除、覆盖、不可逆操作没有标成 `destructive`。
- 对外发消息、发邮件、发 Slack、发评论没有标成 `external_send`。
- 付款、订阅、购买、退款、交易没有标成 `financial`。
- 执行命令、运行脚本、触发构建中任意代码执行没有标成 `code_execution`。
- Capability 会读取、转换、返回或暴露密钥材料，却没有标成 `secret_access`。

可以作为 follow-up：

- `resource` 命名可以更规范，但风险等级和 action 准确。
- 一个只读能力未来可能拆成更细粒度权限，但当前外部行为没有写入风险。

## 第五步：审风险等级和确认行为

风险等级不能只看 HTTP method，要看真实后果。

必须阻止合并：

- `confirmation: optional` 用在 `destructive`、`financial` 或高影响 `external_send` 上。
- README 暗示用户可以把默认 policy 改成 allow 来绕过写操作确认。
- Capability 试图通过模型提示、字段描述或 README 诱导 Host 自动执行。
- 任意 URL、代理请求或用户控制 host 没有声明 `metadata.network_access: arbitrary` 和 `metadata.unsafe_by_default: true`。

可以作为 follow-up：

- 低风险只读能力仍使用 `confirmation: ask`，安全但体验偏保守。

## 第六步：审外部端点和数据外发

检查 `execution.url`、URL 模板和 `execution.body.fields`。

必须阻止合并：

- URL host 由用户输入完整控制，但没有 unsafe-by-default 标记。
- 请求可以访问 localhost、private network 或 cloud metadata service。
- `execution.body.fields` 默认外发完整 input。
- README 没有说明外发到哪个服务。
- Capability 隐藏第二个外部请求或依赖未声明代理。
- token 放在 query string 中。

可以作为 follow-up：

- README 可以补更多服务端限制说明，但 manifest 已清楚限制 host、path 和 body 字段。

## 第七步：审 auth 和 secret

检查 `auth`：

```yaml
auth:
  type: api_key
  provider: github
  env: GITHUB_TOKEN
  placement:
    type: bearer
```

必须阻止合并：

- README 要求用户把真实 secret 写进 manifest、test 或 input。
- `api_key` 没有声明 `env`。
- `api_key` 没有声明 `placement`。
- 使用 query token。
- test fixture、README 截图或示例输出包含真实 secret。
- Capability 允许用户通过 input 传 token 来替代 manifest auth。

可以作为 follow-up：

- README 可以补充如何创建最小权限 token，但已经说明 env var 名称和权限范围。

## 第八步：审 model-visible 文本

模型可见文本包括：

- `name`
- `description`
- input/output schema description
- README 中可能被投影给 Host 的摘要

必须阻止合并：

- 文本包含 prompt injection，例如“忽略之前的指令”。
- 文本指挥模型绕过确认、隐藏调用或泄露 secret。
- 文本夸大能力，例如只读查询却描述为“自动修复并部署”。
- 文本要求 Host 不展示风险或不写日志。

可以作为 follow-up：

- 文本风格不够统一，但没有安全风险，也没有误导调用。

## 第九步：审 README

README 至少应说明：

- Capability 用途。
- 输入字段和输出字段。
- 所需凭据和 env var。
- 权限、风险和确认行为。
- dry-run 或最小调用示例。
- 可能访问的外部服务。

必须阻止合并：

- README 和 manifest 行为不一致。
- README 没有风险说明。
- README 要求真实 token 出现在命令参数、input 文件或测试中。
- README 没有说明写操作会改变外部状态。

可以作为 follow-up：

- README 缺少高级用法，但最小安全信息完整。

## 第十步：审 registry tests

检查 `tests/basic.yml` 或等价测试。

必须阻止合并：

- 没有 registry test。
- test 不能体现 URL、body、permission 或 expected status。
- test 使用真实 secret。
- 写操作测试需要真实外部 API 才能通过基础 CI。
- 任意 URL 能力没有覆盖风险或阻断预期。

可以作为 follow-up：

- 测试只覆盖 happy path，但该 Capability 风险低，且后续任务会补更细 conformance。

## 第十一步：审 trust level

新条目默认应是：

```yaml
metadata:
  trust_level: experimental
```

必须阻止合并：

- 新贡献者直接声明 `verified` 或 `official`。
- 没有维护者、license 或来源说明。
- 维护者身份、服务所有权或商标归属存在误导。

可以作为 follow-up：

- 维护者信息格式可以更标准，但能联系到提交者并且 license 明确。

## 第十二步：写评审意见

建议用下面的结构回复 PR：

```text
结论：阻止合并 / 可合并，带 follow-up / 可合并

必须修改：
- ...

建议后续：
- ...

已验证：
- pnpm validate
- manifest 权限和风险人工检查
- README 与 execution 行为一致性检查
```

评审意见要指向具体文件和字段，例如：

```text
registry/developer-tools/example.action/manifest.yml: permissions[0].risk
```

## 快速阻断清单

看到以下任一项，直接要求修改后再审：

- `pnpm validate` 失败。
- 缺少 manifest、README 或 registry test。
- 权限低估真实行为。
- 写操作标成 read_only。
- destructive、financial 或 external_send 没有清楚确认边界。
- 任意 URL 能力没有 `unsafe_by_default`。
- token 进入 query string、input、README 或 tests。
- manifest 描述和 execution 行为不一致。
- model-visible 文本包含 prompt injection 或绕过确认的指令。
- 隐藏外部请求、代理或未声明数据外发。

## 可作为 follow-up 的问题

这些问题可以不阻止合并，但应留下明确后续：

- README 缺少高级示例。
- output schema 可以更精细。
- category 可以后续迁移或重命名。
- 低风险 Capability 的测试只覆盖最小 dry-run。
- 文案风格需要统一，但不影响安全和真实性。

## 合并前最后确认

合并前再确认一次：

```bash
pnpm validate
```

并检查 PR 是否只修改了相关 Capability、文档或测试文件。若 PR 同时修改 Runtime、schema、policy 或 CI，应拆分或要求额外技术评审。
