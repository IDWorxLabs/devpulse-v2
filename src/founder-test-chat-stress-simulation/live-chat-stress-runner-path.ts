/**
 * Phase 26.81 — Live chat stress runner path alignment (V1).
 * Ensures Founder Test product-readiness path uses repaired settlement/completion modules
 * and emits live runtime feed markers.
 */

import {
  forceSettlePendingStartedChatStressScenarios,
  getChatStressCompletionSnapshot,
  getChatStressScenarioLifecycleState,
  getChatStressScenarioLastUpdateTimeMs,
} from './chat-stress-completion-tracker.js';
import { buildChatStressSettlementSummary, isChatStressSimulationComplete } from './chat-stress-settlement-boundary.js';

export const LIVE_CHAT_STRESS_RUNNER_PATH_ALIGNMENT_V1_PASS =
  'LIVE_CHAT_STRESS_RUNNER_PATH_ALIGNMENT_V1_PASS';

export const LIVE_CHAT_STRESS_RUNNER_PATH_MARKER =
  'live-chat-stress-runner-path:repaired-settlement-v1';

export const CHAT_STRESS_RUNNER_IDLE_WITH_PENDING_KIND = 'CHAT_STRESS_RUNNER_IDLE_WITH_PENDING';

/** Documented live Founder Test call chain (read-only). */
export const LIVE_CHAT_STRESS_RUNNER_PATH_CALL_CHAIN = [
  'runFounderTestingModeV4',
  'executeFounderTestLaunchReadinessOrchestration',
  'runFullProductReadinessSimulation',
  'runFounderTestChatStressSimulation',
  'simulateChatStressBatch',
  'simulateChatStressResponse',
  'registerChatStressScenarioHardWatchdog',
  'tryMarkChatStressScenarioSettled',
  'forceSettlePendingStartedChatStressScenarios',
  'buildChatStressSettlementSummary',
  'isChatStressSimulationComplete',
  'chat-stress-completion-propagation registry',
] as const;

export interface ChatStressRunnerIdleWithPending {
  readOnly: true;
  kind: typeof CHAT_STRESS_RUNNER_IDLE_WITH_PENDING_KIND;
  pendingScenarioIds: string[];
  pendingWithoutActiveWorkerScenarioIds: string[];
  lastStateByScenarioId: Readonly<Record<string, string>>;
  lastUpdateTimeByScenarioId: Readonly<Record<string, string | null>>;
  forcedSettlementCount: number;
  detectedAt: string;
}

type IdleWithPendingHandler = (event: ChatStressRunnerIdleWithPending) => void;

let idleWithPendingHandler: IdleWithPendingHandler | null = null;
let lastIdleWithPending: ChatStressRunnerIdleWithPending | null = null;

export function resetLiveChatStressRunnerPathForTests(): void {
  idleWithPendingHandler = null;
  lastIdleWithPending = null;
}

export function registerChatStressRunnerIdleWithPendingHandler(
  handler: IdleWithPendingHandler | null,
): void {
  idleWithPendingHandler = handler;
}

export function getLastChatStressRunnerIdleWithPending(): ChatStressRunnerIdleWithPending | null {
  return lastIdleWithPending;
}

export function shouldPropagateLiveChatStressRuntimeFeed(operationId: string): boolean {
  if (operationId.startsWith('live-chat-stress-runner-path:')) return true;
  if (operationId.startsWith('chat-stress-scenario-settled:')) return true;
  if (operationId.startsWith('chat-stress-scenario-timed-out-settled:')) return true;
  if (operationId === 'chat-stress-pending-count-updated') return true;
  if (operationId === 'chat-stress-completion-condition-satisfied') return true;
  if (operationId === 'chat-stress-runner-idle-with-pending') return true;
  if (operationId === 'chat-stress-simulation-complete') return true;
  if (operationId === 'chat-stress-simulation-complete-emitted') return true;
  if (operationId === 'product-readiness-simulation-complete') return true;
  if (operationId === 'product-readiness-simulation-complete-emitted') return true;
  if (operationId === 'intake-validation-complete') return true;
  if (operationId === 'intake-validation-complete-emitted') return true;
  if (operationId === 'planning-gate-started') return true;
  return false;
}

export function reconcileChatStressRunnerIdleWithPending(
  nowMs = Date.now(),
): ChatStressRunnerIdleWithPending | null {
  const snap = getChatStressCompletionSnapshot(nowMs);
  if (snap.pendingCount <= 0) return null;
  if (snap.activeScenarioId != null) return null;
  if (snap.pendingWithoutActiveWorkerScenarioIds.length === 0) return null;

  const forced = forceSettlePendingStartedChatStressScenarios(
    CHAT_STRESS_RUNNER_IDLE_WITH_PENDING_KIND,
  );

  const lastStateByScenarioId: Record<string, string> = {};
  const lastUpdateTimeByScenarioId: Record<string, string | null> = {};
  for (const scenarioId of snap.pendingScenarioIds) {
    lastStateByScenarioId[scenarioId] = getChatStressScenarioLifecycleState(scenarioId);
    const lastUpdateMs = getChatStressScenarioLastUpdateTimeMs(scenarioId);
    lastUpdateTimeByScenarioId[scenarioId] =
      lastUpdateMs != null ? new Date(lastUpdateMs).toISOString() : null;
  }

  const event: ChatStressRunnerIdleWithPending = {
    readOnly: true,
    kind: CHAT_STRESS_RUNNER_IDLE_WITH_PENDING_KIND,
    pendingScenarioIds: [...snap.pendingScenarioIds],
    pendingWithoutActiveWorkerScenarioIds: [...snap.pendingWithoutActiveWorkerScenarioIds],
    lastStateByScenarioId,
    lastUpdateTimeByScenarioId,
    forcedSettlementCount: forced.length,
    detectedAt: new Date(nowMs).toISOString(),
  };

  lastIdleWithPending = event;
  idleWithPendingHandler?.(event);
  return event;
}

export function buildLiveChatStressRunnerPathStatus(nowMs = Date.now()): {
  readOnly: true;
  marker: string;
  callChain: readonly string[];
  settlementSummary: ReturnType<typeof buildChatStressSettlementSummary>;
  completionBoundaryReached: boolean;
} {
  const settlementSummary = buildChatStressSettlementSummary(nowMs);
  return {
    readOnly: true,
    marker: LIVE_CHAT_STRESS_RUNNER_PATH_MARKER,
    callChain: LIVE_CHAT_STRESS_RUNNER_PATH_CALL_CHAIN,
    settlementSummary,
    completionBoundaryReached: isChatStressSimulationComplete(nowMs),
  };
}
