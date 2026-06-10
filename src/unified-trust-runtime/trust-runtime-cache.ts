/**
 * Unified Trust Runtime — bounded lookup cache.
 */

import type {
  NormalizedTrustSignal,
  TrustRuntimeEvaluation,
  TrustSourceRegistration,
  UnifiedTrustAuthority,
} from './trust-runtime-types.js';

let cacheHits = 0;
let cacheMisses = 0;

const sourceCache = new Map<string, TrustSourceRegistration>();
const normalizationCache = new Map<string, NormalizedTrustSignal>();
const authorityCache = new Map<string, UnifiedTrustAuthority>();
const evaluationCache = new Map<string, TrustRuntimeEvaluation>();

const MAX_CACHE_ENTRIES = 256;

function trimCache<T>(map: Map<string, T>): void {
  if (map.size <= MAX_CACHE_ENTRIES) return;
  const keys = [...map.keys()];
  for (let i = 0; i < keys.length - MAX_CACHE_ENTRIES; i++) {
    map.delete(keys[i]);
  }
}

export function getCachedSourceLookup(key: string): TrustSourceRegistration | undefined {
  const cached = sourceCache.get(key);
  if (cached) { cacheHits += 1; return cached; }
  cacheMisses += 1;
  return undefined;
}

export function setCachedSourceLookup(key: string, value: TrustSourceRegistration): void {
  sourceCache.set(key, value);
  trimCache(sourceCache);
}

export function getCachedNormalization(key: string): NormalizedTrustSignal | undefined {
  const cached = normalizationCache.get(key);
  if (cached) { cacheHits += 1; return cached; }
  cacheMisses += 1;
  return undefined;
}

export function setCachedNormalization(key: string, value: NormalizedTrustSignal): void {
  normalizationCache.set(key, value);
  trimCache(normalizationCache);
}

export function getCachedAuthority(key: string): UnifiedTrustAuthority | undefined {
  const cached = authorityCache.get(key);
  if (cached) { cacheHits += 1; return cached; }
  cacheMisses += 1;
  return undefined;
}

export function setCachedAuthority(key: string, value: UnifiedTrustAuthority): void {
  authorityCache.set(key, value);
  trimCache(authorityCache);
}

export function getCachedEvaluation(key: string): TrustRuntimeEvaluation | undefined {
  const cached = evaluationCache.get(key);
  if (cached) { cacheHits += 1; return cached; }
  cacheMisses += 1;
  return undefined;
}

export function setCachedEvaluation(key: string, value: TrustRuntimeEvaluation): void {
  evaluationCache.set(key, value);
  trimCache(evaluationCache);
}

export function getTrustRuntimeCacheStats(): { hits: number; misses: number } {
  return { hits: cacheHits, misses: cacheMisses };
}

export function resetTrustRuntimeCacheForTests(): void {
  sourceCache.clear();
  normalizationCache.clear();
  authorityCache.clear();
  evaluationCache.clear();
  cacheHits = 0;
  cacheMisses = 0;
}
