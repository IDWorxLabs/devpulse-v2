/**
 * Product-market-fit resilience analyzer.
 */

import { hasValidObservedEvidence } from './evidence-validation.js';
import type {
  ProductMarketFitResilienceAnalysis,
  ProductMarketFitResilienceEvidence,
} from './market-expansion-reality-types.js';

export function analyzeProductMarketFitResilience(input: {
  evidence: ProductMarketFitResilienceEvidence | null;
  productLaunched: boolean;
  revenueOnly?: boolean;
  adoptionOnly?: boolean;
  scaleReadinessOnly?: boolean;
  rejectFabricated?: boolean;
}): ProductMarketFitResilienceAnalysis {
  const missingEvidence: string[] = [];
  const riskSignals: string[] = [];

  if (input.revenueOnly || input.adoptionOnly) {
    missingEvidence.push('Upstream metrics alone are not PMF resilience evidence');
    return empty(missingEvidence, riskSignals);
  }

  if (input.scaleReadinessOnly) {
    missingEvidence.push('Scale readiness alone is not PMF resilience evidence');
    riskSignals.push('Scale readiness alone cannot prove expansion PMF resilience');
    return empty(missingEvidence, riskSignals);
  }

  if (!input.productLaunched) {
    missingEvidence.push('Product not launched — PMF resilience not yet applicable');
    return empty(missingEvidence, riskSignals);
  }

  if (!input.evidence) {
    missingEvidence.push('No product-market fit resilience report observed');
    return empty(missingEvidence, riskSignals);
  }

  if (!hasValidObservedEvidence(input.evidence, Boolean(input.rejectFabricated))) {
    missingEvidence.push('PMF resilience metrics rejected — unverifiable evidence');
    riskSignals.push('Fabricated PMF evidence rejected');
    return empty(missingEvidence, riskSignals);
  }

  let score = 0;
  if (input.evidence.fitStabilityObserved) score += 30;
  if (input.evidence.expansionStressRiskAssessed) score += 25;
  if (input.evidence.marketDependencyRiskAssessed) score += 25;
  if (input.evidence.productFlexibilityObserved) score += 20;

  let confidence: ProductMarketFitResilienceAnalysis['confidence'] = 'LOW';
  if (input.evidence.fitStabilityObserved && input.evidence.productFlexibilityObserved) {
    confidence = 'MEDIUM';
  }
  if (input.evidence.expansionStressRiskAssessed && input.evidence.marketDependencyRiskAssessed) {
    confidence = 'HIGH';
  }

  return {
    readOnly: true,
    fitStability: input.evidence.fitStabilityObserved,
    expansionStressRisk: input.evidence.expansionStressRiskAssessed,
    marketDependencyRisk: input.evidence.marketDependencyRiskAssessed,
    productFlexibility: input.evidence.productFlexibilityObserved,
    productMarketFitScore: Math.min(100, score),
    confidence,
    missingEvidence,
    riskSignals,
  };
}

function empty(
  missingEvidence: string[],
  riskSignals: string[],
): ProductMarketFitResilienceAnalysis {
  return {
    readOnly: true,
    fitStability: false,
    expansionStressRisk: false,
    marketDependencyRisk: false,
    productFlexibility: false,
    productMarketFitScore: 0,
    confidence: 'UNKNOWN',
    missingEvidence,
    riskSignals,
  };
}
