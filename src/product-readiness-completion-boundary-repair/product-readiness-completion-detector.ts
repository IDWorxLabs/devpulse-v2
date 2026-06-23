/**
 * Phase 26.90 — Product readiness completion detector (V1).
 */

import {
  hasProductReadinessSimulationCompletePropagated,
} from '../founder-test-chat-stress-simulation/chat-stress-completion-propagation.js';
import { resolveProductReadinessCompletionEligibility } from '../founder-test-product-readiness/product-readiness-completion-boundary.js';
import { getChatStressCompletionSnapshot, getChatStressTotalScenarios } from '../founder-test-chat-stress-simulation/chat-stress-completion-tracker.js';
import type {
  ProductReadinessCompletionDetection,
  ProductReadinessCompletionFailureClass,
} from './product-readiness-completion-boundary-repair-types.js';
import { auditChatStressSettlement, isProductReadinessRule1Satisfied } from './chat-stress-settlement-auditor.js';

let productReadinessCompleteEventEmitted = false;
let productReadinessCompleteSimulationTraced = false;

export function resetProductReadinessCompleteEventEmissionForTests(): void {
  productReadinessCompleteEventEmitted = false;
  productReadinessCompleteSimulationTraced = false;
}

export function hasProductReadinessCompleteEventEmitted(): boolean {
  return productReadinessCompleteEventEmitted;
}

export function hasProductReadinessCompleteSimulationTraced(): boolean {
  return productReadinessCompleteSimulationTraced;
}

export function markProductReadinessCompleteEventEmitted(): void {
  productReadinessCompleteEventEmitted = true;
}

export function markProductReadinessCompleteSimulationTraced(): void {
  productReadinessCompleteSimulationTraced = true;
}

export function detectProductReadinessCompletion(nowMs = Date.now()): ProductReadinessCompletionDetection {
  const settlement = auditChatStressSettlement(nowMs);
  const snap = getChatStressCompletionSnapshot(nowMs);
  const eligibility = resolveProductReadinessCompletionEligibility(
    snap,
    getChatStressTotalScenarios(),
    nowMs,
  );
  const propagated = hasProductReadinessSimulationCompletePropagated();
  const eventEmitted = productReadinessCompleteEventEmitted;

  const rule1 = isProductReadinessRule1Satisfied({
    startedCount: snap.startedCount,
    settledCount: snap.settledCount,
    pendingCount: snap.pendingCount,
  });

  const productReadinessComplete =
    rule1 && !hasContradictoryCompletionEvidence(nowMs) && (propagated || eventEmitted || eligibility.eligible);

  let failureClass: ProductReadinessCompletionFailureClass = 'NONE';
  let reason: string | null = null;

  if (!settlement.rule1Satisfied) {
    failureClass = 'SETTLEMENT_NOT_COMPLETE';
    reason = settlement.reason;
  } else if (!eligibility.eligible && !propagated) {
    failureClass = 'COMPLETION_DETECTION_MISSING';
    reason = 'Settlement satisfied Rule 1 but completion eligibility not detected';
  } else if (eligibility.eligible && !propagated && !eventEmitted) {
    failureClass = 'COMPLETION_EVENT_NOT_EMITTED';
    reason = 'Completion eligible but PRODUCT_READINESS_COMPLETE not emitted and boundary not propagated';
  } else if (eventEmitted && !propagated) {
    failureClass = 'COMPLETION_EVENT_DROPPED';
    reason = 'PRODUCT_READINESS_COMPLETE emitted but product-readiness-simulation-complete not propagated';
  } else if (productReadinessComplete) {
    reason = 'Product readiness completion chain satisfied';
  }

  return {
    readOnly: true,
    productReadinessComplete: propagated || (rule1 && eligibility.eligible),
    completionCheckEmitted: eligibility.eligible,
    productReadinessCompletePropagated: propagated,
    productReadinessCompleteEventEmitted: eventEmitted,
    failureClass,
    reason,
  };
}

function hasContradictoryCompletionEvidence(nowMs: number): boolean {
  const snap = getChatStressCompletionSnapshot(nowMs);
  return snap.pendingCount > 0 || (snap.startedCount > 0 && snap.settledCount < snap.startedCount);
}
