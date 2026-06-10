/**
 * Capability Research Engine — lookup cache.
 */

import type {
  CapabilityEvidenceResult,
  CapabilityResearchDecision,
  CapabilityRootCauseResearchResult,
  CapabilitySimilarityResult,
  DomainClassificationResult,
} from './capability-research-types.js';

let cacheHits = 0;
let cacheMisses = 0;

const domainCache = new Map<string, DomainClassificationResult>();
const evidenceCache = new Map<string, CapabilityEvidenceResult>();
const similarityCache = new Map<string, CapabilitySimilarityResult>();
const decisionCache = new Map<string, CapabilityResearchDecision>();
const rootCauseCache = new Map<string, CapabilityRootCauseResearchResult>();

export function getCachedDomainClassification(key: string): DomainClassificationResult | undefined {
  const cached = domainCache.get(key);
  if (cached) { cacheHits += 1; return cached; }
  cacheMisses += 1;
  return undefined;
}

export function setCachedDomainClassification(key: string, result: DomainClassificationResult): void {
  domainCache.set(key, result);
}

export function getCachedEvidence(key: string): CapabilityEvidenceResult | undefined {
  const cached = evidenceCache.get(key);
  if (cached) { cacheHits += 1; return cached; }
  cacheMisses += 1;
  return undefined;
}

export function setCachedEvidence(key: string, result: CapabilityEvidenceResult): void {
  evidenceCache.set(key, result);
}

export function getCachedSimilarity(key: string): CapabilitySimilarityResult | undefined {
  const cached = similarityCache.get(key);
  if (cached) { cacheHits += 1; return cached; }
  cacheMisses += 1;
  return undefined;
}

export function setCachedSimilarity(key: string, result: CapabilitySimilarityResult): void {
  similarityCache.set(key, result);
}

export function getCachedResearchDecision(key: string): CapabilityResearchDecision | undefined {
  const cached = decisionCache.get(key);
  if (cached) { cacheHits += 1; return cached; }
  cacheMisses += 1;
  return undefined;
}

export function setCachedResearchDecision(key: string, decision: CapabilityResearchDecision): void {
  decisionCache.set(key, decision);
}

export function getCachedRootCause(key: string): CapabilityRootCauseResearchResult | undefined {
  const cached = rootCauseCache.get(key);
  if (cached) { cacheHits += 1; return cached; }
  cacheMisses += 1;
  return undefined;
}

export function setCachedRootCause(key: string, result: CapabilityRootCauseResearchResult): void {
  rootCauseCache.set(key, result);
}

export function getCapabilityResearchCacheStats(): { hits: number; misses: number } {
  return { hits: cacheHits, misses: cacheMisses };
}

export function resetCapabilityResearchCacheForTests(): void {
  domainCache.clear();
  evidenceCache.clear();
  similarityCache.clear();
  decisionCache.clear();
  rootCauseCache.clear();
  cacheHits = 0;
  cacheMisses = 0;
}
