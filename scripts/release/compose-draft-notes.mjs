import fs from 'node:fs';
import path from 'node:path';
import { readChangesets, strongestBump, bumpVersion } from './changeset-utils.mjs';

const changesets = readChangesets();
if (!changesets.length) {
  process.exit(2);
}

const grouped = new Map();
for (const item of changesets) {
  const summary = item.summary || 'No summary provided.';
  for (const [pkg, bump] of Object.entries(item.releases)) {
    if (!grouped.has(pkg)) grouped.set(pkg, []);
    grouped.get(pkg).push({ bump, summary, source: item.file });
  }
}

if (grouped.size === 0) {
  process.exit(2);
}

const lines = [];
lines.push('## Release Summary');
lines.push('');
lines.push(`- pending changesets: ${changesets.length}`);
lines.push(`- affected packages: ${grouped.size}`);
lines.push('');
lines.push('## Package Changes');
lines.push('');

const packages = [...grouped.keys()].sort((a, b) => a.localeCompare(b));
for (const pkg of packages) {
  const entries = grouped.get(pkg);
  const levels = entries.map((entry) => entry.bump);
  const highest = strongestBump(levels);
  const packageName = pkg.replace('@zhongmiao/', '');
  const packageJsonPath = path.join('projects', packageName, 'package.json');
  let nextVersionLabel = 'n/a';
  if (highest && fs.existsSync(packageJsonPath)) {
    const current = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')).version;
    nextVersionLabel = bumpVersion(current, highest);
  }

  lines.push(`### ${pkg} -> ${nextVersionLabel}`);
  for (const entry of entries) {
    lines.push(`- [${entry.bump}] ${entry.summary.replace(/\n+/g, ' ')}`);
  }
  lines.push('');
}

process.stdout.write(lines.join('\n').trim() + '\n');
