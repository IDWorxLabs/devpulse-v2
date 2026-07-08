/**
 * Shared validator clean-exit helpers for scripts.
 */

import { invalidateProjectRegistryV1Cache } from '../../src/project-registry-v1/index.js';
import {
  exitValidator,
  registerValidatorHttpServer,
  settleValidatorEventLoop,
  shutdownValidatorRuntime,
  startValidatorHttpServer,
  type ValidatorCleanExitOptions,
} from '../../src/windows-validator-clean-exit-v1/index.js';
import { createFounderRealityServer } from '../../server/founder-reality-server.js';

export {
  exitValidator,
  registerValidatorHttpServer,
  settleValidatorEventLoop,
  shutdownValidatorRuntime,
  startValidatorHttpServer,
  type ValidatorCleanExitOptions,
};

export async function startFounderRealityValidatorServer(
  testRoot?: string,
): Promise<{ server: import('node:http').Server; baseUrl: string; close: () => Promise<void> }> {
process.env.AIDEVENGINE_RUNTIME_AUTHORITY_BYPASS = '1';
  if (testRoot) {
    process.env.AIDEVENGINE_REGISTRY_ROOT = testRoot;
    invalidateProjectRegistryV1Cache();
  }
  const handle = await startValidatorHttpServer(createFounderRealityServer);
  registerValidatorHttpServer(handle.server);
  return handle;
}

export async function finishValidator(
  code: number,
  options: ValidatorCleanExitOptions = {},
): Promise<void> {
  return exitValidator(code, options);
}
