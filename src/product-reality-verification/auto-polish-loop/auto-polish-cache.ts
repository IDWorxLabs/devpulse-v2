/**
 * Auto-Polish Loop — bounded lookup cache.
 */

import type {
  AutoPolishAuthority,
  AutoPolishEvaluation,
  CategoryPolishAnalysis,
  PolishPriorityAnalysis,
  PolishRoadmap,
} from './auto-polish-types.js';

const MAX_CACHE_ENTRIES = 256;

let cacheHits = 0;
let cacheMisses = 0;
let cacheEvictions = 0;
let sourceTextCacheHits = 0;

const categoryCache = new Map<string, CategoryPolishAnalysis>();
const priorityCache = new Map<string, PolishPriorityAnalysis>();
const roadmapCache = new Map<string, PolishRoadmap>();
const authorityCache = new Map<string, AutoPolishAuthority>();
const evaluationCache = new Map<string, AutoPolishEvaluation>();
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

export function getCachedCategoryPolish(key: string): CategoryPolishAnalysis | undefined {
  return getCached(categoryCache, key);
}

export function setCachedCategoryPolish(key: string, value: CategoryPolishAnalysis): void {
  setCached(categoryCache, key, value);
}

export function getCachedPolishPriority(key: string): PolishPriorityAnalysis | undefined {
  return getCached(priorityCache, key);
}

export function setCachedPolishPriority(key: string, value: PolishPriorityAnalysis): void {
  setCached(priorityCache, key, value);
}

export function getCachedPolishRoadmap(key: string): PolishRoadmap | undefined {
  return getCached(roadmapCache, key);
}

export function setCachedPolishRoadmap(key: string, value: PolishRoadmap): void {
  setCached(roadmapCache, key, value);
}

export function getCachedAutoPolishAuthority(key: string): AutoPolishAuthority | undefined {
  return getCached(authorityCache, key);
}

export function setCachedAutoPolishAuthority(key: string, value: AutoPolishAuthority): void {
  setCached(authorityCache, key, value);
}

export function getCachedAutoPolishEvaluation(key: string): AutoPolishEvaluation | undefined {
  return getCached(evaluationCache, key);
}

export function setCachedAutoPolishEvaluation(key: string, value: AutoPolishEvaluation): void {
  setCached(evaluationCache, key, value);
}

export function getAutoPolishCacheStats(): {
  hits: number;
  misses: number;
  evictions: number;
  sourceTextCacheHits: number;
} {
  return { hits: cacheHits, misses: cacheMisses, evictions: cacheEvictions, sourceTextCacheHits };
}

export function resetAutoPolishCacheForTests(): void {
  categoryCache.clear();
  priorityCache.clear();
  roadmapCache.clear();
  authorityCache.clear();
  evaluationCache.clear();
  sourceTextCache.clear();
  cacheHits = 0;
  cacheMisses = 0;
  cacheEvictions = 0;
  sourceTextCacheHits = 0;
}
