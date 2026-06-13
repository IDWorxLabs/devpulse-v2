/**
 * Channel expansion analyzer.
 */

import { hasValidObservedEvidence } from './evidence-validation.js';
import type { ChannelExpansionAnalysis, ChannelExpansionEvidence } from './market-expansion-reality-types.js';

export function analyzeChannelExpansion(input: {
  evidence: ChannelExpansionEvidence | null;
  productLaunched: boolean;
  revenueOnly?: boolean;
  adoptionOnly?: boolean;
  scaleReadinessOnly?: boolean;
  rejectFabricated?: boolean;
}): ChannelExpansionAnalysis {
  const missingEvidence: string[] = [];
  const riskSignals: string[] = [];

  if (input.revenueOnly || input.adoptionOnly || input.scaleReadinessOnly) {
    missingEvidence.push('Upstream metrics alone are not channel expansion evidence');
    return empty(missingEvidence, riskSignals);
  }

  if (!input.productLaunched) {
    missingEvidence.push('Product not launched — channel expansion not yet applicable');
    return empty(missingEvidence, riskSignals);
  }

  if (!input.evidence) {
    missingEvidence.push('No acquisition channel expansion report observed');
    return empty(missingEvidence, riskSignals);
  }

  if (!hasValidObservedEvidence(input.evidence, Boolean(input.rejectFabricated))) {
    missingEvidence.push('Channel expansion metrics rejected — unverifiable evidence');
    riskSignals.push('Fabricated channel evidence rejected');
    return empty(missingEvidence, riskSignals);
  }

  let score = 0;
  if (input.evidence.acquisitionChannelDiversityObserved) score += 35;
  if (input.evidence.channelDependencyRiskAssessed) score += 30;
  if (input.evidence.expansionChannelReadinessObserved) score += 35;

  let confidence: ChannelExpansionAnalysis['confidence'] = 'LOW';
  if (input.evidence.acquisitionChannelDiversityObserved) confidence = 'MEDIUM';
  if (input.evidence.expansionChannelReadinessObserved) confidence = 'HIGH';

  return {
    readOnly: true,
    acquisitionChannelDiversity: input.evidence.acquisitionChannelDiversityObserved,
    channelDependencyRisk: input.evidence.channelDependencyRiskAssessed,
    expansionChannelReadiness: input.evidence.expansionChannelReadinessObserved,
    channelScore: Math.min(100, score),
    confidence,
    missingEvidence,
    riskSignals,
  };
}

function empty(missingEvidence: string[], riskSignals: string[]): ChannelExpansionAnalysis {
  return {
    readOnly: true,
    acquisitionChannelDiversity: false,
    channelDependencyRisk: false,
    expansionChannelReadiness: false,
    channelScore: 0,
    confidence: 'UNKNOWN',
    missingEvidence,
    riskSignals,
  };
}
