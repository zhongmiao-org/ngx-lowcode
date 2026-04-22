# ngx-lowcode

`ngx-lowcode` 是一个以组件库为中心的 Angular 低代码工作区，聚焦“页面式低代码”而不是平台型后台应用。

这个仓库虽然内部采用 `monorepo + 多个可发布子包` 的方式组织，但对外长期建议提供一个聚合入口包，保证使用体验简单、内部边界清晰。

## 仓库包含内容

- `ngx-lowcode-core`
  共享协议、注册中心、provider、状态边界与核心工具。
- `ngx-lowcode-renderer`
  根据 `PageSchema` 渲染运行时页面。
- `ngx-lowcode-designer`
  可嵌入宿主系统的低代码设计器。
- `ngx-lowcode-materials`
  基于 `ngx-tethys` 的内置物料。
- `ngx-lowcode-testing`
  mock schema、mock executor 和测试辅助能力。
- `ngx-lowcode-puzzle-adapter`
  用于把 `ngx-puzzle` 接入 low-code 体系的可选桥接包。
- `src`
  用于 renderer、designer、materials 本地开发的源码直连 demo 应用。
- `meta-weave`（独立仓库）
  用于完整平台应用与跨仓联调的宿主应用。

## 命名决策

- `ngx-puzzle` 保持既有 BI/dashboard/canvas 品牌，不做改名。
- `ngx-lowcode` 保持“页面式低代码组件库工作区”的定位。
- 两者的融合通过 `ngx-lowcode-puzzle-adapter` 完成，而不是通过把项目重命名或强行合并品牌。

## 核心原则

- `core` 是跨包协议和状态边界的唯一来源。
- `designer`、`renderer`、`materials` 之间不直接耦合通信，统一通过 `core` 协议协作。
- 低代码文档的唯一事实来源是 `PageSchema + EditorState`。
- 仓库结构要为未来聚合发布做准备，但不能因此打平内部职责边界。

## 长期维护文档

- [共享工作区入口](../README.md)
- [共享文档导航](../docs/docs-map_zh.md)
- [工作区说明](../docs/workspace-guide_zh.md)
- [开发执行手册](../docs/development-playbook_zh.md)
- [架构说明](../docs/architecture_zh.md)
- [源码目录规范](../docs/source-structure_zh.md)
- [实施推进顺序与交接上下文](../docs/implementation-roadmap_zh.md)

这些文档共同构成当前可直接开发的基线，明确了：

- 共享工作区路径与项目布局
- 日常开发流程与最小完成标准
- 每个子包的职责
- 包之间允许的依赖方向
- `src/lib` 的严格分层方式
- 状态管理建议
- `ngx-puzzle` 的融合策略

## 开发命令

```bash
npm install
npm run build
npm test
```

## 本地 Demo 应用

根目录 `src` 是最小本地 demo 宿主。它通过 `tsconfig.app.json` 将包导入映射到
`projects/*/src`，因此库源码变更可以被 demo watcher 直接响应。

```bash
npm run start:demo:offline
npm run start:demo:online
npm run build:demo:offline
npm run build:demo:online
```

完整平台应用与跨仓联调仍使用 `meta-weave`。

## 构建目标

```bash
ng build ngx-lowcode-core
ng build ngx-lowcode-renderer
ng build ngx-lowcode-materials
ng build ngx-lowcode-designer
ng build ngx-lowcode-testing
ng build ngx-lowcode-puzzle-adapter
```

## 发布方向

当前内部是多包结构，对外 npm scope 固定为 `@zhongmiao/*`。

- 核心链路包：
  - `@zhongmiao/ngx-lowcode-core-types`
  - `@zhongmiao/ngx-lowcode-i18n`
  - `@zhongmiao/ngx-lowcode-core-utils`
  - `@zhongmiao/ngx-lowcode-meta-model`
  - `@zhongmiao/ngx-lowcode-datasource`
  - `@zhongmiao/ngx-lowcode-core`
- 运行与设计包：
  - `@zhongmiao/ngx-lowcode-renderer`
  - `@zhongmiao/ngx-lowcode-materials`
  - `@zhongmiao/ngx-lowcode-designer`
- 支撑包：
  - `@zhongmiao/ngx-lowcode-testing`
  - `@zhongmiao/ngx-lowcode-puzzle-adapter`
- 总包：
  - `@zhongmiao/ngx-lowcode`（统一安装入口与发布汇总追踪）

## 发布流程

- CI：`.github/workflows/ci.yml` 在 PR 执行 lint/test/build + changelog gate。
- Changesets 主发布：`.github/workflows/release-changesets.yml` 在 `main` 执行，存在 changeset 时自动开版本 PR，合并后发布有改动的子包。
- 总包联动规则：任何非空 changeset 都必须包含 `@zhongmiao/ngx-lowcode`，保证子包发布时总包同步升版。
- Draft 汇总：`.github/workflows/release-draft.yml` 从待发布 `.changeset/*.md` 自动组装，按包分组展示本次变更。
- Legacy 发布链：`.github/workflows/release-publish.yml` 仅保留为 fallback，默认关闭。
- 代码改动时必须更新 `.changeset/*.md` 或对应子包 `projects/*/CHANGELOG.md`。
- CI 看护：`.github/workflows/ci-watchdog.yml` 监听 `main` 失败，命中确定性问题自动开修复 PR，否则自动建待排查 issue。

发布前置条件：

- 仓库或组织已配置 `NPM_TOKEN`
- `npm ci` 后 lockfile 无漂移（CI 已强制检查）
- 构建产物就绪（workflow 执行 `npm run build:libs`）
