/**
 * Performance Hardening — cache efficiency analyzer.
 */

import type { CacheEfficiencyAnalysis, PerformanceHardeningInput } from './performance-hardening-types.js';
import { getCachedCacheEfficiencyAnalysis, setCachedCacheEfficiencyAnalysis } from './performance-hardening-cache.js';

let cacheAnalysisCount = 0;

export function analyzeCacheEfficiency(input: PerformanceHardeningInput): CacheEfficiencyAnalysis {
  const cacheKey = [
    input.cacheMaxSizeRisk,
    input.missingEvictionTracking,
    input.historyMaxSizeRisk,
    input.registryGrowthRisk,
  ].join('|');

  const cached = getCachedCacheEfficiencyAnalysis(cacheKey);
  if (cached) return cached;

  cacheAnalysisCount += 1;
  const cacheWarnings: string[] = [];
  const memoryGrowthWarnings: string[] = [];
  let penalty = 0;

  if (input.cacheMaxSizeRisk === true) {
    cacheWarnings.push('cache_max_size_risk');
    penalty += 12;
  }
  if (input.missingEvictionTracking === true) {
    cacheWarnings.push('missing_eviction_tracking');
    penalty += 10;
  }
  if (input.missingHitMissTracking === true) {
    cacheWarnings.push('missing_hit_miss_tracking');
    penalty += 8;
  }
  if (input.historyMaxSizeRisk === true) {
    memoryGrowthWarnings.push('history_max_size_risk');
    penalty += 12;
  }
  if (input.registryGrowthRisk === true) {
    memoryGrowthWarnings.push('registry_growth_risk');
    penalty += 10;
  }
  if (input.repeatedLookupRisk === true) {
    cacheWarnings.push('repeated_lookup_risk');
    penalty += 8;
  }
  if (input.unboundedCollectionRisk === true) {
    memoryGrowthWarnings.push('unbounded_collection_risk');
    penalty += 15;
  }
  if (input.duplicateRegistryAggregation === true) {
    memoryGrowthWarnings.push('duplicate_aggregation_risk');
    penalty += 8;
  }

  const cacheEfficiencyScore = Math.max(0, Math.min(100, Math.round(92 - penalty)));

  const result: CacheEfficiencyAnalysis = {
    cacheEfficiencyScore,
    cacheWarnings,
    memoryGrowthWarnings,
  };

  setCachedCacheEfficiencyAnalysis(cacheKey, result);
  return result;
}

export function getCacheAnalysisCount(): number {
  return cacheAnalysisCount;
}

export function resetCacheEfficiencyAnalyzerForTests(): void {
  cacheAnalysisCount = 0;
}
