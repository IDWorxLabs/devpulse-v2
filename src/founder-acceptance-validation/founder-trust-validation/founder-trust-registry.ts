/**
 * Founder Trust Validation — bounded record registry.
 */

import type { FounderTrustRecord, FounderTrustResult } from './founder-trust-types.js';

const recordsById = new Map<string, FounderTrustRecord>();
const recordsByProject = new Map<string, Set<string>>();
const recordsByWorkspace = new Map<string, Set<string>>();
const recordsByResult = new Map<FounderTrustResult, Set<string>>();

function addToIndex(map: Map<string, Set<string>>, key: string, id: string): void {
  const set = map.get(key) ?? new Set<string>();
  set.add(id);
  map.set(key, set);
}

export function registerFounderTrustRecord(record: FounderTrustRecord): void {
  recordsById.set(record.founderTrustId, record);
  addToIndex(recordsByProject, record.projectId, record.founderTrustId);
  addToIndex(recordsByWorkspace, record.workspaceId, record.founderTrustId);
  addToIndex(recordsByResult, record.founderTrustResult, record.founderTrustId);
}

export function getFounderTrustRecord(founderTrustId: string): FounderTrustRecord | undefined {
  return recordsById.get(founderTrustId);
}

export function lookupFounderTrustByProjectId(projectId: string): FounderTrustRecord[] {
  const ids = recordsByProject.get(projectId);
  if (!ids) return [];
  return [...ids].map((id) => recordsById.get(id)).filter((r): r is FounderTrustRecord => r !== undefined);
}

export function listFounderTrustRecords(): FounderTrustRecord[] {
  return [...recordsById.values()];
}

export function getFounderTrustRecordCount(): number {
  return recordsById.size;
}

export function resetFounderTrustRegistryForTests(): void {
  recordsById.clear();
  recordsByProject.clear();
  recordsByWorkspace.clear();
  recordsByResult.clear();
}
