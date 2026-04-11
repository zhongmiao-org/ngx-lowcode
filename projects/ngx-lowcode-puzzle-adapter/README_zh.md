# ngx-lowcode-puzzle-adapter

`ngx-lowcode` 与 `ngx-puzzle` 之间的可选桥接包。

## 职责

这个包的存在意义，是在不合并品牌、不打平包边界的前提下，把已有的 `ngx-puzzle` BI/画布能力接入 `ngx-lowcode` 页面式低代码体系。

它应负责：

- puzzle 到 lowcode 的物料映射
- adapter 契约与 provider
- 必要时的包装组件
- 后续 puzzle widget 与 lowcode material 间的元数据归一化

## 命名上下文

- `ngx-puzzle` 保持既有 BI/canvas 产品名，不做改名。
- `ngx-lowcode` 保持页面式低代码工作区定位。
- 这个包是两者之间的官方桥接点。

## 依赖规则

- 依赖 `ngx-lowcode-core`
- 后续可依赖 `ngx-puzzle`
- 不允许把 puzzle 特有逻辑回灌进 `ngx-lowcode-core`
- 对不使用 BI/画布能力的宿主来说，这个包必须保持可选

## 源码结构方向

`src/lib` 目标结构：

```text
core/
adapters/
components/
interfaces/
types/
utils/
common/
```

## 构建

```bash
ng build ngx-lowcode-puzzle-adapter
ng test ngx-lowcode-puzzle-adapter
```
