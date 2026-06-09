/**
 * Mobile Approval Runtime Foundation — Mobile Command Runtime bridge.
 */

import { getMobileCommandSession } from '../mobile-command-runtime/index.js';
import { getStoredMobileApprovalSession, listStoredMobileApprovalSessions, storeMobileApprovalSession } from './mobile-approval-store.js';
import { recordMobileApprovalHistoryEntry } from './mobile-approval-history.js';
import type { MobileApprovalSession, MobileApprovalCommandLink } from './mobile-approval-types.js';
import { MOBILE_APPROVAL_RUNTIME_FOUNDATION_OWNER_MODULE } from './mobile-approval-types.js';

export function linkMobileApprovalToCommandSession(
  mobileApprovalId: string,
  mobileCommandId: string,
): MobileApprovalCommandLink | null {
  const session = getStoredMobileApprovalSession(mobileApprovalId);
  const command = getMobileCommandSession(mobileCommandId);
  if (!session || !command) return null;

  const mismatch = command.mobileCommandOwner.projectId !== session.mobileApprovalOwner.projectId;
  const link: MobileApprovalCommandLink = {
    mobileCommandId,
    linkedAt: Date.now(),
    linkAuthority: MOBILE_APPROVAL_RUNTIME_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storeMobileApprovalSession({
    ...session,
    mobileApprovalCommandLink: link,
    mobileApprovalOwner: { ...session.mobileApprovalOwner, mobileCommandSessionId: mobileCommandId },
    updatedAt: Date.now(),
  });

  recordMobileApprovalHistoryEntry({
    mobileApprovalId,
    category: 'COMMAND',
    summary: `Linked to mobile command ${mobileCommandId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: mobileCommandId,
  });

  return link;
}

export function getCommandSessionForMobileApproval(mobileApprovalId: string): string | null {
  return getStoredMobileApprovalSession(mobileApprovalId)?.mobileApprovalCommandLink.mobileCommandId ?? null;
}

export function listMobileApprovalsByCommandSession(mobileCommandId: string): MobileApprovalSession[] {
  return listStoredMobileApprovalSessions().filter(
    (s) =>
      s.mobileApprovalCommandLink.mobileCommandId === mobileCommandId ||
      s.mobileApprovalOwner.mobileCommandSessionId === mobileCommandId,
  );
}

export function detectMobileApprovalCommandMismatch(mobileApprovalId: string): boolean {
  const session = getStoredMobileApprovalSession(mobileApprovalId);
  if (!session) return true;
  const command = getMobileCommandSession(session.mobileApprovalCommandLink.mobileCommandId);
  if (!command) return true;
  return (
    command.mobileCommandOwner.projectId !== session.mobileApprovalOwner.projectId ||
    session.mobileApprovalCommandLink.mismatchDetected
  );
}

export function resolveCommandForMobileApprovalRegistration(
  mobileCommandId: string,
): { exists: boolean; projectId: string | null } {
  const command = getMobileCommandSession(mobileCommandId);
  if (!command) return { exists: false, projectId: null };
  return { exists: true, projectId: command.mobileCommandOwner.projectId };
}
