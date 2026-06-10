/**
 * Verification Integration — plan reporting.
 */

import type { VerificationPlan } from '../verification-intelligence/verification-plan-types.js';
import type { VerificationPlanReport } from './verification-integration-types.js';

export function generateVerificationPlanReport(plan: VerificationPlan): VerificationPlanReport {
  return {
    reportId: `vrpt-${plan.id}`,
    strategy: plan.strategy,
    planType: plan.type,
    confidence: plan.confidence,
    riskScore: plan.riskScore,
    estimatedDurationMs: plan.estimatedDurationMs,
    estimatedCost: plan.estimatedCost,
    requiredValidators: [...plan.requiredValidators],
    optionalValidators: [...plan.optionalValidators],
    executionOrder: [...plan.executionOrder],
    reasoning: [...plan.reasoning],
    generatedAt: Date.now(),
  };
}
