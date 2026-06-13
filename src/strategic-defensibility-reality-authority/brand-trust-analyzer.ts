/**
 * Brand trust analyzer.
 */

import { hasValidObservedEvidence } from './evidence-validation.js';
import type { BrandTrustAnalysis, BrandTrustEvidence } from './strategic-defensibility-types.js';

function empty(missingEvidence: string[], riskSignals: string[]): BrandTrustAnalysis {
  return {
    readOnly: true,
    customerTrustSignals: false,
    brandPreferenceEvidence: false,
    reputationStrength: false,
    trustDurability: false,
    brandTrustScore: 0,
    confidence: 'UNKNOWN',
    missingEvidence,
    riskSignals,
  };
}

export function analyzeBrandTrust(input: {
  evidence: BrandTrustEvidence | null;
  productLaunched: boolean;
  revenueOnly?: boolean;
  adoptionOnly?: boolean;
  marketExpansionOnly?: boolean;
  rejectFabricated?: boolean;
}): BrandTrustAnalysis {
  const missingEvidence: string[] = [];
  const riskSignals: string[] = [];

  if (input.revenueOnly || input.adoptionOnly || input.marketExpansionOnly) {
    missingEvidence.push('Upstream metrics alone are not brand trust evidence');
    riskSignals.push('Brand claims without observed trust evidence are insufficient');
    return empty(missingEvidence, riskSignals);
  }

  if (!input.evidence) {
    missingEvidence.push('No brand trust or reputation report observed');
    return empty(missingEvidence, riskSignals);
  }

  if (!hasValidObservedEvidence(input.evidence, Boolean(input.rejectFabricated))) {
    missingEvidence.push('Brand trust metrics rejected — unverifiable evidence');
    riskSignals.push('Fabricated moat evidence rejected');
    return empty(missingEvidence, riskSignals);
  }

  let score = 0;
  if (input.evidence.customerTrustSignalsObserved) score += 30;
  if (input.evidence.brandPreferenceEvidenceObserved) score += 25;
  if (input.evidence.reputationStrengthObserved) score += 25;
  if (input.evidence.trustDurabilityObserved) score += 20;

  let confidence: BrandTrustAnalysis['confidence'] = 'LOW';
  if (input.evidence.customerTrustSignalsObserved && input.evidence.brandPreferenceEvidenceObserved) {
    confidence = 'MEDIUM';
  }
  if (input.evidence.trustDurabilityObserved) confidence = 'HIGH';

  return {
    readOnly: true,
    customerTrustSignals: input.evidence.customerTrustSignalsObserved,
    brandPreferenceEvidence: input.evidence.brandPreferenceEvidenceObserved,
    reputationStrength: input.evidence.reputationStrengthObserved,
    trustDurability: input.evidence.trustDurabilityObserved,
    brandTrustScore: Math.min(100, score),
    confidence,
    missingEvidence,
    riskSignals,
  };
}
