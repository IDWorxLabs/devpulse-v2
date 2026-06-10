/**
 * Self Evolution Governance — bounded history.
 */

import type {
  GovernanceHistoryEntry,
  GovernanceReadinessEvaluation,
  SelfEvolutionGovernanceRecord,
} from './self-evolution-governance-types.js';
import { DEFAULT_MAX_GOVERNANCE_HISTORY_SIZE } from './self-evolution-governance-types.js';

const history: GovernanceHistoryEntry[] = [];
let historyCounter = 0;

export function recordGovernanceHistory(
  record: SelfEvolutionGovernanceRecord,
  readiness: GovernanceReadinessEvaluation,
): void {
  historyCounter += 1;
  const entry: GovernanceHistoryEntry = {
    historyId: `governance-history-${historyCounter}`,
    governanceId: record.governanceId,
    decision: record.decision,
    readiness: readiness.state,
    recordedAt: Date.now(),
  };
  history.push(entry);
  while (history.length > DEFAULT_MAX_GOVERNANCE_HISTORY_SIZE) {
    history.shift();
  }
}

export function getGovernanceHistory(): GovernanceHistoryEntry[] {
  return [...history];
}

export function getGovernanceHistorySize(): number {
  return history.length;
}

export function resetGovernanceHistoryForTests(): void {
  history.length = 0;
  historyCounter = 0;
}
