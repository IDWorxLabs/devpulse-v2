/**
 * Phase 27.04 — Launch verdict governance source normalizer (V1).
 */

import type { LaunchVerdictGovernanceAssessment } from '../launch-verdict-governance/launch-verdict-governance-types.js';
import { auditLaunchVerdictGovernanceSource } from './launch-verdict-governance-source-auditor.js';
import {
  LAUNCH_VERDICT_GOVERNANCE_ARRAY_FIELDS,
  LAUNCH_VERDICT_GOVERNANCE_OPTIONAL_ARRAY_FIELDS,
} from './v5-launch-verdict-governance-source-normalization-registry.js';
import type { LaunchVerdictGovernanceSourceAudit } from './v5-launch-verdict-governance-source-normalization-types.js';

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === 'string');
}

export function normalizeLaunchVerdictGovernanceArrays(
  governance: Partial<LaunchVerdictGovernanceAssessment> | null | undefined,
  sourceAudit: LaunchVerdictGovernanceSourceAudit,
): LaunchVerdictGovernanceAssessment {
  const base = governance && typeof governance === 'object' ? { ...governance } : {};

  const normalized: Record<string, unknown> = { ...base };
  for (const field of LAUNCH_VERDICT_GOVERNANCE_ARRAY_FIELDS) {
    if (sourceAudit.missingFields.includes(field) || sourceAudit.undefinedFields.includes(field)) {
      normalized[field] = [];
      continue;
    }
    if (sourceAudit.nonArrayFields.includes(field)) {
      normalized[field] = asStringArray(normalized[field]);
      continue;
    }
    normalized[field] = asStringArray(normalized[field]);
  }

  for (const field of LAUNCH_VERDICT_GOVERNANCE_OPTIONAL_ARRAY_FIELDS) {
    if (!(field in normalized) || normalized[field] == null || !Array.isArray(normalized[field])) {
      normalized[field] = asStringArray(normalized[field]);
    }
  }

  return normalized as unknown as LaunchVerdictGovernanceAssessment;
}

export function normalizeLaunchVerdictGovernanceAtPath(
  root: Record<string, unknown>,
  path: string,
): { root: Record<string, unknown>; applied: boolean } {
  const parts = path.split('.');
  let cursor: Record<string, unknown> = root;
  for (let i = 0; i < parts.length - 1; i += 1) {
    const key = parts[i]!;
    const next = cursor[key];
    if (!next || typeof next !== 'object' || Array.isArray(next)) {
      cursor[key] = {};
    }
    cursor = cursor[key] as Record<string, unknown>;
  }
  const leafKey = parts[parts.length - 1]!;
  const governance = cursor[leafKey];
  const audit = auditLaunchVerdictGovernanceSource({
    governance: governance as Partial<LaunchVerdictGovernanceAssessment> | null | undefined,
    sourcePath: path,
    producerAuthority: 'DEGRADED_FALLBACK_PAYLOAD',
  });
  if (!audit.missingFields.length && !audit.undefinedFields.length && !audit.nonArrayFields.length) {
    return { root, applied: false };
  }
  cursor[leafKey] = normalizeLaunchVerdictGovernanceArrays(
    governance as Partial<LaunchVerdictGovernanceAssessment> | null | undefined,
    audit,
  );
  return { root, applied: true };
}
