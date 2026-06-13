/**
 * Revenue learning analyzer — revenue-informed decisions from observed evidence.
 */

import { blockedByNonLearningSignals, hasValidObservedEvidence } from './evidence-validation.js';
import type { RevenueLearningAnalysis, RevenueLearningEvidence } from './product-evolution-reality-types.js';

export function analyzeRevenueLearning(input: {
  evidence: RevenueLearningEvidence | null;
  revenueObserved: boolean;
  featureAdditionsOnly?: boolean;
  roadmapOnly?: boolean;
  rejectFabricated?: boolean;
}): RevenueLearningAnalysis {
  const missingEvidence: string[] = [];
  const riskSignals: string[] = [];

  if (blockedByNonLearningSignals(input)) {
    missingEvidence.push('Revenue learning cannot be inferred from feature additions or roadmap alone');
    return {
      readOnly: true,
      revenueInformedDecisions: false,
      customerValueImprovements: false,
      businessModelAdjustments: false,
      monetizationLearning: false,
      revenueLearningScore: 0,
      confidence: 'UNKNOWN',
      missingEvidence,
      riskSignals,
    };
  }

  if (!input.evidence) {
    missingEvidence.push('No revenue-informed decision or monetization learning report observed');
    return {
      readOnly: true,
      revenueInformedDecisions: false,
      customerValueImprovements: false,
      businessModelAdjustments: false,
      monetizationLearning: false,
      revenueLearningScore: 0,
      confidence: 'UNKNOWN',
      missingEvidence,
      riskSignals,
    };
  }

  if (!hasValidObservedEvidence(input.evidence, Boolean(input.rejectFabricated))) {
    missingEvidence.push('Revenue learning metrics rejected — unverifiable evidence');
    riskSignals.push('Fabricated revenue learning metrics rejected — no inferred evolution');
    return {
      readOnly: true,
      revenueInformedDecisions: false,
      customerValueImprovements: false,
      businessModelAdjustments: false,
      monetizationLearning: false,
      revenueLearningScore: 0,
      confidence: 'UNKNOWN',
      missingEvidence,
      riskSignals,
    };
  }

  if (!input.revenueObserved) {
    riskSignals.push('Revenue learning reported without revenue evidence');
    missingEvidence.push('Revenue evidence required before revenue learning can be trusted');
  }

  let revenueLearningScore = 0;
  if (input.evidence.revenueInformedDecisionsObserved) revenueLearningScore += 30;
  if (input.evidence.customerValueImprovementsObserved) revenueLearningScore += 25;
  if (input.evidence.businessModelAdjustmentsObserved) revenueLearningScore += 25;
  if (input.evidence.monetizationLearningObserved) revenueLearningScore += 20;

  let confidence: RevenueLearningAnalysis['confidence'] = 'LOW';
  if (input.evidence.revenueInformedDecisionsObserved && input.revenueObserved) confidence = 'MEDIUM';
  if (
    input.evidence.customerValueImprovementsObserved &&
    input.evidence.monetizationLearningObserved &&
    input.revenueObserved
  ) {
    confidence = 'HIGH';
  }

  return {
    readOnly: true,
    revenueInformedDecisions: input.evidence.revenueInformedDecisionsObserved,
    customerValueImprovements: input.evidence.customerValueImprovementsObserved,
    businessModelAdjustments: input.evidence.businessModelAdjustmentsObserved,
    monetizationLearning: input.evidence.monetizationLearningObserved,
    revenueLearningScore: Math.min(100, revenueLearningScore),
    confidence,
    missingEvidence,
    riskSignals,
  };
}
