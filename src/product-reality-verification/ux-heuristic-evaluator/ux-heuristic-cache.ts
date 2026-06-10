/**
 * UX Heuristic Evaluator — bounded lookup cache.
 */

import type {
  ActionClarityAnalysis,
  CognitiveLoadAnalysis,
  ErrorPreventionAnalysis,
  FeatureDiscoverabilityAnalysis,
  FeedbackQualityAnalysis,
  FounderUsabilityAnalysis,
  IntelligenceVisibilityAnalysis,
  NavigationClarityAnalysis,
  SystemStatusVisibilityAnalysis,
  TrustClarityAnalysis,
  UXHeuristicAuthority,
  UXHeuristicEvaluation,
  UserControlAnalysis,
  WorkflowContinuityAnalysis,
} from './ux-heuristic-types.js';

const MAX_CACHE_ENTRIES = 256;

let cacheHits = 0;
let cacheMisses = 0;
let cacheEvictions = 0;

const navigationCache = new Map<string, NavigationClarityAnalysis>();
const discoverabilityCache = new Map<string, FeatureDiscoverabilityAnalysis>();
const actionCache = new Map<string, ActionClarityAnalysis>();
const feedbackCache = new Map<string, FeedbackQualityAnalysis>();
const statusCache = new Map<string, SystemStatusVisibilityAnalysis>();
const errorPreventionCache = new Map<string, ErrorPreventionAnalysis>();
const userControlCache = new Map<string, UserControlAnalysis>();
const cognitiveCache = new Map<string, CognitiveLoadAnalysis>();
const trustCache = new Map<string, TrustClarityAnalysis>();
const workflowCache = new Map<string, WorkflowContinuityAnalysis>();
const intelligenceCache = new Map<string, IntelligenceVisibilityAnalysis>();
const founderCache = new Map<string, FounderUsabilityAnalysis>();
const authorityCache = new Map<string, UXHeuristicAuthority>();
const evaluationCache = new Map<string, UXHeuristicEvaluation>();
const sourceTextCache = new Map<string, string>();

let sourceTextCacheHits = 0;

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

export function getCachedNavigationClarity(key: string): NavigationClarityAnalysis | undefined {
  return getCached(navigationCache, key);
}

export function setCachedNavigationClarity(key: string, value: NavigationClarityAnalysis): void {
  setCached(navigationCache, key, value);
}

export function getCachedFeatureDiscoverability(key: string): FeatureDiscoverabilityAnalysis | undefined {
  return getCached(discoverabilityCache, key);
}

export function setCachedFeatureDiscoverability(key: string, value: FeatureDiscoverabilityAnalysis): void {
  setCached(discoverabilityCache, key, value);
}

export function getCachedActionClarity(key: string): ActionClarityAnalysis | undefined {
  return getCached(actionCache, key);
}

export function setCachedActionClarity(key: string, value: ActionClarityAnalysis): void {
  setCached(actionCache, key, value);
}

export function getCachedFeedbackQuality(key: string): FeedbackQualityAnalysis | undefined {
  return getCached(feedbackCache, key);
}

export function setCachedFeedbackQuality(key: string, value: FeedbackQualityAnalysis): void {
  setCached(feedbackCache, key, value);
}

export function getCachedSystemStatusVisibility(key: string): SystemStatusVisibilityAnalysis | undefined {
  return getCached(statusCache, key);
}

export function setCachedSystemStatusVisibility(key: string, value: SystemStatusVisibilityAnalysis): void {
  setCached(statusCache, key, value);
}

export function getCachedErrorPrevention(key: string): ErrorPreventionAnalysis | undefined {
  return getCached(errorPreventionCache, key);
}

export function setCachedErrorPrevention(key: string, value: ErrorPreventionAnalysis): void {
  setCached(errorPreventionCache, key, value);
}

export function getCachedUserControl(key: string): UserControlAnalysis | undefined {
  return getCached(userControlCache, key);
}

export function setCachedUserControl(key: string, value: UserControlAnalysis): void {
  setCached(userControlCache, key, value);
}

export function getCachedCognitiveLoad(key: string): CognitiveLoadAnalysis | undefined {
  return getCached(cognitiveCache, key);
}

export function setCachedCognitiveLoad(key: string, value: CognitiveLoadAnalysis): void {
  setCached(cognitiveCache, key, value);
}

export function getCachedTrustClarity(key: string): TrustClarityAnalysis | undefined {
  return getCached(trustCache, key);
}

export function setCachedTrustClarity(key: string, value: TrustClarityAnalysis): void {
  setCached(trustCache, key, value);
}

export function getCachedWorkflowContinuity(key: string): WorkflowContinuityAnalysis | undefined {
  return getCached(workflowCache, key);
}

export function setCachedWorkflowContinuity(key: string, value: WorkflowContinuityAnalysis): void {
  setCached(workflowCache, key, value);
}

export function getCachedIntelligenceVisibility(key: string): IntelligenceVisibilityAnalysis | undefined {
  return getCached(intelligenceCache, key);
}

export function setCachedIntelligenceVisibility(key: string, value: IntelligenceVisibilityAnalysis): void {
  setCached(intelligenceCache, key, value);
}

export function getCachedFounderUsability(key: string): FounderUsabilityAnalysis | undefined {
  return getCached(founderCache, key);
}

export function setCachedFounderUsability(key: string, value: FounderUsabilityAnalysis): void {
  setCached(founderCache, key, value);
}

export function getCachedUXHeuristicAuthority(key: string): UXHeuristicAuthority | undefined {
  return getCached(authorityCache, key);
}

export function setCachedUXHeuristicAuthority(key: string, value: UXHeuristicAuthority): void {
  setCached(authorityCache, key, value);
}

export function getCachedUXHeuristicEvaluation(key: string): UXHeuristicEvaluation | undefined {
  return getCached(evaluationCache, key);
}

export function setCachedUXHeuristicEvaluation(key: string, value: UXHeuristicEvaluation): void {
  setCached(evaluationCache, key, value);
}

export function getUXHeuristicCacheStats(): {
  hits: number;
  misses: number;
  evictions: number;
  sourceTextCacheHits: number;
} {
  return { hits: cacheHits, misses: cacheMisses, evictions: cacheEvictions, sourceTextCacheHits };
}

export function resetUXHeuristicCacheForTests(): void {
  navigationCache.clear();
  discoverabilityCache.clear();
  actionCache.clear();
  feedbackCache.clear();
  statusCache.clear();
  errorPreventionCache.clear();
  userControlCache.clear();
  cognitiveCache.clear();
  trustCache.clear();
  workflowCache.clear();
  intelligenceCache.clear();
  founderCache.clear();
  authorityCache.clear();
  evaluationCache.clear();
  sourceTextCache.clear();
  cacheHits = 0;
  cacheMisses = 0;
  cacheEvictions = 0;
  sourceTextCacheHits = 0;
}
