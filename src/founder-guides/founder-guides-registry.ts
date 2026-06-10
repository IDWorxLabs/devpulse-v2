/**
 * Founder Guides — registry.
 */

import type {
  FounderGuideCompletenessLevel,
  FounderGuideRecord,
  FounderGuideState,
} from './founder-guides-types.js';

const byGuideId = new Map<string, FounderGuideRecord>();
const byProjectId = new Map<string, Set<string>>();
const byWorkspaceId = new Map<string, Set<string>>();
const byCompletenessLevel = new Map<FounderGuideCompletenessLevel, Set<string>>();
const byState = new Map<FounderGuideState, Set<string>>();

function indexRecord(record: FounderGuideRecord): void {
  const add = (map: Map<string, Set<string>>, key: string) => {
    if (!map.has(key)) map.set(key, new Set());
    map.get(key)!.add(record.guideId);
  };
  add(byProjectId, record.projectId);
  add(byWorkspaceId, record.workspaceId);
  if (!byCompletenessLevel.has(record.completenessLevel)) {
    byCompletenessLevel.set(record.completenessLevel, new Set());
  }
  byCompletenessLevel.get(record.completenessLevel)!.add(record.guideId);
  if (!byState.has(record.state)) byState.set(record.state, new Set());
  byState.get(record.state)!.add(record.guideId);
}

export function registerFounderGuideRecord(record: FounderGuideRecord): FounderGuideRecord {
  byGuideId.set(record.guideId, record);
  indexRecord(record);
  return record;
}

export function getFounderGuideRecord(guideId: string): FounderGuideRecord | undefined {
  return byGuideId.get(guideId);
}

export function lookupGuideByProjectId(projectId: string): FounderGuideRecord[] {
  const ids = byProjectId.get(projectId);
  if (!ids) return [];
  return [...ids].map((id) => byGuideId.get(id)!).filter(Boolean);
}

export function lookupGuideByWorkspaceId(workspaceId: string): FounderGuideRecord[] {
  const ids = byWorkspaceId.get(workspaceId);
  if (!ids) return [];
  return [...ids].map((id) => byGuideId.get(id)!).filter(Boolean);
}

export function lookupGuideByCompletenessLevel(
  level: FounderGuideCompletenessLevel,
): FounderGuideRecord[] {
  const ids = byCompletenessLevel.get(level);
  if (!ids) return [];
  return [...ids].map((id) => byGuideId.get(id)!).filter(Boolean);
}

export function lookupGuideByState(state: FounderGuideState): FounderGuideRecord[] {
  const ids = byState.get(state);
  if (!ids) return [];
  return [...ids].map((id) => byGuideId.get(id)!).filter(Boolean);
}

export function listFounderGuideRecords(): FounderGuideRecord[] {
  return [...byGuideId.values()];
}

export function getFounderGuideRecordCount(): number {
  return byGuideId.size;
}

export function resetFounderGuidesRegistryForTests(): void {
  byGuideId.clear();
  byProjectId.clear();
  byWorkspaceId.clear();
  byCompletenessLevel.clear();
  byState.clear();
}
