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
- `src`
  Local source-linked demo app for renderer, designer, and materials package development.
- `meta-weave` (separate repository)
  Platform application host for broader product integration.

## Naming Decision

- `ngx-puzzle` remains the established BI/dashboard/canvas brand and must not be renamed.
- `ngx-lowcode` remains the page-oriented low-code library workspace.
- Integration between the two products should happen through `ngx-lowcode-puzzle-adapter`, not by collapsing them into one renamed package.

## Key Principles

- `core` is the only package allowed to define shared contracts and state boundaries.
- `designer`, `renderer`, and `materials` communicate through `core` contracts, not by directly calling each other.
- Low-code document changes must converge on a single source of truth: `PageSchema` plus editor/document state.
- The repo should stay ready for future aggregate publishing without collapsing internal boundaries.

## Current Designer Status

The current public baseline is centered on a usable page/form designer instead of broad component coverage.

- Layout containers are `flex`-based in design mode.
- Drag and drop is currently supported for `same-level sorting` within the same parent container.
- Cross-container drag is intentionally not treated as stable yet.
- The outline panel uses `ThyTree` and is expanded by default.
- Material and outline icons are rendered with `Tabler Icons`.

### Built-in Layout Model

- `page`
  Flex container for top-level page composition.
- `section`
  Generic flex layout container for arranging children.
- `form`
  Tethys form semantic container with `thyLayout: horizontal | vertical`.

Recommended query form structure:

```text
page
└── form
    ├── section   // filter fields
    └── section   // action buttons
```

### Built-in Material Coverage

Stable built-in materials currently include:

- Common: `text`, `button`, `icon`, `divider`, `image`
- Layout: `page`, `section`, `form`, `space`, `anchor`
- Navigation: `breadcrumb`, `tabs`, `menu`
- Data entry: `input`, `select`, `input-number`, `checkbox`, `radio`, `switch`, `date-picker`, `upload`
- Data display: `table`, `card`, `list`, `tag`, `avatar`, `progress`, `statistic`
- Feedback: `alert`

### Form Rendering Rules

- Horizontal form items use a shared fixed label column for alignment.
- Vertical form items keep labels above controls.
- `text` supports optional `href` and `target` instead of using a separate link material.
- `table`, `divider`, `form`, `tabs`, and `progress` default to full-width placement.

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
```

## Local Demo App

The root `src` app is a minimal local demo host for package development. It uses source path mappings in
`tsconfig.app.json`, so changes under `projects/*/src` are picked up directly by the demo watcher.

```bash
npm run start:demo:offline
npm run start:demo:online
npm run build:demo:offline
npm run build:demo:online
```

Use `meta-weave` for the full platform application and cross-repository integration surface.

## Build Targets

```bash
ng build ngx-lowcode-core
ng build ngx-lowcode-renderer
ng build ngx-lowcode-materials
ng build ngx-lowcode-designer
ng build ngx-lowcode-testing
ng build ngx-lowcode-puzzle-adapter
```

## Publishing Direction

Current internal form is multi-package. Public npm scope is fixed as `@zhongmiao/*`.

- core package chain:
  - `@zhongmiao/ngx-lowcode-core-types`
  - `@zhongmiao/ngx-lowcode-i18n`
  - `@zhongmiao/ngx-lowcode-core-utils`
  - `@zhongmiao/ngx-lowcode-meta-model`
  - `@zhongmiao/ngx-lowcode-datasource`
  - `@zhongmiao/ngx-lowcode-core`
- runtime/designer:
  - `@zhongmiao/ngx-lowcode-renderer`
  - `@zhongmiao/ngx-lowcode-materials`
  - `@zhongmiao/ngx-lowcode-designer`
- support packages:
  - `@zhongmiao/ngx-lowcode-testing`
  - `@zhongmiao/ngx-lowcode-puzzle-adapter`
- aggregate package:
  - `@zhongmiao/ngx-lowcode` (meta package for unified install + release summary tracking)

## Release Flow

- CI: `.github/workflows/ci.yml` runs lint + test + build + changelog gate on PR.
- Changesets release: `.github/workflows/release-changesets.yml` runs on `main`, opens version PR when changesets exist, and publishes changed packages.
- Aggregate package rule: any non-empty changeset must include `@zhongmiao/ngx-lowcode` so aggregate package version always tracks child package releases.
- Draft summary: `.github/workflows/release-draft.yml` composes draft notes from pending `.changeset/*.md` and groups changes by package.
- Legacy publish path: `.github/workflows/release-publish.yml` stays fallback-only and is disabled by default.
- Changelog policy for code changes: update either a `.changeset/*.md` file or the corresponding package changelog under `projects/*/CHANGELOG.md`.
- CI watchdog: `.github/workflows/ci-watchdog.yml` monitors failed CI on `main`, auto-opens lockfile-fix PR when deterministic, otherwise opens a triage issue.

Release prerequisites:

- repository/organization secret: `NPM_TOKEN`
- `npm ci` lockfile consistency (CI enforces no drift after install)
- build artifacts generated (workflow runs `npm run build:libs`)
