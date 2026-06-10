/**
 * Performance Hardening — reporting.
 */

import type {
  PerformanceBottleneckType,
  PerformanceHardeningEvaluation,
  PerformanceHardeningRecord,
  PerformanceHardeningReport,
} from './performance-hardening-types.js';
import { getPerformanceHardeningCacheStats } from './performance-hardening-cache.js';
import { getPerformanceHardeningHistorySize } from './performance-hardening-history.js';

let reportCount = 0;

export function generatePerformanceHardeningReport(
  record: PerformanceHardeningRecord,
  evaluation: PerformanceHardeningEvaluation,
  cacheEfficiencyScore: number,
  bottlenecks: PerformanceBottleneckType[],
  slowGroups: string[],
  missingSignals: string[],
): PerformanceHardeningReport {
  reportCount += 1;
  const cache = getPerformanceHardeningCacheStats();
  const recommendations: string[] = [];

  if (bottlenecks.includes('startup_bottleneck')) recommendations.push('Reduce startup bootstrap weight and duplicate initialization');
  if (bottlenecks.includes('validation_bottleneck')) recommendations.push('Optimize slow validation groups and enforce timeout guards');
  if (bottlenecks.includes('cache_memory_bottleneck')) recommendations.push('Review cache eviction and history bounds');
  if (bottlenecks.includes('ui_render_bottleneck') || bottlenecks.includes('mobile_responsiveness_bottleneck')) {
    recommendations.push('Reduce UI render pressure and mobile overflow risk');
  }
  if (bottlenecks.includes('registry_aggregation_bottleneck')) recommendations.push('Avoid duplicate registry aggregation in validators');
  if (bottlenecks.includes('report_generation_bottleneck')) recommendations.push('Optimize report generation and copy paths');
  if (bottlenecks.includes('bridge_lookup_bottleneck')) recommendations.push('Cache safe bridge lookups and avoid repeated bootstrap');
  if (slowGroups.length > 0) recommendations.push(`Review slow validation groups: ${slowGroups.join(', ')}`);
  if (missingSignals.length > 0) recommendations.push('Collect missing performance signals before scaling');
  if (evaluation.state === 'FAST' || evaluation.state === 'ACCEPTABLE') {
    recommendations.push('Continue monitoring performance trends');
  } else {
    recommendations.push('Require performance review before expansion');
  }

  return {
    performanceScore: record.performanceScore,
    startupScore: record.startupScore,
    validationScore: record.validationScore,
    cacheEfficiencyScore,
    responsivenessScore: record.responsivenessScore,
    bottlenecks: [...bottlenecks],
    slowGroups: [...slowGroups],
    riskLevel: record.riskLevel,
    state: record.state,
    confidence: record.confidence,
    missingSignals: [...missingSignals],
    recommendations: [...new Set(recommendations)],
    evaluation,
    historySize: getPerformanceHardeningHistorySize(),
    cacheHits: cache.hits,
    cacheMisses: cache.misses,
  };
}

export function getReportCount(): number {
  return reportCount;
}

export function resetPerformanceHardeningReportingForTests(): void {
  reportCount = 0;
}
