/**
 * Feature adoption analyzer — core feature usage and stickiness from observed reports.
 */

import { blockedByTrafficOnly, hasValidObservedEvidence } from './evidence-validation.js';
import type { FeatureAdoptionAnalysis, FeatureAdoptionEvidence } from './adoption-reality-types.js';

export function analyzeFeatureAdoption(input: {
  evidence: FeatureAdoptionEvidence | null;
  repeatUsageObserved: boolean;
  trafficOnly?: boolean;
  signupsOnly?: boolean;
  oneTimeUsage?: boolean;
  rejectFabricated?: boolean;
}): FeatureAdoptionAnalysis {
  const missingEvidence: string[] = [];
  const riskSignals: string[] = [];

  if (blockedByTrafficOnly(input)) {
    missingEvidence.push('Feature adoption cannot be inferred from traffic, signups, or one-time usage');
    return {
      readOnly: true,
      coreFeatureUsage: false,
      featureStickiness: false,
      featureDepth: null,
      criticalFeaturePenetration: false,
      featureAdoptionScore: 0,
      confidence: 'UNKNOWN',
      missingEvidence,
      riskSignals,
    };
  }

  if (!input.evidence) {
    missingEvidence.push('No feature usage or stickiness report observed');
    return {
      readOnly: true,
      coreFeatureUsage: false,
      featureStickiness: false,
      featureDepth: null,
      criticalFeaturePenetration: false,
      featureAdoptionScore: 0,
      confidence: 'UNKNOWN',
      missingEvidence,
      riskSignals,
    };
  }

  if (!hasValidObservedEvidence(input.evidence, Boolean(input.rejectFabricated))) {
    missingEvidence.push('Feature adoption metrics rejected — unverifiable evidence');
    riskSignals.push('Fabricated feature adoption metrics rejected');
    return {
      readOnly: true,
      coreFeatureUsage: false,
      featureStickiness: false,
      featureDepth: null,
      criticalFeaturePenetration: false,
      featureAdoptionScore: 0,
      confidence: 'UNKNOWN',
      missingEvidence,
      riskSignals,
    };
  }

  if (!input.repeatUsageObserved) {
    riskSignals.push('Feature adoption reported without repeat usage — may reflect one-time trials');
  }

  let featureAdoptionScore = 0;
  if (input.evidence.coreFeatureUsageObserved) featureAdoptionScore += 30;
  if (input.evidence.featureStickinessObserved) featureAdoptionScore += 30;
  if (input.evidence.criticalFeaturePenetrationObserved) featureAdoptionScore += 25;
  if (input.evidence.featureDepthScore !== null) {
    featureAdoptionScore += Math.round(input.evidence.featureDepthScore * 0.15);
  }

  const featureAdoptionObserved =
    input.evidence.coreFeatureUsageObserved &&
    input.evidence.featureStickinessObserved &&
    input.repeatUsageObserved;

  let confidence: FeatureAdoptionAnalysis['confidence'] = 'LOW';
  if (featureAdoptionObserved) confidence = 'MEDIUM';
  if (featureAdoptionObserved && input.evidence.criticalFeaturePenetrationObserved) confidence = 'HIGH';

  return {
    readOnly: true,
    coreFeatureUsage: input.evidence.coreFeatureUsageObserved,
    featureStickiness: input.evidence.featureStickinessObserved,
    featureDepth: input.evidence.featureDepthScore,
    criticalFeaturePenetration: input.evidence.criticalFeaturePenetrationObserved,
    featureAdoptionScore: Math.min(100, featureAdoptionScore),
    confidence,
    missingEvidence,
    riskSignals,
  };
}
