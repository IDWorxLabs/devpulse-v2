/**
 * Customer segment expansion analyzer.
 */

import { blockedByUpstreamOnlySignals, hasValidObservedEvidence } from './evidence-validation.js';
import type {
  CustomerSegmentExpansionAnalysis,
  CustomerSegmentExpansionEvidence,
} from './market-expansion-reality-types.js';

export function analyzeCustomerSegmentExpansion(input: {
  evidence: CustomerSegmentExpansionEvidence | null;
  productLaunched: boolean;
  adoptionObserved: boolean;
  revenueOnly?: boolean;
  adoptionOnly?: boolean;
  scaleReadinessOnly?: boolean;
  rejectFabricated?: boolean;
}): CustomerSegmentExpansionAnalysis {
  const missingEvidence: string[] = [];
  const riskSignals: string[] = [];

  if (input.revenueOnly || input.adoptionOnly) {
    const reason = input.revenueOnly
      ? 'Revenue alone is not segment expansion readiness'
      : 'Adoption alone is not segment expansion readiness';
    missingEvidence.push(reason);
    riskSignals.push(`${reason} — segment expansion evidence required`);
    return empty(missingEvidence, riskSignals);
  }

  if (input.scaleReadinessOnly) {
    missingEvidence.push('Scale readiness alone is not segment expansion evidence');
    return empty(missingEvidence, riskSignals);
  }

  if (!input.productLaunched) {
    missingEvidence.push('Product not launched — segment expansion not yet applicable');
    return empty(missingEvidence, riskSignals);
  }

  if (!input.evidence) {
    missingEvidence.push('No customer segment expansion report observed');
    return empty(missingEvidence, riskSignals);
  }

  if (!hasValidObservedEvidence(input.evidence, Boolean(input.rejectFabricated))) {
    missingEvidence.push('Segment expansion metrics rejected — unverifiable evidence');
    riskSignals.push('Fabricated market evidence rejected');
    return empty(missingEvidence, riskSignals);
  }

  let score = 0;
  if (input.evidence.crossSegmentAdoptionObserved) score += 30;
  if (input.evidence.customerDiversityObserved) score += 25;
  if (input.evidence.segmentConcentrationRiskAssessed) score += 20;
  if (input.evidence.expansionConfidenceObserved) score += 25;

  let confidence: CustomerSegmentExpansionAnalysis['confidence'] = 'LOW';
  if (input.evidence.crossSegmentAdoptionObserved && input.evidence.customerDiversityObserved) {
    confidence = 'MEDIUM';
  }
  if (input.evidence.expansionConfidenceObserved && input.evidence.segmentConcentrationRiskAssessed) {
    confidence = 'HIGH';
  }

  return {
    readOnly: true,
    crossSegmentAdoption: input.evidence.crossSegmentAdoptionObserved,
    customerDiversity: input.evidence.customerDiversityObserved,
    segmentConcentrationRisk: input.evidence.segmentConcentrationRiskAssessed,
    expansionConfidence: input.evidence.expansionConfidenceObserved,
    customerSegmentScore: Math.min(100, score),
    confidence,
    missingEvidence,
    riskSignals,
  };
}

function empty(missingEvidence: string[], riskSignals: string[]): CustomerSegmentExpansionAnalysis {
  return {
    readOnly: true,
    crossSegmentAdoption: false,
    customerDiversity: false,
    segmentConcentrationRisk: false,
    expansionConfidence: false,
    customerSegmentScore: 0,
    confidence: 'UNKNOWN',
    missingEvidence,
    riskSignals,
  };
}
