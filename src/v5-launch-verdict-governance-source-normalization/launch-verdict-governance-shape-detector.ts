/**
 * Phase 27.04 — Launch verdict governance shape detector (V1).
 */

import type {
  LaunchVerdictGovernanceShapeDetection,
  LaunchVerdictGovernanceSourceAudit,
} from './v5-launch-verdict-governance-source-normalization-types.js';

export function detectLaunchVerdictGovernanceShape(
  sourceAudit: LaunchVerdictGovernanceSourceAudit,
): LaunchVerdictGovernanceShapeDetection {
  const missingFieldsBeforeNormalization = [
    ...new Set([...sourceAudit.missingFields, ...sourceAudit.undefinedFields]),
  ];

  return {
    readOnly: true,
    normalizationRequired: missingFieldsBeforeNormalization.length > 0,
    missingFieldsBeforeNormalization,
    failureClass: sourceAudit.failureClass,
    reason: sourceAudit.reason,
  };
}
