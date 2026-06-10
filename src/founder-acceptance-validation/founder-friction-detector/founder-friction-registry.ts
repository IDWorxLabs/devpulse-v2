/**
 * Founder Friction Detector — bounded record registry.
 */

import type { FounderFrictionRecord, FounderFrictionResult } from './founder-friction-types.js';

const recordsById = new Map<string, FounderFrictionRecord>();
const recordsByProject = new Map<string, Set<string>>();
const recordsByWorkspace = new Map<string, Set<string>>();
const recordsByResult = new Map<FounderFrictionResult, Set<string>>();

function addToIndex(map: Map<string, Set<string>>, key: string, id: string): void {
  const set = map.get(key) ?? new Set<string>();
  set.add(id);
  map.set(key, set);
}

export function registerFounderFrictionRecord(record: FounderFrictionRecord): void {
  recordsById.set(record.founderFrictionId, record);
  addToIndex(recordsByProject, record.projectId, record.founderFrictionId);
  addToIndex(recordsByWorkspace, record.workspaceId, record.founderFrictionId);
  addToIndex(recordsByResult, record.founderFrictionResult, record.founderFrictionId);
}

export function getFounderFrictionRecord(founderFrictionId: string): FounderFrictionRecord | undefined {
  return recordsById.get(founderFrictionId);
}

export function lookupFounderFrictionByProjectId(projectId: string): FounderFrictionRecord[] {
  const ids = recordsByProject.get(projectId);
  if (!ids) return [];
  return [...ids].map((id) => recordsById.get(id)).filter((r): r is FounderFrictionRecord => r !== undefined);
}

export function listFounderFrictionRecords(): FounderFrictionRecord[] {
  return [...recordsById.values()];
}

export function getFounderFrictionRecordCount(): number {
  return recordsById.size;
}

export function resetFounderFrictionRegistryForTests(): void {
  recordsById.clear();
  recordsByProject.clear();
  recordsByWorkspace.clear();
  recordsByResult.clear();
}
