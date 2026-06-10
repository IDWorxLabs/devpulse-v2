/**
 * Multi Project Verification — lookup cache.
 */

import type { PortfolioVerificationSummary, ProjectVerificationRecord } from './multi-project-verification-types.js';

let cacheHits = 0;
let cacheMisses = 0;

const verificationCache = new Map<string, ProjectVerificationRecord>();
const confidenceCache = new Map<string, number>();
const riskCache = new Map<string, number>();
const portfolioCache = new Map<string, PortfolioVerificationSummary>();
const statusIndexCache = new Map<string, ProjectVerificationRecord[]>();

export function getCachedVerification(projectId: string): ProjectVerificationRecord | undefined {
  const cached = verificationCache.get(projectId);
  if (cached) {
    cacheHits += 1;
    return cached;
  }
  cacheMisses += 1;
  return undefined;
}

export function setCachedVerification(record: ProjectVerificationRecord): void {
  verificationCache.set(record.projectId, record);
  statusIndexCache.clear();
}

export function getCachedConfidence(projectId: string): number | undefined {
  const cached = confidenceCache.get(projectId);
  if (cached !== undefined) {
    cacheHits += 1;
    return cached;
  }
  cacheMisses += 1;
  return undefined;
}

export function setCachedConfidence(projectId: string, confidence: number): void {
  confidenceCache.set(projectId, confidence);
}

export function getCachedRisk(projectId: string): number | undefined {
  const cached = riskCache.get(projectId);
  if (cached !== undefined) {
    cacheHits += 1;
    return cached;
  }
  cacheMisses += 1;
  return undefined;
}

export function setCachedRisk(projectId: string, risk: number): void {
  riskCache.set(projectId, risk);
}

export function getCachedPortfolio(key: string): PortfolioVerificationSummary | undefined {
  const cached = portfolioCache.get(key);
  if (cached) {
    cacheHits += 1;
    return cached;
  }
  cacheMisses += 1;
  return undefined;
}

export function setCachedPortfolio(key: string, summary: PortfolioVerificationSummary): void {
  portfolioCache.set(key, summary);
}

export function getCachedByStatus(status: string): ProjectVerificationRecord[] | undefined {
  const cached = statusIndexCache.get(status);
  if (cached) {
    cacheHits += 1;
    return cached;
  }
  cacheMisses += 1;
  return undefined;
}

export function setCachedByStatus(status: string, records: ProjectVerificationRecord[]): void {
  statusIndexCache.set(status, records);
}

export function getProjectVerificationCacheStats(): { hits: number; misses: number } {
  return { hits: cacheHits, misses: cacheMisses };
}

export function resetProjectVerificationCacheForTests(): void {
  verificationCache.clear();
  confidenceCache.clear();
  riskCache.clear();
  portfolioCache.clear();
  statusIndexCache.clear();
  cacheHits = 0;
  cacheMisses = 0;
}
