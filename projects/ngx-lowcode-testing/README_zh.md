# ngx-lowcode-testing

用于宿主接入和包级验证的测试辅助包。

## 职责

该包负责：

- mock schema
- mock executors
- 后续测试夹具
- 宿主集成辅助能力

它必须保持“非运行时代码”定位。

## 命名上下文

- `ngx-puzzle` 保持既有 BI/canvas 产品名，不做改名。
- `ngx-lowcode` 保持页面式低代码工作区定位。
- 与 `ngx-puzzle` 的融合应通过 `ngx-lowcode-puzzle-adapter` 完成，而不是混合包名或合并品牌。

## 依赖规则

- 依赖 `ngx-lowcode-core`
- 不应承载真正运行时逻辑

## 源码结构方向

`src/lib` 目标结构：

```text
mocks/
utils/
types/
```

## 构建

```bash
ng build ngx-lowcode-testing
ng test ngx-lowcode-testing
```
