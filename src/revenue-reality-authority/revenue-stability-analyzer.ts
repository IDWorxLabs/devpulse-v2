/**
 * Revenue stability analyzer — recurring revenue and predictability from observed evidence.
 */

import { blockedByNonRevenueSignals, hasValidObservedEvidence } from './evidence-validation.js';
import type { RevenueStabilityAnalysis, RevenueStabilityEvidence } from './revenue-reality-types.js';

export function analyzeRevenueStability(input: {
  evidence: RevenueStabilityEvidence | null;
  revenueObserved: boolean;
  recurringRevenueObserved: boolean;
  usersOnly?: boolean;
  adoptionOnly?: boolean;
  rejectFabricated?: boolean;
}): RevenueStabilityAnalysis {
  const missingEvidence: string[] = [];
  const riskSignals: string[] = [];

  if (blockedByNonRevenueSignals(input)) {
    missingEvidence.push('Revenue stability cannot be inferred from users or adoption alone');
    return {
      readOnly: true,
      recurringRevenueSignals: false,
      revenueConsistency: false,
      revenueConcentrationRisk: false,
      revenuePredictability: false,
      revenueStabilityScore: 0,
      confidence: 'UNKNOWN',
      missingEvidence,
      riskSignals,
    };
  }

  if (!input.evidence) {
    missingEvidence.push('No subscription or revenue stability report observed');
    return {
      readOnly: true,
      recurringRevenueSignals: false,
      revenueConsistency: false,
      revenueConcentrationRisk: false,
      revenuePredictability: false,
      revenueStabilityScore: 50,
      confidence: 'UNKNOWN',
      missingEvidence,
      riskSignals: ['Revenue predictability unknown — no stability evidence'],
    };
  }

  if (!hasValidObservedEvidence(input.evidence, Boolean(input.rejectFabricated))) {
    missingEvidence.push('Revenue stability metrics rejected — unverifiable evidence');
    riskSignals.push('Fabricated subscription metrics rejected');
    return {
      readOnly: true,
      recurringRevenueSignals: false,
      revenueConsistency: false,
      revenueConcentrationRisk: false,
      revenuePredictability: false,
      revenueStabilityScore: 0,
      confidence: 'UNKNOWN',
      missingEvidence,
      riskSignals,
    };
  }

  let revenueStabilityScore = 50;
  if (input.evidence.recurringRevenueSignalsObserved) revenueStabilityScore += 20;
  if (input.evidence.revenueConsistencyObserved) revenueStabilityScore += 20;
  if (input.evidence.revenuePredictabilityObserved) revenueStabilityScore += 15;
  if (input.evidence.revenueConcentrationRiskObserved) {
    revenueStabilityScore -= 20;
    riskSignals.push('Revenue concentration risk observed — single-customer dependency');
  }

  if (!input.recurringRevenueObserved) {
    riskSignals.push('Recurring revenue not observed — stability confidence reduced');
  }

  let confidence: RevenueStabilityAnalysis['confidence'] = 'LOW';
  if (input.evidence.recurringRevenueSignalsObserved && input.recurringRevenueObserved) confidence = 'MEDIUM';
  if (
    input.evidence.revenueConsistencyObserved &&
    input.evidence.revenuePredictabilityObserved &&
    input.recurringRevenueObserved
  ) {
    confidence = 'HIGH';
  }

  return {
    readOnly: true,
    recurringRevenueSignals: input.evidence.recurringRevenueSignalsObserved,
    revenueConsistency: input.evidence.revenueConsistencyObserved,
    revenueConcentrationRisk: input.evidence.revenueConcentrationRiskObserved,
    revenuePredictability: input.evidence.revenuePredictabilityObserved,
    revenueStabilityScore: Math.min(100, Math.max(0, revenueStabilityScore)),
    confidence,
    missingEvidence,
    riskSignals,
  };
}
