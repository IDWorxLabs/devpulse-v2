/**
 * Completion Truth Engine — completion consistency analyzer.
 */

import type {
  CompletionClaimAnalysis,
  CompletionConsistencyScores,
  CompletionEvidenceValidation,
  CompletionRealityValidation,
} from './completion-truth-types.js';
import { getCachedConsistency, setCachedConsistency } from './completion-truth-cache.js';

let consistencyAnalysisCount = 0;

export function analyzeCompletionConsistency(
  claimAnalyses: CompletionClaimAnalysis[],
  evidence: CompletionEvidenceValidation,
  reality: CompletionRealityValidation,
): CompletionConsistencyScores {
  const cacheKey = [
    claimAnalyses.map((a) => a.claimStrength).join(','),
    evidence.evidenceAgreementScore,
    reality.realityCompletionScore,
  ].join('|');

  const cached = getCachedConsistency(cacheKey);
  if (cached) return cached;

  consistencyAnalysisCount += 1;

  if (claimAnalyses.length === 0) {
    const empty: CompletionConsistencyScores = {
      consistencyScore: 0,
      stabilityScore: 0,
      agreementScore: 0,
    };
    setCachedConsistency(cacheKey, empty);
    return empty;
  }

  const strengths = claimAnalyses.map((a) => a.claimStrength);
  const mean = strengths.reduce((s, v) => s + v, 0) / strengths.length;
  const variance = strengths.reduce((s, v) => s + (v - mean) ** 2, 0) / strengths.length;
  const stabilityScore = Math.max(0, Math.min(100, Math.round(100 - Math.sqrt(variance))));

  const scores = [
    mean,
    evidence.evidenceAgreementScore,
    reality.realityCompletionScore,
    evidence.evidenceQualityScore,
  ];
  const scoreMean = scores.reduce((s, v) => s + v, 0) / scores.length;
  const scoreSpread = Math.max(...scores) - Math.min(...scores);
  const agreementScore = Math.max(0, Math.min(100, Math.round(100 - scoreSpread)));
  const consistencyScore = Math.round((stabilityScore + agreementScore + scoreMean * 0.3) / 2.3);

  const result: CompletionConsistencyScores = {
    consistencyScore: Math.max(0, Math.min(100, consistencyScore)),
    stabilityScore,
    agreementScore,
  };

  setCachedConsistency(cacheKey, result);
  return result;
}

export function getConsistencyAnalysisCount(): number {
  return consistencyAnalysisCount;
}

export function resetCompletionConsistencyAnalyzerForTests(): void {
  consistencyAnalysisCount = 0;
}
