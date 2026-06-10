/**
 * Founder Friction Detector — bounded lookup cache.
 */

import type {
  FrictionDetectorResult,
  FrictionGapAnalysis,
  FrictionContext,
  FounderFrictionAuthority,
  FounderFrictionEvaluation,
  FounderFrictionRoadmap,
} from './founder-friction-types.js';

const MAX_CACHE_ENTRIES = 256;

let cacheHits = 0;
let cacheMisses = 0;
let cacheEvictions = 0;
let sourceTextCacheHits = 0;

const contextCache = new Map<string, FrictionContext>();
const detectorCache = new Map<string, FrictionDetectorResult>();
const gapAnalysisCache = new Map<string, FrictionGapAnalysis>();
const roadmapCache = new Map<string, FounderFrictionRoadmap>();
const authorityCache = new Map<string, FounderFrictionAuthority>();
const evaluationCache = new Map<string, FounderFrictionEvaluation>();
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

export function getCachedFrictionContext(key: string): FrictionContext | undefined {
  return getCached(contextCache, key);
}

export function setCachedFrictionContext(key: string, value: FrictionContext): void {
  setCached(contextCache, key, value);
}

export function getCachedDetectorResult(key: string): FrictionDetectorResult | undefined {
  return getCached(detectorCache, key);
}

export function setCachedDetectorResult(key: string, value: FrictionDetectorResult): void {
  setCached(detectorCache, key, value);
}

export function getCachedFrictionGapAnalysis(key: string): FrictionGapAnalysis | undefined {
  return getCached(gapAnalysisCache, key);
}

export function setCachedFrictionGapAnalysis(key: string, value: FrictionGapAnalysis): void {
  setCached(gapAnalysisCache, key, value);
}

export function getCachedFrictionRoadmap(key: string): FounderFrictionRoadmap | undefined {
  return getCached(roadmapCache, key);
}

export function setCachedFrictionRoadmap(key: string, value: FounderFrictionRoadmap): void {
  setCached(roadmapCache, key, value);
}

export function getCachedFounderFrictionAuthority(key: string): FounderFrictionAuthority | undefined {
  return getCached(authorityCache, key);
}

export function setCachedFounderFrictionAuthority(key: string, value: FounderFrictionAuthority): void {
  setCached(authorityCache, key, value);
}

export function getCachedFounderFrictionEvaluation(key: string): FounderFrictionEvaluation | undefined {
  return getCached(evaluationCache, key);
}

export function setCachedFounderFrictionEvaluation(key: string, value: FounderFrictionEvaluation): void {
  setCached(evaluationCache, key, value);
}

export function getFounderFrictionCacheStats(): {
  hits: number;
  misses: number;
  evictions: number;
  sourceTextCacheHits: number;
} {
  return { hits: cacheHits, misses: cacheMisses, evictions: cacheEvictions, sourceTextCacheHits };
}

export function resetFounderFrictionCacheForTests(): void {
  contextCache.clear();
  detectorCache.clear();
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
