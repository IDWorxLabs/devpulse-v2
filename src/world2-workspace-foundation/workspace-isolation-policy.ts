/**
 * Workspace isolation policy — evaluates isolation requirements.
 */

import type { Workspace, WorkspaceBoundaryCheck } from './types.js';
import {
  checkCrossWorkspaceAccess,
  checkWorld1ModificationAttempt,
  checkWorkspaceTakeover,
} from './workspace-boundary-rules.js';

export interface IsolationPolicyResult {
  isolated: boolean;
  checks: WorkspaceBoundaryCheck[];
}

export function evaluateWorkspaceIsolation(
  actorWorkspaceId: string,
  targetWorkspace: Workspace | null,
  world1TargetDomain?: string,
): IsolationPolicyResult {
  const checks: WorkspaceBoundaryCheck[] = [
    checkCrossWorkspaceAccess(actorWorkspaceId, targetWorkspace),
  ];

  if (targetWorkspace) {
    checks.push(checkWorkspaceTakeover(actorWorkspaceId, targetWorkspace.workspaceId));
  }

  if (world1TargetDomain) {
    checks.push(checkWorld1ModificationAttempt(world1TargetDomain));
  }

  const isolated = checks.every((c) => c.allowed);
  return { isolated, checks };
}

export function isolationOutputKey(actorId: string, targetId: string): string {
  const stub: Workspace = {
    workspaceId: targetId,
    projectId: targetId,
    projectName: '',
    projectVision: '',
    workspaceState: 'WORKSPACE_ACTIVE',
    createdAt: 0,
    stateSequence: [],
  };
  return `${actorId}|${targetId}|${evaluateWorkspaceIsolation(actorId, stub).isolated}`;
}

export function assertFileOwnership(workspaceId: string, fileWorkspaceId: string | null): boolean {
  return fileWorkspaceId !== null && fileWorkspaceId === workspaceId;
}

export function rejectOrphanFile(fileWorkspaceId: string | null): boolean {
  return fileWorkspaceId === null || fileWorkspaceId.length === 0;
}
