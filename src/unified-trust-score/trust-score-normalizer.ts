/**
 * Unified Trust Score — trust score normalizer.
 */

import type { NormalizedTrustScores, UnifiedTrustScoreInputs } from './unified-trust-score-types.js';
import { getCachedNormalizedScores, setCachedNormalizedScores } from './unified-trust-score-cache.js';

let normalizationCount = 0;

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function normalizeTrustScores(inputs: UnifiedTrustScoreInputs): NormalizedTrustScores {
  const cacheKey = [
    inputs.trustRuntimeScore,
    inputs.evidenceScore,
    inputs.realityScore,
    inputs.completionScore,
    inputs.predictionScore,
    inputs.trustRuntimeConfidence,
  ].join('|');

  const cached = getCachedNormalizedScores(cacheKey);
  if (cached) return cached;

  normalizationCount += 1;

  const normalizedTrustScore = clamp(inputs.trustRuntimeScore);
  const normalizedEvidenceScore = clamp(inputs.evidenceScore);
  const normalizedRealityScore = clamp(inputs.realityScore);
  const normalizedCompletionScore = clamp(inputs.completionScore);
  const normalizedPredictionScore = clamp(inputs.predictionScore);

  const normalizedConfidence = clamp(
    (inputs.trustRuntimeConfidence
      + inputs.evidenceConfidence
      + inputs.realityConfidence
      + inputs.completionConfidence
      + inputs.predictionConfidence) / 5,
  );

  const result: NormalizedTrustScores = {
    normalizedTrustScore,
    normalizedEvidenceScore,
    normalizedRealityScore,
    normalizedCompletionScore,
    normalizedPredictionScore,
    normalizedConfidence,
  };

  setCachedNormalizedScores(cacheKey, result);
  return result;
}

export function getNormalizationCount(): number {
  return normalizationCount;
}

export function resetTrustScoreNormalizerForTests(): void {
  normalizationCount = 0;
}
