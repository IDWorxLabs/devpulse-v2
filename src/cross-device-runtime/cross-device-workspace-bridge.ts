/**
 * Cross Device Runtime Foundation — Workspace Hosting bridge.
 */

import { getWorkspace } from '../workspace-hosting/index.js';
import { getStoredCrossDeviceSession, listStoredCrossDeviceSessions, storeCrossDeviceSession } from './cross-device-store.js';
import { recordCrossDeviceHistoryEntry } from './cross-device-history.js';
import type { CrossDeviceSession, CrossDeviceWorkspaceLink } from './cross-device-types.js';
import { CROSS_DEVICE_RUNTIME_FOUNDATION_OWNER_MODULE } from './cross-device-types.js';

export function linkCrossDeviceToWorkspace(
  crossDeviceId: string,
  workspaceId: string,
): CrossDeviceWorkspaceLink | null {
  const session = getStoredCrossDeviceSession(crossDeviceId);
  const workspace = getWorkspace(workspaceId);
  if (!session || !workspace) return null;

  const mismatch = workspace.workspaceOwner.projectId !== session.crossDeviceOwner.projectId;
  const link: CrossDeviceWorkspaceLink = {
    workspaceId,
    linkedAt: Date.now(),
    linkAuthority: CROSS_DEVICE_RUNTIME_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storeCrossDeviceSession({
    ...session,
    crossDeviceWorkspaceLink: link,
    crossDeviceOwner: { ...session.crossDeviceOwner, workspaceId },
    updatedAt: Date.now(),
  });

  recordCrossDeviceHistoryEntry({
    crossDeviceId,
    category: 'WORKSPACE',
    summary: `Linked to workspace ${workspaceId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: workspaceId,
  });

  return link;
}

export function getWorkspaceForCrossDevice(crossDeviceId: string): string | null {
  return getStoredCrossDeviceSession(crossDeviceId)?.crossDeviceWorkspaceLink.workspaceId ?? null;
}

export function listCrossDevicesByWorkspace(workspaceId: string): CrossDeviceSession[] {
  return listStoredCrossDeviceSessions().filter(
    (s) =>
      s.crossDeviceWorkspaceLink.workspaceId === workspaceId || s.crossDeviceOwner.workspaceId === workspaceId,
  );
}

export function detectCrossDeviceWorkspaceMismatch(crossDeviceId: string): boolean {
  const session = getStoredCrossDeviceSession(crossDeviceId);
  if (!session) return true;
  const workspace = getWorkspace(session.crossDeviceWorkspaceLink.workspaceId);
  if (!workspace) return true;
  return (
    workspace.workspaceOwner.projectId !== session.crossDeviceOwner.projectId ||
    session.crossDeviceWorkspaceLink.mismatchDetected
  );
}
