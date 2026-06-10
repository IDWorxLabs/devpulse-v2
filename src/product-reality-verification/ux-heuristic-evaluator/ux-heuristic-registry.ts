/**
 * UX Heuristic Evaluator — bounded record registry.
 */

import type { UXHeuristicRecord, UXHeuristicResult } from './ux-heuristic-types.js';

const recordsById = new Map<string, UXHeuristicRecord>();
const recordsByProject = new Map<string, Set<string>>();
const recordsByWorkspace = new Map<string, Set<string>>();
const recordsByResult = new Map<UXHeuristicResult, Set<string>>();

function addToIndex(map: Map<string, Set<string>>, key: string, id: string): void {
  const set = map.get(key) ?? new Set<string>();
  set.add(id);
  map.set(key, set);
}

export function registerUXHeuristicRecord(record: UXHeuristicRecord): void {
  recordsById.set(record.uxHeuristicId, record);
  addToIndex(recordsByProject, record.projectId, record.uxHeuristicId);
  addToIndex(recordsByWorkspace, record.workspaceId, record.uxHeuristicId);
  addToIndex(recordsByResult, record.uxHeuristicResult, record.uxHeuristicId);
}

export function getUXHeuristicRecord(uxHeuristicId: string): UXHeuristicRecord | undefined {
  return recordsById.get(uxHeuristicId);
}

export function lookupUXHeuristicByProjectId(projectId: string): UXHeuristicRecord[] {
  const ids = recordsByProject.get(projectId);
  if (!ids) return [];
  return [...ids].map((id) => recordsById.get(id)).filter((r): r is UXHeuristicRecord => r !== undefined);
}

export function lookupUXHeuristicByWorkspaceId(workspaceId: string): UXHeuristicRecord[] {
  const ids = recordsByWorkspace.get(workspaceId);
  if (!ids) return [];
  return [...ids].map((id) => recordsById.get(id)).filter((r): r is UXHeuristicRecord => r !== undefined);
}

export function lookupUXHeuristicByResult(result: UXHeuristicResult): UXHeuristicRecord[] {
  const ids = recordsByResult.get(result);
  if (!ids) return [];
  return [...ids].map((id) => recordsById.get(id)).filter((r): r is UXHeuristicRecord => r !== undefined);
}

export function listUXHeuristicRecords(): UXHeuristicRecord[] {
  return [...recordsById.values()];
}

export function getUXHeuristicRecordCount(): number {
  return recordsById.size;
}

export function resetUXHeuristicRegistryForTests(): void {
  recordsById.clear();
  recordsByProject.clear();
  recordsByWorkspace.clear();
  recordsByResult.clear();
}
