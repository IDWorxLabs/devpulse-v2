/**
 * Workspace Isolation Expansion — workspace isolation validation.
 */

import type { WorkspaceIsolationStatus } from './workspace-isolation-types.js';
import { getWorkspaceRecord } from './workspace-registry.js';
import { getWorkspaceOwner } from './workspace-ownership-manager.js';
import { validateWorkspaceBoundary } from './workspace-boundary-manager.js';
import { validateWorkspaceAccess } from './workspace-access-controller.js';
import { getProjectForWorkspace } from '../multi-project-foundation/project-workspace-mapper.js';

export function validateWorkspaceIsolation(
  workspaceId: string,
  requestingProjectId?: string,
): { status: WorkspaceIsolationStatus; violations: string[] } {
  const violations: string[] = [];

  const record = getWorkspaceRecord(workspaceId);
  if (!record) {
    return { status: 'ISOLATION_VIOLATION', violations: ['workspace not registered'] };
  }

  const owner = getWorkspaceOwner(workspaceId);
  if (!owner || owner !== record.ownerProjectId) {
    violations.push('ownership inconsistency');
  }

  const boundaryCheck = validateWorkspaceBoundary(workspaceId, record.ownerProjectId);
  violations.push(...boundaryCheck.violations);

  const mappedProject = getProjectForWorkspace(workspaceId);
  if (mappedProject && mappedProject !== record.ownerProjectId) {
    violations.push('workspace mapping inconsistency');
  }

  if (requestingProjectId && requestingProjectId !== record.ownerProjectId) {
    const access = validateWorkspaceAccess(workspaceId, requestingProjectId);
    if (access === 'ACCESS_DENIED') {
      violations.push(`unauthorized access by ${requestingProjectId}`);
    }
  }

  if (violations.length > 0) {
    return { status: 'ISOLATION_VIOLATION', violations };
  }

  if (record.isolationStatus === 'SHARED_AUTHORIZED') {
    return { status: 'SHARED_AUTHORIZED', violations: [] };
  }

  return { status: 'ISOLATED', violations: [] };
}
