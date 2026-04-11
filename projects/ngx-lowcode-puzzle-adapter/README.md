# ngx-lowcode-puzzle-adapter

Optional bridge package between `ngx-lowcode` and `ngx-puzzle`.

## Responsibility

This package exists to integrate the established `ngx-puzzle` BI/canvas product into the `ngx-lowcode` page-oriented ecosystem without merging their identities or collapsing package boundaries.

It should own:

- puzzle-to-lowcode material mapping
- adapter contracts and providers
- wrapper components when needed
- future metadata normalization between puzzle widgets and lowcode materials

## Naming Context

- `ngx-puzzle` remains the existing BI/canvas product and is not being renamed.
- `ngx-lowcode` remains the page-oriented low-code workspace.
- This package is the official bridge point between them.

## Dependency Rules

- depends on `ngx-lowcode-core`
- may later depend on `ngx-puzzle`
- must not move puzzle-specific concerns into `ngx-lowcode-core`
- should stay optional for hosts that do not use BI/canvas capabilities

## Source Structure Direction

Target structure for `src/lib`:

```text
core/
adapters/
components/
interfaces/
types/
utils/
common/
```

## Build

```bash
ng build ngx-lowcode-puzzle-adapter
ng test ngx-lowcode-puzzle-adapter
```
