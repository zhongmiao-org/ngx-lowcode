#!/usr/bin/env bash
set -euo pipefail

ROOT_VERSION="$(node -p "require('./package.json').version")"
PACKAGE_FILES=(projects/*/package.json)

if [[ ${#PACKAGE_FILES[@]} -eq 0 ]]; then
  echo "No project package.json files found under projects/."
  exit 1
fi

echo "Root version: ${ROOT_VERSION}"

for file in "${PACKAGE_FILES[@]}"; do
  PKG_NAME="$(node -p "require('./${file}').name")"
  PKG_VERSION="$(node -p "require('./${file}').version")"
  if [[ "${PKG_VERSION}" != "${ROOT_VERSION}" ]]; then
    echo "Version mismatch: ${PKG_NAME} (${PKG_VERSION}) != root (${ROOT_VERSION})"
    exit 1
  fi
done

if [[ -n "${GITHUB_REF_NAME:-}" && "${GITHUB_REF_TYPE:-}" == "tag" ]]; then
  EXPECTED_TAG="v${ROOT_VERSION}"
  if [[ "${GITHUB_REF_NAME}" != "${EXPECTED_TAG}" ]]; then
    echo "Tag/version mismatch: tag=${GITHUB_REF_NAME}, expected=${EXPECTED_TAG}"
    exit 1
  fi
fi

echo "Version consistency check passed."
