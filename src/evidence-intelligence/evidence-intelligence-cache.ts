/**
 * Evidence Intelligence — bounded lookup cache.
 */

import type {
  EvidenceIntelligenceEvaluation,
  EvidenceQualityScores,
  EvidenceSourceRegistration,
  UnifiedEvidenceAuthority,
} from './evidence-intelligence-types.js';

let cacheHits = 0;
let cacheMisses = 0;

const sourceCache = new Map<string, EvidenceSourceRegistration>();
const qualityCache = new Map<string, EvidenceQualityScores>();
const authorityCache = new Map<string, UnifiedEvidenceAuthority>();
const evaluationCache = new Map<string, EvidenceIntelligenceEvaluation>();

const MAX_CACHE_ENTRIES = 256;

function trimCache<T>(map: Map<string, T>): void {
  if (map.size <= MAX_CACHE_ENTRIES) return;
  const keys = [...map.keys()];
  for (let i = 0; i < keys.length - MAX_CACHE_ENTRIES; i++) {
    map.delete(keys[i]);
  }
}

export function getCachedEvidenceSource(key: string): EvidenceSourceRegistration | undefined {
  const cached = sourceCache.get(key);
  if (cached) { cacheHits += 1; return cached; }
  cacheMisses += 1;
  return undefined;
}

export function setCachedEvidenceSource(key: string, value: EvidenceSourceRegistration): void {
  sourceCache.set(key, value);
  trimCache(sourceCache);
}

export function getCachedQualityAnalysis(key: string): EvidenceQualityScores | undefined {
  const cached = qualityCache.get(key);
  if (cached) { cacheHits += 1; return cached; }
  cacheMisses += 1;
  return undefined;
}

export function setCachedQualityAnalysis(key: string, value: EvidenceQualityScores): void {
  qualityCache.set(key, value);
  trimCache(qualityCache);
}

export function getCachedEvidenceAuthority(key: string): UnifiedEvidenceAuthority | undefined {
  const cached = authorityCache.get(key);
  if (cached) { cacheHits += 1; return cached; }
  cacheMisses += 1;
  return undefined;
}

export function setCachedEvidenceAuthority(key: string, value: UnifiedEvidenceAuthority): void {
  authorityCache.set(key, value);
  trimCache(authorityCache);
}

export function getCachedEvidenceEvaluation(key: string): EvidenceIntelligenceEvaluation | undefined {
  const cached = evaluationCache.get(key);
  if (cached) { cacheHits += 1; return cached; }
  cacheMisses += 1;
  return undefined;
}

export function setCachedEvidenceEvaluation(key: string, value: EvidenceIntelligenceEvaluation): void {
  evaluationCache.set(key, value);
  trimCache(evaluationCache);
}

export function getEvidenceIntelligenceCacheStats(): { hits: number; misses: number } {
  return { hits: cacheHits, misses: cacheMisses };
}

export function resetEvidenceIntelligenceCacheForTests(): void {
  sourceCache.clear();
  qualityCache.clear();
  authorityCache.clear();
  evaluationCache.clear();
  cacheHits = 0;
  cacheMisses = 0;
}
