/**
 * Reality Verification Expansion — runtime reporting.
 */

import type {
  ClaimValidation,
  RealityConflict,
  RealityConsistencyScores,
  RealityGap,
  RealityVerificationEvaluation,
  RealityVerificationRecord,
  RealityVerificationReport,
} from './reality-verification-types.js';
import { getRealityVerificationCacheStats } from './reality-verification-cache.js';
import { getRealityVerificationHistorySize } from './reality-verification-history.js';

let reportCount = 0;

export function generateRealityVerificationReport(
  record: RealityVerificationRecord,
  consistency: RealityConsistencyScores,
  evaluation: RealityVerificationEvaluation,
  claimValidations: ClaimValidation[],
  conflicts: RealityConflict[],
  gaps: RealityGap[],
): RealityVerificationReport {
  reportCount += 1;
  const cache = getRealityVerificationCacheStats();

  return {
    claimValidations: [...claimValidations],
    supportStatus: record.authority.overallRealityState,
    consistency,
    conflicts: [...conflicts],
    gaps: [...gaps],
    readiness: record.authority.verificationReadiness,
    authorityState: record.authority.overallRealityState,
    historySize: getRealityVerificationHistorySize(),
    cacheHits: cache.hits,
    cacheMisses: cache.misses,
    evaluation,
  };
}

export function getReportCount(): number {
  return reportCount;
}

export function resetRealityVerificationReportingForTests(): void {
  reportCount = 0;
}
