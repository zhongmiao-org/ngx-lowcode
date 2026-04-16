#!/usr/bin/env bash
set -euo pipefail

BASE_REF="${1:-}"
HEAD_REF="${2:-}"

if [[ -z "${BASE_REF}" || -z "${HEAD_REF}" ]]; then
  echo "Usage: $0 <base-ref> <head-ref>"
  exit 1
fi

extract_unreleased() {
  local ref="$1"
  local file="$2"
  git show "${ref}:${file}" 2>/dev/null | awk '
    BEGIN { in_section = 0 }
    /^## \[Unreleased\][[:space:]]*$/ { in_section = 1; next }
    in_section && /^## / { exit }
    in_section { print }
  '
}

normalize_block() {
  sed 's/[[:space:]]*$//' | sed '/^[[:space:]]*$/d'
}

CHANGED_FILES="$(git diff --name-only "${BASE_REF}" "${HEAD_REF}")"

if [[ "$(printf '%s\n' "${CHANGED_FILES}" | sed '/^$/d' | wc -l | tr -d ' ')" -eq 0 ]]; then
  echo "No files changed, skipping changelog gate."
  exit 0
fi

CODE_CHANGED="$(printf '%s\n' "${CHANGED_FILES}" \
  | grep -Ev '^(CHANGELOG\.md|CHANGELOG\.zh-CN\.md|README(\.zh)?\.md|docs/|\.github/|\.changeset/|projects/.+/CHANGELOG\.md$)' || true)"

if [[ -z "${CODE_CHANGED}" ]]; then
  echo "No code-impacting files changed, skipping changelog gate."
  exit 0
fi

validate_changelog_file() {
  local file="$1"
  local head_unreleased
  local base_unreleased

  if ! git cat-file -e "${HEAD_REF}:${file}" 2>/dev/null; then
    echo "Missing required changelog file: ${file}"
    exit 1
  fi

  head_unreleased="$(extract_unreleased "${HEAD_REF}" "${file}" | normalize_block || true)"
  base_unreleased="$(extract_unreleased "${BASE_REF}" "${file}" | normalize_block || true)"

  if [[ -z "${head_unreleased}" ]]; then
    echo "${file} has no content under '## [Unreleased]'."
    exit 1
  fi

  if ! grep -Eq '^[-*][[:space:]]+' <<< "${head_unreleased}"; then
    echo "${file} Unreleased section must contain at least one bullet item."
    exit 1
  fi

  if [[ "${head_unreleased}" == "${base_unreleased}" ]]; then
    echo "${file} Unreleased section was not changed for a code change PR."
    exit 1
  fi
}

has_changeset_update() {
  printf '%s\n' "${CHANGED_FILES}" | grep -Eq '^\.changeset/.+\.md$' && ! printf '%s\n' "${CHANGED_FILES}" | grep -Eq '^\.changeset/README\.md$'
}

has_package_changelog_update() {
  printf '%s\n' "${CHANGED_FILES}" | grep -Eq '^projects/.+/CHANGELOG\.md$'
}

if has_changeset_update; then
  echo "Changelog gate passed via changeset update."
  exit 0
fi

if has_package_changelog_update; then
  echo "Changelog gate passed via package changelog update."
  exit 0
fi

validate_changelog_file "CHANGELOG.md"
validate_changelog_file "CHANGELOG.zh-CN.md"

echo "Changelog gate passed via root Unreleased update."
