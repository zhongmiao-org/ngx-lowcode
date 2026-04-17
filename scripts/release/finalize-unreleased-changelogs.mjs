#!/usr/bin/env node
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const metadataPath = process.argv[2];
const publishResultPath = process.argv[3] || '';
if (!metadataPath) {
  console.error('Usage: finalize-unreleased-changelogs.mjs <metadata-json-path> [publish-result-json-path]');
  process.exit(2);
}

if (!fs.existsSync(metadataPath)) {
  console.error(`Metadata file not found: ${metadataPath}`);
  process.exit(1);
}

const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
const aggregate = metadata.aggregate;
let packages = metadata.packages;

if (!aggregate?.version || !Array.isArray(packages) || packages.length === 0) {
  console.error('Invalid metadata structure.');
  process.exit(1);
}

let published = [];
if (publishResultPath) {
  if (!fs.existsSync(publishResultPath)) {
    console.error(`Publish result file not found: ${publishResultPath}`);
    process.exit(1);
  }
  const publishResult = JSON.parse(fs.readFileSync(publishResultPath, 'utf8'));
  published = Array.isArray(publishResult.published) ? publishResult.published : [];
}

const publishedMap = new Map(published.filter((item) => item?.name && item?.version).map((item) => [item.name, item]));
if (publishedMap.size > 0) {
  packages = packages.filter((pkg) => publishedMap.has(pkg.name));
}

if (packages.length === 0) {
  console.log('No published packages to finalize.');
  process.exit(0);
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

const updatePackageVersion = (pkgName, version) => {
  const projectName = pkgName.replace('@zhongmiao/', '');
  const packagePath = `projects/${projectName}/package.json`;
  if (!fs.existsSync(packagePath)) return;
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  packageJson.version = version;
  fs.writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`, 'utf8');
};

const syncAggregateDependencies = (aggregateVersion, releasedPackages) => {
  const aggregatePath = 'projects/ngx-lowcode/package.json';
  if (!fs.existsSync(aggregatePath)) return;
  const aggregatePkg = JSON.parse(fs.readFileSync(aggregatePath, 'utf8'));
  aggregatePkg.version = aggregateVersion;
  aggregatePkg.dependencies = aggregatePkg.dependencies || {};

  for (const pkg of releasedPackages) {
    if (pkg.name === aggregate.name) continue;
    if (Object.hasOwn(aggregatePkg.dependencies, pkg.name)) {
      aggregatePkg.dependencies[pkg.name] = `^${pkg.version}`;
    }
  }

  fs.writeFileSync(aggregatePath, `${JSON.stringify(aggregatePkg, null, 2)}\n`, 'utf8');
};

const rootLines = ['## Released Packages', ''];
for (const pkg of packages) {
  if (!pkg.unreleasedEn || !pkg.unreleasedZh) {
    console.error(`Package ${pkg.name} must provide both English and Chinese Unreleased content before finalize.`);
    process.exit(1);
  }
  const targetVersion = publishedMap.get(pkg.name)?.version || pkg.version;
  rootLines.push(`### ${pkg.name}@${targetVersion}`);
  rootLines.push(pkg.unreleasedEn);
  rootLines.push('');
}
const rootBodyPath = '.tmp/release-root-body.md';
fs.writeFileSync(rootBodyPath, `${rootLines.join('\n').trim()}\n`, 'utf8');
runFinalize(aggregate.version, rootBodyPath, 'CHANGELOG.md');

if (fs.existsSync('CHANGELOG.zh-CN.md')) {
  const zhLines = ['## 发布包清单', ''];
  for (const pkg of packages) {
    const targetVersion = publishedMap.get(pkg.name)?.version || pkg.version;
    zhLines.push(`### ${pkg.name}@${targetVersion}`);
    zhLines.push(pkg.unreleasedZh);
    zhLines.push('');
  }
  const zhBodyPath = '.tmp/release-root-body-zh.md';
  fs.writeFileSync(zhBodyPath, `${zhLines.join('\n').trim()}\n`, 'utf8');
  runFinalize(aggregate.version, zhBodyPath, 'CHANGELOG.zh-CN.md');
}

for (const pkg of packages) {
  const publishedItem = publishedMap.get(pkg.name);
  const targetVersion = publishedItem?.version || pkg.version;
  const slug = pkg.name.replace(/[@/]/g, '_');
  const bodyPathEn = `.tmp/release-${slug}.md`;
  fs.writeFileSync(bodyPathEn, `${pkg.unreleasedEn}\n`, 'utf8');
  runFinalize(targetVersion, bodyPathEn, pkg.changelogPathEn);

  if (pkg.changelogPathZh) {
    const bodyPathZh = `.tmp/release-${slug}-zh.md`;
    fs.writeFileSync(bodyPathZh, `${pkg.unreleasedZh}\n`, 'utf8');
    runFinalize(targetVersion, bodyPathZh, pkg.changelogPathZh);
  }

  updatePackageVersion(pkg.name, targetVersion);
}

syncAggregateDependencies(
  aggregate.version,
  packages.map((pkg) => ({
    name: pkg.name,
    version: publishedMap.get(pkg.name)?.version || pkg.version
  }))
);
