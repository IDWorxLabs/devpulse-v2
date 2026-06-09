/**
 * Mobile Approval Runtime Foundation — history tracking.
 */

import {
  nextMobileApprovalHistoryEntryId,
  storeMobileApprovalHistoryEntry,
  listStoredMobileApprovalHistoryEntries,
} from './mobile-approval-store.js';
import type { MobileApprovalHistoryEntry } from './mobile-approval-types.js';

export function recordMobileApprovalHistoryEntry(input: {
  mobileApprovalId: string;
  category: MobileApprovalHistoryEntry['category'];
  summary: string;
  consumer?: string | null;
  scopeUsed?: string | null;
}): MobileApprovalHistoryEntry {
  const entry: MobileApprovalHistoryEntry = {
    entryId: nextMobileApprovalHistoryEntryId(),
    mobileApprovalId: input.mobileApprovalId,
    category: input.category,
    summary: input.summary,
    timestamp: Date.now(),
    consumer: input.consumer ?? null,
    scopeUsed: input.scopeUsed ?? null,
  };
  storeMobileApprovalHistoryEntry(entry);
  return entry;
}

export function getMobileApprovalHistory(mobileApprovalId?: string): MobileApprovalHistoryEntry[] {
  const all = listStoredMobileApprovalHistoryEntries();
  if (!mobileApprovalId) return all;
  return all.filter((e) => e.mobileApprovalId === mobileApprovalId);
}

export function listMobileApprovalHistoryConsumers(): string[] {
  const consumers = new Set<string>();
  for (const entry of listStoredMobileApprovalHistoryEntries()) {
    if (entry.consumer) consumers.add(entry.consumer);
  }
  return [...consumers];
}
