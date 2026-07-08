/**
 * General Windows Process Cleanup V1 — shared validation suite.
 */

import { execSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  WINDOWS_PROCESS_CLEANUP_V1_PASS_TOKEN,
  awaitManagedProcessCleanup,
  findPortListeners,
  isPortListening,
  killProcessesByPort,
  resetManagedProcessRegistryForTests,
  safeProcessExit,
  settleEventLoop,
  spawnManagedProcess,
  stopAllTrackedManagedProcesses,
} from '../../src/windows-process-cleanup/index.js';

export const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..', '..');

export interface WindowsProcessCleanupCheck {
  name: string;
  passed: boolean;
  detail: string;
}

export function assertWindowsProcessCleanupCheck(
  checks: WindowsProcessCleanupCheck[],
  name: string,
  condition: boolean,
  detail: string,
): void {
  checks.push({ name, passed: condition, detail });
}

function pickEphemeralPort(): number {
  return 45_000 + Math.floor(Math.random() * 1_000);
}

function countNodeProcesses(): number {
  if (process.platform !== 'win32') return 0;
  try {
    const output = execSync(
      'powershell -NoProfile -Command "(Get-Process node -ErrorAction SilentlyContinue | Measure-Object).Count"',
      { encoding: 'utf8', windowsHide: true },
    ).trim();
    return Number(output) || 0;
  } catch {
    return 0;
  }
}

export function runWindowsProcessCleanupStaticChecks(checks: WindowsProcessCleanupCheck[]): void {
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };
  const teardown = readFileSync(join(ROOT, 'src/one-prompt-live-preview/child-process-teardown.ts'), 'utf8');
  const devServer = readFileSync(join(ROOT, 'src/one-prompt-live-preview/generated-dev-server-manager.ts'), 'utf8');
  const production = readFileSync(
    join(ROOT, 'src/production-validation/production-validation-runner.ts'),
    'utf8',
  );
  const runtimeEngine = readFileSync(
    join(ROOT, 'src/connected-runtime-execution/runtime-activation-engine.ts'),
    'utf8',
  );
  const startupProbe = readFileSync(
    join(ROOT, 'src/runtime-startup-proof-repair/runtime-startup-probe.mjs'),
    'utf8',
  );
  const codeGenValidator = readFileSync(
    join(ROOT, 'scripts/validate-code-generation-engine-v1.ts'),
    'utf8',
  );
  const directBuildProof = readFileSync(join(ROOT, 'scripts/direct-build-proof-task-tracker.ts'), 'utf8');
  const spawnModule = readFileSync(join(ROOT, 'src/windows-process-cleanup/managed-process-spawn.ts'), 'utf8');
  const portModule = readFileSync(join(ROOT, 'src/windows-process-cleanup/port-process-killer.ts'), 'utf8');
  const exitGuard = readFileSync(join(ROOT, 'src/windows-process-cleanup/process-exit-guard.ts'), 'utf8');

  assertWindowsProcessCleanupCheck(
    checks,
    'static.npm script',
    Boolean(pkg.scripts?.['validate:windows-process-cleanup']),
    'validate:windows-process-cleanup',
  );
  assertWindowsProcessCleanupCheck(
    checks,
    'static.module exists',
    existsSync(join(ROOT, 'src/windows-process-cleanup/index.ts')),
    'windows-process-cleanup',
  );
  assertWindowsProcessCleanupCheck(
    checks,
    'static.teardown delegates to cleanup module',
    teardown.includes('../windows-process-cleanup/index.js'),
    'child-process-teardown',
  );
  assertWindowsProcessCleanupCheck(
    checks,
    'static.dev server port cleanup',
    devServer.includes('killProcessesByPort') && devServer.includes('settleEventLoop'),
    'generated-dev-server-manager',
  );
  assertWindowsProcessCleanupCheck(
    checks,
    'static.production validation cleanup',
    production.includes('killProcessesByPort') && production.includes('settleEventLoop'),
    'production-validation-runner',
  );
  assertWindowsProcessCleanupCheck(
    checks,
    'static.spawn tracks PID and drains streams',
    spawnModule.includes('registerManagedProcess') &&
      spawnModule.includes("child.stdout?.on('data'") &&
      spawnModule.includes('waitForChildClose'),
    'managed-process-spawn',
  );
  assertWindowsProcessCleanupCheck(
    checks,
    'static.port killer uses taskkill tree on Windows',
    portModule.includes("spawn('taskkill'") && portModule.includes('/T'),
    'port-process-killer',
  );
  assertWindowsProcessCleanupCheck(
    checks,
    'static.safe exit awaits cleanup',
    exitGuard.includes('awaitManagedProcessCleanup') && exitGuard.includes('safeProcessExit'),
    'process-exit-guard',
  );
  assertWindowsProcessCleanupCheck(
    checks,
    'static.no app-specific hardcoding',
    !spawnModule.includes('expense-tracker') &&
      !portModule.includes('task-tracker') &&
      !devServer.includes('isOnePromptBuildPrompt'),
    'generic cleanup',
  );
  assertWindowsProcessCleanupCheck(
    checks,
    'static.runtime activation tree kill',
    runtimeEngine.includes('killChildProcessTree') && runtimeEngine.includes('await cleanupActiveRuntime'),
    'runtime-activation-engine',
  );
  assertWindowsProcessCleanupCheck(
    checks,
    'static.probe subprocess tree kill',
    startupProbe.includes('kill-child-process-tree.mjs') &&
      startupProbe.includes('await killChildProcessTree(child)'),
    'runtime-startup-probe',
  );
  assertWindowsProcessCleanupCheck(
    checks,
    'static.validator managed vite lifecycle',
    codeGenValidator.includes('startGeneratedAppDevServer') &&
      codeGenValidator.includes('resetGeneratedDevServerManagerForTests') &&
      !codeGenValidator.includes("spawnSync('npm', ['run', 'dev']"),
    'validate-code-generation-engine-v1',
  );
  assertWindowsProcessCleanupCheck(
    checks,
    'static.direct build proof managed dev server',
    directBuildProof.includes('startGeneratedAppDevServer') &&
      directBuildProof.includes('killProcessesByPort') &&
      !directBuildProof.includes("spawnSync(viteRuntime ? 'npm' : 'node', devArgs"),
    'direct-build-proof-task-tracker',
  );
}

export async function runWindowsProcessCleanupEngineChecks(
  checks: WindowsProcessCleanupCheck[],
): Promise<void> {
  resetManagedProcessRegistryForTests();

  const port = pickEphemeralPort();
  const serverScript = `require('http').createServer((req,res)=>{res.end('ok');}).listen(${port},'127.0.0.1',()=>{console.log('listening ${port}');});`;

  const handle = spawnManagedProcess({
    label: 'preview-smoke-server',
    executable: process.execPath,
    args: ['-e', serverScript],
  });

  assertWindowsProcessCleanupCheck(checks, 'engine.spawn pid tracked', handle.pid != null, String(handle.pid));

  let listening = false;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (isPortListening(port)) {
      listening = true;
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  assertWindowsProcessCleanupCheck(checks, 'engine.preview port listening', listening, String(port));

  const stopResult = await handle.stop();
  assertWindowsProcessCleanupCheck(
    checks,
    'engine.preview graceful stop attempted',
    stopResult.graceful || stopResult.forced,
    `graceful=${stopResult.graceful} forced=${stopResult.forced}`,
  );

  if (isPortListening(port)) {
    await killProcessesByPort(port);
  }
  await settleEventLoop();

  assertWindowsProcessCleanupCheck(
    checks,
    'engine.preview port released',
    !isPortListening(port),
    findPortListeners(port).pids.join(',') || 'free',
  );

  const baselineNodes = countNodeProcesses();
  for (let cycle = 0; cycle < 3; cycle += 1) {
    const cyclePort = pickEphemeralPort();
    const cycleScript = `require('http').createServer((req,res)=>{res.end('ok');}).listen(${cyclePort},'127.0.0.1');`;
    const cycleHandle = spawnManagedProcess({
      label: `preview-cycle-${cycle}`,
      executable: process.execPath,
      args: ['-e', cycleScript],
    });
    await new Promise((resolve) => setTimeout(resolve, 150));
    await cycleHandle.stop();
    if (isPortListening(cyclePort)) {
      await killProcessesByPort(cyclePort);
    }
    await settleEventLoop();
  }

  await stopAllTrackedManagedProcesses();
  await settleEventLoop();

  const afterNodes = countNodeProcesses();
  assertWindowsProcessCleanupCheck(
    checks,
    'engine.repeated runs no orphan growth',
    afterNodes <= baselineNodes + 1,
    `before=${baselineNodes} after=${afterNodes}`,
  );
}

export function runWindowsProcessCleanupSubprocessChecks(checks: WindowsProcessCleanupCheck[]): void {
  const script = join(ROOT, 'scripts/validate-windows-process-cleanup-v1.ts');
  const tsxCli = join(ROOT, 'node_modules', 'tsx', 'dist', 'cli.mjs');
  const smoke = spawnSync(process.execPath, [tsxCli, script, '--smoke-exit'], {
    cwd: ROOT,
    encoding: 'utf8',
    env: process.env,
    windowsHide: true,
    timeout: 90_000,
  });

  const combined = `${smoke.stdout ?? ''}\n${smoke.stderr ?? ''}`;
  assertWindowsProcessCleanupCheck(
    checks,
    'subprocess.smoke exit code',
    smoke.status === 0,
    String(smoke.status),
  );
  assertWindowsProcessCleanupCheck(
    checks,
    'subprocess.no UV_HANDLE_CLOSING assertion',
    !combined.includes('UV_HANDLE_CLOSING'),
    combined.includes('UV_HANDLE_CLOSING') ? 'assertion present' : 'clean',
  );
}

export async function runWindowsProcessCleanupValidation(): Promise<{
  checks: WindowsProcessCleanupCheck[];
  allPassed: boolean;
}> {
  const checks: WindowsProcessCleanupCheck[] = [];
  runWindowsProcessCleanupStaticChecks(checks);
  await runWindowsProcessCleanupEngineChecks(checks);
  if (process.platform === 'win32') {
    runWindowsProcessCleanupSubprocessChecks(checks);
  } else {
    assertWindowsProcessCleanupCheck(
      checks,
      'subprocess.windows-only smoke',
      true,
      'skipped on non-Windows host',
    );
  }
  return {
    checks,
    allPassed: checks.every((check) => check.passed),
  };
}

export function printWindowsProcessCleanupResults(checks: WindowsProcessCleanupCheck[]): number {
  let passed = 0;
  for (const check of checks) {
    console.log(`${check.passed ? 'PASS' : 'FAIL'} ${check.name}: ${check.detail}`);
    if (check.passed) passed += 1;
  }
  console.log('');
  console.log(`${passed}/${checks.length} checks passed`);
  return passed;
}

export async function runWindowsProcessCleanupSmokeExit(): Promise<void> {
  resetManagedProcessRegistryForTests();
  const port = pickEphemeralPort();
  const handle = spawnManagedProcess({
    label: 'smoke-exit-preview',
    executable: process.execPath,
    args: [
      '-e',
      `require('http').createServer((req,res)=>{res.end('ok');}).listen(${port},'127.0.0.1');`,
    ],
  });
  await new Promise((resolve) => setTimeout(resolve, 200));
  await handle.stop();
  if (isPortListening(port)) {
    await killProcessesByPort(port);
  }
  await awaitManagedProcessCleanup();
  await safeProcessExit(0);
}

export { WINDOWS_PROCESS_CLEANUP_V1_PASS_TOKEN };
