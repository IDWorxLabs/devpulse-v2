/**
 * Cloud Verification Foundation — history tracking.
 */

import {
  nextCloudVerificationHistoryEntryId,
  storeCloudVerificationHistoryEntry,
  listStoredCloudVerificationHistoryEntries,
} from './cloud-verification-store.js';
import type { CloudVerificationHistoryEntry } from './cloud-verification-types.js';

export function recordCloudVerificationHistoryEntry(input: {
  verificationId: string;
  category: CloudVerificationHistoryEntry['category'];
  summary: string;
  consumer?: string | null;
  scopeUsed?: string | null;
}): CloudVerificationHistoryEntry {
  const entry: CloudVerificationHistoryEntry = {
    entryId: nextCloudVerificationHistoryEntryId(),
    verificationId: input.verificationId,
    category: input.category,
    summary: input.summary,
    timestamp: Date.now(),
    consumer: input.consumer ?? null,
    scopeUsed: input.scopeUsed ?? null,
  };
  storeCloudVerificationHistoryEntry(entry);
  return entry;
}

export function getCloudVerificationHistory(verificationId?: string): CloudVerificationHistoryEntry[] {
  const all = listStoredCloudVerificationHistoryEntries();
  if (!verificationId) return all;
  return all.filter((e) => e.verificationId === verificationId);
}

export function getEvidenceLinkHistory(verificationId: string): CloudVerificationHistoryEntry[] {
  return getCloudVerificationHistory(verificationId).filter((e) => e.category === 'EVIDENCE');
}

export function getReportLinkHistory(verificationId: string): CloudVerificationHistoryEntry[] {
  return getCloudVerificationHistory(verificationId).filter((e) => e.category === 'REPORT');
}

export function getUnifiedEntryHistory(verificationId: string): CloudVerificationHistoryEntry[] {
  return getCloudVerificationHistory(verificationId).filter((e) => e.category === 'UNIFIED_ENTRY');
}

export function getRuntimeLinkHistory(verificationId: string): CloudVerificationHistoryEntry[] {
  return getCloudVerificationHistory(verificationId).filter((e) => e.category === 'RUNTIME');
}

export function getWorkspaceLinkHistory(verificationId: string): CloudVerificationHistoryEntry[] {
  return getCloudVerificationHistory(verificationId).filter((e) => e.category === 'WORKSPACE');
}

export function getPersistentBuildLinkHistory(verificationId: string): CloudVerificationHistoryEntry[] {
  return getCloudVerificationHistory(verificationId).filter((e) => e.category === 'PERSISTENT_BUILD');
}

export function getProjectVerificationHistory(projectId: string): CloudVerificationHistoryEntry[] {
  return listStoredCloudVerificationHistoryEntries().filter(
    (e) => e.scopeUsed === projectId || e.summary.includes(projectId),
  );
}

export function getScopeHistory(verificationId: string): CloudVerificationHistoryEntry[] {
  return getCloudVerificationHistory(verificationId).filter((e) => e.category === 'SCOPE');
}

export function getContextHistory(verificationId: string): CloudVerificationHistoryEntry[] {
  return getCloudVerificationHistory(verificationId).filter((e) => e.category === 'CONTEXT');
}

export function getLifecycleHistory(verificationId: string): CloudVerificationHistoryEntry[] {
  return getCloudVerificationHistory(verificationId).filter((e) => e.category === 'LIFECYCLE');
}

export function listCloudVerificationHistoryConsumers(): string[] {
  const consumers = new Set<string>();
  for (const entry of listStoredCloudVerificationHistoryEntries()) {
    if (entry.consumer) consumers.add(entry.consumer);
  }
  return [...consumers];
}
