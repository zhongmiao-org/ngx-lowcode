#!/usr/bin/env bash
set -euo pipefail

PACKAGE_FILES=(projects/*/package.json)
if [[ ${#PACKAGE_FILES[@]} -eq 0 ]]; then
  echo "No project package.json files found under projects/."
  exit 1
fi

seen_aggregate="false"
for file in "${PACKAGE_FILES[@]}"; do
  PKG_NAME="$(node -p "require('./${file}').name")"
  PKG_VERSION="$(node -p "require('./${file}').version")"

  if [[ "${PKG_NAME}" == "@zhongmiao/ngx-lowcode" ]]; then
    seen_aggregate="true"
  fi

  if [[ ! "${PKG_NAME}" =~ ^@zhongmiao/ngx-lowcode ]]; then
    echo "Invalid package scope: ${PKG_NAME}"
    exit 1
  fi

  if ! node -e "const semver=process.argv[1];process.exit(/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(semver)?0:1)" "${PKG_VERSION}"; then
    echo "Invalid semver version for ${PKG_NAME}: ${PKG_VERSION}"
    exit 1
  fi
done

if [[ "${seen_aggregate}" != "true" ]]; then
  echo "Missing aggregate package @zhongmiao/ngx-lowcode under projects/."
  exit 1
fi

echo "Version consistency check passed (independent package versions)."
