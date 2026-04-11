# ngx-lowcode-materials

Built-in material package implemented with `ngx-tethys`.

## Responsibility

This package owns:

- built-in material definitions
- setter metadata
- default node factories
- renderer-facing material components

It should provide default page-building materials, not platform-wide state management.

## Naming Context

- `ngx-puzzle` remains the existing BI/canvas product and is not being renamed.
- `ngx-lowcode` remains the page-oriented low-code workspace.
- Integration with `ngx-puzzle` should happen through `ngx-lowcode-puzzle-adapter`, not by merging package names.

## Dependency Rules

- depends on `ngx-lowcode-core`
- may use `ngx-lowcode-renderer` child rendering primitives
- must not depend on `ngx-lowcode-designer`

## Source Structure Direction

Target structure for `src/lib`:

```text
components/
types/
utils/
common/
```

Rules:

- component code renders material UI
- material metadata stays typed
- shared visual helpers go to `common`

## Future Extension

Complex BI materials should not be added here by coupling directly to `ngx-puzzle`.

That work should live in a dedicated adapter package:

- `ngx-lowcode-puzzle-adapter`

## Build

```bash
ng build ngx-lowcode-materials
ng test ngx-lowcode-materials
```
