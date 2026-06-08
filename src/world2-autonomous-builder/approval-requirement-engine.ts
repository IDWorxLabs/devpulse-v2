/**
 * Approval requirement engine — defines founder approval gates for proposed actions.
 * Dry-run foundation only. No execution.
 */

import type { ApprovalRequirement, BuilderInput, PreparedAction } from './types.js';
import { APPROVAL_REQUIRED_ACTION_TYPES } from './types.js';

export function generateApprovalRequirements(
  input: BuilderInput,
  preparedActions: PreparedAction[],
): ApprovalRequirement[] {
  const requirements: ApprovalRequirement[] = [];
  let reqIndex = 0;

  for (const action of preparedActions) {
    if (!(APPROVAL_REQUIRED_ACTION_TYPES as readonly string[]).includes(action.actionType)) {
      continue;
    }

    reqIndex += 1;
    requirements.push({
      requirementId: `world2-approval-${reqIndex.toString().padStart(4, '0')}`,
      actionType: action.actionType,
      description: `Founder approval required for ${action.actionType} on ${action.targetPath}`,
      founderApprovalRequired: true,
      satisfied: input.approvedByFounder,
    });
  }

  if (!input.approvedByFounder) {
    reqIndex += 1;
    requirements.push({
      requirementId: `world2-approval-${reqIndex.toString().padStart(4, '0')}`,
      actionType: 'UPDATE_WORKSPACE_STATE_PROPOSED',
      description: 'Founder approval required before any World 2 build packet proceeds',
      founderApprovalRequired: true,
      satisfied: false,
    });
  }

  return requirements;
}

export function approvalRequirementsKey(requirements: ApprovalRequirement[]): string {
  return requirements
    .map((r) => `${r.actionType}|${r.founderApprovalRequired}|${r.satisfied}`)
    .join(';');
}

export function unsatisfiedApprovalCount(requirements: ApprovalRequirement[]): number {
  return requirements.filter((r) => r.founderApprovalRequired && !r.satisfied).length;
}
