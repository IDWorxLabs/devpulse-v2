/**
 * Unified Trust Score — trust weighting engine.
 */

import type { NormalizedTrustScores, TrustWeightContribution } from './unified-trust-score-types.js';
import { getCachedWeightContribution, setCachedWeightContribution } from './unified-trust-score-cache.js';

let weightingCount = 0;

const WEIGHTS = {
  trustRuntime: 0.25,
  evidence: 0.20,
  reality: 0.20,
  completion: 0.20,
  prediction: 0.15,
} as const;

export function computeTrustWeighting(normalized: NormalizedTrustScores): TrustWeightContribution {
  const cacheKey = [
    normalized.normalizedTrustScore,
    normalized.normalizedEvidenceScore,
    normalized.normalizedRealityScore,
    normalized.normalizedCompletionScore,
    normalized.normalizedPredictionScore,
  ].join('|');

  const cached = getCachedWeightContribution(cacheKey);
  if (cached) return cached;

  weightingCount += 1;

  const trustRuntimeContribution = Math.round(normalized.normalizedTrustScore * WEIGHTS.trustRuntime);
  const evidenceContribution = Math.round(normalized.normalizedEvidenceScore * WEIGHTS.evidence);
  const realityContribution = Math.round(normalized.normalizedRealityScore * WEIGHTS.reality);
  const completionContribution = Math.round(normalized.normalizedCompletionScore * WEIGHTS.completion);
  const predictionContribution = Math.round(normalized.normalizedPredictionScore * WEIGHTS.prediction);

  const weightedScore = Math.max(0, Math.min(100, Math.round(
    normalized.normalizedTrustScore * WEIGHTS.trustRuntime
      + normalized.normalizedEvidenceScore * WEIGHTS.evidence
      + normalized.normalizedRealityScore * WEIGHTS.reality
      + normalized.normalizedCompletionScore * WEIGHTS.completion
      + normalized.normalizedPredictionScore * WEIGHTS.prediction,
  )));

  const result: TrustWeightContribution = {
    trustRuntimeContribution,
    evidenceContribution,
    realityContribution,
    completionContribution,
    predictionContribution,
    weightedScore,
  };

  setCachedWeightContribution(cacheKey, result);
  return result;
}

export function getWeightingCount(): number {
  return weightingCount;
}

export function resetTrustWeightingEngineForTests(): void {
  weightingCount = 0;
}
