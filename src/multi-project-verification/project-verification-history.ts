/**
 * Multi Project Verification — bounded history.
 */

import type {
  PortfolioVerificationSummary,
  ProjectVerificationHistoryEntry,
  ProjectVerificationRecord,
  ProjectVerificationStatus,
} from './multi-project-verification-types.js';
import { DEFAULT_MAX_VERIFICATION_HISTORY_SIZE } from './multi-project-verification-types.js';

const history: ProjectVerificationHistoryEntry[] = [];
let historyCounter = 0;

export function recordProjectVerificationHistory(
  record: ProjectVerificationRecord,
  portfolio: PortfolioVerificationSummary,
  previousStatus?: ProjectVerificationStatus,
): ProjectVerificationHistoryEntry {
  historyCounter += 1;

  const entry: ProjectVerificationHistoryEntry = {
    historyId: `project-verification-history-${historyCounter}`,
    projectId: record.projectId,
    previousStatus,
    newStatus: record.status,
    portfolioConfidence: portfolio.portfolioConfidence,
    recordedAt: Date.now(),
  };

  history.unshift(entry);
  if (history.length > DEFAULT_MAX_VERIFICATION_HISTORY_SIZE) {
    history.length = DEFAULT_MAX_VERIFICATION_HISTORY_SIZE;
  }

  return entry;
}

export function getProjectVerificationHistory(limit = 20): ProjectVerificationHistoryEntry[] {
  return history.slice(0, limit);
}

export function getProjectVerificationHistorySize(): number {
  return history.length;
}

export function resetProjectVerificationHistoryForTests(): void {
  history.length = 0;
  historyCounter = 0;
}
