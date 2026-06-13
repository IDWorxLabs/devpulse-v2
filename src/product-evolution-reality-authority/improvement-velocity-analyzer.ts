/**
 * Improvement velocity analyzer — evidence-to-action speed from observed release/changelog evidence.
 */

import { blockedByNonLearningSignals, hasValidObservedEvidence } from './evidence-validation.js';
import type {
  ImprovementVelocityAnalysis,
  ImprovementVelocityEvidence,
} from './product-evolution-reality-types.js';

export function analyzeImprovementVelocity(input: {
  evidence: ImprovementVelocityEvidence | null;
  anyLearningObserved: boolean;
  featureAdditionsOnly?: boolean;
  roadmapOnly?: boolean;
  rejectFabricated?: boolean;
}): ImprovementVelocityAnalysis {
  const missingEvidence: string[] = [];
  const riskSignals: string[] = [];

  if (blockedByNonLearningSignals(input)) {
    missingEvidence.push('Improvement velocity cannot be inferred from feature additions or roadmap alone');
    return {
      readOnly: true,
      improvementFrequency: false,
      evidenceToActionSpeed: false,
      issueResolutionSpeed: false,
      adaptationResponsiveness: false,
      improvementsInLastPeriod: null,
      improvementVelocityScore: 0,
      confidence: 'UNKNOWN',
      missingEvidence,
      riskSignals,
    };
  }

  if (!input.evidence) {
    missingEvidence.push('No release notes, changelog, or improvement velocity report observed');
    return {
      readOnly: true,
      improvementFrequency: false,
      evidenceToActionSpeed: false,
      issueResolutionSpeed: false,
      adaptationResponsiveness: false,
      improvementsInLastPeriod: null,
      improvementVelocityScore: 0,
      confidence: 'UNKNOWN',
      missingEvidence,
      riskSignals,
    };
  }

  if (!hasValidObservedEvidence(input.evidence, Boolean(input.rejectFabricated))) {
    missingEvidence.push('Improvement velocity metrics rejected — unverifiable evidence');
    riskSignals.push('Fabricated improvement velocity metrics rejected');
    return {
      readOnly: true,
      improvementFrequency: false,
      evidenceToActionSpeed: false,
      issueResolutionSpeed: false,
      adaptationResponsiveness: false,
      improvementsInLastPeriod: null,
      improvementVelocityScore: 0,
      confidence: 'UNKNOWN',
      missingEvidence,
      riskSignals,
    };
  }

  if (!input.anyLearningObserved) {
    riskSignals.push('Improvement velocity without learning evidence may reflect changes only, not evolution');
  }

  let improvementVelocityScore = 0;
  if (input.evidence.improvementFrequencyObserved) improvementVelocityScore += 25;
  if (input.evidence.evidenceToActionSpeedObserved) improvementVelocityScore += 30;
  if (input.evidence.issueResolutionSpeedObserved) improvementVelocityScore += 25;
  if (input.evidence.adaptationResponsivenessObserved) improvementVelocityScore += 20;
  if ((input.evidence.improvementsInLastPeriod ?? 0) >= 3) {
    improvementVelocityScore = Math.min(100, improvementVelocityScore + 10);
  }

  let confidence: ImprovementVelocityAnalysis['confidence'] = 'LOW';
  if (input.evidence.evidenceToActionSpeedObserved && input.anyLearningObserved) confidence = 'MEDIUM';
  if (
    input.evidence.adaptationResponsivenessObserved &&
    input.evidence.issueResolutionSpeedObserved &&
    input.anyLearningObserved
  ) {
    confidence = 'HIGH';
  }

  return {
    readOnly: true,
    improvementFrequency: input.evidence.improvementFrequencyObserved,
    evidenceToActionSpeed: input.evidence.evidenceToActionSpeedObserved,
    issueResolutionSpeed: input.evidence.issueResolutionSpeedObserved,
    adaptationResponsiveness: input.evidence.adaptationResponsivenessObserved,
    improvementsInLastPeriod: input.evidence.improvementsInLastPeriod,
    improvementVelocityScore: Math.min(100, improvementVelocityScore),
    confidence,
    missingEvidence,
    riskSignals,
  };
}
