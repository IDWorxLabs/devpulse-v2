/**
 * Capability Planning Engine — verification planner.
 */

import type {
  CapabilityImpactAnalysis,
  CapabilityPlanningInput,
  CapabilityRiskAnalysis,
  CapabilityVerificationPlan,
  VerificationDepth,
} from './capability-planning-types.js';

let verificationPlanCount = 0;

export function planCapabilityVerification(
  input: CapabilityPlanningInput,
  impact: CapabilityImpactAnalysis,
  risk: CapabilityRiskAnalysis,
): CapabilityVerificationPlan {
  verificationPlanCount += 1;

  const requirements: string[] = ['foundation_ownership_check', 'capability_registry_check'];
  let depth: VerificationDepth = 'STANDARD';

  if (input.researchDecision === 'OPTIMIZATION_REQUIRED' && risk.riskLevel === 'LOW') {
    depth = 'QUICK';
    requirements.push('performance_baseline_check');
  } else if (impact.affectedSystems.includes('Trust') || input.trustImpact) {
    depth = 'TRUST_RECOVERY';
    requirements.push('trust_engine_validation', 'evidence_ledger_review');
  } else if (risk.riskLevel === 'HIGH' || impact.impactLevel === 'HIGH') {
    depth = 'DEEP';
    requirements.push('uvl_row_registration', 'stress_test_110_scenarios', 'integration_read_only_check');
  } else if (risk.riskLevel === 'MEDIUM') {
    depth = 'STANDARD';
    requirements.push('typecheck', 'upstream_validation');
  } else {
    depth = 'QUICK';
    requirements.push('typecheck');
  }

  if (input.researchDecision === 'DIAGNOSTIC_REQUIRED') {
    requirements.push('diagnostic_trace_validation');
  }

  return { depth, requirements: [...new Set(requirements)] };
}

export function getVerificationPlanCount(): number {
  return verificationPlanCount;
}

export function resetVerificationPlannerForTests(): void {
  verificationPlanCount = 0;
}
