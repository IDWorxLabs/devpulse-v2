/**
 * Command Center Restart Resilience V1 — pure readiness logic.
 * Current health beats stale error state.
 */

import type { BrainHealthPayload, HealthPollPlan, RuntimeReadinessLifecycle } from './restart-resilience-types.js';
import { HEALTH_POLL_WINDOW_MS } from './restart-resilience-types.js';

export const STALE_RUNTIME_ERROR_PATTERNS = [
  /local runtime is stale or unavailable/i,
  /local runtime not ready/i,
  /restart using start-aidevengine/i,
  /brain health endpoint unreachable/i,
  /local runtime unavailable/i,
  /brain health check failed/i,
  /brain could not respond/i,
] as const;

export const STALE_RUNTIME_CHAT_PATTERNS = [
  /local runtime is stale or unavailable/i,
  /local runtime not ready/i,
  /brain could not respond/i,
  /restart using start-aidevengine/i,
] as const;

export function isLocalRuntimeHealthPayloadOk(payload: BrainHealthPayload | null | undefined): boolean {
  return (
    Boolean(payload) &&
    payload!.postAllowed === true &&
    payload!.serverCapability === 'command-center-brain-v11.1a' &&
    payload!.buildIntentRouting === true &&
    payload!.registryLoaded === true &&
    payload!.runtimeReady === true
  );
}

export function isStaleRuntimeErrorText(text: string | null | undefined): boolean {
  if (!text || text === 'None') return false;
  return STALE_RUNTIME_ERROR_PATTERNS.some((pattern) => pattern.test(text));
}

export function isStaleRuntimeChatText(text: string | null | undefined): boolean {
  if (!text) return false;
  return STALE_RUNTIME_CHAT_PATTERNS.some((pattern) => pattern.test(text));
}

export function shouldClearStaleErrorOnHealthy(lastError: string | null | undefined): boolean {
  return isStaleRuntimeErrorText(lastError) || lastError === 'None' || !lastError;
}

export function resolveLifecycleFromHealth(input: {
  healthOk: boolean;
  payload: BrainHealthPayload | null;
  elapsedMs: number;
  pollWindowMs?: number;
}): RuntimeReadinessLifecycle {
  const windowMs = input.pollWindowMs ?? HEALTH_POLL_WINDOW_MS;
  if (input.healthOk) return 'READY';
  if (input.elapsedMs >= windowMs) return 'UNAVAILABLE';
  if (
    input.payload &&
    input.payload.registryLoaded === true &&
    input.payload.runtimeReady !== true
  ) {
    return 'DEGRADED';
  }
  return 'CHECKING_HEALTH';
}

export function planHealthPoll(input: {
  healthOk: boolean;
  attempt: number;
  elapsedMs: number;
  pollWindowMs?: number;
}): HealthPollPlan {
  const windowMs = input.pollWindowMs ?? HEALTH_POLL_WINDOW_MS;
  if (input.healthOk) {
    return { shouldContinue: false, nextDelayMs: 0 };
  }
  if (input.elapsedMs >= windowMs) {
    return { shouldContinue: false, nextDelayMs: 0 };
  }
  const nextDelayMs = Math.min(400 + input.attempt * 350, 1500);
  const remaining = windowMs - input.elapsedMs;
  return {
    shouldContinue: remaining > 0,
    nextDelayMs: Math.min(nextDelayMs, remaining),
  };
}

export function runtimeRequestsAllowed(lifecycle: RuntimeReadinessLifecycle): boolean {
  return lifecycle === 'READY';
}

export function shouldShowRuntimeBanner(lifecycle: RuntimeReadinessLifecycle): boolean {
  return lifecycle === 'UNAVAILABLE';
}

export function mergeStatusBarWithCurrentHealth(input: {
  lifecycle: RuntimeReadinessLifecycle;
  existingItems: readonly string[];
}): string[] {
  const filtered = input.existingItems.filter(
    (item) =>
      !/local runtime connected/i.test(item) &&
      !/runtime unavailable/i.test(item) &&
      !/runtime degraded/i.test(item),
  );
  if (input.lifecycle === 'READY') {
    return ['AiDevEngine local runtime connected', ...filtered];
  }
  if (input.lifecycle === 'UNAVAILABLE') {
    return ['AiDevEngine runtime unavailable', ...filtered];
  }
  if (input.lifecycle === 'DEGRADED' || input.lifecycle === 'CHECKING_HEALTH') {
    return ['AiDevEngine runtime health check in progress', ...filtered];
  }
  return filtered.length ? [...filtered] : ['Starting AiDevEngine runtime'];
}
