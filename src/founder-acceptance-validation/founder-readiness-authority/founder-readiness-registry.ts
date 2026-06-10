/**
 * Founder Readiness Authority — bounded record registry.
 */

import type { FounderReadinessRecord, FounderReadinessResult } from './founder-readiness-types.js';

const recordsById = new Map<string, FounderReadinessRecord>();
const recordsByProject = new Map<string, Set<string>>();
const recordsByWorkspace = new Map<string, Set<string>>();
const recordsByResult = new Map<FounderReadinessResult, Set<string>>();

function addToIndex(map: Map<string, Set<string>>, key: string, id: string): void {
  const set = map.get(key) ?? new Set<string>();
  set.add(id);
  map.set(key, set);
}

export function registerFounderReadinessRecord(record: FounderReadinessRecord): void {
  recordsById.set(record.founderReadinessId, record);
  addToIndex(recordsByProject, record.projectId, record.founderReadinessId);
  addToIndex(recordsByWorkspace, record.workspaceId, record.founderReadinessId);
  addToIndex(recordsByResult, record.founderReadinessResult, record.founderReadinessId);
}

export function getFounderReadinessRecord(founderReadinessId: string): FounderReadinessRecord | undefined {
  return recordsById.get(founderReadinessId);
}

export function lookupFounderReadinessByProjectId(projectId: string): FounderReadinessRecord[] {
  const ids = recordsByProject.get(projectId);
  if (!ids) return [];
  return [...ids].map((id) => recordsById.get(id)).filter((r): r is FounderReadinessRecord => r !== undefined);
}

export function listFounderReadinessRecords(): FounderReadinessRecord[] {
  return [...recordsById.values()];
}

export function getFounderReadinessRecordCount(): number {
  return recordsById.size;
}

export function resetFounderReadinessRegistryForTests(): void {
  recordsById.clear();
  recordsByProject.clear();
  recordsByWorkspace.clear();
  recordsByResult.clear();
}
