/**
 * Mobile Approval Runtime Foundation — Mobile Chat Runtime bridge.
 */

import { getMobileChatSession } from '../mobile-chat-runtime/index.js';
import { getStoredMobileApprovalSession, listStoredMobileApprovalSessions, storeMobileApprovalSession } from './mobile-approval-store.js';
import { recordMobileApprovalHistoryEntry } from './mobile-approval-history.js';
import type { MobileApprovalSession, MobileApprovalChatLink } from './mobile-approval-types.js';
import { MOBILE_APPROVAL_RUNTIME_FOUNDATION_OWNER_MODULE } from './mobile-approval-types.js';

export function linkMobileApprovalToChatSession(
  mobileApprovalId: string,
  mobileChatId: string,
): MobileApprovalChatLink | null {
  const session = getStoredMobileApprovalSession(mobileApprovalId);
  const chat = getMobileChatSession(mobileChatId);
  if (!session || !chat) return null;

  const mismatch = chat.mobileChatOwner.projectId !== session.mobileApprovalOwner.projectId;
  const link: MobileApprovalChatLink = {
    mobileChatId,
    linkedAt: Date.now(),
    linkAuthority: MOBILE_APPROVAL_RUNTIME_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storeMobileApprovalSession({
    ...session,
    mobileApprovalChatLink: link,
    mobileApprovalOwner: { ...session.mobileApprovalOwner, mobileChatSessionId: mobileChatId },
    updatedAt: Date.now(),
  });

  recordMobileApprovalHistoryEntry({
    mobileApprovalId,
    category: 'CHAT',
    summary: `Linked to mobile chat ${mobileChatId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: mobileChatId,
  });

  return link;
}

export function getChatSessionForMobileApproval(mobileApprovalId: string): string | null {
  return getStoredMobileApprovalSession(mobileApprovalId)?.mobileApprovalChatLink.mobileChatId ?? null;
}

export function listMobileApprovalsByChatSession(mobileChatId: string): MobileApprovalSession[] {
  return listStoredMobileApprovalSessions().filter(
    (s) =>
      s.mobileApprovalChatLink.mobileChatId === mobileChatId ||
      s.mobileApprovalOwner.mobileChatSessionId === mobileChatId,
  );
}

export function detectMobileApprovalChatMismatch(mobileApprovalId: string): boolean {
  const session = getStoredMobileApprovalSession(mobileApprovalId);
  if (!session) return true;
  const chat = getMobileChatSession(session.mobileApprovalChatLink.mobileChatId);
  if (!chat) return true;
  return (
    chat.mobileChatOwner.projectId !== session.mobileApprovalOwner.projectId ||
    session.mobileApprovalChatLink.mismatchDetected
  );
}

export function resolveChatForMobileApprovalRegistration(
  mobileChatId: string,
): { exists: boolean; projectId: string | null } {
  const chat = getMobileChatSession(mobileChatId);
  if (!chat) return { exists: false, projectId: null };
  return { exists: true, projectId: chat.mobileChatOwner.projectId };
}
