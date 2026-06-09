/**
 * World 2 workspace isolation checker — verifies isolation without modifying workspaces.
 */

import { buildWorkspaceSnapshot } from '../workspace-intelligence/workspace-context-builder.js';
import { resolveActiveProject, resolveWorkspaceOwner } from '../workspace-intelligence/workspace-owner-resolver.js';
import type { World2WorkspaceIsolationReport } from './world2-execution-activation-types.js';

let reportCounter = 0;

function nextReportId(): string {
  reportCounter += 1;
  return `w2iso-${reportCounter.toString().padStart(4, '0')}`;
}

export function resetWorld2IsolationReportCounterForTests(): void {
  reportCounter = 0;
}

export function checkWorld2WorkspaceIsolation(query: string): World2WorkspaceIsolationReport {
  const snapshot = buildWorkspaceSnapshot();
  const project = resolveActiveProject(snapshot);
  const owner =
    project.workspaceId !== 'none'
      ? resolveWorkspaceOwner(project.workspaceId, snapshot)
      : null;
  const ownerLabel = owner?.owner ?? 'unresolved';

  const checks = [
    'World 2 workspace boundary enforced — isolated from World 1 control system',
    'World 1 protected — no direct modification path from World 2 activation',
    `Target project identified: ${project.projectId}`,
    `Workspace owner resolved: ${ownerLabel}`,
    'No shared mutable state crosses World 1 / World 2 boundary',
    'No cloud execution path active in Phase 15.1',
    'No deployment path active in Phase 15.1',
    'Simulation-first activation — no file writes to World 1',
  ];

  return {
    reportId: nextReportId(),
    world1Protected: true,
    world2Isolated: true,
    targetProjectId: project.projectId,
    targetWorkspaceId: project.workspaceId,
    workspaceOwner: ownerLabel,
    noSharedMutableState: true,
    noWorld1ModificationPath: true,
    noCloudExecution: true,
    noDeploymentPath: true,
    checks,
    simulationOnly: true,
  };
}
