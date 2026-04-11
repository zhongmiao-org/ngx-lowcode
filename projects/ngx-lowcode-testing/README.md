# ngx-lowcode-testing

Testing support package for hosts and package-level validation.

## Responsibility

This package owns:

- mock schemas
- mock executors
- future testing fixtures
- integration helpers for host apps

It must remain non-production-oriented.

## Naming Context

- `ngx-puzzle` remains the existing BI/canvas product and is not being renamed.
- `ngx-lowcode` remains the page-oriented low-code workspace.
- Integration with `ngx-puzzle` should happen through `ngx-lowcode-puzzle-adapter`, not by merging package names.

## Dependency Rules

- depends on `ngx-lowcode-core`
- should not accumulate runtime-only behavior

## Source Structure Direction

Target structure for `src/lib`:

```text
mocks/
utils/
types/
```

## Build

```bash
ng build ngx-lowcode-testing
ng test ngx-lowcode-testing
```
