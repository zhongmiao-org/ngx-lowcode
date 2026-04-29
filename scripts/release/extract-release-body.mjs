#!/usr/bin/env node
import fs from 'node:fs';

const [, , version, changelogPath = 'CHANGELOG.md', releasePlanPath = ''] = process.argv;

if (!version) {
  console.error('Usage: extract-release-body.mjs <version> [changelog-path] [release-plan-path]');
  process.exit(2);
}

const normalizeBlock = (value) =>
  (value || '')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.replace(/\s+$/g, ''))
    .join('\n')
    .trim();

const demoteHeadings = (value) =>
  normalizeBlock(value)
    .split('\n')
    .map((line) => line.replace(/^(#{1,5})\s+/u, '#$1 '))
    .join('\n')
    .trim();

const renderReleasePlanBody = (plan) => {
  const packages = Array.isArray(plan.packages) ? plan.packages : [];
  const rootNotes = normalizeBlock(plan.rootNotes?.en);
  const lines = [];

  lines.push('## Release Summary');
  lines.push('');
  lines.push(`- aggregate package: ${plan.aggregate?.name || '@zhongmiao/ngx-lowcode'}@${plan.version || version}`);
  lines.push(`- candidate packages: ${plan.candidateCount ?? 0}`);
  lines.push(`- direct packages: ${plan.directCount ?? 0}`);
  lines.push(`- cascade packages: ${plan.cascadeCount ?? 0}`);
  lines.push(`- selected packages: ${plan.selectedCount ?? packages.length}`);
  if (Number.isInteger(plan.skippedAlreadyAtTargetCount)) {
    lines.push(`- skipped at target version: ${plan.skippedAlreadyAtTargetCount}`);
  }
  if (Number.isInteger(plan.skippedUnchangedSinceBaseCount)) {
    lines.push(`- skipped unchanged since base: ${plan.skippedUnchangedSinceBaseCount}`);
  }
  lines.push('');

  if (rootNotes) {
    lines.push('## Root Changelog');
    lines.push('');
    lines.push('### CHANGELOG.md');
    lines.push('');
    lines.push(demoteHeadings(rootNotes));
    lines.push('');
  }

  if (packages.length > 0) {
    lines.push('## Package Changes');
    lines.push('');
    for (const pkg of packages) {
      const targetVersion = pkg.targetVersion || pkg.version || plan.version || version;
      lines.push(`### ${pkg.name} -> ${targetVersion}`);
      lines.push('');
      lines.push(demoteHeadings(pkg.unreleasedEn));
      if (Array.isArray(pkg.triggeredBy) && pkg.triggeredBy.length > 0) {
        lines.push('');
        lines.push(`_cascade from: ${pkg.triggeredBy.join(', ')}_`);
      }
      lines.push('');
    }
  }

  return normalizeBlock(lines.join('\n'));
};

if (releasePlanPath) {
  if (!fs.existsSync(releasePlanPath)) {
    console.error(`Release plan file not found: ${releasePlanPath}`);
    process.exit(1);
  }
  const plan = JSON.parse(fs.readFileSync(releasePlanPath, 'utf8'));
  if (plan.version && plan.version !== version) {
    console.error(`Release plan version ${plan.version} does not match requested version ${version}.`);
    process.exit(1);
  }
  const body = renderReleasePlanBody(plan);
  if (!body) {
    console.error(`Release plan ${releasePlanPath} produced an empty release body.`);
    process.exit(1);
  }
  process.stdout.write(`${body}\n`);
  process.exit(0);
}

if (!fs.existsSync(changelogPath)) {
  console.error(`Changelog file not found: ${changelogPath}`);
  process.exit(1);
}

const escapedVersion = version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const headingPattern = new RegExp(`^##\\s+(?:\\[)?${escapedVersion}(?:\\])?(?:\\s+\\(\\d{4}-\\d{2}-\\d{2}\\))?\\s*$`);
const nextVersionPattern = /^##\s+(?:\[)?\d+\.\d+\.\d+(?:[-0-9A-Za-z.]*)?(?:\])?(?:\s+\(\d{4}-\d{2}-\d{2}\))?\s*$/;
const lines = fs.readFileSync(changelogPath, 'utf8').replace(/\r\n/g, '\n').split('\n');
const headingIndex = lines.findIndex((line) => headingPattern.test(line));

if (headingIndex === -1) {
  console.error(`Could not find changelog section for version ${version} in ${changelogPath}.`);
  process.exit(1);
}

let endIndex = lines.length;
for (let i = headingIndex + 1; i < lines.length; i += 1) {
  if (nextVersionPattern.test(lines[i])) {
    endIndex = i;
    break;
  }
}

const body = normalizeBlock(lines.slice(headingIndex + 1, endIndex).join('\n'));

if (!body) {
  console.error(`Changelog section for version ${version} is empty.`);
  process.exit(1);
}

process.stdout.write(`${body}\n`);
