/**
 * Capability recommendation engine — produces detection recommendations only.
 * Does NOT acquire, build, or install capabilities.
 */

import type { CapabilityAnalysisInput } from './types.js';
import type { ClassifiedGap } from './capability-gap-classifier.js';

let gapCounter = 0;

export function resetCapabilityGapCounterForTests(): void {
  gapCounter = 0;
}

function createGapId(): string {
  gapCounter += 1;
  return `capability-gap-${gapCounter.toString().padStart(4, '0')}`;
}

export function generateRecommendations(
  input: CapabilityAnalysisInput,
  gaps: ClassifiedGap[],
): string[] {
  const recommendations: string[] = [
    'Missing Capability Detector Foundation V1 — detection only. No acquisition, execution, or modification.',
    `Analysis ${input.analysisId} for goal "${input.goalSummary.slice(0, 60)}" — ${gaps.length} gap(s) detected.`,
  ];

  if (gaps.length > 0) {
    recommendations.push('Review capability gaps before any Safe Capability Acquisition (Phase 9.2).');
  }

  for (const gap of gaps.slice(0, 5)) {
    recommendations.push(`${gap.capabilityType}: ${gap.recommendedAction}`);
  }

  if (input.worldTarget === 'WORLD_1') {
    recommendations.push('World 1 target — capability gaps must not bypass governance protections.');
  }

  return recommendations;
}

export function buildGapRecords(
  input: CapabilityAnalysisInput,
  gaps: ClassifiedGap[],
): import('./types.js').CapabilityGapRecord[] {
  return gaps.map((gap) => ({
    capabilityGapId: createGapId(),
    analysisId: input.analysisId,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    analysisSource: input.analysisSource,
    capabilityType: gap.capabilityType,
    capabilityName: gap.capabilityName,
    gapSeverity: gap.gapSeverity,
    gapReason: gap.gapReason,
    gapEvidence: gap.gapEvidence,
    gapImpact: gap.gapImpact,
    recommendedCapability: gap.recommendedCapability,
    recommendedAction: gap.recommendedAction,
    confidenceScore: gap.confidenceScore,
    capabilityGapState: gap.capabilityGapState,
  }));
}

export function recommendationKey(count: number): string {
  return `rec-${count}`;
}
