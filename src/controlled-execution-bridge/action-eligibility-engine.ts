/**
 * Action eligibility engine — classifies proposed actions for gated execution eligibility.
 * Classification only. No execution, file modification, or command execution.
 */

import type { BridgeInput, ExecutionRequest } from './types.js';
import { SPECIAL_APPROVAL_ACTION_TYPES, WORLD1_TARGET_PATTERNS } from './types.js';
import { isGlobalEligibilityMet } from './protection-gate-engine.js';

function targetsProtectedDomain(path: string, projectId: string): string | null {
  const lower = path.toLowerCase();
  if (WORLD1_TARGET_PATTERNS.some((p) => lower.includes(p))) {
    return 'Action targets protected domain';
  }
  if (lower.includes('law_enforcement') || lower.includes('verification_gated_apply')) {
    return 'Action targets governance stack';
  }
  const normalizedProject = projectId.trim().toLowerCase().replace(/\s+/g, '-');
  if (lower.includes('world2/') && !lower.includes(`world2/${normalizedProject}`)) {
    return 'Action targets another workspace';
  }
  return null;
}

function isSpecialApprovalType(actionType: string): boolean {
  return (SPECIAL_APPROVAL_ACTION_TYPES as readonly string[]).includes(actionType);
}

export function classifyPreparedAction(
  input: BridgeInput,
  action: BridgeInput['preparedActions'][number],
  index: number,
  globalEligible: boolean,
): ExecutionRequest {
  const requestId = `exec-req-${(index + 1).toString().padStart(4, '0')}`;
  const requiresSpecial = isSpecialApprovalType(action.actionType);
  const specialSatisfied = Boolean(input.specialApproval && input.founderApproved);

  let blockReason = '';
  let eligible = globalEligible;

  if (!input.founderApproved) {
    eligible = false;
    blockReason = 'Founder approval required';
  } else if (!input.simulationPassed) {
    eligible = false;
    blockReason = 'Simulation must pass before execution eligibility';
  } else if (!['COMPLETE', 'COMPLETE_WITH_WARNINGS'].includes(input.completionStatus)) {
    eligible = false;
    blockReason = `Completion status ${input.completionStatus} blocks execution`;
  } else if (input.completionConfidence === 'LOW') {
    eligible = false;
    blockReason = 'Low completion confidence blocks execution';
  } else if (input.workspaceIsolationStatus !== 'PASS') {
    eligible = false;
    blockReason = 'Workspace isolation failure blocks execution';
  } else if (input.world1ProtectionStatus !== 'PASS') {
    eligible = false;
    blockReason = 'World 1 protection failure blocks execution';
  } else if (input.governanceStatus !== 'PASS') {
    eligible = false;
    blockReason = 'Governance failure blocks execution';
  } else if (input.verificationRequirements.length === 0) {
    eligible = false;
    blockReason = 'Verification requirements missing';
  } else if (input.rollbackRequirements.length === 0) {
    eligible = false;
    blockReason = 'Rollback requirements missing';
  } else if (input.riskControls.length === 0) {
    eligible = false;
    blockReason = 'Risk controls missing';
  }

  const protectedTarget = targetsProtectedDomain(action.targetPath, input.projectId);
  if (protectedTarget) {
    eligible = false;
    blockReason = protectedTarget;
  }

  if (requiresSpecial) {
    if (!specialSatisfied) {
      eligible = false;
      blockReason = `${action.actionType} requires special approval with founder approval, verification gate, and rollback gate`;
    } else if (input.verificationRequirements.length === 0 || input.rollbackRequirements.length === 0) {
      eligible = false;
      blockReason = `${action.actionType} requires verification and rollback gates even with special approval`;
    }
  }

  if (!globalEligible && blockReason === '') {
    blockReason = 'Global eligibility conditions not met';
    eligible = false;
  }

  return {
    requestId,
    actionId: action.actionId,
    actionType: action.actionType,
    targetPath: action.targetPath,
    description: action.description,
    eligibility: eligible ? 'ELIGIBLE' : 'BLOCKED',
    blockReason: eligible ? '' : blockReason,
    requiresSpecialApproval: requiresSpecial,
    specialApprovalSatisfied: specialSatisfied,
    classificationOnly: true,
    executed: false,
  };
}

export function classifyPreparedActions(input: BridgeInput): {
  eligible: ExecutionRequest[];
  blocked: ExecutionRequest[];
} {
  const globalEligible = isGlobalEligibilityMet(input);
  const eligible: ExecutionRequest[] = [];
  const blocked: ExecutionRequest[] = [];

  for (let i = 0; i < input.preparedActions.length; i += 1) {
    const request = classifyPreparedAction(input, input.preparedActions[i]!, i, globalEligible);
    if (request.eligibility === 'ELIGIBLE') {
      eligible.push(request);
    } else {
      blocked.push(request);
    }
  }

  for (let i = 0; i < input.blockedActions.length; i += 1) {
    const action = input.blockedActions[i]!;
    blocked.push({
      requestId: `exec-blocked-${(i + 1).toString().padStart(4, '0')}`,
      actionId: action.actionId,
      actionType: action.actionType,
      targetPath: '',
      description: action.description,
      eligibility: 'BLOCKED',
      blockReason: action.blockReason,
      requiresSpecialApproval: isSpecialApprovalType(action.actionType),
      specialApprovalSatisfied: false,
      classificationOnly: true,
      executed: false,
    });
  }

  return { eligible, blocked };
}

export function executionRequestsKey(requests: ExecutionRequest[]): string {
  return requests
    .map((r) => `${r.actionType}|${r.eligibility}|${r.blockReason.length}|${r.requiresSpecialApproval}`)
    .join(';');
}
