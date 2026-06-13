/**
 * Business outcome analyzer — customer value and monetization from observed evidence only.
 */

import { FABRICATED_EVIDENCE_SOURCES } from './post-launch-reality-registry.js';
import type {
  BusinessOutcomeAnalysis,
  PostLaunchBusinessEvidence,
} from './post-launch-reality-types.js';

function isFabricated(source: string): boolean {
  return FABRICATED_EVIDENCE_SOURCES.some((s) => source.toUpperCase().includes(s));
}

export function analyzeBusinessOutcome(input: {
  evidence: PostLaunchBusinessEvidence | null;
  activityObserved: boolean;
  retentionObserved: boolean;
  rejectFabricated?: boolean;
}): BusinessOutcomeAnalysis {
  const missingEvidence: string[] = [];
  const riskSignals: string[] = [];

  if (!input.evidence) {
    missingEvidence.push('No customer value, monetization, or business outcome reports observed');
    return {
      readOnly: true,
      customerValueEvidence: false,
      founderGoalProgress: false,
      monetizationEvidence: false,
      productImpactEvidence: false,
      businessOutcomeSignals: [],
      businessOutcomeScore: 0,
      missingEvidence,
      riskSignals,
    };
  }

  if (
    !input.evidence.evidenceSource ||
    input.evidence.evidencePaths.length === 0 ||
    (input.rejectFabricated && isFabricated(input.evidence.evidenceSource))
  ) {
    missingEvidence.push('Business outcome metrics rejected — unverifiable evidence');
    riskSignals.push('Fabricated business outcome metrics rejected — no inferred revenue');
    return {
      readOnly: true,
      customerValueEvidence: false,
      founderGoalProgress: false,
      monetizationEvidence: false,
      productImpactEvidence: false,
      businessOutcomeSignals: [],
      businessOutcomeScore: 0,
      missingEvidence,
      riskSignals,
    };
  }

  if (!input.activityObserved) {
    riskSignals.push('Business value cannot be confirmed without observed post-launch activity');
    missingEvidence.push('Activity evidence required before business outcomes can be trusted');
  }

  let businessOutcomeScore = 0;
  if (input.evidence.customerValueEvidenceObserved) businessOutcomeScore += 30;
  if (input.evidence.founderGoalProgressObserved) businessOutcomeScore += 25;
  if (input.evidence.productImpactEvidenceObserved) businessOutcomeScore += 25;
  if (input.evidence.monetizationEvidenceObserved) businessOutcomeScore += 20;

  if (input.evidence.monetizationEvidenceObserved && !input.retentionObserved) {
    riskSignals.push('Monetization claimed without retention evidence — confidence reduced');
    businessOutcomeScore = Math.max(0, businessOutcomeScore - 15);
  }

  return {
    readOnly: true,
    customerValueEvidence: input.evidence.customerValueEvidenceObserved,
    founderGoalProgress: input.evidence.founderGoalProgressObserved,
    monetizationEvidence: input.evidence.monetizationEvidenceObserved,
    productImpactEvidence: input.evidence.productImpactEvidenceObserved,
    businessOutcomeSignals: input.evidence.businessOutcomeSignals.slice(0, 8),
    businessOutcomeScore: Math.min(100, businessOutcomeScore),
    missingEvidence,
    riskSignals,
  };
}
