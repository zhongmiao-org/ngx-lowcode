#!/usr/bin/env node
import { loadAggregatePackage, loadPackageReleaseMetadata } from './unreleased-changelog-utils.mjs';
import { loadRootReleaseNotes } from './unreleased-changelog-utils.mjs';

const asJson = process.argv.includes('--json');
const aggregate = loadAggregatePackage();
const packages = loadPackageReleaseMetadata().filter((pkg) => pkg.name !== aggregate.name);
const rootNotes = loadRootReleaseNotes();

if (packages.length === 0) {
  process.exit(2);
}

if (asJson) {
  process.stdout.write(
    JSON.stringify(
      {
        aggregate,
        packages,
        rootNotes,
        generatedAt: new Date().toISOString()
      },
      null,
      2
    )
  );
  process.stdout.write('\n');
  process.exit(0);
}

const lines = [];
lines.push('## Release Summary');
lines.push('');
lines.push(`- aggregate package: ${aggregate.name}@${aggregate.version}`);
lines.push(`- affected packages: ${packages.length}`);
lines.push('');

if (rootNotes.zh || rootNotes.en) {
  lines.push('## Root Changelog (Unreleased)');
  lines.push('');
  if (rootNotes.zh) {
    lines.push('### CHANGELOG.zh-CN.md');
    lines.push(rootNotes.zh);
    lines.push('');
  }
  if (rootNotes.en) {
    lines.push('### CHANGELOG.md');
    lines.push(rootNotes.en);
    lines.push('');
  }
}

lines.push('## Package Changes');
lines.push('');

for (const pkg of packages) {
  if (!pkg.unreleasedEn || !pkg.unreleasedZh) {
    throw new Error(
      `Package ${pkg.name} must provide both English and Chinese Unreleased content (CHANGELOG.md + CHANGELOG.zh-CN.md).`
    );
  }
  lines.push(`### ${pkg.name} -> ${pkg.version}`);
  lines.push('');
  lines.push('#### Chinese');
  lines.push(pkg.unreleasedZh);
  lines.push('');
  lines.push('#### English');
  lines.push(pkg.unreleasedEn);
  lines.push('');
}

process.stdout.write(lines.join('\n').trim() + '\n');
