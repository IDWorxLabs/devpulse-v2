/**
 * Workspace protection engine — validates workspace isolation for builder packets.
 * Dry-run foundation only. No cross-workspace action preparation.
 */

import { getDevPulseV2World2WorkspaceFoundation } from '../world2-workspace-foundation/index.js';
import { checkCrossWorkspaceAccess } from '../world2-workspace-foundation/workspace-boundary-rules.js';
import type { BuilderInput, ProtectionCheck } from './types.js';

export function validateWorkspaceIsolation(input: BuilderInput): {
  valid: boolean;
  reason: string;
} {
  if (!input.workspaceId || !input.projectId) {
    return { valid: false, reason: 'Builder requires workspaceId and projectId' };
  }

  const foundation = getDevPulseV2World2WorkspaceFoundation();
  const workspace = foundation.getManager().getWorkspace(input.workspaceId);

  if (!workspace) {
    return { valid: false, reason: `Workspace not found: ${input.workspaceId}` };
  }

  const normalizedProjectId = input.projectId.trim().toLowerCase().replace(/\s+/g, '-');
  if (workspace.projectId !== normalizedProjectId) {
    return { valid: false, reason: 'projectId does not match workspace ownership' };
  }

  if (input.workspaceIsolationStatus !== 'ISOLATED') {
    return { valid: false, reason: 'Workspace isolation status must be ISOLATED' };
  }

  return { valid: true, reason: 'Workspace isolation confirmed' };
}

export function generateWorkspaceProtectionChecks(input: BuilderInput): ProtectionCheck[] {
  const foundation = getDevPulseV2World2WorkspaceFoundation();
  const workspace = foundation.getManager().getWorkspace(input.workspaceId);
  const checks: ProtectionCheck[] = [];

  checks.push({
    checkId: 'ws-protect-0001',
    checkType: 'WORKSPACE_OWNERSHIP',
    status: workspace && workspace.projectId === input.projectId ? 'PROTECTED' : 'VIOLATION_DETECTED',
    description: 'Workspace ownership must match projectId',
  });

  checks.push({
    checkId: 'ws-protect-0002',
    checkType: 'ISOLATION_STATUS',
    status: input.workspaceIsolationStatus === 'ISOLATED' ? 'PROTECTED' : 'VIOLATION_DETECTED',
    description: 'Workspace must remain isolated from other projects',
  });

  checks.push({
    checkId: 'ws-protect-0003',
    checkType: 'CROSS_WORKSPACE_BLOCK',
    status: workspace
      ? checkCrossWorkspaceAccess(input.workspaceId, workspace).allowed
        ? 'PROTECTED'
        : 'VIOLATION_DETECTED'
      : 'VIOLATION_DETECTED',
    description: 'Cross-workspace access must be blocked for builder actions',
  });

  checks.push({
    checkId: 'ws-protect-0004',
    checkType: 'ACTION_SCOPE',
    status:
      input.workspaceId && input.projectId && input.planId && input.simulationId
        ? 'PROTECTED'
        : 'VIOLATION_DETECTED',
    description: 'All builder actions must be scoped to workspaceId/projectId/planId/simulationId',
  });

  return checks;
}

export function workspaceProtectionKey(checks: ProtectionCheck[]): string {
  return checks.map((c) => `${c.checkType}|${c.status}`).join(';');
}
