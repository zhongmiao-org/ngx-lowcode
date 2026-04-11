# ngx-lowcode-renderer

Runtime rendering package for turning `PageSchema` into Angular UI.

## Responsibility

This package owns:

- schema-driven rendering
- runtime context consumption
- dynamic node rendering
- runtime action and datasource execution entry points

It must stay usable without the designer package.

## Naming Context

- `ngx-puzzle` remains the existing BI/canvas product and is not being renamed.
- `ngx-lowcode` remains the page-oriented low-code workspace.
- Integration with `ngx-puzzle` should happen through `ngx-lowcode-puzzle-adapter`, not by merging package names.

## Dependency Rules

- depends on `ngx-lowcode-core`
- must not depend on `ngx-lowcode-designer`
- may be consumed by `ngx-lowcode-materials`

## Source Structure Direction

Target structure for `src/lib`:

```text
core/
components/
interfaces/
types/
utils/
common/
```

Rules:

- components render
- core coordinates runtime behavior
- utils stay pure

## Build

```bash
ng build ngx-lowcode-renderer
ng test ngx-lowcode-renderer
```
