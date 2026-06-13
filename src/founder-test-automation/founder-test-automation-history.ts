/**
 * Founder Test Automation History — bounded analysis history (max 32).
 */

import { MAX_FOUNDER_TEST_AUTOMATION_HISTORY } from './founder-test-automation-registry.js';
import type {
  FounderTestAutomationAnalysis,
  FounderTestAutomationHistoryEntry,
} from './founder-test-automation-types.js';

const history: FounderTestAutomationHistoryEntry[] = [];
const analyses: FounderTestAutomationAnalysis[] = [];

export function resetFounderTestAutomationHistoryForTests(): void {
  history.length = 0;
  analyses.length = 0;
}

export function recordFounderTestAutomationAnalysis(analysis: FounderTestAutomationAnalysis): void {
  const entry: FounderTestAutomationHistoryEntry = {
    analysisId: analysis.analysisId,
    timestamp: analysis.analyzedAt,
    sweepId: analysis.sweepId,
    readinessScore: analysis.executionReadiness.readinessScore,
    executionReadinessState: analysis.executionReadiness.executionReadinessState,
    blockerCount: analysis.prioritizedBlockers.length,
    recommendationCount: analysis.recommendations.length,
  };

  history.unshift(entry);
  analyses.unshift(analysis);

  if (history.length > MAX_FOUNDER_TEST_AUTOMATION_HISTORY) {
    history.length = MAX_FOUNDER_TEST_AUTOMATION_HISTORY;
  }
  if (analyses.length > MAX_FOUNDER_TEST_AUTOMATION_HISTORY) {
    analyses.length = MAX_FOUNDER_TEST_AUTOMATION_HISTORY;
  }
}

export function getFounderTestAutomationHistorySize(): number {
  return history.length;
}

export function getFounderTestAutomationHistory(): readonly FounderTestAutomationHistoryEntry[] {
  return [...history];
}

export function getFounderTestAutomationAnalyses(): readonly FounderTestAutomationAnalysis[] {
  return [...analyses];
}

export function getLatestFounderTestAutomationAnalysis(): FounderTestAutomationAnalysis | null {
  return analyses[0] ?? null;
}
