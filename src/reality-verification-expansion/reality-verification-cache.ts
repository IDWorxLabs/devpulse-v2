/**
 * Reality Verification Expansion — bounded lookup cache.
 */

import type {
  ClaimValidation,
  RealityConsistencyScores,
  RealitySourceRegistration,
  RealityVerificationEvaluation,
  UnifiedRealityAuthority,
} from './reality-verification-types.js';

let cacheHits = 0;
let cacheMisses = 0;

const sourceCache = new Map<string, RealitySourceRegistration>();
const claimCache = new Map<string, ClaimValidation>();
const consistencyCache = new Map<string, RealityConsistencyScores>();
const authorityCache = new Map<string, UnifiedRealityAuthority>();
const evaluationCache = new Map<string, RealityVerificationEvaluation>();

const MAX_CACHE_ENTRIES = 256;

function trimCache<T>(map: Map<string, T>): void {
  if (map.size <= MAX_CACHE_ENTRIES) return;
  const keys = [...map.keys()];
  for (let i = 0; i < keys.length - MAX_CACHE_ENTRIES; i++) {
    map.delete(keys[i]);
  }
}

export function getCachedRealitySource(key: string): RealitySourceRegistration | undefined {
  const cached = sourceCache.get(key);
  if (cached) { cacheHits += 1; return cached; }
  cacheMisses += 1;
  return undefined;
}

export function setCachedRealitySource(key: string, value: RealitySourceRegistration): void {
  sourceCache.set(key, value);
  trimCache(sourceCache);
}

export function getCachedClaimValidation(key: string): ClaimValidation | undefined {
  const cached = claimCache.get(key);
  if (cached) { cacheHits += 1; return cached; }
  cacheMisses += 1;
  return undefined;
}

export function setCachedClaimValidation(key: string, value: ClaimValidation): void {
  claimCache.set(key, value);
  trimCache(claimCache);
}

export function getCachedConsistencyAnalysis(key: string): RealityConsistencyScores | undefined {
  const cached = consistencyCache.get(key);
  if (cached) { cacheHits += 1; return cached; }
  cacheMisses += 1;
  return undefined;
}

export function setCachedConsistencyAnalysis(key: string, value: RealityConsistencyScores): void {
  consistencyCache.set(key, value);
  trimCache(consistencyCache);
}

export function getCachedRealityAuthority(key: string): UnifiedRealityAuthority | undefined {
  const cached = authorityCache.get(key);
  if (cached) { cacheHits += 1; return cached; }
  cacheMisses += 1;
  return undefined;
}

export function setCachedRealityAuthority(key: string, value: UnifiedRealityAuthority): void {
  authorityCache.set(key, value);
  trimCache(authorityCache);
}

export function getCachedRealityEvaluation(key: string): RealityVerificationEvaluation | undefined {
  const cached = evaluationCache.get(key);
  if (cached) { cacheHits += 1; return cached; }
  cacheMisses += 1;
  return undefined;
}

export function setCachedRealityEvaluation(key: string, value: RealityVerificationEvaluation): void {
  evaluationCache.set(key, value);
  trimCache(evaluationCache);
}

export function getRealityVerificationCacheStats(): { hits: number; misses: number } {
  return { hits: cacheHits, misses: cacheMisses };
}

export function resetRealityVerificationCacheForTests(): void {
  sourceCache.clear();
  claimCache.clear();
  consistencyCache.clear();
  authorityCache.clear();
  evaluationCache.clear();
  cacheHits = 0;
  cacheMisses = 0;
}
