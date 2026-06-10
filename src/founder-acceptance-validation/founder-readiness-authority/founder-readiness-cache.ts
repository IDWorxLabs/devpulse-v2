/**
 * Founder Readiness Authority — bounded lookup cache.
 */

import type {
  ReadinessAnalyzerResult,
  ReadinessGapAnalysis,
  ReadinessContext,
  FounderReadinessAuthority,
  FounderReadinessEvaluation,
  FounderReadinessRoadmap,
  ReadinessBlockerAnalysis,
} from './founder-readiness-types.js';

const MAX_CACHE_ENTRIES = 256;

let cacheHits = 0;
let cacheMisses = 0;
let cacheEvictions = 0;
let sourceTextCacheHits = 0;

const contextCache = new Map<string, ReadinessContext>();
const analyzerCache = new Map<string, ReadinessAnalyzerResult>();
const blockerCache = new Map<string, ReadinessBlockerAnalysis>();
const gapAnalysisCache = new Map<string, ReadinessGapAnalysis>();
const roadmapCache = new Map<string, FounderReadinessRoadmap>();
const authorityCache = new Map<string, FounderReadinessAuthority>();
const evaluationCache = new Map<string, FounderReadinessEvaluation>();
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

export function getCachedReadinessContext(key: string): ReadinessContext | undefined {
  return getCached(contextCache, key);
}

export function setCachedReadinessContext(key: string, value: ReadinessContext): void {
  setCached(contextCache, key, value);
}

export function getCachedAnalyzerResult(key: string): ReadinessAnalyzerResult | undefined {
  return getCached(analyzerCache, key);
}

export function setCachedAnalyzerResult(key: string, value: ReadinessAnalyzerResult): void {
  setCached(analyzerCache, key, value);
}

export function getCachedReadinessBlockerAnalysis(key: string): ReadinessBlockerAnalysis | undefined {
  return getCached(blockerCache, key);
}

export function setCachedReadinessBlockerAnalysis(key: string, value: ReadinessBlockerAnalysis): void {
  setCached(blockerCache, key, value);
}

export function getCachedReadinessGapAnalysis(key: string): ReadinessGapAnalysis | undefined {
  return getCached(gapAnalysisCache, key);
}

export function setCachedReadinessGapAnalysis(key: string, value: ReadinessGapAnalysis): void {
  setCached(gapAnalysisCache, key, value);
}

export function getCachedReadinessRoadmap(key: string): FounderReadinessRoadmap | undefined {
  return getCached(roadmapCache, key);
}

export function setCachedReadinessRoadmap(key: string, value: FounderReadinessRoadmap): void {
  setCached(roadmapCache, key, value);
}

export function getCachedFounderReadinessAuthority(key: string): FounderReadinessAuthority | undefined {
  return getCached(authorityCache, key);
}

export function setCachedFounderReadinessAuthority(key: string, value: FounderReadinessAuthority): void {
  setCached(authorityCache, key, value);
}

export function getCachedFounderReadinessEvaluation(key: string): FounderReadinessEvaluation | undefined {
  return getCached(evaluationCache, key);
}

export function setCachedFounderReadinessEvaluation(key: string, value: FounderReadinessEvaluation): void {
  setCached(evaluationCache, key, value);
}

export function getFounderReadinessCacheStats(): {
  hits: number;
  misses: number;
  evictions: number;
  sourceTextCacheHits: number;
} {
  return { hits: cacheHits, misses: cacheMisses, evictions: cacheEvictions, sourceTextCacheHits };
}

export function resetFounderReadinessCacheForTests(): void {
  contextCache.clear();
  analyzerCache.clear();
  blockerCache.clear();
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
