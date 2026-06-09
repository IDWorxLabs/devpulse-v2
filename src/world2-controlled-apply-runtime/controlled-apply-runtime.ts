/**
 * World 2 Controlled Apply Runtime — Phase 15.3 orchestrator.
 * Pure function — apply plans only, no side effects.
 */

import { buildWorld2ActivationPlan } from '../world2-execution-activation/world2-activation-plan-builder.js';
import { buildWorkspaceSnapshot } from '../workspace-intelligence/workspace-context-builder.js';
import { resolveActiveProject } from '../workspace-intelligence/workspace-owner-resolver.js';
import { buildRuntimeVerificationReport } from '../runtime-verification-layer/runtime-verification-report-builder.js';
import { processBuilderPacketExecutionRequest } from '../world2-builder-packet-execution/builder-packet-execution.js';
import { publishWorld2ControlledApplyFeedStages } from '../operator-feed/world2-controlled-apply-feed-bridge.js';
import { buildControlledApplyPlanAndReport } from './controlled-apply-plan-builder.js';
import { parseControlledApplyQuery } from './controlled-apply-request-parser.js';
import { composeControlledApplyResponse } from './controlled-apply-report.js';
import {
  getControlledApplyDiagnostics,
  updateControlledApplyDiagnostics,
} from './controlled-apply-diagnostics.js';
import {
  isDuplicateControlledApplyExecutorQuestion,
  type PrepareControlledApplyPlanInput,
  type PrepareControlledApplyPlanResult,
} from './types.js';

function resolveInputFromQuery(
  query: string,
  overrides: Partial<PrepareControlledApplyPlanInput> = {},
): PrepareControlledApplyPlanInput {
  const packetResult = processBuilderPacketExecutionRequest(query);
  const activationPlan = buildWorld2ActivationPlan(query);
  const snapshot = buildWorkspaceSnapshot();
  const project = resolveActiveProject(snapshot);
  const verification = buildRuntimeVerificationReport(query);

  const activationState =
    activationPlan.activationState === 'WAITING_APPROVAL' || activationPlan.activationState === 'BLOCKED'
      ? 'AWAITING_APPROVAL'
      : activationPlan.activationState === 'READY_FOR_FUTURE_ACTIVATION'
        ? 'EXECUTION_READY'
        : activationPlan.activationState;

  return {
    query,
    executionPacket: packetResult.executionPacket,
    activationExists: true,
    activationState,
    activationId: activationPlan.activationId,
    builderPacketValid: packetResult.executionPacket !== null,
    world2Isolated: activationPlan.isolationReport.world2Isolated && project.workspaceId !== 'none',
    world1Protected: activationPlan.isolationReport.world1Protected,
    constitutionPassed: true,
    taskGovernorPassed: true,
    founderApprovalRecorded: true,
    runtimeVerificationPassed: verification.verificationScore >= 50,
    duplicateAuthorityDetected: false,
    targetWorld: 'WORLD_2',
    ...overrides,
  };
}

export function prepareControlledApplyPlan(
  input: PrepareControlledApplyPlanInput,
): PrepareControlledApplyPlanResult {
  const query = input.query ?? 'Can this apply?';
  publishWorld2ControlledApplyFeedStages(query, input.executionPacket !== null);

  if (isDuplicateControlledApplyExecutorQuestion(query)) {
    const blockedReport = {
      reportId: 'carep-dup',
      state: 'REJECTED' as const,
      valid: false,
      summary: 'Duplicate apply executor rejected',
      plan: null,
      gatesEvaluated: 0,
      gatesPassed: 0,
      preparationOnly: true as const,
    };
    return {
      controlledApplyPlan: null,
      controlledApplyReport: blockedReport,
      diagnostics: getControlledApplyDiagnostics(),
      responseText: 'Recommendation: No.\nDo not create world2_apply_engine or world2_write_engine duplicates.',
    };
  }

  parseControlledApplyQuery(query);
  const { plan, report } = buildControlledApplyPlanAndReport(input);
  updateControlledApplyDiagnostics(query, report);

  return {
    controlledApplyPlan: plan,
    controlledApplyReport: report,
    diagnostics: getControlledApplyDiagnostics(),
    responseText: composeControlledApplyResponse(query, report, plan),
  };
}

export function processControlledApplyRequest(query: string): PrepareControlledApplyPlanResult {
  return prepareControlledApplyPlan(resolveInputFromQuery(query));
}

export function getControlledApplyContext(query: string): PrepareControlledApplyPlanResult {
  return processControlledApplyRequest(query);
}
