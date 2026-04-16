import fs from 'node:fs';
import path from 'node:path';

const CHANGESET_DIR = '.changeset';
const SKIP_FILES = new Set(['README.md']);

function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) {
    return { releases: {}, summary: raw.trim() };
  }

  const yaml = match[1];
  const summary = (match[2] || '').trim();
  const releases = {};

  for (const line of yaml.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const pkgMatch = trimmed.match(/^"?(@zhongmiao\/ngx-lowcode[^"]*)"?\s*:\s*(patch|minor|major)$/);
    if (!pkgMatch) continue;
    releases[pkgMatch[1]] = pkgMatch[2];
  }

  return { releases, summary };
}

export function readChangesets() {
  if (!fs.existsSync(CHANGESET_DIR)) return [];
  const files = fs
    .readdirSync(CHANGESET_DIR)
    .filter((f) => f.endsWith('.md') && !SKIP_FILES.has(f));

  return files.map((file) => {
    const filepath = path.join(CHANGESET_DIR, file);
    const raw = fs.readFileSync(filepath, 'utf8');
    const { releases, summary } = parseFrontmatter(raw);
    return { file, releases, summary };
  });
}

export function bumpVersion(version, bump) {
  const [main, pre] = version.split('-');
  const [major, minor, patch] = main.split('.').map((v) => Number(v));
  if ([major, minor, patch].some(Number.isNaN)) {
    throw new Error(`Invalid version: ${version}`);
  }

  if (bump === 'major') return `${major + 1}.0.0`;
  if (bump === 'minor') return `${major}.${minor + 1}.0`;
  if (bump === 'patch') return `${major}.${minor}.${patch + 1}`;
  return pre ? `${main}-${pre}` : main;
}

export function strongestBump(bumps) {
  if (bumps.includes('major')) return 'major';
  if (bumps.includes('minor')) return 'minor';
  if (bumps.includes('patch')) return 'patch';
  return null;
}
