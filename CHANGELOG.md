English | [中文文档](CHANGELOG.zh-CN.md)

## [Unreleased]

- chore(release): introduce npm release pipeline for @zhongmiao/ngx-lowcode-\* packages.
- fix(ci): regenerate package-lock.json to resolve npm ci mismatch for chokidar/readdirp.
- feat(release): adopt changesets-based independent package versioning and publishing.
- docs(changelog): add per-package changelog baselines for all 11 libraries.
- feat(release): add aggregate package `@zhongmiao/ngx-lowcode` and enforce aggregate-included changesets policy.
- feat(release): compose release draft notes from pending changesets with per-package grouping.
- chore(ci): add `ci-watchdog` workflow for automatic lockfile-fix PRs and fallback triage issue creation.
