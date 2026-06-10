/**
 * Recovery Hardening — bounded lookup cache.
 */

import type {
  DisasterRecoveryReadinessAnalysis,
  EscalationReadinessAnalysis,
  FailureContainmentAnalysis,
  RecoveryHardeningEvaluation,
  ResetReadinessAnalysis,
  RollbackReadinessAnalysis,
  UnifiedRecoveryHardeningAuthority,
} from './recovery-hardening-types.js';

const MAX_CACHE_ENTRIES = 256;

let cacheHits = 0;
let cacheMisses = 0;
let cacheEvictions = 0;

const rollbackCache = new Map<string, RollbackReadinessAnalysis>();
const containmentCache = new Map<string, FailureContainmentAnalysis>();
const resetCache = new Map<string, ResetReadinessAnalysis>();
const escalationCache = new Map<string, EscalationReadinessAnalysis>();
const disasterCache = new Map<string, DisasterRecoveryReadinessAnalysis>();
const authorityCache = new Map<string, UnifiedRecoveryHardeningAuthority>();
const evaluationCache = new Map<string, RecoveryHardeningEvaluation>();

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

export function getCachedRollbackAnalysis(key: string): RollbackReadinessAnalysis | undefined {
  return getCached(rollbackCache, key);
}

export function setCachedRollbackAnalysis(key: string, value: RollbackReadinessAnalysis): void {
  setCached(rollbackCache, key, value);
}

export function getCachedContainmentAnalysis(key: string): FailureContainmentAnalysis | undefined {
  return getCached(containmentCache, key);
}

export function setCachedContainmentAnalysis(key: string, value: FailureContainmentAnalysis): void {
  setCached(containmentCache, key, value);
}

export function getCachedResetAnalysis(key: string): ResetReadinessAnalysis | undefined {
  return getCached(resetCache, key);
}

export function setCachedResetAnalysis(key: string, value: ResetReadinessAnalysis): void {
  setCached(resetCache, key, value);
}

export function getCachedEscalationAnalysis(key: string): EscalationReadinessAnalysis | undefined {
  return getCached(escalationCache, key);
}

export function setCachedEscalationAnalysis(key: string, value: EscalationReadinessAnalysis): void {
  setCached(escalationCache, key, value);
}

export function getCachedDisasterRecoveryAnalysis(key: string): DisasterRecoveryReadinessAnalysis | undefined {
  return getCached(disasterCache, key);
}

export function setCachedDisasterRecoveryAnalysis(key: string, value: DisasterRecoveryReadinessAnalysis): void {
  setCached(disasterCache, key, value);
}

export function getCachedRecoveryAuthority(key: string): UnifiedRecoveryHardeningAuthority | undefined {
  return getCached(authorityCache, key);
}

export function setCachedRecoveryAuthority(key: string, value: UnifiedRecoveryHardeningAuthority): void {
  setCached(authorityCache, key, value);
}

export function getCachedRecoveryEvaluation(key: string): RecoveryHardeningEvaluation | undefined {
  return getCached(evaluationCache, key);
}

export function setCachedRecoveryEvaluation(key: string, value: RecoveryHardeningEvaluation): void {
  setCached(evaluationCache, key, value);
}

export function getRecoveryHardeningCacheStats(): { hits: number; misses: number; evictions: number } {
  return { hits: cacheHits, misses: cacheMisses, evictions: cacheEvictions };
}

export function resetRecoveryHardeningCacheForTests(): void {
  rollbackCache.clear();
  containmentCache.clear();
  resetCache.clear();
  escalationCache.clear();
  disasterCache.clear();
  authorityCache.clear();
  evaluationCache.clear();
  cacheHits = 0;
  cacheMisses = 0;
  cacheEvictions = 0;
}
