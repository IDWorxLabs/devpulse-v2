/**
 * Phase 26.73 — Real Founder Test product readiness propagation path alignment (V1).
 */

import { getChatStressCompletionSnapshot, getChatStressTotalScenarios } from '../founder-test-chat-stress-simulation/chat-stress-completion-tracker.js';
import { buildChatStressSettlementSummary } from '../founder-test-chat-stress-simulation/chat-stress-settlement-boundary.js';
import { hasProductReadinessSimulationCompletePropagated } from '../founder-test-chat-stress-simulation/chat-stress-completion-propagation.js';
import { isProductReadinessRule1Satisfied } from '../product-readiness-completion-boundary-repair/chat-stress-settlement-auditor.js';
import {
  PRODUCT_READINESS_COMPLETION_CHECK,
  resolveProductReadinessCompletionEligibility,
} from './product-readiness-completion-boundary.js';
import type { RunProductReadinessSimulationInput } from './product-readiness-types.js';

export const PRODUCT_READINESS_REAL_FOUNDER_PATH_PASS = 'PRODUCT_READINESS_REAL_FOUNDER_PATH_PASS';

export const REAL_FOUNDER_PRODUCT_READINESS_PATH_SELECTED =
  'REAL_FOUNDER_PRODUCT_READINESS_PATH_SELECTED';
export const REAL_FOUNDER_COMPLETION_CHECK_OBSERVED = 'REAL_FOUNDER_COMPLETION_CHECK_OBSERVED';
export const REAL_FOUNDER_COMPLETION_TAIL_INVOKED = 'REAL_FOUNDER_COMPLETION_TAIL_INVOKED';
export const REAL_FOUNDER_COMPLETION_TAIL_COMPLETED = 'REAL_FOUNDER_COMPLETION_TAIL_COMPLETED';
export const REAL_FOUNDER_STAGE2_EXIT_CONFIRMED = 'REAL_FOUNDER_STAGE2_EXIT_CONFIRMED';
export const PRODUCT_READINESS_PROPAGATION_PATH_MISMATCH =
  'PRODUCT_READINESS_PROPAGATION_PATH_MISMATCH';

export type ProductReadinessRuntimePath = 'real-founder' | 'isolated-validation';

type ProductReadinessCompletionMechanism =
  | 'completion-tail'
  | 'direct-complete'
  | 'propagate-only'
  | 'non-blocking-chat-stress'
  | null;

let selectedRuntimePath: ProductReadinessRuntimePath | null = null;
let completionMechanism: ProductReadinessCompletionMechanism = null;
let completionTailInvoked = false;
let completionCheckObserved = false;

export function resetProductReadinessRealFounderPathForTests(): void {
  selectedRuntimePath = null;
  completionMechanism = null;
  completionTailInvoked = false;
  completionCheckObserved = false;
}

export function selectProductReadinessRuntimePath(path: ProductReadinessRuntimePath): void {
  selectedRuntimePath = path;
}

export function getSelectedProductReadinessRuntimePath(): ProductReadinessRuntimePath | null {
  return selectedRuntimePath;
}

export function recordProductReadinessCompletionMechanism(
  mechanism: Exclude<ProductReadinessCompletionMechanism, null>,
): void {
  completionMechanism = mechanism;
  if (
    selectedRuntimePath === 'real-founder' &&
    mechanism !== 'completion-tail' &&
    !hasProductReadinessSimulationCompletePropagated()
  ) {
    // Real founder path must use the shared completion tail — not propagate-only or direct-complete.
  }
}

export function hasProductReadinessCompletionTailInvoked(): boolean {
  return completionTailInvoked;
}

export function emitRealFounderPathDiagnostic(
  input: Pick<RunProductReadinessSimulationInput, 'onSimulationTrace'>,
  operationId:
    | typeof REAL_FOUNDER_PRODUCT_READINESS_PATH_SELECTED
    | typeof REAL_FOUNDER_COMPLETION_CHECK_OBSERVED
    | typeof REAL_FOUNDER_COMPLETION_TAIL_INVOKED
    | typeof REAL_FOUNDER_COMPLETION_TAIL_COMPLETED
    | typeof REAL_FOUNDER_STAGE2_EXIT_CONFIRMED
    | typeof PRODUCT_READINESS_PROPAGATION_PATH_MISMATCH,
  detail: string,
  phase: 'RUNNING' | 'PASSED' | 'FAILED' = 'PASSED',
): void {
  input.onSimulationTrace?.({
    operationId,
    operationLabel: `${operationId}: ${detail}`,
    phase,
  });
}

export function isProductReadinessCompletionCheckSatisfied(nowMs = Date.now()): boolean {
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
  return resolveProductReadinessCompletionEligibility(
    snap,
    getChatStressTotalScenarios(),
    nowMs,
  ).eligible;
}

export function observeRealFounderCompletionCheck(
  input: Pick<RunProductReadinessSimulationInput, 'onSimulationTrace' | 'productReadinessRuntimePath'>,
  nowMs = Date.now(),
): boolean {
  const summary = buildChatStressSettlementSummary(nowMs);
  const satisfied = isProductReadinessCompletionCheckSatisfied(nowMs);

  if (!satisfied || completionCheckObserved) {
    return satisfied;
  }

  completionCheckObserved = true;
  if (input.productReadinessRuntimePath === 'real-founder') {
    emitRealFounderPathDiagnostic(
      input,
      REAL_FOUNDER_COMPLETION_CHECK_OBSERVED,
      `${PRODUCT_READINESS_COMPLETION_CHECK} settled=${summary.settledCount} pending=${summary.pendingCount} started=${summary.startedCount} completionBoundary=${summary.completionBoundaryReached}`,
    );
  }
  return satisfied;
}

export function markRealFounderCompletionTailInvoked(
  input: Pick<RunProductReadinessSimulationInput, 'onSimulationTrace' | 'productReadinessRuntimePath'>,
): void {
  completionTailInvoked = true;
  recordProductReadinessCompletionMechanism('completion-tail');
  if (input.productReadinessRuntimePath === 'real-founder') {
    emitRealFounderPathDiagnostic(input, REAL_FOUNDER_COMPLETION_TAIL_INVOKED, 'shared completion tail');
  }
}

export function markRealFounderCompletionTailCompleted(
  input: Pick<RunProductReadinessSimulationInput, 'onSimulationTrace' | 'productReadinessRuntimePath'>,
  detail: string,
): void {
  if (input.productReadinessRuntimePath === 'real-founder') {
    emitRealFounderPathDiagnostic(input, REAL_FOUNDER_COMPLETION_TAIL_COMPLETED, detail);
  }
}

export function emitProductReadinessPathMismatchIfNeeded(
  input: Pick<RunProductReadinessSimulationInput, 'onSimulationTrace' | 'productReadinessRuntimePath'>,
  actualMechanism: Exclude<ProductReadinessCompletionMechanism, null>,
): void {
  if (
    input.productReadinessRuntimePath === 'real-founder' &&
    actualMechanism !== 'completion-tail' &&
    actualMechanism !== 'non-blocking-chat-stress' &&
    isProductReadinessCompletionCheckSatisfied()
  ) {
    emitRealFounderPathDiagnostic(
      input,
      PRODUCT_READINESS_PROPAGATION_PATH_MISMATCH,
      `expected completion-tail on real founder path, got ${actualMechanism}`,
      'FAILED',
    );
  }
}

export function confirmRealFounderStage2ProductReadinessExit(
  input: Pick<RunProductReadinessSimulationInput, 'onSimulationTrace' | 'productReadinessRuntimePath'>,
  missingBoundary: string | null,
): void {
  if (input.productReadinessRuntimePath !== 'real-founder') {
    return;
  }
  if (
    missingBoundary === null ||
    missingBoundary === 'Launch readiness assessment complete' ||
    missingBoundary === 'Launch readiness artifacts built' ||
    missingBoundary === 'Intake validation complete'
  ) {
    emitRealFounderPathDiagnostic(
      input,
      REAL_FOUNDER_STAGE2_EXIT_CONFIRMED,
      missingBoundary ?? 'product readiness boundary cleared',
    );
  }
}
