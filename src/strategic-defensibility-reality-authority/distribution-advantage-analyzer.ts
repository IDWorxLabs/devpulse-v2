/**
 * Distribution advantage analyzer.
 */

import { hasValidObservedEvidence } from './evidence-validation.js';
import type {
  DistributionAdvantageAnalysis,
  DistributionAdvantageEvidence,
} from './strategic-defensibility-types.js';

function empty(missingEvidence: string[], riskSignals: string[]): DistributionAdvantageAnalysis {
  return {
    readOnly: true,
    customerAcquisitionAdvantages: false,
    distributionReach: false,
    channelStrength: false,
    partnerAdvantages: false,
    distributionScore: 0,
    confidence: 'UNKNOWN',
    missingEvidence,
    riskSignals,
  };
}

export function analyzeDistributionAdvantage(input: {
  evidence: DistributionAdvantageEvidence | null;
  productLaunched: boolean;
  revenueOnly?: boolean;
  adoptionOnly?: boolean;
  marketExpansionOnly?: boolean;
  rejectFabricated?: boolean;
}): DistributionAdvantageAnalysis {
  const missingEvidence: string[] = [];
  const riskSignals: string[] = [];

  if (input.revenueOnly || input.adoptionOnly) {
    missingEvidence.push('Upstream metrics alone are not distribution advantage evidence');
    return empty(missingEvidence, riskSignals);
  }

  if (input.marketExpansionOnly) {
    missingEvidence.push('Market expansion alone is not distribution advantage evidence');
    riskSignals.push('Market expansion alone cannot prove distribution moat');
    return empty(missingEvidence, riskSignals);
  }

  if (!input.evidence) {
    missingEvidence.push('No distribution advantage report observed');
    return empty(missingEvidence, riskSignals);
  }

  if (!hasValidObservedEvidence(input.evidence, Boolean(input.rejectFabricated))) {
    missingEvidence.push('Distribution advantage metrics rejected — unverifiable evidence');
    riskSignals.push('Fabricated moat evidence rejected');
    return empty(missingEvidence, riskSignals);
  }

  let score = 0;
  if (input.evidence.customerAcquisitionAdvantagesObserved) score += 25;
  if (input.evidence.distributionReachObserved) score += 25;
  if (input.evidence.channelStrengthObserved) score += 25;
  if (input.evidence.partnerAdvantagesObserved) score += 25;

  let confidence: DistributionAdvantageAnalysis['confidence'] = 'LOW';
  if (input.evidence.distributionReachObserved && input.evidence.channelStrengthObserved) {
    confidence = 'MEDIUM';
  }
  if (input.evidence.partnerAdvantagesObserved) confidence = 'HIGH';

  return {
    readOnly: true,
    customerAcquisitionAdvantages: input.evidence.customerAcquisitionAdvantagesObserved,
    distributionReach: input.evidence.distributionReachObserved,
    channelStrength: input.evidence.channelStrengthObserved,
    partnerAdvantages: input.evidence.partnerAdvantagesObserved,
    distributionScore: Math.min(100, score),
    confidence,
    missingEvidence,
    riskSignals,
  };
}
