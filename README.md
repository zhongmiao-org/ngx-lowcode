# ngx-lowcode

`ngx-lowcode` is a library-first Angular workspace for page-oriented low-code building.

This repository is intentionally organized as a `monorepo with multiple publishable packages`, but the long-term public experience should prefer a single aggregate entry package plus optional advanced sub-packages.

## What This Repo Contains

- `ngx-lowcode-core`
  Shared contracts, editor store direction, registry, providers, and core utilities.
- `ngx-lowcode-renderer`
  Runtime renderer that turns `PageSchema` into Angular UI.
- `ngx-lowcode-designer`
  Embedded designer shell for host applications.
- `ngx-lowcode-materials`
  Built-in page materials implemented with `ngx-tethys`.
- `ngx-lowcode-testing`
  Mock schema, mock executors, and test helpers for host integration.
- `ngx-lowcode-puzzle-adapter`
  Optional bridge package for integrating `ngx-puzzle` into the low-code ecosystem.
- `demo`
  Host demo application used to validate library integration.

## Naming Decision

- `ngx-puzzle` remains the established BI/dashboard/canvas brand and must not be renamed.
- `ngx-lowcode` remains the page-oriented low-code library workspace.
- Integration between the two products should happen through `ngx-lowcode-puzzle-adapter`, not by collapsing them into one renamed package.

## Key Principles

- `core` is the only package allowed to define shared contracts and state boundaries.
- `designer`, `renderer`, and `materials` communicate through `core` contracts, not by directly calling each other.
- Low-code document changes must converge on a single source of truth: `PageSchema` plus editor/document state.
- The repo should stay ready for future aggregate publishing without collapsing internal boundaries.

## Long-Term Docs

- [Workspace Entry](../README.md)
- [Shared Docs Map](../docs/docs-map_zh.md)
- [Workspace Guide](../docs/workspace-guide_zh.md)
- [Development Playbook](../docs/development-playbook_zh.md)
- [Architecture Guide](../docs/architecture.md)
- [Source Structure Guide](../docs/source-structure.md)
- [Implementation Roadmap](../docs/implementation-roadmap_zh.md)

These docs together are the current source of truth for:

- workspace layout and project paths
- day-to-day development flow and readiness checks
- package responsibilities
- dependency direction
- strict source folder conventions
- state management direction
- `ngx-puzzle` integration strategy

## Development

```bash
npm install
npm run build
npm test
npm start
```

## Build Targets

```bash
ng build ngx-lowcode-core
ng build ngx-lowcode-renderer
ng build ngx-lowcode-materials
ng build ngx-lowcode-designer
ng build ngx-lowcode-testing
ng build ngx-lowcode-puzzle-adapter
ng build demo
```

## Publishing Direction

Current internal form is multi-package. Recommended external evolution:

- default install path: `ngx-lowcode`
- advanced install paths: `ngx-lowcode-core`, `ngx-lowcode-renderer`, `ngx-lowcode-designer`, `ngx-lowcode-materials`
- optional adapter package: `ngx-lowcode-puzzle-adapter`

The aggregate package should re-export stable public APIs while internal package boundaries remain explicit.
