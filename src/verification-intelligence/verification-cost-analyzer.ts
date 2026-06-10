/**
 * Verification Intelligence — cost and duration estimation.
 */

import type { VerificationCostAnalysis, VerificationPlanInput, VerificationPlanType } from './verification-plan-types.js';
import { getVerificationPathEntry } from './verification-path-registry.js';

const VALIDATOR_COST_MS: Record<string, number> = {
  UVL: 8000,
  Runtime: 12000,
  'Route Validation': 6000,
  'Intelligence Validation': 10000,
  'Cloud Validation': 14000,
  'Execution Validation': 16000,
  'World2 Validation': 18000,
  'Release Validation': 12000,
  'Trust Validation': 9000,
  'Report Generation': 3000,
  'Data Model Validation': 7000,
};

const PLAN_COMPLEXITY: Record<VerificationPlanType, 'LOW' | 'MEDIUM' | 'HIGH'> = {
  QUICK: 'LOW',
  STANDARD: 'MEDIUM',
  DEEP: 'HIGH',
  RELEASE: 'HIGH',
  CLOUD: 'HIGH',
  WORLD2: 'HIGH',
  TRUST_RECOVERY: 'HIGH',
  RISK_ESCALATED: 'HIGH',
};

export function analyzeVerificationCost(
  input: VerificationPlanInput,
  planType: VerificationPlanType,
): VerificationCostAnalysis {
  const path = getVerificationPathEntry(planType);
  const validators = [
    ...new Set([...input.requiredValidators, ...(path?.expectedValidatorGroups ?? [])]),
  ];

  let estimatedDurationMs = 0;
  for (const v of validators) {
    estimatedDurationMs += VALIDATOR_COST_MS[v] ?? 5000;
  }

  const complexity = PLAN_COMPLEXITY[planType];
  const complexityMultiplier = complexity === 'LOW' ? 0.7 : complexity === 'MEDIUM' ? 1 : 1.25;
  estimatedDurationMs = Math.round(estimatedDurationMs * complexityMultiplier);

  const estimatedCost = validators.length * 10 + Math.round(estimatedDurationMs / 1000);

  return {
    estimatedCost,
    estimatedDurationMs,
    validatorCount: validators.length,
    complexity,
  };
}
