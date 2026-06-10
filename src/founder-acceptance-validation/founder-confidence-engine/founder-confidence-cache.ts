/**
 * Founder Confidence Engine — bounded lookup cache.
 */

import type {
  ConfidenceValidatorResult,
  ConfidenceGapAnalysis,
  ConfidenceContext,
  FounderConfidenceAuthority,
  FounderConfidenceEvaluation,
  FounderConfidenceRoadmap,
} from './founder-confidence-types.js';

const MAX_CACHE_ENTRIES = 256;

let cacheHits = 0;
let cacheMisses = 0;
let cacheEvictions = 0;
let sourceTextCacheHits = 0;

const contextCache = new Map<string, ConfidenceContext>();
const validatorCache = new Map<string, ConfidenceValidatorResult>();
const gapAnalysisCache = new Map<string, ConfidenceGapAnalysis>();
const roadmapCache = new Map<string, FounderConfidenceRoadmap>();
const authorityCache = new Map<string, FounderConfidenceAuthority>();
const evaluationCache = new Map<string, FounderConfidenceEvaluation>();
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

export function getCachedConfidenceContext(key: string): ConfidenceContext | undefined {
  return getCached(contextCache, key);
}

export function setCachedConfidenceContext(key: string, value: ConfidenceContext): void {
  setCached(contextCache, key, value);
}

export function getCachedValidatorResult(key: string): ConfidenceValidatorResult | undefined {
  return getCached(validatorCache, key);
}

export function setCachedValidatorResult(key: string, value: ConfidenceValidatorResult): void {
  setCached(validatorCache, key, value);
}

export function getCachedConfidenceGapAnalysis(key: string): ConfidenceGapAnalysis | undefined {
  return getCached(gapAnalysisCache, key);
}

export function setCachedConfidenceGapAnalysis(key: string, value: ConfidenceGapAnalysis): void {
  setCached(gapAnalysisCache, key, value);
}

export function getCachedConfidenceRoadmap(key: string): FounderConfidenceRoadmap | undefined {
  return getCached(roadmapCache, key);
}

export function setCachedConfidenceRoadmap(key: string, value: FounderConfidenceRoadmap): void {
  setCached(roadmapCache, key, value);
}

export function getCachedFounderConfidenceAuthority(key: string): FounderConfidenceAuthority | undefined {
  return getCached(authorityCache, key);
}

export function setCachedFounderConfidenceAuthority(key: string, value: FounderConfidenceAuthority): void {
  setCached(authorityCache, key, value);
}

export function getCachedFounderConfidenceEvaluation(key: string): FounderConfidenceEvaluation | undefined {
  return getCached(evaluationCache, key);
}

export function setCachedFounderConfidenceEvaluation(key: string, value: FounderConfidenceEvaluation): void {
  setCached(evaluationCache, key, value);
}

export function getFounderConfidenceCacheStats(): {
  hits: number;
  misses: number;
  evictions: number;
  sourceTextCacheHits: number;
} {
  return { hits: cacheHits, misses: cacheMisses, evictions: cacheEvictions, sourceTextCacheHits };
}

export function resetFounderConfidenceCacheForTests(): void {
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
