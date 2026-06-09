/**
 * Mobile Preview Runtime Foundation — Workspace Hosting bridge.
 */

import { getWorkspace } from '../workspace-hosting/index.js';
import { getStoredMobilePreviewSession, listStoredMobilePreviewSessions, storeMobilePreviewSession } from './mobile-preview-store.js';
import { recordMobilePreviewHistoryEntry } from './mobile-preview-history.js';
import type { MobilePreviewSession, MobilePreviewWorkspaceLink } from './mobile-preview-types.js';
import { MOBILE_PREVIEW_RUNTIME_FOUNDATION_OWNER_MODULE } from './mobile-preview-types.js';

export function linkMobilePreviewToWorkspace(
  mobilePreviewId: string,
  workspaceId: string,
): MobilePreviewWorkspaceLink | null {
  const session = getStoredMobilePreviewSession(mobilePreviewId);
  const workspace = getWorkspace(workspaceId);
  if (!session || !workspace) return null;

  const mismatch = workspace.workspaceOwner.projectId !== session.mobilePreviewOwner.projectId;
  const link: MobilePreviewWorkspaceLink = {
    workspaceId,
    linkedAt: Date.now(),
    linkAuthority: MOBILE_PREVIEW_RUNTIME_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storeMobilePreviewSession({
    ...session,
    mobilePreviewWorkspaceLink: link,
    mobilePreviewOwner: { ...session.mobilePreviewOwner, workspaceId },
    updatedAt: Date.now(),
  });

  recordMobilePreviewHistoryEntry({
    mobilePreviewId,
    category: 'WORKSPACE',
    summary: `Linked to workspace ${workspaceId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: workspaceId,
  });

  return link;
}

export function getWorkspaceForMobilePreview(mobilePreviewId: string): string | null {
  return getStoredMobilePreviewSession(mobilePreviewId)?.mobilePreviewWorkspaceLink.workspaceId ?? null;
}

export function listMobilePreviewsByWorkspace(workspaceId: string): MobilePreviewSession[] {
  return listStoredMobilePreviewSessions().filter(
    (s) =>
      s.mobilePreviewWorkspaceLink.workspaceId === workspaceId || s.mobilePreviewOwner.workspaceId === workspaceId,
  );
}

export function detectMobilePreviewWorkspaceMismatch(mobilePreviewId: string): boolean {
  const session = getStoredMobilePreviewSession(mobilePreviewId);
  if (!session) return true;
  const workspace = getWorkspace(session.mobilePreviewWorkspaceLink.workspaceId);
  if (!workspace) return true;
  return (
    workspace.workspaceOwner.projectId !== session.mobilePreviewOwner.projectId ||
    session.mobilePreviewWorkspaceLink.mismatchDetected
  );
}

export function resolveWorkspaceForMobilePreviewRegistration(
  workspaceId: string,
): { exists: boolean; projectId: string | null } {
  const workspace = getWorkspace(workspaceId);
  if (!workspace) return { exists: false, projectId: null };
  return { exists: true, projectId: workspace.workspaceOwner.projectId };
}
