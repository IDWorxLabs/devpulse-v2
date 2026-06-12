/**
 * World 2 Disposable Workspace → World 2 Workspace Foundation bridge.
 * Delegates isolation, World 1 protection, and boundary validation to foundation-owned checks.
 */

import {
  assertWorld1FoundationProtected,
  evaluateWorkspaceIsolation,
  getDevPulseV2World2WorkspaceFoundation,
} from '../world2-workspace-foundation/index.js';
import type { Workspace, WorkspaceBoundaryCheck } from '../world2-workspace-foundation/types.js';

export const WORKSPACE_ISOLATION_AUTHORITATIVE_OWNER = 'world2_workspace_foundation';

export interface World2WorkspaceFoundationBridgeResult {
  readOnly: true;
  foundationOwned: true;
  isolated: boolean;
  checks: WorkspaceBoundaryCheck[];
  world1Protected: boolean;
  world1ViolationDomains: string[];
}

export function evaluateDisposableWorkspaceFoundationBoundaries(
  actorWorkspaceId: string,
  targetWorkspaceId: string,
): World2WorkspaceFoundationBridgeResult {
  const foundation = getDevPulseV2World2WorkspaceFoundation();
  const registeredWorkspace = foundation.getManager().getWorkspace(targetWorkspaceId);
  const targetWorkspace: Workspace =
    registeredWorkspace ??
    ({
      workspaceId: targetWorkspaceId,
      projectId: targetWorkspaceId,
      projectName: 'Disposable World 2 workspace (planning)',
      projectVision: '',
      workspaceState: 'WORKSPACE_ACTIVE',
      createdAt: Date.now(),
      stateSequence: [],
    } satisfies Workspace);

  const isolation = evaluateWorkspaceIsolation(actorWorkspaceId, targetWorkspace);
  const world1Protected = assertWorld1FoundationProtected();
  const world1ViolationDomains = world1Protected ? [] : ['world1_foundation_governance'];

  return {
    readOnly: true,
    foundationOwned: true,
    isolated: isolation.isolated && world1Protected,
    checks: isolation.checks,
    world1Protected,
    world1ViolationDomains,
  };
}
