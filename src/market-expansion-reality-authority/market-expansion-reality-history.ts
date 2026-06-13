/**
 * Market Expansion Reality Authority — bounded history.
 */

import { MAX_MARKET_EXPANSION_REALITY_HISTORY } from './market-expansion-reality-registry.js';
import type {
  MarketExpansionRealityAssessment,
  MarketExpansionRealityHistoryEntry,
  MarketExpansionRealityHistorySummary,
} from './market-expansion-reality-types.js';

const history: MarketExpansionRealityHistoryEntry[] = [];

export function resetMarketExpansionRealityHistoryForTests(): void {
  history.length = 0;
}

export function recordMarketExpansionRealityAssessment(
  assessment: MarketExpansionRealityAssessment,
): void {
  const report = assessment.report;
  history.unshift({
    timestamp: report.generatedAt,
    assessmentId: report.assessmentId,
    marketExpansionState: report.marketExpansionState,
    overallExpansionScore: report.overallExpansionScore,
    segmentExpansionReady: report.segmentExpansionReady,
  });
  if (history.length > MAX_MARKET_EXPANSION_REALITY_HISTORY) {
    history.length = MAX_MARKET_EXPANSION_REALITY_HISTORY;
  }
}

export function getMarketExpansionRealityHistorySize(): number {
  return history.length;
}

export function buildMarketExpansionRealityHistorySummary(
  entries: readonly MarketExpansionRealityHistoryEntry[] = history,
): MarketExpansionRealityHistorySummary {
  return {
    totalAssessments: entries.length,
    segmentReadyAssessments: entries.filter(
      (e) =>
        e.marketExpansionState === 'SEGMENT_READY' ||
        e.marketExpansionState === 'MULTI_MARKET_READY' ||
        e.marketExpansionState === 'EXPANSION_RESILIENT',
    ).length,
    multiMarketReadyAssessments: entries.filter(
      (e) => e.marketExpansionState === 'MULTI_MARKET_READY' || e.marketExpansionState === 'EXPANSION_RESILIENT',
    ).length,
    expansionResilientAssessments: entries.filter((e) => e.marketExpansionState === 'EXPANSION_RESILIENT').length,
  };
}
