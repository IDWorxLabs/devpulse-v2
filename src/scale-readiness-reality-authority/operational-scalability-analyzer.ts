/**
 * Operational scalability analyzer — monitoring, incident response, recovery.
 */

import { blockedByUpstreamOnlySignals, hasValidObservedEvidence } from './evidence-validation.js';
import type {
  OperationalScalabilityAnalysis,
  OperationalScalabilityEvidence,
} from './scale-readiness-types.js';

export function analyzeOperationalScalability(input: {
  evidence: OperationalScalabilityEvidence | null;
  productLaunched: boolean;
  revenueOnly?: boolean;
  adoptionOnly?: boolean;
  infrastructureOnly?: boolean;
  rejectFabricated?: boolean;
}): OperationalScalabilityAnalysis {
  const missingEvidence: string[] = [];
  const riskSignals: string[] = [];

  if (blockedByUpstreamOnlySignals(input)) {
    missingEvidence.push('Upstream metrics alone are not operational scale readiness');
    return emptyAnalysis(missingEvidence, riskSignals);
  }

  if (!input.evidence) {
    missingEvidence.push('No operational scalability report observed');
    return emptyAnalysis(missingEvidence, riskSignals);
  }

  if (!hasValidObservedEvidence(input.evidence, Boolean(input.rejectFabricated))) {
    missingEvidence.push('Operational scalability metrics rejected — unverifiable evidence');
    riskSignals.push('Fabricated operational readiness rejected');
    return emptyAnalysis(missingEvidence, riskSignals);
  }

  let score = 0;
  if (input.evidence.operationalMaturityObserved) score += 25;
  if (input.evidence.monitoringCoverageObserved) score += 25;
  if (input.evidence.incidentResponseCapabilityObserved) score += 20;
  if (input.evidence.recoveryCapabilityObserved) score += 15;
  if (input.evidence.operationalReadinessObserved) score += 15;

  let confidence: OperationalScalabilityAnalysis['confidence'] = 'LOW';
  if (input.evidence.monitoringCoverageObserved && input.evidence.operationalMaturityObserved) {
    confidence = 'MEDIUM';
  }
  if (input.evidence.incidentResponseCapabilityObserved && input.evidence.recoveryCapabilityObserved) {
    confidence = 'HIGH';
  }

  return {
    readOnly: true,
    operationalMaturity: input.evidence.operationalMaturityObserved,
    monitoringCoverage: input.evidence.monitoringCoverageObserved,
    incidentResponseCapability: input.evidence.incidentResponseCapabilityObserved,
    recoveryCapability: input.evidence.recoveryCapabilityObserved,
    operationalReadiness: input.evidence.operationalReadinessObserved,
    operationalScalabilityScore: Math.min(100, score),
    confidence,
    missingEvidence,
    riskSignals,
  };
}

function emptyAnalysis(
  missingEvidence: string[],
  riskSignals: string[],
): OperationalScalabilityAnalysis {
  return {
    readOnly: true,
    operationalMaturity: false,
    monitoringCoverage: false,
    incidentResponseCapability: false,
    recoveryCapability: false,
    operationalReadiness: false,
    operationalScalabilityScore: 0,
    confidence: 'UNKNOWN',
    missingEvidence,
    riskSignals,
  };
}
