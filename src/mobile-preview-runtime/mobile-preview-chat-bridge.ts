/**
 * Mobile Preview Runtime Foundation — Mobile Chat Runtime bridge.
 */

import { getMobileChatSession } from '../mobile-chat-runtime/index.js';
import { getStoredMobilePreviewSession, listStoredMobilePreviewSessions, storeMobilePreviewSession } from './mobile-preview-store.js';
import { recordMobilePreviewHistoryEntry } from './mobile-preview-history.js';
import type { MobilePreviewSession, MobilePreviewChatLink } from './mobile-preview-types.js';
import { MOBILE_PREVIEW_RUNTIME_FOUNDATION_OWNER_MODULE } from './mobile-preview-types.js';

export function linkMobilePreviewToChatSession(
  mobilePreviewId: string,
  mobileChatId: string,
): MobilePreviewChatLink | null {
  const session = getStoredMobilePreviewSession(mobilePreviewId);
  const chat = getMobileChatSession(mobileChatId);
  if (!session || !chat) return null;

  const mismatch = chat.mobileChatOwner.projectId !== session.mobilePreviewOwner.projectId;
  const link: MobilePreviewChatLink = {
    mobileChatId,
    linkedAt: Date.now(),
    linkAuthority: MOBILE_PREVIEW_RUNTIME_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storeMobilePreviewSession({
    ...session,
    mobilePreviewChatLink: link,
    mobilePreviewOwner: { ...session.mobilePreviewOwner, mobileChatSessionId: mobileChatId },
    updatedAt: Date.now(),
  });

  recordMobilePreviewHistoryEntry({
    mobilePreviewId,
    category: 'CHAT',
    summary: `Linked to mobile chat ${mobileChatId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: mobileChatId,
  });

  return link;
}

export function getChatSessionForMobilePreview(mobilePreviewId: string): string | null {
  return getStoredMobilePreviewSession(mobilePreviewId)?.mobilePreviewChatLink.mobileChatId ?? null;
}

export function listMobilePreviewsByChatSession(mobileChatId: string): MobilePreviewSession[] {
  return listStoredMobilePreviewSessions().filter(
    (s) =>
      s.mobilePreviewChatLink.mobileChatId === mobileChatId ||
      s.mobilePreviewOwner.mobileChatSessionId === mobileChatId,
  );
}

export function detectMobilePreviewChatMismatch(mobilePreviewId: string): boolean {
  const session = getStoredMobilePreviewSession(mobilePreviewId);
  if (!session) return true;
  const chat = getMobileChatSession(session.mobilePreviewChatLink.mobileChatId);
  if (!chat) return true;
  return (
    chat.mobileChatOwner.projectId !== session.mobilePreviewOwner.projectId ||
    session.mobilePreviewChatLink.mismatchDetected
  );
}

export function resolveChatForMobilePreviewRegistration(
  mobileChatId: string,
): { exists: boolean; projectId: string | null } {
  const chat = getMobileChatSession(mobileChatId);
  if (!chat) return { exists: false, projectId: null };
  return { exists: true, projectId: chat.mobileChatOwner.projectId };
}
