/**
 * Stage 2 Completion Tracker — intake validation boundary observability (V1).
 */

import type { FounderTestRuntimeSnapshot, FounderTestRuntimeTraceEvent } from './founder-test-runtime-types.js';
import {
  allStartedChatStressScenariosSettled,
  formatChatStressPendingStallReason,
  getChatStressCompletionSnapshot,
  shouldFlagChatStressPendingStage2Gap,
} from '../founder-test-chat-stress-simulation/chat-stress-completion-tracker.js';
import {
  CHAT_STRESS_PER_SCENARIO_TIMEOUT_MS,
  CHAT_STRESS_SCENARIO_HARD_TIMEOUT_GRACE_MS,
} from '../founder-test-product-readiness/product-readiness-simulation-budget.js';

export const CHAT_STRESS_COMPLETION_BARRIER_REPAIR_V1_PASS =
  'CHAT_STRESS_COMPLETION_BARRIER_REPAIR_V1_PASS';

export const OPERATOR_FEED_UNIFIED_LAYOUT_STAGE2_COMPLETION_V1_PASS =
  'OPERATOR_FEED_UNIFIED_LAYOUT_STAGE2_COMPLETION_V1_PASS';

export const OPERATOR_FEED_UNIFIED_LAYOUT_STAGE2_COMPLETION_REPORT_TITLE =
  'Operator Feed Unified Layout And Stage2 Completion Report';

export const COMMAND_CENTER_UI_WIRING_FOUNDER_REPORT_DELIVERY_V1_PASS =
  'COMMAND_CENTER_UI_WIRING_FOUNDER_REPORT_DELIVERY_V1_PASS';

export const COMMAND_CENTER_UI_WIRING_FOUNDER_REPORT_DELIVERY_REPORT_TITLE =
  'Command Center Ui Wiring Founder Report Delivery Report';

export const FOUNDER_REPORT_ACCESS_OPERATOR_FEED_STATE_V1_PASS =
  'FOUNDER_REPORT_ACCESS_OPERATOR_FEED_STATE_V1_PASS';

/** Required PASSED trace boundaries before Stage 2 may advance to Planning Gate. */
export const INTAKE_VALIDATION_COMPLETION_BOUNDARIES = [
  {
    operationId: 'chat-stress-simulation-complete',
    label: 'Chat stress simulation complete',
  },
  {
    operationId: 'product-readiness-simulation-complete',
    label: 'Product readiness simulation complete',
  },
  {
    operationId: 'launch-readiness-assessment-complete',
    label: 'Launch readiness assessment complete',
  },
  {
    operationId: 'launch-readiness-artifacts-built',
    label: 'Launch readiness artifacts built',
  },
  {
    operationId: 'intake-validation-complete',
    label: 'Intake validation complete',
  },
] as const;

export function hasPassedTraceEvent(
  traceEvents: readonly FounderTestRuntimeTraceEvent[],
  operationId: string,
): boolean {
  return traceEvents.some((event) => event.operationId === operationId && event.status === 'PASSED');
}

export function resolveMissingIntakeCompletionBoundary(
  traceEvents: readonly FounderTestRuntimeTraceEvent[],
): string | null {
  for (const boundary of INTAKE_VALIDATION_COMPLETION_BOUNDARIES) {
    if (!hasPassedTraceEvent(traceEvents, boundary.operationId)) {
      return boundary.label;
    }
  }
  return null;
}

export function resolveIntakeValidationNextExpected(
  traceEvents: readonly FounderTestRuntimeTraceEvent[],
): string {
  const missing = resolveMissingIntakeCompletionBoundary(traceEvents);
  return missing ?? 'Planning gate entered';
}

export function analyzeStage2CompletionGap(snapshot: Omit<FounderTestRuntimeSnapshot, 'uiSummary'>): {
  missingCompletionBoundary: string | null;
  stage2CompletionGap: boolean;
  stage2CompletionGapReason: string | null;
} {
  const intakeStage = snapshot.stages.find((stage) => stage.stageId === 'INTAKE_VALIDATION');
  if (!intakeStage || intakeStage.status !== 'RUNNING') {
    return {
      missingCompletionBoundary: null,
      stage2CompletionGap: false,
      stage2CompletionGapReason: null,
    };
  }

  const missingCompletionBoundary = resolveMissingIntakeCompletionBoundary(snapshot.traceEvents);
  const chatStress = getChatStressCompletionSnapshot();
  const chatStressPending = chatStress.pendingCount > 0;
  const artifactIdle = snapshot.activeArtifactBuildSubstep == null && !chatStressPending;

  if (
    chatStressPending &&
    shouldFlagChatStressPendingStage2Gap({
      pendingCount: chatStress.pendingCount,
      chatStressWatchdogOverdueScenarioIds: chatStress.chatStressWatchdogOverdueScenarioIds,
      chatStressMaxPendingElapsedMs: chatStress.chatStressMaxPendingElapsedMs,
      hardTimeoutMs: CHAT_STRESS_PER_SCENARIO_TIMEOUT_MS,
      graceMs: CHAT_STRESS_SCENARIO_HARD_TIMEOUT_GRACE_MS,
      secondsSinceLastHeartbeat: snapshot.secondsSinceLastHeartbeat,
    })
  ) {
    return {
      missingCompletionBoundary: missingCompletionBoundary ?? 'Chat stress simulation complete',
      stage2CompletionGap: true,
      stage2CompletionGapReason: formatChatStressPendingStallReason(chatStress),
    };
  }

  const stage2CompletionGap =
    artifactIdle && missingCompletionBoundary != null && snapshot.secondsSinceLastHeartbeat >= 3;

  let stage2CompletionGapReason: string | null = null;
  if (stage2CompletionGap) {
    stage2CompletionGapReason = `Stage 2 still RUNNING with no active artifact sub-step; missing completion boundary: ${missingCompletionBoundary}`;
  }

  return {
    missingCompletionBoundary,
    stage2CompletionGap,
    stage2CompletionGapReason,
  };
}

export function resolveChatStressRuntimeFields(): {
  chatStressStartedCount: number;
  chatStressSettledCount: number;
  chatStressPendingCount: number;
  chatStressLastScenario: string | null;
  chatStressPendingScenarioIds: readonly string[];
  chatStressActiveScenarioId: string | null;
  chatStressLastSettledScenarioId: string | null;
  chatStressTimeoutScenarioIds: readonly string[];
  chatStressFailedScenarioIds: readonly string[];
  chatStressWatchdogArmedScenarioIds: readonly string[];
  chatStressWatchdogDeadlineByScenarioId: Readonly<Record<string, number>>;
  chatStressWatchdogOverdueScenarioIds: readonly string[];
  chatStressMaxPendingElapsedMs: number;
} {
  const chatStress = getChatStressCompletionSnapshot();
  return {
    chatStressStartedCount: chatStress.startedCount,
    chatStressSettledCount: chatStress.settledCount,
    chatStressPendingCount: chatStress.pendingCount,
    chatStressLastScenario: chatStress.lastScenarioId,
    chatStressPendingScenarioIds: chatStress.pendingScenarioIds,
    chatStressActiveScenarioId: chatStress.activeScenarioId,
    chatStressLastSettledScenarioId: chatStress.lastSettledScenarioId,
    chatStressTimeoutScenarioIds: chatStress.timeoutScenarioIds,
    chatStressFailedScenarioIds: chatStress.failedScenarioIds,
    chatStressWatchdogArmedScenarioIds: chatStress.chatStressWatchdogArmedScenarioIds,
    chatStressWatchdogDeadlineByScenarioId: chatStress.chatStressWatchdogDeadlineByScenarioId,
    chatStressWatchdogOverdueScenarioIds: chatStress.chatStressWatchdogOverdueScenarioIds,
    chatStressMaxPendingElapsedMs: chatStress.chatStressMaxPendingElapsedMs,
  };
}
