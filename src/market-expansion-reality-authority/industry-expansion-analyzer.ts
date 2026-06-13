/**
 * Industry expansion analyzer.
 */

import { hasValidObservedEvidence } from './evidence-validation.js';
import type { IndustryExpansionAnalysis, IndustryExpansionEvidence } from './market-expansion-reality-types.js';

export function analyzeIndustryExpansion(input: {
  evidence: IndustryExpansionEvidence | null;
  productLaunched: boolean;
  revenueOnly?: boolean;
  adoptionOnly?: boolean;
  scaleReadinessOnly?: boolean;
  rejectFabricated?: boolean;
}): IndustryExpansionAnalysis {
  const missingEvidence: string[] = [];
  const riskSignals: string[] = [];

  if (input.revenueOnly || input.adoptionOnly || input.scaleReadinessOnly) {
    missingEvidence.push('Upstream metrics alone are not industry expansion evidence');
    return empty(missingEvidence, riskSignals);
  }

  if (!input.productLaunched) {
    missingEvidence.push('Product not launched — industry expansion not yet applicable');
    return empty(missingEvidence, riskSignals);
  }

  if (!input.evidence) {
    missingEvidence.push('No industry expansion report observed');
    return empty(missingEvidence, riskSignals);
  }

  if (!hasValidObservedEvidence(input.evidence, Boolean(input.rejectFabricated))) {
    missingEvidence.push('Industry expansion metrics rejected — unverifiable evidence');
    riskSignals.push('Fabricated industry evidence rejected');
    return empty(missingEvidence, riskSignals);
  }

  let score = 0;
  if (input.evidence.industryFitSignalsObserved) score += 30;
  if (input.evidence.useCaseDiversityObserved) score += 25;
  if (input.evidence.industryDependencyRiskAssessed) score += 20;
  if (input.evidence.industryExpansionConfidenceObserved) score += 25;

  let confidence: IndustryExpansionAnalysis['confidence'] = 'LOW';
  if (input.evidence.industryFitSignalsObserved && input.evidence.useCaseDiversityObserved) {
    confidence = 'MEDIUM';
  }
  if (input.evidence.industryExpansionConfidenceObserved) confidence = 'HIGH';

  return {
    readOnly: true,
    industryFitSignals: input.evidence.industryFitSignalsObserved,
    useCaseDiversity: input.evidence.useCaseDiversityObserved,
    industryDependencyRisk: input.evidence.industryDependencyRiskAssessed,
    industryExpansionConfidence: input.evidence.industryExpansionConfidenceObserved,
    industryScore: Math.min(100, score),
    confidence,
    missingEvidence,
    riskSignals,
  };
}

function empty(missingEvidence: string[], riskSignals: string[]): IndustryExpansionAnalysis {
  return {
    readOnly: true,
    industryFitSignals: false,
    useCaseDiversity: false,
    industryDependencyRisk: false,
    industryExpansionConfidence: false,
    industryScore: 0,
    confidence: 'UNKNOWN',
    missingEvidence,
    riskSignals,
  };
}
