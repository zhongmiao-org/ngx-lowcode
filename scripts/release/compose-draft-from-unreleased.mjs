#!/usr/bin/env node
import { loadAggregatePackage, loadPackageReleaseMetadata } from './unreleased-changelog-utils.mjs';
import { loadRootReleaseNotes } from './unreleased-changelog-utils.mjs';

const asJson = process.argv.includes('--json');
const aggregate = loadAggregatePackage();
const candidates = loadPackageReleaseMetadata().filter((pkg) => pkg.name !== aggregate.name && pkg.unreleasedEn);
const selectedPackages = [];
let skippedAlreadyAtTargetCount = 0;
let skippedUnchangedSinceBaseCount = 0;

for (const pkg of candidates) {
  const sourceVersion = pkg.version;
  const targetVersion = aggregate.version;
  const changedSinceBase = pkg.hasUnreleasedChangedSinceBase !== false;
  const willRewriteInSandbox = changedSinceBase && sourceVersion !== targetVersion;

  if (!changedSinceBase) {
    skippedUnchangedSinceBaseCount += 1;
    continue;
  }

  if (!willRewriteInSandbox) {
    skippedAlreadyAtTargetCount += 1;
    continue;
  }

  selectedPackages.push({
    ...pkg,
    sourceVersion,
    targetVersion,
    version: targetVersion,
    willRewriteInSandbox,
    selectionReason: 'version_change_required'
  });
}

const rootNotes = loadRootReleaseNotes();

if (selectedPackages.length === 0 && !rootNotes.en) {
  process.exit(2);
}

if (asJson) {
  process.stdout.write(
    JSON.stringify(
      {
        aggregate,
        packages: selectedPackages,
        candidateCount: candidates.length,
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
    lines.push(`### ${pkg.name} -> ${pkg.version}`);
    lines.push(pkg.unreleasedEn);
    lines.push('');
  }
}

process.stdout.write(lines.join('\n').trim() + '\n');
