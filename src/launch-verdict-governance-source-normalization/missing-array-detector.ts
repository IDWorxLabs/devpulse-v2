/**
 * Phase 27.06 — Missing governance array detector (V1).
 */

import type { GovernanceSourceAudit, MissingArrayDetection } from './launch-verdict-governance-source-normalization-types.js';

export function detectMissingGovernanceArrays(
  sourceAudit: GovernanceSourceAudit,
): MissingArrayDetection {
  const missingGovernanceArrays = [
    ...new Set([...sourceAudit.missingFields, ...sourceAudit.undefinedFields]),
  ];

  return {
    readOnly: true,
    missingRequiredEvidenceMissing: missingGovernanceArrays.includes('requiredEvidenceMissing'),
    missingBlockingAuthorities: missingGovernanceArrays.includes('blockingAuthorities'),
    missingGovernanceArrays,
    normalizationRequired: missingGovernanceArrays.length > 0 || sourceAudit.nonArrayFields.length > 0,
    reason: sourceAudit.reason,
  };
}
