/**
 * Builder packet execution validator — validates preparation preconditions.
 */

import { VALID_ACTIVATION_STATES, type BuilderPacket, type BuilderPacketExecutionStep } from './types.js';

export interface BuilderPacketValidationResult {
  valid: boolean;
  blockers: string[];
  warnings: string[];
  requiredApprovals: string[];
  taskGovernorRequirementRecorded: boolean;
  founderApprovalRequirementRecorded: boolean;
}

function isValidActivationState(state: string | null): boolean {
  if (!state) return false;
  return (VALID_ACTIVATION_STATES as readonly string[]).includes(state);
}

export function validateBuilderPacketExecution(opts: {
  builderPacket: BuilderPacket | null;
  activationExists: boolean;
  activationState: string | null;
  world2Isolated: boolean;
  world1Protected: boolean;
  taskGovernorPassed: boolean;
  founderApprovalRecorded: boolean;
  steps: BuilderPacketExecutionStep[];
}): BuilderPacketValidationResult {
  const blockers: string[] = [];
  const warnings: string[] = [];
  const requiredApprovals: string[] = [];

  if (!opts.activationExists) {
    blockers.push('Missing World 2 activation — Phase 15.1 activation plan required');
  }

  if (!isValidActivationState(opts.activationState)) {
    blockers.push(
      `Activation state must be EXECUTION_READY or AWAITING_APPROVAL — got ${opts.activationState ?? 'none'}`,
    );
  }

  if (!opts.builderPacket) {
    blockers.push('Missing builder packet — cannot prepare execution packet');
  } else {
    if (!opts.builderPacket.projectId) {
      blockers.push('Builder packet missing projectId');
    }
    if (!opts.builderPacket.workspaceId) {
      blockers.push('Builder packet missing workspaceId');
    }
    if (opts.builderPacket.targetWorld === 'WORLD_1') {
      blockers.push('World 1 target detected — builder packet execution must target World 2 only');
    }
  }

  if (!opts.world2Isolated) {
    blockers.push('Workspace not isolated — World 2 workspace isolation required');
  }

  if (!opts.world1Protected) {
    blockers.push('World 1 protection check failed');
  }

  if (!opts.taskGovernorPassed) {
    blockers.push('Task Governor check failed — governed scheduling required');
  }

  requiredApprovals.push('Founder approval required before any future controlled apply');
  if (!opts.founderApprovalRecorded) {
    warnings.push('Founder approval requirement recorded but not yet satisfied');
  }

  for (const step of opts.steps) {
    if (!step.allowedInThisPhase) {
      blockers.push(`Unsafe/blocked step: ${step.stepType} — ${step.blockedReason ?? 'blocked'}`);
    }
    if (step.riskLevel === 'CRITICAL') {
      blockers.push(`Critical risk step: ${step.title} (${step.stepType})`);
    }
    if (step.requiresApproval) {
      requiredApprovals.push(`Approval required for step ${step.stepId}: ${step.title}`);
    }
  }

  warnings.push('Phase 15.2 preparation only — no file writes, no apply, no shell commands');

  return {
    valid: blockers.length === 0,
    blockers,
    warnings,
    requiredApprovals,
    taskGovernorRequirementRecorded: opts.taskGovernorPassed,
    founderApprovalRequirementRecorded: true,
  };
}
