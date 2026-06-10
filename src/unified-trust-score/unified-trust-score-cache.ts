/**
 * Unified Trust Score — bounded lookup cache.
 */

import type {
  NormalizedTrustScores,
  TrustConfidenceEvaluation,
  TrustConsistencyAnalysis,
  TrustWeightContribution,
  UnifiedTrustScoreAuthority,
  UnifiedTrustScoreEvaluation,
  UnifiedTrustScoreInputs,
} from './unified-trust-score-types.js';

const MAX_CACHE_ENTRIES = 256;

let cacheHits = 0;
let cacheMisses = 0;
let cacheEvictions = 0;

const inputCache = new Map<string, UnifiedTrustScoreInputs>();
const normalizedCache = new Map<string, NormalizedTrustScores>();
const weightCache = new Map<string, TrustWeightContribution>();
const consistencyCache = new Map<string, TrustConsistencyAnalysis>();
const confidenceCache = new Map<string, TrustConfidenceEvaluation>();
const authorityCache = new Map<string, UnifiedTrustScoreAuthority>();
const evaluationCache = new Map<string, UnifiedTrustScoreEvaluation>();

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
  if (cached) { cacheHits += 1; return cached; }
  cacheMisses += 1;
  return undefined;
}

function setCached<T>(map: Map<string, T>, key: string, value: T): void {
  map.set(key, value);
  trimCache(map);
}

export function getCachedTrustScoreInputs(key: string): UnifiedTrustScoreInputs | undefined {
  return getCached(inputCache, key);
}

export function setCachedTrustScoreInputs(key: string, value: UnifiedTrustScoreInputs): void {
  setCached(inputCache, key, value);
}

export function getCachedNormalizedScores(key: string): NormalizedTrustScores | undefined {
  return getCached(normalizedCache, key);
}

export function setCachedNormalizedScores(key: string, value: NormalizedTrustScores): void {
  setCached(normalizedCache, key, value);
}

export function getCachedWeightContribution(key: string): TrustWeightContribution | undefined {
  return getCached(weightCache, key);
}

export function setCachedWeightContribution(key: string, value: TrustWeightContribution): void {
  setCached(weightCache, key, value);
}

export function getCachedConsistencyAnalysis(key: string): TrustConsistencyAnalysis | undefined {
  return getCached(consistencyCache, key);
}

export function setCachedConsistencyAnalysis(key: string, value: TrustConsistencyAnalysis): void {
  setCached(consistencyCache, key, value);
}

export function getCachedConfidenceEvaluation(key: string): TrustConfidenceEvaluation | undefined {
  return getCached(confidenceCache, key);
}

export function setCachedConfidenceEvaluation(key: string, value: TrustConfidenceEvaluation): void {
  setCached(confidenceCache, key, value);
}

export function getCachedTrustScoreAuthority(key: string): UnifiedTrustScoreAuthority | undefined {
  return getCached(authorityCache, key);
}

export function setCachedTrustScoreAuthority(key: string, value: UnifiedTrustScoreAuthority): void {
  setCached(authorityCache, key, value);
}

export function getCachedTrustScoreEvaluation(key: string): UnifiedTrustScoreEvaluation | undefined {
  return getCached(evaluationCache, key);
}

export function setCachedTrustScoreEvaluation(key: string, value: UnifiedTrustScoreEvaluation): void {
  setCached(evaluationCache, key, value);
}

export function getUnifiedTrustScoreCacheStats(): { hits: number; misses: number; evictions: number } {
  return { hits: cacheHits, misses: cacheMisses, evictions: cacheEvictions };
}

export function resetUnifiedTrustScoreCacheForTests(): void {
  inputCache.clear();
  normalizedCache.clear();
  weightCache.clear();
  consistencyCache.clear();
  confidenceCache.clear();
  authorityCache.clear();
  evaluationCache.clear();
  cacheHits = 0;
  cacheMisses = 0;
  cacheEvictions = 0;
}
