/**
 * Reliability Hardening — bounded lookup cache.
 */

import type {
  FailureSurfaceAnalysis,
  RecoveryReadinessAnalysis,
  ReliabilityBoundaryCheck,
  ReliabilityConsistencyAnalysis,
  ReliabilityHardeningEvaluation,
  RuntimeStabilityAnalysis,
  UnifiedReliabilityHardeningAuthority,
} from './reliability-hardening-types.js';

const MAX_CACHE_ENTRIES = 256;

let cacheHits = 0;
let cacheMisses = 0;
let cacheEvictions = 0;

const failureCache = new Map<string, FailureSurfaceAnalysis>();
const runtimeCache = new Map<string, RuntimeStabilityAnalysis>();
const boundaryCache = new Map<string, ReliabilityBoundaryCheck>();
const recoveryCache = new Map<string, RecoveryReadinessAnalysis>();
const consistencyCache = new Map<string, ReliabilityConsistencyAnalysis>();
const authorityCache = new Map<string, UnifiedReliabilityHardeningAuthority>();
const evaluationCache = new Map<string, ReliabilityHardeningEvaluation>();

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

export function getCachedFailureSurfaceAnalysis(key: string): FailureSurfaceAnalysis | undefined {
  return getCached(failureCache, key);
}

export function setCachedFailureSurfaceAnalysis(key: string, value: FailureSurfaceAnalysis): void {
  setCached(failureCache, key, value);
}

export function getCachedRuntimeStabilityAnalysis(key: string): RuntimeStabilityAnalysis | undefined {
  return getCached(runtimeCache, key);
}

export function setCachedRuntimeStabilityAnalysis(key: string, value: RuntimeStabilityAnalysis): void {
  setCached(runtimeCache, key, value);
}

export function getCachedBoundaryCheck(key: string): ReliabilityBoundaryCheck | undefined {
  return getCached(boundaryCache, key);
}

export function setCachedBoundaryCheck(key: string, value: ReliabilityBoundaryCheck): void {
  setCached(boundaryCache, key, value);
}

export function getCachedRecoveryReadinessAnalysis(key: string): RecoveryReadinessAnalysis | undefined {
  return getCached(recoveryCache, key);
}

export function setCachedRecoveryReadinessAnalysis(key: string, value: RecoveryReadinessAnalysis): void {
  setCached(recoveryCache, key, value);
}

export function getCachedConsistencyAnalysis(key: string): ReliabilityConsistencyAnalysis | undefined {
  return getCached(consistencyCache, key);
}

export function setCachedConsistencyAnalysis(key: string, value: ReliabilityConsistencyAnalysis): void {
  setCached(consistencyCache, key, value);
}

export function getCachedReliabilityAuthority(key: string): UnifiedReliabilityHardeningAuthority | undefined {
  return getCached(authorityCache, key);
}

export function setCachedReliabilityAuthority(key: string, value: UnifiedReliabilityHardeningAuthority): void {
  setCached(authorityCache, key, value);
}

export function getCachedReliabilityEvaluation(key: string): ReliabilityHardeningEvaluation | undefined {
  return getCached(evaluationCache, key);
}

export function setCachedReliabilityEvaluation(key: string, value: ReliabilityHardeningEvaluation): void {
  setCached(evaluationCache, key, value);
}

export function getReliabilityHardeningCacheStats(): { hits: number; misses: number; evictions: number } {
  return { hits: cacheHits, misses: cacheMisses, evictions: cacheEvictions };
}

export function resetReliabilityHardeningCacheForTests(): void {
  failureCache.clear();
  runtimeCache.clear();
  boundaryCache.clear();
  recoveryCache.clear();
  consistencyCache.clear();
  authorityCache.clear();
  evaluationCache.clear();
  cacheHits = 0;
  cacheMisses = 0;
  cacheEvictions = 0;
}
