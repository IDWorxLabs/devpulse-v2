/**
 * Mobile Chat Runtime Foundation — Cloud Verification bridge.
 */

import { getCloudVerification } from '../cloud-verification/index.js';
import { getStoredMobileChatSession, listStoredMobileChatSessions, storeMobileChatSession } from './mobile-chat-store.js';
import { recordMobileChatHistoryEntry } from './mobile-chat-history.js';
import type { MobileChatSession, MobileChatVerificationLink } from './mobile-chat-types.js';
import { MOBILE_CHAT_RUNTIME_FOUNDATION_OWNER_MODULE } from './mobile-chat-types.js';

export function linkMobileChatToVerification(mobileChatId: string, verificationId: string): MobileChatVerificationLink | null {
  const session = getStoredMobileChatSession(mobileChatId);
  const verification = getCloudVerification(verificationId);
  if (!session || !verification) return null;

  const mismatch = verification.verificationOwner.projectId !== session.mobileChatOwner.projectId;
  const link: MobileChatVerificationLink = {
    verificationId,
    linkedAt: Date.now(),
    linkAuthority: MOBILE_CHAT_RUNTIME_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storeMobileChatSession({ ...session, mobileChatVerificationLink: link, mobileChatOwner: { ...session.mobileChatOwner, verificationId }, updatedAt: Date.now() });
  recordMobileChatHistoryEntry({ mobileChatId, category: 'VERIFICATION', summary: `Linked to verification ${verificationId}`, scopeUsed: verificationId });
  return link;
}

export function getVerificationForMobileChat(mobileChatId: string): string | null {
  return getStoredMobileChatSession(mobileChatId)?.mobileChatVerificationLink.verificationId ?? null;
}

export function listMobileChatsByVerification(verificationId: string): MobileChatSession[] {
  return listStoredMobileChatSessions().filter(
    (s) => s.mobileChatVerificationLink.verificationId === verificationId || s.mobileChatOwner.verificationId === verificationId,
  );
}

export function detectMobileChatVerificationMismatch(mobileChatId: string): boolean {
  const session = getStoredMobileChatSession(mobileChatId);
  if (!session) return true;
  const verification = getCloudVerification(session.mobileChatVerificationLink.verificationId);
  if (!verification) return true;
  return verification.verificationOwner.projectId !== session.mobileChatOwner.projectId || session.mobileChatVerificationLink.mismatchDetected;
}

export function resolveVerificationForMobileChatRegistration(verificationId: string): { exists: boolean; projectId: string | null } {
  const verification = getCloudVerification(verificationId);
  if (!verification) return { exists: false, projectId: null };
  return { exists: true, projectId: verification.verificationOwner.projectId };
}
