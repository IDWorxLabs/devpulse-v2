/**
 * Acquisition rollback engine — creates rollback requirements.
 * Planning only. No rollback execution performed.
 */

import type { AcquisitionInput, AcquisitionMode, RollbackRequirement } from './types.js';

const ROLLBACK_MODES: readonly AcquisitionMode[] = [
  'BUILD_INTERNAL_TOOL',
  'INSTALL_DEPENDENCY_PROPOSAL',
  'CREATE_GOVERNANCE_LAYER',
];

const ARCHITECTURE_ROLLBACK_TYPES = ['ARCHITECTURE_CAPABILITY', 'GOVERNANCE_CAPABILITY'] as const;

export function createRollbackRequirements(
  input: AcquisitionInput,
  blocked: boolean,
): RollbackRequirement[] {
  if (blocked) return [];

  const requirements: RollbackRequirement[] = [];

  if ((ROLLBACK_MODES as readonly string[]).includes(input.requestedAcquisitionMode)) {
    requirements.push({
      requirementId: `rb-mode-${input.capabilityGapId}`,
      requirementType: 'ROLLBACK_PLAN',
      description: `Rollback plan required for ${input.requestedAcquisitionMode} proposal`,
      required: true,
    });
  }

  if (input.requestedAcquisitionMode === 'CREATE_GOVERNANCE_LAYER' || input.capabilityType === 'GOVERNANCE_CAPABILITY') {
    requirements.push({
      requirementId: `rb-gov-${input.capabilityGapId}`,
      requirementType: 'GOVERNANCE_ROLLBACK',
      description: 'Governance proposal requires rollback planning',
      required: true,
    });
  }

  if ((ARCHITECTURE_ROLLBACK_TYPES as readonly string[]).includes(input.capabilityType)) {
    requirements.push({
      requirementId: `rb-arch-${input.capabilityGapId}`,
      requirementType: 'ARCHITECTURE_ROLLBACK',
      description: 'Architecture-modifying capability requires architecture rollback plan',
      required: true,
    });
  }

  return requirements;
}

export function rollbackRequiredForMode(mode: AcquisitionMode): boolean {
  return (ROLLBACK_MODES as readonly string[]).includes(mode);
}

export function rollbackRequirementsKey(requirements: RollbackRequirement[]): string {
  return requirements.map((r) => `${r.requirementType}|${r.required}`).join(';');
}
