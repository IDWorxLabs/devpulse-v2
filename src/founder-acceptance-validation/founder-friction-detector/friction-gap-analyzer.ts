/**
 * Founder Friction Detector — friction gap analyzer.
 */

import type {
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
} from './founder-friction-types.js';
import { FRICTION_GAP_ANALYSIS_PASS, MAX_FRICTION_GAPS } from './founder-friction-types.js';
import { mergeBoundedGaps } from './friction-gap-model.js';
import { getCachedFrictionGapAnalysis, setCachedFrictionGapAnalysis } from './founder-friction-cache.js';

export interface DetectorGapInputs {
  confusionFriction: ConfusionFrictionDetection;
  workflowFriction: WorkflowFrictionDetection;
  decisionFatigue: DecisionFatigueDetection;
  contextSwitching: ContextSwitchingFrictionDetection;
  discoverability: DiscoverabilityFrictionDetection;
  trustBreakdowns: TrustBreakdownDetection;
  confidenceBreakdowns: ConfidenceBreakdownDetection;
  productivityBlockers: ProductivityFrictionDetection;
  verificationFriction: VerificationFrictionDetection;
  launchFriction: LaunchFrictionDetection;
}

let gapAnalysisCount = 0;

export function analyzeFrictionGaps(requestId: string, detectors: DetectorGapInputs): FrictionGapAnalysis {
  const cacheKey = [
    requestId,
    detectors.confusionFriction.score,
    detectors.workflowFriction.score,
    detectors.launchFriction.score,
  ].join('|');
  const cached = getCachedFrictionGapAnalysis(cacheKey);
  if (cached) return cached;

  gapAnalysisCount += 1;

  const gaps = mergeBoundedGaps(
    [
      detectors.confusionFriction.gaps,
      detectors.workflowFriction.gaps,
      detectors.decisionFatigue.gaps,
      detectors.contextSwitching.gaps,
      detectors.discoverability.gaps,
      detectors.trustBreakdowns.gaps,
      detectors.confidenceBreakdowns.gaps,
      detectors.productivityBlockers.gaps,
      detectors.verificationFriction.gaps,
      detectors.launchFriction.gaps,
    ],
    MAX_FRICTION_GAPS,
  );

  const result: FrictionGapAnalysis = {
    gaps,
    criticalFrictionGaps: gaps.filter((g) => g.severity === 'CRITICAL'),
    majorFrictionGaps: gaps.filter((g) => g.severity === 'MAJOR'),
    minorFrictionGaps: gaps.filter((g) => g.severity === 'MINOR'),
    passToken: FRICTION_GAP_ANALYSIS_PASS,
  };
  setCachedFrictionGapAnalysis(cacheKey, result);
  return result;
}

export function getGapAnalysisCount(): number {
  return gapAnalysisCount;
}

export function resetFrictionGapAnalyzerForTests(): void {
  gapAnalysisCount = 0;
}
