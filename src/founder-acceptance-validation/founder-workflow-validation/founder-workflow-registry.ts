/**
 * Founder Workflow Validation — bounded record registry.
 */

import type { FounderWorkflowRecord, FounderWorkflowResult } from './founder-workflow-types.js';

const recordsById = new Map<string, FounderWorkflowRecord>();
const recordsByProject = new Map<string, Set<string>>();
const recordsByWorkspace = new Map<string, Set<string>>();
const recordsByResult = new Map<FounderWorkflowResult, Set<string>>();

function addToIndex(map: Map<string, Set<string>>, key: string, id: string): void {
  const set = map.get(key) ?? new Set<string>();
  set.add(id);
  map.set(key, set);
}

export function registerFounderWorkflowRecord(record: FounderWorkflowRecord): void {
  recordsById.set(record.founderWorkflowId, record);
  addToIndex(recordsByProject, record.projectId, record.founderWorkflowId);
  addToIndex(recordsByWorkspace, record.workspaceId, record.founderWorkflowId);
  addToIndex(recordsByResult, record.founderWorkflowResult, record.founderWorkflowId);
}

export function getFounderWorkflowRecord(founderWorkflowId: string): FounderWorkflowRecord | undefined {
  return recordsById.get(founderWorkflowId);
}

export function lookupFounderWorkflowByProjectId(projectId: string): FounderWorkflowRecord[] {
  const ids = recordsByProject.get(projectId);
  if (!ids) return [];
  return [...ids].map((id) => recordsById.get(id)).filter((r): r is FounderWorkflowRecord => r !== undefined);
}

export function listFounderWorkflowRecords(): FounderWorkflowRecord[] {
  return [...recordsById.values()];
}

export function getFounderWorkflowRecordCount(): number {
  return recordsById.size;
}

export function resetFounderWorkflowRegistryForTests(): void {
  recordsById.clear();
  recordsByProject.clear();
  recordsByWorkspace.clear();
  recordsByResult.clear();
}
