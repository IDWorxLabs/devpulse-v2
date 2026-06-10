/**
 * Auto-Polish Loop — polish priority analyzer.
 */

import type { PolishOpportunity, PolishPriorityAnalysis } from './auto-polish-types.js';
import { MAX_POLISH_OPPORTUNITIES, POLISH_PRIORITY_PASS } from './auto-polish-types.js';
import { getCachedPolishPriority, setCachedPolishPriority } from './auto-polish-cache.js';

let priorityAnalysisCount = 0;

function compositeScore(opp: PolishOpportunity): number {
  return (
    opp.founderImpact * 0.35
    + opp.userImpact * 0.25
    + opp.urgency * 0.25
    + (opp.impactLevel === 'CRITICAL' ? 30 : opp.impactLevel === 'HIGH' ? 20 : opp.impactLevel === 'MEDIUM' ? 10 : 0)
  );
}

export function analyzePolishPriority(
  requestId: string,
  opportunities: PolishOpportunity[],
): PolishPriorityAnalysis {
  const bounded = opportunities.slice(0, MAX_POLISH_OPPORTUNITIES);
  const cacheKey = [requestId, bounded.length, bounded.map((o) => o.opportunityId).join(',')].join('|');
  const cached = getCachedPolishPriority(cacheKey);
  if (cached) return cached;

  priorityAnalysisCount += 1;

  const sorted = [...bounded].sort((a, b) => compositeScore(b) - compositeScore(a));

  const priority1: PolishOpportunity[] = [];
  const priority2: PolishOpportunity[] = [];
  const priority3: PolishOpportunity[] = [];
  const priority4: PolishOpportunity[] = [];
  const launchBlockers: PolishOpportunity[] = [];

  for (const opp of sorted) {
    if (opp.impactLevel === 'CRITICAL') launchBlockers.push(opp);
    switch (opp.recommendedPriority) {
      case 1: priority1.push(opp); break;
      case 2: priority2.push(opp); break;
      case 3: priority3.push(opp); break;
      default: priority4.push(opp); break;
    }
  }

  const result: PolishPriorityAnalysis = {
    priority1,
    priority2,
    priority3,
    priority4,
    launchBlockers,
    passToken: POLISH_PRIORITY_PASS,
  };
  setCachedPolishPriority(cacheKey, result);
  return result;
}

export function getPriorityAnalysisCount(): number {
  return priorityAnalysisCount;
}

export function resetPolishPriorityAnalyzerForTests(): void {
  priorityAnalysisCount = 0;
}
