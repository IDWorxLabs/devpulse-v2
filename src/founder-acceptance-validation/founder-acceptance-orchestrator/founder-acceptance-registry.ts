/**
 * Founder Acceptance Orchestrator — bounded record registry.
 */

import type { FounderAcceptanceRecord, FounderAcceptanceResult } from './founder-acceptance-orchestrator-types.js';

const recordsById = new Map<string, FounderAcceptanceRecord>();
const recordsByProject = new Map<string, Set<string>>();
const recordsByWorkspace = new Map<string, Set<string>>();
const recordsByResult = new Map<FounderAcceptanceResult, Set<string>>();

function addToIndex(map: Map<string, Set<string>>, key: string, id: string): void {
  const set = map.get(key) ?? new Set<string>();
  set.add(id);
  map.set(key, set);
}

export function registerFounderAcceptanceRecord(record: FounderAcceptanceRecord): void {
  recordsById.set(record.founderAcceptanceId, record);
  addToIndex(recordsByProject, record.projectId, record.founderAcceptanceId);
  addToIndex(recordsByWorkspace, record.workspaceId, record.founderAcceptanceId);
  addToIndex(recordsByResult, record.founderAcceptanceResult, record.founderAcceptanceId);
}

export function getFounderAcceptanceRecord(founderAcceptanceId: string): FounderAcceptanceRecord | undefined {
  return recordsById.get(founderAcceptanceId);
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
  recordsByResult.clear();
}
