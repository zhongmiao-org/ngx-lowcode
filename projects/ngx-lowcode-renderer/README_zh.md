# ngx-lowcode-renderer

根据 `PageSchema` 渲染运行时页面的子包。

## 职责

该包负责：

- schema 驱动渲染
- runtime context 消费
- 动态节点渲染
- action / datasource 执行入口

它必须能够在不引入 designer 的情况下独立被宿主使用。

## 命名上下文

- `ngx-puzzle` 保持既有 BI/canvas 产品名，不做改名。
- `ngx-lowcode` 保持页面式低代码工作区定位。
- 与 `ngx-puzzle` 的融合应通过 `ngx-lowcode-puzzle-adapter` 完成，而不是混合包名或合并品牌。

## 依赖规则

- 依赖 `ngx-lowcode-core`
- 不允许依赖 `ngx-lowcode-designer`
- 可被 `ngx-lowcode-materials` 使用

## 源码结构方向

`src/lib` 目标结构：

```text
core/
components/
interfaces/
types/
utils/
common/
```

规则：

- `components` 负责渲染
- `core` 负责运行时协调
- `utils` 保持纯函数

## 构建

```bash
ng build ngx-lowcode-renderer
ng test ngx-lowcode-renderer
```
