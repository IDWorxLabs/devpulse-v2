/**
 * General Windows Process Cleanup V1 — stream drain and child handle disposal.
 */

import type { ChildProcess } from 'node:child_process';

export function drainChildStream(stream: NodeJS.ReadableStream | null | undefined): void {
  if (!stream) return;
  stream.removeAllListeners();
  stream.resume();
  if ('destroy' in stream && typeof stream.destroy === 'function') {
    stream.destroy();
  }
}

export function detachChildStreams(child: ChildProcess): void {
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

export async function settleEventLoop(): Promise<void> {
  await new Promise<void>((resolve) => setImmediate(resolve));
  await new Promise<void>((resolve) => setImmediate(resolve));
}

export async function waitForChildClose(
  child: ChildProcess,
  timeoutMs: number,
): Promise<{ exitCode: number | null; signal: NodeJS.Signals | null; timedOut: boolean }> {
  if (child.exitCode !== null || child.signalCode !== null) {
    return { exitCode: child.exitCode, signal: child.signalCode, timedOut: false };
  }

  return new Promise((resolve) => {
    let settled = false;
    const finish = (result: { exitCode: number | null; signal: NodeJS.Signals | null; timedOut: boolean }) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(result);
    };

    const timer = setTimeout(() => finish({ exitCode: child.exitCode, signal: child.signalCode, timedOut: true }), timeoutMs);

    child.once('close', (code, signal) => {
      finish({ exitCode: code, signal, timedOut: false });
    });
  });
}
