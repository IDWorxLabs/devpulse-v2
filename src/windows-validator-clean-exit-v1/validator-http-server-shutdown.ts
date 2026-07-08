/**
 * Windows Validator Clean Exit V1 — idempotent HTTP server shutdown for validators.
 */

import type { Server } from 'node:http';
import { settleEventLoop } from '../windows-process-cleanup/child-stream-utils.js';

const closedServers = new WeakSet<Server>();
const registeredServers = new Set<Server>();

export function registerValidatorHttpServer(server: Server): void {
  registeredServers.add(server);
}

export function unregisterValidatorHttpServer(server: Server): void {
  registeredServers.delete(server);
}

function isServerNotRunningError(err: unknown): boolean {
  return (
    err instanceof Error &&
    'code' in err &&
    (err as NodeJS.ErrnoException).code === 'ERR_SERVER_NOT_RUNNING'
  );
}

export async function closeHttpServerSafely(server: Server | null | undefined): Promise<void> {
  if (!server || closedServers.has(server)) {
    return;
  }

  closedServers.add(server);
  registeredServers.delete(server);

  if (!server.listening) {
    server.removeAllListeners();
    return;
  }

  try {
    if (typeof server.closeAllConnections === 'function') {
      server.closeAllConnections();
    }
    if (typeof server.closeIdleConnections === 'function') {
      server.closeIdleConnections();
    }
  } catch {
    /* ignore connection teardown errors during validator shutdown */
  }

  await new Promise<void>((resolve, reject) => {
    server.close((err) => {
      if (!err || isServerNotRunningError(err)) {
        resolve();
        return;
      }
      reject(err);
    });
  });

  server.removeAllListeners();
  await settleEventLoop();
}

export async function closeRegisteredValidatorHttpServers(): Promise<void> {
  const servers = [...registeredServers];
  registeredServers.clear();
  for (const server of servers) {
    await closeHttpServerSafely(server);
  }
}

export function resetValidatorHttpServerRegistryForTests(): void {
  registeredServers.clear();
}
