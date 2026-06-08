/**
 * Approval classification engine — classifies approval types and gates.
 * Classification only. No execution.
 */

import { getDevPulseV2World2WorkspaceFoundation } from '../world2-workspace-foundation/index.js';
import { normalizeProjectId } from '../world2-workspace-foundation/workspace-identity.js';
import { checkCrossWorkspaceAccess } from '../world2-workspace-foundation/workspace-boundary-rules.js';
import type { ApprovalInput, ApprovalType, GateRecord } from './types.js';
import { KNOWN_APPROVAL_TYPES } from './types.js';

export interface ClassificationResult {
  valid: boolean;
  approvalType: ApprovalType;
  reason: string;
  gates: GateRecord[];
  effectiveProjectId: string;
  effectiveWorkspaceId: string;
}

export function classifyApproval(input: ApprovalInput): ClassificationResult {
  const gates: GateRecord[] = [];

  if (input.approvalType === 'UNKNOWN') {
    gates.push({
      gateId: 'class-type-0001',
      gateType: 'APPROVAL_TYPE',
      status: 'CLOSED',
      description: 'approvalType UNKNOWN blocked',
    });
    return {
      valid: false,
      approvalType: 'UNKNOWN',
      reason: 'approvalType UNKNOWN blocked',
      gates,
      effectiveProjectId: '',
      effectiveWorkspaceId: '',
    };
  }

  if (!(KNOWN_APPROVAL_TYPES as readonly string[]).includes(input.approvalType)) {
    gates.push({
      gateId: 'class-type-0002',
      gateType: 'APPROVAL_TYPE',
      status: 'CLOSED',
      description: `Unknown approval type: ${input.approvalType}`,
    });
    return {
      valid: false,
      approvalType: input.approvalType,
      reason: 'Unknown approval type',
      gates,
      effectiveProjectId: '',
      effectiveWorkspaceId: '',
    };
  }

  if (!input.workspaceId?.trim() || !input.projectId?.trim()) {
    gates.push({
      gateId: 'class-ctx-0001',
      gateType: 'PROJECT_CONTEXT',
      status: 'CLOSED',
      description: 'workspaceId and projectId required',
    });
    return {
      valid: false,
      approvalType: input.approvalType,
      reason: 'Project context required',
      gates,
      effectiveProjectId: '',
      effectiveWorkspaceId: '',
    };
  }

  const foundation = getDevPulseV2World2WorkspaceFoundation();
  const workspace = foundation.getManager().getWorkspace(input.workspaceId);
  const normalizedProjectId = normalizeProjectId(input.projectId);

  if (!workspace) {
    gates.push({
      gateId: 'class-ws-0001',
      gateType: 'WORKSPACE_OWNERSHIP',
      status: 'CLOSED',
      description: `Workspace not found: ${input.workspaceId}`,
    });
    return {
      valid: false,
      approvalType: input.approvalType,
      reason: 'Workspace not found',
      gates,
      effectiveProjectId: '',
      effectiveWorkspaceId: '',
    };
  }

  if (workspace.projectId !== normalizedProjectId) {
    gates.push({
      gateId: 'class-proj-0001',
      gateType: 'PROJECT_OWNERSHIP',
      status: 'CLOSED',
      description: 'projectId does not match workspace ownership',
    });
    return {
      valid: false,
      approvalType: input.approvalType,
      reason: 'Project ownership mismatch',
      gates,
      effectiveProjectId: '',
      effectiveWorkspaceId: '',
    };
  }

  if (input.targetWorkspaceId && input.targetWorkspaceId !== input.workspaceId) {
    const target = foundation.getManager().getWorkspace(input.targetWorkspaceId);
    const crossCheck = checkCrossWorkspaceAccess(input.workspaceId, target);
    if (!crossCheck.allowed) {
      gates.push({
        gateId: 'class-cross-0001',
        gateType: 'CROSS_WORKSPACE',
        status: 'CLOSED',
        description: crossCheck.reason,
      });
      return {
        valid: false,
        approvalType: input.approvalType,
        reason: crossCheck.reason,
        gates,
        effectiveProjectId: '',
        effectiveWorkspaceId: '',
      };
    }
  }

  if (input.targetProjectId) {
    const normalizedTarget = normalizeProjectId(input.targetProjectId);
    if (normalizedTarget !== normalizedProjectId) {
      gates.push({
        gateId: 'class-cross-0002',
        gateType: 'CROSS_PROJECT',
        status: 'CLOSED',
        description: 'Approval targets another project without ownership',
      });
      return {
        valid: false,
        approvalType: input.approvalType,
        reason: 'Cross-project approval blocked',
        gates,
        effectiveProjectId: '',
        effectiveWorkspaceId: '',
      };
    }
  }

  gates.push({
    gateId: 'class-type-0003',
    gateType: 'APPROVAL_TYPE',
    status: 'OPEN',
    description: `Approval classified: ${input.approvalType}`,
  });

  return {
    valid: true,
    approvalType: input.approvalType,
    reason: 'Approval classified',
    gates,
    effectiveProjectId: normalizedProjectId,
    effectiveWorkspaceId: input.workspaceId,
  };
}

export function classificationKey(type: ApprovalType, valid: boolean): string {
  return `${type}|${valid}`;
}

export function requiresFounderReview(type: ApprovalType): boolean {
  return (
    type === 'WORLD1_ACTION' ||
    type === 'CONTROLLED_EXECUTION' ||
    type === 'DEPLOYMENT_REQUEST' ||
    type === 'DELETE_REQUEST'
  );
}
