/**
 * Mobile Command Runtime Foundation — Workspace Hosting Foundation bridge.
 */

import { getWorkspace } from '../workspace-hosting/index.js';
import { getStoredMobileCommandSession, listStoredMobileCommandSessions, storeMobileCommandSession } from './mobile-command-store.js';
import { recordMobileCommandHistoryEntry } from './mobile-command-history.js';
import type { MobileCommandSession, MobileCommandWorkspaceLink } from './mobile-command-types.js';
import { MOBILE_COMMAND_RUNTIME_FOUNDATION_OWNER_MODULE } from './mobile-command-types.js';

export function linkMobileCommandToWorkspace(mobileCommandId: string, workspaceId: string): MobileCommandWorkspaceLink | null {
  const session = getStoredMobileCommandSession(mobileCommandId);
  const workspace = getWorkspace(workspaceId);
  if (!session || !workspace) return null;

  const mismatch = workspace.workspaceOwner.projectId !== session.mobileCommandOwner.projectId;
  const link: MobileCommandWorkspaceLink = {
    workspaceId,
    linkedAt: Date.now(),
    linkAuthority: MOBILE_COMMAND_RUNTIME_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storeMobileCommandSession({
    ...session,
    mobileCommandWorkspaceLink: link,
    mobileCommandOwner: { ...session.mobileCommandOwner, workspaceId },
    updatedAt: Date.now(),
  });

  recordMobileCommandHistoryEntry({
    mobileCommandId,
    category: 'WORKSPACE',
    summary: `Linked to workspace ${workspaceId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: workspaceId,
  });

  return link;
}

export function getWorkspaceForMobileCommand(mobileCommandId: string): string | null {
  return getStoredMobileCommandSession(mobileCommandId)?.mobileCommandWorkspaceLink.workspaceId ?? null;
}

export function listMobileCommandsByWorkspace(workspaceId: string): MobileCommandSession[] {
  return listStoredMobileCommandSessions().filter(
    (s) => s.mobileCommandWorkspaceLink.workspaceId === workspaceId || s.mobileCommandOwner.workspaceId === workspaceId,
  );
}

export function detectMobileCommandWorkspaceMismatch(mobileCommandId: string): boolean {
  const session = getStoredMobileCommandSession(mobileCommandId);
  if (!session) return true;
  const workspace = getWorkspace(session.mobileCommandWorkspaceLink.workspaceId);
  if (!workspace) return true;
  return workspace.workspaceOwner.projectId !== session.mobileCommandOwner.projectId || session.mobileCommandWorkspaceLink.mismatchDetected;
}

export function resolveWorkspaceForMobileCommandRegistration(
  workspaceId: string,
): { exists: boolean; projectId: string | null } {
  const workspace = getWorkspace(workspaceId);
  if (!workspace) return { exists: false, projectId: null };
  return { exists: true, projectId: workspace.workspaceOwner.projectId };
}
