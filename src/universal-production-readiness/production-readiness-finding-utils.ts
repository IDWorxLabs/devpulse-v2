/**
 * Universal Production Readiness Verification V1 — finding helpers.
 */

import { createHash } from 'node:crypto';
import type { ReadinessDimensionId, ReadinessFinding, ReadinessFindingSeverity } from './universal-production-readiness-types.js';
import { UNIVERSAL_PRODUCTION_READINESS_SOURCE } from './universal-production-readiness-types.js';

let findingCounter = 0;

export function resetFindingCounterForTests(): void {
  findingCounter = 0;
}

export function createReadinessFinding(input: {
  code: string;
  severity: ReadinessFindingSeverity;
  dimension: ReadinessDimensionId;
  detail: string;
  requirementIds?: readonly string[];
  behaviorIds?: readonly string[];
  capabilityKeys?: readonly string[];
  providerIds?: readonly string[];
  packIds?: readonly string[];
  affectedArtifacts?: readonly string[];
  expectedEvidence?: readonly string[];
  observedEvidence?: readonly string[];
  repairCategory?: string;
}): ReadinessFinding {
  findingCounter += 1;
  const findingId = `finding-${input.code}-${findingCounter}`;
  const fingerprint = createHash('sha256')
    .update(`${findingId}|${input.code}|${input.dimension}|${input.detail}`)
    .digest('hex')
    .slice(0, 16);
  return {
    findingId,
    code: input.code,
    severity: input.severity,
    dimension: input.dimension,
    requirementIds: input.requirementIds ?? [],
    behaviorIds: input.behaviorIds ?? [],
    capabilityKeys: input.capabilityKeys ?? [],
    providerIds: input.providerIds ?? [],
    packIds: input.packIds ?? [],
    affectedArtifacts: input.affectedArtifacts ?? [],
    expectedEvidence: input.expectedEvidence ?? [],
    observedEvidence: input.observedEvidence ?? [input.detail],
    repairCategory: input.repairCategory ?? 'engineering_repair',
    provenance: [UNIVERSAL_PRODUCTION_READINESS_SOURCE, input.dimension],
    fingerprint,
  };
}

export function dimensionResult(
  dimensionId: ReadinessDimensionId,
  findings: readonly ReadinessFinding[],
): { dimensionId: ReadinessDimensionId; passed: boolean; score: number; findings: readonly ReadinessFinding[]; provenance: readonly string[] } {
  const blockers = findings.filter((f) =>
    ['BLOCKER', 'CRITICAL_FAILURE', 'REQUIRED_GAP'].includes(f.severity),
  );
  const warnings = findings.filter((f) => f.severity === 'WARNING');
  const score =
    findings.length === 0
      ? 100
      : Math.max(0, 100 - blockers.length * 25 - warnings.length * 5);
  return {
    dimensionId,
    passed: blockers.length === 0,
    score,
    findings,
    provenance: [UNIVERSAL_PRODUCTION_READINESS_SOURCE, dimensionId],
  };
}
