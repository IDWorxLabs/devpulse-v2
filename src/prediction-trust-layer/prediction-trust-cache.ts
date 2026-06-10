/**
 * Prediction Trust Layer — bounded lookup cache.
 */

import type {
  PredictionTrustEvaluation,
  TrustFailurePrediction,
  TrustRiskPrediction,
  TrustTrendAnalysis,
  TrustVolatilityAnalysis,
  UnifiedPredictionTrustAuthority,
} from './prediction-trust-types.js';

const MAX_CACHE_ENTRIES = 256;

let cacheHits = 0;
let cacheMisses = 0;
let cacheEvictions = 0;

const trendCache = new Map<string, TrustTrendAnalysis>();
const riskCache = new Map<string, TrustRiskPrediction>();
const failureCache = new Map<string, TrustFailurePrediction>();
const volatilityCache = new Map<string, TrustVolatilityAnalysis>();
const authorityCache = new Map<string, UnifiedPredictionTrustAuthority>();
const evaluationCache = new Map<string, PredictionTrustEvaluation>();

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

export function getCachedTrendAnalysis(key: string): TrustTrendAnalysis | undefined {
  return getCached(trendCache, key);
}

export function setCachedTrendAnalysis(key: string, value: TrustTrendAnalysis): void {
  setCached(trendCache, key, value);
}

export function getCachedRiskPrediction(key: string): TrustRiskPrediction | undefined {
  return getCached(riskCache, key);
}

export function setCachedRiskPrediction(key: string, value: TrustRiskPrediction): void {
  setCached(riskCache, key, value);
}

export function getCachedFailurePrediction(key: string): TrustFailurePrediction | undefined {
  return getCached(failureCache, key);
}

export function setCachedFailurePrediction(key: string, value: TrustFailurePrediction): void {
  setCached(failureCache, key, value);
}

export function getCachedVolatilityAnalysis(key: string): TrustVolatilityAnalysis | undefined {
  return getCached(volatilityCache, key);
}

export function setCachedVolatilityAnalysis(key: string, value: TrustVolatilityAnalysis): void {
  setCached(volatilityCache, key, value);
}

export function getCachedPredictionAuthority(key: string): UnifiedPredictionTrustAuthority | undefined {
  return getCached(authorityCache, key);
}

export function setCachedPredictionAuthority(key: string, value: UnifiedPredictionTrustAuthority): void {
  setCached(authorityCache, key, value);
}

export function getCachedPredictionEvaluation(key: string): PredictionTrustEvaluation | undefined {
  return getCached(evaluationCache, key);
}

export function setCachedPredictionEvaluation(key: string, value: PredictionTrustEvaluation): void {
  setCached(evaluationCache, key, value);
}

export function getPredictionTrustCacheStats(): { hits: number; misses: number; evictions: number } {
  return { hits: cacheHits, misses: cacheMisses, evictions: cacheEvictions };
}

export function resetPredictionTrustCacheForTests(): void {
  trendCache.clear();
  riskCache.clear();
  failureCache.clear();
  volatilityCache.clear();
  authorityCache.clear();
  evaluationCache.clear();
  cacheHits = 0;
  cacheMisses = 0;
  cacheEvictions = 0;
}
