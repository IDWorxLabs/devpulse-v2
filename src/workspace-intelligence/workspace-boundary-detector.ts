/**
 * Workspace boundary detector — identifies isolation boundaries per workspace.
 */

import type { WorkspaceBoundary, WorkspaceIntelligenceSnapshot, WorkspaceBoundaryType } from './workspace-intelligence-types.js';

function displayBoundaryType(type: WorkspaceBoundaryType): string {
  return type.replace(/_/g, ' ').toLowerCase();
}

export function detectWorkspaceBoundaries(
  snapshot: WorkspaceIntelligenceSnapshot,
  workspaceId?: string,
): WorkspaceBoundary[] {
  if (workspaceId) {
    return snapshot.boundaries.filter((b) => b.workspaceId === workspaceId);
  }
  return [...snapshot.boundaries];
}

export function summarizeBoundaries(boundaries: WorkspaceBoundary[]): string[] {
  return boundaries.map(
    (b) => `${displayBoundaryType(b.boundaryType)} — ${b.reason} (owner: ${b.owner}, risk: ${b.riskLevel})`,
  );
}

export function boundariesForActiveWorkspace(snapshot: WorkspaceIntelligenceSnapshot): WorkspaceBoundary[] {
  const activeId = snapshot.activeWorkspace?.workspaceId;
  if (!activeId) return snapshot.boundaries;
  return snapshot.boundaries.filter((b) => b.workspaceId === activeId || b.boundaryType === 'WORLD2_ISOLATED');
}
