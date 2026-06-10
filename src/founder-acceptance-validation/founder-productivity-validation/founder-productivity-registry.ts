/**
 * Founder Productivity Validation — bounded record registry.
 */

import type { FounderProductivityRecord, FounderProductivityResult } from './founder-productivity-types.js';

const recordsById = new Map<string, FounderProductivityRecord>();
const recordsByProject = new Map<string, Set<string>>();
const recordsByWorkspace = new Map<string, Set<string>>();
const recordsByResult = new Map<FounderProductivityResult, Set<string>>();

function addToIndex(map: Map<string, Set<string>>, key: string, id: string): void {
  const set = map.get(key) ?? new Set<string>();
  set.add(id);
  map.set(key, set);
}

export function registerFounderProductivityRecord(record: FounderProductivityRecord): void {
  recordsById.set(record.founderProductivityId, record);
  addToIndex(recordsByProject, record.projectId, record.founderProductivityId);
  addToIndex(recordsByWorkspace, record.workspaceId, record.founderProductivityId);
  addToIndex(recordsByResult, record.founderProductivityResult, record.founderProductivityId);
}

export function getFounderProductivityRecord(founderProductivityId: string): FounderProductivityRecord | undefined {
  return recordsById.get(founderProductivityId);
}

export function lookupFounderProductivityByProjectId(projectId: string): FounderProductivityRecord[] {
  const ids = recordsByProject.get(projectId);
  if (!ids) return [];
  return [...ids].map((id) => recordsById.get(id)).filter((r): r is FounderProductivityRecord => r !== undefined);
}

export function listFounderProductivityRecords(): FounderProductivityRecord[] {
  return [...recordsById.values()];
}

export function getFounderProductivityRecordCount(): number {
  return recordsById.size;
}

export function resetFounderProductivityRegistryForTests(): void {
  recordsById.clear();
  recordsByProject.clear();
  recordsByWorkspace.clear();
  recordsByResult.clear();
}
