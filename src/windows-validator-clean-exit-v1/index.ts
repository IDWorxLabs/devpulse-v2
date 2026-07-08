/**
 * Windows Validator Clean Exit V1 — public API.
 */

export {
  WINDOWS_VALIDATOR_CLEAN_EXIT_CONTRACT_VERSION,
  WINDOWS_VALIDATOR_CLEAN_EXIT_V1_PASS_TOKEN,
  type ValidatorCleanExitOptions,
  type ValidatorHttpServerHandle,
} from './windows-validator-clean-exit-types.js';

export {
  closeHttpServerSafely,
  closeRegisteredValidatorHttpServers,
  registerValidatorHttpServer,
  resetValidatorHttpServerRegistryForTests,
  unregisterValidatorHttpServer,
} from './validator-http-server-shutdown.js';

export {
  exitValidator,
  settleValidatorEventLoop,
  shutdownValidatorRuntime,
  startValidatorHttpServer,
} from './validator-exit-authority.js';
