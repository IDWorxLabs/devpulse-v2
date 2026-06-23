/**
 * Phase 26.89 — Product readiness completion boundary reconciliation (V1).
 * Prevents permanent stalls after all chat stress scenarios have terminal settlement.
 */

import type { ChatStressCompletionSnapshot } from '../founder-test-chat-stress-simulation/chat-stress-completion-tracker.js';
import {
  allChatStressScenariosSettled,
  getChatStressCompletionSnapshot,
  getChatStressTotalScenarios,
} from '../founder-test-chat-stress-simulation/chat-stress-completion-tracker.js';
import {
  buildChatStressSettlementSummary,
  emitChatStressSimulationCompleteBoundaryIfNeeded,
  isChatStressSimulationComplete,
} from '../founder-test-chat-stress-simulation/chat-stress-settlement-boundary.js';
import { hasProductReadinessSimulationCompletePropagated } from '../founder-test-chat-stress-simulation/chat-stress-completion-propagation.js';
import {
  reconcileLiveChatStressRuntimeSettlement,
} from '../founder-test-chat-stress-simulation/live-chat-stress-runner-path.js';
import type { RunProductReadinessSimulationInput } from './product-readiness-types.js';

export const PRODUCT_READINESS_COMPLETION_BOUNDARY_V1_PASS =
  'PRODUCT_READINESS_COMPLETION_BOUNDARY_V1_PASS';

export const PRODUCT_READINESS_COMPLETION_CHECK = 'PRODUCT_READINESS_COMPLETION_CHECK';
export const PRODUCT_READINESS_COMPLETED = 'PRODUCT_READINESS_COMPLETED';
export const PRODUCT_READINESS_FORCED_COMPLETION = 'PRODUCT_READINESS_FORCED_COMPLETION';

/** Grace after tracker settlement before forcing product-readiness completion. */
export const CHAT_STRESS_SETTLEMENT_DRAIN_GRACE_MS = 2_000;

export const CHAT_STRESS_TERMINAL_STATUSES = [
  'PASSED',
  'FAILED',
  'TIMEOUT',
  'SKIPPED_BUDGET',
  'SKIPPED_WITH_REASON',
  'ERROR',
  'SIMULATION_BUDGET_EXCEEDED',
] as const;

export type ProductReadinessCompletionEligibility = {
  readOnly: true;
  eligible: boolean;
  pendingCount: number;
  startedCount: number;
  settledCount: number;
  totalScenarios: number;
  allScenariosSettled: boolean;
  chatStressSimulationComplete: boolean;
  productReadinessCompletePropagated: boolean;
  reason: string | null;
};

let productReadinessCompletionCheckEmitted = false;

export function resolveProductReadinessCompletionEligibility(
  snap: Pick<ChatStressCompletionSnapshot, 'pendingCount' | 'startedCount' | 'settledCount'>,
  totalScenarios = getChatStressTotalScenarios(),
  nowMs = Date.now(),
): ProductReadinessCompletionEligibility {
  const allScenariosSettled = totalScenarios > 0 && allChatStressScenariosSettled();
  const settlementComplete = isChatStressSimulationComplete(nowMs);
  const startedAndSettled =
    snap.pendingCount === 0 && snap.startedCount > 0 && snap.settledCount >= snap.startedCount;
  const allSettledNoPending =
    snap.pendingCount === 0 && snap.settledCount >= totalScenarios && totalScenarios > 0;
  const eligible = startedAndSettled || allSettledNoPending || settlementComplete;

  let reason: string | null = null;
  if (eligible) {
    reason = allSettledNoPending
      ? `all ${totalScenarios} scenarios settled (pending=0)`
      : `started=${snap.startedCount} settled=${snap.settledCount} pending=${snap.pendingCount}`;
  } else if (snap.pendingCount > 0) {
    reason = `${snap.pendingCount} scenario(s) still pending`;
  } else if (snap.settledCount < snap.startedCount) {
    reason = `settled ${snap.settledCount} < started ${snap.startedCount}`;
  }

  return {
    readOnly: true,
    eligible,
    pendingCount: snap.pendingCount,
    startedCount: snap.startedCount,
    settledCount: snap.settledCount,
    totalScenarios,
    allScenariosSettled,
    chatStressSimulationComplete: settlementComplete,
    productReadinessCompletePropagated: hasProductReadinessSimulationCompletePropagated(),
    reason,
  };
}

export function emitProductReadinessCompletionDiagnostic(
  input: RunProductReadinessSimulationInput,
  operationId:
    | typeof PRODUCT_READINESS_COMPLETION_CHECK
    | typeof PRODUCT_READINESS_COMPLETED
    | typeof PRODUCT_READINESS_FORCED_COMPLETION,
  detail: string,
  phase: 'RUNNING' | 'PASSED' | 'FAILED' | 'SLOW' | 'STALLED' | 'BUDGET_EXCEEDED' = 'RUNNING',
): void {
  input.onSimulationTrace?.({
    operationId,
    operationLabel: `${operationId}: ${detail}`,
    phase,
  });
}

export function resetProductReadinessCompletionCheckEmissionForTests(): void {
  productReadinessCompletionCheckEmitted = false;
}

export function reconcileProductReadinessCompletionCheck(
  input: RunProductReadinessSimulationInput,
  nowMs = Date.now(),
): ProductReadinessCompletionEligibility {
  const snap = getChatStressCompletionSnapshot(nowMs);
  const eligibility = resolveProductReadinessCompletionEligibility(snap, getChatStressTotalScenarios(), nowMs);
  if (
    eligibility.eligible &&
    !eligibility.productReadinessCompletePropagated &&
    !productReadinessCompletionCheckEmitted
  ) {
    emitChatStressSimulationCompleteBoundaryIfNeeded((event) => {
      input.onSimulationTrace?.({
        operationId: event.operationId,
        operationLabel: event.operationLabel,
        phase: event.phase,
      });
    });
    const summary = buildChatStressSettlementSummary(nowMs);
    emitProductReadinessCompletionDiagnostic(
      input,
      PRODUCT_READINESS_COMPLETION_CHECK,
      `settled=${summary.settledCount} pending=${summary.pendingCount} started=${summary.startedCount} completionBoundary=${summary.completionBoundaryReached}`,
      'PASSED',
    );
    productReadinessCompletionCheckEmitted = true;
  }
  return eligibility;
}

export async function waitForProductReadinessChatStressSettlement(
  pollMs = 100,
  onTrace?: (event: {
    operationId: string;
    operationLabel: string;
    phase: 'RUNNING' | 'PASSED' | 'SLOW' | 'FAILED' | 'STALLED' | 'BUDGET_EXCEEDED';
    errorMessage?: string;
  }) => void,
): Promise<ProductReadinessCompletionEligibility> {
  while (true) {
    const before = getChatStressCompletionSnapshot();
    const settlement = reconcileLiveChatStressRuntimeSettlement();
    if (
      settlement.swept ||
      settlement.settledCount > before.settledCount ||
      settlement.pendingCount < before.pendingCount
    ) {
      onTrace?.({
        operationId: 'chat-stress-terminal-sweep-settled',
        operationLabel: `Settlement wait: settled=${settlement.settledCount} pending=${settlement.pendingCount}`,
        phase: settlement.pendingCount === 0 ? 'PASSED' : 'RUNNING',
      });
    }
    if (settlement.boundaryEmitted) {
      onTrace?.({
        operationId: 'chat-stress-simulation-complete',
        operationLabel: `Chat stress simulation complete (settled=${settlement.settledCount}, pending=${settlement.pendingCount})`,
        phase: 'PASSED',
      });
    }
    const snap = getChatStressCompletionSnapshot();
    const eligibility = resolveProductReadinessCompletionEligibility(snap);
    if (eligibility.eligible) return eligibility;
    await new Promise((resolve) => setTimeout(resolve, pollMs));
  }
}

export function shouldForceCompleteProductReadiness(nowMs = Date.now()): boolean {
  const eligibility = resolveProductReadinessCompletionEligibility(
    getChatStressCompletionSnapshot(nowMs),
    getChatStressTotalScenarios(),
    nowMs,
  );
  return eligibility.eligible && !eligibility.productReadinessCompletePropagated;
}
