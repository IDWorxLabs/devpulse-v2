/**
 * Founder Productivity Validation — authority builder.
 */

import type {
  FounderProductivityAuthority,
  FounderProductivityResult,
  FounderProductivityRoadmap,
  FounderProductivityValidationInput,
  WorkflowAccelerationValidation,
  ManualWorkReductionValidation,
  DecisionReductionValidation,
  ContextSwitchingValidation,
  ExecutionEfficiencyValidation,
  ThroughputValidation,
  WorkflowOverheadValidation,
  ProductivityGapAnalysis,
  ProductivityContext,
} from './founder-productivity-types.js';
import { resolveFounderProductivityResult } from './founder-productivity-types.js';
import { countCriticalGaps } from './productivity-gap-model.js';
import { getCachedFounderProductivityAuthority, setCachedFounderProductivityAuthority } from './founder-productivity-cache.js';

const VALIDATOR_WEIGHT = 1 / 7;
const OVERHEAD_WEIGHT_MODIFIER = 0.85;

let authorityBuildCount = 0;
let authorityCounter = 0;

export function buildFounderProductivityAuthority(
  requestId: string,
  contexts: ProductivityContext[],
  workflowAcceleration: WorkflowAccelerationValidation,
  manualWorkReduction: ManualWorkReductionValidation,
  decisionReduction: DecisionReductionValidation,
  contextSwitching: ContextSwitchingValidation,
  executionEfficiency: ExecutionEfficiencyValidation,
  throughput: ThroughputValidation,
  workflowOverhead: WorkflowOverheadValidation,
  gapAnalysis: ProductivityGapAnalysis,
  roadmap: FounderProductivityRoadmap,
  input: FounderProductivityValidationInput,
): FounderProductivityAuthority {
  const cacheKey = [
    requestId,
    workflowAcceleration.score, manualWorkReduction.score, decisionReduction.score,
    contextSwitching.score, executionEfficiency.score, throughput.score, workflowOverhead.score,
  ].join('|');
  const cached = getCachedFounderProductivityAuthority(cacheKey);
  if (cached) return cached;

  authorityBuildCount += 1;
  authorityCounter += 1;

  const founderProductivityScore = Math.round(
    workflowAcceleration.score * VALIDATOR_WEIGHT
      + manualWorkReduction.score * VALIDATOR_WEIGHT
      + decisionReduction.score * VALIDATOR_WEIGHT
      + contextSwitching.score * VALIDATOR_WEIGHT
      + executionEfficiency.score * VALIDATOR_WEIGHT
      + throughput.score * VALIDATOR_WEIGHT
      + workflowOverhead.score * VALIDATOR_WEIGHT * OVERHEAD_WEIGHT_MODIFIER,
  );

  const criticalGaps = countCriticalGaps(gapAnalysis.gaps);
  const warningCount = gapAnalysis.majorProductivityGaps.length + gapAnalysis.minorProductivityGaps.length;

  const founderProductivityResult: FounderProductivityResult = resolveFounderProductivityResult(
    founderProductivityScore,
    criticalGaps,
    warningCount,
    input.governanceBlocked,
  );

  const confidence = Math.min(100, Math.round(
    (founderProductivityScore + throughput.score + workflowAcceleration.score) / 3 - criticalGaps * 6,
  ));

  const authority: FounderProductivityAuthority = {
    authorityId: `founder-productivity-authority-${authorityCounter}`,
    contexts,
    workflowAcceleration,
    manualWorkReduction,
    decisionReduction,
    contextSwitching,
    executionEfficiency,
    throughput,
    workflowOverhead,
    gapAnalysis,
    roadmap,
    founderProductivityScore: Math.max(0, founderProductivityScore),
    founderProductivityResult,
    confidence: Math.max(0, confidence),
    createdAt: Date.now(),
  };

  setCachedFounderProductivityAuthority(cacheKey, authority);
  return authority;
}

export function getAuthorityBuildCount(): number {
  return authorityBuildCount;
}

export function resetFounderProductivityAuthorityBuilderForTests(): void {
  authorityBuildCount = 0;
  authorityCounter = 0;
}
