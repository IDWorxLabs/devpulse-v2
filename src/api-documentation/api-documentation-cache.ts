/**
 * API Documentation — bounded lookup cache.
 */

import type {
  ApiSurfaceAnalysis,
  ApiDocumentationEvaluation,
  CommandSurfaceAnalysis,
  ContractDocumentationAnalysis,
  IntegrationApiAnalysis,
  InterfaceDocumentationAnalysis,
  UnifiedApiDocumentationAuthority,
} from './api-documentation-types.js';

const MAX_CACHE_ENTRIES = 256;

let cacheHits = 0;
let cacheMisses = 0;
let cacheEvictions = 0;

const apiSurfaceCache = new Map<string, ApiSurfaceAnalysis>();
const interfaceCache = new Map<string, InterfaceDocumentationAnalysis>();
const contractCache = new Map<string, ContractDocumentationAnalysis>();
const integrationCache = new Map<string, IntegrationApiAnalysis>();
const commandCache = new Map<string, CommandSurfaceAnalysis>();
const authorityCache = new Map<string, UnifiedApiDocumentationAuthority>();
const evaluationCache = new Map<string, ApiDocumentationEvaluation>();

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

export function getCachedApiSurfaceAnalysis(key: string): ApiSurfaceAnalysis | undefined {
  return getCached(apiSurfaceCache, key);
}

export function setCachedApiSurfaceAnalysis(key: string, value: ApiSurfaceAnalysis): void {
  setCached(apiSurfaceCache, key, value);
}

export function getCachedInterfaceAnalysis(key: string): InterfaceDocumentationAnalysis | undefined {
  return getCached(interfaceCache, key);
}

export function setCachedInterfaceAnalysis(key: string, value: InterfaceDocumentationAnalysis): void {
  setCached(interfaceCache, key, value);
}

export function getCachedContractAnalysis(key: string): ContractDocumentationAnalysis | undefined {
  return getCached(contractCache, key);
}

export function setCachedContractAnalysis(key: string, value: ContractDocumentationAnalysis): void {
  setCached(contractCache, key, value);
}

export function getCachedIntegrationApiAnalysis(key: string): IntegrationApiAnalysis | undefined {
  return getCached(integrationCache, key);
}

export function setCachedIntegrationApiAnalysis(key: string, value: IntegrationApiAnalysis): void {
  setCached(integrationCache, key, value);
}

export function getCachedCommandAnalysis(key: string): CommandSurfaceAnalysis | undefined {
  return getCached(commandCache, key);
}

export function setCachedCommandAnalysis(key: string, value: CommandSurfaceAnalysis): void {
  setCached(commandCache, key, value);
}

export function getCachedApiDocumentationAuthority(
  key: string,
): UnifiedApiDocumentationAuthority | undefined {
  return getCached(authorityCache, key);
}

export function setCachedApiDocumentationAuthority(
  key: string,
  value: UnifiedApiDocumentationAuthority,
): void {
  setCached(authorityCache, key, value);
}

export function getCachedApiDocumentationEvaluation(
  key: string,
): ApiDocumentationEvaluation | undefined {
  return getCached(evaluationCache, key);
}

export function setCachedApiDocumentationEvaluation(
  key: string,
  value: ApiDocumentationEvaluation,
): void {
  setCached(evaluationCache, key, value);
}

export function getApiDocumentationCacheStats(): { hits: number; misses: number; evictions: number } {
  return { hits: cacheHits, misses: cacheMisses, evictions: cacheEvictions };
}

export function resetApiDocumentationCacheForTests(): void {
  apiSurfaceCache.clear();
  interfaceCache.clear();
  contractCache.clear();
  integrationCache.clear();
  commandCache.clear();
  authorityCache.clear();
  evaluationCache.clear();
  cacheHits = 0;
  cacheMisses = 0;
  cacheEvictions = 0;
}
