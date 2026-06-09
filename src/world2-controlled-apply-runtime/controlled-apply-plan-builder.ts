/**
 * Controlled apply plan builder — assembles apply plan without side effects.
 */

import { evaluateControlledApplyGates } from './controlled-apply-gate-engine.js';
import {
  aggregateControlledApplyRisk,
  buildControlledApplySteps,
} from './controlled-apply-risk-engine.js';
import { validateControlledApply } from './controlled-apply-validator.js';
import type {
  ControlledApplyPlan,
  ControlledApplyReport,
  ControlledApplyState,
  PrepareControlledApplyPlanInput,
} from './types.js';

let planCounter = 0;
let reportCounter = 0;

function nextApplyPlanId(): string {
  planCounter += 1;
  return `caplan-${planCounter.toString().padStart(4, '0')}`;
}

function nextReportId(): string {
  reportCounter += 1;
  return `carep-${reportCounter.toString().padStart(4, '0')}`;
}

export function resetControlledApplyPlanCounterForTests(): void {
  planCounter = 0;
  reportCounter = 0;
}

function resolveState(valid: boolean, needsApproval: boolean): ControlledApplyState {
  if (!valid) return 'BLOCKED';
  if (needsApproval) return 'WAITING_APPROVAL';
  return 'READY_FOR_FUTURE_APPLY';
}

export function buildControlledApplyPlanAndReport(input: PrepareControlledApplyPlanInput): {
  plan: ControlledApplyPlan | null;
  report: ControlledApplyReport;
} {
  const packet = input.executionPacket;
  const applySteps = packet ? buildControlledApplySteps(packet.steps) : [];

  const gateReport = evaluateControlledApplyGates({
    activationExists: input.activationExists,
    activationState: input.activationState,
    builderPacketValid: input.builderPacketValid,
    executionPacketExists: packet !== null,
    world2Isolated: input.world2Isolated,
    world1Protected: input.world1Protected,
    constitutionPassed: input.constitutionPassed,
    taskGovernorPassed: input.taskGovernorPassed,
    founderApprovalRecorded: input.founderApprovalRecorded,
    runtimeVerificationPassed: input.runtimeVerificationPassed,
    duplicateAuthorityDetected: input.duplicateAuthorityDetected,
    targetWorld: input.targetWorld,
  });

  const validation = validateControlledApply({
    gateReport,
    applySteps,
    founderApprovalRecorded: input.founderApprovalRecorded,
  });

  const needsApproval =
    !input.founderApprovalRecorded ||
    applySteps.some((s) => s.applyState === 'WAITING_APPROVAL' || s.approvalLevel !== 'NONE');

  const state = resolveState(validation.valid, needsApproval);

  const plan: ControlledApplyPlan | null = packet
    ? {
        applyPlanId: nextApplyPlanId(),
        executionPacketId: packet.builderPacketId,
        projectId: packet.projectId,
        workspaceId: packet.workspaceId,
        riskLevel: aggregateControlledApplyRisk(applySteps),
        approvalRequirements: validation.approvalRequirements,
        blockedReasons: validation.blockers,
        warnings: validation.warnings,
        applySteps,
        simulationOnly: true,
        applyAllowed: false,
        createdAt: Date.now(),
      }
    : null;

  const report: ControlledApplyReport = {
    reportId: nextReportId(),
    state,
    valid: validation.valid && state !== 'BLOCKED',
    summary: validation.valid
      ? `Controlled apply plan prepared — ${applySteps.length} steps, state ${state}`
      : `Controlled apply blocked — ${validation.blockers.length} blockers`,
    plan,
    gatesEvaluated: gateReport.gates.length,
    gatesPassed: gateReport.passedCount,
    preparationOnly: true,
  };

  return { plan, report };
}
