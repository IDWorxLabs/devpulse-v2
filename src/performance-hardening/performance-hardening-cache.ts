/**
 * Performance Hardening — bounded lookup cache.
 */

import type {
  CacheEfficiencyAnalysis,
  PerformanceBottleneckDetection,
  PerformanceHardeningEvaluation,
  StartupPerformanceAnalysis,
  UiResponsivenessAnalysis,
  UnifiedPerformanceHardeningAuthority,
  ValidationPerformanceAnalysis,
} from './performance-hardening-types.js';

const MAX_CACHE_ENTRIES = 256;

let cacheHits = 0;
let cacheMisses = 0;
let cacheEvictions = 0;

const startupCache = new Map<string, StartupPerformanceAnalysis>();
const validationCache = new Map<string, ValidationPerformanceAnalysis>();
const cacheEfficiencyCache = new Map<string, CacheEfficiencyAnalysis>();
const responsivenessCache = new Map<string, UiResponsivenessAnalysis>();
const bottleneckCache = new Map<string, PerformanceBottleneckDetection>();
const authorityCache = new Map<string, UnifiedPerformanceHardeningAuthority>();
const evaluationCache = new Map<string, PerformanceHardeningEvaluation>();

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

export function getCachedStartupAnalysis(key: string): StartupPerformanceAnalysis | undefined {
  return getCached(startupCache, key);
}

export function setCachedStartupAnalysis(key: string, value: StartupPerformanceAnalysis): void {
  setCached(startupCache, key, value);
}

export function getCachedValidationAnalysis(key: string): ValidationPerformanceAnalysis | undefined {
  return getCached(validationCache, key);
}

export function setCachedValidationAnalysis(key: string, value: ValidationPerformanceAnalysis): void {
  setCached(validationCache, key, value);
}

export function getCachedCacheEfficiencyAnalysis(key: string): CacheEfficiencyAnalysis | undefined {
  return getCached(cacheEfficiencyCache, key);
}

export function setCachedCacheEfficiencyAnalysis(key: string, value: CacheEfficiencyAnalysis): void {
  setCached(cacheEfficiencyCache, key, value);
}

export function getCachedResponsivenessAnalysis(key: string): UiResponsivenessAnalysis | undefined {
  return getCached(responsivenessCache, key);
}

export function setCachedResponsivenessAnalysis(key: string, value: UiResponsivenessAnalysis): void {
  setCached(responsivenessCache, key, value);
}

export function getCachedBottleneckDetection(key: string): PerformanceBottleneckDetection | undefined {
  return getCached(bottleneckCache, key);
}

export function setCachedBottleneckDetection(key: string, value: PerformanceBottleneckDetection): void {
  setCached(bottleneckCache, key, value);
}

export function getCachedPerformanceAuthority(key: string): UnifiedPerformanceHardeningAuthority | undefined {
  return getCached(authorityCache, key);
}

export function setCachedPerformanceAuthority(key: string, value: UnifiedPerformanceHardeningAuthority): void {
  setCached(authorityCache, key, value);
}

export function getCachedPerformanceEvaluation(key: string): PerformanceHardeningEvaluation | undefined {
  return getCached(evaluationCache, key);
}

export function setCachedPerformanceEvaluation(key: string, value: PerformanceHardeningEvaluation): void {
  setCached(evaluationCache, key, value);
}

export function getPerformanceHardeningCacheStats(): { hits: number; misses: number; evictions: number } {
  return { hits: cacheHits, misses: cacheMisses, evictions: cacheEvictions };
}

export function resetPerformanceHardeningCacheForTests(): void {
  startupCache.clear();
  validationCache.clear();
  cacheEfficiencyCache.clear();
  responsivenessCache.clear();
  bottleneckCache.clear();
  authorityCache.clear();
  evaluationCache.clear();
  cacheHits = 0;
  cacheMisses = 0;
  cacheEvictions = 0;
}
