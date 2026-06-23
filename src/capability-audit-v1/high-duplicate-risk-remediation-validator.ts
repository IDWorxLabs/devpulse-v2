/**
 * AiDevEngine Capability Audit V1 — high duplicate-risk remediation validation.
 */

import type { CapabilityEntry, CapabilityRecommendation } from './capability-audit-types.js';
import {
  HIGH_DUPLICATE_RISK_REMEDIATIONS,
  type HighDuplicateRiskRemediation,
} from './high-duplicate-risk-remediations.js';

const VALID_DECISIONS: readonly CapabilityRecommendation[] = [
  'KEEP',
  'EXTEND',
  'MERGE',
  'REPLACE',
  'REMOVE',
];

export interface HighDuplicateRiskRemediationValidation {
  complete: boolean;
  highRiskCapabilities: readonly string[];
  remediatedCapabilities: readonly string[];
  missingRemediations: readonly string[];
  orphanRemediations: readonly string[];
  invalidDecisions: readonly string[];
  recommendationMismatches: readonly string[];
}

export function validateHighDuplicateRiskRemediations(
  capabilities: readonly CapabilityEntry[],
): HighDuplicateRiskRemediationValidation {
  const highRiskCapabilities = capabilities
    .filter((entry) => entry.duplicateRisk === 'HIGH')
    .map((entry) => entry.name);

  const remediationByName = new Map<string, HighDuplicateRiskRemediation>(
    HIGH_DUPLICATE_RISK_REMEDIATIONS.map((entry) => [entry.capabilityName, entry]),
  );

  const missingRemediations = highRiskCapabilities.filter(
    (name) => !remediationByName.has(name),
  );

  const orphanRemediations = HIGH_DUPLICATE_RISK_REMEDIATIONS.filter(
    (entry) => !highRiskCapabilities.includes(entry.capabilityName),
  ).map((entry) => entry.capabilityName);

  const invalidDecisions = HIGH_DUPLICATE_RISK_REMEDIATIONS.filter(
    (entry) => !VALID_DECISIONS.includes(entry.decision),
  ).map((entry) => entry.capabilityName);

  const emptyRationale = HIGH_DUPLICATE_RISK_REMEDIATIONS.filter(
    (entry) => entry.rationale.trim().length === 0,
  ).map((entry) => entry.capabilityName);

  const recommendationMismatches = highRiskCapabilities.flatMap((name) => {
    const capability = capabilities.find((entry) => entry.name === name);
    const remediation = remediationByName.get(name);
    if (!capability || !remediation) return [];
    if (capability.recommendation !== remediation.decision) {
      return [`${name}: inventory=${capability.recommendation} remediation=${remediation.decision}`];
    }
    return [];
  });

  const complete =
    highRiskCapabilities.length > 0 &&
    missingRemediations.length === 0 &&
    orphanRemediations.length === 0 &&
    invalidDecisions.length === 0 &&
    emptyRationale.length === 0 &&
    recommendationMismatches.length === 0;

  return {
    complete,
    highRiskCapabilities,
    remediatedCapabilities: HIGH_DUPLICATE_RISK_REMEDIATIONS.map((entry) => entry.capabilityName),
    missingRemediations,
    orphanRemediations,
    invalidDecisions: [...invalidDecisions, ...emptyRationale.map((name) => `${name} (empty rationale)`)],
    recommendationMismatches,
  };
}
