/**
 * Founder Confidence Engine — bounded record registry.
 */

import type { FounderConfidenceRecord, FounderConfidenceResult } from './founder-confidence-types.js';

const recordsById = new Map<string, FounderConfidenceRecord>();
const recordsByProject = new Map<string, Set<string>>();
const recordsByWorkspace = new Map<string, Set<string>>();
const recordsByResult = new Map<FounderConfidenceResult, Set<string>>();

function addToIndex(map: Map<string, Set<string>>, key: string, id: string): void {
  const set = map.get(key) ?? new Set<string>();
  set.add(id);
  map.set(key, set);
}

export function registerFounderConfidenceRecord(record: FounderConfidenceRecord): void {
  recordsById.set(record.founderConfidenceId, record);
  addToIndex(recordsByProject, record.projectId, record.founderConfidenceId);
  addToIndex(recordsByWorkspace, record.workspaceId, record.founderConfidenceId);
  addToIndex(recordsByResult, record.founderConfidenceResult, record.founderConfidenceId);
}

export function getFounderConfidenceRecord(founderConfidenceId: string): FounderConfidenceRecord | undefined {
  return recordsById.get(founderConfidenceId);
}

export function lookupFounderConfidenceByProjectId(projectId: string): FounderConfidenceRecord[] {
  const ids = recordsByProject.get(projectId);
  if (!ids) return [];
  return [...ids].map((id) => recordsById.get(id)).filter((r): r is FounderConfidenceRecord => r !== undefined);
}

export function listFounderConfidenceRecords(): FounderConfidenceRecord[] {
  return [...recordsById.values()];
}

export function getFounderConfidenceRecordCount(): number {
  return recordsById.size;
}

export function resetFounderConfidenceRegistryForTests(): void {
  recordsById.clear();
  recordsByProject.clear();
  recordsByWorkspace.clear();
  recordsByResult.clear();
}
