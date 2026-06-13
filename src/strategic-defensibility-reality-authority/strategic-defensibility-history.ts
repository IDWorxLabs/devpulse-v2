/**
 * Strategic Defensibility Reality Authority — bounded history.
 */

import { MAX_STRATEGIC_DEFENSIBILITY_REALITY_HISTORY } from './strategic-defensibility-registry.js';
import type {
  StrategicDefensibilityRealityAssessment,
  StrategicDefensibilityRealityHistoryEntry,
  StrategicDefensibilityRealityHistorySummary,
} from './strategic-defensibility-types.js';

const history: StrategicDefensibilityRealityHistoryEntry[] = [];

export function resetStrategicDefensibilityRealityHistoryForTests(): void {
  history.length = 0;
}

export function recordStrategicDefensibilityRealityAssessment(
  assessment: StrategicDefensibilityRealityAssessment,
): void {
  const report = assessment.report;
  history.unshift({
    timestamp: report.generatedAt,
    assessmentId: report.assessmentId,
    strategicDefensibilityState: report.strategicDefensibilityState,
    overallDefensibilityScore: report.overallDefensibilityScore,
    networkEffectsObserved: report.networkEffectsObserved,
  });
  if (history.length > MAX_STRATEGIC_DEFENSIBILITY_REALITY_HISTORY) {
    history.length = MAX_STRATEGIC_DEFENSIBILITY_REALITY_HISTORY;
  }
}

export function getStrategicDefensibilityRealityHistorySize(): number {
  return history.length;
}

export function buildStrategicDefensibilityRealityHistorySummary(
  entries: readonly StrategicDefensibilityRealityHistoryEntry[] = history,
): StrategicDefensibilityRealityHistorySummary {
  return {
    totalAssessments: entries.length,
    moderatelyDefensibleAssessments: entries.filter(
      (e) =>
        e.strategicDefensibilityState === 'MODERATELY_DEFENSIBLE' ||
        e.strategicDefensibilityState === 'STRONGLY_DEFENSIBLE' ||
        e.strategicDefensibilityState === 'CATEGORY_DEFENSIBLE',
    ).length,
    stronglyDefensibleAssessments: entries.filter(
      (e) =>
        e.strategicDefensibilityState === 'STRONGLY_DEFENSIBLE' ||
        e.strategicDefensibilityState === 'CATEGORY_DEFENSIBLE',
    ).length,
    categoryDefensibleAssessments: entries.filter((e) => e.strategicDefensibilityState === 'CATEGORY_DEFENSIBLE')
      .length,
  };
}
