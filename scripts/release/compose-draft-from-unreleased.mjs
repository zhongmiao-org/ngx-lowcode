#!/usr/bin/env node
import { loadAggregatePackage, loadPackageReleaseMetadata } from './unreleased-changelog-utils.mjs';
import { loadRootReleaseNotes } from './unreleased-changelog-utils.mjs';

const asJson = process.argv.includes('--json');
const aggregate = loadAggregatePackage();
const packages = loadPackageReleaseMetadata()
  .filter((pkg) => pkg.name !== aggregate.name && pkg.unreleasedEn)
  .map((pkg) => ({
    ...pkg,
    sourceVersion: pkg.version,
    version: aggregate.version
  }));
const rootNotes = loadRootReleaseNotes();

if (packages.length === 0 && !rootNotes.en) {
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

if (rootNotes.en) {
  lines.push('## Root Changelog (Unreleased)');
  lines.push('');
  lines.push('### CHANGELOG.md');
  lines.push(rootNotes.en);
  lines.push('');
}

if (packages.length > 0) {
  lines.push('## Package Changes');
  lines.push('');

  for (const pkg of packages) {
    if (!pkg.unreleasedEn) {
      throw new Error(`Package ${pkg.name} must provide English Unreleased content (CHANGELOG.md).`);
    }
    lines.push(`### ${pkg.name} -> ${pkg.version}`);
    lines.push(pkg.unreleasedEn);
    lines.push('');
  }
}

process.stdout.write(lines.join('\n').trim() + '\n');
