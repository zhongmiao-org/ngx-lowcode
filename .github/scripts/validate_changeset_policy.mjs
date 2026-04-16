import { execSync } from 'node:child_process';

const base = process.argv[2];
const head = process.argv[3];
const AGGREGATE = '@zhongmiao/ngx-lowcode';

if (!base || !head) {
  console.error('Usage: node .github/scripts/validate_changeset_policy.mjs <base> <head>');
  process.exit(1);
}

function sh(cmd) {
  return execSync(cmd, { stdio: ['ignore', 'pipe', 'pipe'] }).toString('utf8');
}

const changed = sh(`git diff --name-only ${base} ${head}`)
  .split('\n')
  .map((s) => s.trim())
  .filter(Boolean);

const changesetFiles = changed.filter((f) => f.startsWith('.changeset/') && f.endsWith('.md') && !f.endsWith('README.md'));
if (!changesetFiles.length) {
  process.exit(0);
}

for (const file of changesetFiles) {
  const content = sh(`git show ${head}:${file}`);
  const front = content.match(/^---\n([\s\S]*?)\n---/);
  if (!front) {
    console.error(`Invalid changeset frontmatter: ${file}`);
    process.exit(1);
  }

  const lines = front[1].split('\n').map((l) => l.trim()).filter(Boolean);
  const pkgs = lines
    .map((line) => {
      const m = line.match(/^"?(@zhongmiao\/ngx-lowcode[^"]*)"?\s*:\s*(patch|minor|major)$/);
      return m ? m[1] : null;
    })
    .filter(Boolean);

  const isEmptyChangeset = pkgs.length === 0;
  if (isEmptyChangeset) {
    continue;
  }

  if (!pkgs.includes(AGGREGATE)) {
    console.error(`Changeset ${file} must include ${AGGREGATE}.`);
    process.exit(1);
  }
}
