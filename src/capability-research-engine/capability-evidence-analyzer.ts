/**
 * Capability Research Engine — evidence analyzer.
 */

import type { CapabilityEvidenceResult, CapabilityResearchInput } from './capability-research-types.js';
import { getCachedEvidence, setCachedEvidence } from './capability-research-cache.js';

let evidenceAnalyzedCount = 0;

export function analyzeCapabilityEvidence(input: CapabilityResearchInput): CapabilityEvidenceResult {
  const cacheKey = JSON.stringify({
    f: input.failures?.length ?? 0,
    s: input.stalls?.length ?? 0,
    b: input.bottlenecks?.length ?? 0,
    bs: input.blockedStates?.length ?? 0,
    e: input.escalationDecision ?? '',
  });

  const cached = getCachedEvidence(cacheKey);
  if (cached) return cached;

  evidenceAnalyzedCount += 1;

  const failureCount = input.failures?.length ?? 0;
  const stallCount = input.stalls?.length ?? 0;
  const bottleneckCount = input.bottlenecks?.length ?? 0;
  const blockedCount = input.blockedStates?.length ?? 0;
  const evidenceCount = failureCount + stallCount + bottleneckCount + blockedCount;

  const parts: string[] = [];
  if (failureCount > 0) parts.push(`${failureCount} failure(s)`);
  if (stallCount > 0) parts.push(`${stallCount} stall(s)`);
  if (bottleneckCount > 0) parts.push(`${bottleneckCount} bottleneck(s)`);
  if (blockedCount > 0) parts.push(`${blockedCount} blocked state(s)`);
  if (input.escalationDecision) parts.push(`escalation: ${input.escalationDecision}`);

  const evidenceSummary = parts.length > 0 ? parts.join('; ') : 'no direct evidence';

  let qualityScore = 0;
  if (failureCount >= 3) qualityScore += 30;
  else if (failureCount > 0) qualityScore += 15;
  if (stallCount > 0) qualityScore += 20;
  if (bottleneckCount >= 2) qualityScore += 25;
  else if (bottleneckCount > 0) qualityScore += 10;
  if (blockedCount >= 3) qualityScore += 25;
  else if (blockedCount > 0) qualityScore += 10;
  if (input.escalationDecision === 'RESEARCH_REQUIRED' || input.escalationDecision === 'CAPABILITY_GAP_DETECTED') {
    qualityScore += 20;
  }

  const evidenceConfidence = evidenceCount > 0 ? Math.min(95, 30 + evidenceCount * 10 + qualityScore * 0.3) : 10;

  const result: CapabilityEvidenceResult = {
    evidenceQualityScore: Math.min(100, Math.round(qualityScore)),
    evidenceSummary,
    evidenceConfidence: Math.round(evidenceConfidence),
    evidenceCount,
  };

  setCachedEvidence(cacheKey, result);
  return result;
}

export function getEvidenceAnalyzedCount(): number {
  return evidenceAnalyzedCount;
}

export function resetEvidenceAnalyzerForTests(): void {
  evidenceAnalyzedCount = 0;
}
