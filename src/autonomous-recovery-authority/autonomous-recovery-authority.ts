/**
 * Autonomous Recovery Authority — self-healing engineering orchestrator.
 */

import { continueEngineeringAfterRecovery } from '../engineering-continuation/index.js';
import { executeRecoveryStrategy } from '../recovery-executor/index.js';
import { evaluateRecoveryEscalation } from '../recovery-escalation-authority/index.js';
import { recordRecoveryOutcome } from '../recovery-memory/index.js';
import { planEngineeringRecovery } from '../recovery-planner/index.js';
import { buildRecoveryReport } from '../recovery-report-builder/index.js';
import { analyzeEngineeringRootCause } from '../recovery-root-cause/index.js';
import {
  generateRecoveryStrategies,
  selectNextAlternativeStrategy,
  selectSafestRecoveryStrategy,
} from '../recovery-strategy-engine/index.js';
import { replayValidationAfterRecovery } from '../validation-replay-engine/index.js';
import type {
  EngineeringRecoveryInput,
  EngineeringRecoveryResult,
  SpecializedRecoveryInput,
} from './autonomous-recovery-types.js';

let recoveryCounter = 0;
let lastRecoveryResult: EngineeringRecoveryResult | null = null;

export function resetAutonomousRecoveryAuthorityForTests(): void {
  recoveryCounter = 0;
  lastRecoveryResult = null;
}

export function getLastEngineeringRecoveryResult(): EngineeringRecoveryResult | null {
  return lastRecoveryResult;
}

export function attemptEngineeringRecovery(input: EngineeringRecoveryInput): EngineeringRecoveryResult {
  recoveryCounter += 1;
  const recoveryId = `autonomous-recovery-${recoveryCounter}-${Date.now()}`;

  const humanReviewBoundary =
    input.blockers?.some((b) => /payment|unsafe|human review/i.test(b)) ||
    /payment|unsafe|human review/i.test(input.failureReason);

  const diagnosis = analyzeEngineeringRootCause({
    failureStage: input.failureStage,
    failureReason: input.failureReason,
    blockers: input.blockers,
    evidenceRefs: input.evidenceRefs,
  });

  const plan = planEngineeringRecovery({
    rootCause: diagnosis,
    failureStage: input.failureStage,
    failureReason: input.failureReason,
    evidenceRefs: input.evidenceRefs,
  });

  const strategies = generateRecoveryStrategies({
    rootCause: diagnosis,
    plan,
    evidenceRefs: input.evidenceRefs,
  });

  if (humanReviewBoundary) {
    const escalation = evaluateRecoveryEscalation({
      attemptedRecoveries: [],
      attemptedStrategies: strategies,
      blockers: input.blockers ?? [input.failureReason],
      evidenceRefs: input.evidenceRefs,
    });
    const selection = selectSafestRecoveryStrategy(strategies);
    const report = buildRecoveryReport({
      plan,
      diagnosis,
      selection,
      executions: [],
      replay: null,
      continuation: null,
      escalation,
    });
    const result: EngineeringRecoveryResult = {
      readOnly: true,
      recoveryId,
      recovered: false,
      continued: false,
      escalated: true,
      userActionRequired: true,
      report,
      attempts: 0,
    };
    lastRecoveryResult = result;
    return result;
  }

  const attemptedExecutions: import('../recovery-executor/index.js').RecoveryExecutionResult[] = [];
  const attemptedStrategyIds: string[] = [];
  let selection = selectSafestRecoveryStrategy(strategies);
  let replay: import('../validation-replay-engine/index.js').ValidationReplayResult | null = null;
  let continuation: import('../engineering-continuation/index.js').EngineeringContinuationResult | null = null;
  let escalation: import('../recovery-escalation-authority/index.js').RecoveryEscalationDecision | null = null;

  let currentStrategy = selection.selected;
  while (currentStrategy) {
    const execution = executeRecoveryStrategy({ strategy: currentStrategy, host: input.host });
    attemptedExecutions.push(execution);
    attemptedStrategyIds.push(currentStrategy.strategyId);

    recordRecoveryOutcome({
      projectId: input.projectId,
      failureStage: input.failureStage,
      failureType: diagnosis.category,
      rootCauseSummary: diagnosis.summary,
      repairStrategy: currentStrategy.operation,
      repairDurationMs: execution.durationMs,
      repairSuccess: execution.success,
      replayPassed: false,
      evidenceRefs: currentStrategy.evidenceRefs,
      alternativeStrategies: selection.alternatives.map((a) => a.operation),
    });

    if (execution.success) {
      replay = replayValidationAfterRecovery({
        failureStage: input.failureStage,
        failureReason: input.failureReason,
        recoveryExecutionId: execution.executionId,
        host: input.host,
      });

      if (replay.passed) {
        continuation = continueEngineeringAfterRecovery({
          projectId: input.projectId ?? 'unknown',
          failureStage: input.failureStage,
          recoveryExecutionId: execution.executionId,
          validationReplayId: replay.replayId,
          host: input.host,
        });

        recordRecoveryOutcome({
          projectId: input.projectId,
          failureStage: input.failureStage,
          failureType: diagnosis.category,
          rootCauseSummary: diagnosis.summary,
          repairStrategy: currentStrategy.operation,
          repairDurationMs: execution.durationMs,
          repairSuccess: true,
          replayPassed: true,
          evidenceRefs: replay.evidenceRefs,
        });

        break;
      }
    }

    currentStrategy = selectNextAlternativeStrategy(strategies, attemptedStrategyIds);
    if (currentStrategy) {
      selection = {
        readOnly: true,
        selected: currentStrategy,
        alternatives: strategies.filter((s) => s.strategyId !== currentStrategy!.strategyId),
        selectionReason: `Alternative strategy ${currentStrategy.operation} after prior attempt failed.`,
      };
    }
  }

  if (!continuation?.continued) {
    escalation = evaluateRecoveryEscalation({
      attemptedRecoveries: attemptedExecutions,
      attemptedStrategies: strategies,
      blockers: input.blockers ?? [input.failureReason],
      evidenceRefs: input.evidenceRefs,
    });
  }

  const report = buildRecoveryReport({
    plan,
    diagnosis,
    selection,
    executions: attemptedExecutions,
    replay,
    continuation,
    escalation,
  });

  const result: EngineeringRecoveryResult = {
    readOnly: true,
    recoveryId,
    recovered: report.finalState === 'RECOVERED' || report.finalState === 'CONTINUED',
    continued: continuation?.continued ?? false,
    escalated: escalation?.escalate ?? false,
    userActionRequired: escalation?.humanJudgmentRequired ?? false,
    report,
    attempts: attemptedExecutions.length,
  };

  lastRecoveryResult = result;
  return result;
}

export function recoverBuild(input: SpecializedRecoveryInput): EngineeringRecoveryResult {
  return attemptEngineeringRecovery({
    projectId: input.projectId,
    failureStage: 'NPM_BUILD',
    failureReason: input.failureReason,
    host: input.host,
  });
}

export function recoverValidation(input: SpecializedRecoveryInput): EngineeringRecoveryResult {
  return attemptEngineeringRecovery({
    projectId: input.projectId,
    failureStage: 'MATERIALIZATION_VALIDATION',
    failureReason: input.failureReason,
    host: input.host,
  });
}

export function recoverPreview(input: SpecializedRecoveryInput): EngineeringRecoveryResult {
  return attemptEngineeringRecovery({
    projectId: input.projectId,
    failureStage: 'PREVIEW',
    failureReason: input.failureReason,
    host: input.host,
  });
}

export function recoverWorkspace(input: SpecializedRecoveryInput): EngineeringRecoveryResult {
  return attemptEngineeringRecovery({
    projectId: input.projectId,
    failureStage: 'WORKSPACE',
    failureReason: input.failureReason,
    host: input.host,
  });
}

export function recoverPipeline(input: SpecializedRecoveryInput): EngineeringRecoveryResult {
  return attemptEngineeringRecovery({
    projectId: input.projectId,
    failureStage: 'PLANNING',
    failureReason: input.failureReason,
    host: input.host,
  });
}

export function recoverMaterialization(input: SpecializedRecoveryInput): EngineeringRecoveryResult {
  return attemptEngineeringRecovery({
    projectId: input.projectId,
    failureStage: 'MATERIALIZATION',
    failureReason: input.failureReason,
    host: input.host,
  });
}
