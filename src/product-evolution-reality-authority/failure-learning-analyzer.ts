/**
 * Failure learning analyzer — bug fixes and incident learning from observed evidence.
 */

import { blockedByNonLearningSignals, hasValidObservedEvidence } from './evidence-validation.js';
import type { FailureLearningAnalysis, FailureLearningEvidence } from './product-evolution-reality-types.js';

export function analyzeFailureLearning(input: {
  evidence: FailureLearningEvidence | null;
  productLaunched: boolean;
  featureAdditionsOnly?: boolean;
  roadmapOnly?: boolean;
  rejectFabricated?: boolean;
}): FailureLearningAnalysis {
  const missingEvidence: string[] = [];
  const riskSignals: string[] = [];

  if (blockedByNonLearningSignals(input)) {
    missingEvidence.push('Failure learning cannot be inferred from feature additions or roadmap alone');
    return {
      readOnly: true,
      bugFixLearning: false,
      incidentLearning: false,
      rootCauseLearning: false,
      repeatedFailureReduction: false,
      failureLearningScore: 0,
      confidence: 'UNKNOWN',
      missingEvidence,
      riskSignals,
    };
  }

  if (!input.evidence) {
    missingEvidence.push('No bug report or incident learning evidence observed');
    return {
      readOnly: true,
      bugFixLearning: false,
      incidentLearning: false,
      rootCauseLearning: false,
      repeatedFailureReduction: false,
      failureLearningScore: 0,
      confidence: 'UNKNOWN',
      missingEvidence,
      riskSignals,
    };
  }

  if (!hasValidObservedEvidence(input.evidence, Boolean(input.rejectFabricated))) {
    missingEvidence.push('Failure learning metrics rejected — unverifiable evidence');
    riskSignals.push('Fabricated failure learning metrics rejected');
    return {
      readOnly: true,
      bugFixLearning: false,
      incidentLearning: false,
      rootCauseLearning: false,
      repeatedFailureReduction: false,
      failureLearningScore: 0,
      confidence: 'UNKNOWN',
      missingEvidence,
      riskSignals,
    };
  }

  let failureLearningScore = 0;
  if (input.evidence.bugFixLearningObserved) failureLearningScore += 30;
  if (input.evidence.incidentLearningObserved) failureLearningScore += 25;
  if (input.evidence.rootCauseLearningObserved) failureLearningScore += 25;
  if (input.evidence.repeatedFailureReductionObserved) failureLearningScore += 20;

  let confidence: FailureLearningAnalysis['confidence'] = 'LOW';
  if (input.evidence.bugFixLearningObserved && input.evidence.rootCauseLearningObserved) {
    confidence = 'MEDIUM';
  }
  if (input.evidence.repeatedFailureReductionObserved && input.evidence.incidentLearningObserved) {
    confidence = 'HIGH';
  }

  return {
    readOnly: true,
    bugFixLearning: input.evidence.bugFixLearningObserved,
    incidentLearning: input.evidence.incidentLearningObserved,
    rootCauseLearning: input.evidence.rootCauseLearningObserved,
    repeatedFailureReduction: input.evidence.repeatedFailureReductionObserved,
    failureLearningScore: Math.min(100, failureLearningScore),
    confidence,
    missingEvidence,
    riskSignals,
  };
}
