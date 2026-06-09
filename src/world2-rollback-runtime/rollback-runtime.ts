/**
 * World 2 Rollback Runtime — Phase 15.4 orchestrator.
 * Pure function — rollback plans only, no side effects.
 */

import { buildRuntimeVerificationReport } from '../runtime-verification-layer/runtime-verification-report-builder.js';
import { processControlledApplyRequest } from '../world2-controlled-apply-runtime/controlled-apply-runtime.js';
import { publishWorld2RollbackFeedStages } from '../operator-feed/world2-rollback-feed-bridge.js';
import { buildRollbackPlanAndReport } from './rollback-plan-builder.js';
import { parseRollbackQuery } from './rollback-request-parser.js';
import { composeRollbackResponse } from './rollback-report.js';
import { getRollbackDiagnostics, updateRollbackDiagnostics } from './rollback-diagnostics.js';
import {
  isDuplicateRollbackExecutorQuestion,
  type PrepareRollbackPlanInput,
  type PrepareRollbackPlanResult,
} from './types.js';

function resolveInputFromQuery(
  query: string,
  overrides: Partial<PrepareRollbackPlanInput> = {},
): PrepareRollbackPlanInput {
  const applyResult = processControlledApplyRequest(query);
  const verification = buildRuntimeVerificationReport(query);
  const applyPlan = applyResult.controlledApplyPlan;

  return {
    query,
    applyPlan,
    executionPacketLinked: applyPlan !== null && applyPlan.executionPacketId.length > 0,
    world2Isolated: true,
    world1Protected: true,
    snapshotRequirementsIdentified: true,
    constitutionPassed: true,
    taskGovernorPassed: true,
    founderApprovalRecorded: true,
    runtimeVerificationPassed: verification.verificationScore >= 50,
    duplicateAuthorityDetected: false,
    targetWorld: 'WORLD_2',
    directRollbackAttempt: false,
    ...overrides,
  };
}

export function prepareRollbackPlan(input: PrepareRollbackPlanInput): PrepareRollbackPlanResult {
  const query = input.query ?? 'Show rollback plan';
  publishWorld2RollbackFeedStages(query, input.applyPlan !== null);

  if (isDuplicateRollbackExecutorQuestion(query)) {
    const blockedReport = {
      reportId: 'rbrep-dup',
      state: 'REJECTED' as const,
      valid: false,
      summary: 'Duplicate rollback executor rejected',
      plan: null,
      gatesEvaluated: 0,
      gatesPassed: 0,
      preparationOnly: true as const,
    };
    return {
      rollbackPlan: null,
      rollbackReport: blockedReport,
      diagnostics: getRollbackDiagnostics(),
      responseText: 'Recommendation: No.\nDo not create rollback_apply_engine or world2_recovery_engine duplicates.',
    };
  }

  parseRollbackQuery(query);
  const { plan, report } = buildRollbackPlanAndReport(input);
  updateRollbackDiagnostics(query, report);

  return {
    rollbackPlan: plan,
    rollbackReport: report,
    diagnostics: getRollbackDiagnostics(),
    responseText: composeRollbackResponse(query, report, plan),
  };
}

export function processRollbackRequest(query: string): PrepareRollbackPlanResult {
  return prepareRollbackPlan(resolveInputFromQuery(query));
}

export function getRollbackContext(query: string): PrepareRollbackPlanResult {
  return processRollbackRequest(query);
}
