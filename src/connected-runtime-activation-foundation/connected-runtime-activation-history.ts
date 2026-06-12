/**
 * Connected Runtime Activation Foundation — bounded history (max 16).
 */

import { MAX_CONNECTED_RUNTIME_ACTIVATION_HISTORY } from './connected-runtime-activation-registry.js';
import type {
  ConnectedRuntimeActivationAssessment,
  ConnectedRuntimeActivationHistoryEntry,
  ConnectedRuntimeActivationHistorySummary,
  RuntimeState,
} from './connected-runtime-activation-types.js';

const history: ConnectedRuntimeActivationHistoryEntry[] = [];

export function resetConnectedRuntimeActivationHistoryForTests(): void {
  history.length = 0;
}

export function recordConnectedRuntimeActivationAssessment(
  assessment: ConnectedRuntimeActivationAssessment,
): void {
  const report = assessment.report;
  history.unshift({
    timestamp: report.generatedAt,
    activationId: report.activationId,
    runtimeReadinessScore: report.runtimeReadinessScore,
    runtimeState: report.runtimeState,
    blockerCount: report.blockingReasons.length,
    warningCount: report.warningReasons.length,
  });
  if (history.length > MAX_CONNECTED_RUNTIME_ACTIVATION_HISTORY) {
    history.length = MAX_CONNECTED_RUNTIME_ACTIVATION_HISTORY;
  }
}

export function getConnectedRuntimeActivationHistorySize(): number {
  return history.length;
}

export function getLatestConnectedRuntimeActivationHistoryEntry(): ConnectedRuntimeActivationHistoryEntry | null {
  return history[0] ?? null;
}

export function getConnectedRuntimeActivationHistory(): readonly ConnectedRuntimeActivationHistoryEntry[] {
  return [...history];
}

export function countRuntimeState(
  state: RuntimeState,
  entries: readonly ConnectedRuntimeActivationHistoryEntry[] = history,
): number {
  return entries.filter((entry) => entry.runtimeState === state).length;
}

export function buildConnectedRuntimeActivationHistorySummary(
  entries: readonly ConnectedRuntimeActivationHistoryEntry[] = history,
): ConnectedRuntimeActivationHistorySummary {
  return {
    totalAssessments: entries.length,
    readyRuntimes: countRuntimeState('RUNTIME_READY', entries),
    readyWithWarningsRuntimes: countRuntimeState('RUNTIME_READY_WITH_WARNINGS', entries),
    notReadyRuntimes: countRuntimeState('RUNTIME_NOT_READY', entries),
    blockedRuntimes: countRuntimeState('RUNTIME_BLOCKED', entries),
    insufficientEvidenceRuntimes: countRuntimeState('INSUFFICIENT_EVIDENCE', entries),
  };
}
