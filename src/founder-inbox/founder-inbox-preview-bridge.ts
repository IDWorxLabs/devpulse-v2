/**
 * Founder Inbox Foundation — Mobile Preview bridge.
 */

import { getMobilePreviewSession } from '../mobile-preview-runtime/index.js';
import { getStoredInboxEntry, listStoredInboxEntries, storeInboxEntry } from './founder-inbox-store.js';
import { recordInboxHistoryEntry } from './founder-inbox-history.js';
import type { FounderInboxEntry, InboxPreviewLink } from './founder-inbox-types.js';
import { FOUNDER_INBOX_FOUNDATION_OWNER_MODULE } from './founder-inbox-types.js';

export function linkInboxToPreview(inboxEntryId: string, previewId: string): InboxPreviewLink | null {
  const entry = getStoredInboxEntry(inboxEntryId);
  const preview = getMobilePreviewSession(previewId);
  if (!entry || !preview) return null;

  const mismatch = preview.mobilePreviewOwner.projectId !== entry.inboxOwnership.projectId;
  const link: InboxPreviewLink = {
    previewId,
    linkedAt: Date.now(),
    linkAuthority: FOUNDER_INBOX_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storeInboxEntry({
    ...entry,
    inboxPreviewLink: link,
    updatedAt: Date.now(),
  });

  recordInboxHistoryEntry({
    inboxEntryId,
    category: 'PREVIEW',
    summary: `Linked to preview ${previewId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: previewId,
  });

  return link;
}

export function getPreviewForInbox(inboxEntryId: string): string | null {
  return getStoredInboxEntry(inboxEntryId)?.inboxPreviewLink.previewId ?? null;
}

export function listInboxEntriesByPreview(previewId: string): FounderInboxEntry[] {
  return listStoredInboxEntries().filter((e) => e.inboxPreviewLink.previewId === previewId);
}

export function detectInboxPreviewMismatch(inboxEntryId: string): boolean {
  const entry = getStoredInboxEntry(inboxEntryId);
  if (!entry) return true;
  const preview = getMobilePreviewSession(entry.inboxPreviewLink.previewId);
  if (!preview) return true;
  return (
    preview.mobilePreviewOwner.projectId !== entry.inboxOwnership.projectId ||
    entry.inboxPreviewLink.mismatchDetected
  );
}
