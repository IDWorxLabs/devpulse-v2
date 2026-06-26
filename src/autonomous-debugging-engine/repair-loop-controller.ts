/**
 * Autonomous Debugging Engine — bounded repair loop controller.
 */

import { escalateToHumanReview } from './human-review-escalator.js';
import { analyzePatchSafety } from './patch-safety-analyzer.js';
import { planPatchApplication } from './patch-application-planner.js';
import { planPatchScope } from './patch-scope-planner.js';
import { planRegressionValidation } from './regression-validation-planner.js';
import { generateRepairPlan } from './repair-plan-generator.js';
import { analyzeRootCause } from './root-cause-analyzer.js';
import {
  buildBudgetExhaustionEvidence,
  createRepairBudgetState,
  isRepairBudgetAvailable,
  recordRepairBudgetUsage,
} from './repair-budget-manager.js';
import { simulateRepairExecution } from './repair-execution-simulator.js';
import type {
  NormalizedFailure,
  PatchApplicationPlan,
  RepairAttemptRecord,
  RepairLoopResult,
  RepairPlan,
} from './autonomous-debugging-types.js';
import { DEFAULT_REPAIR_LOOP_MAX_ATTEMPTS } from './autonomous-debugging-types.js';
import { planTargetedValidation } from './targeted-validation-planner.js';

let loopCounter = 0;

export function resetRepairLoopControllerForTests(): void {
  loopCounter = 0;
}

export interface RepairLoopBatchResult {
  readOnly: true;
  loops: readonly RepairLoopResult[];
  attempts: readonly RepairAttemptRecord[];
}

function runSingleRepairLoop(input: {
  failure: NormalizedFailure;
  repairPlan: RepairPlan;
  patchPlan?: PatchApplicationPlan;
  simulateRepairExhaustion?: boolean;
  simulateRegressionAfterRepair?: boolean;
  maxAttempts?: number;
}): RepairLoopResult {
  loopCounter += 1;
  const maxAttempts = input.maxAttempts ?? DEFAULT_REPAIR_LOOP_MAX_ATTEMPTS;
  const patchScope = planPatchScope(input.repairPlan);
  const patchPlan = input.patchPlan ?? planPatchApplication({ repairPlan: input.repairPlan, patchScope });
  planTargetedValidation(input.repairPlan);
  planRegressionValidation(input.repairPlan);

  const attempts: RepairAttemptRecord[] = [];
  let budget = createRepairBudgetState();

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const touchedFiles = patchPlan.filesToModify.length * attempt;
    if (
      !isRepairBudgetAvailable({
        state: budget,
        nextAttemptNumber: attempt,
        nextTouchedFiles: touchedFiles,
        maxAttempts,
      })
    ) {
      break;
    }

    const attemptRecord = simulateRepairExecution({
      failure: input.failure,
      patchPlan,
      attemptNumber: attempt,
      simulateRepairExhaustion: input.simulateRepairExhaustion,
      simulateRegressionAfterRepair: input.simulateRegressionAfterRepair,
    });
    attempts.push(attemptRecord);
    budget = recordRepairBudgetUsage({
      state: budget,
      attemptNumber: attempt,
      touchedFiles,
      maxAttempts,
    });

    if (attemptRecord.outcome === 'RESOLVED') break;
    if (attemptRecord.outcome === 'ROLLED_BACK') break;
    if (budget.exhausted) break;
  }

  const resolved = attempts.some((a) => a.outcome === 'RESOLVED');
  const escalated = !resolved;
  const exhaustionEvidence = buildBudgetExhaustionEvidence(budget);

  const blockedReason = resolved
    ? null
    : input.simulateRepairExhaustion || budget.exhausted
      ? exhaustionEvidence.join('; ') || 'Repair attempts exhausted'
      : input.simulateRegressionAfterRepair
        ? 'Regression validation failed after targeted repair'
        : 'Autonomous repair did not resolve failure';

  const humanReview =
    escalated && (input.simulateRepairExhaustion || budget.exhausted || input.simulateRegressionAfterRepair)
      ? escalateToHumanReview({
          failure: input.failure,
          repairPlan: input.repairPlan,
          attempts,
          blockedReason: blockedReason ?? 'Repair loop exhausted',
        })
      : escalated
        ? escalateToHumanReview({
            failure: input.failure,
            repairPlan: input.repairPlan,
            attempts,
            blockedReason: blockedReason ?? 'Unresolved failure',
          })
        : null;

  return {
    readOnly: true,
    loopId: `repair-loop-${loopCounter}`,
    failureIds: [input.failure.id],
    attempts,
    resolved,
    escalated,
    humanReview,
    blockedReason,
  };
}

export function runRepairLoop(input: {
  failure: NormalizedFailure;
  repairPlan: RepairPlan;
  patchPlan?: PatchApplicationPlan;
  simulateRepairExhaustion?: boolean;
  simulateRegressionAfterRepair?: boolean;
  maxAttempts?: number;
}): RepairLoopResult;
export function runRepairLoop(input: {
  failures: readonly NormalizedFailure[];
  simulateRepairExhaustion?: boolean;
  simulateRegressionAfterRepair?: boolean;
  simulatePromptDriftRepair?: boolean;
  maxAttempts?: number;
}): RepairLoopBatchResult;
export function runRepairLoop(
  input:
    | {
        failure: NormalizedFailure;
        repairPlan: RepairPlan;
        patchPlan?: PatchApplicationPlan;
        simulateRepairExhaustion?: boolean;
        simulateRegressionAfterRepair?: boolean;
        maxAttempts?: number;
      }
    | {
        failures: readonly NormalizedFailure[];
        simulateRepairExhaustion?: boolean;
        simulateRegressionAfterRepair?: boolean;
        simulatePromptDriftRepair?: boolean;
        maxAttempts?: number;
      },
): RepairLoopResult | RepairLoopBatchResult {
  if ('failures' in input) {
    const loops: RepairLoopResult[] = [];
    const attempts: RepairAttemptRecord[] = [];

    for (const failure of input.failures) {
      const repairPlan = generateRepairPlan({ failure, rootCause: analyzeRootCause(failure) });
      const safety = analyzePatchSafety({
        failure,
        repairPlan,
        simulatePromptDriftRepair: input.simulatePromptDriftRepair,
      });

      if (!safety.safe) {
        loopCounter += 1;
        const blockedLoop: RepairLoopResult = {
          readOnly: true,
          loopId: `repair-loop-${loopCounter}`,
          failureIds: [failure.id],
          attempts: [],
          resolved: false,
          escalated: true,
          humanReview: escalateToHumanReview({
            failure,
            repairPlan,
            attempts: [],
            blockedReason: safety.blockedReason ?? 'Unsafe patch blocked',
          }),
          blockedReason: safety.blockedReason,
        };
        loops.push(blockedLoop);
        continue;
      }

      const loop = runSingleRepairLoop({
        failure,
        repairPlan,
        simulateRepairExhaustion: input.simulateRepairExhaustion,
        simulateRegressionAfterRepair: input.simulateRegressionAfterRepair,
        maxAttempts: input.maxAttempts,
      });
      loops.push(loop);
      attempts.push(...loop.attempts);
    }

    return { readOnly: true, loops, attempts };
  }

  return runSingleRepairLoop(input);
}
