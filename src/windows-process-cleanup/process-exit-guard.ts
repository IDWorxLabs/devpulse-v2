/**
 * General Windows Process Cleanup V1 — safe process exit after child handles close.
 */

import { settleEventLoop } from './child-stream-utils.js';
import { stopAllTrackedManagedProcesses } from './managed-process-registry.js';

let exitInFlight = false;

export async function awaitManagedProcessCleanup(): Promise<void> {
  await stopAllTrackedManagedProcesses();
  await settleEventLoop();
}

export async function safeProcessExit(code = 0): Promise<never> {
  if (exitInFlight) {
    await settleEventLoop();
    return process.exit(code) as never;
  }

  exitInFlight = true;
  try {
    await awaitManagedProcessCleanup();
    await settleEventLoop();
  } finally {
    process.exit(code);
  }

  return process.exit(code) as never;
}

export function isProcessExitInFlight(): boolean {
  return exitInFlight;
}
