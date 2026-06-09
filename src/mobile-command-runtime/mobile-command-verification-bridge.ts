/**
 * Mobile Command Runtime Foundation — Cloud Verification Foundation bridge.
 */

import { getCloudVerification } from '../cloud-verification/index.js';
import { getStoredMobileCommandSession, listStoredMobileCommandSessions, storeMobileCommandSession } from './mobile-command-store.js';
import { recordMobileCommandHistoryEntry } from './mobile-command-history.js';
import type { MobileCommandSession, MobileCommandVerificationLink } from './mobile-command-types.js';
import { MOBILE_COMMAND_RUNTIME_FOUNDATION_OWNER_MODULE } from './mobile-command-types.js';

export function linkMobileCommandToVerification(mobileCommandId: string, verificationId: string): MobileCommandVerificationLink | null {
  const session = getStoredMobileCommandSession(mobileCommandId);
  const verification = getCloudVerification(verificationId);
  if (!session || !verification) return null;

  const mismatch = verification.verificationOwner.projectId !== session.mobileCommandOwner.projectId;
  const link: MobileCommandVerificationLink = {
    verificationId,
    linkedAt: Date.now(),
    linkAuthority: MOBILE_COMMAND_RUNTIME_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storeMobileCommandSession({
    ...session,
    mobileCommandVerificationLink: link,
    mobileCommandOwner: { ...session.mobileCommandOwner, verificationId },
    updatedAt: Date.now(),
  });

  recordMobileCommandHistoryEntry({
    mobileCommandId,
    category: 'VERIFICATION',
    summary: `Linked to verification ${verificationId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: verificationId,
  });

  return link;
}

export function getVerificationForMobileCommand(mobileCommandId: string): string | null {
  return getStoredMobileCommandSession(mobileCommandId)?.mobileCommandVerificationLink.verificationId ?? null;
}

export function listMobileCommandsByVerification(verificationId: string): MobileCommandSession[] {
  return listStoredMobileCommandSessions().filter(
    (s) =>
      s.mobileCommandVerificationLink.verificationId === verificationId ||
      s.mobileCommandOwner.verificationId === verificationId,
  );
}

export function detectMobileCommandVerificationMismatch(mobileCommandId: string): boolean {
  const session = getStoredMobileCommandSession(mobileCommandId);
  if (!session) return true;
  const verification = getCloudVerification(session.mobileCommandVerificationLink.verificationId);
  if (!verification) return true;
  return verification.verificationOwner.projectId !== session.mobileCommandOwner.projectId || session.mobileCommandVerificationLink.mismatchDetected;
}

export function resolveVerificationForMobileCommandRegistration(
  verificationId: string,
): { exists: boolean; projectId: string | null } {
  const verification = getCloudVerification(verificationId);
  if (!verification) return { exists: false, projectId: null };
  return { exists: true, projectId: verification.verificationOwner.projectId };
}
