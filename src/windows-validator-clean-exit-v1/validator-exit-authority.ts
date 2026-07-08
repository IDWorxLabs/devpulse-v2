/**
 * Windows Validator Clean Exit V1 — deterministic validator runtime shutdown.
 */

import type { Server } from 'node:http';
import {
  awaitManagedProcessCleanup,
  safeProcessExit,
  settleEventLoop,
} from '../windows-process-cleanup/index.js';
import type { ValidatorCleanExitOptions } from './windows-validator-clean-exit-types.js';
import {
  closeHttpServerSafely,
  closeRegisteredValidatorHttpServers,
} from './validator-http-server-shutdown.js';

async function closeUndiciGlobalDispatcher(): Promise<void> {
  for (const specifier of ['node:undici', 'undici'] as const) {
    try {
      const undici = await import(specifier);
      const dispatcher = undici.getGlobalDispatcher?.();
      if (!dispatcher) continue;
      if (typeof dispatcher.close === 'function') {
        await dispatcher.close();
      }
      if (typeof dispatcher.destroy === 'function') {
        await dispatcher.destroy();
      }
      break;
    } catch {
      /* try next undici entrypoint */
    }
  }
}

export async function settleValidatorEventLoop(): Promise<void> {
  await settleEventLoop();
  if (process.platform === 'win32') {
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    await settleEventLoop();
    await new Promise<void>((resolve) => setTimeout(resolve, 25));
    await settleEventLoop();
  }
}

export async function shutdownValidatorRuntime(options: ValidatorCleanExitOptions = {}): Promise<void> {
  if (options.closeUndici !== false) {
    await closeUndiciGlobalDispatcher();
  }
  const servers = options.servers ?? [];
  for (const server of servers) {
    await closeHttpServerSafely(server);
  }
  await closeRegisteredValidatorHttpServers();
  await awaitManagedProcessCleanup();
  await settleValidatorEventLoop();
}

export async function exitValidator(
  code: number,
  options: ValidatorCleanExitOptions = {},
): Promise<void> {
  await shutdownValidatorRuntime(options);
  process.exitCode = code;
  if (process.platform === 'win32') {
    await new Promise<void>((resolve) => setTimeout(resolve, 150));
    await settleValidatorEventLoop();
    if (code === 0) {
      return;
    }
  }
  await safeProcessExit(code);
}

export async function startValidatorHttpServer(
  createServer: () => Server,
  host = '127.0.0.1',
): Promise<{ server: Server; baseUrl: string; close: () => Promise<void> }> {
  const server = createServer();
  await new Promise<void>((resolve, reject) => {
    const onError = (err: Error) => reject(err);
    server.once('error', onError);
    server.listen(0, host, () => {
      server.off('error', onError);
      resolve();
    });
  });
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Failed to bind validator HTTP server');
  }
  const baseUrl = `http://${host}:${address.port}`;
  return {
    server,
    baseUrl,
    close: async () => {
      await closeHttpServerSafely(server);
    },
  };
}
