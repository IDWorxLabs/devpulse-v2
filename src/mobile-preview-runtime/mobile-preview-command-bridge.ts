/**
 * Mobile Preview Runtime Foundation — Mobile Command Runtime bridge.
 */

import { getMobileCommandSession } from '../mobile-command-runtime/index.js';
import { getStoredMobilePreviewSession, listStoredMobilePreviewSessions, storeMobilePreviewSession } from './mobile-preview-store.js';
import { recordMobilePreviewHistoryEntry } from './mobile-preview-history.js';
import type { MobilePreviewSession, MobilePreviewCommandLink } from './mobile-preview-types.js';
import { MOBILE_PREVIEW_RUNTIME_FOUNDATION_OWNER_MODULE } from './mobile-preview-types.js';

export function linkMobilePreviewToCommandSession(
  mobilePreviewId: string,
  mobileCommandId: string,
): MobilePreviewCommandLink | null {
  const session = getStoredMobilePreviewSession(mobilePreviewId);
  const command = getMobileCommandSession(mobileCommandId);
  if (!session || !command) return null;

  const mismatch = command.mobileCommandOwner.projectId !== session.mobilePreviewOwner.projectId;
  const link: MobilePreviewCommandLink = {
    mobileCommandId,
    linkedAt: Date.now(),
    linkAuthority: MOBILE_PREVIEW_RUNTIME_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storeMobilePreviewSession({
    ...session,
    mobilePreviewCommandLink: link,
    mobilePreviewOwner: { ...session.mobilePreviewOwner, mobileCommandSessionId: mobileCommandId },
    updatedAt: Date.now(),
  });

  recordMobilePreviewHistoryEntry({
    mobilePreviewId,
    category: 'COMMAND',
    summary: `Linked to mobile command ${mobileCommandId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: mobileCommandId,
  });

  return link;
}

export function getCommandSessionForMobilePreview(mobilePreviewId: string): string | null {
  return getStoredMobilePreviewSession(mobilePreviewId)?.mobilePreviewCommandLink.mobileCommandId ?? null;
}

export function listMobilePreviewsByCommandSession(mobileCommandId: string): MobilePreviewSession[] {
  return listStoredMobilePreviewSessions().filter(
    (s) =>
      s.mobilePreviewCommandLink.mobileCommandId === mobileCommandId ||
      s.mobilePreviewOwner.mobileCommandSessionId === mobileCommandId,
  );
}

export function detectMobilePreviewCommandMismatch(mobilePreviewId: string): boolean {
  const session = getStoredMobilePreviewSession(mobilePreviewId);
  if (!session) return true;
  const command = getMobileCommandSession(session.mobilePreviewCommandLink.mobileCommandId);
  if (!command) return true;
  return (
    command.mobileCommandOwner.projectId !== session.mobilePreviewOwner.projectId ||
    session.mobilePreviewCommandLink.mismatchDetected
  );
}

export function resolveCommandForMobilePreviewRegistration(
  mobileCommandId: string,
): { exists: boolean; projectId: string | null } {
  const command = getMobileCommandSession(mobileCommandId);
  if (!command) return { exists: false, projectId: null };
  return { exists: true, projectId: command.mobileCommandOwner.projectId };
}
