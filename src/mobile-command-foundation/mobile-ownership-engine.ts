/**
 * Mobile ownership engine — validates workspace and project ownership.
 * Foundation only. No execution or file modification.
 */

import { getDevPulseV2World2WorkspaceFoundation } from '../world2-workspace-foundation/index.js';
import { normalizeProjectId } from '../world2-workspace-foundation/workspace-identity.js';
import { checkCrossWorkspaceAccess } from '../world2-workspace-foundation/workspace-boundary-rules.js';
import type { GateRecord, MobileSessionInput } from './types.js';

export interface OwnershipValidationResult {
  valid: boolean;
  reason: string;
  gates: GateRecord[];
}

export function validateWorkspaceOwnership(input: MobileSessionInput): OwnershipValidationResult {
  const gates: GateRecord[] = [];

  if (!input.workspaceId?.trim()) {
    gates.push({
      gateId: 'own-ws-0001',
      gateType: 'WORKSPACE_OWNERSHIP',
      status: 'CLOSED',
      description: 'workspaceId is required',
    });
    return { valid: false, reason: 'workspaceId is required', gates };
  }

  if (!input.projectId?.trim()) {
    gates.push({
      gateId: 'own-proj-0001',
      gateType: 'PROJECT_OWNERSHIP',
      status: 'CLOSED',
      description: 'projectId is required',
    });
    return { valid: false, reason: 'projectId is required', gates };
  }

  const foundation = getDevPulseV2World2WorkspaceFoundation();
  const workspace = foundation.getManager().getWorkspace(input.workspaceId);

  if (!workspace) {
    gates.push({
      gateId: 'own-ws-0002',
      gateType: 'WORKSPACE_OWNERSHIP',
      status: 'CLOSED',
      description: `Workspace not found: ${input.workspaceId}`,
    });
    return { valid: false, reason: `Workspace not found: ${input.workspaceId}`, gates };
  }

  const normalizedProjectId = normalizeProjectId(input.projectId);
  if (workspace.projectId !== normalizedProjectId) {
    gates.push({
      gateId: 'own-proj-0002',
      gateType: 'PROJECT_OWNERSHIP',
      status: 'CLOSED',
      description: 'projectId does not match workspace ownership',
    });
    return { valid: false, reason: 'projectId does not match workspace ownership', gates };
  }

  gates.push({
    gateId: 'own-ws-0003',
    gateType: 'WORKSPACE_OWNERSHIP',
    status: 'OPEN',
    description: `Workspace ownership confirmed: ${input.workspaceId}`,
  });
  gates.push({
    gateId: 'own-proj-0003',
    gateType: 'PROJECT_OWNERSHIP',
    status: 'OPEN',
    description: `Project ownership confirmed: ${normalizedProjectId}`,
  });

  if (input.targetWorkspaceId && input.targetWorkspaceId !== input.workspaceId) {
    const target = foundation.getManager().getWorkspace(input.targetWorkspaceId);
    const crossCheck = checkCrossWorkspaceAccess(input.workspaceId, target);
    if (!crossCheck.allowed) {
      gates.push({
        gateId: 'own-cross-0001',
        gateType: 'CROSS_WORKSPACE',
        status: 'CLOSED',
        description: crossCheck.reason,
      });
      return { valid: false, reason: crossCheck.reason, gates };
    }
  }

  if (input.targetProjectId) {
    const normalizedTarget = normalizeProjectId(input.targetProjectId);
    if (normalizedTarget !== normalizedProjectId) {
      gates.push({
        gateId: 'own-cross-0002',
        gateType: 'CROSS_PROJECT',
        status: 'CLOSED',
        description: 'Capability targets another project — blocked',
      });
      return { valid: false, reason: 'Capability targets another project', gates };
    }
  }

  return { valid: true, reason: 'Ownership validated', gates };
}

export function ownershipGatesKey(gates: GateRecord[]): string {
  return gates.map((g) => `${g.gateType}|${g.status}`).join(';');
}
