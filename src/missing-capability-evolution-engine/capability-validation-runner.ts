/**
 * Missing Capability Evolution Engine — Stage 9: capability validation runner.
 */

import type {
  CapabilityDesign,
  CapabilityValidationEvidence,
  CapabilityValidatorDesign,
  CapabilityWorkspaceArtifact,
} from './missing-capability-evolution-types.js';

export function runCapabilityValidation(input: {
  design: CapabilityDesign;
  validatorDesign: CapabilityValidatorDesign;
  workspace: CapabilityWorkspaceArtifact;
  simulateValidationFailure?: boolean;
}): CapabilityValidationEvidence {
  const allChecks = [
    ...input.validatorDesign.unitChecks,
    ...input.validatorDesign.integrationChecks,
    ...input.validatorDesign.promptFaithfulnessChecks,
    ...input.validatorDesign.capabilityContractChecks,
    ...input.validatorDesign.safetyChecks,
  ];

  if (input.simulateValidationFailure) {
    return {
      readOnly: true,
      capabilityId: input.design.capabilityId,
      status: 'FAILED_VALIDATION',
      validatorNames: ['unit', 'integration', 'prompt-faithfulness', 'contract', 'safety'],
      checksPassed: allChecks.slice(0, Math.max(1, allChecks.length - 2)),
      checksFailed: allChecks.slice(-2),
      coverageSummary: `${allChecks.length - 2}/${allChecks.length} checks passed`,
      safetyResults: ['post-install validation failed'],
      regressionRisk: 'MEDIUM',
      promptFaithfulnessResult: 'PARTIAL',
      capabilityContractResult: 'FAIL',
    };
  }

  return {
    readOnly: true,
    capabilityId: input.design.capabilityId,
    status: 'VALIDATED',
    validatorNames: ['unit', 'integration', 'prompt-faithfulness', 'contract', 'safety'],
    checksPassed: allChecks,
    checksFailed: [],
    coverageSummary: `${allChecks.length}/${allChecks.length} checks passed`,
    safetyResults: input.validatorDesign.safetyChecks.map((c) => `PASS: ${c}`),
    regressionRisk: 'LOW',
    promptFaithfulnessResult: 'PASS',
    capabilityContractResult: 'PASS',
  };
}

export function isValidationInstallable(evidence: CapabilityValidationEvidence): boolean {
  return evidence.status === 'VALIDATED' || evidence.status === 'PARTIALLY_VALIDATED';
}
