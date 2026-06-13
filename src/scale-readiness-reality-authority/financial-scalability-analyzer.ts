/**
 * Financial scalability analyzer — revenue sustainability and scaling cost risks.
 */

import { blockedByUpstreamOnlySignals, hasValidObservedEvidence } from './evidence-validation.js';
import type {
  FinancialScalabilityAnalysis,
  FinancialScalabilityEvidence,
} from './scale-readiness-types.js';

export function analyzeFinancialScalability(input: {
  evidence: FinancialScalabilityEvidence | null;
  revenueObserved: boolean;
  revenueOnly?: boolean;
  adoptionOnly?: boolean;
  infrastructureOnly?: boolean;
  rejectFabricated?: boolean;
}): FinancialScalabilityAnalysis {
  const missingEvidence: string[] = [];
  const riskSignals: string[] = [];

  if (input.revenueOnly || input.adoptionOnly) {
    const reason = input.revenueOnly
      ? 'Revenue alone is not financial scale readiness'
      : 'Adoption alone is not financial scale readiness';
    missingEvidence.push(reason);
    riskSignals.push(`${reason} — financial scalability evidence required`);
    return emptyAnalysis(missingEvidence, riskSignals);
  }

  if (input.infrastructureOnly) {
    missingEvidence.push('Infrastructure alone is not financial scale readiness');
    return emptyAnalysis(missingEvidence, riskSignals);
  }

  if (!input.evidence) {
    missingEvidence.push('No financial scalability report observed');
    return emptyAnalysis(missingEvidence, riskSignals);
  }

  if (!hasValidObservedEvidence(input.evidence, Boolean(input.rejectFabricated))) {
    missingEvidence.push('Financial scalability metrics rejected — unverifiable evidence');
    riskSignals.push('Fabricated financial readiness rejected');
    return emptyAnalysis(missingEvidence, riskSignals);
  }

  let score = 0;
  if (input.evidence.revenueSustainabilityObserved) score += 30;
  if (input.evidence.growthCostSignalsObserved) score += 25;
  if (input.evidence.scalingCostRisksAssessed) score += 25;
  if (input.evidence.financialStabilityObserved) score += 20;

  if (!input.revenueObserved && score > 0) {
    riskSignals.push('Financial scale signals without revenue evidence — verify sustainability');
  }

  let confidence: FinancialScalabilityAnalysis['confidence'] = 'LOW';
  if (input.evidence.revenueSustainabilityObserved && input.evidence.financialStabilityObserved) {
    confidence = 'MEDIUM';
  }
  if (input.evidence.growthCostSignalsObserved && input.evidence.scalingCostRisksAssessed) {
    confidence = 'HIGH';
  }

  return {
    readOnly: true,
    revenueSustainability: input.evidence.revenueSustainabilityObserved,
    growthCostSignals: input.evidence.growthCostSignalsObserved,
    scalingCostRisks: input.evidence.scalingCostRisksAssessed,
    financialStability: input.evidence.financialStabilityObserved,
    financialScalabilityScore: Math.min(100, score),
    confidence,
    missingEvidence,
    riskSignals,
  };
}

function emptyAnalysis(
  missingEvidence: string[],
  riskSignals: string[],
): FinancialScalabilityAnalysis {
  return {
    readOnly: true,
    revenueSustainability: false,
    growthCostSignals: false,
    scalingCostRisks: false,
    financialStability: false,
    financialScalabilityScore: 0,
    confidence: 'UNKNOWN',
    missingEvidence,
    riskSignals,
  };
}
