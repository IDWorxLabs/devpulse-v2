/**
 * First-Impression Judge — bounded lookup cache.
 */

import type {
  ActionReadinessAnalysis,
  EmotionalConfidenceAnalysis,
  FirstImpressionAuthority,
  FirstImpressionEvaluation,
  FirstVisitContext,
  FounderUsefulnessAnalysis,
  IntelligencePerceptionAnalysis,
  LaunchReadinessPerceptionAnalysis,
  PremiumFeelAnalysis,
  ProductClarityAnalysis,
  ProductIdentityAnalysis,
  TrustworthinessPerceptionAnalysis,
  VisualConfidenceAnalysis,
} from './first-impression-types.js';

const MAX_CACHE_ENTRIES = 256;

let cacheHits = 0;
let cacheMisses = 0;
let cacheEvictions = 0;
let sourceTextCacheHits = 0;

const contextCache = new Map<string, FirstVisitContext>();
const clarityCache = new Map<string, ProductClarityAnalysis>();
const intelligenceCache = new Map<string, IntelligencePerceptionAnalysis>();
const trustCache = new Map<string, TrustworthinessPerceptionAnalysis>();
const visualCache = new Map<string, VisualConfidenceAnalysis>();
const founderCache = new Map<string, FounderUsefulnessAnalysis>();
const premiumCache = new Map<string, PremiumFeelAnalysis>();
const actionCache = new Map<string, ActionReadinessAnalysis>();
const identityCache = new Map<string, ProductIdentityAnalysis>();
const emotionalCache = new Map<string, EmotionalConfidenceAnalysis>();
const launchCache = new Map<string, LaunchReadinessPerceptionAnalysis>();
const authorityCache = new Map<string, FirstImpressionAuthority>();
const evaluationCache = new Map<string, FirstImpressionEvaluation>();
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

export function getCachedFirstVisitContext(key: string): FirstVisitContext | undefined {
  return getCached(contextCache, key);
}

export function setCachedFirstVisitContext(key: string, value: FirstVisitContext): void {
  setCached(contextCache, key, value);
}

export function getCachedProductClarity(key: string): ProductClarityAnalysis | undefined {
  return getCached(clarityCache, key);
}

export function setCachedProductClarity(key: string, value: ProductClarityAnalysis): void {
  setCached(clarityCache, key, value);
}

export function getCachedIntelligencePerception(key: string): IntelligencePerceptionAnalysis | undefined {
  return getCached(intelligenceCache, key);
}

export function setCachedIntelligencePerception(key: string, value: IntelligencePerceptionAnalysis): void {
  setCached(intelligenceCache, key, value);
}

export function getCachedTrustworthinessPerception(key: string): TrustworthinessPerceptionAnalysis | undefined {
  return getCached(trustCache, key);
}

export function setCachedTrustworthinessPerception(key: string, value: TrustworthinessPerceptionAnalysis): void {
  setCached(trustCache, key, value);
}

export function getCachedVisualConfidence(key: string): VisualConfidenceAnalysis | undefined {
  return getCached(visualCache, key);
}

export function setCachedVisualConfidence(key: string, value: VisualConfidenceAnalysis): void {
  setCached(visualCache, key, value);
}

export function getCachedFounderUsefulness(key: string): FounderUsefulnessAnalysis | undefined {
  return getCached(founderCache, key);
}

export function setCachedFounderUsefulness(key: string, value: FounderUsefulnessAnalysis): void {
  setCached(founderCache, key, value);
}

export function getCachedPremiumFeel(key: string): PremiumFeelAnalysis | undefined {
  return getCached(premiumCache, key);
}

export function setCachedPremiumFeel(key: string, value: PremiumFeelAnalysis): void {
  setCached(premiumCache, key, value);
}

export function getCachedActionReadiness(key: string): ActionReadinessAnalysis | undefined {
  return getCached(actionCache, key);
}

export function setCachedActionReadiness(key: string, value: ActionReadinessAnalysis): void {
  setCached(actionCache, key, value);
}

export function getCachedProductIdentity(key: string): ProductIdentityAnalysis | undefined {
  return getCached(identityCache, key);
}

export function setCachedProductIdentity(key: string, value: ProductIdentityAnalysis): void {
  setCached(identityCache, key, value);
}

export function getCachedEmotionalConfidence(key: string): EmotionalConfidenceAnalysis | undefined {
  return getCached(emotionalCache, key);
}

export function setCachedEmotionalConfidence(key: string, value: EmotionalConfidenceAnalysis): void {
  setCached(emotionalCache, key, value);
}

export function getCachedLaunchReadinessPerception(key: string): LaunchReadinessPerceptionAnalysis | undefined {
  return getCached(launchCache, key);
}

export function setCachedLaunchReadinessPerception(key: string, value: LaunchReadinessPerceptionAnalysis): void {
  setCached(launchCache, key, value);
}

export function getCachedFirstImpressionAuthority(key: string): FirstImpressionAuthority | undefined {
  return getCached(authorityCache, key);
}

export function setCachedFirstImpressionAuthority(key: string, value: FirstImpressionAuthority): void {
  setCached(authorityCache, key, value);
}

export function getCachedFirstImpressionEvaluation(key: string): FirstImpressionEvaluation | undefined {
  return getCached(evaluationCache, key);
}

export function setCachedFirstImpressionEvaluation(key: string, value: FirstImpressionEvaluation): void {
  setCached(evaluationCache, key, value);
}

export function getFirstImpressionCacheStats(): {
  hits: number;
  misses: number;
  evictions: number;
  sourceTextCacheHits: number;
} {
  return { hits: cacheHits, misses: cacheMisses, evictions: cacheEvictions, sourceTextCacheHits };
}

export function resetFirstImpressionCacheForTests(): void {
  contextCache.clear();
  clarityCache.clear();
  intelligenceCache.clear();
  trustCache.clear();
  visualCache.clear();
  founderCache.clear();
  premiumCache.clear();
  actionCache.clear();
  identityCache.clear();
  emotionalCache.clear();
  launchCache.clear();
  authorityCache.clear();
  evaluationCache.clear();
  sourceTextCache.clear();
  cacheHits = 0;
  cacheMisses = 0;
  cacheEvictions = 0;
  sourceTextCacheHits = 0;
}
