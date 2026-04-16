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
npm start
```

## Demo Integration with `meta-lc-platform`

The root `src` demo is wired to BFF `/query + /mutation` and supports tenant switching.

- default BFF endpoint: `http://localhost:6000/query`
- runtime override:
  - `window.__LC_BFF_URL__ = "http://<host>:6000"` before app bootstrap
  - or set datasource `request.url` to absolute URL

Demo verification path:

1. Start `meta-lc-platform/apps/bff-server` with PostgreSQL/Redis.
2. Open demo and switch `Tenant A` / `Tenant B`.
3. In `Query Filters`, trigger query via `Search` button or linked `status/channel/priority` changes.
4. In `Order CRUD Editor`, run full CRUD flow:
   - Create: fill `formOrderId/formOwner/formChannel/formPriority/formStatus` (optional `form_org_id`), then click `Create`
   - Update: click a table row to populate editor, change fields, then click `Update`
   - Delete: select a row or input `formOrderId`, then click `Delete`
5. Verify widget linkage:
   - row click populates `selectedOrderId` and editor state fields
   - `status/channel/priority` changes auto-trigger query refresh
6. Capture preview `request-id`, then confirm tenant isolation and CRUD result in table.
7. Fallback to mock rows only when BFF is unavailable (`status=0/502/503/504`).
8. Verify audit row by request id:

```sql
SELECT request_id, tenant_id, status, row_count, error_message, created_at
FROM bff_query_audit_logs
WHERE request_id = '<demo-request-id>'
ORDER BY id DESC;
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

## Release Flow

- CI: `.github/workflows/ci.yml` runs lint + test + build + changelog gate on PR.
- Draft: `.github/workflows/release-draft.yml` runs on `main` and upserts draft release from `CHANGELOG.md`.
- Empty draft window: if `## [Unreleased]` is empty, draft workflow exits successfully with skip (no red build).
- Publish: manually click **Publish release** on draft, then `.github/workflows/release-publish.yml` publishes all 11 packages.

Release prerequisites:

- repository/organization secret: `NPM_TOKEN`
- all package versions aligned (checked by `npm run version:check`)
- build artifacts generated (done in workflow via `npm run build:libs`)
