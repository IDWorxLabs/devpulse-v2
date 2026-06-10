/**
 * User Guides — bounded lookup cache.
 */

import type {
  FeatureDiscoveryGuideAnalysis,
  OnboardingGuideAnalysis,
  ResultsInterpretationGuideAnalysis,
  SafetyGuideAnalysis,
  UnifiedUserGuidesAuthority,
  UserGuidesEvaluation,
  WorkflowGuideAnalysis,
} from './user-guides-types.js';

const MAX_CACHE_ENTRIES = 256;

let cacheHits = 0;
let cacheMisses = 0;
let cacheEvictions = 0;

const onboardingCache = new Map<string, OnboardingGuideAnalysis>();
const workflowCache = new Map<string, WorkflowGuideAnalysis>();
const featureCache = new Map<string, FeatureDiscoveryGuideAnalysis>();
const safetyCache = new Map<string, SafetyGuideAnalysis>();
const interpretationCache = new Map<string, ResultsInterpretationGuideAnalysis>();
const authorityCache = new Map<string, UnifiedUserGuidesAuthority>();
const evaluationCache = new Map<string, UserGuidesEvaluation>();

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

export function getCachedOnboardingAnalysis(key: string): OnboardingGuideAnalysis | undefined {
  return getCached(onboardingCache, key);
}

export function setCachedOnboardingAnalysis(key: string, value: OnboardingGuideAnalysis): void {
  setCached(onboardingCache, key, value);
}

export function getCachedWorkflowAnalysis(key: string): WorkflowGuideAnalysis | undefined {
  return getCached(workflowCache, key);
}

export function setCachedWorkflowAnalysis(key: string, value: WorkflowGuideAnalysis): void {
  setCached(workflowCache, key, value);
}

export function getCachedFeatureAnalysis(key: string): FeatureDiscoveryGuideAnalysis | undefined {
  return getCached(featureCache, key);
}

export function setCachedFeatureAnalysis(key: string, value: FeatureDiscoveryGuideAnalysis): void {
  setCached(featureCache, key, value);
}

export function getCachedSafetyAnalysis(key: string): SafetyGuideAnalysis | undefined {
  return getCached(safetyCache, key);
}

export function setCachedSafetyAnalysis(key: string, value: SafetyGuideAnalysis): void {
  setCached(safetyCache, key, value);
}

export function getCachedInterpretationAnalysis(key: string): ResultsInterpretationGuideAnalysis | undefined {
  return getCached(interpretationCache, key);
}

export function setCachedInterpretationAnalysis(key: string, value: ResultsInterpretationGuideAnalysis): void {
  setCached(interpretationCache, key, value);
}

export function getCachedUserGuidesAuthority(key: string): UnifiedUserGuidesAuthority | undefined {
  return getCached(authorityCache, key);
}

export function setCachedUserGuidesAuthority(key: string, value: UnifiedUserGuidesAuthority): void {
  setCached(authorityCache, key, value);
}

export function getCachedUserGuidesEvaluation(key: string): UserGuidesEvaluation | undefined {
  return getCached(evaluationCache, key);
}

export function setCachedUserGuidesEvaluation(key: string, value: UserGuidesEvaluation): void {
  setCached(evaluationCache, key, value);
}

export function getUserGuidesCacheStats(): { hits: number; misses: number; evictions: number } {
  return { hits: cacheHits, misses: cacheMisses, evictions: cacheEvictions };
}

export function resetUserGuidesCacheForTests(): void {
  onboardingCache.clear();
  workflowCache.clear();
  featureCache.clear();
  safetyCache.clear();
  interpretationCache.clear();
  authorityCache.clear();
  evaluationCache.clear();
  cacheHits = 0;
  cacheMisses = 0;
  cacheEvictions = 0;
}
