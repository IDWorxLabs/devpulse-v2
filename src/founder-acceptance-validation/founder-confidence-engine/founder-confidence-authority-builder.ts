/**
 * Founder Confidence Engine — authority builder.
 */

import type {
  FounderConfidenceAuthority,
  FounderConfidenceResult,
  FounderConfidenceRoadmap,
  FounderConfidenceEngineInput,
  UnderstandingConfidenceValidation,
  ReasoningVisibilityValidation,
  ProgressTruthValidation,
  NextStepConfidenceValidation,
  DecisionConfidenceValidation,
  UncertaintyHonestyValidation,
  FounderControlConfidenceValidation,
  ConfidenceGapAnalysis,
  ConfidenceContext,
} from './founder-confidence-types.js';
import { resolveFounderConfidenceResult } from './founder-confidence-types.js';
import { countCriticalGaps } from './confidence-gap-model.js';
import { getCachedFounderConfidenceAuthority, setCachedFounderConfidenceAuthority } from './founder-confidence-cache.js';

const VALIDATOR_WEIGHT = 1 / 7;

let authorityBuildCount = 0;
let authorityCounter = 0;

export function buildFounderConfidenceAuthority(
  requestId: string,
  contexts: ConfidenceContext[],
  understandingConfidence: UnderstandingConfidenceValidation,
  reasoningVisibility: ReasoningVisibilityValidation,
  progressTruth: ProgressTruthValidation,
  nextStepConfidence: NextStepConfidenceValidation,
  decisionConfidence: DecisionConfidenceValidation,
  uncertaintyHonesty: UncertaintyHonestyValidation,
  founderControlConfidence: FounderControlConfidenceValidation,
  gapAnalysis: ConfidenceGapAnalysis,
  roadmap: FounderConfidenceRoadmap,
  input: FounderConfidenceEngineInput,
): FounderConfidenceAuthority {
  const cacheKey = [
    requestId,
    understandingConfidence.score, reasoningVisibility.score, progressTruth.score,
    nextStepConfidence.score, decisionConfidence.score, uncertaintyHonesty.score,
    founderControlConfidence.score,
  ].join('|');
  const cached = getCachedFounderConfidenceAuthority(cacheKey);
  if (cached) return cached;

  authorityBuildCount += 1;
  authorityCounter += 1;

  const founderConfidenceScore = Math.round(
    understandingConfidence.score * VALIDATOR_WEIGHT
      + reasoningVisibility.score * VALIDATOR_WEIGHT
      + progressTruth.score * VALIDATOR_WEIGHT
      + nextStepConfidence.score * VALIDATOR_WEIGHT
      + decisionConfidence.score * VALIDATOR_WEIGHT
      + uncertaintyHonesty.score * VALIDATOR_WEIGHT
      + founderControlConfidence.score * VALIDATOR_WEIGHT,
  );

  const criticalGaps = countCriticalGaps(gapAnalysis.gaps);
  const warningCount = gapAnalysis.majorConfidenceGaps.length + gapAnalysis.minorConfidenceGaps.length;

  const founderConfidenceResult: FounderConfidenceResult = resolveFounderConfidenceResult(
    founderConfidenceScore,
    criticalGaps,
    warningCount,
    input.governanceBlocked,
  );

  const confidence = Math.min(100, Math.round(
    (founderConfidenceScore + progressTruth.score + uncertaintyHonesty.score) / 3 - criticalGaps * 6,
  ));

  const authority: FounderConfidenceAuthority = {
    authorityId: `founder-confidence-authority-${authorityCounter}`,
    contexts,
    understandingConfidence,
    reasoningVisibility,
    progressTruth,
    nextStepConfidence,
    decisionConfidence,
    uncertaintyHonesty,
    founderControlConfidence,
    gapAnalysis,
    roadmap,
    founderConfidenceScore: Math.max(0, founderConfidenceScore),
    founderConfidenceResult,
    confidence: Math.max(0, confidence),
    createdAt: Date.now(),
  };

  setCachedFounderConfidenceAuthority(cacheKey, authority);
  return authority;
}

export function getAuthorityBuildCount(): number {
  return authorityBuildCount;
}

export function resetFounderConfidenceAuthorityBuilderForTests(): void {
  authorityBuildCount = 0;
  authorityCounter = 0;
}
