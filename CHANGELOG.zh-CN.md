[English](CHANGELOG.md) | 中文文档

## [Unreleased]

- chore(aggregate): 将主包依赖基线重置为全部子包 `0.1.0` 初始版本。
- fix(release): 发布草稿中的子包版本改为展示目标发布版本（即将发布版本），不再显示源码当前版本。
- fix(release): 沙箱 apply 步骤改为按发布计划目标版本回写受影响子包版本后再执行构建与发布。
- chore(aggregate): 删除 `projects/ngx-lowcode` 下冗余的主包 changelog 与源码 `index.js`；发布时改为动态生成主包 dist 入口并复制根 changelog。
- fix(release): 主包依赖版本改为严格版本（去掉 `^`），并在 batch apply/finalize 回写时保持严格版本，避免主包拉到旧子包版本。
- fix(ci): `changelog gate` 对 `projects/ngx-lowcode` 的代码改动改为校验根级中英文 changelog，不再依赖子目录 changelog。
- feat(designer): 统一设计器属性面板业务表单的 `textarea` 为 ngx-tethys 输入控件（代码编辑区 `textarea` 继续保留）。
- fix(release): `finalize` 支持“仅主包发布成功”场景，且仅按 `publish-result.published[]` 归档与回写版本。
- fix(release): `finalize` 归档时同步写入根 changelog 的 Unreleased 内容与已发布子包清单，避免主包单发时根日志丢失。
- fix(changelog): 为所有子包新增 `CHANGELOG.zh-CN.md`，并对“子包代码改动”启用中英双 changelog 强制门禁。
- fix(release): 发布元数据与 finalize 改为中英文双通道，避免英文变更被写入中文 changelog。
- chore(format): 规范 changelog 与发布脚本格式，保持 CI 的 prettier 检查稳定通过。
- fix(release): 发布草稿改为仅英文展示，同时保持双语 finalize 与 changelog 维护不变。
- feat(release): 增加发版沙箱版本同步、按清单发布与发布结果制品；finalize 仅归档实际发布成功的包并回写 package 版本 PR。
- chore(release): 将聚合包 `@zhongmiao/ngx-lowcode` 版本提升到 `0.1.1`。
- fix(release): finalize 根级发布包清单改为使用 publish-result 中的实际发布版本号。
- fix(release): 当子包无 Unreleased 变更时，若根 `CHANGELOG.md` 有 Unreleased 仍允许生成草稿，避免错误跳过草稿更新。

## 0.1.0 (2026-04-16)

- chore(release): 新增 @zhongmiao/ngx-lowcode-\* npm 发版流水线。
- fix(ci): 重新生成 package-lock.json，修复 chokidar/readdirp 导致的 npm ci 失配。
- feat(release): 切换到 Changesets 子包独立版本与按变更发布模型。
- docs(changelog): 为 11 个子包补齐独立 changelog 基线。
- feat(release): 新增总包 `@zhongmiao/ngx-lowcode`，并强制非空 changeset 必须包含总包。
- feat(release): Draft 改为基于待发布 changeset 自动按子包分组汇总。
- chore(ci): 新增 `ci-watchdog` 工作流，确定性故障自动开 lockfile 修复 PR，非确定性故障自动建待排查 issue。
- fix(ci): 升级 actions 到 Node24 兼容版本，并强化 release 流程（监听 `release` 事件 + 本地 dist 路径发包）。

## 发布包清单

### @zhongmiao/ngx-lowcode-core@0.1.0

- Initial public scoped release under `@zhongmiao/*`.

### @zhongmiao/ngx-lowcode-core-types@0.1.0

- Initial public scoped release under `@zhongmiao/*`.

### @zhongmiao/ngx-lowcode-core-utils@0.1.0

- Initial public scoped release under `@zhongmiao/*`.

### @zhongmiao/ngx-lowcode-datasource@0.1.0

- Initial public scoped release under `@zhongmiao/*`.

### @zhongmiao/ngx-lowcode-designer@0.1.0

- Initial public scoped release under `@zhongmiao/*`.

### @zhongmiao/ngx-lowcode-i18n@0.1.0

- Initial public scoped release under `@zhongmiao/*`.

### @zhongmiao/ngx-lowcode-materials@0.1.0

- Initial public scoped release under `@zhongmiao/*`.

### @zhongmiao/ngx-lowcode-meta-model@0.1.0

- Initial public scoped release under `@zhongmiao/*`.

### @zhongmiao/ngx-lowcode-puzzle-adapter@0.1.0

- Initial public scoped release under `@zhongmiao/*`.

### @zhongmiao/ngx-lowcode-renderer@0.1.0

- Initial public scoped release under `@zhongmiao/*`.

### @zhongmiao/ngx-lowcode-testing@0.1.0

- Initial public scoped release under `@zhongmiao/*`.
