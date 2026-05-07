# Registry 指南

OpenCap Registry 使用 Git-based 模式。开发者通过 Pull Request 提交 Capability，CI 负责校验 manifest 和测试样例。

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

## 条目要求

每个 Registry 条目必须包含：

- `manifest.yml`
- `README.md`
- `tests/` 下至少一个测试
- 明确权限声明
- 风险等级
- 维护者信息
- 许可证信息

## 评审清单

评审者应检查：

- manifest 是否合法
- 描述是否匹配真实执行行为
- 权限是否过宽
- 风险等级是否诚实
- 外部端点是否清楚声明
- 测试是否覆盖至少一个成功调用
- README 是否说明配置和预期结果

## 信任等级

| 等级 | 含义 |
| --- | --- |
| `experimental` | 实验性条目，未做深度评审。 |
| `listed` | schema 合法并被接受进入 registry。 |
| `tested` | 有测试并通过 CI 或 mock validation。 |
| `verified` | 维护者身份或服务所有权已验证。 |
| `official` | 由 OpenCap 核心团队维护。 |

## 安装

V1 预期安装方式：

```bash
opencap install github.create_issue
```

CLI 应解析 registry 条目，把 manifest 或完整 Capability 目录复制到本地状态目录，并让 Runtime 可以加载。
