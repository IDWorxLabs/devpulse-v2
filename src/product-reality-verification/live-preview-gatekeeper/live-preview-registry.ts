/**
 * Live Preview Gatekeeper — bounded record registry.
 */

import type { LivePreviewRecord, LivePreviewResult } from './live-preview-types.js';

const recordsById = new Map<string, LivePreviewRecord>();
const recordsByProject = new Map<string, Set<string>>();
const recordsByWorkspace = new Map<string, Set<string>>();
const recordsByResult = new Map<LivePreviewResult, Set<string>>();

function addToIndex(map: Map<string, Set<string>>, key: string, id: string): void {
  const set = map.get(key) ?? new Set<string>();
  set.add(id);
  map.set(key, set);
}

export function registerLivePreviewRecord(record: LivePreviewRecord): void {
  recordsById.set(record.livePreviewId, record);
  addToIndex(recordsByProject, record.projectId, record.livePreviewId);
  addToIndex(recordsByWorkspace, record.workspaceId, record.livePreviewId);
  addToIndex(recordsByResult, record.livePreviewResult, record.livePreviewId);
}

export function getLivePreviewRecord(livePreviewId: string): LivePreviewRecord | undefined {
  return recordsById.get(livePreviewId);
}

export function lookupLivePreviewByProjectId(projectId: string): LivePreviewRecord[] {
  const ids = recordsByProject.get(projectId);
  if (!ids) return [];
  return [...ids].map((id) => recordsById.get(id)).filter((r): r is LivePreviewRecord => r !== undefined);
}

export function lookupLivePreviewByResult(result: LivePreviewResult): LivePreviewRecord[] {
  const ids = recordsByResult.get(result);
  if (!ids) return [];
  return [...ids].map((id) => recordsById.get(id)).filter((r): r is LivePreviewRecord => r !== undefined);
}

export function listLivePreviewRecords(): LivePreviewRecord[] {
  return [...recordsById.values()];
}

export function getLivePreviewRecordCount(): number {
  return recordsById.size;
}

export function resetLivePreviewRegistryForTests(): void {
  recordsById.clear();
  recordsByProject.clear();
  recordsByWorkspace.clear();
  recordsByResult.clear();
}
