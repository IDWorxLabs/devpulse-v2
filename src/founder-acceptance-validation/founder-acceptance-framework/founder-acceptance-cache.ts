/**
 * Founder Acceptance Framework — bounded lookup cache.
 */

import type {
  CategoryRegistry,
  CriteriaRegistry,
  DimensionRegistry,
  FounderAcceptanceEvidenceModel,
  FounderAcceptanceFramework,
  FounderAcceptanceFrameworkAuthority,
  FounderAcceptanceFrameworkResult,
  FounderAcceptanceFutureRoadmap,
  FounderAcceptanceReportModel,
  FounderAcceptanceScoreModel,
} from './founder-acceptance-types.js';

const MAX_CACHE_ENTRIES = 256;

let cacheHits = 0;
let cacheMisses = 0;
let cacheEvictions = 0;
let sourceTextCacheHits = 0;

const dimensionCache = new Map<string, DimensionRegistry>();
const criteriaCache = new Map<string, CriteriaRegistry>();
const categoryCache = new Map<string, CategoryRegistry>();
const evidenceCache = new Map<string, FounderAcceptanceEvidenceModel>();
const scoringCache = new Map<string, FounderAcceptanceScoreModel>();
const reportCache = new Map<string, FounderAcceptanceReportModel>();
const roadmapCache = new Map<string, FounderAcceptanceFutureRoadmap>();
const authorityCache = new Map<string, FounderAcceptanceFrameworkAuthority>();
const frameworkCache = new Map<string, FounderAcceptanceFramework>();
const resultCache = new Map<string, FounderAcceptanceFrameworkResult>();
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

export function getCachedDimensionRegistry(key: string): DimensionRegistry | undefined {
  return getCached(dimensionCache, key);
}

export function setCachedDimensionRegistry(key: string, value: DimensionRegistry): void {
  setCached(dimensionCache, key, value);
}

export function getCachedCriteriaRegistry(key: string): CriteriaRegistry | undefined {
  return getCached(criteriaCache, key);
}

export function setCachedCriteriaRegistry(key: string, value: CriteriaRegistry): void {
  setCached(criteriaCache, key, value);
}

export function getCachedCategoryRegistry(key: string): CategoryRegistry | undefined {
  return getCached(categoryCache, key);
}

export function setCachedCategoryRegistry(key: string, value: CategoryRegistry): void {
  setCached(categoryCache, key, value);
}

export function getCachedEvidenceModel(key: string): FounderAcceptanceEvidenceModel | undefined {
  return getCached(evidenceCache, key);
}

export function setCachedEvidenceModel(key: string, value: FounderAcceptanceEvidenceModel): void {
  setCached(evidenceCache, key, value);
}

export function getCachedScoringModel(key: string): FounderAcceptanceScoreModel | undefined {
  return getCached(scoringCache, key);
}

export function setCachedScoringModel(key: string, value: FounderAcceptanceScoreModel): void {
  setCached(scoringCache, key, value);
}

export function getCachedReportModel(key: string): FounderAcceptanceReportModel | undefined {
  return getCached(reportCache, key);
}

export function setCachedReportModel(key: string, value: FounderAcceptanceReportModel): void {
  setCached(reportCache, key, value);
}

export function getCachedFutureRoadmap(key: string): FounderAcceptanceFutureRoadmap | undefined {
  return getCached(roadmapCache, key);
}

export function setCachedFutureRoadmap(key: string, value: FounderAcceptanceFutureRoadmap): void {
  setCached(roadmapCache, key, value);
}

export function getCachedFrameworkAuthority(key: string): FounderAcceptanceFrameworkAuthority | undefined {
  return getCached(authorityCache, key);
}

export function setCachedFrameworkAuthority(key: string, value: FounderAcceptanceFrameworkAuthority): void {
  setCached(authorityCache, key, value);
}

export function getCachedFramework(key: string): FounderAcceptanceFramework | undefined {
  return getCached(frameworkCache, key);
}

export function setCachedFramework(key: string, value: FounderAcceptanceFramework): void {
  setCached(frameworkCache, key, value);
}

export function getCachedFrameworkResult(key: string): FounderAcceptanceFrameworkResult | undefined {
  return getCached(resultCache, key);
}

export function setCachedFrameworkResult(key: string, value: FounderAcceptanceFrameworkResult): void {
  setCached(resultCache, key, value);
}

export function getFounderAcceptanceCacheStats(): {
  hits: number;
  misses: number;
  evictions: number;
  sourceTextCacheHits: number;
} {
  return { hits: cacheHits, misses: cacheMisses, evictions: cacheEvictions, sourceTextCacheHits };
}

export function resetFounderAcceptanceCacheForTests(): void {
  dimensionCache.clear();
  criteriaCache.clear();
  categoryCache.clear();
  evidenceCache.clear();
  scoringCache.clear();
  reportCache.clear();
  roadmapCache.clear();
  authorityCache.clear();
  frameworkCache.clear();
  resultCache.clear();
  sourceTextCache.clear();
  cacheHits = 0;
  cacheMisses = 0;
  cacheEvictions = 0;
  sourceTextCacheHits = 0;
}
