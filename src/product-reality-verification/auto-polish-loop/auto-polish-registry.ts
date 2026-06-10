/**
 * Auto-Polish Loop — bounded record registry.
 */

import type { AutoPolishRecord, AutoPolishResult } from './auto-polish-types.js';

const recordsById = new Map<string, AutoPolishRecord>();
const recordsByProject = new Map<string, Set<string>>();
const recordsByWorkspace = new Map<string, Set<string>>();
const recordsByResult = new Map<AutoPolishResult, Set<string>>();

function addToIndex(map: Map<string, Set<string>>, key: string, id: string): void {
  const set = map.get(key) ?? new Set<string>();
  set.add(id);
  map.set(key, set);
}

export function registerAutoPolishRecord(record: AutoPolishRecord): void {
  recordsById.set(record.autoPolishId, record);
  addToIndex(recordsByProject, record.projectId, record.autoPolishId);
  addToIndex(recordsByWorkspace, record.workspaceId, record.autoPolishId);
  addToIndex(recordsByResult, record.autoPolishResult, record.autoPolishId);
}

export function getAutoPolishRecord(autoPolishId: string): AutoPolishRecord | undefined {
  return recordsById.get(autoPolishId);
}

export function lookupAutoPolishByProjectId(projectId: string): AutoPolishRecord[] {
  const ids = recordsByProject.get(projectId);
  if (!ids) return [];
  return [...ids].map((id) => recordsById.get(id)).filter((r): r is AutoPolishRecord => r !== undefined);
}

export function lookupAutoPolishByResult(result: AutoPolishResult): AutoPolishRecord[] {
  const ids = recordsByResult.get(result);
  if (!ids) return [];
  return [...ids].map((id) => recordsById.get(id)).filter((r): r is AutoPolishRecord => r !== undefined);
}

export function listAutoPolishRecords(): AutoPolishRecord[] {
  return [...recordsById.values()];
}

export function getAutoPolishRecordCount(): number {
  return recordsById.size;
}

export function resetAutoPolishRegistryForTests(): void {
  recordsById.clear();
  recordsByProject.clear();
  recordsByWorkspace.clear();
  recordsByResult.clear();
}
