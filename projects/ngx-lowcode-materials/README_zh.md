# ngx-lowcode-materials

基于 `ngx-tethys` 的内置物料子包。

## 职责

该包负责：

- 内置物料定义
- setter 元数据
- 默认节点工厂
- 面向 renderer 的物料组件

它负责默认页面搭建物料，不负责平台级状态管理。

## 命名上下文

- `ngx-puzzle` 保持既有 BI/canvas 产品名，不做改名。
- `ngx-lowcode` 保持页面式低代码工作区定位。
- 与 `ngx-puzzle` 的融合应通过 `ngx-lowcode-puzzle-adapter` 完成，而不是混合包名或合并品牌。

## 依赖规则

- 依赖 `ngx-lowcode-core`
- 必要时可使用 `ngx-lowcode-renderer` 的子渲染能力
- 不允许依赖 `ngx-lowcode-designer`

## 源码结构方向

`src/lib` 目标结构：

```text
components/
types/
utils/
common/
```

规则：

- 组件代码负责物料 UI
- 物料元数据必须强类型
- 通用视觉辅助能力进入 `common`

## 后续扩展

复杂 BI 物料不应通过直接耦合 `ngx-puzzle` 塞进这个包。

推荐放入独立适配包：

- `ngx-lowcode-puzzle-adapter`

## 构建

```bash
ng build ngx-lowcode-materials
ng test ngx-lowcode-materials
```
