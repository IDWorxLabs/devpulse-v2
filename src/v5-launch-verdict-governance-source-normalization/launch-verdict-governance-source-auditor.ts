/**
 * Phase 27.04 — Launch verdict governance source auditor (V1).
 */

import type {
  LaunchVerdictGovernanceProducerAuthority,
  LaunchVerdictGovernanceShapeFailureClass,
  LaunchVerdictGovernanceSourceAudit,
} from './v5-launch-verdict-governance-source-normalization-types.js';
import {
  LAUNCH_VERDICT_GOVERNANCE_ARRAY_FIELDS,
  LAUNCH_VERDICT_GOVERNANCE_SOURCE_PATH,
} from './v5-launch-verdict-governance-source-normalization-registry.js';
import type { LaunchVerdictGovernanceAssessment } from '../launch-verdict-governance/launch-verdict-governance-types.js';

function classifyFailure(missingFields: readonly string[]): LaunchVerdictGovernanceShapeFailureClass {
  if (missingFields.length === 0) return 'NONE';
  if (missingFields.length > 1) return 'MULTIPLE_GOVERNANCE_ARRAYS_ABSENT';
  switch (missingFields[0]) {
    case 'requiredEvidenceMissing':
      return 'REQUIRED_EVIDENCE_MISSING_ABSENT';
    case 'blockingAuthorities':
      return 'BLOCKING_AUTHORITIES_ABSENT';
    case 'satisfiedRules':
      return 'SATISFIED_RULES_ABSENT';
    case 'failedRules':
      return 'FAILED_RULES_ABSENT';
    case 'governanceReasoning':
      return 'GOVERNANCE_REASONING_ABSENT';
    default:
      return 'MULTIPLE_GOVERNANCE_ARRAYS_ABSENT';
  }
}

export function auditLaunchVerdictGovernanceSource(input: {
  governance: Partial<LaunchVerdictGovernanceAssessment> | null | undefined;
  sourcePath?: string;
  producerAuthority?: LaunchVerdictGovernanceProducerAuthority;
}): LaunchVerdictGovernanceSourceAudit {
  const sourcePath = input.sourcePath ?? LAUNCH_VERDICT_GOVERNANCE_SOURCE_PATH;
  const producerAuthority = input.producerAuthority ?? 'UNKNOWN';

  if (!input.governance || typeof input.governance !== 'object') {
    return {
      readOnly: true,
      governancePresent: false,
      missingFields: [...LAUNCH_VERDICT_GOVERNANCE_ARRAY_FIELDS],
      undefinedFields: [],
      nonArrayFields: [],
      producerAuthority,
      sourcePath,
      failureClass: 'GOVERNANCE_OBJECT_ABSENT',
      reason: 'launchVerdictGovernance object missing before V5 report generation',
    };
  }

  const missingFields: string[] = [];
  const undefinedFields: string[] = [];
  const nonArrayFields: string[] = [];

  for (const field of LAUNCH_VERDICT_GOVERNANCE_ARRAY_FIELDS) {
    const value = input.governance[field as keyof typeof input.governance];
    if (!(field in input.governance)) {
      missingFields.push(field);
    } else if (value == null) {
      undefinedFields.push(field);
      missingFields.push(field);
    } else if (!Array.isArray(value)) {
      nonArrayFields.push(field);
      missingFields.push(field);
    }
  }

  const failureClass = classifyFailure(missingFields);

  return {
    readOnly: true,
    governancePresent: true,
    missingFields,
    undefinedFields,
    nonArrayFields,
    producerAuthority,
    sourcePath,
    failureClass,
    reason:
      missingFields.length > 0
        ? `Governance arrays missing or invalid at ${sourcePath}: ${missingFields.join(', ')}`
        : null,
  };
}
