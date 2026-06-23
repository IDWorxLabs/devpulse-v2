/**
 * Phase 27.06 — Governance payload shape validator (V1).
 */

import type { GovernancePayloadShapeValidation } from './launch-verdict-governance-source-normalization-types.js';
import { LAUNCH_VERDICT_GOVERNANCE_REQUIRED_ARRAY_FIELDS } from './launch-verdict-governance-source-normalization-registry.js';
import type { LaunchVerdictGovernanceAssessment } from '../launch-verdict-governance/launch-verdict-governance-types.js';

export function validateGovernancePayloadShape(
  governance: Partial<LaunchVerdictGovernanceAssessment> | null | undefined,
): GovernancePayloadShapeValidation {
  if (!governance || typeof governance !== 'object') {
    return {
      readOnly: true,
      shapeValid: false,
      missingArrayFields: [...LAUNCH_VERDICT_GOVERNANCE_REQUIRED_ARRAY_FIELDS],
      invalidArrayFields: [],
      reason: 'launchVerdictGovernance object absent',
    };
  }

  const missingArrayFields: string[] = [];
  const invalidArrayFields: string[] = [];

  for (const field of LAUNCH_VERDICT_GOVERNANCE_REQUIRED_ARRAY_FIELDS) {
    const value = governance[field as keyof typeof governance];
    if (!(field in governance) || value == null) {
      missingArrayFields.push(field);
    } else if (!Array.isArray(value)) {
      invalidArrayFields.push(field);
    }
  }

  return {
    readOnly: true,
    shapeValid: missingArrayFields.length === 0 && invalidArrayFields.length === 0,
    missingArrayFields,
    invalidArrayFields,
    reason:
      missingArrayFields.length > 0 || invalidArrayFields.length > 0
        ? `Invalid governance payload shape: missing=${missingArrayFields.join(', ') || 'none'} invalid=${invalidArrayFields.join(', ') || 'none'}`
        : null,
  };
}

export function assertGovernancePayloadShapeForReportBuilder(
  governance: Partial<LaunchVerdictGovernanceAssessment> | null | undefined,
): void {
  const validation = validateGovernancePayloadShape(governance);
  if (!validation.shapeValid) {
    throw new Error(validation.reason ?? 'Invalid launchVerdictGovernance payload shape');
  }
}
