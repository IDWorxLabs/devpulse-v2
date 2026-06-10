/**
 * Founder Trust Validation — bounded lookup cache.
 */

import type {
  TrustValidatorResult,
  TrustGapAnalysis,
  TrustContext,
  FounderTrustAuthority,
  FounderTrustEvaluation,
  FounderTrustRoadmap,
} from './founder-trust-types.js';

const MAX_CACHE_ENTRIES = 256;

let cacheHits = 0;
let cacheMisses = 0;
let cacheEvictions = 0;
let sourceTextCacheHits = 0;

const contextCache = new Map<string, TrustContext>();
const validatorCache = new Map<string, TrustValidatorResult>();
const gapAnalysisCache = new Map<string, TrustGapAnalysis>();
const roadmapCache = new Map<string, FounderTrustRoadmap>();
const authorityCache = new Map<string, FounderTrustAuthority>();
const evaluationCache = new Map<string, FounderTrustEvaluation>();
const sourceTextCache = new Map<string, string>();

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
  if (cached) {
    cacheHits += 1;
    return cached;
  }
  cacheMisses += 1;
  return undefined;
}

function setCached<T>(map: Map<string, T>, key: string, value: T): void {
  map.set(key, value);
  trimCache(map);
}

export function getCachedSourceText(path: string): string | undefined {
  const cached = sourceTextCache.get(path);
  if (cached !== undefined) {
    sourceTextCacheHits += 1;
    cacheHits += 1;
    return cached;
  }
  cacheMisses += 1;
  return undefined;
}

export function setCachedSourceText(path: string, text: string): void {
  sourceTextCache.set(path, text);
  trimCache(sourceTextCache);
}

export function getCachedTrustContext(key: string): TrustContext | undefined {
  return getCached(contextCache, key);
}

export function setCachedTrustContext(key: string, value: TrustContext): void {
  setCached(contextCache, key, value);
}

export function getCachedValidatorResult(key: string): TrustValidatorResult | undefined {
  return getCached(validatorCache, key);
}

export function setCachedValidatorResult(key: string, value: TrustValidatorResult): void {
  setCached(validatorCache, key, value);
}

export function getCachedTrustGapAnalysis(key: string): TrustGapAnalysis | undefined {
  return getCached(gapAnalysisCache, key);
}

export function setCachedTrustGapAnalysis(key: string, value: TrustGapAnalysis): void {
  setCached(gapAnalysisCache, key, value);
}

export function getCachedTrustRoadmap(key: string): FounderTrustRoadmap | undefined {
  return getCached(roadmapCache, key);
}

export function setCachedTrustRoadmap(key: string, value: FounderTrustRoadmap): void {
  setCached(roadmapCache, key, value);
}

export function getCachedFounderTrustAuthority(key: string): FounderTrustAuthority | undefined {
  return getCached(authorityCache, key);
}

export function setCachedFounderTrustAuthority(key: string, value: FounderTrustAuthority): void {
  setCached(authorityCache, key, value);
}

export function getCachedFounderTrustEvaluation(key: string): FounderTrustEvaluation | undefined {
  return getCached(evaluationCache, key);
}

export function setCachedFounderTrustEvaluation(key: string, value: FounderTrustEvaluation): void {
  setCached(evaluationCache, key, value);
}

export function getFounderTrustCacheStats(): {
  hits: number;
  misses: number;
  evictions: number;
  sourceTextCacheHits: number;
} {
  return { hits: cacheHits, misses: cacheMisses, evictions: cacheEvictions, sourceTextCacheHits };
}

export function resetFounderTrustCacheForTests(): void {
  contextCache.clear();
  validatorCache.clear();
  gapAnalysisCache.clear();
  roadmapCache.clear();
  authorityCache.clear();
  evaluationCache.clear();
  sourceTextCache.clear();
  cacheHits = 0;
  cacheMisses = 0;
  cacheEvictions = 0;
  sourceTextCacheHits = 0;
}
