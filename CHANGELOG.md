English | [中文文档](CHANGELOG.zh-CN.md)

## [Unreleased]

- test(runtime): align designer/material tests with runtime mode contracts instead of third-party tab internals.
- test(vitest): migrate library test targets from Karma/Jasmine to Angular unit-test with Vitest.
- feat(demo): restore a local source-linked demo app with renderer, designer, and materials modules plus online/offline runtime modes.
- feat(local-dev): add watch commands for refreshing linked ngx-lowcode dist packages during host app development.

## 0.2.0 (2026-04-21)

- feat(runtime): harden datasource/websocket manager contracts with structured execution envelopes, renderer-side normalization, and stable runtime observability state.
- feat(runtime): consume runtime manager WebSocket update events in the renderer and trigger manager-first refresh/action flows.
- feat(runtime): add runtime WebSocket replay cursor subscription support.

## Released Packages

### @zhongmiao/ngx-lowcode-core@0.2.0

- feat(runtime): make the default datasource manager emit structured success envelopes while keeping websocket manager as a stable no-op contract.
- feat(runtime): re-export runtime manager WebSocket update event types from the core package.
- feat(runtime): re-export runtime WebSocket replay cursor subscription contracts.

### @zhongmiao/ngx-lowcode-core-types@0.2.0

- feat(runtime): add datasource execution result envelope types and widen datasource manager return contract for structured observability metadata.
- feat(runtime): add runtime manager WebSocket update event types compatible with the platform contract.
- feat(runtime): add WebSocket replay cursor event and subscribe option contracts.

### @zhongmiao/ngx-lowcode-core-utils@0.2.0

- chore(release): align peerDependencies for @zhongmiao/ngx-lowcode-core-types to 0.2.0 in release cascade.

### @zhongmiao/ngx-lowcode-datasource@0.2.0

- chore(release): align peerDependencies for @zhongmiao/ngx-lowcode-core-types to 0.2.0 in release cascade.

### @zhongmiao/ngx-lowcode-designer@0.2.0

- chore(release): align peerDependencies for @zhongmiao/ngx-lowcode-core, @zhongmiao/ngx-lowcode-core-types, @zhongmiao/ngx-lowcode-renderer to 0.2.0 in release cascade.

### @zhongmiao/ngx-lowcode-materials@0.2.0

- chore(release): align peerDependencies for @zhongmiao/ngx-lowcode-core, @zhongmiao/ngx-lowcode-core-types, @zhongmiao/ngx-lowcode-renderer to 0.2.0 in release cascade.

### @zhongmiao/ngx-lowcode-meta-model@0.2.0

- chore(release): align peerDependencies for @zhongmiao/ngx-lowcode-core-types to 0.2.0 in release cascade.

### @zhongmiao/ngx-lowcode-puzzle-adapter@0.2.0

- chore(release): align peerDependencies for @zhongmiao/ngx-lowcode-core, @zhongmiao/ngx-lowcode-core-types to 0.2.0 in release cascade.

### @zhongmiao/ngx-lowcode-renderer@0.2.0

- feat(runtime): normalize datasource execution results in renderer, expose `__runtimeExecution`, preserve stale table data on failures, and absorb websocket lifecycle errors.
- feat(runtime): consume runtime manager WebSocket update events and apply patch/datasource/action updates through the renderer.
- feat(runtime): store runtime WebSocket replay cursors and pass them to later subscriptions.

### @zhongmiao/ngx-lowcode-testing@0.2.0

- chore(release): align peerDependencies for @zhongmiao/ngx-lowcode-core, @zhongmiao/ngx-lowcode-core-types to 0.2.0 in release cascade.

## 0.1.4 (2026-04-18)

- fix(ci): stop watchdog scheduled polling and only trigger on failed CI(main) or manual dispatch.
- fix(ci): make watchdog triage issue creation resilient when `ci` label is missing.
- feat(ci): enrich watchdog triage output with failed job/step summary and append updates to existing triage issues.
- chore(repo): migrate the platform demo app from `ngx-lowcode/src` to standalone `meta-weave` repository.
- chore(repo): remove `demo` app target/config from this workspace and keep `ngx-lowcode` library-only (`projects/*`).
- docs(repo): update README/README_zh integration guidance to point demo/platform entry to `meta-weave`.
- feat(runtime): switch demo manager injection to `@zhongmiao/meta-lc-runtime-angular` with direct package wiring.
- feat(runtime): keep demo execution observability panel via runtime adapter `onExecution` callback migration (request-id/status/rows/message).

## Released Packages

### @zhongmiao/ngx-lowcode-designer@0.1.4

- refactor: replace embedded Tabler icon font CSS with internal SVG icon rendering so published designer bundles no longer inline base64 font assets.
- fix: remove the Angular 21/Vite bootstrap freeze caused by inlined `tabler-icons` font styles in the designer package.

## 0.1.3 (2026-04-17)

- chore(release): bump aggregate package `@zhongmiao/ngx-lowcode` version to `0.1.3`.
- fix(release): select package release list by sandbox rewrite candidates only (`changed since base tag` + `sourceVersion != targetVersion`) to prevent accidental full-package publish.
- fix(release): enrich `release:draft-notes:json` with selection metrics (`candidateCount`, `selectedCount`, `skippedAlreadyAtTargetCount`).
- feat(release): add recursive dependency cascade selection (`directPackages` + `cascadePackages`) so dependent packages are auto-included in the same release batch.
- feat(release): auto-sync strict peerDependencies and aggregate dependencies from batch metadata, and auto-inject cascade changelog templates for dependent packages.

## Released Packages

### @zhongmiao/ngx-lowcode-core@0.1.3

- test version upgrade to 0.1.3

### @zhongmiao/ngx-lowcode-designer@0.1.3

- chore(release): align peerDependencies for @zhongmiao/ngx-lowcode-core to 0.1.3 in release cascade.

### @zhongmiao/ngx-lowcode-materials@0.1.3

- chore(release): align peerDependencies for @zhongmiao/ngx-lowcode-core to 0.1.3 in release cascade.

### @zhongmiao/ngx-lowcode-puzzle-adapter@0.1.3

- chore(release): align peerDependencies for @zhongmiao/ngx-lowcode-core to 0.1.3 in release cascade.

### @zhongmiao/ngx-lowcode-renderer@0.1.3

- chore(release): align peerDependencies for @zhongmiao/ngx-lowcode-core to 0.1.3 in release cascade.

### @zhongmiao/ngx-lowcode-testing@0.1.3

- chore(release): align peerDependencies for @zhongmiao/ngx-lowcode-core to 0.1.3 in release cascade.

## 0.1.2 (2026-04-17)

- chore(aggregate): reset aggregate package dependency baseline to `0.1.0` for all subpackages.
- fix(release): draft package versions now reflect target release versions (upcoming publish versions) instead of current source versions.
- fix(release): sandbox apply step now rewrites affected subpackage versions to release-plan target versions before build/publish.
- chore(aggregate): remove redundant aggregate package `projects/ngx-lowcode` changelog files and source `index.js`; release publish now generates aggregate dist entry file and copies root changelog.
- fix(release): enforce strict aggregate dependency versions (no caret) for batch apply/finalize write-back to prevent aggregate package from pulling stale subpackage versions.
- fix(ci): treat `projects/ngx-lowcode` code changes as root changelog-governed changes in changelog gate.
- feat(designer): unify business textarea form controls to ngx-tethys inputs in the designer props panel (code editor textareas remain unchanged).
- fix(release): allow finalize to complete for aggregate-only publish success and only archive/write back packages from `publish-result.published[]`.
- fix(release): finalize now appends root unreleased notes and package release sections in one pass to avoid root-only release loss.
- fix(changelog): add per-package `CHANGELOG.zh-CN.md` and enforce bilingual changelog updates for package code changes.
- fix(release): split package release metadata/finalize flow into English and Chinese channels to avoid cross-language pollution.
- chore(format): normalize changelog/release script formatting to keep CI prettier checks stable.
- fix(release): generate release draft notes in English only while keeping bilingual finalize/changelog maintenance.
- feat(release): add release sandbox version sync + selected publish result artifact, and finalize only actually published packages with package version write-back PR.
- chore(release): bump aggregate package `@zhongmiao/ngx-lowcode` version to `0.1.1`.
- fix(release): finalize root release package list now uses actual published versions from publish-result.
- fix(release): allow draft generation from root `CHANGELOG.md` unreleased notes even when no subpackage unreleased changes exist.

## Released Packages

### @zhongmiao/ngx-lowcode-designer@0.1.2

- Unify business form `textarea` controls in the designer props panel with ngx-tethys input styling while keeping code editor textareas unchanged.

## 0.1.0 (2026-04-16)

## Released Packages

### @zhongmiao/ngx-lowcode-core@0.1.0

- Initial public scoped release under `@zhongmiao/*`.

### @zhongmiao/ngx-lowcode-core-types@0.1.0

- Initial public scoped release under `@zhongmiao/*`.

### @zhongmiao/ngx-lowcode-core-utils@0.1.0

- Initial public scoped release under `@zhongmiao/*`.

### @zhongmiao/ngx-lowcode-datasource@0.1.0

- Initial public scoped release under `@zhongmiao/*`.

### @zhongmiao/ngx-lowcode-designer@0.1.0

- Initial public scoped release under `@zhongmiao/*`.

### @zhongmiao/ngx-lowcode-i18n@0.1.0

- Initial public scoped release under `@zhongmiao/*`.

### @zhongmiao/ngx-lowcode-materials@0.1.0

- Initial public scoped release under `@zhongmiao/*`.

### @zhongmiao/ngx-lowcode-meta-model@0.1.0

- Initial public scoped release under `@zhongmiao/*`.

### @zhongmiao/ngx-lowcode-puzzle-adapter@0.1.0

- Initial public scoped release under `@zhongmiao/*`.

### @zhongmiao/ngx-lowcode-renderer@0.1.0

- Initial public scoped release under `@zhongmiao/*`.

### @zhongmiao/ngx-lowcode-testing@0.1.0

- Initial public scoped release under `@zhongmiao/*`.
