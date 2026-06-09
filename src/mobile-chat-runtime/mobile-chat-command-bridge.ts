/**
 * Mobile Chat Runtime Foundation — Mobile Command Runtime bridge.
 */

import { getMobileCommandSession } from '../mobile-command-runtime/index.js';
import { getStoredMobileChatSession, listStoredMobileChatSessions, storeMobileChatSession } from './mobile-chat-store.js';
import { recordMobileChatHistoryEntry } from './mobile-chat-history.js';
import type { MobileChatSession, MobileChatCommandLink } from './mobile-chat-types.js';
import { MOBILE_CHAT_RUNTIME_FOUNDATION_OWNER_MODULE } from './mobile-chat-types.js';

export function linkMobileChatToCommandSession(
  mobileChatId: string,
  mobileCommandId: string,
): MobileChatCommandLink | null {
  const session = getStoredMobileChatSession(mobileChatId);
  const command = getMobileCommandSession(mobileCommandId);
  if (!session || !command) return null;

  const mismatch = command.mobileCommandOwner.projectId !== session.mobileChatOwner.projectId;
  const link: MobileChatCommandLink = {
    mobileCommandId,
    linkedAt: Date.now(),
    linkAuthority: MOBILE_CHAT_RUNTIME_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storeMobileChatSession({
    ...session,
    mobileChatCommandLink: link,
    mobileChatOwner: { ...session.mobileChatOwner, mobileCommandSessionId: mobileCommandId },
    updatedAt: Date.now(),
  });

  recordMobileChatHistoryEntry({
    mobileChatId,
    category: 'COMMAND',
    summary: `Linked to mobile command ${mobileCommandId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: mobileCommandId,
  });

  return link;
}

export function getCommandSessionForMobileChat(mobileChatId: string): string | null {
  return getStoredMobileChatSession(mobileChatId)?.mobileChatCommandLink.mobileCommandId ?? null;
}

export function listMobileChatsByCommandSession(mobileCommandId: string): MobileChatSession[] {
  return listStoredMobileChatSessions().filter(
    (s) =>
      s.mobileChatCommandLink.mobileCommandId === mobileCommandId ||
      s.mobileChatOwner.mobileCommandSessionId === mobileCommandId,
  );
}

export function detectMobileChatCommandMismatch(mobileChatId: string): boolean {
  const session = getStoredMobileChatSession(mobileChatId);
  if (!session) return true;
  const command = getMobileCommandSession(session.mobileChatCommandLink.mobileCommandId);
  if (!command) return true;
  return command.mobileCommandOwner.projectId !== session.mobileChatOwner.projectId || session.mobileChatCommandLink.mismatchDetected;
}

export function resolveCommandForMobileChatRegistration(
  mobileCommandId: string,
): { exists: boolean; projectId: string | null } {
  const command = getMobileCommandSession(mobileCommandId);
  if (!command) return { exists: false, projectId: null };
  return { exists: true, projectId: command.mobileCommandOwner.projectId };
}
