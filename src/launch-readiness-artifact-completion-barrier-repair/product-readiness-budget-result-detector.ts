/**
 * Phase 26.98 — Product readiness budget result detector (V1).
 */

import { hasProductReadinessSimulationCompletePropagated } from '../founder-test-chat-stress-simulation/chat-stress-completion-propagation.js';
import type { FounderTestRuntimeTraceEvent } from '../founder-test-runtime-monitor/founder-test-runtime-types.js';
import type { ProductReadinessBudgetResultDetection } from './launch-readiness-artifact-completion-barrier-repair-types.js';
import { PRODUCT_READINESS_BUDGET_EXCEEDED_HEALTH } from './launch-readiness-artifact-completion-barrier-repair-registry.js';

export function hasProductReadinessBudgetExceededTrace(
  traceEvents: readonly FounderTestRuntimeTraceEvent[] = [],
): boolean {
  return traceEvents.some(
    (event) =>
      (event.operationId === 'product-readiness-simulation-stalled' ||
        event.operationId === 'product-readiness-simulation-slow' ||
        event.operationId === 'chat-stress-simulation-budget-exceeded') &&
      (event.status === 'FAILED' ||
        event.operationLabel.includes(PRODUCT_READINESS_BUDGET_EXCEEDED_HEALTH) ||
        event.operationLabel.toLowerCase().includes('budget exceeded')),
  );
}

export function detectProductReadinessBudgetResult(input: {
  simulationRuntimeHealth?: string | null;
  productReadinessDegraded?: boolean;
  traceEvents?: readonly FounderTestRuntimeTraceEvent[];
  productReadinessSimulationCompleteTraced?: boolean;
} = {}): ProductReadinessBudgetResultDetection {
  const budgetExceeded =
    input.simulationRuntimeHealth === PRODUCT_READINESS_BUDGET_EXCEEDED_HEALTH ||
    hasProductReadinessBudgetExceededTrace(input.traceEvents ?? []);
  const simulationDegradedPartial =
    input.productReadinessDegraded === true || budgetExceeded;
  const productReadinessCompletePropagated = hasProductReadinessSimulationCompletePropagated();
  const productReadinessSimulationCompleteTraced =
    input.productReadinessSimulationCompleteTraced ??
    (input.traceEvents ?? []).some(
      (event) =>
        event.operationId === 'product-readiness-simulation-complete' && event.status === 'PASSED',
    );

  const budgetResultDropped =
    budgetExceeded &&
    !productReadinessCompletePropagated &&
    !productReadinessSimulationCompleteTraced;

  let failureClass: ProductReadinessBudgetResultDetection['failureClass'] = 'NONE';
  let reason: string | null = null;

  if (budgetResultDropped) {
    failureClass = 'PRODUCT_READINESS_BUDGET_RESULT_DROPPED';
    reason = 'SIMULATION_BUDGET_EXCEEDED did not propagate to product-readiness-simulation-complete';
  } else if (budgetExceeded && simulationDegradedPartial) {
    reason = 'SIMULATION_BUDGET_EXCEEDED treated as degraded evidence (not runtime stall)';
  }

  return {
    readOnly: true,
    budgetExceeded,
    simulationDegradedPartial,
    productReadinessCompletePropagated,
    productReadinessSimulationCompleteTraced,
    budgetResultDropped,
    failureClass,
    reason,
  };
}
