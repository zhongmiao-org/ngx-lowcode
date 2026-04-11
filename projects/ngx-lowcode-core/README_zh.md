# ngx-lowcode-core

低代码共享协议与状态边界的核心包。

## 职责

`ngx-lowcode-core` 负责稳定内核：

- schema 与节点协议
- action / datasource 协议
- 物料注册中心
- providers
- 公共工具函数
- 扩展接口
- 当前的 editor store、command 与 history/future 状态模型

这个包是跨子包通信边界的唯一可信来源。

当前开发主线不是“未来再引入 store”，而是在现有 `NgxLowcodeEditorStore` 基础上继续补强 command 语义、撤销重做体验和选择态收敛。

## 命名上下文

- `ngx-puzzle` 保持既有 BI/canvas 产品名，不做改名。
- `ngx-lowcode` 保持页面式低代码工作区定位。
- 与 `ngx-puzzle` 的融合应通过 `ngx-lowcode-puzzle-adapter` 完成，而不是混合包名或合并品牌。

## 依赖规则

- 不允许依赖 `designer`
- 不允许依赖 `renderer`
- 不允许依赖 `materials`
- 不允许依赖 `ngx-puzzle`

如果其他包需要共享抽象，这个抽象应进入这里。

## 源码结构方向

`src/lib` 目标结构：

```text
core/
interfaces/
types/
utils/
common/
```

类型规则：

- 公共 API 避免 `any`
- 优先使用 `unknown` 缩窄
- 契约要显式、可判别

## 构建

```bash
ng build ngx-lowcode-core
ng test ngx-lowcode-core
```
