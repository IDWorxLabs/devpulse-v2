/**
 * User dependency analyzer — dependency and switching cost from observed evidence.
 */

import { blockedByTrafficOnly, hasValidObservedEvidence } from './evidence-validation.js';
import type { UserDependencyAnalysis, UserDependencyEvidence } from './adoption-reality-types.js';

export function analyzeUserDependency(input: {
  evidence: UserDependencyEvidence | null;
  behavioralIntegrationObserved: boolean;
  featureAdoptionObserved: boolean;
  trafficOnly?: boolean;
  signupsOnly?: boolean;
  oneTimeUsage?: boolean;
  rejectFabricated?: boolean;
}): UserDependencyAnalysis {
  const missingEvidence: string[] = [];
  const riskSignals: string[] = [];

  if (blockedByTrafficOnly(input)) {
    missingEvidence.push('User dependency cannot be inferred from traffic, signups, or one-time usage');
    return {
      readOnly: true,
      dependencySignals: false,
      replacementResistance: false,
      switchingCostIndicators: false,
      operationalImportance: false,
      dependencyScore: 0,
      confidence: 'UNKNOWN',
      missingEvidence,
      riskSignals,
    };
  }

  if (!input.evidence) {
    missingEvidence.push('No dependency or operational importance report observed');
    return {
      readOnly: true,
      dependencySignals: false,
      replacementResistance: false,
      switchingCostIndicators: false,
      operationalImportance: false,
      dependencyScore: 0,
      confidence: 'UNKNOWN',
      missingEvidence,
      riskSignals,
    };
  }

  if (!hasValidObservedEvidence(input.evidence, Boolean(input.rejectFabricated))) {
    missingEvidence.push('Dependency metrics rejected — unverifiable evidence');
    riskSignals.push('Fabricated dependency metrics rejected — no inferred dependency');
    return {
      readOnly: true,
      dependencySignals: false,
      replacementResistance: false,
      switchingCostIndicators: false,
      operationalImportance: false,
      dependencyScore: 0,
      confidence: 'UNKNOWN',
      missingEvidence,
      riskSignals,
    };
  }

  if (!input.behavioralIntegrationObserved && !input.featureAdoptionObserved) {
    riskSignals.push('Dependency claimed without behavioral integration or feature adoption evidence');
    missingEvidence.push('Behavioral integration or feature adoption required before dependency can be trusted');
  }

  let dependencyScore = 0;
  if (input.evidence.dependencySignalsObserved) dependencyScore += 25;
  if (input.evidence.replacementResistanceObserved) dependencyScore += 25;
  if (input.evidence.switchingCostIndicatorsObserved) dependencyScore += 25;
  if (input.evidence.operationalImportanceObserved) dependencyScore += 25;

  let confidence: UserDependencyAnalysis['confidence'] = 'LOW';
  if (input.evidence.dependencySignalsObserved && input.behavioralIntegrationObserved) confidence = 'MEDIUM';
  if (
    input.evidence.operationalImportanceObserved &&
    input.evidence.replacementResistanceObserved &&
    input.featureAdoptionObserved
  ) {
    confidence = 'HIGH';
  }

  return {
    readOnly: true,
    dependencySignals: input.evidence.dependencySignalsObserved,
    replacementResistance: input.evidence.replacementResistanceObserved,
    switchingCostIndicators: input.evidence.switchingCostIndicatorsObserved,
    operationalImportance: input.evidence.operationalImportanceObserved,
    dependencyScore: Math.min(100, dependencyScore),
    confidence,
    missingEvidence,
    riskSignals,
  };
}
