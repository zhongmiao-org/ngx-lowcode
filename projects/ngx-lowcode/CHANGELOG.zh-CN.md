# Changelog

[English](CHANGELOG.md) | 中文文档

## [Unreleased]

- 将聚合包版本提升到 `0.1.2`，作为本批次发版版本源。
- 发布归档 `finalize` 支持“仅主包发布成功”场景，并仅回写实际发布成功的子包版本与依赖。
- ngx-lowcode 聚合包的首个发布版本。
- 将聚合包版本提升到 `0.1.1`，作为本批次发版版本源。
- 发布流程调整为：沙箱同步改动子包版本、仅发布清单包、发布后通过 finalize PR 回写实际发布版本与归档 changelog。
