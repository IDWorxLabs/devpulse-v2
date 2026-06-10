/**
 * Privacy Hardening — bounded lookup cache.
 */

import type {
  ComplianceReadinessAnalysis,
  DisclosureRiskAnalysis,
  PersonalDataSurfaceAnalysis,
  PrivacyHardeningEvaluation,
  ProjectDataBoundaryAnalysis,
  RedactionReadinessAnalysis,
  RetentionRiskAnalysis,
  UnifiedPrivacyHardeningAuthority,
} from './privacy-hardening-types.js';

const MAX_CACHE_ENTRIES = 256;

let cacheHits = 0;
let cacheMisses = 0;
let cacheEvictions = 0;

const surfaceCache = new Map<string, PersonalDataSurfaceAnalysis>();
const boundaryCache = new Map<string, ProjectDataBoundaryAnalysis>();
const retentionCache = new Map<string, RetentionRiskAnalysis>();
const disclosureCache = new Map<string, DisclosureRiskAnalysis>();
const redactionCache = new Map<string, RedactionReadinessAnalysis>();
const complianceCache = new Map<string, ComplianceReadinessAnalysis>();
const authorityCache = new Map<string, UnifiedPrivacyHardeningAuthority>();
const evaluationCache = new Map<string, PrivacyHardeningEvaluation>();

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

export function getCachedPersonalDataSurfaceAnalysis(key: string): PersonalDataSurfaceAnalysis | undefined {
  return getCached(surfaceCache, key);
}

export function setCachedPersonalDataSurfaceAnalysis(key: string, value: PersonalDataSurfaceAnalysis): void {
  setCached(surfaceCache, key, value);
}

export function getCachedDataBoundaryAnalysis(key: string): ProjectDataBoundaryAnalysis | undefined {
  return getCached(boundaryCache, key);
}

export function setCachedDataBoundaryAnalysis(key: string, value: ProjectDataBoundaryAnalysis): void {
  setCached(boundaryCache, key, value);
}

export function getCachedRetentionAnalysis(key: string): RetentionRiskAnalysis | undefined {
  return getCached(retentionCache, key);
}

export function setCachedRetentionAnalysis(key: string, value: RetentionRiskAnalysis): void {
  setCached(retentionCache, key, value);
}

export function getCachedDisclosureAnalysis(key: string): DisclosureRiskAnalysis | undefined {
  return getCached(disclosureCache, key);
}

export function setCachedDisclosureAnalysis(key: string, value: DisclosureRiskAnalysis): void {
  setCached(disclosureCache, key, value);
}

export function getCachedRedactionReadinessAnalysis(key: string): RedactionReadinessAnalysis | undefined {
  return getCached(redactionCache, key);
}

export function setCachedRedactionReadinessAnalysis(key: string, value: RedactionReadinessAnalysis): void {
  setCached(redactionCache, key, value);
}

export function getCachedComplianceReadinessAnalysis(key: string): ComplianceReadinessAnalysis | undefined {
  return getCached(complianceCache, key);
}

export function setCachedComplianceReadinessAnalysis(key: string, value: ComplianceReadinessAnalysis): void {
  setCached(complianceCache, key, value);
}

export function getCachedPrivacyAuthority(key: string): UnifiedPrivacyHardeningAuthority | undefined {
  return getCached(authorityCache, key);
}

export function setCachedPrivacyAuthority(key: string, value: UnifiedPrivacyHardeningAuthority): void {
  setCached(authorityCache, key, value);
}

export function getCachedPrivacyEvaluation(key: string): PrivacyHardeningEvaluation | undefined {
  return getCached(evaluationCache, key);
}

export function setCachedPrivacyEvaluation(key: string, value: PrivacyHardeningEvaluation): void {
  setCached(evaluationCache, key, value);
}

export function getPrivacyHardeningCacheStats(): { hits: number; misses: number; evictions: number } {
  return { hits: cacheHits, misses: cacheMisses, evictions: cacheEvictions };
}

export function resetPrivacyHardeningCacheForTests(): void {
  surfaceCache.clear();
  boundaryCache.clear();
  retentionCache.clear();
  disclosureCache.clear();
  redactionCache.clear();
  complianceCache.clear();
  authorityCache.clear();
  evaluationCache.clear();
  cacheHits = 0;
  cacheMisses = 0;
  cacheEvictions = 0;
}
