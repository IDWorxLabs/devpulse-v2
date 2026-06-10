/**
 * Scale Hardening — reporting.
 */

import type {
  ScaleHardeningEvaluation,
  ScaleHardeningRecord,
  ScaleHardeningReport,
} from './scale-hardening-types.js';
import { getScaleHardeningCacheStats } from './scale-hardening-cache.js';
import { getScaleHardeningHistorySize } from './scale-hardening-history.js';

let reportCount = 0;

export function generateScaleHardeningReport(
  record: ScaleHardeningRecord,
  evaluation: ScaleHardeningEvaluation,
  capacityGaps: string[],
  concurrencyGaps: string[],
  cloudUsageGaps: string[],
  queueGaps: string[],
  multiProjectGaps: string[],
  missingSignals: string[],
): ScaleHardeningReport {
  reportCount += 1;
  const cache = getScaleHardeningCacheStats();
  const recommendations: string[] = [];

  if (capacityGaps.length > 0) recommendations.push('Plan capacity limits for large contexts, reports, and registry growth');
  if (concurrencyGaps.length > 0) recommendations.push('Define concurrency boundaries for projects, validation, and cloud tasks');
  if (cloudUsageGaps.length > 0) recommendations.push('Prepare cloud usage metering and quota boundaries before commercial rollout');
  if (queueGaps.length > 0) recommendations.push('Add queue backpressure and rate limit signals before scaling load');
  if (multiProjectGaps.length > 0) recommendations.push('Strengthen multi-project isolation, switching, and cross-project monitoring');
  if (missingSignals.length > 0) recommendations.push('Collect missing scale signals before expansion');
  if (evaluation.state === 'READY' || evaluation.state === 'ACCEPTABLE') {
    recommendations.push('Continue monitoring scale readiness');
  } else {
    recommendations.push('Require scale review before expansion');
  }

  return {
    scaleScore: record.scaleScore,
    capacityScore: record.capacityScore,
    concurrencyScore: record.concurrencyScore,
    cloudUsageReadinessScore: record.cloudUsageReadinessScore,
    queueLoadScore: evaluation.queueLoadScore,
    multiProjectScaleScore: evaluation.multiProjectScaleScore,
    riskLevel: record.riskLevel,
    state: record.state,
    confidence: record.confidence,
    capacityGaps: [...capacityGaps],
    concurrencyGaps: [...concurrencyGaps],
    cloudUsageGaps: [...cloudUsageGaps],
    queueGaps: [...queueGaps],
    multiProjectGaps: [...multiProjectGaps],
    missingSignals: [...missingSignals],
    recommendations: [...new Set(recommendations)],
    evaluation,
    historySize: getScaleHardeningHistorySize(),
    cacheHits: cache.hits,
    cacheMisses: cache.misses,
  };
}

export function getReportCount(): number {
  return reportCount;
}

export function resetScaleHardeningReportingForTests(): void {
  reportCount = 0;
}
