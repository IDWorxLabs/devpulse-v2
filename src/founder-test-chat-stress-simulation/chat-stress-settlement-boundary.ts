/**
 * Phase 26.79 — Chat stress settlement boundary and completion aggregation (V1).
 */

import {
  allChatStressScenariosSettled,
  getChatStressCompletionSnapshot,
  getChatStressScenarioLastUpdateTimeMs,
  getChatStressScenarioLifecycleState,
  getChatStressScenarioTerminalStatus,
  getChatStressTotalScenarios,
  listChatStressOrderedScenarioIds,
  type ChatStressScenarioLifecycleState,
} from './chat-stress-completion-tracker.js';
import {
  hasChatStressCompletionConditionSatisfied,
  hasChatStressSimulationCompletePropagated,
  recordChatStressCompletionConditionSatisfied,
  recordChatStressSimulationCompleteEmitted,
  recordIntakeCompletionBoundaryOperation,
} from './chat-stress-completion-propagation.js';
import type { ChatStressSettlementSummary } from './chat-stress-simulation-types.js';

export const CHAT_STRESS_SETTLEMENT_BOUNDARY_REPAIR_V1_PASS =
  'CHAT_STRESS_SETTLEMENT_BOUNDARY_REPAIR_V1_PASS';

export type { ChatStressScenarioLifecycleState, ChatStressSettlementSummary };

export interface ChatStressPendingLeak {
  readOnly: true;
  kind: 'CHAT_STRESS_PENDING_LEAK';
  pendingScenarioIds: string[];
  lastStateByScenarioId: Readonly<Record<string, ChatStressScenarioLifecycleState>>;
  lastUpdateTimeByScenarioId: Readonly<Record<string, string | null>>;
  detectedAt: string;
}

export function buildChatStressSettlementSummary(nowMs = Date.now()): ChatStressSettlementSummary {
  const snap = getChatStressCompletionSnapshot(nowMs);
  const scenarioIds = listChatStressOrderedScenarioIds();
  let passedCount = 0;
  let failedCount = 0;
  let timedOutCount = 0;

  for (const scenarioId of scenarioIds) {
    const terminal = getChatStressScenarioTerminalStatus(scenarioId);
    if (terminal === 'PASSED') passedCount += 1;
    if (terminal === 'FAILED' || terminal === 'ERROR') failedCount += 1;
    if (terminal === 'TIMEOUT') timedOutCount += 1;
  }

  const completionBoundaryReached =
    getChatStressTotalScenarios() > 0 &&
    snap.pendingCount === 0 &&
    allChatStressScenariosSettled();

  return {
    readOnly: true,
    totalScenarios: getChatStressTotalScenarios(),
    startedCount: snap.startedCount,
    settledCount: snap.settledCount,
    passedCount,
    failedCount,
    timedOutCount,
    pendingCount: snap.pendingCount,
    completionBoundaryReached,
    generatedAt: new Date(nowMs).toISOString(),
  };
}

/** Explicit ChatStressSimulationComplete boundary — all scenarios settled, none pending. */
export function isChatStressSimulationComplete(nowMs = Date.now()): boolean {
  return buildChatStressSettlementSummary(nowMs).completionBoundaryReached;
}

export type ChatStressSimulationCompleteBoundaryEmit = {
  operationId: string;
  operationLabel: string;
  phase: 'PASSED';
};

/**
 * Emit chat-stress-simulation-complete when settlement is terminal but the live path
 * has not yet recorded/propagated the Stage 2 completion boundary.
 */
export function emitChatStressSimulationCompleteBoundaryIfNeeded(
  onEmit?: (event: ChatStressSimulationCompleteBoundaryEmit) => void,
  nowMs = Date.now(),
): boolean {
  if (!isChatStressSimulationComplete(nowMs)) return false;
  if (hasChatStressSimulationCompletePropagated()) return false;

  const summary = buildChatStressSettlementSummary(nowMs);
  const at = new Date(nowMs);

  if (!hasChatStressCompletionConditionSatisfied()) {
    recordChatStressCompletionConditionSatisfied(at);
  }
  recordIntakeCompletionBoundaryOperation('chat-stress-simulation-complete', at);

  const operationLabel =
    summary.startedCount < summary.totalScenarios
      ? `Chat stress simulation complete (settled=${summary.settledCount}/${summary.totalScenarios}, pending=${summary.pendingCount})`
      : `Chat stress simulation complete (${summary.passedCount}/${summary.totalScenarios} passed)`;

  onEmit?.({
    operationId: 'chat-stress-simulation-complete',
    operationLabel,
    phase: 'PASSED',
  });

  recordChatStressSimulationCompleteEmitted(at);
  onEmit?.({
    operationId: 'chat-stress-simulation-complete-emitted',
    operationLabel: 'Chat stress simulation complete emitted',
    phase: 'PASSED',
  });

  return true;
}

export function detectChatStressPendingLeak(nowMs = Date.now()): ChatStressPendingLeak | null {
  const snap = getChatStressCompletionSnapshot(nowMs);
  if (snap.pendingCount <= 0) return null;
  if (snap.activeScenarioCount > 0) return null;

  const lastStateByScenarioId: Record<string, ChatStressScenarioLifecycleState> = {};
  const lastUpdateTimeByScenarioId: Record<string, string | null> = {};

  for (const scenarioId of snap.pendingScenarioIds) {
    lastStateByScenarioId[scenarioId] = getChatStressScenarioLifecycleState(scenarioId);
    const lastUpdateMs = getChatStressScenarioLastUpdateTimeMs(scenarioId);
    lastUpdateTimeByScenarioId[scenarioId] =
      lastUpdateMs != null ? new Date(lastUpdateMs).toISOString() : null;
  }

  return {
    readOnly: true,
    kind: 'CHAT_STRESS_PENDING_LEAK',
    pendingScenarioIds: [...snap.pendingScenarioIds],
    lastStateByScenarioId,
    lastUpdateTimeByScenarioId,
    detectedAt: new Date(nowMs).toISOString(),
  };
}
