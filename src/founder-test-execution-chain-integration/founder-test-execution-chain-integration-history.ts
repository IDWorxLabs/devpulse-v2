/**
 * Founder Test Execution Chain Integration — bounded history (max 16).
 */

import { MAX_FOUNDER_TEST_EXECUTION_CHAIN_HISTORY } from './founder-test-execution-chain-integration-registry.js';
import type {
  ExecutionChainState,
  FounderExecutionChainAssessment,
  FounderTestExecutionChainHistoryEntry,
  FounderTestExecutionChainHistorySummary,
} from './founder-test-execution-chain-integration-types.js';

const history: FounderTestExecutionChainHistoryEntry[] = [];

export function resetFounderTestExecutionChainHistoryForTests(): void {
  history.length = 0;
}

export function recordFounderTestExecutionChainAssessment(
  assessment: FounderExecutionChainAssessment,
): void {
  const report = assessment.report;
  history.unshift({
    timestamp: report.generatedAt,
    integrationId: report.integrationId,
    executionChainScore: report.executionChainScore,
    executionChainState: report.executionChainState,
    executionChainConnected: report.executionChainConnected,
    blockerCount: report.executionChainBlockers.length,
    warningCount: report.executionChainWarnings.length,
  });
  if (history.length > MAX_FOUNDER_TEST_EXECUTION_CHAIN_HISTORY) {
    history.length = MAX_FOUNDER_TEST_EXECUTION_CHAIN_HISTORY;
  }
}

export function getFounderTestExecutionChainHistorySize(): number {
  return history.length;
}

export function getLatestFounderTestExecutionChainHistoryEntry(): FounderTestExecutionChainHistoryEntry | null {
  return history[0] ?? null;
}

export function getFounderTestExecutionChainHistory(): readonly FounderTestExecutionChainHistoryEntry[] {
  return [...history];
}

export function countExecutionChainState(
  state: ExecutionChainState,
  entries: readonly FounderTestExecutionChainHistoryEntry[] = history,
): number {
  return entries.filter((entry) => entry.executionChainState === state).length;
}

export function buildFounderTestExecutionChainHistorySummary(
  entries: readonly FounderTestExecutionChainHistoryEntry[] = history,
): FounderTestExecutionChainHistorySummary {
  return {
    totalAssessments: entries.length,
    connectedChains: countExecutionChainState('EXECUTION_CHAIN_CONNECTED', entries),
    partiallyConnectedChains: countExecutionChainState('EXECUTION_CHAIN_PARTIALLY_CONNECTED', entries),
    disconnectedChains: countExecutionChainState('EXECUTION_CHAIN_DISCONNECTED', entries),
    blockedChains: countExecutionChainState('EXECUTION_CHAIN_BLOCKED', entries),
    insufficientEvidenceChains: countExecutionChainState('INSUFFICIENT_EVIDENCE', entries),
  };
}
