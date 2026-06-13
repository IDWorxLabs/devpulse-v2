/**
 * Repeat usage analyzer — repeat users and sessions from observed reports only.
 */

import { blockedByTrafficOnly, hasValidObservedEvidence } from './evidence-validation.js';
import type { RepeatUsageAnalysis, RepeatUsageEvidence } from './adoption-reality-types.js';

export function analyzeRepeatUsage(input: {
  evidence: RepeatUsageEvidence | null;
  postLaunchActivityObserved: boolean;
  trafficOnly?: boolean;
  signupsOnly?: boolean;
  oneTimeUsage?: boolean;
  rejectFabricated?: boolean;
}): RepeatUsageAnalysis {
  const missingEvidence: string[] = [];
  const riskSignals: string[] = [];

  if (blockedByTrafficOnly(input)) {
    const reason = input.trafficOnly
      ? 'Traffic alone is not adoption evidence'
      : input.signupsOnly
        ? 'Signups alone are not adoption evidence'
        : 'One-time usage is not adoption evidence';
    missingEvidence.push(reason);
    riskSignals.push(`${reason} — repeat usage required`);
    return {
      readOnly: true,
      repeatUsers: false,
      repeatUserCount: null,
      repeatSessions: false,
      repeatSessionCount: null,
      returnFrequency: false,
      longTermUsage: false,
      usageConsistency: false,
      repeatUsageScore: 0,
      confidence: 'UNKNOWN',
      missingEvidence,
      riskSignals,
    };
  }

  if (!input.postLaunchActivityObserved) {
    missingEvidence.push('Post-launch activity not observed — repeat usage cannot be assessed');
    return {
      readOnly: true,
      repeatUsers: false,
      repeatUserCount: null,
      repeatSessions: false,
      repeatSessionCount: null,
      returnFrequency: false,
      longTermUsage: false,
      usageConsistency: false,
      repeatUsageScore: 0,
      confidence: 'UNKNOWN',
      missingEvidence,
      riskSignals,
    };
  }

  if (!input.evidence) {
    missingEvidence.push('No repeat session or retention report observed');
    return {
      readOnly: true,
      repeatUsers: false,
      repeatUserCount: null,
      repeatSessions: false,
      repeatSessionCount: null,
      returnFrequency: false,
      longTermUsage: false,
      usageConsistency: false,
      repeatUsageScore: 0,
      confidence: 'UNKNOWN',
      missingEvidence,
      riskSignals,
    };
  }

  if (!hasValidObservedEvidence(input.evidence, Boolean(input.rejectFabricated))) {
    missingEvidence.push('Repeat usage metrics rejected — unverifiable evidence');
    riskSignals.push('Fabricated repeat usage metrics rejected');
    return {
      readOnly: true,
      repeatUsers: false,
      repeatUserCount: null,
      repeatSessions: false,
      repeatSessionCount: null,
      returnFrequency: false,
      longTermUsage: false,
      usageConsistency: false,
      repeatUsageScore: 0,
      confidence: 'UNKNOWN',
      missingEvidence,
      riskSignals,
    };
  }

  let repeatUsageScore = 0;
  if (input.evidence.repeatUsersObserved) repeatUsageScore += 25;
  if (input.evidence.repeatSessionsObserved) repeatUsageScore += 20;
  if (input.evidence.returnFrequencyObserved) repeatUsageScore += 20;
  if (input.evidence.longTermUsageObserved) repeatUsageScore += 20;
  if (input.evidence.usageConsistencyObserved) repeatUsageScore += 15;
  if ((input.evidence.repeatUserCount ?? 0) >= 5) repeatUsageScore = Math.min(100, repeatUsageScore + 10);

  const repeatUsers =
    input.evidence.repeatUsersObserved && (input.evidence.repeatUserCount ?? 0) > 0;
  const repeatSessions =
    input.evidence.repeatSessionsObserved && (input.evidence.repeatSessionCount ?? 0) > 0;

  let confidence: RepeatUsageAnalysis['confidence'] = 'LOW';
  if (repeatUsers && repeatSessions) confidence = 'MEDIUM';
  if (repeatUsers && input.evidence.longTermUsageObserved && input.evidence.usageConsistencyObserved) {
    confidence = 'HIGH';
  }

  return {
    readOnly: true,
    repeatUsers,
    repeatUserCount: input.evidence.repeatUserCount,
    repeatSessions,
    repeatSessionCount: input.evidence.repeatSessionCount,
    returnFrequency: input.evidence.returnFrequencyObserved,
    longTermUsage: input.evidence.longTermUsageObserved,
    usageConsistency: input.evidence.usageConsistencyObserved,
    repeatUsageScore: Math.min(100, repeatUsageScore),
    confidence,
    missingEvidence,
    riskSignals,
  };
}
