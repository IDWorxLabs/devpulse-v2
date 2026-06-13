/**
 * Product Lifecycle Reality Orchestrator — bounded history.
 */

import { MAX_PRODUCT_LIFECYCLE_REALITY_HISTORY } from './product-lifecycle-reality-registry.js';
import type {
  ProductLifecycleRealityAssessment,
  ProductLifecycleRealityHistoryEntry,
  ProductLifecycleRealityHistorySummary,
} from './product-lifecycle-reality-types.js';

const history: ProductLifecycleRealityHistoryEntry[] = [];

export function resetProductLifecycleRealityHistoryForTests(): void {
  history.length = 0;
}

export function recordProductLifecycleRealityAssessment(
  assessment: ProductLifecycleRealityAssessment,
): void {
  const report = assessment.report;
  history.unshift({
    timestamp: report.generatedAt,
    assessmentId: report.assessmentId,
    productLifecycleRealityState: report.productLifecycleRealityState,
    overallLifecycleScore: report.overallLifecycleScore,
    nextRequiredAction: report.nextRequiredAction,
  });
  if (history.length > MAX_PRODUCT_LIFECYCLE_REALITY_HISTORY) {
    history.length = MAX_PRODUCT_LIFECYCLE_REALITY_HISTORY;
  }
}

export function getProductLifecycleRealityHistorySize(): number {
  return history.length;
}

export function buildProductLifecycleRealityHistorySummary(
  entries: readonly ProductLifecycleRealityHistoryEntry[] = history,
): ProductLifecycleRealityHistorySummary {
  const launchedStates = new Set([
    'LAUNCHED',
    'ADOPTED',
    'REVENUE_GENERATING',
    'EVOLVING_PRODUCT',
    'SCALING_PRODUCT',
  ]);
  return {
    totalAssessments: entries.length,
    launchedAssessments: entries.filter((e) => launchedStates.has(e.productLifecycleRealityState)).length,
    revenueGeneratingAssessments: entries.filter(
      (e) =>
        e.productLifecycleRealityState === 'REVENUE_GENERATING' ||
        e.productLifecycleRealityState === 'EVOLVING_PRODUCT' ||
        e.productLifecycleRealityState === 'SCALING_PRODUCT',
    ).length,
    evolvingProductAssessments: entries.filter(
      (e) => e.productLifecycleRealityState === 'EVOLVING_PRODUCT' || e.productLifecycleRealityState === 'SCALING_PRODUCT',
    ).length,
    scalingProductAssessments: entries.filter((e) => e.productLifecycleRealityState === 'SCALING_PRODUCT').length,
  };
}
