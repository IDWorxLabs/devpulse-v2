/**
 * Product Reality Orchestrator — report builder.
 */

import type {
  ProductRealityAuthority,
  ProductRealityEvaluation,
  ProductRealityRecord,
  ProductRealityReport,
} from './product-reality-types.js';
import { PRODUCT_REALITY_REPORTING_PASS } from './product-reality-types.js';
import { getProductRealityCacheStats } from './product-reality-cache.js';
import { getProductRealityHistorySize } from './bounded-history.js';

let reportCount = 0;

export function generateProductRealityReport(
  record: ProductRealityRecord,
  evaluation: ProductRealityEvaluation,
  authority: ProductRealityAuthority,
): ProductRealityReport {
  reportCount += 1;
  const cache = getProductRealityCacheStats();

  const recommendedPriorityFixes: string[] = [];
  for (const item of authority.roadmap.critical.slice(0, 3)) {
    recommendedPriorityFixes.push(`${item.title}: ${item.description}`);
  }
  for (const item of authority.roadmap.highPriority.slice(0, 2)) {
    recommendedPriorityFixes.push(`${item.title}: ${item.description}`);
  }
  for (const item of authority.roadmap.launchTasks.slice(0, 2)) {
    recommendedPriorityFixes.push(`${item.title}: ${item.description}`);
  }
  if (recommendedPriorityFixes.length === 0) {
    recommendedPriorityFixes.push('Continue monitoring product reality across verification stack changes');
  }

  return {
    productRealityScore: record.overallScore,
    productRealityVerdict: record.productRealityVerdict,
    releaseReadiness: record.releaseReadiness,
    aggregate: evaluation.aggregate,
    authorityConflicts: authority.conflicts,
    launchBlockers: authority.blockers,
    founderPriorities: authority.founderPriorities,
    productRealityRoadmap: authority.roadmap,
    recommendedPriorityFixes: [...new Set(recommendedPriorityFixes)],
    evaluation,
    historySize: getProductRealityHistorySize(),
    cacheHits: cache.hits,
    cacheMisses: cache.misses,
    passToken: PRODUCT_REALITY_REPORTING_PASS,
  };
}

export function getReportCount(): number {
  return reportCount;
}

export function resetProductRealityReportBuilderForTests(): void {
  reportCount = 0;
}
