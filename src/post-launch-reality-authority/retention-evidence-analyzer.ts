/**
 * Retention evidence analyzer — repeat users and return signals from observed reports.
 */

import { FABRICATED_EVIDENCE_SOURCES } from './post-launch-reality-registry.js';
import type {
  PostLaunchRetentionEvidence,
  RetentionEvidenceAnalysis,
} from './post-launch-reality-types.js';

function isFabricated(source: string): boolean {
  return FABRICATED_EVIDENCE_SOURCES.some((s) => source.toUpperCase().includes(s));
}

export function analyzeRetentionEvidence(input: {
  evidence: PostLaunchRetentionEvidence | null;
  trafficObserved: boolean;
  engagementObserved: boolean;
  rejectFabricated?: boolean;
}): RetentionEvidenceAnalysis {
  const missingEvidence: string[] = [];
  const riskSignals: string[] = [];

  if (!input.evidence) {
    missingEvidence.push('No retention report or repeat-user evidence observed');
    return {
      readOnly: true,
      repeatUsers: false,
      repeatUserCount: null,
      retentionSignals: false,
      userReturnEvidence: false,
      retentionConfidence: 'UNKNOWN',
      retentionScore: 0,
      missingEvidence,
      riskSignals,
    };
  }

  if (
    !input.evidence.evidenceSource ||
    input.evidence.evidencePaths.length === 0 ||
    (input.rejectFabricated && isFabricated(input.evidence.evidenceSource))
  ) {
    missingEvidence.push('Retention metrics rejected — unverifiable evidence');
    riskSignals.push('Fabricated retention metrics rejected');
    return {
      readOnly: true,
      repeatUsers: false,
      repeatUserCount: null,
      retentionSignals: false,
      userReturnEvidence: false,
      retentionConfidence: 'UNKNOWN',
      retentionScore: 0,
      missingEvidence,
      riskSignals,
    };
  }

  if (!input.trafficObserved) {
    riskSignals.push('Retention cannot be confirmed without observed traffic');
    missingEvidence.push('Traffic evidence required before retention can be trusted');
  }

  let retentionScore = 0;
  if (input.evidence.repeatUsersObserved) retentionScore += 40;
  if (input.evidence.retentionSignalsObserved) retentionScore += 30;
  if (input.evidence.userReturnEvidenceObserved) retentionScore += 20;
  if ((input.evidence.repeatUserCount ?? 0) >= 3) retentionScore += 10;

  const retentionObserved =
    input.evidence.repeatUsersObserved &&
    input.evidence.retentionSignalsObserved &&
    input.trafficObserved;

  let retentionConfidence: RetentionEvidenceAnalysis['retentionConfidence'] = 'UNKNOWN';
  if (retentionObserved && input.engagementObserved) retentionConfidence = 'HIGH';
  else if (input.evidence.repeatUsersObserved) retentionConfidence = 'MEDIUM';
  else if (input.evidence.retentionSignalsObserved) retentionConfidence = 'LOW';

  return {
    readOnly: true,
    repeatUsers: input.evidence.repeatUsersObserved,
    repeatUserCount: input.evidence.repeatUserCount,
    retentionSignals: input.evidence.retentionSignalsObserved,
    userReturnEvidence: input.evidence.userReturnEvidenceObserved,
    retentionConfidence,
    retentionScore: Math.min(100, retentionScore),
    missingEvidence,
    riskSignals,
  };
}
