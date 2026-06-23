/**
 * Runtime Materialization Truth Bridge — bounded assessment history (Phase 26.76).
 */

import { MAX_RUNTIME_MATERIALIZATION_TRUTH_BRIDGE_HISTORY } from './runtime-materialization-truth-bridge-registry.js';
import type {
  RuntimeMaterializationTruthBridgeAssessment,
  RuntimeMaterializationTruthBridgeHistoryEntry,
} from './runtime-materialization-truth-bridge-types.js';

const history: RuntimeMaterializationTruthBridgeHistoryEntry[] = [];

export function resetRuntimeMaterializationTruthBridgeHistoryForTests(): void {
  history.length = 0;
}

export function recordRuntimeMaterializationTruthBridgeAssessment(
  assessment: RuntimeMaterializationTruthBridgeAssessment,
): void {
  history.unshift({
    readOnly: true,
    bridgeId: assessment.report.bridgeId,
    generatedAt: assessment.report.generatedAt,
    finalApplicationTruth: assessment.report.finalApplicationTruth,
    rootCause: assessment.report.reconciliation.rootCause,
    failureBoundary: assessment.report.reconciliation.failureBoundary,
    contradictionCount: assessment.report.reconciliation.contradictionCount,
    cacheKey: assessment.cacheKey,
  });
  if (history.length > MAX_RUNTIME_MATERIALIZATION_TRUTH_BRIDGE_HISTORY) {
    history.length = MAX_RUNTIME_MATERIALIZATION_TRUTH_BRIDGE_HISTORY;
  }
}

export function getRuntimeMaterializationTruthBridgeHistorySize(): number {
  return history.length;
}

export function getLatestRuntimeMaterializationTruthBridgeHistoryEntry(): RuntimeMaterializationTruthBridgeHistoryEntry | null {
  return history[0] ?? null;
}

export function getRuntimeMaterializationTruthBridgeHistory(): readonly RuntimeMaterializationTruthBridgeHistoryEntry[] {
  return history;
}
