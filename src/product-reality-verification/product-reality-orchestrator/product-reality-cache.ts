/**
 * Product Reality Orchestrator — bounded lookup cache.
 */

import type {
  BlockerAnalysisResult,
  ConflictDetectionResult,
  FounderPriorityResult,
  ProductRealityAggregate,
  ProductRealityAuthority,
  ProductRealityEvaluation,
  ProductRealityRoadmap,
  ProductRealityScore,
  ReleaseReadinessResult,
} from './product-reality-types.js';

const MAX_CACHE_ENTRIES = 256;

let cacheHits = 0;
let cacheMisses = 0;
let cacheEvictions = 0;
let sourceTextCacheHits = 0;

const aggregateCache = new Map<string, ProductRealityAggregate>();
const conflictCache = new Map<string, ConflictDetectionResult>();
const blockerCache = new Map<string, BlockerAnalysisResult>();
const releaseCache = new Map<string, ReleaseReadinessResult>();
const priorityCache = new Map<string, FounderPriorityResult>();
const roadmapCache = new Map<string, ProductRealityRoadmap>();
const authorityCache = new Map<string, ProductRealityAuthority>();
const scoreCache = new Map<string, ProductRealityScore>();
const evaluationCache = new Map<string, ProductRealityEvaluation>();
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

export function getCachedAggregate(key: string): ProductRealityAggregate | undefined {
  return getCached(aggregateCache, key);
}

export function setCachedAggregate(key: string, value: ProductRealityAggregate): void {
  setCached(aggregateCache, key, value);
}

export function getCachedConflictDetection(key: string): ConflictDetectionResult | undefined {
  return getCached(conflictCache, key);
}

export function setCachedConflictDetection(key: string, value: ConflictDetectionResult): void {
  setCached(conflictCache, key, value);
}

export function getCachedBlockerAnalysis(key: string): BlockerAnalysisResult | undefined {
  return getCached(blockerCache, key);
}

export function setCachedBlockerAnalysis(key: string, value: BlockerAnalysisResult): void {
  setCached(blockerCache, key, value);
}

export function getCachedReleaseReadiness(key: string): ReleaseReadinessResult | undefined {
  return getCached(releaseCache, key);
}

export function setCachedReleaseReadiness(key: string, value: ReleaseReadinessResult): void {
  setCached(releaseCache, key, value);
}

export function getCachedFounderPriority(key: string): FounderPriorityResult | undefined {
  return getCached(priorityCache, key);
}

export function setCachedFounderPriority(key: string, value: FounderPriorityResult): void {
  setCached(priorityCache, key, value);
}

export function getCachedProductRealityRoadmap(key: string): ProductRealityRoadmap | undefined {
  return getCached(roadmapCache, key);
}

export function setCachedProductRealityRoadmap(key: string, value: ProductRealityRoadmap): void {
  setCached(roadmapCache, key, value);
}

export function getCachedProductRealityAuthority(key: string): ProductRealityAuthority | undefined {
  return getCached(authorityCache, key);
}

export function setCachedProductRealityAuthority(key: string, value: ProductRealityAuthority): void {
  setCached(authorityCache, key, value);
}

export function getCachedProductRealityScore(key: string): ProductRealityScore | undefined {
  return getCached(scoreCache, key);
}

export function setCachedProductRealityScore(key: string, value: ProductRealityScore): void {
  setCached(scoreCache, key, value);
}

export function getCachedProductRealityEvaluation(key: string): ProductRealityEvaluation | undefined {
  return getCached(evaluationCache, key);
}

export function setCachedProductRealityEvaluation(key: string, value: ProductRealityEvaluation): void {
  setCached(evaluationCache, key, value);
}

export function getProductRealityCacheStats(): {
  hits: number;
  misses: number;
  evictions: number;
  sourceTextCacheHits: number;
} {
  return { hits: cacheHits, misses: cacheMisses, evictions: cacheEvictions, sourceTextCacheHits };
}

export function resetProductRealityCacheForTests(): void {
  aggregateCache.clear();
  conflictCache.clear();
  blockerCache.clear();
  releaseCache.clear();
  priorityCache.clear();
  roadmapCache.clear();
  authorityCache.clear();
  scoreCache.clear();
  evaluationCache.clear();
  sourceTextCache.clear();
  cacheHits = 0;
  cacheMisses = 0;
  cacheEvictions = 0;
  sourceTextCacheHits = 0;
}
