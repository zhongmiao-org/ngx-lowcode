[English](CHANGELOG.md) | 中文文档

## [Unreleased]

- feat(local-dev): 新增 watch 命令，用于宿主应用本地联调时刷新 ngx-lowcode dist 产物。

## 0.2.0 (2026-04-21)

- feat(runtime): 收紧 datasource/websocket manager 契约，新增结构化执行 envelope、renderer 侧结果归一化，以及稳定的运行时可观测状态。
- feat(runtime): renderer 消费 runtime manager WebSocket 更新事件，并触发 manager-first refresh/action 流程。
- feat(runtime): 新增 runtime WebSocket replay cursor 订阅支持。

## 发布包清单

### @zhongmiao/ngx-lowcode-core@0.2.0

- feat(runtime): 默认 datasource manager 改为输出结构化成功 envelope，同时保持 websocket manager 为稳定的 no-op 契约实现。
- feat(runtime): 从 core 包重新导出 runtime manager WebSocket 更新事件类型。
- feat(runtime): 重新导出 runtime WebSocket replay cursor 订阅契约。

### @zhongmiao/ngx-lowcode-core-types@0.2.0

- feat(runtime): 新增 datasource 执行结果 envelope 类型，并放宽 datasource manager 返回契约以承载结构化可观测元数据。
- feat(runtime): 新增与 platform 契约兼容的 runtime manager WebSocket 更新事件类型。
- feat(runtime): 新增 WebSocket replay cursor 事件与订阅选项契约。

### @zhongmiao/ngx-lowcode-core-utils@0.2.0

- chore(release): 在本次联动发布中将 @zhongmiao/ngx-lowcode-core-types 的 peerDependencies 对齐到 0.2.0。

### @zhongmiao/ngx-lowcode-datasource@0.2.0

- chore(release): 在本次联动发布中将 @zhongmiao/ngx-lowcode-core-types 的 peerDependencies 对齐到 0.2.0。

### @zhongmiao/ngx-lowcode-designer@0.2.0

- chore(release): 在本次联动发布中将 @zhongmiao/ngx-lowcode-core、@zhongmiao/ngx-lowcode-core-types、@zhongmiao/ngx-lowcode-renderer 的 peerDependencies 对齐到 0.2.0。

### @zhongmiao/ngx-lowcode-materials@0.2.0

- chore(release): 在本次联动发布中将 @zhongmiao/ngx-lowcode-core、@zhongmiao/ngx-lowcode-core-types、@zhongmiao/ngx-lowcode-renderer 的 peerDependencies 对齐到 0.2.0。

### @zhongmiao/ngx-lowcode-meta-model@0.2.0

- chore(release): 在本次联动发布中将 @zhongmiao/ngx-lowcode-core-types 的 peerDependencies 对齐到 0.2.0。

### @zhongmiao/ngx-lowcode-puzzle-adapter@0.2.0

- chore(release): 在本次联动发布中将 @zhongmiao/ngx-lowcode-core、@zhongmiao/ngx-lowcode-core-types 的 peerDependencies 对齐到 0.2.0。

### @zhongmiao/ngx-lowcode-renderer@0.2.0

- feat(runtime): renderer 新增 datasource 结果归一化与 `__runtimeExecution`，失败时保留旧表格数据，并吞掉 websocket 生命周期异常。
- feat(runtime): renderer 消费 runtime manager WebSocket 更新事件，并应用 patch、datasource 与 action 更新。
- feat(runtime): renderer 记录 runtime WebSocket replay cursor，并在后续订阅中携带。

### @zhongmiao/ngx-lowcode-testing@0.2.0

- chore(release): 在本次联动发布中将 @zhongmiao/ngx-lowcode-core、@zhongmiao/ngx-lowcode-core-types 的 peerDependencies 对齐到 0.2.0。

## 0.1.4 (2026-04-18)

- fix(ci): watchdog 取消定时轮询，仅在 CI(main) 失败或手动触发时运行。
- fix(ci): watchdog 创建待排查 issue 时支持 `ci` label 缺失场景，不再因此失败。
- feat(ci): watchdog 新增失败 job/step 摘要，并在已有待排查 issue 下追加最新失败记录评论。
- chore(repo): 平台演示应用已从 `ngx-lowcode/src` 迁移到独立仓库 `meta-weave`。
- chore(repo): 删除本仓 `demo` 应用目标与配置，`ngx-lowcode` 回归 `projects/*` 基础库定位。
- docs(repo): README/README_zh 联调入口改为 `meta-weave`，不再使用 `ngx-lowcode/src`。
- feat(runtime): demo manager 注入切换为 `@zhongmiao/meta-lc-runtime-angular` 包引用实现（直接替换）。
- feat(runtime): 通过 runtime adapter 的 `onExecution` 回调迁移执行状态面板，保留 request-id/status/rowCount/message 可观测性。

## 发布包清单

### @zhongmiao/ngx-lowcode-designer@0.1.4

- refactor: 将设计器内嵌的 Tabler icon font CSS 改为库内 SVG 图标渲染，发包产物不再内联 base64 字体资源。
- fix: 移除设计器包内联 `tabler-icons` 字体样式在 Angular 21/Vite 下导致的 bootstrap 卡死与页面白屏问题。

## 0.1.3 (2026-04-17)

- chore(release): 将主包 `@zhongmiao/ngx-lowcode` 版本提升到 `0.1.3`。
- fix(release): 子包发布清单改为仅保留“沙箱会改版本”的候选（相对基线 tag 有变更且 `sourceVersion != targetVersion`），避免误发全量子包。
- fix(release): `release:draft-notes:json` 增加清单统计字段（`candidateCount`、`selectedCount`、`skippedAlreadyAtTargetCount`）。
- feat(release): 新增递归依赖联动清单（`directPackages` + `cascadePackages`），被依赖子包会自动纳入同批次发布。
- feat(release): 根据发布清单自动回写严格版本的 peerDependencies 与主包 dependencies，并为联动包自动补齐中英文 changelog 模板。

## 发布包清单

### @zhongmiao/ngx-lowcode-core@0.1.3

- 测试升级到 0.1.3

### @zhongmiao/ngx-lowcode-designer@0.1.3

- chore(release): 在本次联动发布中将 @zhongmiao/ngx-lowcode-core 的 peerDependencies 对齐到 0.1.3。

### @zhongmiao/ngx-lowcode-materials@0.1.3

- chore(release): 在本次联动发布中将 @zhongmiao/ngx-lowcode-core 的 peerDependencies 对齐到 0.1.3。

### @zhongmiao/ngx-lowcode-puzzle-adapter@0.1.3

- chore(release): 在本次联动发布中将 @zhongmiao/ngx-lowcode-core 的 peerDependencies 对齐到 0.1.3。

### @zhongmiao/ngx-lowcode-renderer@0.1.3

- chore(release): 在本次联动发布中将 @zhongmiao/ngx-lowcode-core 的 peerDependencies 对齐到 0.1.3。

### @zhongmiao/ngx-lowcode-testing@0.1.3

- chore(release): 在本次联动发布中将 @zhongmiao/ngx-lowcode-core 的 peerDependencies 对齐到 0.1.3。

## 0.1.2 (2026-04-17)

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

## 发布包清单

### @zhongmiao/ngx-lowcode-designer@0.1.2

- 统一设计器属性面板业务表单 `textarea` 的 ngx-tethys 输入样式，代码编辑区 `textarea` 保持不变。

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
