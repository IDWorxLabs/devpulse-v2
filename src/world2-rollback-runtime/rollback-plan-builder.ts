/**
 * Rollback plan builder — assembles rollback plan without side effects.
 */

import { analyzeSnapshotRequirements, snapshotRequirementsIdentified } from './rollback-snapshot-analyzer.js';
import {
  aggregateRollbackRisk,
  buildRollbackSteps,
} from './rollback-risk-engine.js';
import { evaluateRollbackGates, validateRollback } from './rollback-validator.js';
import type {
  PrepareRollbackPlanInput,
  RollbackPlan,
  RollbackReport,
  RollbackState,
} from './types.js';

let planCounter = 0;
let reportCounter = 0;

function nextPlanId(): string {
  planCounter += 1;
  return `rbplan-${planCounter.toString().padStart(4, '0')}`;
}

function nextReportId(): string {
  reportCounter += 1;
  return `rbrep-${reportCounter.toString().padStart(4, '0')}`;
}

export function resetRollbackPlanCounterForTests(): void {
  planCounter = 0;
  reportCounter = 0;
}

function resolveState(valid: boolean, needsApproval: boolean): RollbackState {
  if (!valid) return 'BLOCKED';
  if (needsApproval) return 'WAITING_APPROVAL';
  return 'READY_FOR_FUTURE_ROLLBACK';
}

export function buildRollbackPlanAndReport(input: PrepareRollbackPlanInput): {
  plan: RollbackPlan | null;
  report: RollbackReport;
} {
  const applyPlan = input.applyPlan;
  const snapshotRequirements = analyzeSnapshotRequirements(applyPlan);
  const snapshotOk = input.snapshotRequirementsIdentified || snapshotRequirementsIdentified(snapshotRequirements);
  const rollbackSteps = applyPlan ? buildRollbackSteps(applyPlan.applySteps) : [];

  const gateReport = evaluateRollbackGates({
    applyPlan,
    executionPacketLinked: input.executionPacketLinked,
    world2Isolated: input.world2Isolated,
    world1Protected: input.world1Protected,
    snapshotRequirements,
    snapshotRequirementsIdentified: snapshotOk,
    constitutionPassed: input.constitutionPassed,
    taskGovernorPassed: input.taskGovernorPassed,
    founderApprovalRecorded: input.founderApprovalRecorded,
    runtimeVerificationPassed: input.runtimeVerificationPassed,
    duplicateAuthorityDetected: input.duplicateAuthorityDetected,
    targetWorld: input.targetWorld,
    directRollbackAttempt: input.directRollbackAttempt,
  });

  const validation = validateRollback({
    gateReport,
    rollbackSteps,
    snapshotRequirements,
    founderApprovalRecorded: input.founderApprovalRecorded,
  });

  const needsApproval =
    !input.founderApprovalRecorded ||
    rollbackSteps.some((s) => s.rollbackState === 'WAITING_APPROVAL' || s.approvalLevel !== 'NONE');

  const state = resolveState(validation.valid, needsApproval);

  const plan: RollbackPlan | null = applyPlan
    ? {
        rollbackPlanId: nextPlanId(),
        applyPlanId: applyPlan.applyPlanId,
        executionPacketId: applyPlan.executionPacketId,
        projectId: applyPlan.projectId,
        workspaceId: applyPlan.workspaceId,
        snapshotRequirement: snapshotRequirements,
        rollbackSteps,
        riskLevel: aggregateRollbackRisk(rollbackSteps),
        approvalRequirements: validation.approvalRequirements,
        blockedReasons: validation.blockers,
        warnings: validation.warnings,
        rollbackAllowed: false,
        simulationOnly: true,
        createdAt: Date.now(),
      }
    : null;

  const report: RollbackReport = {
    reportId: nextReportId(),
    state,
    valid: validation.valid && state !== 'BLOCKED',
    summary: validation.valid
      ? `Rollback plan prepared — ${rollbackSteps.length} steps, state ${state}`
      : `Rollback blocked — ${validation.blockers.length} blockers`,
    plan,
    gatesEvaluated: gateReport.gates.length,
    gatesPassed: gateReport.gates.filter((g) => g.satisfied).length,
    preparationOnly: true,
  };

  return { plan, report };
}
