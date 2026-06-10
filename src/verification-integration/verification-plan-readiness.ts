/**
 * Verification Integration — readiness evaluation.
 */

import type { VerificationPlan } from '../verification-intelligence/verification-plan-types.js';
import type {
  VerificationReadinessModel,
  VerificationReadinessState,
} from './verification-integration-types.js';

let readinessEvaluations = 0;

export function evaluateVerificationReadiness(
  plan: VerificationPlan,
  trustScore: number | null,
): VerificationReadinessModel {
  readinessEvaluations += 1;
  const reasons: string[] = [];
  let state: VerificationReadinessState = 'READY';

  if (plan.type === 'TRUST_RECOVERY' || plan.strategy === 'TRUST_RECOVERY') {
    state = 'TRUST_RECOVERY_REQUIRED';
    reasons.push('Trust recovery strategy or plan type requires review before execution');
  } else if (plan.type === 'RISK_ESCALATED' || plan.riskScore >= 80) {
    state = 'RISK_ESCALATED';
    reasons.push('High risk score or escalated plan type');
  } else if (trustScore !== null && trustScore < 50) {
    state = 'TRUST_RECOVERY_REQUIRED';
    reasons.push(`Trust score ${trustScore} below threshold`);
  } else if (plan.confidence < 55) {
    state = 'BLOCKED';
    reasons.push(`Confidence ${plan.confidence} too low for planning readiness`);
  } else if (plan.confidence < 70 || plan.riskScore >= 60) {
    state = 'NEEDS_REVIEW';
    reasons.push('Confidence or risk requires human review before execution phase');
  } else {
    reasons.push('Confidence and risk within acceptable planning thresholds');
  }

  return {
    planId: plan.id,
    state,
    confidence: plan.confidence,
    riskScore: plan.riskScore,
    strategy: plan.strategy,
    planType: plan.type,
    reasons,
    evaluatedAt: Date.now(),
  };
}

export function getReadinessEvaluationCount(): number {
  return readinessEvaluations;
}

export function resetVerificationReadinessForTests(): void {
  readinessEvaluations = 0;
}
