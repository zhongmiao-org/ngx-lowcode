# Changelog

[English](CHANGELOG.md) | 中文文档

## [Unreleased]

- test(runtime): 断言 designer 向 renderer 传递 design mode，不再测试第三方 tab 内部实现。
- test(vitest): 将包测试从 Karma/Jasmine 迁移到 Angular unit-test 与 Vitest。

## 0.2.0 (2026-04-21)

- chore(release): 在本次联动发布中将 @zhongmiao/ngx-lowcode-core、@zhongmiao/ngx-lowcode-core-types、@zhongmiao/ngx-lowcode-renderer 的 peerDependencies 对齐到 0.2.0。

## 0.1.4 (2026-04-18)

- refactor: 将设计器内嵌的 Tabler icon font CSS 改为库内 SVG 图标渲染，发包产物不再内联 base64 字体资源。
- fix: 移除设计器包内联 `tabler-icons` 字体样式在 Angular 21/Vite 下导致的 bootstrap 卡死与页面白屏问题。

## 0.1.3 (2026-04-17)

- chore(release): 在本次联动发布中将 @zhongmiao/ngx-lowcode-core 的 peerDependencies 对齐到 0.1.3。

## 0.1.2 (2026-04-17)

- 统一设计器属性面板业务表单 `textarea` 的 ngx-tethys 输入样式，代码编辑区 `textarea` 保持不变。

## 0.1.0 (2026-04-16)

- 首个 `@zhongmiao/*` 作用域公开版本。
