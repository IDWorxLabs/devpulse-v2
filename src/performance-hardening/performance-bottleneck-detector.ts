/**
 * Performance Hardening — performance bottleneck detector.
 */

import type {
  CacheEfficiencyAnalysis,
  PerformanceBottleneckDetection,
  PerformanceBottleneckType,
  PerformanceHardeningInput,
  StartupPerformanceAnalysis,
  UiResponsivenessAnalysis,
  ValidationPerformanceAnalysis,
} from './performance-hardening-types.js';
import { getCachedBottleneckDetection, setCachedBottleneckDetection } from './performance-hardening-cache.js';

let bottleneckDetectionCount = 0;

export function detectPerformanceBottlenecks(
  input: PerformanceHardeningInput,
  startup: StartupPerformanceAnalysis,
  validation: ValidationPerformanceAnalysis,
  cache: CacheEfficiencyAnalysis,
  responsiveness: UiResponsivenessAnalysis,
): PerformanceBottleneckDetection {
  const cacheKey = [
    startup.startupScore,
    validation.validationScore,
    cache.cacheEfficiencyScore,
    responsiveness.responsivenessScore,
    input.reliabilityScore ?? 0,
  ].join('|');

  const cached = getCachedBottleneckDetection(cacheKey);
  if (cached) return cached;

  bottleneckDetectionCount += 1;
  const bottlenecks: PerformanceBottleneckType[] = [];

  if (startup.startupScore < 60) bottlenecks.push('startup_bottleneck');
  if (validation.validationScore < 60) bottlenecks.push('validation_bottleneck');
  if (cache.cacheEfficiencyScore < 60) bottlenecks.push('cache_memory_bottleneck');
  if (responsiveness.responsivenessScore < 60) bottlenecks.push('ui_render_bottleneck');
  if (responsiveness.mobileWarnings.length > 0) bottlenecks.push('mobile_responsiveness_bottleneck');
  if (input.duplicateRegistryAggregation === true || input.registryGrowthRisk === true) {
    bottlenecks.push('registry_aggregation_bottleneck');
  }
  if (input.reportPreviewRebuildRisk === true || input.largeReportCopyPressure === true) {
    bottlenecks.push('report_generation_bottleneck');
  }
  if (input.repeatedLookupRisk === true || input.repeatedBootstrapInValidators === true) {
    bottlenecks.push('bridge_lookup_bottleneck');
  }

  const unique = [...new Set(bottlenecks)];
  const bottleneckScore = Math.max(0, Math.min(100, Math.round(100 - unique.length * 10)));

  const priorityOrder = [...unique].sort((a, b) => {
    const weights: Record<PerformanceBottleneckType, number> = {
      startup_bottleneck: startup.startupScore,
      validation_bottleneck: validation.validationScore,
      cache_memory_bottleneck: cache.cacheEfficiencyScore,
      ui_render_bottleneck: responsiveness.responsivenessScore,
      mobile_responsiveness_bottleneck: responsiveness.responsivenessScore - 5,
      registry_aggregation_bottleneck: 50,
      report_generation_bottleneck: 45,
      bridge_lookup_bottleneck: 40,
    };
    return weights[a] - weights[b];
  });

  const result: PerformanceBottleneckDetection = {
    bottlenecks: unique,
    bottleneckScore,
    priorityOrder,
  };

  setCachedBottleneckDetection(cacheKey, result);
  return result;
}

export function getBottleneckDetectionCount(): number {
  return bottleneckDetectionCount;
}

export function resetPerformanceBottleneckDetectorForTests(): void {
  bottleneckDetectionCount = 0;
}
