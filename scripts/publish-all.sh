#!/usr/bin/env bash
set -euo pipefail

DIST_TAG="latest"
if [[ "${1:-}" == "--tag" && -n "${2:-}" ]]; then
  DIST_TAG="${2}"
fi

if [[ -z "${NODE_AUTH_TOKEN:-}" ]]; then
  echo "NODE_AUTH_TOKEN is required for npm publish."
  exit 1
fi

declare -a PACKAGES=(
  "@zhongmiao/ngx-lowcode-core-types:projects/ngx-lowcode-core-types/package.json:dist/ngx-lowcode-core-types"
  "@zhongmiao/ngx-lowcode-i18n:projects/ngx-lowcode-i18n/package.json:dist/ngx-lowcode-i18n"
  "@zhongmiao/ngx-lowcode-core-utils:projects/ngx-lowcode-core-utils/package.json:dist/ngx-lowcode-core-utils"
  "@zhongmiao/ngx-lowcode-meta-model:projects/ngx-lowcode-meta-model/package.json:dist/ngx-lowcode-meta-model"
  "@zhongmiao/ngx-lowcode-datasource:projects/ngx-lowcode-datasource/package.json:dist/ngx-lowcode-datasource"
  "@zhongmiao/ngx-lowcode-core:projects/ngx-lowcode-core/package.json:dist/ngx-lowcode-core"
  "@zhongmiao/ngx-lowcode-renderer:projects/ngx-lowcode-renderer/package.json:dist/ngx-lowcode-renderer"
  "@zhongmiao/ngx-lowcode-materials:projects/ngx-lowcode-materials/package.json:dist/ngx-lowcode-materials"
  "@zhongmiao/ngx-lowcode-designer:projects/ngx-lowcode-designer/package.json:dist/ngx-lowcode-designer"
  "@zhongmiao/ngx-lowcode-testing:projects/ngx-lowcode-testing/package.json:dist/ngx-lowcode-testing"
  "@zhongmiao/ngx-lowcode-puzzle-adapter:projects/ngx-lowcode-puzzle-adapter/package.json:dist/ngx-lowcode-puzzle-adapter"
  "@zhongmiao/ngx-lowcode:projects/ngx-lowcode/package.json:dist/ngx-lowcode"
)

is_published() {
  local pkg="$1"
  local version="$2"
  npm view "${pkg}@${version}" version --registry https://registry.npmjs.org >/dev/null 2>&1
}

prepare_aggregate_dist() {
  local source_pkg="projects/ngx-lowcode/package.json"
  local target_dir="dist/ngx-lowcode"

  rm -rf "${target_dir}"
  mkdir -p "${target_dir}"
  cp "${source_pkg}" "${target_dir}/package.json"
  cp "projects/ngx-lowcode/index.js" "${target_dir}/index.js"
  cp "projects/ngx-lowcode/index.d.ts" "${target_dir}/index.d.ts"
  if [[ -f "projects/ngx-lowcode/CHANGELOG.md" ]]; then
    cp "projects/ngx-lowcode/CHANGELOG.md" "${target_dir}/CHANGELOG.md"
  fi
}

prepare_aggregate_dist

for item in "${PACKAGES[@]}"; do
  IFS=':' read -r pkg source_pkg dist_dir <<< "${item}"

  SOURCE_VERSION="$(node -p "require('./${source_pkg}').version")"

  if [[ ! -f "${dist_dir}/package.json" ]]; then
    echo "Missing dist package.json: ${dist_dir}/package.json"
    exit 1
  fi

  DIST_NAME="$(node -p "require('./${dist_dir}/package.json').name")"
  DIST_VERSION="$(node -p "require('./${dist_dir}/package.json').version")"

  if [[ "${DIST_NAME}" != "${pkg}" ]]; then
    echo "Dist package name mismatch: expected=${pkg}, actual=${DIST_NAME}"
    exit 1
  fi

  if [[ "${DIST_VERSION}" != "${SOURCE_VERSION}" ]]; then
    echo "Dist package version mismatch for ${pkg}: dist=${DIST_VERSION}, source=${SOURCE_VERSION}"
    exit 1
  fi

  if is_published "${pkg}" "${SOURCE_VERSION}"; then
    echo "Skipping ${pkg}@${SOURCE_VERSION} (already published)."
    continue
  fi

  echo "Publishing ${pkg}@${SOURCE_VERSION} with dist-tag ${DIST_TAG}"
  npm publish "./${dist_dir}" --tag "${DIST_TAG}" --access public --registry https://registry.npmjs.org

done

echo "Publish pipeline completed."
