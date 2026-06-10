/**
 * Completion Truth Engine — authority registry.
 */

import type { CompletionTruthRecord, CompletionTruthState } from './completion-truth-types.js';

let authorityCounter = 0;

const byAuthorityId = new Map<string, CompletionTruthRecord>();
const byProjectId = new Map<string, Set<string>>();
const byWorkspaceId = new Map<string, Set<string>>();
const byStatus = new Map<CompletionTruthState, Set<string>>();

function indexRecord(record: CompletionTruthRecord, projectId: string, workspaceId: string): void {
  const add = (map: Map<string, Set<string>>, key: string) => {
    if (!map.has(key)) map.set(key, new Set());
    map.get(key)!.add(record.recordId);
  };
  add(byProjectId, projectId);
  add(byWorkspaceId, workspaceId);
  if (!byStatus.has(record.authority.truthState)) byStatus.set(record.authority.truthState, new Set());
  byStatus.get(record.authority.truthState)!.add(record.recordId);
}

export function registerCompletionTruthRecord(
  record: CompletionTruthRecord,
  projectId: string,
  workspaceId: string,
): CompletionTruthRecord {
  byAuthorityId.set(record.authority.authorityId, record);
  byAuthorityId.set(record.recordId, record);
  indexRecord(record, projectId, workspaceId);
  return record;
}

export function getCompletionTruthByAuthorityId(authorityId: string): CompletionTruthRecord | undefined {
  return byAuthorityId.get(authorityId);
}

export function getCompletionTruthRecord(recordId: string): CompletionTruthRecord | undefined {
  return byAuthorityId.get(recordId);
}

export function lookupCompletionTruthByProjectId(projectId: string): CompletionTruthRecord[] {
  const ids = byProjectId.get(projectId);
  if (!ids) return [];
  return [...ids].map((id) => byAuthorityId.get(id)!).filter(Boolean);
}

export function lookupCompletionTruthByWorkspaceId(workspaceId: string): CompletionTruthRecord[] {
  const ids = byWorkspaceId.get(workspaceId);
  if (!ids) return [];
  return [...ids].map((id) => byAuthorityId.get(id)!).filter(Boolean);
}

export function lookupCompletionTruthByStatus(status: CompletionTruthState): CompletionTruthRecord[] {
  const ids = byStatus.get(status);
  if (!ids) return [];
  return [...ids].map((id) => byAuthorityId.get(id)!).filter(Boolean);
}

export function listCompletionTruthRecords(): CompletionTruthRecord[] {
  const seen = new Set<string>();
  const result: CompletionTruthRecord[] = [];
  for (const record of byAuthorityId.values()) {
    if (seen.has(record.recordId)) continue;
    seen.add(record.recordId);
    result.push(record);
  }
  return result;
}

export function getCompletionTruthRecordCount(): number {
  return listCompletionTruthRecords().length;
}

export function nextAuthorityId(): string {
  authorityCounter += 1;
  return `completion-truth-authority-${authorityCounter}`;
}

export function resetCompletionTruthRegistryForTests(): void {
  byAuthorityId.clear();
  byProjectId.clear();
  byWorkspaceId.clear();
  byStatus.clear();
  authorityCounter = 0;
}
