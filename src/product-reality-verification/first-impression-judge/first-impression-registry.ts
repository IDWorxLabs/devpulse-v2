/**
 * First-Impression Judge — bounded record registry.
 */

import type { FirstImpressionRecord, FirstImpressionResult } from './first-impression-types.js';

const recordsById = new Map<string, FirstImpressionRecord>();
const recordsByProject = new Map<string, Set<string>>();
const recordsByWorkspace = new Map<string, Set<string>>();
const recordsByResult = new Map<FirstImpressionResult, Set<string>>();

function addToIndex(map: Map<string, Set<string>>, key: string, id: string): void {
  const set = map.get(key) ?? new Set<string>();
  set.add(id);
  map.set(key, set);
}

export function registerFirstImpressionRecord(record: FirstImpressionRecord): void {
  recordsById.set(record.firstImpressionId, record);
  addToIndex(recordsByProject, record.projectId, record.firstImpressionId);
  addToIndex(recordsByWorkspace, record.workspaceId, record.firstImpressionId);
  addToIndex(recordsByResult, record.firstImpressionResult, record.firstImpressionId);
}

export function getFirstImpressionRecord(firstImpressionId: string): FirstImpressionRecord | undefined {
  return recordsById.get(firstImpressionId);
}

export function lookupFirstImpressionByProjectId(projectId: string): FirstImpressionRecord[] {
  const ids = recordsByProject.get(projectId);
  if (!ids) return [];
  return [...ids].map((id) => recordsById.get(id)).filter((r): r is FirstImpressionRecord => r !== undefined);
}

export function lookupFirstImpressionByResult(result: FirstImpressionResult): FirstImpressionRecord[] {
  const ids = recordsByResult.get(result);
  if (!ids) return [];
  return [...ids].map((id) => recordsById.get(id)).filter((r): r is FirstImpressionRecord => r !== undefined);
}

export function listFirstImpressionRecords(): FirstImpressionRecord[] {
  return [...recordsById.values()];
}

export function getFirstImpressionRecordCount(): number {
  return recordsById.size;
}

export function resetFirstImpressionRegistryForTests(): void {
  recordsById.clear();
  recordsByProject.clear();
  recordsByWorkspace.clear();
  recordsByResult.clear();
}
