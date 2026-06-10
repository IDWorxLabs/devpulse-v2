/**
 * Founder Friction Detector — authority builder.
 */

import type {
  FounderFrictionAuthority,
  FounderFrictionResult,
  FounderFrictionRoadmap,
  FounderFrictionDetectorInput,
  ConfusionFrictionDetection,
  WorkflowFrictionDetection,
  DecisionFatigueDetection,
  ContextSwitchingFrictionDetection,
  DiscoverabilityFrictionDetection,
  TrustBreakdownDetection,
  ConfidenceBreakdownDetection,
  ProductivityFrictionDetection,
  VerificationFrictionDetection,
  LaunchFrictionDetection,
  FrictionGapAnalysis,
  FrictionContext,
} from './founder-friction-types.js';
import { resolveFounderFrictionResult } from './founder-friction-types.js';
import { countCriticalGaps } from './friction-gap-model.js';
import { getCachedFounderFrictionAuthority, setCachedFounderFrictionAuthority } from './founder-friction-cache.js';

const DETECTOR_WEIGHT = 1 / 10;
const WORKFLOW_FRICTION_WEIGHT_MODIFIER = 0.85;

let authorityBuildCount = 0;
let authorityCounter = 0;

export function buildFounderFrictionAuthority(
  requestId: string,
  contexts: FrictionContext[],
  confusionFriction: ConfusionFrictionDetection,
  workflowFriction: WorkflowFrictionDetection,
  decisionFatigue: DecisionFatigueDetection,
  contextSwitching: ContextSwitchingFrictionDetection,
  discoverability: DiscoverabilityFrictionDetection,
  trustBreakdowns: TrustBreakdownDetection,
  confidenceBreakdowns: ConfidenceBreakdownDetection,
  productivityBlockers: ProductivityFrictionDetection,
  verificationFriction: VerificationFrictionDetection,
  launchFriction: LaunchFrictionDetection,
  gapAnalysis: FrictionGapAnalysis,
  roadmap: FounderFrictionRoadmap,
  input: FounderFrictionDetectorInput,
): FounderFrictionAuthority {
  const cacheKey = [
    requestId,
    confusionFriction.score, workflowFriction.score, decisionFatigue.score,
    contextSwitching.score, discoverability.score, trustBreakdowns.score,
    confidenceBreakdowns.score, productivityBlockers.score, verificationFriction.score, launchFriction.score,
  ].join('|');
  const cached = getCachedFounderFrictionAuthority(cacheKey);
  if (cached) return cached;

  authorityBuildCount += 1;
  authorityCounter += 1;

  const founderFrictionScore = Math.round(
    confusionFriction.score * DETECTOR_WEIGHT
      + workflowFriction.score * DETECTOR_WEIGHT * WORKFLOW_FRICTION_WEIGHT_MODIFIER
      + decisionFatigue.score * DETECTOR_WEIGHT
      + contextSwitching.score * DETECTOR_WEIGHT
      + discoverability.score * DETECTOR_WEIGHT
      + trustBreakdowns.score * DETECTOR_WEIGHT
      + confidenceBreakdowns.score * DETECTOR_WEIGHT
      + productivityBlockers.score * DETECTOR_WEIGHT
      + verificationFriction.score * DETECTOR_WEIGHT
      + launchFriction.score * DETECTOR_WEIGHT,
  );

  const criticalGaps = countCriticalGaps(gapAnalysis.gaps);
  const warningCount = gapAnalysis.majorFrictionGaps.length + gapAnalysis.minorFrictionGaps.length;

  const founderFrictionResult: FounderFrictionResult = resolveFounderFrictionResult(
    founderFrictionScore,
    criticalGaps,
    warningCount,
    input.governanceBlocked,
  );

  const confidence = Math.min(100, Math.round(
    (founderFrictionScore + confusionFriction.score + workflowFriction.score) / 3 - criticalGaps * 6,
  ));

  const authority: FounderFrictionAuthority = {
    authorityId: `founder-friction-authority-${authorityCounter}`,
    contexts,
    confusionFriction,
    workflowFriction,
    decisionFatigue,
    contextSwitching,
    discoverability,
    trustBreakdowns,
    confidenceBreakdowns,
    productivityBlockers,
    verificationFriction,
    launchFriction,
    gapAnalysis,
    roadmap,
    founderFrictionScore: Math.max(0, founderFrictionScore),
    founderFrictionResult,
    confidence: Math.max(0, confidence),
    createdAt: Date.now(),
  };

  setCachedFounderFrictionAuthority(cacheKey, authority);
  return authority;
}

export function getAuthorityBuildCount(): number {
  return authorityBuildCount;
}

export function resetFounderFrictionAuthorityBuilderForTests(): void {
  authorityBuildCount = 0;
  authorityCounter = 0;
}
