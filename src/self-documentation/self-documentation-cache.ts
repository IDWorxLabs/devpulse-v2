/**
 * Self Documentation — bounded lookup cache.
 */

import type {
  AuthorityChainDocumentationAnalysis,
  CapabilityDocumentationAnalysis,
  DependencyDocumentationAnalysis,
  ModuleDocumentationAnalysis,
  SelfDocumentationEvaluation,
  UnifiedSelfDocumentationAuthority,
  ValidationDocumentationAnalysis,
} from './self-documentation-types.js';

const MAX_CACHE_ENTRIES = 256;

let cacheHits = 0;
let cacheMisses = 0;
let cacheEvictions = 0;

const capabilityCache = new Map<string, CapabilityDocumentationAnalysis>();
const moduleCache = new Map<string, ModuleDocumentationAnalysis>();
const dependencyCache = new Map<string, DependencyDocumentationAnalysis>();
const authorityCache = new Map<string, AuthorityChainDocumentationAnalysis>();
const validationCache = new Map<string, ValidationDocumentationAnalysis>();
const unifiedAuthorityCache = new Map<string, UnifiedSelfDocumentationAuthority>();
const evaluationCache = new Map<string, SelfDocumentationEvaluation>();

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

export function getCachedCapabilityAnalysis(key: string): CapabilityDocumentationAnalysis | undefined {
  return getCached(capabilityCache, key);
}

export function setCachedCapabilityAnalysis(key: string, value: CapabilityDocumentationAnalysis): void {
  setCached(capabilityCache, key, value);
}

export function getCachedModuleAnalysis(key: string): ModuleDocumentationAnalysis | undefined {
  return getCached(moduleCache, key);
}

export function setCachedModuleAnalysis(key: string, value: ModuleDocumentationAnalysis): void {
  setCached(moduleCache, key, value);
}

export function getCachedDependencyAnalysis(key: string): DependencyDocumentationAnalysis | undefined {
  return getCached(dependencyCache, key);
}

export function setCachedDependencyAnalysis(key: string, value: DependencyDocumentationAnalysis): void {
  setCached(dependencyCache, key, value);
}

export function getCachedAuthorityChainAnalysis(key: string): AuthorityChainDocumentationAnalysis | undefined {
  return getCached(authorityCache, key);
}

export function setCachedAuthorityChainAnalysis(key: string, value: AuthorityChainDocumentationAnalysis): void {
  setCached(authorityCache, key, value);
}

export function getCachedValidationAnalysis(key: string): ValidationDocumentationAnalysis | undefined {
  return getCached(validationCache, key);
}

export function setCachedValidationAnalysis(key: string, value: ValidationDocumentationAnalysis): void {
  setCached(validationCache, key, value);
}

export function getCachedSelfDocumentationAuthority(key: string): UnifiedSelfDocumentationAuthority | undefined {
  return getCached(unifiedAuthorityCache, key);
}

export function setCachedSelfDocumentationAuthority(key: string, value: UnifiedSelfDocumentationAuthority): void {
  setCached(unifiedAuthorityCache, key, value);
}

export function getCachedSelfDocumentationEvaluation(key: string): SelfDocumentationEvaluation | undefined {
  return getCached(evaluationCache, key);
}

export function setCachedSelfDocumentationEvaluation(key: string, value: SelfDocumentationEvaluation): void {
  setCached(evaluationCache, key, value);
}

export function getSelfDocumentationCacheStats(): { hits: number; misses: number; evictions: number } {
  return { hits: cacheHits, misses: cacheMisses, evictions: cacheEvictions };
}

export function resetSelfDocumentationCacheForTests(): void {
  capabilityCache.clear();
  moduleCache.clear();
  dependencyCache.clear();
  authorityCache.clear();
  validationCache.clear();
  unifiedAuthorityCache.clear();
  evaluationCache.clear();
  cacheHits = 0;
  cacheMisses = 0;
  cacheEvictions = 0;
}
