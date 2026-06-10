/**
 * Founder Workflow Validation — bounded lookup cache.
 */

import type {
  FounderWorkflowAuthority,
  FounderWorkflowEvaluation,
  FounderWorkflowRoadmap,
  WorkflowContext,
  WorkflowGapAnalysis,
  WorkflowValidatorResult,
} from './founder-workflow-types.js';

const MAX_CACHE_ENTRIES = 256;

let cacheHits = 0;
let cacheMisses = 0;
let cacheEvictions = 0;
let sourceTextCacheHits = 0;

const contextCache = new Map<string, WorkflowContext>();
const validatorCache = new Map<string, WorkflowValidatorResult>();
const gapAnalysisCache = new Map<string, WorkflowGapAnalysis>();
const roadmapCache = new Map<string, FounderWorkflowRoadmap>();
const authorityCache = new Map<string, FounderWorkflowAuthority>();
const evaluationCache = new Map<string, FounderWorkflowEvaluation>();
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

export function getCachedWorkflowContext(key: string): WorkflowContext | undefined {
  return getCached(contextCache, key);
}

export function setCachedWorkflowContext(key: string, value: WorkflowContext): void {
  setCached(contextCache, key, value);
}

export function getCachedValidatorResult(key: string): WorkflowValidatorResult | undefined {
  return getCached(validatorCache, key);
}

export function setCachedValidatorResult(key: string, value: WorkflowValidatorResult): void {
  setCached(validatorCache, key, value);
}

export function getCachedWorkflowGapAnalysis(key: string): WorkflowGapAnalysis | undefined {
  return getCached(gapAnalysisCache, key);
}

export function setCachedWorkflowGapAnalysis(key: string, value: WorkflowGapAnalysis): void {
  setCached(gapAnalysisCache, key, value);
}

export function getCachedWorkflowRoadmap(key: string): FounderWorkflowRoadmap | undefined {
  return getCached(roadmapCache, key);
}

export function setCachedWorkflowRoadmap(key: string, value: FounderWorkflowRoadmap): void {
  setCached(roadmapCache, key, value);
}

export function getCachedFounderWorkflowAuthority(key: string): FounderWorkflowAuthority | undefined {
  return getCached(authorityCache, key);
}

export function setCachedFounderWorkflowAuthority(key: string, value: FounderWorkflowAuthority): void {
  setCached(authorityCache, key, value);
}

export function getCachedFounderWorkflowEvaluation(key: string): FounderWorkflowEvaluation | undefined {
  return getCached(evaluationCache, key);
}

export function setCachedFounderWorkflowEvaluation(key: string, value: FounderWorkflowEvaluation): void {
  setCached(evaluationCache, key, value);
}

export function getFounderWorkflowCacheStats(): {
  hits: number;
  misses: number;
  evictions: number;
  sourceTextCacheHits: number;
} {
  return { hits: cacheHits, misses: cacheMisses, evictions: cacheEvictions, sourceTextCacheHits };
}

export function resetFounderWorkflowCacheForTests(): void {
  contextCache.clear();
  validatorCache.clear();
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
