/**
 * General Windows Process Cleanup V1 — spawn, track, and stop managed child processes.
 */

import { spawn, type ChildProcess } from 'node:child_process';
import {
  detachChildStreams,
  settleEventLoop,
  waitForChildClose,
} from './child-stream-utils.js';
import {
  registerManagedProcess,
  unregisterManagedProcess,
} from './managed-process-registry.js';
import { killProcessTreeByPid } from './port-process-killer.js';
import type {
  ManagedProcessHandle,
  ManagedProcessStopResult,
  SpawnManagedProcessOptions,
} from './windows-process-cleanup-types.js';
import {
  DEFAULT_FORCE_STOP_MS,
  DEFAULT_GRACEFUL_STOP_MS,
} from './windows-process-cleanup-types.js';

async function stopChildProcess(
  child: ChildProcess,
  options?: { gracefulStopMs?: number; forceStopMs?: number },
): Promise<ManagedProcessStopResult> {
  const gracefulStopMs = options?.gracefulStopMs ?? DEFAULT_GRACEFUL_STOP_MS;
  const forceStopMs = options?.forceStopMs ?? DEFAULT_FORCE_STOP_MS;
  const pid = child.pid ?? null;

  if (child.exitCode !== null || child.signalCode !== null) {
    detachChildStreams(child);
    return {
      pid,
      exitCode: child.exitCode,
      signal: child.signalCode,
      graceful: true,
      forced: false,
      timedOut: false,
    };
  }

  if (!pid) {
    detachChildStreams(child);
    return {
      pid: null,
      exitCode: child.exitCode,
      signal: child.signalCode,
      graceful: true,
      forced: false,
      timedOut: false,
    };
  }

  let graceful = false;
  let forced = false;

  try {
    const gracefulOk = child.kill('SIGTERM');
    graceful = gracefulOk;
  } catch {
    /* ignore */
  }

  let closeResult = await waitForChildClose(child, gracefulStopMs);
  if (!closeResult.timedOut && (child.exitCode !== null || child.signalCode !== null)) {
    detachChildStreams(child);
    await settleEventLoop();
    return {
      pid,
      exitCode: closeResult.exitCode,
      signal: closeResult.signal,
      graceful: true,
      forced: false,
      timedOut: false,
    };
  }

  await killProcessTreeByPid(pid, { forceStopMs });
  forced = true;
  closeResult = await waitForChildClose(child, forceStopMs);
  detachChildStreams(child);
  await settleEventLoop();

  return {
    pid,
    exitCode: closeResult.exitCode ?? child.exitCode,
    signal: closeResult.signal ?? child.signalCode,
    graceful,
    forced,
    timedOut: closeResult.timedOut,
  };
}

export function spawnManagedProcess(options: SpawnManagedProcessOptions): ManagedProcessHandle {
  const label = options.label ?? `${options.executable} ${options.args.join(' ')}`.trim();
  const stdioMode = options.stdio ?? 'pipe';
  const child = spawn(options.executable, [...options.args], {
    cwd: options.cwd,
    env: options.env ?? process.env,
    stdio: stdioMode === 'pipe' ? ['ignore', 'pipe', 'pipe'] : ['ignore', 'ignore', 'ignore'],
    windowsHide: true,
  });

  let stdout = '';
  let stderr = '';

  child.stdout?.on('data', (chunk) => {
    stdout += String(chunk);
  });
  child.stderr?.on('data', (chunk) => {
    stderr += String(chunk);
  });

  const handle: ManagedProcessHandle = {
    label,
    pid: child.pid ?? null,
    child,
    stdout,
    stderr,
    startedAt: Date.now(),
    stop: async (stopOptions) => {
      const result = await stopChildProcess(child, stopOptions);
      unregisterManagedProcess(handle);
      return result;
    },
  };

  Object.defineProperty(handle, 'stdout', {
    get: () => stdout,
  });
  Object.defineProperty(handle, 'stderr', {
    get: () => stderr,
  });

  registerManagedProcess(handle);
  return handle;
}

export async function killChildProcessTree(
  child: ChildProcess,
  options?: { gracefulStopMs?: number; forceStopMs?: number },
): Promise<ManagedProcessStopResult> {
  return stopChildProcess(child, options);
}

export { stopChildProcess as stopManagedChildProcess };
