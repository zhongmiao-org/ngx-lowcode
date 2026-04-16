import fs from 'node:fs';
import path from 'node:path';

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

export function loadPackageReleaseMetadata() {
  const projectsDir = path.resolve('projects');
  const entries = fs.readdirSync(projectsDir, { withFileTypes: true });
  const packages = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const dir = path.join(projectsDir, entry.name);
    const packageJsonPath = path.join(dir, 'package.json');
    const changelogPath = path.join(dir, 'CHANGELOG.md');
    if (!fs.existsSync(packageJsonPath) || !fs.existsSync(changelogPath)) continue;

    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const changelog = fs.readFileSync(changelogPath, 'utf8');
    const unreleased = extractUnreleased(changelog);
    if (!unreleased) continue;

    packages.push({
      name: pkg.name,
      version: pkg.version,
      projectDir: path.relative(process.cwd(), dir),
      changelogPath: path.relative(process.cwd(), changelogPath),
      unreleased
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
