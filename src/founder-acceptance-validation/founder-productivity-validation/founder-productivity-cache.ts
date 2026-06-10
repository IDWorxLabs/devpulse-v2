/**
 * Founder Productivity Validation — bounded lookup cache.
 */

import type {
  ProductivityValidatorResult,
  ProductivityGapAnalysis,
  ProductivityContext,
  FounderProductivityAuthority,
  FounderProductivityEvaluation,
  FounderProductivityRoadmap,
} from './founder-productivity-types.js';

const MAX_CACHE_ENTRIES = 256;

let cacheHits = 0;
let cacheMisses = 0;
let cacheEvictions = 0;
let sourceTextCacheHits = 0;

const contextCache = new Map<string, ProductivityContext>();
const validatorCache = new Map<string, ProductivityValidatorResult>();
const gapAnalysisCache = new Map<string, ProductivityGapAnalysis>();
const roadmapCache = new Map<string, FounderProductivityRoadmap>();
const authorityCache = new Map<string, FounderProductivityAuthority>();
const evaluationCache = new Map<string, FounderProductivityEvaluation>();
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

export function getCachedProductivityContext(key: string): ProductivityContext | undefined {
  return getCached(contextCache, key);
}

export function setCachedProductivityContext(key: string, value: ProductivityContext): void {
  setCached(contextCache, key, value);
}

export function getCachedValidatorResult(key: string): ProductivityValidatorResult | undefined {
  return getCached(validatorCache, key);
}

export function setCachedValidatorResult(key: string, value: ProductivityValidatorResult): void {
  setCached(validatorCache, key, value);
}

export function getCachedProductivityGapAnalysis(key: string): ProductivityGapAnalysis | undefined {
  return getCached(gapAnalysisCache, key);
}

export function setCachedProductivityGapAnalysis(key: string, value: ProductivityGapAnalysis): void {
  setCached(gapAnalysisCache, key, value);
}

export function getCachedProductivityRoadmap(key: string): FounderProductivityRoadmap | undefined {
  return getCached(roadmapCache, key);
}

export function setCachedProductivityRoadmap(key: string, value: FounderProductivityRoadmap): void {
  setCached(roadmapCache, key, value);
}

export function getCachedFounderProductivityAuthority(key: string): FounderProductivityAuthority | undefined {
  return getCached(authorityCache, key);
}

export function setCachedFounderProductivityAuthority(key: string, value: FounderProductivityAuthority): void {
  setCached(authorityCache, key, value);
}

export function getCachedFounderProductivityEvaluation(key: string): FounderProductivityEvaluation | undefined {
  return getCached(evaluationCache, key);
}

export function setCachedFounderProductivityEvaluation(key: string, value: FounderProductivityEvaluation): void {
  setCached(evaluationCache, key, value);
}

export function getFounderProductivityCacheStats(): {
  hits: number;
  misses: number;
  evictions: number;
  sourceTextCacheHits: number;
} {
  return { hits: cacheHits, misses: cacheMisses, evictions: cacheEvictions, sourceTextCacheHits };
}

export function resetFounderProductivityCacheForTests(): void {
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
