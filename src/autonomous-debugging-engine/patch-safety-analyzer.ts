/**
 * Autonomous Debugging Engine — patch safety analysis.
 */

import type { NormalizedFailure, PatchSafetyAnalysis, RepairPlan } from './autonomous-debugging-types.js';

export function analyzePatchSafety(input: {
  failure: NormalizedFailure;
  repairPlan: RepairPlan;
  simulatePromptDriftRepair?: boolean;
}): PatchSafetyAnalysis {
  const promptDrift =
    input.simulatePromptDriftRepair ||
    input.repairPlan.repairStrategy === 'REMOVE_UNSUPPORTED_FEATURE' ||
    input.failure.safetyFlags.includes('PROMPT_FAITHFULNESS_SENSITIVE');

  const securityRisk =
    input.failure.safetyFlags.includes('SECURITY_SENSITIVE') ||
    /auth|payment|identity/i.test(input.failure.observed);

  const blockedReason = promptDrift
    ? 'Patch would remove or weaken required prompt feature'
    : securityRisk
      ? 'Security-sensitive change requires human review'
      : null;

  const blocking = blockedReason ? ('BLOCKING' as const) : ('LOW' as const);

  return {
    readOnly: true,
    repairId: input.repairPlan.repairId,
    safe: blockedReason === null,
    promptFaithfulnessRisk: promptDrift ? 'BLOCKING' : 'LOW',
    capabilityRisk: input.failure.category === 'CAPABILITY_GAP' ? 'HIGH' : 'LOW',
    securityRisk: securityRisk ? 'BLOCKING' : 'LOW',
    dataLossRisk: input.repairPlan.repairStrategy === 'REMOVE_UNSUPPORTED_FEATURE' ? 'HIGH' : 'LOW',
    accessibilityRisk:
      input.repairPlan.repairStrategy === 'FIX_ACCESSIBLE_LABEL' ? 'LOW' : 'MEDIUM',
    regressionRisk: input.repairPlan.repairStrategy === 'FIX_LAYOUT_OVERFLOW' ? 'MEDIUM' : 'LOW',
    architectureDriftRisk: promptDrift ? 'HIGH' : 'LOW',
    launchReadinessRisk: blockedReason ? 'BLOCKING' : 'LOW',
    userSafetyRisk: securityRisk ? 'BLOCKING' : 'LOW',
    blockedReason,
  };
}
