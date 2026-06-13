/**
 * Network effects analyzer.
 */

import { hasValidObservedEvidence } from './evidence-validation.js';
import type { NetworkEffectsAnalysis, NetworkEffectsEvidence } from './strategic-defensibility-types.js';

function empty(missingEvidence: string[], riskSignals: string[]): NetworkEffectsAnalysis {
  return {
    readOnly: true,
    userNetworkValue: false,
    networkReinforcementSignals: false,
    communityDependency: false,
    networkEffectStrength: false,
    networkEffectsScore: 0,
    confidence: 'UNKNOWN',
    missingEvidence,
    riskSignals,
  };
}

export function analyzeNetworkEffects(input: {
  evidence: NetworkEffectsEvidence | null;
  productLaunched: boolean;
  revenueOnly?: boolean;
  adoptionOnly?: boolean;
  marketExpansionOnly?: boolean;
  rejectFabricated?: boolean;
}): NetworkEffectsAnalysis {
  const missingEvidence: string[] = [];
  const riskSignals: string[] = [];

  if (input.revenueOnly || input.adoptionOnly || input.marketExpansionOnly) {
    missingEvidence.push('Upstream metrics alone are not network effects evidence');
    return empty(missingEvidence, riskSignals);
  }

  if (!input.productLaunched) {
    missingEvidence.push('Product not launched — network effects not yet applicable');
    return empty(missingEvidence, riskSignals);
  }

  if (!input.evidence) {
    missingEvidence.push('No network effects report observed');
    return empty(missingEvidence, riskSignals);
  }

  if (!hasValidObservedEvidence(input.evidence, Boolean(input.rejectFabricated))) {
    missingEvidence.push('Network effects metrics rejected — unverifiable evidence');
    riskSignals.push('Fabricated moat evidence rejected');
    return empty(missingEvidence, riskSignals);
  }

  let score = 0;
  if (input.evidence.userNetworkValueObserved) score += 30;
  if (input.evidence.networkReinforcementSignalsObserved) score += 25;
  if (input.evidence.communityDependencyObserved) score += 25;
  if (input.evidence.networkEffectStrengthObserved) score += 20;

  let confidence: NetworkEffectsAnalysis['confidence'] = 'LOW';
  if (input.evidence.userNetworkValueObserved && input.evidence.networkReinforcementSignalsObserved) {
    confidence = 'MEDIUM';
  }
  if (input.evidence.networkEffectStrengthObserved) confidence = 'HIGH';

  return {
    readOnly: true,
    userNetworkValue: input.evidence.userNetworkValueObserved,
    networkReinforcementSignals: input.evidence.networkReinforcementSignalsObserved,
    communityDependency: input.evidence.communityDependencyObserved,
    networkEffectStrength: input.evidence.networkEffectStrengthObserved,
    networkEffectsScore: Math.min(100, score),
    confidence,
    missingEvidence,
    riskSignals,
  };
}
