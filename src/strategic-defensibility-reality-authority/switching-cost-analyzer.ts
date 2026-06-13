/**
 * Switching cost analyzer.
 */

import { hasValidObservedEvidence } from './evidence-validation.js';
import type { SwitchingCostAnalysis, SwitchingCostEvidence } from './strategic-defensibility-types.js';

function empty(missingEvidence: string[], riskSignals: string[]): SwitchingCostAnalysis {
  return {
    readOnly: true,
    customerLockInSignals: false,
    migrationDifficulty: false,
    workflowDependency: false,
    replacementResistance: false,
    switchingCostScore: 0,
    confidence: 'UNKNOWN',
    missingEvidence,
    riskSignals,
  };
}

export function analyzeSwitchingCost(input: {
  evidence: SwitchingCostEvidence | null;
  productLaunched: boolean;
  adoptionObserved: boolean;
  revenueOnly?: boolean;
  adoptionOnly?: boolean;
  marketExpansionOnly?: boolean;
  rejectFabricated?: boolean;
}): SwitchingCostAnalysis {
  const missingEvidence: string[] = [];
  const riskSignals: string[] = [];

  if (input.revenueOnly) {
    missingEvidence.push('Revenue alone is not switching cost evidence');
    riskSignals.push('Revenue alone cannot prove replacement resistance');
    return empty(missingEvidence, riskSignals);
  }

  if (input.adoptionOnly) {
    missingEvidence.push('Adoption alone is not switching cost evidence');
    riskSignals.push('Adoption alone cannot prove workflow dependency or lock-in');
    return empty(missingEvidence, riskSignals);
  }

  if (input.marketExpansionOnly) {
    missingEvidence.push('Market expansion alone is not switching cost evidence');
    return empty(missingEvidence, riskSignals);
  }

  if (!input.productLaunched) {
    missingEvidence.push('Product not launched — switching costs not yet applicable');
    return empty(missingEvidence, riskSignals);
  }

  if (!input.evidence) {
    missingEvidence.push('No switching cost or customer dependency report observed');
    return empty(missingEvidence, riskSignals);
  }

  if (!hasValidObservedEvidence(input.evidence, Boolean(input.rejectFabricated))) {
    missingEvidence.push('Switching cost metrics rejected — unverifiable evidence');
    riskSignals.push('Fabricated moat evidence rejected');
    return empty(missingEvidence, riskSignals);
  }

  let score = 0;
  if (input.evidence.customerLockInSignalsObserved) score += 25;
  if (input.evidence.migrationDifficultyObserved) score += 25;
  if (input.evidence.workflowDependencyObserved) score += 30;
  if (input.evidence.replacementResistanceObserved) score += 20;

  let confidence: SwitchingCostAnalysis['confidence'] = 'LOW';
  if (input.evidence.workflowDependencyObserved && input.evidence.replacementResistanceObserved) {
    confidence = 'MEDIUM';
  }
  if (input.evidence.customerLockInSignalsObserved && input.evidence.migrationDifficultyObserved) {
    confidence = 'HIGH';
  }

  return {
    readOnly: true,
    customerLockInSignals: input.evidence.customerLockInSignalsObserved,
    migrationDifficulty: input.evidence.migrationDifficultyObserved,
    workflowDependency: input.evidence.workflowDependencyObserved,
    replacementResistance: input.evidence.replacementResistanceObserved,
    switchingCostScore: Math.min(100, score),
    confidence,
    missingEvidence,
    riskSignals,
  };
}
