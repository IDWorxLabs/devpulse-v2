/**
 * Mobile Chat Runtime Foundation — Workspace Hosting bridge.
 */

import { getWorkspace } from '../workspace-hosting/index.js';
import { getStoredMobileChatSession, listStoredMobileChatSessions, storeMobileChatSession } from './mobile-chat-store.js';
import { recordMobileChatHistoryEntry } from './mobile-chat-history.js';
import type { MobileChatSession, MobileChatWorkspaceLink } from './mobile-chat-types.js';
import { MOBILE_CHAT_RUNTIME_FOUNDATION_OWNER_MODULE } from './mobile-chat-types.js';

export function linkMobileChatToWorkspace(mobileChatId: string, workspaceId: string): MobileChatWorkspaceLink | null {
  const session = getStoredMobileChatSession(mobileChatId);
  const workspace = getWorkspace(workspaceId);
  if (!session || !workspace) return null;

  const mismatch = workspace.workspaceOwner.projectId !== session.mobileChatOwner.projectId;
  const link: MobileChatWorkspaceLink = {
    workspaceId,
    linkedAt: Date.now(),
    linkAuthority: MOBILE_CHAT_RUNTIME_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storeMobileChatSession({ ...session, mobileChatWorkspaceLink: link, mobileChatOwner: { ...session.mobileChatOwner, workspaceId }, updatedAt: Date.now() });
  recordMobileChatHistoryEntry({ mobileChatId, category: 'WORKSPACE', summary: `Linked to workspace ${workspaceId}`, scopeUsed: workspaceId });
  return link;
}

export function getWorkspaceForMobileChat(mobileChatId: string): string | null {
  return getStoredMobileChatSession(mobileChatId)?.mobileChatWorkspaceLink.workspaceId ?? null;
}

export function listMobileChatsByWorkspace(workspaceId: string): MobileChatSession[] {
  return listStoredMobileChatSessions().filter(
    (s) => s.mobileChatWorkspaceLink.workspaceId === workspaceId || s.mobileChatOwner.workspaceId === workspaceId,
  );
}

export function detectMobileChatWorkspaceMismatch(mobileChatId: string): boolean {
  const session = getStoredMobileChatSession(mobileChatId);
  if (!session) return true;
  const workspace = getWorkspace(session.mobileChatWorkspaceLink.workspaceId);
  if (!workspace) return true;
  return workspace.workspaceOwner.projectId !== session.mobileChatOwner.projectId || session.mobileChatWorkspaceLink.mismatchDetected;
}

export function resolveWorkspaceForMobileChatRegistration(workspaceId: string): { exists: boolean; projectId: string | null } {
  const workspace = getWorkspace(workspaceId);
  if (!workspace) return { exists: false, projectId: null };
  return { exists: true, projectId: workspace.workspaceOwner.projectId };
}
