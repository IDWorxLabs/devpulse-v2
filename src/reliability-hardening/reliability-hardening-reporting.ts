/**
 * Reliability Hardening — reporting.
 */

import type {
  FailureSurfaceType,
  ReliabilityHardeningEvaluation,
  ReliabilityHardeningRecord,
  ReliabilityHardeningReport,
} from './reliability-hardening-types.js';
import { getReliabilityHardeningCacheStats } from './reliability-hardening-cache.js';
import { getReliabilityHardeningHistorySize } from './reliability-hardening-history.js';

let reportCount = 0;

export function generateReliabilityHardeningReport(
  record: ReliabilityHardeningRecord,
  evaluation: ReliabilityHardeningEvaluation,
  failureSurfaces: FailureSurfaceType[],
  boundaryViolations: string[],
  recoveryGaps: string[],
  consistencyGaps: string[],
  missingSignals: string[],
  runtimeWarnings: string[],
): ReliabilityHardeningReport {
  reportCount += 1;
  const cache = getReliabilityHardeningCacheStats();
  const recommendations: string[] = [];

  if (failureSurfaces.length > 0) recommendations.push('Review detected failure surfaces and strengthen validation coverage');
  if (boundaryViolations.length > 0) recommendations.push('Address reliability boundary violations before scaling validators');
  if (recoveryGaps.length > 0) recommendations.push('Improve recovery readiness with reset functions, bounded histories, and checkpoint tags');
  if (consistencyGaps.length > 0) recommendations.push('Align foundation, capability, UVL, and validation registrations');
  if (missingSignals.length > 0) recommendations.push('Collect missing reliability signals before production hardening');
  if (runtimeWarnings.length > 0) recommendations.push('Continue monitoring runtime stability warnings');
  if (evaluation.state === 'STABLE' || evaluation.state === 'WATCH') {
    recommendations.push('Continue monitoring');
  } else {
    recommendations.push('Require reliability review before expansion');
  }

  return {
    reliabilityScore: record.reliabilityScore,
    stabilityScore: record.stabilityScore,
    recoveryReadinessScore: record.recoveryReadinessScore,
    riskLevel: record.riskLevel,
    state: record.state,
    confidence: record.confidence,
    failureSurfaces: [...failureSurfaces],
    boundaryViolations: [...boundaryViolations],
    recoveryGaps: [...recoveryGaps],
    consistencyGaps: [...consistencyGaps],
    missingSignals: [...missingSignals],
    recommendations: [...new Set(recommendations)],
    evaluation,
    historySize: getReliabilityHardeningHistorySize(),
    cacheHits: cache.hits,
    cacheMisses: cache.misses,
  };
}

export function getReportCount(): number {
  return reportCount;
}

export function resetReliabilityHardeningReportingForTests(): void {
  reportCount = 0;
}
