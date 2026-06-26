/**
 * Continuous Product Improvement Engine — improvement execution simulation.
 */

import type {
  ImprovementApplicationPlan,
  ImprovementAttemptRecord,
  ImprovementOpportunity,
  ImprovementOutcome,
  ImprovementPlan,
} from './continuous-improvement-types.js';

export function simulateImprovementExecution(input: {
  opportunity: ImprovementOpportunity;
  improvementPlan: ImprovementPlan;
  patchPlan: ImprovementApplicationPlan;
  attemptNumber: number;
  simulateRegressionAfterImprovement?: boolean;
  simulateImprovementExhaustion?: boolean;
}): ImprovementAttemptRecord {
  if (input.simulateImprovementExhaustion) {
    return attemptRecord(input, false, false, 'FAILED', 0);
  }

  const resolvesFirstAttempt = [
    'USABILITY_IMPROVEMENT',
    'ACCESSIBILITY_IMPROVEMENT',
    'PERFORMANCE_OPTIMIZATION',
  ].includes(input.opportunity.category);

  const targetedPassed = resolvesFirstAttempt && input.attemptNumber >= 1;
  const regressionPassed = targetedPassed && !input.simulateRegressionAfterImprovement;

  let outcome: ImprovementOutcome = 'FAILED';
  if (targetedPassed && regressionPassed) outcome = 'APPLIED';
  else if (targetedPassed && !regressionPassed) outcome = 'ROLLED_BACK';

  const qualityDelta = outcome === 'APPLIED' ? input.improvementPlan.expectedQualityDelta : 0;

  return attemptRecord(input, targetedPassed, regressionPassed, outcome, qualityDelta);
}

function attemptRecord(
  input: {
    opportunity: ImprovementOpportunity;
    improvementPlan: ImprovementPlan;
    patchPlan: ImprovementApplicationPlan;
    attemptNumber: number;
  },
  targetedPassed: boolean,
  regressionPassed: boolean,
  outcome: ImprovementOutcome,
  qualityDelta: number,
): ImprovementAttemptRecord {
  return {
    readOnly: true,
    improvementId: input.improvementPlan.improvementId,
    opportunityId: input.opportunity.opportunityId,
    patchScope: input.patchPlan.expectedDiffSummary,
    filesModified: input.patchPlan.filesToModify,
    targetedValidationPassed: targetedPassed,
    regressionValidationPassed: regressionPassed,
    faithfulnessDelta: outcome === 'APPLIED' ? 'none' : outcome === 'ROLLED_BACK' ? 'review' : 'unchanged',
    qualityDelta,
    attemptNumber: input.attemptNumber,
    outcome,
    rollbackSnapshot: input.patchPlan.rollbackSnapshot,
    deferredReason: null,
    timestamp: Date.now(),
  };
}
