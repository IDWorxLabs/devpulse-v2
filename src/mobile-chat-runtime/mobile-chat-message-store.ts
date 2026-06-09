/**
 * Mobile Chat Runtime Foundation — message store (metadata only).
 */

import {
  nextMobileChatMessageId,
  storeMobileChatMessage,
  getStoredMobileChatMessage,
  listStoredMobileChatMessages,
  getStoredMobileChatSession,
} from './mobile-chat-store.js';
import { recordMobileChatHistoryEntry } from './mobile-chat-history.js';
import type { MobileChatMessage } from './mobile-chat-types.js';

export function registerMobileMessage(input: {
  mobileChatId: string;
  messageRole: MobileChatMessage['messageRole'];
  messageText: string;
  promptId?: string | null;
  responseId?: string | null;
}): MobileChatMessage | null {
  const session = getStoredMobileChatSession(input.mobileChatId);
  if (!session) return null;

  const message: MobileChatMessage = {
    messageId: nextMobileChatMessageId(),
    mobileChatId: input.mobileChatId,
    messageRole: input.messageRole,
    messageText: input.messageText,
    messageTimestamp: Date.now(),
    promptId: input.promptId ?? null,
    responseId: input.responseId ?? null,
    metadataOnly: true,
  };
  storeMobileChatMessage(message);

  recordMobileChatHistoryEntry({
    mobileChatId: input.mobileChatId,
    category: 'MESSAGE',
    summary: `Message ${message.messageId} registered (${message.messageRole})`,
    scopeUsed: message.messageId,
  });

  return message;
}

export function getMobileMessage(messageId: string): MobileChatMessage | null {
  return getStoredMobileChatMessage(messageId);
}

export function listMobileMessages(): MobileChatMessage[] {
  return listStoredMobileChatMessages();
}

export function listMessagesByChatSession(mobileChatId: string): MobileChatMessage[] {
  return listStoredMobileChatMessages().filter((m) => m.mobileChatId === mobileChatId);
}

export function listMessagesByProject(projectId: string): MobileChatMessage[] {
  return listStoredMobileChatMessages().filter((m) => {
    const session = getStoredMobileChatSession(m.mobileChatId);
    return session?.mobileChatOwner.projectId === projectId;
  });
}

export function listMessagesByCommandSession(mobileCommandSessionId: string): MobileChatMessage[] {
  return listStoredMobileChatMessages().filter((m) => {
    const session = getStoredMobileChatSession(m.mobileChatId);
    return session?.mobileChatOwner.mobileCommandSessionId === mobileCommandSessionId;
  });
}
