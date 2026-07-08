/**
 * Command Center Restart Resilience V1 — types.
 */

export type RuntimeReadinessLifecycle =
  | 'STARTING'
  | 'CHECKING_HEALTH'
  | 'READY'
  | 'DEGRADED'
  | 'UNAVAILABLE';

export interface BrainHealthPayload {
  postAllowed?: boolean;
  serverCapability?: string;
  buildIntentRouting?: boolean;
  registryLoaded?: boolean;
  runtimeReady?: boolean;
  operatorMessage?: string;
  error?: string;
}

export interface HealthPollPlan {
  shouldContinue: boolean;
  nextDelayMs: number;
}

export const COMMAND_CENTER_RESTART_RESILIENCE_V1_PASS_TOKEN =
  'COMMAND_CENTER_RESTART_RESILIENCE_V1_PASS' as const;

export const COMMAND_CENTER_HEALTH_READY_TRACE = 'COMMAND_CENTER_HEALTH_READY' as const;

export const COMMAND_CENTER_STALE_ERROR_CLEARED_TRACE =
  'COMMAND_CENTER_STALE_ERROR_CLEARED' as const;

export const STALE_RUNTIME_ERROR_SESSION_KEY = 'aidevengine.stale-runtime-error.v1' as const;

export const HEALTH_POLL_WINDOW_MS = 10_000;

export const SIDEBAR_STATUS_BY_LIFECYCLE: Record<RuntimeReadinessLifecycle, string> = {
  STARTING: 'Starting AiDevEngine runtime…',
  CHECKING_HEALTH: 'Checking runtime health…',
  READY: 'AiDevEngine local runtime connected',
  DEGRADED: 'AiDevEngine runtime degraded — retrying health',
  UNAVAILABLE: 'AiDevEngine runtime unavailable — restart using Start-AiDevEngine',
};
