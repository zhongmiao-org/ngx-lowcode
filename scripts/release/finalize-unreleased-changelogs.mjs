#!/usr/bin/env node
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const metadataPath = process.argv[2];
if (!metadataPath) {
  console.error('Usage: finalize-unreleased-changelogs.mjs <metadata-json-path>');
  process.exit(2);
}

if (!fs.existsSync(metadataPath)) {
  console.error(`Metadata file not found: ${metadataPath}`);
  process.exit(1);
}

const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
const aggregate = metadata.aggregate;
const packages = metadata.packages;

if (!aggregate?.version || !Array.isArray(packages) || packages.length === 0) {
  console.error('Invalid metadata structure.');
  process.exit(1);
}

if (!fs.existsSync('.tmp')) {
  fs.mkdirSync('.tmp', { recursive: true });
}

const runFinalize = (version, bodyFile, changelogFile) => {
  const result = spawnSync('bash', ['.github/scripts/finalize_changelog.sh', version, bodyFile, changelogFile], {
    stdio: 'inherit'
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

const rootLines = ['## Released Packages', ''];
for (const pkg of packages) {
  rootLines.push(`### ${pkg.name}@${pkg.version}`);
  rootLines.push(pkg.unreleased);
  rootLines.push('');
}
const rootBodyPath = '.tmp/release-root-body.md';
fs.writeFileSync(rootBodyPath, `${rootLines.join('\n').trim()}\n`, 'utf8');
runFinalize(aggregate.version, rootBodyPath, 'CHANGELOG.md');

if (fs.existsSync('CHANGELOG.zh-CN.md')) {
  const zhLines = ['## 发布包清单', ''];
  for (const pkg of packages) {
    zhLines.push(`### ${pkg.name}@${pkg.version}`);
    zhLines.push(pkg.unreleased);
    zhLines.push('');
  }
  const zhBodyPath = '.tmp/release-root-body-zh.md';
  fs.writeFileSync(zhBodyPath, `${zhLines.join('\n').trim()}\n`, 'utf8');
  runFinalize(aggregate.version, zhBodyPath, 'CHANGELOG.zh-CN.md');
}

for (const pkg of packages) {
  const bodyPath = `.tmp/release-${pkg.name.replace(/[@/]/g, '_')}.md`;
  fs.writeFileSync(bodyPath, `${pkg.unreleased}\n`, 'utf8');
  runFinalize(pkg.version, bodyPath, pkg.changelogPath);
}
