/**
 * Continuous Product Improvement Engine — bounded improvement loop controller.
 */

import { assessImprovementSafety } from './improvement-safety-assessor.js';
import { planImprovementApplication } from './improvement-application-planner.js';
import { planImprovementPatchScope } from './improvement-patch-scope-planner.js';
import { generateImprovementPlan } from './improvement-plan-generator.js';
import { planImprovementRegression } from './improvement-regression-planner.js';
import { planImprovementValidation } from './improvement-validation-planner.js';
import { simulateImprovementExecution } from './improvement-execution-simulator.js';
import {
  buildImprovementBudgetExhaustionEvidence,
  createImprovementBudgetState,
  isImprovementBudgetAvailable,
  recordImprovementBudgetUsage,
} from './improvement-budget-manager.js';
import type {
  ImprovementApplicationPlan,
  ImprovementAttemptRecord,
  ImprovementLoopResult,
  ImprovementPlan,
  RankedImprovementOpportunity,
} from './continuous-improvement-types.js';
import { DEFAULT_IMPROVEMENT_LOOP_MAX_ATTEMPTS } from './continuous-improvement-types.js';
import { isLaunchBlockingPriority } from './improvement-priority-ranker.js';

let loopCounter = 0;

export function resetImprovementLoopControllerForTests(): void {
  loopCounter = 0;
}

function runSingleImprovementLoop(input: {
  opportunity: RankedImprovementOpportunity;
  improvementPlan: ImprovementPlan;
  patchPlan?: ImprovementApplicationPlan;
  simulateRegressionAfterImprovement?: boolean;
  simulateImprovementExhaustion?: boolean;
  simulateUnsafeImprovement?: boolean;
  maxAttempts?: number;
}): ImprovementLoopResult {
  loopCounter += 1;
  const maxAttempts = input.maxAttempts ?? DEFAULT_IMPROVEMENT_LOOP_MAX_ATTEMPTS;
  const patchScope = planImprovementPatchScope(input.improvementPlan);
  const patchPlan =
    input.patchPlan ?? planImprovementApplication({ improvementPlan: input.improvementPlan, patchScope });
  planImprovementValidation(input.improvementPlan);
  planImprovementRegression(input.improvementPlan);

  const attempts: ImprovementAttemptRecord[] = [];
  let budget = createImprovementBudgetState();

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const touchedFiles = patchPlan.filesToModify.length * attempt;
    if (
      !isImprovementBudgetAvailable({
        state: budget,
        nextAttemptNumber: attempt,
        nextTouchedFiles: touchedFiles,
        maxAttempts,
      })
    ) {
      break;
    }

    const attemptRecord = simulateImprovementExecution({
      opportunity: input.opportunity,
      improvementPlan: input.improvementPlan,
      patchPlan,
      attemptNumber: attempt,
      simulateRegressionAfterImprovement: input.simulateRegressionAfterImprovement,
      simulateImprovementExhaustion: input.simulateImprovementExhaustion,
    });
    attempts.push(attemptRecord);
    budget = recordImprovementBudgetUsage({
      state: budget,
      attemptNumber: attempt,
      touchedFiles,
      maxAttempts,
      regressionFailed: attemptRecord.outcome === 'ROLLED_BACK',
    });

    if (attemptRecord.outcome === 'APPLIED') break;
    if (attemptRecord.outcome === 'ROLLED_BACK') break;
    if (budget.exhausted) break;
  }

  const applied = attempts.some((a) => a.outcome === 'APPLIED');
  const rolledBack = attempts.some((a) => a.outcome === 'ROLLED_BACK');
  const exhaustionEvidence = buildImprovementBudgetExhaustionEvidence(budget);

  const blockedReason = applied
    ? null
    : rolledBack
      ? 'Regression validation failed after improvement'
      : input.simulateImprovementExhaustion || budget.exhausted
        ? exhaustionEvidence.join('; ') || 'Improvement attempts exhausted'
        : 'Improvement did not resolve opportunity';

  return {
    readOnly: true,
    loopId: `improvement-loop-${loopCounter}`,
    opportunityIds: [input.opportunity.opportunityId],
    attempts,
    resolved: applied,
    deferred: false,
    blocked: !applied && isLaunchBlockingPriority(input.opportunity.priority),
    blockedReason,
    deferredReason: null,
  };
}

export function runImprovementLoop(input: {
  opportunity: RankedImprovementOpportunity;
  improvementPlan: ImprovementPlan;
  patchPlan?: ImprovementApplicationPlan;
  simulateRegressionAfterImprovement?: boolean;
  simulateImprovementExhaustion?: boolean;
  simulateUnsafeImprovement?: boolean;
  maxAttempts?: number;
}): ImprovementLoopResult;
export function runImprovementLoop(input: {
  opportunities: readonly RankedImprovementOpportunity[];
  simulateRegressionAfterImprovement?: boolean;
  simulateImprovementExhaustion?: boolean;
  simulateUnsafeImprovement?: boolean;
  maxAttempts?: number;
}): { readOnly: true; loops: readonly ImprovementLoopResult[]; attempts: readonly ImprovementAttemptRecord[] };
export function runImprovementLoop(
  input:
    | {
        opportunity: RankedImprovementOpportunity;
        improvementPlan: ImprovementPlan;
        patchPlan?: ImprovementApplicationPlan;
        simulateRegressionAfterImprovement?: boolean;
        simulateImprovementExhaustion?: boolean;
        simulateUnsafeImprovement?: boolean;
        maxAttempts?: number;
      }
    | {
        opportunities: readonly RankedImprovementOpportunity[];
        simulateRegressionAfterImprovement?: boolean;
        simulateImprovementExhaustion?: boolean;
        simulateUnsafeImprovement?: boolean;
        maxAttempts?: number;
      },
):
  | ImprovementLoopResult
  | { readOnly: true; loops: readonly ImprovementLoopResult[]; attempts: readonly ImprovementAttemptRecord[] } {
  if ('opportunities' in input) {
    const loops: ImprovementLoopResult[] = [];
    const attempts: ImprovementAttemptRecord[] = [];

    for (const opportunity of input.opportunities) {
      if (opportunity.priority === 'DEFERRED' || opportunity.priority === 'LOW') {
        loopCounter += 1;
        loops.push({
          readOnly: true,
          loopId: `improvement-loop-${loopCounter}`,
          opportunityIds: [opportunity.opportunityId],
          attempts: [],
          resolved: false,
          deferred: true,
          blocked: false,
          blockedReason: null,
          deferredReason: `Low priority (${opportunity.priority}) — deferred with evidence`,
        });
        continue;
      }

      const improvementPlan = generateImprovementPlan({ opportunity });
      const safety = assessImprovementSafety({
        opportunity,
        simulateUnsafeImprovement:
          input.simulateUnsafeImprovement &&
          opportunity.category === 'USABILITY_IMPROVEMENT' &&
          /remove|workflow/i.test(opportunity.summary + opportunity.expectedBenefit),
      });

      if (!safety.safe) {
        loopCounter += 1;
        loops.push({
          readOnly: true,
          loopId: `improvement-loop-${loopCounter}`,
          opportunityIds: [opportunity.opportunityId],
          attempts: [],
          resolved: false,
          deferred: false,
          blocked: true,
          blockedReason: safety.blockedReason,
          deferredReason: null,
        });
        continue;
      }

      const loop = runSingleImprovementLoop({
        opportunity,
        improvementPlan,
        simulateRegressionAfterImprovement: input.simulateRegressionAfterImprovement,
        simulateImprovementExhaustion: input.simulateImprovementExhaustion,
        simulateUnsafeImprovement: input.simulateUnsafeImprovement,
        maxAttempts: input.maxAttempts,
      });
      loops.push(loop);
      attempts.push(...loop.attempts);
    }

    return { readOnly: true, loops, attempts };
  }

  return runSingleImprovementLoop(input);
}
