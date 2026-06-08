/**
 * Acquisition verification engine — creates verification requirements.
 * Planning only. No verification execution performed.
 */

import type { AcquisitionInput, AcquisitionMode, VerificationRequirement } from './types.js';

const VERIFICATION_MODES: readonly AcquisitionMode[] = [
  'BUILD_INTERNAL_TOOL',
  'INSTALL_DEPENDENCY_PROPOSAL',
  'REQUEST_EXTERNAL_TOOL',
  'CREATE_GOVERNANCE_LAYER',
];

const ARCHITECTURE_TYPES = ['ARCHITECTURE_CAPABILITY', 'GOVERNANCE_CAPABILITY'] as const;

export function createVerificationRequirements(
  input: AcquisitionInput,
  blocked: boolean,
): VerificationRequirement[] {
  if (blocked) return [];

  const requirements: VerificationRequirement[] = [];

  if ((VERIFICATION_MODES as readonly string[]).includes(input.requestedAcquisitionMode)) {
    requirements.push({
      requirementId: `ver-mode-${input.capabilityGapId}`,
      requirementType: 'VERIFICATION_GATE',
      description: `Verification required before ${input.requestedAcquisitionMode} acquisition`,
      required: true,
    });
  }

  if ((ARCHITECTURE_TYPES as readonly string[]).includes(input.capabilityType)) {
    requirements.push({
      requirementId: `ver-arch-${input.capabilityGapId}`,
      requirementType: 'ARCHITECTURE_REVIEW',
      description: 'Architecture-related capability requires architecture review',
      required: true,
    });
  }

  if (input.requestedAcquisitionMode === 'CREATE_GOVERNANCE_LAYER' || input.capabilityType === 'GOVERNANCE_CAPABILITY') {
    requirements.push({
      requirementId: `ver-gov-${input.capabilityGapId}`,
      requirementType: 'GOVERNANCE_REVIEW',
      description: 'Governance layer proposal requires governance review',
      required: true,
    });
  }

  return requirements;
}

export function verificationRequiredForMode(mode: AcquisitionMode): boolean {
  return (VERIFICATION_MODES as readonly string[]).includes(mode);
}

export function verificationRequirementsKey(requirements: VerificationRequirement[]): string {
  return requirements.map((r) => `${r.requirementType}|${r.required}`).join(';');
}
