/**
 * Workspace Isolation Expansion — workspace violation detection.
 */

import type { WorkspaceViolationReport, ViolationSeverity } from './workspace-isolation-types.js';
import { getWorkspaceRecord, listWorkspaces } from './workspace-registry.js';
import { getWorkspaceOwner } from './workspace-ownership-manager.js';
import { getWorkspaceBoundary } from './workspace-boundary-manager.js';
import { validateWorkspaceAccess } from './workspace-access-controller.js';
import { getProjectForWorkspace } from '../multi-project-foundation/project-workspace-mapper.js';

let violationCounter = 0;
let totalViolationCount = 0;

const SEVERITY_ACTIONS: Record<ViolationSeverity, string> = {
  LOW: 'Review workspace access logs',
  MEDIUM: 'Revoke unauthorized access grants',
  HIGH: 'Lock workspace and escalate to operator',
  CRITICAL: 'Halt cross-workspace operations and request founder review',
};

export function detectWorkspaceViolations(
  workspaceId: string,
  requestingProjectId?: string,
): WorkspaceViolationReport[] {
  const reports: WorkspaceViolationReport[] = [];

  const record = getWorkspaceRecord(workspaceId);
  if (!record) {
    reports.push(createViolation(workspaceId, 'missing_workspace', 'HIGH', 'Workspace not registered'));
    return reports;
  }

  const owner = getWorkspaceOwner(workspaceId);
  if (!owner) {
    reports.push(createViolation(workspaceId, 'missing_owner', 'CRITICAL', 'No workspace owner assigned'));
  } else if (owner !== record.ownerProjectId) {
    reports.push(createViolation(workspaceId, 'ownership_conflict', 'CRITICAL', `Owner conflict: ${owner} vs ${record.ownerProjectId}`));
  }

  const boundary = getWorkspaceBoundary(workspaceId);
  if (!boundary) {
    reports.push(createViolation(workspaceId, 'missing_boundary', 'HIGH', 'Workspace boundary not defined'));
  }

  const mapped = getProjectForWorkspace(workspaceId);
  if (mapped && owner && mapped !== owner) {
    reports.push(createViolation(workspaceId, 'duplicate_mapping', 'HIGH', `Workspace mapped to ${mapped} but owned by ${owner}`));
  }

  if (requestingProjectId && owner && requestingProjectId !== owner) {
    const access = validateWorkspaceAccess(workspaceId, requestingProjectId);
    if (access === 'ACCESS_DENIED' || access === 'ACCESS_REQUIRES_AUTHORIZATION') {
      reports.push(createViolation(
        workspaceId,
        'unauthorized_access',
        access === 'ACCESS_DENIED' ? 'HIGH' : 'MEDIUM',
        `Project ${requestingProjectId} attempted cross-workspace access`,
      ));
    }
  }

  const allWorkspaces = listWorkspaces();
  const duplicateOwners = allWorkspaces.filter(
    (w) => w.workspaceId !== workspaceId && w.ownerProjectId === record.ownerProjectId,
  );
  if (duplicateOwners.length > 0 && !boundary?.permittedAccess.length) {
    reports.push(createViolation(workspaceId, 'cross_project_contamination', 'MEDIUM', 'Potential cross-project workspace overlap'));
  }

  totalViolationCount += reports.length;
  return reports;
}

function createViolation(
  workspaceId: string,
  violationType: string,
  severity: ViolationSeverity,
  detail: string,
): WorkspaceViolationReport {
  violationCounter += 1;
  return {
    violationId: `workspace-violation-${violationCounter}`,
    workspaceId,
    violationType,
    severity,
    detail,
    recommendedAction: SEVERITY_ACTIONS[severity],
    detectedAt: Date.now(),
  };
}

export function getTotalWorkspaceViolationCount(): number {
  return totalViolationCount;
}

export function resetWorkspaceViolationDetectorForTests(): void {
  violationCounter = 0;
  totalViolationCount = 0;
}
