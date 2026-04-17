import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

export function extractUnreleased(content) {
  const normalized = content.replace(/\r\n/g, '\n');
  const lines = normalized.split('\n');
  let inSection = false;
  const buffer = [];

  for (const line of lines) {
    if (/^## \[Unreleased\]\s*$/.test(line)) {
      inSection = true;
      continue;
    }
    if (inSection && /^##\s+/.test(line)) {
      break;
    }
    if (inSection) {
      buffer.push(line);
    }
  }

  const cleaned = buffer
    .map((line) => line.replace(/\s+$/g, ''))
    .join('\n')
    .trim();
  return cleaned;
}

export function readUnreleasedFromFile(filePath) {
  if (!fs.existsSync(filePath)) return '';
  const content = fs.readFileSync(filePath, 'utf8');
  return extractUnreleased(content);
}

function readFileFromGitRef(ref, repoRelativePath) {
  const result = spawnSync('git', ['show', `${ref}:${repoRelativePath}`], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore']
  });
  if (result.status !== 0) return '';
  return result.stdout || '';
}

function normalizeBlock(value) {
  return (value || '')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.replace(/\s+$/g, ''))
    .join('\n')
    .trim();
}

function resolveLatestReleaseTag() {
  const result = spawnSync('git', ['tag', '--sort=-version:refname'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore']
  });
  if (result.status !== 0) return '';
  const tags = (result.stdout || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((tag) => /^v\d+\.\d+\.\d+/.test(tag));
  return tags[0] || '';
}

export function loadPackageReleaseMetadata() {
  const latestReleaseTag = resolveLatestReleaseTag();
  const projectsDir = path.resolve('projects');
  const entries = fs.readdirSync(projectsDir, { withFileTypes: true });
  const packages = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const dir = path.join(projectsDir, entry.name);
    const packageJsonPath = path.join(dir, 'package.json');
    const changelogPathEn = path.join(dir, 'CHANGELOG.md');
    const changelogPathZh = path.join(dir, 'CHANGELOG.zh-CN.md');
    if (!fs.existsSync(packageJsonPath)) continue;

    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const unreleasedEn = fs.existsSync(changelogPathEn) ? readUnreleasedFromFile(changelogPathEn) : '';
    const unreleasedZh = fs.existsSync(changelogPathZh) ? readUnreleasedFromFile(changelogPathZh) : '';

    let hasUnreleasedChangedSinceBase = false;
    if (unreleasedEn || unreleasedZh) {
      const baseEn =
        latestReleaseTag && fs.existsSync(changelogPathEn)
          ? extractUnreleased(readFileFromGitRef(latestReleaseTag, changelogPathEn))
          : '';
      const baseZh =
        latestReleaseTag && fs.existsSync(changelogPathZh)
          ? extractUnreleased(readFileFromGitRef(latestReleaseTag, changelogPathZh))
          : '';
      hasUnreleasedChangedSinceBase =
        !latestReleaseTag ||
        normalizeBlock(unreleasedEn) !== normalizeBlock(baseEn) ||
        normalizeBlock(unreleasedZh) !== normalizeBlock(baseZh);
    }

    const peerDependencies = pkg.peerDependencies || {};

    packages.push({
      name: pkg.name,
      version: pkg.version,
      latestReleaseTag,
      projectDir: path.relative(process.cwd(), dir),
      packageJsonPath: path.relative(process.cwd(), packageJsonPath),
      changelogPathEn: fs.existsSync(changelogPathEn) ? path.relative(process.cwd(), changelogPathEn) : '',
      changelogPathZh: fs.existsSync(changelogPathZh) ? path.relative(process.cwd(), changelogPathZh) : '',
      unreleasedEn,
      unreleasedZh,
      hasUnreleasedChangedSinceBase,
      peerDependencies
    });
  }

  packages.sort((a, b) => a.name.localeCompare(b.name));
  return packages;
}

export function loadAggregatePackage() {
  const aggregatePath = path.resolve('projects/ngx-lowcode/package.json');
  if (!fs.existsSync(aggregatePath)) {
    throw new Error(`Missing aggregate package: ${aggregatePath}`);
  }

  const aggregate = JSON.parse(fs.readFileSync(aggregatePath, 'utf8'));
  return {
    name: aggregate.name,
    version: aggregate.version
  };
}

export function loadRootReleaseNotes() {
  const rootEn = readUnreleasedFromFile(path.resolve('CHANGELOG.md'));
  const rootZh = readUnreleasedFromFile(path.resolve('CHANGELOG.zh-CN.md'));
  return {
    en: rootEn,
    zh: rootZh
  };
}
