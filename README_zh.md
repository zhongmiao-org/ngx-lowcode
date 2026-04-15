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
- `demo`
  用于验证宿主接入方式的演示应用。

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
npm start
```

## 与 `meta-lc-bff` 的演示联调

根目录 `src` 下的 demo 已接入 BFF `/query`，并支持租户切换演示。

- 默认 BFF 地址：`http://localhost:3000/query`
- 运行时覆盖方式：
  - 应用启动前设置 `window.__LC_BFF_URL__ = "http://<host>:3000"`
  - 或在 datasource `request.url` 中写绝对地址

演示建议路径：

1. 启动 `meta-lc-bff` 与 PostgreSQL/Redis。
2. 打开 demo，在 `Tenant A` 与 `Tenant B` 间切换。
3. 通过 action 按钮触发订单查询。
4. 验证 table 回填结果按租户隔离，且仅在 BFF 不可用时才回落 mock 数据。

## 构建目标

```bash
ng build ngx-lowcode-core
ng build ngx-lowcode-renderer
ng build ngx-lowcode-materials
ng build ngx-lowcode-designer
ng build ngx-lowcode-testing
ng build ngx-lowcode-puzzle-adapter
ng build demo
```

## 发布方向

当前内部是多包结构，推荐的对外发布形态是：

- 默认安装入口：`ngx-lowcode`
- 高级按需入口：`ngx-lowcode-core`、`ngx-lowcode-renderer`、`ngx-lowcode-designer`、`ngx-lowcode-materials`
- 可选适配包：`ngx-lowcode-puzzle-adapter`

聚合包负责对外暴露稳定 API，内部仍保持明确的职责边界。
