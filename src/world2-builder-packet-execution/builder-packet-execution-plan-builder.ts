/**
 * Builder packet execution plan builder — assembles execution packet without side effects.
 */

import { classifyBuilderPacketSteps, aggregatePacketRiskLevel } from './builder-packet-risk-classifier.js';
import { normalizeBuilderPacketSteps } from './builder-packet-step-normalizer.js';
import { validateBuilderPacketExecution } from './builder-packet-execution-validator.js';
import type {
  BuilderPacket,
  BuilderPacketExecutionPacket,
  BuilderPacketExecutionReport,
  BuilderPacketExecutionState,
  PrepareBuilderPacketExecutionInput,
} from './types.js';

let reportCounter = 0;

function nextReportId(): string {
  reportCounter += 1;
  return `bprep-${reportCounter.toString().padStart(4, '0')}`;
}

export function resetBuilderPacketExecutionReportCounterForTests(): void {
  reportCounter = 0;
}

function resolveState(valid: boolean, hasHighApproval: boolean): BuilderPacketExecutionState {
  if (!valid) return 'BLOCKED';
  if (hasHighApproval) return 'WAITING_APPROVAL';
  return 'READY_FOR_CONTROLLED_APPLY';
}

export function buildBuilderPacketExecutionPlan(
  input: PrepareBuilderPacketExecutionInput,
): { packet: BuilderPacketExecutionPacket | null; report: BuilderPacketExecutionReport } {
  const packet = input.builderPacket;
  const normalized = packet ? normalizeBuilderPacketSteps(packet.steps) : [];
  const classified = classifyBuilderPacketSteps(normalized);
  const validation = validateBuilderPacketExecution({
    builderPacket: packet,
    activationExists: input.activationExists,
    activationState: input.activationState,
    world2Isolated: input.world2Isolated,
    world1Protected: input.world1Protected,
    taskGovernorPassed: input.taskGovernorPassed,
    founderApprovalRecorded: input.founderApprovalRecorded,
    steps: classified,
  });

  const hasHighApproval = classified.some((s) => s.requiresApproval) || !input.founderApprovalRecorded;
  const state = resolveState(validation.valid, hasHighApproval);

  const executionPacket: BuilderPacketExecutionPacket | null = packet
    ? {
        builderPacketId: packet.builderPacketId,
        projectId: packet.projectId,
        workspaceId: packet.workspaceId,
        sourcePlanId: packet.sourcePlanId,
        executionIntent: packet.executionIntent,
        steps: classified,
        riskLevel: aggregatePacketRiskLevel(classified),
        requiredApprovals: validation.requiredApprovals,
        blockedReasons: validation.blockers,
        warnings: validation.warnings,
        executionAllowed: false,
        simulationOnly: true,
        createdAt: Date.now(),
      }
    : null;

  const report: BuilderPacketExecutionReport = {
    reportId: nextReportId(),
    state,
    valid: validation.valid && state !== 'BLOCKED',
    summary: validation.valid
      ? `Builder packet execution packet prepared — ${classified.length} steps, state ${state}`
      : `Builder packet execution blocked — ${validation.blockers.length} blockers`,
    packet: executionPacket,
    taskGovernorRequirementRecorded: validation.taskGovernorRequirementRecorded,
    founderApprovalRequirementRecorded: validation.founderApprovalRequirementRecorded,
    preparationOnly: true,
  };

  return { packet: executionPacket, report };
}
