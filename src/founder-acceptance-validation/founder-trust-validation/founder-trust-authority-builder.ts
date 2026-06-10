/**
 * Founder Trust Validation — authority builder.
 */

import type {
  FounderTrustAuthority,
  FounderTrustResult,
  FounderTrustRoadmap,
  FounderTrustValidationInput,
  TruthfulnessValidation,
  TransparencyValidation,
  VerificationIntegrityValidation,
  GovernanceComplianceValidation,
  ExecutionPredictabilityValidation,
  EvidenceVisibilityValidation,
  RollbackConfidenceValidation,
  SafetyBoundaryValidation,
  TrustGapAnalysis,
  TrustContext,
} from './founder-trust-types.js';
import { resolveFounderTrustResult } from './founder-trust-types.js';
import { countCriticalGaps } from './trust-gap-model.js';
import { getCachedFounderTrustAuthority, setCachedFounderTrustAuthority } from './founder-trust-cache.js';

const VALIDATOR_WEIGHT = 1 / 8;

let authorityBuildCount = 0;
let authorityCounter = 0;

export function buildFounderTrustAuthority(
  requestId: string,
  contexts: TrustContext[],
  truthfulness: TruthfulnessValidation,
  transparency: TransparencyValidation,
  verificationIntegrity: VerificationIntegrityValidation,
  governanceCompliance: GovernanceComplianceValidation,
  executionPredictability: ExecutionPredictabilityValidation,
  evidenceVisibility: EvidenceVisibilityValidation,
  rollbackConfidence: RollbackConfidenceValidation,
  safetyBoundaries: SafetyBoundaryValidation,
  gapAnalysis: TrustGapAnalysis,
  roadmap: FounderTrustRoadmap,
  input: FounderTrustValidationInput,
): FounderTrustAuthority {
  const cacheKey = [
    requestId,
    truthfulness.score, transparency.score, verificationIntegrity.score,
    governanceCompliance.score, executionPredictability.score,
    evidenceVisibility.score, rollbackConfidence.score, safetyBoundaries.score,
  ].join('|');
  const cached = getCachedFounderTrustAuthority(cacheKey);
  if (cached) return cached;

  authorityBuildCount += 1;
  authorityCounter += 1;

  const founderTrustScore = Math.round(
    truthfulness.score * VALIDATOR_WEIGHT
      + transparency.score * VALIDATOR_WEIGHT
      + verificationIntegrity.score * VALIDATOR_WEIGHT
      + governanceCompliance.score * VALIDATOR_WEIGHT
      + executionPredictability.score * VALIDATOR_WEIGHT
      + evidenceVisibility.score * VALIDATOR_WEIGHT
      + rollbackConfidence.score * VALIDATOR_WEIGHT
      + safetyBoundaries.score * VALIDATOR_WEIGHT,
  );

  const criticalGaps = countCriticalGaps(gapAnalysis.gaps);
  const warningCount = gapAnalysis.majorTrustGaps.length + gapAnalysis.minorTrustGaps.length;

  const founderTrustResult: FounderTrustResult = resolveFounderTrustResult(
    founderTrustScore,
    criticalGaps,
    warningCount,
    input.governanceBlocked,
  );

  const confidence = Math.min(100, Math.round(
    (founderTrustScore + truthfulness.score + governanceCompliance.score) / 3 - criticalGaps * 6,
  ));

  const authority: FounderTrustAuthority = {
    authorityId: `founder-trust-authority-${authorityCounter}`,
    contexts,
    truthfulness,
    transparency,
    verificationIntegrity,
    governanceCompliance,
    executionPredictability,
    evidenceVisibility,
    rollbackConfidence,
    safetyBoundaries,
    gapAnalysis,
    roadmap,
    founderTrustScore: Math.max(0, founderTrustScore),
    founderTrustResult,
    confidence: Math.max(0, confidence),
    createdAt: Date.now(),
  };

  setCachedFounderTrustAuthority(cacheKey, authority);
  return authority;
}

export function getAuthorityBuildCount(): number {
  return authorityBuildCount;
}

export function resetFounderTrustAuthorityBuilderForTests(): void {
  authorityBuildCount = 0;
  authorityCounter = 0;
}
