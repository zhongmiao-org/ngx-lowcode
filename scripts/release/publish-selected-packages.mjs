#!/usr/bin/env node
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const metadataPath = process.argv[2];
const resultPath = process.argv[3] || '.tmp/publish-result.json';
const distTag = process.argv[4] || 'latest';

if (!metadataPath) {
  console.error('Usage: publish-selected-packages.mjs <metadata-json-path> [result-json-path] [dist-tag]');
  process.exit(2);
}

if (!fs.existsSync(metadataPath)) {
  console.error(`Metadata file not found: ${metadataPath}`);
  process.exit(1);
}

if (!process.env.NODE_AUTH_TOKEN) {
  console.error('NODE_AUTH_TOKEN is required for npm publish.');
  process.exit(1);
}

const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
const aggregate = metadata.aggregate;
const changedPackages = Array.isArray(metadata.packages) ? metadata.packages : [];

if (!aggregate?.name || !aggregate?.version) {
  console.error('Invalid metadata: missing aggregate package info.');
  process.exit(1);
}

const packagesToPublish = [{ name: aggregate.name }, ...changedPackages.map((pkg) => ({ name: pkg.name }))];
const publishList = [];
const seen = new Set();
for (const item of packagesToPublish) {
  if (!item?.name || seen.has(item.name)) continue;
  seen.add(item.name);
  publishList.push(item.name);
}

const run = (cmd, args) => {
  const result = spawnSync(cmd, args, { stdio: 'pipe', encoding: 'utf8' });
  return result;
};

const isPublished = (pkgName, version) => {
  const result = run('npm', ['view', `${pkgName}@${version}`, 'version', '--registry', 'https://registry.npmjs.org']);
  return result.status === 0;
};

const prepareAggregateDist = () => {
  const sourcePkg = 'projects/ngx-lowcode/package.json';
  const targetDir = 'dist/ngx-lowcode';

  run('rm', ['-rf', targetDir]);
  fs.mkdirSync(targetDir, { recursive: true });
  fs.copyFileSync(sourcePkg, `${targetDir}/package.json`);
  fs.writeFileSync(`${targetDir}/index.js`, "'use strict';\nmodule.exports = {};\n", 'utf8');
  fs.copyFileSync('projects/ngx-lowcode/index.d.ts', `${targetDir}/index.d.ts`);
  if (fs.existsSync('CHANGELOG.md')) {
    fs.copyFileSync('CHANGELOG.md', `${targetDir}/CHANGELOG.md`);
  }
};

prepareAggregateDist();

const resultPayload = {
  generatedAt: new Date().toISOString(),
  distTag,
  published: [],
  skipped: [],
  failed: []
};

for (const pkgName of publishList) {
  const projectName = pkgName.replace('@zhongmiao/', '');
  const sourcePkgPath = `projects/${projectName}/package.json`;
  const distDir = `dist/${projectName}`;
  const distPkgPath = `${distDir}/package.json`;

  if (!fs.existsSync(sourcePkgPath)) {
    resultPayload.failed.push({ name: pkgName, reason: `Missing source package: ${sourcePkgPath}` });
    continue;
  }

  if (!fs.existsSync(distPkgPath)) {
    resultPayload.failed.push({ name: pkgName, reason: `Missing dist package: ${distPkgPath}` });
    continue;
  }

  const sourceVersion = JSON.parse(fs.readFileSync(sourcePkgPath, 'utf8')).version;
  const distPkg = JSON.parse(fs.readFileSync(distPkgPath, 'utf8'));
  if (distPkg.name !== pkgName) {
    resultPayload.failed.push({
      name: pkgName,
      version: sourceVersion,
      reason: `Dist package name mismatch: expected=${pkgName}, actual=${distPkg.name}`
    });
    continue;
  }

  if (distPkg.version !== sourceVersion) {
    resultPayload.failed.push({
      name: pkgName,
      version: sourceVersion,
      reason: `Dist package version mismatch: source=${sourceVersion}, dist=${distPkg.version}`
    });
    continue;
  }

  if (isPublished(pkgName, sourceVersion)) {
    resultPayload.skipped.push({ name: pkgName, version: sourceVersion, reason: 'already_published' });
    console.log(`Skipping ${pkgName}@${sourceVersion} (already published).`);
    continue;
  }

  console.log(`Publishing ${pkgName}@${sourceVersion} with dist-tag ${distTag}`);
  const publishResult = run('npm', [
    'publish',
    `./${distDir}`,
    '--tag',
    distTag,
    '--access',
    'public',
    '--registry',
    'https://registry.npmjs.org'
  ]);

  if (publishResult.status !== 0) {
    resultPayload.failed.push({
      name: pkgName,
      version: sourceVersion,
      reason: publishResult.stderr.trim() || publishResult.stdout.trim() || 'publish_failed'
    });
    continue;
  }

  resultPayload.published.push({ name: pkgName, version: sourceVersion });
}

fs.mkdirSync('.tmp', { recursive: true });
fs.writeFileSync(resultPath, `${JSON.stringify(resultPayload, null, 2)}\n`, 'utf8');

if (resultPayload.failed.length > 0) {
  console.error(`Publish failed for ${resultPayload.failed.length} package(s).`);
  process.exit(1);
}

if (resultPayload.published.length === 0) {
  console.log('No packages were newly published.');
}

console.log(
  `Publish completed: published=${resultPayload.published.length}, skipped=${resultPayload.skipped.length}, failed=0`
);
