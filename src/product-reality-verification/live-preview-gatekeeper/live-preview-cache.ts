/**
 * Live Preview Gatekeeper — bounded lookup cache.
 */

import type {
  FounderVerificationSupportAnalysis,
  LivePreviewAuthority,
  LivePreviewEvaluation,
  PreviewContext,
  PreviewMisleadingRiskAnalysis,
  PreviewNextActionAnalysis,
  PreviewReportConnectionAnalysis,
  PreviewStateMeaningfulnessAnalysis,
  PreviewUnderstandabilityAnalysis,
  PreviewUnavailableHonestyAnalysis,
  PreviewVisibilityAnalysis,
  ProductReadinessPreviewAnalysis,
  ResponsivePreviewSupportAnalysis,
} from './live-preview-types.js';

const MAX_CACHE_ENTRIES = 256;

let cacheHits = 0;
let cacheMisses = 0;
let cacheEvictions = 0;
let sourceTextCacheHits = 0;

const contextCache = new Map<string, PreviewContext>();
const visibilityCache = new Map<string, PreviewVisibilityAnalysis>();
const understandabilityCache = new Map<string, PreviewUnderstandabilityAnalysis>();
const meaningfulnessCache = new Map<string, PreviewStateMeaningfulnessAnalysis>();
const founderCache = new Map<string, FounderVerificationSupportAnalysis>();
const responsiveCache = new Map<string, ResponsivePreviewSupportAnalysis>();
const unavailableCache = new Map<string, PreviewUnavailableHonestyAnalysis>();
const misleadingCache = new Map<string, PreviewMisleadingRiskAnalysis>();
const nextActionCache = new Map<string, PreviewNextActionAnalysis>();
const reportConnectionCache = new Map<string, PreviewReportConnectionAnalysis>();
const readinessCache = new Map<string, ProductReadinessPreviewAnalysis>();
const authorityCache = new Map<string, LivePreviewAuthority>();
const evaluationCache = new Map<string, LivePreviewEvaluation>();
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

export function getCachedPreviewContext(key: string): PreviewContext | undefined {
  return getCached(contextCache, key);
}

export function setCachedPreviewContext(key: string, value: PreviewContext): void {
  setCached(contextCache, key, value);
}

export function getCachedPreviewVisibility(key: string): PreviewVisibilityAnalysis | undefined {
  return getCached(visibilityCache, key);
}

export function setCachedPreviewVisibility(key: string, value: PreviewVisibilityAnalysis): void {
  setCached(visibilityCache, key, value);
}

export function getCachedPreviewUnderstandability(key: string): PreviewUnderstandabilityAnalysis | undefined {
  return getCached(understandabilityCache, key);
}

export function setCachedPreviewUnderstandability(key: string, value: PreviewUnderstandabilityAnalysis): void {
  setCached(understandabilityCache, key, value);
}

export function getCachedPreviewMeaningfulness(key: string): PreviewStateMeaningfulnessAnalysis | undefined {
  return getCached(meaningfulnessCache, key);
}

export function setCachedPreviewMeaningfulness(key: string, value: PreviewStateMeaningfulnessAnalysis): void {
  setCached(meaningfulnessCache, key, value);
}

export function getCachedFounderVerificationSupport(key: string): FounderVerificationSupportAnalysis | undefined {
  return getCached(founderCache, key);
}

export function setCachedFounderVerificationSupport(key: string, value: FounderVerificationSupportAnalysis): void {
  setCached(founderCache, key, value);
}

export function getCachedResponsivePreviewSupport(key: string): ResponsivePreviewSupportAnalysis | undefined {
  return getCached(responsiveCache, key);
}

export function setCachedResponsivePreviewSupport(key: string, value: ResponsivePreviewSupportAnalysis): void {
  setCached(responsiveCache, key, value);
}

export function getCachedPreviewUnavailableHonesty(key: string): PreviewUnavailableHonestyAnalysis | undefined {
  return getCached(unavailableCache, key);
}

export function setCachedPreviewUnavailableHonesty(key: string, value: PreviewUnavailableHonestyAnalysis): void {
  setCached(unavailableCache, key, value);
}

export function getCachedPreviewMisleadingRisk(key: string): PreviewMisleadingRiskAnalysis | undefined {
  return getCached(misleadingCache, key);
}

export function setCachedPreviewMisleadingRisk(key: string, value: PreviewMisleadingRiskAnalysis): void {
  setCached(misleadingCache, key, value);
}

export function getCachedPreviewNextAction(key: string): PreviewNextActionAnalysis | undefined {
  return getCached(nextActionCache, key);
}

export function setCachedPreviewNextAction(key: string, value: PreviewNextActionAnalysis): void {
  setCached(nextActionCache, key, value);
}

export function getCachedPreviewReportConnection(key: string): PreviewReportConnectionAnalysis | undefined {
  return getCached(reportConnectionCache, key);
}

export function setCachedPreviewReportConnection(key: string, value: PreviewReportConnectionAnalysis): void {
  setCached(reportConnectionCache, key, value);
}

export function getCachedProductReadinessPreview(key: string): ProductReadinessPreviewAnalysis | undefined {
  return getCached(readinessCache, key);
}

export function setCachedProductReadinessPreview(key: string, value: ProductReadinessPreviewAnalysis): void {
  setCached(readinessCache, key, value);
}

export function getCachedLivePreviewAuthority(key: string): LivePreviewAuthority | undefined {
  return getCached(authorityCache, key);
}

export function setCachedLivePreviewAuthority(key: string, value: LivePreviewAuthority): void {
  setCached(authorityCache, key, value);
}

export function getCachedLivePreviewEvaluation(key: string): LivePreviewEvaluation | undefined {
  return getCached(evaluationCache, key);
}

export function setCachedLivePreviewEvaluation(key: string, value: LivePreviewEvaluation): void {
  setCached(evaluationCache, key, value);
}

export function getLivePreviewCacheStats(): {
  hits: number;
  misses: number;
  evictions: number;
  sourceTextCacheHits: number;
} {
  return { hits: cacheHits, misses: cacheMisses, evictions: cacheEvictions, sourceTextCacheHits };
}

export function resetLivePreviewCacheForTests(): void {
  contextCache.clear();
  visibilityCache.clear();
  understandabilityCache.clear();
  meaningfulnessCache.clear();
  founderCache.clear();
  responsiveCache.clear();
  unavailableCache.clear();
  misleadingCache.clear();
  nextActionCache.clear();
  reportConnectionCache.clear();
  readinessCache.clear();
  authorityCache.clear();
  evaluationCache.clear();
  sourceTextCache.clear();
  cacheHits = 0;
  cacheMisses = 0;
  cacheEvictions = 0;
  sourceTextCacheHits = 0;
}
