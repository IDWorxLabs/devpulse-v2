/**
 * Phase 26.90 — Completion boundary repair planner (V1).
 */

import type {
  ChatStressSettlementAudit,
  CompletionBoundaryRepairPlan,
  ProductReadinessCompletionDetection,
  StageTransitionAnalysis,
} from './product-readiness-completion-boundary-repair-types.js';
import { PRODUCT_READINESS_COMPLETE } from './product-readiness-completion-boundary-repair-registry.js';

export function planCompletionBoundaryRepair(input: {
  settlementAudit: ChatStressSettlementAudit;
  completionDetection: ProductReadinessCompletionDetection;
  stageTransition: StageTransitionAnalysis;
}): CompletionBoundaryRepairPlan {
  const actions: string[] = [];
  const { settlementAudit, completionDetection, stageTransition } = input;

  if (!settlementAudit.rule1Satisfied) {
    return {
      readOnly: true,
      repairRequired: false,
      actions: ['await-chat-stress-settlement'],
      failureClass: 'SETTLEMENT_NOT_COMPLETE',
      emitProductReadinessComplete: false,
      forceCompletionTail: false,
      recordPropagationBoundaries: false,
      reason: settlementAudit.reason,
    };
  }

  if (completionDetection.productReadinessCompletePropagated && completionDetection.productReadinessCompleteEventEmitted) {
    return {
      readOnly: true,
      repairRequired: false,
      actions: ['no-repair-needed'],
      failureClass: 'NONE',
      emitProductReadinessComplete: false,
      forceCompletionTail: false,
      recordPropagationBoundaries: false,
      reason: 'Product readiness completion already propagated',
    };
  }

  if (!completionDetection.productReadinessCompletePropagated) {
    actions.push('invoke-product-readiness-completion-tail');
    actions.push('record-product-readiness-simulation-complete');
  }

  if (!completionDetection.productReadinessCompleteEventEmitted) {
    actions.push(`emit-${PRODUCT_READINESS_COMPLETE}`);
  }

  if (stageTransition.stageAdvancementBlocked && stageTransition.intakeValidationRunning) {
    actions.push('reconcile-intake-validation-boundaries');
  }

  if (stageTransition.intakeValidationComplete && !stageTransition.planningGateEligible) {
    actions.push('enable-planning-gate');
  }

  const repairRequired =
    !completionDetection.productReadinessCompletePropagated ||
    !completionDetection.productReadinessCompleteEventEmitted ||
    stageTransition.stageAdvancementBlocked;

  return {
    readOnly: true,
    repairRequired,
    actions,
    failureClass: completionDetection.failureClass !== 'NONE'
      ? completionDetection.failureClass
      : stageTransition.failureClass,
    emitProductReadinessComplete: !completionDetection.productReadinessCompleteEventEmitted,
    forceCompletionTail: !completionDetection.productReadinessCompletePropagated,
    recordPropagationBoundaries: !completionDetection.productReadinessCompletePropagated,
    reason: completionDetection.reason ?? stageTransition.reason,
  };
}
