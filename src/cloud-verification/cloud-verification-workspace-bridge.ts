/**
 * Cloud Verification Foundation — Workspace Hosting Foundation bridge.
 */

import { getWorkspace, listWorkspaces } from '../workspace-hosting/index.js';
import {
  getStoredCloudVerification,
  listStoredCloudVerifications,
  storeCloudVerification,
} from './cloud-verification-store.js';
import { recordCloudVerificationHistoryEntry } from './cloud-verification-history.js';
import type { CloudVerification, CloudVerificationWorkspaceLink } from './cloud-verification-types.js';
import { CLOUD_VERIFICATION_FOUNDATION_OWNER_MODULE } from './cloud-verification-types.js';

export function linkCloudVerificationToWorkspace(
  verificationId: string,
  workspaceId: string,
): CloudVerificationWorkspaceLink | null {
  const verification = getStoredCloudVerification(verificationId);
  const workspace = getWorkspace(workspaceId);
  if (!verification || !workspace) return null;

  const mismatch = workspace.workspaceOwner.projectId !== verification.verificationOwner.projectId;
  const link: CloudVerificationWorkspaceLink = {
    workspaceId,
    linkedAt: Date.now(),
    linkAuthority: CLOUD_VERIFICATION_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storeCloudVerification({
    ...verification,
    verificationWorkspaceLink: link,
    verificationOwner: { ...verification.verificationOwner, workspaceId },
    verificationRelationships: {
      ...verification.verificationRelationships,
      relatedWorkspaceIds: [...new Set([...verification.verificationRelationships.relatedWorkspaceIds, workspaceId])],
    },
    updatedAt: Date.now(),
  });

  recordCloudVerificationHistoryEntry({
    verificationId,
    category: 'WORKSPACE',
    summary: `Linked to workspace ${workspaceId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: workspaceId,
  });

  return link;
}

export function getWorkspaceForCloudVerification(verificationId: string): string | null {
  return getStoredCloudVerification(verificationId)?.verificationWorkspaceLink.workspaceId ?? null;
}

export function listCloudVerificationsByWorkspace(workspaceId: string): CloudVerification[] {
  return listStoredCloudVerifications().filter(
    (v) => v.verificationWorkspaceLink.workspaceId === workspaceId || v.verificationOwner.workspaceId === workspaceId,
  );
}

export function detectCloudVerificationWorkspaceMismatch(verificationId: string): boolean {
  const verification = getStoredCloudVerification(verificationId);
  if (!verification) return true;
  const workspace = getWorkspace(verification.verificationWorkspaceLink.workspaceId);
  if (!workspace) return true;
  return (
    workspace.workspaceOwner.projectId !== verification.verificationOwner.projectId ||
    verification.verificationWorkspaceLink.mismatchDetected
  );
}

export function resolveWorkspaceForVerificationRegistration(
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

export function listAvailableWorkspaceIdsForVerificationBridge(): string[] {
  return listWorkspaces().map((w) => w.workspaceId);
}
