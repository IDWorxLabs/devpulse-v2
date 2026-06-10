/**
 * Capability Verification Engine — risk validator.
 */

import type { CapabilityRiskValidation, CapabilityVerificationInput } from './capability-verification-types.js';

let riskValidationCount = 0;

export function validateCapabilityRisk(input: CapabilityVerificationInput): CapabilityRiskValidation {
  riskValidationCount += 1;

  const riskScore = input.riskScore ?? 25;
  const integrationCount = input.integrationPoints?.length ?? 0;

  let riskLevel: CapabilityRiskValidation['riskLevel'] = 'LOW';
  if (riskScore >= 85) riskLevel = 'CRITICAL';
  else if (riskScore >= 65) riskLevel = 'HIGH';
  else if (riskScore >= 35) riskLevel = 'MEDIUM';

  if (input.trustImpact && riskLevel === 'LOW') riskLevel = 'MEDIUM';
  if (input.world2Impact && riskScore >= 50) riskLevel = 'HIGH';

  return {
    riskLevel,
    blastRadius: Math.min(100, riskScore + integrationCount * 5),
    dependencyRisk: Math.min(100, integrationCount * 10),
    integrationRisk: Math.min(100, integrationCount * 8 + (input.trustImpact ? 15 : 0)),
  };
}

export function getRiskValidationCount(): number {
  return riskValidationCount;
}

export function resetRiskValidatorForTests(): void {
  riskValidationCount = 0;
}
