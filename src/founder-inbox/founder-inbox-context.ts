/**
 * Founder Inbox Foundation — context aggregation.
 */

import { getStoredInboxEntry, storeInboxEntry } from './founder-inbox-store.js';
import type { InboxContext } from './founder-inbox-types.js';

export function buildDefaultInboxContext(input: {
  projectId: string;
  runtimeId: string;
  workspaceId: string;
  persistentBuildId: string;
  approvalId: string;
  previewId: string;
  commandSessionId: string;
  chatSessionId: string;
  crossDeviceSessionId: string;
}): InboxContext {
  return {
    projectId: input.projectId,
    runtimeId: input.runtimeId,
    workspaceId: input.workspaceId,
    persistentBuildId: input.persistentBuildId,
    approvalId: input.approvalId,
    previewId: input.previewId,
    commandSessionId: input.commandSessionId,
    chatSessionId: input.chatSessionId,
    crossDeviceSessionId: input.crossDeviceSessionId,
    operatorFeedEventId: '',
  };
}

export function refreshInboxContext(inboxEntryId: string): InboxContext | null {
  const entry = getStoredInboxEntry(inboxEntryId);
  if (!entry) return null;
  const refreshed = { ...entry.inboxContext, operatorFeedEventId: `feed-${inboxEntryId}` };
  storeInboxEntry({ ...entry, inboxContext: refreshed, updatedAt: Date.now() });
  return refreshed;
}

export function getInboxContextById(inboxEntryId: string): InboxContext | null {
  return getStoredInboxEntry(inboxEntryId)?.inboxContext ?? null;
}

export function validateInboxContext(context: InboxContext): boolean {
  return Boolean(context.projectId && context.runtimeId);
}

export function detectInboxContextMismatch(inboxEntryId: string): boolean {
  const entry = getStoredInboxEntry(inboxEntryId);
  if (!entry) return true;
  return entry.inboxContext.projectId !== entry.inboxOwnership.projectId;
}
