/**
 * Phase 26.90 — Chat stress settlement auditor (V1).
 */

import { getChatStressCompletionSnapshot, getChatStressTotalScenarios } from '../founder-test-chat-stress-simulation/chat-stress-completion-tracker.js';
import { buildChatStressSettlementSummary } from '../founder-test-chat-stress-simulation/chat-stress-settlement-boundary.js';
import type { ChatStressSettlementAudit } from './product-readiness-completion-boundary-repair-types.js';

/** Rule 1: started > 0 AND started == settled AND pending == 0 */
export function isProductReadinessRule1Satisfied(input: {
  startedCount: number;
  settledCount: number;
  pendingCount: number;
}): boolean {
  return (
    input.startedCount > 0 &&
    input.startedCount === input.settledCount &&
    input.pendingCount === 0
  );
}

export function auditChatStressSettlement(nowMs = Date.now()): ChatStressSettlementAudit {
  const snap = getChatStressCompletionSnapshot(nowMs);
  const summary = buildChatStressSettlementSummary(nowMs);
  const totalScenarios = getChatStressTotalScenarios();
  const rule1Satisfied = isProductReadinessRule1Satisfied({
    startedCount: snap.startedCount,
    settledCount: snap.settledCount,
    pendingCount: snap.pendingCount,
  });

  let reason: string | null = null;
  if (rule1Satisfied) {
    reason = `Rule 1 satisfied: started=${snap.startedCount} settled=${snap.settledCount} pending=${snap.pendingCount}`;
  } else if (snap.pendingCount > 0) {
    reason = `${snap.pendingCount} scenario(s) still pending`;
  } else if (snap.startedCount === 0) {
    reason = 'No chat stress scenarios started';
  } else if (snap.settledCount < snap.startedCount) {
    reason = `settled ${snap.settledCount} < started ${snap.startedCount}`;
  }

  return {
    readOnly: true,
    settlementComplete: rule1Satisfied || summary.completionBoundaryReached,
    startedCount: snap.startedCount,
    settledCount: snap.settledCount,
    pendingCount: snap.pendingCount,
    totalScenarios,
    rule1Satisfied,
    completionBoundaryReached: summary.completionBoundaryReached,
    reason,
  };
}
