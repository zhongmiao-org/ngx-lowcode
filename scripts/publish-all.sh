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

ROOT_VERSION="$(node -p "require('./package.json').version")"

declare -a PACKAGES=(
  "@zhongmiao/ngx-lowcode-core-types:dist/ngx-lowcode-core-types"
  "@zhongmiao/ngx-lowcode-i18n:dist/ngx-lowcode-i18n"
  "@zhongmiao/ngx-lowcode-core-utils:dist/ngx-lowcode-core-utils"
  "@zhongmiao/ngx-lowcode-meta-model:dist/ngx-lowcode-meta-model"
  "@zhongmiao/ngx-lowcode-datasource:dist/ngx-lowcode-datasource"
  "@zhongmiao/ngx-lowcode-core:dist/ngx-lowcode-core"
  "@zhongmiao/ngx-lowcode-renderer:dist/ngx-lowcode-renderer"
  "@zhongmiao/ngx-lowcode-materials:dist/ngx-lowcode-materials"
  "@zhongmiao/ngx-lowcode-designer:dist/ngx-lowcode-designer"
  "@zhongmiao/ngx-lowcode-testing:dist/ngx-lowcode-testing"
  "@zhongmiao/ngx-lowcode-puzzle-adapter:dist/ngx-lowcode-puzzle-adapter"
)

is_published() {
  local pkg="$1"
  local version="$2"
  npm view "${pkg}@${version}" version --registry https://registry.npmjs.org >/dev/null 2>&1
}

for item in "${PACKAGES[@]}"; do
  IFS=':' read -r pkg dist_dir <<< "${item}"

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

  if [[ "${DIST_VERSION}" != "${ROOT_VERSION}" ]]; then
    echo "Dist package version mismatch for ${pkg}: ${DIST_VERSION} != ${ROOT_VERSION}"
    exit 1
  fi

  if is_published "${pkg}" "${ROOT_VERSION}"; then
    echo "Skipping ${pkg}@${ROOT_VERSION} (already published)."
    continue
  fi

  echo "Publishing ${pkg}@${ROOT_VERSION} with dist-tag ${DIST_TAG}"
  npm publish "${dist_dir}" --tag "${DIST_TAG}" --access public

done

echo "Publish pipeline completed."
