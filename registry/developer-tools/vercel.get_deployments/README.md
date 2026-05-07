# vercel.get_deployments

列出某个 Vercel 项目的近期 deployments。

## 风险

`read_only`

该 Capability 只读取 deployment metadata，不改变外部状态。

## 认证

设置：

```bash
VERCEL_TOKEN=...
```

## 输入示例

```json
{
  "project_id": "prj_123",
  "limit": 5
}
```
