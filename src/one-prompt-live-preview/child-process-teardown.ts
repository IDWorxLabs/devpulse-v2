/**
 * Windows-safe child process spawn and teardown helpers.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { spawn, spawnSync, type ChildProcess, type SpawnSyncReturns } from 'node:child_process';

const DEFAULT_KILL_TIMEOUT_MS = 8_000;

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

export function detachChildStreams(child: ChildProcess): void {
  child.stdout?.removeAllListeners();
  child.stderr?.removeAllListeners();
  child.stdin?.removeAllListeners();
  child.removeAllListeners();
  child.stdout?.destroy();
  child.stderr?.destroy();
  child.stdin?.destroy();
}

export async function killChildProcessTree(
  child: ChildProcess,
  options?: { timeoutMs?: number },
): Promise<void> {
  const timeoutMs = options?.timeoutMs ?? DEFAULT_KILL_TIMEOUT_MS;
  if (child.exitCode !== null || child.signalCode !== null) {
    detachChildStreams(child);
    return;
  }
  if (!child.pid) {
    detachChildStreams(child);
    return;
  }

  await new Promise<void>((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve();
    };

    const timer = setTimeout(finish, timeoutMs);
    child.once('exit', finish);

    try {
      if (process.platform === 'win32') {
        const killer = spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], {
          stdio: 'ignore',
          windowsHide: true,
        });
        killer.once('exit', finish);
        killer.once('error', finish);
      } else {
        child.kill('SIGTERM');
      }
    } catch {
      finish();
    }
  });

  detachChildStreams(child);
}

export async function settleEventLoop(): Promise<void> {
  await new Promise<void>((resolve) => setImmediate(resolve));
}
