/**
 * Founder Inbox Foundation — grouping layer.
 */

import { listStoredInboxEntries } from './founder-inbox-store.js';
import type { FounderInboxEntry, InboxCategory, InboxPriority } from './founder-inbox-types.js';
import { recordInboxHistoryEntry } from './founder-inbox-history.js';

export function groupByProject(): Record<string, FounderInboxEntry[]> {
  const groups: Record<string, FounderInboxEntry[]> = {};
  for (const entry of listStoredInboxEntries()) {
    const key = entry.inboxOwnership.projectId;
    groups[key] = groups[key] ?? [];
    groups[key]!.push(entry);
  }
  recordGroupingHistory('groupByProject', Object.keys(groups).length);
  return groups;
}

export function groupByPriority(): Record<InboxPriority, FounderInboxEntry[]> {
  const groups: Record<string, FounderInboxEntry[]> = {};
  for (const entry of listStoredInboxEntries()) {
    const key = entry.inboxPriority.priority;
    groups[key] = groups[key] ?? [];
    groups[key]!.push(entry);
  }
  recordGroupingHistory('groupByPriority', Object.keys(groups).length);
  return groups as Record<InboxPriority, FounderInboxEntry[]>;
}

export function groupByCategory(): Record<InboxCategory, FounderInboxEntry[]> {
  const groups: Record<string, FounderInboxEntry[]> = {};
  for (const entry of listStoredInboxEntries()) {
    const key = entry.inboxCategory;
    groups[key] = groups[key] ?? [];
    groups[key]!.push(entry);
  }
  recordGroupingHistory('groupByCategory', Object.keys(groups).length);
  return groups as Record<InboxCategory, FounderInboxEntry[]>;
}

export function groupByRuntime(): Record<string, FounderInboxEntry[]> {
  const groups: Record<string, FounderInboxEntry[]> = {};
  for (const entry of listStoredInboxEntries()) {
    const key = entry.inboxOwnership.runtimeId;
    groups[key] = groups[key] ?? [];
    groups[key]!.push(entry);
  }
  recordGroupingHistory('groupByRuntime', Object.keys(groups).length);
  return groups;
}

export function groupByDevice(): Record<string, FounderInboxEntry[]> {
  const groups: Record<string, FounderInboxEntry[]> = {};
  for (const entry of listStoredInboxEntries()) {
    const key = entry.inboxOwnership.deviceId;
    groups[key] = groups[key] ?? [];
    groups[key]!.push(entry);
  }
  recordGroupingHistory('groupByDevice', Object.keys(groups).length);
  return groups;
}

function recordGroupingHistory(fn: string, groupCount: number): void {
  const first = listStoredInboxEntries()[0];
  if (!first) return;
  recordInboxHistoryEntry({
    inboxEntryId: first.inboxEntryId,
    category: 'GROUP',
    summary: `${fn}() → ${groupCount} groups`,
    scopeUsed: fn,
  });
}
