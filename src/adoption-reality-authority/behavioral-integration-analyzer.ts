/**
 * Behavioral integration analyzer — workflow and habit signals from observed evidence.
 */

import { blockedByTrafficOnly, hasValidObservedEvidence } from './evidence-validation.js';
import type {
  BehavioralIntegrationAnalysis,
  BehavioralIntegrationEvidence,
} from './adoption-reality-types.js';

export function analyzeBehavioralIntegration(input: {
  evidence: BehavioralIntegrationEvidence | null;
  repeatUsageObserved: boolean;
  trafficOnly?: boolean;
  signupsOnly?: boolean;
  oneTimeUsage?: boolean;
  rejectFabricated?: boolean;
}): BehavioralIntegrationAnalysis {
  const missingEvidence: string[] = [];
  const riskSignals: string[] = [];

  if (blockedByTrafficOnly(input)) {
    missingEvidence.push('Behavioral integration cannot be inferred from traffic, signups, or one-time usage');
    return {
      readOnly: true,
      workflowIntegration: false,
      habitFormationSignals: false,
      operationalDependence: false,
      routineUsageIndicators: false,
      behavioralIntegrationScore: 0,
      confidence: 'UNKNOWN',
      missingEvidence,
      riskSignals,
    };
  }

  if (!input.evidence) {
    missingEvidence.push('No workflow or behavioral integration report observed');
    return {
      readOnly: true,
      workflowIntegration: false,
      habitFormationSignals: false,
      operationalDependence: false,
      routineUsageIndicators: false,
      behavioralIntegrationScore: 0,
      confidence: 'UNKNOWN',
      missingEvidence,
      riskSignals,
    };
  }

  if (!hasValidObservedEvidence(input.evidence, Boolean(input.rejectFabricated))) {
    missingEvidence.push('Behavioral integration metrics rejected — unverifiable evidence');
    riskSignals.push('Fabricated behavioral integration metrics rejected');
    return {
      readOnly: true,
      workflowIntegration: false,
      habitFormationSignals: false,
      operationalDependence: false,
      routineUsageIndicators: false,
      behavioralIntegrationScore: 0,
      confidence: 'UNKNOWN',
      missingEvidence,
      riskSignals,
    };
  }

  if (!input.repeatUsageObserved) {
    riskSignals.push('Behavioral integration reported without repeat usage evidence');
    missingEvidence.push('Repeat usage evidence required before behavioral integration can be trusted');
  }

  let behavioralIntegrationScore = 0;
  if (input.evidence.workflowIntegrationObserved) behavioralIntegrationScore += 30;
  if (input.evidence.habitFormationSignalsObserved) behavioralIntegrationScore += 25;
  if (input.evidence.operationalDependenceObserved) behavioralIntegrationScore += 25;
  if (input.evidence.routineUsageIndicatorsObserved) behavioralIntegrationScore += 20;

  let confidence: BehavioralIntegrationAnalysis['confidence'] = 'LOW';
  if (input.evidence.workflowIntegrationObserved && input.repeatUsageObserved) confidence = 'MEDIUM';
  if (
    input.evidence.operationalDependenceObserved &&
    input.evidence.routineUsageIndicatorsObserved &&
    input.repeatUsageObserved
  ) {
    confidence = 'HIGH';
  }

  return {
    readOnly: true,
    workflowIntegration: input.evidence.workflowIntegrationObserved,
    habitFormationSignals: input.evidence.habitFormationSignalsObserved,
    operationalDependence: input.evidence.operationalDependenceObserved,
    routineUsageIndicators: input.evidence.routineUsageIndicatorsObserved,
    behavioralIntegrationScore: Math.min(100, behavioralIntegrationScore),
    confidence,
    missingEvidence,
    riskSignals,
  };
}
