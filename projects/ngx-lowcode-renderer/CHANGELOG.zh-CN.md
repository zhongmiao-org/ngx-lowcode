# Changelog

[English](CHANGELOG.md) | 中文文档

## [Unreleased]

## 0.2.0 (2026-04-21)

- feat(runtime): renderer 新增 datasource 结果归一化与 `__runtimeExecution`，失败时保留旧表格数据，并吞掉 websocket 生命周期异常。
- feat(runtime): renderer 消费 runtime manager WebSocket 更新事件，并应用 patch、datasource 与 action 更新。
- feat(runtime): renderer 记录 runtime WebSocket replay cursor，并在后续订阅中携带。

## 0.1.3 (2026-04-17)

- chore(release): 在本次联动发布中将 @zhongmiao/ngx-lowcode-core 的 peerDependencies 对齐到 0.1.3。

## 0.1.0 (2026-04-16)

- 首个 `@zhongmiao/*` 作用域公开版本。
