/**
 * Runtime History — bounded founder test runtime history (max 16).
 */

import { MAX_FOUNDER_TEST_RUNTIME_HISTORY } from './founder-test-runtime-registry.js';
import type {
  FounderTestRuntimeHistoryEntry,
  FounderTestRuntimeSnapshot,
} from './founder-test-runtime-types.js';

const history: FounderTestRuntimeHistoryEntry[] = [];

export function resetFounderTestRuntimeHistoryForTests(): void {
  history.length = 0;
}

export function recordFounderTestRuntimeSnapshot(snapshot: FounderTestRuntimeSnapshot): void {
  if (!snapshot.runId || !snapshot.startedAt) return;
  if (snapshot.state !== 'COMPLETE' && snapshot.state !== 'FAILED' && snapshot.state !== 'CANCELLED') {
    return;
  }

  const entry: FounderTestRuntimeHistoryEntry = {
    runId: snapshot.runId,
    startedAt: snapshot.startedAt,
    endedAt: snapshot.endedAt,
    finalState: snapshot.state,
    totalDurationMs: snapshot.endedAt && snapshot.startedAt
      ? Math.max(0, new Date(snapshot.endedAt).getTime() - new Date(snapshot.startedAt).getTime())
      : snapshot.elapsedMs,
    completedStageCount: snapshot.progress.completedStages,
    stallDetected: snapshot.stallAnalysis.health === 'STALLED',
  };

  history.unshift(entry);
  if (history.length > MAX_FOUNDER_TEST_RUNTIME_HISTORY) {
    history.length = MAX_FOUNDER_TEST_RUNTIME_HISTORY;
  }
}

export function getFounderTestRuntimeHistorySize(): number {
  return history.length;
}

export function getFounderTestRuntimeHistory(): readonly FounderTestRuntimeHistoryEntry[] {
  return [...history];
}
