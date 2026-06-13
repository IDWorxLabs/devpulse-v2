/**
 * Reliability scalability analyzer — uptime, incidents, and recovery under growth.
 */

import { blockedByUpstreamOnlySignals, hasValidObservedEvidence } from './evidence-validation.js';
import type {
  ReliabilityScalabilityAnalysis,
  ReliabilityScalabilityEvidence,
} from './scale-readiness-types.js';

export function analyzeReliabilityScalability(input: {
  evidence: ReliabilityScalabilityEvidence | null;
  productLaunched: boolean;
  postLaunchReliabilityScore?: number;
  revenueOnly?: boolean;
  adoptionOnly?: boolean;
  infrastructureOnly?: boolean;
  rejectFabricated?: boolean;
}): ReliabilityScalabilityAnalysis {
  const missingEvidence: string[] = [];
  const riskSignals: string[] = [];

  if (blockedByUpstreamOnlySignals(input) && !input.infrastructureOnly) {
    missingEvidence.push('Upstream metrics alone are not reliability scale readiness');
    return emptyAnalysis(missingEvidence, riskSignals);
  }

  if (!input.evidence) {
    missingEvidence.push('No reliability or uptime scalability report observed');
    return emptyAnalysis(missingEvidence, riskSignals);
  }

  if (!hasValidObservedEvidence(input.evidence, Boolean(input.rejectFabricated))) {
    missingEvidence.push('Reliability scalability metrics rejected — unverifiable evidence');
    riskSignals.push('Fabricated reliability evidence rejected');
    return emptyAnalysis(missingEvidence, riskSignals);
  }

  let score = 0;
  if (input.evidence.reliabilityHistoryObserved) score += 25;
  if (input.evidence.availabilitySignalsObserved) score += 30;
  if (input.evidence.incidentTrendsAssessed) score += 20;
  if (input.evidence.failureRecoveryCapabilityObserved) score += 25;

  if (input.infrastructureOnly && score > 0) {
    riskSignals.push('Infrastructure/reliability evidence alone — full scale readiness not proven');
  }

  let confidence: ReliabilityScalabilityAnalysis['confidence'] = 'LOW';
  if (input.evidence.availabilitySignalsObserved && input.evidence.reliabilityHistoryObserved) {
    confidence = 'MEDIUM';
  }
  if (input.evidence.failureRecoveryCapabilityObserved && input.evidence.incidentTrendsAssessed) {
    confidence = 'HIGH';
  }

  return {
    readOnly: true,
    reliabilityHistory: input.evidence.reliabilityHistoryObserved,
    availabilitySignals: input.evidence.availabilitySignalsObserved,
    incidentTrends: input.evidence.incidentTrendsAssessed,
    failureRecoveryCapability: input.evidence.failureRecoveryCapabilityObserved,
    reliabilityScalabilityScore: Math.min(100, score),
    confidence,
    missingEvidence,
    riskSignals,
  };
}

function emptyAnalysis(
  missingEvidence: string[],
  riskSignals: string[],
): ReliabilityScalabilityAnalysis {
  return {
    readOnly: true,
    reliabilityHistory: false,
    availabilitySignals: false,
    incidentTrends: false,
    failureRecoveryCapability: false,
    reliabilityScalabilityScore: 0,
    confidence: 'UNKNOWN',
    missingEvidence,
    riskSignals,
  };
}
