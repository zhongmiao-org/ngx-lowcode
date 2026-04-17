#!/usr/bin/env node
import {
  loadAggregatePackage,
  loadPackageReleaseMetadata,
  loadRootReleaseNotes
} from './unreleased-changelog-utils.mjs';

const asJson = process.argv.includes('--json');
const aggregate = loadAggregatePackage();
const rootNotes = loadRootReleaseNotes();
const workspacePackages = loadPackageReleaseMetadata();

const packageMap = new Map(workspacePackages.map((pkg) => [pkg.name, pkg]));
const internalPackages = workspacePackages.filter((pkg) => pkg.name && pkg.name !== aggregate.name);
const internalPackageNames = new Set(internalPackages.map((pkg) => pkg.name));

const reversePeerGraph = new Map();
for (const pkg of internalPackages) {
  for (const dependencyName of Object.keys(pkg.peerDependencies || {})) {
    if (!internalPackageNames.has(dependencyName)) continue;
    if (!reversePeerGraph.has(dependencyName)) reversePeerGraph.set(dependencyName, new Set());
    reversePeerGraph.get(dependencyName).add(pkg.name);
  }
}

const candidates = internalPackages.filter((pkg) => Boolean(pkg.unreleasedEn));
let skippedAlreadyAtTargetCount = 0;
let skippedUnchangedSinceBaseCount = 0;
const directPackages = [];

for (const pkg of candidates) {
  const sourceVersion = pkg.version;
  const targetVersion = aggregate.version;
  const changedSinceBase = pkg.hasUnreleasedChangedSinceBase !== false;

  if (!changedSinceBase) {
    skippedUnchangedSinceBaseCount += 1;
    continue;
  }

  if (sourceVersion === targetVersion) {
    skippedAlreadyAtTargetCount += 1;
    continue;
  }

  directPackages.push({
    ...pkg,
    sourceVersion,
    targetVersion,
    version: targetVersion,
    selectionReason: 'direct_change',
    willRewriteInSandbox: true,
    triggeredBy: []
  });
}

const directPackageNames = new Set(directPackages.map((pkg) => pkg.name));
const cascadeRoots = new Map();
const queue = [...directPackageNames].map((name) => ({ name, roots: new Set([name]) }));

for (const directPkg of directPackages) {
  cascadeRoots.set(directPkg.name, new Set([directPkg.name]));
}

while (queue.length > 0) {
  const current = queue.shift();
  const dependents = reversePeerGraph.get(current.name) || new Set();

  for (const dependentName of dependents) {
    if (dependentName === aggregate.name) continue;
    const existing = cascadeRoots.get(dependentName) || new Set();
    let changed = false;

    for (const rootName of current.roots) {
      if (!existing.has(rootName)) {
        existing.add(rootName);
        changed = true;
      }
    }

    if (changed) {
      cascadeRoots.set(dependentName, existing);
      queue.push({ name: dependentName, roots: new Set(existing) });
    }
  }
}

const releaseTemplateEn = (triggerPackages, version) =>
  `- chore(release): align peerDependencies for ${triggerPackages.join(', ')} to ${version} in release cascade.`;
const releaseTemplateZh = (triggerPackages, version) =>
  `- chore(release): 在本次联动发布中将 ${triggerPackages.join('、')} 的 peerDependencies 对齐到 ${version}。`;

const cascadePackages = [];
for (const [pkgName, roots] of cascadeRoots) {
  if (directPackageNames.has(pkgName)) continue;
  const pkg = packageMap.get(pkgName);
  if (!pkg || pkg.name === aggregate.name) continue;
  const triggeredBy = [...roots].sort();
  const sourceVersion = pkg.version;
  const targetVersion = aggregate.version;
  const syntheticEn = releaseTemplateEn(triggeredBy, targetVersion);
  const syntheticZh = releaseTemplateZh(triggeredBy, targetVersion);

  cascadePackages.push({
    ...pkg,
    sourceVersion,
    targetVersion,
    version: targetVersion,
    selectionReason: 'cascade_dependency',
    willRewriteInSandbox: sourceVersion !== targetVersion,
    triggeredBy,
    unreleasedEn: pkg.unreleasedEn || syntheticEn,
    unreleasedZh: pkg.unreleasedZh || syntheticZh
  });
}

cascadePackages.sort((a, b) => a.name.localeCompare(b.name));

const selectedPackages = [...directPackages, ...cascadePackages]
  .filter((pkg) => pkg.name !== aggregate.name)
  .sort((a, b) => a.name.localeCompare(b.name));

if (selectedPackages.length === 0 && !rootNotes.en) {
  process.exit(2);
}

if (asJson) {
  process.stdout.write(
    JSON.stringify(
      {
        aggregate,
        directPackages,
        cascadePackages,
        packages: selectedPackages,
        candidateCount: candidates.length,
        directCount: directPackages.length,
        cascadeCount: cascadePackages.length,
        selectedCount: selectedPackages.length,
        skippedAlreadyAtTargetCount,
        skippedUnchangedSinceBaseCount,
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
lines.push(`- candidate packages: ${candidates.length}`);
lines.push(`- direct packages: ${directPackages.length}`);
lines.push(`- cascade packages: ${cascadePackages.length}`);
lines.push(`- selected packages: ${selectedPackages.length}`);
lines.push(`- skipped at target version: ${skippedAlreadyAtTargetCount}`);
lines.push(`- skipped unchanged since base: ${skippedUnchangedSinceBaseCount}`);
lines.push('');

if (rootNotes.en) {
  lines.push('## Root Changelog (Unreleased)');
  lines.push('');
  lines.push('### CHANGELOG.md');
  lines.push(rootNotes.en);
  lines.push('');
}

if (selectedPackages.length > 0) {
  lines.push('## Package Changes');
  lines.push('');

  for (const pkg of selectedPackages) {
    if (!pkg.unreleasedEn) {
      throw new Error(`Package ${pkg.name} must provide English Unreleased content (CHANGELOG.md).`);
    }
    lines.push(`### ${pkg.name} -> ${pkg.targetVersion}`);
    lines.push(pkg.unreleasedEn);
    if (pkg.selectionReason === 'cascade_dependency' && pkg.triggeredBy.length > 0) {
      lines.push('');
      lines.push(`_cascade from: ${pkg.triggeredBy.join(', ')}_`);
    }
    lines.push('');
  }
}

process.stdout.write(lines.join('\n').trim() + '\n');
