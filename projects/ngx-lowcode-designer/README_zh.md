# ngx-lowcode-designer

可嵌入宿主系统的低代码设计器子包。

## 职责

该包负责：

- 物料面板
- 画布 / 舞台壳
- 图层树
- 属性编辑 UI
- save / preview / publish request 等命令触发

它不应该成为跨包公共文档状态协议的定义者；这些边界应统一收敛到 `ngx-lowcode-core`。

## 命名上下文

- `ngx-puzzle` 保持既有 BI/canvas 产品名，不做改名。
- `ngx-lowcode` 保持页面式低代码工作区定位。
- 与 `ngx-puzzle` 的融合应通过 `ngx-lowcode-puzzle-adapter` 完成，而不是混合包名或合并品牌。

## 依赖规则

- 依赖 `ngx-lowcode-core`
- 可依赖 `ngx-lowcode-renderer`
- 不应自行定义新的跨包 schema 契约

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

UI 组件应消费类型化状态，而不是相互直接修改彼此模块。

## 构建

```bash
ng build ngx-lowcode-designer
ng test ngx-lowcode-designer
```
