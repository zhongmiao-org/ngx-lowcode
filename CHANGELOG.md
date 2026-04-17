English | [中文文档](CHANGELOG.zh-CN.md)


## [Unreleased]

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
