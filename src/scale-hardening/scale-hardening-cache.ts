/**
 * Scale Hardening — bounded lookup cache.
 */

import type {
  CapacityReadinessAnalysis,
  CloudUsageReadinessAnalysis,
  ConcurrencyRiskAnalysis,
  MultiProjectScaleAnalysis,
  QueueLoadAnalysis,
  ScaleHardeningEvaluation,
  UnifiedScaleHardeningAuthority,
} from './scale-hardening-types.js';

const MAX_CACHE_ENTRIES = 256;

let cacheHits = 0;
let cacheMisses = 0;
let cacheEvictions = 0;

const capacityCache = new Map<string, CapacityReadinessAnalysis>();
const concurrencyCache = new Map<string, ConcurrencyRiskAnalysis>();
const cloudUsageCache = new Map<string, CloudUsageReadinessAnalysis>();
const queueLoadCache = new Map<string, QueueLoadAnalysis>();
const multiProjectCache = new Map<string, MultiProjectScaleAnalysis>();
const authorityCache = new Map<string, UnifiedScaleHardeningAuthority>();
const evaluationCache = new Map<string, ScaleHardeningEvaluation>();

function trimCache<T>(map: Map<string, T>): void {
  if (map.size <= MAX_CACHE_ENTRIES) return;
  const keys = [...map.keys()];
  const evict = keys.length - MAX_CACHE_ENTRIES;
  for (let i = 0; i < evict; i++) {
    map.delete(keys[i]);
    cacheEvictions += 1;
  }
}

function getCached<T>(map: Map<string, T>, key: string): T | undefined {
  const cached = map.get(key);
  if (cached) { cacheHits += 1; return cached; }
  cacheMisses += 1;
  return undefined;
}

function setCached<T>(map: Map<string, T>, key: string, value: T): void {
  map.set(key, value);
  trimCache(map);
}

export function getCachedCapacityAnalysis(key: string): CapacityReadinessAnalysis | undefined {
  return getCached(capacityCache, key);
}

export function setCachedCapacityAnalysis(key: string, value: CapacityReadinessAnalysis): void {
  setCached(capacityCache, key, value);
}

export function getCachedConcurrencyAnalysis(key: string): ConcurrencyRiskAnalysis | undefined {
  return getCached(concurrencyCache, key);
}

export function setCachedConcurrencyAnalysis(key: string, value: ConcurrencyRiskAnalysis): void {
  setCached(concurrencyCache, key, value);
}

export function getCachedCloudUsageAnalysis(key: string): CloudUsageReadinessAnalysis | undefined {
  return getCached(cloudUsageCache, key);
}

export function setCachedCloudUsageAnalysis(key: string, value: CloudUsageReadinessAnalysis): void {
  setCached(cloudUsageCache, key, value);
}

export function getCachedQueueLoadAnalysis(key: string): QueueLoadAnalysis | undefined {
  return getCached(queueLoadCache, key);
}

export function setCachedQueueLoadAnalysis(key: string, value: QueueLoadAnalysis): void {
  setCached(queueLoadCache, key, value);
}

export function getCachedMultiProjectAnalysis(key: string): MultiProjectScaleAnalysis | undefined {
  return getCached(multiProjectCache, key);
}

export function setCachedMultiProjectAnalysis(key: string, value: MultiProjectScaleAnalysis): void {
  setCached(multiProjectCache, key, value);
}

export function getCachedScaleAuthority(key: string): UnifiedScaleHardeningAuthority | undefined {
  return getCached(authorityCache, key);
}

export function setCachedScaleAuthority(key: string, value: UnifiedScaleHardeningAuthority): void {
  setCached(authorityCache, key, value);
}

export function getCachedScaleEvaluation(key: string): ScaleHardeningEvaluation | undefined {
  return getCached(evaluationCache, key);
}

export function setCachedScaleEvaluation(key: string, value: ScaleHardeningEvaluation): void {
  setCached(evaluationCache, key, value);
}

export function getScaleHardeningCacheStats(): { hits: number; misses: number; evictions: number } {
  return { hits: cacheHits, misses: cacheMisses, evictions: cacheEvictions };
}

export function resetScaleHardeningCacheForTests(): void {
  capacityCache.clear();
  concurrencyCache.clear();
  cloudUsageCache.clear();
  queueLoadCache.clear();
  multiProjectCache.clear();
  authorityCache.clear();
  evaluationCache.clear();
  cacheHits = 0;
  cacheMisses = 0;
  cacheEvictions = 0;
}
