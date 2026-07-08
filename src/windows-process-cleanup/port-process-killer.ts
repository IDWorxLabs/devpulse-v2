/**
 * General Windows Process Cleanup V1 — port listener discovery and orphan cleanup.
 */

import { execSync, spawn, type ChildProcess } from 'node:child_process';
import { detachChildStreams, settleEventLoop, waitForChildClose } from './child-stream-utils.js';
import type { PortListenerInfo } from './windows-process-cleanup-types.js';
import { DEFAULT_FORCE_STOP_MS } from './windows-process-cleanup-types.js';

export function findPortListeners(port: number): PortListenerInfo {
  const pids = new Set<number>();

  if (process.platform === 'win32') {
    try {
      const output = execSync(`netstat -ano | findstr ":${port}"`, { encoding: 'utf8', windowsHide: true });
      for (const line of output.split('\n')) {
        if (!/LISTENING/i.test(line)) continue;
        const parts = line.trim().split(/\s+/);
        const pid = Number(parts[parts.length - 1]);
        if (Number.isFinite(pid) && pid > 0) pids.add(pid);
      }
    } catch {
      /* no listeners */
    }
  } else {
    try {
      const output = execSync(`lsof -ti :${port}`, { encoding: 'utf8' });
      for (const line of output.split('\n')) {
        const pid = Number(line.trim());
        if (Number.isFinite(pid) && pid > 0) pids.add(pid);
      }
    } catch {
      /* no listeners */
    }
  }

  return {
    port,
    pids: [...pids],
    listening: pids.size > 0,
  };
}

async function runTaskKillTree(pid: number, timeoutMs: number): Promise<void> {
  if (process.platform !== 'win32') return;

  await new Promise<void>((resolve) => {
    const killer: ChildProcess = spawn('taskkill', ['/PID', String(pid), '/T', '/F'], {
      stdio: 'ignore',
      windowsHide: true,
    });

    const finish = () => {
      void waitForChildClose(killer, timeoutMs).finally(() => {
        detachChildStreams(killer);
        resolve();
      });
    };

    killer.once('error', finish);
    killer.once('spawn', () => {
      killer.once('close', finish);
    });
    setTimeout(finish, timeoutMs);
  });
}

export async function killProcessTreeByPid(
  pid: number,
  options?: { gracefulStopMs?: number; forceStopMs?: number },
): Promise<void> {
  const forceStopMs = options?.forceStopMs ?? DEFAULT_FORCE_STOP_MS;

  if (process.platform === 'win32') {
    await runTaskKillTree(pid, forceStopMs);
    await settleEventLoop();
    return;
  }

  try {
    process.kill(pid, 'SIGTERM');
  } catch {
    /* already exited */
  }

  await new Promise<void>((resolve) => setTimeout(resolve, options?.gracefulStopMs ?? 1_000));

  try {
    process.kill(pid, 'SIGKILL');
  } catch {
    /* already exited */
  }

  await settleEventLoop();
}

export async function killProcessesByPort(
  port: number,
  options?: { forceStopMs?: number },
): Promise<number[]> {
  const listeners = findPortListeners(port);
  const killed: number[] = [];

  for (const pid of listeners.pids) {
    if (pid === process.pid) continue;
    await killProcessTreeByPid(pid, options);
    killed.push(pid);
  }

  await settleEventLoop();
  return killed;
}

export function isPortListening(port: number): boolean {
  return findPortListeners(port).listening;
}
