/**
 * Founder Inbox Foundation — Mobile Approval bridge.
 */

import { getMobileApprovalSession } from '../mobile-approval-runtime/index.js';
import { getStoredInboxEntry, listStoredInboxEntries, storeInboxEntry } from './founder-inbox-store.js';
import { recordInboxHistoryEntry } from './founder-inbox-history.js';
import type { FounderInboxEntry, InboxApprovalLink } from './founder-inbox-types.js';
import { FOUNDER_INBOX_FOUNDATION_OWNER_MODULE } from './founder-inbox-types.js';

export function linkInboxToApproval(inboxEntryId: string, approvalId: string): InboxApprovalLink | null {
  const entry = getStoredInboxEntry(inboxEntryId);
  const approval = getMobileApprovalSession(approvalId);
  if (!entry || !approval) return null;

  const mismatch = approval.mobileApprovalOwner.projectId !== entry.inboxOwnership.projectId;
  const link: InboxApprovalLink = {
    approvalId,
    linkedAt: Date.now(),
    linkAuthority: FOUNDER_INBOX_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storeInboxEntry({
    ...entry,
    inboxApprovalLink: link,
    updatedAt: Date.now(),
  });

  recordInboxHistoryEntry({
    inboxEntryId,
    category: 'APPROVAL',
    summary: `Linked to approval ${approvalId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: approvalId,
  });

  return link;
}

export function getApprovalForInbox(inboxEntryId: string): string | null {
  return getStoredInboxEntry(inboxEntryId)?.inboxApprovalLink.approvalId ?? null;
}

export function listInboxEntriesByApproval(approvalId: string): FounderInboxEntry[] {
  return listStoredInboxEntries().filter((e) => e.inboxApprovalLink.approvalId === approvalId);
}

export function detectInboxApprovalMismatch(inboxEntryId: string): boolean {
  const entry = getStoredInboxEntry(inboxEntryId);
  if (!entry) return true;
  const approval = getMobileApprovalSession(entry.inboxApprovalLink.approvalId);
  if (!approval) return true;
  return (
    approval.mobileApprovalOwner.projectId !== entry.inboxOwnership.projectId ||
    entry.inboxApprovalLink.mismatchDetected
  );
}
