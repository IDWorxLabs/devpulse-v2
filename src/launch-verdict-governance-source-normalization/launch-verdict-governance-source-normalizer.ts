/**
 * Phase 27.06 — Launch verdict governance source normalizer (V1).
 */

import type { LaunchVerdictGovernanceAssessment } from '../launch-verdict-governance/launch-verdict-governance-types.js';
import { auditGovernanceSource } from './governance-source-auditor.js';
import type { GovernanceSourceAudit } from './launch-verdict-governance-source-normalization-types.js';
import {
  LAUNCH_VERDICT_GOVERNANCE_OPTIONAL_ARRAY_FIELDS,
  LAUNCH_VERDICT_GOVERNANCE_REQUIRED_ARRAY_FIELDS,
} from './launch-verdict-governance-source-normalization-registry.js';

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === 'string');
}

/** Authoritative source invariant — required arrays default to []. */
export function applyLaunchVerdictGovernanceSourceInvariant(
  governance: Partial<LaunchVerdictGovernanceAssessment> | null | undefined,
  sourceAudit: GovernanceSourceAudit,
): LaunchVerdictGovernanceAssessment {
  const base = governance && typeof governance === 'object' ? { ...governance } : {};
  const normalized: Record<string, unknown> = { ...base };

  for (const field of LAUNCH_VERDICT_GOVERNANCE_REQUIRED_ARRAY_FIELDS) {
    const current = normalized[field];
    if (!(field in normalized) || current == null || !Array.isArray(current)) {
      normalized[field] ??= [];
      if (!Array.isArray(normalized[field])) {
        normalized[field] = asStringArray(current);
      }
      continue;
    }
    normalized[field] = asStringArray(current);
  }

  for (const field of LAUNCH_VERDICT_GOVERNANCE_OPTIONAL_ARRAY_FIELDS) {
    if (!(field in normalized) || normalized[field] == null || !Array.isArray(normalized[field])) {
      normalized[field] = asStringArray(normalized[field]);
    }
  }

  if (sourceAudit.missingFields.length > 0 || sourceAudit.undefinedFields.length > 0) {
    normalized.requiredEvidenceMissing ??= [];
    normalized.blockingAuthorities ??= [];
    normalized.satisfiedRules ??= [];
    normalized.failedRules ??= [];
    normalized.governanceReasoning ??= [];
  }

  return normalized as unknown as LaunchVerdictGovernanceAssessment;
}

export function normalizeLaunchVerdictGovernanceAtPath(
  root: Record<string, unknown>,
  path: string,
  upstreamProducer: GovernanceSourceAudit['producerAuthority'],
): { root: Record<string, unknown>; applied: boolean } {
  const parts = path.split('.');
  let cursor: Record<string, unknown> = root;
  for (let i = 0; i < parts.length - 1; i += 1) {
    const key = parts[i]!;
    if (!cursor[key] || typeof cursor[key] !== 'object' || Array.isArray(cursor[key])) {
      cursor[key] = {};
    }
    cursor = cursor[key] as Record<string, unknown>;
  }
  const leafKey = parts[parts.length - 1]!;
  const audit = auditGovernanceSource({
    governance: cursor[leafKey] as Partial<LaunchVerdictGovernanceAssessment> | null | undefined,
    sourcePath: path,
    upstreamProducer,
  });
  if (!audit.missingFields.length && !audit.undefinedFields.length && !audit.nonArrayFields.length) {
    return { root, applied: false };
  }
  cursor[leafKey] = applyLaunchVerdictGovernanceSourceInvariant(
    cursor[leafKey] as Partial<LaunchVerdictGovernanceAssessment> | null | undefined,
    audit,
  );
  return { root, applied: true };
}
