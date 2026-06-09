/**
 * Recovery plan builder — assembles recovery plan without side effects.
 */

import { classifyFailure } from './recovery-failure-classifier.js';
import { evaluateEscalation } from './recovery-escalation-engine.js';
import {
  aggregateRecoveryRisk,
  buildRecoverySteps,
} from './recovery-risk-engine.js';
import { selectRecoveryStrategy, strategyWouldRepeat } from './recovery-strategy-selector.js';
import { evaluateRecoveryGates, validateRecovery } from './recovery-validator.js';
import type {
  FailureContext,
  PrepareRecoveryPlanInput,
  RecoveryPlan,
  RecoveryReport,
  RecoveryState,
} from './types.js';
import { REPEATED_FAILURE_LIMIT } from './types.js';

let planCounter = 0;
let reportCounter = 0;

function nextPlanId(): string {
  planCounter += 1;
  return `rcplan-${planCounter.toString().padStart(4, '0')}`;
}

function nextReportId(): string {
  reportCounter += 1;
  return `rcrep-${reportCounter.toString().padStart(4, '0')}`;
}

export function resetRecoveryPlanCounterForTests(): void {
  planCounter = 0;
  reportCounter = 0;
}

function defaultFailureContext(query: string): FailureContext {
  return {
    failureId: 'fail-default',
    failurePath: 'world2/runtime',
    failureCount: 1,
    summary: `Failure context derived from query: ${query.slice(0, 80)}`,
    sourceSystem: 'failure_visibility_engine',
  };
}

function resolveState(
  valid: boolean,
  needsApproval: boolean,
  escalationRequired: boolean,
): RecoveryState {
  if (!valid) return 'BLOCKED';
  if (escalationRequired) return 'ESCALATION_REQUIRED';
  if (needsApproval) return 'WAITING_APPROVAL';
  return 'READY_FOR_FUTURE_RECOVERY';
}

export function buildRecoveryPlanAndReport(input: PrepareRecoveryPlanInput): {
  plan: RecoveryPlan | null;
  report: RecoveryReport;
} {
  const query = input.query ?? 'Show recovery plan';
  const rollbackPlan = input.rollbackPlan;
  const applyPlan = input.applyPlan;
  const failureContext = input.failureContext ?? defaultFailureContext(query);
  const failureCategory = classifyFailure(query, failureContext);
  const failureCount = failureContext.failureCount;
  const repeatedLimit =
    input.repeatedFailureLimitReached || failureCount >= REPEATED_FAILURE_LIMIT;

  const recoveryStrategy = selectRecoveryStrategy(
    failureCategory,
    failureCount,
    input.previousRecoveryStrategies,
  );
  const strategyRepeated = strategyWouldRepeat(recoveryStrategy, input.previousRecoveryStrategies);

  const { escalationLevel, escalationReason } = evaluateEscalation({
    failureCategory,
    failureCount,
    recoveryStrategy,
    founderApprovalRecorded: input.founderApprovalRecorded,
    constitutionPassed: input.constitutionPassed,
    taskGovernorPassed: input.taskGovernorPassed,
  });

  const recoverySteps = buildRecoverySteps({
    recoveryStrategy,
    escalationLevel,
    failurePath: failureContext.failurePath,
    strategyRepeated,
  });

  const gateReport = evaluateRecoveryGates({
    rollbackPlan,
    applyPlan,
    failureContext: input.failureContext,
    executionPacketLinked: input.executionPacketLinked,
    world2Isolated: input.world2Isolated,
    world1Protected: input.world1Protected,
    constitutionPassed: input.constitutionPassed,
    taskGovernorPassed: input.taskGovernorPassed,
    founderApprovalRecorded: input.founderApprovalRecorded,
    runtimeVerificationPassed: input.runtimeVerificationPassed,
    duplicateAuthorityDetected: input.duplicateAuthorityDetected,
    targetWorld: input.targetWorld,
    directRecoveryAttempt: input.directRecoveryAttempt,
    repeatedFailureLimitReached: repeatedLimit,
  });

  const validation = validateRecovery({
    gateReport,
    recoverySteps,
    founderApprovalRecorded: input.founderApprovalRecorded,
    strategyRepeated,
  });

  const escalationRequired =
    escalationLevel === 'SELF_EVOLUTION_REVIEW' ||
    recoverySteps.some((s) => s.recoveryState === 'ESCALATION_REQUIRED');

  const needsApproval =
    !input.founderApprovalRecorded ||
    recoverySteps.some(
      (s) => s.recoveryState === 'WAITING_APPROVAL' || s.escalationLevel !== 'NONE',
    );

  const state = resolveState(validation.valid, needsApproval, escalationRequired);

  const plan: RecoveryPlan | null =
    rollbackPlan && applyPlan && input.failureContext
      ? {
          recoveryPlanId: nextPlanId(),
          rollbackPlanId: rollbackPlan.rollbackPlanId,
          applyPlanId: applyPlan.applyPlanId,
          executionPacketId: applyPlan.executionPacketId,
          projectId: applyPlan.projectId,
          workspaceId: applyPlan.workspaceId,
          failureContext,
          failureCategory,
          recoveryStrategy,
          escalationLevel,
          recoverySteps,
          riskLevel: aggregateRecoveryRisk(recoverySteps),
          approvalRequirements: validation.approvalRequirements,
          blockedReasons: validation.blockers,
          warnings: [...validation.warnings, escalationReason],
          recoveryAllowed: false,
          simulationOnly: true,
          createdAt: Date.now(),
        }
      : null;

  const report: RecoveryReport = {
    reportId: nextReportId(),
    state,
    valid: validation.valid && state !== 'BLOCKED',
    summary: validation.valid
      ? `Recovery plan prepared — ${recoverySteps.length} steps, state ${state}, strategy ${recoveryStrategy}`
      : `Recovery blocked — ${validation.blockers.length} blockers`,
    plan,
    gatesEvaluated: gateReport.gates.length,
    gatesPassed: gateReport.gates.filter((g) => g.satisfied).length,
    preparationOnly: true,
  };

  return { plan, report };
}
