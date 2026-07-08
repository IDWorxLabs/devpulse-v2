/**
 * General Windows Process Cleanup V1 — ESM bridge for .mjs probe subprocesses.
 */

import { spawn } from 'node:child_process';

const DEFAULT_GRACEFUL_STOP_MS = 3_000;
const DEFAULT_FORCE_STOP_MS = 8_000;

export function drainChildStream(stream) {
  if (!stream) return;
  stream.removeAllListeners();
  stream.resume();
  if (typeof stream.destroy === 'function') {
    stream.destroy();
  }
}

export function detachChildStreams(child) {
  child.removeAllListeners();
  drainChildStream(child.stdout);
  drainChildStream(child.stderr);
  if (child.stdin) {
    child.stdin.removeAllListeners();
    if (typeof child.stdin.destroy === 'function') {
      child.stdin.destroy();
    }
  }
}

export async function settleEventLoop() {
  await new Promise((resolve) => setImmediate(resolve));
  await new Promise((resolve) => setImmediate(resolve));
}

export function waitForChildClose(child, timeoutMs) {
  if (child.exitCode !== null || child.signalCode !== null) {
    return Promise.resolve({
      exitCode: child.exitCode,
      signal: child.signalCode,
      timedOut: false,
    });
  }

  return new Promise((resolve) => {
    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(result);
    };

    const timer = setTimeout(
      () => finish({ exitCode: child.exitCode, signal: child.signalCode, timedOut: true }),
      timeoutMs,
    );

    child.once('close', (code, signal) => {
      finish({ exitCode: code, signal, timedOut: false });
    });
  });
}

async function runTaskKillTree(pid, timeoutMs) {
  if (process.platform !== 'win32') return;

  await new Promise((resolve) => {
    const killer = spawn('taskkill', ['/PID', String(pid), '/T', '/F'], {
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

export async function killChildProcessTree(child, options = {}) {
  const gracefulStopMs = options.gracefulStopMs ?? DEFAULT_GRACEFUL_STOP_MS;
  const forceStopMs = options.forceStopMs ?? DEFAULT_FORCE_STOP_MS;
  const pid = child.pid ?? null;

  if (child.exitCode !== null || child.signalCode !== null) {
    detachChildStreams(child);
    return { pid, graceful: true, forced: false, timedOut: false };
  }

  if (!pid) {
    detachChildStreams(child);
    return { pid: null, graceful: true, forced: false, timedOut: false };
  }

  try {
    child.kill('SIGTERM');
  } catch {
    /* ignore */
  }

  let closeResult = await waitForChildClose(child, gracefulStopMs);
  if (!closeResult.timedOut && (child.exitCode !== null || child.signalCode !== null)) {
    detachChildStreams(child);
    await settleEventLoop();
    return { pid, graceful: true, forced: false, timedOut: false };
  }

  if (process.platform === 'win32') {
    await runTaskKillTree(pid, forceStopMs);
  } else {
    try {
      process.kill(pid, 'SIGKILL');
    } catch {
      /* already exited */
    }
  }

  closeResult = await waitForChildClose(child, forceStopMs);
  detachChildStreams(child);
  await settleEventLoop();

  return {
    pid,
    graceful: true,
    forced: true,
    timedOut: closeResult.timedOut,
  };
}
