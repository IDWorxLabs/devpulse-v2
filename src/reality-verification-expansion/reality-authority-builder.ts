/**
 * Reality Verification Expansion — unified reality authority builder.
 */

import type {
  ClaimSupportStatus,
  ClaimValidation,
  RealityConflict,
  RealityConsistencyScores,
  RealityGap,
  RealityRecord,
  UnifiedRealityAuthority,
} from './reality-verification-types.js';
import { analyzeRealityConsistency } from './reality-consistency-analyzer.js';
import { detectRealityConflicts } from './reality-conflict-detector.js';
import { analyzeRealityGaps } from './reality-gap-analyzer.js';
import { getCachedRealityAuthority, setCachedRealityAuthority } from './reality-verification-cache.js';

let authorityBuildCount = 0;
let authorityCounter = 0;

function resolveOverallState(validations: ClaimValidation[]): ClaimSupportStatus {
  if (validations.some((v) => v.supportStatus === 'CONTRADICTED')) return 'CONTRADICTED';
  if (validations.every((v) => v.supportStatus === 'SUPPORTED')) return 'SUPPORTED';
  if (validations.some((v) => v.supportStatus === 'SUPPORTED')) return 'PARTIALLY_SUPPORTED';
  if (validations.some((v) => v.supportStatus === 'PARTIALLY_SUPPORTED')) return 'PARTIALLY_SUPPORTED';
  if (validations.length === 0) return 'UNSUPPORTED';
  return 'UNSUPPORTED';
}

function computeVerificationReadiness(
  validations: ClaimValidation[],
  consistency: RealityConsistencyScores,
  gaps: RealityGap[],
): number {
  const supported = validations.filter((v) => v.supportStatus === 'SUPPORTED').length;
  const ratio = validations.length > 0 ? supported / validations.length : 0;
  return Math.max(0, Math.min(100, Math.round(ratio * 80 + consistency.alignmentScore * 0.2 - gaps.length * 3)));
}

export function buildUnifiedRealityAuthority(
  requestId: string,
  records: RealityRecord[],
  validations: ClaimValidation[],
): {
  authority: UnifiedRealityAuthority;
  consistency: RealityConsistencyScores;
  conflicts: RealityConflict[];
  gaps: RealityGap[];
} {
  const cacheKey = [requestId, records.map((r) => r.recordId).join(',')].join('|');
  const cached = getCachedRealityAuthority(cacheKey);
  const consistency = analyzeRealityConsistency(records, validations);
  const conflicts = detectRealityConflicts(records, validations);
  const gaps = analyzeRealityGaps(records, validations);

  if (cached) {
    return { authority: cached, consistency, conflicts, gaps };
  }

  authorityBuildCount += 1;
  authorityCounter += 1;

  const overallRealityState = resolveOverallState(validations);
  const supportedCount = validations.filter((v) => v.supportStatus === 'SUPPORTED').length;
  const contradictedCount = validations.filter((v) => v.supportStatus === 'CONTRADICTED').length;

  const authority: UnifiedRealityAuthority = {
    authorityId: `reality-authority-${authorityCounter}`,
    overallRealityState,
    verificationReadiness: computeVerificationReadiness(validations, consistency, gaps),
    claimCount: validations.length,
    supportedCount,
    contradictedCount,
    consistency,
    conflictCount: conflicts.length,
    gapCount: gaps.length,
    participatingSources: [...new Set(records.map((r) => r.source))],
    createdAt: Date.now(),
  };

  setCachedRealityAuthority(cacheKey, authority);
  return { authority, consistency, conflicts, gaps };
}

export function getAuthorityBuildCount(): number {
  return authorityBuildCount;
}

export function resetRealityAuthorityBuilderForTests(): void {
  authorityBuildCount = 0;
  authorityCounter = 0;
}
