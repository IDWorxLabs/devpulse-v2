/**
 * Team scalability analyzer — knowledge distribution and bus factor risk.
 */

import { blockedByUpstreamOnlySignals, hasValidObservedEvidence } from './evidence-validation.js';
import type { TeamScalabilityAnalysis, TeamScalabilityEvidence } from './scale-readiness-types.js';

export function analyzeTeamScalability(input: {
  evidence: TeamScalabilityEvidence | null;
  productLaunched: boolean;
  revenueOnly?: boolean;
  adoptionOnly?: boolean;
  infrastructureOnly?: boolean;
  rejectFabricated?: boolean;
}): TeamScalabilityAnalysis {
  const missingEvidence: string[] = [];
  const riskSignals: string[] = [];

  if (blockedByUpstreamOnlySignals(input)) {
    missingEvidence.push('Upstream metrics alone are not team scale readiness');
    return emptyAnalysis(missingEvidence, riskSignals);
  }

  if (!input.evidence) {
    missingEvidence.push('No team or staffing scalability report observed');
    return emptyAnalysis(missingEvidence, riskSignals);
  }

  if (!hasValidObservedEvidence(input.evidence, Boolean(input.rejectFabricated))) {
    missingEvidence.push('Team scalability metrics rejected — unverifiable evidence');
    riskSignals.push('Fabricated team readiness rejected');
    return emptyAnalysis(missingEvidence, riskSignals);
  }

  let score = 0;
  if (input.evidence.knowledgeDistributionObserved) score += 30;
  if (input.evidence.busFactorRiskAssessed) score += 20;
  if (input.evidence.teamDependencyRiskAssessed) score += 25;
  if (input.evidence.operationalOwnershipObserved) score += 25;

  let confidence: TeamScalabilityAnalysis['confidence'] = 'LOW';
  if (input.evidence.knowledgeDistributionObserved && input.evidence.operationalOwnershipObserved) {
    confidence = 'MEDIUM';
  }
  if (input.evidence.busFactorRiskAssessed && input.evidence.teamDependencyRiskAssessed) {
    confidence = 'HIGH';
  }

  return {
    readOnly: true,
    knowledgeDistribution: input.evidence.knowledgeDistributionObserved,
    busFactorRisk: input.evidence.busFactorRiskAssessed,
    teamDependencyRisk: input.evidence.teamDependencyRiskAssessed,
    operationalOwnership: input.evidence.operationalOwnershipObserved,
    teamScalabilityScore: Math.min(100, score),
    confidence,
    missingEvidence,
    riskSignals,
  };
}

function emptyAnalysis(missingEvidence: string[], riskSignals: string[]): TeamScalabilityAnalysis {
  return {
    readOnly: true,
    knowledgeDistribution: false,
    busFactorRisk: false,
    teamDependencyRisk: false,
    operationalOwnership: false,
    teamScalabilityScore: 0,
    confidence: 'UNKNOWN',
    missingEvidence,
    riskSignals,
  };
}
