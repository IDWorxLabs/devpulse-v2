/**
 * Security Hardening — bounded lookup cache.
 */

import type {
  AccessControlReadinessAnalysis,
  SecretExposureAnalysis,
  SecurityBoundaryAnalysis,
  SecurityHardeningEvaluation,
  UnifiedSecurityHardeningAuthority,
  UnsafeCapabilityDetection,
  WorkspaceIsolationAnalysis,
} from './security-hardening-types.js';

const MAX_CACHE_ENTRIES = 256;

let cacheHits = 0;
let cacheMisses = 0;
let cacheEvictions = 0;

const boundaryCache = new Map<string, SecurityBoundaryAnalysis>();
const exposureCache = new Map<string, SecretExposureAnalysis>();
const unsafeCapabilityCache = new Map<string, UnsafeCapabilityDetection>();
const accessControlCache = new Map<string, AccessControlReadinessAnalysis>();
const isolationCache = new Map<string, WorkspaceIsolationAnalysis>();
const authorityCache = new Map<string, UnifiedSecurityHardeningAuthority>();
const evaluationCache = new Map<string, SecurityHardeningEvaluation>();

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

export function getCachedBoundaryAnalysis(key: string): SecurityBoundaryAnalysis | undefined {
  return getCached(boundaryCache, key);
}

export function setCachedBoundaryAnalysis(key: string, value: SecurityBoundaryAnalysis): void {
  setCached(boundaryCache, key, value);
}

export function getCachedExposureAnalysis(key: string): SecretExposureAnalysis | undefined {
  return getCached(exposureCache, key);
}

export function setCachedExposureAnalysis(key: string, value: SecretExposureAnalysis): void {
  setCached(exposureCache, key, value);
}

export function getCachedUnsafeCapabilityDetection(key: string): UnsafeCapabilityDetection | undefined {
  return getCached(unsafeCapabilityCache, key);
}

export function setCachedUnsafeCapabilityDetection(key: string, value: UnsafeCapabilityDetection): void {
  setCached(unsafeCapabilityCache, key, value);
}

export function getCachedAccessControlAnalysis(key: string): AccessControlReadinessAnalysis | undefined {
  return getCached(accessControlCache, key);
}

export function setCachedAccessControlAnalysis(key: string, value: AccessControlReadinessAnalysis): void {
  setCached(accessControlCache, key, value);
}

export function getCachedIsolationAnalysis(key: string): WorkspaceIsolationAnalysis | undefined {
  return getCached(isolationCache, key);
}

export function setCachedIsolationAnalysis(key: string, value: WorkspaceIsolationAnalysis): void {
  setCached(isolationCache, key, value);
}

export function getCachedSecurityAuthority(key: string): UnifiedSecurityHardeningAuthority | undefined {
  return getCached(authorityCache, key);
}

export function setCachedSecurityAuthority(key: string, value: UnifiedSecurityHardeningAuthority): void {
  setCached(authorityCache, key, value);
}

export function getCachedSecurityEvaluation(key: string): SecurityHardeningEvaluation | undefined {
  return getCached(evaluationCache, key);
}

export function setCachedSecurityEvaluation(key: string, value: SecurityHardeningEvaluation): void {
  setCached(evaluationCache, key, value);
}

export function getSecurityHardeningCacheStats(): { hits: number; misses: number; evictions: number } {
  return { hits: cacheHits, misses: cacheMisses, evictions: cacheEvictions };
}

export function resetSecurityHardeningCacheForTests(): void {
  boundaryCache.clear();
  exposureCache.clear();
  unsafeCapabilityCache.clear();
  accessControlCache.clear();
  isolationCache.clear();
  authorityCache.clear();
  evaluationCache.clear();
  cacheHits = 0;
  cacheMisses = 0;
  cacheEvictions = 0;
}
