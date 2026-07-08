/**
 * Command Center Restart Resilience V1 — public API.
 */

export {
  COMMAND_CENTER_RESTART_RESILIENCE_V1_PASS_TOKEN,
  COMMAND_CENTER_HEALTH_READY_TRACE,
  COMMAND_CENTER_STALE_ERROR_CLEARED_TRACE,
  STALE_RUNTIME_ERROR_SESSION_KEY,
  HEALTH_POLL_WINDOW_MS,
  SIDEBAR_STATUS_BY_LIFECYCLE,
} from './restart-resilience-types.js';

export type {
  RuntimeReadinessLifecycle,
  BrainHealthPayload,
  HealthPollPlan,
} from './restart-resilience-types.js';

export {
  STALE_RUNTIME_ERROR_PATTERNS,
  STALE_RUNTIME_CHAT_PATTERNS,
  isLocalRuntimeHealthPayloadOk,
  isStaleRuntimeErrorText,
  isStaleRuntimeChatText,
  shouldClearStaleErrorOnHealthy,
  resolveLifecycleFromHealth,
  planHealthPoll,
  runtimeRequestsAllowed,
  shouldShowRuntimeBanner,
  mergeStatusBarWithCurrentHealth,
} from './restart-resilience-engine.js';
