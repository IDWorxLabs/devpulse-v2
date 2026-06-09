/**
 * Cloud Recovery Foundation — Workspace Hosting Foundation bridge.
 */

import { getWorkspace, listWorkspaces } from '../workspace-hosting/index.js';
import { getStoredCloudRecovery, listStoredCloudRecoveries, storeCloudRecovery } from './cloud-recovery-store.js';
import { recordCloudRecoveryHistoryEntry } from './cloud-recovery-history.js';
import type { CloudRecovery, CloudRecoveryWorkspaceLink } from './cloud-recovery-types.js';
import { CLOUD_RECOVERY_FOUNDATION_OWNER_MODULE } from './cloud-recovery-types.js';

export function linkRecoveryToWorkspace(recoveryId: string, workspaceId: string): CloudRecoveryWorkspaceLink | null {
  const recovery = getStoredCloudRecovery(recoveryId);
  const workspace = getWorkspace(workspaceId);
  if (!recovery || !workspace) return null;

  const mismatch = workspace.workspaceOwner.projectId !== recovery.recoveryOwner.projectId;
  const link: CloudRecoveryWorkspaceLink = {
    workspaceId,
    linkedAt: Date.now(),
    linkAuthority: CLOUD_RECOVERY_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storeCloudRecovery({
    ...recovery,
    recoveryWorkspaceLink: link,
    recoveryOwner: { ...recovery.recoveryOwner, workspaceId },
    recoveryRelationships: {
      ...recovery.recoveryRelationships,
      relatedWorkspaceIds: [...new Set([...recovery.recoveryRelationships.relatedWorkspaceIds, workspaceId])],
    },
    updatedAt: Date.now(),
  });

  recordCloudRecoveryHistoryEntry({
    recoveryId,
    category: 'WORKSPACE',
    summary: `Linked to workspace ${workspaceId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: workspaceId,
  });

  return link;
}

export function getWorkspaceForRecovery(recoveryId: string): string | null {
  return getStoredCloudRecovery(recoveryId)?.recoveryWorkspaceLink.workspaceId ?? null;
}

export function listRecoveriesByWorkspace(workspaceId: string): CloudRecovery[] {
  return listStoredCloudRecoveries().filter(
    (r) => r.recoveryWorkspaceLink.workspaceId === workspaceId || r.recoveryOwner.workspaceId === workspaceId,
  );
}

export function detectRecoveryWorkspaceMismatch(recoveryId: string): boolean {
  const recovery = getStoredCloudRecovery(recoveryId);
  if (!recovery) return true;
  const workspace = getWorkspace(recovery.recoveryWorkspaceLink.workspaceId);
  if (!workspace) return true;
  return (
    workspace.workspaceOwner.projectId !== recovery.recoveryOwner.projectId ||
    recovery.recoveryWorkspaceLink.mismatchDetected
  );
}

export function resolveWorkspaceForRecoveryRegistration(
  workspaceId: string,
): { exists: boolean; projectId: string | null; runtimeId: string | null } {
  const workspace = getWorkspace(workspaceId);
  if (!workspace) return { exists: false, projectId: null, runtimeId: null };
  return {
    exists: true,
    projectId: workspace.workspaceOwner.projectId,
    runtimeId: workspace.workspaceOwner.runtimeId,
  };
}

export function listAvailableWorkspaceIdsForRecoveryBridge(): string[] {
  return listWorkspaces().map((w) => w.workspaceId);
}
