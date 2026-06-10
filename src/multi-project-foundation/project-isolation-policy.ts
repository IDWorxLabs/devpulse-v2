/**
 * Multi Project Foundation — project isolation validation.
 */

import type { IsolationStatus, ProjectIsolationResult } from './multi-project-types.js';
import { getProjectContext } from './project-context-manager.js';
import { getProjectHistory } from './project-history-manager.js';
import { getProject } from './project-registry.js';
import { getWorkspace, getProjectForWorkspace } from './project-workspace-mapper.js';

export function validateProjectIsolation(
  projectId: string,
  targetProjectId: string,
  authorized = false,
): ProjectIsolationResult {
  if (projectId === targetProjectId) {
    return { status: 'ISOLATED', projectId, violations: [] };
  }

  if (authorized) {
    return { status: 'ISOLATED', projectId, targetProjectId, violations: [] };
  }

  const violations: string[] = [];

  const targetRecord = getProject(targetProjectId);
  if (targetRecord) {
    violations.push(`attempted access to project ${targetProjectId} state`);
  }

  const targetContext = getProjectContext(targetProjectId);
  if (targetContext) {
    violations.push(`attempted access to project ${targetProjectId} context`);
  }

  const targetWorkspace = getWorkspace(targetProjectId);
  if (targetWorkspace) {
    const workspaceOwner = getProjectForWorkspace(targetWorkspace);
    if (workspaceOwner === targetProjectId && workspaceOwner !== projectId) {
      violations.push(`attempted access to project ${targetProjectId} workspace`);
    }
  }

  const targetHistory = getProjectHistory(targetProjectId, 1);
  if (targetHistory.length > 0) {
    violations.push(`attempted access to project ${targetProjectId} history`);
  }

  const status: IsolationStatus = violations.length > 0 ? 'ISOLATION_VIOLATION' : 'ISOLATED';

  return { status, projectId, targetProjectId, violations };
}
