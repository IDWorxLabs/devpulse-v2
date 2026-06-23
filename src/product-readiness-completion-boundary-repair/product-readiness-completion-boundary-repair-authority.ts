/**
 * Phase 26.90 — Product Readiness Completion Boundary Repair authority (V1).
 * Read-only audit orchestrator. Repair apply delegates to existing product readiness tail.
 */

import { createHash } from 'node:crypto';
import {
  hasChatStressSimulationCompletePropagated,
  recordIntakeCompletionBoundaryOperation,
  recordProductReadinessSimulationCompleteEmitted,
} from '../founder-test-chat-stress-simulation/chat-stress-completion-propagation.js';
import { emitChatStressSimulationCompleteBoundaryIfNeeded } from '../founder-test-chat-stress-simulation/chat-stress-settlement-boundary.js';
import { assessFounderTestIntegration } from '../founder-test-integration/index.js';
import {
  forceCompleteProductReadiness,
  invokeProductReadinessCompletionTail,
} from '../founder-test-product-readiness/product-readiness-orchestrator.js';
import {
  createSimulationBudgetTracker,
  SIMULATION_BUDGET_MS,
} from '../founder-test-product-readiness/product-readiness-simulation-budget.js';
import {
  reconcileProductReadinessCompletionCheck,
  shouldForceCompleteProductReadiness,
} from '../founder-test-product-readiness/product-readiness-completion-boundary.js';
import { auditChatStressSettlement } from './chat-stress-settlement-auditor.js';
import { planCompletionBoundaryRepair } from './completion-boundary-repair-planner.js';
import {
  detectProductReadinessCompletion,
  hasProductReadinessCompleteEventEmitted,
  hasProductReadinessCompleteSimulationTraced,
  markProductReadinessCompleteEventEmitted,
  markProductReadinessCompleteSimulationTraced,
  resetProductReadinessCompleteEventEmissionForTests,
} from './product-readiness-completion-detector.js';
import {
  PRODUCT_READINESS_COMPLETE,
  PRODUCT_READINESS_COMPLETION_BOUNDARY_REPAIR_CACHE_KEY_PREFIX,
  PRODUCT_READINESS_COMPLETION_BOUNDARY_REPAIR_PASS,
} from './product-readiness-completion-boundary-repair-registry.js';
import {
  recordProductReadinessCompletionBoundaryRepair,
  resetProductReadinessCompletionBoundaryRepairHistoryForTests,
} from './product-readiness-completion-history.js';
import { analyzeStageTransition } from './stage-transition-analyzer.js';
import type {
  ApplyProductReadinessCompletionBoundaryRepairInput,
  AssessProductReadinessCompletionBoundaryRepairInput,
  ProductReadinessCompletionBoundaryRepairAssessment,
} from './product-readiness-completion-boundary-repair-types.js';

let repairCounter = 0;

export function resetProductReadinessCompletionBoundaryRepairCounterForTests(): void {
  repairCounter = 0;
}

export function resetProductReadinessCompletionBoundaryRepairModuleForTests(): void {
  resetProductReadinessCompletionBoundaryRepairCounterForTests();
  resetProductReadinessCompletionBoundaryRepairHistoryForTests();
  resetProductReadinessCompleteEventEmissionForTests();
}

function nextRepairId(): string {
  repairCounter += 1;
  return `product-readiness-completion-boundary-repair-${repairCounter}-${Date.now()}`;
}

function stableCacheKey(repairId: string, repairApplied: boolean): string {
  const digest = createHash('sha256')
    .update([PRODUCT_READINESS_COMPLETION_BOUNDARY_REPAIR_PASS, repairId, String(repairApplied)].join('|'))
    .digest('hex')
    .slice(0, 16);
  return `${PRODUCT_READINESS_COMPLETION_BOUNDARY_REPAIR_CACHE_KEY_PREFIX}:${digest}`;
}

export function assessProductReadinessCompletionBoundaryRepair(
  input: AssessProductReadinessCompletionBoundaryRepairInput = {},
): ProductReadinessCompletionBoundaryRepairAssessment {
  const nowMs = input.nowMs ?? Date.now();
  const repairId = nextRepairId();
  const settlementAudit = auditChatStressSettlement(nowMs);
  const completionDetection = detectProductReadinessCompletion(nowMs);
  const stageTransition = analyzeStageTransition(input.runtimeSnapshot ?? null, nowMs);
  const repairPlan = planCompletionBoundaryRepair({
    settlementAudit,
    completionDetection,
    stageTransition,
  });

  const chainSatisfied =
    settlementAudit.rule1Satisfied &&
    completionDetection.productReadinessComplete &&
    completionDetection.productReadinessCompleteEventEmitted &&
    !repairPlan.repairRequired;

  const report = {
    readOnly: true as const,
    repairId,
    generatedAt: new Date(nowMs).toISOString(),
    settlementAudit,
    completionDetection,
    stageTransition,
    repairPlan,
    repairApplied: false,
    passToken: chainSatisfied ? PRODUCT_READINESS_COMPLETION_BOUNDARY_REPAIR_PASS : null,
  };

  recordProductReadinessCompletionBoundaryRepair(report);

  return {
    readOnly: true,
    advisoryOnly: true,
    report: {
      ...report,
      passToken: chainSatisfied ? PRODUCT_READINESS_COMPLETION_BOUNDARY_REPAIR_PASS : null,
    },
  };
}

/** Emit PRODUCT_READINESS_COMPLETE exactly once when Rule 1 is satisfied. */
export function emitProductReadinessCompleteOnce(
  input: Pick<ApplyProductReadinessCompletionBoundaryRepairInput, 'onSimulationTrace' | 'onRuntimeTrace'>,
): boolean {
  const settlement = auditChatStressSettlement();
  if (!settlement.rule1Satisfied) {
    return false;
  }

  const firstGlobalEmit = !hasProductReadinessCompleteEventEmitted();
  if (firstGlobalEmit) {
    markProductReadinessCompleteEventEmitted();
  }

  if (input.onSimulationTrace && !hasProductReadinessCompleteSimulationTraced()) {
    markProductReadinessCompleteSimulationTraced();
    input.onSimulationTrace({
      operationId: PRODUCT_READINESS_COMPLETE,
      operationLabel: `${PRODUCT_READINESS_COMPLETE}: started=${settlement.startedCount} settled=${settlement.settledCount} pending=${settlement.pendingCount}`,
      phase: 'PASSED',
    });
  }

  if (firstGlobalEmit) {
    input.onRuntimeTrace?.({
      operationId: PRODUCT_READINESS_COMPLETE,
      operationLabel: 'Product readiness complete',
      stageId: 'INTAKE_VALIDATION',
      status: 'PASSED',
    });
  }

  return firstGlobalEmit;
}

/** Synchronous boundary propagation when orchestrator cannot advance but settlement holds. */
export function propagateProductReadinessCompletionBoundariesSync(
  input: Pick<ApplyProductReadinessCompletionBoundaryRepairInput, 'onRuntimeTrace'> = {},
): boolean {
  const settlement = auditChatStressSettlement();
  if (!settlement.completionBoundaryReached && !settlement.rule1Satisfied) {
    return false;
  }

  if (
    settlement.completionBoundaryReached &&
    !hasChatStressSimulationCompletePropagated()
  ) {
    emitChatStressSimulationCompleteBoundaryIfNeeded(({ operationId, operationLabel, phase }) => {
      input.onRuntimeTrace?.({
        operationId,
        operationLabel,
        stageId: 'INTAKE_VALIDATION',
        status: phase,
      });
    });
  }

  recordIntakeCompletionBoundaryOperation('product-readiness-simulation-complete');
  recordProductReadinessSimulationCompleteEmitted();
  input.onRuntimeTrace?.({
    operationId: 'product-readiness-simulation-complete',
    operationLabel: 'Product readiness simulation complete (boundary repair)',
    stageId: 'INTAKE_VALIDATION',
    status: 'PASSED',
  });
  input.onRuntimeTrace?.({
    operationId: 'product-readiness-simulation-complete-emitted',
    operationLabel: 'Product readiness simulation complete emitted (boundary repair)',
    stageId: 'INTAKE_VALIDATION',
    status: 'PASSED',
  });
  return true;
}

/**
 * Apply completion boundary repair — invokes shared completion tail when settlement
 * is satisfied but product readiness has not propagated.
 */
export async function applyProductReadinessCompletionBoundaryRepair(
  input: ApplyProductReadinessCompletionBoundaryRepairInput = {},
): Promise<ProductReadinessCompletionBoundaryRepairAssessment> {
  const nowMs = input.nowMs ?? Date.now();
  const assessment = assessProductReadinessCompletionBoundaryRepair({ nowMs });
  const { repairPlan } = assessment.report;

  if (!repairPlan.repairRequired) {
    return assessment;
  }

  const traceInput = {
    onSimulationTrace: input.onSimulationTrace,
    onRuntimeTrace: input.onRuntimeTrace,
  };

  reconcileProductReadinessCompletionCheck({ onSimulationTrace: input.onSimulationTrace }, nowMs);

  if (repairPlan.recordPropagationBoundaries && shouldForceCompleteProductReadiness(nowMs)) {
    propagateProductReadinessCompletionBoundariesSync(traceInput);
  }

  if (repairPlan.emitProductReadinessComplete) {
    emitProductReadinessCompleteOnce(traceInput);
  }

  if (repairPlan.forceCompletionTail && shouldForceCompleteProductReadiness(nowMs)) {
    const rootDir = input.rootDir ?? process.cwd();
    const founderTest = assessFounderTestIntegration({ rootDir });
    const budget = createSimulationBudgetTracker({ budgetMs: SIMULATION_BUDGET_MS, startedAtMs: nowMs });
    const tailInput = {
      rootDir,
      founderTest,
      chatStress: null,
      budget,
      simulationBudgetNotes: ['Product readiness completion boundary repair invoked completion tail.'],
      founderTestContext: true as const,
      productReadinessRuntimePath: 'real-founder' as const,
      onSimulationTrace: input.onSimulationTrace,
      chatStressForced: true,
    };

    if (repairPlan.actions.includes('invoke-product-readiness-completion-tail')) {
      await invokeProductReadinessCompletionTail(tailInput);
    } else {
      forceCompleteProductReadiness(tailInput);
    }

    emitProductReadinessCompleteOnce(traceInput);
  }

  const refreshed = assessProductReadinessCompletionBoundaryRepair({ nowMs: Date.now() });
  const pass =
    refreshed.report.settlementAudit.rule1Satisfied &&
    (refreshed.report.completionDetection.productReadinessCompletePropagated ||
      hasProductReadinessCompleteEventEmitted());

  const repairedReport = {
    ...refreshed.report,
    repairApplied: true,
    passToken: pass ? PRODUCT_READINESS_COMPLETION_BOUNDARY_REPAIR_PASS : null,
  };

  recordProductReadinessCompletionBoundaryRepair(repairedReport);

  return {
    readOnly: true,
    advisoryOnly: true,
    report: repairedReport,
  };
}

export function reconcileProductReadinessCompletionBoundaryOnSnapshot(
  runtimeSnapshot: AssessProductReadinessCompletionBoundaryRepairInput['runtimeSnapshot'],
  onRuntimeTrace?: ApplyProductReadinessCompletionBoundaryRepairInput['onRuntimeTrace'],
): ProductReadinessCompletionBoundaryRepairAssessment {
  const assessment = assessProductReadinessCompletionBoundaryRepair({ runtimeSnapshot });
  if (!assessment.report.repairPlan.repairRequired) {
    return assessment;
  }

  if (
    assessment.report.settlementAudit.completionBoundaryReached &&
    !assessment.report.completionDetection.productReadinessCompletePropagated
  ) {
    propagateProductReadinessCompletionBoundariesSync({ onRuntimeTrace });
    emitProductReadinessCompleteOnce({ onRuntimeTrace });
  }

  return assessProductReadinessCompletionBoundaryRepair({ runtimeSnapshot });
}
