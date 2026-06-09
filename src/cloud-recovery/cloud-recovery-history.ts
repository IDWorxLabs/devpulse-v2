/**
 * Cloud Recovery Foundation — history tracking.
 */

import {
  nextRecoveryHistoryEntryId,
  storeCloudRecoveryHistoryEntry,
  listStoredCloudRecoveryHistoryEntries,
} from './cloud-recovery-store.js';
import type { CloudRecoveryHistoryEntry } from './cloud-recovery-types.js';

export function recordCloudRecoveryHistoryEntry(input: {
  recoveryId: string;
  category: CloudRecoveryHistoryEntry['category'];
  summary: string;
  consumer?: string | null;
  scopeUsed?: string | null;
}): CloudRecoveryHistoryEntry {
  const entry: CloudRecoveryHistoryEntry = {
    entryId: nextRecoveryHistoryEntryId(),
    recoveryId: input.recoveryId,
    category: input.category,
    summary: input.summary,
    timestamp: Date.now(),
    consumer: input.consumer ?? null,
    scopeUsed: input.scopeUsed ?? null,
  };
  storeCloudRecoveryHistoryEntry(entry);
  return entry;
}

export function getCloudRecoveryHistory(recoveryId?: string): CloudRecoveryHistoryEntry[] {
  const all = listStoredCloudRecoveryHistoryEntries();
  if (!recoveryId) return all;
  return all.filter((e) => e.recoveryId === recoveryId);
}

export function getFailureHistory(recoveryId: string): CloudRecoveryHistoryEntry[] {
  return getCloudRecoveryHistory(recoveryId).filter((e) => e.category === 'FAILURE');
}

export function getCandidateHistory(recoveryId: string): CloudRecoveryHistoryEntry[] {
  return getCloudRecoveryHistory(recoveryId).filter((e) => e.category === 'CANDIDATE');
}

export function getRuntimeLinkHistory(recoveryId: string): CloudRecoveryHistoryEntry[] {
  return getCloudRecoveryHistory(recoveryId).filter((e) => e.category === 'RUNTIME');
}

export function getWorkspaceLinkHistory(recoveryId: string): CloudRecoveryHistoryEntry[] {
  return getCloudRecoveryHistory(recoveryId).filter((e) => e.category === 'WORKSPACE');
}

export function getPersistentBuildLinkHistory(recoveryId: string): CloudRecoveryHistoryEntry[] {
  return getCloudRecoveryHistory(recoveryId).filter((e) => e.category === 'PERSISTENT_BUILD');
}

export function getVerificationLinkHistory(recoveryId: string): CloudRecoveryHistoryEntry[] {
  return getCloudRecoveryHistory(recoveryId).filter((e) => e.category === 'VERIFICATION');
}

export function getProjectRecoveryHistory(projectId: string): CloudRecoveryHistoryEntry[] {
  return listStoredCloudRecoveryHistoryEntries().filter(
    (e) => e.scopeUsed === projectId || e.summary.includes(projectId),
  );
}

export function getScopeHistory(recoveryId: string): CloudRecoveryHistoryEntry[] {
  return getCloudRecoveryHistory(recoveryId).filter((e) => e.category === 'SCOPE');
}

export function getContextHistory(recoveryId: string): CloudRecoveryHistoryEntry[] {
  return getCloudRecoveryHistory(recoveryId).filter((e) => e.category === 'CONTEXT');
}

export function getLifecycleHistory(recoveryId: string): CloudRecoveryHistoryEntry[] {
  return getCloudRecoveryHistory(recoveryId).filter((e) => e.category === 'LIFECYCLE');
}

export function listCloudRecoveryHistoryConsumers(): string[] {
  const consumers = new Set<string>();
  for (const entry of listStoredCloudRecoveryHistoryEntries()) {
    if (entry.consumer) consumers.add(entry.consumer);
  }
  return [...consumers];
}
