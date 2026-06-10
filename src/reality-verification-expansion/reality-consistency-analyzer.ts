/**
 * Reality Verification Expansion — reality consistency analyzer.
 */

import type { ClaimValidation, RealityConsistencyScores, RealityRecord } from './reality-verification-types.js';
import { getCachedConsistencyAnalysis, setCachedConsistencyAnalysis } from './reality-verification-cache.js';

let consistencyAnalysisCount = 0;

export function analyzeRealityConsistency(
  records: RealityRecord[],
  validations: ClaimValidation[],
): RealityConsistencyScores {
  const cacheKey = [
    records.map((r) => r.recordId).join(','),
    validations.map((v) => `${v.claimType}:${v.supportStatus}`).join(','),
  ].join('|');

  const cached = getCachedConsistencyAnalysis(cacheKey);
  if (cached) return cached;

  consistencyAnalysisCount += 1;

  if (records.length === 0 || validations.length === 0) {
    const empty: RealityConsistencyScores = {
      consistencyScore: 0,
      stabilityScore: 0,
      agreementScore: 0,
      alignmentScore: 0,
    };
    setCachedConsistencyAnalysis(cacheKey, empty);
    return empty;
  }

  const strengths = records.map((r) => r.strength);
  const trustLevels = records.map((r) => r.trustLevel);
  const strengthMean = strengths.reduce((s, v) => s + v, 0) / strengths.length;
  const trustMean = trustLevels.reduce((s, v) => s + v, 0) / trustLevels.length;
  const strengthVar = strengths.reduce((s, v) => s + (v - strengthMean) ** 2, 0) / strengths.length;
  const trustVar = trustLevels.reduce((s, v) => s + (v - trustMean) ** 2, 0) / trustLevels.length;

  const stabilityScore = Math.max(0, Math.min(100, Math.round(100 - Math.sqrt(strengthVar + trustVar))));

  const supported = validations.filter((v) => v.supportStatus === 'SUPPORTED').length;
  const agreementScore = Math.round((supported / validations.length) * 100);

  const statuses = validations.map((v) => v.supportStatus);
  const uniqueStatuses = new Set(statuses).size;
  const consistencyScore = Math.max(0, Math.min(100, Math.round(agreementScore - (uniqueStatuses - 1) * 15)));

  const confidences = validations.map((v) => v.confidence);
  const confMean = confidences.reduce((s, v) => s + v, 0) / confidences.length;
  const alignmentScore = Math.max(0, Math.min(100, Math.round((consistencyScore + confMean) / 2)));

  const result: RealityConsistencyScores = {
    consistencyScore,
    stabilityScore,
    agreementScore,
    alignmentScore,
  };

  setCachedConsistencyAnalysis(cacheKey, result);
  return result;
}

export function getConsistencyAnalysisCount(): number {
  return consistencyAnalysisCount;
}

export function resetRealityConsistencyAnalyzerForTests(): void {
  consistencyAnalysisCount = 0;
}
