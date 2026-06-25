/**
 * Local Runtime Launcher V1 — desktop-friendly local server lifecycle.
 */

export {
  LOCAL_RUNTIME_LAUNCHER_VERSION,
  LOCAL_RUNTIME_LAUNCHER_PASS_TOKEN,
  configureLocalRuntimeMetadata,
  getLocalRuntimeServerState,
  isLocalRuntimeHealthStale,
  isLocalRuntimeReady,
  markLocalRuntimeRegistryFailed,
  markLocalRuntimeRegistryReady,
  type LocalRuntimeServerState,
} from './local-runtime-server-state.js';

export {
  buildLocalRuntimeHealthPayload,
  type LocalRuntimeHealthPayload,
} from './local-runtime-health.js';
