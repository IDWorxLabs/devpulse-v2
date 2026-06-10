/**
 * Capability Research Engine — root cause researcher.
 */

import type {
  CapabilityGapResearchResult,
  CapabilityResearchInput,
  CapabilityRootCauseResearchResult,
  CapabilityRootCauseType,
} from './capability-research-types.js';
import type { CapabilityEvidenceResult } from './capability-research-types.js';
import { getCachedRootCause, setCachedRootCause } from './capability-research-cache.js';

let rootCauseAnalysisCount = 0;

export function researchCapabilityRootCause(
  input: CapabilityResearchInput,
  evidence: CapabilityEvidenceResult,
  gapResearch: CapabilityGapResearchResult,
): CapabilityRootCauseResearchResult {
  const cacheKey = [
    gapResearch.gapType,
    evidence.evidenceQualityScore,
    input.bottlenecks?.[0]?.bottleneckType ?? '',
    input.failures?.length ?? 0,
  ].join('|');

  const cached = getCachedRootCause(cacheKey);
  if (cached) return cached;

  rootCauseAnalysisCount += 1;

  const supportingEvidence: string[] = [...gapResearch.findings];
  let rootCause: CapabilityRootCauseType = 'ARCHITECTURAL_LIMITATION';
  let confidence = 30;

  const bottleneckType = input.bottlenecks?.[0]?.bottleneckType ?? '';
  const failureCount = input.failures?.length ?? 0;
  const stallCount = input.stalls?.length ?? 0;
  const blockedCount = input.blockedStates?.length ?? 0;

  if (gapResearch.gapType === 'MISSING_CAPABILITY') {
    rootCause = 'MISSING_CAPABILITY';
    confidence = gapResearch.confidence;
    supportingEvidence.push('gap research confirms missing capability');
  } else if (bottleneckType === 'resource') {
    rootCause = 'RESOURCE_LIMITATION';
    confidence = 70;
    supportingEvidence.push('resource bottleneck detected');
  } else if (bottleneckType === 'validator' || bottleneckType === 'orchestration' || bottleneckType === 'verification') {
    rootCause = 'RUNTIME_BOTTLENECK';
    confidence = 60;
    supportingEvidence.push(`${bottleneckType} runtime bottleneck`);
  } else if (failureCount >= 3 && gapResearch.gapType === 'WEAK_CAPABILITY') {
    rootCause = 'EXISTING_CAPABILITY_MALFUNCTION';
    confidence = 65;
    supportingEvidence.push('repeated failures with weak capability indicate malfunction');
  } else if (blockedCount >= 3) {
    rootCause = 'EXISTING_CAPABILITY_MALFUNCTION';
    confidence = 55;
    supportingEvidence.push('blocked state loops suggest malfunction');
  } else if (stallCount > 0 && evidence.evidenceQualityScore < 40) {
    rootCause = 'ARCHITECTURAL_LIMITATION';
    confidence = 50;
    supportingEvidence.push('stalls with low evidence quality suggest architectural limitation');
  } else if (gapResearch.gapType === 'INCOMPLETE_CAPABILITY') {
    rootCause = 'EXISTING_CAPABILITY_MALFUNCTION';
    confidence = 50;
    supportingEvidence.push('incomplete capability may be malfunctioning');
  } else if (gapResearch.gapType === 'NO_GAP') {
    rootCause = 'RUNTIME_BOTTLENECK';
    confidence = 25;
    supportingEvidence.push('no gap found; likely transient runtime issue');
  }

  const result: CapabilityRootCauseResearchResult = {
    rootCause,
    confidence: Math.min(100, confidence),
    supportingEvidence,
  };

  setCachedRootCause(cacheKey, result);
  return result;
}

export function getRootCauseAnalysisCount(): number {
  return rootCauseAnalysisCount;
}

export function resetRootCauseResearcherForTests(): void {
  rootCauseAnalysisCount = 0;
}
