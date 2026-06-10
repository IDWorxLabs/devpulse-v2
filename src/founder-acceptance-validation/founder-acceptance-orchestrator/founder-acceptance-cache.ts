/**
 * Founder Acceptance Orchestrator — bounded lookup cache.
 */

import type {
  AcceptanceAnalyzerResult,
  AcceptanceGapAnalysis,
  FounderAcceptanceAggregate,
  FounderAcceptanceAuthority,
  FounderAcceptanceEvaluation,
  FounderAcceptanceRoadmap,
  AcceptanceBlockerAnalysis,
  AuthorityConflictAnalysis,
  FinalVerdict,
} from './founder-acceptance-orchestrator-types.js';

const MAX_CACHE_ENTRIES = 256;

let cacheHits = 0;
let cacheMisses = 0;
let cacheEvictions = 0;
let sourceTextCacheHits = 0;

const aggregateCache = new Map<string, FounderAcceptanceAggregate>();
const analyzerCache = new Map<string, AcceptanceAnalyzerResult>();
const conflictCache = new Map<string, AuthorityConflictAnalysis>();
const blockerCache = new Map<string, AcceptanceBlockerAnalysis>();
const gapAnalysisCache = new Map<string, AcceptanceGapAnalysis>();
const roadmapCache = new Map<string, FounderAcceptanceRoadmap>();
const verdictCache = new Map<string, FinalVerdict>();
const authorityCache = new Map<string, FounderAcceptanceAuthority>();
const evaluationCache = new Map<string, FounderAcceptanceEvaluation>();
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

export function getCachedAcceptanceAggregate(key: string): FounderAcceptanceAggregate | undefined {
  return getCached(aggregateCache, key);
}

export function setCachedAcceptanceAggregate(key: string, value: FounderAcceptanceAggregate): void {
  setCached(aggregateCache, key, value);
}

export function getCachedAnalyzerResult(key: string): AcceptanceAnalyzerResult | undefined {
  return getCached(analyzerCache, key);
}

export function setCachedAnalyzerResult(key: string, value: AcceptanceAnalyzerResult): void {
  setCached(analyzerCache, key, value);
}

export function getCachedAuthorityConflictAnalysis(key: string): AuthorityConflictAnalysis | undefined {
  return getCached(conflictCache, key);
}

export function setCachedAuthorityConflictAnalysis(key: string, value: AuthorityConflictAnalysis): void {
  setCached(conflictCache, key, value);
}

export function getCachedAcceptanceBlockerAnalysis(key: string): AcceptanceBlockerAnalysis | undefined {
  return getCached(blockerCache, key);
}

export function setCachedAcceptanceBlockerAnalysis(key: string, value: AcceptanceBlockerAnalysis): void {
  setCached(blockerCache, key, value);
}

export function getCachedAcceptanceGapAnalysis(key: string): AcceptanceGapAnalysis | undefined {
  return getCached(gapAnalysisCache, key);
}

export function setCachedAcceptanceGapAnalysis(key: string, value: AcceptanceGapAnalysis): void {
  setCached(gapAnalysisCache, key, value);
}

export function getCachedAcceptanceRoadmap(key: string): FounderAcceptanceRoadmap | undefined {
  return getCached(roadmapCache, key);
}

export function setCachedAcceptanceRoadmap(key: string, value: FounderAcceptanceRoadmap): void {
  setCached(roadmapCache, key, value);
}

export function getCachedFinalVerdict(key: string): FinalVerdict | undefined {
  return getCached(verdictCache, key);
}

export function setCachedFinalVerdict(key: string, value: FinalVerdict): void {
  setCached(verdictCache, key, value);
}

export function getCachedFounderAcceptanceAuthority(key: string): FounderAcceptanceAuthority | undefined {
  return getCached(authorityCache, key);
}

export function setCachedFounderAcceptanceAuthority(key: string, value: FounderAcceptanceAuthority): void {
  setCached(authorityCache, key, value);
}

export function getCachedFounderAcceptanceEvaluation(key: string): FounderAcceptanceEvaluation | undefined {
  return getCached(evaluationCache, key);
}

export function setCachedFounderAcceptanceEvaluation(key: string, value: FounderAcceptanceEvaluation): void {
  setCached(evaluationCache, key, value);
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
  aggregateCache.clear();
  analyzerCache.clear();
  conflictCache.clear();
  blockerCache.clear();
  gapAnalysisCache.clear();
  roadmapCache.clear();
  verdictCache.clear();
  authorityCache.clear();
  evaluationCache.clear();
  sourceTextCache.clear();
  cacheHits = 0;
  cacheMisses = 0;
  cacheEvictions = 0;
  sourceTextCacheHits = 0;
}
