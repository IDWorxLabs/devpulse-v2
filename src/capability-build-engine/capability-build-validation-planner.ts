/**
 * Capability Build Engine — build validation planner.
 */

import type {
  CapabilityBuildInput,
  CapabilityBuildRiskAnalysis,
  CapabilityBuildValidationPlan,
} from './capability-build-types.js';
import { getCachedValidationPlan, setCachedValidationPlan } from './capability-build-cache.js';

let validationPlans = 0;

export function planCapabilityBuildValidation(
  input: CapabilityBuildInput,
  risk: CapabilityBuildRiskAnalysis,
): CapabilityBuildValidationPlan {
  const cacheKey = [input.proposedCapability, risk.riskScore, input.trustImpact, input.world2Impact].join('|');
  const cached = getCachedValidationPlan(cacheKey);
  if (cached) return cached;

  validationPlans += 1;

  const requirements = [
    'module_validation',
    'integration_validation',
    'verification_validation',
    'uvl_validation',
  ];

  if (input.trustImpact || risk.factors.includes('trust_impact')) {
    requirements.push('trust_validation');
  }
  if (risk.riskLevel === 'HIGH') {
    requirements.push('stress_test_110_scenarios', 'upstream_validation_chain');
  }
  if (input.world2Impact) {
    requirements.push('world2_sandbox_validation');
  }

  const plan: CapabilityBuildValidationPlan = {
    requirements: [...new Set(requirements)],
    moduleValidation: true,
    integrationValidation: true,
    verificationValidation: true,
    trustValidation: input.trustImpact === true || risk.factors.includes('trust_impact'),
    uvlValidation: true,
  };

  setCachedValidationPlan(cacheKey, plan);
  return plan;
}

export function getValidationPlansCount(): number {
  return validationPlans;
}

export function resetBuildValidationPlannerForTests(): void {
  validationPlans = 0;
}
