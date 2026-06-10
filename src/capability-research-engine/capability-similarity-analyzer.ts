/**
 * Capability Research Engine — similarity analyzer for duplicate detection.
 */

import { INTELLIGENCE_CONSOLE_CAPABILITIES } from '../intelligence-console/capability-registry.js';
import { listDevPulseV2Owners } from '../foundation/ownership-registry.js';
import type { CapabilityResearchInput, CapabilitySimilarityResult, DuplicateRisk } from './capability-research-types.js';
import { getCachedSimilarity, setCachedSimilarity } from './capability-research-cache.js';

let duplicateCheckCount = 0;

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function tokenOverlap(a: string, b: string): number {
  const tokensA = new Set(normalize(a).split(' ').filter(Boolean));
  const tokensB = new Set(normalize(b).split(' ').filter(Boolean));
  if (tokensA.size === 0 || tokensB.size === 0) return 0;
  let overlap = 0;
  for (const t of tokensA) {
    if (tokensB.has(t)) overlap += 1;
  }
  return overlap / Math.max(tokensA.size, tokensB.size);
}

export function analyzeCapabilitySimilarity(input: CapabilityResearchInput): CapabilitySimilarityResult {
  const proposed = input.proposedCapability ?? '';
  const cacheKey = proposed.toLowerCase();

  const cached = getCachedSimilarity(cacheKey);
  if (cached) return cached;

  duplicateCheckCount += 1;

  const existingCandidates: string[] = [];
  let maxSimilarity = 0;

  for (const cap of INTELLIGENCE_CONSOLE_CAPABILITIES) {
    const labelScore = tokenOverlap(proposed, cap.label);
    const idScore = tokenOverlap(proposed, cap.capabilityId.replace(/_/g, ' '));
    const score = Math.max(labelScore, idScore);
    if (score >= 0.4) {
      existingCandidates.push(cap.capabilityId);
      maxSimilarity = Math.max(maxSimilarity, score);
    }
  }

  for (const owner of listDevPulseV2Owners()) {
    const domainScore = tokenOverlap(proposed, owner.domain.replace(/_/g, ' '));
    const moduleScore = tokenOverlap(proposed, owner.ownerModule.replace(/devpulse_v2_/g, '').replace(/_/g, ' '));
    const score = Math.max(domainScore, moduleScore);
    if (score >= 0.5) {
      existingCandidates.push(owner.domain);
      maxSimilarity = Math.max(maxSimilarity, score);
    }
  }

  const uniqueCandidates = [...new Set(existingCandidates)];
  const similarityScore = Math.round(maxSimilarity * 100);

  let duplicateRisk: DuplicateRisk = 'NONE';
  if (similarityScore >= 90) duplicateRisk = 'DUPLICATE';
  else if (similarityScore >= 70) duplicateRisk = 'HIGH';
  else if (similarityScore >= 50) duplicateRisk = 'MEDIUM';
  else if (similarityScore >= 30) duplicateRisk = 'LOW';

  const result: CapabilitySimilarityResult = {
    duplicateRisk,
    similarityScore,
    existingCandidates: uniqueCandidates,
  };

  setCachedSimilarity(cacheKey, result);
  return result;
}

export function getDuplicateCheckCount(): number {
  return duplicateCheckCount;
}

export function resetSimilarityAnalyzerForTests(): void {
  duplicateCheckCount = 0;
}
