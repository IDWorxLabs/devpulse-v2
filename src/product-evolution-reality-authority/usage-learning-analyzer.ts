/**
 * Usage learning analyzer — behavior-informed changes from observed evidence.
 */

import { blockedByNonLearningSignals, hasValidObservedEvidence } from './evidence-validation.js';
import type { UsageLearningAnalysis, UsageLearningEvidence } from './product-evolution-reality-types.js';

export function analyzeUsageLearning(input: {
  evidence: UsageLearningEvidence | null;
  adoptionObserved: boolean;
  featureAdditionsOnly?: boolean;
  roadmapOnly?: boolean;
  rejectFabricated?: boolean;
}): UsageLearningAnalysis {
  const missingEvidence: string[] = [];
  const riskSignals: string[] = [];

  if (blockedByNonLearningSignals(input)) {
    missingEvidence.push('Usage learning cannot be inferred from feature additions or roadmap alone');
    return {
      readOnly: true,
      behaviorInformedChanges: false,
      usageDrivenImprovements: false,
      retentionImprovements: false,
      engagementImprovements: false,
      usageLearningScore: 0,
      confidence: 'UNKNOWN',
      missingEvidence,
      riskSignals,
    };
  }

  if (!input.evidence) {
    missingEvidence.push('No usage-driven improvement or retention learning report observed');
    return {
      readOnly: true,
      behaviorInformedChanges: false,
      usageDrivenImprovements: false,
      retentionImprovements: false,
      engagementImprovements: false,
      usageLearningScore: 0,
      confidence: 'UNKNOWN',
      missingEvidence,
      riskSignals,
    };
  }

  if (!hasValidObservedEvidence(input.evidence, Boolean(input.rejectFabricated))) {
    missingEvidence.push('Usage learning metrics rejected — unverifiable evidence');
    riskSignals.push('Fabricated usage learning metrics rejected');
    return {
      readOnly: true,
      behaviorInformedChanges: false,
      usageDrivenImprovements: false,
      retentionImprovements: false,
      engagementImprovements: false,
      usageLearningScore: 0,
      confidence: 'UNKNOWN',
      missingEvidence,
      riskSignals,
    };
  }

  if (!input.adoptionObserved) {
    riskSignals.push('Usage learning reported without adoption evidence — verify behavior signals');
    missingEvidence.push('Adoption evidence recommended before trusting usage learning');
  }

  let usageLearningScore = 0;
  if (input.evidence.behaviorInformedChangesObserved) usageLearningScore += 30;
  if (input.evidence.usageDrivenImprovementsObserved) usageLearningScore += 25;
  if (input.evidence.retentionImprovementsObserved) usageLearningScore += 25;
  if (input.evidence.engagementImprovementsObserved) usageLearningScore += 20;

  let confidence: UsageLearningAnalysis['confidence'] = 'LOW';
  if (input.evidence.usageDrivenImprovementsObserved && input.adoptionObserved) confidence = 'MEDIUM';
  if (
    input.evidence.behaviorInformedChangesObserved &&
    input.evidence.retentionImprovementsObserved &&
    input.adoptionObserved
  ) {
    confidence = 'HIGH';
  }

  return {
    readOnly: true,
    behaviorInformedChanges: input.evidence.behaviorInformedChangesObserved,
    usageDrivenImprovements: input.evidence.usageDrivenImprovementsObserved,
    retentionImprovements: input.evidence.retentionImprovementsObserved,
    engagementImprovements: input.evidence.engagementImprovementsObserved,
    usageLearningScore: Math.min(100, usageLearningScore),
    confidence,
    missingEvidence,
    riskSignals,
  };
}
