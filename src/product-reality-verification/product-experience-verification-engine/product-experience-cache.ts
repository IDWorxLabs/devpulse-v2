/**
 * Product Experience Verification Engine — bounded lookup cache.
 */

import type {
  ExperienceContext,
  ExperienceGapAnalysis,
  ProductExperienceAuthority,
  ProductExperienceEvaluation,
  ProductExperienceRoadmap,
  VerifierContinuityResult,
} from './product-experience-types.js';

const MAX_CACHE_ENTRIES = 256;

let cacheHits = 0;
let cacheMisses = 0;
let cacheEvictions = 0;
let sourceTextCacheHits = 0;

const contextCache = new Map<string, ExperienceContext>();
const verifierCache = new Map<string, VerifierContinuityResult>();
const gapAnalysisCache = new Map<string, ExperienceGapAnalysis>();
const roadmapCache = new Map<string, ProductExperienceRoadmap>();
const authorityCache = new Map<string, ProductExperienceAuthority>();
const evaluationCache = new Map<string, ProductExperienceEvaluation>();
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

export function getCachedExperienceContext(key: string): ExperienceContext | undefined {
  return getCached(contextCache, key);
}

export function setCachedExperienceContext(key: string, value: ExperienceContext): void {
  setCached(contextCache, key, value);
}

export function getCachedVerifierResult(key: string): VerifierContinuityResult | undefined {
  return getCached(verifierCache, key);
}

export function setCachedVerifierResult(key: string, value: VerifierContinuityResult): void {
  setCached(verifierCache, key, value);
}

export function getCachedGapAnalysis(key: string): ExperienceGapAnalysis | undefined {
  return getCached(gapAnalysisCache, key);
}

export function setCachedGapAnalysis(key: string, value: ExperienceGapAnalysis): void {
  setCached(gapAnalysisCache, key, value);
}

export function getCachedExperienceRoadmap(key: string): ProductExperienceRoadmap | undefined {
  return getCached(roadmapCache, key);
}

export function setCachedExperienceRoadmap(key: string, value: ProductExperienceRoadmap): void {
  setCached(roadmapCache, key, value);
}

export function getCachedProductExperienceAuthority(key: string): ProductExperienceAuthority | undefined {
  return getCached(authorityCache, key);
}

export function setCachedProductExperienceAuthority(key: string, value: ProductExperienceAuthority): void {
  setCached(authorityCache, key, value);
}

export function getCachedProductExperienceEvaluation(key: string): ProductExperienceEvaluation | undefined {
  return getCached(evaluationCache, key);
}

export function setCachedProductExperienceEvaluation(key: string, value: ProductExperienceEvaluation): void {
  setCached(evaluationCache, key, value);
}

export function getProductExperienceCacheStats(): {
  hits: number;
  misses: number;
  evictions: number;
  sourceTextCacheHits: number;
} {
  return { hits: cacheHits, misses: cacheMisses, evictions: cacheEvictions, sourceTextCacheHits };
}

export function resetProductExperienceCacheForTests(): void {
  contextCache.clear();
  verifierCache.clear();
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
