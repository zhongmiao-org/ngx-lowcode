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
let packages = Array.isArray(metadata.packages) ? metadata.packages : [];
const rootNotes = metadata.rootNotes || { en: '', zh: '' };

if (!aggregate?.name || !aggregate?.version) {
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

const aggregatePublishedVersion = publishedMap.get(aggregate.name)?.version || aggregate.version;
const rootNotesEn = typeof rootNotes.en === 'string' ? rootNotes.en.trim() : '';
const rootNotesZh = typeof rootNotes.zh === 'string' ? rootNotes.zh.trim() : '';

const shouldFinalizeRoot =
  publishedMap.size === 0
    ? true
    : publishedMap.has(aggregate.name) || packages.length > 0 || Boolean(rootNotesEn || rootNotesZh);

if (!shouldFinalizeRoot && packages.length === 0) {
  console.log('No published aggregate/package changelog content to finalize.');
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

const updatePackageVersion = (pkgName, version, releasedVersionByPackage) => {
  const projectName = pkgName.replace('@zhongmiao/', '');
  const packagePath = `projects/${projectName}/package.json`;
  if (!fs.existsSync(packagePath)) return;
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  packageJson.version = version;

  if (packageJson.peerDependencies && typeof packageJson.peerDependencies === 'object') {
    for (const peerName of Object.keys(packageJson.peerDependencies)) {
      if (releasedVersionByPackage.has(peerName)) {
        packageJson.peerDependencies[peerName] = `${releasedVersionByPackage.get(peerName)}`;
      }
    }
  }

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
      aggregatePkg.dependencies[pkg.name] = `${pkg.version}`;
    }
  }

  fs.writeFileSync(aggregatePath, `${JSON.stringify(aggregatePkg, null, 2)}\n`, 'utf8');
};

for (const pkg of packages) {
  if (!pkg.unreleasedEn || !pkg.unreleasedZh) {
    console.error(`Package ${pkg.name} must provide both English and Chinese Unreleased content before finalize.`);
    process.exit(1);
  }

  if (!pkg.changelogPathEn) {
    console.error(`Package ${pkg.name} is missing changelogPathEn metadata.`);
    process.exit(1);
  }
}

if (shouldFinalizeRoot) {
  const rootLines = [];
  if (rootNotesEn) {
    rootLines.push(rootNotesEn);
    rootLines.push('');
  }

  if (packages.length > 0) {
    rootLines.push('## Released Packages');
    rootLines.push('');
  }

  for (const pkg of packages) {
    const targetVersion = publishedMap.get(pkg.name)?.version || pkg.version;
    rootLines.push(`### ${pkg.name}@${targetVersion}`);
    rootLines.push(pkg.unreleasedEn);
    rootLines.push('');
  }

  const rootBody = rootLines.join('\n').trim();
  if (rootBody) {
    const rootBodyPath = '.tmp/release-root-body.md';
    fs.writeFileSync(rootBodyPath, `${rootBody}\n`, 'utf8');
    runFinalize(aggregatePublishedVersion, rootBodyPath, 'CHANGELOG.md');
  } else {
    console.log('Root English changelog has no finalize content; skipping CHANGELOG.md finalize.');
  }

  if (fs.existsSync('CHANGELOG.zh-CN.md')) {
    const zhLines = [];
    if (rootNotesZh) {
      zhLines.push(rootNotesZh);
      zhLines.push('');
    }

    if (packages.length > 0) {
      zhLines.push('## 发布包清单');
      zhLines.push('');
    }

    for (const pkg of packages) {
      const targetVersion = publishedMap.get(pkg.name)?.version || pkg.version;
      zhLines.push(`### ${pkg.name}@${targetVersion}`);
      zhLines.push(pkg.unreleasedZh);
      zhLines.push('');
    }

    const zhBody = zhLines.join('\n').trim();
    if (zhBody) {
      const zhBodyPath = '.tmp/release-root-body-zh.md';
      fs.writeFileSync(zhBodyPath, `${zhBody}\n`, 'utf8');
      runFinalize(aggregatePublishedVersion, zhBodyPath, 'CHANGELOG.zh-CN.md');
    } else {
      console.log('Root Chinese changelog has no finalize content; skipping CHANGELOG.zh-CN.md finalize.');
    }
  }
}

const releasedVersionByPackage = new Map(
  packages.map((releasedPkg) => [
    releasedPkg.name,
    publishedMap.get(releasedPkg.name)?.version || releasedPkg.version || aggregatePublishedVersion
  ])
);

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

  updatePackageVersion(pkg.name, targetVersion, releasedVersionByPackage);
}

syncAggregateDependencies(
  aggregatePublishedVersion,
  packages.map((pkg) => ({
    name: pkg.name,
    version: publishedMap.get(pkg.name)?.version || pkg.version
  }))
);
