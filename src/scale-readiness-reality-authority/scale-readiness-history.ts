/**
 * Scale Readiness Reality Authority — bounded history.
 */

import { MAX_SCALE_READINESS_REALITY_HISTORY } from './scale-readiness-registry.js';
import type {
  ScaleReadinessRealityAssessment,
  ScaleReadinessRealityHistoryEntry,
  ScaleReadinessRealityHistorySummary,
} from './scale-readiness-types.js';

const history: ScaleReadinessRealityHistoryEntry[] = [];

export function resetScaleReadinessRealityHistoryForTests(): void {
  history.length = 0;
}

export function recordScaleReadinessRealityAssessment(
  assessment: ScaleReadinessRealityAssessment,
): void {
  const report = assessment.report;
  history.unshift({
    timestamp: report.generatedAt,
    assessmentId: report.assessmentId,
    scaleReadinessState: report.scaleReadinessState,
    overallScaleReadinessScore: report.overallScaleReadinessScore,
    architectureReady: report.architectureReady,
  });
  if (history.length > MAX_SCALE_READINESS_REALITY_HISTORY) {
    history.length = MAX_SCALE_READINESS_REALITY_HISTORY;
  }
}

export function getScaleReadinessRealityHistorySize(): number {
  return history.length;
}

export function buildScaleReadinessRealityHistorySummary(
  entries: readonly ScaleReadinessRealityHistoryEntry[] = history,
): ScaleReadinessRealityHistorySummary {
  return {
    totalAssessments: entries.length,
    partiallyReadyAssessments: entries.filter(
      (e) =>
        e.scaleReadinessState === 'PARTIALLY_READY' ||
        e.scaleReadinessState === 'SCALE_READY' ||
        e.scaleReadinessState === 'SCALE_RESILIENT',
    ).length,
    scaleReadyAssessments: entries.filter(
      (e) => e.scaleReadinessState === 'SCALE_READY' || e.scaleReadinessState === 'SCALE_RESILIENT',
    ).length,
    scaleResilientAssessments: entries.filter((e) => e.scaleReadinessState === 'SCALE_RESILIENT').length,
  };
}
