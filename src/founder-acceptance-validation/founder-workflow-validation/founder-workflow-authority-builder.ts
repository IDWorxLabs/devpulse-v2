/**
 * Founder Workflow Validation — authority builder.
 */

import type {
  FounderWorkflowAuthority,
  FounderWorkflowResult,
  FounderWorkflowRoadmap,
  FounderWorkflowValidationInput,
  WorkflowClarityValidation,
  WorkflowContinuityValidation,
  WorkflowContext,
  WorkflowDiscoverabilityValidation,
  WorkflowEfficiencyValidation,
  WorkflowFrictionValidation,
  WorkflowGapAnalysis,
  WorkflowOutcomeValidation,
  WorkflowRecoveryValidation,
} from './founder-workflow-types.js';
import { resolveFounderWorkflowResult } from './founder-workflow-types.js';
import { countCriticalGaps } from './workflow-gap-model.js';
import { getCachedFounderWorkflowAuthority, setCachedFounderWorkflowAuthority } from './founder-workflow-cache.js';

const VALIDATOR_WEIGHT = 1 / 7;
const FRICTION_WEIGHT_MODIFIER = 0.85;

let authorityBuildCount = 0;
let authorityCounter = 0;

export function buildFounderWorkflowAuthority(
  requestId: string,
  contexts: WorkflowContext[],
  clarity: WorkflowClarityValidation,
  discoverability: WorkflowDiscoverabilityValidation,
  continuity: WorkflowContinuityValidation,
  friction: WorkflowFrictionValidation,
  recovery: WorkflowRecoveryValidation,
  outcome: WorkflowOutcomeValidation,
  efficiency: WorkflowEfficiencyValidation,
  gapAnalysis: WorkflowGapAnalysis,
  roadmap: FounderWorkflowRoadmap,
  input: FounderWorkflowValidationInput,
): FounderWorkflowAuthority {
  const cacheKey = [
    requestId,
    clarity.score, discoverability.score, continuity.score,
    friction.score, recovery.score, outcome.score, efficiency.score,
  ].join('|');
  const cached = getCachedFounderWorkflowAuthority(cacheKey);
  if (cached) return cached;

  authorityBuildCount += 1;
  authorityCounter += 1;

  const founderWorkflowScore = Math.round(
    clarity.score * VALIDATOR_WEIGHT
      + discoverability.score * VALIDATOR_WEIGHT
      + continuity.score * VALIDATOR_WEIGHT
      + friction.score * VALIDATOR_WEIGHT * FRICTION_WEIGHT_MODIFIER
      + recovery.score * VALIDATOR_WEIGHT
      + outcome.score * VALIDATOR_WEIGHT
      + efficiency.score * VALIDATOR_WEIGHT,
  );

  const criticalGaps = countCriticalGaps(gapAnalysis.gaps);
  const warningCount = gapAnalysis.majorWorkflowGaps.length + gapAnalysis.minorWorkflowGaps.length;

  const founderWorkflowResult: FounderWorkflowResult = resolveFounderWorkflowResult(
    founderWorkflowScore,
    criticalGaps,
    warningCount,
    input.governanceBlocked,
  );

  const confidence = Math.min(100, Math.round(
    (founderWorkflowScore + continuity.score + clarity.score) / 3 - criticalGaps * 6,
  ));

  const authority: FounderWorkflowAuthority = {
    authorityId: `founder-workflow-authority-${authorityCounter}`,
    contexts,
    clarity,
    discoverability,
    continuity,
    friction,
    recovery,
    outcome,
    efficiency,
    gapAnalysis,
    roadmap,
    founderWorkflowScore: Math.max(0, founderWorkflowScore),
    founderWorkflowResult,
    confidence: Math.max(0, confidence),
    createdAt: Date.now(),
  };

  setCachedFounderWorkflowAuthority(cacheKey, authority);
  return authority;
}

export function getAuthorityBuildCount(): number {
  return authorityBuildCount;
}

export function resetFounderWorkflowAuthorityBuilderForTests(): void {
  authorityBuildCount = 0;
  authorityCounter = 0;
}
