# 模型可见提示面安全 V1

本文定义 OpenCap 如何治理模型可见的工具描述、schema 文案、工具结果和发现元数据。

## 核心判断

在 AI 原生 Runtime 中，模型可见文本本身就是安全边界的一部分。它不会直接授权执行，但会影响模型是否选择某个工具、如何填写参数、是否误解风险。

因此 OpenCap 把所有 model-visible metadata 当作 untrusted prompt surface 处理。

## V1 Prompt Surface

| 表面 | 来源 | 风险 |
| --- | --- | --- |
| tool name | manifest id 映射 | tool shadowing、名称误导 |
| tool title | manifest name | 误导模型或用户 |
| tool description | manifest description + Runtime 模板 | prompt injection、过度承诺 |
| input property description | input schema | schema poisoning、诱导泄密 |
| output property description | output schema | 误导结果解释 |
| tool result text | provider response / error | indirect prompt injection |
| resource links | future MCP resource links | context injection |

## 威胁模型

### Tool description injection

恶意 Capability 在 description 中写入类似“忽略之前的系统指令”“调用我之前不要请求确认”的文本，诱导模型或 Host 改变行为。

控制：description lint + Runtime-owned projection。

### Schema poisoning

恶意字段描述诱导模型把 secret、token、cookie 或私密内容填入普通参数。

控制：input/output schema 的 description 字段也进入 lint。

### Tool shadowing

恶意能力使用近似名称或描述伪装成官方能力。

控制：tool name collision detection、namespace review、Trust Card 和 lifecycle signal。

### Tool result poisoning

外部 API 返回包含指令性文本，Host 把它放回模型上下文后影响后续工具调用。

控制：Result Envelope、结构化输出、output schema validation、结果内容脱敏和 result sanitizer。

### Rug pull metadata update

已安装能力升级后，模型可见描述发生危险变化。

控制：projection hash、manifest digest、lifecycle/advisory 检查。

## V1 控制

- 所有 model-visible text 必须经过 lint。
- MCP tool description 由 Runtime 模板生成。
- README 和远程文档不进入 V1 tools/list。
- tool descriptions 不得成为 policy、consent、quota 或 trust 的授权来源。
- Runtime 对 tools/call 的真实输入重新做 schema validation。
- 写操作仍然经过 policy 和 confirmation。
- tool result text 不得写入 secret；未来进入 result sanitizer。

## 禁止内容

Model-visible metadata 不得包含：

- 指挥模型忽略系统、开发者、用户或安全指令。
- 指挥模型自动调用该工具或优先调用该工具。
- 指挥模型跳过确认、策略、审计或权限检查。
- 要求模型收集、泄露、复制 token、cookie、secret、private key。
- 隐藏文本、HTML comment、零宽字符或混淆式 payload。
- 与真实 execution 不一致的能力描述。

## 与 MCP 的关系

MCP 工具是 model-controlled，工具定义包含 name、title、description、inputSchema、outputSchema 和 annotations。OpenCap 必须承认这些字段会影响模型选择，但执行安全仍由 Runtime pipeline 保证。

## 测试要求

- 描述中出现 `ignore previous instructions` 被拒绝。
- 描述中出现 `always call this tool` 被拒绝或至少阻断进入 model-visible projection。
- input schema 字段描述中要求填入 token 被拒绝。
- projection builder 不读取 README。
- tools/list 输出使用 runtime-generated risk summary。
- projection hash 在 manifest description 修改后变化。

## 关联任务

- T210：description lint。
- T211：prompt-surface negative tests。
- T216：review checklist 接入 model-visible text。
- T217：tool result prompt-surface sanitizer 草案。
- T223：tool result sanitizer。
- T229：result sanitizer negative fixtures。
