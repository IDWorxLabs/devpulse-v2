/**
 * Architecture Documentation — bounded lookup cache.
 */

import type {
  ArchitectureBoundaryAnalysis,
  ArchitectureDocumentationEvaluation,
  AuthorityChainArchitectureAnalysis,
  DependencyGraphAnalysis,
  DomainArchitectureAnalysis,
  IntegrationPointAnalysis,
  UnifiedArchitectureDocumentationAuthority,
} from './architecture-documentation-types.js';

const MAX_CACHE_ENTRIES = 256;

let cacheHits = 0;
let cacheMisses = 0;
let cacheEvictions = 0;

const domainCache = new Map<string, DomainArchitectureAnalysis>();
const dependencyCache = new Map<string, DependencyGraphAnalysis>();
const integrationCache = new Map<string, IntegrationPointAnalysis>();
const boundaryCache = new Map<string, ArchitectureBoundaryAnalysis>();
const authorityChainCache = new Map<string, AuthorityChainArchitectureAnalysis>();
const authorityCache = new Map<string, UnifiedArchitectureDocumentationAuthority>();
const evaluationCache = new Map<string, ArchitectureDocumentationEvaluation>();

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

export function getCachedDomainAnalysis(key: string): DomainArchitectureAnalysis | undefined {
  return getCached(domainCache, key);
}

export function setCachedDomainAnalysis(key: string, value: DomainArchitectureAnalysis): void {
  setCached(domainCache, key, value);
}

export function getCachedDependencyAnalysis(key: string): DependencyGraphAnalysis | undefined {
  return getCached(dependencyCache, key);
}

export function setCachedDependencyAnalysis(key: string, value: DependencyGraphAnalysis): void {
  setCached(dependencyCache, key, value);
}

export function getCachedIntegrationAnalysis(key: string): IntegrationPointAnalysis | undefined {
  return getCached(integrationCache, key);
}

export function setCachedIntegrationAnalysis(key: string, value: IntegrationPointAnalysis): void {
  setCached(integrationCache, key, value);
}

export function getCachedBoundaryAnalysis(key: string): ArchitectureBoundaryAnalysis | undefined {
  return getCached(boundaryCache, key);
}

export function setCachedBoundaryAnalysis(key: string, value: ArchitectureBoundaryAnalysis): void {
  setCached(boundaryCache, key, value);
}

export function getCachedAuthorityChainAnalysis(key: string): AuthorityChainArchitectureAnalysis | undefined {
  return getCached(authorityChainCache, key);
}

export function setCachedAuthorityChainAnalysis(key: string, value: AuthorityChainArchitectureAnalysis): void {
  setCached(authorityChainCache, key, value);
}

export function getCachedArchitectureDocumentationAuthority(
  key: string,
): UnifiedArchitectureDocumentationAuthority | undefined {
  return getCached(authorityCache, key);
}

export function setCachedArchitectureDocumentationAuthority(
  key: string,
  value: UnifiedArchitectureDocumentationAuthority,
): void {
  setCached(authorityCache, key, value);
}

export function getCachedArchitectureDocumentationEvaluation(
  key: string,
): ArchitectureDocumentationEvaluation | undefined {
  return getCached(evaluationCache, key);
}

export function setCachedArchitectureDocumentationEvaluation(
  key: string,
  value: ArchitectureDocumentationEvaluation,
): void {
  setCached(evaluationCache, key, value);
}

export function getArchitectureDocumentationCacheStats(): {
  hits: number;
  misses: number;
  evictions: number;
} {
  return { hits: cacheHits, misses: cacheMisses, evictions: cacheEvictions };
}

export function resetArchitectureDocumentationCacheForTests(): void {
  domainCache.clear();
  dependencyCache.clear();
  integrationCache.clear();
  boundaryCache.clear();
  authorityChainCache.clear();
  authorityCache.clear();
  evaluationCache.clear();
  cacheHits = 0;
  cacheMisses = 0;
  cacheEvictions = 0;
}
