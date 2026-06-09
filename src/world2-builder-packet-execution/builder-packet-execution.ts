/**
 * World 2 Builder Packet Execution — Phase 15.2 orchestrator.
 * Pure preparation — no side effects, no file writes, no apply.
 */

import { buildWorkspaceSnapshot } from '../workspace-intelligence/workspace-context-builder.js';
import { resolveActiveProject } from '../workspace-intelligence/workspace-owner-resolver.js';
import { buildWorld2ActivationPlan } from '../world2-execution-activation/world2-activation-plan-builder.js';
import { publishWorld2BuilderPacketExecutionFeedStages } from '../operator-feed/world2-builder-packet-execution-feed-bridge.js';
import { buildBuilderPacketExecutionPlan } from './builder-packet-execution-plan-builder.js';
import {
  createDefaultBuilderPacket,
  parseBuilderPacketExecutionQuery,
} from './builder-packet-execution-request-parser.js';
import { composeBuilderPacketExecutionResponse } from './builder-packet-execution-report.js';
import {
  getBuilderPacketExecutionDiagnostics,
  updateBuilderPacketExecutionDiagnostics,
} from './builder-packet-execution-diagnostics.js';
import {
  isDuplicateBuilderPacketExecutorQuestion,
  type PrepareBuilderPacketExecutionInput,
  type PrepareBuilderPacketExecutionResult,
} from './types.js';

function activationContextFromQuery(query: string): {
  activationExists: boolean;
  activationState: string;
  activationId: string;
  world2Isolated: boolean;
  world1Protected: boolean;
} {
  const plan = buildWorld2ActivationPlan(query);
  const snapshot = buildWorkspaceSnapshot();
  const project = resolveActiveProject(snapshot);

  const normalizedState =
    plan.activationState === 'WAITING_APPROVAL' || plan.activationState === 'BLOCKED'
      ? 'AWAITING_APPROVAL'
      : plan.activationState === 'READY_FOR_FUTURE_ACTIVATION'
        ? 'EXECUTION_READY'
        : plan.activationState;

  return {
    activationExists: true,
    activationState: normalizedState,
    activationId: plan.activationId,
    world2Isolated: plan.isolationReport.world2Isolated && project.workspaceId !== 'none',
    world1Protected: plan.isolationReport.world1Protected,
  };
}

function resolveInputFromQuery(query: string, overrides: Partial<PrepareBuilderPacketExecutionInput> = {}): PrepareBuilderPacketExecutionInput {
  const activation = activationContextFromQuery(query);
  return {
    query,
    builderPacket: createDefaultBuilderPacket(),
    activationExists: activation.activationExists,
    activationState: activation.activationState,
    activationId: activation.activationId,
    world2Isolated: activation.world2Isolated,
    world1Protected: activation.world1Protected,
    taskGovernorPassed: true,
    founderApprovalRecorded: false,
    ...overrides,
  };
}

export function prepareBuilderPacketExecution(
  input: PrepareBuilderPacketExecutionInput,
): PrepareBuilderPacketExecutionResult {
  const query = input.query ?? 'Prepare builder packet execution';
  publishWorld2BuilderPacketExecutionFeedStages(query, input.builderPacket !== null);

  if (isDuplicateBuilderPacketExecutorQuestion(query)) {
    const blockedReport = {
      reportId: 'bprep-dup',
      state: 'BLOCKED' as const,
      valid: false,
      summary: 'Duplicate executor rejected — extend world2_builder_packet_execution only',
      packet: null,
      taskGovernorRequirementRecorded: false,
      founderApprovalRequirementRecorded: false,
      preparationOnly: true as const,
    };
    return {
      executionPacket: null,
      executionReport: blockedReport,
      diagnostics: getBuilderPacketExecutionDiagnostics(),
      responseText: 'Recommendation: No.\nDo not create world2_executor or world2_apply_engine duplicates.',
    };
  }

  parseBuilderPacketExecutionQuery(query);
  const { packet, report } = buildBuilderPacketExecutionPlan(input);
  updateBuilderPacketExecutionDiagnostics(query, report);

  return {
    executionPacket: packet,
    executionReport: report,
    diagnostics: getBuilderPacketExecutionDiagnostics(),
    responseText: composeBuilderPacketExecutionResponse(query, report, packet),
  };
}

export function processBuilderPacketExecutionRequest(query: string): PrepareBuilderPacketExecutionResult {
  return prepareBuilderPacketExecution(resolveInputFromQuery(query));
}

export function getBuilderPacketExecutionContext(query: string): PrepareBuilderPacketExecutionResult {
  return processBuilderPacketExecutionRequest(query);
}
