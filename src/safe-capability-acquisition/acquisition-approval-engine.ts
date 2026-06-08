/**
 * Acquisition approval engine — creates approval requirements.
 * Planning only. No approval execution performed.
 */

import type { AcquisitionInput, AcquisitionMode, AcquisitionRiskLevel, ApprovalRequirement } from './types.js';
import { APPROVAL_REQUIRED_MODES } from './types.js';
import { requiresRiskApproval } from './acquisition-risk-engine.js';

export function createApprovalRequirements(
  input: AcquisitionInput,
  riskLevel: AcquisitionRiskLevel,
  blocked: boolean,
): ApprovalRequirement[] {
  if (blocked) return [];

  const requirements: ApprovalRequirement[] = [];
  const modeRequiresApproval = (APPROVAL_REQUIRED_MODES as readonly string[]).includes(input.requestedAcquisitionMode);
  const riskRequiresApproval = requiresRiskApproval(riskLevel);

  if (modeRequiresApproval) {
    requirements.push({
      requirementId: `appr-mode-${input.capabilityGapId}`,
      requirementType: 'FOUNDER_APPROVAL',
      description: `Founder approval required for ${input.requestedAcquisitionMode} acquisition mode`,
      required: true,
      riskLevel,
    });
  }

  if (riskRequiresApproval) {
    requirements.push({
      requirementId: `appr-risk-${input.capabilityGapId}`,
      requirementType: 'RISK_APPROVAL',
      description: `${riskLevel} risk requires explicit approval before acquisition planning proceeds`,
      required: true,
      riskLevel,
    });
  }

  if (input.capabilityType === 'GOVERNANCE_CAPABILITY' || input.requestedAcquisitionMode === 'CREATE_GOVERNANCE_LAYER') {
    requirements.push({
      requirementId: `appr-gov-${input.capabilityGapId}`,
      requirementType: 'GOVERNANCE_APPROVAL',
      description: 'Governance layer acquisition requires governance approval',
      required: true,
      riskLevel,
    });
  }

  return requirements;
}

export function approvalRequiredForMode(mode: AcquisitionMode): boolean {
  return (APPROVAL_REQUIRED_MODES as readonly string[]).includes(mode);
}

export function approvalNotRequiredForMode(mode: AcquisitionMode): boolean {
  return mode === 'RESEARCH_ONLY' || mode === 'DEFER_CAPABILITY';
}

export function approvalRequirementsKey(requirements: ApprovalRequirement[]): string {
  return requirements.map((r) => `${r.requirementType}|${r.required}`).join(';');
}
