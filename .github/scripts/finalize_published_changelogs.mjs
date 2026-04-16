#!/usr/bin/env node
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const [, , publishedPackagesJson] = process.argv;

if (!publishedPackagesJson) {
  console.error('Usage: finalize_published_changelogs.mjs <publishedPackagesJson>');
  process.exit(2);
}

let publishedPackages;
try {
  publishedPackages = JSON.parse(publishedPackagesJson);
} catch (error) {
  console.error(`Invalid publishedPackages JSON: ${error.message}`);
  process.exit(1);
}

if (!Array.isArray(publishedPackages) || publishedPackages.length === 0) {
  console.error('publishedPackages is empty; nothing to finalize.');
  process.exit(2);
}

const ensureUnreleasedHeader = (content) => {
  const normalized = content.replace(/\r\n/g, '\n');
  if (/^## \[Unreleased\]\s*$/m.test(normalized)) {
    return normalized;
  }

  const lines = normalized.split('\n');
  const insertAt = lines[0]?.startsWith('#') ? 1 : 0;
  lines.splice(insertAt, 0, '', '## [Unreleased]', '');
  return lines.join('\n');
};

const hasVersionHeading = (content, version) => {
  const escapedVersion = version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const direct = new RegExp(`^##\\s+${escapedVersion}\\s+\\(\\d{4}-\\d{2}-\\d{2}\\)\\s*$`, 'm');
  const bracket = new RegExp(`^##\\s+\\[${escapedVersion}\\]\\s*$`, 'm');
  return direct.test(content) || bracket.test(content);
};

const upsertPublishMarker = (content, version, markerLine) => {
  const lines = content.split('\n');
  const headingIndex = lines.findIndex((line) =>
    line.match(
      new RegExp(`^##\\s+${version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+\\(\\d{4}-\\d{2}-\\d{2}\\)\\s*$`)
    )
  );
  if (headingIndex === -1) return content;

  let nextHeading = lines.length;
  for (let i = headingIndex + 1; i < lines.length; i += 1) {
    if (/^##\s+/.test(lines[i])) {
      nextHeading = i;
      break;
    }
  }

  const sectionLines = lines.slice(headingIndex, nextHeading);
  if (sectionLines.some((line) => line.trim() === markerLine.trim())) {
    return content;
  }

  let insertAt = nextHeading;
  while (insertAt > headingIndex + 1 && lines[insertAt - 1].trim() === '') {
    insertAt -= 1;
  }
  lines.splice(insertAt, 0, markerLine);
  return lines.join('\n');
};

const finalizeByShellScript = (version, bodyFile, changelogFile) => {
  const result = spawnSync('bash', ['.github/scripts/finalize_changelog.sh', version, bodyFile, changelogFile], {
    stdio: 'inherit'
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

const writeTempBody = (filepath, lines) => {
  fs.writeFileSync(filepath, `${lines.join('\n')}\n`, 'utf8');
};

const packageMap = new Map(
  publishedPackages.filter((item) => item?.name && item?.version).map((item) => [item.name, item.version])
);

const aggregateName = '@zhongmiao/ngx-lowcode';
if (!packageMap.has(aggregateName)) {
  console.error(`Missing aggregate package in publishedPackages: ${aggregateName}`);
  process.exit(1);
}

if (!fs.existsSync('.tmp')) {
  fs.mkdirSync('.tmp', { recursive: true });
}

const rootBodyFile = '.tmp/release-root-body.md';
const rootLines = ['## Released Packages', ''];
for (const [name, version] of [...packageMap.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
  rootLines.push(`- ${name}@${version}`);
}
writeTempBody(rootBodyFile, rootLines);
finalizeByShellScript(packageMap.get(aggregateName), rootBodyFile, 'CHANGELOG.md');

if (fs.existsSync('CHANGELOG.zh-CN.md')) {
  const rootZhBodyFile = '.tmp/release-root-body-zh.md';
  const zhLines = ['## 发布包清单', ''];
  for (const [name, version] of [...packageMap.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    zhLines.push(`- ${name}@${version}`);
  }
  writeTempBody(rootZhBodyFile, zhLines);
  finalizeByShellScript(packageMap.get(aggregateName), rootZhBodyFile, 'CHANGELOG.zh-CN.md');
}

for (const [name, version] of packageMap.entries()) {
  const projectDir = `projects/${name.replace('@zhongmiao/', '')}`;
  const changelogFile = `${projectDir}/CHANGELOG.md`;
  if (!fs.existsSync(changelogFile)) continue;

  let current = fs.readFileSync(changelogFile, 'utf8');
  current = ensureUnreleasedHeader(current);

  if (!hasVersionHeading(current, version)) {
    const bodyFile = `.tmp/release-${name.replace(/[@/]/g, '_')}.md`;
    writeTempBody(bodyFile, [`- publish: released \`${name}@${version}\`.`]);
    fs.writeFileSync(changelogFile, current, 'utf8');
    finalizeByShellScript(version, bodyFile, changelogFile);
    current = fs.readFileSync(changelogFile, 'utf8');
  }

  const marker = `- publish: released \`${name}@${version}\`.`;
  const withMarker = upsertPublishMarker(current, version, marker);
  if (withMarker !== current) {
    fs.writeFileSync(changelogFile, withMarker, 'utf8');
  }
}
