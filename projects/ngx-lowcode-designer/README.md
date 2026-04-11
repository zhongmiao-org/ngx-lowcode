# ngx-lowcode-designer

Embedded authoring UI package for host applications.

## Responsibility

This package owns:

- material panel
- canvas/stage shell
- outline tree
- property editor UI
- authoring commands such as save/preview/publish request

It should not become the owner of canonical document state contracts. Those boundaries belong in `ngx-lowcode-core`.

## Naming Context

- `ngx-puzzle` remains the existing BI/canvas product and is not being renamed.
- `ngx-lowcode` remains the page-oriented low-code workspace.
- Integration with `ngx-puzzle` should happen through `ngx-lowcode-puzzle-adapter`, not by merging package names.

## Dependency Rules

- depends on `ngx-lowcode-core`
- may depend on `ngx-lowcode-renderer`
- must not define new cross-package schema contracts by itself

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

UI components should consume typed document/editor state rather than mutating unrelated modules directly.

## Build

```bash
ng build ngx-lowcode-designer
ng test ngx-lowcode-designer
```
