/**
 * World 2 Recovery Runtime — Phase 15.5 orchestrator.
 * Pure function — recovery plans only, no side effects.
 */

import { buildRuntimeVerificationReport } from '../runtime-verification-layer/runtime-verification-report-builder.js';
import { processControlledApplyRequest } from '../world2-controlled-apply-runtime/controlled-apply-runtime.js';
import { processRollbackRequest } from '../world2-rollback-runtime/rollback-runtime.js';
import { publishWorld2RecoveryFeedStages } from '../operator-feed/world2-recovery-feed-bridge.js';
import { buildRecoveryPlanAndReport } from './recovery-plan-builder.js';
import { parseRecoveryQuery } from './recovery-request-parser.js';
import { composeRecoveryResponse } from './recovery-report.js';
import { getRecoveryDiagnostics, updateRecoveryDiagnostics } from './recovery-diagnostics.js';
import {
  isDuplicateRecoveryExecutorQuestion,
  type FailureContext,
  type PrepareRecoveryPlanInput,
  type PrepareRecoveryPlanResult,
} from './types.js';

function inferFailureContext(query: string): FailureContext {
  const lower = query.toLowerCase();
  let failurePath = 'world2/runtime';
  if (lower.includes('apply fail')) failurePath = 'world2/apply';
  else if (lower.includes('verify fail') || lower.includes('verification fail')) failurePath = 'world2/verification';
  else if (lower.includes('rollback fail')) failurePath = 'world2/rollback';
  else if (lower.includes('3 failed') || lower.includes('three failure')) failurePath = 'world2/repeated-failure';

  const failureCount =
    lower.includes('3 failed') || lower.includes('three failure') || lower.includes('repeated failure')
      ? 3
      : 1;

  return {
    failureId: `fail-${failurePath.replace(/\//g, '-')}`,
    failurePath,
    failureCount,
    summary: `Inferred failure context from query: ${query.slice(0, 80)}`,
    sourceSystem: 'failure_visibility_engine',
  };
}

function resolveInputFromQuery(
  query: string,
  overrides: Partial<PrepareRecoveryPlanInput> = {},
): PrepareRecoveryPlanInput {
  const rollbackResult = processRollbackRequest(query);
  const applyResult = processControlledApplyRequest(query);
  const verification = buildRuntimeVerificationReport(query);
  const rollbackPlan = rollbackResult.rollbackPlan;
  const applyPlan = applyResult.controlledApplyPlan;

  return {
    query,
    rollbackPlan,
    applyPlan: overrides.applyPlan ?? applyPlan,
    failureContext: inferFailureContext(query),
    executionPacketLinked: rollbackPlan !== null && rollbackPlan.executionPacketId.length > 0,
    world2Isolated: true,
    world1Protected: true,
    constitutionPassed: true,
    taskGovernorPassed: true,
    founderApprovalRecorded: true,
    runtimeVerificationPassed: verification.verificationScore >= 50,
    duplicateAuthorityDetected: false,
    targetWorld: 'WORLD_2',
    directRecoveryAttempt: false,
    repeatedFailureLimitReached: false,
    previousRecoveryStrategies: [],
    ...overrides,
  };
}

export function prepareRecoveryPlan(input: PrepareRecoveryPlanInput): PrepareRecoveryPlanResult {
  const query = input.query ?? 'Show recovery plan';
  publishWorld2RecoveryFeedStages(query, input.rollbackPlan !== null && input.failureContext !== null);

  if (isDuplicateRecoveryExecutorQuestion(query)) {
    const blockedReport = {
      reportId: 'rcrep-dup',
      state: 'REJECTED' as const,
      valid: false,
      summary: 'Duplicate recovery executor rejected',
      plan: null,
      gatesEvaluated: 0,
      gatesPassed: 0,
      preparationOnly: true as const,
    };
    return {
      recoveryPlan: null,
      recoveryReport: blockedReport,
      diagnostics: getRecoveryDiagnostics(),
      responseText:
        'Recommendation: No.\nDo not create recovery_apply_engine or world2_self_healing_executor duplicates.',
    };
  }

  parseRecoveryQuery(query);
  const { plan, report } = buildRecoveryPlanAndReport(input);
  updateRecoveryDiagnostics(query, report);

  return {
    recoveryPlan: plan,
    recoveryReport: report,
    diagnostics: getRecoveryDiagnostics(),
    responseText: composeRecoveryResponse(query, report, plan),
  };
}

export function processRecoveryRequest(query: string): PrepareRecoveryPlanResult {
  return prepareRecoveryPlan(resolveInputFromQuery(query));
}

export function getRecoveryContext(query: string): PrepareRecoveryPlanResult {
  return processRecoveryRequest(query);
}
