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

## 与 `meta-lc-platform` 的演示联调

根目录 `src` 下的 demo 已接入 BFF `/query + /mutation`，并支持租户切换演示。

- 默认 BFF 地址：`http://localhost:6000/query`
- 运行时覆盖方式：
  - 应用启动前设置 `window.__LC_BFF_URL__ = "http://<host>:6000"`
  - 或在 datasource `request.url` 中写绝对地址

演示建议路径：

1. 启动 `meta-lc-platform/apps/bff-server` 与 PostgreSQL/Redis。
2. 打开 demo，在 `Tenant A` 与 `Tenant B` 间切换。
3. 在 `Query Filters` 中触发查询（`Search` 或 `status/channel/priority` 变更自动触发），验证 table 回填。
4. 在 `Order CRUD Editor` 中执行完整 CRUD：
   - Create：填写 `formOrderId/formOwner/formChannel/formPriority/formStatus`（可选 `form_org_id`）后点 `Create`
   - Update：点击 table 行回填编辑器后修改字段并点 `Update`
   - Delete：选择行或输入 `formOrderId` 后点 `Delete`
5. 验证控件联动：
   - table 行点击触发 `selectedOrderId + 表单字段` 回填
   - `status/channel/priority` 变更触发联动查询
6. 在预览区记录 `request-id`，并验证租户隔离与 CRUD 结果。
7. 仅在 BFF 不可用（如 `status=0/502/503/504`）时回落 mock 数据；其他错误保持错误语义。
8. 使用以下 SQL 对照审计落盘：

```sql
SELECT request_id, tenant_id, status, row_count, error_message, created_at
FROM bff_query_audit_logs
WHERE request_id = '<demo-request-id>'
ORDER BY id DESC;
```

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

## 发布流程

- CI：`.github/workflows/ci.yml` 在 PR 执行 lint/test/build + changelog gate。
- Changesets 主发布：`.github/workflows/release-changesets.yml` 在 `main` 执行，存在 changeset 时自动开版本 PR，合并后仅发布有改动的子包。
- Legacy 草稿（过渡兜底）：`.github/workflows/release-draft.yml` + `.github/workflows/release-publish.yml` 保留但默认关闭。
- 空窗期：若 `## [Unreleased]` 为空，Draft 流程成功跳过，不再报红。
- 代码改动时必须更新 `.changeset/*.md` 或对应子包 `CHANGELOG.md`。

发布前置条件：

- 仓库或组织已配置 `NPM_TOKEN`
- `npm ci` 后 lockfile 无漂移（CI 已强制检查）
- 构建产物就绪（workflow 执行 `npm run build:libs`）
