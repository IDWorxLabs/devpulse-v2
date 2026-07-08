/**
 * General Windows Process Cleanup V1 — public API.
 */

export {
  WINDOWS_PROCESS_CLEANUP_V1_PASS_TOKEN,
  DEFAULT_GRACEFUL_STOP_MS,
  DEFAULT_FORCE_STOP_MS,
  type ManagedProcessHandle,
  type ManagedProcessStopResult,
  type PortListenerInfo,
  type SpawnManagedProcessOptions,
} from './windows-process-cleanup-types.js';

export {
  drainChildStream,
  detachChildStreams,
  settleEventLoop,
  waitForChildClose,
} from './child-stream-utils.js';

export {
  registerManagedProcess,
  unregisterManagedProcess,
  listTrackedManagedProcesses,
  stopAllTrackedManagedProcesses,
  resetManagedProcessRegistryForTests,
} from './managed-process-registry.js';

export {
  spawnManagedProcess,
  killChildProcessTree,
  stopManagedChildProcess,
} from './managed-process-spawn.js';

export {
  findPortListeners,
  killProcessTreeByPid,
  killProcessesByPort,
  isPortListening,
} from './port-process-killer.js';

export {
  awaitManagedProcessCleanup,
  safeProcessExit,
  isProcessExitInFlight,
} from './process-exit-guard.js';
