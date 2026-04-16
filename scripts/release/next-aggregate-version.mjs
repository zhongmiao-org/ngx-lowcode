import fs from 'node:fs';
import { readChangesets, strongestBump, bumpVersion } from './changeset-utils.mjs';

const AGGREGATE = '@zhongmiao/ngx-lowcode';
const AGG_PKG_PATH = 'projects/ngx-lowcode/package.json';

if (!fs.existsSync(AGG_PKG_PATH)) {
  console.error(`Missing aggregate package: ${AGG_PKG_PATH}`);
  process.exit(1);
}

const currentVersion = JSON.parse(fs.readFileSync(AGG_PKG_PATH, 'utf8')).version;
const changesets = readChangesets();
if (!changesets.length) {
  process.exit(2);
}

const bumps = changesets
  .map((c) => c.releases[AGGREGATE])
  .filter(Boolean);

const level = strongestBump(bumps);
if (!level) {
  process.exit(2);
}

const next = bumpVersion(currentVersion, level);
process.stdout.write(next);
