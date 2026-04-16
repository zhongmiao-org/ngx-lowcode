#!/usr/bin/env node
import { loadAggregatePackage, loadPackageReleaseMetadata } from './unreleased-changelog-utils.mjs';

const asJson = process.argv.includes('--json');
const aggregate = loadAggregatePackage();
const packages = loadPackageReleaseMetadata();

if (packages.length === 0) {
  process.exit(2);
}

if (asJson) {
  process.stdout.write(
    JSON.stringify(
      {
        aggregate,
        packages,
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
lines.push('## Package Changes');
lines.push('');

for (const pkg of packages) {
  lines.push(`### ${pkg.name} -> ${pkg.version}`);
  lines.push(pkg.unreleased);
  lines.push('');
}

process.stdout.write(lines.join('\n').trim() + '\n');
