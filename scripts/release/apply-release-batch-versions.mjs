#!/usr/bin/env node
import fs from 'node:fs';

const metadataPath = process.argv[2];
const outputPath = process.argv[3] || '';

if (!metadataPath) {
  console.error('Usage: apply-release-batch-versions.mjs <metadata-json-path> [output-json-path]');
  process.exit(2);
}

if (!fs.existsSync(metadataPath)) {
  console.error(`Metadata file not found: ${metadataPath}`);
  process.exit(1);
}

const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
const aggregate = metadata.aggregate;
const packages = Array.isArray(metadata.packages) ? metadata.packages : [];

if (!aggregate?.name || !aggregate?.version) {
  console.error('Invalid metadata: missing aggregate name/version.');
  process.exit(1);
}

const aggregatePackagePath = 'projects/ngx-lowcode/package.json';
if (!fs.existsSync(aggregatePackagePath)) {
  console.error(`Aggregate package file not found: ${aggregatePackagePath}`);
  process.exit(1);
}

const changedPackages = packages.filter((pkg) => pkg.name && pkg.name !== aggregate.name);
const selectedPackageNames = new Set(changedPackages.map((pkg) => pkg.name));
const targetVersionByPackage = new Map(
  changedPackages.map((pkg) => [pkg.name, pkg.targetVersion || pkg.version || pkg.sourceVersion || aggregate.version])
);

const ensureUnreleasedSection = (filePath, heading) => {
  if (fs.existsSync(filePath)) return;
  const content = `${heading}\n\n## [Unreleased]\n\n`;
  fs.writeFileSync(filePath, content, 'utf8');
};

const appendBulletToUnreleased = (filePath, bullet) => {
  if (!bullet) return;
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');
  const lines = content.split('\n');
  const startIndex = lines.findIndex((line) => /^## \[Unreleased\]\s*$/.test(line));
  if (startIndex < 0) return;

  let endIndex = lines.length;
  for (let i = startIndex + 1; i < lines.length; i += 1) {
    if (/^##\s+/.test(lines[i])) {
      endIndex = i;
      break;
    }
  }

  const sectionLines = lines.slice(startIndex + 1, endIndex);
  const normalizedBullet = bullet.trim();
  if (sectionLines.map((line) => line.trim()).includes(normalizedBullet)) {
    return;
  }

  let insertionIndex = endIndex;
  while (insertionIndex > startIndex + 1 && lines[insertionIndex - 1].trim() === '') {
    insertionIndex -= 1;
  }

  const insertLines = [];
  if (startIndex + 1 === insertionIndex) {
    insertLines.push('');
  }
  insertLines.push(normalizedBullet);
  insertLines.push('');
  lines.splice(insertionIndex, 0, ...insertLines);
  fs.writeFileSync(filePath, `${lines.join('\n').replace(/\n+$/g, '\n')}\n`, 'utf8');
};
const formatPeerDependencyChangeEn = (change) =>
  change.from
    ? `- Aligned ${change.name} peer dependency from ${change.from} to ${change.to} for the release cascade.`
    : `- Aligned ${change.name} peer dependency to ${change.to} for the release cascade.`;
const formatPeerDependencyChangeZh = (change) =>
  change.from
    ? `- 在本次联动发布中将 ${change.name} peer dependency 从 ${change.from} 对齐到 ${change.to}。`
    : `- 在本次联动发布中将 ${change.name} peer dependency 对齐到 ${change.to}。`;
const cascadePackageNotesEn = (changes) => `### 🔧 Changed

${changes.map(formatPeerDependencyChangeEn).join('\n')}`;
const cascadePackageNotesZh = (changes) => `### 🔧 变更

${changes.map(formatPeerDependencyChangeZh).join('\n')}`;
const aggregatePackage = JSON.parse(fs.readFileSync(aggregatePackagePath, 'utf8'));
aggregatePackage.version = aggregate.version;
aggregatePackage.dependencies = aggregatePackage.dependencies || {};

for (const pkg of changedPackages) {
  const packageVersion = pkg.targetVersion || pkg.version || pkg.sourceVersion;
  if (!packageVersion) {
    console.error(`Missing package version in metadata for ${pkg.name}.`);
    process.exit(1);
  }

  const projectName = pkg.name.replace('@zhongmiao/', '');
  const pkgJsonPath = `projects/${projectName}/package.json`;
  if (!fs.existsSync(pkgJsonPath)) {
    console.error(`Package file not found: ${pkgJsonPath}`);
    process.exit(1);
  }

  const packageJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
  const sourcePeerDependencies = { ...(packageJson.peerDependencies || {}) };
  packageJson.version = packageVersion;
  packageJson.peerDependencies = packageJson.peerDependencies || {};
  for (const peerName of Object.keys(packageJson.peerDependencies)) {
    if (selectedPackageNames.has(peerName)) {
      const peerVersion = targetVersionByPackage.get(peerName) || aggregate.version;
      packageJson.peerDependencies[peerName] = `${peerVersion}`;
    }
  }
  fs.writeFileSync(pkgJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`, 'utf8');

  if (pkg.selectionReason === 'cascade_dependency') {
    const changelogEnPath = pkg.changelogPathEn;
    const changelogZhPath = pkg.changelogPathZh;
    const peerDependencyChanges =
      Array.isArray(pkg.peerDependencyChanges) && pkg.peerDependencyChanges.length > 0
        ? pkg.peerDependencyChanges
        : (Array.isArray(pkg.triggeredBy) ? pkg.triggeredBy : []).map((dependencyName) => ({
            name: dependencyName,
            from: sourcePeerDependencies[dependencyName] || '',
            to: targetVersionByPackage.get(dependencyName) || aggregate.version
          }));
    const bulletEn = pkg.unreleasedEn || cascadePackageNotesEn(peerDependencyChanges);
    const bulletZh = pkg.unreleasedZh || cascadePackageNotesZh(peerDependencyChanges);

    if (changelogEnPath) {
      ensureUnreleasedSection(changelogEnPath, '# Changelog');
      appendBulletToUnreleased(changelogEnPath, bulletEn);
    }
    if (changelogZhPath) {
      ensureUnreleasedSection(changelogZhPath, '[English](CHANGELOG.md) | 中文文档');
      appendBulletToUnreleased(changelogZhPath, bulletZh);
    }
  }

  if (Object.hasOwn(aggregatePackage.dependencies, pkg.name)) {
    aggregatePackage.dependencies[pkg.name] = `${packageVersion}`;
  }
}

fs.writeFileSync(aggregatePackagePath, `${JSON.stringify(aggregatePackage, null, 2)}\n`, 'utf8');

const appliedPlan = {
  aggregate: {
    name: aggregate.name,
    version: aggregate.version
  },
  packages: changedPackages.map((pkg) => ({
    name: pkg.name,
    version: pkg.targetVersion || pkg.version || pkg.sourceVersion || aggregate.version,
    selectionReason: pkg.selectionReason || 'direct_change',
    triggeredBy: Array.isArray(pkg.triggeredBy) ? pkg.triggeredBy : []
  })),
  generatedAt: new Date().toISOString()
};

if (outputPath) {
  fs.writeFileSync(outputPath, `${JSON.stringify(appliedPlan, null, 2)}\n`, 'utf8');
}

console.log(
  `Applied release batch version ${aggregate.version} to ${changedPackages.length} package(s) and aggregate dependencies.`
);
