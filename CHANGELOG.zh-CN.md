[English](CHANGELOG.md) | 中文文档

## [Unreleased]

- chore(release): 新增 @zhongmiao/ngx-lowcode-* npm 发版流水线。
- fix(ci): 重新生成 package-lock.json，修复 chokidar/readdirp 导致的 npm ci 失配。
- feat(release): 切换到 Changesets 子包独立版本与按变更发布模型。
- docs(changelog): 为 11 个子包补齐独立 changelog 基线。
- feat(release): 新增总包 `@zhongmiao/ngx-lowcode`，并强制非空 changeset 必须包含总包。
- feat(release): Draft 改为基于待发布 changeset 自动按子包分组汇总。
- chore(ci): 新增 `ci-watchdog` 工作流，确定性故障自动开 lockfile 修复 PR，非确定性故障自动建待排查 issue。
