# Changelog

## [Unreleased]

- test(vitest): migrate package tests from Karma/Jasmine to Angular unit-test with Vitest.

## 0.2.0 (2026-04-21)

- feat(runtime): normalize datasource execution results in renderer, expose `__runtimeExecution`, preserve stale table data on failures, and absorb websocket lifecycle errors.
- feat(runtime): consume runtime manager WebSocket update events and apply patch/datasource/action updates through the renderer.
- feat(runtime): store runtime WebSocket replay cursors and pass them to later subscriptions.

## 0.1.3 (2026-04-17)

- chore(release): align peerDependencies for @zhongmiao/ngx-lowcode-core to 0.1.3 in release cascade.

## 0.1.0 (2026-04-16)

- Initial public scoped release under `@zhongmiao/*`.
