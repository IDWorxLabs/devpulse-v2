/**
 * Build Materialization Reality — bounded assessment history (Phase 26.74).
 */

import { MAX_BUILD_MATERIALIZATION_REALITY_HISTORY } from './build-materialization-reality-registry.js';
import type {
  BuildMaterializationRealityAssessment,
  BuildMaterializationRealityHistoryEntry,
} from './build-materialization-reality-types.js';

const history: BuildMaterializationRealityHistoryEntry[] = [];

export function resetBuildMaterializationRealityHistoryForTests(): void {
  history.length = 0;
}

export function recordBuildMaterializationRealityAssessment(
  assessment: BuildMaterializationRealityAssessment,
): void {
  history.unshift({
    readOnly: true,
    assessmentId: assessment.report.assessmentId,
    generatedAt: assessment.report.generatedAt,
    primaryVerdict: assessment.report.primaryVerdict,
    gapKind: assessment.report.gapKind,
    firstBrokenLink: assessment.report.verdictAnalysis.firstBrokenLink,
    cacheKey: assessment.cacheKey,
  });
  if (history.length > MAX_BUILD_MATERIALIZATION_REALITY_HISTORY) {
    history.length = MAX_BUILD_MATERIALIZATION_REALITY_HISTORY;
  }
}

export function getBuildMaterializationRealityHistorySize(): number {
  return history.length;
}

export function getLatestBuildMaterializationRealityHistoryEntry(): BuildMaterializationRealityHistoryEntry | null {
  return history[0] ?? null;
}

export function getBuildMaterializationRealityHistory(): readonly BuildMaterializationRealityHistoryEntry[] {
  return history;
}
