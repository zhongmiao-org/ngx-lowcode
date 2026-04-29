#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const [, , metadataPath, version, distTag = 'latest', planPath, prBodyPath] = process.argv;

if (!metadataPath || !version || !planPath) {
  console.error(
    'Usage: write-release-plan.mjs <metadata-json-path> <version> <dist-tag> <plan-json-path> [pr-body-path]'
  );
  process.exit(2);
}

if (!/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(version)) {
  console.error(`Invalid release version: ${version}`);
  process.exit(2);
}

if (!['latest', 'next'].includes(distTag)) {
  console.error(`Invalid dist-tag: ${distTag}`);
  process.exit(2);
}

if (!fs.existsSync(metadataPath)) {
  console.error(`Metadata file not found: ${metadataPath}`);
  process.exit(1);
}

const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
if (!metadata.aggregate?.name || !metadata.aggregate?.version) {
  console.error('Invalid release metadata: missing aggregate package.');
  process.exit(1);
}

if (metadata.aggregate.version !== version) {
  console.error(`Metadata version ${metadata.aggregate.version} does not match requested version ${version}.`);
  process.exit(1);
}

const packages = Array.isArray(metadata.packages) ? metadata.packages : [];
const directPackages = Array.isArray(metadata.directPackages) ? metadata.directPackages : [];
const cascadePackages = Array.isArray(metadata.cascadePackages) ? metadata.cascadePackages : [];

const plan = {
  version,
  tag: `v${version}`,
  distTag,
  labels: ['auto-release', 'release-pr'],
  aggregate: metadata.aggregate,
  directPackages,
  cascadePackages,
  packages,
  candidateCount: metadata.candidateCount || 0,
  directCount: metadata.directCount || directPackages.length,
  cascadeCount: metadata.cascadeCount || cascadePackages.length,
  selectedCount: metadata.selectedCount || packages.length,
  rootNotes: metadata.rootNotes || { en: '', zh: '' },
  generatedAt: new Date().toISOString(),
  sourceSha: process.env.GITHUB_SHA || ''
};

fs.mkdirSync(path.dirname(planPath), { recursive: true });
fs.writeFileSync(planPath, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');

if (prBodyPath) {
  const lines = [];
  lines.push(`## Release v${version}`);
  lines.push('');
  lines.push(`- npm dist-tag: \`${distTag}\``);
  lines.push(`- aggregate package: \`${metadata.aggregate.name}@${version}\``);
  lines.push(`- selected packages: \`${packages.length}\``);
  lines.push(`- direct packages: \`${directPackages.length}\``);
  lines.push(`- cascade packages: \`${cascadePackages.length}\``);
  lines.push('');

  if (directPackages.length > 0) {
    lines.push('## Direct package changes');
    lines.push('');
    for (const pkg of directPackages) {
      lines.push(`- \`${pkg.name}@${pkg.targetVersion || pkg.version || version}\``);
    }
    lines.push('');
  }

  if (cascadePackages.length > 0) {
    lines.push('## Cascade package changes');
    lines.push('');
    for (const pkg of cascadePackages) {
      const triggers =
        Array.isArray(pkg.triggeredBy) && pkg.triggeredBy.length > 0 ? ` from ${pkg.triggeredBy.join(', ')}` : '';
      lines.push(`- \`${pkg.name}@${pkg.targetVersion || pkg.version || version}\`${triggers}`);
    }
    lines.push('');
  }

  lines.push('## After merge');
  lines.push('');
  lines.push('- CI on `main` will publish the selected packages.');
  lines.push(`- The workflow will create tag \`v${version}\`.`);
  lines.push('- The GitHub Release body will be extracted from the current version section in `CHANGELOG.md`.');
  lines.push('');

  fs.mkdirSync(path.dirname(prBodyPath), { recursive: true });
  fs.writeFileSync(prBodyPath, `${lines.join('\n').trim()}\n`, 'utf8');
}

console.log(`Wrote release plan for v${version} to ${planPath}.`);
