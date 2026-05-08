# ADR 0037：Quality Score 不能绕过风险

日期：2026-05-08

状态：已接受

## 背景

质量评分有助于发现成熟能力，但分数容易被误解为“安全”。一个高质量金融能力仍然可能需要人工确认。

## 决策

Quality Score 只能作为解释性指标。它不能改变 risk、policy、consent、secret、audit 语义，也不能作为商业排序的唯一依据。

## 影响

- `quality_score` 可以进入 Trust Card。
- policy DSL 不能因为分数高而默认 allow destructive/financial/external_send。
- revoked 状态优先于历史质量分。
