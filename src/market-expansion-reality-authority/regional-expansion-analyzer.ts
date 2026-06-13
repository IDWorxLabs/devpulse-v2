/**
 * Regional expansion analyzer.
 */

import { hasValidObservedEvidence } from './evidence-validation.js';
import type { RegionalExpansionAnalysis, RegionalExpansionEvidence } from './market-expansion-reality-types.js';

export function analyzeRegionalExpansion(input: {
  evidence: RegionalExpansionEvidence | null;
  productLaunched: boolean;
  revenueOnly?: boolean;
  adoptionOnly?: boolean;
  scaleReadinessOnly?: boolean;
  rejectFabricated?: boolean;
}): RegionalExpansionAnalysis {
  const missingEvidence: string[] = [];
  const riskSignals: string[] = [];

  if (input.revenueOnly || input.adoptionOnly || input.scaleReadinessOnly) {
    missingEvidence.push('Upstream metrics alone are not regional expansion evidence');
    return empty(missingEvidence, riskSignals);
  }

  if (!input.productLaunched) {
    missingEvidence.push('Product not launched — regional expansion not yet applicable');
    return empty(missingEvidence, riskSignals);
  }

  if (!input.evidence) {
    missingEvidence.push('No regional expansion or localization report observed');
    return empty(missingEvidence, riskSignals);
  }

  if (!hasValidObservedEvidence(input.evidence, Boolean(input.rejectFabricated))) {
    missingEvidence.push('Regional expansion metrics rejected — unverifiable evidence');
    riskSignals.push('Fabricated regional evidence rejected');
    return empty(missingEvidence, riskSignals);
  }

  let score = 0;
  if (input.evidence.regionalAdoptionSignalsObserved) score += 30;
  if (input.evidence.localizationReadinessObserved) score += 30;
  if (input.evidence.regionalDependencyRiskAssessed) score += 20;
  if (input.evidence.geographicExpansionConfidenceObserved) score += 20;

  let confidence: RegionalExpansionAnalysis['confidence'] = 'LOW';
  if (input.evidence.regionalAdoptionSignalsObserved && input.evidence.localizationReadinessObserved) {
    confidence = 'MEDIUM';
  }
  if (input.evidence.geographicExpansionConfidenceObserved) confidence = 'HIGH';

  return {
    readOnly: true,
    regionalAdoptionSignals: input.evidence.regionalAdoptionSignalsObserved,
    localizationReadiness: input.evidence.localizationReadinessObserved,
    regionalDependencyRisk: input.evidence.regionalDependencyRiskAssessed,
    geographicExpansionConfidence: input.evidence.geographicExpansionConfidenceObserved,
    regionalScore: Math.min(100, score),
    confidence,
    missingEvidence,
    riskSignals,
  };
}

function empty(missingEvidence: string[], riskSignals: string[]): RegionalExpansionAnalysis {
  return {
    readOnly: true,
    regionalAdoptionSignals: false,
    localizationReadiness: false,
    regionalDependencyRisk: false,
    geographicExpansionConfidence: false,
    regionalScore: 0,
    confidence: 'UNKNOWN',
    missingEvidence,
    riskSignals,
  };
}
