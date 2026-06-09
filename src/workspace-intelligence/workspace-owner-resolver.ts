/**
 * Workspace owner resolver — resolves project/workspace ownership claims.
 */

import { getDevPulseV2Owner } from '../foundation/ownership-registry.js';
import type {
  WorkspaceIntelligenceSnapshot,
  WorkspaceProjectLink,
} from './workspace-intelligence-types.js';

export interface OwnershipResolution {
  workspaceId: string;
  projectId: string;
  projectName: string;
  owner: string;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  claims: string[];
  resolved: boolean;
  reason: string;
}

export function resolveWorkspaceOwner(
  workspaceId: string,
  snapshot: WorkspaceIntelligenceSnapshot,
): OwnershipResolution | null {
  const link = snapshot.projectLinks.find((l) => l.workspaceId === workspaceId);
  if (!link) {
    return {
      workspaceId,
      projectId: 'unknown',
      projectName: 'Unknown',
      owner: 'unresolved',
      confidence: 'LOW',
      claims: [],
      resolved: false,
      reason: 'No project link registered for workspace.',
    };
  }

  const duplicateClaims = snapshot.projectLinks.filter(
    (l) => l.workspaceId === workspaceId && l.projectId !== link.projectId,
  );

  return {
    workspaceId,
    projectId: link.projectId,
    projectName: link.projectName,
    owner: link.owner,
    confidence: duplicateClaims.length > 0 ? 'MEDIUM' : link.confidence,
    claims: [link.owner, ...duplicateClaims.map((c) => c.owner)],
    resolved: true,
    reason: link.reason,
  };
}

export function resolveActiveProject(snapshot: WorkspaceIntelligenceSnapshot): {
  projectId: string;
  projectName: string;
  workspaceId: string;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
} {
  const active = snapshot.activeWorkspace;
  if (!active) {
    return {
      projectId: snapshot.activeProject?.projectId ?? 'unknown',
      projectName: snapshot.activeProject?.projectName ?? 'Unknown',
      workspaceId: 'none',
      confidence: 'LOW',
    };
  }
  return {
    projectId: active.projectId,
    projectName: active.projectName,
    workspaceId: active.workspaceId,
    confidence: active.confidence,
  };
}

export function resolveModuleOwnership(
  moduleId: string,
  snapshot: WorkspaceIntelligenceSnapshot,
): { moduleId: string; owner: string; workspaceId: string } | null {
  const mod = snapshot.modules.find((m) => m.moduleId === moduleId || m.moduleName.toLowerCase().includes(moduleId.toLowerCase()));
  if (!mod) return null;
  return { moduleId: mod.moduleId, owner: mod.owner, workspaceId: mod.workspaceId };
}

export function assertWorkspaceIntelligenceOwner(): boolean {
  const owner = getDevPulseV2Owner('workspace_intelligence');
  return owner.ownerModule === 'devpulse_v2_workspace_intelligence';
}

export function findProjectLinkForWorkspace(
  workspaceQuery: string,
  snapshot: WorkspaceIntelligenceSnapshot,
): WorkspaceProjectLink | null {
  const lower = workspaceQuery.toLowerCase();
  return (
    snapshot.projectLinks.find(
      (l) =>
        l.workspaceId.toLowerCase().includes(lower) ||
        l.workspaceName.toLowerCase().includes(lower) ||
        l.projectName.toLowerCase().includes(lower),
    ) ?? null
  );
}
