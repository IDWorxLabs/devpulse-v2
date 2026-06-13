/**
 * Adoption Reality Authority — bounded history.
 */

import { MAX_ADOPTION_REALITY_HISTORY } from './adoption-reality-registry.js';
import type {
  AdoptionRealityAssessment,
  AdoptionRealityHistoryEntry,
  AdoptionRealityHistorySummary,
} from './adoption-reality-types.js';

const history: AdoptionRealityHistoryEntry[] = [];

export function resetAdoptionRealityHistoryForTests(): void {
  history.length = 0;
}

export function recordAdoptionRealityAssessment(assessment: AdoptionRealityAssessment): void {
  const report = assessment.report;
  history.unshift({
    timestamp: report.generatedAt,
    assessmentId: report.assessmentId,
    adoptionRealityState: report.adoptionRealityState,
    overallAdoptionScore: report.overallAdoptionScore,
    repeatUsageObserved: report.repeatUsageObserved,
  });
  if (history.length > MAX_ADOPTION_REALITY_HISTORY) {
    history.length = MAX_ADOPTION_REALITY_HISTORY;
  }
}

export function getAdoptionRealityHistorySize(): number {
  return history.length;
}

export function buildAdoptionRealityHistorySummary(
  entries: readonly AdoptionRealityHistoryEntry[] = history,
): AdoptionRealityHistorySummary {
  return {
    totalAssessments: entries.length,
    adoptionObservedAssessments: entries.filter(
      (e) => e.adoptionRealityState !== 'NO_ADOPTION',
    ).length,
    establishedAdoptionAssessments: entries.filter(
      (e) => e.adoptionRealityState === 'ESTABLISHED_ADOPTION' || e.adoptionRealityState === 'CRITICAL_DEPENDENCY',
    ).length,
    criticalDependencyAssessments: entries.filter((e) => e.adoptionRealityState === 'CRITICAL_DEPENDENCY').length,
  };
}
