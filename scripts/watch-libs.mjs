import { copyFileSync, existsSync, mkdirSync, watch, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(scriptDir, '..');
const mode = process.argv.includes('--all') ? 'all' : 'designer';

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: workspaceRoot,
    stdio: 'inherit',
    shell: false
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function ensureAggregatePackage() {
  const aggregateSource = resolve(workspaceRoot, 'projects', 'ngx-lowcode');
  const aggregateDist = resolve(workspaceRoot, 'dist', 'ngx-lowcode');
  const packageJsonPath = resolve(aggregateSource, 'package.json');
  const typesPath = resolve(aggregateSource, 'index.d.ts');

  if (!existsSync(packageJsonPath) || !existsSync(typesPath)) {
    console.warn('[watch-libs] Aggregate ngx-lowcode package metadata not found; skipping.');
    return;
  }

  mkdirSync(aggregateDist, { recursive: true });
  copyFileSync(packageJsonPath, resolve(aggregateDist, 'package.json'));
  copyFileSync(typesPath, resolve(aggregateDist, 'index.d.ts'));
  writeFileSync(resolve(aggregateDist, 'index.js'), 'export {};\n');
}

function buildAll() {
  run('npm', ['run', 'build:libs']);
  ensureAggregatePackage();
}

function watchDesigner() {
  buildAll();
  console.log('[watch-libs] Watching ngx-lowcode-designer.');
  const child = spawn('npx', ['ng', 'build', 'ngx-lowcode-designer', '--watch', '--configuration', 'development'], {
    cwd: workspaceRoot,
    stdio: 'inherit',
    shell: false
  });

  process.on('SIGINT', () => {
    child.kill('SIGTERM');
    process.exit(130);
  });
  process.on('SIGTERM', () => {
    child.kill('SIGTERM');
    process.exit(143);
  });
}

function watchAllWithSequentialRebuilds() {
  buildAll();
  console.log('[watch-libs] Watching projects/ and rebuilding libraries sequentially on change.');

  let timer = null;
  let building = false;
  let queued = false;

  const scheduleBuild = () => {
    if (building) {
      queued = true;
      return;
    }
    clearTimeout(timer);
    timer = setTimeout(() => {
      building = true;
      queued = false;
      buildAll();
      building = false;
      if (queued) {
        scheduleBuild();
      }
    }, 500);
  };

  const watcher = watch(resolve(workspaceRoot, 'projects'), { recursive: true }, (_event, filename) => {
    if (!filename || !/\.(ts|html|scss|json)$/.test(filename)) {
      return;
    }
    scheduleBuild();
  });

  process.on('SIGINT', () => {
    watcher.close();
    process.exit(130);
  });
  process.on('SIGTERM', () => {
    watcher.close();
    process.exit(143);
  });
}

if (mode === 'all') {
  watchAllWithSequentialRebuilds();
} else {
  watchDesigner();
}
