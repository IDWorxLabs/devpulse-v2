/**
 * Windows-safe child process spawn and teardown helpers.
 * Delegates lifecycle management to windows-process-cleanup V1.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { spawnSync, type SpawnSyncReturns } from 'node:child_process';

export {
  killChildProcessTree,
  settleEventLoop,
  spawnManagedProcess,
  killProcessesByPort,
  isPortListening,
  awaitManagedProcessCleanup,
  safeProcessExit,
  stopAllTrackedManagedProcesses,
  detachChildStreams,
} from '../windows-process-cleanup/index.js';

function bundledNpmCliPath(): string | null {
  const cliPath = join(dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js');
  return existsSync(cliPath) ? cliPath : null;
}

export function resolveNpmSpawnTarget(args: readonly string[]): { executable: string; args: string[] } {
  if (process.platform === 'win32') {
    const npmCli = bundledNpmCliPath();
    if (npmCli) {
      return { executable: process.execPath, args: [npmCli, ...args] };
    }
    return { executable: 'npm.cmd', args: [...args] };
  }
  return { executable: 'npm', args: [...args] };
}

export function runNpmCommandSync(input: {
  cwd: string;
  args: readonly string[];
  timeoutMs?: number;
  maxBuffer?: number;
}): SpawnSyncReturns<string> {
  const target = resolveNpmSpawnTarget(input.args);
  return spawnSync(target.executable, target.args, {
    cwd: input.cwd,
    encoding: 'utf8',
    shell: false,
    timeout: input.timeoutMs,
    windowsHide: true,
    maxBuffer: input.maxBuffer ?? 10 * 1024 * 1024,
  });
}

export function runNpmRunScriptSync(input: {
  cwd: string;
  script: string;
  timeoutMs?: number;
}): SpawnSyncReturns<string> {
  return runNpmCommandSync({
    cwd: input.cwd,
    args: ['run', input.script],
    timeoutMs: input.timeoutMs,
  });
}

export function resolveViteDevSpawnTarget(workspaceDir: string): { executable: string; args: string[] } | null {
  const viteBin = join(workspaceDir, 'node_modules', 'vite', 'bin', 'vite.js');
  if (!existsSync(viteBin)) return null;
  return { executable: process.execPath, args: [viteBin] };
}
