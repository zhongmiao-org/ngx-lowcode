#!/usr/bin/env node
import fs from 'node:fs';

const [, , version, changelogPath = 'CHANGELOG.md'] = process.argv;

if (!version) {
  console.error('Usage: extract-release-body.mjs <version> [changelog-path]');
  process.exit(2);
}

if (!fs.existsSync(changelogPath)) {
  console.error(`Changelog file not found: ${changelogPath}`);
  process.exit(1);
}

const escapedVersion = version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const headingPattern = new RegExp(`^##\\s+(?:\\[)?${escapedVersion}(?:\\])?(?:\\s+\\(\\d{4}-\\d{2}-\\d{2}\\))?\\s*$`);
const lines = fs.readFileSync(changelogPath, 'utf8').replace(/\r\n/g, '\n').split('\n');
const headingIndex = lines.findIndex((line) => headingPattern.test(line));

if (headingIndex === -1) {
  console.error(`Could not find changelog section for version ${version} in ${changelogPath}.`);
  process.exit(1);
}

let endIndex = lines.length;
for (let i = headingIndex + 1; i < lines.length; i += 1) {
  if (/^##\s+/.test(lines[i])) {
    endIndex = i;
    break;
  }
}

const body = lines
  .slice(headingIndex + 1, endIndex)
  .map((line) => line.replace(/\s+$/g, ''))
  .join('\n')
  .trim();

if (!body) {
  console.error(`Changelog section for version ${version} is empty.`);
  process.exit(1);
}

process.stdout.write(`${body}\n`);
