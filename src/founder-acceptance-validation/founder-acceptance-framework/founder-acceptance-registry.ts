/**
 * Founder Acceptance Framework — bounded record registry.
 */

import type { FounderAcceptanceRecord, FrameworkCompleteness } from './founder-acceptance-types.js';

const recordsById = new Map<string, FounderAcceptanceRecord>();
const recordsByProject = new Map<string, Set<string>>();
const recordsByWorkspace = new Map<string, Set<string>>();
const recordsByCompleteness = new Map<FrameworkCompleteness, Set<string>>();

function addToIndex(map: Map<string, Set<string>>, key: string, id: string): void {
  const set = map.get(key) ?? new Set<string>();
  set.add(id);
  map.set(key, set);
}

export function registerFounderAcceptanceRecord(record: FounderAcceptanceRecord): void {
  recordsById.set(record.recordId, record);
  addToIndex(recordsByProject, record.projectId, record.recordId);
  addToIndex(recordsByWorkspace, record.workspaceId, record.recordId);
  addToIndex(recordsByCompleteness, record.frameworkCompleteness, record.recordId);
}

export function getFounderAcceptanceRecord(recordId: string): FounderAcceptanceRecord | undefined {
  return recordsById.get(recordId);
}

export function lookupFounderAcceptanceByProjectId(projectId: string): FounderAcceptanceRecord[] {
  const ids = recordsByProject.get(projectId);
  if (!ids) return [];
  return [...ids].map((id) => recordsById.get(id)).filter((r): r is FounderAcceptanceRecord => r !== undefined);
}

export function listFounderAcceptanceRecords(): FounderAcceptanceRecord[] {
  return [...recordsById.values()];
}

export function getFounderAcceptanceRecordCount(): number {
  return recordsById.size;
}

export function resetFounderAcceptanceRegistryForTests(): void {
  recordsById.clear();
  recordsByProject.clear();
  recordsByWorkspace.clear();
  recordsByCompleteness.clear();
}
