/**
 * Unified Trust Score — trust score authority builder.
 */

import type {
  NormalizedTrustScores,
  TrustConfidenceEvaluation,
  TrustConsistencyAnalysis,
  TrustWeightContribution,
  UnifiedTrustDecision,
  UnifiedTrustScoreAuthority,
  UnifiedTrustScoreLevel,
} from './unified-trust-score-types.js';
import { resolveTrustDecision, resolveTrustScoreLevel } from './unified-trust-score-types.js';
import { getCachedTrustScoreAuthority, setCachedTrustScoreAuthority } from './unified-trust-score-cache.js';

let authorityBuildCount = 0;
let authorityCounter = 0;

export function buildUnifiedTrustScoreAuthority(
  requestId: string,
  normalized: NormalizedTrustScores,
  weighting: TrustWeightContribution,
  consistency: TrustConsistencyAnalysis,
  confidence: TrustConfidenceEvaluation,
  governanceBlocked?: boolean,
): UnifiedTrustScoreAuthority {
  const cacheKey = [requestId, weighting.weightedScore, confidence.confidenceScore, governanceBlocked].join('|');
  const cached = getCachedTrustScoreAuthority(cacheKey);
  if (cached) return cached;

  authorityBuildCount += 1;
  authorityCounter += 1;

  const adjustedScore = Math.max(0, Math.min(100, Math.round(
    weighting.weightedScore * 0.7
      + confidence.confidenceScore * 0.2
      + consistency.consistencyScore * 0.1,
  )));

  const trustLevel: UnifiedTrustScoreLevel = resolveTrustScoreLevel(adjustedScore);
  const decision: UnifiedTrustDecision = resolveTrustDecision(adjustedScore, governanceBlocked);

  const authority: UnifiedTrustScoreAuthority = {
    authorityId: `unified-trust-score-authority-${authorityCounter}`,
    trustScore: adjustedScore,
    trustLevel,
    decision,
    confidence: confidence.confidenceScore,
    weightedScore: weighting.weightedScore,
    consistencyScore: consistency.consistencyScore,
    createdAt: Date.now(),
  };

  setCachedTrustScoreAuthority(cacheKey, authority);
  return authority;
}

export function getAuthorityBuildCount(): number {
  return authorityBuildCount;
}

export function resetTrustScoreAuthorityBuilderForTests(): void {
  authorityBuildCount = 0;
  authorityCounter = 0;
}
