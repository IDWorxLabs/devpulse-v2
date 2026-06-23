/**
 * Phase 26.72 — Product readiness completion propagation repair (V1).
 * Ensures completionBoundary=true reaches product-readiness-simulation-complete.
 */

import { recoverFounderTestChatStressSimulationFromSettlement } from '../founder-test-chat-stress-simulation/index.js';
import type { ChatStressSimulationReport } from '../founder-test-chat-stress-simulation/chat-stress-simulation-types.js';
import { hasProductReadinessSimulationCompletePropagated } from '../founder-test-chat-stress-simulation/chat-stress-completion-propagation.js';
import {
  buildChatStressSettlementSummary,
  emitChatStressSimulationCompleteBoundaryIfNeeded,
  isChatStressSimulationComplete,
} from '../founder-test-chat-stress-simulation/chat-stress-settlement-boundary.js';
import {
  CHAT_STRESS_SETTLEMENT_DRAIN_GRACE_MS,
  PRODUCT_READINESS_COMPLETION_CHECK,
  PRODUCT_READINESS_COMPLETED,
  reconcileProductReadinessCompletionCheck,
  shouldForceCompleteProductReadiness,
  waitForProductReadinessChatStressSettlement,
} from './product-readiness-completion-boundary.js';
import { getChatStressCompletionSnapshot } from '../founder-test-chat-stress-simulation/chat-stress-completion-tracker.js';
import { isProductReadinessRule1Satisfied } from '../product-readiness-completion-boundary-repair/chat-stress-settlement-auditor.js';
import type { RunProductReadinessSimulationInput } from './product-readiness-types.js';

export const PRODUCT_READINESS_PROPAGATION_PASS = 'PRODUCT_READINESS_PROPAGATION_PASS';

export const PRODUCT_READINESS_PROPAGATION_START = 'PRODUCT_READINESS_PROPAGATION_START';
export const PRODUCT_READINESS_PROPAGATION_STEP = 'PRODUCT_READINESS_PROPAGATION_STEP';
export const PRODUCT_READINESS_PROPAGATION_COMPLETE = 'PRODUCT_READINESS_PROPAGATION_COMPLETE';
export const PRODUCT_READINESS_PROPAGATION_FAILURE = 'PRODUCT_READINESS_PROPAGATION_FAILURE';

export interface ProductReadinessPropagationResult {
  readOnly: true;
  chatStressReport: ChatStressSimulationReport | null;
  forced: boolean;
  propagated: boolean;
  failureReason: string | null;
  steps: readonly string[];
}

function emitPropagationTrace(
  input: Pick<RunProductReadinessSimulationInput, 'onSimulationTrace'>,
  operationId:
    | typeof PRODUCT_READINESS_PROPAGATION_START
    | typeof PRODUCT_READINESS_PROPAGATION_STEP
    | typeof PRODUCT_READINESS_PROPAGATION_COMPLETE
    | typeof PRODUCT_READINESS_PROPAGATION_FAILURE,
  step: string,
  phase: 'RUNNING' | 'PASSED' | 'FAILED' = 'RUNNING',
): void {
  input.onSimulationTrace?.({
    operationId,
    operationLabel: `${operationId}: ${step}`,
    phase,
  });
}

function drainSettlementGraceMs(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, CHAT_STRESS_SETTLEMENT_DRAIN_GRACE_MS));
}

/**
 * Wait for chat stress settlement and propagate through completion boundary without
 * blocking on a hung chat batch worker promise.
 */
export async function waitForProductReadinessCompletionBoundary(
  input: Pick<
    RunProductReadinessSimulationInput,
    'onSimulationTrace'
  > = {},
): Promise<{ eligible: boolean; summary: ReturnType<typeof buildChatStressSettlementSummary> }> {
  emitPropagationTrace(input, PRODUCT_READINESS_PROPAGATION_START, 'awaiting chat stress settlement');
  await waitForProductReadinessChatStressSettlement(100, (event) => {
    input.onSimulationTrace?.(event);
  });
  emitChatStressSimulationCompleteBoundaryIfNeeded((event) => {
    input.onSimulationTrace?.({
      operationId: event.operationId,
      operationLabel: event.operationLabel,
      phase: event.phase,
    });
  });
  const summaryAfterBoundary = buildChatStressSettlementSummary();
  emitPropagationTrace(
    input,
    PRODUCT_READINESS_PROPAGATION_STEP,
    `settlement-complete settled=${summaryAfterBoundary.settledCount} pending=${summaryAfterBoundary.pendingCount} completionBoundary=${summaryAfterBoundary.completionBoundaryReached}`,
    summaryAfterBoundary.completionBoundaryReached ? 'PASSED' : 'RUNNING',
  );
  reconcileProductReadinessCompletionCheck(input);
  emitPropagationTrace(
    input,
    PRODUCT_READINESS_PROPAGATION_STEP,
    `${PRODUCT_READINESS_COMPLETION_CHECK} emitted`,
    'PASSED',
  );
  await drainSettlementGraceMs();
  emitPropagationTrace(input, PRODUCT_READINESS_PROPAGATION_STEP, 'settlement-drain-grace-complete', 'PASSED');
  return { eligible: summaryAfterBoundary.completionBoundaryReached, summary: summaryAfterBoundary };
}

/**
 * Recover chat stress and advance toward product-readiness-simulation-complete when
 * settlement is satisfied but the live batch has not returned.
 */
export async function propagateProductReadinessAfterCompletionBoundary(input: {
  rootDir: string;
  maxScenarios?: number;
  founderTestContext?: boolean;
  budgetMs?: number;
  onSimulationTrace?: RunProductReadinessSimulationInput['onSimulationTrace'];
  skipBoundaryWait?: boolean;
}): Promise<ProductReadinessPropagationResult> {
  const steps: string[] = [];
  const traceInput = { onSimulationTrace: input.onSimulationTrace };

  try {
    emitPropagationTrace(traceInput, PRODUCT_READINESS_PROPAGATION_START, 'propagation-repair-started');
    steps.push('propagation-repair-started');

    if (hasProductReadinessSimulationCompletePropagated()) {
      emitPropagationTrace(
        traceInput,
        PRODUCT_READINESS_PROPAGATION_COMPLETE,
        'already-propagated',
        'PASSED',
      );
      return {
        readOnly: true,
        chatStressReport: null,
        forced: false,
        propagated: true,
        failureReason: null,
        steps: [...steps, 'already-propagated'],
      };
    }

    const boundary = input.skipBoundaryWait
      ? {
          eligible: isProductReadinessCompletionBoundarySatisfied(),
          summary: buildChatStressSettlementSummary(),
        }
      : await waitForProductReadinessCompletionBoundary(traceInput);
    steps.push(
      `boundary eligible=${boundary.eligible} completionBoundary=${boundary.summary.completionBoundaryReached}`,
    );

    if (!boundary.summary.completionBoundaryReached && !shouldForceCompleteProductReadiness()) {
      const reason = 'completion boundary not reached';
      emitPropagationTrace(traceInput, PRODUCT_READINESS_PROPAGATION_FAILURE, reason, 'FAILED');
      return {
        readOnly: true,
        chatStressReport: null,
        forced: false,
        propagated: false,
        failureReason: reason,
        steps,
      };
    }

    emitPropagationTrace(
      traceInput,
      PRODUCT_READINESS_PROPAGATION_STEP,
      'recover-chat-stress-from-settlement',
      'RUNNING',
    );
    steps.push('recover-chat-stress-from-settlement');

    const recovered = await recoverFounderTestChatStressSimulationFromSettlement({
      rootDir: input.rootDir,
      maxScenarios: input.maxScenarios,
      founderTestContext: input.founderTestContext,
      budgetMs: input.budgetMs,
      onTrace: input.onSimulationTrace,
    });

    if (!recovered?.report) {
      const reason = 'settlement recovery returned no chat stress report';
      emitPropagationTrace(traceInput, PRODUCT_READINESS_PROPAGATION_FAILURE, reason, 'FAILED');
      return {
        readOnly: true,
        chatStressReport: null,
        forced: true,
        propagated: false,
        failureReason: reason,
        steps,
      };
    }

    emitPropagationTrace(
      traceInput,
      PRODUCT_READINESS_PROPAGATION_STEP,
      `chat-stress-recovered scenarios=${recovered.report.scenariosExecuted}`,
      'PASSED',
    );
    steps.push('chat-stress-recovered');

    emitPropagationTrace(
      traceInput,
      PRODUCT_READINESS_PROPAGATION_COMPLETE,
      `ready for ${PRODUCT_READINESS_COMPLETED}`,
      'PASSED',
    );
    steps.push('propagation-complete');

    return {
      readOnly: true,
      chatStressReport: recovered.report,
      forced: true,
      propagated: !hasProductReadinessSimulationCompletePropagated(),
      failureReason: null,
      steps,
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    emitPropagationTrace(traceInput, PRODUCT_READINESS_PROPAGATION_FAILURE, reason, 'FAILED');
    return {
      readOnly: true,
      chatStressReport: null,
      forced: true,
      propagated: false,
      failureReason: reason,
      steps,
    };
  }
}

export function isProductReadinessCompletionBoundarySatisfied(nowMs = Date.now()): boolean {
  const snap = getChatStressCompletionSnapshot(nowMs);
  if (
    isProductReadinessRule1Satisfied({
      startedCount: snap.startedCount,
      settledCount: snap.settledCount,
      pendingCount: snap.pendingCount,
    })
  ) {
    return true;
  }
  return isChatStressSimulationComplete(nowMs) || shouldForceCompleteProductReadiness(nowMs);
}
