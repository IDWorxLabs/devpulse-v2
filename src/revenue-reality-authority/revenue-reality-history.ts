/**
 * Revenue Reality Authority — bounded history.
 */

import { MAX_REVENUE_REALITY_HISTORY } from './revenue-reality-registry.js';
import type {
  RevenueRealityAssessment,
  RevenueRealityHistoryEntry,
  RevenueRealityHistorySummary,
} from './revenue-reality-types.js';

const history: RevenueRealityHistoryEntry[] = [];

export function resetRevenueRealityHistoryForTests(): void {
  history.length = 0;
}

export function recordRevenueRealityAssessment(assessment: RevenueRealityAssessment): void {
  const report = assessment.report;
  history.unshift({
    timestamp: report.generatedAt,
    assessmentId: report.assessmentId,
    revenueRealityState: report.revenueRealityState,
    overallRevenueScore: report.overallRevenueScore,
    revenueObserved: report.revenueObserved,
  });
  if (history.length > MAX_REVENUE_REALITY_HISTORY) {
    history.length = MAX_REVENUE_REALITY_HISTORY;
  }
}

export function getRevenueRealityHistorySize(): number {
  return history.length;
}

export function buildRevenueRealityHistorySummary(
  entries: readonly RevenueRealityHistoryEntry[] = history,
): RevenueRealityHistorySummary {
  return {
    totalAssessments: entries.length,
    revenueObservedAssessments: entries.filter((e) => e.revenueObserved).length,
    sustainableRevenueAssessments: entries.filter(
      (e) => e.revenueRealityState === 'SUSTAINABLE_REVENUE' || e.revenueRealityState === 'BUSINESS_ENGINE',
    ).length,
    businessEngineAssessments: entries.filter((e) => e.revenueRealityState === 'BUSINESS_ENGINE').length,
  };
}
