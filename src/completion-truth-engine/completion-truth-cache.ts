/**
 * Completion Truth Engine — bounded lookup cache.
 */

import type {
  CompletionClaimAnalysis,
  CompletionConsistencyScores,
  CompletionEvidenceValidation,
  CompletionRealityValidation,
  CompletionTruthEvaluation,
  FalseCompletionDetection,
  UnifiedCompletionTruthAuthority,
} from './completion-truth-types.js';

const MAX_CACHE_ENTRIES = 256;

let cacheHits = 0;
let cacheMisses = 0;
let cacheEvictions = 0;

const claimCache = new Map<string, CompletionClaimAnalysis[]>();
const evidenceCache = new Map<string, CompletionEvidenceValidation>();
const realityCache = new Map<string, CompletionRealityValidation>();
const falseCompletionCache = new Map<string, FalseCompletionDetection>();
const consistencyCache = new Map<string, CompletionConsistencyScores>();
const authorityCache = new Map<string, UnifiedCompletionTruthAuthority>();
const evaluationCache = new Map<string, CompletionTruthEvaluation>();

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

export function getCachedClaimAnalysis(key: string): CompletionClaimAnalysis[] | undefined {
  return getCached(claimCache, key);
}

export function setCachedClaimAnalysis(key: string, value: CompletionClaimAnalysis[]): void {
  setCached(claimCache, key, value);
}

export function getCachedEvidenceValidation(key: string): CompletionEvidenceValidation | undefined {
  return getCached(evidenceCache, key);
}

export function setCachedEvidenceValidation(key: string, value: CompletionEvidenceValidation): void {
  setCached(evidenceCache, key, value);
}

export function getCachedRealityValidation(key: string): CompletionRealityValidation | undefined {
  return getCached(realityCache, key);
}

export function setCachedRealityValidation(key: string, value: CompletionRealityValidation): void {
  setCached(realityCache, key, value);
}

export function getCachedFalseCompletion(key: string): FalseCompletionDetection | undefined {
  return getCached(falseCompletionCache, key);
}

export function setCachedFalseCompletion(key: string, value: FalseCompletionDetection): void {
  setCached(falseCompletionCache, key, value);
}

export function getCachedConsistency(key: string): CompletionConsistencyScores | undefined {
  return getCached(consistencyCache, key);
}

export function setCachedConsistency(key: string, value: CompletionConsistencyScores): void {
  setCached(consistencyCache, key, value);
}

export function getCachedAuthority(key: string): UnifiedCompletionTruthAuthority | undefined {
  return getCached(authorityCache, key);
}

export function setCachedAuthority(key: string, value: UnifiedCompletionTruthAuthority): void {
  setCached(authorityCache, key, value);
}

export function getCachedEvaluation(key: string): CompletionTruthEvaluation | undefined {
  return getCached(evaluationCache, key);
}

export function setCachedEvaluation(key: string, value: CompletionTruthEvaluation): void {
  setCached(evaluationCache, key, value);
}

export function getCompletionTruthCacheStats(): { hits: number; misses: number; evictions: number } {
  return { hits: cacheHits, misses: cacheMisses, evictions: cacheEvictions };
}

export function resetCompletionTruthCacheForTests(): void {
  claimCache.clear();
  evidenceCache.clear();
  realityCache.clear();
  falseCompletionCache.clear();
  consistencyCache.clear();
  authorityCache.clear();
  evaluationCache.clear();
  cacheHits = 0;
  cacheMisses = 0;
  cacheEvictions = 0;
}
