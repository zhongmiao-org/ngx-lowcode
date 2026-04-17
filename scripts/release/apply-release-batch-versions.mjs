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
  packageJson.version = packageVersion;
  fs.writeFileSync(pkgJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`, 'utf8');

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
    version: pkg.version || pkg.sourceVersion
  })),
  generatedAt: new Date().toISOString()
};

if (outputPath) {
  fs.writeFileSync(outputPath, `${JSON.stringify(appliedPlan, null, 2)}\n`, 'utf8');
}

console.log(
  `Applied release batch version ${aggregate.version} to ${changedPackages.length} package(s) and aggregate dependencies.`
);
