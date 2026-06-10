/**
 * Visual QA Engine — bounded record registry.
 */

import type { VisualQARecord, VisualQAResult } from './visual-qa-types.js';

const recordsById = new Map<string, VisualQARecord>();
const recordsByProject = new Map<string, Set<string>>();
const recordsByWorkspace = new Map<string, Set<string>>();
const recordsByResult = new Map<VisualQAResult, Set<string>>();

function addToIndex(map: Map<string, Set<string>>, key: string, id: string): void {
  const set = map.get(key) ?? new Set<string>();
  set.add(id);
  map.set(key, set);
}

export function registerVisualQARecord(record: VisualQARecord): void {
  recordsById.set(record.visualQaId, record);
  addToIndex(recordsByProject, record.projectId, record.visualQaId);
  addToIndex(recordsByWorkspace, record.workspaceId, record.visualQaId);
  addToIndex(recordsByResult, record.visualQaResult, record.visualQaId);
}

export function getVisualQARecord(visualQaId: string): VisualQARecord | undefined {
  return recordsById.get(visualQaId);
}

export function lookupVisualQAByProjectId(projectId: string): VisualQARecord[] {
  const ids = recordsByProject.get(projectId);
  if (!ids) return [];
  return [...ids].map((id) => recordsById.get(id)).filter((r): r is VisualQARecord => r !== undefined);
}

export function lookupVisualQAByWorkspaceId(workspaceId: string): VisualQARecord[] {
  const ids = recordsByWorkspace.get(workspaceId);
  if (!ids) return [];
  return [...ids].map((id) => recordsById.get(id)).filter((r): r is VisualQARecord => r !== undefined);
}

export function lookupVisualQAByResult(result: VisualQAResult): VisualQARecord[] {
  const ids = recordsByResult.get(result);
  if (!ids) return [];
  return [...ids].map((id) => recordsById.get(id)).filter((r): r is VisualQARecord => r !== undefined);
}

export function listVisualQARecords(): VisualQARecord[] {
  return [...recordsById.values()];
}

export function getVisualQARecordCount(): number {
  return recordsById.size;
}

export function resetVisualQARegistryForTests(): void {
  recordsById.clear();
  recordsByProject.clear();
  recordsByWorkspace.clear();
  recordsByResult.clear();
}
