/**
 * Autonomous Runtime Authority V1 — spawn and supervise authoritative server child.
 */

import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

export interface LaunchAuthoritativeServerChildInput {
  repositoryRoot: string;
  port: number;
}

function buildNodeTsxArgs(repositoryRoot: string, serverScript: string): string[] {
  const preflight = join(repositoryRoot, 'node_modules', 'tsx', 'dist', 'preflight.cjs');
  const loader = join(repositoryRoot, 'node_modules', 'tsx', 'dist', 'loader.mjs');
  if (!existsSync(preflight) || !existsSync(loader)) {
    throw new Error('tsx is not installed — run npm install in the repository root');
  }
  return [
    '--require',
    preflight,
    '--import',
    pathToFileURL(loader).href,
    serverScript,
  ];
}

export function launchAuthoritativeServerChild(
  input: LaunchAuthoritativeServerChildInput,
): Promise<ChildProcess> {
  const serverScript = join(input.repositoryRoot, 'server', 'founder-reality-server.ts');
  const args = buildNodeTsxArgs(input.repositoryRoot, serverScript);

  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      cwd: input.repositoryRoot,
      env: {
        ...process.env,
        AIDEVENGINE_RUNTIME_AUTHORITY_PORT: String(input.port),
        AIDEVENGINE_RUNTIME_AUTHORITY_MANAGED: '1',
        AIDEVENGINE_RUNTIME_AUTHORITY_CHILD: '1',
      },
      stdio: 'inherit',
      windowsHide: true,
    });

    const fail = (message: string) => {
      reject(new Error(message));
    };

    child.once('error', (err) => {
      fail(`Failed to spawn authoritative server: ${err.message}`);
    });

    const settle = () => {
      if (!child.pid) {
        fail('Authoritative server child spawned without a PID');
        return;
      }
      resolve(child);
    };

    if (child.pid) {
      settle();
      return;
    }

    child.once('spawn', settle);
  });
}

export function forwardShutdownSignalsToChild(child: ChildProcess): void {
  const forward = (signal: NodeJS.Signals) => {
    if (child.killed || !child.pid) return;
    try {
      child.kill(signal);
    } catch {
      /* child already exited */
    }
  };
  process.on('SIGINT', forward);
  process.on('SIGTERM', forward);
}

export function waitForAuthoritativeServerChildExit(child: ChildProcess): Promise<number> {
  if (child.exitCode !== null) return Promise.resolve(child.exitCode);
  if (child.signalCode) return Promise.resolve(1);
  return new Promise((resolve) => {
    child.once('exit', (code, signal) => {
      if (signal) {
        resolve(1);
        return;
      }
      resolve(code ?? 1);
    });
  });
}

export async function terminateAuthoritativeServerChild(child: ChildProcess): Promise<void> {
  if (child.killed || !child.pid) return;
  child.kill('SIGTERM');
  await Promise.race([
    waitForAuthoritativeServerChildExit(child),
    new Promise((resolve) => setTimeout(resolve, 5_000)),
  ]);
  if (!child.killed && child.pid) {
    child.kill('SIGKILL');
  }
}
