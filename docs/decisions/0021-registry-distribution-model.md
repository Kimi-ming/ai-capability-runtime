# 架构决策 0021：注册表 分发模型

日期：2026-05-07

状态：已接受

## 背景

Registry 既要易贡献，又要可验证。过早做远程市场会增加供应链风险。

## 决策

V1 使用 Git-based Registry，本地 install 默认从 checkout 的 `registry/` 读取。远程索引、镜像、OCI artifact、签名分发放到 V1 后。

## 影响

- `opencap install` V1 不做远程下载。
- 安装行为可追溯到 Git commit。
- 未来 registry index 只是发现加速，不替代 manifest 原文。
