/**
 * Architecture scalability analyzer — system and infrastructure scale evidence.
 */

import { blockedByUpstreamOnlySignals, hasValidObservedEvidence } from './evidence-validation.js';
import type {
  ArchitectureScalabilityAnalysis,
  ArchitectureScalabilityEvidence,
} from './scale-readiness-types.js';

export function analyzeArchitectureScalability(input: {
  evidence: ArchitectureScalabilityEvidence | null;
  productLaunched: boolean;
  revenueOnly?: boolean;
  adoptionOnly?: boolean;
  infrastructureOnly?: boolean;
  rejectFabricated?: boolean;
}): ArchitectureScalabilityAnalysis {
  const missingEvidence: string[] = [];
  const riskSignals: string[] = [];

  if (blockedByUpstreamOnlySignals(input) && !input.infrastructureOnly) {
    const reason = input.revenueOnly
      ? 'Revenue alone is not scale readiness evidence'
      : 'Adoption alone is not scale readiness evidence';
    missingEvidence.push(reason);
    riskSignals.push(`${reason} — architecture scalability evidence required`);
    return emptyAnalysis(missingEvidence, riskSignals);
  }

  if (!input.evidence) {
    missingEvidence.push('No architecture or infrastructure scalability report observed');
    return emptyAnalysis(missingEvidence, riskSignals);
  }

  if (!hasValidObservedEvidence(input.evidence, Boolean(input.rejectFabricated))) {
    missingEvidence.push('Architecture scalability metrics rejected — unverifiable evidence');
    riskSignals.push('Fabricated scalability evidence rejected');
    return emptyAnalysis(missingEvidence, riskSignals);
  }

  let score = 0;
  if (input.evidence.systemScalabilityObserved) score += 25;
  if (input.evidence.bottleneckRisksIdentified) score += 15;
  if (input.evidence.infrastructureReadinessObserved) score += 25;
  if (input.evidence.capacitySignalsObserved) score += 20;
  if (input.evidence.scalabilityConfidenceObserved) score += 15;

  if (input.infrastructureOnly && score > 0) {
    riskSignals.push('Infrastructure evidence alone — other scale dimensions still required');
  }

  let confidence: ArchitectureScalabilityAnalysis['confidence'] = 'LOW';
  if (input.evidence.infrastructureReadinessObserved && input.evidence.systemScalabilityObserved) {
    confidence = 'MEDIUM';
  }
  if (input.evidence.scalabilityConfidenceObserved && input.evidence.capacitySignalsObserved) {
    confidence = 'HIGH';
  }

  return {
    readOnly: true,
    systemScalability: input.evidence.systemScalabilityObserved,
    bottleneckRisks: input.evidence.bottleneckRisksIdentified,
    infrastructureReadiness: input.evidence.infrastructureReadinessObserved,
    capacitySignals: input.evidence.capacitySignalsObserved,
    scalabilityConfidence: input.evidence.scalabilityConfidenceObserved,
    architectureScalabilityScore: Math.min(100, score),
    confidence,
    missingEvidence,
    riskSignals,
  };
}

function emptyAnalysis(
  missingEvidence: string[],
  riskSignals: string[],
): ArchitectureScalabilityAnalysis {
  return {
    readOnly: true,
    systemScalability: false,
    bottleneckRisks: false,
    infrastructureReadiness: false,
    capacitySignals: false,
    scalabilityConfidence: false,
    architectureScalabilityScore: 0,
    confidence: 'UNKNOWN',
    missingEvidence,
    riskSignals,
  };
}
