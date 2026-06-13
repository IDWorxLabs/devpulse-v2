/**
 * Execution advantage analyzer.
 */

import { hasValidObservedEvidence } from './evidence-validation.js';
import type { ExecutionAdvantageAnalysis, ExecutionAdvantageEvidence } from './strategic-defensibility-types.js';

function empty(missingEvidence: string[], riskSignals: string[]): ExecutionAdvantageAnalysis {
  return {
    readOnly: true,
    improvementVelocity: false,
    adaptationSpeed: false,
    innovationSignals: false,
    operationalExcellence: false,
    executionAdvantageScore: 0,
    confidence: 'UNKNOWN',
    missingEvidence,
    riskSignals,
  };
}

export function analyzeExecutionAdvantage(input: {
  evidence: ExecutionAdvantageEvidence | null;
  productLaunched: boolean;
  revenueOnly?: boolean;
  adoptionOnly?: boolean;
  marketExpansionOnly?: boolean;
  rejectFabricated?: boolean;
}): ExecutionAdvantageAnalysis {
  const missingEvidence: string[] = [];
  const riskSignals: string[] = [];

  if (input.revenueOnly || input.adoptionOnly || input.marketExpansionOnly) {
    missingEvidence.push('Upstream metrics alone are not execution advantage evidence');
    return empty(missingEvidence, riskSignals);
  }

  if (!input.evidence) {
    missingEvidence.push('No execution advantage or evolution report observed');
    return empty(missingEvidence, riskSignals);
  }

  if (!hasValidObservedEvidence(input.evidence, Boolean(input.rejectFabricated))) {
    missingEvidence.push('Execution advantage metrics rejected — unverifiable evidence');
    riskSignals.push('Fabricated moat evidence rejected');
    return empty(missingEvidence, riskSignals);
  }

  let score = 0;
  if (input.evidence.improvementVelocityObserved) score += 25;
  if (input.evidence.adaptationSpeedObserved) score += 25;
  if (input.evidence.innovationSignalsObserved) score += 25;
  if (input.evidence.operationalExcellenceObserved) score += 25;

  let confidence: ExecutionAdvantageAnalysis['confidence'] = 'LOW';
  if (input.evidence.improvementVelocityObserved && input.evidence.adaptationSpeedObserved) {
    confidence = 'MEDIUM';
  }
  if (input.evidence.innovationSignalsObserved && input.evidence.operationalExcellenceObserved) {
    confidence = 'HIGH';
  }

  return {
    readOnly: true,
    improvementVelocity: input.evidence.improvementVelocityObserved,
    adaptationSpeed: input.evidence.adaptationSpeedObserved,
    innovationSignals: input.evidence.innovationSignalsObserved,
    operationalExcellence: input.evidence.operationalExcellenceObserved,
    executionAdvantageScore: Math.min(100, score),
    confidence,
    missingEvidence,
    riskSignals,
  };
}
