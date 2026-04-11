# ngx-lowcode-core

Kernel package for shared low-code contracts and state boundaries.

## Responsibility

`ngx-lowcode-core` owns the stable foundation:

- schema and node contracts
- action and datasource contracts
- material registry
- providers
- shared utilities
- extension interfaces
- the current editor store, command model, and history/future state

This package is the source of truth for package-to-package communication boundaries.

The current roadmap is not to introduce a store later, but to strengthen the existing `NgxLowcodeEditorStore` behavior and keep editor mutations converged on typed commands.

## Naming Context

- `ngx-puzzle` remains the existing BI/canvas product and is not being renamed.
- `ngx-lowcode` remains the page-oriented low-code workspace.
- Integration with `ngx-puzzle` should happen through `ngx-lowcode-puzzle-adapter`, not by merging package names.

## Dependency Rules

- may not depend on `designer`
- may not depend on `renderer`
- may not depend on `materials`
- may not depend on `ngx-puzzle`

If another package needs a new shared concept, that concept belongs here.

## Source Structure Direction

Target structure for `src/lib`:

```text
core/
interfaces/
types/
utils/
common/
```

Type strictness is required:

- avoid `any` on public API
- prefer `unknown` plus narrowing
- keep contracts discriminated and explicit

## Build

```bash
ng build ngx-lowcode-core
ng test ngx-lowcode-core
```
