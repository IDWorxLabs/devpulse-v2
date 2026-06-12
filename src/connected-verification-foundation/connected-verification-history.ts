/**
 * Connected Verification Foundation — bounded history (max 16).
 */

import { MAX_CONNECTED_VERIFICATION_HISTORY } from './connected-verification-registry.js';
import type {
  ConnectedVerificationAssessment,
  ConnectedVerificationHistoryEntry,
  ConnectedVerificationHistorySummary,
  VerificationState,
} from './connected-verification-types.js';

const history: ConnectedVerificationHistoryEntry[] = [];

export function resetConnectedVerificationHistoryForTests(): void {
  history.length = 0;
}

export function recordConnectedVerificationAssessment(
  assessment: ConnectedVerificationAssessment,
): void {
  const report = assessment.report;
  history.unshift({
    timestamp: report.generatedAt,
    verificationConnectionId: report.verificationConnectionId,
    verificationReadinessScore: report.verificationReadinessScore,
    verificationState: report.verificationState,
    blockerCount: report.blockingReasons.length,
    warningCount: report.warningReasons.length,
  });
  if (history.length > MAX_CONNECTED_VERIFICATION_HISTORY) {
    history.length = MAX_CONNECTED_VERIFICATION_HISTORY;
  }
}

export function getConnectedVerificationHistorySize(): number {
  return history.length;
}

export function getLatestConnectedVerificationHistoryEntry(): ConnectedVerificationHistoryEntry | null {
  return history[0] ?? null;
}

export function getConnectedVerificationHistory(): readonly ConnectedVerificationHistoryEntry[] {
  return [...history];
}

export function countVerificationState(
  state: VerificationState,
  entries: readonly ConnectedVerificationHistoryEntry[] = history,
): number {
  return entries.filter((entry) => entry.verificationState === state).length;
}

export function buildConnectedVerificationHistorySummary(
  entries: readonly ConnectedVerificationHistoryEntry[] = history,
): ConnectedVerificationHistorySummary {
  return {
    totalAssessments: entries.length,
    readyVerifications: countVerificationState('VERIFICATION_READY', entries),
    readyWithWarningsVerifications: countVerificationState('VERIFICATION_READY_WITH_WARNINGS', entries),
    notReadyVerifications: countVerificationState('VERIFICATION_NOT_READY', entries),
    blockedVerifications: countVerificationState('VERIFICATION_BLOCKED', entries),
    insufficientEvidenceVerifications: countVerificationState('INSUFFICIENT_EVIDENCE', entries),
  };
}
