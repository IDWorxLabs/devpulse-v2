/**
 * Mobile Chat Runtime Foundation — ownership tracking.
 */

import { recordMobileChatHistoryEntry } from './mobile-chat-history.js';
import type { MobileChatOwnership } from './mobile-chat-types.js';
import { MOBILE_CHAT_RUNTIME_FOUNDATION_OWNER_MODULE } from './mobile-chat-types.js';

export function buildMobileChatOwnership(input: {
  projectId: string;
  mobileCommandSessionId: string;
  runtimeId: string;
  workspaceId: string;
  persistentBuildId: string;
  verificationId: string;
  monitoringId: string;
  createdBy?: string;
}): MobileChatOwnership {
  return {
    ownerModule: MOBILE_CHAT_RUNTIME_FOUNDATION_OWNER_MODULE,
    ownerDomain: 'mobile_chat_runtime_foundation',
    createdBy: input.createdBy ?? MOBILE_CHAT_RUNTIME_FOUNDATION_OWNER_MODULE,
    projectId: input.projectId,
    mobileCommandSessionId: input.mobileCommandSessionId,
    runtimeId: input.runtimeId,
    workspaceId: input.workspaceId,
    persistentBuildId: input.persistentBuildId,
    verificationId: input.verificationId,
    monitoringId: input.monitoringId,
    mobileChatSessionId: null,
    mobileChatAuthority: MOBILE_CHAT_RUNTIME_FOUNDATION_OWNER_MODULE,
    creationTimestamp: Date.now(),
  };
}

export function recordMobileChatOwnershipHistory(mobileChatId: string, summary: string): void {
  recordMobileChatHistoryEntry({ mobileChatId, category: 'OWNERSHIP', summary, scopeUsed: mobileChatId });
}

export function updateMobileChatSessionOwnership(
  ownership: MobileChatOwnership,
  sessionId: string,
): MobileChatOwnership {
  return { ...ownership, mobileChatSessionId: sessionId };
}
