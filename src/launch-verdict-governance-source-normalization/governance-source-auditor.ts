/**
 * Phase 27.06 — Governance source auditor (V1).
 */

import type {
  GovernanceSourceAudit,
  LaunchVerdictGovernanceSourceFailureClass,
  LaunchVerdictGovernanceUpstreamProducer,
} from './launch-verdict-governance-source-normalization-types.js';
import {
  LAUNCH_VERDICT_GOVERNANCE_REQUIRED_ARRAY_FIELDS,
  LAUNCH_VERDICT_GOVERNANCE_SOURCE_PATH,
} from './launch-verdict-governance-source-normalization-registry.js';
import type { LaunchVerdictGovernanceAssessment } from '../launch-verdict-governance/launch-verdict-governance-types.js';

function classifyFailure(missingFields: readonly string[]): LaunchVerdictGovernanceSourceFailureClass {
  if (missingFields.length === 0) return 'NONE';
  if (missingFields.length > 1) return 'MULTIPLE_GOVERNANCE_ARRAYS_ABSENT';
  if (missingFields[0] === 'requiredEvidenceMissing') return 'REQUIRED_EVIDENCE_MISSING_ABSENT';
  if (missingFields[0] === 'blockingAuthorities') return 'BLOCKING_AUTHORITIES_ABSENT';
  return 'GOVERNANCE_ARRAYS_OMITTED';
}

export function auditGovernanceSource(input: {
  governance: Partial<LaunchVerdictGovernanceAssessment> | null | undefined;
  sourcePath?: string;
  upstreamProducer?: LaunchVerdictGovernanceUpstreamProducer;
}): GovernanceSourceAudit {
  const sourcePath = input.sourcePath ?? LAUNCH_VERDICT_GOVERNANCE_SOURCE_PATH;
  const producerAuthority = input.upstreamProducer ?? 'UNKNOWN';

  if (!input.governance || typeof input.governance !== 'object') {
    return {
      readOnly: true,
      governancePresent: false,
      missingFields: [...LAUNCH_VERDICT_GOVERNANCE_REQUIRED_ARRAY_FIELDS],
      undefinedFields: [],
      nonArrayFields: [],
      sourcePath,
      producerAuthority,
      failureClass: 'GOVERNANCE_OBJECT_ABSENT',
      reason: 'launchVerdictGovernance object missing',
    };
  }

  const missingFields: string[] = [];
  const undefinedFields: string[] = [];
  const nonArrayFields: string[] = [];

  for (const field of LAUNCH_VERDICT_GOVERNANCE_REQUIRED_ARRAY_FIELDS) {
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

  return {
    readOnly: true,
    governancePresent: true,
    missingFields,
    undefinedFields,
    nonArrayFields,
    sourcePath,
    producerAuthority,
    failureClass: classifyFailure(missingFields),
    reason:
      missingFields.length > 0
        ? `Governance arrays missing or invalid at ${sourcePath}: ${missingFields.join(', ')}`
        : null,
  };
}
